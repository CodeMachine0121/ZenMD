/**
 * Drives the built ZenMD app with Playwright and captures the landing-page
 * screenshots.
 *
 * The app hard-codes its vault to `~/ZenMD`, so this launches Electron with
 * HOME pointed at `tools/demo-home` — the real vault is never opened and never
 * appears in a screenshot.
 *
 *   NODE_PATH=$(npm root -g) node tools/captureScreenshots.mjs [--inspect]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);

// playwright is installed globally, and ESM ignores NODE_PATH — resolve it
// through a require rooted at the global module directory instead.
const globalModules = (process.env.NODE_PATH || execSync('npm root -g').toString()).trim();
const requireGlobal = createRequire(path.join(globalModules, 'index.js'));
const { _electron: electron } = requireGlobal('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));

const landingDirectory = path.resolve(here, '..');
const applicationDirectory = path.resolve(landingDirectory, '../ZenMD');
const demoHome = path.join(here, 'demo-home');
const shots = path.join(landingDirectory, 'screenshots');

const inspecting = process.argv.includes('--inspect');
const width = 1440;
const height = 900;

mkdirSync(shots, { recursive: true });

// Every run starts from the pristine seed: the capture types into an article
// and autosave would otherwise leave that in the demo vault for ever.
rmSync(path.join(demoHome, 'ZenMD'), { recursive: true, force: true });
cpSync(path.join(here, 'demo-vault'), path.join(demoHome, 'ZenMD'), { recursive: true });

const electronBinary = require(path.join(applicationDirectory, 'node_modules/electron'));

const environment = { ...process.env, HOME: demoHome };
delete environment.ELECTRON_RENDERER_URL; // use the built renderer, not a dev server

const application = await electron.launch({
  executablePath: electronBinary,
  args: [path.join(applicationDirectory, 'out/main/main.js')],
  cwd: applicationDirectory,
  env: environment,
});

const window = await application.firstWindow();
await window.waitForLoadState('domcontentloaded');

await application.evaluate(async ({ BrowserWindow }) => {
  const [first] = BrowserWindow.getAllWindows();
  first.setBounds({ x: 0, y: 0, width: 1440, height: 900 });
  first.show();
  first.focus();
});

await window.waitForTimeout(1500);

async function shoot(name) {
  await window.waitForTimeout(400);
  await window.screenshot({ path: path.join(shots, `${name}.png`) });
  console.log('  captured', `${name}.png`);
}

if (inspecting) {
  // One pass that tells us what the DOM actually offers, so the selectors below
  // can be written against reality instead of guesses.
  const outline = await window.evaluate(() => {
    const interesting = [...document.querySelectorAll('[class],[data-testid],button,[role]')]
      .slice(0, 260)
      .map((element) => {
        const label = (element.textContent ?? '').trim().slice(0, 34).replace(/\s+/g, ' ');
        return `${element.tagName.toLowerCase()}` +
          `${element.className && typeof element.className === 'string' ? '.' + element.className.split(/\s+/).join('.') : ''}` +
          `${element.getAttribute('role') ? `[role=${element.getAttribute('role')}]` : ''}` +
          `${label ? `  « ${label} »` : ''}`;
      });
    return interesting.join('\n');
  });
  writeFileSync(path.join(here, 'dom-outline.txt'), outline, 'utf8');
  console.log('  wrote dom-outline.txt');
  await shoot('00-raw');
  await application.close();
  process.exit(0);
}

console.log('capturing…');

async function outlineTo(file) {
  const outline = await window.evaluate(() => {
    return [...document.querySelectorAll('[class]')].slice(0, 400).map((element) => {
      const label = (element.textContent ?? '').trim().slice(0, 30).replace(/\s+/g, ' ');
      const names = typeof element.className === 'string' ? element.className.split(/\s+/).join('.') : '';
      return `${element.tagName.toLowerCase()}${names ? '.' + names : ''}${label ? `  « ${label} »` : ''}`;
    }).join('\n');
  });
  writeFileSync(path.join(here, file), outline, 'utf8');
  console.log('  wrote', file);
}

// ── 1. the product shot: an article open with the preview beside it ─────────
await window.locator('.zenmd-workspace-list button.zenmd-row')
  .filter({ hasText: '技術筆記' }).first().click();
await window.waitForTimeout(800);
await window.locator('button.zenmd-row').filter({ hasText: 'Electron 與 Tauri' }).first().click();
await window.waitForTimeout(1400);
await shoot('01-editor-and-preview');
await outlineTo('dom-outline-open.txt');

// ── 2. the slash menu ───────────────────────────────────────────────────────
try {
  const editor = window.locator('.cm-content').first();
  await editor.click();
  await window.keyboard.press('ControlOrMeta+End');
  await window.waitForTimeout(200);
  await window.keyboard.press('Enter');
  await window.keyboard.press('Enter');
  await window.keyboard.type('/', { delay: 80 });
  await window.waitForTimeout(900);
  await shoot('02-snippet-menu');
} catch (failure) {
  console.log('  (snippet menu:', failure.message, ')');
}

// ── 3. a second theme, so the page can show it is not one look ─────────────
try {
  await window.keyboard.press('Backspace');
  await window.waitForTimeout(300);
  await window.locator('button.zenmd-settings__gear').first().click();
  await window.waitForTimeout(700);
  const themeChooser = window.locator('select').first();
  console.log('  themes:', await themeChooser.locator('option').allTextContents());
  await themeChooser.selectOption({ index: 4 });
  await window.waitForTimeout(500);
  await window.keyboard.press('Escape');
  await window.waitForTimeout(800);
  await shoot('03-zen-theme');
} catch (failure) {
  console.log('  (settings:', failure.message, ')');
}

await application.close();
console.log('done →', shots);
