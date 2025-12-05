/**
 * Simplified Adventure Engine
 * Matches Electron app's adventureTick structure (game.js lines 8845-8962)
 * Extracted from fullCombatEngine.ts adventure loop methods
 */

import { CombatState, Hero, Enemy } from './combat/types';
import { ROLE_CONFIG, SHOP_ITEMS, HERB_GATHER_CHANCES } from './fullCombatEngine';
import { generateEnemiesForCombat } from './enemyGeneration';
import { getCharacterStats } from './combatUtils';

/**
 * Adventure Engine Class
 * Manages the adventure loop (encounters, treasure, travel)
 */
export class AdventureEngine {
  private state: CombatState;
  private adventureInterval: NodeJS.Timeout | null = null;
  private onEnemiesGenerated?: (enemies: Enemy[]) => void;
  private onLog?: (type: string, message: string) => void;
  private onStartCombat?: () => void;
  private onEndAdventure?: () => void;
  private onCheckHeroResurrection?: () => void;
  private onLevelUpHero?: (hero: Hero) => void;
  private onAutoBuyGear?: (hero: Hero) => void;
  private onApplyBuff?: (username: string, hero: Hero, buffType: string) => void;
  private onGathering?: (heroId: string, heroName: string, material: string, amount: number) => void;
  private onNPCEncounter?: (npcType: string, npcName: string) => void;

  constructor(state: CombatState) {
    this.state = state;
    // Initialize wave count if not set
    if (this.state.waveCount === undefined) {
      this.state.waveCount = 1;
    }
    if (this.state.isAdventuring === undefined) {
      this.state.isAdventuring = false;
    }
  }

  // Set callbacks for integration with fullCombatEngine
  setOnEnemiesGenerated(callback: (enemies: Enemy[]) => void) {
    this.onEnemiesGenerated = callback;
  }

  setOnLog(callback: (type: string, message: string) => void) {
    this.onLog = callback;
  }

  setOnStartCombat(callback: () => void) {
    this.onStartCombat = callback;
  }

  setOnEndAdventure(callback: () => void) {
    this.onEndAdventure = callback;
  }

  setOnCheckHeroResurrection(callback: () => void) {
    this.onCheckHeroResurrection = callback;
  }

  setOnLevelUpHero(callback: (hero: Hero) => void) {
    this.onLevelUpHero = callback;
  }

  setOnAutoBuyGear(callback: (hero: Hero) => void) {
    this.onAutoBuyGear = callback;
  }

  setOnApplyBuff(callback: (username: string, hero: Hero, buffType: string) => void) {
    this.onApplyBuff = callback;
  }

  setOnGathering(callback: (heroId: string, heroName: string, material: string, amount: number) => void) {
    this.onGathering = callback;
  }

  setOnNPCEncounter(callback: (npcType: string, npcName: string) => void) {
    this.onNPCEncounter = callback;
  }

  private log(type: string, message: string) {
    if (this.onLog) {
      this.onLog(type, message);
    }
  }

  /**
   * Start adventure loop
   * Matches Electron app's startAdventure() function
   */
  startAdventure() {
    if (this.state.isAdventuring) {
      return;
    }

    this.state.isAdventuring = true;
    this.log('system', '═══ Adventure Started ═══');

    // Start adventure loop - first tick immediately, then every 5 seconds
    // Matches Electron app: adventureTick called every 5 seconds (line 8845)
    setTimeout(() => {
      this.adventureTick();
    }, 1000);

    this.adventureInterval = setInterval(() => {
      this.adventureTick();
    }, 5000);
  }

  /**
   * Stop adventure loop
   */
  stopAdventure() {
    if (this.adventureInterval) {
      clearInterval(this.adventureInterval);
      this.adventureInterval = null;
    }
    this.state.isAdventuring = false;
  }

