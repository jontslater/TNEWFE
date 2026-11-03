import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePlayerActivityLobby } from '../hooks/usePlayerActivityLobby';
import { battlefieldQueueAPI } from '../api/client';
import { getCleanBattlefieldUrl, openCleanBattlefield } from '../utils/battlefieldUrls';
import StreamerEventPanel from './StreamerEventPanel';

type Props = {
  hero: any;
  authUserId: string;
  twitchId?: string | null;
  availableRaids?: any[];
  onDungeonQueueChange?: () => void;
  showStreamerTools?: boolean;
};

function phaseLabel(phase: string) {
  switch (phase) {
    case 'in_instance':
      return 'In combat instance';
    case 'dungeon_queue':
      return 'Dungeon matchmaking';
    case 'raid_queue':
      return 'Raid matchmaking';
    case 'streamer_queue':
      return 'Streamer party lobby';
    default:
      return 'Idle on battlefield';
  }
}

export default function ActivityLobbyPanel({
  hero,
  authUserId,
  twitchId,
  availableRaids = [],
  onDungeonQueueChange,
  showStreamerTools,
}: Props) {
  const { user } = useAuth();
  const lobby = usePlayerActivityLobby({
    hero,
    authUserId,
    twitchId: twitchId || user?.twitchId,
    availableRaids,
  });

  const watchTwitchId = twitchId || user?.twitchId;

  const handleJoinStreamerQueue = async () => {
    if (!lobby.battlefieldQueue?.code || !hero) return;
    lobby.setStatusMessage(null);
    const result = await battlefieldQueueAPI.joinByCode({
      code: lobby.battlefieldQueue.code,
      heroId: hero.id,
      userId: authUserId,
      username: user?.twitchUsername || hero.name || 'Player',
    });
    if (result.success) {
      lobby.setStatusMessage(result.message || 'Joined streamer party!');
    } else {
      lobby.setStatusMessage(
        result.error ||
          'Join via chat is still available: !join on the streamer channel, then ask the streamer to share the room code.'
      );
    }
  };

  const instanceLabel = useMemo(() => {
    if (!lobby.activeInstance.type) return null;
    return `${lobby.activeInstance.type} · ${lobby.activeInstance.instanceId?.slice(0, 8)}…`;
  }, [lobby.activeInstance]);

  const toggleAutoDungeon = (enabled: boolean) => {
    lobby.updateAutoPrefs({ autoJoinDungeon: enabled });
    if (enabled && lobby.lobbyPhase === 'idle') {
      lobby.joinDungeonQueue(lobby.autoPrefs.preferredDungeonDifficulty);
      onDungeonQueueChange?.();
    }
  };

  const toggleAutoRaid = (enabled: boolean) => {
    lobby.updateAutoPrefs({ autoJoinRaid: enabled });
    if (enabled && lobby.lobbyPhase === 'idle') {
      lobby.quickJoinRaid();
    }
  };

  return (
    <div className="rounded-xl border-2 border-cyan-700/60 bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-lg space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Activity lobby</div>
          <h2 className="text-xl font-bold text-white">{phaseLabel(lobby.lobbyPhase)}</h2>
          {instanceLabel && (
            <p className="text-sm text-green-300 mt-1">
              Active: {instanceLabel} — combat plays on the Clean Battlefield overlay.
            </p>
          )}
          {hero?.currentBattlefieldId && (
            <p className="text-xs text-gray-400 mt-1">
              Battlefield: <span className="text-gray-200">{hero.currentBattlefieldId}</span>
            </p>
          )}
        </div>
        {watchTwitchId && (
          <button
            type="button"
            onClick={() => openCleanBattlefield(watchTwitchId, { darkMode: true })}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold"
          >
            Open battlefield view
          </button>
        )}
      </div>

      {lobby.statusMessage && (
        <p className="text-sm text-yellow-100 bg-yellow-900/40 border border-yellow-600 rounded-lg px-3 py-2">
          {lobby.statusMessage}
        </p>
      )}

      {lobby.lobbyPhase === 'dungeon_queue' && lobby.dungeonQueue && (
        <div className="rounded-lg border border-orange-600 bg-orange-950/30 p-4 text-sm text-gray-200 space-y-2">
          <div className="font-semibold text-orange-300">Dungeon queue</div>
          <div>
            Role: {lobby.dungeonQueue.role} · Difficulty: {lobby.dungeonQueue.dungeonType}
          </div>
          {lobby.dungeonQueue.roleCounts && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <span>
                T {lobby.dungeonQueue.roleCounts.tank || 0}/1
              </span>
              <span>
                H {lobby.dungeonQueue.roleCounts.healer || 0}/1
              </span>
              <span>
                D {lobby.dungeonQueue.roleCounts.dps || 0}/3
              </span>
            </div>
          )}
          <button
            type="button"
            disabled={lobby.busy}
            onClick={async () => {
              await lobby.leaveDungeonQueue();
              onDungeonQueueChange?.();
            }}
            className="w-full mt-2 py-2 rounded bg-red-600 hover:bg-red-700 font-semibold text-white"
          >
            Leave dungeon queue
          </button>
        </div>
      )}

      {lobby.lobbyPhase === 'raid_queue' && (
        <div className="space-y-2">
          {lobby.raidQueues.map((rq) => (
            <div
              key={rq.raidId}
              className="rounded-lg border border-purple-600 bg-purple-950/30 p-3 text-sm flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-purple-200">{rq.raidName}</div>
                <div className="text-gray-400 text-xs">
                  {rq.queueSize}/{rq.minPlayers}+ players
                  {rq.roleCounts &&
                    ` · T${rq.roleCounts.tank} H${rq.roleCounts.healer} D${rq.roleCounts.dps}`}
                </div>
              </div>
              <button
                type="button"
                disabled={lobby.busy}
                onClick={() => lobby.leaveRaidQueue(rq.raidId)}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Leave
              </button>
            </div>
          ))}
        </div>
      )}

      {lobby.battlefieldQueue && (
        <div className="rounded-lg border border-purple-500 bg-purple-950/20 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm text-purple-300 font-semibold">{lobby.battlefieldQueue.name}</div>
              <div className="text-3xl font-bold tracking-widest text-white">
                {lobby.battlefieldQueue.code}
              </div>
            </div>
            {lobby.battlefieldQueue.isReady && (
              <div className="text-green-300 text-sm font-semibold animate-pulse">
                {lobby.launchCountdownSec != null && lobby.launchCountdownSec > 0
                  ? `Launching in ${lobby.launchCountdownSec}s`
                  : 'Group ready — launching…'}
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={lobby.busy || !hero}
            onClick={handleJoinStreamerQueue}
            className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 font-semibold text-white disabled:opacity-50"
          >
            One-click join streamer party
          </button>
          <p className="text-xs text-gray-400">
            Requires <code className="text-green-400">!join</code> on the streamer&apos;s channel first so your hero
            is on their battlefield.
          </p>
        </div>
      )}

      {lobby.lobbyPhase === 'idle' && (
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            disabled={lobby.busy || !hero}
            onClick={async () => {
              await lobby.joinDungeonQueue(lobby.autoPrefs.preferredDungeonDifficulty);
              onDungeonQueueChange?.();
            }}
            className="py-3 rounded-lg bg-orange-600 hover:bg-orange-700 font-semibold text-white disabled:opacity-50"
          >
            One-click join dungeon LFG
          </button>
          <button
            type="button"
            disabled={lobby.busy || !hero || !availableRaids.length}
            onClick={() => lobby.quickJoinRaid()}
            className="py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold text-white disabled:opacity-50"
          >
            One-click join best raid LFG
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-6 text-sm text-gray-300 border-t border-gray-700 pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lobby.autoPrefs.autoJoinDungeon}
            onChange={(e) => toggleAutoDungeon(e.target.checked)}
            className="rounded"
          />
          Auto-queue dungeons when idle
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lobby.autoPrefs.autoJoinRaid}
            onChange={(e) => toggleAutoRaid(e.target.checked)}
            className="rounded"
          />
          Auto-queue raids when idle
        </label>
      </div>

      {showStreamerTools && (
        <StreamerEventPanel twitchId={user?.twitchId} twitchUsername={user?.twitchUsername} compact />
      )}

      {watchTwitchId && (
        <p className="text-xs text-gray-500">
          Overlay: {getCleanBattlefieldUrl(watchTwitchId, { darkMode: true })}
        </p>
      )}
    </div>
  );
}
