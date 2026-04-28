import { useState, useEffect } from 'react';
import api from '../api/client';

// Fallback defaults match backend defaults (env not set)
const DEFAULTS = { MAX_SEATS_PER_ORDER: 6, SEAT_LOCK_TIMEOUT_MINUTES: 10 };

let cached = null; // module-level cache — only 1 fetch per app session

/**
 * [FIX 26/27] Hook that loads business constants from backend once.
 * Returns the same defaults until the fetch completes.
 */
export const useConfig = () => {
  const [config, setConfig] = useState(cached || DEFAULTS);

  useEffect(() => {
    if (cached) return;
    api.getConfig()
      .then(data => {
        cached = data;
        setConfig(data);
      })
      .catch(() => { /* keep defaults on network error */ });
  }, []);

  return config;
};