  /**
   * Main adventure loop tick
   * Matches Electron app's adventureTick() function (game.js lines 8845-8962)
   */
  adventureTick() {
    // Check for hero resurrection first (matches Electron app checkMidFightEmergency)
    if (this.onCheckHeroResurrection) {
      this.onCheckHeroResurrection();
    }

    // Don't progress if game is paused (matches Electron app line 8846)
    if (this.state.isPaused) {
      return;
    }

    // Don't progress if still fighting enemies OR waiting for death animations
    // CRITICAL: Check both currentEnemies and inCombat state to prevent merchant encounters during combat
    if ((this.state.currentEnemies && this.state.currentEnemies.length > 0) || this.state.inCombat) {
      return;
    }

    // Don't progress if combat is ending (waiting for death animation)
    if (this.state.combatEnding) {
      return;
    }

    // Don't progress if in edit mode (matches Electron app line 8860)
    if (this.state.editModePausedCombat) {
      return;
    }

    // CRITICAL: Only increment wave counter when a NEW encounter is created
    // Don't increment here - increment in encounterEnemy() instead
    // This prevents wave counter from incrementing during the same combat encounter

    // Every 10 waves, spawn a boss (matches Electron app line 8857)
    const isBossWave = (this.state.waveCount % 10 === 0);

    // Every 5 waves (non-boss), auto-rest (matches Electron app line 8860)
    const isAutoRestWave = (this.state.waveCount % 5 === 0) && !isBossWave;

    if (isBossWave) {
      this.log('system', `═══ WAVE ${this.state.waveCount} - BOSS WAVE ═══`);
      this.encounterEnemy(true); // true = boss
    } else if (isAutoRestWave) {
      // Auto-rest: 10-second rest period (matches Electron app line 8868)
      this.log('system', `😴 Wave ${this.state.waveCount}: Auto-rest period...`);
      // For now, just continue to next wave after a delay
      // TODO: Implement full auto-rest mechanics
      setTimeout(() => {
        this.adventureTick();
      }, 10000);
    } else {
      const rand = Math.random();

      if (rand < 0.4) {
        // Combat encounter (40% - matches Electron app line 8872)
        this.encounterEnemy(false);
      } else if (rand < 0.7) {
        // Find treasure (30% - matches Electron app line 8876-8905)
        this.findTreasure();
      } else {
        // Peaceful travel (30% - matches Electron app line 8907-8942)
        this.peacefulTravel();
      }
    }

    // Check if party is too weak to continue (matches Electron app lines 8954-8962)
    // Only end adventure if heroes are dead AND no enemies are present (no combat to continue)
    const heroes = Array.isArray(this.state.heroes) ? this.state.heroes : Array.from(this.state.heroes.values());
    let aliveHeroes = 0;
    heroes.forEach(hero => {
      if (hero && hero.hp > 0 && !hero.isDead) {
        aliveHeroes++;
      }
    });

    // Only end adventure if all heroes are dead AND no enemies are present
    // If enemies are present, wait for resurrection to potentially continue combat
    const hasEnemies = this.state.currentEnemies && this.state.currentEnemies.length > 0;
    const aliveEnemies = hasEnemies ? this.state.currentEnemies.filter(e => e.hp > 0 && !e.isDead).length : 0;

    if (aliveHeroes === 0) {
      if (aliveEnemies > 0) {
        // Enemies still present - don't end adventure, wait for potential resurrection
        this.log('system', '💀 All heroes are dead. Waiting for resurrection...');
      } else {
        // No enemies and all heroes dead - end adventure
        this.endAdventure();
      }
    }
  }

  /**
   * Encounter enemy - spawns enemies and starts combat
   * Matches Electron app's encounterEnemy() function
   */
  encounterEnemy(isBoss: boolean = false) {
    const heroes = Array.isArray(this.state.heroes) ? this.state.heroes : Array.from(this.state.heroes.values());

    if (heroes.length === 0) {
      return;
    }

    // Safety check: Don't spawn new enemies if there are already active enemies
    // This prevents enemies from being replaced during active combat
    if (this.state.currentEnemies && this.state.currentEnemies.length > 0) {
      const aliveEnemies = this.state.currentEnemies.filter(e => e.hp > 0 && !e.isDead);
      if (aliveEnemies.length > 0) {
        return;
      }
    }

    // Generate enemies using the same logic as Electron app
    // Pass full hero objects so gear score can be calculated
    const newEnemies = generateEnemiesForCombat(
      heroes, // Pass full hero objects for gear score calculation
      this.state.waveCount || 1,
      this.state.difficultyModifier || 1.0
    );

    // Mark as boss if needed
    if (isBoss && newEnemies.length > 0) {
      newEnemies[0].isBoss = true;
      // Boss gets extra stats
      newEnemies[0].hp = Math.floor(newEnemies[0].hp * 1.5);
      newEnemies[0].maxHp = Math.floor(newEnemies[0].maxHp * 1.5);
      newEnemies[0].attack = Math.floor(newEnemies[0].attack * 1.5);
    }

    if (newEnemies.length > 0) {
      // CRITICAL: Increment wave counter when a NEW encounter is created (matches Electron app)
      // Only increment when actually creating new enemies, not on every adventure tick
      if (!this.state.waveCount) {
        this.state.waveCount = 1;
      } else {
        this.state.waveCount++;
      }
      
      this.state.currentEnemies = newEnemies;
      this.state.inCombat = true;

      // Notify via callback so BrowserSourcePage can update state
      if (this.onEnemiesGenerated) {
        this.onEnemiesGenerated(newEnemies);
      }

      // Start combat via callback
      if (this.onStartCombat) {
        this.onStartCombat();
      }

      this.log('system', `⚔️ Wave ${this.state.waveCount}: The party encounters ${newEnemies.map(e => e.name).join(', ')}!`);
    }
  }

