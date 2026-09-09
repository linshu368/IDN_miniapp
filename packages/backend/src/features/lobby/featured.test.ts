import { LOBBY_FEATURED_POSITION_COUNT } from '@miniapp/shared';
import { describe, expect, it } from 'vitest';
import { isLobbyFeatured, resolveLobbyFeaturedIds } from './featured.js';

describe('isLobbyFeatured', () => {
  it('sort_order 0–7 打金框，其余不打', () => {
    expect(isLobbyFeatured(0)).toBe(true);
    expect(isLobbyFeatured(7)).toBe(true);
    expect(isLobbyFeatured(8)).toBe(false);
    expect(isLobbyFeatured(-1)).toBe(false);
  });
});

describe('resolveLobbyFeaturedIds', () => {
  it('只收 sort_order 落在 0–7 的卡', () => {
    const featured = resolveLobbyFeaturedIds([
      { id: 'a', sort_order: 0 },
      { id: 'b', sort_order: 7 },
      { id: 'c', sort_order: 8 },
      { id: 'd', sort_order: 3 },
    ]);

    expect(featured).toEqual(new Set(['a', 'b', 'd']));
  });

  it('默认名额与大厅金框位数一致', () => {
    const featured = resolveLobbyFeaturedIds(
      Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, sort_order: i }))
    );

    expect(featured.size).toBe(LOBBY_FEATURED_POSITION_COUNT);
    expect(featured.has('c0')).toBe(true);
    expect(featured.has('c7')).toBe(true);
    expect(featured.has('c8')).toBe(false);
  });
});
