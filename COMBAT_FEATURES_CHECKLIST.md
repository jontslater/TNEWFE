# Combat Features Checklist

## Core Combat Loop
- [x] **Combat starts** - Enemies spawn and combat begins ✓
- [x] **Combat rounds** - Combat processes in sequential rounds ✓ (Note: Next round not starting when enemy dies mid-combat)
- [x] **Turn order** - Heroes and enemies act in initiative order (d20 + dex) ✓
- [ ] **Combat stops** - Combat ends when all enemies or all heroes are defeated ❌
- [ ] **Next wave spawns** - When all enemies die, next wave spawns automatically ❌

## Hero Actions
- [x] **Hero basic attacks** - Heroes perform basic attacks on enemies
- [x] **Hero abilities** - Heroes use their class-specific abilities ✓ (Code verified: applyHeroAbilities called in combatEngine.ts)
- [x] **Ability cooldowns** - Abilities have cooldowns and can't be used too frequently ✓ (Code verified: cooldowns checked in heroAbilities.ts and healerAbilities.ts)
- [ ] **Hero targeting** - Heroes target alive enemies (not dead ones) When enemies die there is no next wave, they continue to attack the dead enemy, I'm not sure how this will work once we fix this. 
- [x] **Hero stuns** - Heroes can be stunned and skip turns ✓ (Code verified: stun check in combatEngine.ts line 172, initiative.ts line 32)
- [x] **Hero animations** - Heroes play attack, hurt, death, idle animations correctly

## Enemy Actions
- [x] **Enemy basic attacks** - Enemies perform basic attacks on heroes
- [x] **Enemy abilities** - Enemies use special abilities (bloodlust, etc.) ✓ (Code verified: bloodlust implemented in enemyAttacks.ts)
- [x] **Enemy targeting** - Enemies target alive heroes
- [ ] **Enemy projectiles** - Ranged enemies fire projectiles (one per turn) (there are still multiple projectiles firing)
- [ ] **Enemy animations** - Enemies play attack, hurt, death, idle animations correctly ⚠️ (Animations work, but enemies die when HP > 0 - needs investigation)
- [ ] **No duplicate attacks** - Enemies don't attack multiple times per round(looks like the attack animation might play more than onces)

## Damage System
- [x] **Damage calculation** - Damage is calculated correctly (attack + random variation) ✓ (Code verified: calculateHeroDamage and enemy damage calculation exist)
- [x] **Defense reduction** - Defense reduces incoming damage ✓ (Code verified: defense calculation in enemyAttacks.ts line 292-304)
- [x] **Critical hits** - Critical hits deal extra damage ✓ (Code verified: crit type in combatEngine.ts line 495)
- [x] **Difficulty scaling** - Enemy damage scales with difficulty modifier ✓ (Code verified: difficultyModifier applied to enemyDamage in enemyAttacks.ts)
- [x] **Hero damage taken** - Hero damage taken is reduced by difficulty modifier (inverse scaling) ✓ (Code verified: inverse scaling applied to actualDamage in enemyAttacks.ts)
- [x] **HP clamping** - HP is always an integer and clamped to 0-maxHp ✓ (Code verified: Math.floor and Math.max used throughout)
- [x] **Combat text (SCT)** - Damage numbers appear as scrolling combat text ✓ (Code verified: triggerCombatText called for damage, crit, heal, dot)

## Healing System
- [x] **Healing applies** - Healing restores hero HP ✓ (Code verified: applyHealing function exists and is used)
- [x] **Healing priority** - Healing fills HP first, then creates shields from overheal ✓ (Code verified: applyHealing implements this logic)
- [x] **HoT effects** - Healing over time effects work correctly ✓ (Code verified: processHpRegeneration in buffsDebuffs.ts)
- [x] **Healer abilities** - Healer class abilities heal properly ✓ (Code verified: processHealerAbilities and processAutoHeal exist)
- [x] **Heal animations** - Healing triggers heal animations ✓ (Code verified: triggerHealAnimation callback exists)
- [x] **Heal SCT** - Healing numbers appear as scrolling combat text ✓ (Code verified: triggerCombatText called with 'heal' type)

## Shield System
- [x] **Shield absorption** - Shields absorb damage before HP ✓ (Code verified: absorbShieldDamage used in enemyAttacks.ts and buffsDebuffs.ts)
- [x] **Shield depletion** - Shields are depleted when taking damage ✓ (Code verified: absorbShieldDamage handles this)
- [x] **Shield expiry** - Shields expire after their duration ✓ (Code verified: processShields checks expiry)
- [x] **Shield clearing** - Shields are cleared when depleted or expired ✓ (Code verified: shield cleared when amount <= 0)
- [x] **Shield from overheal** - Overheal converts to shields ✓ (Code verified: applyHealing creates shields from overheal)
- [x] **Shield SCT** - Shield absorption shows in combat text ✓ (Code verified: shield absorption logged in enemyAttacks.ts)

