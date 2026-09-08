import { describe, expect, it } from 'vitest';

import { resolveSessionTitle, SESSION_TITLE_DISPLAY_LENGTH } from './conversations';

describe('resolveSessionTitle', () => {
  it('uses the stored title when present', () => {
    expect(resolveSessionTitle('Ngobrol malam', 'Nama karakter')).toBe('Ngobrol malam');
  });

  it(`truncates every title to ${SESSION_TITLE_DISPLAY_LENGTH} characters plus ellipsis`, () => {
    expect(resolveSessionTitle('Ini judul percakapan yang panjang sekali')).toBe(
      'Ini judul percak…'
    );
    expect(resolveSessionTitle(null, 'Nama karakter yang sangat panjang')).toBe(
      'Nama karakter ya…'
    );
  });

  it('falls back to the character name, then to Obrolan baru', () => {
    expect(resolveSessionTitle(null, 'Luna')).toBe('Luna');
    expect(resolveSessionTitle('  ', '  ')).toBe('Obrolan baru');
    expect(resolveSessionTitle(null)).toBe('Obrolan baru');
  });

  it('counts unicode code points rather than UTF-16 code units', () => {
    expect(resolveSessionTitle('😀abcdefghijklmno')).toBe('😀abcdefghijklmno');
    expect(resolveSessionTitle('😀abcdefghijklmnop')).toBe('😀abcdefghijklmno…');
  });
});
