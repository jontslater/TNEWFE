import { useState, useEffect, useRef } from 'react';
import { Hero } from '../types/Hero';
import { formatNumber, getRarityColor, getRarityBg, getRoleBg, formatTime, getItemScore, formatTimeAgo } from '../utils/format';
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
  
  // STRICT ADMIN CHECK - Only 'theneverendingwar' gets admin access
  const twitchUsername = user?.twitchUsername?.toLowerCase()?.trim();
  const isAdmin = twitchUsername === 'theneverendingwar';
  
  // Founder pack tier access control
  const heroTier = (hero as any).founderPackTier || null;
  const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
  const heroTierLevel = heroTier ? tierOrder[heroTier as keyof typeof tierOrder] : 0;
  
  // Feature access checks (based on tier requirements)
  const hasNameColorAccess = isAdmin || heroTierLevel >= 1; // Bronze+
  const hasNameFrameAccess = isAdmin || heroTierLevel >= 2; // Silver+
  const hasAuraAccess = isAdmin || heroTierLevel >= 3; // Gold+
  const hasSpellEffectAccess = isAdmin || heroTierLevel >= 3; // Gold+
  
  // Filter available options based on tier
  const availableBadges = isAdmin 
    ? FOUNDER_BADGES 
    : FOUNDER_BADGES.filter(badge => {
        if (badge.id === 'none') return true;
        const badgeTier = badge.id as keyof typeof tierOrder;
        const badgeTierLevel = tierOrder[badgeTier] || 0;
        return heroTierLevel >= badgeTierLevel;
      });
  
  const availableNameFrames = isAdmin
    ? NAME_FRAMES
    : NAME_FRAMES.filter(frame => {
        if (frame.value === null || frame.value === 'none') return true;
        const frameTier = frame.value as keyof typeof tierOrder;
        const frameTierLevel = tierOrder[frameTier] || 0;
        return heroTierLevel >= frameTierLevel;
      });
  
  const availableAuras = isAdmin
    ? AURA_EFFECTS
    : AURA_EFFECTS.filter(aura => {
        if (aura.value === null || aura.value === 'none') return true;
        const auraTier = aura.value as keyof typeof tierOrder;
        const auraTierLevel = tierOrder[auraTier] || 0;
        return heroTierLevel >= auraTierLevel;
      });
  
  const availableSpellEffects = isAdmin
    ? SPELL_EFFECTS
    : SPELL_EFFECTS.filter(effect => {
        if (effect.value === null || effect.value === 'none') return true;
        const effectTier = effect.value as keyof typeof tierOrder;
        const effectTierLevel = tierOrder[effectTier] || 0;
        return heroTierLevel >= effectTierLevel;
      });
  
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
  const [claimingRewards, setClaimingRewards] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState<string>('');
  const [renaming, setRenaming] = useState(false);
  const spritePreviewRef = useRef<HTMLDivElement>(null);
  const hpPercent = (hero.hp / hero.maxHp) * 100;
  const xpPercent = (Math.floor(hero.xp) / Math.floor(hero.maxXp)) * 100;
  const itemScore = getItemScore(hero.equipment, hero.role);
  
  // Warn if hero has founder features but no founderPackTier
  useEffect(() => {
    if (!isAdmin && heroTier === null && (hero.founderBadge || hero.nameColor || hero.nameFrame || hero.auraEffect || hero.spellEffect)) {
      console.warn('[HeroDashboard] ⚠️ SECURITY WARNING: Hero has founder features but no founderPackTier purchase:', {
        heroName: hero.name,
        heroId: hero.id,
        twitchUsername,
        founderBadge: hero.founderBadge,
        nameColor: hero.nameColor,
        nameFrame: hero.nameFrame,
        auraEffect: hero.auraEffect,
        spellEffect: hero.spellEffect,
        founderPackTier: heroTier
      });
    }
  }, [hero, heroTier, isAdmin, twitchUsername]);

  useEffect(() => {
    loadAchievementsData();
  }, [hero.id]);

  // Initialize tempAuraColor from hero.auraColor
  useEffect(() => {
    setTempAuraColor(hero.auraColor || null);
  }, [hero.auraColor]);

  // Initialize last claim time from hero data
  useEffect(() => {
    if (hero.lastTokenClaim) {
      // Handle both timestamp (number) and Firestore Timestamp
      const timestamp = (hero.lastTokenClaim as any)?.toMillis?.() || hero.lastTokenClaim;
      setLastClaimTime(typeof timestamp === 'number' ? timestamp : null);
    }
  }, [hero.lastTokenClaim]);

  const loadAchievementsData = async () => {
    try {
      // First, sync achievements to ensure all achievement titles are unlocked
      try {
        await achievementAPI.syncAchievementTitles(hero.id);
        console.log('[HeroDashboard] ✅ Synced achievement titles');
      } catch (error) {
        console.warn('[HeroDashboard] Failed to sync achievements (may not be critical):', error);
      }
      
      // Then load achievement data
      const data = await achievementAPI.getHeroAchievements(hero.id);
      
      console.log('[HeroDashboard] 🎯 Achievement Data:');
      console.log('[HeroDashboard] Data:', data);
      console.log('[HeroDashboard] Titles:', data?.titles);
      console.log('[HeroDashboard] Active title:', data?.activeTitle);
      
      // Check for "Genocide"
      const genocideTitle = data?.titles?.find((t: any) => t?.includes('Genocide'));
      if (genocideTitle) console.error('[HeroDashboard] ❌ FOUND GENOCIDE:', genocideTitle);
      
      if (data) {
        // Sort titles alphabetically
        const sortedTitles = (data.titles || []).sort((a, b) => a.localeCompare(b));
        setAvailableTitles(sortedTitles);
        setSelectedTitle(data.activeTitle || null);
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
    }
  };

  const handleClaimIdleRewards = async () => {
    setClaimingRewards(true);
    setClaimMessage(null);
    
    try {
      const result = await heroAPI.claimIdleRewards(hero.id);
      
      if (result.success) {
        setClaimMessage(result.message || `Claimed ${result.data?.tokensClaimed || 0} tokens!`);
        // Update last claim time from response
        if (result.data?.lastTokenClaim) {
          setLastClaimTime(result.data.lastTokenClaim);
        }
        // Refresh hero data
        if (onHeroUpdate) {
          // The hero should be refetched from the parent component
          // For now, we'll show the success message
          setTimeout(() => {
            setClaimMessage(null);
          }, 3000);
        }
      } else {
        setClaimMessage(result.message || 'No tokens available yet');
        setTimeout(() => {
          setClaimMessage(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error claiming idle rewards:', error);
      // Check if it's a 400 with a message (like "no tokens available")
      if (error.response?.status === 400 && error.response?.data?.message) {
        setClaimMessage(error.response.data.message);
      } else {
        setClaimMessage(error.response?.data?.error || error.response?.data?.message || 'Failed to claim rewards');
      }
      setTimeout(() => {
        setClaimMessage(null);
      }, 3000);
    } finally {
      setClaimingRewards(false);
      // Trigger hero refetch if callback provided
      if (onHeroUpdate && hero) {
        // Wait a moment then refetch
        setTimeout(async () => {
          try {
            const updatedHero = await heroAPI.getHeroById(hero.id);
            onHeroUpdate(updatedHero);
          } catch (err) {
            console.error('Error refetching hero:', err);
          }
        }, 500);
      }
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

  const handleStartRename = () => {
    setIsRenaming(true);
    setRenameValue(hero.name || '');
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setRenameValue('');
  };

  const handleSaveRename = async () => {
    if (!renameValue.trim() || renameValue.trim() === hero.name) {
      setIsRenaming(false);
      setRenameValue('');
      return;
    }

    if (renameValue.trim().length > 50) {
      alert('Hero name cannot exceed 50 characters');
      return;
    }

    setRenaming(true);
    try {
      await heroAPI.renameHero(hero.id, renameValue.trim());
      const updatedHero = { ...hero, name: renameValue.trim() };
      if (onHeroUpdate) {
        onHeroUpdate(updatedHero as any);
      }
      setIsRenaming(false);
      setRenameValue('');
      // Don't reload - just update the hero state
      // The onHeroUpdate callback will handle the state update
    } catch (error: any) {
      console.error('Failed to rename hero:', error);
      alert(error.response?.data?.error || 'Failed to rename hero. Please try again.');
    } finally {
      setRenaming(false);
    }
  };

  const handleBadgeChange = async (badgePath: string | null) => {
    if (updatingBadge || !hero?.id) return;
    
    // Check access before allowing change
    if (badgePath) {
      const selectedBadge = FOUNDER_BADGES.find(b => b.path === badgePath);
      if (selectedBadge && selectedBadge.id !== 'none') {
        const badgeTier = selectedBadge.id as keyof typeof tierOrder;
        const badgeTierLevel = tierOrder[badgeTier] || 0;
        if (!isAdmin && (heroTier === null || heroTierLevel < badgeTierLevel)) {
          alert(`This badge requires a ${selectedBadge.name} or higher tier founder pack purchase.\n\nYou must purchase a Founder Pack to unlock badges.`);
          return;
        }
      }
    }
    
    setUpdatingBadge(true);
    try {
      await heroAPI.updateHeroById(hero.id, { founderBadge: badgePath });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, founderBadge: badgePath || undefined } as any);
      }
      // State is updated via onHeroUpdate callback
    } catch (error) {
      console.error('Failed to update badge:', error);
      alert('Failed to update badge. Please try again.');
    } finally {
      setUpdatingBadge(false);
    }
  };

  const handleNameColorChange = async (color: string | null) => {
    if (updatingNameColor || !hero?.id) return;
    
    // Check access before allowing change
    if (color && !hasNameColorAccess) {
      alert('Name Color customization requires a Bronze Founder Pack or higher.\n\nPurchase a Founder Pack to unlock this feature.');
      return;
    }
    
    setUpdatingNameColor(true);
    try {
      await heroAPI.updateHeroById(hero.id, { nameColor: color });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, nameColor: color || undefined } as any);
      }
      // State is updated via onHeroUpdate callback
    } catch (error) {
      console.error('Failed to update name color:', error);
      alert('Failed to update name color. Please try again.');
    } finally {
      setUpdatingNameColor(false);
    }
  };

  const handleNameFrameChange = async (frame: NameFrameType) => {
    if (updatingNameFrame || !hero?.id) return;
    
    // Check access before allowing change
    if (frame && !hasNameFrameAccess) {
      alert('Name Frame customization requires a Silver Founder Pack or higher.\n\nPurchase a Founder Pack to unlock this feature.');
      return;
    }
    
    setUpdatingNameFrame(true);
    try {
      await heroAPI.updateHeroById(hero.id, { nameFrame: frame });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, nameFrame: frame || undefined } as any);
      }
      // State is updated via onHeroUpdate callback
    } catch (error) {
      console.error('Failed to update name frame:', error);
      alert('Failed to update name frame. Please try again.');
    } finally {
      setUpdatingNameFrame(false);
    }
  };

  const handleAuraEffectChange = async (aura: AuraEffectType) => {
    if (updatingAuraEffect || !hero?.id) return;
    
    // Check access before allowing change
    if (aura && !hasAuraAccess) {
      alert('Aura Effect requires a Gold Founder Pack or higher.\n\nPurchase a Founder Pack to unlock this feature.');
      return;
    }
    
    setUpdatingAuraEffect(true);
    try {
      await heroAPI.updateHeroById(hero.id, { auraEffect: aura });
      if (onHeroUpdate) {
        onHeroUpdate({ ...hero, auraEffect: aura || undefined } as any);
      }
      // State is updated via onHeroUpdate callback
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
      // State is updated via onHeroUpdate callback
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
    <div className="space-y-6 overflow-x-hidden max-w-full">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-4xl">
              {hero.isDead ? '💀' : '⚔️'}
            </div>
            <div className="flex-1">
              {!isRenaming ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-3xl font-bold" style={{ color: hero.nameColor || 'white' }}>{hero.name}</h2>
                  <button
                    onClick={handleStartRename}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                    title="Rename hero"
                  >
                    ✏️ Rename
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    maxLength={50}
                    disabled={renaming}
                    className="text-3xl font-bold bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    style={{ color: hero.nameColor || 'white', minWidth: '200px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRename();
                      } else if (e.key === 'Escape') {
                        handleCancelRename();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRename}
                    disabled={renaming || !renameValue.trim() || renameValue.trim() === hero.name}
                    className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {renaming ? 'Saving...' : '✓ Save'}
                  </button>
                  <button
                    onClick={handleCancelRename}
                    disabled={renaming}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50"
                  >
                    ✕ Cancel
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-2">
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getRoleBg(hero.role)} text-white`}>
                  {hero.role}
                </span>
                <span className="text-gray-400">Level {hero.level}</span>
                {user?.twitchUsername && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1 group">
                      <span className="text-gray-400 text-sm">Twitch:</span>
                      <span 
                        className="text-blue-400 text-sm font-mono cursor-pointer hover:text-blue-300"
                        onClick={() => {
                          navigator.clipboard.writeText(user.twitchUsername || '');
                          alert('Twitch username copied!');
                        }}
                        title="Click to copy"
                      >
                        {user.twitchUsername}
                      </span>
                      <span className="text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">📋</span>
                    </div>
                  </>
                )}
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
                  {!isAdmin && !heroTier && <span className="text-red-400 text-xs ml-2">(Requires Founder Pack)</span>}
                </label>
                <select
                  value={hero.founderBadge || ''}
                  onChange={(e) => handleBadgeChange(e.target.value || null)}
                  disabled={updatingBadge || (!isAdmin && !heroTier)}
                  className={`bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full ${
                    !isAdmin && !heroTier ? 'cursor-not-allowed' : ''
                  }`}
                >
                  {availableBadges.map(badge => (
                    <option key={badge.id} value={badge.path || ''}>
                      {badge.name}
                    </option>
                  ))}
                </select>
                {updatingBadge && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating badge...</span>
                )}
                {!isAdmin && !heroTier && (
                  <span className="text-xs text-gray-500 mt-1 block">Purchase a Founder Pack to unlock badges</span>
                )}
              </div>
              {/* Name Color Picker */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  🎨 Name Color 
                  {isAdmin && <span className="text-yellow-400"> (Admin: All Available)</span>}
                  {!hasNameColorAccess && <span className="text-red-400 text-xs ml-2">(Requires Bronze+ Founder Pack)</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tempNameColor !== null ? tempNameColor : (hero.nameColor || '#ffffff')}
                    onChange={(e) => setTempNameColor(e.target.value)}
                    disabled={updatingNameColor || !hasNameColorAccess}
                    className="w-12 h-8 rounded border border-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title={hasNameColorAccess ? "Pick a color for your hero name" : "Requires Bronze+ Founder Pack"}
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
                    disabled={updatingNameColor || !hasNameColorAccess}
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
                      !hasNameColorAccess ||
                      tempNameColor === null || 
                      tempNameColor === (hero.nameColor || '#ffffff')
                    }
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save color"
                  >
                    Save
                  </button>
                  {(hero.nameColor || tempNameColor) && hasNameColorAccess && (
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
                  🖼️ Name Frame 
                  {isAdmin && <span className="text-yellow-400"> (Admin: All Available)</span>}
                  {!hasNameFrameAccess && <span className="text-red-400 text-xs ml-2">(Requires Silver+ Founder Pack)</span>}
                </label>
                <select
                  value={hero.nameFrame || 'none'}
                  onChange={(e) => handleNameFrameChange(e.target.value === 'none' ? null : (e.target.value as NameFrameType))}
                  disabled={updatingNameFrame || !hasNameFrameAccess}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {availableNameFrames.map(frame => (
                    <option key={frame.id} value={frame.value || 'none'}>
                      {frame.name}
                    </option>
                  ))}
                </select>
                {updatingNameFrame && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating frame...</span>
                )}
                {!hasNameFrameAccess && (
                  <span className="text-xs text-gray-500 mt-1 block">Purchase a Silver+ Founder Pack to unlock name frames</span>
                )}
              </div>
              {/* Aura Effect Selection */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  ✨ Aura Effect 
                  {isAdmin && <span className="text-yellow-400"> (Admin: All Available)</span>}
                  {!hasAuraAccess && <span className="text-red-400 text-xs ml-2">(Requires Gold+ Founder Pack)</span>}
                </label>
                <select
                  value={hero.auraEffect || 'none'}
                  onChange={(e) => handleAuraEffectChange(e.target.value === 'none' ? null : (e.target.value as AuraEffectType))}
                  disabled={updatingAuraEffect || !hasAuraAccess}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {availableAuras.map(aura => (
                    <option key={aura.id} value={aura.value || 'none'}>
                      {aura.name}
                    </option>
                  ))}
                </select>
                {updatingAuraEffect && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating aura...</span>
                )}
                {!hasAuraAccess && (
                  <span className="text-xs text-gray-500 mt-1 block">Purchase a Gold+ Founder Pack to unlock aura effects</span>
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
                      disabled={updatingAuraColor || !hasAuraAccess}
                      className="w-12 h-8 rounded border border-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={hasAuraAccess ? "Pick a custom color for your aura glow" : "Requires Gold+ Founder Pack"}
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
                      disabled={updatingAuraColor || !hasAuraAccess}
                      placeholder="#FFD700"
                      className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <button
                      onClick={() => handleAuraColorChange(tempAuraColor)}
                      disabled={updatingAuraColor || !hasAuraAccess || tempAuraColor === (hero.auraColor || null)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                  {updatingAuraColor && (
                    <span className="text-xs text-gray-500 mt-1 block">Saving aura color...</span>
                  )}
                  {hasAuraAccess && (
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
                  )}
                </div>
              )}
              {/* Spell Effect Selection */}
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">
                  ⚡ Spell Effect 
                  {isAdmin && <span className="text-yellow-400"> (Admin: All Available)</span>}
                  {!hasSpellEffectAccess && <span className="text-red-400 text-xs ml-2">(Requires Gold+ Founder Pack)</span>}
                </label>
                <select
                  value={hero.spellEffect || 'none'}
                  onChange={(e) => handleSpellEffectChange(e.target.value === 'none' ? null : (e.target.value as SpellEffectType))}
                  disabled={updatingSpellEffect || !hasSpellEffectAccess}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {availableSpellEffects.map(effect => (
                    <option key={effect.id} value={effect.value || 'none'}>
                      {effect.name}
                    </option>
                  ))}
                </select>
                {updatingSpellEffect && (
                  <span className="text-xs text-gray-500 mt-1 block">Updating spell effect...</span>
                )}
                {!hasSpellEffectAccess && (
                  <span className="text-xs text-gray-500 mt-1 block">Purchase a Gold+ Founder Pack to unlock spell effects</span>
                )}
                {hasSpellEffectAccess && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enhances projectiles and ranged attacks
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Hero Sprite Preview */}
          <div className="flex flex-col items-center justify-center px-6" style={{ minWidth: '200px', maxWidth: '100%' }}>
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
            {/* Claim Idle Rewards Button */}
            <div className="mt-2">
              <button
                onClick={handleClaimIdleRewards}
                disabled={claimingRewards}
                className={`w-full px-3 py-2 text-sm font-semibold rounded transition-colors ${
                  claimingRewards
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title="Claim accumulated idle token rewards"
                style={{ minHeight: '40px', boxSizing: 'border-box' }}
              >
                <span className="inline-flex items-center justify-center w-full">
                  {claimingRewards ? 'Claiming...' : '💎 Claim Idle Rewards'}
                </span>
              </button>
              {claimMessage && (
                <div className={`mt-1 text-xs text-center ${
                  claimMessage.includes('claimed') ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {claimMessage}
                </div>
              )}
              {/* Last Claim Time */}
              {(lastClaimTime || hero.lastTokenClaim) && (
                <div className="mt-1 text-xs text-center text-gray-500">
                  Last claimed {formatTimeAgo(lastClaimTime || (hero.lastTokenClaim as any)?.toMillis?.() || hero.lastTokenClaim)}
                </div>
              )}
            </div>
            {/* Founder Pack Earning Boosts */}
            {heroTier && (
              <div className="mt-2 p-2 bg-amber-900/30 border border-amber-700/50 rounded text-left">
                <div className="text-xs font-semibold text-amber-400 mb-1">⭐ Founder Pack Benefits</div>
                <div className="text-xs text-gray-300 space-y-0.5">
                  {heroTier === 'bronze' && (
                    <>
                      <div>💰 +10% Gold from kills</div>
                      <div>💎 +0.5 tokens/hour</div>
                    </>
                  )}
                  {heroTier === 'silver' && (
                    <>
                      <div>💰 +20% Gold from kills</div>
                      <div>💎 +1.0 tokens/hour</div>
                    </>
                  )}
                  {heroTier === 'gold' && (
                    <>
                      <div>💰 +30% Gold from kills</div>
                      <div>💎 +1.5 tokens/hour</div>
                    </>
                  )}
                  {heroTier === 'platinum' && (
                    <>
                      <div>💰 +50% Gold from kills</div>
                      <div>💎 +2.0 tokens/hour</div>
                    </>
                  )}
                </div>
              </div>
            )}
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
