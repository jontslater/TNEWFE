/**
 * Browser Source Configuration Page
 * Hero/Enemy selection with sprite preview
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { generateBrowserSourceUrl } from '../utils/browserSource';
import { HERO_SPRITES } from '../utils/spriteConfig';
import { battlefieldAPI, streamSettingsAPI } from '../api/client';
import { AnimatedSprite } from '../components/AnimatedSprite';
import EnemySprite from '../components/EnemySprite';
import { PreviewSpriteContainer } from '../components/PreviewSpriteContainer';
import { SpriteLayout } from '../utils/spriteManipulation';
import { getSpriteKey, loadAllSpriteLayouts, saveSpriteLayoutToStorage, getHeroCategory } from '../utils/spriteLayoutKeys';
import { getEnemySpriteClass } from '../utils/enemySpriteConfig';

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

  if (!user?.twitchId) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="text-xl font-bold mb-3">💬 Periodic Chat Updates</h2>
      <p className="text-gray-400 text-sm mb-4">
        Configure automatic stats updates in your Twitch chat. Updates only post when you're live.
      </p>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading settings...</div>
      ) : (
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Enable Chat Updates</label>
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
                <label className="block text-sm font-semibold mb-2">
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
                <div className="text-sm font-semibold mb-2">Show in Updates:</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showWaves}
                      onChange={(e) => setSettings({ ...settings, showWaves: e.target.checked })}
                      className="rounded"
                    />
                    <span>Waves Completed</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showXp}
                      onChange={(e) => setSettings({ ...settings, showXp: e.target.checked })}
                      className="rounded"
                    />
                    <span>XP Gained</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLevelUps}
                      onChange={(e) => setSettings({ ...settings, showLevelUps: e.target.checked })}
                      className="rounded"
                    />
                    <span>Heroes Leveled Up</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showGold}
                      onChange={(e) => setSettings({ ...settings, showGold: e.target.checked })}
                      className="rounded"
                    />
                    <span>Gold Gained</span>
                  </label>
                </div>
              </div>

              {/* Custom Message Template */}
              <div>
                <label className="block text-sm font-semibold mb-2">
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

