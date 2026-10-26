// Renders public/icon.svg into the PNG icons the PWA manifest and iOS need.
// Usage: node scripts/make-icons.mjs  (needs Playwright with Chromium)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// CommonJS require so a globally installed Playwright (NODE_PATH) works too.
const { chromium } = createRequire(import.meta.url)('playwright');

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180, bleed: true },
  // Maskable icons get cropped to a circle/squircle: full-bleed background, artwork inside the 80% safe zone.
  { file: 'icon-maskable-512.png', size: 512, bleed: true, scale: 0.8 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, bleed = false, scale = 1 } of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:${bleed ? '#ffc83d' : 'transparent'};display:grid;place-items:center;width:${size}px;height:${size}px">
    <img src="${dataUrl}" style="width:${size * scale}px;height:${size * scale}px"></body></html>`);
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: !bleed });
  console.log('wrote', file);
}
await browser.close();
