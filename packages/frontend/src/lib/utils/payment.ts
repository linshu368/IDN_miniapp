import type { PaymentOrderStatus, PaymentPlan, PaymentType } from '@miniapp/shared';

import { DISPLAY_LOCALE, zonedCalendarKey, zonedDateParts } from '@/lib/locale';

/** 分转元，保留 2 位小数（示例：600 → "6.00"） */
export function formatYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** 分转元，整数元时去小数（示例：600 → "6"，2800 → "28"，2850 → "28.50"） */
export function formatYuanShort(cents: number): string {
  if (cents % 100 === 0) return String(Math.floor(cents / 100));
  return (cents / 100).toFixed(2);
}

/** 大数千分位；42800 → "42,800" */
export function formatNumber(n: number): string {
  return n.toLocaleString(DISPLAY_LOCALE);
}

export function paymentTypeLabel(type: PaymentType): string {
  return type === 'alipay' ? 'Alipay' : 'WeChat';
}

export function orderStatusLabel(status: PaymentOrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Menunggu bayar';
    case 'completed':
      return 'Berhasil';
    case 'expired':
      return 'Kedaluwarsa';
    case 'failed':
      return 'Gagal';
  }
}

/** 赠送比例，用于"+N% 赠送"小标；credits_amount 为 0 或 bonus 为 0 时返回 0 */
export function bonusPercent(plan: Pick<PaymentPlan, 'credits_amount' | 'bonus_credits'>): number {
  if (plan.credits_amount <= 0 || plan.bonus_credits <= 0) return 0;
  return Math.round((plan.bonus_credits / plan.credits_amount) * 100);
}

/** 省钱金额（分）；无原价或原价低于现价时返回 0 */
export function savingsCents(
  plan: Pick<PaymentPlan, 'price_cents' | 'original_price_cents'>
): number {
  if (plan.original_price_cents === null) return 0;
  const diff = plan.original_price_cents - plan.price_cents;
  return diff > 0 ? diff : 0;
}

/** 显示总到账数（主积分 + 赠送） */
export function totalCredits(plan: Pick<PaymentPlan, 'credits_amount' | 'bonus_credits'>): number {
  return plan.credits_amount + plan.bonus_credits;
}

/** 仅允许站内回跳地址，避免 returnTo 查询参数形成开放重定向。 */
export function safePaymentReturnTo(value: string | null): string | null {
  if (!value) return null;
  const base = 'https://miniapp.local';
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * 订单按相对时间分组（Hari ini / Kemarin / Bulan ini）；用于流水列表的段落标题。
 * 日历日按 Asia/Jakarta。
 */
export function groupLabelForDate(isoDate: string, now: Date = new Date()): string {
  const d = new Date(isoDate);
  const todayKey = zonedCalendarKey(now);
  const dateKey = zonedCalendarKey(d);
  const nowParts = zonedDateParts(now);
  const dParts = zonedDateParts(d);
  const yesterdayKey = zonedCalendarKey(new Date(now.getTime() - 86_400_000));

  if (dateKey === todayKey) return 'Hari ini';
  if (dateKey === yesterdayKey) return 'Kemarin';
  if (dParts.year === nowParts.year && dParts.month === nowParts.month) return 'Bulan ini';
  return `${dParts.month}/${dParts.year}`;
}

/** 支付中倒计时：剩余秒数 */
export function remainingSeconds(expiresAtIso: string, now: number = Date.now()): number {
  const ms = Date.parse(expiresAtIso) - now;
  return Math.max(0, Math.floor(ms / 1000));
}

/** 秒 → "mm:ss" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
