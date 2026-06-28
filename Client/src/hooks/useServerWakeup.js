import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_URL;
const HEALTH_URL = `${baseURL}/health`;
const TIMEOUT_MS = 5000;   // If no response in 5s, server is sleeping → show banner
const MAX_RETRIES = 10;     // Try for up to ~50s before giving up
const RETRY_INTERVAL = 5000;

/**
 * Pings /health on mount. If the server is cold-starting, shows a
 * "Server waking up..." toast and retries until it responds.
 */
export function useServerWakeup() {
  const toastId = useRef(null);

  useEffect(() => {
    let retries = 0;
    let cancelled = false;

    const ping = async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(HEALTH_URL, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timer);

        if (res.ok) {
          // Server is awake — dismiss banner if it was shown
          if (toastId.current) {
            toast.dismiss(toastId.current);
            toast.success('Server is ready!', { duration: 2000 });
            toastId.current = null;
          }
          return; // done
        }
        throw new Error('not ok');
      } catch {
        if (cancelled) return;

        retries++;
        if (retries === 1) {
          // First failure — server is cold-starting, show banner
          toastId.current = toast.loading('Server is waking up… this may take ~30s on first load.', {
            duration: Infinity,
            icon: '⏳',
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '14px',
            },
          });
        }

        if (retries < MAX_RETRIES) {
          setTimeout(ping, RETRY_INTERVAL);
        } else {
          // Give up — dismiss loading and show error
          if (toastId.current) {
            toast.dismiss(toastId.current);
            toast.error('Server is taking too long. Please refresh the page.', { duration: 6000 });
            toastId.current = null;
          }
        }
      }
    };

    ping();

    return () => {
      cancelled = true;
      if (toastId.current) {
        toast.dismiss(toastId.current);
      }
    };
  }, []);
}
