'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  buildId: string;
  timestamp: number;
}

export function VersionChecker() {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Store initial version on first load
    const storeInitialVersion = async () => {
      try {
        const response = await fetch('/api/version', { 
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data: VersionInfo = await response.json();
        sessionStorage.setItem('app-version', data.version);
        sessionStorage.setItem('app-build-id', data.buildId);
      } catch (error) {
        console.error('Failed to store initial version:', error);
      }
    };

    if (!sessionStorage.getItem('app-version')) {
      storeInitialVersion();
    }

    // Check for updates periodically (every 5 minutes)
    const checkInterval = setInterval(checkForUpdates, 5 * 60 * 1000);

    // Check when window regains focus
    const handleFocus = () => {
      if (!checking) {
        checkForUpdates();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checking]);

  const checkForUpdates = async () => {
    if (checking) return;

    setChecking(true);
    try {
      const storedVersion = sessionStorage.getItem('app-version');
      const storedBuildId = sessionStorage.getItem('app-build-id');

      if (!storedVersion) {
        setChecking(false);
        return;
      }

      const response = await fetch('/api/version', { 
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data: VersionInfo = await response.json();

      // Check if version or build ID changed
      if (data.version !== storedVersion || data.buildId !== storedBuildId) {
        console.log('New version detected:', {
          old: { version: storedVersion, buildId: storedBuildId },
          new: { version: data.version, buildId: data.buildId }
        });

        // Show user-friendly update notification
        const shouldReload = window.confirm(
          'A new version of the application is available. Would you like to reload to get the latest updates?'
        );

        if (shouldReload) {
          // Clear cache and reload
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
          }
          
          // Clear session storage
          sessionStorage.clear();
          
          // Hard reload
          window.location.reload();
        } else {
          // User declined, update stored version so we don't keep asking
          sessionStorage.setItem('app-version', data.version);
          sessionStorage.setItem('app-build-id', data.buildId);
        }
      }
    } catch (error) {
      console.error('Version check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  // Expose manual check function for debugging
  useEffect(() => {
    (window as any).checkForUpdates = checkForUpdates;
  }, []);

  return null; // No UI needed
}
