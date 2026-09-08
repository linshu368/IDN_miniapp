import { describe, expect, it } from 'vitest';

import { CREDITS_NAME } from '@miniapp/shared';

import { formatSpendingStatus } from './MiniappWalletRepository.js';

describe('formatSpendingStatus', () => {
  it('shows the three settlement paths directly', () => {
    expect(formatSpendingStatus('pending', { reply_outcome: 'incomplete' })).toBe(
      'Menunggu settle'
    );
    expect(formatSpendingStatus('charged', { reply_outcome: 'complete' })).toBe('Sudah dipotong');
    expect(formatSpendingStatus('failed', { reply_outcome: 'incomplete' })).toBe(
      `Terpotong, ${CREDITS_NAME} tidak dipotong`
    );
    expect(formatSpendingStatus('failed', { reply_outcome: 'empty' })).toBe(
      `Gagal generate, ${CREDITS_NAME} tidak dipotong`
    );
  });

  it('maps legacy technical metadata to experience-based labels', () => {
    expect(formatSpendingStatus('failed', { finish_reason: 'content_filter' })).toBe(
      `Terpotong, ${CREDITS_NAME} tidak dipotong`
    );
    expect(formatSpendingStatus('failed', { chat_status: 'upstream_error' })).toBe(
      `Gagal generate, ${CREDITS_NAME} tidak dipotong`
    );
  });
});
