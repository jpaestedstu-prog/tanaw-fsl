/* =========================================================================
   Tanaw — spaced repetition (simplified SM-2 scheduling, day granularity)

   Two decks:
     concepts  facts about FSL, Deaf culture and rights (always available)
     signs     vocabulary entries that have media (verified / on-device / test)
               plus any entry the learner added manually
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;

  const NEW_PER_DAY = 10;
  const RATINGS = ['Again', 'Hard', 'Good', 'Easy'];

  const conceptId = (id) => `concept:${id}`;
  const signId = (id) => `sign:${id}`;

  function conceptCards() {
    return T.data.concepts.map((c) => ({ id: conceptId(c.id), type: 'concept', ref: c }));
  }

  function signCards() {
    const added = T.store.state.srs.added || {};
    return T.data.allSigns()
      .filter((s) => T.media.hasMedia(s.id) || added[s.id])
      .map((s) => ({ id: signId(s.id), type: 'sign', ref: s }));
  }

  const cardsFor = (deck) => (deck === 'signs' ? signCards() : conceptCards());
  const schedule = (cardId) => T.store.state.srs.cards[cardId] || null;

  function newDoneToday(deck) {
    const log = T.store.state.srs.newLog[U.dateKey()];
    return log && Number(log[deck]) ? Number(log[deck]) : 0;
  }

  function queue(deck) {
    const today = U.dateKey();
    const cards = cardsFor(deck);
    const due = cards.filter((c) => { const s = schedule(c.id); return s && s.due <= today; });
    const fresh = cards.filter((c) => !schedule(c.id));
    const allowance = Math.max(0, NEW_PER_DAY - newDoneToday(deck));
    return { due: U.shuffle(due), fresh: fresh.slice(0, allowance), total: cards.length, unseen: fresh.length };
  }

  function counts(deck) {
    const q = queue(deck);
    return { due: q.due.length, fresh: q.fresh.length, total: q.total, unseen: q.unseen };
  }

  /** Next scheduling state for a rating 0..3 (Again, Hard, Good, Easy). */
  function next(prev, rating) {
    let ease = Number(prev && prev.ease) || 2.5;
    let interval = Number(prev && prev.interval) || 0;
    let reps = Number(prev && prev.reps) || 0;
    let lapses = Number(prev && prev.lapses) || 0;
    if (rating === 0) {
      reps = 0; lapses += 1; interval = 0; ease = Math.max(1.3, ease - 0.2);
    } else if (rating === 1) {
      interval = reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(1.3, ease - 0.15); reps += 1;
    } else if (rating === 2) {
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(interval + 1, Math.round(interval * ease));
      reps += 1;
    } else {
      interval = reps === 0 ? 3 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
      ease = Math.min(3.2, ease + 0.15); reps += 1;
    }
    return { ease: Math.round(ease * 100) / 100, interval, reps, lapses };
  }

  function preview(cardId) {
    const s = schedule(cardId) || {};
    return [0, 1, 2, 3].map((r) => next(s, r).interval);
  }

  function intervalLabel(days) {
    if (days <= 0) return 'Again today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    const months = Math.round(days / 30);
    return months <= 1 ? '1 month' : `${months} months`;
  }

  function grade(card, rating, deck) {
    const today = U.dateKey();
    T.store.update((st) => {
      const prev = st.srs.cards[card.id];
      const n = next(prev, rating);
      st.srs.cards[card.id] = Object.assign(n, { due: U.addDays(today, n.interval), last: today });
      st.srs.reviews = (Number(st.srs.reviews) || 0) + 1;
      if (!prev) {
        const log = st.srs.newLog[today] || (st.srs.newLog[today] = {});
        log[deck] = (Number(log[deck]) || 0) + 1;
      }
      // Keep the new-card log small.
      Object.keys(st.srs.newLog).forEach((k) => { if (!U.isDateKey(k) || U.daysBetween(k, today) > 7) delete st.srs.newLog[k]; });
    });
  }

  function isAdded(id) { return !!(T.store.state.srs.added || {})[id]; }

  function setAdded(id, on) {
    T.store.update((st) => {
      if (on) st.srs.added[id] = true;
      else delete st.srs.added[id];
    });
  }

  T.srs = { RATINGS, NEW_PER_DAY, queue, counts, grade, preview, intervalLabel, isAdded, setAdded, signCards, conceptCards, cardId: { concept: conceptId, sign: signId } };
})();
