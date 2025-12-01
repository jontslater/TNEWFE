import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dungeonAPI, heroAPI } from '../api/client';

export default function DungeonFinderPage() {
  const { user } = useAuth();
  const [hero, setHero] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [dungeonType, setDungeonType] = useState<'normal' | 'heroic' | 'mythic'>('normal');

  useEffect(() => {
    if (user?.id) {
      loadHero();
      checkQueueStatus();
      const interval = setInterval(checkQueueStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadHero = async () => {
    try {
      const data = await heroAPI.getHero(user!.id);
      setHero(data);
    } catch (err) {
      console.error('Failed to load hero:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkQueueStatus = async () => {
    try {
      const status = await dungeonAPI.getQueueStatus(user!.id);
      setQueueStatus(status);
      setInQueue(status.inQueue || false);
    } catch (err) {
      console.error('Failed to check queue status:', err);
    }
  };

  const handleJoinQueue = async () => {
    if (!hero) return;

    const category = getCategoryFromRole(hero.role);
    const itemScore = calculateItemScore(hero);

    try {
      await dungeonAPI.joinQueue(
        user!.id,
        hero.id || user!.id,
        category,
        itemScore,
        dungeonType
      );
      setInQueue(true);
      checkQueueStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join queue');
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await dungeonAPI.leaveQueue(user!.id);
      setInQueue(false);
      setQueueStatus(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to leave queue');
    }
  };

  const getCategoryFromRole = (role: string) => {
    const config = {
      guardian: 'tank',
      paladin: 'tank',
      warden: 'tank',
      bloodknight: 'tank',
      vanguard: 'tank',
      brewmaster: 'tank',
      cleric: 'healer',
      atoner: 'healer',
      druid: 'healer',
      lightbringer: 'healer',
      shaman: 'healer',
      mistweaver: 'healer',
      chronomancer: 'healer'
    };
    return config[role as keyof typeof config] || 'dps';
  };

  const calculateItemScore = (hero: any) => {
    let score = 0;
    const equipment = hero.equipment || {};
    Object.values(equipment).forEach((item: any) => {
      if (item) {
        score += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
      }
    });
    return score;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!hero) {
    return <div className="p-8">Please create a hero first.</div>;
  }

  const role = getCategoryFromRole(hero.role);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dungeon Finder</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <div className="font-bold mb-2">Your Hero</div>
        <div>Name: {hero.name || 'Unknown'}</div>
        <div>Class: {hero.role}</div>
        <div>Role: {role}</div>
        <div>Level: {hero.level || 1}</div>
        <div>Item Score: {calculateItemScore(hero)}</div>
      </div>

      {!inQueue ? (
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Dungeon Type</label>
            <select
              value={dungeonType}
              onChange={(e) => setDungeonType(e.target.value as any)}
              className="p-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="heroic">Heroic</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>
          <button
            onClick={handleJoinQueue}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Join Queue as {role.toUpperCase()}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-100 rounded">
            <div className="font-bold mb-2">In Queue</div>
            <div>Role: {queueStatus?.role || role}</div>
            <div>Dungeon Type: {queueStatus?.dungeonType || dungeonType}</div>
            <div className="mt-2">
              <div>Queue Time: {Math.floor((Date.now() - (queueStatus?.queueTime || Date.now())) / 1000)}s</div>
              {queueStatus?.roleCounts && (
                <div className="mt-2">
                  <div>Queue Status:</div>
                  <div>Tanks: {queueStatus.roleCounts.tank || 0}</div>
                  <div>Healers: {queueStatus.roleCounts.healer || 0}</div>
                  <div>DPS: {queueStatus.roleCounts.dps || 0}</div>
                </div>
              )}
              {queueStatus?.estimatedWait && (
                <div className="mt-2">
                  Estimated Wait: ~{queueStatus.estimatedWait}s
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleLeaveQueue}
            className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Leave Queue
          </button>
        </div>
      )}
    </div>
  );
}
