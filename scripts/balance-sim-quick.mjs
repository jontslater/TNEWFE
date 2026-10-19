/**
 * Quick TTK smoke (proposed model, bundled JSON). Not a full Python port.
 * node scripts/balance-sim-quick.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const P = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/combat/data/balance.json'), 'utf8'));
const gL = (L) => 1 + P.levelCurve.gPerLevel * (L - 1);
const dr = (ar, Latt) => Math.min(P.combat.damageReductionCap, ar / (ar + P.combat.armorConstantK * gL(Latt)));

function hero(role, L, rarity) {
  const b = P.heroRoles[role];
  const R = P.gear.R[rarity];
  const f = P.gear.setFraction;
  const s = (k) => b[k] * gL(L) + f * R * b[k] * gL(L);
  return {
    hp: s('hp'),
    maxhp: s('hp'),
    atk: s('atk'),
    ar: s('armor'),
    sp: role === 'healer' ? s('spellPower') : 0,
    crit: Math.min(P.combat.critChanceCap, b.crit + P.gear.critBonusFullSet[rarity]),
    iv: 2,
    next: Math.random() * 2,
    role,
    L,
  };
}

function enemies(kind, L, party = 5) {
  const n = P.enemies.normal;
  const g = gL(L);
  if (kind === 'normal') {
    const hp = n.hp * g;
    return [{ hp, maxhp: hp, atk: n.atk * g, ar: n.armor * g, L, iv: 2, next: Math.random() * 2 }];
  }
  const B = kind === 'dungeon' ? P.enemies.dungeonBoss : P.enemies.raidBoss;
  const scale = kind === 'raid' ? Math.max(5, party) / 5 : 1;
  const hp = n.hp * g * B.hp * scale;
  return [{ hp, maxhp: hp, atk: n.atk * g * B.atk, ar: n.armor * g * B.armor, L, iv: 2, next: 1, boss: B }];
}

function sim(party, foes, chat = 5, tmax = 900) {
  const cb = 1 + Math.min(P.chat.damageHealCap, chat * P.chat.percentPerActiveChatter);
  let t = 0;
  const dt = 0.1;
  const alive = (xs) => xs.filter((x) => x.hp > 0);
  while (t < tmax && alive(foes).length && alive(party).length) {
    for (const h of alive(party)) {
      h.next -= dt;
      if (h.next > 0) continue;
      h.next += h.iv;
      if (h.role === 'healer') {
        const inj = alive(party).filter((x) => x.hp / x.maxhp < P.combat.healThreshold);
        if (inj.length) {
          const x = inj.reduce((a, b) => (a.hp / a.maxhp < b.hp / b.maxhp ? a : b));
          const amt = h.sp * P.combat.healMultiplier * cb;
          x.hp = Math.min(x.maxhp, x.hp + amt);
          continue;
        }
      }
      const e = alive(foes)[0];
      let d = h.atk * cb * (1 - dr(e.ar, h.L)) * (0.9 + Math.random() * 0.2);
      if (Math.random() < h.crit) d *= P.combat.critMultiplier;
      e.hp -= d;
    }
    for (const e of alive(foes)) {
      e.next -= dt;
      if (e.next > 0) continue;
      e.next += e.iv;
      const tk = alive(party).find((h) => h.role === 'tank') || alive(party)[0];
      let raw = e.atk;
      let red = 1 - dr(tk.ar, e.L);
      tk.hp -= raw * red * (0.9 + Math.random() * 0.2);
    }
    t += dt;
  }
  return { t, win: alive(foes).length === 0 };
}

const L = 25;
const rarity = 'rare';
let party = [hero('tank', L, rarity), hero('healer', L, rarity), ...[1, 2, 3].map(() => hero('dps', L, rarity))];
const cases = [
  ['normal', enemies('normal', L)],
  ['dungeon', enemies('dungeon', L)],
  ['raid', enemies('raid', L)],
];
for (const [name, foes] of cases) {
  const runs = [];
  for (let i = 0; i < 40; i++) {
    party = party.map((h) => ({ ...h, hp: h.maxhp ?? h.hp, maxhp: h.maxhp ?? h.hp }));
    const r = sim(structuredClone(party), structuredClone(foes));
    runs.push(r.t);
  }
  runs.sort((a, b) => a - b);
  const med = runs[Math.floor(runs.length / 2)];
  console.log(`${name} L${L} median TTK: ${med.toFixed(1)}s`);
}
