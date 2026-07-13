import { vi } from 'vitest';

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  },
});
