#!/usr/bin/env node
/** Logs sprite-overrides fetch + hero transforms on production clean-battlefield. */
import { chromium } from 'playwright';

const base =
  process.env.BATTLEFIELD_URL ||
  'https://theneverendingwar.com/clean-battlefield?battlefieldId=twitch:theneverendingwar';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const apiEvents = [];

page.on('response', async (r) => {
  if (!r.url().includes('sprite-overrides')) return;
  let heroCount = 0;
  try {
    heroCount = Object.keys((await r.json()).heroes || {}).length;
  } catch {
    /* body already consumed */
  }
  apiEvents.push({ status: r.status(), heroCount, url: r.url() });
});

await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForResponse((r) => r.url().includes('sprite-overrides'), { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(4000);

const report = await page.evaluate(async () => {
  const doc = await fetch(
    'https://idlednd-backend-production.up.railway.app/api/config/sprite-overrides',
    { cache: 'no-store' }
  ).then((r) => r.json());
  const prefs = await fetch(
    'https://idlednd-backend-production.up.railway.app/api/battlefields/preferences/sprite-facing/theneverendingwar'
  )
    .then((r) => r.json())
    .then((j) => j.preferences || {})
    .catch(() => ({}));

  return [...document.querySelectorAll('.hero-sprite-container')].map((el) => {
    const role = el.getAttribute('data-hero-role');
    return {
      role,
      pref: prefs[role] || null,
      overrideFlip: doc.heroes?.[role]?.flip ?? null,
      transform: getComputedStyle(el).transform,
    };
  });
});

console.log(JSON.stringify({ apiEvents, heroes: report }, null, 2));
await browser.close();
