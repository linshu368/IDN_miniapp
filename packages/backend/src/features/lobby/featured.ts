/**
 * backend / features / lobby / featured.ts
 *
 * 金框（is_featured）判定的唯一出口。
 *
 * 印尼大厅推荐页按 characters.sort_order 静态排列，不再走 v3 排序分或运营固定位。
 * sort_order 为 0–7 的在架卡打金框；大厅列表、角色详情、收藏列表都调这里，
 * 避免出现「列表有金框、点进详情没有」的错位。
 */

import { LOBBY_FEATURED_POSITION_COUNT } from '@miniapp/shared';

export function isLobbyFeatured(sortOrder: number, count = LOBBY_FEATURED_POSITION_COUNT): boolean {
  return sortOrder >= 0 && sortOrder < count;
}

export function resolveLobbyFeaturedIds<T extends { id: string; sort_order: number }>(
  characters: readonly T[],
  count = LOBBY_FEATURED_POSITION_COUNT
): Set<string> {
  return new Set(
    characters
      .filter((character) => isLobbyFeatured(character.sort_order, count))
      .map((character) => character.id)
  );
}
