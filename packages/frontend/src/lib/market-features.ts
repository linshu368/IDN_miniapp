/**
 * 印尼试水本期明确不做的能力。
 *
 * 关掉入口即可，不要删支付 / 许愿 / 语音引擎。以后加回时把对应开关改回 true。
 * 决策见 docs/印尼版miniapp开发思路.md §2.1、docs/印尼版miniapp开发计划.md 阶段 2。
 */
export type MarketFeatures = {
  payment: boolean;
  wishes: boolean;
  voice: boolean;
};

export const MARKET_FEATURES: MarketFeatures = {
  payment: false,
  wishes: false,
  voice: false,
};

export const MARKET_FEATURE_DISABLED_CODE = 'MARKET_FEATURE_DISABLED';

export function isMarketFeatureEnabled(
  feature: keyof MarketFeatures,
  features: MarketFeatures = MARKET_FEATURES
): boolean {
  return features[feature];
}

/**
 * 支付 / 许愿深页在能力开启时藏底栏；mock 占位页要露出底栏，方便离开。
 * 消息中心、客服页的藏栏逻辑仍由导航组件自己管。
 */
export function shouldHideBottomNavForMarketFlows(
  pathname: string | null,
  features: MarketFeatures = MARKET_FEATURES
): boolean {
  if (!pathname) return false;
  if (features.payment && pathname.startsWith('/profile/recharge')) return true;
  if (features.wishes && pathname.startsWith('/create/wish')) return true;
  return false;
}

export function resolveRechargeHrefForInsufficientCredits(
  params: { returnTo?: string; creditsRequired?: number },
  features: MarketFeatures = MARKET_FEATURES
): string | null {
  if (!features.payment) return null;

  const search = new URLSearchParams({ reason: 'insufficient_credits' });
  if (params.returnTo) search.set('returnTo', params.returnTo);
  if (params.creditsRequired != null) search.set('required', String(params.creditsRequired));
  return `/profile/recharge?${search.toString()}`;
}

const PAYMENT_RETURN_PREFIX = 'payment_return_';

/**
 * 支付回跳深链。无真实订单或支付已 mock 时返回 null，调用方不得再 restore 支付流程。
 */
export function resolvePaymentReturnPath(
  startParam: string,
  features: MarketFeatures = MARKET_FEATURES
): string | null {
  if (!features.payment) return null;
  if (startParam === 'payment_return') return '/profile/orders?payment=returned';
  if (!startParam.startsWith(PAYMENT_RETURN_PREFIX)) return null;

  const orderId = startParam.slice(PAYMENT_RETURN_PREFIX.length);
  if (!orderId || orderId.length > 200 || !/^[A-Za-z0-9_-]+$/.test(orderId)) return null;
  return `/profile/recharge/${encodeURIComponent(orderId)}?payment=returned`;
}
