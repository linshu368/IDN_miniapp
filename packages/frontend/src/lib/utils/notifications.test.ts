import { describe, expect, it } from 'vitest';
import type { SupportMessage } from '@miniapp/shared';
import { formatMessageTime, pendingOutbox } from './notifications';

/** 20:00 WIB = 13:00 UTC */
const NOW = new Date('2026-07-28T13:00:00.000Z');

function supportMessage(overrides: Partial<SupportMessage>): SupportMessage {
  return {
    id: 'server-1',
    sender: 'user',
    body: 'Binar belum masuk',
    client_msg_id: null,
    created_at: '2026-07-28T11:02:00.000Z',
    ...overrides,
  };
}

describe('formatMessageTime', () => {
  it('labels same Jakarta calendar day as Hari ini', () => {
    expect(formatMessageTime('2026-07-28T07:20:00.000Z', NOW)).toBe('Hari ini 14:20');
  });

  it('labels previous Jakarta calendar day as Kemarin', () => {
    expect(formatMessageTime('2026-07-27T13:05:00.000Z', NOW)).toBe('Kemarin 20:05');
  });

  it('uses day/month for earlier dates in the same year', () => {
    expect(formatMessageTime('2026-07-25T03:00:00.000Z', NOW)).toBe('25/07 10:00');
    expect(formatMessageTime('2025-12-31T16:30:00.000Z', NOW)).toBe('2025-12-31');
  });
});

describe('pendingOutbox', () => {
  it('服务端确认后不再重复渲染本地气泡', () => {
    const pending = [{ clientMsgId: 'c1', body: 'Halo', status: 'sending' as const }];
    const confirmed = [supportMessage({ client_msg_id: 'c1' })];
    expect(pendingOutbox(pending, confirmed)).toEqual([]);
  });

  it('未确认的失败消息保留下来，用户可以点重试', () => {
    const pending = [
      { clientMsgId: 'c1', body: 'Halo', status: 'sending' as const },
      { clientMsgId: 'c2', body: 'Masih di sini?', status: 'failed' as const },
    ];
    const confirmed = [supportMessage({ client_msg_id: 'c1' })];
    expect(pendingOutbox(pending, confirmed)).toEqual([
      { clientMsgId: 'c2', body: 'Masih di sini?', status: 'failed' },
    ]);
  });

  it('客服侧没有 client_msg_id 的消息不会误伤本地待发', () => {
    const pending = [{ clientMsgId: 'c1', body: 'Halo', status: 'sending' as const }];
    const confirmed = [supportMessage({ sender: 'agent', client_msg_id: null })];
    expect(pendingOutbox(pending, confirmed)).toHaveLength(1);
  });
});
