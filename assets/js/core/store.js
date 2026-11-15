/* =========================================================================
   Tanaw — persistent state (localStorage)

   A visitor's data lives in one localStorage key on this device/browser; each
   demo account (core/auth.js) has its own key, so people sharing a device do
   not see each other's progress. Nothing is sent anywhere. Limitations
   (explained in the UI as well):
   - not synced between devices or browsers (use Export / Import);
   - cleared if the user clears site data; may not persist in private mode.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;

  const KEY = 'tanaw.state.v1';
  const VERSION = 1;
  const profileKey = (uid) => (uid ? `${KEY}.u.${uid}` : KEY);

  function defaults() {
    return {
      version: VERSION,
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'dark',            // system | light | dark (dark is Tanaw's default)
        contrast: 'standard',     // standard | high
        motion: 'system',         // system | reduce | full
        textScale: 1,             // 0.9 – 1.5
        spacing: 'normal',        // normal | relaxed
        dailyGoal: 30,            // XP per day
        mirrorCamera: true,
        flipDemo: false,
        captionLang: 'fil-PH',
        ttsVoice: '',
        ttsRate: 1,
        handStyle: 'kayumanggi',  // 3D hand: kayumanggi | light | deep | polymer | hologram
        handMirror: false,        // 3D hand shown as a left hand
      },
      progress: {
        xp: 0,
        lessons: {},              // lessonId -> { completedAt, score, total, bestScore, attempts }
        lessonState: {},          // lessonId -> { index, correct, answered }
        activity: {},             // 'YYYY-MM-DD' -> { xp, actions }
        badges: {},               // badgeId -> ISO date
        selfcheck: {},            // signId -> true
        practiced: {},            // signId -> count
        recordings: 0,
        quizzes: { taken: 0, perfect: 0 },
        bridgeUses: 0,
        journal: [],              // { id, lessonId, prompt, text, at }
      },
      srs: {
        cards: {},                // cardId -> { ease, interval, reps, lapses, due, last }
        added: {},                // signId -> true (signs the learner added manually)
        reviews: 0,
        newLog: {},               // 'YYYY-MM-DD' -> { concepts: n, signs: n }
      },
      bridge: {
        phrases: [],              // custom quick phrases { id, fil, en }
        emergency: { name: '', message: '', contactName: '', contactPhone: '', medical: '', comms: '' },
      },
      custom: [],                 // custom vocabulary { id, en, fil, baseCat, note, createdAt }
      explore: {},                // 'exhibit:identity' | 'rights:8' | 'history:1907' | 'scene:clinic' -> ISO date
      games: {},                  // gameId -> { plays, best, total, stars, last }
      daily: {},                  // 'YYYY-MM-DD' -> { game, done }
      ui: { dismissed: {} },
    };
  }

  const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

  /** Merge saved data onto defaults, keeping types sane. Unknown keys inside maps are kept. */
  function merge(base, saved) {
    if (saved === undefined) return base;
    if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
    if (isPlainObject(base)) {
      if (!isPlainObject(saved)) return base;
      const out = {};
      Object.keys(base).forEach((k) => { out[k] = merge(base[k], saved[k]); });
      Object.keys(saved).forEach((k) => { if (!(k in base)) out[k] = saved[k]; });
      return out;
    }
    if (typeof base === typeof saved) return saved;
    return base;
  }

  let state = defaults();
  let persistent = true;
  let damaged = false;  // the saved data could not be read
  let key = KEY;      // whose data is in `state`: the guest's, or an account's
  let loaded = false;

  function load() {
    state = defaults();
    let stored = null;
    try {
      stored = window.localStorage.getItem(key);
      window.localStorage.setItem(KEY + '.probe', '1');
      window.localStorage.removeItem(KEY + '.probe');
      persistent = true;
    } catch (err) {
      persistent = false;
      console.warn('[Tanaw] localStorage unavailable — progress will not be saved.', err && err.message);
    }
    if (stored) {
      try {
        state = merge(defaults(), JSON.parse(stored));
      } catch (err) {
        // A damaged save (a browser closed halfway through writing it) must not stop saving for good.
        damaged = true;
        console.warn('[Tanaw] Saved progress could not be read, so this starts fresh.', err && err.message);
      }
    }
    loaded = true;
  }

  function saveNow() {
    if (!persistent) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn('[Tanaw] Could not save progress.', err && err.message);
      T.bus.emit('storage:error', err);
      return false;
    }
  }

  const saveSoon = U.debounce(saveNow, 200);

  /** A backup file's contents, or an error with a message fit to show. Changes nothing. */
  function readBackup(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('That file is not valid JSON.'); }
    if (!data || data.app !== 'tanaw' || data.kind !== 'progress-backup' || !isPlainObject(data.state)) {
      throw new Error('That file is not a Tanaw progress backup.');
    }
    return data;
  }

  const store = {
    KEY,
    load,
    profileKey,
    get state() { return state; },
    /**
     * Switch whose data is in use. uid: an account id, or null for the guest.
     *   bringGuest  a new account takes the guest's progress with it (the guest keeps only display settings)
     *   discard     do not save the current data on the way out (a deleted account)
     * A brand-new profile starts with the current display settings, so nothing jumps on screen.
     */
    useProfile(uid, opts = {}) {
      const next = profileKey(uid);
      const settings = Object.assign({}, state.settings);
      saveSoon.cancel();
      if (loaded && !opts.discard) saveNow();
      let fresh = false;
      try {
        fresh = !window.localStorage.getItem(next);
        if (opts.bringGuest && uid && fresh) {
          const guest = window.localStorage.getItem(KEY);
          if (guest) {
            window.localStorage.setItem(next, guest);
            window.localStorage.setItem(KEY, JSON.stringify({ version: VERSION, settings }));
            fresh = false;
          }
        }
      } catch (e) { /* storage unavailable: the profile stays in memory */ }
      key = next;
      if (!loaded) return;
      load();
      if (fresh && uid) {
        Object.assign(state.settings, settings);
        saveNow();
      }
      T.bus.emit('store:change');
      T.bus.emit('store:replaced');
    },
    /** What the guest has done on this device, without switching to the guest's data. */
    guestSummary() {
      try {
        if (loaded && key === KEY) saveNow(); // what was earned a moment ago counts too
        const g = JSON.parse(window.localStorage.getItem(KEY) || '{}') || {};
        const p = g.progress || {};
        const lessons = Object.keys(p.lessons || {}).length;
        const games = Object.keys(g.games || {}).filter((id) => (g.games[id] || {}).plays > 0).length;
        const xp = Number(p.xp) || 0;
        return { xp, lessons, games, any: xp > 0 || lessons > 0 || games > 0 };
      } catch (e) {
        return { xp: 0, lessons: 0, games: 0, any: false };
      }
    },
    /** Mutate state through a function; persists automatically. */
    update(mutator, opts = {}) {
      mutator(state);
      saveSoon();
      if (!opts.silent) T.bus.emit('store:change');
    },
    flush: saveNow,
    isPersistent: () => persistent,
    isDamaged: () => damaged,
    exportJSON() {
      return JSON.stringify({ app: 'tanaw', kind: 'progress-backup', version: VERSION, exportedAt: new Date().toISOString(), state }, null, 2);
    },
    readBackup,
    importJSON(text) {
      const data = readBackup(text);
      state = merge(defaults(), data.state);
      saveSoon.cancel();
      saveNow();
      T.bus.emit('store:change');
      T.bus.emit('store:replaced');
    },
    reset() {
      state = defaults();
      saveSoon.cancel();
      saveNow();
      T.bus.emit('store:change');
      T.bus.emit('store:replaced');
    },
  };

  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });

  T.store = store;
})();
