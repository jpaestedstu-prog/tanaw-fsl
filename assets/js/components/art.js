/* =========================================================================
   Tanaw — illustration library (inline SVG)
   Abstract spot illustrations themed with CSS classes (.a-*), so they adapt
   to light, dark and high-contrast modes. By design, no illustration shows
   a hand or handshape: figures appear as head-and-shoulders busts only.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;

  const svg = (body, viewBox = '0 0 320 200', cls = '') =>
    `<svg class="art ${cls}" viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

  /** Head-and-shoulders bust centered at (cx, top). Every coordinate scales with `scale`. */
  const bust = (cx, top, scale = 1, cls = 'a-primary') => {
    const n = (v) => +(v * scale).toFixed(2);
    return `<g class="${cls}">
      <circle cx="${cx}" cy="${+(top + n(22)).toFixed(2)}" r="${n(20)}"/>
      <path d="M${+(cx - n(44)).toFixed(2)} ${+(top + n(96)).toFixed(2)}c${n(3)} ${-n(28)} ${n(20)} ${-n(46)} ${n(44)} ${-n(46)}s${n(41)} ${n(18)} ${n(44)} ${n(46)}z"/>
    </g>`;
  };

  const A = {};

  A.signingSpace = () => svg(`
    <rect class="a-space" x="70" y="18" width="180" height="168" rx="16"/>
    <path class="a-guide" d="M70 70h180M70 128h180M130 18v168M190 18v168"/>
    <g class="a-figure">
      <circle cx="160" cy="68" r="26"/>
      <path d="M100 186c4-38 28-62 60-62s56 24 60 62z"/>
    </g>
  `, '0 0 320 200', 'art--bust');

  A.emblem = () => svg(`
    <circle cx="160" cy="100" r="86" class="a-gold-soft"/>
    <circle cx="160" cy="100" r="86" class="a-dash" fill="none"/>
    <path d="M56 100c30-42 64-63 104-63s74 21 104 63c-30 42-64 63-104 63S86 142 56 100z" class="a-surface a-stroke"/>
    <circle cx="160" cy="100" r="38" class="a-gold"/>
    <circle cx="160" cy="100" r="17" class="a-pupil"/>
    <circle cx="169" cy="91" r="6" class="a-white"/>
  `);

  A.eye = () => svg(`
    <g class="a-line-stroke">
      <path d="M160 20v18M160 162v18M86 46l12 13M234 46l-12 13M86 154l12-13M234 154l-12-13"/>
    </g>
    <path d="M70 100c26-36 56-54 90-54s64 18 90 54c-26 36-56 54-90 54s-64-18-90-54z" class="a-surface a-stroke"/>
    <circle cx="160" cy="100" r="30" class="a-teal"/>
    <circle cx="160" cy="100" r="13" class="a-pupil"/>
    <circle cx="167" cy="93" r="5" class="a-white"/>
  `);

  A.law = () => svg(`
    <rect x="94" y="18" width="132" height="164" rx="12" class="a-surface a-stroke"/>
    <rect x="112" y="38" width="96" height="16" rx="8" class="a-primary-soft"/>
    <text x="160" y="50.5" text-anchor="middle" class="a-label a-label--primary">RA 11106</text>
    <rect x="112" y="68" width="96" height="6" rx="3" class="a-line-fill"/>
    <rect x="112" y="82" width="80" height="6" rx="3" class="a-line-fill"/>
    <rect x="112" y="96" width="90" height="6" rx="3" class="a-line-fill"/>
    <rect x="112" y="110" width="64" height="6" rx="3" class="a-line-fill"/>
    <circle cx="196" cy="150" r="20" class="a-gold"/>
    <path d="m196 138 3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.8-7-3.7-7 3.7 1.3-7.8-5.7-5.6 7.9-1.1z" class="a-white"/>
    <text x="40" y="60" class="a-label">2018</text>
    <path d="M44 70c10 20 26 30 44 34" class="a-dash" fill="none"/>
  `);

  A.globe = () => svg(`
    <circle cx="160" cy="100" r="66" class="a-teal-soft a-stroke"/>
    <path d="M94 100h132M160 34c22 18 32 40 32 66s-10 48-32 66c-22-18-32-40-32-66s10-48 32-66z" class="a-line-stroke" fill="none"/>
    <g>
      <rect x="44" y="34" width="62" height="30" rx="15" class="a-primary"/>
      <text x="75" y="54" text-anchor="middle" class="a-label a-label--on">FSL</text>
      <rect x="226" y="52" width="62" height="30" rx="15" class="a-surface a-stroke"/>
      <text x="257" y="72" text-anchor="middle" class="a-label">JSL</text>
      <rect x="214" y="134" width="62" height="30" rx="15" class="a-surface a-stroke"/>
      <text x="245" y="154" text-anchor="middle" class="a-label">BSL</text>
      <rect x="40" y="140" width="62" height="30" rx="15" class="a-surface a-stroke"/>
      <text x="71" y="160" text-anchor="middle" class="a-label">ASL</text>
    </g>
  `);

  A.islands = () => svg(`
    <path d="M118 30c14-6 26 4 24 18-2 12 8 18 4 30-4 10-18 8-22 18-4 8-16 10-20 0-4-12 6-18 2-30-4-14-2-30 12-36z" class="a-teal-soft a-stroke"/>
    <path d="M150 104c10-4 20 2 22 10 2 10-8 12-14 16-8 4-16-2-16-10 0-8 2-13 8-16z" class="a-teal-soft a-stroke"/>
    <path d="M186 96c8-2 14 4 12 12-2 6-10 6-14 2-4-4-4-12 2-14z" class="a-teal-soft a-stroke"/>
    <path d="M176 140c16-6 32 2 34 16 2 14-14 22-28 20-14-2-22-12-18-22 2-6 6-11 12-14z" class="a-teal-soft a-stroke"/>
    <g class="a-pin"><circle cx="126" cy="58" r="8" class="a-coral"/><circle cx="126" cy="58" r="3" class="a-white"/></g>
    <g class="a-pin"><circle cx="160" cy="116" r="8" class="a-gold"/><circle cx="160" cy="116" r="3" class="a-white"/></g>
    <g class="a-pin"><circle cx="192" cy="156" r="8" class="a-primary"/><circle cx="192" cy="156" r="3" class="a-white"/></g>
    <text x="40" y="62" class="a-label">Luzon</text>
    <text x="226" y="112" class="a-label">Visayas</text>
    <text x="226" y="176" class="a-label">Mindanao</text>
  `);

  A.community = () => svg(`
    <circle cx="160" cy="112" r="84" class="a-gold-soft"/>
    ${bust(100, 74, 0.9, 'a-teal')}
    ${bust(220, 74, 0.9, 'a-coral')}
    ${bust(160, 58, 1.05, 'a-primary')}
  `);

  A.attention = () => svg(`
    <g class="a-line-stroke">
      <path d="M86 34l-8-10M118 22l2-12M150 34l8-10M70 64H58M162 64h12"/>
    </g>
    <path d="M118 30a30 30 0 0 0-18 54c4 3 6 8 6 12v4h24v-4c0-4 2-9 6-12a30 30 0 0 0-18-54z" class="a-gold a-stroke"/>
    <rect x="106" y="104" width="24" height="10" rx="4" class="a-line-fill"/>
    ${bust(232, 70, 0.95, 'a-primary')}
    <circle cx="200" cy="124" r="10" class="a-ripple"/>
    <circle cx="200" cy="124" r="20" class="a-ripple a-ripple--2"/>
  `);

  A.parameters = () => svg(`
    <circle cx="160" cy="100" r="36" class="a-gold"/>
    <circle cx="160" cy="100" r="15" class="a-pupil"/>
    <g class="a-line-stroke"><path d="M160 64V40M126 90l-26-10M194 90l26-10M136 128l-18 18M184 128l18 18"/></g>
    <g>
      <rect x="112" y="12" width="96" height="28" rx="14" class="a-primary"/><text x="160" y="31" text-anchor="middle" class="a-label a-label--on">Handshape</text>
      <rect x="6" y="62" width="100" height="28" rx="14" class="a-surface a-stroke"/><text x="56" y="81" text-anchor="middle" class="a-label">Orientation</text>
      <rect x="214" y="62" width="100" height="28" rx="14" class="a-surface a-stroke"/><text x="264" y="81" text-anchor="middle" class="a-label">Location</text>
      <rect x="44" y="146" width="100" height="28" rx="14" class="a-surface a-stroke"/><text x="94" y="165" text-anchor="middle" class="a-label">Movement</text>
      <rect x="176" y="146" width="100" height="28" rx="14" class="a-teal"/><text x="226" y="165" text-anchor="middle" class="a-label a-label--on">Non-manual</text>
    </g>
  `);

  A.face = () => svg(`
    <circle cx="150" cy="104" r="70" class="a-primary-soft a-stroke"/>
    <path d="M110 76c8-10 20-12 30-6M160 70c10-6 22-4 30 6" class="a-ink-stroke" fill="none"/>
    <circle cx="125" cy="94" r="8" class="a-ink"/>
    <circle cx="175" cy="94" r="8" class="a-ink"/>
    <path d="M126 132c14 12 34 12 48 0" class="a-ink-stroke" fill="none"/>
    <g>
      <path d="M232 30h52a12 12 0 0 1 12 12v28a12 12 0 0 1-12 12h-28l-16 14V82h-8a12 12 0 0 1-12-12V42a12 12 0 0 1 12-12z" class="a-gold"/>
      <text x="258" y="66" text-anchor="middle" class="a-label a-label--xl">?</text>
    </g>
  `);

  A.space = () => svg(`
    <rect class="a-space" x="78" y="14" width="164" height="172" rx="14"/>
    <g class="a-figure">
      <circle cx="160" cy="62" r="24"/>
      <path d="M104 186c4-36 26-58 56-58s52 22 56 58z"/>
    </g>
    <g class="a-line-stroke"><path d="M262 14v172M256 14h12M256 186h12"/></g>
    <text x="276" y="40" class="a-label">head</text>
    <text x="276" y="182" class="a-label">waist</text>
    <text x="82" y="34" class="a-label a-label--primary">signing space</text>
  `);

  A.lighting = () => svg(`
    <rect x="232" y="26" width="64" height="88" rx="6" class="a-surface a-stroke"/>
    <path d="M264 26v88M232 70h64" class="a-line-stroke"/>
    <path d="M226 20l76 100" class="a-coral-stroke"/>
    ${bust(170, 64, 1, 'a-primary')}
    <g>
      <path d="M40 92h30l10-24H30z" class="a-gold a-stroke"/>
      <path d="M55 92v60M38 156h34" class="a-ink-stroke"/>
    </g>
    <path d="M86 70l40 4M88 86l36 12M86 54l40-4" class="a-gold-stroke"/>
    <circle cx="70" cy="30" r="14" class="a-teal"/><path d="m63 30 5 5 9-10" class="a-white-stroke" fill="none"/>
  `);

  A.mirror = () => svg(`
    <rect x="86" y="14" width="148" height="172" rx="18" class="a-surface a-stroke"/>
    <rect x="98" y="28" width="124" height="128" rx="10" class="a-primary-soft"/>
    ${bust(160, 46, 1.05, 'a-primary')}
    <rect x="104" y="34" width="112" height="116" rx="8" class="a-dash" fill="none"/>
    <circle cx="160" cy="171" r="8" class="a-coral"/>
    <circle cx="116" cy="40" r="5" class="a-coral"/>
  `);

  const tiles = (labels, tones) => labels.map((l, i) => {
    const x = 34 + i * 66;
    const tone = tones[i % tones.length];
    return `<rect x="${x}" y="${66 + (i % 2) * 14}" width="56" height="56" rx="14" class="${tone} a-stroke"/>
      <text x="${x + 28}" y="${102 + (i % 2) * 14}" text-anchor="middle" class="a-label a-label--xl">${l}</text>`;
  }).join('');

  A.letters = () => svg(tiles(['A', 'B', 'C', 'D'], ['a-primary-soft', 'a-gold-soft', 'a-teal-soft', 'a-coral-soft']));
  A.numbers = () => svg(tiles(['0', '1', '2', '3'], ['a-teal-soft', 'a-primary-soft', 'a-gold-soft', 'a-coral-soft']));

  A.chat = () => svg(`
    <path d="M44 34h132a16 16 0 0 1 16 16v52a16 16 0 0 1-16 16H96l-28 24v-24H44a16 16 0 0 1-16-16V50a16 16 0 0 1 16-16z" class="a-primary-soft a-stroke"/>
    <rect x="52" y="58" width="104" height="8" rx="4" class="a-line-fill"/>
    <rect x="52" y="76" width="76" height="8" rx="4" class="a-line-fill"/>
    <path d="M146 92h126a16 16 0 0 1 16 16v44a16 16 0 0 1-16 16h-16v22l-26-22h-84a16 16 0 0 1-16-16v-44a16 16 0 0 1 16-16z" class="a-gold a-stroke"/>
    <rect x="156" y="114" width="96" height="8" rx="4" class="a-dark-fill"/>
    <rect x="156" y="132" width="64" height="8" rx="4" class="a-dark-fill"/>
  `);

  A.town = () => svg(`
    <path d="M24 92l34-28 34 28v66H24z" class="a-coral-soft a-stroke"/>
    <rect x="48" y="122" width="20" height="36" rx="3" class="a-coral"/>
    <path d="M100 76h56v82h-56z" class="a-teal-soft a-stroke"/>
    <rect x="110" y="88" width="14" height="14" rx="2" class="a-teal"/><rect x="132" y="88" width="14" height="14" rx="2" class="a-teal"/>
    <rect x="110" y="112" width="14" height="14" rx="2" class="a-teal"/><rect x="132" y="112" width="14" height="14" rx="2" class="a-teal"/>
    <g>
      <path d="M170 112c0-10 8-16 18-16h84c10 0 16 6 18 16l6 22v20a6 6 0 0 1-6 6H176a6 6 0 0 1-6-6z" class="a-gold a-stroke"/>
      <rect x="180" y="108" width="20" height="16" rx="3" class="a-surface"/><rect x="206" y="108" width="20" height="16" rx="3" class="a-surface"/>
      <rect x="232" y="108" width="20" height="16" rx="3" class="a-surface"/><rect x="258" y="108" width="20" height="16" rx="3" class="a-surface"/>
      <rect x="176" y="134" width="114" height="6" rx="3" class="a-coral"/>
      <circle cx="200" cy="162" r="11" class="a-ink"/><circle cx="268" cy="162" r="11" class="a-ink"/>
      <circle cx="200" cy="162" r="4" class="a-white"/><circle cx="268" cy="162" r="4" class="a-white"/>
    </g>
    <path d="M10 174h300" class="a-line-stroke"/>
  `);

  A.calendar = () => svg(`
    <rect x="86" y="26" width="148" height="152" rx="16" class="a-surface a-stroke"/>
    <path d="M86 64h148" class="a-line-stroke"/>
    <rect x="86" y="26" width="148" height="38" rx="16" class="a-primary"/>
    <rect x="86" y="46" width="148" height="18" class="a-primary"/>
    <text x="160" y="51" text-anchor="middle" class="a-label a-label--on">NOV</text>
    <path d="M118 18v20M202 18v20" class="a-ink-stroke"/>
    ${[0, 1, 2, 3, 4].map((c) => [0, 1, 2].map((r) => `<rect x="${102 + c * 24}" y="${80 + r * 28}" width="18" height="18" rx="5" class="${c === 2 && r === 1 ? 'a-gold' : 'a-line-fill'}"/>`).join('')).join('')}
  `);

  A.alert = () => svg(`
    <path d="M160 22 76 168h168z" class="a-gold a-stroke"/>
    <path d="M160 72v50" class="a-dark-stroke a-thick"/>
    <circle cx="160" cy="142" r="6" class="a-pupil"/>
    <path d="M18 176c16-10 32-10 48 0s32 10 48 0M206 176c16-10 32-10 48 0s32 10 48 0" class="a-teal-stroke" fill="none"/>
    <rect x="228" y="34" width="66" height="34" rx="17" class="a-coral"/>
    <text x="261" y="57" text-anchor="middle" class="a-label a-label--on">911</text>
  `);

  /** Large hero emblem for the home page. */
  A.hero = () => svg(`
    <defs>
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" class="a-stop-gold"/>
        <stop offset="100%" class="a-stop-transparent"/>
      </radialGradient>
    </defs>
    <circle cx="200" cy="200" r="190" fill="url(#heroGlow)"/>
    <circle cx="200" cy="200" r="168" class="a-dash a-orbit" fill="none"/>
    <circle cx="200" cy="200" r="118" class="a-ring" fill="none"/>
    <path d="M54 200c40-62 88-92 146-92s106 30 146 92c-40 62-88 92-146 92S94 262 54 200z" class="a-surface a-stroke a-hero-eye"/>
    <circle cx="200" cy="200" r="56" class="a-gold"/>
    <circle cx="200" cy="200" r="25" class="a-pupil"/>
    <circle cx="213" cy="187" r="9" class="a-white"/>
    <g class="a-sparks">
      <circle cx="200" cy="32" r="6" class="a-coral"/>
      <circle cx="368" cy="200" r="6" class="a-teal"/>
      <circle cx="200" cy="368" r="6" class="a-primary"/>
      <circle cx="32" cy="200" r="6" class="a-gold"/>
    </g>
  `, '0 0 400 400', 'art--hero');

  /* ---------- Everyday scenes (320 × 200) ---------- */
  const floor = '<path d="M10 176h300" class="a-line-stroke"/>';

  const SCENES = {};

  SCENES.clinic = () => svg(`
    <rect x="18" y="18" width="284" height="158" rx="18" class="a-teal-soft"/>
    <rect x="214" y="34" width="66" height="66" rx="12" class="a-surface a-stroke"/>
    <path d="M247 49v36M229 67h36" class="a-cross"/>
    <rect x="34" y="98" width="38" height="48" rx="6" class="a-surface a-stroke"/>
    <path d="M42 113h22M42 123h22M42 133h13" class="a-line-stroke"/>
    ${bust(112, 80, 0.82, 'a-primary')}
    ${bust(178, 70, 0.95, 'a-teal')}
    ${bust(250, 104, 0.66, 'a-gold')}
    ${floor}
  `);

  SCENES.store = () => svg(`
    <rect x="40" y="58" width="240" height="118" rx="6" class="a-gold-soft a-stroke"/>
    <path d="M28 58h264l-14-30H42z" class="a-coral a-stroke"/>
    <path d="M78 28l-5 30M114 28l-3 30M150 28l-1 30M186 28l1 30M222 28l3 30M258 28l5 30" class="a-white-stroke"/>
    <rect x="58" y="76" width="140" height="70" rx="4" class="a-surface a-stroke"/>
    <rect x="66" y="84" width="10" height="14" rx="2" class="a-teal"/><rect x="80" y="86" width="10" height="12" rx="2" class="a-coral"/><rect x="94" y="83" width="10" height="15" rx="2" class="a-primary"/>
    <rect x="140" y="107" width="12" height="14" rx="2" class="a-gold"/><rect x="156" y="109" width="12" height="12" rx="2" class="a-teal"/>
    <path d="M58 100h140M58 123h140M93 76v70M128 76v70M163 76v70" class="a-line-stroke"/>
    <path d="M172 128h22l7 7-7 7h-22z" class="a-gold a-stroke"/>
    ${bust(242, 84, 0.9, 'a-primary')}
    ${floor}
  `);

  SCENES.commute = () => svg(`
    <path d="M58 176V72" class="a-ink-stroke"/>
    <rect x="34" y="44" width="48" height="30" rx="7" class="a-teal a-stroke"/>
    <text x="58" y="64" text-anchor="middle" class="a-label a-label--on">PARA</text>
    ${bust(104, 86, 0.82, 'a-coral')}
    <g transform="translate(-16 2)">
      <path d="M170 112c0-10 8-16 18-16h84c10 0 16 6 18 16l6 22v20a6 6 0 0 1-6 6H176a6 6 0 0 1-6-6z" class="a-gold a-stroke"/>
      <rect x="180" y="108" width="20" height="16" rx="3" class="a-surface"/><rect x="206" y="108" width="20" height="16" rx="3" class="a-surface"/>
      <rect x="232" y="108" width="20" height="16" rx="3" class="a-surface"/><rect x="258" y="108" width="20" height="16" rx="3" class="a-surface"/>
      <rect x="176" y="134" width="114" height="6" rx="3" class="a-coral"/>
      <circle cx="200" cy="162" r="11" class="a-ink"/><circle cx="268" cy="162" r="11" class="a-ink"/>
      <circle cx="200" cy="162" r="4" class="a-white"/><circle cx="268" cy="162" r="4" class="a-white"/>
    </g>
    ${floor}
  `);

  SCENES.school = () => svg(`
    <path d="M56 82 160 32l104 50z" class="a-primary-soft a-stroke"/>
    <path d="M160 32V8" class="a-ink-stroke"/><path d="M160 9h26l-6 7 6 7h-26z" class="a-gold"/>
    <rect x="68" y="82" width="184" height="94" class="a-surface a-stroke"/>
    <rect x="96" y="96" width="128" height="48" rx="4" class="a-teal"/>
    <path d="M110 111h62M110 125h40" class="a-white-stroke"/>
    ${bust(104, 118, 0.6, 'a-coral')}
    ${bust(216, 118, 0.6, 'a-primary')}
    ${floor}
  `);

  SCENES.home = () => svg(`
    <path d="M160 14c-5-8-19-6-18 6 1 9 18 18 18 18s17-9 18-18c1-12-13-14-18-6z" class="a-coral"/>
    <path d="M90 94 160 40l70 54v82H90z" class="a-coral-soft a-stroke"/>
    <rect x="146" y="128" width="28" height="48" rx="3" class="a-coral"/>
    <rect x="104" y="106" width="30" height="26" rx="3" class="a-surface a-stroke"/>
    <rect x="186" y="106" width="30" height="26" rx="3" class="a-surface a-stroke"/>
    ${bust(62, 98, 0.8, 'a-teal')}
    ${bust(258, 94, 0.84, 'a-primary')}
    ${bust(216, 130, 0.48, 'a-gold')}
    ${floor}
  `);

  SCENES.office = () => svg(`
    <path d="M58 72 160 30l102 42z" class="a-primary-soft a-stroke"/>
    <rect x="62" y="72" width="196" height="12" class="a-surface a-stroke"/>
    ${[78, 114, 150, 186, 222].map((x) => `<rect x="${x}" y="84" width="20" height="78" class="a-surface a-stroke"/>`).join('')}
    <rect x="56" y="162" width="208" height="14" class="a-surface a-stroke"/>
    <rect x="236" y="18" width="70" height="36" rx="8" class="a-ink"/>
    <text x="271" y="42" text-anchor="middle" class="a-label a-label--gold">No. 12</text>
    ${bust(160, 100, 0.78, 'a-teal')}
  `);

  SCENES.emergency = () => A.alert();

  /* ---------- Gathering: people around a woven mat, seen from above ----------
     Whoever is signing has everyone's sightlines; turns pass around the circle. */
  A.gathering = () => {
    const N = 7;
    const cx = 200;
    const cy = 200;
    const R = 160;
    const tones = ['g-p0', 'g-p1', 'g-p2', 'g-p3', 'g-p1', 'g-p2', 'g-p0'];
    const pts = Array.from({ length: N }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a };
    });
    const f = (n) => n.toFixed(1);
    const rings = [118, 102, 86, 70, 54, 38, 22].map((r, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="g-ring g-ring--${i % 3}"/>`).join('');
    const lines = pts.map((p, i) => `<g class="g-lines g-lines--${i}" style="--i:${i}">${pts.filter((_, j) => j !== i)
      .map((q) => `<line x1="${f(q.x)}" y1="${f(q.y)}" x2="${f(p.x)}" y2="${f(p.y)}"/>`).join('')}</g>`).join('');
    const people = pts.map((p, i) => {
      const sx = p.x + 17 * Math.cos(p.a);
      const sy = p.y + 17 * Math.sin(p.a);
      const deg = (p.a * 180) / Math.PI + 90;
      return `<g class="g-person ${tones[i]}" style="--i:${i}">
        <circle class="g-glow" cx="${f(p.x)}" cy="${f(p.y)}" r="30"/>
        <ellipse cx="${f(sx)}" cy="${f(sy)}" rx="31" ry="17" transform="rotate(${f(deg)} ${f(sx)} ${f(sy)})"/>
        <circle cx="${f(p.x)}" cy="${f(p.y)}" r="16"/>
      </g>`;
    }).join('');
    return svg(`
      <circle cx="${cx}" cy="${cy}" r="128" class="g-mat"/>
      ${rings}
      <path d="M${cx - 128} ${cy}h256M${cx} ${cy - 128}v256" class="g-seam"/>
      ${lines}
      ${people}
    `, '0 0 400 400', 'art--gathering');
  };

  T.art = {
    signingSpace: A.signingSpace,
    hero: A.hero,
    gathering: A.gathering,
    svg,
    bust,
    /** Returns trusted SVG markup for an everyday scene, or ''. */
    scene: (id) => (SCENES[id] ? SCENES[id]() : ''),
    /** Returns trusted SVG markup for a lesson illustration key, or ''. */
    lesson(key) {
      const fn = A[key];
      return fn ? fn() : '';
    },
    has: (key) => typeof A[key] === 'function',
  };
})();
