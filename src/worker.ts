import { getCanonicalRedirectUrl } from './lib/canonical-host';
import { parseUsageEvent, usageDataPoint } from './lib/usage';

const MAX_USAGE_BODY_BYTES = 256;
const RESPONSE_SECURITY_HEADERS = {
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

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
    headers: {
      ...RESPONSE_SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function redirect(url: string): Response {
  return new Response(null, {
    status: 301,
    headers: { ...RESPONSE_SECURITY_HEADERS, Location: url },
  });
}

async function readUsageBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid request');

  const decoder = new TextDecoder();
  let body = '';
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_USAGE_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError('Payload too large');
    }
    body += decoder.decode(value, { stream: true });
  }
  return JSON.parse(body + decoder.decode()) as unknown;
}

async function recordUsage(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return response(405, 'Method not allowed');

  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return response(403, 'Forbidden');

  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0];
  if (contentType !== 'application/json') return response(415, 'Unsupported media type');

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > MAX_USAGE_BODY_BYTES) return response(413, 'Payload too large');

  let body: unknown;
  try {
    body = await readUsageBody(request);
  } catch (error) {
    if (error instanceof RangeError) return response(413, error.message);
    return response(400, 'Invalid request');
  }

  const event = parseUsageEvent(body);
  if (!event) return response(400, 'Invalid request');
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
      return redirect(redirectUrl);
    }

    if (new URL(request.url).pathname === '/api/usage') {
      return recordUsage(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
