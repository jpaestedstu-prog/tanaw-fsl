// The sizes the smoke test skips, and WCAG 1.4.12's text spacing, on every route: a window at 200% zoom, very wide
// screens, a phone on its side, relaxed spacing. Looks for sideways scrolling, text cut off inside a box, and words
// broken in the middle. A long web address may break, and is listed for a person to judge; anything else fails.
// Usage: node reflow.js <index.html>
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}';
const CONFIGS = [
  { name: '640×720 (a 1280 window at 200% zoom)', w: 640, h: 720 },
  { name: '768×1024', w: 768, h: 1024 },
  { name: '1024×600', w: 1024, h: 600 },
  { name: '1920×1080', w: 1920, h: 1080 },
  { name: '2560×1440', w: 2560, h: 1440 },
  { name: '844×390 (a phone on its side)', w: 844, h: 390 },
  { name: '1280×800, relaxed spacing', w: 1280, h: 800, settings: { spacing: 'relaxed' } },
  { name: '390×844, relaxed spacing', w: 390, h: 844, settings: { spacing: 'relaxed' } },
  { name: '1280×800, WCAG text spacing', w: 1280, h: 800, css: SPACING },
  { name: '390×844, WCAG text spacing', w: 390, h: 844, css: SPACING },
];

const inspect = () => {
  const de = document.documentElement;
  const over = de.scrollWidth - de.clientWidth;
  const who = [];
  if (over > 1) document.querySelectorAll('body *').forEach((el) => { const b = el.getBoundingClientRect(); if (b.right > de.clientWidth + 1 && b.width > 0 && getComputedStyle(el).position !== 'fixed' && who.length < 3) who.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`); });
  // Text cut off: a box that hides overflow and whose own text does not fit.
  const cut = [];
  document.querySelectorAll('#view *, .site-header *, .tabbar *').forEach((el) => {
    if (!el.childNodes.length || el.closest('svg, canvas, .visually-hidden, [aria-hidden="true"]')) return;
    const cs = getComputedStyle(el);
    if (!/hidden|clip/.test(cs.overflowX + cs.overflowY) || cs.display === 'none') return;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 3) cut.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
  });
  // Words broken in the middle: one word whose letters sit on two lines.
  const broken = [];
  const web = [];
  const walker = document.createTreeWalker(document.querySelector('#view') || document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim() || (n.parentElement && n.parentElement.closest('.visually-hidden, [aria-hidden="true"], svg'))) continue;
    const address = /https?:\/\/|www\.|\.\w{2,3}\//.test(n.textContent);
    for (const m of n.textContent.matchAll(/[A-Za-zÀ-ÿ]{5,}/g)) {
      range.setStart(n, m.index);
      range.setEnd(n, m.index + m[0].length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      if (rects.length > 1 && Math.abs(rects[0].top - rects[rects.length - 1].top) > 4) (address ? web : broken).push(`"${m[0]}" in .${String(n.parentElement.className).split(' ')[0] || n.parentElement.tagName.toLowerCase()}`);
    }
  }
  return { over, who, cut: [...new Set(cut)].slice(0, 5), broken: broken.slice(0, 4), web: web.slice(0, 2), h1: document.querySelectorAll('h1').length };
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  let failures = 0;
  for (const c of CONFIGS) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewport({ width: c.w, height: c.h });
    await page.evaluateOnNewDocument((s) => { try { sessionStorage.setItem('tanaw.intro', '1'); if (s) { const st = JSON.parse(localStorage.getItem('tanaw.state.v1') || '{}'); st.settings = Object.assign({}, st.settings, s); localStorage.setItem('tanaw.state.v1', JSON.stringify(st)); } } catch (e) { /* ignore */ } }, c.settings || null);
    const problems = new Map();
    const notes = new Set();
    const note = (k, r) => { if (!problems.has(k)) problems.set(k, new Set()); problems.get(k).add(r); };
    for (const r of routes) {
      await page.goto('about:blank');
      await page.goto(base + r, { waitUntil: 'load' });
      // Sections the browser has skipped because they are off screen have to be laid out to be measured.
      await page.addStyleTag({ content: `*{content-visibility:visible!important}${c.css || ''}` });
      await wait(450);
      const m = await page.evaluate(inspect);
      if (m.over > 1) note(`sideways scrolling ${m.over}px: ${m.who.join(' ')}`, r);
      m.cut.forEach((x) => note(`cut off: ${x}`, r));
      m.broken.forEach((x) => note(`word broken: ${x}`, r));
      m.web.forEach((x) => notes.add(x));
      if (m.h1 !== 1) note(`${m.h1} h1`, r);
    }
    errors.forEach((e) => note(`page error: ${e}`, ''));
    console.log(`${problems.size ? 'FAIL' : 'PASS'}  ${c.name}, ${routes.length} routes${notes.size ? `  (web addresses that wrap: ${notes.size})` : ''}`);
    for (const [k, rs] of problems) console.log(`      ${k}  [${[...rs].slice(0, 3).join(' ')}${rs.size > 3 ? ` +${rs.size - 3}` : ''}]`);
    failures += problems.size ? 1 : 0;
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${CONFIGS.length - failures}/${CONFIGS.length} passed`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
