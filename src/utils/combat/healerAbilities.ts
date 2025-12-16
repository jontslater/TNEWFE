/**
 * Healer Abilities
 * Handles all healer-specific abilities:
 * - Group Heal (when party average HP < 70%)
 * - Instant Heal (when any hero < 30% HP)
 * - Combat Resurrection (priority-based)
 * - Dispel (removes debuffs)
 * - Chronomender Rewind (HP snapshot restoration)
 * - Prayer of Mending (Cleric)
 * - Rejuvenation (Druid)
 * - Healing Totems (Shaman)
 * - Essence Font (Mistweaver)
 * - Battle Hymn (Bard)
 * - Healing Melody (Bard)
 * - Beacon of Light (Lightbringer)
 */

import { Hero, Enemy, CombatCallbacks, ViewerBonuses } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';
import { calculateHealing, applyHealing as applyHealingToHero } from './healing';
import { applyShield } from './healing';

/**
 * Process healer abilities for a single healer
 */
export function processHealerAbilities(
  healer: Hero,
  heroes: Hero[] | Map<string, Hero>,
  enemies: Enemy[],
  now: number,
  bonuses: ViewerBonuses,
  callbacks: CombatCallbacks,
  calculateSkillBonuses: (hero: Hero) => any
): { didHeal: boolean; didCombatRes: boolean; healingAmount: number } {
  let didHeal = false;
  let didCombatRes = false;
  let healingAmount = 0;

  if (!healer || healer.hp <= 0 || healer.isDead) {
    return { didHeal, didCombatRes, healingAmount };
  }

  const category = ROLE_CONFIG[healer.role]?.category || 'dps';
  if (category !== 'healer') {
    return { didHeal, didCombatRes, healingAmount };
  }

  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());

  // Initialize cooldowns if needed
  if (!healer.cooldowns) {
    healer.cooldowns = {
      classAbility: 0,
      classAbilityPrimary: 0,
      classAbilitySecondary: 0,
      procBuff: 0,
      lastStand: 0,
      groupHeal: 0,
      instantHeal: 0,
      debuffEnemy: 0,
      combatRes: 0,
      dispel: 0
    };
  }

  // HEALER: GROUP HEAL - When party average HP is below 70%
  if (now >= healer.cooldowns.groupHeal) {
    let totalHpPercent = 0;
    let aliveCount = 0;

    heroesArray.forEach((h) => {
      if (h && h.hp > 0 && !h.isDead) {
        totalHpPercent += (h.hp / h.maxHp);
        aliveCount++;
      }
    });

    const avgHpPercent = aliveCount > 0 ? totalHpPercent / aliveCount : 1;

    if (avgHpPercent < 0.7) {
      // Heal entire party (scales with healer's attack stat)
      let healedCount = 0;
      heroesArray.forEach((h) => {
        if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;

        // Group heal base: 40-60 HP + scales with healer attack (50% of attack)
        const baseGroupHeal = Math.floor(Math.random() * 20) + 40;
        let groupHealAmount = calculateHealing(
          baseGroupHeal + Math.floor(healer.attack * 0.5),
          healer,
          bonuses,
          calculateSkillBonuses
        );

        // Check for cursed debuff
        if (h.activeDebuffs?.cursed) {
          groupHealAmount *= 0.5;
        }

        // Apply healing with overheal shield
        const { actualHeal, overhealAmount } = applyHealingToHero(h, groupHealAmount, now, true);

        if (actualHeal > 0) {
          healingAmount += actualHeal;
          didHeal = true;
          healedCount++;

          if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
          healer.stats.totalHealing += actualHeal;

          if (overhealAmount > 0) {
            callbacks.log('heal', `💙 ${h.username} gains ${Math.floor(overhealAmount)} shield from overheal!`);
          }
        }
      });

      if (healedCount > 0) {
        callbacks.log('heal', `🌊 ${healer.username} uses GROUP HEAL! Restores ${healedCount} heroes!`);
        healer.cooldowns!.groupHeal = now + 30000; // 30 second cooldown
      }
    }
  }

  // HEALER: INSTANT HEAL - Can trigger any time someone is below 30% HP
  if (now >= healer.cooldowns!.instantHeal) {
    let criticalHero: Hero | null = null;
    let lowestHpPercent = 0.3; // Only trigger for heroes below 30%

    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead) return;

      const hp = h.hp / h.maxHp;
      if (hp < lowestHpPercent) {
        lowestHpPercent = hp;
        criticalHero = h;
      }
    });

    if (criticalHero) {
      // Instant heal: 70-100 HP + scales with healer attack (100% of attack)
      const baseInstantHeal = Math.floor(Math.random() * 30) + 70;
      let instantHealAmount = calculateHealing(
        baseInstantHeal + healer.attack,
        healer,
        bonuses,
        calculateSkillBonuses
      );

      // Check for cursed debuff
      if (criticalHero.activeDebuffs?.cursed) {
        instantHealAmount *= 0.5;
      }

      // Apply healing with overheal shield
      const { actualHeal, overhealAmount } = applyHealingToHero(criticalHero, instantHealAmount, now, true);

      if (actualHeal > 0) {
        healingAmount += actualHeal;
        didHeal = true;

        if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
        healer.stats.totalHealing += actualHeal;

        if (overhealAmount > 0) {
          callbacks.log('heal', `💙 ${criticalHero.username} gains ${Math.floor(overhealAmount)} shield from overheal!`);
        }

        callbacks.triggerHealAnimation(criticalHero.username);
        callbacks.log('heal', `⚡💚 ${healer.username} uses INSTANT HEAL on ${criticalHero.username} for ${Math.floor(actualHeal)} HP!`);
        healer.cooldowns!.instantHeal = now + 20000; // 20 second cooldown
      }
    }
  }

  // CHRONOMENDER: REWIND - Restores HP snapshot when ally takes burst damage
  if (healer.role === 'chronomancer' && now >= healer.cooldowns!.classAbilityPrimary) {
    // Initialize hpSnapshot if needed
    if (!healer.classAbilityState) {
      healer.classAbilityState = { hpSnapshot: {} };
    }
    if (!healer.classAbilityState.hpSnapshot) {
      healer.classAbilityState.hpSnapshot = {};
    }

    // Update snapshots every combat tick
    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead) return;

      if (!healer.classAbilityState!.hpSnapshot![h.username]) {
        healer.classAbilityState!.hpSnapshot![h.username] = [];
      }

      healer.classAbilityState!.hpSnapshot![h.username].push({
        time: now,
        hp: h.hp
      });

      // Keep only last 10 seconds
      healer.classAbilityState!.hpSnapshot![h.username] = healer.classAbilityState!.hpSnapshot![h.username].filter(
        s => now - s.time < 10000
      );
    });

    // Check if someone dropped below 20% from above 60% in last 10s
    let rewindTarget: Hero | null = null;
    let rewindTargetName: string | null = null;

    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead) return;

      const hpPercent = h.hp / h.maxHp;
      if (hpPercent < 0.2 && healer.classAbilityState!.hpSnapshot![h.username]) {
        // Find snapshot where they had > 60% HP
        const goodSnapshot = healer.classAbilityState!.hpSnapshot![h.username].find(
          s => s.hp >= h.maxHp * 0.6
        );

        if (goodSnapshot) {
          rewindTarget = h;
          rewindTargetName = h.username;
        }
      }
    });

    if (rewindTarget && rewindTargetName) {
      const goodSnapshot = healer.classAbilityState!.hpSnapshot![rewindTargetName].find(
        s => s.hp >= rewindTarget!.maxHp * 0.6
      );

      if (goodSnapshot) {
        const hpBefore = rewindTarget.hp;
        rewindTarget.hp = Math.min(goodSnapshot.hp, rewindTarget.maxHp);
        const healAmount = rewindTarget.hp - hpBefore;
        healer.cooldowns!.classAbilityPrimary = now + 90000; // 90s cooldown

        callbacks.log('heal', `⏰ ${healer.username} REWINDS ${rewindTargetName} to ${Math.floor(rewindTarget.hp)} HP!`);

        if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
        healer.stats.totalHealing += healAmount;
        healingAmount += healAmount;
        didHeal = true;
      }
    }
  }

  // COMBAT RESURRECTION - Cleric, Lightbringer, Spirit Healer only
  const canCombatRes = healer.role === 'cleric' || healer.role === 'lightbringer' || healer.role === 'shaman';
  if (canCombatRes && now >= healer.cooldowns!.combatRes) {
    // Find dead heroes that have been dead for 10+ seconds
    const deadHeroes: Array<{ hero: Hero; username: string }> = [];

    heroesArray.forEach((h) => {
      if (h && h.isDead && h.deathTime && (now - h.deathTime >= 10000)) {
        deadHeroes.push({ hero: h, username: h.username });
      }
    });

    if (deadHeroes.length > 0) {
      // Priority system:
      // 1. Other healer with combat res
      // 2. Tank (if no tank alive)
      // 3. Highest DPS (if tank alive)
      // 4. Any other healer
      // 5. Anyone else

      let resTarget: { hero: Hero; username: string } | null = null;

      // Count alive heroes by category
      const aliveTanks: string[] = [];
      const aliveHealers: string[] = [];
      const aliveDPS: string[] = [];

      heroesArray.forEach((h) => {
        if (!h || h.hp <= 0 || h.isDead) return;

        const cat = ROLE_CONFIG[h.role]?.category || 'dps';
        if (cat === 'tank') aliveTanks.push(h.username);
        else if (cat === 'healer') aliveHealers.push(h.username);
        else aliveDPS.push(h.username);
      });

      // Priority 1: Other combat res healer
      for (const { hero: h, username: name } of deadHeroes) {
        const canRes = h.role === 'cleric' || h.role === 'lightbringer' || h.role === 'shaman';
        if (canRes && name !== healer.username) {
          resTarget = { hero: h, username: name };
          break;
        }
      }

      // Priority 2: Tank (if none alive)
      if (!resTarget && aliveTanks.length === 0) {
        for (const { hero: h, username: name } of deadHeroes) {
          const cat = ROLE_CONFIG[h.role]?.category || 'dps';
          if (cat === 'tank') {
            resTarget = { hero: h, username: name };
            break;
          }
        }
      }

      // Priority 3: Highest DPS (if tank alive)
      if (!resTarget && aliveTanks.length > 0) {
        let highestDPS: { hero: Hero; username: string } | null = null;
        let maxDamage = 0;

        for (const { hero: h, username: name } of deadHeroes) {
          const cat = ROLE_CONFIG[h.role]?.category || 'dps';
          if (cat === 'dps' && h.stats && h.stats.totalDamage > maxDamage) {
            maxDamage = h.stats.totalDamage;
            highestDPS = { hero: h, username: name };
          }
        }

        if (highestDPS) resTarget = highestDPS;
      }

      // Priority 4: Any healer
      if (!resTarget) {
        for (const { hero: h, username: name } of deadHeroes) {
          const cat = ROLE_CONFIG[h.role]?.category || 'dps';
          if (cat === 'healer') {
            resTarget = { hero: h, username: name };
            break;
          }
        }
      }

      // Priority 5: Anyone
      if (!resTarget) {
        resTarget = deadHeroes[0];
      }

      // Resurrect the target
      if (resTarget) {
        // Resurrection HP percentage varies by class
        let resPercent = 0.5; // Default 50% (Cleric)
        if (healer.role === 'lightbringer') {
          resPercent = 0.6; // 60%
        } else if (healer.role === 'shaman') {
          resPercent = 0.4; // 40%
        }

        resTarget.hero.isDead = false;
        resTarget.hero.hp = Math.floor(resTarget.hero.maxHp * resPercent);
        resTarget.hero.deathTime = undefined;
        resTarget.hero.deathAnimationPlaying = false;

        callbacks.triggerAnimation(resTarget.username, 'idle', true);

        healer.cooldowns!.combatRes = now + 180000; // 3 minute cooldown

        const className = ROLE_CONFIG[healer.role]?.displayName || healer.role;
        callbacks.log('success', `✨💫 ${healer.username} uses COMBAT RESURRECTION on ${resTarget.username}! (${Math.floor(resPercent * 100)}% HP)`);

        // Track healing
        const healAmount = resTarget.hero.hp;
        if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
        healer.stats.totalHealing += healAmount;
        healingAmount += healAmount;
        didHeal = true;
        didCombatRes = true;
      }
    }
  }

  // HEALER: AUTO-DISPEL - Removes debuffs from most debuffed hero
  if (now >= (healer.cooldowns!.dispel || 0)) {
    let mostDebuffed: Hero | null = null;
    let mostDebuffedName: string | null = null;
    let maxDebuffs = 0;

    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead || !h.activeDebuffs) return;

      const debuffCount = Object.keys(h.activeDebuffs).length;
      if (debuffCount > maxDebuffs) {
        maxDebuffs = debuffCount;
        mostDebuffed = h;
        mostDebuffedName = h.username;
      }
    });

    if (mostDebuffed && maxDebuffs > 0) {
      // Dispel all debuffs
      const removedDebuffs = Object.keys(mostDebuffed.activeDebuffs!);
      mostDebuffed.activeDebuffs = {};

      callbacks.log('heal', `✨ ${healer.username} dispels ${removedDebuffs.length} debuff(s) from ${mostDebuffedName}!`);
      healer.cooldowns!.dispel = now + 25000; // 25 second cooldown
    }
  }

  // CLERIC: Prayer of Mending (bounces to 5 injured allies)
  if (healer.role === 'cleric' && now >= healer.cooldowns!.classAbilitySecondary) {
    const bounceTargets: Array<{ hero: Hero; username: string; hpPercent: number }> = [];

    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;
      bounceTargets.push({ hero: h, username: h.username, hpPercent: h.hp / h.maxHp });
    });

    // Sort by lowest HP percent
    bounceTargets.sort((a, b) => a.hpPercent - b.hpPercent);

    // Bounce to 5 targets
    const bounceCount = Math.min(5, bounceTargets.length);
    if (bounceCount > 0) {
      let totalPrayerHealing = 0;

      for (let i = 0; i < bounceCount; i++) {
        const bounceHeal = Math.floor(healer.attack * 0.4); // 40% of attack
        const { actualHeal, overhealAmount } = applyHealingToHero(bounceTargets[i].hero, bounceHeal, now, true);

        totalPrayerHealing += actualHeal;

        if (overhealAmount > 0) {
          applyShield(bounceTargets[i].hero, overhealAmount, 30000, 'overheal');
        }
      }

      if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
      healer.stats.totalHealing += totalPrayerHealing;
      healingAmount += totalPrayerHealing;
      didHeal = true;
      healer.cooldowns!.classAbilitySecondary = now + 30000; // 30s cooldown

      callbacks.log('heal', `💚 ${healer.username} Prayer of Mending bounces to ${bounceCount} allies (${Math.floor(totalPrayerHealing)} total)`);
    }
  }

  // RESTORATION DRUID: Rejuvenation (HoT on 4 targets when 3+ injured)
  if (healer.role === 'druid' && now >= healer.cooldowns!.classAbilityPrimary) {
    const injuredAllies: Array<{ hero: Hero; username: string; hpPercent: number }> = [];

    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp * 0.8) return; // Below 80% HP
      injuredAllies.push({ hero: h, username: h.username, hpPercent: h.hp / h.maxHp });
    });

    if (injuredAllies.length >= 3) {
      // Apply HoT to 4 lowest HP allies
      injuredAllies.sort((a, b) => a.hpPercent - b.hpPercent);
      const hotCount = Math.min(4, injuredAllies.length);

      for (let i = 0; i < hotCount; i++) {
        const target = injuredAllies[i];
        const hotTotal = Math.floor(target.hero.maxHp * 0.15); // 15% of max HP over 12s
        const hotPerTick = Math.floor(hotTotal / 4); // 4 ticks

        // Schedule 4 ticks over 12 seconds (every 3s)
        for (let tick = 0; tick < 4; tick++) {
          setTimeout(() => {
            if (target.hero.hp > 0 && !target.hero.isDead && target.hero.hp < target.hero.maxHp) {
              const { actualHeal, overhealAmount } = applyHealingToHero(target.hero, hotPerTick, Date.now(), true);

              // Show HoT SCT (matches Electron app line 12371)
              if (callbacks.triggerCombatText && actualHeal > 0) {
                callbacks.triggerCombatText(target.hero.username, actualHeal, 'heal-hot', true);
              }

              if (overhealAmount > 0) {
                applyShield(target.hero, overhealAmount, 30000, 'overheal');
              }

              if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
              healer.stats.totalHealing += actualHeal;
            }
          }, tick * 3000);
        }
      }

      healer.cooldowns!.classAbilityPrimary = now + 25000; // 25s cooldown
      callbacks.log('heal', `🌱 ${healer.username} casts Rejuvenation on ${hotCount} allies (15% HP over 12s)`);
    }
  }

  // SPIRIT HEALER: Healing Totems (pulses 8% max HP every 3s for 15s when 4+ injured)
  if (healer.role === 'shaman' && now >= healer.cooldowns!.classAbilitySecondary) {
    const injuredAllies: Array<{ hero: Hero; username: string }> = [];

    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp * 0.7) return; // Below 70% HP
      injuredAllies.push({ hero: h, username: h.username });
    });

    if (injuredAllies.length >= 4) {
      // Place totem that pulses 5 times over 15 seconds
      const pulseCount = 5;

      for (let pulse = 0; pulse < pulseCount; pulse++) {
        setTimeout(() => {
          let totalTotemHealing = 0;

          heroesArray.forEach((h) => {
            if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;

            const pulseHeal = Math.floor(h.maxHp * 0.08); // 8% max HP
            const { actualHeal, overhealAmount } = applyHealingToHero(h, pulseHeal, Date.now(), true);

            // Show HoT SCT for totem pulses
            if (callbacks.triggerCombatText && actualHeal > 0) {
              callbacks.triggerCombatText(h.username, actualHeal, 'heal-hot', true);
            }

            if (overhealAmount > 0) {
              applyShield(h, overhealAmount, 30000, 'overheal');
            }

            totalTotemHealing += actualHeal;
          });

          if (totalTotemHealing > 0 && healer.stats) {
            healer.stats.totalHealing += totalTotemHealing;
          }

          if (pulse === 0) {
            callbacks.log('heal', `🔱 ${healer.username} summons Healing Totem! (8% max HP every 3s)`);
          }
        }, pulse * 3000);
      }

      healer.cooldowns!.classAbilitySecondary = now + 45000; // 45s cooldown
    }
  }

  // MISTWEAVER: Essence Font (channels 12% max HP/sec for 6s when party avg <60%)
  if (healer.role === 'mistweaver' && now >= healer.cooldowns!.classAbilityPrimary) {
    let totalHpPercent = 0;
    let aliveCount = 0;

    heroesArray.forEach((h) => {
      if (h && h.hp > 0 && !h.isDead) {
        totalHpPercent += (h.hp / h.maxHp);
        aliveCount++;
      }
    });

    const avgHpPercent = aliveCount > 0 ? totalHpPercent / aliveCount : 1;

    if (avgHpPercent < 0.6) {
      // Channel for 6 seconds (6 ticks)
      for (let tick = 0; tick < 6; tick++) {
        setTimeout(() => {
          let totalFontHealing = 0;

          heroesArray.forEach((h) => {
            if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;

            const fontHeal = Math.floor(h.maxHp * 0.12); // 12% max HP per second
            const { actualHeal, overhealAmount } = applyHealingToHero(h, fontHeal, Date.now(), true);

            // Show HoT SCT for Essence Font
            if (callbacks.triggerCombatText && actualHeal > 0) {
              callbacks.triggerCombatText(h.username, actualHeal, 'heal-hot', true);
            }

            if (overhealAmount > 0) {
              applyShield(h, overhealAmount, 30000, 'overheal');
            }

            totalFontHealing += actualHeal;
          });

          if (totalFontHealing > 0 && healer.stats) {
            healer.stats.totalHealing += totalFontHealing;
          }

          if (tick === 0) {
            callbacks.log('heal', `🌫️ ${healer.username} channels Essence Font! (12% max HP/sec for 6s)`);
          }
        }, tick * 1000);
      }

      healer.cooldowns!.classAbilityPrimary = now + 60000; // 60s cooldown
    }
  }

  // BARD: Battle Hymn (buffs all party members with attack and defense)
  if (healer.role === 'bard' && now >= healer.cooldowns!.classAbilityPrimary) {
    // Get bard's stats for scaling
    const cappedInt = Math.min(healer.intellect || 0, 50); // Cap at 50 for 5% bonus
    const intellectScaling = cappedInt / 10 * 0.01; // Max 5% bonus from intellect
    const baseAttackBuff = 0.15; // 15% base
    const baseDefenseBuff = 0.10; // 10% base
    const attackBuff = baseAttackBuff + intellectScaling; // 15-20% attack buff
    const defenseBuff = baseDefenseBuff + intellectScaling; // 10-15% defense buff

    const buffDuration = 15000; // 15 seconds

    // Apply buffs to all alive heroes
    let buffedCount = 0;
    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead) return;

      if (!h.activeBuffs) h.activeBuffs = {};

      // Apply attack buff
      h.activeBuffs['attackMultiplier'] = {
        value: 1 + attackBuff,
        remainingDuration: buffDuration,
        name: 'Battle Hymn',
        lastUpdateTime: now
      };

      // Apply defense buff
      h.activeBuffs['defenseMultiplier'] = {
        value: 1 + defenseBuff,
        remainingDuration: buffDuration,
        name: 'Battle Hymn',
        lastUpdateTime: now
      };

      buffedCount++;
    });

    if (buffedCount > 0) {
      const attackPercent = Math.floor(attackBuff * 100);
      const defensePercent = Math.floor(defenseBuff * 100);
      callbacks.log('heal', `🎵 ${healer.username} uses BATTLE HYMN! All party members gain +${attackPercent}% attack and +${defensePercent}% defense (${buffedCount} heroes)`);
      
      // Trigger musical note effects for all buffed heroes
      if (callbacks.triggerMusicalNoteEffect) {
        heroesArray.forEach((h) => {
          if (!h || h.hp <= 0 || h.isDead) return;
          callbacks.triggerMusicalNoteEffect(h.username, '#ffd700', 5); // Gold notes for buffs
        });
      }
      
      healer.cooldowns!.classAbilityPrimary = now + 45000; // 45s cooldown
    }
  }

  // BARD: Healing Melody (heals all party members)
  if (healer.role === 'bard' && now >= healer.cooldowns!.classAbilitySecondary) {
    const healingPower = healer.healingPower || 0;
    const healingPowerScaling = Math.min(healingPower, 300) / 10 * 0.01; // Max 30% bonus
    const baseHealPercent = 0.10; // 10% base
    const healPercent = baseHealPercent * (1 + healingPowerScaling); // 10-13% max HP heal

    let totalMelodyHealing = 0;

    heroesArray.forEach((h) => {
      if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;

      const melodyHeal = Math.floor(h.maxHp * healPercent);
      const { actualHeal, overhealAmount } = applyHealingToHero(h, melodyHeal, now, true);

      // Show HoT SCT for Healing Melody
      if (callbacks.triggerCombatText && actualHeal > 0) {
        callbacks.triggerCombatText(h.username, actualHeal, 'heal-hot', true);
      }

      if (overhealAmount > 0) {
        applyShield(h, overhealAmount, 30000, 'overheal');
      }

      totalMelodyHealing += actualHeal;
      callbacks.triggerHealAnimation(h.username);
    });

    if (totalMelodyHealing > 0) {
      if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
      healer.stats.totalHealing += totalMelodyHealing;
      healingAmount += totalMelodyHealing;
      didHeal = true;

      const healPercentDisplay = Math.floor(healPercent * 100);
      callbacks.log('heal', `🎵 ${healer.username} uses HEALING MELODY! All party members healed for ${healPercentDisplay}% max HP (${Math.floor(totalMelodyHealing)} total)`);
      
      // Trigger musical note effects for all healed heroes
      if (callbacks.triggerMusicalNoteEffect) {
        heroesArray.forEach((h) => {
          if (!h || h.hp <= 0 || h.isDead) return;
          callbacks.triggerMusicalNoteEffect(h.username, '#90EE90', 3); // Light green notes for healing
        });
      }
      
      healer.cooldowns!.classAbilitySecondary = now + 30000; // 30s cooldown
    }
  }

  // LIGHTBRINGER PASSIVE: Beacon of Light (40% of all heals go to tank)
  // This is handled during the actual healing application, not here

  return { didHeal, didCombatRes, healingAmount };
}

