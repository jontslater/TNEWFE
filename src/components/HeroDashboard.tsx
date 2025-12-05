import { useState, useEffect, useRef } from 'react';
import { Hero } from '../types/Hero';
import { formatNumber, getRarityColor, getRarityBg, getRoleBg, formatTime, getItemScore } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { heroAPI, achievementAPI } from '../api/client';
import { NAME_FRAMES, NameFrameType } from '../utils/nameFrames';
import { getNameFrameStyles } from '../utils/nameFrames';
import { getFounderTitleColor, getFounderTierFromTitle } from '../utils/founderTitle';
import { AURA_EFFECTS, AuraEffectType, getAuraFilter } from '../utils/auraEffects';
import { SPELL_EFFECTS, SpellEffectType } from '../utils/spellEffects';
import { createExhaustEffect, shouldShowExhaustEffect } from '../utils/exhaustEffects';
import HeroSpriteJS from './HeroSpriteJS';

interface HeroDashboardProps {
  hero: Hero;
  onHeroUpdate?: (updatedHero: Hero) => void;
  onHeroDelete?: () => void;
}

const FOUNDER_BADGES = [
  { id: 'none', name: 'None', path: null },
  { id: 'bronze', name: 'Bronze Founder', path: '/Badges/FoundersBronze.png' },
  { id: 'silver', name: 'Silver Founder', path: '/Badges/FoundersSilver.png' },
  { id: 'gold', name: 'Gold Founder', path: '/Badges/FoundersGold.png' },
  { id: 'platinum', name: 'Platinum Founder', path: '/Badges/FoundersPlatinum.png' }
];

