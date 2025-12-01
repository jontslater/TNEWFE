/**
 * Simplified Combat Simulation for Browser Source
 * Runs locally in the browser without backend calls
 * Simulates combat rounds and triggers animations
 */

export interface CombatEntity {
  id: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  isDead?: boolean;
  name?: string;
  role?: string;
}

export interface CombatState {
  heroes: CombatEntity[];
  enemies: CombatEntity[];
  inCombat: boolean;
  round: number;
  heroAnimations: Record<string, 'idle' | 'attack' | 'hurt' | 'death'>;
  enemyAnimations: Record<string, 'idle' | 'attack' | 'hurt' | 'death'>;
}

export interface CombatEvent {
  type: 'hero_attack' | 'enemy_attack' | 'damage' | 'death' | 'heal';
  attackerId?: string;
  targetId?: string;
  damage?: number;
  entityId?: string;
  timestamp: number;
}

type AnimationCallback = (entityId: string, animation: 'idle' | 'attack' | 'hurt' | 'death') => void;
type CombatEventCallback = (event: CombatEvent) => void;

/**
 * Simplified Combat Simulator
 */
export class CombatSimulator {
  private state: CombatState;
  private combatInterval: NodeJS.Timeout | null = null;
  private animationCallbacks: AnimationCallback[] = [];
  private eventCallbacks: CombatEventCallback[] = [];
  private isRunning = false;
  
  // Combat timing constants
  private readonly COMBAT_ROUND_INTERVAL = 2000; // 2 seconds per round
  private readonly ATTACK_ANIMATION_DURATION = 800; // Attack animation duration
  private readonly HURT_ANIMATION_DURATION = 600; // Hurt animation duration

  constructor(
    heroes: CombatEntity[],
    enemies: CombatEntity[]
  ) {
    this.state = {
      heroes: heroes.map(h => ({ ...h })),
      enemies: enemies.map(e => ({ ...e })),
      inCombat: false,
      round: 0,
      heroAnimations: {},
      enemyAnimations: {}
    };
  }

  /**
   * Start combat simulation
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.state.inCombat = true;
    this.state.round = 0;
    
    // Initialize all animations to idle
    this.state.heroes.forEach(hero => {
      if (hero.hp > 0 && !hero.isDead) {
        this.state.heroAnimations[hero.id] = 'idle';
        this.triggerAnimation(hero.id, 'idle', 'hero');
      } else {
        this.state.heroAnimations[hero.id] = 'death';
        this.triggerAnimation(hero.id, 'death', 'hero');
      }
    });
    
    this.state.enemies.forEach(enemy => {
      if (enemy.hp > 0 && !enemy.isDead) {
        this.state.enemyAnimations[enemy.id] = 'idle';
        this.triggerAnimation(enemy.id, 'idle', 'enemy');
      } else {
        this.state.enemyAnimations[enemy.id] = 'death';
        this.triggerAnimation(enemy.id, 'death', 'enemy');
      }
    });
    
    // Start combat loop
    this.processCombatRound();
  }

  /**
   * Stop combat simulation
   */
  stop() {
    this.isRunning = false;
    this.state.inCombat = false;
    
    if (this.combatInterval) {
      clearTimeout(this.combatInterval);
      this.combatInterval = null;
    }
    
    // Set all to idle
    Object.keys(this.state.heroAnimations).forEach(id => {
      if (this.state.heroAnimations[id] !== 'death') {
        this.state.heroAnimations[id] = 'idle';
        this.triggerAnimation(id, 'idle', 'hero');
      }
    });
    
    Object.keys(this.state.enemyAnimations).forEach(id => {
      if (this.state.enemyAnimations[id] !== 'death') {
        this.state.enemyAnimations[id] = 'idle';
        this.triggerAnimation(id, 'idle', 'enemy');
      }
    });
  }

  /**
   * Update hero/enemy state (from Firebase)
   */
  updateEntities(heroes: CombatEntity[], enemies: CombatEntity[]) {
    // Update heroes
    this.state.heroes = heroes.map(h => {
      const existing = this.state.heroes.find(e => e.id === h.id);
      return { ...h, ...existing };
    });
    
    // Update enemies
    this.state.enemies = enemies.map(e => {
      const existing = this.state.enemies.find(ex => ex.id === e.id);
      return { ...e, ...existing };
    });
    
    // Check for death state changes
    this.checkDeathStates();
  }

