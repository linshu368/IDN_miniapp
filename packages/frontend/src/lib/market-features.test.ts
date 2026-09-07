import { describe, expect, it } from 'vitest';

import {
  MARKET_FEATURES,
  isMarketFeatureEnabled,
  resolvePaymentReturnPath,
  resolveRechargeHrefForInsufficientCredits,
  shouldHideBottomNavForMarketFlows,
} from './market-features';

const ENABLED = { payment: true, wishes: true, voice: true } as const;
const DISABLED = { payment: false, wishes: false, voice: false } as const;

describe('印尼市场本期开关', () => {
  it('支付 / 许愿 / 语音默认关闭', () => {
    expect(MARKET_FEATURES).toEqual(DISABLED);
    expect(isMarketFeatureEnabled('payment')).toBe(false);
    expect(isMarketFeatureEnabled('wishes')).toBe(false);
    expect(isMarketFeatureEnabled('voice')).toBe(false);
  });
});

describe('resolveRechargeHrefForInsufficientCredits', () => {
  it('支付 mock 时不返回真实充值地址', () => {
    expect(
      resolveRechargeHrefForInsufficientCredits({ returnTo: '/chat/c1', creditsRequired: 80 })
    ).toBeNull();
  });

  it('支付开启时拼回原来的充值深链', () => {
    expect(
      resolveRechargeHrefForInsufficientCredits(
        { returnTo: '/chat/c1', creditsRequired: 80 },
        ENABLED
      )
    ).toBe('/profile/recharge?reason=insufficient_credits&returnTo=%2Fchat%2Fc1&required=80');
  });
});

describe('resolvePaymentReturnPath', () => {
  it('支付 mock 时忽略回跳，不恢复支付流程', () => {
    expect(resolvePaymentReturnPath('payment_return')).toBeNull();
    expect(resolvePaymentReturnPath('payment_return_ord_1')).toBeNull();
  });

  it('支付开启时才落到订单或等待页', () => {
    expect(resolvePaymentReturnPath('payment_return', ENABLED)).toBe(
      '/profile/orders?payment=returned'
    );
    expect(resolvePaymentReturnPath('payment_return_ord_1', ENABLED)).toBe(
      '/profile/recharge/ord_1?payment=returned'
    );
    expect(resolvePaymentReturnPath('inv_ABCDEFGH', ENABLED)).toBeNull();
  });
});

describe('shouldHideBottomNavForMarketFlows', () => {
  it('mock 占位页露出底栏', () => {
    expect(shouldHideBottomNavForMarketFlows('/profile/recharge')).toBe(false);
    expect(shouldHideBottomNavForMarketFlows('/create/wish')).toBe(false);
  });

  it('能力开启后深页才藏底栏', () => {
    expect(shouldHideBottomNavForMarketFlows('/profile/recharge', ENABLED)).toBe(true);
    expect(shouldHideBottomNavForMarketFlows('/create/wish', ENABLED)).toBe(true);
    expect(shouldHideBottomNavForMarketFlows('/profile', ENABLED)).toBe(false);
  });
});
