import { useState, useEffect, useRef } from 'react';
import PartyPanel from './PartyPanel';
import ChatPanel from './ChatPanel';
import MailPanel from './MailPanel';
import { Hero } from '../types/Hero';
import { useAuth } from '../hooks/useAuth';
import { partyAPI, guildAPI } from '../api/client';

interface SocialSidebarProps {
  hero: Hero | null;
  onPartyUpdate?: () => void;
  whisperRequest?: { heroId: string; heroName: string } | null;
  onWhisperRequestHandled?: () => void;
}

export default function SocialSidebar({ hero, onPartyUpdate, whisperRequest, onWhisperRequestHandled }: SocialSidebarProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'party' | 'chat' | 'mail'>('party');
  const [currentPartyId, setCurrentPartyId] = useState<string | undefined>(undefined);
  const [party, setParty] = useState<any>(null);
  const [queueTime, setQueueTime] = useState<number | null>(null);
  const [cancellingQueue, setCancellingQueue] = useState(false);
  const [guildId, setGuildId] = useState<string | undefined>(undefined);

  // Switch to chat section when whisper is requested
  useEffect(() => {
    if (whisperRequest) {
      console.log('[SocialSidebar] Switching to chat for whisper:', whisperRequest);
      setActiveSection('chat');
      // Ensure we stay on chat section
    }
  }, [whisperRequest]);

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

  // Load hero's guild (guilds are per-hero, not per-user)
  // Use a ref to track if we're currently loading to prevent multiple simultaneous calls
  const loadingGuildRef = useRef(false);
  const lastGuildCheckRef = useRef<{ heroId: string | null; guildId: string | null }>({ heroId: null, guildId: null });
  
  useEffect(() => {
    const loadGuild = async () => {
      if (!hero || !hero.id) {
        setGuildId(undefined);
        lastGuildCheckRef.current = { heroId: null, guildId: null };
        return;
      }

      // Prevent multiple simultaneous calls
      if (loadingGuildRef.current) {
        return;
      }

      // Guilds store memberIds as hero IDs, so we need to look up by hero ID
      const heroId = hero.id;
      
      // Skip if we just checked this hero and got the same result
      if (lastGuildCheckRef.current.heroId === heroId) {
        // Only skip if we're polling (not initial load)
        const timeSinceLastCheck = Date.now() - (lastGuildCheckRef.current as any).lastCheckTime || 0;
        if (timeSinceLastCheck < 4000) { // Less than 4 seconds since last check
          return;
        }
      }
      
      try {
        loadingGuildRef.current = true;
        const guild = await guildAPI.getMyGuild(heroId);
        const currentGuildId = guild?.id || null;
        
        // Only update if guild ID actually changed
        if (lastGuildCheckRef.current.guildId !== currentGuildId) {
          console.log('[SocialSidebar] Guild lookup for hero:', { heroId, heroName: hero.name, guild: currentGuildId || null });
          if (guild && guild.id) {
            console.log('[SocialSidebar] Guild found for hero:', { heroId, heroName: hero.name, guildId: guild.id });
            setGuildId(guild.id);
          } else {
            setGuildId(undefined);
          }
          lastGuildCheckRef.current = { 
            heroId, 
            guildId: currentGuildId,
            lastCheckTime: Date.now() as any
          };
        } else {
          // Same guild, just update timestamp
          (lastGuildCheckRef.current as any).lastCheckTime = Date.now();
        }
      } catch (error) {
        console.error(`[SocialSidebar] Failed to load guild for hero ${heroId}:`, error);
        setGuildId(undefined);
        lastGuildCheckRef.current = { heroId, guildId: null, lastCheckTime: Date.now() as any };
      } finally {
        loadingGuildRef.current = false;
      }
    };

    loadGuild();
    // Poll for guild updates every 10 seconds (reduced frequency to prevent spam)
    const interval = setInterval(loadGuild, 10000);
    return () => clearInterval(interval);
  }, [hero]);

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
          <ChatPanel 
            hero={hero} 
            partyId={currentPartyId} 
            partyLeaderId={party?.leaderId} 
            guildId={guildId} 
            onPartyUpdate={onPartyUpdate}
            whisperRequest={whisperRequest}
            onWhisperRequestHandled={onWhisperRequestHandled}
          />
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
