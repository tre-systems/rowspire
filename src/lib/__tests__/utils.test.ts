import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('Utils', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('bg-teal-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});
