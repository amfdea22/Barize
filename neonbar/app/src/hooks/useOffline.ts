import { useEffect, useCallback, useState } from 'react';
import { syncPendingRequests, getQueueCount } from '../services/syncService';
import { useAppStore } from '../stores/appStore';

/**
 * Hook to detect online/offline status and auto-sync when back online.
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const setConnected = useAppStore((s) => s.setConnected);

  const updateQueueCount = useCallback(async () => {
    const count = await getQueueCount();
    setPendingCount(count);
  }, []);

  // Monitor online/offline
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setConnected(true);
      setSyncing(true);
      try {
        await syncPendingRequests();
      } finally {
        setSyncing(false);
        await updateQueueCount();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial queue count
    updateQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setConnected, updateQueueCount]);

  // Manual sync trigger
  const manualSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      await syncPendingRequests();
    } finally {
      setSyncing(false);
      await updateQueueCount();
    }
  }, [updateQueueCount]);

  return { isOnline, pendingCount, syncing, manualSync };
}
