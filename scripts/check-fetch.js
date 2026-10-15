#!/usr/bin/env node
/**
 * Check for raw fetch() calls to API endpoints
 * All API calls must use apiClient (JWT) or overlayClient (Streamer Key)
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src');

console.log('[Fetch Check] Scanning for raw fetch() calls to API...');

try {
  // Use grep to find fetch calls to /api/ endpoints
  const result = execSync(
    `grep -rn "fetch.*\\\\/api\\\\/" "${SRC_DIR}" --include="*.ts" --include="*.tsx" || true`,
    { encoding: 'utf-8' }
  );

  if (result.trim()) {
    console.error('\n❌ ERROR: Found raw fetch() calls to API endpoints:\n');
    console.error(result);
    console.error('\n');
    console.error('All API calls must use:');
    console.error('  - apiClient (for portal/dashboard - sends JWT)');
    console.error('  - overlayClient (for browser source/overlay - sends X-Streamer-Key)');
    console.error('\n');
    console.error('Import from src/api/client.ts:\n');
    console.error('  import { apiClient, overlayClient } from \'../api/client\';');
    console.error('\n');
    process.exit(1);
  }

  console.log('✅ No raw fetch() calls to API found');
  process.exit(0);
} catch (error) {
  console.error('[Fetch Check] Error running grep:', error.message);
  process.exit(1);
}
