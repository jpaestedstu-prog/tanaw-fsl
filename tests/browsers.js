// Firefox and WebKit (Safari's engine), through Playwright: every route, both landings, accounts,
// the console, the 3D hand, offline use, and opening the site straight from its folder.
// One-time setup: npx playwright install firefox webkit
// Usage: node browsers.js <index.html> [firefox|webkit] [shotDir]
// Playwright's WebKit on Windows draws in software, at a few frames a second, so this waits for
// things to happen instead of timing them. It says nothing about how fast Safari is.
const pw = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const index = path.resolve(process.argv[2]);
const root = path.dirname(index);
const engines = process.argv[3] && process.argv[3] !== 'all' ? [process.argv[3]] : ['firefox', 'webkit'];
const shotDir = process.argv[4];
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });
const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'));
const SECTIONS = ['overview', 'people', 'review', 'activity', 'site', 'system'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PW = 'liwanag sa dagat 7';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const serve = () => new Promise((resolve) => {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(fs.readFileSync(file));
  });
  server.listen(0, '127.0.0.1', () => resolve(server));
});

async function run(engine, server) {
  const site = `http://127.0.0.1:${server.address().port}/`;
  const results = [];
  const ok = (name, cond, detail = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  [${engine}] ${name}${detail ? `  — ${detail}` : ''}`); };
  const browser = await pw[engine].launch();
  const version = browser.version();
  console.log(`\n=== ${engine} ${version} ===`);
  const shot = async (page, name, full = false) => { if (shotDir) await page.screenshot({ path: path.join(shotDir, `${engine}-${name}.png`), fullPage: full }); };

  const errors = [];
  const watch = (page, label) => {
    page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: ${m.text()}`); });
    page.on('requestfailed', (r) => { const u = r.url(); if (!/^data:/.test(u)) errors.push(`${label}: failed ${u} ${(r.failure() || {}).errorText || ''}`); });
  };
  const fresh = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: opts.w || 1366, height: opts.h || 900 }, hasTouch: !!opts.touch });
    await ctx.addInitScript((o) => {
      try {
        if (o.noIntro) sessionStorage.setItem('tanaw.intro', '1');
        if (o.settings) { const s = JSON.parse(localStorage.getItem('tanaw.state.v1') || '{}'); s.settings = Object.assign({}, s.settings, o.settings); localStorage.setItem('tanaw.state.v1', JSON.stringify(s)); }
      } catch (e) { /* ignore */ }
    }, { noIntro: opts.intro !== true, settings: opts.settings || null });
    const page = await ctx.newPage();
    watch(page, opts.label || 'page');
    return { ctx, page };
  };
  // True once the condition holds, false if it never does.
  const until = (page, fn, arg, timeout = 10000) => page.waitForFunction(fn, arg, { timeout, polling: 100 }).then(() => true, () => false);

  /* ---------- Every route, at three sizes ---------- */
  for (const [w, h, name] of [[1366, 900, 'desktop'], [390, 844, 'phone'], [320, 640, 'small']]) {
    const { ctx, page } = await fresh({ w, h, label: `routes ${name}` });
    const bad = [];
    for (const r of routes) {
      const before = errors.length;
      await page.goto(`${site}index.html${r}`, { waitUntil: 'load' });
      // Sections the browser has skipped because they are off screen have to be laid out to be measured.
      await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
      await wait(450);
      const measure = () => page.evaluate(() => {
        const de = document.documentElement;
        const over = de.scrollWidth - de.clientWidth;
        const who = [];
        if (over > 1) document.querySelectorAll('body *').forEach((el) => { const b = el.getBoundingClientRect(); if (b.right > de.clientWidth + 1 && b.width > 0 && getComputedStyle(el).position !== 'fixed' && who.length < 3) who.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`); });
        return { over, who, h1: document.querySelectorAll('h1').length };
      });
      let info = await measure();
      // Still laying out? Only what lasts counts.
      if (info.over > 1) { await wait(1500); info = await measure(); }
      if (info.over > 1) bad.push(`${r}: overflow ${info.over}px ${info.who.join(' ')}`);
      if (info.h1 !== 1) bad.push(`${r}: ${info.h1} h1`);
      if (errors.length > before) bad.push(`${r}: ${errors.slice(before).join(' ; ').slice(0, 200)}`);
    }
    ok(`${routes.length} routes at ${w}×${h}: no errors, no sideways scrolling, one h1`, !bad.length, bad.slice(0, 12).join(' | '));
    await ctx.close();
  }

  /* ---------- The first landing: the split screen ---------- */
  {
    const { ctx, page } = await fresh({ w: 1366, h: 768, label: 'landing', intro: true });
    // Noted as it happens: on a slow engine the intro can be over by the time the page has finished loading.
    await page.addInitScript(() => { new MutationObserver(() => { if (document.querySelector('.horizon.is-intro')) window.__intro = true; }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); });
    await page.goto(`${site}index.html#/`, { waitUntil: 'load' });
    ok('split screen: the intro plays on the first view', await until(page, () => window.__intro));
    ok('split screen: then it is gone', await until(page, () => !document.querySelector('.horizon').classList.contains('is-intro')));
    const seamOf = () => page.evaluate(() => Number(getComputedStyle(document.querySelector('[data-split]')).getPropertyValue('--seam')));
    const atRest = () => until(page, () => Math.abs(Number(getComputedStyle(document.querySelector('[data-split]')).getPropertyValue('--seam')) - 0.5) < 0.004);
    // The intro ends with a small sway.
    await wait(1500);
    await atRest();
    const seamAt = await page.evaluate(() => ({ x: Math.round(document.querySelector('.seam').getBoundingClientRect().left), middle: Math.round(document.documentElement.clientWidth / 2), worlds: document.querySelectorAll('.realm__cta').length }));
    ok('split screen: two worlds meeting at the seam, in the middle', Math.abs(seamAt.x - seamAt.middle) <= 2 && seamAt.worlds === 2, JSON.stringify(seamAt));
    ok('split screen: the materials load', await page.evaluate(async () => {
      const fine = async (u) => { const i = new Image(); i.src = u; try { await i.decode(); return true; } catch (e) { return false; } };
      return (await fine('assets/img/capiz.svg')) && (await fine('assets/img/banig.svg'));
    }));
    ok('split screen: the display font loads', await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('800 40px "Bricolage Grotesque"'); }));
    await shot(page, 'landing-first');
    await page.mouse.move(120, 520, { steps: 5 });
    ok('split screen: moving toward Learning widens it', await until(page, () => Number(getComputedStyle(document.querySelector('[data-split]')).getPropertyValue('--seam')) > 0.54), `seam=${await seamOf()}`);
    await page.mouse.move(1250, 520, { steps: 8 });
    ok('split screen: moving toward Community widens it', await until(page, () => Number(getComputedStyle(document.querySelector('[data-split]')).getPropertyValue('--seam')) < 0.46), `seam=${await seamOf()}`);
    await shot(page, 'landing-lean');
    const clipped = await page.evaluate(() => {
      const seam = document.querySelector('.seam').getBoundingClientRect().left;
      return Math.max(...[...document.querySelectorAll('.realm--learn .realm__title, .realm--learn .realm__lead')].map((e) => e.getBoundingClientRect().right)) - seam;
    });
    ok('split screen: the narrower world\'s words are not cut by the seam', clipped <= 1, `${Math.round(clipped)}px`);
    await page.mouse.move(683, 300, { steps: 4 });
    await atRest();
    const bp = await page.evaluate(() => { const r = document.querySelectorAll('.bead')[1].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(bp.x, bp.y, { steps: 3 });
    ok('split screen: hovering a bead shows its card', await until(page, () => Number(getComputedStyle(document.querySelectorAll('.bead__card')[1]).opacity) > 0.9));
    await shot(page, 'landing-bead');
    await page.mouse.move(683, 300, { steps: 2 });
    await atRest();
    const g = await page.evaluate(() => { const r = document.querySelector('[data-seam-grip] svg').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(g.x, g.y); await wait(150);
    await page.mouse.down();
    await page.mouse.move(g.x + 240, g.y, { steps: 8 });
    ok('split screen: dragging the eye moves the seam', await until(page, () => Number(getComputedStyle(document.querySelector('[data-split]')).getPropertyValue('--seam')) > 0.6), `seam=${await seamOf()}`);
    await page.mouse.move(1325, g.y, { steps: 8 }); await wait(150);
    await page.mouse.up();
    ok('split screen: pulled all the way, it enters that world', await until(page, () => location.hash === '#/learn'));
    await until(page, () => document.body.dataset.view === 'learnHub' && !document.documentElement.dataset.vt);
    await page.evaluate(() => { location.hash = '#/'; });
    await until(page, () => document.body.dataset.view === 'home' && !document.documentElement.dataset.vt);
    await wait(500);
    await page.click('.realm--community .realm__cta');
    ok('split screen: Enter opens the world', await until(page, () => location.hash === '#/community'));
    ok('split screen: focus lands on the new heading', await until(page, () => document.activeElement.tagName === 'H1'));
    await ctx.close();
  }

  /* ---------- The second landing: the 3D hand ---------- */
  {
    const { ctx, page } = await fresh({ w: 1366, h: 768, label: '3D landing' });
    await page.goto(`${site}index.html#/`, { waitUntil: 'load' });
    await wait(1000);
    const webgl = await page.evaluate(() => { const c = document.createElement('canvas'); return !!c.getContext('webgl'); });
    const order = await page.evaluate(() => [...document.querySelector('.landing').children].slice(0, 3).map((s) => s.className));
    ok('second landing: comes right after the split screen', /horizon/.test(order[0]) && /nh-hero/.test(order[1]) && /nh-portals/.test(order[2]), order.join(' | '));
    ok('second landing: the greeting waits until it can be seen', await page.evaluate(() => !document.querySelector('[data-hero-strip] .is-current')));
    await page.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' }));
    const greeted = await page.waitForFunction(() => document.querySelector('[data-hero-strip] .is-current'), null, { timeout: 15000 }).then(() => true, () => false);
    ok('second landing: then the hand greets', greeted);
    await wait(900);
    ok(`second landing: ${webgl ? 'a canvas draws the hand' : 'no WebGL here, so it says so'}`, await page.evaluate((gl) => (gl ? !!document.querySelector('.nh-hero canvas') && !document.querySelector('.nh-hero .hand3d.is-fallback') : !!document.querySelector('.nh-hero .hand3d__fallback')), webgl), `WebGL ${webgl}`);
    await shot(page, 'landing-second');
    await page.fill('#hero-spell', 'Ana');
    await page.keyboard.press('Enter');
    await wait(700);
    ok('second landing: "Fingerspell your name" lists its letters', (await page.evaluate(() => [...document.querySelectorAll('[data-hero-strip] .spell-strip__tile')].map((t) => t.textContent).join(''))) === 'ANA');
    await page.evaluate(() => document.querySelector('.portal-grid').scrollIntoView({ block: 'center' }));
    await wait(900);
    await shot(page, 'landing-portals');
    await ctx.close();
  }

  /* ---------- Accounts ---------- */
  {
    const { ctx, page } = await fresh({ label: 'accounts' });
    await page.goto(`${site}index.html#/register`, { waitUntil: 'load' });
    await wait(600);
    await page.evaluate(() => document.querySelector('[data-register]').requestSubmit());
    await wait(250);
    ok('accounts: an empty form lists its errors', (await page.evaluate(() => document.querySelectorAll('[data-error-summary] a').length)) >= 3);
    await shot(page, 'register-errors');
    await page.fill('#reg-name', 'Ana Reyes');
    await page.fill('#reg-email', 'ana@example.com');
    await page.fill('#reg-password', PW);
    const type0 = await page.getAttribute('#reg-password', 'type');
    await page.click('[data-reveal-password="reg-password"]');
    const type1 = await page.getAttribute('#reg-password', 'type');
    ok('accounts: the password can be shown', type0 === 'password' && type1 === 'text', `${type0} → ${type1}`);
    await page.fill('#reg-confirm', PW);
    await page.evaluate(() => document.querySelector('[data-register]').requestSubmit());
    await page.waitForFunction(() => Tanaw.auth.user(), null, { timeout: 20000 }).catch(() => {});
    await wait(500);
    ok('accounts: registering creates the account (password hashing works here)', await page.evaluate(() => !!Tanaw.auth.user()));
    await shot(page, 'register-done');
    await page.evaluate(() => Tanaw.auth.logout());
    await wait(700);
    ok('accounts: logging out gives a clear logged-out page', await page.evaluate(() => !Tanaw.auth.user() && /#\/login/.test(location.hash)));
    await page.fill('#login-email', 'ana@example.com');
    await page.fill('#login-password', 'not the password');
    await page.evaluate(() => document.querySelector('[data-login]').requestSubmit());
    await wait(1300);
    ok('accounts: a wrong password gets a general message', await page.evaluate(() => !Tanaw.auth.user() && /not right/i.test(document.querySelector('[data-error-summary]').textContent)));
    await page.fill('#login-password', PW);
    await page.evaluate(() => document.querySelector('[data-login]').requestSubmit());
    await page.waitForFunction(() => Tanaw.auth.user(), null, { timeout: 20000 }).catch(() => {});
    ok('accounts: the right password logs in', await page.evaluate(() => !!Tanaw.auth.user()));
    await ctx.close();
  }

  /* ---------- The console ---------- */
  {
    const { ctx, page } = await fresh({ label: 'console' });
    await page.goto(`${site}admin.html`, { waitUntil: 'load' });
    await wait(700);
    ok('console: a separate page that starts with first-time setup', await page.evaluate(() => /first administrator/i.test(document.querySelector('h1').textContent) && !document.querySelector('.site-header')));
    await page.fill('#c-name', 'Maria Santos');
    await page.fill('#c-email', 'admin@example.com');
    await page.fill('#c-password', 'bantay sa tanawan 9');
    await page.fill('#c-confirm', 'bantay sa tanawan 9');
    await page.evaluate(() => document.querySelector('[data-console-setup]').requestSubmit());
    await page.waitForSelector('.rail', { timeout: 20000 }).catch(() => {});
    ok('console: setup opens it', !!(await page.$('.rail')));
    const bad = [];
    for (const s of SECTIONS) {
      await page.evaluate((h) => { location.hash = h; }, `#/${s}`);
      await wait(400);
      const m = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, focus: document.activeElement.tagName, over: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      if (m.h1 !== 1 || m.focus !== 'H1' || m.over > 1) bad.push(`${s} ${JSON.stringify(m)}`);
      await shot(page, `console-${s}`);
    }
    ok('console: every section opens, with focus on its heading', !bad.length, bad.join(' | '));
    await page.evaluate(() => { location.hash = '#/people'; }); await wait(350);
    await page.click('[data-add-samples]');
    ok('console: sample learners can be added', await until(page, () => document.querySelectorAll('[data-manage]').length === 5, null, 60000));
    await page.evaluate(() => document.querySelector('.rail [data-logout]').click());
    await wait(700);
    ok('console: logging out shows the gate', await page.evaluate(() => !document.querySelector('.rail') && /logged out/i.test(document.body.textContent)));
    await ctx.close();
  }

  /* ---------- Tools that lean on the browser ---------- */
  {
    const { ctx, page } = await fresh({ label: 'tools' });
    const open = async (h, ms = 700) => { await page.goto(`${site}index.html${h}`, { waitUntil: 'load' }); await wait(ms); };
    await open('#/lab', 1500);
    await page.click('[data-letter="B"]');
    await wait(400);
    ok('lab: a letter shows its description', /Four fingers/.test(await page.evaluate(() => document.querySelector('[data-letter-info]').textContent)));
    await shot(page, 'lab');
    await open('#/lab?tab=spell&text=FSL', 1800);
    ok('lab: spelling lists the word', (await page.evaluate(() => document.querySelectorAll('.lab .spell-strip__tile').length)) === 3);
    await open('#/community/stories/pedro-santos', 800);
    await page.keyboard.press('ArrowRight');
    await wait(300);
    ok('stories: the arrow key turns the page', /Chapter 2/.test(await page.evaluate(() => document.querySelector('[data-count]').textContent)));
    await open('#/community/history', 900);
    await shot(page, 'history');
    await open('#/learn', 800);
    await page.keyboard.press('Control+k');
    await wait(350);
    await page.keyboard.type('rights');
    await wait(350);
    ok('search: Ctrl K opens it and it finds results', (await page.evaluate(() => document.querySelectorAll('dialog.palette[open] .palette__item').length)) > 0);
    await page.keyboard.press('Escape');
    await wait(250);
    ok('search: Esc closes it', !(await page.$('dialog.palette[open]')));
    await page.click('[data-open-settings-global]');
    await wait(300);
    const settings = await page.evaluate(() => !!document.querySelector('dialog[open]'));
    ok('settings: the dialog opens', settings);
    await page.keyboard.press('Escape');
    await wait(200);
    await open('#/play/myth-fact', 800);
    await shot(page, 'game');
    await open('#/bridge', 700);
    await shot(page, 'bridge');
    await ctx.close();
  }

  /* ---------- Phone-sized, with touch ---------- */
  {
    const { ctx, page } = await fresh({ w: 390, h: 844, touch: true, label: 'phone' });
    await page.goto(`${site}index.html#/`, { waitUntil: 'load' });
    await wait(900);
    const m = await page.evaluate(() => {
      const learn = document.querySelector('.realm--learn').getBoundingClientRect();
      const comm = document.querySelector('.realm--community').getBoundingClientRect();
      return { stacked: comm.top >= learn.bottom - 2, tabbar: getComputedStyle(document.querySelector('.tabbar')).display !== 'none', code: !!Tanaw.hand3d };
    });
    ok('phone: the worlds stack, with the tab bar; the 3D hand has not loaded yet', m.stacked && m.tabbar && !m.code, JSON.stringify(m));
    await shot(page, 'phone-first');
    await page.evaluate(() => document.querySelector('.nh-hero .nh-title').scrollIntoView({ block: 'start' }));
    await wait(500);
    await shot(page, 'phone-second');
    await page.tap('.realm--community .realm__cta').catch(() => page.click('.realm--community .realm__cta'));
    await wait(1200);
    ok('phone: Enter opens the world', (await page.evaluate(() => location.hash)) === '#/community');
    await ctx.close();
  }

  /* ---------- Offline, through the service worker. The server really stops: a browser's offline
     emulation is not the same thing, and WebKit's blocks the service worker's answers too. ---------- */
  {
    const { ctx, page } = await fresh({ label: 'offline' });
    const before = errors.length;
    await page.goto(`${site}index.html#/`, { waitUntil: 'load' });
    const ready = await page.evaluate(() => Promise.race([navigator.serviceWorker.ready.then((r) => !!r.active), new Promise((r) => setTimeout(() => r(false), 20000))]));
    await page.waitForFunction(async () => { const k = await caches.keys(); if (!k.length) return false; const c = await caches.open(k[0]); return (await c.keys()).length > 90; }, null, { timeout: 60000, polling: 500 }).catch(() => {});
    await page.reload({ waitUntil: 'load' });
    await wait(800);
    ok('offline: the service worker installs and takes over', ready && (await page.evaluate(() => !!navigator.serviceWorker.controller)));
    await new Promise((r) => { server.close(r); server.closeAllConnections(); });
    const failed = [];
    for (const h of ['#/community/rights', '#/lab', '#/community/stories/pedro-santos', '#/login', '#/studio']) {
      await page.evaluate((x) => { location.hash = x; }, h);
      await wait(1500);
      const t = await page.evaluate(() => ({ view: document.body.dataset.view, h1: (document.querySelector('#view h1') || {}).textContent || '' }));
      if (!t.h1 || /could not load/i.test(t.h1) || t.view === 'notFound') failed.push(`${h}: ${t.h1 || '(nothing)'}`);
    }
    ok('offline: pages not visited before still open', !failed.length, failed.join(' | '));
    await page.reload({ waitUntil: 'load' }).catch(() => {});
    ok('offline: a full reload works', await until(page, () => !!document.querySelector('#view h1'), null, 15000));
    errors.length = before; // Requests that fail with the server gone are the point of this part.
    await ctx.close();
  }

  ok('no page errors or failed loads in any of this', errors.length === 0, errors.slice(0, 8).join(' | '));
  await browser.close();
  return { pass: results.filter(Boolean).length, total: results.length };
}

/* ---------- Opening the site straight from its folder ---------- */
async function fromFolder(engine) {
  const results = [];
  const ok = (name, cond, detail = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  [${engine}, from the folder] ${name}${detail ? `  — ${detail}` : ''}`); };
  const browser = await pw[engine].launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const site = pathToFileURL(index).href;
  await page.goto(`${site}#/`, { waitUntil: 'load' });
  await wait(1200);
  ok('the start page opens, with both landings', await page.evaluate(() => !!document.querySelector('.horizon .realm__cta') && !!document.querySelector('.nh-hero')));
  await page.evaluate(() => { location.hash = '#/lab'; });
  await wait(1500);
  ok('a page that loads on demand opens', await page.evaluate(() => document.body.dataset.view === 'lab'));
  const secure = await page.evaluate(() => Tanaw.auth.supported());
  await page.evaluate(() => { location.hash = '#/register'; });
  await wait(900);
  if (secure) {
    await page.fill('#reg-name', 'Ana Reyes');
    await page.fill('#reg-email', 'ana@example.com');
    await page.fill('#reg-password', PW);
    await page.fill('#reg-confirm', PW);
    await page.evaluate(() => document.querySelector('[data-register]').requestSubmit());
    await page.waitForFunction(() => Tanaw.auth.user(), null, { timeout: 20000 }).catch(() => {});
    ok('accounts work', await page.evaluate(() => !!Tanaw.auth.user()));
    await page.goto(pathToFileURL(path.join(root, 'admin.html')).href, { waitUntil: 'load' });
    await wait(900);
    const note = await page.evaluate(() => ({ text: document.body.textContent, h1: document.querySelector('h1').textContent }));
    console.log(`      the console, opened next: "${note.h1}"${/Firefox/.test(note.text) ? ', with its note about Firefox' : ''}`);
    ok('the console opens', !!note.h1);
  } else {
    ok('accounts need a secure page here, and the form says so', await page.evaluate(() => /secure page|https/i.test(document.querySelector('main').textContent)));
  }
  ok('no page errors', errors.length === 0, errors.slice(0, 6).join(' | '));
  await browser.close();
  return { pass: results.filter(Boolean).length, total: results.length };
}

(async () => {
  let failed = 0;
  for (const engine of engines) {
    const a = await run(engine, await serve());
    const b = await fromFolder(engine);
    console.log(`\n${engine}: ${a.pass + b.pass}/${a.total + b.total} passed`);
    failed += a.total + b.total - a.pass - b.pass;
  }
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
