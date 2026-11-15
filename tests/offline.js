// Service worker + offline test over HTTP.
const puppeteer = require('puppeteer-core');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://127.0.0.1:8765/';
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL + '#/', { waitUntil: 'networkidle0' });
  const ready = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  await p.reload({ waitUntil: 'networkidle0' });
  const controlled = await p.evaluate(() => !!navigator.serviceWorker.controller);
  const cached = await p.evaluate(async () => { const keys = await caches.keys(); const c = await caches.open(keys[0]); return { name: keys[0], n: (await c.keys()).length }; });
  console.log(`SW active=${ready} controlling=${controlled} cache=${cached.name} entries=${cached.n}`);
  await p.setOfflineMode(true);
  // Pages whose scripts load on demand, including the 3D hand and Stories.
  const routes = ['#/community/rights', '#/play/sightlines', '#/community/history', '#/scenes/emergency', '#/studio', '#/about', '#/journey',
    '#/lab', '#/practice/fingerspell?text=Ana', '#/play/read-hand', '#/community/stories/pedro-santos', '#/login', '#/register'];
  for (const r of routes) {
    const prev = await p.evaluate(() => (document.querySelector('#view h1') || {}).textContent || '');
    await p.evaluate((h) => { window.location.hash = h; }, r);
    await p.waitForFunction((x) => { const h = document.querySelector('#view h1'); return h && h.textContent !== x; }, { timeout: 10000 }, prev).catch(() => {});
    await wait(800);
    const h1 = await p.evaluate(() => (document.querySelector('#view h1') || {}).textContent || '(no h1)');
    const hand = await p.evaluate(() => (document.querySelector('#view .stage3d') ? (document.querySelector('#view .hand3d canvas') ? ' [3D hand]' : ' [3D stage without hand]') : ''));
    console.log(`offline ${r.padEnd(36)} -> ${h1.trim().slice(0, 50)}${hand}`);
  }
  await p.reload({ waitUntil: 'load' }).catch((e) => console.log('reload error', e.message));
  await wait(900);
  const h1 = await p.evaluate(() => (document.querySelector('#view h1') || {}).textContent || '(no h1)');
  console.log(`offline full reload -> ${h1.trim().slice(0, 50)}`);
  await p.evaluate(() => { window.location.hash = '#/'; });
  await wait(900);
  await p.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' }));
  await wait(1500);
  const second = await p.evaluate(() => ({ canvas: !!document.querySelector('.nh-hero canvas'), first: !!document.querySelector('.horizon') }));
  console.log(`offline start page -> split screen ${second.first}, 3D landing's hand ${second.canvas}`);
  const fonts = await p.evaluate(async () => { await document.fonts.ready; return ['700 1em "Space Grotesk"', '1em "Atkinson Hyperlegible Next"', '800 1em "Bricolage Grotesque"'].map((f) => `${f}: ${document.fonts.check(f)}`).join(', '); });
  console.log(`offline fonts -> ${fonts}`);
  const materials = await p.evaluate(async () => {
    const ok = async (u) => { try { return (await fetch(u)).ok; } catch (e) { return false; } };
    return { capiz: await ok('assets/img/capiz.svg'), banig: await ok('assets/img/banig.svg') };
  });
  console.log(`offline materials -> ${JSON.stringify(materials)}`);
  await p.goto(`${URL}admin.html`, { waitUntil: 'load' }).catch((e) => console.log('admin error', e.message));
  await wait(900);
  const adminPage = await p.evaluate(() => (document.querySelector('h1') || {}).textContent || '(no h1)');
  console.log(`offline admin.html -> ${adminPage.trim().slice(0, 60)}`);
  await p.goto(`${URL}`, { waitUntil: 'load' }).catch(() => {});
  const real = errs.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
  console.log(real.length ? 'errors: ' + real.join(' | ') : 'no app errors');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
