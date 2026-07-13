const origin = 'https://rowspire.com';
const requestTimeout = 10_000;
const securityHeaders = {
  'content-security-policy': ["script-src-attr 'none'", "form-action 'none'", "worker-src 'self'"],
  'cross-origin-opener-policy': ['same-origin'],
  'cross-origin-resource-policy': ['same-origin'],
  'permissions-policy': ['camera=()', 'microphone=()', 'payment=()'],
  'referrer-policy': ['no-referrer'],
  'strict-transport-security': ['max-age=31536000'],
  'x-content-type-options': ['nosniff'],
  'x-frame-options': ['DENY'],
};
const checks = [
  {
    path: '/',
    type: 'text/html',
    includes: '<div id="root"></div>',
    headers: {
      ...securityHeaders,
      'content-security-policy': [
        "'wasm-unsafe-eval'",
        ...securityHeaders['content-security-policy'],
      ],
    },
  },
  { path: '/manifest.webmanifest', type: 'application/manifest+json', includes: 'Rowspire' },
  { path: '/wasm/rowspire_ai_core_bg.wasm', type: 'application/wasm' },
  { path: '/ml/data/weights/ml_ai_weights_best.json', type: 'application/json' },
];

function hasHeaders(response, expected = {}) {
  return Object.entries(expected).every(([name, values]) => {
    const actual = response.headers.get(name) ?? '';
    return values.every(value => actual.includes(value));
  });
}

const pause = () => new Promise(resolve => setTimeout(resolve, 3_000));

async function waitFor(check) {
  let detail = 'No response';
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const response = await fetch(`${origin}${check.path}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(requestTimeout),
      });
      const body = check.includes ? await response.text() : '';
      const contentType = response.headers.get('content-type') ?? '';
      if (
        response.ok &&
        contentType.includes(check.type) &&
        (!check.includes || body.includes(check.includes)) &&
        hasHeaders(response, check.headers)
      ) {
        console.log(`Smoke check passed: ${check.path}`);
        return;
      }
      detail = `${response.status} ${contentType}`;
    } catch (error) {
      detail = String(error);
    }
    await pause();
  }
  throw new Error(`Smoke check failed for ${check.path}: ${detail}`);
}

async function waitForCanonicalRedirect() {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await fetch('https://rowspire.net', {
      redirect: 'manual',
      signal: AbortSignal.timeout(requestTimeout),
    });
    if (
      response.status === 301 &&
      response.headers.get('location') === `${origin}/` &&
      hasHeaders(response, { 'strict-transport-security': ['max-age=31536000'] })
    ) {
      console.log('Canonical host redirect smoke check passed');
      return;
    }
    await pause();
  }
  throw new Error('Canonical host redirect smoke check failed');
}

for (const check of checks) await waitFor(check);

const invalidUsage = await fetch(`${origin}/api/usage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin },
  body: JSON.stringify({ event: 'page_view' }),
  signal: AbortSignal.timeout(requestTimeout),
});
if (invalidUsage.status !== 400) {
  throw new Error(`Usage validation smoke check failed: ${invalidUsage.status}`);
}
if (!hasHeaders(invalidUsage, { 'strict-transport-security': ['max-age=31536000'] })) {
  throw new Error('Usage security header smoke check failed');
}
console.log('Usage validation smoke check passed');

await waitForCanonicalRedirect();
