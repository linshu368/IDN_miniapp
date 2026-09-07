'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { InsufficientCreditsDialog } from '@/components/market/market-dialogs';
import { resolveRechargeHrefForInsufficientCredits } from '@/lib/market-features';

export function useInsufficientCreditsNotice(returnTo?: string): {
  handleInsufficientCredits: (creditsRequired?: number) => void;
  insufficientCreditsDialog: ReactNode;
} {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleInsufficientCredits = useCallback(
    (creditsRequired?: number) => {
      const href = resolveRechargeHrefForInsufficientCredits({ returnTo, creditsRequired });
      if (href) {
        router.push(href);
        return;
      }
      setOpen(true);
    },
    [returnTo, router]
  );

  return {
    handleInsufficientCredits,
    insufficientCreditsDialog: <InsufficientCreditsDialog open={open} onOpenChange={setOpen} />,
  };
}
