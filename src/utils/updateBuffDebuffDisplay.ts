/**
 * Update Buff/Debuff Display
 * Updates the visual display of buffs and debuffs for heroes and enemies
 * Based on IdleDnD/game.js updateHeroBuffDisplay and updateHeroDebuffDisplay
 */

import { DEBUFFS } from './fullCombatEngine';

export interface Hero {
  id?: string;
  username: string;
  hp?: number;
  isDead?: boolean;
  activeDebuffs?: Record<string, any>;
  activeBuffs?: Record<string, any>;
  activeProcBuffs?: Record<string, number>;
  classAbilityState?: any;
  lastStandActive?: boolean;
  role?: string;
}

export interface Enemy {
  id: string | number;
  name: string;
  hp?: number;
  isDead?: boolean;
  activeDebuffs?: Record<string, any>;
}

/**
 * Update hero buff display
 */
export function updateHeroBuffDisplay(heroes: Hero[] | Map<string, Hero>): void {
  const now = Date.now();
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
  
  heroesArray.forEach((hero) => {
    if (!hero) return;
    
    // Find the battlefield sprite for this hero
    // CRITICAL: Match ID resolution priority from BrowserSourcePage.tsx rendering
    // Rendering uses: hero.id || hero.name || hero.characterName
    // Try all possible ID combinations to find the container
    const heroId = hero.id || hero.name || hero.characterName || hero.username;
    const heroIdAlt = hero.name || hero.characterName || hero.id || hero.username;
    const heroIdUsername = hero.username || hero.name || hero.characterName || hero.id;
    
    // Try multiple ID formats to find the container (defensive approach)
    let battlefieldSprite = document.querySelector(`#battle-hero-${heroId} .battle-buffs`) as HTMLElement;
    if (!battlefieldSprite && heroIdAlt !== heroId) {
      battlefieldSprite = document.querySelector(`#battle-hero-${heroIdAlt} .battle-buffs`) as HTMLElement;
    }
    if (!battlefieldSprite && heroIdUsername !== heroId && heroIdUsername !== heroIdAlt) {
      battlefieldSprite = document.querySelector(`#battle-hero-${heroIdUsername} .battle-buffs`) as HTMLElement;
    }
    
    if (!battlefieldSprite) {
      // Container not found - hero might not be rendered yet, or ID mismatch
      // This is expected during initial render or when heroes are being added/removed
      return;
    }
    
    // Skip dead heroes - no buffs on corpses
    if (hero.isDead || (hero.hp !== undefined && hero.hp <= 0)) {
      battlefieldSprite.innerHTML = '';
      return;
    }
    
    const buffGroups: Array<{ icon: string; name: string; timeLeft: number | string }> = [];
    
    // Check for class ability buffs (Divine Shield, Enrage, etc.)
    if (hero.classAbilityState) {
      // Divine Shield (Holy Defender)
      if (hero.classAbilityState.divineShieldActive && now < (hero.classAbilityState.divineShieldExpiry || 0)) {
        const timeLeft = Math.ceil(((hero.classAbilityState.divineShieldExpiry || 0) - now) / 1000);
        buffGroups.push({ icon: '✨', name: 'Divine Shield', timeLeft });
      }
      
      // Enrage (Berserker)
      if (hero.classAbilityState.enrageActive && now < (hero.classAbilityState.enrageExpiry || 0)) {
        const timeLeft = Math.ceil(((hero.classAbilityState.enrageExpiry || 0) - now) / 1000);
        buffGroups.push({ icon: '😡', name: 'Enrage', timeLeft });
      }
      
      // Shield Wall (Guardian)
      if (hero.classAbilityState.shieldWallActive && now < (hero.classAbilityState.shieldWallExpiry || 0)) {
        const timeLeft = Math.ceil(((hero.classAbilityState.shieldWallExpiry || 0) - now) / 1000);
        buffGroups.push({ icon: '🛡️', name: 'Shield Wall', timeLeft });
      }
      
      // Evasion (Vanguard)
      if (hero.classAbilityState.evasionActive && now < (hero.classAbilityState.evasionExpiry || 0)) {
        const timeLeft = Math.ceil(((hero.classAbilityState.evasionExpiry || 0) - now) / 1000);
        buffGroups.push({ icon: '⚡', name: 'Evasion', timeLeft });
      }
    }
    
    // Check for active buffs
    if (hero.activeBuffs) {
      if (hero.activeBuffs.attackMultiplier && hero.activeBuffs.attackMultiplier.remainingDuration > 0) {
        const timeLeft = Math.ceil(hero.activeBuffs.attackMultiplier.remainingDuration / 1000);
        buffGroups.push({ icon: '⚔️', name: hero.activeBuffs.attackMultiplier.name || 'Attack Boost', timeLeft });
      }
      
      if (hero.activeBuffs.defenseMultiplier && hero.activeBuffs.defenseMultiplier.remainingDuration > 0) {
        const timeLeft = Math.ceil(hero.activeBuffs.defenseMultiplier.remainingDuration / 1000);
        buffGroups.push({ icon: '🛡️', name: hero.activeBuffs.defenseMultiplier.name || 'Defense Boost', timeLeft });
      }
    }
    
    // Check for proc buffs
    if (hero.activeProcBuffs) {
      if (hero.activeProcBuffs.criticalStrike && now < hero.activeProcBuffs.criticalStrike) {
        const timeLeft = Math.ceil((hero.activeProcBuffs.criticalStrike - now) / 1000);
        buffGroups.push({ icon: '💥', name: 'Critical Strike', timeLeft });
      }
      
      if (hero.activeProcBuffs.ironSkin && now < hero.activeProcBuffs.ironSkin) {
        const timeLeft = Math.ceil((hero.activeProcBuffs.ironSkin - now) / 1000);
        buffGroups.push({ icon: '💎', name: 'Iron Skin', timeLeft });
      }
    }
    
    // Last Stand
    if (hero.lastStandActive) {
      buffGroups.push({ icon: '🛡️💥', name: 'Last Stand', timeLeft: '∞' });
    }
    
    const buffItems = buffGroups.map(b => 
      `<div class="battle-buff">
        <div class="battle-buff-icon">${b.icon}</div>
        <div class="battle-buff-time">${b.timeLeft}s</div>
      </div>`
    ).join('');
    
    battlefieldSprite.innerHTML = buffItems;
  });
}

