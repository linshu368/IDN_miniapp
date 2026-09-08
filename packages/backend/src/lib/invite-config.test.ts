import { describe, expect, it } from 'vitest';

import { parseInviteRewardHighlight } from './invite-config.js';

describe('parseInviteRewardHighlight', () => {
  it('reads cap and chat-round threshold from published rules', () => {
    expect(
      parseInviteRewardHighlight({
        total_cap_credits: 400,
        rules: [
          { rule_key: 'invitee_registered', credits: 200, enabled: true },
          {
            rule_key: 'invitee_chat_rounds',
            credits: 200,
            enabled: true,
            threshold_rounds: 3,
          },
        ],
      })
    ).toEqual({ totalCapCredits: 400, chatRoundsThreshold: 3 });
  });

  it('returns nulls when config is missing or invalid', () => {
    expect(parseInviteRewardHighlight(null)).toEqual({
      totalCapCredits: null,
      chatRoundsThreshold: null,
    });
    expect(parseInviteRewardHighlight({ total_cap_credits: 0, rules: [] })).toEqual({
      totalCapCredits: null,
      chatRoundsThreshold: null,
    });
  });
});
