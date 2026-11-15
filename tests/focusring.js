// Focus-ring contrast (WCAG 1.4.11): focus every element in the tab order and compare
// the ring colour with the rendered pixels just outside the ring (read from a screenshot,
// so backgrounds painted by gradients or separate layers count too).
// The administrator console (admin.html, next to index.html) is checked too, in its own looks.
// Chrome chooses its own renderer here. Forced onto SwiftShader (--use-angle=swiftshader), it paints
// pale bands over some cards that a real GPU does not, and this test would measure those pixels.
// Usage: node focusring.js <index.html>
const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const adminBase = pathToFileURL(path.join(path.dirname(path.resolve(process.argv[2])), 'admin.html')).href;
const consoleSections = ['#/overview', '#/people', '#/review', '#/activity', '#/site', '#/system'];
const consoleModes = [{ look: 'paper' }, { look: 'night' }, { look: 'paper', contrast: 'high' }, { look: 'night', contrast: 'high' }];
const routes = ['#/', '#/learn', '#/learn/path', '#/play', '#/scenes/clinic', '#/library', '#/sign/thank-you', '#/practice',
  '#/community', '#/community/identity', '#/community/history', '#/community/rights', '#/community/calendar', '#/community/connect',
  '#/journey', '#/studio', '#/about', '#/learn/what-is-fsl', '#/play/sightlines',
  '#/lab', '#/lab?tab=spell&text=Ana', '#/practice/fingerspell?text=Ana', '#/play/read-hand', '#/community/stories', '#/community/stories/pedro-santos',
  '#/login', '#/register'];
const modes = [{ theme: 'light' }, { theme: 'dark' }, { theme: 'light', contrast: 'high' }, { theme: 'dark', contrast: 'high' }];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-swiftshader'] });
  const findings = new Map();
  let checked = 0;
  // Focuses every control on the page that is showing, and records any ring under 3:1.
  const checkPage = async (page, cdp, r, label) => {
    const count = await page.evaluate(() => {
      const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]';
      window.__targets = [...document.querySelectorAll(sel)]
        .filter((el) => el.tabIndex >= 0 && el.getAttribute('tabindex') !== '-1')
        .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden'; });
      return window.__targets.length;
    });
    for (let i = 0; i < count; i++) {
      // Focus, then describe the ring and the points just outside it.
      const info = await page.evaluate((i) => {
        const el = window.__targets[i];
        if (!el || !el.isConnected) return null;
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.focus({ preventScroll: true });
        if (document.activeElement !== el) return null;
        // Custom controls draw the ring on a sibling or an ancestor (checkbox box, option card, path stop card).
        let ring = null;
        if (el.matches('.check input, .switch input, .segmented__option input')) ring = el.nextElementSibling;
        else if (el.matches('.option input')) ring = el.closest('.option');
        else for (let n = el, k = 0; n && k < 4; n = n.parentElement, k++) { const cs = getComputedStyle(n); if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) { ring = n; break; } }
        const name = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`;
        if (!ring) return { name, none: true };
        const cs = getComputedStyle(ring);
        const b = ring.getBoundingClientRect();
        // A ring drawn outside the element is judged against the pixels just outside it; an inset
        // ring (negative offset, e.g. on the 3D stage) against the pixels just inside it.
        const off = parseFloat(cs.outlineOffset) || 0;
        const d = off >= 0 ? off + (parseFloat(cs.outlineWidth) || 0) + 2 : off - 2;
        const pts = [[b.left + b.width / 2, b.top - d], [b.left + b.width / 2, b.bottom + d], [b.left - d, b.top + b.height / 2], [b.right + d, b.top + b.height / 2],
          [b.left + b.width / 4, b.top - d], [b.left + (3 * b.width) / 4, b.bottom + d]]
          .map(([x, y]) => [Math.round(x), Math.round(y)])
          .filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
        return { name, ring: cs.outlineColor, pts };
      }, i);
      if (!info) continue;
      if (info.none) { const k = `[${label}] ${info.name} — no visible focus ring`; if (!findings.has(k)) findings.set(k, new Set()); findings.get(k).add(r); continue; }
      if (!info.pts.length) continue;
      // No clip: CDP clips are in document coordinates, and the samples are in viewport coordinates.
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const ratio = await page.evaluate(async (png, pts, ring) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + png;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const lum = (r, gg, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
        const m = ring.match(/\d+(\.\d+)?/g).map(Number);
        const lr = lum(m[0], m[1], m[2]);
        const ratios = pts.map(([x, y]) => { const p = g.getImageData(x, y, 1, 1).data; const lb = lum(p[0], p[1], p[2]); return (Math.max(lr, lb) + 0.05) / (Math.min(lr, lb) + 0.05); }).sort((a, b) => a - b);
        return ratios[Math.floor(ratios.length / 2)]; // median: a neighbouring control under one point does not decide
      }, data, info.pts, info.ring);
      checked += 1;
      if (ratio < 3) {
        const k = `[${label}] ${info.name} — ring ${info.ring}, median contrast ${ratio.toFixed(2)}:1`;
        if (!findings.has(k)) findings.set(k, new Set());
        findings.get(k).add(r);
      }
    }
  };
  for (const mode of modes) {
    const label = `${mode.theme}${mode.contrast ? '+high-contrast' : ''}`;
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument((m) => {
      try { localStorage.setItem('tanaw.state.v1', JSON.stringify({ settings: { theme: m.theme, contrast: m.contrast || 'standard', motion: 'reduce' } })); } catch (e) { /* ignore */ }
    }, mode);
    const cdp = await page.createCDPSession();
    for (const r of routes) {
      await page.goto(base + r, { waitUntil: 'load' });
      await wait(500);
      await checkPage(page, cdp, r, label);
    }
    await page.close();
  }

  // The console, signed in as the first administrator, in a separate browser profile.
  const profile = await browser.createBrowserContext();
  const page = await profile.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(adminBase, { waitUntil: 'load' });
  await wait(500);
  await checkPage(page, await page.createCDPSession(), 'admin.html setup', 'console first-time setup');
  await page.type('#c-name', 'Focus Test');
  await page.type('#c-email', 'focus@example.com');
  await page.type('#c-password', 'bantay sa tanawan 9');
  await page.type('#c-confirm', 'bantay sa tanawan 9');
  await page.evaluate(() => document.querySelector('[data-console-setup]').requestSubmit());
  await wait(1000);
  if (!(await page.$('.rail'))) throw new Error('could not create the administrator');
  for (const mode of consoleModes) {
    const label = `console ${mode.look}${mode.contrast ? '+high-contrast' : ''}`;
    await page.evaluate((m) => {
      localStorage.setItem('tanaw.console.look', m.look);
      Tanaw.settings.set('contrast', m.contrast || 'standard');
      Tanaw.settings.set('motion', 'reduce');
      Tanaw.store.flush();
    }, mode);
    await page.goto('about:blank');
    await page.goto(adminBase, { waitUntil: 'load' });
    await wait(500);
    const cdp = await page.createCDPSession();
    for (const s of consoleSections) {
      await page.evaluate((h) => { location.hash = h; }, s);
      await wait(350);
      await checkPage(page, cdp, `admin.html${s}`, label);
    }
  }
  await browser.close();
  if (!findings.size) { console.log(`OK: ${checked} focus rings checked; every one has at least 3:1 contrast with the pixels around it`); return; }
  console.log(`${checked} focus rings checked; problems:`);
  for (const [k, rs] of findings) console.log(`${k}  routes=${[...rs].slice(0, 4).join(' ')}`);
  process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
