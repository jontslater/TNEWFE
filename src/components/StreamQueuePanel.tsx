import React, { useCallback, useEffect, useState } from 'react';
import { queueAPI, type BattlefieldQueueSnapshot } from '../api/queueApi';
import { parseLaunchAtMs, queueDocumentId } from '../utils/queueSnapshot';
import type { Hero } from '../types/Hero';

interface StreamQueuePanelProps {
  /** Streamer Twitch user id (numeric string) whose queue to view/join */
  streamerTwitchId: string;
  hero: Hero | null;
  title?: string;
}

export default function StreamQueuePanel({
  streamerTwitchId,
  hero,
  title = 'Chat queue',
}: StreamQueuePanelProps) {
  const [queue, setQueue] = useState<BattlefieldQueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!streamerTwitchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await queueAPI.getQueue(streamerTwitchId);
      setQueue(data.queue);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load queue';
      setError(message);
      setQueue(null);
    } finally {
      setLoading(false);
    }
  }, [streamerTwitchId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const docId = queueDocumentId(queue, streamerTwitchId);

  const handleJoin = async () => {
    if (!hero?.id || !docId) return;
    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await queueAPI.joinQueue(docId, { heroId: hero.id });
      setSuccessMessage(result.message ?? 'Joined queue');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join queue');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!docId) return;
    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await queueAPI.leaveQueue(docId);
      setSuccessMessage(result.message ?? 'Left queue');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to leave queue');
    } finally {
      setBusy(false);
    }
  };

  const inQueue = Boolean(queue?.participants?.some((p) => p.heroId === hero?.id));

  const launchAtMs = queue ? parseLaunchAtMs(queue.launchAt) : null;
  const countdownSec =
    launchAtMs && launchAtMs > Date.now()
      ? Math.ceil((launchAtMs - Date.now()) / 1000)
      : null;

  if (loading && !queue) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 text-sm text-gray-400">
        Loading {title.toLowerCase()}…
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 text-sm text-gray-400">
        No open {title.toLowerCase()} for this stream right now.
        {error && <p className="mt-2 text-red-400">{error}</p>}
      </div>
    );
  }

  const tank = queue.requirements?.roles?.tank;
  const healer = queue.requirements?.roles?.healer;
  const dps = queue.requirements?.roles?.dps;

  return (
    <div className="rounded-lg border border-amber-700/40 bg-gray-900/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-xs uppercase tracking-wide text-amber-400">
          {queue.type} · {queue.status}
        </span>
      </div>
      {queue.queueKey && (
        <p className="text-sm text-gray-400">
          Mode: <span className="text-gray-200">{queue.queueKey}</span>
        </p>
      )}
      <p className="text-sm text-gray-400">
        Join code: <span className="font-mono text-purple-300">{queue.code}</span>
      </p>
      {countdownSec != null && (
        <p className="text-sm text-green-400">Launching in {countdownSec}s</p>
      )}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded bg-gray-800 p-2">
          Tank {tank?.current ?? 0}/{tank?.required ?? 1}
        </div>
        <div className="rounded bg-gray-800 p-2">
          Healer {healer?.current ?? 0}/{healer?.required ?? 1}
        </div>
        <div className="rounded bg-gray-800 p-2">
          DPS {dps?.current ?? 0}/{dps?.required ?? 3}
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {successMessage && !error && (
        <p className="text-sm text-green-400">{successMessage}</p>
      )}
      <div className="flex gap-2">
        {!inQueue ? (
          <button
            type="button"
            disabled={busy || !hero}
            onClick={handleJoin}
            className="flex-1 rounded bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            Join queue
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={handleLeave}
            className="flex-1 rounded bg-red-800 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Leave queue
          </button>
        )}
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="rounded border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Joining this stream&apos;s queue leaves any other stream&apos;s queue (server enforced).
        Role-full and cross-stream errors are returned by the API and shown above.
      </p>
    </div>
  );
}
