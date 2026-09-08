'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <main className="w-full max-w-sm text-center">
          <h1 className="text-xl font-semibold">Halaman ini lagi error</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Masalahnya sudah tercatat. Coba lagi nanti.
          </p>
          <button
            type="button"
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={reset}
          >
            Muat ulang
          </button>
        </main>
      </body>
    </html>
  );
}
