import { useState, useEffect } from 'react';
import { partyAPI, raidAPI, dungeonAPI } from '../api/client';
import { Raid } from '../types/Raid';

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

interface PartyQueueModalProps {
  partyId: string;
  partyMembers: Array<{
    userId: string;
    username: string;
    heroId: string;
    heroName: string;
    heroRole: string;
    heroLevel: number;
  }>;
  initialSelectedDungeonId?: string;
  onClose: () => void;
  onQueued?: () => void;
}

export default function PartyQueueModal({ partyId, partyMembers, initialSelectedDungeonId, onClose, onQueued }: PartyQueueModalProps) {
  const [queueType, setQueueType] = useState<'dungeon' | 'raid' | null>(null);
  const [selectedRaidId, setSelectedRaidId] = useState<string>('');
  const [selectedDungeonId, setSelectedDungeonId] = useState<string>(initialSelectedDungeonId || '');
  const [fillParty, setFillParty] = useState<boolean>(true); // Default: wait for matchmaking to fill party
  const [raids, setRaids] = useState<Raid[]>([]);
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [loading, setLoading] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadRaids();
    loadDungeons();
  }, []);

  const loadDungeons = async () => {
    try {
      const data = await dungeonAPI.getAllDungeons();
      console.log('[PartyQueueModal] Loaded dungeons:', data?.length || 0, data);
      setDungeons(data || []);
      // Set default to initial selected dungeon if provided, otherwise first available
      if (initialSelectedDungeonId && data?.find((d: Dungeon) => d.id === initialSelectedDungeonId)) {
        setSelectedDungeonId(initialSelectedDungeonId);
      } else {
        const firstDungeon = data?.[0];
        if (firstDungeon) {
          setSelectedDungeonId(firstDungeon.id);
        }
      }
    } catch (error) {
      console.error('[PartyQueueModal] Failed to load dungeons:', error);
      setErrors(prev => [...prev, 'Failed to load dungeons. Please refresh the page.']);
    }
  };

  const loadRaids = async () => {
    try {
      const response = await raidAPI.getRaids();
      // Filter to only show available raids
      const availableRaids = (response || []).filter((r: Raid) => r.available !== false);
      setRaids(availableRaids);
      // Set default to first available raid
      if (availableRaids.length > 0) {
        setSelectedRaidId(availableRaids[0].id);
      }
    } catch (error) {
      console.error('Failed to load raids:', error);
    }
  };

  const getPartyComposition = () => {
    const composition = { tanks: 0, healers: 0, dps: 0 };
    partyMembers.forEach(member => {
      const roleLower = member.heroRole.toLowerCase();
      if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(roleLower)) {
        composition.tanks++;
      } else if (['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(roleLower)) {
        composition.healers++;
      } else {
        composition.dps++;
      }
    });
    return composition;
  };

  const validateParty = () => {
    const composition = getPartyComposition();
    const errors: string[] = [];

    if (queueType === 'dungeon') {
      if (partyMembers.length > 5) {
        errors.push('Dungeon party size limit is 5 members');
      }
      if (!selectedDungeonId) {
        errors.push('Please select a dungeon');
      }
      // Don't validate composition - incomplete parties can queue and matchmaking will fill them
      // The matchmaking system will find individual players to complete the group
    } else if (queueType === 'raid') {
      if (partyMembers.length > 20) {
        errors.push('Raid party size limit is 20 members');
      }
      if (!selectedRaidId) {
        errors.push('Please select a raid');
      }
    }

    return errors;
  };

  const handleQueue = async () => {
    const validationErrors = validateParty();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setQueuing(true);
    setErrors([]);

    try {
      // For dungeons, get the difficulty from the selected dungeon
      const selectedDungeon = queueType === 'dungeon' ? dungeons.find(d => d.id === selectedDungeonId) : null;
      const dungeonType = selectedDungeon?.difficulty || 'normal';
      
      const response = await partyAPI.queueParty(
        partyId,
        queueType!,
        queueType === 'raid' ? selectedRaidId : undefined, // raidId
        queueType === 'dungeon' ? dungeonType : undefined, // dungeonType (from selected dungeon's difficulty)
        queueType === 'dungeon' ? selectedDungeonId : undefined, // dungeonId
        fillParty // fillParty for both dungeons and raids
      );

      if (response.success) {
        if (response.errors && response.errors.length > 0) {
          const errorMessages = response.errors.map((e: any) => {
            const member = partyMembers.find(m => m.userId === e.userId);
            const memberName = member ? `${member.username} (${member.heroName})` : e.userId;
            return `${memberName}: ${e.error}`;
          });
          setErrors(errorMessages);
          // Don't close modal if there are errors - let user see them
          return;
        }
        if (onQueued) onQueued();
        onClose();
      } else {
        setErrors([response.message || 'Failed to queue party']);
      }
    } catch (error: any) {
      console.error('Failed to queue party:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setErrors([error.response?.data?.error || error.message || 'Failed to queue party']);
    } finally {
      setQueuing(false);
    }
  };

  const composition = getPartyComposition();
  const selectedRaid = raids.find(r => r.id === selectedRaidId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border-2 border-gray-600 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h4 className="text-xl font-bold text-white mb-4">Queue as Party</h4>

        <div className="space-y-4">
          {/* Queue Type Selection */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Select Queue Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setQueueType('dungeon');
                  setSelectedRaidId('');
                  // Set default dungeon if not already set
                  if (!selectedDungeonId && dungeons.length > 0) {
                    const availableDungeon = dungeons.find(d => d.available);
                    if (availableDungeon) {
                      setSelectedDungeonId(availableDungeon.id);
                    }
                  }
                  setErrors([]);
                }}
                className={`flex-1 px-4 py-3 rounded font-semibold transition-colors ${
                  queueType === 'dungeon'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🏰 Dungeon
                <div className="text-xs mt-1 opacity-75">Max 5 members</div>
              </button>
              <button
                onClick={() => {
                  setQueueType('raid');
                  setErrors([]);
                }}
                className={`flex-1 px-4 py-3 rounded font-semibold transition-colors ${
                  queueType === 'raid'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ⚔️ Raid
                <div className="text-xs mt-1 opacity-75">Max 20 members</div>
              </button>
            </div>
          </div>

          {/* Dungeon Selection */}
          {queueType === 'dungeon' && (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Select Dungeon</label>
                <select
                  value={selectedDungeonId}
                  onChange={(e) => {
                    setSelectedDungeonId(e.target.value);
                    setErrors([]);
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Select Dungeon --</option>
                  {dungeons.map(dungeon => (
                      <option key={dungeon.id} value={dungeon.id}>
                        {dungeon.name} ({dungeon.difficulty})
                        {dungeon.minLevel && ` - Lv${dungeon.minLevel}+`}
                        {dungeon.minItemScore && ` - ${dungeon.minItemScore}+ Item Score`}
                      </option>
                    ))}
                </select>
                {selectedDungeonId && (() => {
                  const selectedDungeon = dungeons.find(d => d.id === selectedDungeonId);
                  return selectedDungeon ? (
                    <div className="mt-2 text-xs text-gray-400">
                      <div>{selectedDungeon.description}</div>
                      <div className="mt-1 text-gray-500">
                        Difficulty: <span className="font-semibold capitalize">{selectedDungeon.difficulty}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Fill Party Toggle */}
              <div className="p-3 bg-gray-700/50 rounded border border-gray-600">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fillParty}
                    onChange={(e) => setFillParty(e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-600 border-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">Fill Party with Matchmaking</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {fillParty 
                        ? `Wait for matchmaking to fill party up to ${dungeons.find(d => d.id === selectedDungeonId)?.maxPlayers || 5} players`
                        : `Start immediately with ${partyMembers.length} party member(s) (if dungeon allows ${partyMembers.length} players)`
                      }
                    </div>
                  </div>
                </label>
              </div>
            </>
          )}

          {/* Raid Selection */}
          {queueType === 'raid' && (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Select Raid</label>
                <select
                  value={selectedRaidId}
                  onChange={(e) => {
                    setSelectedRaidId(e.target.value);
                    setErrors([]);
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Select Raid --</option>
                  {raids.map(raid => (
                    <option key={raid.id} value={raid.id}>
                      {raid.name} ({raid.difficulty}) - Lv{(raid as any).minLevel || raid.boss?.level || 'N/A'}+, {(raid as any).minItemScore || (raid as any).suggestedItemScore || 'N/A'}+ Item Score
                    </option>
                  ))}
                </select>
                {selectedRaid && (
                  <div className="mt-2 text-xs text-gray-400">
                    Requirements: Level {(selectedRaid as any).minLevel || selectedRaid.boss?.level || 'N/A'}+, {(selectedRaid as any).minItemScore || (selectedRaid as any).suggestedItemScore || 'N/A'}+ Item Score
                    <br />
                    Players: {(selectedRaid as any).minPlayers || 5} - {(selectedRaid as any).maxPlayers || 20}
                    {partyMembers.length < ((selectedRaid as any).minPlayers || 5) && (
                      <div className="mt-1 text-amber-400 font-semibold">
                        ⚠️ Party too small! Need at least {(selectedRaid as any).minPlayers || 5} players (you have {partyMembers.length})
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Fill Party Toggle for Raids */}
              <div className="p-3 bg-gray-700/50 rounded border border-gray-600">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fillParty}
                    onChange={(e) => setFillParty(e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-600 border-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">Fill Party with Matchmaking</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {fillParty 
                        ? `Wait for matchmaking to fill party up to ${selectedRaid ? (selectedRaid as any).maxPlayers || 20 : 20} players`
                        : `Start immediately with ${partyMembers.length} party member(s) (if raid allows ${partyMembers.length} players)`
                      }
                    </div>
                  </div>
                </label>
              </div>
            </>
          )}

          {/* Party Composition */}
          <div className="p-3 bg-gray-700 rounded">
            <div className="text-xs text-gray-400 mb-2">Party Composition</div>
            <div className="flex gap-4 text-sm">
              <span className={`${composition.tanks >= 1 ? 'text-blue-400' : 'text-red-400'}`}>
                🛡️ Tanks: {composition.tanks}
              </span>
              <span className={`${composition.healers >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                💚 Healers: {composition.healers}
              </span>
              <span className={`${composition.dps >= 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                ⚔️ DPS: {composition.dps}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Members: {partyMembers.length} / {queueType === 'dungeon' ? 5 : 20}
            </div>
          </div>

          {/* Requirements Check */}
          {queueType === 'dungeon' && (
            <div className="p-3 bg-blue-900/20 border border-blue-600 rounded text-sm">
              <div className="text-blue-300 font-semibold mb-1">Dungeon Requirements:</div>
              <div className="text-blue-200 text-xs space-y-1">
                <div>✓ Target: 1 Tank, 1 Healer, 3 DPS</div>
                <div>✓ Max 5 members</div>
                <div className="text-yellow-300 mt-2">
                  ℹ️ Incomplete parties will be matched with individual players
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded">
              <div className="text-red-300 font-semibold text-sm mb-1">Issues:</div>
              {errors.map((error, idx) => (
                <div key={idx} className="text-red-200 text-xs">{error}</div>
              ))}
            </div>
          )}

          {/* Party Members List */}
          <div className="max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-400 mb-2">Party Members ({partyMembers.length}):</div>
            <div className="space-y-1">
              {partyMembers.map(member => (
                <div key={member.userId} className="text-xs text-gray-300 flex items-center gap-2">
                  <span>{member.username}</span>
                  <span className="text-gray-500">•</span>
                  <span>{member.heroName}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{member.heroRole} Lv{member.heroLevel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleQueue}
            disabled={queuing || !queueType || (queueType === 'raid' && !selectedRaidId) || (queueType === 'dungeon' && !selectedDungeonId) || (queueType === 'raid' && raids.length === 0)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {queuing ? 'Queueing...' : 'Queue Party'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
