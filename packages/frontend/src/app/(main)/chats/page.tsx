'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Heart,
  MessageCircle,
  Pencil,
  Pin,
  PinOff,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import type { ChatSession } from '@miniapp/shared';

import { cn } from '@/lib/utils';
import { useCharacterQuery } from '@/lib/api/characters';
import { resolveSessionTitle, useConversationsQuery } from '@/lib/api/conversations';
import {
  SessionActionButton,
  SessionDeleteConfirm,
  SessionRenameField,
  useSessionRowActions,
} from '@/components/chat/session-row-actions';
import { useFavoritesQuery } from '@/lib/api/favorites';
import { FavoriteButton } from '@/components/characters/favorite-button';
import { lobbyImageUrl } from '@/components/characters/character-card';
import { FeaturedFrame } from '@/components/characters/featured-frame';
import { chatEntryPath } from '@/lib/chat-entry';

type ChatsTab = 'history' | 'favorites';

const TABS: { key: ChatsTab; label: string }[] = [
  { key: 'history', label: 'Riwayat' },
  { key: 'favorites', label: 'Favorit' },
];

const TAB_COPY: Record<ChatsTab, { title: string; description: string }> = {
  history: {
    title: 'Riwayat',
    description: 'Lanjut chat terakhir sama karakter. Konteksnya tetap lengkap.',
  },
  favorites: {
    title: 'Favorit',
    description: 'Karakter favorit kamu ada di sini. Ketuk untuk lanjut chat.',
  },
};

export default function ChatsPage() {
  const [tab, setTab] = useState<ChatsTab>('history');

  return (
    <main className="min-h-dvh bg-background px-4 pb-8 pt-[calc(1.5rem+env(safe-area-inset-top))] text-foreground">
      <header className="mx-auto mb-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Messages</p>
        <h1 className="mt-1 text-2xl font-bold">{TAB_COPY[tab].title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{TAB_COPY[tab].description}</p>
      </header>

      <div
        className="mx-auto mb-5 flex max-w-2xl gap-1 rounded-full border border-border bg-card p-1"
        role="tablist"
        aria-label="Percakapan dan favorit"
      >
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={cn(
                'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98]',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'history' ? <ConversationHistoryList /> : <FavoritesList />}
    </main>
  );
}

function ConversationHistoryList() {
  const { data, isLoading, isError, refetch } = useConversationsQuery(undefined);
  const sessions = data?.sessions ?? [];

  return (
    <section className="mx-auto max-w-2xl space-y-2">
      {isLoading && sessions.length === 0 ? (
        <HistoryHint>Sedang memuat riwayat…</HistoryHint>
      ) : null}

      {isError ? <HistoryError onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && sessions.length === 0 ? <HistoryEmpty /> : null}

      {sessions.map((session) => (
        <ConversationHistoryRow key={session.id} session={session} />
      ))}
    </section>
  );
}

/**
 * 会话列表只带 character_id。逐行取角色卡只为头像；
 * 主标题走 session.title（缺省时退到角色名），展示时统一截到 7 字。
 *
 * 整行是进入聊天的链接，操作按钮浮在它上层单独响应，避免 Link 里嵌 button。
 */
function ConversationHistoryRow({ session }: { session: ChatSession }) {
  const { data } = useCharacterQuery(session.character_id);
  const character = data?.character;
  const actions = useSessionRowActions(session);

  const avatarUrl = character?.avatar_url ? lobbyImageUrl(character.avatar_url) : null;
  // 回落到角色名而不是摘要：这里跨角色，先看是谁；摘要已经占了第二行，标题再放一遍是重复。
  // 角色内抽屉的口径不同（那边回落到摘要），因为那边每行都是同一个角色。
  const name = resolveSessionTitle(session.title, character?.name ?? 'Percakapan');

  if (actions.editing) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-card p-3.5">
        <SessionRenameField actions={actions} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-3xl border bg-card p-3.5 shadow-lg shadow-black/10 transition',
        session.pinned_at ? 'border-primary/30' : 'border-border'
      )}
    >
      <div className="flex items-center gap-3">
        <Link
          href={chatEntryPath(session.character_id, { sessionId: session.id })}
          prefetch={false}
          aria-label={`Lanjut chat dengan ${name}`}
          className="absolute inset-0 rounded-3xl"
        />
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-secondary">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-3">
            <span className="flex min-w-0 flex-1 items-center gap-1">
              {session.pinned_at ? (
                <Pin
                  className="size-3 shrink-0 fill-current text-primary"
                  aria-label="Disematkan"
                />
              ) : null}
              <span className="truncate font-semibold">{name}</span>
            </span>
            <time className="shrink-0 text-[11px] text-muted-foreground">
              {formatActivityTime(session.last_message_at ?? session.created_at)}
            </time>
          </span>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {session.last_message_preview || 'Belum ada ringkasan'}
          </span>
        </span>

        <span className="relative z-10 flex shrink-0 items-center">
          <SessionActionButton
            label={session.pinned_at ? 'Lepas sematan' : 'Sematkan'}
            onClick={actions.togglePin}
          >
            {session.pinned_at ? <PinOff aria-hidden /> : <Pin aria-hidden />}
          </SessionActionButton>
          <SessionActionButton label="Ganti nama" onClick={actions.startRename}>
            <Pencil aria-hidden />
          </SessionActionButton>
          <SessionActionButton label="Hapus" onClick={actions.toggleDeleteConfirm}>
            <Trash2 aria-hidden />
          </SessionActionButton>
        </span>
      </div>

      {/* 整行是个覆盖层链接，确认条要浮在它上面才点得到 */}
      {actions.confirmingDelete ? (
        <SessionDeleteConfirm actions={actions} className="relative z-10" />
      ) : null}
    </div>
  );
}