/**
 * Process auto-heal for healers (when party needs healing)
 */
export function processAutoHeal(
  healer: Hero,
  heroes: Hero[] | Map<string, Hero>,
  now: number,
  bonuses: ViewerBonuses,
  callbacks: CombatCallbacks,
  calculateSkillBonuses: (hero: Hero) => any
): { didHeal: boolean; healingAmount: number; targetUsername: string | null } {
  let didHeal = false;
  let healingAmount = 0;
  let targetUsername: string | null = null;

  if (!healer || healer.hp <= 0 || healer.isDead) {
    return { didHeal, healingAmount, targetUsername };
  }

  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());

  // Find lowest HP hero
  let lowestHpHero: Hero | null = null;
  let lowestHpPercent = 1.0;

  heroesArray.forEach((h) => {
    if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;

    const hpPercent = h.hp / h.maxHp;
    if (hpPercent < lowestHpPercent) {
      lowestHpPercent = hpPercent;
      lowestHpHero = h;
      targetUsername = h.username;
    }
  });

  if (lowestHpHero && targetUsername) {
    // Auto-heal: Scales with healer attack (30-55 base + 75% of attack)
    let baseAutoHeal = Math.floor(Math.random() * 25) + 30 + Math.floor(healer.attack * 0.75);

    // Check for DIVINE GRACE proc
    if (healer.activeProcBuffs?.divineGrace && now < healer.activeProcBuffs.divineGrace) {
      baseAutoHeal *= 2;
      delete healer.activeProcBuffs.divineGrace; // Consume buff
      callbacks.log('heal', `🌟 ${healer.username} DIVINE GRACE!`);
    }

    let healAmount = calculateHealing(baseAutoHeal, healer, bonuses, calculateSkillBonuses);

    // Check for healing reduction debuff on target
    if (lowestHpHero.activeDebuffs?.cursed) {
      healAmount *= 0.5; // 50% reduced healing
    }

    // Apply healing with overheal shield
    const { actualHeal, overhealAmount } = applyHealingToHero(lowestHpHero, healAmount, now, true);

    if (actualHeal > 0) {
      healingAmount += actualHeal;
      didHeal = true;

      if (!healer.stats) healer.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
      healer.stats.totalHealing += actualHeal;

      if (overhealAmount > 0) {
        callbacks.log('heal', `💙 ${targetUsername} gains ${Math.floor(overhealAmount)} shield from overheal!`);
      }

      callbacks.triggerHealAnimation(targetUsername);
      callbacks.log('heal', `${healer.username} heals ${targetUsername} for ${Math.floor(actualHeal)} HP`);

      // LIGHTBRINGER PASSIVE: Beacon of Light (40% of all heals go to tank)
      if (healer.role === 'lightbringer' && actualHeal > 0) {
        // Find a tank to beacon
        let beaconTarget: Hero | null = null;
        let beaconUsername: string | null = null;

        heroesArray.forEach((h) => {
          if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp || h.username === targetUsername) return;

          const cat = ROLE_CONFIG[h.role]?.category || 'dps';
          if (cat === 'tank') {
            beaconTarget = h;
            beaconUsername = h.username;
          }
        });

        if (beaconTarget && beaconUsername) {
          const beaconHeal = Math.floor(actualHeal * 0.4);
          const { actualHeal: beaconActual, overhealAmount: beaconOverheal } = applyHealingToHero(beaconTarget, beaconHeal, now, true);

          // Show HoT SCT for Beacon of Light
          if (callbacks.triggerCombatText && beaconActual > 0) {
            callbacks.triggerCombatText(beaconUsername!, beaconActual, 'heal-hot', true);
          }

          if (beaconOverheal > 0) {
            applyShield(beaconTarget, beaconOverheal, 30000, 'overheal');
          }

          healer.stats!.totalHealing += beaconActual;
          healingAmount += beaconActual;

          callbacks.log('heal', `☀️ Beacon transfers ${Math.floor(beaconActual)} healing to ${beaconUsername}`);
        }
      }
    }
  }

  return { didHeal, healingAmount, targetUsername };
}
