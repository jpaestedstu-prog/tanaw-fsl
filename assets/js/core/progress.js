/* =========================================================================
   Tanaw — progress: XP, daily goal, streaks, lesson completion, badges
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;

  function day(st, key) {
    const a = st.progress.activity;
    if (!a[key] || typeof a[key] !== 'object') a[key] = { xp: 0, actions: 0 };
    return a[key];
  }

  function activeDays() {
    const act = T.store.state.progress.activity;
    return Object.keys(act)
      .filter((k) => U.isDateKey(k) && act[k] && ((Number(act[k].xp) || 0) > 0 || (Number(act[k].actions) || 0) > 0))
      .sort();
  }

  function streak() {
    const days = new Set(activeDays());
    const today = U.dateKey();
    let cursor = days.has(today) ? today : U.addDays(today, -1);
    let current = 0;
    while (days.has(cursor)) { current += 1; cursor = U.addDays(cursor, -1); }
    let best = 0;
    let run = 0;
    let prev = null;
    Array.from(days).sort().forEach((d) => {
      run = prev && U.daysBetween(prev, d) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    });
    return { current, best, activeToday: days.has(today) };
  }

  function todayXP() {
    const d = T.store.state.progress.activity[U.dateKey()];
    return d ? Number(d.xp) || 0 : 0;
  }

  function goal() {
    return Number(T.store.state.settings.dailyGoal) || 30;
  }

  function addXP(amount, opts = {}) {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    let reachedGoal = false;
    T.store.update((st) => {
      const d = day(st, U.dateKey());
      const before = Number(d.xp) || 0;
      d.xp = before + n;
      d.actions = (Number(d.actions) || 0) + 1;
      st.progress.xp = (Number(st.progress.xp) || 0) + n;
      const g = Number(st.settings.dailyGoal) || 30;
      if (n > 0 && before < g && d.xp >= g) reachedGoal = true;
    });
    if (n > 0) T.bus.emit('xp', { amount: n, reason: opts.reason || '' });
    if (reachedGoal) T.ui.toast('Daily goal reached — mahusay! Keep it up tomorrow.', { icon: 'target', tone: 'gold', timeout: 5000 });
    checkBadges();
  }

  /** Record learning activity without XP (keeps the streak honest). */
  function logActivity() {
    T.store.update((st) => {
      const d = day(st, U.dateKey());
      d.actions = (Number(d.actions) || 0) + 1;
    });
    checkBadges();
  }

  function lessonDone(id) {
    return !!T.store.state.progress.lessons[id];
  }

  function completeLesson(id, score, total) {
    let first = false;
    T.store.update((st) => {
      const prev = st.progress.lessons[id];
      first = !prev;
      st.progress.lessons[id] = {
        completedAt: new Date().toISOString(),
        score,
        total,
        bestScore: Math.max(prev ? Number(prev.bestScore) || 0 : 0, score),
        attempts: (prev ? Number(prev.attempts) || 0 : 0) + 1,
      };
      delete st.progress.lessonState[id];
    });
    addXP(first ? 20 : 5, { reason: 'lesson' });
    return first;
  }

  function unitDone(unitId) {
    const unit = T.data.units.find((u) => u.id === unitId);
    return !!unit && unit.lessons.every(lessonDone);
  }

  function nextLesson() {
    const order = T.data.lessonOrder();
    const states = T.store.state.progress.lessonState;
    const inProgress = order.find((id) => !lessonDone(id) && states[id]);
    return inProgress || order.find((id) => !lessonDone(id)) || null;
  }

  /* ---------- Exploration (Deaf Community exhibits, scenes, rights, history) ---------- */
  const explored = (key) => !!(T.store.state.explore || {})[key];

  function exploredCount(prefix) {
    return Object.keys(T.store.state.explore || {}).filter((k) => k.startsWith(prefix)).length;
  }

  /** Record a first visit to an exhibit item. Returns true the first time. */
  function markExplored(key, opts = {}) {
    if (explored(key)) return false;
    T.store.update((st) => {
      if (!st.explore || typeof st.explore !== 'object') st.explore = {};
      st.explore[key] = new Date().toISOString();
    }, { silent: true });
    if (opts.xp) addXP(opts.xp, { reason: 'explore' });
    else logActivity();
    T.bus.emit('explore', { key });
    return true;
  }

  /* ---------- Games ---------- */
  const starsFor = (correct, total) => {
    const pct = total ? correct / total : 0;
    return pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
  };

  /** Daily challenge: one playable game per calendar day, the same for everyone on that date. */
  function dailyGame() {
    // Experimental games (they need WebGL) stay out of the daily rotation.
    const list = (T.data.games || []).filter((g) => !g.experimental).map((g) => g.id);
    if (!list.length) return null;
    return list[U.hash(U.dateKey()) % list.length];
  }

  const dailyDone = () => !!((T.store.state.daily || {})[U.dateKey()] || {}).done;

  function gameResult(id, correct, total) {
    const stars = starsFor(correct, total);
    const today = U.dateKey();
    const isDaily = dailyGame() === id && !dailyDone();
    let newBest = false;
    T.store.update((st) => {
      if (!st.games || typeof st.games !== 'object') st.games = {};
      const prev = st.games[id] || { plays: 0, best: 0, total: 0, stars: 0 };
      newBest = prev.plays > 0 && correct / (total || 1) > (prev.best / (prev.total || 1));
      const better = !prev.plays || correct / (total || 1) >= prev.best / (prev.total || 1);
      st.games[id] = {
        plays: (Number(prev.plays) || 0) + 1,
        best: better ? correct : prev.best,
        total: better ? total : prev.total,
        stars: Math.max(Number(prev.stars) || 0, stars),
        last: new Date().toISOString(),
      };
      if (isDaily) {
        if (!st.daily || typeof st.daily !== 'object') st.daily = {};
        st.daily[today] = { game: id, done: true };
        // Keep the daily log short.
        Object.keys(st.daily).forEach((k) => { if (!U.isDateKey(k) || U.daysBetween(k, today) > 60) delete st.daily[k]; });
      }
    });
    const xp = Math.min(30, correct * 2) + (isDaily ? 10 : 0);
    addXP(xp, { reason: 'game' });
    return { stars, xp, newBest, isDaily };
  }

  const gamesPlayed = () => Object.keys(T.store.state.games || {}).filter((k) => (T.store.state.games[k] || {}).plays > 0);

  // Exhibits in the Deaf Community world; Stories only while it is switched on (core/config.js).
  const COMMUNITY_EXHIBITS = ['identity', 'stories', 'history', 'rights', 'calendar', 'connect']
    .filter((id) => id !== 'stories' || T.config.stories);

  const BADGES = [
    { id: 'first-lesson', title: 'First steps', desc: 'Complete your first lesson.', icon: 'path', world: 'learn',
      test: (s) => Object.keys(s.progress.lessons).length >= 1 },
    { id: 'foundations', title: 'Grounded', desc: 'Complete every Foundations lesson.', icon: 'compass', world: 'learn',
      test: () => unitDone('u1') },
    { id: 'ally', title: 'Kakampi', desc: 'Complete the Being an Ally unit.', icon: 'heart', world: 'learn',
      test: () => unitDone('u4') },
    { id: 'path', title: 'Path finisher', desc: 'Complete every lesson in the learning path.', icon: 'trophy', world: 'learn',
      test: () => T.data.lessonOrder().every(lessonDone) },
    { id: 'streak-3', title: 'On a roll', desc: 'Learn on 3 days in a row.', icon: 'flame', world: 'learn',
      test: () => streak().best >= 3 },
    { id: 'streak-7', title: 'Week strong', desc: 'Learn on 7 days in a row.', icon: 'flame', world: 'learn',
      test: () => streak().best >= 7 },
    { id: 'reviews-50', title: 'Memory builder', desc: 'Complete 50 spaced-review cards.', icon: 'layers', world: 'learn',
      test: (s) => (Number(s.srs.reviews) || 0) >= 50 },
    { id: 'mirror', title: 'Mirror, mirror', desc: 'Record your first practice clip.', icon: 'practice', world: 'learn',
      test: (s) => (Number(s.progress.recordings) || 0) >= 1 },
    { id: 'bridge', title: 'Bridge builder', desc: 'Use the Conversation Bridge.', icon: 'bridge', world: 'learn',
      test: (s) => (Number(s.progress.bridgeUses) || 0) >= 1 },
    { id: 'quiz-perfect', title: 'Sharp eyes', desc: 'Get a perfect score on a quiz.', icon: 'target', world: 'learn',
      test: (s) => (Number(s.progress.quizzes.perfect) || 0) >= 1 },
    { id: 'journal-3', title: 'Reflective learner', desc: 'Write 3 learning-journal entries.', icon: 'edit', world: 'learn',
      test: (s) => Array.isArray(s.progress.journal) && s.progress.journal.length >= 3 },
    { id: 'xp-500', title: 'Dedicated', desc: 'Earn 500 XP.', icon: 'star', world: 'learn',
      test: (s) => (Number(s.progress.xp) || 0) >= 500 },
    { id: 'games-3', title: 'Playful learner', desc: 'Finish 3 different games.', icon: 'dice', world: 'learn',
      test: () => gamesPlayed().length >= 3 },
    { id: 'three-stars', title: 'Three stars', desc: 'Earn 3 stars in any game.', icon: 'sparkles', world: 'learn',
      test: (s) => Object.values(s.games || {}).some((g) => g && g.stars >= 3) },
    { id: 'daily', title: 'Daily challenger', desc: 'Finish a daily challenge.', icon: 'calendar', world: 'learn',
      test: (s) => Object.values(s.daily || {}).some((d) => d && d.done) },
    { id: 'lab-letters', title: 'Handshape explorer', desc: 'View every modeled letter in the 3D Hand Lab.', icon: 'cube', world: 'learn',
      test: () => !!T.data.handLetters && T.data.handLetters.filter((l) => !l.gap).every((l) => explored(`lab:letter:${l.id}`)) },
    { id: 'scenes-all', title: 'Scene setter', desc: 'Explore every everyday scene.', icon: 'pin', world: 'learn',
      test: () => (T.data.scenes || []).length > 0 && (T.data.scenes || []).every((sc) => explored(`scene:${sc.id}`)) },
    { id: 'first-exhibit', title: 'Bisita', desc: 'Explore your first Deaf Community exhibit.', icon: 'people', world: 'community',
      test: () => COMMUNITY_EXHIBITS.some((x) => explored(`exhibit:${x}`)) },
    { id: 'stories-all', title: 'Story keeper', desc: 'Read every story in the Stories exhibit.', icon: 'story', world: 'community',
      test: () => !!T.data.storyList && T.data.storyList.every((st) => explored(`story:${st.id}`)) },
    { id: 'rights-all', title: 'Know your rights', desc: 'Open all nine areas of RA 11106 in the Rights exhibit.', icon: 'scale', world: 'community',
      test: () => (T.data.rights || []).length > 0 && T.data.rights.every((r) => explored(`rights:${r.sec}`)) },
    { id: 'history-all', title: 'Time traveler', desc: 'Visit every stop of the FSL history journey.', icon: 'compass', world: 'community',
      test: () => (T.data.timeline || []).length > 0 && T.data.timeline.every((t) => explored(`history:${t.year}`)) },
    { id: 'calendar', title: 'Save the date', desc: 'Add a Deaf community observance to your calendar.', icon: 'calendar', world: 'community',
      test: () => explored('calendar:saved') },
    { id: 'community-all', title: 'Community explorer', desc: `Explore all ${COMMUNITY_EXHIBITS.length} Deaf Community exhibits.`, icon: 'weave', world: 'community',
      test: () => COMMUNITY_EXHIBITS.every((x) => explored(`exhibit:${x}`)) },
    { id: 'both-worlds', title: 'Two ways of seeing', desc: 'Complete a lesson and explore a Deaf Community exhibit.', icon: 'eye', world: 'both',
      test: (s) => Object.keys(s.progress.lessons).length >= 1 && COMMUNITY_EXHIBITS.some((x) => explored(`exhibit:${x}`)) },
  ];

  function checkBadges() {
    const st = T.store.state;
    const earned = st.progress.badges || {};
    const newly = BADGES.filter((b) => {
      if (earned[b.id]) return false;
      try { return !!b.test(st); } catch (e) { return false; }
    });
    if (!newly.length) return;
    const now = new Date().toISOString();
    T.store.update((s) => { newly.forEach((b) => { s.progress.badges[b.id] = now; }); });
    newly.forEach((b, i) => setTimeout(() => {
      T.ui.toast(`Badge earned: ${b.title}`, { icon: 'trophy', tone: 'gold', timeout: 4500 });
    }, 400 + i * 700));
  }

  function bump(path) {
    T.store.update((st) => {
      if (path === 'recordings') st.progress.recordings = (Number(st.progress.recordings) || 0) + 1;
      if (path === 'bridgeUses') st.progress.bridgeUses = (Number(st.progress.bridgeUses) || 0) + 1;
      if (path === 'quizzes.taken') st.progress.quizzes.taken = (Number(st.progress.quizzes.taken) || 0) + 1;
      if (path === 'quizzes.perfect') st.progress.quizzes.perfect = (Number(st.progress.quizzes.perfect) || 0) + 1;
    });
    checkBadges();
  }

  function addJournal(entry) {
    T.store.update((st) => {
      if (!Array.isArray(st.progress.journal)) st.progress.journal = [];
      st.progress.journal.unshift({
        id: U.uid('j'),
        lessonId: entry.lessonId || '',
        prompt: String(entry.prompt || '').slice(0, 300),
        text: String(entry.text || '').slice(0, 2000),
        at: new Date().toISOString(),
      });
      st.progress.journal = st.progress.journal.slice(0, 200);
    });
    checkBadges();
  }

  T.progress = {
    addXP, logActivity, streak, todayXP, goal, completeLesson, lessonDone, unitDone, nextLesson,
    activeDays, checkBadges, bump, addJournal, BADGES,
    explored, exploredCount, markExplored, COMMUNITY_EXHIBITS,
    starsFor, gameResult, gamesPlayed, dailyGame, dailyDone,
  };
})();
