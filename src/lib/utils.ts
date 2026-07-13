import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PLAYER_ID_KEY = 'rowspire-player-id';
const PRODUCTION_HOSTNAMES = new Set([
  'rowspire.tre.systems',
  'rowspire.com',
  'www.rowspire.com',
  'rowspire.net',
  'www.rowspire.net',
  'rowspire.org',
  'www.rowspire.org',
]);

export function getPlayerId(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  let playerId = window.localStorage.getItem(PLAYER_ID_KEY);

  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    window.localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  return playerId;
}

export const isProduction = () => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production';
  }

  return PRODUCTION_HOSTNAMES.has(window.location.hostname);
};

export const isDevelopment = () => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }

  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || process.env.NODE_ENV === 'development'
  );
};
