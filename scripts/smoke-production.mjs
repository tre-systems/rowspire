const origin = 'https://rowspire.com';
const requestTimeout = 10_000;
const checks = [
  {
    path: '/',
    type: 'text/html',
    includes: '<div id="root"></div>',
    header: ['content-security-policy', "'wasm-unsafe-eval'"],
  },
  { path: '/manifest.webmanifest', type: 'application/manifest+json', includes: 'Rowspire' },
  { path: '/wasm/rowspire_ai_core_bg.wasm', type: 'application/wasm' },
  { path: '/ml/data/weights/ml_ai_weights_best.json', type: 'application/json' },
];

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
      const validHeader =
        !check.header || (response.headers.get(check.header[0]) ?? '').includes(check.header[1]);
      if (
        response.ok &&
        contentType.includes(check.type) &&
        (!check.includes || body.includes(check.includes)) &&
        validHeader
      ) {
        console.log(`Smoke check passed: ${check.path}`);
        return;
      }
      detail = `${response.status} ${contentType}`;
    } catch (error) {
      detail = String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 3_000));
  }
  throw new Error(`Smoke check failed for ${check.path}: ${detail}`);
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
console.log('Usage validation smoke check passed');

const redirect = await fetch('https://rowspire.net', {
  redirect: 'manual',
  signal: AbortSignal.timeout(requestTimeout),
});
if (redirect.status !== 301 || redirect.headers.get('location') !== `${origin}/`) {
  throw new Error('Canonical host redirect smoke check failed');
}
console.log('Canonical host redirect smoke check passed');
