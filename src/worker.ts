import { getCanonicalRedirectUrl } from './lib/canonical-host';
import { isUsageEvent, usageDataPoint } from './lib/usage';

interface AnalyticsEngineDataset {
  writeDataPoint(point: { indexes: string[]; blobs: string[]; doubles: number[] }): void;
}

export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  APP_USAGE?: AnalyticsEngineDataset;
}

function response(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function recordUsage(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return response(405, 'Method not allowed');

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return response(403, 'Forbidden');

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > 256) return response(413, 'Payload too large');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response(400, 'Invalid request');
  }

  const event =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>)['event'] : null;
  if (!isUsageEvent(event)) return response(400, 'Invalid request');
  if (!env.APP_USAGE) return response(503, 'Usage reporting unavailable');

  try {
    env.APP_USAGE.writeDataPoint(usageDataPoint(event));
    return response(202, 'Accepted');
  } catch {
    return response(503, 'Usage reporting unavailable');
  }
}

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    const redirectUrl = getCanonicalRedirectUrl(request.url);

    if (redirectUrl) {
      return Response.redirect(redirectUrl, 301);
    }

    if (new URL(request.url).pathname === '/api/usage') {
      return recordUsage(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
