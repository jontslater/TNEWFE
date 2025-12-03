/**
 * Turn-Based Combat System
 * Handles initiative calculation and turn order processing
 */

export interface Combatant {
  type: 'hero' | 'enemy';
  id: string;
  name: string;
  initiative: number;
  dexterity: number;
  isDead: boolean;
}

export interface TurnAction {
  combatant: Combatant;
  action: 'attack' | 'heal' | 'ability';
  targetId?: string;
  delay: number; // Delay in ms before executing this action
}

/**
 * Calculate initiative for all combatants
 * Formula: d20 + dexterity
 */
export function calculateInitiative(
  heroes: Array<{ id: string; name: string; hp: number; dexterity?: number; activeDebuffs?: Record<string, any> }>,
  enemies: Array<{ id: string; name: string; hp: number; dexterity?: number; initiative?: number; isDead?: boolean }>
): Combatant[] {
  const combatants: Combatant[] = [];

  // Add heroes with initiative rolls
  heroes.forEach((hero) => {
    if (!hero || hero.hp <= 0 || hero.activeDebuffs?.stunned) return;
    
    const dexterity = hero.dexterity || 0;
    const initiative = Math.floor(Math.random() * 20) + 1 + dexterity; // d20 + dexterity
    
    combatants.push({
      type: 'hero',
      id: hero.id,
      name: hero.name,
      initiative: initiative,
      dexterity: dexterity,
      isDead: false
    });
  });

  // Add enemies with initiative rolls
  enemies.forEach((enemy) => {
    if (!enemy || enemy.isDead || enemy.hp <= 0) return;

    // Base enemy dexterity varies by type
    let baseDex = 5; // Default dexterity
    if (enemy.name && (enemy.name.includes('Imp') || enemy.name.includes('Assassin'))) {
      baseDex = 12; // Fast enemies
    } else if (enemy.name && (enemy.name.includes('Dragon') || enemy.name.includes('Witch') || enemy.name.includes('Mage'))) {
      baseDex = 8; // Spellcasters slightly faster
    }
    
    const dexterity = enemy.dexterity || baseDex;
    
    // Only calculate initiative if not already set (use stored value for this combat round)
    if (!enemy.initiative) {
      enemy.initiative = Math.floor(Math.random() * 20) + 1 + dexterity; // d20 + dexterity
    }
    const initiative = enemy.initiative;
    
    combatants.push({
      type: 'enemy',
      id: enemy.id,
      name: enemy.name,
      initiative: initiative,
      dexterity: dexterity,
      isDead: enemy.isDead || false
    });
  });

  // Sort by initiative (highest first)
  combatants.sort((a, b) => b.initiative - a.initiative);

  return combatants;
}

/**
 * Create turn actions for a combat round
 * Each combatant gets an action (attack, heal, etc.)
 */
export function createTurnActions(combatants: Combatant[]): TurnAction[] {
  const actions: TurnAction[] = [];
  const ACTION_DELAY = 800; // Delay between actions (ms)

  combatants.forEach((combatant, index) => {
    if (combatant.isDead) return;

    // For now, all actions are attacks
    // Later we can add logic for healers to heal, etc.
    actions.push({
      combatant: combatant,
      action: 'attack',
      delay: index * ACTION_DELAY
    });
  });

  return actions;
}











