'use client';

import { useEffect } from 'react';
import { initLogRocket } from '../../lib/logrocket';

interface MonitoringProviderProps {
  children: React.ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  useEffect(() => {
    // Initialize LogRocket on client side
    if (typeof window !== 'undefined') {
      initLogRocket();
    }

    // Lazy-load Sentry Session Replay to avoid multiple instances error
    // This follows the official Sentry Next.js documentation approach
    if (typeof window !== 'undefined' && !window.__SENTRY_REPLAY_INITIALIZED__) {
      window.__SENTRY_REPLAY_INITIALIZED__ = true;

      import('@sentry/nextjs')
        .then((lazyLoadedSentry) => {
          try {
            lazyLoadedSentry.addIntegration(
              lazyLoadedSentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
              })
            );
            console.log('✅ Sentry Session Replay lazy-loaded successfully');
          } catch (error) {
            console.warn('⚠️ Sentry Session Replay lazy-loading failed:', error);
          }
        })
        .catch((error) => {
          console.warn('⚠️ Failed to import Sentry for Session Replay:', error);
        });
    }
  }, []);

  return <>{children}</>;
}