  /**
   * Find treasure - NPC encounter with auto-buy
   * Matches Electron app lines 8876-8905
   */
  findTreasure() {
    this.log('system', `💰 Searching for treasure... Wave ${this.state.waveCount}`);

    // Show NPC (random shop keeper) - matches Electron app lines 8882-8886
    const npcs = ['ALCHEMIST', 'BLACKSMITH', 'ENCHANTER'];
    const randomNPC = npcs[Math.floor(Math.random() * npcs.length)];
    const npcName = randomNPC.replace('_', ' ');
    this.log('system', `🧙 You encounter a ${npcName}! Auto-buying is enabled for those who have it on.`);

    // Auto-buy for heroes during merchant encounter (if autoBuy enabled)
    const heroes = Array.isArray(this.state.heroes) ? this.state.heroes : Array.from(this.state.heroes.values());
    heroes.forEach(hero => {
      if (!hero) return;

      // Auto-buy gear if enabled
      if (hero.autoBuy && this.onAutoBuyGear) {
        this.onAutoBuyGear(hero);
      }

      // Profession gathering during treasure hunting
      if (hero.profession) {
        if (hero.profession.type === 'herbalism') {
          this.gatherHerbs(hero);
        } else if (hero.profession.type === 'mining') {
          this.gatherOre(hero);
        }
      }
    });

    // Continue to next wave after delay (matches Electron app line 8878 - 8 second duration)
    setTimeout(() => {
      this.adventureTick();
    }, 8000);
  }

  /**
   * Peaceful travel - travel XP, NPC encounter, auto-buy
   * Matches Electron app lines 8907-8942
   */
  peacefulTravel() {
    this.log('system', `Wave ${this.state.waveCount}: The party travels through peaceful lands...`);

    // Show NPC (merchant or traveler) - matches Electron app lines 8912-8916
    const npcs = ['ALCHEMIST', 'BLACKSMITH', 'ENCHANTER'];
    const randomNPC = npcs[Math.floor(Math.random() * npcs.length)];
    const npcName = randomNPC.replace('_', ' ');
    this.log('system', `🧙 You encounter a traveling ${npcName}! Auto-buying is enabled for those who have it on.`);
    
    // Trigger NPC encounter callback
    if (this.onNPCEncounter) {
      this.onNPCEncounter(randomNPC, npcName);
    }

    const heroes = Array.isArray(this.state.heroes) ? this.state.heroes : Array.from(this.state.heroes.values());

    // Auto-buy and travel XP for heroes during travel
    heroes.forEach(hero => {
      if (!hero) return;

      // Auto-buy gear if enabled
      if (hero.autoBuy && this.onAutoBuyGear) {
        this.onAutoBuyGear(hero);
      }

      // Grant travel XP (matches Electron app line 8928)
      hero.xp = (hero.xp || 0) + 3;
      hero.maxXp = hero.maxXp || (100 + (hero.level * 10));

      // Handle level ups (matches Electron app lines 8930-8932)
      if (this.onLevelUpHero) {
        while (hero.xp >= hero.maxXp) {
          this.onLevelUpHero(hero);
        }
      }

      // Profession gathering during travel
      if (hero.profession) {
        if (hero.profession.type === 'herbalism') {
          this.gatherHerbs(hero);
        } else if (hero.profession.type === 'mining') {
          this.gatherOre(hero);
        }
      }
    });

    // Continue to next wave after delay (matches Electron app line 8908 - 8 second duration)
    setTimeout(() => {
      this.adventureTick();
    }, 8000);
  }

  /**
   * End adventure - called when all heroes are dead
   * Matches Electron app's endAdventure() function
   */
  endAdventure() {
    this.state.isAdventuring = false;
    this.stopAdventure();
    this.log('system', '═══ Adventure Complete ═══');

    // Auto-restart after a short break (matches Electron app line 15544-15548)
    setTimeout(() => {
      const heroes = Array.isArray(this.state.heroes) ? this.state.heroes : Array.from(this.state.heroes.values());
      if (heroes.length > 0) {
        if (this.onEndAdventure) {
          this.onEndAdventure();
        }
        this.startAdventure();
      }
    }, 10000); // 10 second break
  }

