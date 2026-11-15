// axe-core audit of transient UI states: dialogs, game feedback, results, 3D views in use.
// Usage: node axe-states.js <index.html> [theme]
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const theme = process.argv[3] || 'light';
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // SwiftShader gives headless Chrome WebGL, so the 3D views are audited as visitors see them.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument((theme) => {
    try {
      const s = JSON.parse(localStorage.getItem('tanaw.state.v1') || '{}');
      s.settings = Object.assign(s.settings || {}, { theme, motion: 'reduce' });
      localStorage.setItem('tanaw.state.v1', JSON.stringify(s));
    } catch (e) {}
  }, theme);
  const audit = async (label) => {
    // Sections the browser has skipped because they are off screen have to be drawn to be judged.
    await page.addStyleTag({ content: '*{content-visibility:visible!important}' }).catch(() => {});
    await page.addScriptTag({ content: axeSrc }).catch(() => {});
    const v = await page.evaluate(async () => {
      const out = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] });
      return out.violations.map((x) => `${x.id} (${x.impact}): ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
    });
    console.log(`${v.length ? 'FAIL' : 'ok  '}  ${label}${v.length ? '\n      ' + v.join('\n      ') : ''}`);
  };
  const load = async (hash) => { await page.goto('about:blank'); await page.goto(base + hash, { waitUntil: 'load' }); await wait(700); };

  await load('#/learn');
  await page.click('[data-open-settings-global]'); await wait(300); await audit('settings dialog');
  await page.keyboard.press('Escape'); await wait(200);
  await page.click('[data-open-menu]'); await wait(300); await audit('site map dialog');
  await page.keyboard.press('Escape'); await wait(200);

  await load('#/scenes/clinic');
  await page.evaluate(() => document.querySelector('[data-quickview]').click()); await wait(300); await audit('sign quick view dialog');
  await page.keyboard.press('Escape'); await wait(200);
  await page.evaluate(() => document.querySelector('[data-phrase] [data-show]').click()); await wait(300); await audit('full-screen text display');
  await page.keyboard.press('Escape'); await wait(200);

  await load('#/play/sightlines');
  await page.evaluate(() => [...document.querySelectorAll('.answer')].find((b) => !Tanaw.data.sightlines.some((s) => s.options.find((o) => o.ok && o.text === b.querySelector('.answer__text').textContent.trim()))).click());
  await wait(1200); await audit('sightlines after a wrong answer');
  await load('#/play/word-lens');
  await page.evaluate(() => document.querySelector('.lens__word').click()); await wait(200); await audit('word lens fix step');
  await load('#/play/timeline');
  await page.click('[data-game-next]'); await wait(300); await audit('timeline checked');
  await load('#/play/myth-fact');
  for (let k = 0; k < 10; k++) { await page.keyboard.press('ArrowLeft'); await wait(80); await page.click('[data-game-next]'); await wait(150); }
  await audit('game results screen');

  await load('#/learn/deaf-culture');
  for (let k = 0; k < 3; k++) { await page.click('[data-primary]'); await wait(150); }
  await audit('lesson sort question');
  await load('#/community/rights');
  await page.evaluate(() => document.querySelector('.place').click()); await wait(200); await audit('rights panel open');
  await load('#/community/history');
  await page.evaluate(() => document.querySelector('[data-list]').click()); await wait(200); await audit('history as a list');

  /* ---------- Search, 3D views and Stories ---------- */
  await load('#/learn');
  await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
  await wait(300); await page.keyboard.type('fing'); await wait(300); await audit('search palette with results');
  await page.keyboard.type('qqqq'); await wait(300); await audit('search palette with no results');
  await page.keyboard.press('Escape'); await wait(200);

  await load('#/lab?letter=T'); await wait(800); await audit('3D Hand Lab: a letter that is not modeled');
  await load('#/lab?tab=spell&text=Tanaw'); await wait(1500); await audit('3D Hand Lab while spelling');
  await load('#/lab?tab=params');
  await page.evaluate(() => document.querySelector('[data-demo]').click()); await wait(600); await audit('3D Hand Lab: orientation demonstration');

  await load('#/play/read-hand'); await wait(1500);
  await page.evaluate(() => document.querySelector('.rh .answer').click()); await wait(400); await audit('Read the Hand after an answer');

  await load('#/practice/fingerspell?text=Ana'); await wait(1200);
  await page.evaluate(() => document.querySelector('[data-drill-new]').click()); await wait(400);
  await page.type('#drill-answer', 'x'); await page.click('[data-drill-check]'); await wait(300); await audit('fingerspelling drill after checking');

  await load('#/learn/sign-parameters');
  for (let k = 0; k < 10 && !(await page.$('.step-hand')); k++) {
    await page.evaluate(() => { const b = document.querySelector('[data-primary]'); if (b && !b.disabled) b.click(); else { const o = document.querySelector('.option input:not(:disabled)'); if (o) o.click(); } });
    await wait(300);
  }
  await page.evaluate(() => { const c = document.querySelector('.step-hand [data-demo]'); if (c) c.click(); }); await wait(600);
  await audit('lesson step with the 3D hand');

  await load('#/community/stories/fsl-act');
  await page.evaluate(() => { const n = Tanaw.data.getStory('fsl-act').chapters.length; for (let i = 0; i < n; i++) document.querySelector('[data-next]').click(); });
  await wait(300);
  await page.evaluate(() => document.querySelector('[data-answer]').click()); await wait(300); await audit('story checkpoint answered, reflection open');

  /* ---------- The landing's states ---------- */
  await load('#/');
  await page.focus('.bead'); await wait(300); await audit('landing: a scene card open on the seam');
  await page.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' })); await wait(1200);
  await audit('second landing: the hand greeting');
  await page.type('#hero-spell', 'Ana'); await page.keyboard.press('Enter'); await wait(700);
  await audit('second landing: the hand spelling a name');

  /* ---------- Accounts ---------- */
  const PW = 'liwanag sa dagat 7';
  await load('#/login');
  await audit('login form');
  await page.evaluate(() => document.querySelector('[data-login]').requestSubmit()); await wait(300); await audit('login with errors');
  await page.type('#login-email', 'nobody@example.com'); await page.type('#login-password', 'wrong password');
  await page.evaluate(() => document.querySelector('[data-login]').requestSubmit()); await wait(1000); await audit('login after a wrong password');
  await load('#/login?out=1');
  await audit('logged-out state');
  await load('#/register');
  await page.evaluate(() => document.querySelector('[data-register]').requestSubmit()); await wait(300); await audit('registration with errors');
  await page.type('#reg-name', 'Ana Reyes'); await page.type('#reg-email', `ana${Date.now()}@example.com`); await page.type('#reg-password', PW); await page.type('#reg-confirm', PW);
  await wait(150); await audit('registration filled in, password rules met');
  await page.evaluate(() => document.querySelector('[data-register]').requestSubmit()); await wait(1200); await audit('registration success: choose a world');
  await page.evaluate(() => document.querySelector('[data-account-toggle]').click()); await wait(150); await audit('account menu open');
  await load('#/account');
  await audit('account page');
  await page.evaluate(() => document.querySelector('[data-password]').requestSubmit()); await wait(300); await audit('account page: password form with errors');
  await page.evaluate(() => document.querySelector('[data-delete]').click()); await wait(250); await audit('delete account dialog');
  await page.keyboard.press('Escape'); await wait(150);
  await page.evaluate(() => { localStorage.setItem('tanaw.site.v1', JSON.stringify({ notice: { id: 'a', text: 'A notice from an administrator.', tone: 'important', until: '' }, registration: 'closed' })); });
  await page.evaluate(() => Tanaw.auth.logout()); await wait(500);
  await load('#/register');
  await audit('registration closed, with a site notice');
  await page.evaluate(() => { localStorage.removeItem('tanaw.site.v1'); });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
