/**
 * Stream Status Banner
 * 
 * Shows which stream the player is currently active on.
 * Clearly indicates when they join a new stream (which removes them from any previous stream).
 */

import { useEffect, useState } from 'react';

interface StreamStatusBannerProps {
  currentBattlefieldId?: string;
  heroName?: string;
  onStreamChange?: (newStreamId: string) => void;
}

export default function StreamStatusBanner({ 
  currentBattlefieldId, 
  heroName,
  onStreamChange 
}: StreamStatusBannerProps) {
  const [previousBattlefieldId, setPreviousBattlefieldId] = useState<string | undefined>(currentBattlefieldId);
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (currentBattlefieldId && currentBattlefieldId !== previousBattlefieldId && previousBattlefieldId) {
      // Stream changed - show transition notification
      setShowTransition(true);
      onStreamChange?.(currentBattlefieldId);
      
      setTimeout(() => {
        setShowTransition(false);
      }, 5000);
    }
    
    setPreviousBattlefieldId(currentBattlefieldId);
  }, [currentBattlefieldId, previousBattlefieldId, onStreamChange]);

  if (!currentBattlefieldId) {
    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            ⚠️ Not currently active in any stream
          </span>
        </div>
      </div>
    );
  }

  // Extract streamer name from battlefieldId (format: "twitch:username")
  const streamerName = currentBattlefieldId.replace('twitch:', '');

  return (
    <>
      {/* Main status banner */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 border border-purple-600 rounded-lg p-3 mb-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <div className="text-sm text-purple-300">Currently Active On</div>
              <div className="text-lg font-bold text-white">
                {streamerName}'s Stream
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-purple-300">Battlefield ID</div>
            <div className="text-sm font-mono text-purple-200">{currentBattlefieldId}</div>
          </div>
        </div>
      </div>

      {/* Stream transition notification */}
      {showTransition && (
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔄</span>
            <div>
              <div className="text-lg font-bold text-yellow-200">
                Stream Changed!
              </div>
              <div className="text-sm text-yellow-300">
                {heroName} joined {streamerName}'s stream
              </div>
              <div className="text-xs text-yellow-400 mt-1">
                ℹ️ You've been removed from your previous stream
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
