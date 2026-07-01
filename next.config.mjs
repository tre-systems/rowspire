import { withSentryConfig } from '@sentry/nextjs';

const sentryRelease =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ??
  process.env.SENTRY_RELEASE ??
  process.env.CF_PAGES_COMMIT_SHA ??
  process.env.GITHUB_SHA;

if (sentryRelease) {
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ??= sentryRelease;
  process.env.SENTRY_RELEASE ??= sentryRelease;
}

const nextConfig = {
  output: 'export',
  productionBrowserSourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN),
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    if (!isServer) {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? 'total-reality-engineering',
  project: process.env.SENTRY_PROJECT ?? 'rowspire',
  sentryUrl: process.env.SENTRY_URL ?? 'https://de.sentry.io',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  telemetry: false,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
