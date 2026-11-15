// What the other suites do not reach: the camera mirror and recording (with Chrome's fake camera), the
// Conversation Bridge (with stand-ins for speech), your data, the settings, a quiz, a review and a lesson
// from start to finish, and what happens when things go wrong: damaged saves, full storage, a file that
// will not load, hostile links, no JavaScript, fast navigation. Also: where keyboard focus ends up.
// Usage: node sweep.js <index.html>
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, cond, detail = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  const open = async (opts = {}) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: opts.w || 1280, height: opts.h || 900, hasTouch: !!opts.touch, isMobile: !!opts.touch });
    await page.evaluateOnNewDocument(() => {
      try { sessionStorage.setItem('tanaw.intro', '1'); } catch (e) { /* ignore */ }
      // Files offered for download are noted here instead of saved.
      window.__downloads = [];
      const click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (this.hasAttribute('download')) { window.__downloads.push(this.getAttribute('download')); return; } click.call(this); };
    });
    if (opts.init) await page.evaluateOnNewDocument(opts.init);
    const go = async (hash, ms = 500) => {
      await page.evaluate((h) => { if (location.hash === h) location.reload(); else location.hash = h; }, hash).catch(() => {});
      await page.waitForFunction(() => !document.documentElement.dataset.vt && document.querySelector('#view') && document.querySelector('#view').children.length, { timeout: 15000 }).catch(() => {});
      await wait(ms);
    };
    await page.goto(`${base}${opts.hash || '#/'}`, { waitUntil: 'load' });
    await wait(500);
    const until = (fn, arg, timeout = 10000) => page.waitForFunction(fn, { timeout, polling: 100 }, arg).then(() => true, () => false);
    const text = (sel) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }, sel);
    const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
    const lastToast = () => page.evaluate(() => { const t = [...document.querySelectorAll('.toast')].pop(); return t ? t.textContent.trim() : ''; });
    return { ctx, page, go, until, text, click, lastToast };
  };

  /* ---------- The Practice Mirror, with Chrome's fake camera ---------- */
  {
    const { ctx, page, go, until, click, lastToast } = await open({
      init: () => {
        const md = navigator.mediaDevices;
        const real = md.getUserMedia.bind(md);
        window.__asked = 0;
        window.__fail = null;
        md.getUserMedia = async (c) => {
          window.__asked += 1;
          if (window.__fail) throw new DOMException('test', window.__fail);
          window.__stream = await real(c);
          return window.__stream;
        };
      },
    });
    await go('#/practice/mirror', 600);
    ok('mirror: the camera stays off until asked', await page.evaluate(() => window.__asked === 0 && document.querySelector('.cam').dataset.state === 'off'));
    await click('[data-cam-start]');
    ok('mirror: Start camera shows the live picture', await until(() => document.querySelector('.cam').dataset.state === 'live' && document.querySelector('.cam__video').videoWidth > 0));
    const xp0 = await page.evaluate(() => Tanaw.store.state.progress.xp);
    await click('[data-mirror]');
    await click('[data-guide]');
    ok('mirror: the mirror and guide switches work', await page.evaluate(() => !document.querySelector('.cam__video').classList.contains('is-mirrored') && document.querySelector('.cam__guide').classList.contains('is-hidden')));
    await click('[data-rec]');
    ok('mirror: Record counts down first', await until(() => !document.querySelector('.cam__countdown').hidden, undefined, 2000));
    ok('mirror: then records', await until(() => !document.querySelector('.cam__rec').hidden, undefined, 6000));
    await wait(3000);
    await click('[data-rec]');
    ok('mirror: stopping gives a clip to review', await until(() => document.querySelectorAll('.clip').length === 1));
    const clip = await page.evaluate(() => { const v = document.querySelector('.clip__video'); return { src: /^blob:/.test(v.src), meta: document.querySelector('.clip__meta').textContent.replace(/\s+/g, ' ').trim() }; });
    ok('mirror: the clip stays on this device, in memory', clip.src, clip.meta);
    ok('mirror: recording earns XP, and says so', (await page.evaluate(() => Tanaw.store.state.progress.xp)) === xp0 + 5 && /Clip recorded/.test(await lastToast()));
    await click('.clip [data-download]');
    ok('mirror: a clip downloads only when asked', (await page.evaluate(() => window.__downloads.join())).includes('tanaw-practice-free-practice'));
    await click('.clip [data-delete]');
    ok('mirror: deleting a clip empties the list', await page.evaluate(() => !document.querySelector('.clip') && !!document.querySelector('.clip-list__empty')));
    await click('.checklist-card input[value]');
    await click('[data-log]');
    ok('mirror: logging practice names what to work on next', /Focus next on the 4 unticked/.test(await page.evaluate(() => document.querySelector('[data-log-hint]').textContent)));
    // A recording too short to catch anything: the camera gives no data, and the page has to say so.
    await page.evaluate(() => {
      window.__Recorder = window.MediaRecorder;
      window.MediaRecorder = class { constructor() { this.state = 'inactive'; this.mimeType = 'video/webm'; } start() { this.state = 'recording'; } stop() { this.state = 'inactive'; this.onstop(); } };
      window.MediaRecorder.isTypeSupported = () => true;
    });
    await click('[data-rec]');
    await until(() => !document.querySelector('.cam__rec').hidden, undefined, 6000);
    await click('[data-rec]');
    await wait(150);
    ok('mirror: a recording too short to keep says so, instead of nothing happening', /too short/.test(await lastToast()) && (await page.evaluate(() => !document.querySelector('.clip'))));
    await page.evaluate(() => { window.MediaRecorder = window.__Recorder; });
    await click('[data-cam-stop]');
    ok('mirror: Stop camera really stops it', await page.evaluate(() => window.__stream.getTracks().every((t) => t.readyState === 'ended') && document.querySelector('.cam').dataset.state === 'off'));
    await click('[data-cam-start]');
    await until(() => document.querySelector('.cam').dataset.state === 'live');
    // The camera stops sending a picture (unplugged, or taken by another app): Record has to say so, not fail silently.
    await page.evaluate(() => window.__stream.getTracks().forEach((t) => t.stop()));
    const errorsBefore = errors.length;
    await click('[data-rec]');
    await wait(3600);
    ok('mirror: if the camera has stopped, Record says recording could not start, with no page error', /could not start/.test(await lastToast()) && (await page.evaluate(() => document.querySelector('.cam__rec').hidden)) && errors.length === errorsBefore, await lastToast());
    await click('[data-cam-stop]');
    await click('[data-cam-start]');
    await until(() => document.querySelector('.cam').dataset.state === 'live');
    await go('#/practice', 500);
    ok('mirror: leaving the page releases the camera', await page.evaluate(() => window.__stream.getTracks().every((t) => t.readyState === 'ended')));
    for (const [fail, words] of [['NotAllowedError', /blocked|allow/i], ['NotFoundError', /no camera|not found|connect/i], ['NotReadableError', /another|in use|busy|could not/i]]) {
      await page.evaluate((f) => { window.__fail = f; }, fail);
      await go('#/practice/mirror', 400);
      await click('[data-cam-start]');
      await wait(300);
      const msg = await page.evaluate(() => ({ state: document.querySelector('.cam').dataset.state, text: document.querySelector('[data-cam-error]').textContent, retry: !document.querySelector('.cam__overlay--error').hidden }));
      ok(`mirror: ${fail} gets a clear message and a way to retry`, msg.state === 'error' && msg.retry && words.test(msg.text), msg.text);
      await go('#/practice', 200);
    }
    await page.evaluate(() => { window.__fail = null; });
    await go('#/practice/mirror', 400);
    await click('[data-cam-start]');
    ok('mirror: trying again after a failure works', await until(() => document.querySelector('.cam').dataset.state === 'live'));
    await ctx.close();
  }

  /* ---------- The Conversation Bridge, with stand-ins for speech ---------- */
  {
    const { ctx, page, go, until, text, click, lastToast } = await open({
      init: () => {
        window.SpeechRecognition = undefined;
        window.webkitSpeechRecognition = class {
          start() { window.__sr = this; window.__srStarts = (window.__srStarts || 0) + 1; }
          stop() { if (this.onend) this.onend(); }
          abort() {}
        };
        window.__spoken = [];
        if (window.speechSynthesis) window.speechSynthesis.speak = (u) => window.__spoken.push(u.text);
      },
    });
    await go('#/bridge', 500);
    await click('[data-show]');
    await wait(100);
    ok('bridge: Show with no message asks for one', /Type a message first/.test(await lastToast()) && (await page.evaluate(() => document.activeElement.id)) === 'show-text');
    await page.type('#show-text', 'Salamat po <b>!</b>');
    await page.focus('[data-show]');
    await click('[data-show]');
    await wait(250);
    const big = await page.evaluate(() => { const t = document.querySelector('dialog.bigtext[open] [data-text]'); return { text: t.textContent.trim(), bold: !!t.querySelector('b'), size: parseFloat(getComputedStyle(t).fontSize) }; });
    ok('bridge: full-screen text fills the screen, and shows markup as plain text', big.text === 'Salamat po <b>!</b>' && !big.bold && big.size > 40, JSON.stringify(big));
    await page.keyboard.press('Tab');
    await click('dialog.bigtext [data-rotate]');
    ok('bridge: Rotate turns it for the other person', await page.evaluate(() => document.querySelector('dialog.bigtext').classList.contains('is-rotated')));
    await page.keyboard.press('Escape');
    await wait(200);
    ok('bridge: Esc closes it and returns to the button', await page.evaluate(() => !document.querySelector('dialog.bigtext') && document.activeElement.matches('[data-show]')));
    await click('[data-speak-show]');
    ok('bridge: Speak aloud speaks the message', (await page.evaluate(() => window.__spoken.join())).includes('Salamat po'));

    await click('#tab-captions');
    await click('[data-listen]');
    ok('captions: start listening', await until(() => !!window.__sr) && /Listening/.test(await text('[data-cap-status]')));
    await page.evaluate(() => {
      const final = (t) => { const r = [{ transcript: t }]; r.isFinal = true; return r; };
      const interim = (t) => { const r = [{ transcript: t }]; r.isFinal = false; return r; };
      window.__sr.onresult({ resultIndex: 0, results: [final('Magandang umaga <img src=x onerror=window.__xss=1>')] });
      window.__sr.onresult({ resultIndex: 0, results: [interim('kumusta')] });
    });
    const cap = await page.evaluate(() => ({ lines: [...document.querySelectorAll('.captions__line')].map((l) => l.textContent), img: !!document.querySelector('.captions img') }));
    ok('captions: final and in-progress text appear, as plain text', cap.lines.length === 2 && /Magandang umaga/.test(cap.lines[0]) && !cap.img, JSON.stringify(cap.lines));
    await page.evaluate(() => window.__sr.onend());
    ok('captions: if the browser stops listening by itself, it starts again', (await page.evaluate(() => window.__srStarts)) === 2);
    await click('[data-cap-size="1"]');
    ok('captions: the size buttons work', (await page.evaluate(() => document.querySelector('[data-captions]').dataset.size)) === '3');
    await click('[data-cap-save]');
    ok('captions: Save downloads the transcript', /tanaw-captions-.*\.txt/.test(await page.evaluate(() => window.__downloads.join())));
    await page.evaluate(() => window.__sr.onerror({ error: 'not-allowed' }));
    ok('captions: a blocked microphone says so, and stops', /Microphone access was blocked/.test(await text('[data-cap-status]')) && /Start captions/.test(await text('[data-listen]')));
    await click('[data-cap-clear]');
    ok('captions: Clear empties them', await page.evaluate(() => !document.querySelector('.captions__line')));

    await click('#tab-speak');
    await page.type('#speak-text', 'Ako ay Deaf.');
    await click('[data-speak]');
    ok('speak: types and speaks', (await page.evaluate(() => window.__spoken.pop())) === 'Ako ay Deaf.');
    await page.evaluate(() => { const r = document.querySelector('#tts-rate'); r.value = '1.4'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    ok('speak: the speed is saved', (await page.evaluate(() => Tanaw.store.state.settings.ttsRate)) === 1.4);

    await click('#tab-phrases');
    await page.type('#ph-fil', 'Saan po ang klinika?');
    await page.type('#ph-en', 'Where is the clinic?');
    await page.evaluate(() => document.querySelector('[data-phrase-form]').requestSubmit());
    await wait(100);
    ok('phrases: your own phrase is saved, first in the list', await page.evaluate(() => document.querySelector('[data-group="custom"] .phrase__fil').textContent === 'Saan po ang klinika?'));
    await click('[data-group="custom"] [data-ph-show]');
    await wait(200);
    ok('phrases: Show opens it full screen', /Saan po ang klinika/.test(await text('dialog.bigtext [data-text]')));
    await page.keyboard.press('Escape');
    await wait(150);
    await click('[data-group="custom"] [data-ph-delete]');
    await wait(100);
    ok('phrases: and it can be deleted', await page.evaluate(() => !document.querySelector('[data-group="custom"]')));

    await click('#tab-emergency');
    await page.type('#em-name', 'Ana <i>Reyes</i>');
    await page.type('#em-cname', 'Luz');
    await page.type('#em-cphone', '0917 123 4567');
    await click('[data-show-card]');
    await wait(250);
    const card = await page.evaluate(() => { const c = document.querySelector('.em-card'); const a = c.querySelector('a[href^="tel:"]'); return { text: c.textContent.replace(/\s+/g, ' '), tel: a && a.getAttribute('href'), i: !!c.querySelector('i'), hotline: /911/.test(c.textContent) }; });
    ok('emergency: the card shows the details, as plain text, with a number to call', card.text.includes('Ana <i>Reyes</i>') && !card.i && card.tel === 'tel:09171234567' && card.hotline, JSON.stringify(card));
    await page.keyboard.press('Escape');
    await wait(150);
    await go('#/bridge?tab=phrases', 200);
    await page.goto('about:blank');
    await page.goto(`${base}#/bridge?tab=emergency`, { waitUntil: 'load' });
    await wait(500);
    ok('emergency: it is still there after leaving and coming back', (await page.evaluate(() => document.querySelector('#em-name').value)) === 'Ana <i>Reyes</i>');
    await click('[data-clear-card]');
    await wait(200);
    await page.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Clear card/.test(b.textContent)).click());
    await wait(250);
    ok('emergency: Clear card asks, then removes it', await page.evaluate(() => document.querySelector('#em-name').value === '' && Tanaw.store.state.bridge.emergency.name === ''));
    ok('bridge: nothing was run from what was typed', await page.evaluate(() => !window.__xss));
    await ctx.close();
  }

  /* ---------- Browsers without speech ---------- */
  {
    const { ctx, page, go, text } = await open({ init: () => { window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; delete window.speechSynthesis; Object.defineProperty(window, 'speechSynthesis', { value: undefined }); window.SpeechSynthesisUtterance = undefined; } });
    await go('#/bridge?tab=captions', 400);
    ok('captions: where they cannot work, the page says so and offers Show text', /not available in this browser/.test(await text('#panel-captions')));
    ok('speak: same', /not available in this browser/.test(await text('#panel-speak')) && !(await page.$('[data-speak-show]')));
    await ctx.close();
  }

  /* ---------- Your data: export, import, reset ---------- */
  {
    const { ctx, page, go, click, lastToast } = await open();
    await page.evaluate(() => { Tanaw.progress.addXP(42, { reason: 'test' }); Tanaw.store.update((s) => { s.progress.journal = [{ id: 'j1', lessonId: 'x', prompt: 'Why?', text: 'Because <b>.', at: new Date().toISOString() }]; }); });
    await go('#/journey', 500);
    ok('journey: a journal entry is listed, as plain text', (await page.evaluate(() => document.querySelector('.journal__text').textContent)) === 'Because <b>.');
    const backup = await page.evaluate(() => Tanaw.store.exportJSON());
    await click('[data-export]');
    ok('journey: Export offers a file', /tanaw-progress-.*\.json/.test(await page.evaluate(() => window.__downloads.join())));
    await click('[data-del-journal]');
    await wait(400);
    ok('journey: a journal entry can be deleted', await page.evaluate(() => !document.querySelector('.journal__item')));
    await click('[data-reset]');
    await wait(250);
    await page.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Reset everything/.test(b.textContent)).click());
    await wait(500);
    ok('journey: Reset asks, then starts over', (await page.evaluate(() => Tanaw.store.state.progress.xp)) === 0);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tanaw-'));
    const good = path.join(dir, 'backup.json');
    const bad = path.join(dir, 'not-json.json');
    const other = path.join(dir, 'other.json');
    fs.writeFileSync(good, backup);
    fs.writeFileSync(bad, 'this is not json');
    fs.writeFileSync(other, '{"app":"something-else"}');
    await go('#/journey', 400);
    const input = await page.$('[data-import]');
    await input.uploadFile(bad);
    await wait(300);
    ok('journey: a file that is not JSON is refused, and says why', /not valid JSON/.test(await lastToast()));
    await (await page.$('[data-import]')).uploadFile(other);
    await wait(300);
    ok('journey: another program\'s file is refused, and says why', /not a Tanaw progress backup/.test(await lastToast()));
    await (await page.$('[data-import]')).uploadFile(good);
    await wait(300);
    await page.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Import and replace/.test(b.textContent)).click());
    await wait(600);
    ok('journey: a real backup restores everything', await page.evaluate(() => Tanaw.store.state.progress.xp === 42 && Tanaw.store.state.progress.journal.length === 1));
    fs.rmSync(dir, { recursive: true, force: true });
    await ctx.close();
  }

  /* ---------- Display settings ---------- */
  {
    const { ctx, page, go, click } = await open({ hash: '#/learn' });
    await page.focus('[data-open-settings-global]');
    await click('[data-open-settings-global]');
    await wait(250);
    const pick = (name, value) => page.evaluate((n, v) => { const i = document.querySelector(`#settings-form input[name="${n}"][value="${v}"]`); i.click(); }, name, value);
    const sw = (name) => page.evaluate((n) => document.querySelector(`#settings-form input[name="${n}"]`).click(), name);
    const root = () => page.evaluate(() => { const d = document.documentElement; return { theme: d.dataset.theme, contrast: d.dataset.contrast || '', motion: d.dataset.motion, spacing: d.dataset.spacing || '', scale: d.style.getPropertyValue('--text-scale') }; });
    await pick('theme', 'light');
    ok('settings: Light theme applies at once', (await root()).theme === 'light');
    await pick('theme', 'system');
    const sys = await page.evaluate(() => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    ok('settings: System follows the device', (await root()).theme === sys);
    await pick('theme', 'dark');
    await sw('contrast');
    ok('settings: High contrast', (await root()).contrast === 'high');
    await sw('contrast');
    await sw('spacing');
    ok('settings: Relaxed spacing', (await root()).spacing === 'relaxed');
    await page.evaluate(() => { const r = document.querySelector('#set-text'); r.value = '1.25'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    ok('settings: Text size', (await root()).scale === '1.25' && (await page.evaluate(() => document.querySelector('#set-text-out').textContent)) === '125%', JSON.stringify(await root()));
    await pick('motion', 'reduce');
    ok('settings: Reduce motion', (await root()).motion === 'reduce');
    await pick('dailyGoal', '50');
    await pick('handStyle', 'hologram');
    await sw('handMirror');
    await sw('mirrorCamera');
    const saved = await page.evaluate(() => { Tanaw.store.flush(); const s = JSON.parse(localStorage.getItem('tanaw.state.v1')).settings; return { goal: s.dailyGoal, style: s.handStyle, left: s.handMirror, cam: s.mirrorCamera, text: s.textScale }; });
    ok('settings: all are saved', saved.goal === 50 && saved.style === 'hologram' && saved.left === true && saved.cam === false && saved.text === 1.25, JSON.stringify(saved));
    await page.keyboard.press('Escape');
    await wait(200);
    ok('settings: Esc closes, and focus returns to the button', await page.evaluate(() => !document.querySelector('dialog[open]') && document.activeElement.matches('[data-open-settings-global]')));
    await page.goto('about:blank');
    await page.goto(`${base}#/learn`, { waitUntil: 'load' });
    await wait(300);
    ok('settings: still there after a reload, before anything is drawn', (await root()).spacing === 'relaxed' && (await root()).scale === '1.25');
    await click('[data-open-settings-global]');
    await wait(250);
    await page.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find((b) => /Reset to defaults/.test(b.textContent)).click());
    await wait(250);
    const after = await root();
    ok('settings: Reset to defaults puts everything back', after.spacing !== 'relaxed' && after.theme === 'dark' && (after.scale === '1' || after.scale === ''), JSON.stringify(after));
    await ctx.close();
  }

  /* ---------- Whole activities, start to finish ---------- */
  {
    const { ctx, page, go, click } = await open();
    const finish = async () => {
      for (let k = 0; k < 90; k++) {
        if (await page.$('.complete')) return true;
        const moved = await page.evaluate(() => {
          const btn = document.querySelector('[data-primary]');
          if (btn && !btn.disabled) { btn.click(); return true; }
          const opt = document.querySelector('.option input:not(:disabled), .answer:not(:disabled)');
          if (opt) { opt.click(); return true; }
          return false;
        });
        if (!moved) return false;
        await wait(120);
      }
      return !!(await page.$('.complete'));
    };
    await go('#/practice/quiz?mode=concepts', 400);
    ok('quiz: ten questions, to a results page', await finish());
    const q = await page.evaluate(() => ({ focus: document.activeElement.matches('.complete__title'), taken: Tanaw.store.state.progress.quizzes.taken, score: document.querySelector('.complete__stats').textContent.replace(/\s+/g, ' ') }));
    ok('quiz: its results are recorded, with focus on them', q.focus && q.taken === 1, q.score);
    await click('[data-again]');
    await wait(300);
    ok('quiz: New quiz starts another', !(await page.$('.complete')));
    await go('#/learn/what-is-fsl', 400);
    ok('lesson: can be finished from start to end', await finish());
    ok('lesson: finishing it is recorded', await page.evaluate(() => !!Tanaw.store.state.progress.lessons['what-is-fsl']));
    await go('#/practice/review', 400);
    await click('[data-start="concepts"]');
    await wait(200);
    await page.keyboard.press('Space');
    await wait(150);
    ok('review: Space shows the answer', await page.evaluate(() => !document.querySelector('.flashcard__back').hidden && !document.querySelector('[data-rating]').hidden));
    await page.keyboard.press('3');
    await wait(150);
    ok('review: a number key rates it, and the next card comes', await page.evaluate(() => /^2 \//.test(document.querySelector('.review__count').textContent)), await page.evaluate(() => document.querySelector('.review__count').textContent));
    for (let k = 0; k < 60 && !(await page.$('.complete')); k++) { await page.keyboard.press('Space'); await wait(40); await page.keyboard.press('4'); await wait(40); }
    ok('review: a session ends with a summary', !!(await page.$('.complete')));
    await go('#/library', 400);
    await page.type('#library-search', 'zzzqqq');
    await wait(400);
    ok('vocabulary: a search with no matches says so', /No entries found/.test(await page.evaluate(() => document.querySelector('#view').textContent)));
    await ctx.close();
  }

  const beforeBad = errors.length;
  /* ---------- When things go wrong: damaged saves ---------- */
  {
    const { ctx } = await open();
    // Written straight into storage on the next page load, before the site reads it.
    const withSave = async (value, hash = '#/') => {
      const p = await ctx.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      const once = `tanaw-seed-${Math.random()}`;
      await p.evaluateOnNewDocument((v, key) => { if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); localStorage.setItem('tanaw.state.v1', v); } }, value, once);
      await p.goto(`${base}${hash}`, { waitUntil: 'load' });
      await wait(500);
      return p;
    };
    let p = await withSave('{"progress":{"xp":12,');
    const dmg = await p.evaluate(() => ({ view: document.body.dataset.view, h1: !!document.querySelector('h1'), xp: Tanaw.store.state.progress.xp, saving: Tanaw.store.isPersistent(), note: document.querySelector('#app-notices').textContent }));
    ok('damaged save: the site still opens, and says what happened', dmg.view === 'home' && dmg.h1 && dmg.xp === 0 && /could not be read/.test(dmg.note), JSON.stringify(dmg).slice(0, 180));
    ok('damaged save: it is not blamed on the browser, and saving still works', dmg.saving && !/blocking local storage/.test(dmg.note));
    await p.evaluate(() => { Tanaw.progress.addXP(7, { reason: 'test' }); Tanaw.store.flush(); });
    await p.goto('about:blank');
    await p.goto(`${base}#/`, { waitUntil: 'load' });
    await wait(400);
    const later = await p.evaluate(() => ({ xp: Tanaw.store.state.progress.xp, note: document.querySelector('#app-notices').textContent.trim() }));
    ok('damaged save: new progress is kept from then on, and the notice goes away', later.xp === 7 && !later.note, JSON.stringify(later));
    await p.close();
    p = await withSave('{"progress":5,"settings":"x","games":[1,2],"srs":null,"bridge":{"phrases":"no","emergency":7},"custom":{},"explore":3}', '#/journey');
    const odd = await p.evaluate(() => ({ h1: !!document.querySelector('h1'), goal: Tanaw.store.state.settings.dailyGoal, xp: Tanaw.store.state.progress.xp }));
    ok('odd save: values of the wrong kind fall back to defaults', odd.h1 && odd.goal === 30 && odd.xp === 0, JSON.stringify(odd));
    for (const r of ['#/', '#/learn', '#/bridge', '#/library', '#/play', '#/practice/review', '#/community']) {
      await p.evaluate((h) => { location.hash = h; }, r);
      await wait(350);
    }
    ok('odd save: the main pages all still work', await p.evaluate(() => !!document.querySelector('#view h1')));
    await p.close();
    await ctx.close();
  }

  /* ---------- When things go wrong: full storage ---------- */
  {
    const { ctx, page, go, lastToast } = await open();
    await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); }; });
    await page.evaluate(() => { Tanaw.progress.addXP(3, { reason: 'test' }); Tanaw.store.flush(); });
    await wait(200);
    ok('full storage: says so, and the site keeps working', /storage may be full/.test(await lastToast()) && (await page.evaluate(() => Tanaw.store.state.progress.xp)) === 3);
    await go('#/learn', 400);
    ok('full storage: pages still open', await page.evaluate(() => document.body.dataset.view === 'learnHub'));
    await ctx.close();
  }

  /* ---------- When things go wrong: a page's file will not load ---------- */
  {
    const { ctx, page, go, text, click, until } = await open();
    // Sent to a file that does not exist, as if the connection dropped.
    await page.evaluate(() => {
      window.__block = true;
      const append = Node.prototype.appendChild;
      Node.prototype.appendChild = function (el) {
        if (window.__block && el.tagName === 'SCRIPT' && /views\/about\.js/.test(el.src)) el.src = 'assets/js/views/does-not-exist.js';
        return append.call(this, el);
      };
    });
    await go('#/about', 500);
    ok('a file will not load: the page says so, with a way to try again', /could not load/.test(await text('#view h1')) && !!(await page.$('[data-retry]')), await text('#view h1'));
    await page.evaluate(() => { window.__block = false; });
    await click('[data-retry]');
    ok('a file will not load: Try again works once it can', await until(() => document.body.dataset.view === 'about' && !/could not load/.test(document.querySelector('#view h1').textContent)));
    await ctx.close();
  }
  errors.length = beforeBad; // The errors the last three parts provoke are expected, and each was checked above.

  /* ---------- Links that do not make sense, or try to inject something ---------- */
  {
    const { ctx, page } = await open();
    const X = encodeURIComponent('<img src=x onerror=window.__xss=1>');
    const bad = [];
    for (const r of ['#/sign/nope', '#/learn/nope', '#/play/nope', '#/scenes/nope', '#/community/stories/nope', '#/nope/nope/nope', '#///', `#/${X}`,
      `#/lab?letter=${X}`, `#/lab?tab=${X}`, `#/lab?tab=spell&text=${X}`, `#/practice/fingerspell?text=${X}`, `#/practice/mirror?sign=${X}`, `#/library?q=${X}`, `#/library?topic=${X}&status=${X}`,
      `#/sign/${X}`, `#/community/stories/first-school?ch=${X}`, `#/community/stories/first-school?ch=999`, `#/community/stories/first-school?ch=-1`, `#/practice/review?deck=${X}`, `#/practice/quiz?mode=${X}`,
      `#/about?s=${X}`, `#/bridge?tab=${X}`, `#/community/identity?s=${X}`, `#/login?next=${encodeURIComponent('https://example.com/steal')}`, `#/login?next=${encodeURIComponent('//example.com')}`, `#/register?next=${encodeURIComponent('javascript:alert(1)')}`]) {
      const before = errors.length;
      await page.goto('about:blank');
      await page.goto(`${base}${r}`, { waitUntil: 'load' });
      await wait(450);
      const m = await page.evaluate(() => ({ xss: !!window.__xss, img: !!document.querySelector('#view img[src="x"]'), h1: document.querySelectorAll('h1').length }));
      if (m.xss || m.img) bad.push(`${r}: injected`);
      if (m.h1 !== 1) bad.push(`${r}: ${m.h1} h1`);
      if (errors.length > before) bad.push(`${r}: ${errors.slice(before).join(' ; ').slice(0, 120)}`);
    }
    ok('odd and hostile links: every one gives a normal page, and nothing runs', !bad.length, bad.join(' | '));
    await page.goto(`${base}#/`, { waitUntil: 'load' });
    await wait(500);
    await page.evaluate(() => document.querySelector('.nh-hero .stage3d').scrollIntoView({ block: 'center' }));
    await page.type('#hero-spell', '<img src=x onerror=1>');
    await page.keyboard.press('Enter');
    await wait(500);
    ok('second landing: a name with markup in it is shown as plain text', await page.evaluate(() => !document.querySelector('.nh-hero img') && !window.__xss));
    await page.evaluate(() => { document.querySelector('#hero-spell').value = ''; });
    await page.type('#hero-spell', 'Ñino 7');
    await page.keyboard.press('Enter');
    await wait(500);
    ok('second landing: letters the hand has no model for are marked, not guessed', await page.evaluate(() => document.querySelectorAll('[data-hero-strip] .is-gap').length >= 2));
    await ctx.close();
  }

  /* ---------- Printing: black on white, in the dark theme too ---------- */
  {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.emulateMediaType('print');
    for (const r of ['#/', '#/scenes/clinic', '#/about']) {
      await page.goto('about:blank');
      await page.goto(`${base}${r}`, { waitUntil: 'load' });
      await wait(500);
      const m = await page.evaluate(() => {
        const texts = [...document.querySelectorAll('#view h1, #view h2, #view p, #view a')].slice(0, 40);
        const paint = (e) => { const c = getComputedStyle(e); return `${c.color}|${c.webkitTextFillColor}`; };
        const bar = (s) => { const e = document.querySelector(s); return !e || getComputedStyle(e).display === 'none'; };
        return { black: texts.every((e) => paint(e) === 'rgb(0, 0, 0)|rgb(0, 0, 0)'), bg: getComputedStyle(document.body).backgroundColor, bars: bar('.site-header') && bar('.tabbar') && bar('.site-footer') };
      });
      ok(`printing ${r}: black text on white, without the navigation`, m.black && m.bg === 'rgb(255, 255, 255)' && m.bars, JSON.stringify(m));
    }
    await ctx.close();
  }

  /* ---------- Windows' contrast themes: what only a background said before ---------- */
  {
    const { ctx, page, go } = await open({ hash: '#/lab' });
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
    await go('#/lab', 900);
    const lab = await page.evaluate(() => {
      const bg = (s) => getComputedStyle(document.querySelector(s)).backgroundColor;
      const line = (s) => getComputedStyle(document.querySelector(s)).borderBottomColor;
      document.querySelector('[data-letter="B"]').click();
      return { active: matchMedia('(forced-colors: active)').matches, tab: bg('.tabs__tab[aria-selected="true"]'), tabOff: bg('.tabs__tab[aria-selected="false"]'), offLine: line('.tabs__tab[aria-selected="false"]'), onLine: line('.tabs__tab[aria-selected="true"]'), nav: bg('.world-nav__link[aria-current="page"]'), navOff: bg('.world-nav__link:not([aria-current])') };
    });
    ok('contrast themes: the selected tab and the current page stand out', lab.active && lab.tab !== lab.tabOff && lab.onLine !== lab.offLine && lab.nav !== lab.navOff, JSON.stringify(lab));
    ok('contrast themes: a chosen letter stands out', await page.evaluate(() => getComputedStyle(document.querySelector('[data-letter="B"]')).backgroundColor !== getComputedStyle(document.querySelector('[data-letter="C"]')).backgroundColor));
    await go('#/', 600);
    ok('contrast themes: decoration behind the text goes', await page.evaluate(() => getComputedStyle(document.querySelector('.portal__art')).display === 'none' && getComputedStyle(document.querySelector('.realm__scene')).display === 'none'));
    await go('#/learn/path', 600);
    ok('contrast themes: progress bars have an outline and a visible fill', await page.evaluate(() => { const b = document.querySelector('.bar'); const f = document.querySelector('.bar__fill'); return parseFloat(getComputedStyle(b).borderTopWidth) >= 1 && getComputedStyle(f).backgroundColor !== getComputedStyle(b).backgroundColor; }));
    await ctx.close();
  }

  /* ---------- No JavaScript ---------- */
  {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setJavaScriptEnabled(false);
    for (const f of ['index.html', 'admin.html']) {
      await page.goto(pathToFileURL(path.join(path.dirname(path.resolve(process.argv[2])), f)).href, { waitUntil: 'load' });
      const shown = await page.$eval('noscript', (n) => n.parentElement !== null).catch(() => false);
      const body = await page.evaluate(() => document.body.innerText).catch(() => '');
      ok(`no JavaScript: ${f} explains itself, with no endless "Loading"`, shown && /needs JavaScript/.test(body) && !/Loading/.test(body), body.replace(/\s+/g, ' ').slice(0, 90));
    }
    await ctx.close();
  }

  /* ---------- Moving around quickly ---------- */
  {
    const { ctx, page, go } = await open();
    const r = ['#/lab', '#/learn', '#/community/identity', '#/play', '#/', '#/library', '#/lab?tab=spell&text=Ana', '#/community/history', '#/scenes/clinic', '#/about', '#/', '#/journey'];
    await page.evaluate(async (list) => { for (const h of list) { location.hash = h; await new Promise((f) => setTimeout(f, 40)); } }, r);
    await page.waitForFunction(() => document.body.dataset.view === 'progress' && !document.documentElement.dataset.vt, { timeout: 20000 }).catch(() => {});
    await wait(600);
    const end = await page.evaluate(() => ({ view: document.body.dataset.view, h1: document.querySelectorAll('h1').length, canvases: document.querySelectorAll('canvas').length, h: location.hash }));
    ok('fast navigation: the last link wins, with nothing left over', end.view === 'progress' && end.h1 === 1 && end.canvases === 0, JSON.stringify(end));
    await go('#/learn', 400);
    await go('#/lab', 800);
    await go('#/community', 400);
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.view === 'lab', { timeout: 10000 }).catch(() => {});
    await wait(900);
    ok('back: returns to the 3D Lab, with its hand', await page.evaluate(() => document.body.dataset.view === 'lab' && !!document.querySelector('.stage3d canvas')));
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.view === 'learnHub', { timeout: 10000 }).catch(() => {});
    await page.goForward();
    await page.waitForFunction(() => document.body.dataset.view === 'lab', { timeout: 10000 }).catch(() => {});
    await wait(300);
    ok('forward: works too', await page.evaluate(() => document.body.dataset.view === 'lab' && document.querySelectorAll('h1').length === 1));
    await ctx.close();
  }

  /* ---------- Keyboard: where focus ends up ---------- */
  {
    const { ctx, page } = await open({ w: 1366, h: 768 });
    await page.goto('about:blank');
    await page.goto(`${base}#/learn`, { waitUntil: 'load' });
    await wait(500);
    await page.keyboard.press('Tab');
    ok('keyboard: the first Tab reaches the skip link', await page.evaluate(() => document.activeElement.classList.contains('skip-link')));
    await page.keyboard.press('Enter');
    await wait(200);
    ok('keyboard: the skip link moves past the header', await page.evaluate(() => !document.activeElement.closest('.site-header') && !document.activeElement.classList.contains('skip-link')), await page.evaluate(() => `${document.activeElement.tagName}#${document.activeElement.id}`));
    await ctx.close();
    const covered = [];
    for (const [w, h, touch] of [[1366, 768, false], [390, 844, true]]) {
      const s = await open({ w, h, touch });
      for (const r of ['#/', '#/learn', '#/lab', '#/community/identity', '#/library', '#/login', '#/bridge', '#/about']) {
        await s.page.goto('about:blank');
        await s.page.goto(`${base}${r}`, { waitUntil: 'load' });
        await wait(500);
        for (let i = 0; i < 45; i++) {
          await s.page.keyboard.press('Tab');
          await wait(25);
          const m = await s.page.evaluate(() => {
            const a = document.activeElement;
            // Tab has wrapped around to the skip link, which is still sliding in. It has its own check above.
            if (!a || a === document.body || a.classList.contains('skip-link')) return null;
            const b = a.getBoundingClientRect();
            if (!b.width || !b.height) return { name: `${a.tagName}.${a.className}`, hidden: true };
            const bar = (sel) => { const e = document.querySelector(sel); if (!e || getComputedStyle(e).display === 'none') return null; return e.getBoundingClientRect(); };
            const header = a.closest('.site-header, .tabbar, .world-nav, .skip-link, dialog') ? null : bar('.site-header');
            const tab = a.closest('.site-header, .tabbar, .skip-link, dialog') ? null : bar('.tabbar');
            const nav = a.closest('.site-header, .tabbar, .world-nav, .skip-link, dialog') ? null : (() => { const n = bar('.world-nav'); return n && getComputedStyle(document.querySelector('.world-nav')).position === 'sticky' ? n : null; })();
            const top = Math.max(header ? header.bottom : 0, nav ? nav.bottom : 0);
            const bottom = tab ? tab.top : innerHeight;
            const gone = b.bottom <= top + 1 || b.top >= bottom - 1;
            return { name: `${a.tagName.toLowerCase()}.${String(a.className).split(' ')[0]}`, covered: gone, top: Math.round(b.top), bottom: Math.round(b.bottom), limits: [Math.round(top), Math.round(bottom)] };
          });
          if (m && (m.covered || m.hidden)) covered.push(`${w}px ${r} ${m.name} ${m.hidden ? 'has no size' : `at ${m.top}–${m.bottom}, visible ${m.limits.join('–')}`}`);
        }
      }
      await s.ctx.close();
    }
    ok('keyboard: focus is never hidden behind the header or tab bar (WCAG 2.4.11)', !covered.length, [...new Set(covered)].slice(0, 10).join(' | '));
  }

  ok('no page errors in the parts where none were expected', errors.length === 0, errors.slice(0, 6).join(' | '));
  await browser.close();
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