export default function BrowserSourceConfigPage() {
  const { user } = useAuth();
  const token = localStorage.getItem('auth_token');
  
  // Facing direction preferences
  const [facingPreferences, setFacingPreferences] = useState<Record<string, 'left' | 'right'>>(() => {
    const saved = localStorage.getItem('spriteFacingPreferences');
    return saved ? JSON.parse(saved) : {};
  });

  // Selected hero classes and enemy types to display
  const [selectedHeroClasses, setSelectedHeroClasses] = useState<string[]>(() => {
    const saved = localStorage.getItem('browserSourceSelectedHeroClasses');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedEnemyTypes, setSelectedEnemyTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('browserSourceSelectedEnemyTypes');
    return saved ? JSON.parse(saved) : [];
  });

  // Animation state for preview (idle, attack, hurt, death)
  const [previewAnimation, setPreviewAnimation] = useState<'idle' | 'attack' | 'hurt' | 'death'>('idle');

  // Sprite layout editor state
  const [editingSpriteType, setEditingSpriteType] = useState<'hero' | 'enemy'>('hero');
  const [editingSpriteId, setEditingSpriteId] = useState<string>('');
  const [spriteLayouts, setSpriteLayouts] = useState<Record<string, SpriteLayout>>(() => loadAllSpriteLayouts());
  
  // Selected sprite instance for individual configuration
  const [selectedSpriteInstance, setSelectedSpriteInstance] = useState<{
    type: 'hero' | 'enemy';
    slotIndex: number;
    identifier: string;
  } | null>(null);
  
  // Success message state for save button
  const [saveMessage, setSaveMessage] = useState<string>('');
  
  // Current layout being edited - use state so preview updates in real-time
  const [currentLayout, setCurrentLayout] = useState<SpriteLayout>({
    containerWidth: 150,
    containerHeight: 140,
    spriteWidth: 48,
    spriteHeight: 48,
    spriteScale: 2.5,
    spriteOffsetX: 0,
    spriteOffsetY: 0,
    facingDirection: 'right'
  });
  
  // Generate sprite instances from selected types
  // Heroes are grouped by category (Tank, Healer, DPS) - same category shares container settings
  const heroInstances = selectedHeroClasses.map((heroClass, index) => {
    const category = getHeroCategory(heroClass);
    return {
      type: 'hero' as const,
      slotIndex: index,
      identifier: heroClass,
      category: category,
      displayName: `${category.charAt(0).toUpperCase() + category.slice(1)} (${heroClass.charAt(0).toUpperCase() + heroClass.slice(1)})`
    };
  });

  const enemyInstances = selectedEnemyTypes.map((enemyType, index) => ({
    type: 'enemy' as const,
    slotIndex: index,
    identifier: enemyType
  }));

  // Load layout when sprite instance selection changes
  useEffect(() => {
    if (selectedSpriteInstance) {
      // For heroes, use category instead of individual role
      const identifier = selectedSpriteInstance.type === 'hero' 
        ? getHeroCategory(selectedSpriteInstance.identifier)
        : selectedSpriteInstance.identifier;
      const spriteKey = getSpriteKey(
        selectedSpriteInstance.type,
        identifier,
        selectedSpriteInstance.slotIndex,
        true // useCategory = true for heroes
      );
      const layout = spriteLayouts[spriteKey] || {};
      setCurrentLayout({
        containerWidth: layout.containerWidth || 150,
        containerHeight: layout.containerHeight || 140,
        spriteWidth: layout.spriteWidth || 48,
        spriteHeight: layout.spriteHeight || 48,
        spriteScale: layout.spriteScale || 2.5,
        spriteOffsetX: layout.spriteOffsetX || 0,
        spriteOffsetY: layout.spriteOffsetY || 0,
        facingDirection: layout.facingDirection || (selectedSpriteInstance.type === 'hero' ? 'right' : 'left')
      });
    } else if (editingSpriteId) {
      // Fallback to old system if instance not selected
      const spriteKey = getSpriteKey(editingSpriteType, editingSpriteId);
      const layout = spriteLayouts[spriteKey] || {};
      setCurrentLayout({
        containerWidth: layout.containerWidth || 150,
        containerHeight: layout.containerHeight || 140,
        spriteWidth: layout.spriteWidth || 48,
        spriteHeight: layout.spriteHeight || 48,
        spriteScale: layout.spriteScale || 2.5,
        spriteOffsetX: layout.spriteOffsetX || 0,
        spriteOffsetY: layout.spriteOffsetY || 0,
        facingDirection: layout.facingDirection || (editingSpriteType === 'hero' ? 'right' : 'left')
      });
    } else {
      // Reset to defaults when no sprite selected
      setCurrentLayout({
        containerWidth: 150,
        containerHeight: 140,
        spriteWidth: 48,
        spriteHeight: 48,
        spriteScale: 2.5,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        facingDirection: 'right'
      });
    }
  }, [selectedSpriteInstance, editingSpriteId, editingSpriteType, spriteLayouts]);
  
  // Save layout changes (auto-save on slider change)
  const saveLayout = (updates: Partial<SpriteLayout>) => {
    const newLayout = { ...currentLayout, ...updates };
    setCurrentLayout(newLayout);
    
    // Auto-save if instance is selected
    if (selectedSpriteInstance) {
      // For heroes, use category instead of individual role
      const identifier = selectedSpriteInstance.type === 'hero' 
        ? getHeroCategory(selectedSpriteInstance.identifier)
        : selectedSpriteInstance.identifier;
      const spriteKey = getSpriteKey(
        selectedSpriteInstance.type,
        identifier,
        selectedSpriteInstance.slotIndex,
        true // useCategory = true for heroes
      );
      setSpriteLayouts(prev => {
        const updated = { ...prev, [spriteKey]: newLayout };
        saveSpriteLayoutToStorage(spriteKey, newLayout);
        return updated;
      });
    } else if (editingSpriteId) {
      // Fallback to old system
      const spriteKey = getSpriteKey(editingSpriteType, editingSpriteId);
      setSpriteLayouts(prev => {
        const updated = { ...prev, [spriteKey]: newLayout };
        saveSpriteLayoutToStorage(spriteKey, newLayout);
        return updated;
      });
    }
  };
  
  // Save layout button handler (explicit save with feedback)
  const handleSaveLayout = () => {
    if (!selectedSpriteInstance) return;
    
    // For heroes, use category instead of individual role
    const identifier = selectedSpriteInstance.type === 'hero' 
      ? getHeroCategory(selectedSpriteInstance.identifier)
      : selectedSpriteInstance.identifier;
    const spriteKey = getSpriteKey(
      selectedSpriteInstance.type,
      identifier,
      selectedSpriteInstance.slotIndex,
      true // useCategory = true for heroes
    );
    saveSpriteLayoutToStorage(spriteKey, currentLayout);
    
    setSpriteLayouts(prev => ({
      ...prev,
      [spriteKey]: currentLayout
    }));
    
    setSaveMessage('Layout saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // All hero roles and enemy types
  const allHeroRoles = Object.keys(HERO_SPRITES);
  const allEnemyTypes = [
    'Kobold Warrior', 'Baby Dragon', 'Imp', 'Lizardman', 'Masked Orc',
    'Werewolf', 'Skeleton Mage', 'Witch', 'Mimic', 'Gryphon',
    'Minotaur', 'Headless Horseman', 'Adult Dragon', 'Demon Lord'
  ];

  // Load sprite preferences from backend on mount
  useEffect(() => {
    if (user?.id) {
      battlefieldAPI.getSpriteFacingPreferences(user.id)
        .then(prefs => {
          setFacingPreferences(prefs);
          localStorage.setItem('spriteFacingPreferences', JSON.stringify(prefs));
        })
        .catch(err => {
          console.error('Failed to load sprite preferences:', err);
          const saved = localStorage.getItem('spriteFacingPreferences');
          if (saved) {
            try {
              setFacingPreferences(JSON.parse(saved));
            } catch (e) {
              // ignore
            }
          }
        });
    }
  }, [user?.id]);

  // Update facing direction for a hero role or enemy type
  const updateFacingDirection = (spriteType: string, facing: 'left' | 'right') => {
    const updated = { ...facingPreferences, [spriteType]: facing };
    setFacingPreferences(updated);
    localStorage.setItem('spriteFacingPreferences', JSON.stringify(updated));
    
    // Save to backend
    if (user?.id) {
      battlefieldAPI.saveSpriteFacingPreference(user.id, spriteType, facing)
        .catch(err => console.error('Failed to save sprite preference:', err));
    }
  };

  // Add hero class to selection
  const addHeroClass = (heroClass: string) => {
    if (!selectedHeroClasses.includes(heroClass)) {
      const updated = [...selectedHeroClasses, heroClass];
      setSelectedHeroClasses(updated);
      localStorage.setItem('browserSourceSelectedHeroClasses', JSON.stringify(updated));
    }
  };

  // Remove hero class from selection
  const removeHeroClass = (heroClass: string) => {
    const updated = selectedHeroClasses.filter(c => c !== heroClass);
    setSelectedHeroClasses(updated);
    localStorage.setItem('browserSourceSelectedHeroClasses', JSON.stringify(updated));
  };

  // Add enemy type to selection
  const addEnemyType = (enemyType: string) => {
    if (!selectedEnemyTypes.includes(enemyType)) {
      const updated = [...selectedEnemyTypes, enemyType];
      setSelectedEnemyTypes(updated);
      localStorage.setItem('browserSourceSelectedEnemyTypes', JSON.stringify(updated));
    }
  };

  // Remove enemy type from selection
  const removeEnemyType = (enemyType: string) => {
    const updated = selectedEnemyTypes.filter(t => t !== enemyType);
    setSelectedEnemyTypes(updated);
    localStorage.setItem('browserSourceSelectedEnemyTypes', JSON.stringify(updated));
  };

  // Get facing direction
  const getFacingDirection = (roleOrEnemyName: string, defaultFacing: 'left' | 'right' = 'right'): 'left' | 'right' => {
    return facingPreferences[roleOrEnemyName] || defaultFacing;
  };

  // Get sprite container class based on role
  const getSpriteContainerClass = (role: string): string => {
    const tanks = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
    const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
    
    if (tanks.includes(role)) return 'huge-knight-sprite sprite-container';
    if (role === 'bard') return 'bard-sprite sprite-container';
    if (healers.includes(role)) return 'wizard-sprite sprite-container';
    
    const meleeDPS = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
    if (meleeDPS.includes(role)) return 'dwarf-warrior-sprite sprite-container';
    return 'pyromancer-sprite sprite-container';
  };

  // Copy browser source URL
  const handleCopyUrl = async () => {
    if (!user?.id || !token) {
      alert('Please log in to generate your browser source URL');
      return;
    }

    const url = generateBrowserSourceUrl(
      user.id,
      token,
      undefined, // bgX
      undefined, // bgY
      undefined, // cropX
      undefined, // cropY
      undefined, // cropWidth
      undefined, // cropHeight
      true // transparent
    );

    try {
      await navigator.clipboard.writeText(url);
      alert('Browser source URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      alert('Failed to copy URL. Please copy it manually.');
    }
  };

  const browserSourceUrl = user?.id && token
    ? generateBrowserSourceUrl(
        user.id,
        token,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      )
    : '';

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Please log in</h2>
          <p>You need to be logged in to configure your browser source.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-[95vw] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Browser Source Configuration</h1>
          <p className="text-gray-400 text-sm">Configure your OBS browser source settings</p>
        </div>

        {/* Browser Source URLs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Clean Battlefield URL */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-3">🎯 Clean Battlefield (Recommended)</h2>
            <p className="text-gray-400 text-xs mb-3">New clean combat system built from scratch</p>
            <div className="bg-gray-900 rounded p-2 mb-3 border border-gray-700 max-h-32 overflow-y-auto">
              <code className="text-xs text-gray-300 break-all">
                {user?.twitchId 
                  ? `${window.location.origin}/clean-battlefield?battlefieldId=twitch:${user.twitchId}`
                  : 'Please log in'}
              </code>
            </div>
            <button
              onClick={async () => {
                if (!user?.twitchId) {
                  alert('Please log in to generate your clean battlefield URL');
                  return;
                }
                const url = `${window.location.origin}/clean-battlefield?battlefieldId=twitch:${user.twitchId}`;
                try {
                  await navigator.clipboard.writeText(url);
                  alert('Clean Battlefield URL copied to clipboard!');
                } catch (err) {
                  console.error('Failed to copy URL:', err);
                  alert('Failed to copy URL. Please copy it manually.');
                }
              }}
              disabled={!user?.twitchId}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm"
            >
              Copy Clean Battlefield URL
            </button>
          </div>

          {/* Legacy Browser Source URL */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-3">Legacy Browser Source</h2>
            <p className="text-gray-400 text-xs mb-3">Original browser source (complex)</p>
            <div className="bg-gray-900 rounded p-2 mb-3 border border-gray-700 max-h-32 overflow-y-auto">
              <code className="text-xs text-gray-300 break-all">
                {browserSourceUrl || 'Please log in'}
              </code>
            </div>
            <button
              onClick={handleCopyUrl}
              disabled={!browserSourceUrl}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm"
            >
              Copy Legacy URL
            </button>
          </div>
        </div>

        {/* Chat Update Settings */}
        <ChatUpdateSettingsSection user={user} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Hero Selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-3">Select Hero Classes</h2>
            <div className="mb-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addHeroClass(e.target.value);
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                defaultValue=""
              >
                <option value="">Select a hero class...</option>
                {allHeroRoles
                  .filter(role => !selectedHeroClasses.includes(role))
                  .map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedHeroClasses.map((heroClass) => {
                const currentFacing = getFacingDirection(heroClass, 'right');
                return (
                  <div
                    key={heroClass}
                    className="bg-gray-900 rounded p-3 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {heroClass.charAt(0).toUpperCase() + heroClass.slice(1)}
                      </div>
                      <button
                        onClick={() => removeHeroClass(heroClass)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFacingDirection(heroClass, 'left')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          currentFacing === 'left'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        ← Left
                      </button>
                      <button
                        onClick={() => updateFacingDirection(heroClass, 'right')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          currentFacing === 'right'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        Right →
                      </button>
                    </div>
                  </div>
                );
              })}
              {selectedHeroClasses.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No hero classes selected. Select from dropdown above.
                </p>
              )}
            </div>
          </div>

          {/* Enemy Selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-3">Select Enemy Types</h2>
            <div className="mb-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addEnemyType(e.target.value);
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                defaultValue=""
              >
                <option value="">Select an enemy type...</option>
                {allEnemyTypes
                  .filter(type => !selectedEnemyTypes.includes(type))
                  .map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedEnemyTypes.map((enemyType) => {
                const currentFacing = getFacingDirection(enemyType, 'left');
                return (
                  <div
                    key={enemyType}
                    className="bg-gray-900 rounded p-3 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{enemyType}</div>
                      <button
                        onClick={() => removeEnemyType(enemyType)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFacingDirection(enemyType, 'left')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          currentFacing === 'left'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        ← Left
                      </button>
                      <button
                        onClick={() => updateFacingDirection(enemyType, 'right')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          currentFacing === 'right'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        Right →
                      </button>
                    </div>
                  </div>
                );
              })}
              {selectedEnemyTypes.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No enemy types selected. Select from dropdown above.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Individual Sprite Instance Selection */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-3">Select Sprite Instance</h2>
          <p className="text-gray-400 text-sm mb-4">Select an individual sprite instance to configure its container settings, position, and view health information.</p>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Sprite Instance</label>
            <select
              value={selectedSpriteInstance ? JSON.stringify(selectedSpriteInstance) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  try {
                    const instance = JSON.parse(e.target.value);
                    setSelectedSpriteInstance(instance);
                    // Clear old editing state
                    setEditingSpriteId('');
                  } catch (err) {
                    console.error('Failed to parse sprite instance:', err);
                  }
                } else {
                  setSelectedSpriteInstance(null);
                }
              }}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
            >
              <option value="">Select a sprite instance...</option>
              {heroInstances.map((instance) => (
                <option
                  key={`hero-${instance.slotIndex}-${instance.identifier}`}
                  value={JSON.stringify(instance)}
                >
                  Hero Slot {instance.slotIndex + 1}: {instance.displayName || `${instance.category.charAt(0).toUpperCase() + instance.category.slice(1)} (${instance.identifier.charAt(0).toUpperCase() + instance.identifier.slice(1)})`}
                </option>
              ))}
              {enemyInstances.map((instance) => (
                <option
                  key={`enemy-${instance.slotIndex}-${instance.identifier}`}
                  value={JSON.stringify(instance)}
                >
                  Enemy Slot {instance.slotIndex + 1}: {instance.identifier}
                </option>
              ))}
            </select>
          </div>
          
          {selectedSpriteInstance && (
            <div className="bg-gray-900 rounded p-3 border border-gray-700">
              <div className="text-sm">
                <span className="text-purple-400 font-semibold">Selected:</span>{' '}
                <span className="text-white">
                  {selectedSpriteInstance.type === 'hero' ? 'Hero' : 'Enemy'} Slot {selectedSpriteInstance.slotIndex + 1} 
                  {selectedSpriteInstance.type === 'hero' 
                    ? ` (${getHeroCategory(selectedSpriteInstance.identifier).charAt(0).toUpperCase() + getHeroCategory(selectedSpriteInstance.identifier).slice(1)} - ${selectedSpriteInstance.identifier.charAt(0).toUpperCase() + selectedSpriteInstance.identifier.slice(1)})`
                    : ` (${selectedSpriteInstance.identifier})`}
                </span>
              </div>
            </div>
          )}
          
          {heroInstances.length === 0 && enemyInstances.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              Select hero classes and enemy types above to create sprite instances
            </p>
          )}
        </div>

        {/* Sprite Container Settings */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-3">Sprite Container Settings</h2>
          <p className="text-gray-400 text-sm mb-4">
            {selectedSpriteInstance 
              ? `Adjust container dimensions, sprite size, scale, and offsets for ${selectedSpriteInstance.type === 'hero' ? 'Hero' : 'Enemy'} Slot ${selectedSpriteInstance.slotIndex + 1}${selectedSpriteInstance.type === 'hero' ? ` (${getHeroCategory(selectedSpriteInstance.identifier).charAt(0).toUpperCase() + getHeroCategory(selectedSpriteInstance.identifier).slice(1)} category - applies to all ${getHeroCategory(selectedSpriteInstance.identifier)}s)` : ` (${selectedSpriteInstance.identifier})`}.`
              : 'Select a sprite instance above to adjust its container settings.'}
          </p>
          
          {selectedSpriteInstance && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Container Width */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Container Width: <span className="text-purple-400">{currentLayout.containerWidth || 150}px</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="5"
                  value={currentLayout.containerWidth || 150}
                  onChange={(e) => saveLayout({ containerWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Container Height */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Container Height: <span className="text-purple-400">{currentLayout.containerHeight || 140}px</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="5"
                  value={currentLayout.containerHeight || 140}
                  onChange={(e) => saveLayout({ containerHeight: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Sprite Width */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Sprite Width: <span className="text-purple-400">{currentLayout.spriteWidth || 48}px</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="1"
                  value={currentLayout.spriteWidth || 48}
                  onChange={(e) => saveLayout({ spriteWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Sprite Height */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Sprite Height: <span className="text-purple-400">{currentLayout.spriteHeight || 48}px</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="1"
                  value={currentLayout.spriteHeight || 48}
                  onChange={(e) => saveLayout({ spriteHeight: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Sprite Scale */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Sprite Scale: <span className="text-purple-400">{currentLayout.spriteScale || 2.5}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={currentLayout.spriteScale || 2.5}
                  onChange={(e) => saveLayout({ spriteScale: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Offset X */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Offset X: <span className="text-purple-400">{currentLayout.spriteOffsetX || 0}px</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={currentLayout.spriteOffsetX || 0}
                  onChange={(e) => saveLayout({ spriteOffsetX: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Offset Y */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Offset Y: <span className="text-purple-400">{currentLayout.spriteOffsetY || 0}px</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={currentLayout.spriteOffsetY || 0}
                  onChange={(e) => saveLayout({ spriteOffsetY: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              {/* Save Button */}
              <div className="col-span-full mt-4">
                <button
                  onClick={handleSaveLayout}
                  disabled={!selectedSpriteInstance}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-colors"
                >
                  Save Layout
                </button>
                {saveMessage && (
                  <span className="ml-4 text-green-400 text-sm">{saveMessage}</span>
                )}
              </div>
            </div>
          )}

          {!selectedSpriteInstance && (
            <p className="text-gray-400 text-sm text-center py-4">
              Select a sprite instance above to adjust its container settings
            </p>
          )}
        </div>

        {/* Animation Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-3">Preview Animation</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewAnimation('idle')}
              className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                previewAnimation === 'idle' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Idle
            </button>
            <button
              onClick={() => setPreviewAnimation('attack')}
              className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                previewAnimation === 'attack' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Attack
            </button>
            <button
              onClick={() => setPreviewAnimation('hurt')}
              className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                previewAnimation === 'hurt' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Hurt
            </button>
            <button
              onClick={() => setPreviewAnimation('death')}
              className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                previewAnimation === 'death' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Death
            </button>
          </div>
        </div>

        {/* Sprite Preview */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-3">Sprite Preview (1920×1080)</h2>
          <div
            className="relative border-2 border-gray-700 rounded-lg overflow-hidden bg-gray-900 mx-auto"
            style={{
              width: '960px', // 1920 / 2
              height: '540px', // 1080 / 2
              aspectRatio: '16/9'
            }}
          >
            {/* Selected Hero Sprites */}
            <div className="absolute bottom-20 left-0 right-0 flex justify-start gap-8 px-8">
            {heroInstances.map((instance) => {
              const facing = getFacingDirection(instance.identifier, 'right');
              const isSelected = selectedSpriteInstance?.type === 'hero' && 
                                 selectedSpriteInstance.slotIndex === instance.slotIndex &&
                                 selectedSpriteInstance.identifier === instance.identifier;
              // Use category-based layout key for heroes
              const categoryKey = getSpriteKey('hero', instance.category, instance.slotIndex, true);
              const fallbackKey = getSpriteKey('hero', instance.category, null, true);
              const layoutToUse = isSelected 
                ? currentLayout 
                : (spriteLayouts[categoryKey] || spriteLayouts[fallbackKey] || {});
              
              // Mock health data for preview
              const mockHp = 150;
              const mockMaxHp = 200;
              const hpPercent = (mockHp / mockMaxHp) * 100;
              
              return (
                  <div
                    key={`hero-${instance.slotIndex}-${instance.identifier}`}
                    className="flex flex-col items-center relative"
                    style={{
                      border: isSelected ? '3px solid #a855f7' : 'none',
                      borderRadius: isSelected ? '8px' : '0',
                      padding: isSelected ? '4px' : '0',
                      boxShadow: isSelected ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none'
                    }}
                  >
                    {/* Health Bar - only show for selected instance */}
                    {isSelected && (
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                        {/* Name */}
                        <div className="text-xs text-white font-semibold mb-1 whitespace-nowrap">
                          {instance.identifier.charAt(0).toUpperCase() + instance.identifier.slice(1)}
                        </div>
                        {/* Health Bar */}
                        <div 
                          className="mb-1"
                          style={{
                            width: '96px',
                            height: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <div
                            style={{
                              width: `${hpPercent}%`,
                              height: '100%',
                              backgroundColor: '#dc2626',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        {/* Health Text */}
                        <div className="text-xs text-white">
                          {mockHp}/{mockMaxHp} HP
                        </div>
                      </div>
                    )}
                    
                    <PreviewSpriteContainer
                      layout={{ ...layoutToUse, facingDirection: facing }}
                      isEditing={isSelected}
                      className={getSpriteContainerClass(instance.identifier)}
                      animation={previewAnimation}
                    >
                      <AnimatedSprite
                        role={instance.identifier}
                        animation={previewAnimation}
                        facing={facing}
                      />
                    </PreviewSpriteContainer>
                    <div className="mt-2 text-xs text-center text-gray-300">
                      {instance.identifier.charAt(0).toUpperCase() + instance.identifier.slice(1)}
                      {isSelected && <span className="text-purple-400 block">(Selected)</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Enemy Sprites */}
            <div className="absolute bottom-20 right-0 flex justify-end gap-8 px-8">
              {enemyInstances.map((instance) => {
                const facing = getFacingDirection(instance.identifier, 'left');
                const isSelected = selectedSpriteInstance?.type === 'enemy' && 
                                 selectedSpriteInstance.slotIndex === instance.slotIndex &&
                                 selectedSpriteInstance.identifier === instance.identifier;
                const layoutToUse = isSelected 
                  ? currentLayout 
                  : (spriteLayouts[getSpriteKey('enemy', instance.identifier, instance.slotIndex)] || 
                     spriteLayouts[getSpriteKey('enemy', instance.identifier)] || {});
                
                // Mock health data for preview
                const mockHp = 120;
                const mockMaxHp = 180;
                const hpPercent = (mockHp / mockMaxHp) * 100;
                
                return (
                  <div
                    key={`enemy-${instance.slotIndex}-${instance.identifier}`}
                    className="flex flex-col items-center relative"
                    style={{
                      border: isSelected ? '3px solid #a855f7' : 'none',
                      borderRadius: isSelected ? '8px' : '0',
                      padding: isSelected ? '4px' : '0',
                      boxShadow: isSelected ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none'
                    }}
                  >
                    {/* Health Bar - only show for selected instance */}
                    {isSelected && (
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                        {/* Name */}
                        <div className="text-xs text-white font-semibold mb-1 whitespace-nowrap">
                          {instance.identifier}
                        </div>
                        {/* Health Bar */}
                        <div 
                          className="mb-1"
                          style={{
                            width: '96px',
                            height: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <div
                            style={{
                              width: `${hpPercent}%`,
                              height: '100%',
                              backgroundColor: '#dc2626',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        {/* Health Text */}
                        <div className="text-xs text-white">
                          {mockHp}/{mockMaxHp} HP
                        </div>
                      </div>
                    )}
                    
                    <PreviewSpriteContainer
                      layout={{ ...layoutToUse, facingDirection: facing }}
                      isEditing={isSelected}
                      className={getEnemySpriteClass(instance.identifier) + ' sprite-container'}
                      animation={previewAnimation}
                    >
                      <EnemySprite
                        enemyType={instance.identifier}
                        animation={previewAnimation}
                        facing={facing}
                      />
                    </PreviewSpriteContainer>
                    <div className="mt-2 text-xs text-center text-gray-300 max-w-[80px]">
                      {instance.identifier}
                      {isSelected && <span className="text-purple-400 block">(Selected)</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {heroInstances.length === 0 && enemyInstances.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <p>Select hero classes and enemy types above to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
