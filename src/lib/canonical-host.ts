const CANONICAL_HOST = 'rowspire.com';

const REDIRECT_HOSTS = new Set([
  'www.rowspire.com',
  'rowspire.net',
  'www.rowspire.net',
  'rowspire.org',
  'www.rowspire.org',
  'rowspire.tre.systems',
  'connect-4.tre.systems',
]);

export function getCanonicalRedirectUrl(requestUrl: string): string | null {
  const url = new URL(requestUrl);

  if (url.hostname === CANONICAL_HOST && url.protocol === 'https:') {
    return null;
  }
  if (url.hostname !== CANONICAL_HOST && !REDIRECT_HOSTS.has(url.hostname)) return null;

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';

  return url.toString();
}
