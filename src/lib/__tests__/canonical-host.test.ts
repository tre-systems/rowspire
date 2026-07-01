import { describe, expect, it } from 'vitest';
import { getCanonicalRedirectUrl } from '../canonical-host';

describe('getCanonicalRedirectUrl', () => {
  it('does not redirect the canonical apex host', () => {
    expect(getCanonicalRedirectUrl('https://rowspire.com/play?mode=ml')).toBeNull();
  });

  it.each([
    'https://www.rowspire.com/',
    'https://rowspire.net/',
    'https://www.rowspire.net/',
    'https://rowspire.org/',
    'https://www.rowspire.org/',
    'https://rowspire.tre.systems/',
    'https://connect-4.tre.systems/',
  ])('redirects %s to rowspire.com', url => {
    expect(getCanonicalRedirectUrl(url)).toBe('https://rowspire.com/');
  });

  it('preserves path, query, and fragment when redirecting', () => {
    expect(getCanonicalRedirectUrl('http://rowspire.net/offline?source=old#install')).toBe(
      'https://rowspire.com/offline?source=old#install',
    );
  });
});