## Buff/Debuff System
- [x] **Buffs apply** - Buffs are applied to heroes/enemies ✓ (Code verified: buff system exists)
- [x] **Debuffs apply** - Debuffs are applied to heroes/enemies ✓ (Code verified: applyDebuff function exists)
- [x] **Debuff display** - Debuff icons appear above/below sprites ✓ (Code verified: updateBuffDebuffDisplay.ts)
- [x] **Buff display** - Buff icons appear above/below sprites ✓ (Code verified: updateBuffDebuffDisplay.ts)
- [x] **DoT damage** - Damage over time effects deal damage each tick ✓ (Code verified: processDebuffs handles DoT in buffsDebuffs.ts line 52-80)
- [x] **DoT shield absorption** - DoT damage is absorbed by shields first ✓ (Code verified: absorbShieldDamage called before DoT damage in buffsDebuffs.ts line 61)
- [x] **Debuff duration** - Debuffs expire after their duration ✓ (Code verified: expiry check in buffsDebuffs.ts line 44)
- [x] **Stun effect** - Stun prevents actions ✓ (Code verified: stun check prevents actions in combatEngine.ts)
- [x] **Stagger DoT** - Stagger debuff deals DoT damage ✓ (Code verified: stagger DoT processing in buffsDebuffs.ts)

## Death System
- [x] **Death detection** - Entities die when HP reaches 0 or below ✓ (Code verified: hp <= 0 checks exist)
- [x] **Death flag** - `isDead` flag is set correctly when HP <= 0 ✓ (Code verified: isDead set when hp <= 0)
- [ ] **Death animation** - Death animations play when entities die ⚠️ (Code exists but may not trigger correctly)
- [ ] **Hero death** - Heroes die and play death animation ❌ (User reported: doesn't work)
- [ ] **Enemy death** - Enemies die and play death animation ⚠️ (User reported: enemies die when HP > 0)
- [ ] **Dead entity filtering** - Dead entities are filtered from combat actions ❌
- [ ] **No attacks on dead** - Heroes/enemies don't attack dead targets ❌

## Resurrection System
- [x] **Resurrection check** - System checks for hero resurrection periodically ✓ (Code verified: checkHeroResurrection exists and is called)
- [x] **Resurrection timing** - Heroes resurrect after death timer expires ✓ (Code verified: 60 second timer in fullCombatEngine.ts line 3234)
- [x] **Resurrection HP** - Resurrected heroes have partial HP restored ✓ (Code verified: 50% HP on resurrection line 3236)
- [x] **Resurrection animation** - Resurrected heroes return to idle animation ✓ (Code verified: idle animation triggered line 3251)
- [x] **Combat resumes** - Combat resumes when heroes resurrect ✓ (Code verified: startCombat called after resurrection line 3260)

## Victory/Defeat Conditions
- [x] **Victory detection** - Victory is detected when all enemies are dead ✓ (Code verified: checkCombatVictory checks aliveEnemies.length === 0)
- [x] **Defeat detection** - Defeat is detected when all heroes are dead ✓ (Code verified: checkCombatVictory checks aliveHeroes.length === 0)
- [x] **Rewards distribution** - XP, gold, and loot are distributed on victory ✓ (Code verified: distributeCombatRewards function exists)
- [ ] **Wave progression** - Next wave spawns after victory ❌
- [ ] **Combat end** - Combat properly ends and cleans up state

## Boss Mechanics
- [x] **Boss spawning** - Bosses spawn every 10 waves ✓ (Code verified: isBossWave check in fullCombatEngine.ts line 892)
- [x] **Boss stats** - Bosses have increased HP, attack, and defense ✓ (Code verified: boss stats multiplied by 1.5 in encounterEnemy line 982-984)
- [x] **Boss identification** - Bosses are marked with `isBoss` flag ✓ (Code verified: isBoss flag set in encounterEnemy line 980)

## UI/Visual Feedback
- [ ] **Health bars** - Health bars update correctly
- [ ] **Wave counter** - Wave counter displays and increments correctly
- [ ] **Difficulty indicator** - Difficulty percentage displays correctly
- [ ] **Combat text** - Scrolling combat text appears for all relevant events
- [ ] **Animation sync** - Animations play in sync with actions

## State Management
- [ ] **Combat state** - Combat state is managed correctly
- [ ] **No race conditions** - No overlapping combat rounds
- [ ] **Flag management** - Combat flags (inCombat, resolvingCombat, etc.) are set/cleared correctly
- [ ] **Interval cleanup** - All intervals are cleared when combat stops
- [ ] **Memory leaks** - No memory leaks from uncleared intervals

---

## Issues Found (Will be populated as we test)

### Not Working:
1. **Combat stops** - When all enemies or all heroes are defeated, combat should stop properly
2. **Heroes attacking dead enemies** - Heroes continue to attack enemies after they die
3. **Hero death animation** - Heroes don't play death animation when they die
4. **Dead heroes attacking** - Dead heroes continue to attack
5. **Dead heroes being attacked** - Dead heroes continue to be attacked by enemies
6. **Next wave spawns** - When all enemies die, the next wave does not spawn automatically
7. **Enemy projectiles** - Multiple projectiles firing per turn (should be one per turn)
8. **Enemy duplicate attacks** - Attack animation may play more than once per round
9. **Enemy death at HP > 0** - Enemies die when their HP is above 0 

### Needs Investigation:
1. **Next round not starting when enemy dies mid-combat** - When an enemy dies but other enemies are still alive, the next combat round should start automatically, but it's not happening
2. **Hero targeting dead enemies** - Once dead entity filtering is fixed, verify heroes correctly target alive enemies
3. **Combat end cleanup** - Verify all state is properly cleaned up when combat ends
4. **UI elements** - Health bars, wave counter, difficulty indicator, combat text display need visual verification
5. **State management** - Race conditions, flag management, interval cleanup need verification 