  /**
   * Process a combat round
   */
  private processCombatRound() {
    if (!this.isRunning) return;
    
    // Check if combat should end
    const aliveHeroes = this.state.heroes.filter(h => h.hp > 0 && !h.isDead);
    const aliveEnemies = this.state.enemies.filter(e => e.hp > 0 && !e.isDead);
    
    if (aliveHeroes.length === 0 || aliveEnemies.length === 0) {
      this.stop();
      return;
    }
    
    this.state.round++;
    
    // Process hero attacks
    aliveHeroes.forEach((hero, index) => {
      setTimeout(() => {
        if (!this.isRunning) return;
        this.processHeroAttack(hero, aliveEnemies);
      }, index * 200); // Stagger hero attacks slightly
    });
    
    // Process enemy attacks after hero attacks
    setTimeout(() => {
      if (!this.isRunning) return;
      aliveEnemies.forEach((enemy, index) => {
        setTimeout(() => {
          if (!this.isRunning) return;
          this.processEnemyAttack(enemy, aliveHeroes);
        }, index * 200); // Stagger enemy attacks slightly
      });
      
      // Schedule next round
      this.combatInterval = setTimeout(() => {
        this.processCombatRound();
      }, this.COMBAT_ROUND_INTERVAL);
    }, aliveHeroes.length * 200 + this.ATTACK_ANIMATION_DURATION);
  }

  /**
   * Process a hero attack
   */
  private processHeroAttack(hero: CombatEntity, enemies: CombatEntity[]) {
    if (!hero || hero.hp <= 0 || hero.isDead) return;
    if (enemies.length === 0) return;
    
    // Pick random enemy target
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    if (!target || target.hp <= 0 || target.isDead) return;
    
    // Trigger attack animation
    this.state.heroAnimations[hero.id] = 'attack';
    this.triggerAnimation(hero.id, 'attack', 'hero');
    
    // Return to idle after attack animation
    setTimeout(() => {
      if (this.state.heroAnimations[hero.id] === 'attack' && hero.hp > 0) {
        this.state.heroAnimations[hero.id] = 'idle';
        this.triggerAnimation(hero.id, 'idle', 'hero');
      }
    }, this.ATTACK_ANIMATION_DURATION);
    
    // Calculate damage
    const damage = Math.max(1, hero.attack - target.defense);
    const finalDamage = Math.floor(damage + (Math.random() * damage * 0.2)); // 0-20% variance
    
    // Apply damage after attack animation
    setTimeout(() => {
      if (!this.isRunning || target.hp <= 0 || target.isDead) return;
      
      // Apply damage
      const oldHp = target.hp;
      target.hp = Math.max(0, target.hp - finalDamage);
      
      // Trigger hurt animation on target
      this.state.enemyAnimations[target.id] = 'hurt';
      this.triggerAnimation(target.id, 'hurt', 'enemy');
      
      // Emit damage event
      this.emitEvent({
        type: 'damage',
        attackerId: hero.id,
        targetId: target.id,
        damage: finalDamage,
        timestamp: Date.now()
      });
      
      // Check for death
      if (target.hp <= 0) {
        target.isDead = true;
        this.state.enemyAnimations[target.id] = 'death';
        this.triggerAnimation(target.id, 'death', 'enemy');
        
        this.emitEvent({
          type: 'death',
          targetId: target.id,
          timestamp: Date.now()
        });
      } else {
        // Return to idle after hurt animation
        setTimeout(() => {
          if (this.state.enemyAnimations[target.id] === 'hurt' && target.hp > 0) {
            this.state.enemyAnimations[target.id] = 'idle';
            this.triggerAnimation(target.id, 'idle', 'enemy');
          }
        }, this.HURT_ANIMATION_DURATION);
      }
    }, this.ATTACK_ANIMATION_DURATION);
  }