export default function HeroDashboard({ hero, onHeroUpdate, onHeroDelete }: HeroDashboardProps) {
  const { user } = useAuth();
  const isAdmin = user?.twitchUsername?.toLowerCase() === 'theneverendingwar';
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [updatingBadge, setUpdatingBadge] = useState(false);
  const [updatingNameColor, setUpdatingNameColor] = useState(false);
  const [tempNameColor, setTempNameColor] = useState<string | null>(null);
  const [updatingNameFrame, setUpdatingNameFrame] = useState(false);
  const [updatingAuraEffect, setUpdatingAuraEffect] = useState(false);
  const [updatingAuraColor, setUpdatingAuraColor] = useState(false);
  const [tempAuraColor, setTempAuraColor] = useState<string | null>(null);
  const [updatingSpellEffect, setUpdatingSpellEffect] = useState(false);
  const spritePreviewRef = useRef<HTMLDivElement>(null);
  const hpPercent = (hero.hp / hero.maxHp) * 100;
  const xpPercent = (Math.floor(hero.xp) / Math.floor(hero.maxXp)) * 100;
  const itemScore = getItemScore(hero.equipment);

  useEffect(() => {
    loadAchievementsData();
  }, [hero.id]);

  // Initialize tempAuraColor from hero.auraColor
  useEffect(() => {
    setTempAuraColor(hero.auraColor || null);
  }, [hero.auraColor]);

  const loadAchievementsData = async () => {
    try {
      const data = await achievementAPI.getHeroAchievements(hero.id);
      
      console.log('[HeroDashboard] 🎯 Achievement Data:');
      console.log('[HeroDashboard] Data:', data);
      console.log('[HeroDashboard] Titles:', data?.titles);
      console.log('[HeroDashboard] Active title:', data?.activeTitle);
      
      // Check for "Genocide"
      const genocideTitle = data?.titles?.find((t: any) => t?.includes('Genocide'));
      if (genocideTitle) console.error('[HeroDashboard] ❌ FOUND GENOCIDE:', genocideTitle);
      
      if (data) {
        setAvailableTitles(data.titles || []);
        setSelectedTitle(data.activeTitle || null);
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
    }
  };

  const handleTitleChange = async (title: string) => {
    try {
      await achievementAPI.setActiveTitle(hero.id, title);
      setSelectedTitle(title);
      if (onHeroUpdate) {
        // Trigger a refresh
        onHeroUpdate({ ...hero, activeTitle: title } as any);
      }
    } catch (error) {
      console.error('Failed to set title:', error);
      alert('Failed to set title');
    }
  };

  const handleBadgeChange = async (badgePath: string | null) => {
    if (updatingBadge || !hero?.id) return;
    setUpdatingBadge(true);
    try {
      await heroAPI.updateHeroById(hero.id, { founderBadge: badgePath });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, founderBadge: badgePath || undefined } as any);
      }
      // Refresh to show updated badge
      window.location.reload();
    } catch (error) {
      console.error('Failed to update badge:', error);
      alert('Failed to update badge. Please try again.');
    } finally {
      setUpdatingBadge(false);
    }
  };

  const handleNameColorChange = async (color: string | null) => {
    if (updatingNameColor || !hero?.id) return;
    setUpdatingNameColor(true);
    try {
      await heroAPI.updateHeroById(hero.id, { nameColor: color });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, nameColor: color || undefined } as any);
      }
      // Refresh to show updated color
      window.location.reload();
    } catch (error) {
      console.error('Failed to update name color:', error);
      alert('Failed to update name color. Please try again.');
    } finally {
      setUpdatingNameColor(false);
    }
  };

  const handleNameFrameChange = async (frame: NameFrameType) => {
    if (updatingNameFrame || !hero?.id) return;
    setUpdatingNameFrame(true);
    try {
      await heroAPI.updateHeroById(hero.id, { nameFrame: frame });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, nameFrame: frame || undefined } as any);
      }
      // Refresh to show updated frame
      window.location.reload();
    } catch (error) {
      console.error('Failed to update name frame:', error);
      alert('Failed to update name frame. Please try again.');
    } finally {
      setUpdatingNameFrame(false);
    }
  };

  const handleAuraEffectChange = async (aura: AuraEffectType) => {
    if (updatingAuraEffect || !hero?.id) return;
    setUpdatingAuraEffect(true);
    try {
      await heroAPI.updateHeroById(hero.id, { auraEffect: aura });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, auraEffect: aura || undefined } as any);
      }
      // Refresh to show updated aura
      window.location.reload();
    } catch (error) {
      console.error('Failed to update aura effect:', error);
      alert('Failed to update aura effect. Please try again.');
    } finally {
      setUpdatingAuraEffect(false);
    }
  };

  const handleAuraColorChange = async (color: string | null) => {
    if (updatingAuraColor || !hero?.id) return;
    setUpdatingAuraColor(true);
    try {
      await heroAPI.updateHeroById(hero.id, { auraColor: color });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, auraColor: color || undefined } as any);
      }
      // Refresh to show updated aura color
      window.location.reload();
    } catch (error) {
      console.error('Failed to update aura color:', error);
      alert('Failed to update aura color. Please try again.');
    } finally {
      setUpdatingAuraColor(false);
    }
  };

  const handleSpellEffectChange = async (spellEffect: SpellEffectType) => {
    if (updatingSpellEffect || !hero?.id) return;
    setUpdatingSpellEffect(true);
    try {
      await heroAPI.updateHeroById(hero.id, { spellEffect: spellEffect });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, spellEffect: spellEffect || undefined } as any);
      }
    } catch (error) {
      console.error('Failed to update spell effect:', error);
      alert('Failed to update spell effect. Please try again.');
    } finally {
      setUpdatingSpellEffect(false);
    }
  };

  const handleTestCritEffect = () => {
    if (!shouldShowExhaustEffect(hero.role, hero.spellEffect)) {
      alert('Exhaust effects only work for tanks (Huge Knight) with Gold or Platinum spell effect!');
      return;
    }

    if (!spritePreviewRef.current || !hero.spellEffect) return;

    // Use exhaust01 for gold, exhaust02 for platinum
    const exhaustType = hero.spellEffect === 'gold' ? 'exhaust01' : 'exhaust02';
    createExhaustEffect(spritePreviewRef.current, hero.spellEffect as 'gold' | 'platinum', exhaustType);
  };
  
  const handleDelete = async () => {
    try {
      const userId = user?.twitchId || user?.id;
      if (!userId) {
        alert('You must be logged in to delete your hero');
        return;
      }
      
      setIsDeleting(true);
      await heroAPI.deleteHero(hero.id, userId);
      alert('Hero deleted successfully');
      if (onHeroDelete) {
        onHeroDelete();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete hero');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-4xl">
              {hero.isDead ? '💀' : '⚔️'}
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ color: hero.nameColor || 'white' }}>{hero.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getRoleBg(hero.role)} text-white`}>
                  {hero.role}
                </span>
                <span className="text-gray-400">Level {hero.level}</span>
                {hero.profession && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-400 text-sm">
                      {hero.profession.type === 'herbalism' ? '🌿' : hero.profession.type === 'mining' ? '⛏️' : '✨'} 
                      {' '}{hero.profession.type} Lv{hero.profession.level}
                    </span>
                  </>
                )}
                <span className="text-gray-400">•</span>
                <span className="text-yellow-500">⚡ {itemScore} Item Score</span>
              </div>
              {availableTitles.length > 0 && (
                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">Title</label>
                  <select
                    value={selectedTitle || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">No Title</option>
                    {availableTitles.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Badge Selection Dropdown */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  ⭐ Founder Badge {isAdmin && <span className="text-yellow-400">(Admin: All Available)</span>}
                </label>
                <select
                  value={hero.founderBadge || ''}
                  onChange={(e) => handleBadgeChange(e.target.value || null)}
                  disabled={updatingBadge}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {FOUNDER_BADGES.map(badge => (
                    <option key={badge.id} value={badge.path || ''}>
                      {badge.name}
                    </option>
                  ))}
                </select>
                {updatingBadge && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating badge...</span>
                )}
              </div>
              {/* Name Color Picker */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  🎨 Name Color {isAdmin && <span className="text-yellow-400">(Admin: All Available)</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tempNameColor !== null ? tempNameColor : (hero.nameColor || '#ffffff')}
                    onChange={(e) => setTempNameColor(e.target.value)}
                    disabled={updatingNameColor}
                    className="w-12 h-8 rounded border border-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Pick a color for your hero name"
                  />
                  <input
                    type="text"
                    value={tempNameColor !== null ? tempNameColor : (hero.nameColor || '#ffffff')}
                    onChange={(e) => {
                      const color = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(color) || color === '') {
                        setTempNameColor(color || null);
                      }
                    }}
                    disabled={updatingNameColor}
                    placeholder="#FFFFFF"
                    className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                  <button
                    onClick={() => {
                      if (tempNameColor === null) return;
                      const currentColor = hero.nameColor || '#ffffff';
                      // Only save if color actually changed
                      if (tempNameColor !== currentColor) {
                        handleNameColorChange(tempNameColor === '#ffffff' ? null : tempNameColor);
                      }
                      setTempNameColor(null);
                    }}
                    disabled={
                      updatingNameColor || 
                      tempNameColor === null || 
                      tempNameColor === (hero.nameColor || '#ffffff')
                    }
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save color"
                  >
                    Save
                  </button>
                  {(hero.nameColor || tempNameColor) && (
                    <button
                      onClick={() => {
                        handleNameColorChange(null);
                        setTempNameColor(null);
                      }}
                      disabled={updatingNameColor}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reset to default color"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {updatingNameColor && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating color...</span>
                )}
                {tempNameColor !== null && tempNameColor !== (hero.nameColor || '#ffffff') && (
                  <span className="text-xs text-amber-400 mt-1 block">💡 Color changed - click Save to apply</span>
                )}
              </div>
              {/* Name Frame Selection */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  🖼️ Name Frame {isAdmin && <span className="text-yellow-400">(Admin: All Available)</span>}
                </label>
                <select
                  value={hero.nameFrame || 'none'}
                  onChange={(e) => handleNameFrameChange(e.target.value === 'none' ? null : (e.target.value as NameFrameType))}
                  disabled={updatingNameFrame}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {NAME_FRAMES.map(frame => (
                    <option key={frame.id} value={frame.value || 'none'}>
                      {frame.name}
                    </option>
                  ))}
                </select>
                {updatingNameFrame && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating frame...</span>
                )}
              </div>
              {/* Aura Effect Selection */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  ✨ Aura Effect {isAdmin && <span className="text-yellow-400">(Admin: All Available)</span>}
                </label>
                <select
                  value={hero.auraEffect || 'none'}
                  onChange={(e) => handleAuraEffectChange(e.target.value === 'none' ? null : (e.target.value as AuraEffectType))}
                  disabled={updatingAuraEffect}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {AURA_EFFECTS.map(aura => (
                    <option key={aura.id} value={aura.value || 'none'}>
                      {aura.name}
                    </option>
                  ))}
                </select>
                {updatingAuraEffect && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating aura...</span>
                )}
              </div>
              {/* Aura Color Picker - Only show if aura effect is selected */}
              {hero.auraEffect && (
                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">
                    🎨 Aura Color (Customize your aura glow)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tempAuraColor !== null ? tempAuraColor : (hero.auraColor || (() => {
                        // Default color based on tier
                        switch (hero.auraEffect) {
                          case 'bronze': return '#CD7F32';
                          case 'silver': return '#C0C0C0';
                          case 'gold': return '#FFD700';
                          case 'platinum': return '#E5E4E2';
                          default: return '#FFD700';
                        }
                      })())}
                      onChange={(e) => setTempAuraColor(e.target.value)}
                      disabled={updatingAuraColor}
                      className="w-12 h-8 rounded border border-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Pick a custom color for your aura glow"
                    />
                    <input
                      type="text"
                      value={tempAuraColor !== null ? tempAuraColor : (hero.auraColor || (() => {
                        // Default color based on tier
                        switch (hero.auraEffect) {
                          case 'bronze': return '#CD7F32';
                          case 'silver': return '#C0C0C0';
                          case 'gold': return '#FFD700';
                          case 'platinum': return '#E5E4E2';
                          default: return '#FFD700';
                        }
                      })())}
                      onChange={(e) => {
                        const color = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(color) || color === '') {
                          setTempAuraColor(color || null);
                        }
                      }}
                      disabled={updatingAuraColor}
                      placeholder="#FFD700"
                      className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <button
                      onClick={() => handleAuraColorChange(tempAuraColor)}
                      disabled={updatingAuraColor || tempAuraColor === (hero.auraColor || null)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                  {updatingAuraColor && (
                    <span className="text-xs text-gray-500 mt-1 block">Saving aura color...</span>
                  )}
                  <button
                    onClick={() => {
                      setTempAuraColor(null);
                      handleAuraColorChange(null);
                    }}
                    disabled={updatingAuraColor || !hero.auraColor}
                    className="text-xs text-gray-400 hover:text-gray-300 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset to default tier color
                  </button>
                </div>
              )}
              {/* Spell Effect Selection */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  ⚡ Spell Effect {isAdmin && <span className="text-yellow-400">(Admin: All Available)</span>}
                </label>
                <select
                  value={hero.spellEffect || 'none'}
                  onChange={(e) => handleSpellEffectChange(e.target.value === 'none' ? null : (e.target.value as SpellEffectType))}
                  disabled={updatingSpellEffect}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {SPELL_EFFECTS.map(effect => (
                    <option key={effect.id} value={effect.value || 'none'}>
                      {effect.name}
                    </option>
                  ))}
                </select>
                {updatingSpellEffect && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating spell effect...</span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enhances projectiles and ranged attacks
                </p>
              </div>
            </div>
          </div>
          
          {/* Hero Sprite Preview */}
          <div className="flex flex-col items-center justify-center px-6" style={{ minWidth: '200px' }}>
            <div className="relative" style={{ width: '150px', height: '200px' }}>
              {/* Sprite Container */}
              <div 
                ref={spritePreviewRef}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                style={{
                  filter: (() => {
                    const filters = [];
                    // Aura effect with custom color
                    if (hero.auraEffect) {
                      const customColor = tempAuraColor !== null ? tempAuraColor : hero.auraColor;
                      const auraFilter = getAuraFilter(hero.auraEffect as any, customColor);
                      if (auraFilter) {
                        filters.push(auraFilter);
                      }
                    }
                    // Base drop shadow
                    filters.push('drop-shadow(0 4px 8px rgba(0,0,0,0.5))');
                    return filters.join(' ');
                  })()
                }}
              >
                <HeroSpriteJS
                  heroId={hero.id}
                  role={hero.role}
                  scale={2.5}
                  facing="right"
                  style={{ filter: 'none' }}
                />
              </div>
              
              {/* Title (if active) */}
              {(() => {
                const displayTitle = selectedTitle || (hero as any).activeTitle;
                if (!displayTitle) return null;
                
                const isFounder = displayTitle?.toLowerCase().includes('founder');
                const founderTier = isFounder ? getFounderTierFromTitle(displayTitle) : null;
                const titleColor = founderTier ? getFounderTitleColor(founderTier) : '#fbbf24';
                const displayText = isFounder ? 'Founder' : displayTitle;
                
                return (
                  <div style={{
                    position: 'absolute',
                    top: '0px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: titleColor,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    textShadow: `2px 2px 4px rgba(0,0,0,0.9), 0 0 8px ${titleColor}80`,
                    whiteSpace: 'nowrap',
                    zIndex: 10
                  }}>
                    {displayText}
                  </div>
                );
              })()}
              
              {/* Hero Name with Badge and Frame */}
              <div style={{
                position: 'absolute',
                top: (selectedTitle || (hero as any).activeTitle) ? '20px' : '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 10
              }}>
                {hero.founderBadge && (
                  <img
                    src={hero.founderBadge}
                    alt="Founder Badge"
                    style={{
                      width: '16px',
                      height: '16px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.9))'
                    }}
                  />
                )}
                <span style={{
                  color: tempNameColor !== null ? tempNameColor : (hero.nameColor || 'white'),
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  ...(getNameFrameStyles(hero.nameFrame as any) || {})
                }}>
                  {hero.name}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center">Live Preview</div>
            {/* Test Crit Effect Button - Only for tanks with gold/platinum spell effect */}
            {shouldShowExhaustEffect(hero.role, hero.spellEffect) && (
              <button
                onClick={handleTestCritEffect}
                className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded transition-colors"
                title="Test exhaust effect (appears on crits for tanks with Gold/Platinum spell effect)"
              >
                ⚡ Test Crit Effect
              </button>
            )}
          </div>
          
          <div className="text-right space-y-2">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{formatNumber(hero.gold)}</div>
                <div className="text-xs text-gray-400">Gold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{hero.tokens}</div>
                <div className="text-xs text-gray-400">Tokens</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  disabled={isDeleting}
                >
                  Delete Hero
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-red-400">Confirm delete?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-sm bg-red-700 hover:bg-red-800 text-white rounded transition-colors"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">HP</span>
            <span className="text-white">{formatNumber(hero.hp)} / {formatNumber(hero.maxHp)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${hero.isDead ? 'bg-gray-500' : 'bg-red-600'}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">XP</span>
            <span className="text-white">{Math.floor(hero.xp)} / {Math.floor(hero.maxXp)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
        
        {/* Rested XP Indicator */}
        {hero.restedXp && hero.restedXp.hoursRemaining > 0 && (
          <div className="mt-3 bg-gradient-to-r from-blue-900 to-purple-900 border-2 border-blue-400 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">😴</span>
                <div>
                  <div className="text-blue-300 font-bold text-sm">Rested XP</div>
                  <div className="text-white text-lg font-bold">{hero.restedXp.hoursRemaining.toFixed(1)} hours</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold text-xl">+50% XP</div>
                <div className="text-xs text-gray-400">while chatting</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Attack</div>
          <div className="text-2xl font-bold text-red-400">{hero.attack}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Defense</div>
          <div className="text-2xl font-bold text-blue-400">{hero.defense}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Max HP</div>
          <div className="text-2xl font-bold text-green-400">{formatNumber(hero.maxHp)}</div>
        </div>
      </div>


      {/* Active Buffs */}
      {Object.keys(hero.activeBuffs).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Active Buffs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(hero.activeBuffs).map(([key, buff]) => (
              <div key={key} className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div className="font-semibold text-green-400">{buff.name}</div>
                <div className="text-sm text-gray-300 mt-1">
                  +{Math.floor(buff.value * 100)}% {key.replace('Bonus', '')}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatTime(buff.remainingDuration)} combat time left
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Combat Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-gray-400 text-sm mb-1">Total Damage</div>
            <div className="text-xl font-bold text-red-400">{formatNumber(hero.stats.totalDamage)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Total Healing</div>
            <div className="text-xl font-bold text-green-400">{formatNumber(hero.stats.totalHealing)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Damage Blocked</div>
            <div className="text-xl font-bold text-blue-400">{formatNumber(hero.stats.damageBlocked)}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
