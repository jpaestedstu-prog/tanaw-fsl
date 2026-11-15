/* =========================================================================
   Tanaw — accessible forms (the account pages and the administrator's page)
   Labels and hints are tied to their fields; errors appear inline (with
   aria-invalid) and in a summary at the top that links to each field.
   Tanaw's eye keeps people company: it follows what you type and looks away
   while you type a password.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = (T.components = T.components || {});

  /** A labeled text field with an optional hint and a place for its error. */
  C.field = (o) => {
    const describedBy = [o.hint ? `${o.id}-hint` : '', `${o.id}-error`].filter(Boolean).join(' ');
    return html`
      <div class="field ${o.className || ''}" data-field="${o.name}">
        <label class="field__label" for="${o.id}">${o.label}${o.optional ? html` <span class="field__optional">(optional)</span>` : ''}</label>
        ${o.hint ? html`<p class="field__hint" id="${o.id}-hint">${o.hint}</p>` : ''}
        <div class="field__control">
          <input class="input" id="${o.id}" name="${o.name}" type="${o.type || 'text'}" ${o.autocomplete ? U.raw(`autocomplete="${o.autocomplete}"`) : ''}
            ${o.inputmode ? U.raw(`inputmode="${o.inputmode}"`) : ''} ${o.maxlength ? U.raw(`maxlength="${o.maxlength}"`) : ''}
            ${o.required === false ? '' : U.raw('required aria-required="true"')} ${o.spellcheck === false ? U.raw('spellcheck="false" autocapitalize="none"') : ''}
            aria-describedby="${describedBy}" value="${o.value || ''}">
          ${o.reveal ? html`
            <button type="button" class="field__reveal" data-reveal-password="${o.id}" aria-pressed="false" aria-label="Show password">${T.icon('eye')}</button>` : ''}
        </div>
        ${o.reveal ? html`<p class="field__caps" id="${o.id}-caps" hidden>${T.icon('alert')}<span>Caps Lock is on</span></p>` : ''}
        ${o.after || ''}
        <p class="field__error" id="${o.id}-error" hidden></p>
      </div>`;
  };

  /** Strength meter and rule checklist for a new password (fed by T.auth.checkPassword). */
  C.strengthMeter = (id) => html`
    <div class="strength" data-strength="${id}" aria-hidden="true">
      <span class="strength__bar"></span><span class="strength__bar"></span><span class="strength__bar"></span><span class="strength__bar"></span>
    </div>
    <p class="strength__text" id="${id}-strength" aria-live="polite"></p>
    <ul class="rules" data-rules="${id}">
      <li data-rule="length">${T.icon('check')}<span>At least 8 characters (a short sentence works well)</span></li>
      <li data-rule="guess">${T.icon('check')}<span>Not a common or easy-to-guess password</span></li>
      <li data-rule="personal">${T.icon('check')}<span>Does not contain your name or email</span></li>
    </ul>`;

  /** Box at the top of a form that lists every error and links to each field. */
  C.errorSummary = () => html`<div class="error-summary" data-error-summary tabindex="-1" hidden></div>`;

  /* ---------- The eye beside a form ---------- */
  /**
   * Follows the caret in ordinary fields; shuts while a hidden password is being typed
   * and opens wide when it is revealed. Returns { happy(), wrong() } for form results.
   */
  C.watchEye = (form, svg, signal) => {
    if (!svg) return { happy() {}, wrong() {} };
    const look = (e) => {
      const t = e.target;
      if (!t.matches || !t.matches('input')) return;
      const secret = t.type === 'password';
      svg.classList.toggle('is-shut', secret);
      svg.classList.toggle('is-wide', t.hasAttribute('data-was-password') && !secret);
      if (secret) { T.fx.look(svg, 0, 0); return; }
      // Reading along the field: the caret's place in the text, looking down at the form.
      let pos = 0;
      try { pos = t.selectionStart === null ? t.value.length : t.selectionStart; } catch (err) { pos = t.value.length; }
      const dx = Math.min(1, pos / 24) * 1.8 - 0.9;
      T.fx.look(svg, U.reducedMotion() ? 0 : dx, U.reducedMotion() ? 0 : 0.8);
    };
    const opts = signal ? { signal } : undefined;
    ['focusin', 'input', 'keyup', 'click'].forEach((type) => form.addEventListener(type, look, opts));
    form.addEventListener('focusout', (e) => {
      if (form.contains(e.relatedTarget)) return;
      svg.classList.remove('is-shut', 'is-wide');
      T.fx.look(svg, 0, 0);
    }, opts);
    return {
      happy() {
        svg.classList.remove('is-shut', 'is-wrong');
        svg.classList.add('is-wide');
        T.fx.look(svg, 0, 0);
      },
      wrong() {
        svg.classList.remove('is-wrong');
        svg.getBoundingClientRect(); // restart the animation when it plays again
        svg.classList.add('is-wrong');
      },
    };
  };

  /**
   * Wire what every account form shares: password reveal, Caps Lock warnings, live strength
   * meters, and checks when a person leaves a field.
   *   opts.context()  { name, email } for the password rules
   *   opts.checks     { fieldName: (value) => error message or '' }
   */
  C.wireForm = (form, opts = {}) => {
    form.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-reveal-password]');
      if (!btn) return;
      const input = form.querySelector(`#${btn.dataset.revealPassword}`);
      const show = input.type === 'password';
      input.setAttribute('data-was-password', '');
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.classList.toggle('is-open', show);
      input.focus({ preventScroll: true });
    });

    const caps = (e) => {
      if (!e.getModifierState || !e.target.matches('input[type="password"], input[data-was-password]')) return;
      const note = form.querySelector(`#${e.target.id}-caps`);
      if (note) note.hidden = !e.getModifierState('CapsLock');
    };
    form.addEventListener('keydown', caps);
    form.addEventListener('keyup', caps);

    const setError = (input, message) => {
      const box = form.querySelector(`#${input.id}-error`);
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (box) { box.hidden = false; box.innerHTML = String(html`${T.icon('alert')}<span>${message}</span>`); }
      } else {
        input.removeAttribute('aria-invalid');
        if (box) { box.hidden = true; box.textContent = ''; }
      }
    };

    // Say what is wrong when someone leaves a field, and clear it as soon as it is fixed.
    const checks = opts.checks || {};
    form.addEventListener('focusout', (e) => {
      const t = e.target;
      const note = t.id && form.querySelector(`#${t.id}-caps`);
      if (note) note.hidden = true;
      const to = e.relatedTarget;
      // Moving from a field to its reveal button is not "finished with this field"; leaving the button is.
      const revealFor = t.dataset && t.dataset.revealPassword;
      const field = revealFor ? form.querySelector(`#${revealFor}`) : t;
      if (!field || !field.name) return;
      if (to && (to === field || (to.dataset && to.dataset.revealPassword === field.id) || (to.closest && to.closest('[data-focus-field]')))) return;
      const check = checks[field.name];
      if (check && field.value) setError(field, check(field.value));
    });
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t.getAttribute('aria-invalid') !== 'true') return;
      const check = t.name && checks[t.name];
      if (!check) { setError(t, ''); return; }
      if (!check(t.value)) setError(t, '');
    });

    U.$$('[data-strength]', form).forEach((meter) => {
      const input = form.querySelector(`#${meter.dataset.strength}`);
      const text = form.querySelector(`#${meter.dataset.strength}-strength`);
      const rules = form.querySelector(`[data-rules="${meter.dataset.strength}"]`);
      const update = () => {
        const r = T.auth.checkPassword(input.value, opts.context ? opts.context() : {});
        const has = !!input.value;
        meter.dataset.score = has ? String(r.score) : '';
        text.textContent = has ? `Password strength: ${r.label}` : '';
        if (rules) {
          ['length', 'guess', 'personal'].forEach((rule) => {
            const li = rules.querySelector(`[data-rule="${rule}"]`);
            if (li) li.classList.toggle('is-met', !!r.rules[rule]);
          });
        }
      };
      input.addEventListener('input', update);
      if (opts.context) form.addEventListener('input', (e) => { if (e.target !== input) update(); });
    });
  };

  /** Show errors: inline on each field, and as a focused summary with links. */
  C.showErrors = (form, err) => {
    C.clearErrors(form);
    const fields = err && err.fields ? err.fields : {};
    const entries = Object.entries(fields).filter(([, msg]) => typeof msg === 'string' && msg.trim());
    entries.forEach(([name, msg]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      input.setAttribute('aria-invalid', 'true');
      const box = form.querySelector(`#${input.id}-error`);
      if (box) { box.hidden = false; box.innerHTML = String(html`${T.icon('alert')}<span>${msg}</span>`); }
    });
    // A field flagged with a blank message (the password after a failed login) is marked without repeating text.
    Object.entries(fields).filter(([, msg]) => typeof msg === 'string' && !msg.trim()).forEach(([name]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) input.setAttribute('aria-invalid', 'true');
    });
    const summary = form.querySelector('[data-error-summary]');
    if (!summary) return;
    const message = err && err.message ? err.message : 'Something went wrong. Please try again.';
    summary.hidden = false;
    summary.innerHTML = String(html`
      <h2 class="error-summary__title">${T.icon('alert')}<span>${entries.length ? 'There is a problem' : message}</span></h2>
      ${entries.length ? html`<ul class="error-summary__list">${entries.map(([name, msg]) => {
        const input = form.querySelector(`[name="${name}"]`);
        return input ? html`<li><a href="#${input.id}" data-focus-field="${input.id}">${msg}</a></li>` : '';
      })}</ul>` : ''}`);
    summary.focus();
  };

  C.clearErrors = (form) => {
    U.$$('[aria-invalid="true"]', form).forEach((i) => i.removeAttribute('aria-invalid'));
    U.$$('.field__error', form).forEach((b) => { b.hidden = true; b.textContent = ''; });
    const summary = form.querySelector('[data-error-summary]');
    if (summary) { summary.hidden = true; summary.textContent = ''; }
  };

  // Summary links move focus to their field (the hash belongs to the router).
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('[data-focus-field]') : null;
    if (!a) return;
    e.preventDefault();
    const input = document.getElementById(a.dataset.focusField);
    if (input) {
      input.focus();
      input.scrollIntoView({ block: 'center', behavior: U.reducedMotion() ? 'auto' : 'smooth' });
    }
  });

  /** Put a button into its busy state while work runs; returns a function that restores it. */
  C.busy = (btn, label) => {
    const before = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = String(html`<span class="spinner spinner--sm" aria-hidden="true"></span><span>${label}</span>`);
    T.ui.announce(label);
    return () => {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.innerHTML = before;
    };
  };

  /**
   * After too many failed logins: count down in the error summary, then say it is fine to try again.
   * Shown, not announced each second; the summary already took focus when the message first appeared.
   */
  C.lockCountdown = (form, seconds, signal) => {
    const title = form.querySelector('[data-error-summary] .error-summary__title span');
    if (!title || !(seconds > 0)) return;
    const end = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      const left = Math.ceil((end - Date.now()) / 1000);
      if (!title.isConnected) { clearInterval(timer); return; }
      if (left <= 0) {
        clearInterval(timer);
        title.textContent = 'You can try again now.';
        T.ui.announce('You can try logging in again now.');
        return;
      }
      title.textContent = `Too many attempts. This account is locked for ${left < 90 ? `${left} seconds` : `${Math.ceil(left / 60)} minutes`}.`;
    }, 1000);
    if (signal) signal.addEventListener('abort', () => clearInterval(timer), { once: true });
  };

  /** Keep a busy state on screen long enough to read, however fast the work is. */
  C.atLeast = async (promise, ms = 450) => {
    const [result] = await Promise.all([promise, new Promise((r) => setTimeout(r, ms))]);
    return result;
  };

  /** Only internal page paths may be used after logging in (no open redirects). */
  C.safeNext = (next) => (typeof next === 'string' && /^\/(?!\/)[\w\-/?=&%.]*$/.test(next) && !/^\/(login|register)\b/.test(next) ? next : '');
})();
