/* =========================================================================
   Tanaw — log in (#/login), create an account (#/register), your account
   (#/account). Accounts are a demonstration that lives in this browser, and
   every page says so; core/auth.js explains what is and is not protected.
   The first two pages stand at the threshold of the two worlds: the same seam
   as the landing, with the form on it.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const fmtDate = (t) => (t ? U.formatDate(new Date(t), { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

  const coarse = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  /** Focus the first field, except on touch screens where it would pop up the keyboard. */
  const focusFirst = (form) => {
    const first = form.querySelector('input:not([type="checkbox"])');
    if (first && !coarse()) first.focus({ preventScroll: true });
  };

  function demoLine() {
    return html`<p class="gate__demo">${T.icon('flask')}<span><strong>Demonstration.</strong> Accounts live only in this browser, with no server behind them. Not secure sign-in: please do not reuse a real password.</span></p>`;
  }

  function insecureNotice() {
    return html`<p class="gate__problem" role="status">${T.icon('lock')}<span><strong>Accounts are not available on this page.</strong> Password hashing needs a secure page: open Tanaw over https, from localhost, or straight from its folder. Everything else in Tanaw works as usual.</span></p>`;
  }

  /** The threshold page: both worlds behind a form that sits on the seam. */
  function gate(el, o) {
    el.innerHTML = String(html`
      <div class="gate">
        <div class="gate__world gate__world--learn" aria-hidden="true"><div class="realm__light"></div><div class="realm__lattice"></div></div>
        <div class="gate__world gate__world--community" aria-hidden="true"><div class="realm__weave"></div></div>
        <span class="gate__seam" aria-hidden="true"></span>
        <div class="container gate__grid">
          <aside class="gate__side gate__side--learn" aria-label="What an account keeps">
            <h2 class="gate__side-title">Your own place on a shared device</h2>
            <ul class="gate__list">
              <li>${T.icon('path')}<span>Your lessons, XP and daily streak</span></li>
              <li>${T.icon('dice')}<span>Your game records and daily challenges</span></li>
              <li>${T.icon('library')}<span>The words you have marked as learned</span></li>
              <li>${T.icon('note')}<span>Your private journal and reflections</span></li>
            </ul>
            <p class="gate__aside-note">Everything in Tanaw also works without an account.</p>
          </aside>

          <section class="gate__card" aria-labelledby="gate-title">
            <span class="gate__eye" aria-hidden="true">${raw(T.fx.eyeSVG('gate-eye'))}</span>
            <nav class="gate__tabs" aria-label="Log in or create an account">
              <a class="gate__tab" href="#/login${o.nextQuery || ''}" ${o.mode === 'login' ? raw('aria-current="page"') : ''}>Log in</a>
              <a class="gate__tab" href="#/register${o.nextQuery || ''}" ${o.mode === 'register' ? raw('aria-current="page"') : ''}>Create account</a>
            </nav>
            <h1 class="gate__title" id="gate-title">${o.title}</h1>
            <div data-gate-body>
              ${o.status || ''}
              ${T.auth.supported() ? '' : insecureNotice()}
              ${o.body}
            </div>
          </section>

          <aside class="gate__side gate__side--community" aria-label="How this demonstration works">
            <h2 class="gate__side-title">What this demonstration can and cannot do</h2>
            <ul class="gate__list">
              <li>${T.icon('check')}<span>Your password is hashed before it is stored, and each account keeps its progress apart.</span></li>
              <li>${T.icon('check')}<span>Logging out ends the session in every tab. Repeated wrong passwords lock an account for a while.</span></li>
              <li>${T.icon('alert')}<span>Nothing is checked by a server, so anyone using this browser could read or change the stored data.</span></li>
              <li>${T.icon('alert')}<span>There is no email, so a forgotten password can only be reset by an administrator on this device.</span></li>
            </ul>
          </aside>
        </div>
      </div>`);
    return { eye: el.querySelector('.gate-eye'), body: el.querySelector('[data-gate-body]') };
  }

  /** Replace the form with a result, and bring focus and the eye along. */
  function showResult(body, content) {
    body.innerHTML = String(content);
    // The form may have been long: the result starts back at the top of the page.
    window.scrollTo(0, 0);
    const heading = body.querySelector('[data-result-title]');
    if (heading) heading.focus({ preventScroll: true });
  }

  const REASONS = {
    expired: 'Your login on this device has ended. Log in again to continue.',
    revoked: 'Your session has ended, because this account logged out or its password changed.',
    elsewhere: 'You were logged out in another tab.',
    disabled: 'That account has been disabled by an administrator on this device.',
    gone: 'That account no longer exists on this device.',
  };

  /* ===================== Log in ===================== */
  V.login = {
    title: 'Log in',
    access: 'guest',
    render(el, params, query, { signal }) {
      const reason = T.auth.takeNotice();
      const status = query.out === '1'
        ? html`<div class="gate__good" role="status">${T.icon('check-circle')}<div><p><strong>You have logged out.</strong> Your progress stays in your account on this device. You are using Tanaw as a guest now.</p><a class="link-arrow" href="#/">Continue as a guest ${T.icon('arrow-right')}</a></div></div>`
        : reason && REASONS[reason] ? html`<p class="gate__info" role="status">${T.icon('info')}<span>${REASONS[reason]}</span></p>` : '';
      const nextQuery = query.next ? `?next=${encodeURIComponent(query.next)}` : '';
      const g = gate(el, {
        mode: 'login',
        title: 'Welcome back',
        nextQuery,
        status,
        body: html`
          ${demoLine()}
          <form class="gate__form" data-login novalidate>
            ${C.errorSummary()}
            ${C.field({ id: 'login-email', name: 'email', label: 'Email address', type: 'email', autocomplete: 'username', inputmode: 'email', spellcheck: false, maxlength: 254 })}
            ${C.field({ id: 'login-password', name: 'password', label: 'Password', type: 'password', autocomplete: 'current-password', reveal: true, maxlength: 128 })}
            <label class="check">
              <input type="checkbox" name="remember" aria-describedby="login-remember-hint">
              <span class="check__box" aria-hidden="true">${T.icon('check')}</span>
              <span class="check__label">Keep me logged in<span class="check__hint" id="login-remember-hint">For 30 days on this device. Otherwise, for 8 hours. Leave this off on a shared computer.</span></span>
            </label>
            <button type="submit" class="btn btn--primary btn--block btn--lg" ${T.auth.supported() ? '' : raw('disabled')}><span>Log in</span>${T.icon('arrow-right')}</button>
          </form>
          <details class="gate__forgot">
            <summary>Forgot your password?</summary>
            <p>Tanaw has no email and no server, so it cannot send a reset link. Ask an administrator on this device: they can give you a temporary password, which you then change.</p>
          </details>
          <p class="gate__switch">New to Tanaw? <a href="#/register${nextQuery}">Create an account</a></p>`,
      });

      const form = el.querySelector('[data-login]');
      const eye = C.watchEye(form, g.eye, signal);
      C.wireForm(form, { checks: { email: (v) => T.auth.checkEmail(v).error } });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        C.clearErrors(form);
        const done = C.busy(form.querySelector('[type="submit"]'), 'Logging in…');
        try {
          const user = await C.atLeast(T.auth.login({ email: form.email.value, password: form.password.value, remember: form.remember.checked }));
          if (signal.aborted) return;
          eye.happy();
          const dest = user.mustChange ? '/account?change=1' : C.safeNext(query.next) || '/journey';
          showResult(g.body, html`
            <div class="gate__welcome" role="status">
              <h2 class="gate__welcome-title" tabindex="-1" data-result-title>Welcome back, ${user.name}.</h2>
              <p>Taking you to ${user.mustChange ? 'your account' : dest === '/journey' ? 'your journey' : 'where you were'}…</p>
              <span class="spinner" aria-hidden="true"></span>
            </div>`);
          setTimeout(() => { if (!signal.aborted) T.router.go(`#${dest}`); }, U.reducedMotion() ? 400 : 900);
        } catch (err) {
          if (signal.aborted) return;
          done();
          if (!(err instanceof T.AuthError)) console.error('[Tanaw] login failed', err);
          form.password.value = '';
          eye.wrong();
          C.showErrors(form, err);
          C.lockCountdown(form, err.lockedFor, signal);
        }
      }, { signal });
      focusFirst(form);
    },
  };

  /* ===================== Create an account ===================== */
  function worldChoice() {
    return html`
      <div class="gate__worlds">
        <a class="gate__worldbtn gate__worldbtn--learn" href="#/learn"><span class="gate__worldfil" lang="fil">Matuto</span><span>Awareness &amp; Learning</span>${T.icon('arrow-right')}</a>
        <a class="gate__worldbtn gate__worldbtn--community" href="#/community"><span class="gate__worldfil" lang="fil">Pamayanan</span><span>Deaf Community</span>${T.icon('arrow-right')}</a>
      </div>`;
  }

  V.register = {
    title: 'Create an account',
    access: 'guest',
    render(el, params, query, { signal }) {
      const nextQuery = query.next ? `?next=${encodeURIComponent(query.next)}` : '';
      if (!T.auth.registrationOpen()) {
        gate(el, {
          mode: 'register',
          title: 'Registration is closed',
          nextQuery,
          body: html`
            <p class="gate__info" role="status">${T.icon('info')}<span>New accounts on this device are created by an administrator. Everything in Tanaw still works without an account.</span></p>
            <p class="gate__switch"><a href="#/login${nextQuery}">Log in</a> · <a href="#/">Continue as a guest</a></p>`,
        });
        return;
      }
      const guest = T.store.guestSummary();
      const g = gate(el, {
        mode: 'register',
        title: 'Create your account',
        nextQuery,
        body: html`
          ${demoLine()}
          <form class="gate__form" data-register novalidate>
            ${C.errorSummary()}
            ${C.field({ id: 'reg-name', name: 'name', label: 'Your name', autocomplete: 'name', maxlength: 40 })}
            ${C.field({ id: 'reg-email', name: 'email', label: 'Email address', type: 'email', autocomplete: 'email', inputmode: 'email', spellcheck: false, maxlength: 254, hint: 'It only identifies you on this device. Nothing is sent to it.' })}
            ${C.field({ id: 'reg-password', name: 'password', label: 'Password', type: 'password', autocomplete: 'new-password', reveal: true, maxlength: 128, after: C.strengthMeter('reg-password') })}
            ${C.field({ id: 'reg-confirm', name: 'confirm', label: 'Type the password again', type: 'password', autocomplete: 'new-password', reveal: true, maxlength: 128 })}
            ${guest.any ? html`
              <label class="check">
                <input type="checkbox" name="bringGuest" checked aria-describedby="reg-bring-hint">
                <span class="check__box" aria-hidden="true">${T.icon('check')}</span>
                <span class="check__label">Keep what you have done so far<span class="check__hint" id="reg-bring-hint">${guest.xp} XP, ${U.plural(guest.lessons, 'lesson')} and ${U.plural(guest.games, 'game')} move from this browser's guest progress into your account.</span></span>
              </label>` : ''}
            <label class="check">
              <input type="checkbox" name="remember" aria-describedby="reg-remember-hint">
              <span class="check__box" aria-hidden="true">${T.icon('check')}</span>
              <span class="check__label">Keep me logged in<span class="check__hint" id="reg-remember-hint">For 30 days on this device. Otherwise, for 8 hours.</span></span>
            </label>
            <button type="submit" class="btn btn--primary btn--block btn--lg" ${T.auth.supported() ? '' : raw('disabled')}><span>Create account</span>${T.icon('arrow-right')}</button>
          </form>
          <p class="gate__switch">Already have an account? <a href="#/login${nextQuery}">Log in</a></p>`,
      });

      const form = el.querySelector('[data-register]');
      const eye = C.watchEye(form, g.eye, signal);
      const context = () => ({ name: form.name.value, email: form.email.value });
      C.wireForm(form, {
        context,
        checks: {
          name: (v) => T.auth.checkName(v).error,
          email: (v) => T.auth.checkEmail(v).error,
          password: (v) => T.auth.checkPassword(v, context()).errors[0] || '',
          confirm: (v) => (v === form.password.value ? '' : 'The passwords do not match.'),
        },
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        C.clearErrors(form);
        const done = C.busy(form.querySelector('[type="submit"]'), 'Creating your account…');
        try {
          const user = await C.atLeast(T.auth.register({
            name: form.name.value,
            email: form.email.value,
            password: form.password.value,
            confirm: form.confirm.value,
            remember: form.remember.checked,
            bringGuest: !!(form.bringGuest && form.bringGuest.checked),
          }));
          if (signal.aborted) return;
          eye.happy();
          const next = C.safeNext(query.next);
          showResult(g.body, html`
            <div class="gate__welcome" role="status">
              <h2 class="gate__welcome-title" tabindex="-1" data-result-title>Welcome, ${user.name}.</h2>
              <p>Your account is ready on this device. ${next ? html`<a href="#${next}">Continue where you were</a>, or choose a world:` : 'Where would you like to look first?'}</p>
              ${worldChoice()}
              <a class="link-arrow" href="#/account">Your account ${T.icon('arrow-right')}</a>
            </div>`);
        } catch (err) {
          if (signal.aborted) return;
          done();
          if (!(err instanceof T.AuthError)) console.error('[Tanaw] registration failed', err);
          eye.wrong();
          C.showErrors(form, err);
        }
      }, { signal });
      focusFirst(form);
    },
  };

  /* ===================== Your account ===================== */
  V.account = {
    title: 'Your account',
    access: 'user',
    render(el, params, query, { signal }) {
      const paint = () => {
        const u = T.auth.user();
        if (!u) return;
        const forced = !!u.mustChange;
        el.innerHTML = String(html`
          <div class="container page account">
            <header class="account__head card">
              <span class="account__avatar" aria-hidden="true">${(u.name || '?').trim().charAt(0).toUpperCase()}</span>
              <div class="account__who">
                <h1 class="account__name">${u.name}</h1>
                <p class="account__meta">${u.email}</p>
                <p class="account__meta"><span class="account__role account__role--${u.role}">${T.auth.ROLES[u.role]}</span> · Member since ${fmtDate(u.createdAt)}</p>
              </div>
              <div class="account__actions">
                ${T.auth.isAdmin() ? html`<a class="btn btn--secondary" href="admin.html">${T.icon('shield')}<span>Administrator console</span></a>` : ''}
                <button type="button" class="btn btn--ghost" data-logout>${T.icon('arrow-left')}<span>Log out</span></button>
              </div>
            </header>

            <p class="account__demo">${T.icon('flask')}<span><strong>Demonstration, not secure sign-in.</strong> This account lives only in this browser, and anyone using this browser could read or change it. See <a href="#/about">About</a> for what a real system would need.</span></p>

            ${forced ? html`<p class="account__must" role="alert">${T.icon('alert')}<span><strong>Choose a new password to continue.</strong> An administrator gave you a temporary one.</span></p>` : ''}

            <div class="account__grid">
              ${forced ? '' : html`
              <section class="card account__card" aria-labelledby="acc-details">
                <h2 class="account__title" id="acc-details">Your details</h2>
                <form data-details novalidate>
                  ${C.errorSummary()}
                  ${C.field({ id: 'acc-name', name: 'name', label: 'Your name', autocomplete: 'name', maxlength: 40, value: u.name })}
                  ${C.field({ id: 'acc-email', name: 'email', label: 'Email address', type: 'email', autocomplete: 'email', inputmode: 'email', spellcheck: false, maxlength: 254, value: u.email })}
                  ${C.field({ id: 'acc-email-password', name: 'password', label: 'Password', type: 'password', autocomplete: 'current-password', reveal: true, maxlength: 128, required: false, className: 'account__email-password', hint: 'Needed only when you change your email.' })}
                  <button type="submit" class="btn btn--primary">${T.icon('check')}<span>Save details</span></button>
                </form>
              </section>`}

              <section class="card account__card" aria-labelledby="acc-password">
                <h2 class="account__title" id="acc-password">${forced ? 'Choose a new password' : 'Change password'}</h2>
                <form data-password novalidate>
                  ${C.errorSummary()}
                  ${C.field({ id: 'acc-current', name: 'current', label: forced ? 'Temporary password' : 'Current password', type: 'password', autocomplete: 'current-password', reveal: true, maxlength: 128 })}
                  ${C.field({ id: 'acc-next', name: 'next', label: 'New password', type: 'password', autocomplete: 'new-password', reveal: true, maxlength: 128, after: C.strengthMeter('acc-next') })}
                  ${C.field({ id: 'acc-confirm', name: 'confirm', label: 'Type the new password again', type: 'password', autocomplete: 'new-password', reveal: true, maxlength: 128 })}
                  <button type="submit" class="btn btn--primary">${T.icon('check')}<span>${forced ? 'Set password and continue' : 'Change password'}</span></button>
                </form>
              </section>

              ${forced ? '' : html`
              <section class="card account__card" aria-labelledby="acc-data">
                <h2 class="account__title" id="acc-data">Your data</h2>
                <p>Your progress, journal and display settings are kept for this account, in this browser. They do not sync to other devices.</p>
                <a class="btn btn--secondary" href="#/journey">${T.icon('sparkles')}<span>Your journey, export and import</span></a>
                <h3 class="account__subtitle">Delete this account</h3>
                <p>This removes the account and its progress from this browser. It cannot be undone.</p>
                <button type="button" class="btn btn--danger-ghost" data-delete>${T.icon('trash')}<span>Delete account</span></button>
              </section>`}
            </div>
          </div>`);

        el.querySelector('[data-logout]').addEventListener('click', () => T.auth.logout(), { signal });

        const details = el.querySelector('[data-details]');
        if (details) {
          C.wireForm(details, { checks: { name: (v) => T.auth.checkName(v).error, email: (v) => T.auth.checkEmail(v).error } });
          // Asking for a password only makes sense once the email has changed.
          const pwField = details.querySelector('.account__email-password');
          const syncPw = () => { pwField.hidden = details.email.value.trim().toLowerCase() === T.auth.user().email; };
          syncPw();
          details.email.addEventListener('input', syncPw);
          details.addEventListener('submit', async (e) => {
            e.preventDefault();
            C.clearErrors(details);
            const done = C.busy(details.querySelector('[type="submit"]'), 'Saving…');
            try {
              await C.atLeast(T.auth.updateProfile({ name: details.name.value, email: details.email.value, password: details.password.value }), 300);
              if (signal.aborted) return;
              done();
              details.password.value = '';
              syncPw();
              T.ui.toast('Your details are saved.');
              // The heading and menu show the new name.
              const nameEl = el.querySelector('.account__name');
              if (nameEl) nameEl.textContent = T.auth.user().name;
              const emailEl = el.querySelector('.account__who .account__meta');
              if (emailEl) emailEl.textContent = T.auth.user().email;
              const av = el.querySelector('.account__avatar');
              if (av) av.textContent = T.auth.user().name.charAt(0).toUpperCase();
            } catch (err) {
              if (signal.aborted) return;
              done();
              if (!(err instanceof T.AuthError)) console.error('[Tanaw] saving details failed', err);
              C.showErrors(details, err);
            }
          }, { signal });
        }

        const pw = el.querySelector('[data-password]');
        C.wireForm(pw, {
          context: () => ({ name: T.auth.user().name, email: T.auth.user().email }),
          checks: {
            next: (v) => T.auth.checkPassword(v, { name: T.auth.user().name, email: T.auth.user().email }).errors[0] || '',
            confirm: (v) => (v === pw.next.value ? '' : 'The passwords do not match.'),
          },
        });
        pw.addEventListener('submit', async (e) => {
          e.preventDefault();
          C.clearErrors(pw);
          const done = C.busy(pw.querySelector('[type="submit"]'), 'Saving…');
          try {
            await C.atLeast(T.auth.changePassword({ current: pw.current.value, next: pw.next.value, confirm: pw.confirm.value }), 300);
            if (signal.aborted) return;
            done();
            T.ui.toast('Your password is changed.');
            if (forced) { T.router.go('#/journey'); return; }
            pw.reset();
            const meter = pw.querySelector('[data-strength]');
            if (meter) meter.dataset.score = '';
            const text = pw.querySelector('.strength__text');
            if (text) text.textContent = '';
            U.$$('.rules li', pw).forEach((li) => li.classList.remove('is-met'));
          } catch (err) {
            if (signal.aborted) return;
            done();
            if (!(err instanceof T.AuthError)) console.error('[Tanaw] changing password failed', err);
            C.showErrors(pw, err);
          }
        }, { signal });

        const del = el.querySelector('[data-delete]');
        if (del) {
          del.addEventListener('click', () => {
            T.ui.dialog({
              title: 'Delete this account?',
              size: 'sm',
              body: html`
                <form data-delete-form novalidate>
                  <p>Your account and its progress will be removed from this browser. This cannot be undone.</p>
                  ${C.errorSummary()}
                  ${C.field({ id: 'del-password', name: 'password', label: 'Your password', type: 'password', autocomplete: 'current-password', reveal: true, maxlength: 128 })}
                  <div class="btn-row account__dialog-actions">
                    <button type="button" class="btn btn--ghost" data-dialog-close>Keep my account</button>
                    <button type="submit" class="btn btn--danger">${T.icon('trash')}<span>Delete account</span></button>
                  </div>
                </form>`,
              onOpen: (dlg) => {
                const f = dlg.querySelector('[data-delete-form]');
                C.wireForm(f);
                f.addEventListener('submit', async (e) => {
                  e.preventDefault();
                  C.clearErrors(f);
                  const done = C.busy(f.querySelector('[type="submit"]'), 'Deleting…');
                  try {
                    await T.auth.deleteAccount(f.password.value);
                    dlg.close('deleted');
                    T.ui.toast('Your account has been deleted.');
                  } catch (err) {
                    done();
                    C.showErrors(f, err);
                  }
                });
              },
            });
          }, { signal });
        }
      };
      paint();
      if (query.change === '1') {
        const f = el.querySelector('[data-password] input');
        if (f && !coarse()) f.focus({ preventScroll: true });
      }
    },
  };
})();