function HistoryRow({
  href,
  avatarUrl,
  name,
  timestamp,
  preview,
  onClick,
}: {
  href: string;
  avatarUrl: string | null;
  name: string;
  timestamp: string;
  preview: string | null;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3.5 shadow-lg shadow-black/10 transition hover:border-primary/30 hover:bg-secondary active:scale-[0.99]"
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-secondary">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-primary">
            <MessageCircle className="h-5 w-5" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate font-semibold">{name}</span>
          <time className="shrink-0 text-[11px] text-muted-foreground">
            {formatActivityTime(timestamp)}
          </time>
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {preview || 'Belum ada ringkasan'}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
    </Link>
  );
}

function HistoryHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function HistoryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5">
      <p className="text-sm text-destructive">Gagal memuat. Coba lagi nanti.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-95"
      >
        <RefreshCw className="h-4 w-4" />
        Coba lagi
      </button>
    </div>
  );
}

function HistoryEmpty() {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center">
      <MessageCircle className="mx-auto h-9 w-9 text-primary" />
      <h2 className="mt-3 font-semibold">Belum ada percakapan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Kirim minimal satu pesan ke karakter, baru muncul di sini.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-95"
      >
        Pilih karakter
      </Link>
    </div>
  );
}

function FavoritesList() {
  const { data, isLoading, isError, refetch } = useFavoritesQuery();
  const characters = data?.characters ?? [];

  if (isLoading && characters.length === 0) {
    return (
      <section className="mx-auto max-w-2xl space-y-2">
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sedang memuat favorit…
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5">
          <p className="text-sm text-destructive">Gagal memuat. Coba lagi nanti.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      </section>
    );
  }

  if (characters.length === 0) {
    return (
      <section className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <Heart className="mx-auto h-9 w-9 text-rose" />
          <h2 className="mt-3 font-semibold">Belum ada favorit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ketuk hati di lobby atau di detail karakter, nanti muncul di sini.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-95"
          >
            Lihat karakter di Lobby
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-2">
      {characters.map((character) => (
        // 整行可点进入聊天，心形浮在上层单独响应，避免 Link 里嵌 button。
        <FeaturedFrame
          key={character.id}
          featured={character.is_featured}
          className="rounded-[26px]"
        >
          <div className="relative flex items-center gap-3 rounded-3xl border border-border bg-card p-3.5 shadow-lg shadow-black/10 transition hover:border-primary/30 hover:bg-secondary">
            <Link
              href={chatEntryPath(character.id)}
              prefetch={false}
              aria-label={`Masuk chat ${character.name}`}
              className="absolute inset-0 rounded-3xl"
            />
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-secondary">
              {character.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lobbyImageUrl(character.avatar_url)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-rose">
                  <Heart className="h-5 w-5" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{character.name}</span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">
                {character.description?.trim() || 'Belum ada bio karakter'}
              </span>
            </span>
            <FavoriteButton characterId={character.id} variant="header" className="relative z-10" />
          </div>
        </FeaturedFrame>
      ))}
    </section>
  );
}

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  }
  return date.toLocaleDateString('id-ID', {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}
