// Flows for the experimental 3D hand, Stories and the command palette.
// Runs twice: with WebGL (SwiftShader, so it works without a GPU) and with 3D
// switched off, to check every 3D view falls back to text.
// Usage: node features.js <index.html> [shotDir]
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const shotDir = process.argv[3];
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, cond, detail = '') => { results.push({ name, pass: !!cond, detail }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const WEBGL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const NO_3D = ['--disable-3d-apis', '--disable-webgl'];

async function session(args, motion = 'full', scale = 1, device = null) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: scale });
  if (device) await page.evaluateOnNewDocument((d) => { Object.keys(d).forEach((k) => Object.defineProperty(Navigator.prototype, k, { get: () => d[k], configurable: true })); }, device);
  const errors = [];
  const glWarnings = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (/WebGL/i.test(m.text()) && /too many|context lost/i.test(m.text())) glWarnings.push(m.text());
  });
  await page.goto(base + '#/', { waitUntil: 'load' });
  await page.evaluate((motion) => { localStorage.clear(); localStorage.setItem('tanaw.state.v1', JSON.stringify({ settings: { motion } })); }, motion);
  await page.goto('about:blank');
  await page.goto(base + '#/', { waitUntil: 'load' });
  await wait(600);
  // Count rendered routes, so navigation can wait for the new page instead of guessing.
  await page.evaluate(() => { window.__routes = 0; Tanaw.bus.on('route', () => { window.__routes += 1; }); });
  // Navigate, then wait for the new page and the end of its transition: clicks do not reach the page during one.
  const go = async (hash, ms = 900) => {
    const before = await page.evaluate(() => window.__routes || 0);
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await page.waitForFunction((n) => (window.__routes || 0) > n && !document.documentElement.dataset.vt, { timeout: 15000 }, before).catch(() => {});
    await wait(ms);
  };
  const shot = async (name) => { if (shotDir) await page.screenshot({ path: path.join(shotDir, name + '.png') }); };
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(Tanaw.store.state)));
  const hud = (sel = '.stage3d') => page.evaluate((s) => { const st = document.querySelector(s); return st ? `${st.querySelector('[data-hud-kind]').textContent.trim()}|${st.querySelector('[data-hud-name]').textContent.trim()}` : ''; }, sel);
  // Share of the stage that is hand-coloured (the default kayumanggi skin), read from a screenshot.
  const handPixels = async (sel = '.stage3d') => {
    const el = await page.$(sel);
    if (!el) return -1;
    const b64 = await el.screenshot({ encoding: 'base64' });
    return page.evaluate(async (data) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + data;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let skin = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 110 && d[i] > d[i + 2] + 30 && d[i + 1] > 60) skin += 1;
      return skin / (d.length / 4);
    }, b64);
  };
  // Advance a lesson until a step with a 3D hand appears (answers checks on the way).
  const toHandStep = async () => {
    for (let k = 0; k < 14; k++) {
      if (await page.$('.step-hand')) return true;
      const moved = await page.evaluate(() => {
        const btn = document.querySelector('[data-primary]');
        if (btn && !btn.disabled) { btn.click(); return true; }
        const opt = document.querySelector('.option input:not(:disabled)');
        if (opt) { opt.click(); return true; }
        return false;
      });
      if (!moved) return false;
      await wait(350);
    }
    return !!(await page.$('.step-hand'));
  };
  return { browser, page, errors, glWarnings, go, shot, state, hud, handPixels, toHandStep };
}

