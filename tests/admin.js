// The administrator console (admin.html): a separate page with its own layout, working within
// the frontend-only scope. Includes axe-core on every section and state.
// Usage: node admin.js <admin.html>
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const adminFile = path.resolve(process.argv[2]);
const base = pathToFileURL(adminFile).href;
const site = pathToFileURL(path.join(path.dirname(adminFile), 'index.html')).href;
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, cond, detail = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const PW = 'bantay sa tanawan 9';
const SECTIONS = ['overview', 'people', 'review', 'activity', 'site', 'system'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
  const errors = [];
  const watch = (pg) => {
    pg.on('pageerror', (e) => errors.push(e.message));
    pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    pg.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
  };
  const page = await browser.newPage();
  watch(page);
  await page.setViewport({ width: 1366, height: 900 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('tanaw.intro', '1'); } catch (e) { /* ignore */ } });

  const open = async (url) => { await page.goto('about:blank'); await page.goto(url, { waitUntil: 'load' }); await wait(450); };
  const go = async (section, ms = 350) => { await page.evaluate((s) => { location.hash = s; }, section); await wait(ms); };
  const val = (fn, ...a) => page.evaluate(fn, ...a);
  const clear = async (sel) => { await page.evaluate((s) => { const i = document.querySelector(s); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }, sel); };
  const fill = async (sel, text) => { await clear(sel); await page.type(sel, text); };
  const submit = async (sel, ms = 900) => { await page.evaluate((s) => document.querySelector(s).requestSubmit(), sel); await wait(ms); };
  const dialogAction = async (i) => { await val((n) => document.querySelector(`dialog[open] [data-dialog-action="${n}"]`).click(), i); await wait(250); };
  const closeDialogs = async () => { await val(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close('x'))); await wait(120); };
  const axe = async (label) => {
    await page.addScriptTag({ content: axeSrc }).catch(() => {});
    const v = await val(async () => {
      const out = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] });
      return out.violations.map((x) => `${x.id} (${x.impact}): ${x.nodes.slice(0, 2).map((n) => `${n.target.join(' ')} ${(n.failureSummary || '').split('\n')[1] || ''}`).join(' | ')}`);
    });
    ok(`axe: ${label}`, v.length === 0, v.join(' ;; '));
  };

  await open(base);
  await val(() => localStorage.clear());
  await open(base);

  /* ---------- A separate page ---------- */
  const sep = await val(() => ({ header: !!document.querySelector('.site-header'), tabbar: !!document.querySelector('.tabbar'), footer: !!document.querySelector('.site-footer'), robots: document.querySelector('meta[name="robots"]').content, title: document.title, file: location.pathname.split('/').pop() }));
  ok('separate: its own HTML page, with none of the public site\'s header, tab bar or footer', sep.file === 'admin.html' && !sep.header && !sep.tabbar && !sep.footer, JSON.stringify(sep));
  ok('separate: asks search engines not to list it', /noindex/.test(sep.robots));
  const publicScripts = await (async () => {
    const pg = await browser.newPage();
    await pg.goto(site, { waitUntil: 'load' });
    const r = await pg.evaluate(() => ({ admin: !!(Tanaw.backend && Tanaw.backend.admin), scripts: [...document.scripts].some((s) => /admin\//.test(s.src)), link: [...document.querySelectorAll('a')].some((a) => /admin\.html/.test(a.getAttribute('href') || '')) }));
    await pg.close();
    return r;
  })();
  ok('separate: the public site does not load the console\'s code, or link to it for guests', !publicScripts.admin && !publicScripts.scripts && !publicScripts.link, JSON.stringify(publicScripts));

  /* ---------- First-time setup: no built-in password ---------- */
  ok('setup: with no administrator, it offers first-time setup, not a default password', await val(() => /first administrator/i.test(document.querySelector('h1').textContent) && !!document.querySelector('[data-console-setup]')));
  ok('setup: says plainly it is a demonstration and what this gate is not', await val(() => /Demonstration/.test(document.querySelector('.c-gate__demo').textContent) && /protects nothing/.test(document.querySelector('.c-gate__truth').textContent)));
  await axe('setup form');
  await submit('[data-console-setup]', 150);
  ok('setup: validates like the public forms', (await val(() => document.querySelectorAll('[data-error-summary] a').length)) === 3);
  await axe('setup form with errors');
  await fill('#c-name', 'Maria Santos');
  await fill('#c-email', 'admin@example.com');
  await fill('#c-password', PW);
  await fill('#c-confirm', PW);
  await submit('[data-console-setup]');
  ok('setup: creates an administrator and opens the console', await val(() => Tanaw.auth.isAdmin() && !!document.querySelector('.rail')));
  ok('setup: focus moves on from the form that went away, to the heading', await val(() => document.activeElement.tagName === 'H1'));
  ok('setup: only once', (await val(async () => { try { await Tanaw.backend.createFirstAdmin({ name: 'Second', email: 'second@example.com', password: 'another passphrase 1' }); return 'allowed'; } catch (e) { return e.message; } })) !== 'allowed');

  /* ---------- Layout and navigation ---------- */
  const layout = await val(() => ({ h1: document.querySelectorAll('h1').length, links: [...document.querySelectorAll('.rail__link')].map((a) => a.getAttribute('href')), strip: /not a security boundary/.test(document.querySelector('.c-strip').textContent), current: document.querySelector('.rail__link[aria-current]').textContent.trim(), look: document.documentElement.dataset.console }));
  ok('layout: its own navigation, with a section per job', layout.links.join() === SECTIONS.map((s) => `#/${s}`).join() && layout.current === 'Overview', layout.links.join(' '));
  ok('layout: a persistent note that this is not a security boundary', layout.strip);
  ok('layout: its own look', layout.look === 'paper');
  for (const s of SECTIONS) {
    await go(`#/${s}`);
    // eslint-disable-next-line no-await-in-loop
    const m = await val(() => ({ h1: document.querySelectorAll('h1').length, focus: document.activeElement.tagName, title: document.title, cur: document.querySelector('.rail__link[aria-current]').getAttribute('href') }));
    ok(`navigation: ${s} opens, one heading, focus on it`, m.h1 === 1 && m.focus === 'H1' && m.cur === `#/${s}` && /Tanawan/.test(m.title), JSON.stringify(m));
  }
  await go('#/nothing-here');
  ok('navigation: an unknown section says so', await val(() => /not found/i.test(document.querySelector('h1').textContent) && !!document.querySelector('.c-page a[href="#/overview"]')));

  // A fresh page starts at its top, so the skip link and the rail come first.
  await open(`${base}#/overview`);
  ok('keyboard: a fresh page leaves focus at the top', await val(() => document.activeElement === document.body));
  await page.keyboard.press('Tab'); await wait(60);
  ok('keyboard: the first Tab reaches the skip link', await val(() => document.activeElement.matches('.skip-link')));
  await page.keyboard.press('Tab'); await wait(60);
  ok('keyboard: the next one reaches the rail', await val(() => !!document.activeElement.closest('.rail')));
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await wait(60);
  await page.keyboard.press('Enter'); await wait(80);
  ok('keyboard: the skip link moves into the section', await val(() => document.activeElement.id === 'console-main'));

  /* ---------- Overview: real numbers ---------- */
  await go('#/overview');
  const ov = await val(() => {
    const D = Tanaw.data;
    const groups = Tanaw.console.catalog();
    const by = (id) => groups.find((g) => g.id === id).items.length;
    return { fig: document.querySelector('.ov-hero__fig').textContent.trim(), of: document.querySelector('.ov-hero__of').textContent, total: groups.reduce((n, g) => n + g.items.length, 0), lessons: by('lessons') === D.lessonOrder().length, words: by('words') === D.signs.length, stories: by('stories') === D.storyList.length, letters: by('hand-letters') === D.handLetters.filter((l) => !l.gap).length, band: document.querySelectorAll('.board__band').length, worlds: groups.map((g) => g.world) };
  });
  ok('overview: the headline is how much a Deaf reviewer has looked at, and it starts at zero', ov.fig === '0' && ov.of.includes(`of ${ov.total} content items`), `${ov.fig} of ${ov.total}`);
  ok('overview: counts come from the site\'s own data', ov.lessons && ov.words && ov.stories && ov.letters);
  ok('overview: laid out as the two worlds, with the log on the seam', ov.band === 2 && (await val(() => !!document.querySelector('.board__seam .tl'))));
  const chart = await val(() => ({ n: document.querySelectorAll('.bars__col').length, tabbable: document.querySelectorAll('.bars__col[tabindex="0"]').length, label: document.querySelector('.bars__col:last-child').getAttribute('aria-label'), table: document.querySelectorAll('.bars__table tbody tr').length }));
  ok('chart: 14 days, one tab stop, named bars, and a table with the same numbers', chart.n === 14 && chart.tabbable === 1 && /1 login/.test(chart.label) && chart.table === 14, JSON.stringify(chart));
  await page.focus('.bars__col[tabindex="0"]'); await wait(100);
  const tip = await val(() => { const t = document.querySelector('[data-bars-tip]'); return { hidden: t.hidden, text: t.textContent }; });
  ok('chart: keyboard focus shows the same tooltip as hover', !tip.hidden && /1 login/.test(tip.text), tip.text);
  await page.keyboard.press('ArrowLeft'); await wait(80);
  ok('chart: arrow keys move between days', await val(() => { const c = [...document.querySelectorAll('.bars__col')]; return document.activeElement === c[12] && c[12].tabIndex === 0 && c[13].tabIndex === -1; }));
  await val(() => document.activeElement.blur());
  await axe('overview');

  /* ---------- People ---------- */
  await go('#/people');
  await axe('people');
  await val(() => document.querySelector('[data-add-account]').click()); await wait(200);
  await submit('[data-add]', 150);
  ok('people: adding an account validates', (await val(() => document.querySelectorAll('dialog[open] [data-error-summary] a').length)) === 2);
  await axe('add-account dialog with errors');
  await fill('#add-name', 'Ana Reyes');
  await fill('#add-email', 'ana@example.com');
  await submit('[data-add]', 900);
  const temp = await val(() => (document.querySelector('[data-temp]') || {}).textContent);
  ok('people: a new account gets a temporary password, shown once', !!temp && temp.length >= 8, temp);
  await axe('temporary password dialog');
  await closeDialogs();
  await wait(300);
  const row = await val(() => { const tr = [...document.querySelectorAll('tbody tr')].find((t) => /Ana Reyes/.test(t.textContent)); return { must: /Temporary password/.test(tr.textContent), role: /Learner/.test(tr.textContent) }; });
  ok('people: it appears as a learner who must choose a password', row.must && row.role, JSON.stringify(row));

  // Search and sort.
  await val(() => document.querySelector('[data-add-samples]').click()); await wait(1600);
  ok('people: sample learners are labeled as samples', await val(() => [...document.querySelectorAll('tbody tr')].filter((t) => /Sample learner/.test(t.textContent)).every((t) => t.querySelector('.c-tag') && /Sample/.test(t.textContent)) && document.querySelectorAll('tbody tr').length === 6));
  await page.type('#p-q', 'ana'); await wait(250);
  ok('people: search narrows the list', (await val(() => document.querySelectorAll('tbody tr').length)) === 1);
  await clear('#p-q'); await wait(250);
  await page.select('#p-role', 'admin'); await wait(100);
  ok('people: role filter works', (await val(() => document.querySelectorAll('tbody tr').length)) === 1);
  await page.select('#p-role', 'all'); await wait(100);
  await val(() => document.querySelector('[data-sort="name"]').click()); await wait(100);
  ok('people: sorting says its direction, and keeps focus', await val(() => document.querySelector('th[aria-sort="descending"] [data-sort="name"]') === document.activeElement));

  // Managing someone.
  const manage = async (name) => { await val((n) => [...document.querySelectorAll('[data-manage]')].find((b) => b.getAttribute('aria-label') === `Manage ${n}`).click(), name); await wait(250); };
  await manage('Ana Reyes');
  await axe('manage dialog');
  await page.select('#m-role', 'admin'); await wait(300);
  ok('people: role can be changed', (await val(() => JSON.parse(localStorage.getItem('tanaw.accounts.v1')).users.find((u) => u.name === 'Ana Reyes').role)) === 'admin');
  await page.select('#m-role', 'learner'); await wait(300);
  await closeDialogs(); await wait(250);
  await manage('Maria Santos');
  ok('people: you cannot disable or delete yourself from here', await val(() => !document.querySelector('dialog[open] [data-toggle-status]') && !document.querySelector('dialog[open] [data-remove]')));
  await page.select('#m-role', 'learner'); await wait(350);
  ok('people: the last administrator cannot be removed', await val(() => JSON.parse(localStorage.getItem('tanaw.accounts.v1')).users.find((u) => u.name === 'Maria Santos').role === 'admin' && document.querySelector('#m-role').value === 'admin'));
  await closeDialogs(); await wait(200);
  await manage('Ana Reyes');
  await val(() => document.querySelector('dialog[open] [data-toggle-status]').click()); await wait(350);
  ok('people: an account can be disabled', await val(() => JSON.parse(localStorage.getItem('tanaw.accounts.v1')).users.find((u) => u.name === 'Ana Reyes').status === 'disabled'));
  // A disabled account is refused on the public site, then allowed again.
  const refused = await val(async (t) => { try { await Tanaw.backend.login({ email: 'ana@example.com', password: t }); return 'allowed'; } catch (e) { return e.message; } }, temp);
  ok('people: a disabled account cannot log in', /disabled/.test(refused), refused);
  await val(() => Tanaw.auth.user()); // the test above must not have changed who is logged in
  ok('people: and the failed attempt did not disturb this session', await val(() => Tanaw.auth.isAdmin()));
  await manage('Ana Reyes');
  await val(() => document.querySelector('dialog[open] [data-toggle-status]').click()); await wait(350);
  await manage('Ana Reyes');
  await val(() => document.querySelector('dialog[open] [data-reset]').click()); await wait(900);
  const temp2 = await val(() => document.querySelector('[data-temp]').textContent);
  ok('people: a password reset issues a new temporary password', !!temp2 && temp2 !== temp);
  await closeDialogs(); await wait(250);
  await manage('Sample learner 1');
  await val(() => document.querySelector('dialog[open] [data-remove]').click()); await wait(250);
  await axe('delete confirmation');
  await val(() => [...document.querySelectorAll('dialog[open] [data-dialog-action]')].pop().click()); await wait(450);
  await closeDialogs(); await wait(200);
  ok('people: an account can be deleted, after confirming', await val(() => !JSON.parse(localStorage.getItem('tanaw.accounts.v1')).users.some((u) => u.name === 'Sample learner 1')));
  await val(() => document.querySelector('[data-remove-samples]').click()); await wait(350);
  ok('people: sample accounts are removed in one go', await val(() => !JSON.parse(localStorage.getItem('tanaw.accounts.v1')).users.some((u) => u.sample)));

  /* ---------- Review ledger ---------- */
  await go('#/review');
  ok('review: starts empty, with no sample approvals', await val(() => !localStorage.getItem('tanaw.review.v1') && /0/.test(document.querySelector('.rsum__legend li').textContent)));
  await axe('review ledger');
  await go('#/review?group=stories');
  ok('review: a group link opens filtered to that group', (await val(() => document.querySelectorAll('.rrow').length)) === (await val(() => Tanaw.data.storyList.length)));
  await go('#/review?group=hand-letters');
  await page.select('#rv-status', 'deaf'); await wait(120);
  ok('review: filters to nothing say so', await val(() => /Nothing matches/.test(document.querySelector('[data-list]').textContent)));
  await page.select('#rv-status', 'all'); await wait(120);
  await val(() => document.querySelector('[data-record]').click()); await wait(250);
  await axe('review dialog');
  await val(() => document.querySelector('[data-review-form] input[value="deaf"]').click());
  await dialogAction(1);
  ok('review: "reviewed by a Deaf reviewer" cannot be recorded without naming them', await val(() => /Name the Deaf reviewer/.test(document.querySelector('#rv-reviewer-error').textContent) && !!document.querySelector('dialog[open]')));
  await val(() => { const f = document.querySelector('[data-review-form]'); f.querySelector('input[value="team"]').click(); f.reviewer.value = 'Group 3 team'; f.note.value = '=SUM(1,1) note'; });
  await dialogAction(1);
  await wait(250);
  ok('review: a record is saved and shown', await val(() => /Checked by the team/.test(document.querySelector('.rrow').textContent) && /Group 3 team/.test(document.querySelector('.rrow').textContent)));
  await page.type('#rv-q', 'group 3'); await wait(250);
  ok('review: search finds reviewers too', (await val(() => document.querySelectorAll('.rrow').length)) === 1);
  await val(() => { window.__dl = null; Tanaw.util.download = (name, data) => { window.__dl = { name, data }; }; document.querySelector('[data-export]').click(); });
  await wait(120);
  const csv = await val(() => window.__dl);
  ok('review: the CSV download neutralizes spreadsheet formulas', !!csv && /\.csv$/.test(csv.name) && csv.data.includes('"\'=SUM(1,1) note"'), csv && csv.name);
  await go('#/overview');
  ok('review: the overview counts the team\'s check, and the Deaf-reviewer headline stays at zero', await val(() => document.querySelector('.ov-hero__fig').textContent.trim() === '0' && /1 by the team/.test(document.querySelector('.inv').textContent)));
  ok('review: the log shows it on Learning\'s side of the seam', await val(() => !!document.querySelector('.tl__item--learn')));
  const tab = await browser.newPage();
  watch(tab);
  await tab.goto(`${site}#/lab`, { waitUntil: 'load' });
  await wait(900);
  const lab = await tab.evaluate(() => document.querySelector('main').innerText);
  ok('review: recording a review changes nothing on the public site: the 3D hand stays labeled', /experimental/i.test(lab), lab.match(/experimental[^.]*/i) && lab.match(/experimental[^.]*/i)[0].slice(0, 60));

  /* ---------- Activity ---------- */
  await go('#/activity');
  const act = await val(() => ({ rows: document.querySelectorAll('.log__row').length, first: document.querySelector('.log__what').textContent }));
  ok('activity: records what happened, newest first', act.rows >= 10 && act.first === 'Review recorded', JSON.stringify(act));
  await axe('activity');
  await page.select('#a-kind', 'reviews'); await wait(120);
  ok('activity: filters by kind', (await val(() => document.querySelectorAll('.log__row').length)) === 1);
  await page.select('#a-kind', 'all'); await wait(120);
  await val(() => { window.__dl = null; document.querySelector('[data-export]').click(); }); await wait(120);
  ok('activity: downloads as CSV', await val(() => /Time,|"Time"/.test(window.__dl.data)));

  /* ---------- Site controls, seen live on the public site ---------- */
  await go('#/site');
  await axe('site controls');
  await submit('[data-notice]', 150);
  ok('site: an empty notice is refused', await val(() => /Write the message/.test(document.querySelector('#s-text-error').textContent)));
  await fill('#s-text', 'Deaf Awareness Week starts on November 10.');
  await submit('[data-notice]', 450);
  await wait(200);
  ok('site: a published notice appears at once on the public site in another tab', await tab.evaluate(() => /Deaf Awareness Week/.test((document.querySelector('.app-notice--site') || {}).textContent || '')));
  await val(() => document.querySelector('[data-remove-notice]').click()); await wait(450);
  ok('site: and disappears when removed', await tab.evaluate(() => !document.querySelector('.app-notice--site')));
  await val(() => document.querySelector('input[name="registration"][value="closed"]').click()); await wait(350);
  // This tab is logged in, so #/register would send it to the account page; accounts.js checks the closed page itself.
  ok('site: closing registration reaches the public site at once', await tab.evaluate(() => Tanaw.auth.registrationOpen() === false));
  await val(() => document.querySelector('input[name="registration"][value="open"]').click()); await wait(300);
  await tab.close();

  /* ---------- System ---------- */
  await go('#/system');
  await axe('system');
  const sys = await val(() => document.querySelector('.c-page').innerText);
  ok('system: states this page is not a security boundary, and where a server must connect', /not a security boundary/i.test(sys) && /every request/i.test(sys) && /docs\/backend-integration\.md/.test(sys));
  await val(() => { window.__dl = null; document.querySelector('[data-export]').click(); }); await wait(250);
  const backup = await val(() => window.__dl);
  const parsed = JSON.parse(backup.data);
  ok('system: a backup holds accounts and the ledger, but no live sessions', parsed.kind === 'console-backup' && parsed.accounts.users.length === 2 && parsed.accounts.users.every((u) => u.tokens.length === 0) && Object.keys(parsed.reviews).length === 1);
  const restore = async (text) => {
    await val((t) => {
      const input = document.querySelector('[data-import]');
      const dt = new DataTransfer();
      dt.items.add(new File([t], 'backup.json', { type: 'application/json' }));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, text);
    await wait(250);
    await val(() => [...document.querySelectorAll('dialog[open] [data-dialog-action]')].pop().click());
    await wait(500);
  };
  await restore('this is not json');
  ok('system: a bad file is refused with a clear message', await val(() => /not valid JSON/.test(document.querySelector('[data-import-error]').textContent)));
  await restore(JSON.stringify({ app: 'tanaw', kind: 'console-backup', accounts: { users: [] } }));
  ok('system: a backup with no administrator is refused', await val(() => /no active administrator/.test(document.querySelector('[data-import-error]').textContent) && Tanaw.auth.isAdmin()));
  await val(() => { const d = JSON.parse(localStorage.getItem('tanaw.accounts.v1')); d.users = d.users.filter((u) => u.role === 'admin'); localStorage.setItem('tanaw.accounts.v1', JSON.stringify(d)); });
  await restore(backup.data);
  ok('system: a good backup restores, and the administrator stays logged in', await val(() => JSON.parse(localStorage.getItem('tanaw.accounts.v1')).users.length === 2 && Tanaw.auth.isAdmin()));

  /* ---------- Display ---------- */
  await go('#/overview');
  await val(() => document.querySelector('[data-console-display]').click()); await wait(200);
  await axe('display dialog');
  await val(() => document.querySelector('dialog[open] input[name="look"][value="night"]').click()); await wait(120);
  ok('display: night watch applies at once', (await val(() => document.documentElement.dataset.console)) === 'night');
  await closeDialogs();
  await open(base);
  ok('display: and is remembered, without changing the public site\'s theme', await val(() => document.documentElement.dataset.console === 'night' && Tanaw.store.state.settings.theme === 'dark'));
  for (const s of SECTIONS) {
    await go(`#/${s}`);
    // eslint-disable-next-line no-await-in-loop
    await axe(`night watch: ${s}`);
  }
  await val(() => localStorage.setItem('tanaw.console.look', 'paper'));
  await val(() => Tanaw.settings.set('contrast', 'high'));
  await val(() => Tanaw.store.flush());
  await open(base);
  ok('display: high contrast, shared with the site, applies here', (await val(() => document.documentElement.dataset.contrast)) === 'high');
  for (const s of SECTIONS) {
    await go(`#/${s}`);
    // eslint-disable-next-line no-await-in-loop
    await axe(`high contrast: ${s}`);
  }
  await val(() => Tanaw.settings.set('contrast', 'standard'));
  await val(() => Tanaw.store.flush());

  /* ---------- Phone ---------- */
  for (const [w, h] of [[390, 844], [320, 640], [820, 1180]]) {
    await page.setViewport({ width: w, height: h, hasTouch: w < 800, isMobile: w < 800 });
    for (const s of SECTIONS) {
      await go(`#/${s}`, 300);
      // eslint-disable-next-line no-await-in-loop
      const over = await val(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(`${w} px ${s}: no sideways scrolling`, over <= 1, `${over}`);
    }
  }
  await val(() => { Tanaw.settings.set('textScale', 1.5); Tanaw.store.flush(); });
  for (const [w, h] of [[1024, 768], [390, 844]]) {
    await page.setViewport({ width: w, height: h, hasTouch: w < 800, isMobile: w < 800 });
    for (const s of SECTIONS) {
      await go(`#/${s}`, 300);
      // eslint-disable-next-line no-await-in-loop
      const over = await val(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(`${w} px at 150% text, ${s}: no sideways scrolling`, over <= 1, `${over}`);
    }
  }
  await val(() => { Tanaw.settings.set('textScale', 1); Tanaw.store.flush(); });
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await go('#/people', 300);
  await axe('phone: people');
  await page.setViewport({ width: 1366, height: 900, hasTouch: false, isMobile: false });
  await go('#/overview');

  /* ---------- Across the two pages ---------- */
  await open(`${site}#/`);
  ok('session: the public site knows the administrator', await val(() => Tanaw.auth.isAdmin()));
  await val(() => document.querySelector('[data-account-toggle]').click()); await wait(120);
  ok('session: the account menu links to the console, for an administrator only', await val(() => !!document.querySelector('#account-menu a[href="admin.html"]')));
  await open(base);
  ok('session: the console opens already logged in, on the same browser storage', await val(() => !!document.querySelector('.rail')));

  /* ---------- Logging out, and who is refused ---------- */
  await val(() => document.querySelector('.rail [data-logout]').click()); await wait(700);
  ok('logout: a clear logged-out state, on the gate', await val(() => /logged out of the console/.test(document.querySelector('.c-ok').textContent) && !document.querySelector('.rail') && !localStorage.getItem('tanaw.session.v1')));
  await axe('gate after logging out');
  await submit('[data-console-login]', 150);
  ok('login: validates', (await val(() => document.querySelectorAll('[data-error-summary] a').length)) === 2);
  await fill('#c-email', 'admin@example.com');
  await fill('#c-password', 'wrong password');
  await submit('[data-console-login]', 1000);
  ok('login: a wrong password gets a general message', await val(() => /not right/.test(document.querySelector('[data-error-summary]').textContent)));
  await axe('gate after a wrong password');

  // A learner who logs in here is refused, clearly.
  await val(async () => { const d = JSON.parse(localStorage.getItem('tanaw.accounts.v1')); return d.users.length; });
  await fill('#c-email', 'admin@example.com');
  await fill('#c-password', PW);
  await submit('[data-console-login]', 1000);
  ok('login: focus moves on from the form that went away, to the heading', await val(() => document.activeElement.tagName === 'H1' && !!document.querySelector('.rail')));
  await go('#/people');
  await val(() => document.querySelector('[data-add-account]').click()); await wait(200);
  await fill('#add-name', 'Luz Dela Cruz');
  await fill('#add-email', 'luz@example.com');
  await submit('[data-add]', 900);
  const luzTemp = await val(() => document.querySelector('[data-temp]').textContent);
  await closeDialogs();
  await val(() => document.querySelector('.rail [data-logout]').click()); await wait(600);
  await fill('#c-email', 'luz@example.com');
  await fill('#c-password', luzTemp);
  await submit('[data-console-login]', 1000);
  ok('gate: a temporary password is sent to choose a new one first', await val(() => /Choose a new password/.test(document.querySelector('h1').textContent) && !document.querySelector('.rail')));
  await open(`${site}#/journey`);
  ok('public site: a temporary password also leads to choosing a new one', (await val(() => location.hash)) === '#/account?change=1');
  await fill('#acc-current', luzTemp);
  await fill('#acc-next', 'sariling susi ni luz');
  await fill('#acc-confirm', 'sariling susi ni luz');
  await submit('[data-password]', 900);
  await open(base);
  ok('gate: a learner is refused, with no way into the console\'s screens', await val(() => /not an administrator/.test(document.querySelector('h1').textContent) && !document.querySelector('.rail') && !document.querySelector('.c-page')));
  await axe('gate refusing a learner');
  await go('#/people');
  ok('gate: changing the address does not get past it', await val(() => !document.querySelector('.rail')));
  await val(() => document.querySelector('.c-gate [data-logout]').click()); await wait(600);

  // Demoting yourself takes effect at once, and logging out elsewhere returns to the gate.
  await fill('#c-email', 'admin@example.com');
  await fill('#c-password', PW);
  await submit('[data-console-login]', 1000);
  const other = await browser.newPage();
  watch(other);
  await other.goto(`${site}#/`, { waitUntil: 'load' });
  await wait(400);
  await other.evaluate(() => Tanaw.auth.logout());
  await wait(600);
  await other.close();
  ok('tabs: logging out in another tab closes the console here too', await val(() => !document.querySelector('.rail') && !!document.querySelector('[data-console-login]')));
  // Logging in here while the public site is open in another tab: that tab must not end the new session.
  const siteTab = await browser.newPage();
  watch(siteTab);
  await siteTab.goto(`${site}#/`, { waitUntil: 'load' });
  await wait(400);
  await page.bringToFront();
  await fill('#c-email', 'admin@example.com');
  await fill('#c-password', PW);
  await submit('[data-console-login]', 1000);
  await wait(600);
  ok('tabs: logging in with the public site open in another tab keeps the console open, in both tabs', (await val(() => Tanaw.auth.isAdmin() && !!document.querySelector('.rail'))) && (await siteTab.evaluate(() => Tanaw.auth.isAdmin())));
  await siteTab.close();
  await val(() => Tanaw.auth.logout()); await wait(600);

  /* ---------- Starting again ---------- */
  await fill('#c-email', 'admin@example.com');
  await fill('#c-password', PW);
  await submit('[data-console-login]', 1000);
  await go('#/system');
  await val(() => document.querySelector('[data-reset-all]').click()); await wait(200);
  await axe('delete everything dialog');
  await fill('#reset-word', 'delete');
  await submit('[data-reset]', 150);
  ok('reset: needs the exact word', await val(() => /capital letters/.test(document.querySelector('#reset-word-error').textContent) && !!localStorage.getItem('tanaw.accounts.v1')));
  await val(() => Tanaw.store.update((st) => { st.progress.xp = 0; }));
  await fill('#reset-word', 'DELETE');
  await submit('[data-reset]', 800);
  ok('reset: deletes everything and returns to first-time setup', await val(() => !localStorage.getItem('tanaw.accounts.v1') && !localStorage.getItem('tanaw.review.v1') && !localStorage.getItem('tanaw.session.v1') && !!document.querySelector('[data-console-setup]')));

  // First-time setup with the public site open in another tab, as people usually work.
  const siteTab2 = await browser.newPage();
  watch(siteTab2);
  await siteTab2.goto(`${site}#/`, { waitUntil: 'load' });
  await wait(400);
  await page.bringToFront();
  await fill('#c-name', 'Maria Santos');
  await fill('#c-email', 'admin@example.com');
  await fill('#c-password', PW);
  await fill('#c-confirm', PW);
  await submit('[data-console-setup]');
  await wait(600);
  ok('tabs: first-time setup with the public site open in another tab opens the console and keeps it open', (await val(() => Tanaw.auth.isAdmin() && !!document.querySelector('.rail') && !/Something went wrong/.test(document.querySelector('h1').textContent))) && (await siteTab2.evaluate(() => Tanaw.auth.isAdmin())));
  await siteTab2.close();

  ok('no page errors, warnings or failed loads during all of this', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
