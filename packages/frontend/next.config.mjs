import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sentryRelease = process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA;
const hasSentryUploadConfig = Boolean(
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_AUTH_TOKEN
);

function resolvePublicApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured;

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production' || vercelEnv === 'preview') {
    throw new Error(
      'NEXT_PUBLIC_API_URL must be set for IDN Vercel builds; refusing Chinese MiniApp fallback'
    );
  }
  return 'http://localhost:3001';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: resolvePublicApiUrl(),
  },
  // M4 容器化：产出 .next/standalone 自包含运行时（含 server.js + 最小 node_modules）。
  output: 'standalone',
  // monorepo 下必须显式指定 trace root 到仓库根（packages/frontend 上两级），
  // 否则 standalone 文件追踪可能漏掉 workspace 依赖（@miniapp/shared 等）。
  experimental: {
    outputFileTracingRoot: join(__dirname, '../..'),
  },
  transpilePackages: ['@miniapp/shared'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: {
    name: sentryRelease,
    create: hasSentryUploadConfig,
  },
  sourcemaps: {
    disable: !hasSentryUploadConfig,
    deleteSourcemapsAfterUpload: true,
  },
  telemetry: false,
  silent: !hasSentryUploadConfig,
  webpack: {
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: false,
    treeshake: {
      removeDebugLogging: true,
      excludeReplayIframe: false,
    },
  },
});