(async () => {
  /* ===================== With WebGL ===================== */
  let s = await session(WEBGL);
  let { page, go, hud, handPixels, state } = s;
  ok('webgl: available in this run', await page.evaluate(() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl')); }));

  /* ---------- 3D Hand Lab ---------- */
  await go('#/lab', 2200);
  const lab = await page.evaluate(() => ({
    canvas: !!document.querySelector('.stage3d canvas'),
    letters: document.querySelectorAll('[data-letter]').length,
    gaps: [...document.querySelectorAll('[data-letter].is-gap')].map((b) => b.dataset.letter).join(','),
    note: /Not validated by Deaf FSL experts/.test(document.querySelector('.hand-note').textContent),
    badge: !!document.querySelector('.page-head .exp-badge'),
  }));
  ok('lab: 3D stage, 26 letter buttons, T marked as not modeled, experimental labels', lab.canvas && lab.letters === 26 && lab.gaps === 'T' && lab.note && lab.badge, JSON.stringify(lab));
  await page.click('[data-letter="B"]');
  await wait(900);
  const b = { hud: await hud(), info: await page.evaluate(() => document.querySelector('[data-letter-info]').textContent), px: await handPixels() };
  ok('lab: choosing B shows it on the hand and describes it', b.hud === 'Letter|B' && /Four fingers/.test(b.info) && b.px > 0.03, `${b.hud} px=${b.px.toFixed(3)}`);
  await s.shot('lab-b');
  await page.focus('[data-letter="B"]');
  await page.keyboard.press('y');
  await wait(600);
  ok('lab: typing a letter key shows that letter', (await hud()) === 'Letter|Y', await hud());
  await page.click('[data-letter="T"]');
  await wait(500);
  const t = await page.evaluate(() => document.querySelector('[data-letter-info]').textContent);
  ok('lab: T explains it is not modeled', /not modeled/i.test(t) && /formed differently/i.test(t), t.replace(/\s+/g, ' ').slice(0, 120));
  let st = await state();
  ok('lab: viewed letters count toward progress', st.explore && st.explore['lab:letter:B'] && st.explore['lab:letter:Y'] && !st.explore['lab:letter:T'], Object.keys(st.explore || {}).filter((k) => k.startsWith('lab:')).join(','));

  // Turning: arrow keys on the focused canvas change the view without errors.
  const before = await handPixels();
  await page.focus('.stage3d canvas');
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  await wait(400);
  const turned = await handPixels();
  ok('lab: arrow keys turn the hand (picture changes, hand still drawn)', turned > 0.01 && Math.abs(turned - before) > 0.002, `${before.toFixed(3)} → ${turned.toFixed(3)}`);

  // Spelling, with a gap letter.
  await go('#/lab?tab=spell&text=Tanaw', 600);
  const seen = await page.evaluate(async () => {
    const out = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 7000) {
      const cur = document.querySelector('.spell-strip .is-current');
      const c = cur ? cur.firstChild.textContent.trim() : '';
      if (c && out[out.length - 1] !== c) out.push(c);
      if (!cur && out.length >= 5) break;
      await new Promise((r) => setTimeout(r, 25));
    }
    return out;
  });
  const gapNote = await page.evaluate(() => document.querySelector('[data-gap-note]').textContent);
  ok('lab: spelling TANAW steps through every letter in order', seen.join('') === 'TANAW', seen.join(','));
  ok('lab: the gap letter T gets a note', /T is formed differently/.test(gapNote), gapNote.slice(0, 100));
  await page.click('[data-example="FSL"]');
  await wait(300);
  await page.click('[data-spell-pause]');
  const paused = await page.evaluate(() => document.querySelector('[data-spell-pause]').textContent.trim());
  await page.click('[data-spell-pause]');
  ok('lab: an example word spells and can be paused and resumed', paused === 'Resume', paused);

  // Handshapes and demonstrations.
  await go('#/lab?tab=shapes', 1200);
  await page.click('[data-shape]');
  await wait(800);
  ok('lab: a handshape tile shows on the hand', /^Handshape\|/.test(await hud()) && (await handPixels()) > 0.02, await hud());
  await go('#/lab?tab=params', 1200);
  await page.click('[data-demo="mv-circle"]');
  await wait(400);
  const demo = { hud: await hud(), info: await page.evaluate(() => document.querySelector('[data-demo-info]').textContent.trim()) };
  ok('lab: a movement demonstration plays and is described', /^Movement\|Circle/.test(demo.hud) && demo.info.length > 20, JSON.stringify(demo));

  // Toolbar: left hand mirrors and persists; style swatch persists.
  await page.click('[data-mirror-toggle]');
  await page.click('.hand-tools__styles input[value="hologram"]');
  await wait(300);
  st = await state();
  ok('lab: "Left hand" and the style swatch save to settings', st.settings.handMirror === true && st.settings.handStyle === 'hologram', `${st.settings.handMirror} ${st.settings.handStyle}`);
  await page.click('[data-mirror-toggle]');
  await page.click('.hand-tools__styles input[value="kayumanggi"]');
  await wait(200);

  /* ---------- Fingerspelling (3D) and the reading drill ---------- */
  await go('#/practice/fingerspell?text=Cebu', 2000);
  const fsp = await page.evaluate(() => ({ canvas: document.querySelectorAll('.stage3d canvas').length, drill: !!document.querySelector('#drill-title'), labels: [...document.querySelectorAll('.fs-tile')].map((x) => x.getAttribute('aria-label')).join(',') }));
  ok('fingerspelling: 3D stage and reading drill, tiles C,E,B,U', fsp.canvas === 2 && fsp.drill && fsp.labels === 'C,E,B,U', JSON.stringify(fsp));
  // The drill's hand is far below the screen: it waits, with a loading state, until it comes near.
  const lazy = await page.evaluate(() => ({ top: document.querySelector('.fs-player .hand3d').classList.contains('is-booting'), drill: document.querySelector('.stage3d--drill .hand3d').classList.contains('is-booting') }));
  ok('3D: a hand far below the screen waits until it comes near', !lazy.top && lazy.drill, JSON.stringify(lazy));
  await page.click('[data-next]');
  await wait(700);
  ok('fingerspelling: next shows letter 1 of 4 on the hand', (await hud('.fs-player .stage3d')) === 'Letter 1 of 4|C', await hud('.fs-player .stage3d'));
  await page.click('[data-drill-new]');
  await page.waitForFunction(() => /Your turn/.test(document.querySelector('.stage3d--drill [data-hud-kind]').textContent), { timeout: 15000 }).catch(() => {});
  ok('fingerspelling drill: the hand spells a word, then asks for it', /Your turn/.test(await hud('.stage3d--drill')), await hud('.stage3d--drill'));
  await page.type('#drill-answer', 'zzz');
  await page.click('[data-drill-check]');
  await wait(200);
  const dr = await page.evaluate(() => ({ fb: document.querySelector('[data-drill-feedback]').textContent, score: document.querySelector('[data-drill-score]').textContent }));
  ok('fingerspelling drill: a wrong answer reveals the word and counts the try', /The word was [A-Z]+/.test(dr.fb) && dr.score === 'Score: 0 / 1', JSON.stringify(dr));

  /* ---------- Read the Hand game ---------- */
  await go('#/play/read-hand', 2200);
  const rh = await page.evaluate(() => ({ canvas: !!document.querySelector('.rh canvas'), answers: document.querySelectorAll('.rh .answer').length, q: (document.querySelector('.rh .game-q') || {}).textContent }));
  ok('read the hand: 3D stage, a question and 4 answers', rh.canvas && rh.answers === 4 && /Which letter/.test(rh.q), JSON.stringify(rh));
  let rounds = 0;
  for (; rounds < 12; rounds++) {
    const more = await page.evaluate(() => { const a = document.querySelector('.rh .answer:not([disabled])'); if (!a) return false; a.click(); return true; });
    if (!more) break;
    await wait(rounds === 0 ? 700 : 250);
    if (rounds === 0) {
      const fbv = await page.evaluate(() => { const r = document.querySelector('[data-game-feedback]').getBoundingClientRect(); return !document.querySelector('[data-game-feedback]').hidden && r.top < window.innerHeight && r.bottom > 0; });
      ok('read the hand: feedback is shown and scrolled into view', fbv);
    }
    await page.evaluate(() => document.querySelector('[data-game-next]').click());
    await wait(rounds >= 5 ? 900 : 400);
  }
  st = await state();
  ok('read the hand: all 10 rounds play through to the results', rounds === 10 && st.games['read-hand'] && st.games['read-hand'].plays === 1, `rounds=${rounds}`);
  ok('read the hand: never chosen as the daily challenge (checked over 400 days)', await page.evaluate(() => {
    const U = Tanaw.util;
    const real = U.dateKey;
    try {
      for (let i = 0; i < 400; i++) {
        const d = new Date(2026, 0, 1 + i);
        U.dateKey = () => d.toISOString().slice(0, 10);
        if (Tanaw.progress.dailyGame() === 'read-hand') return false;
      }
      return true;
    } finally { U.dateKey = real; }
  }));
  await go('#/play', 900);
  ok('games hub: Read the Hand card carries the Experimental badge', await page.evaluate(() => /Experimental/.test(document.querySelector('a[href="#/play/read-hand"]').textContent)));

  /* ---------- Lessons with 3D steps ---------- */
  await go('#/learn/sign-parameters', 900);
  const ps = await s.toHandStep();
  await wait(1500);
  await page.evaluate(() => document.querySelector('.step-hand [data-demo]').click());
  await wait(500);
  const psInfo = await page.evaluate(() => (document.querySelector('[data-step-info]') || {}).textContent || '');
  ok('lesson "How signs are built": orientation & movement step works', ps && psInfo.length > 20 && !!(await page.$('.step-hand canvas')), psInfo.slice(0, 80));
  await go('#/learn/fingerspelling', 900);
  const fl = await s.toHandStep();
  await wait(1500);
  await page.evaluate(() => document.querySelector('.step-hand [data-letter="Y"]').click());
  await wait(700);
  ok('lesson "Fingerspelling basics": 3D alphabet step shows a chosen letter', fl && (await hud('.step-hand .stage3d')).endsWith('|Y'), await hud('.step-hand .stage3d'));

  /* ---------- Letter pages and the mirror ---------- */
  await go('#/sign/letter-b', 2000);
  const lp = await page.evaluate(() => ({ canvas: !!document.querySelector('[data-word-3d] canvas'), note: (document.querySelector('[data-word-3d] .hand-note') || {}).textContent || '', hint: document.querySelector('.word-main .field__hint').textContent }));
  ok('letter page: B shows the 3D hand, its description and the experimental note', lp.canvas && /Four fingers/.test(lp.note) && /not validated/.test(lp.note) && /not whole signs/.test(lp.hint), JSON.stringify(lp).slice(0, 200));
  await go('#/sign/letter-t', 1500);
  const lt = await page.evaluate(() => ({ canvas: !!document.querySelector('[data-word-3d] canvas'), text: (document.querySelector('[data-word-3d]') || {}).textContent || '' }));
  ok('letter page: T explains the gap instead of showing a hand', !lt.canvas && /formed differently/.test(lt.text), lt.text.trim().slice(0, 100));
  await go('#/sign/thank-you', 900);
  ok('word page: a vocabulary word has no 3D hand', !(await page.$('[data-word-3d]')));
  await go('#/practice/mirror?sign=letter-l', 2200);
  ok('mirror: a letter shows the 3D reference', !!(await page.$('.mirror__ref canvas')));
  await page.select('#mirror-sign', 'thank-you').catch(() => {});
  await page.evaluate(() => { const sel = document.querySelector('.mirror select'); if (sel) { sel.value = 'thank-you'; sel.dispatchEvent(new Event('change', { bubbles: true })); } });
  await wait(600);
  ok('mirror: switching to a word removes the 3D reference', !(await page.$('.mirror__ref canvas')));

  /* ---------- Landing: the split screen first, then the 3D sign language landing ---------- */
  await go('#/', 1500);
  const landing3d = await page.evaluate(() => ({ split: document.querySelectorAll('.horizon canvas').length, labFeature: !!document.querySelector('.feature[href="#/lab"] .exp-badge'), labStation: !!document.querySelector('.realm__station[href="#/lab"] .realm__exp'), hero: !!document.querySelector('.nh-hero .exp-badge') }));
  ok('landing: no 3D hand in the split screen, and every 3D view and way to the Lab is labeled experimental', landing3d.split === 0 && landing3d.labFeature && landing3d.labStation && landing3d.hero, JSON.stringify(landing3d));
  await page.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => document.querySelector('[data-hero-strip] .is-current'), { timeout: 15000 }).catch(() => {});
  ok('landing: the second landing\'s hand greets once it comes into view', (await hud('.nh-hero .stage3d')) === 'Fingerspelling|MABUHAY' && !!(await page.$('.nh-hero canvas')), await hud('.nh-hero .stage3d'));
  await wait(1200);
  const heroSkin = await handPixels('.nh-hero .stage3d');
  ok('landing: it really draws a hand', heroSkin > 0.02, `skin share ${heroSkin.toFixed(3)}`);
  await page.type('#hero-spell', 'Ana');
  await page.keyboard.press('Enter');
  await wait(600);
  ok('landing: "Fingerspell your name" spells it on the hand', (await hud('.nh-hero .stage3d')) === 'Fingerspelling|ANA', await hud('.nh-hero .stage3d'));
  const named = await page.evaluate(() => ({ tiles: [...document.querySelectorAll('[data-hero-strip] .spell-strip__tile')].map((t) => t.textContent).join(''), live: document.querySelector('.nh-hero [data-caption]').getAttribute('aria-live') }));
  ok('landing: its letters are listed, and read out because the visitor asked', named.tiles === 'ANA' && named.live === 'polite', JSON.stringify(named));

  /* ---------- Command palette ---------- */
  await go('#/learn', 900);
  await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
  await wait(300);
  const pal = await page.evaluate(() => ({ open: !!document.querySelector('dialog.palette[open]'), focus: document.activeElement.classList.contains('palette__input'), opts: document.querySelectorAll('.palette__item').length }));
  ok('palette: Ctrl+K opens it with the search field focused and suggestions listed', pal.open && pal.focus && pal.opts >= 6, JSON.stringify(pal));
  await page.keyboard.type('kaibigan');
  await wait(250);
  const pq = await page.evaluate(() => ({ labels: [...document.querySelectorAll('.palette__item .palette__label')].map((x) => x.textContent.trim()), ad: document.querySelector('.palette__input').getAttribute('aria-activedescendant') }));
  ok('palette: results include a 3D action and the word', /Fingerspell “kaibigan” in 3D/.test(pq.labels[0]) && pq.labels.includes('Friend') && pq.ad === 'palette-opt-0', pq.labels.join(' | '));
  await page.keyboard.press('ArrowDown');
  ok('palette: arrow keys move the active option', (await page.evaluate(() => document.querySelector('.palette__input').getAttribute('aria-activedescendant'))) === 'palette-opt-1');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await wait(1800);
  const after = await page.evaluate(() => ({ hash: location.hash, open: !!document.querySelector('dialog.palette[open]') }));
  ok('palette: Enter runs the action (Lab spells the word)', after.hash === '#/lab?tab=spell&text=kaibigan' && !after.open, JSON.stringify(after));
  // Clicks do not reach the page during a view transition.
  await page.waitForFunction(() => !document.documentElement.dataset.vt, { timeout: 10000 }).catch(() => {});
  await page.click('[data-open-palette]');
  await wait(300);
  await page.keyboard.type('rights');
  await wait(250);
  const rights = await page.evaluate(() => [...document.querySelectorAll('.palette__item .palette__type span')].map((x) => x.textContent));
  ok('palette: the header button opens it; searching finds rights sections', rights.includes('Rights'), rights.slice(0, 6).join(','));
  await page.keyboard.press('Escape');
  await wait(300);
  ok('palette: Esc closes it', !(await page.$('dialog.palette[open]')));
  // The Stories have not been opened yet in this session: search loads them itself.
  await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
  await wait(300);
  await page.keyboard.type('story');
  await wait(600);
  const storyRes = await page.evaluate(() => [...document.querySelectorAll('.palette__item')].map((li) => `${li.querySelector('.palette__type span').textContent}:${li.querySelector('.palette__label').textContent.trim()}`));
  ok('palette: "story" lists the Stories page, then the stories (loaded on demand)', storyRes[1] === 'Page:Stories' && storyRes.filter((x) => x.startsWith('Story:')).length === 6, storyRes.slice(0, 4).join(' | '));
  await page.keyboard.press('Escape');
  await wait(300);

  /* ---------- Stories ---------- */
  await go('#/community/stories', 1200);
  const hub = await page.evaluate(() => ({ cards: document.querySelectorAll('.story-card').length, n: Tanaw.data.storyList.length }));
  ok('stories hub: one card per story', hub.cards === hub.n && hub.n === 6, JSON.stringify(hub));
  const story = await page.evaluate(() => { const x = Tanaw.data.getStory('pedro-santos'); return { chapters: x.chapters.length, answer: x.check.answer }; });
  await go('#/community/stories/pedro-santos', 1000);
  const r1 = await page.evaluate(() => ({ dots: document.querySelectorAll('.story-progress__dot').length, count: document.querySelector('[data-count]').textContent, src: !!document.querySelector('.chapter a[href^="http"]') }));
  ok('story reader: progress dots, chapter count and a source link', r1.dots === story.chapters + 1 && r1.count === `Chapter 1 of ${story.chapters}` && r1.src, JSON.stringify(r1));
  await page.keyboard.press('ArrowRight');
  await wait(200);
  ok('story reader: → turns the page and keeps the place in the address', (await page.evaluate(() => document.querySelector('[data-count]').textContent)) === `Chapter 2 of ${story.chapters}` && /ch=1/.test(await page.evaluate(() => location.hash)));
  for (let i = 1; i < story.chapters; i++) { await page.keyboard.press('ArrowRight'); await wait(120); }
  await page.keyboard.press(String(story.answer + 1));
  await wait(300);
  const chk = await page.evaluate(() => ({ correct: !!document.querySelector('.answer.is-correct'), fb: (document.querySelector('[data-check-feedback]') || {}).textContent || '', reflect: !document.querySelector('[data-reflect]').hidden }));
  ok('story reader: the checkpoint answers by number key and opens the reflection', chk.correct && /Correct/.test(chk.fb) && chk.reflect, JSON.stringify(chk).slice(0, 160));
  await page.type('#story-reflect', 'Test reflection');
  await page.evaluate(() => document.querySelector('[data-reflect] [type="submit"]').click());
  await wait(300);
  st = await state();
  ok('story reader: reading is recorded and the reflection goes to the journal', st.explore['story:pedro-santos'] && st.explore['exhibit:stories'] && st.progress.journal[0] && st.progress.journal[0].text === 'Test reflection');

  /* ---------- The 3D note leads to the About page's 3D section ---------- */
  await go('#/lab', 900);
  await page.evaluate(() => document.querySelector('.hand-note a[href="#/about?s=3d"]').click());
  await page.waitForFunction(() => location.hash === '#/about?s=3d' && !!document.querySelector('#about-3d'), { timeout: 10000 }).catch(() => {});
  await wait(600);
  const top = await page.evaluate(() => { const s = document.querySelector('#about-3d'); return s ? Math.round(s.getBoundingClientRect().top) : null; });
  ok('3D note: "About the 3D hand" opens the About page at its 3D section', top !== null && top >= 0 && top < 320, `section top=${top}`);

  /* ---------- WebGL context hygiene ---------- */
  for (const r of ['#/lab', '#/practice/fingerspell?text=Ana', '#/play/read-hand', '#/sign/letter-a', '#/', '#/lab?tab=params', '#/practice/mirror?sign=letter-c', '#/sign/letter-d', '#/practice/fingerspell', '#/lab', '#/', '#/play/read-hand', '#/sign/letter-e', '#/lab', '#/practice/fingerspell', '#/', '#/lab', '#/sign/letter-f']) await go(r, 700);
  const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
  ok('3D: 18 views in a row leave only the current canvases and no context warnings', canvases <= 2 && s.glWarnings.length === 0, `canvases=${canvases} warnings=${s.glWarnings.slice(0, 2).join(' | ')}`);
  ok('webgl run: no page errors', s.errors.length === 0, s.errors.slice(0, 5).join(' | '));
  await s.browser.close();

  /* ===================== Reduced motion ===================== */
  s = await session(WEBGL, 'reduce');
  ({ page, go } = s);
  await go('#/lab?tab=spell&text=FSL', 0);
  await page.waitForSelector('.lab .spell-strip');
  const steps = await page.evaluate(async () => {
    const out = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 8000) {
      const cur = document.querySelector('.lab .spell-strip .is-current');
      const c = cur ? cur.firstChild.textContent.trim() : '';
      if (c && out[out.length - 1] !== c) out.push(c);
      if (!cur && out.length >= 3) break;
      await new Promise((r) => setTimeout(r, 25));
    }
    return out;
  });
  ok('reduced motion: spelling still shows every letter (stepped, not skipped)', steps.join('') === 'FSL', steps.join(','));
  ok('reduced-motion run: no page errors', s.errors.length === 0, s.errors.slice(0, 5).join(' | '));
  await s.browser.close();

  /* ===================== Entry-level devices, on a high-density screen ===================== */
  const detail = async (device) => {
    s = await session(WEBGL, 'full', 2, device);
    await s.go('#/lab', 300);
    await s.page.waitForFunction(() => { const w = document.querySelector('.stage3d .hand3d'); return w && !w.classList.contains('is-booting'); }, { timeout: 20000 }).catch(() => {});
    const r = await s.page.evaluate(() => {
      const c = document.querySelector('.stage3d canvas');
      return { ratio: +(c.width / c.getBoundingClientRect().width).toFixed(2), antialias: c.getContext('webgl').getContextAttributes().antialias };
    });
    const clean = s.errors.length === 0;
    await s.browser.close();
    return { ...r, clean };
  };
  const full = await detail({ deviceMemory: 8, hardwareConcurrency: 8 });
  const low = await detail({ deviceMemory: 2, hardwareConcurrency: 8 });
  const few = await detail({ deviceMemory: 8, hardwareConcurrency: 2 });
  ok('3D detail: a device with little memory or few cores draws fewer pixels, without smoothing', full.ratio > 1.5 && full.antialias && low.ratio <= 1.26 && !low.antialias && few.ratio <= 1.26 && !few.antialias, JSON.stringify({ full, low, few }));
  ok('3D detail run: no page errors', full.clean && low.clean && few.clean);

  /* ===================== Without 3D ===================== */
  s = await session(NO_3D);
  ({ page, go } = s);
  ok('no-3d: WebGL is unavailable in this run', await page.evaluate(() => { const c = document.createElement('canvas'); return !(c.getContext('webgl') || c.getContext('experimental-webgl')); }));
  await go('#/lab', 1800);
  await page.click('[data-letter="B"]');
  await wait(300);
  const nl = await page.evaluate(() => ({ fallback: (document.querySelector('.hand3d__fallback') || {}).textContent || '', info: document.querySelector('[data-letter-info]').textContent }));
  ok('no-3d lab: explains WebGL is missing; letter descriptions still work', /needs WebGL/.test(nl.fallback) && /Four fingers/.test(nl.info), JSON.stringify(nl).slice(0, 160));
  await go('#/practice/fingerspell?text=Cebu', 1500);
  await page.click('[data-next]');
  await wait(200);
  const nf = await page.evaluate(() => ({ stage: (document.querySelector('[data-stage]') || {}).innerText || '', drill: !!document.querySelector('#drill-title'), notice: /needs WebGL/.test(document.querySelector('main').innerText) }));
  ok('no-3d fingerspelling: letter planner, no drill, a clear notice', /C\s*Letter 1 of 4/.test(nf.stage) && !nf.drill && nf.notice, JSON.stringify(nf));
  await go('#/play/read-hand', 1500);
  ok('no-3d read the hand: says the game needs 3D and links back', await page.evaluate(() => /needs 3D/.test(document.querySelector('main').innerText) && !!document.querySelector('main a[href="#/play"]')));
  await go('#/', 1000);
  ok('no-3d split screen: needs no WebGL, so nothing changes', await page.evaluate(() => document.querySelectorAll('.realm__cta').length === 2 && !document.querySelector('.horizon canvas') && !document.querySelector('.horizon .hand3d__fallback')));
  await page.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' }));
  await wait(1200);
  await page.type('#hero-spell', 'Ana');
  await page.keyboard.press('Enter');
  await wait(400);
  const nh = await page.evaluate(() => ({ note: !!document.querySelector('.nh-hero .hand3d__fallback'), tiles: document.querySelectorAll('.nh-hero .spell-strip__tile').length }));
  ok('no-3d second landing: explains WebGL is missing; spelling a name still lists its letters', nh.note && nh.tiles === 3, JSON.stringify(nh));
  await go('#/sign/letter-b', 1500);
  ok('no-3d letter page: shows the description without a hand', await page.evaluate(() => /needs WebGL/.test(document.querySelector('[data-word-3d]').textContent) && /Four fingers/.test(document.querySelector('[data-word-3d]').textContent)));
  ok('no-3d run: no page errors', s.errors.length === 0, s.errors.slice(0, 5).join(' | '));
  await s.browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
