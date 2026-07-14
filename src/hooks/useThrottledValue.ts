import { useEffect, useRef, useState } from 'react';

/**
 * Surfaces a rapidly-changing value to the UI at most once per `minIntervalMs`.
 * The latest value always wins, so bursts are coalesced rather than queued.
 *
 * This keeps the game-status banner from flashing during fast AI play —
 * including when two engines play each other — which would otherwise change
 * state many times a second (a WCAG 2.3.1 seizure risk).
 *
 * `key` identifies a distinct value: pass a stable string so values that are
 * equal in content but not by reference are treated as unchanged.
 */
export function useThrottledValue<T>(value: T, key: string, minIntervalMs: number): T {
  const [shown, setShown] = useState(value);
  const latestValue = useRef(value);
  const latestKey = useRef(key);
  const shownKey = useRef(key);
  const lastCommit = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestValue.current = value;
    latestKey.current = key;

    if (key === shownKey.current) return;

    const commit = () => {
      timer.current = null;
      if (latestKey.current === shownKey.current) return;
      shownKey.current = latestKey.current;
      lastCommit.current = Date.now();
      setShown(latestValue.current);
    };

    const elapsed = lastCommit.current === null ? minIntervalMs : Date.now() - lastCommit.current;

    if (elapsed >= minIntervalMs) {
      commit();
    } else if (timer.current === null) {
      timer.current = setTimeout(commit, minIntervalMs - elapsed);
    }
  }, [value, key, minIntervalMs]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return shown;
}