  /**
   * Gather herbs - matches Electron app lines 9507-9566
   */
  private gatherHerbs(hero: Hero) {
    if (!hero.profession || hero.profession.type !== 'herbalism') return;

    // Ensure materials object exists and is properly initialized
    if (!hero.profession.materials) {
      hero.profession.materials = {};
    }
    if (!hero.profession.materials.herbs) {
      hero.profession.materials.herbs = { common: 0, uncommon: 0, rare: 0, epic: 0 };
    }

    const profLevel = hero.profession.level || 1;
    let gatherChance = 0.60; // Base 60% chance

    // Higher profession level increases gather chance
    gatherChance += (profLevel - 1) * 0.02; // +2% per level above 1
    gatherChance = Math.min(gatherChance, 0.90); // Cap at 90%

    if (Math.random() < gatherChance) {
      // Determine herb rarity based on profession level
      const rand = Math.random();
      let herbType: 'common' | 'uncommon' | 'rare' | 'epic' = 'common';

      // Adjust rarity chances based on profession level
      let commonChance = HERB_GATHER_CHANCES.common;
      let uncommonChance = HERB_GATHER_CHANCES.uncommon;
      let rareChance = HERB_GATHER_CHANCES.rare;
      let epicChance = HERB_GATHER_CHANCES.epic;

      // Higher profession level increases rare/epic chances
      const levelBonus = (profLevel - 1) * 0.01; // +1% per level above 1
      commonChance -= levelBonus * 0.5;
      uncommonChance -= levelBonus * 0.3;
      rareChance += levelBonus * 0.15;
      epicChance += levelBonus * 0.05;

      if (rand < commonChance) {
        herbType = 'common';
      } else if (rand < commonChance + uncommonChance) {
        herbType = 'uncommon';
      } else if (rand < commonChance + uncommonChance + rareChance) {
        herbType = 'rare';
      } else {
        herbType = 'epic';
      }

      hero.profession.materials.herbs[herbType]++;
      hero.profession.totalGathered = (hero.profession.totalGathered || 0) + 1;
      hero.profession.lastGatherTime = Date.now();

      const herbNames = {
        common: 'Common Herb',
        uncommon: 'Uncommon Herb',
        rare: 'Rare Herb',
        epic: 'Epic Herb'
      };

      this.log('loot', `🌿 ${hero.username} gathered a ${herbNames[herbType]}! (${hero.profession.materials.herbs[herbType]} ${herbType} herbs)`);
      
      // Trigger gathering callback
      if (this.onGathering) {
        const heroId = hero.id || hero.name || hero.characterName || hero.username || '';
        const heroName = hero.name || hero.characterName || hero.username || 'Unknown';
        this.onGathering(heroId, heroName, herbNames[herbType], 1);
      }
    }
  }

  /**
   * Gather ore - matches Electron app lines 9569-9628
   */
  private gatherOre(hero: Hero) {
    if (!hero.profession || hero.profession.type !== 'mining') return;

    // Ensure materials object exists and is properly initialized
    if (!hero.profession.materials) {
      hero.profession.materials = {};
    }
    if (!hero.profession.materials.ore) {
      hero.profession.materials.ore = { iron: 0, steel: 0, mithril: 0, adamantite: 0 };
    }

    const profLevel = hero.profession.level || 1;
    let gatherChance = 0.60; // Base 60% chance

    // Higher profession level increases gather chance
    gatherChance += (profLevel - 1) * 0.02; // +2% per level above 1
    gatherChance = Math.min(gatherChance, 0.90); // Cap at 90%

    if (Math.random() < gatherChance) {
      // Determine ore type based on profession level
      const rand = Math.random();
      let oreType: 'iron' | 'steel' | 'mithril' | 'adamantite' = 'iron';

      // Adjust ore type chances based on profession level
      let ironChance = 0.70;
      let steelChance = 0.20;
      let mithrilChance = 0.08;
      let adamantiteChance = 0.02;

      // Higher profession level increases rare ore chances
      const levelBonus = (profLevel - 1) * 0.01;
      ironChance -= levelBonus * 0.5;
      steelChance -= levelBonus * 0.3;
      mithrilChance += levelBonus * 0.15;
      adamantiteChance += levelBonus * 0.05;

      if (rand < ironChance) {
        oreType = 'iron';
      } else if (rand < ironChance + steelChance) {
        oreType = 'steel';
      } else if (rand < ironChance + steelChance + mithrilChance) {
        oreType = 'mithril';
      } else {
        oreType = 'adamantite';
      }

      hero.profession.materials.ore[oreType]++;
      hero.profession.totalGathered = (hero.profession.totalGathered || 0) + 1;
      hero.profession.lastGatherTime = Date.now();

      const oreNames = {
        iron: 'Iron Ore',
        steel: 'Steel Ore',
        mithril: 'Mithril Ore',
        adamantite: 'Adamantite Ore'
      };

      this.log('loot', `⛏️ ${hero.username} gathered ${oreNames[oreType]}! (${hero.profession.materials.ore[oreType]} ${oreType} ore)`);
      
      // Trigger gathering callback
      if (this.onGathering) {
        const heroId = hero.id || hero.name || hero.characterName || hero.username || '';
        const heroName = hero.name || hero.characterName || hero.username || 'Unknown';
        this.onGathering(heroId, heroName, oreNames[oreType], 1);
      }
    }
  }
}
