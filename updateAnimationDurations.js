import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'utils', 'spriteAnimationData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Multiply all durations by 1.5 (50% slower)
content = content.replace(/duration: (\d+),/g, (match, num) => {
  const newDuration = Math.round(parseInt(num) * 1.5);
  return `duration: ${newDuration},`;
});

fs.writeFileSync(filePath, content);
console.log('✅ Updated all animation durations to be 50% slower (1.5x multiplier)');
