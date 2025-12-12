import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dungeonAPI, heroAPI, partyAPI } from '../api/client';
import PartyQueueModal from '../components/PartyQueueModal';

interface Dungeon {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  minLevel?: number;
  minItemScore?: number;
  description?: string;
  available: boolean;
}

export default function DungeonFinderPage() {
  const { user } = useAuth();
  const [hero, setHero] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [dungeonType, setDungeonType] = useState<'normal' | 'heroic' | 'mythic'>('normal');
  const [selectedDungeonId, setSelectedDungeonId] = useState<string>('');
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [party, setParty] = useState<any>(null);
  const [showPartyQueueModal, setShowPartyQueueModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadHero();
      loadDungeons();
      loadParty();
      checkQueueStatus();
      const interval = setInterval(() => {
        checkQueueStatus();
        loadParty();
      }, 5000);
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

  const loadDungeons = async () => {
    try {
      const data = await dungeonAPI.getAllDungeons();
      setDungeons(data || []);
      // Set default to first available dungeon
      const availableDungeon = data?.find((d: Dungeon) => d.available);
      if (availableDungeon) {
        setSelectedDungeonId(availableDungeon.id);
      }
    } catch (err) {
      console.error('Failed to load dungeons:', err);
    }
  };

  const loadParty = async () => {
    try {
      const userId = user?.twitchId || user?.id;
      if (!userId) return;
      const response = await partyAPI.getParty(userId);
      if (response.success && response.party) {
        setParty(response.party);
      } else {
        setParty(null);
      }
    } catch (err) {
      console.error('Failed to load party:', err);
      setParty(null);
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
        dungeonType,
        selectedDungeonId || undefined
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
            <label className="block mb-2 font-semibold">Select Dungeon</label>
            <select
              value={selectedDungeonId}
              onChange={(e) => setSelectedDungeonId(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="">-- Select Dungeon --</option>
              {dungeons
                .filter(d => d.available)
                .map(dungeon => (
                  <option key={dungeon.id} value={dungeon.id}>
                    {dungeon.name} ({dungeon.difficulty})
                    {dungeon.minLevel && ` - Lv${dungeon.minLevel}+`}
                    {dungeon.minItemScore && ` - ${dungeon.minItemScore}+ Item Score`}
                  </option>
                ))}
            </select>
            {selectedDungeonId && (
              <div className="mt-2 text-sm text-gray-600">
                {dungeons.find(d => d.id === selectedDungeonId)?.description}
              </div>
            )}
          </div>
          
          <div>
            <label className="block mb-2 font-semibold">Difficulty</label>
            <select
              value={dungeonType}
              onChange={(e) => setDungeonType(e.target.value as any)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="normal">Normal</option>
              <option value="heroic">Heroic</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleJoinQueue}
              disabled={!selectedDungeonId}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Queue as {role.toUpperCase()}
            </button>
            
            {party && party.status === 'forming' && party.leaderId === (user?.twitchId || user?.id) && (
              <button
                onClick={() => {
                  setShowPartyQueueModal(true);
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Join as Party
              </button>
            )}
          </div>
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

      {/* Party Queue Modal */}
      {showPartyQueueModal && party && (
        <PartyQueueModal
          partyId={party.id}
          partyMembers={party.memberData || []}
          initialSelectedDungeonId={selectedDungeonId}
          onClose={() => setShowPartyQueueModal(false)}
          onQueued={() => {
            loadParty();
            checkQueueStatus();
          }}
        />
      )}
    </div>
  );
}
