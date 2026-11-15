/* =========================================================================
   Tanawan — site controls (#/site)
   The two things an administrator can change on the public site from here: a
   notice at the top of every page, and whether people can register. Both take
   effect at once, in this browser only.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const K = T.console;
  const C = T.components;

  const MAX = 200;

  K.section({
    id: 'site',
    label: 'Site controls',
    icon: 'sliders',
    async render(el, query, { signal }) {
      const site = await T.backend.admin.site();
      if (signal.aborted) return;
      const n = site.notice;
      el.innerHTML = String(html`
        ${K.head({
          title: 'Site controls',
          lead: 'These change the public site at once, but only in this browser: there is no server to share them with other visitors.',
        })}
        <div class="c-grid">
          <section class="c-panel" aria-labelledby="s-notice">
            <h2 class="c-panel__title" id="s-notice">Notice on every page</h2>
            ${n ? html`<p class="c-ok" role="status">${T.icon('check-circle')}<span><strong>Published.</strong> Open the <a href="index.html" target="_blank" rel="noopener">public site<span class="visually-hidden"> (opens in a new tab)</span></a> to see it.</span></p>` : ''}
            <form class="c-form" data-notice novalidate>
              ${C.errorSummary()}
              <div class="field" data-field="text">
                <label class="field__label" for="s-text">Message</label>
                <textarea class="textarea" id="s-text" name="text" rows="3" maxlength="${MAX}" aria-describedby="s-text-count s-text-error">${n ? n.text : ''}</textarea>
                <p class="c-small" id="s-text-count" data-count></p>
                <p class="field__error" id="s-text-error" hidden></p>
              </div>
              <fieldset class="setting">
                <legend class="setting__label">Tone</legend>
                <div class="segmented">
                  <label class="segmented__option"><input type="radio" name="tone" value="info" ${!n || n.tone !== 'important' ? raw('checked') : ''}><span>Information</span></label>
                  <label class="segmented__option"><input type="radio" name="tone" value="important" ${n && n.tone === 'important' ? raw('checked') : ''}><span>Important</span></label>
                </div>
              </fieldset>
              <div class="field">
                <label class="field__label" for="s-until">Last day to show it <span class="field__optional">(optional)</span></label>
                <input class="input c-input--date" id="s-until" name="until" type="date" value="${n ? n.until : ''}" min="${U.dateKey()}">
              </div>
              <div class="btn-row">
                <button type="submit" class="btn btn--primary">${n ? 'Update notice' : 'Publish notice'}</button>
                ${n ? html`<button type="button" class="btn btn--ghost" data-remove-notice>Remove notice</button>` : ''}
              </div>
            </form>
          </section>

          <section class="c-panel" aria-labelledby="s-reg">
            <h2 class="c-panel__title" id="s-reg">Who can create an account</h2>
            <fieldset class="setting" data-registration>
              <legend class="visually-hidden">Registration</legend>
              <div class="rchoices">
                <label class="rchoice">
                  <input type="radio" name="registration" value="open" ${site.registration !== 'closed' ? raw('checked') : ''}>
                  <span class="rchoice__box">${T.icon('people')}<span><strong>Anyone</strong><br>The registration page is open.</span></span>
                </label>
                <label class="rchoice">
                  <input type="radio" name="registration" value="closed" ${site.registration === 'closed' ? raw('checked') : ''}>
                  <span class="rchoice__box">${T.icon('lock')}<span><strong>Only administrators</strong><br>The registration page says it is closed. Add accounts under People.</span></span>
                </label>
              </div>
            </fieldset>
          </section>
        </div>`);

      const form = el.querySelector('[data-notice]');
      const count = el.querySelector('[data-count]');
      const updateCount = () => { count.textContent = `${form.text.value.length} of ${MAX} characters`; };
      updateCount();
      form.text.addEventListener('input', updateCount, { signal });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        C.clearErrors(form);
        const text = form.text.value.trim().replace(/\s+/g, ' ');
        if (!text) {
          C.showErrors(form, new T.AuthError('Check the highlighted fields.', { text: 'Write the message first.' }));
          return;
        }
        await T.backend.admin.setNotice({ text, tone: form.tone.value, until: form.until.value });
        T.ui.toast('Notice published in this browser.');
        K.refresh();
      }, { signal });
      const remove = el.querySelector('[data-remove-notice]');
      if (remove) {
        remove.addEventListener('click', async () => {
          await T.backend.admin.setNotice(null);
          T.ui.toast('Notice removed.');
          K.refresh();
        }, { signal });
      }
      el.querySelector('[data-registration]').addEventListener('change', async (e) => {
        await T.backend.admin.setRegistration(e.target.value);
        T.ui.toast(e.target.value === 'closed' ? 'Registration is closed in this browser.' : 'Registration is open in this browser.');
      }, { signal });
    },
  });
})();
