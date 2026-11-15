/* =========================================================================
   Tanaw — 3D hand (experimental)
   A small WebGL renderer for one articulated hand: no libraries, so it also
   runs when Tanaw is opened straight from a folder.

   The hand is built from tapered capsules on an anatomical skeleton:
   a palm, four fingers (MCP, PIP and DIP joints, plus spread) and a thumb
   (azimuth, elevation and roll at the base, then MCP and IP). Poses come from
   assets/js/data/hands.js. Frames render only while something moves.

     const stage = T.hand3d.create(host, { label: 'Letter B' });
     stage.show('B');                       // animate to a pose
     stage.spell('MABUHAY', { onStep, onDone });
     stage.destroy();                       // frees the WebGL context

   Units are centimetres. Hand space: +Y along the fingers, +Z out of the
   palm, +X toward the thumb (a right hand with its palm facing the viewer).
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const DEG = Math.PI / 180;

  /* ---------- Vector and quaternion helpers ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp = (a, b, t) => a + (b - a) * t;

  const Q = {
    id: () => [0, 0, 0, 1],
    axis(ax, deg) { const h = deg * DEG / 2; const s = Math.sin(h); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(h)]; },
    mul(a, b) {
      return [
        a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
      ];
    },
    rot(q, v) {
      const u = [q[0], q[1], q[2]];
      const t = scale(cross(u, v), 2);
      return add(add(v, scale(t, q[3])), cross(u, t));
    },
    /* Rz · Ry · Rx (x applied first), degrees. */
    euler(x, y, z) { return Q.mul(Q.axis([0, 0, 1], z), Q.mul(Q.axis([0, 1, 0], y), Q.axis([1, 0, 0], x))); },
    /* From an orthonormal basis (columns X, Y, Z). */
    basis(X, Y, Z) {
      const m00 = X[0], m10 = X[1], m20 = X[2], m01 = Y[0], m11 = Y[1], m21 = Y[2], m02 = Z[0], m12 = Z[1], m22 = Z[2];
      const tr = m00 + m11 + m22;
      let q;
      if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
      else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
      else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
      else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
      return Q.normalize(q);
    },
    normalize(q) { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; },
    slerp(a, b, t) {
      let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
      let bb = b;
      if (d < 0) { d = -d; bb = [-b[0], -b[1], -b[2], -b[3]]; }
      if (d > 0.9995) return Q.normalize([lerp(a[0], bb[0], t), lerp(a[1], bb[1], t), lerp(a[2], bb[2], t), lerp(a[3], bb[3], t)]);
      const th = Math.acos(d);
      const s = Math.sin(th);
      const wa = Math.sin((1 - t) * th) / s;
      const wb = Math.sin(t * th) / s;
      return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
    },
  };

  /* Column-major 4×4 matrices (WebGL order). */
  const M = {
    fromQP(q, p, sx = 1, sy = 1, sz = 1) {
      const [x, y, z, w] = q;
      return new Float32Array([
        (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + w * z)) * sx, (2 * (x * z - w * y)) * sx, 0,
        (2 * (x * y - w * z)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + w * x)) * sy, 0,
        (2 * (x * z + w * y)) * sz, (2 * (y * z - w * x)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
        p[0], p[1], p[2], 1,
      ]);
    },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
      return o;
    },
    perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2);
      const nf = 1 / (near - far);
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    },
    lookAt(eye, target, up) {
      const z = norm(sub(eye, target));
      const x = norm(cross(up, z));
      const y = cross(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
    },
    normal3(m) { return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]); },
  };

  /* ---------- Meshes ---------- */

  /* Surface of revolution around +Y from a profile of [r, y, nr, ny]; the cross-section is an ellipse (sx, sz). */
  function lathe(profile, seg, sx = 1, sz = 1) {
    const pos = [];
    const nor = [];
    const idx = [];
    profile.forEach(([r, y, nr, ny]) => {
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        pos.push(r * c * sx, y, r * s * sz);
        const n = norm([nr * c / sx, ny, nr * s / sz]);
        nor.push(n[0], n[1], n[2]);
      }
    });
    const row = seg + 1;
    for (let j = 0; j < profile.length - 1; j++) {
      for (let i = 0; i < seg; i++) {
        const a = j * row + i;
        const b = a + row;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    return { pos, nor, idx };
  }

  /* A capsule that tapers from r1 (at y = 0) to r2 (at y = len), tangent-continuous. */
  function roundCone(r1, r2, len, sx = 1, sz = 1, seg = 22, capRings = 7) {
    const beta = Math.asin(U.clamp((r1 - r2) / len, -0.95, 0.95));
    const prof = [];
    for (let k = 0; k <= capRings; k++) {
      const a = -Math.PI / 2 + (beta + Math.PI / 2) * (k / capRings);
      prof.push([r1 * Math.cos(a), r1 * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
    const n = [Math.cos(beta), Math.sin(beta)];
    const p1 = [r1 * n[0], r1 * n[1]];
    const p2 = [r2 * n[0], len + r2 * n[1]];
    for (let k = 1; k <= 3; k++) {
      const t = k / 3;
      prof.push([lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t), n[0], n[1]]);
    }
    for (let k = 1; k <= capRings; k++) {
      const a = beta + (Math.PI / 2 - beta) * (k / capRings);
      prof.push([r2 * Math.cos(a), len + r2 * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
    return lathe(prof, seg, sx, sz);
  }

  function sphere(r, seg = 16, rings = 12) {
    const prof = [];
    for (let k = 0; k <= rings; k++) {
      const a = -Math.PI / 2 + Math.PI * (k / rings);
      prof.push([r * Math.cos(a), r * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
    return lathe(prof, seg);
  }

  /* The palm: a rounded box, narrower at the wrist, thinner at the edges, with the knuckle line arched. */
  function palmMesh(P) {
    const N = 14;
    const verts = [];
    const idx = [];
    const faces = [
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
      [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, -1], [1, 0, 0]],
      [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
    ];
    const h = [P.hx, P.hy, P.hz];
    const inner = [P.hx - P.r, P.hy - P.r, P.hz - P.r];
    const keyOf = (p) => p.map((v) => Math.round(v * 1000)).join(',');
    const map = new Map();
    const indexOf = (p) => {
      const k = keyOf(p);
      if (map.has(k)) return map.get(k);
      map.set(k, verts.length);
      verts.push(p);
      return verts.length - 1;
    };
    faces.forEach(([n, u, v]) => {
      const grid = [];
      for (let j = 0; j <= N; j++) {
        for (let i = 0; i <= N; i++) {
          const a = (i / N) * 2 - 1;
          const b = (j / N) * 2 - 1;
          const q = [n[0] + u[0] * a + v[0] * b, n[1] + u[1] * a + v[1] * b, n[2] + u[2] * a + v[2] * b];
          const pb = [q[0] * h[0], q[1] * h[1], q[2] * h[2]];
          const ip = [U.clamp(pb[0], -inner[0], inner[0]), U.clamp(pb[1], -inner[1], inner[1]), U.clamp(pb[2], -inner[2], inner[2])];
          const dn = norm(sub(pb, ip));
          let p = add(ip, scale(dn, P.r));
          p = deformPalm(p, P);
          grid.push(indexOf(p));
        }
      }
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = grid[j * (N + 1) + i];
          const b = grid[j * (N + 1) + i + 1];
          const c = grid[(j + 1) * (N + 1) + i];
          const d = grid[(j + 1) * (N + 1) + i + 1];
          idx.push(a, b, d, a, d, c);
        }
      }
    });
    // Faces were generated with mixed winding; orient every triangle outward.
    const centre = [0, P.cy, 0];
    for (let t = 0; t < idx.length; t += 3) {
      const a = verts[idx[t]];
      const b = verts[idx[t + 1]];
      const c = verts[idx[t + 2]];
      const fn = cross(sub(b, a), sub(c, a));
      const mid = scale(add(add(a, b), c), 1 / 3);
      if (dot(fn, sub(mid, centre)) < 0) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
    }
    // Smooth normals from the welded, outward-facing triangles.
    const acc = verts.map(() => [0, 0, 0]);
    for (let t = 0; t < idx.length; t += 3) {
      const a = verts[idx[t]];
      const b = verts[idx[t + 1]];
      const c = verts[idx[t + 2]];
      const fn = cross(sub(b, a), sub(c, a));
      for (let k = 0; k < 3; k++) { const v = acc[idx[t + k]]; v[0] += fn[0]; v[1] += fn[1]; v[2] += fn[2]; }
    }
    const pos = [];
    const nor = [];
    verts.forEach((p, i) => { pos.push(p[0], p[1], p[2]); const n = norm(acc[i]); nor.push(n[0], n[1], n[2]); });
    return { pos, nor, idx };
  }

  function deformPalm(p, P) {
    let [x, y, z] = p;
    y += P.cy;
    const top = P.cy + P.hy;
    const bottom = P.cy - P.hy;
    const t = U.clamp((y - bottom) / (top - bottom), 0, 1);
    // Narrower at the wrist, widest across the knuckles.
    x *= lerp(P.wristScale, 1, Math.sin(t * Math.PI / 2));
    // Thinner toward the edges, a little thicker on the thumb side (thenar).
    const ex = x / P.hx;
    z *= 1 - 0.22 * ex * ex;
    if (z > 0) z *= 1 + 0.18 * Math.exp(-((x - 1.8) ** 2) / 4 - ((y - 3) ** 2) / 8);
    // Arch the knuckle line: the middle finger's knuckle is highest.
    if (t > 0.55) {
      const k = (t - 0.55) / 0.45;
      const arch = 0.55 * (1 - ((x - 0.7) / 4.4) ** 2) - 0.25;
      y += k * arch;
    }
    return [x, y, z];
  }

  /* ---------- The hand skeleton (centimetres) ---------- */
  const HAND = {
    palm: { hx: 4.05, hy: 4.55, hz: 1.32, r: 1.15, cy: 4.5, wristScale: 0.78 },
    forearm: { r1: 2.35, r2: 2.75, from: -11, to: 0.6 },
    // base: MCP position; spread: resting angle toward the thumb (degrees); len: phalanges; rad: radii at MCP, PIP, DIP, tip;
    // converge: extra spread toward the thumb at full MCP flexion (fingers converge in a fist).
    fingers: [
      { id: 'i', base: [2.72, 8.75, 0.05], spread: 5, len: [4.15, 2.45, 1.95], rad: [0.92, 0.83, 0.75, 0.68], converge: -3 },
      { id: 'm', base: [0.9, 9.15, 0.05], spread: 1, len: [4.55, 2.85, 2.05], rad: [0.95, 0.86, 0.78, 0.69], converge: 2 },
      { id: 'r', base: [-0.92, 8.9, 0.05], spread: -4, len: [4.25, 2.7, 1.95], rad: [0.9, 0.81, 0.73, 0.65], converge: 7 },
      { id: 'p', base: [-2.62, 8.05, 0.05], spread: -10, len: [3.35, 2.1, 1.8], rad: [0.8, 0.71, 0.64, 0.57], converge: 12 },
    ],
    thumb: { base: [2.55, 2.0, 0.65], len: [4.35, 3.0, 2.55], rad: [1.32, 1.02, 0.9, 0.76] },
    flat: 0.88, // fingers are a little flatter than they are wide
  };

  /* Pose state: q (hand rotation), pos (offset), a = 21 angles: 4 fingers × [mcp, pip, dip, spread] + thumb [az, el, roll, mcp, ip]. */
  function makeState(p) {
    const r = p.rot || [0, 0, 0];
    const f = p.f || {};
    const a = new Float32Array(21);
    ['i', 'm', 'r', 'p'].forEach((id, k) => {
      const v = f[id] || [0, 0, 0, 0];
      a.set([v[0] || 0, v[1] || 0, v[2] || 0, v[3] || 0], k * 4);
    });
    a.set(p.t || [40, 20, 0, 10, 10], 16);
    return { q: Q.euler(r[0], r[1], r[2]), pos: (p.pos || [0, 0, 0]).slice(), a };
  }

  function mixState(A, B, t) {
    const a = new Float32Array(21);
    for (let k = 0; k < 21; k++) a[k] = lerp(A.a[k], B.a[k], t);
    return { q: Q.slerp(A.q, B.q, t), pos: [lerp(A.pos[0], B.pos[0], t), lerp(A.pos[1], B.pos[1], t), lerp(A.pos[2], B.pos[2], t)], a };
  }

  function cloneState(S) { return { q: S.q.slice(), pos: S.pos.slice(), a: new Float32Array(S.a) }; }

  /* Bones in hand space: [{ part, q, p }] plus joint positions for x-ray. */
  function solve(S) {
    const bones = [];
    const joints = [[0, 0, 0]];
    const Z = [0, 0, 1];
    HAND.fingers.forEach((f, k) => {
      const [mcp, pip, dip, spread] = [S.a[k * 4], S.a[k * 4 + 1], S.a[k * 4 + 2], S.a[k * 4 + 3]];
      const conv = f.converge * U.clamp(mcp / 90, 0, 1.2);
      let q = Q.axis(Z, -(f.spread + spread + conv));
      let p = f.base.slice();
      const flex = [mcp, pip, dip];
      joints.push(p.slice());
      for (let s = 0; s < 3; s++) {
        q = Q.mul(q, Q.axis([1, 0, 0], flex[s]));
        bones.push({ part: `${f.id}${s}`, q, p: p.slice(), nail: s === 2 });
        p = add(p, Q.rot(q, [0, f.len[s], 0]));
        joints.push(p.slice());
      }
    });
    // Thumb: the metacarpal's direction from azimuth/elevation. With roll 0 the pad (and so the bend
    // of the MCP and IP joints) faces across the palm, toward the little finger; roll turns it.
    const [az, el, roll, tmcp, tip] = [S.a[16], S.a[17], S.a[18], S.a[19], S.a[20]];
    const d = norm([Math.sin(az * DEG) * Math.cos(el * DEG), Math.cos(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG)]);
    const across = norm([-1, 0, 0.3]);
    const ref = Math.abs(dot(across, d)) > 0.95 ? Z : across;
    let pad = norm(sub(ref, scale(d, dot(ref, d))));
    pad = Q.rot(Q.axis(d, roll), pad);
    const X = cross(d, pad);
    let q = Q.basis(X, d, pad);
    let p = HAND.thumb.base.slice();
    joints.push(p.slice());
    const tflex = [0, tmcp, tip];
    for (let s = 0; s < 3; s++) {
      q = Q.mul(q, Q.axis([1, 0, 0], tflex[s]));
      bones.push({ part: `t${s}`, q, p: p.slice(), nail: s === 2 });
      p = add(p, Q.rot(q, [0, HAND.thumb.len[s], 0]));
      joints.push(p.slice());
    }
    return { bones, joints };
  }

  /* ---------- Shaders ---------- */
  const VS = `
attribute vec3 aPos;
attribute vec3 aNor;
uniform mat4 uModel;
uniform mat4 uVP;
uniform mat3 uNM;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz;
  vN = uNM * aNor;
  vL = aPos;
  gl_Position = uVP * w;
}`;

  const FS = `
precision mediump float;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
uniform vec3 uEye;
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec3 uKey;
uniform vec3 uFill;
uniform float uMode;      // 0 skin, 1 hologram, 2 emissive (x-ray joints)
uniform float uAlpha;
uniform float uNail;
uniform vec2 uNailBox;    // segment length, tip radius
uniform float uFade;      // forearm: local y where it fades out (or -999)
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(uEye - vW);
  if (uMode > 1.5) {
    gl_FragColor = vec4(uRim * uAlpha, uAlpha);
    return;
  }
  vec3 albedo = uBase;
  float spec = 0.09;
  float gloss = 20.0;
  if (uNail > 0.5) {
    float r = uNailBox.y;
    float L = uNailBox.x;
    float m = smoothstep(-0.18 * r, -0.42 * r, vL.z)
            * smoothstep(0.32 * L, 0.5 * L, vL.y)
            * (1.0 - smoothstep(0.46 * r, 0.62 * r, abs(vL.x)));
    albedo = mix(albedo, albedo * 0.45 + vec3(0.62, 0.48, 0.48) * 0.55, m);
    spec += m * 0.45;
    gloss = mix(gloss, 70.0, m);
  }
  float ndl = dot(N, uKey);
  float diff = max(0.0, (ndl + 0.42) / 1.42);
  float terminator = smoothstep(-0.25, 0.2, ndl) * (1.0 - smoothstep(0.2, 0.75, ndl));
  vec3 sss = vec3(0.95, 0.32, 0.22) * terminator * 0.32;
  float fill = max(0.0, dot(N, uFill)) * 0.38;
  vec3 H = normalize(uKey + V);
  float sp = pow(max(dot(N, H), 0.0), gloss) * spec;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 amb = mix(vec3(0.22, 0.17, 0.2), vec3(0.5, 0.56, 0.82), N.y * 0.5 + 0.5) * 0.36;
  vec3 col = albedo * (amb + vec3(1.0, 0.95, 0.88) * diff + vec3(0.62, 0.7, 1.0) * fill) + albedo * sss + vec3(sp) + uRim * fres * 0.5;
  float a = uAlpha;
  if (uMode > 0.5) {
    float scan = 0.82 + 0.18 * sin(vW.y * 7.0);
    col = uRim * (0.1 + fres * 1.7) * scan + uRim * diff * 0.1;
    a = clamp(0.16 + fres * 0.95, 0.0, 1.0) * uAlpha;
  }
  if (uFade > -900.0) a *= smoothstep(uFade, uFade + 5.0, vL.y);
  col = col / (col + vec3(0.9)) * 1.7;
  col = pow(max(col, vec3(0.0)), vec3(0.4545));
  gl_FragColor = vec4(col * a, a);
}`;

  /* The stage floor: a glowing disc with a fine grid and a soft shadow under the hand. */
  const FLOOR_VS = `
attribute vec3 aPos;
uniform mat4 uVP;
uniform vec3 uCentre;
uniform float uSize;
varying vec2 vUv;
void main() {
  vUv = aPos.xz;
  gl_Position = uVP * vec4(uCentre + vec3(aPos.x * uSize, 0.0, aPos.z * uSize), 1.0);
}`;

  const FLOOR_FS = `
precision mediump float;
varying vec2 vUv;
uniform vec3 uRim;
uniform vec2 uShadow;   // shadow centre in disc units
uniform float uShadowR;
uniform float uGrid;      // disc radius in grid cells (the vertex shader has its own size)
void main() {
  float d = length(vUv);
  if (d > 1.0) discard;
  vec2 g = abs(fract(vUv * uGrid) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
  float fade = 1.0 - smoothstep(0.35, 1.0, d);
  float ring = smoothstep(0.86, 0.95, d) * (1.0 - smoothstep(0.95, 1.0, d));
  float shadow = 1.0 - smoothstep(0.0, uShadowR, length(vUv - uShadow));
  vec3 col = uRim * (line * 0.22 * fade + ring * 0.75 + 0.05 * fade);
  float a = (line * 0.22 * fade + ring * 0.75 + 0.06 * fade);
  col = mix(col, vec3(0.0), shadow * 0.0);
  a = max(a, shadow * 0.32 * fade);
  gl_FragColor = vec4(col, a);
}`;

  /**
   * Start compiling a program. With KHR_parallel_shader_compile the driver works in
   * the background; nothing here waits for it.
   */
  function compileStart(gl, vs, fs) {
    const prog = gl.createProgram();
    const shaders = [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].map(([type, src]) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(prog, sh);
      return sh;
    });
    gl.linkProgram(prog);
    return { prog, shaders };
  }

  /** Check the result (waiting for the driver if it is still busy) and look up locations. */
  function compileFinish(gl, p) {
    const prog = p.prog;
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = p.shaders.map((sh) => (gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? '' : gl.getShaderInfoLog(sh))).join(' ').trim();
      throw new Error(log || gl.getProgramInfoLog(prog) || 'link error');
    }
    const loc = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(prog, i); loc[u.name] = gl.getUniformLocation(prog, u.name); }
    loc.aPos = gl.getAttribLocation(prog, 'aPos');
    loc.aNor = gl.getAttribLocation(prog, 'aNor');
    return { prog, loc };
  }

  function upload(gl, mesh) {
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.pos), gl.STATIC_DRAW);
    const nb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.nor || mesh.pos), gl.STATIC_DRAW);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.idx), gl.STATIC_DRAW);
    return { vb, nb, ib, count: mesh.idx.length };
  }

  /* ---------- Styles (sRGB hex → linear) ---------- */
  const lin = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255) ** 2.2);
  };
  const STYLES = {
    kayumanggi: { label: 'Kayumanggi', base: '#B07A57', rim: '#8FB8FF' },
    light: { label: 'Light', base: '#E2B597', rim: '#9EC2FF' },
    deep: { label: 'Deep', base: '#6E4430', rim: '#8FB8FF' },
    polymer: { label: 'Polymer', base: '#E8E5F2', rim: '#9C8CFF' },
    hologram: { label: 'Hologram', base: '#7FE9F0', rim: '#58E6F2', holo: true },
  };

  /* ---------- Easing ---------- */
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  /**
   * Resolves once the page has been shown (first contentful paint) and its fonts are in.
   * Creating a WebGL context can block for a moment on slow devices, and the browser
   * cannot show a frame meanwhile; starting after this keeps the first view quick.
   * Later page changes resolve at once. Never waits more than a few seconds.
   */
  let shownPromise = null;
  function pageShown() {
    if (shownPromise) return shownPromise;
    const painted = new Promise((resolve) => {
      if (!window.PerformanceObserver || performance.getEntriesByName('first-contentful-paint').length) { resolve(); return; }
      try {
        const po = new PerformanceObserver((list) => {
          if (list.getEntriesByName('first-contentful-paint').length) { po.disconnect(); resolve(); }
        });
        po.observe({ type: 'paint', buffered: true });
      } catch (e) { resolve(); }
    });
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const limit = new Promise((resolve) => setTimeout(resolve, 3000));
    shownPromise = Promise.race([Promise.all([painted, fonts]), limit]);
    return shownPromise;
  }

  /* ---------- Support check (cached) ---------- */
  let supportCache = null;
  /**
   * Whether WebGL works here. The first real test creates a throwaway context, which
   * is slow before the page's first paint; `quick` answers from the API's presence
   * instead (pages that ask this way redraw without 3D if the hand then fails).
   */
  function supported(quick) {
    if (supportCache !== null) return supportCache;
    if (quick) return !!window.WebGLRenderingContext;
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      supportCache = !!gl;
      const lose = gl && gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    } catch (e) { supportCache = false; }
    return supportCache;
  }

  /**
   * 'full': sharp, antialiased. 'light': fewer pixels and no antialiasing, for older
   * phones. 'auto' picks light on devices that report little memory or few cores,
   * or when the browser's data saver is on; frames that turn out slow lower the
   * resolution further while the page is open.
   */
  function chooseQuality(pref) {
    if (pref === 'full' || pref === 'light') return pref;
    const n = window.navigator || {};
    const memory = Number(n.deviceMemory) || 8;
    const cores = Number(n.hardwareConcurrency) || 8;
    const saveData = !!(n.connection && n.connection.saveData);
    return saveData || memory <= 3 || cores <= 2 ? 'light' : 'full';
  }

  /* =====================================================================
     Stage: one canvas, one hand.
     ===================================================================== */
  function create(host, opts = {}) {
    const D = T.data;
    const reduced = () => U.reducedMotion();
    const listeners = new AbortController();
    const state = {
      current: makeState(D.handPose('rest')),
      track: null,         // { keys: [{ state, dur, ease, step }], i, t0, from }
      yaw: 0,
      pitch: -6,
      view: 'front',
      mirror: !!opts.mirror,
      style: opts.style || 'kayumanggi',
      xray: false,
      speed: 1,
      target: [0, 9, 0],
      raf: 0,
      visible: true,
      destroyed: false,
    };

    const wrap = document.createElement('div');
    wrap.className = 'hand3d';
    const canvas = document.createElement('canvas');
    canvas.className = 'hand3d__canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', opts.label || '3D hand');
    if (opts.interactive !== false) canvas.tabIndex = 0;
    wrap.appendChild(canvas);
    const loading = document.createElement('p');
    loading.className = 'hand3d__loading';
    loading.setAttribute('aria-hidden', 'true');
    loading.innerHTML = '<span class="hand3d__spinner"></span><span>Preparing the 3D hand…</span>';
    wrap.appendChild(loading);
    host.appendChild(wrap);

    let gl = null;
    let prog = null;
    let floor = null;
    let parallel = null;   // KHR_parallel_shader_compile, when the browser has it
    let pending = null;    // programs still compiling
    const meshes = {};
    let glOk = false;
    let phase = 'idle';    // idle → booting → ready, or failed
    let quality = chooseQuality(opts.quality);
    let resScale = 1;      // drops below 1 when frames turn out slow

    function startGL() {
      gl = canvas.getContext('webgl', { antialias: quality === 'full', alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.capture })
        || canvas.getContext('experimental-webgl');
      if (!gl) return false;
      parallel = gl.getExtension('KHR_parallel_shader_compile');
      pending = [compileStart(gl, VS, FS), compileStart(gl, FLOOR_VS, FLOOR_FS)];
      return true;
    }
    const compiling = () => !!(parallel && pending && pending.some((p) => !gl.getProgramParameter(p.prog, parallel.COMPLETION_STATUS_KHR)));

    function finishGL() {
      try {
        prog = compileFinish(gl, pending[0]);
        floor = compileFinish(gl, pending[1]);
      } catch (err) {
        console.error('[Tanaw] 3D hand shaders failed: ' + (err && err.message ? err.message : err));
        return false;
      } finally {
        pending = null;
      }
      HAND.fingers.forEach((f) => {
        for (let s = 0; s < 3; s++) meshes[`${f.id}${s}`] = upload(gl, roundCone(f.rad[s], f.rad[s + 1], f.len[s], 1, HAND.flat));
      });
      const th = HAND.thumb;
      for (let s = 0; s < 3; s++) meshes[`t${s}`] = upload(gl, roundCone(th.rad[s], th.rad[s + 1], th.len[s], 1, s === 0 ? 0.82 : HAND.flat));
      meshes.palm = upload(gl, palmMesh(HAND.palm));
      const fa = HAND.forearm;
      const arm = roundCone(fa.r1, fa.r2, fa.to - fa.from, 1, 0.74, 24, 6);
      for (let k = 1; k < arm.pos.length; k += 3) arm.pos[k] += fa.from;
      meshes.forearm = upload(gl, arm);
      meshes.joint = upload(gl, sphere(0.42, 12, 8));
      meshes.bone = upload(gl, roundCone(0.16, 0.16, 1, 1, 1, 8, 2));
      // Floor disc in the XZ plane (unit radius).
      const fpos = [];
      const fidx = [];
      const segs = 48;
      fpos.push(0, 0, 0);
      for (let i = 0; i <= segs; i++) { const a = (i / segs) * Math.PI * 2; fpos.push(Math.cos(a), 0, Math.sin(a)); }
      for (let i = 1; i <= segs; i++) fidx.push(0, i, i + 1);
      meshes.floor = upload(gl, { pos: fpos, nor: fpos, idx: fidx });
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      return true;
    }

    /** Set up in one go (used after the browser restores a lost context). */
    const initGL = () => startGL() && finishGL();

    function fallback() {
      if (wrap.classList.contains('is-fallback')) return;
      wrap.classList.add('is-fallback');
      const note = document.createElement('p');
      note.className = 'hand3d__fallback';
      note.textContent = '3D needs WebGL, which this browser or device does not provide. The descriptions next to the hand still apply.';
      wrap.appendChild(note);
      emit('fallback');
    }

    // Creating the context and compiling shaders can take a moment on slow devices, so it
    // waits until the hand is near the screen and the page around it has been painted
    // (page transitions stay quick), and the shaders compile in the background where the
    // browser allows it. Anything asked of the hand before then plays as soon as it is ready.
    function fail() {
      phase = 'failed';
      glOk = false;
      supportCache = false; // later stages fall back at once, without a test context
      wrap.classList.remove('is-booting');
      fallback();
      if (state.track) runWithoutGL();
    }
    function ready() {
      phase = 'ready';
      glOk = true;
      supportCache = true;
      wrap.classList.remove('is-booting');
      resize();
      requestRender();
    }
    function boot() {
      if (phase !== 'idle' || state.destroyed) return;
      phase = 'booting';
      if (!startGL()) { fail(); return; }
      const settle = () => {
        if (state.destroyed || phase !== 'booting') return;
        if (compiling()) { requestAnimationFrame(settle); return; }
        if (finishGL()) ready(); else fail();
      };
      settle();
    }
    /** Finish starting right now (for a snapshot): waits for the driver if needed. */
    function bootNow() {
      boot();
      if (phase === 'booting' && pending) { if (finishGL()) ready(); else fail(); }
    }

    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); glOk = false; cancelAnimationFrame(state.raf); }, { signal: listeners.signal });
    canvas.addEventListener('webglcontextrestored', () => { glOk = initGL(); requestRender(); }, { signal: listeners.signal });

    /* ----- Sizing ----- */
    let width = 0;
    let height = 0;
    function resize() {
      const r = wrap.getBoundingClientRect();
      const cap = quality === 'light' ? 1.25 : (r.width < 520 ? 1.75 : 2);
      const dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, cap) * resScale);
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (w !== width || h !== height) { width = w; height = h; canvas.width = w; canvas.height = h; requestRender(); }
    }
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', resize, { signal: listeners.signal });
    const io = window.IntersectionObserver ? new IntersectionObserver((entries) => {
      state.visible = entries.some((e) => e.isIntersecting);
      if (state.visible) requestRender();
    }) : null;
    if (io) io.observe(wrap);

    /* ----- Drawing ----- */
    function draw() {
      if (!glOk || !width) return;
      const st = STYLES[state.style] || STYLES.kayumanggi;
      const base = lin(st.base);
      const rim = lin(st.rim);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const S = state.current;
      const { bones, joints } = solve(S);
      const handQ = S.q;
      const toWorld = (p) => add(S.pos, Q.rot(handQ, p));

      // Camera: orbit around the (smoothed) centre of the hand.
      const dist = 47;
      const yaw = (state.yaw + (state.view === 'signer' ? 180 : 0)) * DEG;
      const pitch = state.pitch * DEG;
      const tgt = state.target;
      const eye = [tgt[0] + dist * Math.sin(yaw) * Math.cos(pitch), tgt[1] - dist * Math.sin(pitch), tgt[2] + dist * Math.cos(yaw) * Math.cos(pitch)];
      const proj = M.perspective(30 * DEG, width / height, 1, 200);
      const view = M.lookAt(eye, tgt, [0, 1, 0]);
      const vp = M.mul(proj, view);
      const mirror = state.mirror ? -1 : 1;
      const mirrorM = (m) => { if (mirror < 0) { m[0] = -m[0]; m[4] = -m[4]; m[8] = -m[8]; m[12] = -m[12]; } return m; };

      // Floor below the lowest point of the hand.
      if (opts.floor !== false) {
        let minY = Infinity;
        let cx = 0;
        let cz = 0;
        joints.forEach((j) => { const w = toWorld(j); minY = Math.min(minY, w[1]); cx += w[0]; cz += w[2]; });
        cx /= joints.length; cz /= joints.length;
        const size = 17;
        const fy = Math.min(minY - 2.5, -6);
        gl.useProgram(floor.prog);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.uniformMatrix4fv(floor.loc.uVP, false, vp);
        gl.uniform3fv(floor.loc.uCentre, [0, fy, 0]);
        gl.uniform1f(floor.loc.uSize, size);
        gl.uniform1f(floor.loc.uGrid, size / 2);
        gl.uniform3fv(floor.loc.uRim, rim);
        gl.uniform2fv(floor.loc.uShadow, [mirror * cx / size, cz / size]);
        gl.uniform1f(floor.loc.uShadowR, 0.42);
        bind(floor, meshes.floor, false);
        gl.drawElements(gl.TRIANGLES, meshes.floor.count, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
      }

      gl.useProgram(prog.prog);
      gl.frontFace(mirror < 0 ? gl.CW : gl.CCW);
      gl.uniformMatrix4fv(prog.loc.uVP, false, vp);
      gl.uniform3fv(prog.loc.uEye, eye);
      gl.uniform3fv(prog.loc.uBase, base);
      gl.uniform3fv(prog.loc.uRim, rim);
      gl.uniform3fv(prog.loc.uKey, norm([0.45 + Math.sin(yaw) * 0.3, 0.75, 0.6 * Math.cos(yaw) + 0.2]));
      gl.uniform3fv(prog.loc.uFill, norm([-0.7, 0.1, -0.4 * Math.cos(yaw)]));

      const holo = !!st.holo;
      const skinAlpha = state.xray ? 0.28 : 1;
      const transparent = holo || state.xray;

      const drawPart = (mesh, model, o = {}) => {
        gl.uniformMatrix4fv(prog.loc.uModel, false, model);
        gl.uniformMatrix3fv(prog.loc.uNM, false, M.normal3(model));
        gl.uniform1f(prog.loc.uMode, o.mode != null ? o.mode : (holo ? 1 : 0));
        gl.uniform1f(prog.loc.uAlpha, o.alpha != null ? o.alpha : 1);
        gl.uniform1f(prog.loc.uNail, o.nail ? 1 : 0);
        gl.uniform2fv(prog.loc.uNailBox, o.nailBox || [1, 1]);
        gl.uniform1f(prog.loc.uFade, o.fade != null ? o.fade : -999);
        bind(prog, mesh, true);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
      };

      const skinParts = () => {
        const handM = mirrorM(M.fromQP(handQ, S.pos));
        drawPart(meshes.palm, handM, { alpha: skinAlpha });
        bones.forEach((b) => {
          const m = mirrorM(M.fromQP(Q.mul(handQ, b.q), toWorld(b.p)));
          const f = b.part[0] === 't' ? HAND.thumb : HAND.fingers.find((x) => x.id === b.part[0]);
          const s = Number(b.part[1]);
          drawPart(meshes[b.part], m, { alpha: skinAlpha, nail: b.nail && !holo, nailBox: [f.len[s], f.rad[s + 1]] });
        });
        drawPart(meshes.forearm, handM, { alpha: skinAlpha, fade: HAND.forearm.from + 2 });
      };

      if (state.xray) {
        // Glowing joints and bones first, then a translucent skin over them.
        joints.forEach((j) => drawPart(meshes.joint, mirrorM(M.fromQP(handQ, toWorld(j))), { mode: 2, alpha: 1 }));
        const links = [];
        for (let k = 0; k < 4; k++) { const b = 1 + k * 4; links.push([0, b], [b, b + 1], [b + 1, b + 2], [b + 2, b + 3]); }
        links.push([0, 17], [17, 18], [18, 19], [19, 20]);
        links.forEach(([a, b]) => {
          const pa = toWorld(joints[a]);
          const pb = toWorld(joints[b]);
          const dv = sub(pb, pa);
          const len = Math.hypot(dv[0], dv[1], dv[2]);
          const yAxis = norm(dv);
          const ref = Math.abs(yAxis[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
          const xAxis = norm(cross(yAxis, ref));
          const zAxis = cross(xAxis, yAxis);
          drawPart(meshes.bone, mirrorM(M.fromQP(Q.basis(xAxis, yAxis, zAxis), pa, 1, len, 1)), { mode: 2, alpha: 0.55 });
        });
      }

      if (transparent) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, holo ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        skinParts();
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      } else {
        // Opaque hand; only the forearm's fade needs blending.
        const handM = mirrorM(M.fromQP(handQ, S.pos));
        drawPart(meshes.palm, handM);
        bones.forEach((b) => {
          const m = mirrorM(M.fromQP(Q.mul(handQ, b.q), toWorld(b.p)));
          const f = b.part[0] === 't' ? HAND.thumb : HAND.fingers.find((x) => x.id === b.part[0]);
          const s = Number(b.part[1]);
          drawPart(meshes[b.part], m, { nail: b.nail, nailBox: [f.len[s], f.rad[s + 1]] });
        });
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        drawPart(meshes.forearm, handM, { fade: HAND.forearm.from + 2 });
        gl.disable(gl.BLEND);
      }

    }

    /* Where the camera should look: the centre of the hand's joints (computed every frame).
       Travel (pos) is left out, so movements such as Z or a circle stay visible. */
    function framingGoal() {
      const S = state.current;
      const { joints } = solve(S);
      let c = [0, 0, 0];
      joints.forEach((j) => { c = add(c, Q.rot(S.q, j)); });
      c = scale(c, 1 / joints.length);
      return [(state.mirror ? -1 : 1) * c[0], c[1] + 0.5, c[2]];
    }

    function bind(p, mesh, withNormals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vb);
      gl.enableVertexAttribArray(p.loc.aPos);
      gl.vertexAttribPointer(p.loc.aPos, 3, gl.FLOAT, false, 0, 0);
      if (withNormals && p.loc.aNor >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nb);
        gl.enableVertexAttribArray(p.loc.aNor);
        gl.vertexAttribPointer(p.loc.aNor, 3, gl.FLOAT, false, 0, 0);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ib);
    }

    /* ----- Animation loop: runs only while something changes ----- */
    let last = 0;
    let dirty = true;
    function requestRender() {
      dirty = true;
      if (!state.raf && !state.destroyed) state.raf = requestAnimationFrame(frame);
    }

    /* Slow frames (under ~30 per second, measured while the hand moves) lower the resolution. */
    const frameTimes = [];
    function watchFrames(interval) {
      if (interval <= 0 || interval > 150 || document.visibilityState === 'hidden') return;
      frameTimes.push(interval);
      if (frameTimes.length < 30) return;
      const median = frameTimes.slice().sort((a, b) => a - b)[15];
      frameTimes.length = 0;
      if (median > 34 && resScale > 0.55) {
        resScale = Math.max(0.55, resScale * 0.8);
        width = 0;
        resize();
        emit('quality', { quality, scale: resScale });
      }
    }

    function frame(now) {
      state.raf = 0;
      if (state.destroyed || !glOk) { last = 0; return; }
      if (last) watchFrames(now - last);
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      let active = advance(now);
      // Ease the camera target toward the hand's centre.
      const k = reduced() ? 1 : 1 - Math.exp(-dt / 140);
      const tg = state.target;
      const goal = framingGoal();
      const moved = Math.abs(goal[0] - tg[0]) + Math.abs(goal[1] - tg[1]) + Math.abs(goal[2] - tg[2]);
      if (moved > 0.01) { state.target = [lerp(tg[0], goal[0], k), lerp(tg[1], goal[1], k), lerp(tg[2], goal[2], k)]; active = true; }
      if (dirty || active) {
        dirty = false;
        if (state.visible && document.visibilityState !== 'hidden') draw();
      }
      if (active) state.raf = requestAnimationFrame(frame);
      else last = 0;
    }

    /* Track playback: keys are { state, dur, ease, step }. */
    function advance(now) {
      const tr = state.track;
      if (!tr) return false;
      if (tr.paused) return false;
      // A long frame gap (the first shader compile, a busy phone, a hidden tab)
      // holds the timeline instead of skipping letters.
      if (tr.t0 && tr.last && now - tr.last > 150) tr.t0 += now - tr.last - 16;
      tr.last = now;
      if (!tr.t0) tr.t0 = now;
      while (tr.i < tr.keys.length) {
        const key = tr.keys[tr.i];
        const dur = key.dur / state.speed;
        if (!key.started) {
          key.started = true;
          if (key.step && tr.onStep) tr.onStep(key.step);
        }
        const t = dur ? (now - tr.t0) / dur : 1;
        if (t < 1) {
          // Reduced motion: no tweening. Each key's pose appears at once and stays for the
          // key's time, so every letter (and the path of J and Z) is still shown.
          if (!reduced()) state.current = mixState(tr.from, key.state, key.ease === 'linear' ? t : ease(t));
          else if (tr.shown !== tr.i) { tr.shown = tr.i; state.current = cloneState(key.state); }
          return true;
        }
        state.current = cloneState(key.state);
        tr.from = cloneState(key.state);
        tr.t0 += dur;
        tr.i += 1;
      }
      const done = tr.onDone;
      state.track = null;
      if (done) done();
      return true;
    }

    function play(keys, handlers = {}) {
      state.track = { keys, i: 0, t0: 0, from: cloneState(state.current), onStep: handlers.onStep, onDone: handlers.onDone, paused: false };
      if (phase === 'idle' || phase === 'booting') return; // ready() starts it
      if (!glOk) {
        // Without WebGL, still run the timing so captions and tiles stay in step.
        runWithoutGL();
        return;
      }
      requestRender();
    }

    let fallbackTimer = 0;
    function runWithoutGL() {
      clearTimeout(fallbackTimer);
      const tick = () => {
        if (state.destroyed || !state.track) return;
        const now = performance.now();
        advance(now);
        if (state.track) fallbackTimer = setTimeout(tick, 40);
      };
      tick();
    }

    /* ----- Interaction: drag to turn, arrow keys, double-click to reset ----- */
    if (opts.interactive !== false) {
      let drag = null;
      canvas.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch, id: e.pointerId };
        canvas.setPointerCapture(e.pointerId);
        wrap.classList.add('is-dragging');
      }, { signal: listeners.signal });
      canvas.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        state.yaw = drag.yaw + (e.clientX - drag.x) * 0.45;
        if (e.pointerType !== 'touch') state.pitch = U.clamp(drag.pitch + (e.clientY - drag.y) * 0.3, -60, 60);
        requestRender();
        emit('view');
      }, { signal: listeners.signal });
      const end = () => { drag = null; wrap.classList.remove('is-dragging'); };
      canvas.addEventListener('pointerup', end, { signal: listeners.signal });
      canvas.addEventListener('pointercancel', end, { signal: listeners.signal });
      canvas.addEventListener('dblclick', () => api.resetView(), { signal: listeners.signal });
      canvas.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k === 'ArrowLeft') state.yaw -= 15;
        else if (k === 'ArrowRight') state.yaw += 15;
        else if (k === 'ArrowUp') state.pitch = U.clamp(state.pitch - 10, -60, 60);
        else if (k === 'ArrowDown') state.pitch = U.clamp(state.pitch + 10, -60, 60);
        else if (k === 'Home' || k === '0') { api.resetView(); e.preventDefault(); return; }
        else return;
        e.preventDefault();
        requestRender();
        emit('view');
      }, { signal: listeners.signal });
    }

    const handlers = {};
    function emit(name, data) { (handlers[name] || []).forEach((fn) => fn(data)); }

    /* ----- Public API ----- */
    const api = {
      element: wrap,
      canvas,
      /** False when WebGL is missing or failed (the stage then shows a note instead). */
      get supported() { return phase === 'failed' ? false : phase === 'ready' ? glOk : supportCache !== false; },
      /** 'full' or 'light', and the current resolution factor. */
      get quality() { return { quality, scale: resScale }; },
      setQuality(pref) {
        const next = chooseQuality(pref);
        if (next === quality) return api;
        quality = next;
        resScale = 1;
        width = 0;
        resize();
        return api;
      },
      on(name, fn) { (handlers[name] || (handlers[name] = [])).push(fn); return api; },
      /** Animate to a pose (letter or handshape id). */
      show(id, o = {}) {
        const keys = D.handKeys(id, { mirror: state.mirror });
        if (!keys) return api;
        if (o.instant) {
          state.track = null;
          state.current = cloneState(keys[keys.length - 1].state);
          requestRender();
          return api;
        }
        play(keys.map((k, i) => (i === 0 ? Object.assign({}, k, { dur: o.dur != null ? o.dur : k.dur }) : k)), o);
        return api;
      },
      /** Fingerspell text; onStep receives { index, char, id, gap }. */
      spell(text, o = {}) {
        const plan = D.spellPlan(text);
        play(plan.keys, { onStep: o.onStep, onDone: o.onDone });
        return plan;
      },
      /** Play a movement or orientation demonstration. */
      demo(id, o = {}) {
        const keys = D.handDemo(id);
        if (keys) play(keys, o);
        return api;
      },
      stop() { state.track = null; clearTimeout(fallbackTimer); return api; },
      pause(on = true) {
        if (state.track) {
          state.track.paused = on;
          if (!on) { state.track.t0 = 0; state.track.from = cloneState(state.current); requestRender(); }
        }
        return api;
      },
      isPlaying() { return !!state.track && !state.track.paused; },
      setSpeed(v) { state.speed = U.clamp(Number(v) || 1, 0.25, 2); return api; },
      setMirror(on) { state.mirror = !!on; requestRender(); return api; },
      setStyle(name) { if (STYLES[name]) { state.style = name; requestRender(); } return api; },
      setXray(on) { state.xray = !!on; requestRender(); return api; },
      setView(v) { state.view = v === 'signer' ? 'signer' : 'front'; requestRender(); emit('view'); return api; },
      get view() { return state.view; },
      resetView() { state.yaw = 0; state.pitch = -6; requestRender(); emit('view'); return api; },
      turn(deg) { state.yaw += deg; requestRender(); emit('view'); return api; },
      setLabel(text) { canvas.setAttribute('aria-label', text); return api; },
      /** Jump straight to a resolved pose state (used by tests and the pose editor). */
      __setState(s) { state.track = null; state.current = cloneState(s); requestRender(); return api; },
      /** Data URL of the current frame (needs { capture: true }). */
      snapshot() { bootNow(); if (!glOk) return ''; state.target = framingGoal(); draw(); return canvas.toDataURL('image/png'); },
      destroy() {
        if (state.destroyed) return;
        state.destroyed = true;
        cancelAnimationFrame(state.raf);
        clearTimeout(fallbackTimer);
        listeners.abort();
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        if (gl) { const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }
        wrap.remove();
      },
    };

    resize();
    if (supportCache === false) {
      phase = 'failed';
      fallback();
    } else {
      wrap.classList.add('is-booting');
      const start = () => pageShown().then(() => requestAnimationFrame(() => setTimeout(boot, 0)));
      if (window.IntersectionObserver) {
        // Start when the stage comes within a screen's reach, not before.
        const near = new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting)) { near.disconnect(); start(); }
        }, { rootMargin: '300px 0px' });
        near.observe(wrap);
        listeners.signal.addEventListener('abort', () => near.disconnect(), { once: true });
      } else {
        start();
      }
    }
    if (opts.signal) opts.signal.addEventListener('abort', () => api.destroy(), { once: true });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') requestRender(); }, { signal: listeners.signal });
    return api;
  }

  T.hand3d = { create, supported, whenShown: pageShown, STYLES, makeState, solve, HAND };
})();
