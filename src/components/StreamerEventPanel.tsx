import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { battlefieldQueueAPI } from '../api/client';
import { getCleanBattlefieldUrl } from '../utils/battlefieldUrls';

const DUNGEON_LOBBY_OPTIONS = [
  { id: 'normal', label: 'Normal Dungeon (Lv10+, GS 300+)' },
  { id: 'heroic', label: 'Heroic Dungeon (Lv25+, GS 1200+)' },
  { id: 'mythic', label: 'Mythic Dungeon (Lv40+, GS 2500+)' },
] as const;

const RAID_LOBBY_OPTIONS = [
  { id: 'elder_dragon_normal', label: 'Elder Dragon (Normal)' },
  { id: 'elder_dragon_heroic', label: 'Elder Dragon (Heroic)' },
  { id: 'elder_dragon_mythic', label: 'Elder Dragon (Mythic)' },
] as const;

type Props = {
  twitchId?: string | null;
  twitchUsername?: string | null;
  compact?: boolean;
};

export default function StreamerEventPanel({ twitchId, twitchUsername, compact }: Props) {
  const { user } = useAuth();
  const streamerId = twitchId || user?.twitchId;
  const streamerName = twitchUsername || user?.twitchUsername || 'Streamer';
  const [dungeonTier, setDungeonTier] = useState<(typeof DUNGEON_LOBBY_OPTIONS)[number]['id']>('normal');
  const [raidId, setRaidId] = useState<(typeof RAID_LOBBY_OPTIONS)[number]['id']>('elder_dragon_normal');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!streamerId) {
    return null;
  }

  const battlefieldId = `twitch:${streamerId}`;

  const openLobby = async (type: 'dungeon' | 'raid', instanceId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await battlefieldQueueAPI.create(battlefieldId, {
        streamerId,
        streamerName,
        type,
        instanceId,
      });
      if (result.success) {
        setMessage(result.message || 'Party lobby opened. Share the room code from Browser Source tab.');
      } else {
        setMessage(
          result.error ||
            result.message ||
            'Could not open lobby. Deploy backend queue routes or use chat on your stream.'
        );
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || err.message || 'Failed to open lobby');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-lg border border-indigo-600 bg-indigo-950/40 ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      <h3 className="text-lg font-bold text-indigo-200 mb-1">Streamer party events</h3>
      <p className="text-sm text-gray-300 mb-4">
        Open a lobby on your battlefield. Viewers on your stream use Portal one-click join when the API is
        live; until then they use chat after <code className="text-green-400">!join</code> on your channel.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">Dungeon lobby</label>
          <select
            value={dungeonTier}
            onChange={(e) => setDungeonTier(e.target.value as typeof dungeonTier)}
            className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white"
          >
            {DUNGEON_LOBBY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading}
            onClick={() => openLobby('dungeon', dungeonTier)}
            className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 py-2 text-sm font-semibold text-white"
          >
            Open dungeon party
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">Raid lobby</label>
          <select
            value={raidId}
            onChange={(e) => setRaidId(e.target.value as typeof raidId)}
            className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white"
          >
            {RAID_LOBBY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading}
            onClick={() => openLobby('raid', raidId)}
            className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-2 text-sm font-semibold text-white"
          >
            Open raid party
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-400">
        <span>OBS URL:</span>
        <code className="truncate max-w-full rounded bg-gray-900 px-2 py-1 text-green-400">
          {getCleanBattlefieldUrl(streamerId)}
        </code>
      </div>

      {message && (
        <p className="mt-3 text-sm text-yellow-200 bg-yellow-900/30 border border-yellow-700 rounded p-2">
          {message}
        </p>
      )}
    </div>
  );
}
