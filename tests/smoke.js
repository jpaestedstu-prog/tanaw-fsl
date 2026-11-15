// Smoke test: load every route at several viewports over file://, report errors and overflow.
// Usage: node smoke.js <path-to-index.html> [routesJSON]  (default: routes.json)
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const index = process.argv[2];
const base = pathToFileURL(path.resolve(index)).href;
const routes = process.argv[3] ? JSON.parse(process.argv[3]) : JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'));
const viewports = [
  { name: 'desktop', width: 1366, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'small', width: 320, height: 640 },
  // The largest text size in Settings: page layouts must hold, not only the default size.
  { name: 'laptop, 150% text', width: 1024, height: 768, text: 1.5 },
  { name: 'phone, 150% text', width: 390, height: 844, text: 1.5 },
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const problems = [];
  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.evaluateOnNewDocument((text) => {
      try {
        const s = JSON.parse(localStorage.getItem('tanaw.state.v1') || '{}');
        s.settings = Object.assign({}, s.settings, { textScale: text });
        localStorage.setItem('tanaw.state.v1', JSON.stringify(s));
      } catch (e) { /* ignore */ }
    }, vp.text || 1);
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', (e) => errs.push(`[pageerror] ${e.message}`));
    page.on('requestfailed', (r) => errs.push(`[requestfailed] ${r.url()} ${r.failure() && r.failure().errorText}`));
    for (const r of routes) {
      errs.length = 0;
      await page.goto(base + r, { waitUntil: 'load' });
      // Sections the browser has skipped because they are off screen have to be laid out to be measured.
      await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
      await new Promise((res) => setTimeout(res, 350));
      const info = await page.evaluate(() => {
        const de = document.documentElement;
        const over = de.scrollWidth - de.clientWidth;
        const offenders = [];
        if (over > 1) {
          document.querySelectorAll('body *').forEach((el) => {
            const rc = el.getBoundingClientRect();
            if (rc.right > de.clientWidth + 1 && rc.width > 0 && getComputedStyle(el).position !== 'fixed') offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')} right=${Math.round(rc.right)}`);
          });
        }
        const h1 = document.querySelectorAll('h1').length;
        return { over, offenders: offenders.slice(0, 6), h1, title: document.title, view: document.body.dataset.view };
      });
      const issues = [];
      if (errs.length) issues.push(...errs);
      if (info.over > 1) issues.push(`horizontal overflow ${info.over}px: ${info.offenders.join(' | ')}`);
      if (info.h1 !== 1) issues.push(`h1 count = ${info.h1}`);
      if (issues.length) problems.push({ vp: vp.name, route: r, view: info.view, issues });
    }
    await page.close();
  }
  await browser.close();
  if (!problems.length) console.log('OK: no problems across', routes.length, 'routes x', viewports.length, 'viewports');
  else problems.forEach((p) => console.log(`\n[${p.vp}] ${p.route} (view=${p.view})\n  - ${p.issues.join('\n  - ')}`));
})().catch((e) => { console.error(e); process.exit(1); });
