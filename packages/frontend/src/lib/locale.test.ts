import { describe, expect, it } from 'vitest';

import { DISPLAY_NAME_MAX_LENGTH } from '@miniapp/shared';

import { truncateDisplayName, zonedDateParts } from './locale';

describe('truncateDisplayName', () => {
  it(`keeps names up to ${DISPLAY_NAME_MAX_LENGTH} graphemes`, () => {
    expect(truncateDisplayName('PribadiAI Lobby')).toBe('PribadiAI Lobby');
  });

  it('adds an ellipsis after 16 graphemes', () => {
    expect(truncateDisplayName('abcdefghijklmnopqrstuvwxyz')).toBe(
      'abcdefghijklmnopqrstuvwxyz'.slice(0, 16) + '…'
    );
  });

  it('counts emoji as one grapheme cluster unit via Array.from', () => {
    expect(truncateDisplayName('😀abcdefghijklmno')).toBe('😀abcdefghijklmno');
    expect(truncateDisplayName('😀abcdefghijklmnop')).toBe('😀abcdefghijklmno…');
  });
});

describe('zonedDateParts', () => {
  it('reads wall clock in Asia/Jakarta (UTC+7)', () => {
    const parts = zonedDateParts(new Date('2026-07-28T13:00:00.000Z'));
    expect(parts).toMatchObject({
      year: 2026,
      month: 7,
      day: 28,
      hour: 20,
      minute: 0,
    });
  });
});
