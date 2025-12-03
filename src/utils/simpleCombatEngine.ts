/**
 * Simple Combat Engine - Clean foundation to build on
 * Step-by-step implementation starting with basics
 */

export interface SimpleHero {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  role?: string;
  isDead?: boolean;
}

export interface SimpleEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  isDead?: boolean;
}

export interface SimpleCombatState {
  heroes: SimpleHero[];
  enemies: SimpleEnemy[];
  inCombat: boolean;
  round: number;
}

type AnimationType = 'idle' | 'attack' | 'hurt' | 'death';

export class SimpleCombatEngine {
  private state: SimpleCombatState;
  private animationCallbacks: Map<string, (entityId: string, animation: AnimationType, isHero: boolean) => void> = new Map();
  private combatTextCallbacks: Map<string, (entityId: string, amount: number, type: string, isHero: boolean) => void> = new Map();
  private combatInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(initialState: SimpleCombatState) {
    this.state = {
      ...initialState,
      heroes: initialState.heroes.map(h => ({ ...h, isDead: h.isDead || h.hp <= 0 })),
      enemies: initialState.enemies.map(e => ({ ...e, isDead: e.isDead || e.hp <= 0 })),
      round: 0
    };
  }

  getState(): SimpleCombatState {
    return { ...this.state };
  }

  onAnimation(callback: (entityId: string, animation: AnimationType, isHero: boolean) => void) {
    const id = Math.random().toString();
    this.animationCallbacks.set(id, callback);
    return () => this.animationCallbacks.delete(id);
  }

  onCombatText(callback: (entityId: string, amount: number, type: string, isHero: boolean) => void) {
    const id = Math.random().toString();
    this.combatTextCallbacks.set(id, callback);
    return () => this.combatTextCallbacks.delete(id);
  }

  private triggerAnimation(entityId: string, animation: AnimationType, isHero: boolean) {
    this.animationCallbacks.forEach(callback => {
      callback(entityId, animation, isHero);
    });
  }

  private triggerCombatText(entityId: string, amount: number, type: string, isHero: boolean) {
    this.combatTextCallbacks.forEach(callback => {
      callback(entityId, amount, type, isHero);
    });
  }

  // Basic attack calculation
  private calculateDamage(attacker: SimpleHero | SimpleEnemy, target: SimpleHero | SimpleEnemy): number {
    const baseDamage = attacker.attack;
    const defense = target.defense;
    const damage = Math.max(1, baseDamage - defense);
    return Math.floor(damage);
  }

  // Hero attacks enemy
  private heroAttack(hero: SimpleHero, enemy: SimpleEnemy): void {
    if (hero.isDead || enemy.isDead) return;

    this.triggerAnimation(hero.id, 'attack', true);
    
    const damage = this.calculateDamage(hero, enemy);
    enemy.hp = Math.max(0, enemy.hp - damage);
    
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.isDead = true;
      this.triggerAnimation(enemy.id, 'death', false);
    } else {
      this.triggerAnimation(enemy.id, 'hurt', false);
    }

    this.triggerCombatText(enemy.id, damage, 'damage', false);
  }

  // Enemy attacks hero
  private enemyAttack(enemy: SimpleEnemy, hero: SimpleHero): void {
    if (enemy.isDead || hero.isDead) return;

    this.triggerAnimation(enemy.id, 'attack', false);
    
    const damage = this.calculateDamage(enemy, hero);
    hero.hp = Math.max(0, hero.hp - damage);
    
    if (hero.hp <= 0) {
      hero.hp = 0;
      hero.isDead = true;
      this.triggerAnimation(hero.id, 'death', true);
    } else {
      this.triggerAnimation(hero.id, 'hurt', true);
    }

    this.triggerCombatText(hero.id, damage, 'damage', true);
  }

  // Simple combat round
  private async processRound(): Promise<void> {
    if (!this.isRunning) return;

    this.state.round++;

    const aliveHeroes = this.state.heroes.filter(h => !h.isDead);
    const aliveEnemies = this.state.enemies.filter(e => !e.isDead);

    // Check victory/defeat conditions
    if (aliveEnemies.length === 0) {
      this.stopCombat();
      return;
    }

    if (aliveHeroes.length === 0) {
      this.stopCombat();
      return;
    }

    // Heroes attack enemies
    aliveHeroes.forEach(hero => {
      const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      if (target && !target.isDead) {
        this.heroAttack(hero, target);
      }
    });

    // Wait a bit for animations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update alive enemies list (in case any died)
    const stillAliveEnemies = this.state.enemies.filter(e => !e.isDead);

    // Enemies attack heroes
    stillAliveEnemies.forEach(enemy => {
      const target = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      if (target && !target.isDead) {
        this.enemyAttack(enemy, target);
      }
    });

    // Wait a bit for animations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reset to idle
    aliveHeroes.forEach(hero => {
      if (!hero.isDead) {
        this.triggerAnimation(hero.id, 'idle', true);
      }
    });

    stillAliveEnemies.forEach(enemy => {
      if (!enemy.isDead) {
        this.triggerAnimation(enemy.id, 'idle', false);
      }
    });
  }

  startCombat(): void {
    if (this.isRunning) return;
    if (this.state.heroes.length === 0) return;
    if (this.state.enemies.length === 0) return;

    this.isRunning = true;
    this.state.inCombat = true;

    // Start combat loop
    const combatLoop = async () => {
      while (this.isRunning) {
        await this.processRound();
        
        // Check if combat should stop
        const aliveHeroes = this.state.heroes.filter(h => !h.isDead);
        const aliveEnemies = this.state.enemies.filter(e => !e.isDead);
        
        if (aliveHeroes.length === 0 || aliveEnemies.length === 0) {
          this.stopCombat();
          break;
        }

        // Wait between rounds
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };

    combatLoop();
  }

  stopCombat(): void {
    this.isRunning = false;
    this.state.inCombat = false;

    if (this.combatInterval) {
      clearInterval(this.combatInterval);
      this.combatInterval = null;
    }

    // Reset all to idle
    this.state.heroes.forEach(hero => {
      if (!hero.isDead) {
        this.triggerAnimation(hero.id, 'idle', true);
      }
    });

    this.state.enemies.forEach(enemy => {
      if (!enemy.isDead) {
        this.triggerAnimation(enemy.id, 'idle', false);
      }
    });
  }

  updateHeroes(heroes: SimpleHero[]): void {
    this.state.heroes = heroes.map(h => ({ ...h, isDead: h.isDead || h.hp <= 0 }));
  }

  updateEnemies(enemies: SimpleEnemy[]): void {
    this.state.enemies = enemies.map(e => ({ ...e, isDead: e.isDead || e.hp <= 0 }));
  }
}


