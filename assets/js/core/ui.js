/* =========================================================================
   Tanaw — UI primitives: toasts, live announcements, modal dialogs
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;

  const ui = {};

  /** Screen-reader announcement through the polite live region. */
  ui.announce = (message) => {
    const region = document.getElementById('live-region');
    if (!region) return;
    region.textContent = '';
    setTimeout(() => { region.textContent = message; }, 60);
  };

  /** Small transient notification. tone: default | success | gold | danger */
  ui.toast = (message, opts = {}) => {
    const host = document.getElementById('toasts');
    if (!host) return;
    const { icon = 'check-circle', tone = 'default', timeout = 3800 } = opts;
    const el = document.createElement('div');
    el.className = `toast toast--${tone}`;
    el.innerHTML = String(html`${T.icon(icon)}<span>${message}</span>`);
    host.appendChild(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
    const remove = () => {
      el.classList.remove('is-in');
      setTimeout(() => el.remove(), 400);
    };
    setTimeout(remove, timeout);
  };

  /**
   * Modal dialog built on <dialog>. Returns the dialog element.
   * actions: [{ label, variant, value, onClick(dialog) -> false to keep open }]
   */
  ui.dialog = (opts) => {
    const { title, body, actions = [], size = 'md', onClose, onOpen, className = '' } = opts;
    const id = U.uid('dlg');
    const dlg = document.createElement('dialog');
    dlg.className = `dialog dialog--${size} ${className}`.trim();
    dlg.setAttribute('aria-labelledby', `${id}-title`);
    dlg.innerHTML = String(html`
      <div class="dialog__inner">
        <header class="dialog__header">
          <h2 class="dialog__title" id="${id}-title">${title}</h2>
          <button type="button" class="icon-btn" data-dialog-close aria-label="Close dialog">${T.icon('close')}</button>
        </header>
        <div class="dialog__body">${body}</div>
        ${actions.length ? html`<footer class="dialog__footer">${actions.map((a, i) => html`
          <button type="button" class="btn ${a.variant ? 'btn--' + a.variant : 'btn--secondary'}" data-dialog-action="${i}">${a.icon ? T.icon(a.icon) : ''}<span>${a.label}</span></button>`)}
        </footer>` : ''}
      </div>`);

    const previousFocus = document.activeElement;
    document.body.appendChild(dlg);

    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) { dlg.close('dismiss'); return; }
      const closer = e.target.closest('[data-dialog-close]');
      if (closer) { dlg.close('dismiss'); return; }
      const btn = e.target.closest('[data-dialog-action]');
      if (btn) {
        const action = actions[Number(btn.dataset.dialogAction)];
        const result = action && action.onClick ? action.onClick(dlg) : undefined;
        if (result !== false) dlg.close(action && action.value != null ? String(action.value) : String(btn.dataset.dialogAction));
      }
    });

    dlg.addEventListener('close', () => {
      const value = dlg.returnValue;
      dlg.remove();
      if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') {
        try { previousFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }
      if (onClose) onClose(value, dlg);
    });

    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    if (onOpen) onOpen(dlg);
    return dlg;
  };

  /** Promise-based confirmation dialog. Resolves true when confirmed. */
  ui.confirm = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) =>
    new Promise((resolve) => {
      ui.dialog({
        title,
        size: 'sm',
        body: html`<p>${message}</p>`,
        actions: [
          { label: cancelLabel, variant: 'ghost', value: 'cancel' },
          { label: confirmLabel, variant: danger ? 'danger' : 'primary', value: 'ok' },
        ],
        onClose: (value) => resolve(value === 'ok'),
      });
    });

  /** Floating "+XP" feedback near the primary action. */
  ui.xpBurst = (amount, anchor) => {
    if (!amount) return;
    const el = document.createElement('span');
    el.className = 'xp-burst';
    el.textContent = `+${amount} XP`;
    el.setAttribute('aria-hidden', 'true');
    const rect = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    el.style.left = rect ? `${rect.left + rect.width / 2}px` : '50%';
    el.style.top = rect ? `${rect.top}px` : '40%';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  };

  T.ui = ui;
})();
