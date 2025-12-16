import { useState, useEffect } from 'react';
import { generateBrowserSourceUrl } from '../utils/browserSource';
import { useAuth } from '../hooks/useAuth';
import { db } from '../utils/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { streamSettingsAPI } from '../api/client';

interface BrowserSourceTabProps {
  userId?: string | null | undefined;
  token?: string | null;
}

/**
 * Chat Update Settings Component
 */
function ChatUpdateSettingsSection({ user }: { user: any }) {
  const [settings, setSettings] = useState({
    enabled: false,
    intervalMinutes: 7,
    showWaves: true,
    showXp: true,
    showLevelUps: true,
    showGold: false,
    customMessage: null as string | null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (user?.twitchId) {
      loadSettings();
    }
  }, [user?.twitchId]);

  const loadSettings = async () => {
    if (!user?.twitchId) return;
    
    try {
      setLoading(true);
      const response = await streamSettingsAPI.getSettings(user.twitchId);
      if (response.success && response.settings) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to load chat update settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.twitchId) return;

    try {
      setSaving(true);
      const response = await streamSettingsAPI.updateSettings(user.twitchId, settings);
      if (response.success) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('[ChatUpdateSettings] User:', user);
    console.log('[ChatUpdateSettings] TwitchId:', user?.twitchId);
    console.log('[ChatUpdateSettings] Will render:', !!user?.twitchId);
  }, [user]);

  if (!user?.twitchId) {
    return (
      <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700">
        <h3 className="text-lg font-semibold text-purple-300 mb-2">💬 Periodic Chat Updates</h3>
        <p className="text-gray-300 text-sm">
          Please log in with Twitch to configure chat updates. Current user: {user?.twitchUsername || user?.displayName || 'Not logged in'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700">
      <h3 className="text-lg font-semibold text-purple-300 mb-2">💬 Periodic Chat Updates</h3>
      <p className="text-gray-300 text-sm mb-4">
        Configure automatic stats updates in your Twitch chat. Updates only post when you're live.
      </p>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading settings...</div>
      ) : (
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-300">Enable Chat Updates</label>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                settings.enabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Update Interval */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Update Interval: <span className="text-purple-400">{settings.intervalMinutes} minutes</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="1"
                  value={settings.intervalMinutes}
                  onChange={(e) => setSettings({ ...settings, intervalMinutes: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5 min</span>
                  <span>10 min</span>
                </div>
              </div>

              {/* Stats Toggles */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-300 mb-2">Show in Updates:</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showWaves}
                      onChange={(e) => setSettings({ ...settings, showWaves: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Waves Completed</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showXp}
                      onChange={(e) => setSettings({ ...settings, showXp: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">XP Gained</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLevelUps}
                      onChange={(e) => setSettings({ ...settings, showLevelUps: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Heroes Leveled Up</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showGold}
                      onChange={(e) => setSettings({ ...settings, showGold: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Gold Gained</span>
                  </label>
                </div>
              </div>

              {/* Custom Message Template */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Custom Message Template (Optional)
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Use placeholders: {'{time}'}, {'{waves}'}, {'{xp}'}, {'{levelups}'}, {'{gold}'}
                </p>
                <textarea
                  value={settings.customMessage || ''}
                  onChange={(e) => setSettings({ ...settings, customMessage: e.target.value || null })}
                  placeholder="📊 Last {time}: {waves} waves completed, {xp} XP gained, {levelups} heroes leveled up!"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-sm"
                  rows={3}
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                {saveMessage && (
                  <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrowserSourceTab({ userId: propUserId, token: propToken }: BrowserSourceTabProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedCleanCode, setCopiedCleanCode] = useState(false);
  const [activeQueue, setActiveQueue] = useState<any>(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Get userId and token from props or auth
  const userId = propUserId || user?.twitchId || user?.id;
  const token = propToken || localStorage.getItem('auth_token');

  // Use Twitch username for battlefieldId to match chat command format (!join uses username)
  // The chat command uses twitch:username, not twitch:userId
  const battlefieldIdentifier = user?.twitchUsername || user?.displayName || userId;
  const battlefieldIdentifierString = battlefieldIdentifier ? String(battlefieldIdentifier).toLowerCase().trim() : null;

  const browserSourceUrl = battlefieldIdentifierString && token 
    ? generateBrowserSourceUrl(battlefieldIdentifierString, token)
    : null;

  // Clean Battlefield URL (uses twitchId) - includes darkMode parameter
  const cleanBattlefieldUrl = user?.twitchId 
    ? `${window.location.origin}/clean-battlefield?battlefieldId=twitch:${user.twitchId}${darkMode ? '&darkMode=true' : ''}`
    : null;

  const [copiedClean, setCopiedClean] = useState(false);

  // Listen for active queue
  useEffect(() => {
    if (!user?.twitchId) {
      console.log('[Queue] No twitchId, skipping queue listener');
      return;
    }
    
    const battlefieldId = `twitch:${user.twitchId}`;
    console.log('═══════════════════════════════════════════════');
    console.log('[Queue] 🔍 QUEUE LISTENER SETUP');
    console.log('[Queue] User:', user.twitchUsername);
    console.log('[Queue] TwitchId:', user.twitchId);
    console.log('[Queue] BattlefieldId:', battlefieldId);
    console.log('[Queue] Collection: battlefieldQueues');
    console.log('[Queue] Document ID:', battlefieldId);
    console.log('═══════════════════════════════════════════════');
    
    const queueRef = doc(db, 'battlefieldQueues', battlefieldId);
    
    const unsubscribe = onSnapshot(queueRef, (snapshot) => {
      console.log('[Queue] 📡 Snapshot received!');
      console.log('[Queue] Document exists:', snapshot.exists());
      
      if (snapshot.exists()) {
        const queueData = { id: snapshot.id, ...snapshot.data() };
        console.log('[Queue] ✅ Active queue detected!');
        console.log('[Queue] Code:', queueData.code);
        console.log('[Queue] Name:', queueData.name);
        console.log('[Queue] Full data:', queueData);
        setActiveQueue(queueData);
      } else {
        console.log('[Queue] ⚠️ No active queue document found');
        console.log('[Queue] Path checked:', `battlefieldQueues/${battlefieldId}`);
        setActiveQueue(null);
      }
    }, (error) => {
      console.error('[Queue] ❌ Error listening to queue:', error);
      setActiveQueue(null);
    });
    
    return () => {
      console.log('[Queue] Cleaning up queue listener');
      unsubscribe();
    };
  }, [user?.twitchId]);

  const handleCopy = async () => {
    if (!browserSourceUrl) {
      alert('Unable to generate browser source URL. Please ensure you are logged in.');
      return;
    }

    try {
      await navigator.clipboard.writeText(browserSourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = browserSourceUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyClean = async () => {
    if (!cleanBattlefieldUrl) {
      alert('Unable to generate Clean Battlefield URL. Please ensure you are logged in.');
      return;
    }

    try {
      await navigator.clipboard.writeText(cleanBattlefieldUrl);
      setCopiedClean(true);
      setTimeout(() => setCopiedClean(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = cleanBattlefieldUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedClean(true);
      setTimeout(() => setCopiedClean(false), 2000);
    }
  };

  return (
    <>
      {/* Queue Code Modal */}
      {showQueueModal && activeQueue && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowQueueModal(false)}>
          <div className="bg-gray-800 rounded-lg p-8 border-4 border-purple-500 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-purple-300">🏰 Queue Created!</h2>
              <button
                onClick={() => setShowQueueModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Room Code - BIG */}
            <div className="bg-purple-900/50 border-2 border-purple-400 rounded-lg p-8 mb-6 text-center">
              <div className="text-sm text-purple-300 mb-2">📋 Room Code</div>
              <div className="text-7xl font-bold text-purple-100 tracking-widest mb-4">
                {activeQueue.code}
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(activeQueue.code);
                    setCopiedCleanCode(true);
                    setTimeout(() => setCopiedCleanCode(false), 2000);
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                }}
                className={`px-8 py-3 rounded-lg font-bold text-lg transition-colors ${
                  copiedCleanCode
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copiedCleanCode ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>
            
            {/* Queue Info */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <h3 className="text-xl font-bold text-white mb-3">{activeQueue.name}</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-xs text-gray-400">Level Range</div>
                  <div className="text-lg font-semibold text-white">
                    {activeQueue.requirements?.minLevel}-{activeQueue.requirements?.maxLevel}
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-xs text-gray-400">Min Gear Score</div>
                  <div className="text-lg font-semibold text-white">
                    {activeQueue.requirements?.minGearScore}+
                  </div>
                </div>
              </div>
              
              {/* Role Requirements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">🛡️ Tanks</span>
                  <span className="font-semibold text-white">
                    {activeQueue.requirements?.roles?.tank?.current || 0}/{activeQueue.requirements?.roles?.tank?.required || 0}
                    {(activeQueue.requirements?.roles?.tank?.current || 0) >= (activeQueue.requirements?.roles?.tank?.required || 0) ? ' ✅' : ' ⚠️'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">💚 Healers</span>
                  <span className="font-semibold text-white">
                    {activeQueue.requirements?.roles?.healer?.current || 0}/{activeQueue.requirements?.roles?.healer?.required || 0}
                    {(activeQueue.requirements?.roles?.healer?.current || 0) >= (activeQueue.requirements?.roles?.healer?.required || 0) ? ' ✅' : ' ⚠️'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">⚔️ DPS</span>
                  <span className="font-semibold text-white">
                    {activeQueue.requirements?.roles?.dps?.current || 0}/{activeQueue.requirements?.roles?.dps?.required || 0}
                    {(activeQueue.requirements?.roles?.dps?.current || 0) >= (activeQueue.requirements?.roles?.dps?.required || 0) ? ' ✅' : ' ⚠️'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">📋 How to Share</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Copy the code above</li>
                <li>• Share in Discord, stream, or chat</li>
                <li>• Players type: <code className="bg-gray-800 px-2 py-1 rounded">!q{activeQueue.type} {activeQueue.code}</code></li>
              </ul>
            </div>
            
            {activeQueue.isReady && (
              <div className="mt-4 bg-green-900/50 border-2 border-green-500 rounded-lg p-4 text-center">
                <div className="text-green-300 font-bold text-lg animate-pulse">
                  🎉 GROUP IS READY! Launching soon... ⚔️
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">📺 OBS Browser Source</h2>
          
          <div className="flex gap-2">
            {/* Debug: Test Queue Button */}
            <button
              onClick={() => {
                console.log('[Queue Debug] Creating test queue...');
                console.log('[Queue Debug] User twitchId:', user?.twitchId);
                console.log('[Queue Debug] BattlefieldId:', `twitch:${user?.twitchId}`);
                
                setActiveQueue({
                  code: 'TEST',
                  name: 'Test Dungeon',
                  type: 'dungeon',
                  description: 'Test queue',
                  requirements: {
                    minLevel: 1,
                    maxLevel: 20,
                    minGearScore: 0,
                    roles: {
                      tank: { current: 0, required: 1 },
                      healer: { current: 0, required: 1 },
                      dps: { current: 0, required: 3 }
                    }
                  },
                  participants: [],
                  totalPlayers: 5
                });
              }}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded"
            >
              🧪 Test Queue
            </button>
            
            {/* Show Queue Button (if active queue exists) */}
            {activeQueue && (
              <button
                onClick={() => setShowQueueModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded flex items-center gap-2 animate-pulse"
              >
                🏰 View Queue Code
              </button>
            )}
          </div>
        </div>
        
        {/* Important Notice */}
        <div className="bg-orange-900/40 rounded-lg p-4 border-2 border-orange-600">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-300 mb-2">Important Notice</h3>
              <p className="text-gray-200 text-sm leading-relaxed">
                We're making frequent updates to improve the game. If commands aren't working in chat, 
                please <strong className="text-white">log out of the website and log back in</strong> to 
                re-establish your connection to the bot. This will refresh your authentication and ensure 
                commands are processed correctly.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
        {/* Clean Battlefield URL (Recommended) */}
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-green-300">🎯 Clean Battlefield</h3>
            <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">RECOMMENDED</span>
          </div>
          <p className="text-gray-300 mb-4 text-sm">
            Step-by-step combat system built from scratch. Clean, simple, and easy to build on.
          </p>
          
          <div className="space-y-3">
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                />
                <span className="text-sm font-semibold text-gray-300">
                  🌙 Dark Mode (for browser viewing)
                </span>
              </label>
              <span className="text-xs text-gray-500 ml-auto">
                {darkMode ? 'Dark background enabled' : 'Transparent for OBS'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Clean Battlefield URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cleanBattlefieldUrl || 'Please log in to generate URL'}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-green-500 font-mono text-xs"
                />
                <button
                  onClick={handleCopyClean}
                  disabled={!cleanBattlefieldUrl}
                  className={`px-6 py-2 rounded font-semibold transition-colors ${
                    copiedClean
                      ? 'bg-green-600 text-white'
                      : cleanBattlefieldUrl
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {copiedClean ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              {darkMode && (
                <p className="mt-2 text-xs text-yellow-400">
                  ⚠️ Dark mode is enabled. For OBS, uncheck dark mode to use transparent background.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">📋 OBS Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
            <li>In OBS, add a <strong className="text-white">Browser Source</strong></li>
            <li>Set the URL to the copied link above</li>
            <li>Set width to <strong className="text-white">1920</strong> and height to <strong className="text-white">1080</strong></li>
            <li>Check <strong className="text-white">"Shutdown source when not visible"</strong> for better performance</li>
            <li>The browser source will automatically switch between idle combat, raids, and dungeons</li>
          </ol>
        </div>

        <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-700">
          <h3 className="text-lg font-semibold text-yellow-300 mb-2">✨ Features</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
            <li><strong className="text-white">Mode switching:</strong> Automatically displays raids and dungeons when you join them</li>
            <li><strong className="text-white">Transparent background:</strong> Perfect for overlaying on your stream</li>
            <li><strong className="text-white">Real-time updates:</strong> Uses Firestore listeners for instant updates</li>
            <li><strong className="text-white">1920x1080 resolution:</strong> Optimized for streaming</li>
          </ul>
        </div>

        {/* Chat Update Settings */}
        <ChatUpdateSettingsSection user={user} />

        {/* Active Queue Display - Inline (not modal, just status) */}
        {activeQueue && !showQueueModal && (
          <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-300">🏰 Active Queue</h3>
              <button
                onClick={() => setShowQueueModal(true)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded"
              >
                View Code
              </button>
            </div>
            
            {/* Queue Info */}
            <div className="bg-gray-800 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xl font-bold text-white">{activeQueue.name || 'Queue'}</h4>
                  <p className="text-gray-400 text-sm">{activeQueue.description || ''}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">Room Code</div>
                  <div className="text-3xl font-bold text-purple-400 tracking-wider">
                    {activeQueue.code || 'XXXX'}
                  </div>
                </div>
              </div>
              
              {/* Copy Code Button */}
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(activeQueue.code);
                    setCopiedCleanCode(true);
                    setTimeout(() => setCopiedCleanCode(false), 2000);
                  } catch (err) {
                    console.error('Failed to copy code:', err);
                  }
                }}
                className={`w-full px-4 py-2 rounded font-semibold transition-colors mb-3 ${
                  copiedCleanCode
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copiedCleanCode ? '✓ Code Copied!' : '📋 Copy Room Code'}
              </button>
              
              {/* Requirements */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-900 rounded p-2">
                  <div className="text-xs text-gray-400">Level Range</div>
                  <div className="text-sm font-semibold text-white">
                    {activeQueue.requirements?.minLevel}-{activeQueue.requirements?.maxLevel}
                  </div>
                </div>
                <div className="bg-gray-900 rounded p-2">
                  <div className="text-xs text-gray-400">Min Gear Score</div>
                  <div className="text-sm font-semibold text-white">
                    {activeQueue.requirements?.minGearScore}+
                  </div>
                </div>
              </div>
              
              {/* Role Progress */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">🛡️ Tanks</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">
                      {activeQueue.requirements?.roles?.tank?.current || 0}/{activeQueue.requirements?.roles?.tank?.required || 0}
                    </div>
                    {(activeQueue.requirements?.roles?.tank?.current || 0) >= (activeQueue.requirements?.roles?.tank?.required || 0) ? (
                      <span className="text-green-400 text-xs">✅</span>
                    ) : (
                      <span className="text-yellow-400 text-xs">⚠️</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">💚 Healers</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">
                      {activeQueue.requirements?.roles?.healer?.current || 0}/{activeQueue.requirements?.roles?.healer?.required || 0}
                    </div>
                    {(activeQueue.requirements?.roles?.healer?.current || 0) >= (activeQueue.requirements?.roles?.healer?.required || 0) ? (
                      <span className="text-green-400 text-xs">✅</span>
                    ) : (
                      <span className="text-yellow-400 text-xs">⚠️</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">⚔️ DPS</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">
                      {activeQueue.requirements?.roles?.dps?.current || 0}/{activeQueue.requirements?.roles?.dps?.required || 0}
                    </div>
                    {(activeQueue.requirements?.roles?.dps?.current || 0) >= (activeQueue.requirements?.roles?.dps?.required || 0) ? (
                      <span className="text-green-400 text-xs">✅</span>
                    ) : (
                      <span className="text-yellow-400 text-xs">⚠️</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Participants */}
              {activeQueue.participants && activeQueue.participants.length > 0 && (
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-gray-400 mb-2">Party Members ({activeQueue.participants.length}/{activeQueue.totalPlayers || 5})</div>
                  <div className="space-y-1">
                    {activeQueue.participants.map((p: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">
                          {p.role === 'tank' && '🛡️'}
                          {p.role === 'healer' && '💚'}
                          {p.role === 'dps' && '⚔️'}
                          {' '}
                          {p.username}
                        </span>
                        <span className="text-gray-500">
                          {p.class} Lv{p.level} (GS {p.gearScore})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ready Status */}
              {activeQueue.isReady && (
                <div className="bg-green-900/50 border border-green-500 rounded p-3 mt-3 text-center">
                  <div className="text-green-300 font-bold text-sm animate-pulse">
                    🎉 GROUP IS READY! Launching soon... ⚔️
                  </div>
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400 mb-2">📋 How to Share</div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>• Copy the room code above</div>
                <div>• Share in Discord, chat, or wherever you want</div>
                <div>• Players type: <code className="bg-gray-900 px-1 rounded">!q{activeQueue.type} {activeQueue.code}</code></div>
                <div>• Queue auto-launches when all roles are filled!</div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
