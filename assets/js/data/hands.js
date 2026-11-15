/* =========================================================================
   Tanaw — 3D hand poses (experimental prototype)

   The manual alphabet here is the one-handed alphabet that Filipino Sign
   Language shares with American Sign Language, modeled by the Tanaw team.
   FSL's letter T is formed differently from the American T (VERA Files 2015;
   Wikipedia), and no source we could reach describes it, so T is not
   modeled: it appears as a labeled gap. Ñ and NG are gaps too. Nothing here
   has been validated by Deaf FSL experts.

   Pose: rot [x, y, z] (degrees, hand turned at the wrist), pos [x, y, z] (cm),
         f: { i, m, r, p } fingers as [MCP, PIP, DIP, spread] (degrees;
            flexion bends toward the palm, spread leans toward the thumb),
         t: thumb [azimuth, elevation, roll, MCP, IP] (azimuth leans from the
            fingers toward the thumb side, elevation lifts it in front of the
            palm; with roll 0 the thumb bends across the palm).
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  /* Finger presets */
  const FIST = [88, 100, 58, 0];
  const UP = [0, 0, 0, 0];
  const TOGETHER = { i: [0, 0, 0, -5], m: [0, 0, 0, -1], r: [0, 0, 0, 4], p: [0, 0, 0, 9] };
  const fist = (o = {}) => Object.assign({ i: FIST, m: FIST, r: FIST, p: FIST }, o);

  /* Thumb presets. Contact poses (thumb touching a finger) were solved with a small
     optimiser that reaches the target point without passing through fingers or palm. */
  const THUMB_HOLD = [-2, 46, -40, 28, 26];    // pressing down the curled ring and little fingers
  const THUMB_ACROSS = [21, 57, -39, 43, 39];  // across the front of a fist
  const THUMB_FOLDED = [-6, 36, 0, 38, 30];    // folded across the palm under straight fingers
  const THUMB_PARALLEL = [12, 8, 0, 0, 0];     // straight, beside the index finger (G, Q)

  const P = {
    rest: { f: { i: [12, 18, 10, 0], m: [14, 20, 10, 0], r: [16, 22, 12, 0], p: [18, 24, 12, 0] }, t: [38, 22, 0, 8, 8] },

    /* ---------- Manual alphabet ---------- */
    A: { f: fist(), t: [6, 22, 0, 0, 0] },
    B: { f: TOGETHER, t: THUMB_FOLDED },
    C: { rot: [0, 68, 0], f: { i: [32, 42, 22, -5], m: [30, 44, 22, -1], r: [32, 44, 22, 4], p: [34, 44, 22, 9] }, t: [6, 46, -59, 3, 14] },
    D: { f: { i: UP, m: [50, 72, 36, 0], r: [55, 72, 36, 4], p: [62, 70, 32, 10] }, t: [7, 48, -1, 29, 20] },
    E: { f: { i: [28, 98, 68, -4], m: [28, 100, 68, -1], r: [30, 100, 68, 4], p: [32, 98, 66, 9] }, t: [33, 29, -22, 52, 67] },
    F: { f: { i: [52, 62, 28, -3], m: UP, r: [0, 0, 0, -4], p: [0, 0, 0, -6] }, t: [28, 48, -40, 14, 13] },
    G: { rot: [0, 180, -90], f: fist({ i: UP }), t: THUMB_PARALLEL },
    H: { rot: [0, 180, -90], f: fist({ i: [0, 0, 0, -5], m: [0, 0, 0, -1] }), t: [-7, 43, -39, 14, 40] },
    I: { f: fist({ p: [0, 0, 0, -4] }), t: [14, 58, -52, 38, 33] },
    J: { f: fist({ p: [0, 0, 0, -4] }), t: [14, 58, -52, 38, 33] },
    K: { f: fist({ i: [0, 0, 0, 4], m: [48, 0, 0, -3] }), t: [13, 24, -48, 31, 8] },
    L: { f: fist({ i: UP }), t: [88, 5, 0, 0, 0] },
    M: { f: { i: [80, 92, 40, -4], m: [80, 92, 40, -1], r: [80, 92, 40, 4], p: FIST }, t: [13, 21, -17, 72, 9] },
    N: { f: { i: [80, 92, 40, -4], m: [80, 92, 40, -1], r: FIST, p: FIST }, t: [28, 18, -14, 73, 13] },
    O: { rot: [0, 64, 0], f: { i: [40, 62, 32, -8], m: [38, 64, 34, -2], r: [42, 64, 34, 5], p: [46, 62, 32, 12] }, t: [19, 53, -52, 21, 24] },
    P: { rot: [112, 0, 0], f: fist({ i: [0, 0, 0, 4], m: [48, 0, 0, -3] }), t: [13, 24, -48, 31, 8] },
    Q: { rot: [150, 0, 0], f: fist({ i: UP }), t: THUMB_PARALLEL },
    R: { f: fist({ i: [8, 4, 0, -10], m: [-6, 0, 0, 14] }), t: [-3, 50, -47, 34, 20] },
    S: { f: fist(), t: THUMB_ACROSS },
    U: { f: fist({ i: [0, 0, 0, -5], m: [0, 0, 0, -1] }), t: THUMB_HOLD },
    V: { f: fist({ i: [0, 0, 0, 7], m: [0, 0, 0, -10] }), t: [-4, 48, -46, 24, 33] },
    W: { f: fist({ i: [0, 0, 0, 7], m: UP, r: [0, 0, 0, -8] }), t: [-26, 56, -24, 69, 52] },
    X: { f: fist({ i: [24, 86, 56, 0] }), t: [21, 38, -15, 30, 43] },
    Y: { f: fist({ p: [0, 0, 0, -16] }), t: [84, 8, 0, 0, 0] },
    Z: { f: fist({ i: UP }), t: [20, 47, -32, 34, 37] },

    /* ---------- Named handshapes ---------- */
    hs5: { f: { i: [0, 0, 0, 8], m: [0, 0, 0, 2], r: [0, 0, 0, -4], p: [0, 0, 0, -10] }, t: [70, 12, 0, 0, 0] },
    hsFlatB: { f: TOGETHER, t: [6, 22, 0, 0, 0] },
    hsBentB: { rot: [0, 50, 0], f: { i: [72, 0, 0, -5], m: [72, 0, 0, -1], r: [72, 0, 0, 4], p: [72, 0, 0, 9] }, t: [8, 24, 0, 0, 0] },
    hsC: null, // filled below from the letter
    hsO: null,
    hsFlatO: { rot: [0, 64, 0], f: { i: [74, 26, 12, -8], m: [72, 28, 14, -2], r: [74, 28, 14, 5], p: [78, 26, 12, 12] }, t: [-12, 49, -42, 4, 2] },
    hsS: null,
    hs1: { f: fist({ i: UP }), t: [23, 50, -36, 41, 30] },
    hsClaw: { f: { i: [22, 62, 44, 8], m: [20, 64, 44, 2], r: [22, 64, 44, -4], p: [24, 62, 42, -10] }, t: [56, 34, -20, 16, 32] },
    hs4: { f: { i: [0, 0, 0, 7], m: [0, 0, 0, 1], r: [0, 0, 0, -3], p: [0, 0, 0, -8] }, t: THUMB_FOLDED },
    hsL: null,
    hsV: null,
    hsY: null,
    hsX: null,
    hsA: null,
  };
  P.hsC = P.C; P.hsO = P.O; P.hsS = P.S; P.hsL = P.L; P.hsV = P.V; P.hsY = P.Y; P.hsX = P.X; P.hsA = P.A;

  /* Letters, in order. Descriptions are of the handshape only. */
  D.handLetters = [
    { id: 'A', desc: 'A fist, with the thumb straight up against the side of the index finger.' },
    { id: 'B', desc: 'Four fingers straight up and together; the thumb folded across the palm.' },
    { id: 'C', desc: 'Fingers and thumb curved into the shape of a C.' },
    { id: 'D', desc: 'Index finger straight up; the other fingertips meet the thumb in a circle.' },
    { id: 'E', desc: 'Fingertips bent down to rest above the thumb, which lies across the palm.' },
    { id: 'F', desc: 'Index fingertip and thumb tip touch in a circle; the other three fingers point up.' },
    { id: 'G', desc: 'Index finger and thumb point sideways, parallel; the other fingers are closed.' },
    { id: 'H', desc: 'Index and middle fingers point sideways together; the other fingers are closed.' },
    { id: 'I', desc: 'Little finger up; the other fingers closed, with the thumb across them.' },
    { id: 'J', desc: 'The I handshape; the little finger traces a J as the wrist turns.', motion: true },
    { id: 'K', desc: 'Index finger up, middle finger angled forward, thumb touching the middle finger between them.' },
    { id: 'L', desc: 'Index finger up and thumb out to the side, making an L.' },
    { id: 'M', desc: 'The thumb tucked under the first three fingers.' },
    { id: 'N', desc: 'The thumb tucked under the index and middle fingers.' },
    { id: 'O', desc: 'All the fingertips meet the thumb tip, making an O.' },
    { id: 'P', desc: 'Like K, with the hand turned to point down.' },
    { id: 'Q', desc: 'Like G, with the index finger and thumb pointing down.' },
    { id: 'R', desc: 'Index and middle fingers up and crossed.' },
    { id: 'S', desc: 'A fist, with the thumb across the front of the fingers.' },
    { id: 'T', gap: true, desc: 'FSL’s T is formed differently from the American T. It is not modeled in this prototype — learn it from a Deaf FSL teacher.' },
    { id: 'U', desc: 'Index and middle fingers up together.' },
    { id: 'V', desc: 'Index and middle fingers up and spread apart.' },
    { id: 'W', desc: 'Index, middle and ring fingers up and spread; the thumb holds the little finger.' },
    { id: 'X', desc: 'Index finger hooked; the other fingers closed.' },
    { id: 'Y', desc: 'Thumb and little finger out; the other fingers closed.' },
    { id: 'Z', desc: 'The index finger traces a Z in the air.', motion: true },
  ];

  /* Named handshapes used to describe signs. Cueto et al. (2020) list 5, 1,
     flat-O, S, bent-5 (claw), 4 and C among common handshapes in the FSL signs they animated. */
  D.handshapes = [
    { id: 'hs5', name: '5', desc: 'Open hand: all fingers and the thumb straight and spread.' },
    { id: 'hsFlatB', name: 'Flat B', desc: 'Fingers straight and together, thumb alongside.' },
    { id: 'hsBentB', name: 'Bent B', desc: 'Flat hand bent at the knuckles, fingers together.' },
    { id: 'hsC', name: 'C', desc: 'Fingers and thumb curved as if holding a cup.' },
    { id: 'hsO', name: 'O', desc: 'Fingertips meet the thumb tip in a round O.' },
    { id: 'hsFlatO', name: 'Flat O', desc: 'Straight fingers meet the thumb at the tips, like a beak.' },
    { id: 'hsS', name: 'S', desc: 'A fist with the thumb across the fingers.' },
    { id: 'hsA', name: 'A', desc: 'A fist with the thumb along the side.' },
    { id: 'hs1', name: '1', desc: 'Index finger straight; the others closed.' },
    { id: 'hsL', name: 'L', desc: 'Index finger and thumb at a right angle.' },
    { id: 'hsV', name: 'V', desc: 'Index and middle fingers spread.' },
    { id: 'hsY', name: 'Y', desc: 'Thumb and little finger out.' },
    { id: 'hsX', name: 'X', desc: 'Index finger hooked.' },
    { id: 'hsClaw', name: 'Bent 5 (claw)', desc: 'Spread fingers and thumb, curved like a claw.' },
    { id: 'hs4', name: '4', desc: 'Four fingers straight and spread; thumb folded.' },
  ];

  /* Palm orientation and movement: one of the five parameters each. */
  D.handDemos = {
    orientation: [
      { id: 'or-out', name: 'Palm out', desc: 'The palm faces the person you are signing to.', pose: 'hsFlatB', rot: [0, 0, 0] },
      { id: 'or-in', name: 'Palm in', desc: 'The palm faces the signer.', pose: 'hsFlatB', rot: [0, 180, 0] },
      { id: 'or-up', name: 'Palm up', desc: 'The palm faces up; the fingers point forward.', pose: 'hsFlatB', rot: [-70, 180, 0] },
      { id: 'or-down', name: 'Palm down', desc: 'The palm faces down; the fingers point forward.', pose: 'hsFlatB', rot: [70, 0, 0] },
      { id: 'or-side', name: 'Palm sideways', desc: 'The palm faces to the side, toward the signer’s other hand.', pose: 'hsFlatB', rot: [0, 90, 0] },
    ],
    movement: [
      { id: 'mv-straight', name: 'Straight', desc: 'The hand moves in a straight line, out and back.', pose: 'hs1', path: [[0, 0, 0], [0, 0, 6], [0, 0, 0]] },
      { id: 'mv-arc', name: 'Arc', desc: 'The hand travels along a curve.', pose: 'hsFlatB', path: [[-4, 0, 0], [-2.8, 2, 0], [0, 2.8, 0], [2.8, 2, 0], [4, 0, 0]] },
      { id: 'mv-circle', name: 'Circle', desc: 'The hand draws a circle.', pose: 'hs1', path: Array.from({ length: 13 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return [Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0]; }) },
      { id: 'mv-repeat', name: 'Repeated', desc: 'The same small movement happens twice.', pose: 'hsBentB', path: [[0, 0, 0], [0, -1.8, 0.6], [0, 0, 0], [0, -1.8, 0.6], [0, 0, 0]] },
      { id: 'mv-twist', name: 'Twist', desc: 'The forearm turns, twisting the hand.', pose: 'hs1', turn: [[0, 0, 0], [0, 70, 0], [0, -40, 0], [0, 70, 0], [0, 0, 0]] },
      { id: 'mv-hold', name: 'Hold', desc: 'No movement: the hand holds still.', pose: 'hsS', path: [[0, 0, 0]] },
    ],
  };

  /* ---------- Pose access ---------- */
  const LETTER = Object.fromEntries(D.handLetters.map((l) => [l.id, l]));
  D.handLetter = (ch) => LETTER[String(ch).toUpperCase()] || null;
  D.handPose = (id) => P[id] || null;
  D.handHasPose = (id) => !!P[id] && !(LETTER[id] && LETTER[id].gap);

  const state = (pose, extra = {}) => {
    const p = Object.assign({}, pose, extra);
    if (extra.rotAdd) {
      const r = pose.rot || [0, 0, 0];
      p.rot = [r[0] + extra.rotAdd[0], r[1] + extra.rotAdd[1], r[2] + extra.rotAdd[2]];
    }
    return T.hand3d.makeState(p);
  };

  const HOLD = 420;
  const MOVE = 260;

  /* Keyframes to show one letter or handshape (with its movement, for J and Z). */
  D.handKeys = (id) => {
    const pose = P[id];
    if (!pose) return null;
    if (id === 'J') {
      // The little finger draws down, then hooks toward the signer's left as the wrist turns the palm in.
      return [
        { state: state(pose), dur: 380 },
        { state: state(pose, { pos: [0, -2.6, 0], rotAdd: [0, 20, 0] }), dur: 280 },
        { state: state(pose, { pos: [0.9, -3.8, 0.5], rotAdd: [0, 90, 0] }), dur: 300 },
        { state: state(pose, { pos: [2, -3.2, 0.4], rotAdd: [0, 150, 0] }), dur: 260 },
        { state: state(pose, { pos: [2, -3.2, 0.4], rotAdd: [0, 150, 0] }), dur: 260 },
      ];
    }
    if (id === 'Z') {
      return [
        { state: state(pose, { pos: [2, 2, 0] }), dur: 380 },
        { state: state(pose, { pos: [-2, 2, 0] }), dur: 260, ease: 'linear' },
        { state: state(pose, { pos: [2, -2, 0] }), dur: 300, ease: 'linear' },
        { state: state(pose, { pos: [-2, -2, 0] }), dur: 260, ease: 'linear' },
        { state: state(pose, { pos: [-2, -2, 0] }), dur: 260 },
      ];
    }
    return [{ state: state(pose), dur: 420 }];
  };

  /* Keyframes for a movement or orientation demonstration. */
  D.handDemo = (id) => {
    const all = D.handDemos.orientation.concat(D.handDemos.movement);
    const demo = all.find((d) => d.id === id);
    if (!demo) return null;
    const base = P[demo.pose];
    if (demo.rot) return [{ state: state(base, { rot: demo.rot }), dur: 520 }];
    if (demo.turn) return [{ state: state(base), dur: 380 }].concat(demo.turn.map((r) => ({ state: state(base, { rotAdd: r }), dur: 320 })));
    const keys = [{ state: state(base, { pos: demo.path[0] }), dur: 380 }];
    demo.path.slice(1).forEach((p) => keys.push({ state: state(base, { pos: p }), dur: demo.id === 'mv-circle' ? 110 : 300, ease: demo.id === 'mv-circle' ? 'linear' : undefined }));
    keys.push({ state: keys[keys.length - 1].state, dur: 400 });
    return keys;
  };

  /* Split text into fingerspelling steps. NG is one letter in Filipino; it is a gap, like Ñ and T. */
  D.spellTokens = (text) => {
    const out = [];
    const up = String(text || '').toUpperCase();
    for (let i = 0; i < up.length; i++) {
      const ch = up[i];
      if (/\s/.test(ch)) { if (out.length && !out[out.length - 1].space) out.push({ char: ' ', space: true }); continue; }
      if (ch === 'N' && up[i + 1] === 'G') { out.push({ char: 'NG', gap: true, note: 'NG is one letter in the Filipino alphabet. Its FSL form is not modeled.' }); i++; continue; }
      if (ch === 'Ñ') { out.push({ char: 'Ñ', gap: true, note: 'Ñ is not modeled. Learn it from a Deaf FSL teacher.' }); continue; }
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      const letter = LETTER[base];
      if (letter && !letter.gap) { out.push({ char: base, id: base }); continue; }
      if (letter && letter.gap) { out.push({ char: base, gap: true, note: 'FSL’s T is formed differently from the American T and is not modeled.' }); continue; }
      if (/[0-9]/.test(ch)) { out.push({ char: ch, gap: true, note: 'Digits are signed as numbers, which this prototype does not model.' }); continue; }
    }
    while (out.length && out[out.length - 1].space) out.pop();
    return out;
  };

  /* A spelling plan: tokens plus keyframes, each token's first key carrying its step. */
  D.spellPlan = (text) => {
    const tokens = D.spellTokens(text);
    const keys = [];
    let prev = null;
    let slide = 0;
    tokens.forEach((tok, index) => {
      if (tok.space) {
        if (keys.length) keys.push({ state: keys[keys.length - 1].state, dur: 360, step: { index, char: ' ', space: true } });
        prev = null;
        return;
      }
      if (tok.gap) {
        const rest = state(P.rest);
        keys.push({ state: rest, dur: MOVE, step: { index, char: tok.char, gap: true, note: tok.note } });
        keys.push({ state: rest, dur: 620 });
        prev = null;
        return;
      }
      const pose = P[tok.id];
      if (tok.id === 'J' || tok.id === 'Z') {
        const motion = D.handKeys(tok.id);
        motion[0] = Object.assign({}, motion[0], { dur: MOVE + 80, step: { index, char: tok.char, id: tok.id } });
        keys.push(...motion);
        prev = tok.id;
        slide = 0;
        return;
      }
      // A double letter slides a little to the side instead of re-forming the handshape.
      slide = prev === tok.id ? (slide ? 0 : -2.2) : 0;
      const s = state(pose, { pos: [slide, 0, 0] });
      keys.push({ state: s, dur: MOVE, step: { index, char: tok.char, id: tok.id, double: prev === tok.id } });
      keys.push({ state: s, dur: HOLD });
      prev = tok.id;
    });
    return { tokens, keys };
  };
})();
