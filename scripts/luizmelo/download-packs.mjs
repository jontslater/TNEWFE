#!/usr/bin/env node
/**
 * Downloads LuizMelo CC0 packs from itch.io (free, $0) into scripts/luizmelo/vendor-zips/
 * and extracts them to scripts/luizmelo/vendor/.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import packDefinitions from './packDefinitions.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zipDir = path.join(__dirname, 'vendor-zips');
const vendorDir = path.join(__dirname, 'vendor');

fs.mkdirSync(zipDir, { recursive: true });
fs.mkdirSync(vendorDir, { recursive: true });

const slugs = [...new Set(Object.values(packDefinitions).map((p) => p.itchSlug))];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });

for (const slug of slugs) {
  const zipPath = path.join(zipDir, `${slug}.zip`);
  if (fs.existsSync(zipPath) && fs.statSync(zipPath).size > 10000) {
    console.log(`Skipping download (exists): ${slug}`);
  } else {
    console.log(`Downloading ${slug}...`);
    const page = await context.newPage();
    await page.goto(`https://luizmelo.itch.io/${slug}/purchase`, {
      waitUntil: 'networkidle',
    });
    const direct = page.locator('a.direct_download_btn');
    if (await direct.count()) await direct.click();
    await page.waitForURL(/\/download\//, { timeout: 30000 }).catch(() => {});
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.locator('a.download_btn').first().click();
    const download = await downloadPromise;
    await download.saveAs(zipPath);
    await page.close();
    console.log(`Saved ${zipPath}`);
  }

  execSync(`unzip -o -q "${zipPath}" -d "${vendorDir}"`, { stdio: 'inherit' });
}

await browser.close();
console.log('Vendor packs ready under scripts/luizmelo/vendor/');
