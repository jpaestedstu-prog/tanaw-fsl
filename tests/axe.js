// axe-core audit of every route. Usage: node axe.js <index.html> <theme> <contrast> [w]
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [,, index, theme = 'light', contrast = 'standard', w = '1280'] = process.argv;
const base = pathToFileURL(path.resolve(index)).href;
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8')).filter((r) => r !== '#/nope');

(async () => {
  // SwiftShader gives headless Chrome WebGL, so the 3D views are audited as visitors see them.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: Number(w), height: 900 });
  await page.evaluateOnNewDocument((theme, contrast) => {
    try {
      const s = JSON.parse(localStorage.getItem('tanaw.state.v1') || '{}');
      s.settings = Object.assign(s.settings || {}, { theme, contrast, motion: 'reduce' });
      localStorage.setItem('tanaw.state.v1', JSON.stringify(s));
    } catch (e) {}
  }, theme, contrast);
  const all = {};
  for (const r of routes) {
    await page.goto('about:blank');
    await page.goto(base + r, { waitUntil: 'load' });
    // Sections the browser has skipped because they are off screen have to be drawn to be judged.
    await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
    await new Promise((res) => setTimeout(res, 700));
    await page.addScriptTag({ content: axeSrc });
    const res = await page.evaluate(async () => {
      const out = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
        resultTypes: ['violations'],
      });
      return out.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]) }));
    });
    if (res.length) all[r] = res;
  }
  await browser.close();
  const n = Object.values(all).reduce((a, v) => a + v.length, 0);
  console.log(`[${theme}/${contrast} @${w}] ${routes.length} routes, ${n} violation types`);
  Object.entries(all).forEach(([r, vs]) => {
    console.log(`\n${r}`);
    vs.forEach((v) => { console.log(`  - [${v.impact}] ${v.id}: ${v.help}`); v.nodes.forEach((x) => console.log(`      ${x}`)); });
  });
})().catch((e) => { console.error(e); process.exit(1); });
