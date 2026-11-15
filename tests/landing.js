// The start page's two landings, in order. Most of this is the split-screen landing: its concept and
// how it behaves, with a real pointer and keyboard. The 3D hand itself is tested in features.js.
// Usage: node landing.js <index.html>
const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, cond, detail = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

(async () => {
  // No forced software GPU here: it would only make every frame slow enough to skew timing.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const errors = [];
  const newPage = async (w, h, opts = {}) => {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
    await page.setViewport({ width: w, height: h, hasTouch: !!opts.touch, isMobile: !!opts.touch });
    await page.evaluateOnNewDocument((skipIntro, settings) => {
      try {
        if (skipIntro) sessionStorage.setItem('tanaw.intro', '1');
        if (settings) { const s = JSON.parse(localStorage.getItem('tanaw.state.v1') || '{}'); s.settings = Object.assign({}, s.settings, settings); localStorage.setItem('tanaw.state.v1', JSON.stringify(s)); }
      } catch (e) { /* ignore */ }
    }, opts.intro !== true, opts.settings || null);
    await page.goto(base + '#/', { waitUntil: 'load' });
    await wait(opts.wait || 900);
    return page;
  };
  const seamOf = (p) => p.evaluate(() => Number(getComputedStyle(document.querySelector('[data-split]')).getPropertyValue('--seam')));
  const backHome = async (p) => { await p.evaluate(() => { location.hash = '#/'; }); await wait(1300); };

  /* ---------- The concept ---------- */
  let p = await newPage(1366, 768);
  const concept = await p.evaluate(() => {
    const learn = document.querySelector('.realm--learn').getBoundingClientRect();
    const seam = document.querySelector('.seam').getBoundingClientRect();
    return {
      h1: document.querySelectorAll('h1').length,
      title: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
      worlds: [...document.querySelectorAll('.realm__title')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()),
      capiz: !!document.querySelector('.realm--learn .realm__lattice'),
      weave: !!document.querySelector('.realm--community .realm__weave'),
      gathering: !!document.querySelector('.realm--community .realm__gathering svg'),
      eye: !!document.querySelector('.seam .seam-eye'),
      seamX: Math.round(seam.left),
      canvases: document.querySelectorAll('.horizon canvas').length,
      learnRight: Math.round(learn.right),
    };
  });
  ok('concept: one h1, the two named worlds', concept.h1 === 1 && /^Tanaw/.test(concept.title) && concept.worlds.join('|') === 'Awareness & Learning|Deaf Community', JSON.stringify(concept.worlds));
  ok('concept: capiz light, banig weave and people around the mat', concept.capiz && concept.weave && concept.gathering);
  ok('concept: Tanaw\'s eye on a seam in the middle', concept.eye && Math.abs(concept.seamX - 683) <= 2, `seam at x=${concept.seamX}`);
  ok('concept: the split screen itself has no 3D hand', concept.canvases === 0);
  // Compared with the glyphs' own boxes, since a heading's box is wider than its words.
  const collisions = () => p.evaluate(() => {
    const overlap = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    const words = (s) => [...document.querySelectorAll(s)].flatMap((e) => { const r = document.createRange(); r.selectNodeContents(e); return [...r.getClientRects()]; });
    const boxes = (s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect());
    const people = boxes('.realm__gathering .g-person');
    const rightText = words('.realm--community .realm__eyebrow, .realm--community .realm__title, .realm--community .realm__lead');
    const orbs = boxes('.realm__orbs .orb span');
    const leftText = words('.realm--learn .realm__eyebrow, .realm--learn .realm__title');
    return { people: people.some((a) => rightText.some((r) => overlap(a, r))), orbs: orbs.some((o) => leftText.some((r) => overlap(o, r))) };
  });
  const clear = await collisions();
  ok('layout: the people and the sign parts stay clear of the words (the original overlapped)', !clear.people && !clear.orbs, JSON.stringify(clear));

  /* ---------- Beads: the scenes where the worlds meet ---------- */
  const beads = await p.evaluate(() => [...document.querySelectorAll('.bead')].map((a) => a.getAttribute('href')));
  const scenes = await p.evaluate(() => Tanaw.data.scenes.map((s) => `#/scenes/${s.id}`));
  ok('beads: every everyday scene sits on the seam', beads.join() === scenes.join(), `${beads.length} beads`);
  const names = await p.evaluate(() => { const a = document.querySelector('.bead[href="#/scenes/clinic"]'); return { name: a.textContent.replace(/\s+/g, ' ').trim(), side: a.querySelector('.bead__side--community').textContent }; });
  ok('beads: each names its scene and what it draws from both worlds, from the site\'s data', /At the clinic/.test(names.name) && /RA 11106 Sec\. 8/.test(names.side), names.name);
  await p.mouse.move(683, 300, { steps: 3 }); await wait(500);
  const near = await seamOf(p);
  ok('beads: the seam holds still near the middle, so they are easy to reach', Math.abs(near - 0.5) < 0.01, `seam=${near}`);
  const bp = await p.evaluate(() => { const r = document.querySelectorAll('.bead')[1].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(bp.x, bp.y, { steps: 3 }); await wait(400);
  const shown = await p.evaluate(() => getComputedStyle(document.querySelectorAll('.bead__card')[1]).opacity);
  ok('beads: hovering shows the card', Number(shown) > 0.9, `opacity=${shown}`);
  await p.focus('.bead'); await p.keyboard.press('Escape'); await wait(250);
  ok('beads: Escape dismisses the card (WCAG 1.4.13)', await p.evaluate(() => document.querySelector('[data-split]').classList.contains('is-card-dismissed')));
  await p.evaluate(() => document.activeElement.blur());

  /* ---------- Looking toward a world opens it ---------- */
  await p.mouse.move(120, 500, { steps: 5 }); await wait(1000);
  const leftSeam = await seamOf(p);
  ok('lean: pointer in Learning widens it', leftSeam > 0.55, `seam=${leftSeam}`);
  ok('lean: the world link in the header lights up too', await p.evaluate(() => document.querySelector('.worlds__link--learn').classList.contains('is-looked')));
  const look = await p.evaluate(() => document.querySelector('.seam-eye .eye__look').style.transform);
  ok('lean: the eye looks toward the pointer', /translate\(-/.test(look), look);
  await p.mouse.move(1250, 500, { steps: 8 }); await wait(1000);
  const rightSeam = await seamOf(p);
  ok('lean: pointer in Community widens it', rightSeam < 0.45, `seam=${rightSeam}`);
  const fit = await p.evaluate(() => {
    const seam = document.querySelector('.seam').getBoundingClientRect().left;
    const pad = (r) => Math.round(r.right);
    return { left: Math.max(...[...document.querySelectorAll('.realm--learn .realm__title, .realm--learn .realm__lead, .realm--learn .realm__station')].map((e) => pad(e.getBoundingClientRect()))), seam: Math.round(seam) };
  });
  ok('lean: the narrower world\'s words stay readable, never cut by the seam', fit.left <= fit.seam, JSON.stringify(fit));
  const art = await p.evaluate(() => { const r = document.querySelector('.realm__gathering').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 - r.height * 0.4 }; });
  await p.mouse.move(art.x, art.y, { steps: 4 }); await wait(500);
  const turn = await p.evaluate(() => { const on = document.querySelector('.g-lines.is-turn'); return on ? { i: on.getAttribute('class'), opacity: getComputedStyle(on).opacity, others: getComputedStyle(document.querySelector('.g-lines:not(.is-turn)')).opacity } : null; });
  ok('people: the person nearest the pointer takes the turn, and the sightlines meet there', turn && Number(turn.opacity) > 0.9 && Number(turn.others) < 0.1, JSON.stringify(turn));

  /* ---------- Dragging the eye ---------- */
  await p.mouse.move(683, 300, { steps: 4 }); await wait(800);
  const eyeAt = () => p.evaluate(() => { const r = document.querySelector('[data-seam-grip] svg').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  let g = await eyeAt();
  await p.mouse.move(g.x, g.y); await wait(200);
  await p.mouse.down();
  await p.mouse.move(g.x + 240, g.y, { steps: 8 }); await wait(400);
  const dragged = await seamOf(p);
  ok('drag: the seam follows the eye', dragged > 0.62, `seam=${dragged}`);
  await p.mouse.up(); await wait(1200);
  const released = await seamOf(p);
  ok('drag: released part way, it springs back', Math.abs(released - 0.5) < 0.02 && (await p.evaluate(() => document.body.dataset.view)) === 'home', `seam=${released}`);
  g = await eyeAt();
  await p.mouse.move(g.x, g.y); await p.mouse.down();
  await p.mouse.move(1320, g.y, { steps: 8 }); await wait(150);
  await p.mouse.up(); await wait(1500);
  ok('drag: pulled all the way, it enters that world', (await p.evaluate(() => location.hash)) === '#/learn');
  await backHome(p);
  ok('return: the seam is back in the middle', Math.abs((await seamOf(p)) - 0.5) < 0.001);

  /* ---------- Entering ---------- */
  await p.click('.realm--community .realm__cta');
  await wait(180);
  const mid = await p.evaluate(() => ({ entering: document.querySelector('[data-split]') ? document.querySelector('[data-split]').dataset.entering : '', seam: document.querySelector('[data-split]') ? Number(getComputedStyle(document.querySelector('[data-split]')).getPropertyValue('--seam')) : -1 }));
  ok('enter: the chosen world opens across the screen first', mid.entering === 'community' && mid.seam < 0.5, JSON.stringify(mid));
  await wait(1300);
  ok('enter: then its page arrives', (await p.evaluate(() => location.hash)) === '#/community');
  await backHome(p);
  await p.mouse.move(1150, 110, { steps: 3 }); await wait(300);
  await p.mouse.click(1150, 110); await wait(1500);
  ok('enter: a click on empty space in a world enters it', (await p.evaluate(() => location.hash)) === '#/community');
  await backHome(p);
  const pill = await p.evaluate(() => { const r = document.querySelector('.realm__station[href="#/lab"]').getBoundingClientRect(); return { x: r.left + 8, y: r.top + r.height / 2 }; });
  await p.mouse.click(pill.x, pill.y); await wait(1600);
  ok('enter: a station goes straight to its own page', /^#\/lab/.test(await p.evaluate(() => location.hash)));
  await backHome(p);
  await p.evaluate(() => { const a = document.querySelector('.bead[href="#/scenes/store"]'); a.click(); }); await wait(900);
  ok('enter: a bead opens its scene', (await p.evaluate(() => location.hash)) === '#/scenes/store');
  await backHome(p);

  /* ---------- Keyboard ---------- */
  await p.mouse.move(2, 2);
  const order = await p.evaluate(() => [...document.querySelectorAll('.horizon a')].map((a) => a.getAttribute('href')));
  ok('keyboard: Learning, then the seam, then Community', order[0] === '#/learn' && order.indexOf('#/scenes/clinic') > order.indexOf('#/bridge') && order.indexOf('#/community') > order.indexOf('#/scenes/emergency'), `${order.length} links`);
  await p.focus('.realm--learn .realm__cta'); await wait(800);
  ok('keyboard: focus in a world leans toward it', (await seamOf(p)) > 0.55);
  await p.focus('.realm--community .realm__cta'); await wait(800);
  ok('keyboard: and to the other', (await seamOf(p)) < 0.45);
  await p.keyboard.press('Enter'); await wait(1500);
  ok('keyboard: Enter enters the world', (await p.evaluate(() => location.hash)) === '#/community');
  const focused = await p.evaluate(() => document.activeElement.tagName);
  ok('keyboard: focus lands on the new page\'s heading', focused === 'H1', focused);
  await p.close();

  /* ---------- The order: the split screen first, the 3D sign language landing second ---------- */
  p = await newPage(1366, 768);
  const stack = await p.evaluate(() => {
    const parts = [...document.querySelector('.landing').children];
    return {
      first: parts[0].classList.contains('horizon'),
      second: parts[1].classList.contains('nh-hero'),
      third: parts[2].classList.contains('nh-portals'),
      touching: Math.round(parts[1].getBoundingClientRect().top - parts[0].getBoundingClientRect().bottom),
      h1: document.querySelectorAll('h1').length,
      h1First: !!document.querySelector('.horizon h1'),
      heading: document.querySelector('.nh-hero h2.nh-title').textContent.replace(/\s+/g, ' ').trim(),
      badge: !!document.querySelector('.nh-hero .exp-badge'),
      note: /Not validated by Deaf FSL experts/.test(document.querySelector('.nh-stage-note').textContent),
      links: [...document.querySelectorAll('.nh-worlds a, .nh-portals a.portal')].map((a) => a.getAttribute('href')).join(),
    };
  });
  ok('order: the split screen, then the 3D landing right after it, then its portals', stack.first && stack.second && stack.third && stack.touching === 0, JSON.stringify(stack));
  ok('order: one h1 on the page, on the first landing; the second has its own heading', stack.h1 === 1 && stack.h1First && stack.heading === 'Tanaw See sign language take shape.', stack.heading);
  ok('second landing: the hand is labeled experimental and not validated', stack.badge && stack.note);
  ok('second landing: both worlds are linked from its hero and its portals', stack.links === '#/learn,#/community,#/learn,#/community', stack.links);
  await p.focus('.realm__station[href="#/community/connect"]');
  await p.keyboard.press('Tab');
  ok('keyboard: after the split screen, the next stop is the second landing', (await p.evaluate(() => document.activeElement.id)) === 'hero-spell');
  await p.evaluate(() => document.activeElement.blur());
  await p.close();

  // On a phone the hand is far below the first screen: none of it loads until the visitor heads that way.
  p = await newPage(390, 844, { touch: true, settings: { textScale: 1 }, wait: 1500 });
  const heroBefore = await p.evaluate(() => ({ code: !!Tanaw.hand3d, canvas: !!document.querySelector('.nh-hero canvas'), height: Math.round(document.querySelector('.nh-hero').getBoundingClientRect().height) }));
  ok('phone: the first screen loads none of the 3D hand', !heroBefore.code && !heroBefore.canvas, JSON.stringify(heroBefore));
  await p.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' }));
  const greeted = await p.waitForFunction(() => document.querySelector('[data-hero-strip] .is-current'), { timeout: 15000 }).then(() => true, () => false);
  const heroAfter = await p.evaluate(() => ({ code: !!Tanaw.hand3d, live: document.querySelector('.nh-hero [data-caption]').getAttribute('aria-live'), height: Math.round(document.querySelector('.nh-hero').getBoundingClientRect().height) }));
  ok('phone: scrolling there loads the hand, and it greets', greeted && heroAfter.code, JSON.stringify(heroAfter));
  ok('second landing: nothing below moves when the greeting starts', heroAfter.height === heroBefore.height, `${heroBefore.height} → ${heroAfter.height}`);
  ok('second landing: the greeting plays by itself, so screen readers are not read its letters', heroAfter.live === 'off');
  await p.close();

  // On a wide screen the hand is just below the first screen: ready early, but it waits to be seen before it greets.
  p = await newPage(1366, 768, { wait: 1800 });
  ok('wide screen: the greeting waits until the hand can be seen', await p.evaluate(() => !document.querySelector('[data-hero-strip] .is-current') && scrollY === 0));
  await p.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' }));
  ok('wide screen: then it starts', await p.waitForFunction(() => document.querySelector('[data-hero-strip] .is-current'), { timeout: 15000 }).then(() => true, () => false));
  await p.close();

  /* ---------- First view of a visit ---------- */
  p = await newPage(1366, 768, { intro: true, wait: 50 });
  ok('intro: plays on the first view of a visit', await p.evaluate(() => document.querySelector('.horizon').classList.contains('is-intro')));
  const introLinks = await p.evaluate(() => getComputedStyle(document.querySelector('.horizon__veil')).pointerEvents);
  ok('intro: never blocks the page', introLinks === 'none');
  await wait(1900);
  ok('intro: then it is gone', await p.evaluate(() => !document.querySelector('.horizon').classList.contains('is-intro')));
  await p.evaluate(() => { location.hash = '#/about'; }); await wait(900);
  await p.evaluate(() => { location.hash = '#/'; }); await wait(600);
  ok('intro: not again during the same visit', await p.evaluate(() => !document.querySelector('.horizon').classList.contains('is-intro')));
  await p.close();

  /* ---------- Reduced motion ---------- */
  p = await newPage(1366, 768, { settings: { motion: 'reduce' }, intro: true });
  ok('reduced motion: no intro', await p.evaluate(() => !document.querySelector('.horizon').classList.contains('is-intro')));
  await p.mouse.move(150, 500, { steps: 3 }); await wait(500);
  ok('reduced motion: the seam stays still', (await seamOf(p)) === 0.5);
  await p.click('.realm--learn .realm__cta'); await wait(500);
  ok('reduced motion: Enter goes straight there', (await p.evaluate(() => location.hash)) === '#/learn');
  await p.evaluate(() => { location.hash = '#/'; }); await wait(600);
  await p.evaluate(() => Tanaw.settings.set('motion', 'full')); await wait(100);
  await p.mouse.move(150, 480, { steps: 4 }); await wait(900);
  const leaned = await seamOf(p);
  await p.evaluate(() => Tanaw.settings.set('motion', 'reduce')); await wait(200);
  ok('switching to reduced motion mid-lean returns the seam to the middle', leaned > 0.55 && (await seamOf(p)) === 0.5, `was ${leaned}`);
  await p.close();

  /* ---------- Every size keeps the concept and fits ---------- */
  const SIZES = [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [900, 640], [860, 700], [820, 1180], [600, 900], [844, 390], [390, 844], [320, 640]];
  for (const [w, h] of SIZES) {
    p = await newPage(w, h, { touch: w < 860 });
    const m = await p.evaluate(() => {
      const de = document.documentElement;
      const rect = (s) => document.querySelector(s).getBoundingClientRect();
      const learn = rect('.realm--learn');
      const comm = rect('.realm--community');
      const eye = rect('.seam-eye');
      const clipped = [...document.querySelectorAll('.realm__title, .realm__lead, .realm__cta')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.right > de.clientWidth + 1 || r.left < -1;
      }).length;
      // On wide screens the worlds meet at a vertical seam; narrower, they stack at a horizon.
      const wide = de.clientWidth >= 860;
      const seamOk = wide
        ? Math.abs(eye.left + eye.width / 2 - de.clientWidth / 2) < 3
        : Math.abs(eye.top + eye.height / 2 - comm.top) < 3;
      const stacked = !wide && comm.top >= learn.bottom - 2;
      return { over: de.scrollWidth - de.clientWidth, clipped, seamOk, sideBySide: wide, stacked, ctaL: rect('.realm--learn .realm__cta').height };
    });
    ok(`${w}×${h}: both worlds, the eye on the seam, nothing cut off or overflowing`, m.over <= 1 && !m.clipped && m.seamOk && (m.sideBySide || m.stacked), JSON.stringify(m));
    await p.close();
  }

  /* ---------- Large text and short windows: the worlds grow, nothing is cut off ---------- */
  const uncut = () => p.evaluate(() => {
    const split = document.querySelector('[data-split]').getBoundingClientRect();
    const bad = [...document.querySelectorAll('.realm__eyebrow, .realm__title, .realm__lead, .realm__cta, .realm__station')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.top < split.top - 0.5 || r.bottom > split.bottom + 0.5;
    }).map((e) => e.className);
    return { bad, splitH: Math.round(split.height), over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  for (const [w, h, scale] of [[1366, 768, 1.5], [1024, 768, 1.5], [860, 700, 1.25], [1366, 500, 1], [1280, 720, 1.5]]) {
    p = await newPage(w, h, { settings: { textScale: scale } });
    await wait(300);
    const c = await uncut();
    ok(`${w}×${h} at ${Math.round(scale * 100)}% text: the words all fit inside the worlds`, !c.bad.length && c.over <= 1, JSON.stringify(c));
    const scene = await collisions();
    const pill = await p.evaluate(() => {
      const box = document.querySelector('.horizon__title').getBoundingClientRect();
      return [...document.querySelectorAll('.realm__eyebrow, .realm__title, .realm__lead')].flatMap((e) => { const r = document.createRange(); r.selectNodeContents(e); return [...r.getClientRects()]; }).some((r) => !(r.right <= box.left || box.right <= r.left || r.bottom <= box.top || box.bottom <= r.top));
    });
    ok(`${w}×${h} at ${Math.round(scale * 100)}% text: the decoration and the title stay clear of the words`, !scene.people && !scene.orbs && !pill, JSON.stringify({ ...scene, pill }));
    await p.close();
  }

  /* ---------- Phone ---------- */
  p = await newPage(390, 844, { touch: true, settings: { textScale: 1 } });
  const ph = await p.evaluate(() => {
    const cta = [...document.querySelectorAll('.realm__cta')].map((a) => a.getBoundingClientRect());
    const tab = document.querySelector('.tabbar').getBoundingClientRect();
    return { both: cta.every((r) => r.bottom <= tab.top), small: [...document.querySelectorAll('.realm__station')].filter((a) => a.getBoundingClientRect().height < 40).length };
  });
  ok('phone: both worlds\' Enter buttons on the first screen', ph.both);
  ok('phone: stations are comfortable to tap', ph.small === 0);
  await p.tap('.realm--community .realm__cta'); await wait(900);
  ok('phone: tapping Enter goes to the world', (await p.evaluate(() => location.hash)) === '#/community');
  await p.close();

  /* ---------- High contrast ---------- */
  p = await newPage(1366, 768, { settings: { contrast: 'high', theme: 'dark', textScale: 1 } });
  const hc = await p.evaluate(() => ({ scene: getComputedStyle(document.querySelector('.realm__scene')).display, bg: getComputedStyle(document.querySelector('.realm--learn .realm__inner')).backgroundColor }));
  ok('high contrast: plain panels without the materials', hc.scene === 'none' && hc.bg === 'rgb(0, 0, 0)', JSON.stringify(hc));
  await p.close();

  ok('no page errors or warnings anywhere above', errors.length === 0, errors.slice(0, 4).join(' | '));
  await browser.close();
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