/**
 * Update hero debuff display
 */
export function updateHeroDebuffDisplay(heroes: Hero[] | Map<string, Hero>): void {
  const now = Date.now();
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
  
  heroesArray.forEach((hero) => {
    if (!hero) return;
    
    // Find the battlefield sprite for this hero
    // CRITICAL: Match ID resolution priority from BrowserSourcePage.tsx rendering
    // Rendering uses: hero.id || hero.name || hero.characterName
    // Try all possible ID combinations to find the container
    const heroId = hero.id || hero.name || hero.characterName || hero.username;
    const heroIdAlt = hero.name || hero.characterName || hero.id || hero.username;
    const heroIdUsername = hero.username || hero.name || hero.characterName || hero.id;
    
    // Try multiple ID formats to find the container (defensive approach)
    let battlefieldSprite = document.querySelector(`#battle-hero-${heroId} .battle-debuffs`) as HTMLElement;
    if (!battlefieldSprite && heroIdAlt !== heroId) {
      battlefieldSprite = document.querySelector(`#battle-hero-${heroIdAlt} .battle-debuffs`) as HTMLElement;
    }
    if (!battlefieldSprite && heroIdUsername !== heroId && heroIdUsername !== heroIdAlt) {
      battlefieldSprite = document.querySelector(`#battle-hero-${heroIdUsername} .battle-debuffs`) as HTMLElement;
    }
    
    if (!battlefieldSprite) {
      // Container not found - hero might not be rendered yet, or ID mismatch
      // This is expected during initial render or when heroes are being added/removed
      return;
    }
    
    // Skip dead heroes - no debuffs on corpses
    if (!hero.activeDebuffs || hero.isDead || (hero.hp !== undefined && hero.hp <= 0)) {
      battlefieldSprite.innerHTML = '';
      return;
    }
    
    const debuffGroups: Record<string, { icon: string; count: number; timeLeft: number }> = {};
    
    // Group debuffs by type
    Object.entries(hero.activeDebuffs).forEach(([debuffKey, debuff]) => {
      if (debuff && debuff.expiresAt && debuff.expiresAt > now) {
        const debuffInfo = DEBUFFS[debuffKey];
        if (debuffInfo) {
          const timeLeft = Math.ceil((debuff.expiresAt - now) / 1000);
          if (!debuffGroups[debuffKey]) {
            debuffGroups[debuffKey] = { icon: debuffInfo.icon, count: 0, timeLeft };
          }
          debuffGroups[debuffKey].count++;
          debuffGroups[debuffKey].timeLeft = Math.min(debuffGroups[debuffKey].timeLeft, timeLeft);
        }
      }
    });
    
    const debuffItems = Object.values(debuffGroups).map(d => 
      `<div class="battle-debuff">
        <div class="battle-debuff-icon">${d.icon}${d.count > 1 ? `x${d.count}` : ''}</div>
        <div class="battle-debuff-time">${d.timeLeft}s</div>
      </div>`
    ).join('');
    
    battlefieldSprite.innerHTML = debuffItems;
  });
}

