import { useState, useEffect, useRef } from 'react';

export const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));
  const intervalRef = useRef(null);

  function calculateTimeLeft(target) {
    const diff = new Date(target) - new Date();
    if (diff <= 0) return { minutes: 0, seconds: 0, expired: true };
    return {
      minutes: Math.floor(diff / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const result = calculateTimeLeft(targetDate);
      setTimeLeft(result);
      if (result.expired) clearInterval(intervalRef.current);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [targetDate]);

  return timeLeft;
};
