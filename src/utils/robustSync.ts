/**
 * Robust Sync Utility
 * 
 * Provides retry logic with exponential backoff and pending delta tracking
 * for browser source overlay synchronization.
 */

interface SyncOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

interface PendingDelta<T> {
  data: T;
  retryCount: number;
  lastAttempt: number;
}

/**
 * Retry a sync operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: SyncOptions = {}
): Promise<T> {
  const {
    maxRetries = 5,
    initialDelayMs = 1000,
    maxDelayMs = 32000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelayMs * Math.pow(2, attempt),
          maxDelayMs
        );
        
        console.warn(
          `[RobustSync] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`,
          error
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Pending Delta Manager
 * Tracks deltas that need to be synced and ensures no data loss
 */
export class PendingDeltaManager<K, V> {
  private pending = new Map<K, PendingDelta<V>>();
  private mergeFunction: (existing: V, incoming: V) => V;

  constructor(mergeFunction: (existing: V, incoming: V) => V) {
    this.mergeFunction = mergeFunction;
  }

  /**
   * Add or merge a delta into pending queue
   */
  add(key: K, delta: V): void {
    const existing = this.pending.get(key);
    
    if (existing) {
      // Merge with existing pending delta
      const merged = this.mergeFunction(existing.data, delta);
      this.pending.set(key, {
        data: merged,
        retryCount: existing.retryCount,
        lastAttempt: existing.lastAttempt,
      });
    } else {
      this.pending.set(key, {
        data: delta,
        retryCount: 0,
        lastAttempt: 0,
      });
    }
  }

  /**
   * Get all pending deltas
   */
  getAll(): Map<K, V> {
    const result = new Map<K, V>();
    this.pending.forEach((delta, key) => {
      result.set(key, delta.data);
    });
    return result;
  }

  /**
   * Mark a delta as successfully synced (remove from pending)
   */
  markSynced(key: K): void {
    this.pending.delete(key);
  }

  /**
   * Mark a delta as failed (increment retry count)
   */
  markFailed(key: K): void {
    const existing = this.pending.get(key);
    if (existing) {
      existing.retryCount++;
      existing.lastAttempt = Date.now();
    }
  }

  /**
   * Get size of pending queue
   */
  size(): number {
    return this.pending.size;
  }

  /**
   * Check if there are pending deltas
   */
  hasPending(): boolean {
    return this.pending.size > 0;
  }

  /**
   * Clear all pending deltas (use with caution!)
   */
  clear(): void {
    this.pending.clear();
  }
}

/**
 * Flush pending data on page close using sendBeacon or keepalive fetch
 */
export async function flushOnClose<T>(
  url: string,
  data: T,
  useBeacon = true
): Promise<boolean> {
  const payload = JSON.stringify(data);
  
  if (useBeacon && navigator.sendBeacon) {
    // sendBeacon is preferred for unload scenarios
    const blob = new Blob([payload], { type: 'application/json' });
    return navigator.sendBeacon(url, blob);
  } else {
    // Fallback to keepalive fetch
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });
      return true;
    } catch (error) {
      console.error('[RobustSync] Flush on close failed:', error);
      return false;
    }
  }
}

/**
 * Setup lifecycle event listeners for flush on close
 */
export function setupFlushOnClose<T>(
  flushCallback: () => Promise<void>
): () => void {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Page is hidden, flush pending changes
      flushCallback().catch(err => {
        console.error('[RobustSync] Flush on visibility change failed:', err);
      });
    }
  };

  const handlePageHide = () => {
    // Page is being unloaded, flush pending changes synchronously if possible
    flushCallback().catch(err => {
      console.error('[RobustSync] Flush on pagehide failed:', err);
    });
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
  };
}
