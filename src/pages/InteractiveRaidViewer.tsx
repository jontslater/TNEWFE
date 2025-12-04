/**
 * Interactive Raid Viewer
 * 
 * For guilds who want to play together without streaming!
 * - Multiple players can view the same raid instance
 * - Real-time combat synchronized via Firebase
 * - Chat box for communication
 * - Combat log showing all actions
 * - Action buttons for manual control (abilities, potions, etc.)
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../hooks/useAuth';
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';

interface CombatLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'damage' | 'heal' | 'ability' | 'death' | 'phase';
  actorName?: string;
  targetName?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export default function InteractiveRaidViewer() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const { user } = useAuth();
  
  // Instance state
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Combat log
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const combatLogRef = useRef<HTMLDivElement>(null);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Load raid instance from Firebase (real-time)
  useEffect(() => {
    if (!instanceId) return;
    
    console.log('[Interactive Viewer] Loading raid instance:', instanceId);
    
    const instanceRef = doc(db, 'raidInstances', instanceId);
    
    const unsubscribe = onSnapshot(instanceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() };
        console.log('[Interactive Viewer] Instance updated:', data);
        setInstance(data);
        
        // Update combat log from instance
        if (data.combatLog) {
          setCombatLog(data.combatLog);
        }
        
        setLoading(false);
      } else {
        console.error('[Interactive Viewer] Instance not found');
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [instanceId]);
  
  // Auto-scroll combat log and chat
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [combatLog]);
  
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Send chat message
  const sendChatMessage = () => {
    if (!chatInput.trim() || !user) return;
    
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      userId: user.id || user.twitchId || 'unknown',
      username: user.twitchUsername || user.displayName || 'Player',
      message: chatInput.trim(),
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    
    // TODO: Sync to Firebase for other viewers
    console.log('[Chat] Message sent:', newMessage);
  };
  
  // Use ability button
  const useAbility = (abilityName: string) => {
    console.log(`[Action] Using ability: ${abilityName}`);
    // TODO: Send to backend to execute ability
  };
  
  // Use potion button
  const usePotion = () => {
    console.log('[Action] Using health potion');
    // TODO: Send to backend to use potion
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-2xl">Loading raid...</div>
      </div>
    );
  }
  
  if (!instance) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-400 text-2xl">Raid not found</div>
      </div>
    );
  }
  
  const participants = instance.participants || [];
  const boss = instance.boss;
  const currentWave = instance.currentWave || 1;
  const totalWaves = instance.waves || 5;
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Side: Combat View (70%) */}
      <div className="flex-1 relative bg-black">
        {/* Combat Arena */}
        <div className="relative w-full h-full">
          {/* Wave Info */}
          <div className="absolute top-4 left-4 text-white text-xl font-bold z-10">
            Wave {currentWave} / {totalWaves}
          </div>
          
          {/* Heroes */}
          <div className="absolute bottom-32 left-8 flex gap-8">
            {participants.map((participant: any, index: number) => (
              <div key={participant.heroId || index} className="text-center">
                <div className="text-white text-sm mb-2">{participant.heroName || participant.username}</div>
                <div className="w-24 h-2 bg-gray-700 rounded-full mb-2">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(participant.currentHp / participant.maxHp) * 100}%` }}
                  />
                </div>
                {/* Hero sprite would go here */}
                <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                  🦸
                </div>
              </div>
            ))}
          </div>
          
          {/* Boss */}
          {boss && (
            <div className="absolute bottom-32 right-8">
              <div className="text-red-400 text-lg font-bold mb-2">{boss.name}</div>
              <div className="w-64 h-4 bg-gray-700 rounded-full mb-2">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-white text-sm mb-2">
                {Math.floor(boss.hp).toLocaleString()} / {boss.maxHp.toLocaleString()} HP
              </div>
              {/* Boss sprite would go here */}
              <div className="w-48 h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                🐉
              </div>
            </div>
          )}
        </div>
        
        {/* Combat Log (Bottom Overlay) */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 h-24 overflow-hidden">
          <div ref={combatLogRef} className="h-full overflow-y-auto p-3 space-y-1">
            {combatLog.slice(-8).map((entry) => (
              <div 
                key={entry.id}
                className={`text-sm ${
                  entry.type === 'damage' ? 'text-red-400' :
                  entry.type === 'heal' ? 'text-green-400' :
                  entry.type === 'ability' ? 'text-yellow-400' :
                  entry.type === 'death' ? 'text-purple-400' :
                  'text-gray-300'
                }`}
              >
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Side: Chat & Controls (30%) */}
      <div className="w-96 bg-gray-800 flex flex-col">
        {/* Chat */}
        <div className="flex-1 flex flex-col border-b border-gray-700">
          <div className="bg-gray-900 p-3 border-b border-gray-700">
            <h3 className="text-white font-bold">Guild Chat</h3>
          </div>
          
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="text-blue-400 font-semibold">{msg.username}:</span>
                <span className="text-gray-300 ml-2">{msg.message}</span>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
              />
              <button
                onClick={sendChatMessage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 space-y-3">
          <h3 className="text-white font-bold mb-3">Actions</h3>
          
          <button
            onClick={usePotion}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
          >
            💊 Use Health Potion
          </button>
          
          <button
            onClick={() => useAbility('shield_wall')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            🛡️ Shield Wall
          </button>
          
          <button
            onClick={() => useAbility('group_heal')}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
          >
            💚 Group Heal
          </button>
          
          <button
            onClick={() => useAbility('rage')}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold"
          >
            😡 Berserker Rage
          </button>
        </div>
      </div>
    </div>
  );
}
