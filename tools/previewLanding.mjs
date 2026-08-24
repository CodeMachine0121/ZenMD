import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const globalModules = (process.env.NODE_PATH || execSync('npm root -g').toString()).trim();
const requireGlobal = createRequire(path.join(globalModules, 'index.js'));
const { chromium } = requireGlobal('playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve(here, '../index.html')).toString());
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(here, 'landing-preview-top.png') });
await page.screenshot({ path: path.join(here, 'landing-preview-full.png'), fullPage: true });
await browser.close();
console.log('ok');
