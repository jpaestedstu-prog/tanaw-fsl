// Login, registration, logout and the account page, within the frontend-only scope.
// Usage: node accounts.js <index.html>
const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = pathToFileURL(path.resolve(process.argv[2])).href;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, cond, detail = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const PW = 'liwanag sa dagat 7';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const errors = [];
  const watch = (page) => {
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  };
  const page = await browser.newPage();
  watch(page);
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('tanaw.intro', '1'); } catch (e) { /* ignore */ } });

  const open = async (hash) => { await page.goto('about:blank'); await page.goto(base + hash, { waitUntil: 'load' }); await wait(500); };
  // Clicks do not reach the page during a view transition, so navigation waits for the end of one.
  const settled = () => page.waitForFunction(() => !document.documentElement.dataset.vt, { timeout: 8000 }).catch(() => {});
  const go = async (hash, ms = 450) => { await page.evaluate((h) => { location.hash = h; }, hash); await wait(ms); await settled(); };
  const hash = () => page.evaluate(() => location.hash);
  const val = (fn, ...a) => page.evaluate(fn, ...a);
  const clear = async (sel) => { await page.evaluate((s) => { const i = document.querySelector(s); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }, sel); };
  const fill = async (sel, text) => { await clear(sel); await page.type(sel, text); };
  const submit = async (sel, ms = 1000) => { await page.evaluate((s) => document.querySelector(s).requestSubmit(), sel); await wait(ms); };
  const register = async (name, email, password = PW) => {
    await go('#/register');
    await fill('#reg-name', name);
    await fill('#reg-email', email);
    await fill('#reg-password', password);
    await fill('#reg-confirm', password);
    await submit('[data-register]');
  };
  const login = async (email, password = PW) => {
    await go('#/login');
    await fill('#login-email', email);
    await fill('#login-password', password);
    await submit('[data-login]', 900);
  };
  const logout = async () => { await val(() => Tanaw.auth.logout()); await wait(500); };

  await open('#/');
  await val(() => localStorage.clear());
  await open('#/');

  /* ---------- A guest ---------- */
  ok('guest: the header offers Log in, and everything works without an account', await val(() => { const a = document.querySelector('#account-slot > a'); return !!a && a.getAttribute('href') === '#/login' && !document.querySelector('[data-account-toggle]'); }));

  /* ---------- Login form ---------- */
  await go('#/login');
  ok('login: says it is a demonstration, not secure sign-in', await val(() => /not secure sign-in/i.test(document.querySelector('.gate__demo').textContent)));
  ok('login: fields have labels and the right autocomplete', await val(() => { const e = document.querySelector('#login-email'); const p = document.querySelector('#login-password'); return !!document.querySelector('label[for="login-email"]') && e.autocomplete === 'username' && p.autocomplete === 'current-password' && e.type === 'email'; }));
  await page.type('#login-email', 'nobody'); await page.keyboard.press('Tab'); await wait(120);
  ok('login: leaving a bad email explains the problem', await val(() => /like name@example.com/.test(document.querySelector('#login-email-error').textContent) && document.querySelector('#login-email').getAttribute('aria-invalid') === 'true'));
  await page.type('#login-email', '@example.com'); await wait(120);
  ok('login: the error clears as soon as it is fixed', await val(() => document.querySelector('#login-email-error').hidden && !document.querySelector('#login-email').hasAttribute('aria-invalid')));
  await clear('#login-email');
  await submit('[data-login]', 200);
  const summary = await val(() => ({ text: document.querySelector('[data-error-summary]').innerText, focused: document.activeElement.matches('[data-error-summary]'), links: document.querySelectorAll('[data-error-summary] a').length }));
  ok('login: an empty submit lists every error, and focus moves to the list', summary.focused && summary.links === 2, summary.text.replace(/\s+/g, ' '));
  await val(() => document.querySelector('[data-error-summary] a').click()); await wait(120);
  ok('login: a link in the list moves focus to its field, and keeps the page', (await val(() => document.activeElement.id)) === 'login-email' && (await hash()) === '#/login');

  /* ---------- Password visibility and the eye ---------- */
  await page.focus('#login-password'); await wait(120);
  ok('eye: looks away while a hidden password is typed', await val(() => document.querySelector('.gate-eye').classList.contains('is-shut')));
  await page.click('[data-reveal-password]'); await wait(120);
  const shown = await val(() => { const b = document.querySelector('[data-reveal-password]'); return { type: document.querySelector('#login-password').type, pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label'), wide: document.querySelector('.gate-eye').classList.contains('is-wide'), focus: document.activeElement.id }; });
  ok('password: Show reveals it, says so, and keeps focus in the field', shown.type === 'text' && shown.pressed === 'true' && shown.label === 'Hide password' && shown.focus === 'login-password', JSON.stringify(shown));
  ok('eye: opens wide when the password is shown', shown.wide);
  await page.click('[data-reveal-password]'); await wait(120);
  ok('password: Hide hides it again', (await val(() => document.querySelector('#login-password').type)) === 'password');
  await val(() => document.querySelector('#login-password').dispatchEvent(new KeyboardEvent('keydown', { key: 'A', modifierCapsLock: true, bubbles: true }))); await wait(50);
  ok('password: warns when Caps Lock is on', await val(() => !document.querySelector('#login-password-caps').hidden));

  /* ---------- Registration ---------- */
  await go('#/register');
  await submit('[data-register]', 200);
  ok('register: an empty submit lists all four problems', (await val(() => document.querySelectorAll('[data-error-summary] a').length)) === 4);
  await fill('#reg-name', 'Ana Reyes');
  await fill('#reg-email', 'ana@example.com');
  await fill('#reg-password', 'short'); await wait(80);
  const weak = await val(() => ({ text: document.querySelector('.strength__text').textContent, length: document.querySelector('[data-rule="length"]').classList.contains('is-met') }));
  ok('register: too short a password is flagged live', !weak.length && /Not allowed/.test(weak.text), JSON.stringify(weak));
  await fill('#reg-password', 'password123'); await wait(80);
  ok('register: a common password is flagged', await val(() => !document.querySelector('[data-rule="guess"]').classList.contains('is-met')));
  await fill('#reg-password', 'reyes-family-2026'); await wait(80);
  ok('register: part of the person\'s name is flagged', await val(() => !document.querySelector('[data-rule="personal"]').classList.contains('is-met')));
  await fill('#reg-password', PW); await wait(80);
  ok('register: a long passphrase is good, with no forced symbols', await val(() => [...document.querySelectorAll('.rules li')].every((l) => l.classList.contains('is-met')) && /Strong|Good/.test(document.querySelector('.strength__text').textContent)));
  await fill('#reg-confirm', 'not the same');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await wait(120); // past the reveal button
  ok('register: a mismatch is flagged when a keyboard user moves on', await val(() => /do not match/.test(document.querySelector('#reg-confirm-error').textContent)));
  await fill('#reg-confirm', PW);
  await val(() => document.querySelector('[data-register]').requestSubmit());
  await wait(100);
  const busy = await val(() => { const b = document.querySelector('[data-register] [type="submit"]'); return b ? { busy: b.getAttribute('aria-busy'), disabled: b.disabled, text: b.textContent.trim() } : null; });
  ok('register: shows a loading state and cannot be sent twice', busy && busy.busy === 'true' && busy.disabled && /Creating/.test(busy.text), JSON.stringify(busy));
  await wait(1100);
  ok('register: a clear welcome, then a choice of worlds', await val(() => /Welcome, Ana Reyes/.test(document.querySelector('.gate__welcome-title').textContent) && document.querySelectorAll('.gate__worldbtn').length === 2));
  ok('register: focus moves to the welcome', await val(() => document.activeElement.matches('[data-result-title]')));
  const stored = await val((pw) => { const raw = localStorage.getItem('tanaw.accounts.v1'); const u = JSON.parse(raw).users[0]; return { plain: raw.includes(pw), hash: !!u.hash, salt: !!u.salt, role: u.role, iter: u.iter }; }, PW);
  ok('register: the password itself is never stored', !stored.plain && stored.hash && stored.salt && stored.iter >= 100000, JSON.stringify(stored));
  ok('register: a new account is a learner, never an administrator', stored.role === 'learner');
  ok('header: shows the person, not Log in', await val(() => /Ana Reyes/.test(document.querySelector('[data-account-toggle]').getAttribute('aria-label')) && !document.querySelector('#account-slot > a')));
  await open('#/');
  ok('session: survives a reload', await val(() => Tanaw.auth.user() && Tanaw.auth.user().name === 'Ana Reyes'));
  await go('#/login', 500);
  ok('session: the login page sends a logged-in person to their account', (await hash()) === '#/account');

  /* ---------- Account menu ---------- */
  await page.click('[data-account-toggle]'); await wait(120);
  const menu = await val(() => ({ open: !document.querySelector('#account-menu').hidden, expanded: document.querySelector('[data-account-toggle]').getAttribute('aria-expanded'), items: [...document.querySelectorAll('.account-menu__item')].map((x) => x.textContent.trim()) }));
  ok('menu: opens, with Log out', menu.open && menu.expanded === 'true' && menu.items.includes('Log out'), menu.items.join(', '));
  ok('menu: a learner has no administrator link', !menu.items.some((i) => /Administrator/.test(i)));
  await page.keyboard.press('Escape'); await wait(80);
  ok('menu: Escape closes it and returns focus', await val(() => document.querySelector('#account-menu').hidden && document.activeElement.hasAttribute('data-account-toggle')));

  /* ---------- Logout ---------- */
  await page.click('[data-account-toggle]'); await wait(100);
  await page.click('#account-menu [data-logout]'); await wait(800);
  ok('logout: lands on a clear logged-out page', (await hash()) === '#/login?out=1' && await val(() => /You have logged out/.test(document.querySelector('.gate__good').textContent)));
  ok('logout: the session is gone, and the header offers Log in again', await val(() => !localStorage.getItem('tanaw.session.v1') && !!document.querySelector('#account-slot > a')));
  await go('#/account', 500);
  ok('guard: the account page asks to log in, and remembers where you were going', (await hash()) === '#/login?next=%2Faccount');

  /* ---------- Login ---------- */
  await fill('#login-email', 'ana@example.com');
  await fill('#login-password', 'wrong password');
  await submit('[data-login]', 900);
  const wrong = await val(() => ({ text: document.querySelector('[data-error-summary]').textContent.trim(), cleared: document.querySelector('#login-password').value === '', invalid: document.querySelector('#login-password').getAttribute('aria-invalid'), hash: location.hash }));
  ok('login: a wrong password gives a general message, clears the field, and stays', /not right/.test(wrong.text) && wrong.cleared && wrong.invalid === 'true', wrong.text);
  await fill('#login-password', PW);
  await val(() => document.querySelector('[data-login]').requestSubmit());
  await wait(100);
  ok('login: shows a loading state', await val(() => { const b = document.querySelector('[data-login] [type="submit"]'); return !!b && b.getAttribute('aria-busy') === 'true'; }));
  await wait(700);
  ok('login: a clear success state', await val(() => /Welcome back, Ana Reyes/.test(document.querySelector('.gate__welcome-title').textContent)));
  await wait(1100);
  ok('login: returns to where you were going', (await hash()) === '#/account');
  await logout();

  await login('nobody@example.com', 'whatever pass');
  ok('login: an unknown email gets the same message as a wrong password', await val(() => /not right/.test(document.querySelector('[data-error-summary]').textContent)));

  await go('#/login?next=' + encodeURIComponent('//evil.example'));
  await fill('#login-email', 'ana@example.com');
  await fill('#login-password', PW);
  await submit('[data-login]', 1900);
  ok('login: refuses to redirect off the site', (await hash()) === '#/journey', await hash());
  await logout();

  /* ---------- Lockout ---------- */
  await go('#/login');
  for (let i = 0; i < 5; i++) {
    await fill('#login-email', 'ana@example.com');
    await fill('#login-password', `wrong try ${i}`);
    // eslint-disable-next-line no-await-in-loop
    await submit('[data-login]', 750);
  }
  await fill('#login-email', 'ana@example.com');
  await fill('#login-password', PW);
  await submit('[data-login]', 750);
  ok('lockout: five wrong tries lock the account, even for the right password', await val(() => /locked for/.test(document.querySelector('[data-error-summary]').textContent)), await val(() => document.querySelector('[data-error-summary]').textContent.trim()));
  const lockA = await val(() => Number((document.querySelector('[data-error-summary]').textContent.match(/(\d+) seconds/) || [])[1]));
  await wait(2100);
  const lockB = await val(() => Number((document.querySelector('[data-error-summary]').textContent.match(/(\d+) seconds/) || [])[1]));
  ok('lockout: the message counts down', lockB < lockA, `${lockA} → ${lockB}`);
  await val(() => { const d = JSON.parse(localStorage.getItem('tanaw.accounts.v1')); d.users[0].lockedUntil = 0; localStorage.setItem('tanaw.accounts.v1', JSON.stringify(d)); });

  /* ---------- Sessions ---------- */
  await go('#/login');
  await fill('#login-email', 'ana@example.com');
  await fill('#login-password', PW);
  await page.click('.gate__form input[name="remember"] + .check__box');
  await submit('[data-login]', 900);
  const kept = await val(() => { const s = JSON.parse(localStorage.getItem('tanaw.session.v1')); return { remember: s.remember, days: Math.round((s.expires - Date.now()) / 864e5) }; });
  ok('keep me logged in: lasts 30 days', kept.remember && kept.days === 30, JSON.stringify(kept));
  await wait(1100);
  await logout();
  await login('ana@example.com');
  const short = await val(() => Math.round((JSON.parse(localStorage.getItem('tanaw.session.v1')).expires - Date.now()) / 36e5));
  ok('otherwise: lasts 8 hours', short === 8, `${short} h`);
  await val(() => { const s = JSON.parse(localStorage.getItem('tanaw.session.v1')); s.expires = Date.now() - 1000; localStorage.setItem('tanaw.session.v1', JSON.stringify(s)); });
  await open('#/account');
  ok('expired: logs out and says why', (await val(() => !Tanaw.auth.user())) && /has ended/.test(await val(() => (document.querySelector('.gate__info') || {}).textContent || '')));
  await login('ana@example.com');
  await wait(1100);
  await val(() => { const s = JSON.parse(localStorage.getItem('tanaw.session.v1')); s.token = 'forged'; localStorage.setItem('tanaw.session.v1', JSON.stringify(s)); });
  await open('#/');
  ok('tampering: a made-up session token is refused', await val(() => !Tanaw.auth.user()));

  /* ---------- Other tabs ---------- */
  await login('ana@example.com');
  await wait(1100);
  const tab2 = await browser.newPage();
  watch(tab2);
  await tab2.goto(base + '#/journey', { waitUntil: 'load' });
  await wait(500);
  ok('tabs: a new tab is logged in too', await tab2.evaluate(() => !!Tanaw.auth.user()));
  await logout();
  await wait(500);
  ok('tabs: logging out here logs out the other tab', await tab2.evaluate(() => !Tanaw.auth.user() && !document.querySelector('[data-account-toggle]')));
  await tab2.close();

  /* ---------- Each person's progress ---------- */
  await val(() => Tanaw.store.update((st) => { st.progress.xp = 40; st.progress.lessons['what-is-fsl'] = { score: 1 }; st.settings.textScale = 1.1; }));
  await go('#/register');
  ok('progress: offers to keep what a guest has done, and says how much', await val(() => /40 XP, 1 lesson/.test(document.querySelector('#reg-bring-hint').textContent)));
  await fill('#reg-name', 'Ben Cruz');
  await fill('#reg-email', 'ben@example.com');
  await fill('#reg-password', PW);
  await fill('#reg-confirm', PW);
  await submit('[data-register]');
  ok('progress: moves into the new account', (await val(() => Tanaw.store.state.progress.xp)) === 40);
  await logout();
  const guestAfter = await val(() => ({ xp: Tanaw.store.state.progress.xp, scale: Tanaw.store.state.settings.textScale }));
  ok('progress: the next person at this computer does not see it', guestAfter.xp === 0, JSON.stringify(guestAfter));
  ok('progress: display settings stay for the guest (a large text size must not vanish)', guestAfter.scale === 1.1);
  await login('ana@example.com');
  await wait(1100);
  ok('progress: another account has its own', (await val(() => Tanaw.store.state.progress.xp)) === 0);
  await val(() => Tanaw.settings.set('theme', 'light'));
  await val(() => Tanaw.store.flush());
  await open('#/');
  ok('display: an account\'s theme is applied before first paint', (await val(() => document.documentElement.dataset.theme)) === 'light');
  await logout();
  ok('display: logging out returns to the guest\'s theme', (await val(() => document.documentElement.dataset.theme)) === 'dark');

  /* ---------- Account page ---------- */
  await login('ana@example.com');
  await wait(1100);
  await go('#/account');
  ok('account: says it is a demonstration', await val(() => /not secure sign-in/i.test(document.querySelector('.account__demo').textContent)));
  await fill('#acc-name', 'Ana R. O\'Neil "Bea"');
  await submit('[data-details]', 600);
  const named = await val(() => ({ h1: document.querySelector('h1').textContent, menu: document.querySelector('.account-menu__name').textContent }));
  ok('account: a new name shows everywhere, safely, quotes and all', named.h1 === 'Ana R. O\'Neil "Bea"' && named.menu === named.h1, JSON.stringify(named));
  await fill('#acc-name', '<img src=x onerror=alert(1)>');
  await submit('[data-details]', 300);
  ok('account: markup in a name is refused', await val(() => /ordinary punctuation/.test(document.querySelector('#acc-name-error').textContent) && !document.querySelector('.account img')));
  await fill('#acc-name', 'Ana Reyes');
  await submit('[data-details]', 500);
  await fill('#acc-email', 'ana.reyes@example.com'); await wait(80);
  ok('account: changing the email asks for the password', await val(() => !document.querySelector('.account__email-password').hidden));
  await submit('[data-details]', 300);
  ok('account: and insists on it', await val(() => /Enter your password/.test(document.querySelector('#acc-email-password-error').textContent)));
  await fill('#acc-email-password', PW);
  await submit('[data-details]', 700);
  ok('account: the email changes', await val(() => Tanaw.auth.user().email === 'ana.reyes@example.com'));
  await fill('#acc-current', 'wrong current');
  await fill('#acc-next', 'bagong susi ng tahanan');
  await fill('#acc-confirm', 'bagong susi ng tahanan');
  await submit('[data-password]', 800);
  ok('password change: needs the current password', await val(() => /not right/.test(document.querySelector('#acc-current-error').textContent)));
  await fill('#acc-current', PW);
  await submit('[data-password]', 800);
  await logout();
  await login('ana.reyes@example.com', PW);
  ok('password change: the old password no longer works', await val(() => /not right/.test(document.querySelector('[data-error-summary]').textContent)));
  await login('ana.reyes@example.com', 'bagong susi ng tahanan');
  await wait(1100);
  ok('password change: the new one does', await val(() => !!Tanaw.auth.user()));

  /* ---------- Delete ---------- */
  await go('#/account');
  const uid = await val(() => Tanaw.auth.user().id);
  await val(() => document.querySelector('[data-delete]').click()); await wait(200);
  await fill('#del-password', 'wrong one');
  await submit('[data-delete-form]', 700);
  ok('delete: needs the password', await val(() => /not right/.test(document.querySelector('#del-password-error').textContent) && !!Tanaw.auth.user()));
  await fill('#del-password', 'bagong susi ng tahanan');
  await submit('[data-delete-form]', 900);
  ok('delete: removes the account and its progress', await val((id) => !Tanaw.auth.user() && !localStorage.getItem(Tanaw.store.profileKey(id)) && !JSON.parse(localStorage.getItem('tanaw.accounts.v1')).users.some((u) => u.id === id), uid));
  ok('delete: returns to the start', (await hash()) === '#/');
  await open('#/');
  ok('delete: stays deleted after a reload', await val((id) => !localStorage.getItem(Tanaw.store.profileKey(id)), uid));

  /* ---------- Other ways in ---------- */
  await go('#/signin', 300);
  ok('address: #/signin goes to the login page', (await hash()) === '#/login');
  await go('#/signup', 300);
  ok('address: #/signup goes to registration', (await hash()) === '#/register');
  await go('#/');
  await page.click('[data-open-menu]'); await wait(200);
  ok('site map: offers Log in to a guest', await val(() => [...document.querySelectorAll('dialog .menu-list__link')].some((a) => /Log in/.test(a.textContent))));
  await page.keyboard.press('Escape'); await wait(150);
  ok('search: finds the login page', await val(() => Tanaw.components.palette.search('log in').some((x) => x.href === '#/login')));
  await login('ben@example.com');
  await wait(1100);
  ok('search: offers Log out once logged in', await val(() => Tanaw.components.palette.search('log out').some((x) => x.label === 'Log out')));
  ok('footer: links to your account once logged in', await val(() => document.querySelector('[data-account-link]').getAttribute('href') === '#/account'));
  await page.click('[data-open-menu]'); await wait(200);
  await val(() => document.querySelector('dialog [data-logout]').click()); await wait(800);
  ok('site map: its Log out works too', (await hash()) === '#/login?out=1' && await val(() => !Tanaw.auth.user() && !document.querySelector('dialog[open]')));

  /* ---------- Site settings on the public side ---------- */
  await val(() => localStorage.setItem('tanaw.site.v1', JSON.stringify({ notice: { id: 'n1', text: 'Deaf Awareness Week starts soon.', tone: 'info', until: '' }, registration: 'closed' })));
  await open('#/register');
  ok('registration closed: the page says so instead of showing a dead form', await val(() => /closed/i.test(document.querySelector('h1').textContent) && !document.querySelector('[data-register]')));
  ok('notice: an administrator\'s notice appears on the site', await val(() => /Deaf Awareness Week/.test(document.querySelector('.app-notice--site').textContent)));
  await page.click('[data-dismiss-notice]'); await wait(100);
  ok('notice: can be dismissed', await val(() => !document.querySelector('.app-notice--site')));
  await val(() => localStorage.setItem('tanaw.site.v1', JSON.stringify({ notice: { id: 'n2', text: 'Old news.', until: '2020-01-01' }, registration: 'open' })));
  await open('#/');
  ok('notice: is not shown after its last day', await val(() => !document.querySelector('.app-notice--site')));
  await val(() => localStorage.removeItem('tanaw.site.v1'));

  /* ---------- A browser that cannot hash ---------- */
  const plain = await browser.newPage();
  watch(plain);
  await plain.evaluateOnNewDocument(() => { Object.defineProperty(window.crypto, 'subtle', { value: undefined, configurable: true }); });
  await plain.goto(base + '#/login', { waitUntil: 'load' });
  await wait(500);
  ok('no Web Crypto: explains the problem and disables the form, rather than failing', await plain.evaluate(() => /not available on this page/.test(document.querySelector('.gate__problem').textContent) && document.querySelector('[data-login] [type="submit"]').disabled));
  await plain.close();

  /* ---------- A browser that blocks storage ---------- */
  const blocked = await browser.newPage();
  const blockedErrors = [];
  blocked.on('pageerror', (e) => blockedErrors.push(e.message));
  await blocked.evaluateOnNewDocument(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); });
  await blocked.goto(base + '#/register', { waitUntil: 'load' });
  await wait(600);
  ok('blocked storage: the site still opens, and says progress cannot be saved', await blocked.evaluate(() => !!document.querySelector('#view h1') && /can't be saved/.test(document.querySelector('#app-notices').textContent)));
  await blocked.type('#reg-name', 'Ana Reyes');
  await blocked.type('#reg-email', 'ana@example.com');
  await blocked.type('#reg-password', PW);
  await blocked.type('#reg-confirm', PW);
  await blocked.evaluate(() => document.querySelector('[data-register]').requestSubmit());
  await wait(1100);
  ok('blocked storage: registering explains the problem instead of pretending', await blocked.evaluate(() => /could not save/.test(document.querySelector('[data-error-summary]').textContent) && !Tanaw.auth.user()));
  ok('blocked storage: no page errors', blockedErrors.length === 0, blockedErrors.slice(0, 3).join(' | '));
  await blocked.close();

  /* ---------- Phone ---------- */
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  for (const r of ['#/login', '#/register']) {
    await go(r, 400);
    // eslint-disable-next-line no-await-in-loop
    const m = await val(() => ({ over: document.documentElement.scrollWidth - document.documentElement.clientWidth, input: document.querySelector('.gate__form .input').getBoundingClientRect().height }));
    ok(`phone ${r}: fits, with comfortable fields`, m.over <= 1 && m.input >= 44, JSON.stringify(m));
  }
  await login('ben@example.com');
  await wait(1100);
  await go('#/account', 400);
  ok('phone: the account page fits', (await val(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1);
  await page.evaluate(() => document.querySelector('[data-account-toggle]').click()); await wait(150);
  const mob = await val(() => { const r = document.querySelector('#account-menu').getBoundingClientRect(); return { left: r.left, right: r.right, w: innerWidth }; });
  ok('phone: the account menu stays on screen', mob.left >= 0 && mob.right <= mob.w, JSON.stringify(mob));
  await page.setViewport({ width: 320, height: 640, hasTouch: true, isMobile: true });
  await wait(300);
  ok('small phone: the header still fits, with the account control', await val(() => { const b = document.querySelector('[data-account-toggle]').getBoundingClientRect(); return b.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth + 1; }));

  ok('no page errors or warnings during these flows', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
