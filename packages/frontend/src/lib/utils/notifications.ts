import type { SupportMessage } from '@miniapp/shared';

import { pad2, zonedCalendarKey, zonedDateParts } from '@/lib/locale';

export function formatMessageTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = zonedDateParts(date);
  const clock = `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  const todayKey = zonedCalendarKey(now);
  const dateKey = zonedCalendarKey(date);
  const nowParts = zonedDateParts(now);

  if (dateKey === todayKey) return `Hari ini ${clock}`;

  const yesterdayKey = zonedCalendarKey(new Date(now.getTime() - 86_400_000));
  if (dateKey === yesterdayKey) return `Kemarin ${clock}`;

  if (parts.year === nowParts.year) {
    return `${pad2(parts.day)}/${pad2(parts.month)} ${clock}`;
  }
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export interface PendingSupportMessage {
  clientMsgId: string;
  body: string;
  status: 'sending' | 'failed';
}

/**
 * 服务端确认后同一条消息会同时存在于会话历史和本地待发列表里，
 * 按 client_msg_id 丢掉已确认的，避免气泡重复。
 */
export function pendingOutbox(
  pending: PendingSupportMessage[],
  confirmed: SupportMessage[]
): PendingSupportMessage[] {
  const confirmedIds = new Set(
    confirmed.map((message) => message.client_msg_id).filter((id): id is string => Boolean(id))
  );
  return pending.filter((item) => !confirmedIds.has(item.clientMsgId));
}
