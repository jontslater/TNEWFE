/**
 * Initiative System
 * Handles turn order calculation (d20 + dexterity)
 */

import { CombatState, Hero, Enemy, Combatant, InitiativeEntry } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';

/**
 * Calculate initiative for all combatants and sort by turn order
 */
export function calculateInitiative(
  heroes: Hero[] | Map<string, Hero>,
  enemies: Enemy[],
  getCharacterStats: (hero: Hero) => any
): Combatant[] {
  const combatants: Combatant[] = [];
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());

  // Add heroes with initiative rolls
  // CRITICAL: Deduplicate heroes by username to prevent duplicate attacks
  const seenHeroes = new Set<string>();
  heroesArray.forEach((hero) => {
    if (!hero) return;
    
    // Skip if this hero has already been processed (deduplicate by username)
    if (seenHeroes.has(hero.username)) {
      return;
    }
    seenHeroes.add(hero.username);
    
    if (hero.hp > 0 && !hero.isDead && !hero.activeDebuffs?.stunned) {
      const stats = getCharacterStats(hero);
      const dexterity = stats.dexterity || hero.dexterity || 0;
      const initiative = Math.floor(Math.random() * 20) + 1 + dexterity; // d20 + dexterity
      
      combatants.push({
        type: 'hero',
        username: hero.username,
        hero: hero,
        initiative: initiative,
        dexterity: dexterity
      });
    }
  });

  // Add enemies with initiative rolls (enemies have base dexterity based on type)
  enemies.forEach((enemy) => {
    if (!enemy || enemy.isDead || enemy.hp <= 0) return;

    // Base enemy dexterity varies by type (agile enemies get more)
    let baseDex = 5; // Default dexterity
    if (enemy.name && (enemy.name.includes('Assassin') || enemy.name.includes('Rogue') || enemy.name.includes('Imp'))) {
      baseDex = 12; // Fast enemies
    } else if (enemy.name && (enemy.name.includes('Dragon') || enemy.name.includes('Witch') || enemy.name.includes('Mage'))) {
      baseDex = 8; // Spellcasters slightly faster
    } else if (enemy.isBoss) {
      baseDex = 10; // Bosses are faster
    }

    // Only calculate initiative if not already set (use stored value for this combat round)
    if (!enemy.initiative) {
      enemy.initiative = Math.floor(Math.random() * 20) + 1 + baseDex; // d20 + dexterity
    }
    const initiative = enemy.initiative;
    
    combatants.push({
      type: 'enemy',
      enemy: enemy,
      initiative: initiative,
      dexterity: baseDex
    });
  });

  // Sort by initiative (highest first)
  combatants.sort((a, b) => b.initiative - a.initiative);

  return combatants;
}

/**
 * Create initiative order entries for display
 */
export function createInitiativeOrder(combatants: Combatant[]): InitiativeEntry[] {
  return combatants.map(c => ({
    type: c.type,
    name: c.type === 'hero' ? (c.username || 'Unknown') : (c.enemy?.name || 'Unknown'),
    initiative: c.initiative,
    dexterity: c.type === 'hero' ? (c.hero?.dexterity || 0) : (c.dexterity || 0),
    isDead: c.type === 'hero' 
      ? (c.hero?.isDead || c.hero?.hp <= 0 || false) 
      : (c.enemy?.isDead || c.enemy?.hp <= 0 || false)
  }));
}
