import React, { useState } from 'react';
import type { Hero } from '../types/Hero';
import StreamQueuePanel from './StreamQueuePanel';

interface StreamQueueJoinSectionProps {
  hero: Hero | null;
  /** Pre-fill streamer id (e.g. own channel). */
  defaultStreamerTwitchId?: string;
}

export default function StreamQueueJoinSection({
  hero,
  defaultStreamerTwitchId = '',
}: StreamQueueJoinSectionProps) {
  const [streamerTwitchId, setStreamerTwitchId] = useState(defaultStreamerTwitchId);

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900/40 p-4">
      <h3 className="text-lg font-semibold text-white">Raid / dungeon queue</h3>
      <p className="text-sm text-gray-400">
        Enter a streamer&apos;s Twitch user ID to view their open chat queue and join or leave.
      </p>
      <label className="block text-sm text-gray-300">
        Streamer Twitch ID
        <input
          type="text"
          value={streamerTwitchId}
          onChange={(e) => setStreamerTwitchId(e.target.value.trim())}
          placeholder="e.g. 1087777297"
          className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
        />
      </label>
      {streamerTwitchId ? (
        <StreamQueuePanel
          streamerTwitchId={streamerTwitchId}
          hero={hero}
          title="Chat queue"
        />
      ) : (
        <p className="text-sm text-gray-500">Enter a streamer Twitch ID above.</p>
      )}
    </div>
  );
}
