/* =========================================================================
   Tanawan — start-up of the administrator console (admin.html)
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;

  T.auth.restore(); // first, so the right person's display settings load
  T.store.load();
  T.settings.apply();
  T.console.applyLook();
  T.auth.init();
  T.console.start();
})();
