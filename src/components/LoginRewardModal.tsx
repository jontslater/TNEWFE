import { useState, useEffect } from 'react';
import { loginRewardAPI } from '../api/client';

interface LoginRewardModalProps {
  userId: string;
  provider?: 'twitch' | 'tiktok';
  onClose: () => void;
}

export default function LoginRewardModal({ userId, provider = 'twitch', onClose }: LoginRewardModalProps) {
  const [status, setStatus] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [userId, provider]);

  const loadStatus = async () => {
    try {
      const data = await loginRewardAPI.getStatus(userId, provider);
      setStatus(data);
    } catch (err) {
      console.error('Failed to load login reward status:', err);
    }
  };

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const result = await loginRewardAPI.claimReward(userId, provider);
      setClaimed(true);
      setStatus(result);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  if (!status) {
    return null;
  }

  const reward = status.nextReward;
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 p-8 rounded-2xl max-w-3xl w-full mx-4 border-2 border-yellow-500 shadow-2xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-light transition-colors z-10"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="text-5xl mb-2">🎁</div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 mb-2">
            Daily Login Reward
          </h2>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-700">
              <div className="text-blue-300 text-xs mb-1">Streak</div>
              <div className="text-yellow-400 font-bold text-lg">{status.rewardStreak || status.consecutiveDays || 0} days</div>
            </div>
            <div className="bg-purple-900/50 px-4 py-2 rounded-lg border border-purple-700">
              <div className="text-purple-300 text-xs mb-1">Total</div>
              <div className="text-purple-400 font-bold text-lg">{status.totalLoginDays || status.totalDays || 0} days</div>
            </div>
          </div>
        </div>

        {/* 7-Day Reward Cycle */}
        <div className="mb-6 relative z-10">
          <h3 className="text-xl font-bold text-white mb-4 text-center">7-Day Reward Cycle</h3>
          <div className="grid grid-cols-7 gap-3">
            {days.map((day) => {
              const dayReward = getDayReward(day);
              const isCurrentDay = day === status.currentRewardDay;
              const isPastDay = day < status.currentRewardDay;
              const isClaimed = isPastDay || (isCurrentDay && claimed);
              
              return (
                <div
                  key={day}
                  className={`relative p-4 rounded-xl border-2 text-center transition-all transform hover:scale-105 ${
                    isCurrentDay && !claimed
                      ? 'border-yellow-500 bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 shadow-lg shadow-yellow-500/50'
                      : isClaimed
                      ? 'border-green-500 bg-gradient-to-br from-green-900/50 to-green-800/30'
                      : 'border-gray-700 bg-gray-800/50 opacity-60'
                  }`}
                >
                  <div className={`font-bold text-lg mb-2 ${
                    isCurrentDay && !claimed ? 'text-yellow-400' : isClaimed ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    Day {day}
                  </div>
                  <div className={`text-sm mb-1 ${
                    isCurrentDay && !claimed ? 'text-yellow-300' : isClaimed ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    <span className="text-yellow-400 font-semibold">{dayReward.gold}g</span>
                    {dayReward.tokens > 0 && (
                      <span className="text-blue-400 font-semibold"> + {dayReward.tokens}t</span>
                    )}
                  </div>
                  {isCurrentDay && !claimed && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      NEXT
                    </div>
                  )}
                  {isClaimed && (
                    <div className="text-green-400 text-xl">✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Section */}
        {status.canClaim && !claimed && (
          <div className="mb-4 p-6 bg-gradient-to-r from-yellow-900/50 to-yellow-800/30 rounded-xl border-2 border-yellow-500 relative z-10">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-yellow-400 mb-2">Today's Reward</div>
              <div className="flex items-center justify-center gap-4 text-xl">
                <div className="bg-gray-800 px-4 py-2 rounded-lg border border-yellow-600">
                  <span className="text-yellow-400 font-bold">{reward?.gold || 0}</span>
                  <span className="text-yellow-300 ml-1">Gold</span>
                </div>
                {reward?.tokens && (
                  <div className="bg-gray-800 px-4 py-2 rounded-lg border border-blue-600">
                    <span className="text-blue-400 font-bold">{reward.tokens}</span>
                    <span className="text-blue-300 ml-1">Tokens</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-yellow-500/50"
            >
              {claiming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Claiming...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🎉 Claim Reward
                </span>
              )}
            </button>
          </div>
        )}

        {/* Claimed Success */}
        {claimed && (
          <div className="mb-4 p-6 bg-gradient-to-r from-green-900/50 to-green-800/30 rounded-xl border-2 border-green-500 relative z-10 animate-pulse">
            <div className="text-center">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-2xl font-bold text-green-400 mb-2">Reward Claimed!</div>
              <div className="text-green-300">Check your inventory for your rewards.</div>
            </div>
          </div>
        )}

        {/* Already Claimed */}
        {!status.canClaim && !claimed && (
          <div className="mb-4 p-6 bg-gray-800/50 rounded-xl border border-gray-700 relative z-10">
            <div className="text-center">
              <div className="text-gray-400 mb-2">You've already claimed today's reward!</div>
              <div className="text-sm text-gray-500">
                Come back tomorrow for day {status.currentRewardDay === 7 ? 1 : (status.currentRewardDay || 1) + 1}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getDayReward(day: number) {
  const rewards = [
    { day: 1, gold: 50, tokens: 0 },
    { day: 2, gold: 75, tokens: 0 },
    { day: 3, gold: 100, tokens: 5 },
    { day: 4, gold: 125, tokens: 5 },
    { day: 5, gold: 150, tokens: 10 },
    { day: 6, gold: 200, tokens: 10 },
    { day: 7, gold: 250, tokens: 25 }
  ];
  return rewards[day - 1] || { gold: 0, tokens: 0 };
}
