/**
 * backend / lib / invite-config.ts
 *
 * 邀请入口展示用的规则摘要。发奖仍走 RPC，这里只读 runtime_config。
 */

export interface InviteRewardHighlight {
  totalCapCredits: number | null;
  chatRoundsThreshold: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseInviteRewardHighlight(value: unknown): InviteRewardHighlight {
  if (!isRecord(value)) {
    return { totalCapCredits: null, chatRoundsThreshold: null };
  }

  const cap = value.total_cap_credits;
  const totalCapCredits = typeof cap === 'number' && Number.isInteger(cap) && cap > 0 ? cap : null;

  let chatRoundsThreshold: number | null = null;
  if (Array.isArray(value.rules)) {
    for (const rule of value.rules) {
      if (!isRecord(rule) || rule.rule_key !== 'invitee_chat_rounds') continue;
      const threshold = rule.threshold_rounds;
      if (typeof threshold === 'number' && Number.isInteger(threshold) && threshold > 0) {
        chatRoundsThreshold = threshold;
      } else {
        chatRoundsThreshold = 3;
      }
      break;
    }
  }

  return { totalCapCredits, chatRoundsThreshold };
}