/**
 * Update enemy debuff display
 */
export function updateEnemyDebuffDisplay(enemies: Enemy[]): void {
  if (!enemies || enemies.length === 0) return;
  
  const now = Date.now();
  
  enemies.forEach((enemy) => {
    if (!enemy) return;
    
    // Use same ID resolution as rendering: prefer id, then name, then type, then fallback
    const enemyId = enemy.id || enemy.name || enemy.type || `enemy-unknown`;
    
    // Find the battlefield sprite for this enemy
    const battlefieldSprite = document.querySelector(`#battle-enemy-${enemyId} .battle-debuffs`) as HTMLElement;
    
    if (!battlefieldSprite) return;
    
    // Skip dead enemies - no debuffs on corpses
    if (!enemy.activeDebuffs || enemy.isDead || (enemy.hp !== undefined && enemy.hp <= 0)) {
      battlefieldSprite.innerHTML = '';
      return;
    }
    
    const debuffGroups: Record<string, { icon: string; count: number; timeLeft: number }> = {};
    
    // Group debuffs by type
    Object.entries(enemy.activeDebuffs).forEach(([debuffKey, debuff]) => {
      if (debuff && debuff.expiresAt && debuff.expiresAt > now) {
        const debuffInfo = DEBUFFS[debuffKey];
        if (debuffInfo) {
          const timeLeft = Math.ceil((debuff.expiresAt - now) / 1000);
          if (!debuffGroups[debuffKey]) {
            debuffGroups[debuffKey] = { icon: debuffInfo.icon, count: 0, timeLeft };
          }
          debuffGroups[debuffKey].count++;
          debuffGroups[debuffKey].timeLeft = Math.min(debuffGroups[debuffKey].timeLeft, timeLeft);
        }
      }
    });
    
    const debuffItems = Object.values(debuffGroups).map(d => 
      `<div class="battle-debuff">
        <div class="battle-debuff-icon">${d.icon}${d.count > 1 ? `x${d.count}` : ''}</div>
        <div class="battle-debuff-time">${d.timeLeft}s</div>
      </div>`
    ).join('');
    
    battlefieldSprite.innerHTML = debuffItems;
  });
}
