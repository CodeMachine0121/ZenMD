/**
 * Drives the built ZenMD app with Playwright and captures the landing-page
 * screenshots, once per language.
 *
 *   node tools/captureScreenshots.mjs            # both languages
 *   node tools/captureScreenshots.mjs --lang en  # just one
 *
 * The app hard-codes its vault to `~/ZenMD`, so each run launches Electron with
 * HOME pointed at a directory of its own — the real vault is never opened and
 * cannot appear in a picture. That directory is rebuilt from the seed every
 * time, because capturing types into an article and autosave would keep it.
 *
 * Needs the app built first: cd ../ZenMD && npm run build.
 * Pictures land in screenshots/{zh,en}/.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, cpSync } from 'node:fs';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const globalModules = (process.env.NODE_PATH || execSync('npm root -g').toString()).trim();
const requireGlobal = createRequire(path.join(globalModules, 'index.js'));
const { _electron: electron } = requireGlobal('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const landingDirectory = path.resolve(here, '..');
const applicationDirectory = path.resolve(landingDirectory, '../ZenMD');
const electronBinary = require(path.join(applicationDirectory, 'node_modules/electron'));

/**
 * What each language calls the things the capture has to click. The pictures
 * must make the same claims in both, so the shape of the run is identical and
 * only the names differ.
 */
const languages = {
  zh: {
    seed: 'demo-vault',
    proseWorkspace: '寫作',
    proseArticle: '為什麼我不再用資料夾',
    richWorkspace: '技術筆記',
    richArticle: 'Electron 與 Tauri',
  },
  en: {
    seed: 'demo-vault-en',
    proseWorkspace: 'Writing',
    proseArticle: 'Why I stopped filing',
    richWorkspace: 'Tech notes',
    richArticle: 'Electron and Tauri',
  },
};

const asked = process.argv.indexOf('--lang');
const wanted = asked === -1 ? Object.keys(languages) : [process.argv[asked + 1]];

for (const code of wanted) {
  const language = languages[code];
  if (!language) {
    console.error(`✕ 不認得的語言：${code}`);
    process.exitCode = 1;
    continue;
  }

  console.log(`\n══ ${code} ══`);
  const shots = path.join(landingDirectory, 'screenshots', code);
  const home = path.join(here, `demo-home-${code}`);
  mkdirSync(shots, { recursive: true });
  rmSync(path.join(home, 'ZenMD'), { recursive: true, force: true });
  cpSync(path.join(here, language.seed), path.join(home, 'ZenMD'), { recursive: true });

  const environment = { ...process.env, HOME: home };
  delete environment.ELECTRON_RENDERER_URL;

  const application = await electron.launch({
    executablePath: electronBinary,
    args: [path.join(applicationDirectory, 'out/main/main.js')],
    cwd: applicationDirectory,
    env: environment,
  });

  const window = await application.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  const resize = async (width, height) => {
    await application.evaluate(async ({ BrowserWindow }, size) => {
      const [first] = BrowserWindow.getAllWindows();
      first.setBounds({ x: 0, y: 0, width: size.w, height: size.h });
      first.show();
      first.focus();
    }, { w: width, h: height });
    await window.waitForTimeout(600);
  };

  const shoot = async (name) => {
    await window.waitForTimeout(400);
    await window.screenshot({ path: path.join(shots, `${name}.png`) });
    console.log('  captured', `${name}.png`);
  };

  const open = async (workspace, article) => {
    await window.locator('.zenmd-workspace-list button.zenmd-row')
      .filter({ hasText: workspace }).first().click();
    await window.waitForTimeout(700);
    await window.locator('button.zenmd-row').filter({ hasText: article }).first().click();
    await window.waitForTimeout(1000);
  };

  const viewMode = (index) => window.locator('.zenmd-panel-chrome__arrangements button').nth(index);
  const zenToggle = () => window.locator('.zenmd-panel-chrome__control[aria-pressed]').first();

  await resize(1440, 900);
  await window.waitForTimeout(900);

  await open(language.richWorkspace, language.richArticle);
  await shoot('01-editor-and-preview');

  try {
    await window.locator('.cm-content').first().click();
    await window.keyboard.press('ControlOrMeta+End');
    await window.keyboard.press('Enter');
    await window.keyboard.press('Enter');
    await window.keyboard.type('/', { delay: 80 });
    await window.waitForTimeout(900);
    await shoot('02-snippet-menu');
    await window.keyboard.press('Escape');
    await window.keyboard.press('Backspace');
  } catch (failure) {
    console.log('  (snippet menu:', failure.message, ')');
  }

  try {
    await window.locator('button.zenmd-settings__gear').first().click();
    await window.waitForTimeout(700);
    await window.locator('select').first().selectOption({ index: 4 });
    await window.waitForTimeout(500);
    await window.keyboard.press('Escape');
    await window.waitForTimeout(800);
    await shoot('03-zen-theme');
  } catch (failure) {
    console.log('  (theme:', failure.message, ')');
  }

  try {
    await resize(1180, 860);
    await open(language.proseWorkspace, language.proseArticle);
    await viewMode(0).click();
    await window.waitForTimeout(500);
    await zenToggle().click();
    await window.waitForTimeout(1000);
    await shoot('04-zen-mode');
  } catch (failure) {
    console.log('  (zen mode:', failure.message, ')');
  }

  // The phone set. Not crops: a crop cuts a sentence at the right edge and
  // reads as a broken picture. A narrower window lets the app wrap its own.
  try {
    await resize(880, 720);
    await shoot('04-zen-mode--narrow');

    await viewMode(1).click();
    await window.waitForTimeout(800);
    await shoot('01-editor-and-preview--narrow');

    await viewMode(0).click();
    await window.waitForTimeout(600);
    await window.locator('.cm-content').first().click();
    await window.keyboard.press('ControlOrMeta+End');
    await window.keyboard.press('Enter');
    await window.keyboard.type('/', { delay: 80 });
    await window.waitForTimeout(800);
    await shoot('02-snippet-menu--narrow');
    await window.keyboard.press('Escape');
    await window.keyboard.press('Backspace');

    await zenToggle().click();
    await window.waitForTimeout(900);
    await shoot('03-zen-theme--narrow');
  } catch (failure) {
    console.log('  (narrow pass:', failure.message, ')');
  }

  await application.close();
  console.log(`  → ${shots}`);
}
