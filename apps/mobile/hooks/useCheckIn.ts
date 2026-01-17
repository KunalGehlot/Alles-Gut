import { useState, useCallback, useEffect } from 'react';
import type { CheckInStatus } from '@alles-gut/shared';
import { api } from '@/services/api';

interface UseCheckInReturn {
  status: CheckInStatus | null;
  isLoading: boolean;
  isCheckingIn: boolean;
  error: string | null;
  checkIn: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useCheckIn(): UseCheckInReturn {
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await api.getCheckInStatus();
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkIn = useCallback(async () => {
    try {
      setIsCheckingIn(true);
      setError(null);
      const newStatus = await api.checkIn();
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in');
      throw err;
    } finally {
      setIsCheckingIn(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    // Refresh status every minute
    const interval = setInterval(refreshStatus, 60000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    isCheckingIn,
    error,
    checkIn,
    refreshStatus,
  };
}

// Calculate hours remaining from deadline
export function calculateHoursRemaining(deadline: string | null): number | null {
  if (!deadline) return null;

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  return Math.max(0, diffHours);
}

// Format date for display in German
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (dateDay.getTime() === today.getTime()) {
    return `Heute, ${timeStr} Uhr`;
  } else if (dateDay.getTime() === yesterday.getTime()) {
    return `Gestern, ${timeStr} Uhr`;
  } else if (dateDay.getTime() === tomorrow.getTime()) {
    return `Morgen, ${timeStr} Uhr`;
  } else {
    const dateStr = date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    });
    return `${dateStr}, ${timeStr} Uhr`;
  }
}
