import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  'npx',
  ['--yes', 'tsx', join(dir, 'test-combat-tick.ts')],
  { stdio: 'inherit', cwd: join(dir, '..') }
);
process.exit(result.status === 0 ? 0 : 1);
