/* =========================================================================
   Tanaw — sign media resolution & on-device media library (IndexedDB)

   Every vocabulary entry resolves to exactly one media status:
     verified  registered in data/media-manifest.js with signer + verifier
     local     attached on THIS device via the Contributor Studio
     test      pipeline-test image generated in the Studio (clearly "not a sign")
     pending   nothing yet -> a labeled placeholder is shown

   Local and test media are stored as Blobs in IndexedDB and never leave
   the device unless the educator exports a class pack themselves.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;

  const DB_NAME = 'tanaw-media';
  const DB_VERSION = 1;

  let dbPromise = null;
  let available = false;
  let initError = null;
  const local = new Map();     // signId -> metadata record (no blob)
  const urlCache = new Map();  // signId -> object URL

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window) || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser.'));
        return;
      }
      let req;
      try { req = window.indexedDB.open(DB_NAME, DB_VERSION); } catch (err) { reject(err); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'signId' });
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'signId' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Could not open the media database.'));
      req.onblocked = () => reject(new Error('The media database is blocked by another tab.'));
    });
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out opening on-device storage.')), ms)),
    ]);
  }

  function getAll(db, store) {
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function getOne(db, store, key) {
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function writeTx(db, stores, fn) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, 'readwrite');
      fn(tx);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not save media.'));
      tx.onabort = () => reject(tx.error || new Error('Saving media was cancelled (storage may be full).'));
    });
  }

  async function init() {
    try {
      const db = await withTimeout(openDB(), 3000);
      const metas = await getAll(db, 'meta');
      local.clear();
      metas.forEach((m) => { if (m && m.signId) local.set(m.signId, m); });
      available = true;
      initError = null;
    } catch (err) {
      available = false;
      initError = err;
      console.warn('[Tanaw] On-device media library unavailable:', err && err.message);
    }
  }

  const TEXT_FIELDS = ['signer', 'verifiedBy', 'verifierRole', 'region', 'recorded', 'consent', 'license', 'description', 'fileName', 'note'];

  /** Keep only expected metadata fields, as trimmed strings (imported packs are untrusted). */
  function sanitizeMeta(meta) {
    const out = {};
    const src = meta && typeof meta === 'object' ? meta : {};
    TEXT_FIELDS.forEach((k) => { if (src[k] != null) out[k] = String(src[k]).slice(0, 2000).trim(); });
    out.signerIsDeaf = !!src.signerIsDeaf;
    out.consentConfirmed = !!src.consentConfirmed;
    return out;
  }

  /* Raster images only. SVG is refused on purpose: an SVG opened from a blob: URL
     runs scripts with this page's origin, so an imported pack could read stored data. */
  const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'];

  function kindFor(mime) {
    const m = String(mime || '').toLowerCase().split(';')[0].trim();
    if (IMAGE_TYPES.includes(m)) return 'image';
    if (/^video\/[a-z0-9.+-]+$/.test(m)) return 'video';
    return null;
  }

  const NONE = Object.freeze({ status: 'pending', kind: null, meta: null });

  function describe(signId) {
    // Demonstrations switched off (core/config.js): nothing is ever shown as a sign.
    if (!T.config.demonstrations) return NONE;
    const manifest = (T.data && T.data.mediaManifest) || {};
    const v = Object.prototype.hasOwnProperty.call(manifest, signId) ? manifest[signId] : null;
    if (v && typeof v.src === 'string' && v.src) {
      return { status: 'verified', kind: v.type === 'image' ? 'image' : 'video', src: v.src, poster: v.poster || '', meta: v };
    }
    const l = local.get(signId);
    if (l) return { status: l.source === 'test' ? 'test' : 'local', kind: l.kind, meta: l.meta || {}, record: l };
    return { status: 'pending', kind: null, meta: null };
  }

  const hasMedia = (signId) => describe(signId).status !== 'pending';

  async function getBlob(signId) {
    const db = await openDB();
    const rec = await getOne(db, 'blobs', signId);
    return rec && rec.blob ? rec.blob : null;
  }

  async function getURL(signId) {
    const d = describe(signId);
    if (d.status === 'verified') return d.src;
    if (d.status === 'pending') return null;
    if (urlCache.has(signId)) return urlCache.get(signId);
    const blob = await getBlob(signId);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(signId, url);
    return url;
  }

  function revoke(signId) {
    const url = urlCache.get(signId);
    if (url) { URL.revokeObjectURL(url); urlCache.delete(signId); }
  }

  async function save(signId, blob, meta, source = 'local') {
    if (!(blob instanceof Blob)) throw new Error('No file selected.');
    const kind = kindFor(blob.type);
    if (!kind) throw new Error('Please choose a video or image file.');
    const db = await openDB();
    const record = {
      signId,
      source: source === 'test' ? 'test' : 'local',
      kind,
      mime: blob.type,
      size: blob.size,
      meta: sanitizeMeta(meta),
      addedAt: new Date().toISOString(),
    };
    await writeTx(db, ['meta', 'blobs'], (tx) => {
      tx.objectStore('meta').put(record);
      tx.objectStore('blobs').put({ signId, blob });
    });
    revoke(signId);
    local.set(signId, record);
    available = true;
    T.bus.emit('media:change', { signId });
    return record;
  }

  async function updateMeta(signId, meta) {
    const rec = local.get(signId);
    if (!rec) throw new Error('No media found for this entry.');
    const db = await openDB();
    const next = Object.assign({}, rec, { meta: sanitizeMeta(Object.assign({}, rec.meta, meta)) });
    await writeTx(db, ['meta'], (tx) => tx.objectStore('meta').put(next));
    local.set(signId, next);
    T.bus.emit('media:change', { signId });
    return next;
  }

  async function remove(signId) {
    const db = await openDB();
    await writeTx(db, ['meta', 'blobs'], (tx) => {
      tx.objectStore('meta').delete(signId);
      tx.objectStore('blobs').delete(signId);
    });
    revoke(signId);
    local.delete(signId);
    T.bus.emit('media:change', { signId });
  }

  async function removeWhere(predicate) {
    const ids = Array.from(local.values()).filter(predicate).map((r) => r.signId);
    if (!ids.length) return 0;
    const db = await openDB();
    await writeTx(db, ['meta', 'blobs'], (tx) => {
      ids.forEach((id) => { tx.objectStore('meta').delete(id); tx.objectStore('blobs').delete(id); });
    });
    ids.forEach((id) => { revoke(id); local.delete(id); });
    T.bus.emit('media:change', { signIds: ids });
    return ids.length;
  }

  /* ---------- Pipeline-test images (clearly labeled, never a sign) ---------- */
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function fitText(g, text, x, y, maxWidth, size, weight, family) {
    let s = size;
    do {
      g.font = `${weight} ${s}px ${family}`;
      if (g.measureText(text).width <= maxWidth) break;
      s -= 2;
    } while (s > 12);
    g.fillText(text, x, y);
  }

  function makeTestImage(sign) {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 600;
    const g = c.getContext('2d');
    const family = '"Atkinson Hyperlegible Next", "Segoe UI", system-ui, sans-serif';
    g.fillStyle = '#2A2366';
    g.fillRect(0, 0, 800, 600);
    g.strokeStyle = 'rgba(244, 180, 42, 0.22)';
    g.lineWidth = 22;
    for (let x = -600; x < 800; x += 64) {
      g.beginPath(); g.moveTo(x, 600); g.lineTo(x + 600, 0); g.stroke();
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(g, 70, 120, 660, 360, 28);
    g.fill();
    g.textAlign = 'center';
    g.fillStyle = '#8A5A00';
    fitText(g, 'TEST MEDIA — NOT AN FSL SIGN', 400, 185, 600, 30, 800, family);
    g.fillStyle = '#17162B';
    fitText(g, sign.en, 400, 290, 600, 72, 800, family);
    g.fillStyle = '#45435E';
    fitText(g, sign.fil || '', 400, 350, 600, 36, 500, family);
    g.fillStyle = '#6B6982';
    fitText(g, 'Generated by Tanaw Contributor Studio to test the media pipeline.', 400, 430, 600, 22, 500, family);
    return new Promise((resolve, reject) => {
      c.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create test image.'))), 'image/png');
    });
  }

  async function generateTestMedia(signs) {
    let created = 0;
    for (const sign of signs) {
      const d = describe(sign.id);
      if (d.status === 'verified' || d.status === 'local') continue;
      const blob = await makeTestImage(sign);
      await save(sign.id, blob, { note: 'Pipeline test image generated in the Contributor Studio. Not an FSL sign.' }, 'test');
      created++;
    }
    return created;
  }

  T.media = {
    init,
    describe,
    hasMedia,
    getURL,
    getBlob,
    save,
    updateMeta,
    remove,
    removeWhere,
    generateTestMedia,
    kindFor,
    IMAGE_TYPES,
    sanitizeMeta,
    list: () => Array.from(local.values()),
    isAvailable: () => available,
    initError: () => initError,
    counts(signIds) {
      const out = { total: signIds.length, verified: 0, local: 0, test: 0, pending: 0 };
      signIds.forEach((id) => { out[describe(id).status] += 1; });
      out.withMedia = out.total - out.pending;
      return out;
    },
  };
})();
