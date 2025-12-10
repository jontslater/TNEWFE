import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { leaderboardAPI } from '../api/client';
import { formatNumber } from '../utils/format';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  heroName?: string;
  value: number;
  heroLevel?: number;
  heroRole?: string;
  guildName?: string;
}

export default function LeaderboardsPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<'global' | 'guild'>('global');
  const [category, setCategory] = useState<'level' | 'damage' | 'healing' | 'guildLevel' | 'achievements' | 'gold' | 'itemScore'>('level');
  const [userRankings, setUserRankings] = useState<Record<string, { rank: number; value: number }>>({});
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  useEffect(() => {
    loadLeaderboard();
    if (user?.id) {
      loadUserRankings();
    }
  }, [type, category, timeframe, user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await leaderboardAPI.getLeaderboard(type, category, timeframe !== 'all' ? timeframe : undefined);
      setLeaderboard(Array.isArray(data) ? data : (data.entries || []));
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRankings = async () => {
    if (!user?.id) return;
    try {
      const rankings = await leaderboardAPI.getUserRankings(user.id);
      setUserRankings(rankings);
    } catch (err) {
      console.error('Failed to load user rankings:', err);
    }
  };

  const categories = [
    { id: 'level', name: 'Level', icon: '⭐' },
    { id: 'damage', name: 'Damage Dealt', icon: '⚔️' },
    { id: 'healing', name: 'Healing Done', icon: '💚' },
    { id: 'itemScore', name: 'Item Score', icon: '💎' },
    { id: 'gold', name: 'Gold', icon: '💰' },
    { id: 'achievements', name: 'Achievements', icon: '🏆' },
    { id: 'guildLevel', name: 'Guild Level', icon: '👑' }
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-400';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Leaderboards</h1>
        <p className="text-gray-400">Compete with players from around the world!</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'global' | 'guild')}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="global">Global</option>
              <option value="guild">Guild</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">All Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* User's Rank */}
      {userRankings[category] && (
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Your Rank</div>
              <div className="text-3xl font-bold text-white">
                {getRankIcon(userRankings[category].rank)} Rank #{userRankings[category].rank}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Your {categories.find(c => c.id === category)?.name}</div>
              <div className="text-2xl font-bold text-yellow-400">
                {formatNumber(userRankings[category].value)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl">Loading leaderboard...</div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Player</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Hero</th>
                  {type === 'guild' && (
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">Guild</th>
                  )}
                  <th className="px-6 py-4 text-right text-gray-400 font-semibold">
                    {categories.find(c => c.id === category)?.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={type === 'guild' ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.userId === user?.id;
                    return (
                      <tr
                        key={entry.userId}
                        className={`border-t border-gray-700 hover:bg-gray-750 transition-colors ${
                          isCurrentUser ? 'bg-blue-900/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className={`text-xl font-bold ${getRankColor(entry.rank)}`}>
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{entry.username}</div>
                          {entry.heroLevel && (
                            <div className="text-sm text-gray-400">Level {entry.heroLevel}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {entry.heroName && (
                            <>
                              <div className="text-white">{entry.heroName}</div>
                              {entry.heroRole && (
                                <div className="text-sm text-gray-400 capitalize">{entry.heroRole}</div>
                              )}
                            </>
                          )}
                        </td>
                        {type === 'guild' && (
                          <td className="px-6 py-4">
                            {entry.guildName ? (
                              <div className="text-purple-400">{entry.guildName}</div>
                            ) : (
                              <div className="text-gray-500">No Guild</div>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <div className="text-lg font-bold text-yellow-400">
                            {formatNumber(entry.value)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
