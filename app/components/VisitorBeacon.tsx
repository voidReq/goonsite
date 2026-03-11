'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorBeacon() {
  const pathname = usePathname();
  const loadTime = useRef(Date.now());

  useEffect(() => {
    // Reset load time on each navigation
    loadTime.current = Date.now();

    const sendDuration = () => {
      const duration = Math.round((Date.now() - loadTime.current) / 1000);
      if (duration < 1) return; // Skip sub-second visits (prefetches, bots)

      const payload = JSON.stringify({
        type: 'duration',
        path: pathname,
        duration_seconds: duration,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language || 'unknown',
        timestamp: new Date().toISOString(),
      });

      // sendBeacon is fire-and-forget, works even during page unload
      navigator.sendBeacon('/api/internal/log-visit', payload);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendDuration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sendDuration(); // Also fire on client-side navigation (SPA route change)
    };
  }, [pathname]);

  return null;
}
