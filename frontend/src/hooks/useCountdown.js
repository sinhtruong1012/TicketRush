import { useState, useEffect, useRef } from 'react';

/**
 * Countdown hook anchored to a monotonic clock (performance.now).
 * Immune to user changing system time mid-session.
 * Note: if the page is loaded with a wildly wrong clock the first diff may be
 * off, but the backend always enforces the real expiry independently.
 */
export const useCountdown = (targetDate) => {
  // Record both timestamps at the moment the target is first known.
  // All future ticks use the elapsed monotonic time to avoid wall-clock drift.
  const anchorRef = useRef(null);

  function getTimeLeft() {
    if (!targetDate) return { minutes: 0, seconds: 0, expired: false };

    if (!anchorRef.current) {
      anchorRef.current = {
        mono: performance.now(),
        remaining: new Date(targetDate) - Date.now(), // initial diff (ms)
      };
    }

    const elapsed = performance.now() - anchorRef.current.mono;
    const diff = anchorRef.current.remaining - elapsed;

    if (diff <= 0) return { minutes: 0, seconds: 0, expired: true };
    return {
      minutes: Math.floor(diff / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  }

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const intervalRef = useRef(null);

  // Reset anchor when targetDate changes (new order loaded)
  useEffect(() => {
    anchorRef.current = null;
    setTimeLeft(getTimeLeft());

    intervalRef.current = setInterval(() => {
      const result = getTimeLeft();
      setTimeLeft(result);
      if (result.expired) clearInterval(intervalRef.current);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  return timeLeft;
};
