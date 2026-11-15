/* =========================================================================
   Tanaw — icon set
   Original 24×24 stroke icons. Deliberately contains NO hand or handshape
   pictograms, so no icon can be mistaken for an FSL sign.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;

  const P = {
    home: '<path d="M3 10.2 12 3l9 7.2"/><path d="M5 9v12h14V9"/><path d="M10 21v-6h4v6"/>',
    cube: '<path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9z"/><path d="M3.8 7.6 12 12.2l8.2-4.6"/><path d="M12 12.2v9"/>',
    path: '<circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8.2 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.8"/>',
    library: '<path d="M12 6.5C10.5 5 8 4 4 4v14c4 0 6.5 1 8 2.5 1.5-1.5 4-2.5 8-2.5V4c-4 0-6.5 1-8 2.5z"/><path d="M12 6.5v14"/>',
    practice: '<rect x="2.5" y="6" width="13.5" height="12" rx="2.5"/><path d="m16 10.5 5.5-3v9l-5.5-3"/>',
    chat: '<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3.5V15H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M17 9h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-3.5-3H12"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6-.2 4.6 1.6 5 4.9"/>',
    chart: '<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-6"/><path d="M21.5 20h-19"/>',
    studio: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="m3.5 9 1.6-5 15.3 1.6L19.2 9"/><path d="m8.6 4.5 2.1 4.5M14.1 5.1l1.9 3.9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',
    sliders: '<path d="M4 6h9M17 6h3"/><circle cx="15" cy="6" r="2"/><path d="M4 12h3M11 12h9"/><circle cx="9" cy="12" r="2"/><path d="M4 18h11M19 18h1"/><circle cx="17" cy="18" r="2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.5"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'chevron-left': '<path d="m15 6-6 6 6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    play: '<path d="M7.5 4.8v14.4L19 12z" fill="currentColor"/>',
    pause: '<path d="M8.5 5v14M15.5 5v14"/>',
    record: '<circle cx="12" cy="12" r="6.5" fill="currentColor" stroke="none"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none"/>',
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    upload: '<path d="M12 20V9"/><path d="m7 14 5-5 5 5"/><path d="M5 4h14"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    flip: '<path d="M12 3v18"/><path d="M8.5 7.5 3.5 12l5 4.5z"/><path d="m15.5 7.5 5 4.5-5 4.5z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    flame: '<path d="M12 21c-3.9 0-7-2.7-7-6.6 0-3.2 2.2-5.1 3.7-7.2.4 1.7 1.3 3 2.6 3.6C11 7.7 12.4 5 14.5 3c.3 3.4 4.5 5.6 4.5 11.1C19 18.2 15.9 21 12 21z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
    'mic-off': '<path d="M15 9.5V6a3 3 0 0 0-5.6-1.5"/><path d="M9 9v2a3 3 0 0 0 4.7 2.5"/><path d="M5.5 11a6.5 6.5 0 0 0 10.9 4.8M18.5 11c0 .8-.1 1.5-.4 2.2"/><path d="M12 17.5V21"/><path d="m3 3 18 18"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>',
    maximize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12.2 2.3 2.3 4.3-4.6"/>',
    hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7 3c0 4.5 5 6 5 9s-5 4.5-5 9"/><path d="M17 3c0 4.5-5 6-5 9s5 4.5 5 9"/>',
    device: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    flask: '<path d="M9.5 3h5"/><path d="M10.5 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L13.5 9V3"/><path d="M7.5 15h9"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    type: '<path d="M5 6.5V4.5h14v2"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',
    captions: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5"/><path d="M12 17.2h.01"/>',
    heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4"/><path d="M8.5 20.5h7"/><path d="M10 17h4v3.5h-4z"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>',
    shuffle: '<path d="M3 7h3.5c3 0 4.5 10 8 10H21"/><path d="m18 14 3 3-3 3"/><path d="M3 17h3.5c1.4 0 2.4-1.8 3.2-4M14.5 7H21"/><path d="m18 4 3 3-3 3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4 3.8-6.5 7.5-6.5s6.7 2.5 7.5 6.5"/>',
    sparkles: '<path d="M11 3.5 12.8 9 18.5 11l-5.7 2-1.8 5.5L9.2 13 3.5 11l5.7-2z"/><path d="M18.5 3v4M16.5 5h4"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    package: '<path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="m3.5 7.5 8.5 4.5 8.5-4.5"/><path d="M12 12v9"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    hash: '<path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.3-2.5 4"/><path d="M12 17.2h.01"/>',
    zap: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h5"/>',
    repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h12"/><path d="m16 3 3 3-3 3"/><path d="M20 13v2a3 3 0 0 1-3 3H5"/><path d="m8 21-3-3 3-3"/>',
    speed: '<path d="M4 18a8.5 8.5 0 1 1 16 0"/><path d="m12 14 4-5"/><circle cx="12" cy="14" r="1.5"/>',
    frame: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9"/>',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
    // Capiz window: the Awareness & Learning world.
    window: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M4 9h16M4 15h16"/>',
    // Woven strands: the Deaf Community world.
    weave: '<path d="M3 8.5c3 0 3 3.5 6 3.5s3-3.5 6-3.5 3 3.5 6 3.5"/><path d="M3 15c3 0 3 3.5 6 3.5s3-3.5 6-3.5 3 3.5 6 3.5"/><path d="M8 3v18M16 3v18"/>',
    map: '<path d="m3 6 6-2.5 6 2.5 6-2.5v15L15 21l-6-2.5L3 21z"/><path d="M9 3.5v15M15 6v15"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.5"/>',
    scale: '<path d="M12 4v16M7.5 20h9M5 7h14"/><path d="M5 7 2.5 13a2.5 2.5 0 0 0 5 0z"/><path d="m19 7-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
    story: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="m10.5 11 4 2.5-4 2.5z"/>',
    hospital: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M12 8v6M9 11h6"/><path d="M9.5 21v-3h5v3"/>',
    school: '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/><path d="M12 5V2.5h3v2h-3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M3 12.5h18"/>',
    tv: '<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M8 21h8M12 17v4"/><rect x="14" y="10" width="4.5" height="4.5" rx="1"/>',
    landmark: '<path d="M3 21h18M4 18h16M4 10h16"/><path d="m12 3 8.5 5h-17z"/><path d="M6.5 10v8M10.5 10v8M13.5 10v8M17.5 10v8"/>',
    store: '<path d="M4.5 10.5V20h15v-9.5"/><path d="M3 10.5 5 4h14l2 6.5"/><path d="M3 10.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
    jeep: '<rect x="3" y="7" width="18" height="9" rx="2"/><path d="M3 11h18M7 7l1-3h8l1 3"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    lamp: '<path d="M8.5 3h7l3 8h-13z"/><path d="M12 11v8M8 21h8"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    'arrow-up': '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    'chevron-up': '<path d="m6 15 6-6 6 6"/>',
    grip: '<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>',
    swap: '<path d="M4 8h14l-3.5-3.5"/><path d="M20 16H6l3.5 3.5"/>',
  };

  // Friendly aliases used across the app.
  P.bridge = P.chat;
  P.culture = P.people;
  P.progress = P.chart;
  P.learn = P.path;
  P.verified = P.shield;
  P.pending = P.hourglass;
  P.local = P.device;
  P.test = P.flask;
  P.community = P.people;
  P.games = P.dice;
  P.scenes = P.pin;
  P.rights = P.scale;
  P.stories = P.story;
  P.journey = P.sparkles;

  /**
   * Returns trusted SVG markup for an icon.
   * @param {string} name icon key
   * @param {{size?: number, label?: string, className?: string}} [opts]
   */
  function icon(name, opts = {}) {
    const body = P[name] || P.dot;
    const size = opts.size || 24;
    const cls = 'icon' + (opts.className ? ' ' + opts.className : '');
    const a11y = opts.label
      ? `role="img" aria-label="${T.util.esc(opts.label)}"`
      : 'aria-hidden="true" focusable="false"';
    // Icons scale with text (1.25em) unless an explicit size is requested.
    const style = opts.size ? ` style="width:${size}px;height:${size}px"` : '';
    return T.util.raw(
      `<svg class="${cls}" ${a11y} width="${size}" height="${size}"${style} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
    );
  }

  T.icon = icon;
  T.icons = P;
})();
