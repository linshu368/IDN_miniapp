'use client';

import { Gift, Sparkles, UserPlus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MARKET_UNAVAILABLE_ACTIONS,
  MARKET_UNAVAILABLE_COPY,
  type MarketUnavailableKind,
} from '@/lib/market-copy';

export function InsufficientCreditsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const copy = MARKET_UNAVAILABLE_COPY.insufficientCredits;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-border bg-popover text-popover-foreground">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="pt-1 leading-6 text-muted-foreground">
            {copy.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button asChild className="w-full rounded-xl font-bold">
            <Link href="/profile" onClick={() => onOpenChange(false)}>
              <Gift className="h-4 w-4" aria-hidden />
              {MARKET_UNAVAILABLE_ACTIONS.checkin}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl font-bold">
            <Link href="/profile/invite" onClick={() => onOpenChange(false)}>
              <UserPlus className="h-4 w-4" aria-hidden />
              {MARKET_UNAVAILABLE_ACTIONS.invite}
            </Link>
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">
              {MARKET_UNAVAILABLE_ACTIONS.close}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FeatureUnavailableDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: Extract<MarketUnavailableKind, 'voice'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const copy = MARKET_UNAVAILABLE_COPY[kind];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-border bg-popover text-popover-foreground">
        <DialogHeader className="items-center text-center">
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="pt-1 leading-6 text-muted-foreground">
            {copy.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-full rounded-xl font-bold">
              {MARKET_UNAVAILABLE_ACTIONS.close}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
