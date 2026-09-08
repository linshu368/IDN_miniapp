import { describe, expect, it } from 'vitest';
import { formatFreeQuotaExhaustedNotice, truncateCharacterName } from './free-quota-dialog';

describe('free quota exhausted notice copy', () => {
  it('keeps character names up to 16 characters', () => {
    expect(truncateCharacterName('Karakter Pendek')).toBe('Karakter Pendek');
  });

  it('limits long character names to 16 displayed characters plus ellipsis', () => {
    expect(truncateCharacterName('Nama karakter yang sangat panjang')).toBe('Nama karakter ya…');
  });

  it('uses a safe fallback for missing character names', () => {
    expect(truncateCharacterName('  ')).toBe('Karakter ini');
  });

  it('replaces the character placeholder in runtime copy', () => {
    expect(
      formatFreeQuotaExhaustedNotice(
        {
          text: 'Kuota gratis dengan "{characterName}" sudah habis.',
        },
        'Nama karakter yang sangat panjang'
      )
    ).toBe('Kuota gratis dengan "Nama karakter ya…" sudah habis.');
  });
});
