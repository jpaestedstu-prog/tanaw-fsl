// Flows for this build: no vocabulary demonstrations (T.config.demonstrations === false),
// with the experimental 3D hand and Stories switched on (their own flows are in features.js).
// Usage: node nodemos.js <index.html> [shotDir]
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const shotDir = process.argv[3];
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, cond, detail = '') => { results.push({ name, pass: !!cond, detail }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

(async () => {
  // SwiftShader gives headless Chrome WebGL, as a visitor's browser would have.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const go = async (hash, ms = 900) => {
    const before = await page.evaluate(() => window.__routes || 0);
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await page.waitForFunction((n) => (window.__routes || 0) > n && !document.documentElement.dataset.vt, { timeout: 15000 }, before).catch(() => {});
    await wait(Math.max(ms, 900));
  };
  const shot = async (name) => { if (shotDir) await page.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: false }); };
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(Tanaw.store.state)));
  const text = () => page.evaluate(() => document.querySelector('main').innerText);

  await page.goto(base + '#/', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('about:blank');
  await page.goto(base + '#/', { waitUntil: 'load' });
  await wait(700);
  // Count rendered routes, so navigation can wait for the new page instead of guessing.
  await page.evaluate(() => { window.__routes = 0; Tanaw.bus.on('route', () => { window.__routes += 1; }); });

  ok('config: no vocabulary demonstrations; 3D hand and Stories on', await page.evaluate(() => Tanaw.config.demonstrations === false && Tanaw.config.hand3d === true && Tanaw.config.stories === true));

  /* ---------- Wording sweep: nothing promises or hints at demonstrations ---------- */
  const routes = ['#/', '#/learn', '#/learn/path', '#/play', '#/scenes', '#/scenes/clinic', '#/library', '#/sign/thank-you', '#/sign/letter-a',
    '#/practice', '#/practice/mirror', '#/practice/mirror?sign=thank-you', '#/practice/review', '#/practice/quiz', '#/practice/fingerspell?text=Cebu',
    '#/community', '#/community/identity', '#/community/stories', '#/community/stories/fsl-act', '#/community/history', '#/community/rights', '#/community/connect',
    '#/lab', '#/play/read-hand', '#/journey', '#/studio', '#/about'];
  const banned = /placeholder|awaiting (a deaf signer|verification)|unlock|has demonstrations|see its demonstration|Sign Library|Contributor Studio/i;
  const mentions = [];
  for (const r of routes) {
    await go(r, 900);
    const t = await text();
    const bad = t.split(/\n+/).filter((line) => banned.test(line));
    if (bad.length) mentions.push(`${r}: ${bad.slice(0, 2).join(' / ')}`);
  }
  ok('wording: no placeholder / unlock / awaiting-verification text on any page', mentions.length === 0, mentions.join(' || '));
  const demoLines = [];
  for (const r of routes) {
    await go(r, 900);
    const t = await text();
    t.split(/\n+/).filter((line) => /demonstration/i.test(line)).forEach((line) => demoLines.push(`${r}: ${line.trim().slice(0, 140)}`));
  }
  console.log(`\n  Lines that mention "demonstration" (expected only where Tanaw states its policy on whole-sign demonstrations):\n    ${demoLines.join('\n    ')}\n`);

  /* ---------- Vocabulary ---------- */
  await go('#/library', 900);
  const lib = await page.evaluate(() => ({
    h1: document.querySelector('h1').textContent.trim(),
    tiles: document.querySelectorAll('a.sign-tile').length,
    statusBadges: document.querySelectorAll('.sign-tile .sign-tile__status').length,
    filters: [...document.querySelectorAll('input[name="lib-status"]')].map((i) => i.value).join(','),
  }));
  ok('vocabulary: word list with progress filter and no status badges', /vocabulary/i.test(lib.h1) && lib.tiles > 50 && lib.statusBadges === 0 && lib.filters === 'all,learned,todo', JSON.stringify(lib));
  await shot('vocabulary');

  /* ---------- Word card (quick view from a scene) ---------- */
  await go('#/scenes/clinic', 900);
  const sceneId = await page.evaluate(() => document.querySelector('#layer-words [data-quickview]').dataset.quickview);
  await page.evaluate(() => document.querySelector('#layer-words [data-quickview]').click());
  await wait(400);
  const card = await page.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    return d && { word: !!d.querySelector('.learn-note'), check: !!d.querySelector('[data-learned]'), media: !!d.querySelector('.placeholder, video, img') };
  });
  ok('word card: "I can sign this" and a learn-from-a-teacher note, no media', card && card.word && card.check && !card.media, JSON.stringify(card));
  await page.evaluate(() => document.querySelector('dialog[open] [data-learned]').click());
  await wait(150);
  await page.keyboard.press('Escape');
  await wait(400);
  let st = await state();
  const tileLearned = await page.evaluate((id) => document.querySelector(`#layer-words [data-quickview="${id}"]`).classList.contains('is-learned'), sceneId);
  ok('word card: ticking marks the word learned and the scene tile updates', st.progress.selfcheck[sceneId] === true && tileLearned, `${sceneId} tile=${tileLearned}`);
  await go(`#/library?status=learned`, 900);
  const learnedTiles = await page.evaluate(() => [...document.querySelectorAll('a.sign-tile')].map((a) => decodeURIComponent(a.getAttribute('href').split('/').pop())));
  ok('vocabulary: the "Learned" filter lists exactly the learned words', learnedTiles.length === 1 && learnedTiles[0] === sceneId, learnedTiles.join(','));

  /* ---------- Word page ---------- */
  await go('#/sign/good-morning', 900);
  const word = await page.evaluate(() => ({ note: !!document.querySelector('.learn-note'), check: !!document.querySelector('.word-progress [data-learned]'), media: !!document.querySelector('main .placeholder, main video') }));
  ok('word page: learn-from-a-teacher note, progress card, no media', word.note && word.check && !word.media, JSON.stringify(word));
  await page.evaluate(() => document.querySelector('.word-progress [data-learned]').click()); await wait(150);
  await page.evaluate(() => document.querySelector('[data-deck]').click()); await wait(150);
  st = await state();
  ok('word page: "I can sign this" and "Add to review deck" both save', st.progress.selfcheck['good-morning'] === true && st.srs.added['good-morning'] === true);
  await shot('word-page');

  /* ---------- Lesson vocabulary step + self-check ---------- */
  await go('#/learn/greetings', 900);
  for (let i = 0; i < 6; i++) {
    const kind = await page.evaluate(() => (document.querySelector('[data-gallery]') ? 'gallery' : document.querySelector('.step--signcheck, [data-selfcheck]') ? 'check' : 'other'));
    if (kind === 'gallery') break;
    await page.evaluate(() => { const b = document.querySelector('[data-primary]'); if (b) b.click(); });
    await wait(350);
  }
  const gal = await page.evaluate(() => ({ gallery: !!document.querySelector('[data-gallery]'), summary: !!document.querySelector('.media-summary'), lead: (document.querySelector('.step__lead') || {}).textContent || '' }));
  ok('lesson: vocabulary step has no media summary and a teacher-led intro', gal.gallery && !gal.summary && /teacher/i.test(gal.lead), JSON.stringify(gal));
  const firstId = await page.evaluate(() => document.querySelector('[data-gallery] [data-quickview]:not(.is-learned)').dataset.quickview);
  await page.evaluate((id) => document.querySelector(`[data-gallery] [data-quickview="${id}"]`).click(), firstId); await wait(350);
  await page.evaluate(() => document.querySelector('dialog[open] [data-learned]').click()); await wait(120);
  await page.keyboard.press('Escape'); await wait(400);
  const galLearned = await page.evaluate((id) => document.querySelector(`[data-gallery] [data-quickview="${id}"]`).classList.contains('is-learned'), firstId);
  ok('lesson: marking a word learned from the gallery updates its tile', galLearned, firstId);
  await page.evaluate(() => document.querySelector('[data-primary]').click()); await wait(400);
  const sc = await page.evaluate(() => ({ text: document.querySelector('main').innerText, locked: /Recognition quiz locked/.test(document.querySelector('main').innerText) }));
  ok('lesson: self-check step shows no "quiz locked" notice', /Self-check/.test(sc.text) && !sc.locked);

  /* ---------- Practice tools ---------- */
  await go('#/practice/mirror?sign=thank-you', 900);
  const mir = await page.evaluate(() => ({ word: (document.querySelector('.mirror__word-en') || {}).textContent, media: !!document.querySelector('.mirror__ref .placeholder, .mirror__ref video'), title: document.querySelector('#ref-title').textContent.trim() }));
  ok('mirror: shows the word to practice, no media, retitled panel', mir.word === 'Thank you' && !mir.media && /practicing/i.test(mir.title), JSON.stringify(mir));
  await shot('mirror');

  await go('#/practice/fingerspell?text=Cebu', 1500);
  const fs1 = await page.evaluate(() => ({ drill: !!document.querySelector('#drill-title'), plain: document.querySelectorAll('.fs-tile.is-plain').length, pending: document.querySelectorAll('.fs-tile.is-pending').length, labels: [...document.querySelectorAll('.fs-tile')].map((b) => b.getAttribute('aria-label')).join(',') }));
  ok('fingerspelling: 3D reading drill, plain tiles, plain labels', fs1.drill && fs1.plain === 4 && fs1.pending === 0 && fs1.labels === 'C,E,B,U', JSON.stringify(fs1));
  await page.click('[data-next]'); await wait(300);
  const stage = await page.evaluate(() => { const st = document.querySelector('.fs-player [data-stage3d]'); return st.querySelector('[data-hud-kind]').textContent.trim() + ' ' + st.querySelector('[data-hud-name]').textContent.trim(); });
  ok('fingerspelling: the 3D stage shows the letter and its position', stage === 'Letter 1 of 4 C', stage);

  await go('#/practice/quiz', 900);
  const quiz = await page.evaluate(() => ({ concept: !!document.querySelector('a[href="#/practice/quiz?mode=concepts"]'), select: !!document.querySelector('#quiz-cat'), studio: !!document.querySelector('main a[href="#/studio"]') }));
  ok('quiz: concept quiz offered, no sign-recognition form', quiz.concept && !quiz.select && !quiz.studio, JSON.stringify(quiz));
  await go('#/practice/quiz?mode=signs', 900);
  const qs = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent.trim(), runner: !!document.querySelector('.player, .runner') }));
  ok('quiz: ?mode=signs falls back to the quiz menu', qs.h1 === 'Quiz' && !qs.runner, JSON.stringify(qs));

  await go('#/practice/review', 900);
  const decks = await page.evaluate(() => [...document.querySelectorAll('.deck-card__title')].map((h) => h.textContent.trim()));
  ok('review: decks are Concepts and Vocabulary', decks.join('|') === 'Concepts|Vocabulary', decks.join('|'));
  await page.evaluate(() => document.querySelector('[data-start="signs"]').click()); await wait(400);
  const fc = await page.evaluate(() => ({ kind: document.querySelector('.flashcard__kind').textContent.trim(), prompt: document.querySelector('.flashcard__prompt').textContent.trim() }));
  await page.keyboard.press('Space'); await wait(250);
  const back = await page.evaluate(() => ({ media: !!document.querySelector('.flashcard__back .placeholder, .flashcard__back video'), text: document.querySelector('.flashcard__back').innerText }));
  ok('review: vocabulary card asks for the sign and its back has no media', /^Word/.test(fc.kind) && /How do you sign/.test(fc.prompt) && !back.media && /teacher/.test(back.text), JSON.stringify({ fc, back }));
  await page.keyboard.press('3'); await wait(250);

  await go('#/play', 900);
  ok('play: no "waiting for demonstrations" section', await page.evaluate(() => !document.querySelector('.locked')));
  await go('#/scenes/store', 900);
  ok('scenes: words layer has no media summary', await page.evaluate(() => !!document.querySelector('#layer-words') && !document.querySelector('.media-summary')));
  await go('#/practice', 900);
  const hub = await text();
  ok('practice hub: cards describe the tools without demonstrations', /teacher/i.test(hub) && !/next to a demonstration|have demonstrations/i.test(hub));

  /* ---------- Class vocabulary (studio) ---------- */
  await go('#/studio', 900);
  const studio = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent.trim(), title: document.title, attach: !!document.querySelector('[data-attach-form]'), media: !!document.querySelector('#pk-media'), test: !!document.querySelector('[data-test-gen]') }));
  ok('studio: shown as "Class vocabulary" without media tools', studio.h1 === 'Class vocabulary' && /^Class vocabulary/.test(studio.title) && !studio.attach && !studio.media && !studio.test, JSON.stringify(studio));
  await page.type('#cu-en', 'Barangay hall');
  await page.type('#cu-fil', 'Bulwagang pambarangay');
  await page.evaluate(() => document.querySelector('[data-custom-form] [type="submit"]').click()); await wait(300);
  st = await state();
  ok('studio: adding a word saves it and lists it', st.custom.length === 1 && await page.evaluate(() => /Barangay hall/.test(document.querySelector('[data-custom-list]').innerText)));
  // Import a pack that also carries media: only the words come in.
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pack = { format: 'tanaw-class-pack', version: 1, title: 'Test pack', author: 'Harness', custom: [{ id: 'custom-jeep-stop-ab12', en: 'Jeepney stop', fil: 'Babaan', note: '' }], media: [{ signId: 'thank-you', kind: 'image', mime: 'image/png', meta: {}, data: png }] };
  const packFile = path.join(os.tmpdir(), `tanaw-test-${Date.now()}.tanawpack.json`);
  fs.writeFileSync(packFile, JSON.stringify(pack));
  const input = await page.$('[data-pack-import]');
  await input.uploadFile(packFile);
  await wait(500);
  const confirmMsg = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); return d ? d.innerText : ''; });
  await page.evaluate(() => { const b = [...document.querySelectorAll('dialog[open] button')].find((x) => /Import/.test(x.textContent)); if (b) b.click(); });
  await wait(600);
  st = await state();
  const mediaCount = await page.evaluate(() => Tanaw.media.list().length);
  ok('studio: importing a pack brings words only and says media is skipped', st.custom.length === 2 && mediaCount === 0 && /will not be imported/.test(confirmMsg), `custom=${st.custom.length} media=${mediaCount} msg=${confirmMsg.replace(/\s+/g, ' ').slice(0, 160)}`);
  fs.unlinkSync(packFile);
  await shot('studio');

  /* ---------- About ---------- */
  await go('#/about', 900);
  const about = await page.evaluate(() => {
    const sec = document.querySelector('[aria-labelledby="h-hand"]');
    return sec && { items: sec.querySelectorAll('.planned-item').length, links: [...sec.querySelectorAll('.planned-item__source a')].map((a) => a.href), badge: !!sec.querySelector('.exp-badge'), status: document.querySelector('[aria-labelledby="h-status"]').innerText };
  });
  ok('about: the 3D hand section, labeled experimental, with linked sources', about && about.items === 4 && about.badge && ['aclanthology', 'wfdeaf', 'verafiles'].every((d) => about.links.some((u) => u.includes(d))), JSON.stringify(about && { items: about.items, links: about.links }));
  ok('about: the status table says the 3D hand is experimental and not validated', about && /Experimental, not validated/.test(about.status) && /not reviewed/i.test(about.status));

  /* ---------- Stories ---------- */
  await go('#/community', 900);
  const storyLinks = await page.evaluate(() => document.querySelectorAll('main a[href="#/community/stories"]').length);
  await go('#/community/stories', 900);
  const sh = await page.evaluate(() => ({ hash: window.location.hash, sources: /Not reviewed by Deaf organizations/.test(document.querySelector('main').innerText) }));
  ok('stories: linked from the community hub; the exhibit opens and states its sources and status', storyLinks > 0 && sh.hash === '#/community/stories' && sh.sources, JSON.stringify({ storyLinks, ...sh }));

  /* ---------- Timeline data ---------- */
  const tl = await page.evaluate(() => ({ all: Tanaw.data.timeline.length, game: Tanaw.data.timeline.filter((t) => !t.future && !t.approx).length, srcMissing: Tanaw.data.timeline.filter((t) => t.src && !Tanaw.data.getSource(t.src)).map((t) => t.year) }));
  ok('timeline: game uses 10 exactly dated stops; every source id resolves', tl.game === 10 && tl.srcMissing.length === 0, JSON.stringify(tl));

  ok('no page errors during these flows', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