  /**
   * Process an enemy attack
   */
  private processEnemyAttack(enemy: CombatEntity, heroes: CombatEntity[]) {
    if (!enemy || enemy.hp <= 0 || enemy.isDead) return;
    if (heroes.length === 0) return;
    
    // Pick random hero target (prefer tanks)
    const tanks = heroes.filter(h => {
      const tanks = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
      return h.role && tanks.includes(h.role);
    });
    
    const target = tanks.length > 0 && Math.random() < 0.6
      ? tanks[Math.floor(Math.random() * tanks.length)]
      : heroes[Math.floor(Math.random() * heroes.length)];
    
    if (!target || target.hp <= 0 || target.isDead) return;
    
    // Trigger attack animation
    this.state.enemyAnimations[enemy.id] = 'attack';
    this.triggerAnimation(enemy.id, 'attack', 'enemy');
    
    // Return to idle after attack animation
    setTimeout(() => {
      if (this.state.enemyAnimations[enemy.id] === 'attack' && enemy.hp > 0) {
        this.state.enemyAnimations[enemy.id] = 'idle';
        this.triggerAnimation(enemy.id, 'idle', 'enemy');
      }
    }, this.ATTACK_ANIMATION_DURATION);
    
    // Calculate damage
    const damage = Math.max(1, enemy.attack - target.defense);
    const finalDamage = Math.floor(damage + (Math.random() * damage * 0.2)); // 0-20% variance
    
    // Apply damage after attack animation
    setTimeout(() => {
      if (!this.isRunning || target.hp <= 0 || target.isDead) return;
      
      // Apply damage
      const oldHp = target.hp;
      target.hp = Math.max(0, target.hp - finalDamage);
      
      // Trigger hurt animation on target
      this.state.heroAnimations[target.id] = 'hurt';
      this.triggerAnimation(target.id, 'hurt', 'hero');
      
      // Emit damage event
      this.emitEvent({
        type: 'damage',
        attackerId: enemy.id,
        targetId: target.id,
        damage: finalDamage,
        timestamp: Date.now()
      });
      
      // Check for death
      if (target.hp <= 0) {
        target.isDead = true;
        this.state.heroAnimations[target.id] = 'death';
        this.triggerAnimation(target.id, 'death', 'hero');
        
        this.emitEvent({
          type: 'death',
          targetId: target.id,
          timestamp: Date.now()
        });
      } else {
        // Return to idle after hurt animation
        setTimeout(() => {
          if (this.state.heroAnimations[target.id] === 'hurt' && target.hp > 0) {
            this.state.heroAnimations[target.id] = 'idle';
            this.triggerAnimation(target.id, 'idle', 'hero');
          }
        }, this.HURT_ANIMATION_DURATION);
      }
    }, this.ATTACK_ANIMATION_DURATION);
  }

  /**
   * Check for death state changes
   */
  private checkDeathStates() {
    this.state.heroes.forEach(hero => {
      const wasDead = this.state.heroAnimations[hero.id] === 'death';
      const isDead = hero.hp <= 0 || hero.isDead;
      
      if (!wasDead && isDead) {
        this.state.heroAnimations[hero.id] = 'death';
        this.triggerAnimation(hero.id, 'death', 'hero');
      } else if (wasDead && !isDead) {
        this.state.heroAnimations[hero.id] = 'idle';
        this.triggerAnimation(hero.id, 'idle', 'hero');
      }
    });
    
    this.state.enemies.forEach(enemy => {
      const wasDead = this.state.enemyAnimations[enemy.id] === 'death';
      const isDead = enemy.hp <= 0 || enemy.isDead;
      
      if (!wasDead && isDead) {
        this.state.enemyAnimations[enemy.id] = 'death';
        this.triggerAnimation(enemy.id, 'death', 'enemy');
      } else if (wasDead && !isDead) {
        this.state.enemyAnimations[enemy.id] = 'idle';
        this.triggerAnimation(enemy.id, 'idle', 'enemy');
      }
    });
  }

  /**
   * Trigger animation callback
   */
  private triggerAnimation(entityId: string, animation: 'idle' | 'attack' | 'hurt' | 'death', type: 'hero' | 'enemy') {
    this.animationCallbacks.forEach(callback => {
      callback(entityId, animation);
    });
  }

  /**
   * Emit combat event
   */
  private emitEvent(event: CombatEvent) {
    this.eventCallbacks.forEach(callback => {
      callback(event);
    });
  }

  /**
   * Subscribe to animation changes
   */
  onAnimation(callback: AnimationCallback) {
    this.animationCallbacks.push(callback);
    
    return () => {
      const index = this.animationCallbacks.indexOf(callback);
      if (index > -1) {
        this.animationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to combat events
   */
  onEvent(callback: CombatEventCallback) {
    this.eventCallbacks.push(callback);
    
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current animation state
   */
  getAnimations() {
    return {
      heroAnimations: { ...this.state.heroAnimations },
      enemyAnimations: { ...this.state.enemyAnimations }
    };
  }

  /**
   * Get current combat state
   */
  getState() {
    return {
      ...this.state,
      heroes: this.state.heroes.map(h => ({ ...h })),
      enemies: this.state.enemies.map(e => ({ ...e }))
    };
  }
}
