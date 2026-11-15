// End-to-end interaction flows for the redesigned Tanaw. Usage: node flows.js <index.html> [shotDir]
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

(async () => {
  // SwiftShader gives headless Chrome WebGL for the 3D hand, as a visitor's browser would have.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  // Navigate, then wait for the new page and the end of its transition (clicks do not reach the page during one).
  const go = async (hash, ms = 500) => {
    const before = await page.evaluate(() => window.__routes || 0);
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await page.waitForFunction((n) => (window.__routes || 0) > n && !document.documentElement.dataset.vt, { timeout: 15000 }, before).catch(() => {});
    await wait(Math.max(ms, 900));
  };
  const shot = async (name) => { if (shotDir) await page.screenshot({ path: path.join(shotDir, name + '.png') }); };
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(Tanaw.store.state)));

  await page.goto(base + '#/', { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto('about:blank');
  await page.goto(base + '#/', { waitUntil: 'load' });
  await wait(600);
  // Count rendered routes, so navigation can wait for the new page instead of guessing.
  await page.evaluate(() => { window.__routes = 0; Tanaw.bus.on('route', () => { window.__routes += 1; }); });

  /* ---------- Landing: the horizon (its behaviour is tested in landing.js) ---------- */
  const land = await page.evaluate(() => ({
    h1: document.querySelector('.horizon__title').textContent.replace(/\s+/g, ' ').trim(),
    worlds: [...document.querySelectorAll('.realm__cta')].map((a) => a.getAttribute('href')).join(','),
    second: [...document.querySelectorAll('.nh-worlds a')].map((a) => a.getAttribute('href')).join(','),
    portals: [...document.querySelectorAll('.nh-portals a.portal')].map((a) => a.getAttribute('href')).join(','),
    features: [...document.querySelectorAll('.feature-grid a.feature')].map((a) => a.getAttribute('href')),
    note: /not been validated by Deaf FSL experts/i.test(document.querySelector('.honest-band').textContent),
  }));
  ok('landing: one h1, and an Enter link for each world', /Tanaw/.test(land.h1) && land.worlds === '#/learn,#/community', JSON.stringify(land));
  ok('landing: the second landing links both worlds from its hero and its portals', land.second === '#/learn,#/community' && land.portals === '#/learn,#/community');
  ok('landing: six feature cards, the 3D hand labeled as an unvalidated prototype', land.features.length === 6 && land.features.includes('#/lab') && land.note, land.features.join(' '));
  // Every feature card leads to a page that renders (not the 404 view).
  const deadFeatures = [];
  for (const href of land.features) {
    await go(href, 400);
    if (await page.evaluate(() => document.body.dataset.view === 'notFound')) deadFeatures.push(href);
  }
  ok('landing: every feature card opens a working page', deadFeatures.length === 0, deadFeatures.join(','));
  await go('#/', 600);

  /* ---------- Streak honesty: opening a lesson alone records no activity ---------- */
  await go('#/learn/what-is-fsl', 600);
  let st = await state();
  ok('lesson: opening without interaction records no activity', Object.keys(st.progress.activity).length === 0, JSON.stringify(st.progress.activity));
  await page.click('[data-primary]'); await wait(200);
  st = await state();
  ok('lesson: pressing Continue records activity', Object.values(st.progress.activity).some((d) => d.actions > 0));

  /* ---------- Lesson: re-asked question never moves the bar backwards ---------- */
  await go('#/learn/etiquette', 500);
  await page.click('[data-primary]'); await wait(150);
  const w1 = await page.evaluate(() => parseFloat(document.querySelector('.player__progress-fill').style.width));
  await page.evaluate(() => { const i = [...document.querySelectorAll('.option input')].find((x) => x.value !== '1'); i.click(); });
  await page.click('[data-primary]'); await wait(150); // check (wrong) -> retry queued
  await page.click('[data-primary]'); await wait(200); // continue
  const w2 = await page.evaluate(() => parseFloat(document.querySelector('.player__progress-fill').style.width));
  ok('lesson: progress does not go backwards after a missed question', w2 >= w1, `${w1}% -> ${w2}%`);

  /* ---------- Path: route drawn ---------- */
  await go('#/learn/path', 700);
  const d = await page.evaluate(() => document.querySelector('.route__trail').getAttribute('d') || '');
  ok('path: route line drawn through stops', d.length > 50 && d.startsWith('M'), `${d.length} chars`);
  const barH = await page.evaluate(() => document.querySelector('.isle__progress .bar').getBoundingClientRect().height);
  ok('path: island progress bar is visible', barH >= 8, `height=${barH}`);

  /* ---------- Games ---------- */
  async function playSightlines() {
    await go('#/play/sightlines', 800);
    for (let k = 0; k < 8; k++) {
      const choice = await page.evaluate(() => {
        const q = document.querySelector('.game-q').textContent.trim();
        const it = Tanaw.data.sightlines.find((s) => s.prompt === q);
        const okText = it.options.find((o) => o.ok).text;
        const b = [...document.querySelectorAll('.answer')].find((x) => x.querySelector('.answer__text').textContent.trim() === okText);
        b.click();
        return it.layout;
      });
      await wait(250);
      if (k === 0) await shot('sightlines-solved-' + choice);
      const solved = await page.evaluate(() => document.querySelector('[data-scene]').classList.contains('is-solved'));
      if (!solved) { ok('sightlines: scene responds to the correct choice', false, `round ${k}`); return; }
      await page.click('[data-game-next]'); await wait(250);
    }
  }
  await playSightlines();
  let done = await page.evaluate(() => !!document.querySelector('.complete--game'));
  st = await state();
  ok('sightlines: 8 correct answers -> results with 3 stars', done && st.games.sightlines && st.games.sightlines.best === 8 && st.games.sightlines.stars === 3, JSON.stringify(st.games.sightlines));
  await shot('sightlines-results');

  // Myth or Fact with the keyboard (arrow keys)
  await go('#/play/myth-fact', 800);
  for (let k = 0; k < 10; k++) {
    const kind = await page.evaluate(() => {
      const t = document.querySelector('.mf__text').textContent.trim();
      const m = Tanaw.data.myths.find((x) => x.myth === t || x.fact === t);
      return m.myth === t ? 'myth' : 'fact';
    });
    await page.keyboard.press(kind === 'myth' ? 'ArrowLeft' : 'ArrowRight');
    await wait(120);
    await page.click('[data-game-next]'); await wait(200);
  }
  st = await state();
  ok('myth-fact: playable with arrow keys, perfect score recorded', st.games['myth-fact'] && st.games['myth-fact'].best === 10, JSON.stringify(st.games['myth-fact']));

  // Myth or Fact: swipe gesture answers too ("Play again" from the results screen)
  await page.click('[data-again]'); await wait(500);
  const card = await page.$('[data-card]');
  const cb = await card.boundingBox();
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
  await page.mouse.down();
  await page.mouse.move(cb.x + cb.width / 2 - 160, cb.y + cb.height / 2, { steps: 8 });
  await page.mouse.up();
  await wait(200);
  const swiped = await page.evaluate(() => document.querySelector('[data-card]').classList.contains('is-myth'));
  ok('myth-fact: swiping left answers "Myth"', swiped);

  // Word Lens: find then fix
  await go('#/play/word-lens', 800);
  for (let k = 0; k < 6; k++) {
    await page.evaluate(() => {
      const it = Tanaw.data.wordLens.find((w) => {
        const target = /\[([^\]]+)\]/.exec(w.text)[1];
        return [...document.querySelectorAll('.lens__word')].some((b) => b.textContent.trim() === target);
      });
      const target = /\[([^\]]+)\]/.exec(it.text)[1];
      [...document.querySelectorAll('.lens__word')].find((b) => b.textContent.trim() === target).click();
      window.__fix = it.options[0];
    });
    await wait(120);
    await page.evaluate(() => { [...document.querySelectorAll('.lens__fix .answer')].find((b) => b.querySelector('.answer__text').textContent.trim() === window.__fix).click(); });
    await wait(120);
    if (k === 0) await shot('word-lens-fixed');
    await page.click('[data-game-next]'); await wait(200);
  }
  st = await state();
  ok('word-lens: find + fix all six -> 12/12', st.games['word-lens'] && st.games['word-lens'].best === 12, JSON.stringify(st.games['word-lens']));

  // Rights Match
  await go('#/play/rights-match', 800);
  for (let k = 0; k < 8; k++) {
    await page.evaluate(() => {
      const q = document.querySelector('.game-q').textContent.trim();
      const it = Tanaw.data.rightsMatch.find((r) => r.text === q);
      [...document.querySelectorAll('.answer')].find((b) => b.textContent.includes(`Sec. ${it.sec} ·`)).click();
    });
    await wait(120);
    await page.click('[data-game-next]'); await wait(200);
  }
  st = await state();
  ok('rights-match: all eight situations matched', st.games['rights-match'] && st.games['rights-match'].best === 8, JSON.stringify(st.games['rights-match']));

  // Timeline: sort with the move buttons
  await go('#/play/timeline', 800);
  for (let round = 0; round < 2; round++) {
    for (let guard = 0; guard < 40; guard++) {
      const moved = await page.evaluate(() => {
        const items = [...document.querySelectorAll('.tl__item')];
        const pos = items.map((li) => Number(li.dataset.id));
        for (let i = 0; i < pos.length - 1; i++) {
          if (pos[i] > pos[i + 1]) { items[i].querySelector('[data-move="1"]').click(); return true; }
        }
        return false;
      });
      if (!moved) break;
      await wait(40);
    }
    await page.click('[data-game-next]'); await wait(200); // check
    if (round === 0) await shot('timeline-checked');
    await page.click('[data-game-next]'); await wait(250); // next round / results
  }
  st = await state();
  ok('timeline: both rounds ordered correctly with keyboard-accessible buttons', st.games.timeline && st.games.timeline.best === st.games.timeline.total, JSON.stringify(st.games.timeline));

  // Five Parts with number keys
  await go('#/play/five-parts', 800);
  for (let k = 0; k < 10; k++) {
    const key = await page.evaluate(() => {
      const t = document.querySelector('.fp__clue').textContent.replace(/[“”]/g, '').trim();
      const c = Tanaw.data.fiveParts.clues.find((x) => x.text === t);
      return String(c.bin + 1);
    });
    await page.keyboard.press(key);
    await wait(80);
    const btn = await page.$('[data-game-next]:not([hidden])');
    if (btn) { await btn.click(); }
    await wait(250);
  }
  await wait(1300);
  st = await state();
  ok('five-parts: number keys answer, 10/10 recorded', st.games['five-parts'] && st.games['five-parts'].best === 10, JSON.stringify(st.games['five-parts']));

  ok('achievements: Playful learner + Three stars earned', st.progress.badges['games-3'] && st.progress.badges['three-stars']);
  const daily = await page.evaluate(() => Tanaw.progress.dailyDone());
  ok('daily challenge completed (all games played today)', daily === true);

  /* ---------- Community exhibits ---------- */
  await go('#/community/identity', 700);
  await page.focus('#facet-t0');
  await page.keyboard.press('ArrowDown'); await wait(150);
  const facet = await page.evaluate(() => ({ sel: document.querySelector('#facet-t1').getAttribute('aria-selected'), ray: document.querySelector('[data-ray="1"]').classList.contains('is-on'), panel: !document.querySelector('#facet-p1').hidden }));
  ok('identity: arrow keys move between facets and the matching ray glows', facet.sel === 'true' && facet.ray && facet.panel, JSON.stringify(facet));
  await page.evaluate(() => document.querySelector('[data-flip-myth]').click()); await wait(100);
  const flipped = await page.evaluate(() => !document.querySelector('.myth__face--back').hidden);
  ok('identity: myth card reveals the fact', flipped);
  await page.evaluate(() => document.querySelector('[data-exhibit-end]').scrollIntoView()); await wait(1700);
  st = await state();
  ok('identity: reaching the end (with dwell) marks the exhibit explored', !!st.explore['exhibit:identity']);
  ok('achievement: first Deaf Community exhibit earns "Bisita"', !!st.progress.badges['first-exhibit']);

  await go('#/community/history', 400);
  st = await state();
  ok('history: merely loading the page credits no stops', !Object.keys(st.explore).some((k) => k.startsWith('history:')));
  await wait(1900);
  st = await state();
  const visited = Object.keys(st.explore).filter((k) => k.startsWith('history:')).length;
  ok('history: stops in view for a moment are marked visited', visited >= 1, `${visited} visited`);
  const s0 = await page.evaluate(() => document.querySelector('[data-status]').textContent);
  await page.click('[data-next]'); await wait(700);
  const s1 = await page.evaluate(() => document.querySelector('[data-status]').textContent);
  ok('history: Next button sails to the next stop', s0 !== s1 && /Stop 2/.test(s1), `${s0} -> ${s1}`);
  await page.evaluate(() => document.querySelector('[data-list]').click()); await wait(200);
  const asList = await page.evaluate(() => document.querySelector('[data-voyage]').classList.contains('voyage--list'));
  ok('history: list mode toggle', asList);

  await go('#/community/rights', 500);
  const places = await page.$$('.place');
  for (const p of places) { await p.click(); await wait(60); }
  st = await state();
  const panel = await page.evaluate(() => ({
    expanded: document.querySelector('.place[data-sec="11"]').getAttribute('aria-expanded'),
    others: [...document.querySelectorAll('.place[aria-expanded="true"]')].length,
    title: (document.querySelector('.town__sec') || {}).textContent || '',
  }));
  ok('rights: the chosen place opens its section in the panel', panel.expanded === 'true' && panel.others === 1 && /Section 11/.test(panel.title), JSON.stringify(panel));
  ok('rights: all nine explored + badge', Object.keys(st.explore).filter((k) => k.startsWith('rights:')).length === 9 && !!st.progress.badges['rights-all']);

  await go('#/community/calendar', 500);
  await page.evaluate(() => document.querySelector('[data-ics]').click()); await wait(200);
  st = await state();
  ok('calendar: .ics download records "Save the date"', !!st.explore['calendar:saved'] && !!st.progress.badges.calendar);
  const ics = await page.evaluate(() => {
    const n = Tanaw.components.nextObservances()[0];
    return { name: n.o.name, days: n.days };
  });
  ok('calendar: next observance computed', !!ics.name, `${ics.name} in ${ics.days} days`);

  await go('#/community/stories', 500);
  const storyHub = await page.evaluate(() => ({ hash: window.location.hash, cards: document.querySelectorAll('.story-card').length }));
  ok('stories: the exhibit opens with one card per story', storyHub.hash === '#/community/stories' && storyHub.cards === 6, JSON.stringify(storyHub));

  /* ---------- Scenes ---------- */
  await go('#/scenes/clinic', 700);
  await page.evaluate(() => document.querySelector('[data-phrase] [data-show]').click()); await wait(300);
  const big = await page.evaluate(() => !!document.querySelector('dialog.bigtext[open]'));
  ok('scene: "Show" opens the full-screen text display', big);
  await page.keyboard.press('Escape'); await wait(200);
  await page.evaluate(() => document.querySelector('[data-quickview]').click()); await wait(300);
  const qv = await page.evaluate(() => (document.querySelector('dialog[open] [data-learned]') && !document.querySelector('dialog[open] .placeholder') ? 'word card' : 'other'));
  ok('scene: a word opens its word card (no media, "I can sign this")', qv === 'word card');
  await page.keyboard.press('Escape'); await wait(200);
  await page.evaluate(() => document.querySelector('[data-scene-end]').scrollIntoView()); await wait(1600);
  st = await state();
  ok('scene: explored after reaching the end', !!st.explore['scene:clinic']);

  /* ---------- Journey ---------- */
  await go('#/journey', 700);
  const lit = await page.evaluate(() => document.querySelectorAll('.sky__star.is-lit').length);
  const lines = await page.evaluate(() => document.querySelectorAll('.sky__line').length);
  ok('journey: constellation lights earned stars and links them', lit >= 5 && lines >= 3, `${lit} lit, ${lines} lines`);
  await shot('journey');

  /* ---------- Security: SVG refused by the media pipeline ---------- */
  const svgRes = await page.evaluate(async () => {
    try {
      await Tanaw.media.save('thank-you', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), {}, 'local');
      return 'saved';
    } catch (e) { return 'refused: ' + e.message; }
  });
  ok('security: SVG image refused by the media pipeline', /refused: Please choose a video or image/.test(svgRes), svgRes);
  const png = await page.evaluate(() => Tanaw.media.kindFor('image/png') === 'image' && Tanaw.media.kindFor('video/webm;codecs=vp9') === 'video');
  ok('security: raster images and videos still accepted', png);

  /* ---------- Legacy routes ---------- */
  await go('#/culture?s=sources', 700);
  let h = await page.evaluate(() => window.location.hash);
  ok('legacy: #/culture?s=sources -> Connect sources', h === '#/community/connect?s=sources', h);
  await go('#/progress', 600);
  h = await page.evaluate(() => window.location.hash);
  ok('legacy: #/progress -> #/journey', h === '#/journey', h);

  /* ---------- Settings: reduced motion disables effects ---------- */
  await go('#/play', 600);
  // Same page both times: the setting has to apply without a reload.
  const tiltOn = async () => {
    const cardBox = await (await page.$('.game-card')).boundingBox();
    await page.mouse.move(cardBox.x + 20, cardBox.y + 20);
    await page.mouse.move(cardBox.x + cardBox.width * 0.7, cardBox.y + cardBox.height * 0.6, { steps: 4 });
    await wait(150);
    const on = await page.evaluate(() => !!document.querySelector('.game-card.is-tilting'));
    await page.mouse.move(2, 2);
    return on;
  };
  await page.evaluate(() => Tanaw.settings.set('motion', 'full'));
  const tiltFull = await tiltOn();
  await page.evaluate(() => Tanaw.settings.set('motion', 'reduce'));
  const tiltReduced = await tiltOn();
  ok('motion: cards tilt under the pointer, and stop tilting with reduced motion', tiltFull && !tiltReduced, `full=${tiltFull} reduce=${tiltReduced}`);
  // Count the view transitions a navigation starts: none with reduced motion.
  const transitions = await page.evaluate(async () => {
    const real = document.startViewTransition;
    if (!real) return 0;
    let n = 0;
    document.startViewTransition = function (cb) { n += 1; return real.call(this, cb); };
    location.hash = '#/learn';
    await new Promise((r) => setTimeout(r, 1500));
    document.startViewTransition = real;
    return n;
  });
  ok('reduced motion: page transitions are off', transitions === 0, `transitions started: ${transitions}`);

  ok('no page errors during all flows', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
