import { useState, useEffect } from 'react';
import PartyPanel from './PartyPanel';
import ChatPanel from './ChatPanel';
import MailPanel from './MailPanel';
import { Hero } from '../types/Hero';
import { useAuth } from '../hooks/useAuth';
import { partyAPI } from '../api/client';

interface SocialSidebarProps {
  hero: Hero | null;
  onPartyUpdate?: () => void;
}

export default function SocialSidebar({ hero, onPartyUpdate }: SocialSidebarProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'party' | 'chat' | 'mail'>('party');
  const [currentPartyId, setCurrentPartyId] = useState<string | undefined>(undefined);
  const [party, setParty] = useState<any>(null);
  const [queueTime, setQueueTime] = useState<number | null>(null);
  const [cancellingQueue, setCancellingQueue] = useState(false);

  // Load current party ID and queue status for all tabs
  useEffect(() => {
    const loadParty = async () => {
      if (!user) {
        setCurrentPartyId(undefined);
        setParty(null);
        setQueueTime(null);
        return;
      }

      const userId = user.twitchId || user.id;
      if (!userId) return;

      try {
        const response = await partyAPI.getParty(userId);
        if (response.success && response.party) {
          setCurrentPartyId(response.party.id);
          setParty(response.party);
          
          // Get queue time if in queue
          if (response.party.status === 'queued') {
            if (response.party.updatedAt) {
              const updatedAt = response.party.updatedAt?.toMillis?.() || response.party.updatedAt || Date.now();
              setQueueTime(updatedAt);
            } else {
              setQueueTime(Date.now());
            }
          } else {
            setQueueTime(null);
          }
        } else {
          setCurrentPartyId(undefined);
          setParty(null);
          setQueueTime(null);
        }
      } catch (error) {
        console.error('Failed to load party for chat:', error);
        setCurrentPartyId(undefined);
        setParty(null);
        setQueueTime(null);
      }
    };

    loadParty();
    // Poll for party updates every 5 seconds
    const interval = setInterval(loadParty, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCancelQueue = async () => {
    if (!party || !user) return;
    
    if (!confirm('Are you sure you want to cancel the queue? This will remove all party members from the queue.')) {
      return;
    }

    setCancellingQueue(true);
    try {
      const userId = user.twitchId || user.id || '';
      const response = await partyAPI.cancelQueue(party.id, userId);
      if (response.success) {
        // Reload party
        const reloadResponse = await partyAPI.getParty(userId);
        if (reloadResponse.success) {
          setParty(reloadResponse.party);
          setQueueTime(null);
        }
        if (onPartyUpdate) onPartyUpdate();
      } else {
        alert(response.message || 'Failed to cancel queue');
      }
    } catch (error: any) {
      console.error('Failed to cancel queue:', error);
      alert(error.response?.data?.error || 'Failed to cancel queue');
    } finally {
      setCancellingQueue(false);
    }
  };

  // Format queue time
  const formatQueueTime = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Check if user is party leader
  const isLeader = party && user && (party.leaderId === (user.twitchId || user.id));

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="bg-gray-800 rounded-lg p-2 border border-gray-700 flex gap-2">
        <button
          onClick={() => setActiveSection('party')}
          className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-colors ${
            activeSection === 'party'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          👥 Party
        </button>
        <button
          onClick={() => setActiveSection('mail')}
          className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-colors ${
            activeSection === 'mail'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📬 Mail
        </button>
        <button
          onClick={() => setActiveSection('chat')}
          className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-colors ${
            activeSection === 'chat'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          💬 Chat
        </button>
      </div>

      {/* Content */}
      <div className="sticky top-4">
        {activeSection === 'party' && hero ? (
          <PartyPanel hero={hero} onPartyUpdate={onPartyUpdate} />
        ) : activeSection === 'mail' && hero ? (
          <MailPanel hero={hero} />
        ) : activeSection === 'chat' ? (
          <ChatPanel hero={hero} partyId={currentPartyId} partyLeaderId={party?.leaderId} onPartyUpdate={onPartyUpdate} />
        ) : null}
      </div>

      {/* Queue Status Bar - Always Visible at Bottom */}
      {party && party.status === 'queued' && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
          <div className="w-full bg-purple-900/50 border border-purple-600 text-white font-semibold px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⏳ In Queue</span>
                {party.queueType && (
                  <span className="text-xs text-purple-300">
                    ({party.queueType === 'dungeon' ? '🏰 Dungeon' : '⚔️ Raid'})
                  </span>
                )}
              </div>
              {queueTime && (
                <div className="text-sm font-normal text-purple-200">
                  {formatQueueTime(queueTime)}
                </div>
              )}
            </div>
          </div>
          {isLeader && (
            <button
              onClick={handleCancelQueue}
              disabled={cancellingQueue}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancellingQueue ? 'Cancelling...' : '❌ Cancel Queue'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
