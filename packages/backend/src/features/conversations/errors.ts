/**
 * backend / features / conversations / errors.ts
 *
 * 业务错误码 → HTTP 状态码的唯一收口（M3b）。
 *
 * M1 的仓库层已经把 migration 070 的 SQLSTATE 翻成了 shared 的 ConversationErrorCode
 * （见 conversation-errors.ts），这里只做最后一跳。八条路由共用一处 switch，
 * 免得「重生成不是最后一轮」在一条路由上是 409、在另一条上是 400。
 */

import type { FastifyReply } from 'fastify';
import { CREDITS_NAME, fail, type ConversationErrorCode } from '@miniapp/shared';
import { ConversationRepositoryError } from '../../infrastructure/repositories/conversation-errors.js';

const HTTP_STATUS: Record<ConversationErrorCode, number> = {
  session_not_found: 404,
  character_not_found: 404,
  // 会话已有一条未收口的 streaming 回复，是状态冲突而不是请求错误
  session_busy: 409,
  insufficient_balance: 402,
  // 同上：只允许对最后一轮重生成，请求本身没毛病，是会话状态不允许
  regenerate_not_allowed: 409,
  upstream_error: 502,
};

const DEFAULT_MESSAGE: Record<ConversationErrorCode, string> = {
  session_not_found: 'Percakapan tidak ditemukan',
  character_not_found: 'Karakter tidak ditemukan',
  session_busy: 'Masih ada balasan yang sedang dibuat. Coba lagi sebentar.',
  insufficient_balance: `${CREDITS_NAME} tidak cukup`,
  regenerate_not_allowed: 'Hanya balasan terakhir yang bisa dibuat ulang',
  upstream_error: 'Layanan generate lagi gangguan. Coba lagi nanti.',
};

export function conversationErrorStatus(code: ConversationErrorCode): number {
  return HTTP_STATUS[code];
}

/**
 * 仓库层业务错误 → HTTP 响应。不是 ConversationRepositoryError 就返回 false，
 * 由调用方按 500 处理——把未知异常吞成 4xx 会让真正的故障看起来像用户操作失误。
 */
export function sendConversationError(reply: FastifyReply, error: unknown): boolean {
  if (!(error instanceof ConversationRepositoryError)) return false;

  const status = conversationErrorStatus(error.code);
  void reply.status(status).send(fail(error.code, DEFAULT_MESSAGE[error.code]));
  return true;
}
