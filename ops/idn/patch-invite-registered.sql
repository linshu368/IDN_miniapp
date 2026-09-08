-- 印尼试水：注册奖励与聊天轮次奖励同时启用。
-- 中文 108 之后 bind_invite 不再发 invitee_registered，且 chat_rounds 把
-- 已发过的 registered 当成「已经发过轮次奖」。这里只改印尼库这两处语义。

CREATE OR REPLACE FUNCTION miniapp_traffic.bind_invite(p_invitee_user_id uuid, p_invite_code text)
RETURNS TABLE(status text, inviter_user_id uuid, relation_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $$
DECLARE
  v_new_user_window CONSTANT INTERVAL := INTERVAL '30 minutes';
  v_inviter UUID;
  v_created TIMESTAMPTZ;
  v_relation_id UUID;
  v_existing_inviter UUID;
  v_existing_id UUID;
BEGIN
  SELECT c.user_id INTO v_inviter
  FROM miniapp_traffic.invite_codes AS c
  WHERE c.code = upper(trim(p_invite_code));

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid_code'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  IF v_inviter = p_invitee_user_id THEN
    RETURN QUERY SELECT 'self_invite'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  SELECT r.inviter_user_id, r.id INTO v_existing_inviter, v_existing_id
  FROM miniapp_traffic.invite_relations AS r
  WHERE r.invitee_user_id = p_invitee_user_id;

  IF FOUND THEN
    RETURN QUERY SELECT 'already_bound'::TEXT, v_existing_inviter, v_existing_id;
    RETURN;
  END IF;

  SELECT u.created_at INTO v_created
  FROM app_core.users AS u
  WHERE u.id = p_invitee_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'bind_invite: 被邀请用户 % 不存在', p_invitee_user_id
      USING ERRCODE = '22023';
  END IF;

  IF v_created < now() - v_new_user_window THEN
    RETURN QUERY SELECT 'not_new_user'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  INSERT INTO miniapp_traffic.invite_relations (
    inviter_user_id, invitee_user_id, invite_code
  ) VALUES (
    v_inviter, p_invitee_user_id, upper(trim(p_invite_code))
  )
  ON CONFLICT (invitee_user_id) DO NOTHING
  RETURNING id INTO v_relation_id;

  IF v_relation_id IS NULL THEN
    SELECT r.inviter_user_id, r.id INTO v_existing_inviter, v_existing_id
    FROM miniapp_traffic.invite_relations AS r
    WHERE r.invitee_user_id = p_invitee_user_id;
    RETURN QUERY SELECT 'already_bound'::TEXT, v_existing_inviter, v_existing_id;
    RETURN;
  END IF;

  PERFORM miniapp_traffic.grant_invite_reward(
    v_relation_id, 'invitee_registered', p_invitee_user_id::text
  );
  PERFORM miniapp_traffic.check_invite_chat_rounds_reward(p_invitee_user_id);

  RETURN QUERY SELECT 'bound'::TEXT, v_inviter, v_relation_id;
END;
$$;

COMMENT ON FUNCTION miniapp_traffic.bind_invite(UUID, TEXT) IS
  '绑定邀请关系；按规则发放 invitee_registered，并补做 invitee_chat_rounds 达标检查。';

CREATE OR REPLACE FUNCTION miniapp_traffic.check_invite_chat_rounds_reward(p_invitee_user_id uuid)
RETURNS TABLE(status text, credits integer, total_round bigint, threshold_rounds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $$
DECLARE
  v_relation miniapp_traffic.invite_relations%ROWTYPE;
  v_cfg JSONB;
  v_rule JSONB;
  v_total_round BIGINT;
  v_threshold INTEGER;
  v_already_granted BOOLEAN;
  v_grant RECORD;
BEGIN
  SELECT r.* INTO v_relation
  FROM miniapp_traffic.invite_relations AS r
  WHERE r.invitee_user_id = p_invitee_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'no_relation'::TEXT, 0, 0::BIGINT, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT COALESCE(u.total_round, 0) INTO v_total_round
  FROM app_core.users AS u
  WHERE u.id = p_invitee_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'check_invite_chat_rounds_reward: 被邀请用户 % 不存在', p_invitee_user_id
      USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM miniapp_traffic.invite_reward_logs AS l
    WHERE l.relation_id = v_relation.id
      AND l.rule_key = 'invitee_chat_rounds'
      AND l.event_ref = p_invitee_user_id::text
  ) INTO v_already_granted;

  IF v_already_granted THEN
    RETURN QUERY SELECT 'duplicated'::TEXT, 0, v_total_round, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT rc.value INTO v_cfg
  FROM app_core.runtime_config AS rc
  WHERE rc.key = 'miniapp_invite_reward_rules';

  SELECT r.rule INTO v_rule
  FROM jsonb_array_elements(COALESCE(v_cfg -> 'rules', '[]'::jsonb)) AS r(rule)
  WHERE r.rule ->> 'rule_key' = 'invitee_chat_rounds';

  IF v_rule IS NULL
     OR COALESCE((v_rule ->> 'enabled')::boolean, FALSE) IS NOT TRUE
     OR COALESCE((v_rule ->> 'credits')::integer, 0) <= 0 THEN
    RETURN QUERY SELECT 'skipped'::TEXT, 0, v_total_round, NULL::INTEGER;
    RETURN;
  END IF;

  v_threshold := COALESCE((v_rule ->> 'threshold_rounds')::integer, 3);

  IF v_total_round < v_threshold THEN
    RETURN QUERY SELECT 'below_threshold'::TEXT, 0, v_total_round, v_threshold;
    RETURN;
  END IF;

  SELECT * INTO v_grant
  FROM miniapp_traffic.grant_invite_reward(
    v_relation.id,
    'invitee_chat_rounds',
    p_invitee_user_id::text
  );

  RETURN QUERY SELECT v_grant.status::TEXT, v_grant.credits::INTEGER, v_total_round, v_threshold;
END;
$$;

COMMENT ON FUNCTION miniapp_traffic.check_invite_chat_rounds_reward(UUID) IS
  '检查被邀请人文本对话轮次是否达到 invitee_chat_rounds.threshold_rounds；与 invitee_registered 互相独立。';
