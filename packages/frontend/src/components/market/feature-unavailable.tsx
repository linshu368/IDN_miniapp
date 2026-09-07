'use client';

import { useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Gift, ImageIcon, Mic, Sparkles, UserPlus, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  MARKET_UNAVAILABLE_ACTIONS,
  MARKET_UNAVAILABLE_COPY,
  type MarketUnavailableKind,
} from '@/lib/market-copy';
import { useTelegramBackButton } from '@/lib/telegram';

const KIND_ICONS: Record<Exclude<MarketUnavailableKind, 'insufficientCredits'>, LucideIcon> = {
  create: Sparkles,
  wish: Sparkles,
  payment: Wallet,
  orders: Wallet,
  voice: Mic,
  image: ImageIcon,
};

export function FeatureUnavailablePanel({
  kind,
}: {
  kind: Exclude<MarketUnavailableKind, 'insufficientCredits'>;
}) {
  const copy = MARKET_UNAVAILABLE_COPY[kind];
  const Icon = KIND_ICONS[kind];

  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-[13px] font-semibold text-foreground">{copy.title}</p>
      <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{copy.body}</p>
    </div>
  );
}

export function FeatureUnavailablePage({
  kind,
  backHref,
  showCreditActions = false,
}: {
  kind: Exclude<MarketUnavailableKind, 'insufficientCredits'>;
  backHref?: string;
  showCreditActions?: boolean;
}) {
  if (backHref) {
    return (
      <FeatureUnavailableSubpage
        kind={kind}
        backHref={backHref}
        showCreditActions={showCreditActions}
      />
    );
  }

  return (
    <UnavailableShell
      kind={kind}
      showCreditActions={showCreditActions}
      header={<UnavailableHeader kind={kind} />}
    />
  );
}

function FeatureUnavailableSubpage({
  kind,
  backHref,
  showCreditActions,
}: {
  kind: Exclude<MarketUnavailableKind, 'insufficientCredits'>;
  backHref: string;
  showCreditActions: boolean;
}) {
  const router = useRouter();
  const goBack = useCallback(() => router.push(backHref), [backHref, router]);
  useTelegramBackButton(goBack);

  return (
    <UnavailableShell
      kind={kind}
      showCreditActions={showCreditActions}
      header={
        <header className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="-ml-2 rounded-full text-muted-foreground hover:text-foreground"
            aria-label={MARKET_UNAVAILABLE_ACTIONS.back}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <UnavailableHeader kind={kind} compact />
        </header>
      }
    />
  );
}

function UnavailableShell({
  kind,
  header,
  showCreditActions,
}: {
  kind: Exclude<MarketUnavailableKind, 'insufficientCredits'>;
  header: ReactNode;
  showCreditActions: boolean;
}) {
  const copy = MARKET_UNAVAILABLE_COPY[kind];
  const Icon = KIND_ICONS[kind];

  return (
    <main
      data-app-shell={`unavailable-${kind}`}
      className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-foreground"
    >
      {header}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 pb-10 text-center">
        <div className="rounded-3xl border border-border bg-card px-6 py-8 shadow-2xl shadow-black/30 backdrop-blur">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden />
          </span>
          <p className="text-[13px] font-medium text-foreground/90">{copy.title}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.body}</p>
        </div>
        {showCreditActions ? <CreditActions /> : null}
      </section>
    </main>
  );
}

function UnavailableHeader({
  kind,
  compact = false,
}: {
  kind: Exclude<MarketUnavailableKind, 'insufficientCredits'>;
  compact?: boolean;
}) {
  const copy = MARKET_UNAVAILABLE_COPY[kind];
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/70">
        {copy.eyebrow}
      </p>
      <h1
        className={
          compact ? 'text-lg font-black tracking-tight' : 'mt-1 text-2xl font-black tracking-tight'
        }
      >
        {copy.title}
      </h1>
    </div>
  );
}

export function CreditActions() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Button asChild className="h-11 rounded-xl font-bold">
        <Link href="/profile">
          <Gift className="h-4 w-4" aria-hidden />
          {MARKET_UNAVAILABLE_ACTIONS.checkin}
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-11 rounded-xl font-bold">
        <Link href="/profile/invite">
          <UserPlus className="h-4 w-4" aria-hidden />
          {MARKET_UNAVAILABLE_ACTIONS.invite}
        </Link>
      </Button>
    </div>
  );
}
