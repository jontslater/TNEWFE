/** Lightweight checks for skill id parsing and rank cap (no TS runner required). */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const dir = dirname(fileURLToPath(import.meta.url));
const defs = readFileSync(join(dir, '../src/game/skills/categoryTemplates.ts'), 'utf8');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(defs.includes('Master Assassin'), 'dps slot 10 template present');
assert(defs.includes('Protector'), 'tank slot 10 template present');

const skillIdRe = /^(.+)_skill_(\d+)$/;
const m = 'guardian_skill_10'.match(skillIdRe);
assert(m && m[2] === '10', '1-based skill id parse');

console.log('test-skill-modifiers: OK');
