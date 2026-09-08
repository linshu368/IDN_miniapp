import { DISPLAY_NAME_MAX_LENGTH, type FreeQuotaExhaustedDialogConfig } from '@miniapp/shared';

import { truncateDisplayName } from '@/lib/locale';

const CHARACTER_NAME_PLACEHOLDER = '{characterName}';
const FALLBACK_CHARACTER_NAME = 'Karakter ini';

export function formatFreeQuotaExhaustedNotice(
  config: FreeQuotaExhaustedDialogConfig,
  characterName: string | null | undefined
): string {
  const displayName = truncateCharacterName(characterName);
  return config.text.replaceAll(CHARACTER_NAME_PLACEHOLDER, displayName);
}

export function truncateCharacterName(characterName: string | null | undefined): string {
  const normalizedName = characterName?.trim() || FALLBACK_CHARACTER_NAME;
  return truncateDisplayName(normalizedName, DISPLAY_NAME_MAX_LENGTH);
}
