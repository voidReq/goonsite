'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorBeacon() {
  const pathname = usePathname();
  const loadTime = useRef(Date.now());
  const viewLogged = useRef(false);

  useEffect(() => {
    // Reset on each navigation
    loadTime.current = Date.now();
    viewLogged.current = false;

    // Log page view on load
    fetch('/api/internal/log-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'view',
        path: pathname,
        timestamp: new Date().toISOString(),
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language || 'unknown',
        user_agent: navigator.userAgent || 'unknown',
        referer: document.referrer || null,
      }),
    }).then(() => {
      viewLogged.current = true;
    }).catch(() => {});

    // Track duration on page leave
    const sendDuration = () => {
      const duration = Math.round((Date.now() - loadTime.current) / 1000);
      if (duration < 1) return;

      const payload = JSON.stringify({
        type: 'duration',
        path: pathname,
        duration_seconds: duration,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language || 'unknown',
        timestamp: new Date().toISOString(),
      });

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
      sendDuration();
    };
  }, [pathname]);

  return null;
}
