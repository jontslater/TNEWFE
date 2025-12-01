/**
 * Enemy Debug Page
 * Control debug settings for enemy animation testing
 */

import { useState, useEffect } from 'react';

const ALL_ENEMIES = [
  { name: 'Kobold Warrior', level: 1 },
  { name: 'Baby Dragon', level: 2 },
  { name: 'Imp', level: 3 },
  { name: 'Lizardman', level: 4 },
  { name: 'Masked Orc', level: 5 },
  { name: 'Werewolf', level: 8 },
  { name: 'Skeleton Mage', level: 10 },
  { name: 'Witch', level: 12 },
  { name: 'Mimic', level: 14 },
  { name: 'Gryphon', level: 18 },
  { name: 'Minotaur', level: 22 },
  { name: 'Headless Horseman', level: 26 },
  { name: 'Adult Dragon', level: 35, isBoss: true },
  { name: 'Demon Lord', level: 40, isBoss: true }
];

const DEBUG_SETTINGS_KEY = 'enemyDebugSettings';

interface DebugSettings {
  enabledEnemy: string | null;
  disableHeroDamage: boolean;
}

export default function EnemyDebugPage() {
  const [settings, setSettings] = useState<DebugSettings>(() => {
    const saved = localStorage.getItem(DEBUG_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { enabledEnemy: null, disableHeroDamage: true };
  });

  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(DEBUG_SETTINGS_KEY, JSON.stringify(settings));
    setLastUpdate(Date.now());
    
    // Also update a timestamp so browser source knows to refresh
    localStorage.setItem('enemyDebugSettingsUpdated', Date.now().toString());
  }, [settings]);

  const forceRestartCombat = () => {
    // Set a flag that tells browser source to clear enemies and restart
    localStorage.setItem('enemyDebugForceRestart', Date.now().toString());
    // Also update the settings timestamp
    localStorage.setItem('enemyDebugSettingsUpdated', Date.now().toString());
    setLastUpdate(Date.now());
    console.log('🔄 [DEBUG] Force restart signal sent to browser source');
  };

  const handleEnemyChange = (enemyName: string | null) => {
    setSettings(prev => ({ ...prev, enabledEnemy: enemyName }));
  };

  const handleDamageToggle = (disabled: boolean) => {
    setSettings(prev => ({ ...prev, disableHeroDamage: disabled }));
  };

  const resetSettings = () => {
    setSettings({ enabledEnemy: null, disableHeroDamage: true });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Enemy Animation Debug Controls</h1>
        <p className="text-gray-400 mb-6">
          Control debug settings for testing enemy animations. The browser source will automatically read these settings.
        </p>

        {/* Status Indicator */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${lastUpdate > Date.now() - 1000 ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`}></div>
            <span className="text-sm text-gray-400">Settings synced to browser source</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>

        {/* Enemy Selection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Enemy to Test</h2>
          <p className="text-gray-400 text-sm mb-4">
            Choose one enemy to spawn exclusively, or select "All Enemies" to test normally.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => handleEnemyChange(null)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                settings.enabledEnemy === null
                  ? 'border-blue-500 bg-blue-500/20 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-semibold">All Enemies</div>
              <div className="text-xs text-gray-400 mt-1">Normal mode</div>
            </button>
            
            {ALL_ENEMIES.map((enemy) => (
              <button
                key={enemy.name}
                onClick={() => handleEnemyChange(enemy.name)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  settings.enabledEnemy === enemy.name
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-semibold">{enemy.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Level {enemy.level} {enemy.isBoss && '• Boss'}
                </div>
              </button>
            ))}
          </div>

          {settings.enabledEnemy && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <div className="text-blue-400 font-semibold">🐛 Debug Mode Active</div>
              <div className="text-sm text-gray-300 mt-1">
                Only <span className="font-semibold">{settings.enabledEnemy}</span> will spawn in combat
              </div>
            </div>
          )}
        </div>

        {/* Hero Damage Toggle */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Hero Damage</h2>
          <p className="text-gray-400 text-sm mb-4">
            Disable hero damage to focus on testing enemy animations without heroes dying.
          </p>
          
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.disableHeroDamage}
                onChange={(e) => handleDamageToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium">
                {settings.disableHeroDamage ? 'Damage Disabled 🛡️' : 'Damage Enabled ⚔️'}
              </span>
            </label>
          </div>

          {settings.disableHeroDamage && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
              <div className="text-yellow-400 font-semibold">🛡️ Hero Damage Disabled</div>
              <div className="text-sm text-gray-300 mt-1">
                Heroes will show hurt animations and combat text, but won't lose HP
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={forceRestartCombat}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            🔄 Force Restart Combat
          </button>
          <button
            onClick={resetSettings}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Browser Source Link */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">🔗 Debug Browser Source</h3>
          <p className="text-sm text-gray-300 mb-3">
            Use this URL in OBS or open it in a separate browser tab to test with debug settings:
          </p>
          <div className="bg-gray-900 rounded p-3 font-mono text-sm text-blue-300 break-all">
            {window.location.origin}/browser-source/debug-view
          </div>
          <a
            href="/browser-source/debug-view"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Open Debug Browser Source →
          </a>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Select an enemy from the list above to test only that enemy</li>
            <li>Keep "Hero Damage Disabled" enabled while testing animations</li>
            <li>Open the <strong>Debug Browser Source</strong> link above in a new tab (or use the URL in OBS)</li>
            <li>Your existing browser source at <code className="bg-gray-700 px-1 rounded">/browser-source</code> will continue running normally</li>
            <li>Test each enemy's animations (attack, hurt, death) one at a time in the debug view</li>
            <li>Fix any animation issues for the current enemy before moving to the next</li>
            <li>Select "All Enemies" and enable hero damage when finished debugging</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
