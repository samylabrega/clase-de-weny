// Ley de Coulomb: cinco figuras isométricas en una página.
// node coulomb/build.mjs  → coulomb/index.html
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 600;
const H = 380;
const KC = 8.99e9; // N·m²/C²  (en los ejercicios se usa 9 × 10⁹)

// ---------- shared drawing helpers ----------
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (P, points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const f1 = (v) => v.toFixed(1);

// Arrow as a filled screen polygon between two world points (also inlined in the page).
function arrowD(a, b, P, w = 1.8, head = 7) {
  const A = k.iso(a, P);
  const B = k.iso(b, P);
  let dx = B[0] - A[0];
  let dy = B[1] - A[1];
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return "";
  dx /= len;
  dy /= len;
  const nx = -dy;
  const ny = dx;
  const h = Math.min(head, len * 0.7);
  const hw = w * 2.3;
  const C = [B[0] - dx * h, B[1] - dy * h];
  const pts = [
    [A[0] + (nx * w) / 2, A[1] + (ny * w) / 2],
    [C[0] + (nx * w) / 2, C[1] + (ny * w) / 2],
    [C[0] + nx * hw, C[1] + ny * hw],
    B,
    [C[0] - nx * hw, C[1] - ny * hw],
    [C[0] - (nx * w) / 2, C[1] - (ny * w) / 2],
    [A[0] - (nx * w) / 2, A[1] - (ny * w) / 2],
  ];
  return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
}

// A charged sphere: kit-shaded ball whose tokens are recoloured by data-q, with its sign glyph.
function ballSvg(P, c, r, sign, extra = "") {
  const [sx, sy] = k.iso(c, P);
  const g = r * P.scale * 0.42;
  const plus = `M${f1(sx - g)} ${f1(sy)}H${f1(sx + g)}M${f1(sx)} ${f1(sy - g)}V${f1(sy + g)}`;
  const minus = `M${f1(sx - g)} ${f1(sy)}H${f1(sx + g)}`;
  const zero = `M${f1(sx)} ${f1(sy - g * 0.75)}a${f1(g * 0.5)} ${f1(g * 0.75)} 0 1 0 0.01 0Z`;
  return `<g class="q" data-q="${sign}"${extra}>${S(G.sphereOf(c, r, P), { tone: "hi", crease: "none" })}<path class="q-sign q-plus" d="${plus}"/><path class="q-sign q-minus" d="${minus}"/><path class="q-sign q-zero" d="${zero}"/></g>`;
}

// Base plate on feet with groove, corner screws.
function plateSvg(P, plan, h = 10) {
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, -h - 4, h, P)}"/>`];
  for (const [x, y] of byDepth(P, k.corners(plan, 16))) {
    out.push(S(k.cylinder(x, y, 6, -h - 4, 1.4, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.6, -h - 2.6, 2.6, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(plan, -h, h, P, 8, 1.4), { tone: "mid", inner: L(k.sideSeam(plan, -h + 3, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 4.5), 0, P), { tone: "faint" }));
  const screws = k.corners(plan, 8.5);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.5 }));
  return out.join("");
}

// Ruler strip with metre numbers. x0 = zero mark, m = units per metre, n = metres.
function rulerSvg(P, x0, m, n, y, { from = x0 - 6, to = x0 + m * n + 6 } = {}) {
  const strip = { x: from, y, w: to - from, d: 10, r: 1 };
  const out = [S(k.slabOf(strip, 0, 0.8, P, 3), { tone: "lo", crease: "none" })];
  const ticks = k.topTicks(x0, x0 + m * n + 0.01, m / 4, 4, y + 0.2, 0.8, [2.2, 4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.lineOnTop([x0, y + 0.2], [x0, y + 5.2], 0.8, P), { tone: "hi", free: "end" }));
  for (let i = 0; i <= n; i++) out.push(k.faceTextSvg(k.topMatrix([x0 + i * m, y + 9.2], 0.8, P, "x"), String(i) + (i === n ? " m" : ""), { size: 4.4, tone: "hi", anchor: "middle" }));
  out.push(D([k.iso([from + 2, y + 5, 0.8], P), k.iso([to - 2, y + 5, 0.8], P)], { size: 0.45 }));
  return out.join("");
}

// A rail along x with end stops.
function railSvg(P, x0, x1, y) {
  const out = [];
  out.push(S(k.slabOf({ x: x0, y: y - 4, w: x1 - x0, d: 8, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.lineOnTop([x0, y], [x1, y], 3, P), { tone: "faint" }));
  for (const x of [x0 - 4, x1]) {
    out.push(S(k.slabOf({ x, y: y - 6, w: 4, d: 12, r: 1 }, 0, 7, P, 3, 0.4), { tone: "mid" }));
    out.push(D([k.iso([x + 2, y - 3, 7], P), k.iso([x + 2, y + 3, 7], P)], { size: 0.42 }));
  }
  return out.join("");
}

// An insulating stand on a carriage, standing at (x, y) on a rail top (z = 3). Ball sits at capTop + r.
const CAP_TOP = 39;
function standSvg(P, x, y, { pointer = false } = {}) {
  const out = [];
  const car = { x: x - 11, y: y - 9, w: 22, d: 18, r: 2 };
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(car, 3), 3, 0.1, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.slabOf(car, 3, 4, P, 4, 0.5), { tone: "mid" }));
  out.push(D(k.corners(car, 3).map(([px, py]) => k.iso([px, py, 7], P)), { size: 0.42, tone: "mid" }));
  // thumb screw on the near face
  out.push(S(k.slabOf({ x: x + 4, y: y + 9, w: 2.6, d: 2.4, r: 0.6 }, 4, 2.4, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x + 5.3, y + 12.6, 2.2, 3.4, 3.6, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(x + 5.3, y + 12.6, 2.2, 3.4, 7, 14, P), { tone: "lo" }));
  if (pointer) {
    // index tongue that reads the ruler in front of the rail
    out.push(S(k.slabOf({ x: x - 1.6, y: y + 9, w: 3.2, d: 7, r: 0.6 }, 3.4, 1, P, 2), { tone: "hi", crease: "lo" }));
    out.push(L(k.lineOnTop([x, y + 9], [x, y + 16], 4.4, P), { tone: "lit" }));
  }
  out.push(S(k.cylinder(x, y, 5, 7, 2.5, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 1.9, 9.5, 27.5, P, 18), { tone: "mid", crease: "none", inner: L([16, 22, 28].map((z) => k.sideArc(x, y, 1.9, z, P, 12)).join(""), { tone: "lo" }) }));
  out.push(S(k.cylinder(x, y, 3.4, 37, 2, P, 24), { tone: "hi", crease: "lo" }));
  return out.join("");
}

const card = (id, svg) => `<div class="iso-stage" id="${id}">${svg}</div>`;

// =====================================================================
// Fig 1 · El átomo (litio-7: 3 p⁺, 4 n⁰, 3 e⁻)
// =====================================================================
const A1 = (() => {
  const ZN = 80; // nucleus centre height
  const R_IN = 40;
  const R_OUT = 64;
  const BASE = 60;
  const P = k.fitProjection(
    [...k.boxCorners({ x: -BASE, y: -BASE, w: 2 * BASE, d: 2 * BASE, r: BASE }, -18, 0), [0, 0, ZN + 14], [-R_OUT, R_OUT * 0, ZN], [R_OUT, 0, ZN], [0, R_OUT, ZN], [0, -R_OUT, ZN]],
    W,
    340,
    { pad: 26, azimuth: 50, elevation: 30 },
  );
  const a = (P.azimuth * Math.PI) / 180;
  const out = [];
  // round base
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: -BASE, y: -BASE, w: 2 * BASE, d: 2 * BASE, r: BASE }, -18, 14, P)}"/>`);
  const feet = [0, 1, 2, 3].map((i) => [Math.cos(a + Math.PI / 4 + (i * Math.PI) / 2) * 44, Math.sin(a + Math.PI / 4 + (i * Math.PI) / 2) * 44]);
  for (const [x, y] of byDepth(P, feet)) {
    out.push(S(k.cylinder(x, y, 7, -18, 1.6, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -16.4, 3, P, 24), { tone: "mid" }));
  }
  out.push(S(k.cylinder(0, 0, BASE, -13.4, 4, P, 120, 0.8), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, BASE - 3, -9.4, 9.4, P, 120, 1.2), { tone: "mid", inner: L(k.sideArc(0, 0, BASE - 3, -4, P, 80), { tone: "faint" }) }));
  out.push(L(k.ring(0, 0, BASE - 8, 0, P, 120), { tone: "faint" }));
  const tick = k.radialTicks(0, 0, BASE - 8, 72, 6, 0, [1.4, 3], P);
  out.push(L(tick.minor, { tone: "lo" }), L(tick.major, { tone: "mid" }));
  const bolts = [0, 1, 2, 3, 4, 5].map((i) => [Math.cos((i * Math.PI) / 3) * 20, Math.sin((i * Math.PI) / 3) * 20]);
  out.push(L(k.ring(0, 0, 24, 0, P, 64), { tone: "lo" }));
  out.push(D(bolts.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.5, tone: "mid" }));
  // label plate (the one engraved label)
  const lx = Math.cos(a) * 36;
  const ly = Math.sin(a) * 36;
  const plate = { x: lx - 9, y: ly - 6, w: 18, d: 12, r: 1.2 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.4), 0.8, P, 3), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([lx, ly + 1.4], 0.8, P, "x"), "Li", { size: 6, tone: "hi", anchor: "middle" }));
  // post
  out.push(S(k.cylinder(0, 0, 8, 0, 3, P, 40, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 5, 3, 3, P, 32), { tone: "mid" }));
  const post = S(k.cylinder(0, 0, 2.2, 6, ZN - 6, P, 20), { tone: "mid", crease: "none", inner: L([22, 40, 58].map((z) => k.sideArc(0, 0, 2.2, z, P, 12)).join(""), { tone: "lo" }) });

  // rings split into back and front halves around the nucleus
  const half = (r, back) => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const t = a + Math.PI / 2 + (i / 64) * Math.PI + (back ? 0 : Math.PI);
      pts.push([Math.cos(t) * r, Math.sin(t) * r]);
    }
    return k.onTop(pts, ZN, P);
  };
  const ringBack = [R_IN, R_OUT].map((r) => `<path class="iso-line wire" data-tone="mid" d="${half(r, true)}"/>`).join("");
  const ringFront = [R_IN, R_OUT].map((r) => `<path class="iso-line wire" data-tone="mid" d="${half(r, false)}"/>`).join("");

  // nucleus: pentagonal bipyramid of 7 balls
  const NR = 7;
  const nuc = [[0, 0, 9.4, "pos"], [0, 0, -9.4, "neu"]];
  ["pos", "neu", "pos", "neu", "neu"].forEach((s, i) => nuc.push([Math.cos((i * 2 * Math.PI) / 5) * 9.6, Math.sin((i * 2 * Math.PI) / 5) * 9.6, 0, s]));
  const nucSvg = nuc.map(([x, y, z, s], i) => ballSvg(P, [x, y, ZN + z], NR, s, ` data-n="${i}"`)).join("");

  // electrons, built at the nucleus centre and moved live
  const ER = 5.4;
  const electrons = [0, 1, 2, 3].map((i) => `<g class="e-item" data-e="${i}"><g class="e-ball">${ballSvg(P, [0, 0, ZN], ER, "neg")}</g><path class="farrow" data-c="f"/></g>`).join("");

  const svg = k.figureSvg({
    width: W,
    height: 340,
    label: "Modelo de átomo de litio sobre un pie: en el centro un núcleo de 3 protones rojos (+) y 4 neutrones grises (0); alrededor, dos anillos con electrones azules (−). Cada electrón tiene una flecha verde que apunta hacia el núcleo: la fuerza de atracción, más fuerte en el anillo interior.",
    body: [
      out.join(""),
      `<g id="a-back">${ringBack}<g data-dyn="back"></g></g>`,
      post,
      `<g id="a-nuc">${nucSvg}</g>`,
      `<g id="a-front">${ringFront}<g data-dyn="front"></g></g>`,
      `<g hidden id="a-pool">${electrons}<path class="iso-line spoke" data-tone="mid" data-s="0"/><path class="iso-line spoke" data-tone="mid" data-s="1"/></g>`,
    ],
  });
  return { svg, data: { P, ZN, R_IN, R_OUT, ER, NR, nuc: nuc.map(([x, y, z]) => [x, y, z]), a } };
})();

// =====================================================================
// Fig 2 · Iguales se repelen, opuestas se atraen
// =====================================================================
const A2 = (() => {
  const plan = { x: -104, y: -66, w: 208, d: 132, r: 7 };
  const TRACKS = [-38, 4, 46];
  const P = k.fitProjection([...k.boxCorners(plan, -14, 0), [-80, -38, 60], [80, -38, 60]], W, H, { pad: 26, azimuth: 62 });
  const out = [plateSvg(P, plan, 10)];
  // engraved label plate at the near left
  const lab = { x: -96, y: 50, w: 30, d: 9, r: 1 };
  out.push(S(k.slabOf(lab, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(lab, 1.4), 0.8, P, 3), { tone: "faint" }));
  [24, 16, 20].forEach((len, i) => out.push(L(k.lineOnTop([-93, 54.4 + i * 2], [-93 + len, 54.4 + i * 2], 0.8, P), { tone: "lo", free: true })));
  const body = [out.join("")];
  TRACKS.forEach((y, t) => {
    body.push(railSvg(P, -88, 88, y));
    // centre stop block
    body.push(S(k.slabOf({ x: -3, y: y - 5, w: 6, d: 10, r: 1 }, 3, 5, P, 3, 0.4), { tone: "mid" }));
    body.push(D([k.iso([0, y, 8], P)], { size: 0.5, tone: "mid" }));
    for (const side of [0, 1]) {
      const x0 = side ? 40 : -40;
      body.push(`<g data-car="${t}-${side}">${standSvg(P, x0, y)}${ballSvg(P, [x0, y, CAP_TOP + 8], 8, "pos", ` data-ball="${t}-${side}" tabindex="-1"`)}</g>`);
    }
    body.push(`<path class="farrow" data-c="f" data-arrow="${t}-0"/><path class="farrow" data-c="f" data-arrow="${t}-1"/>`);
  });
  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Banco con tres rieles. En cada riel hay dos esferas cargadas sobre soportes aislantes con ruedas. Arriba: + y +, se alejan. En medio: − y −, se alejan. Abajo: + y −, se acercan hasta el tope central. Flechas verdes muestran la fuerza sobre cada esfera.",
    body,
  });
  return { svg, data: { P, TRACKS, ZC: CAP_TOP + 8, R: 8 } };
})();

// =====================================================================
// Fig 3 · Banco de Coulomb (fórmula interactiva)
// =====================================================================
const A3 = (() => {
  const M = 34; // world units per metre
  const X0 = -70;
  const plan = { x: -98, y: -34, w: 214, d: 72, r: 6 };
  const P = k.fitProjection([...k.boxCorners(plan, -14, 0), [X0, 0, 70], [X0 + 4 * M, 0, 70], [X0 - 40, 0, 52]], W, H, { pad: 22, azimuth: 66 });
  const out = [plateSvg(P, plan, 10)];
  out.push(rulerSvg(P, X0, M, 4, 18));
  out.push(`<path class="d-band" data-d-band/>`);
  out.push(railSvg(P, -88, 106, 0));
  const REST = X0 + 2 * M;
  out.push(`<g data-q1>${standSvg(P, X0, 0, { pointer: true })}<g data-ball="1">${ballSvg(P, [X0, 0, CAP_TOP + 8], 8, "pos")}</g></g>`);
  out.push(`<g data-car2>${standSvg(P, REST, 0, { pointer: true })}<g data-ball="2">${ballSvg(P, [REST, 0, CAP_TOP + 8], 8, "pos")}</g></g>`);
  out.push(`<path class="farrow" data-c="f" data-arrow="1"/><path class="farrow" data-c="f" data-arrow="2"/>`);
  out.push(`<text class="flabel" data-c="f" data-label="1">F</text><text class="flabel" data-c="f" data-label="2">F</text><text class="flabel" data-c="d" data-label="d">d</text>`);
  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Banco de medida: dos esferas cargadas sobre soportes en un riel, con una regla en metros delante. La franja violeta marca la distancia d entre ellas. El tamaño de cada esfera crece con su carga y las flechas verdes con la fuerza.",
    body: out,
  });
  return { svg, data: { P, M, X0, REST, ZB: CAP_TOP, R0: 8, Y_RULER: 18 } };
})();

// =====================================================================
// Fig 4 · Tres cargas en línea
// =====================================================================
const A4 = (() => {
  const M = 28;
  const X1 = -44;
  const plan = { x: -74, y: -34, w: 180, d: 72, r: 6 };
  const ZC = CAP_TOP + 8;
  const P = k.fitProjection([...k.boxCorners(plan, -14, 0), [X1 - 70, 0, ZC + 36], [X1 + 4 * M, 0, ZC + 10], [X1 - 70, 0, ZC - 4]], W, H, { pad: 24, azimuth: 66 });
  const out = [plateSvg(P, plan, 10)];
  out.push(rulerSvg(P, X1, M, 4, 18));
  out.push(railSvg(P, -64, 98, 0));
  [0, 1, 2].forEach((i) => {
    const x = X1 + [0, 2, 4][i] * M;
    out.push(`<g data-car="${i}">${standSvg(P, x, 0, { pointer: true })}${ballSvg(P, [x, 0, ZC], [9, 7.5, 6][i], "pos", ` data-ball="${i}"`)}</g>`);
  });
  // a short mast above Q1 that carries the tip-to-tail sum
  out.push(`<path class="iso-line" data-tone="lo" d="${k.segment([X1, 0, ZC + 10.3], [X1, 0, ZC + 30], P)}" data-mast/>`);
  out.push(`<path class="iso-line" data-tone="lo" data-drop d=""/>`);
  out.push(`<path class="farrow" data-c="fr" data-arrow="r"/><path class="farrow" data-c="f12" data-arrow="12"/><path class="farrow" data-c="f13" data-arrow="13"/>`);
  out.push(`<text class="flabel" data-c="f12" data-label="12">F₁₂</text><text class="flabel" data-c="f13" data-label="13">F₁₃</text><text class="flabel" data-c="fr" data-label="r">F total</text>`);
  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Riel con tres esferas: Q1 de 4 µC en 0 m, Q2 de 2 µC en 2 m y Q3 de 1 µC en 4 m. Sobre Q1 se dibujan, punta con cola, la fuerza de Q2 (verde) y la de Q3 (ámbar); a la altura de Q1, la flecha negra es la fuerza total, igual a la suma.",
    body: out,
  });
  return { svg, data: { P, M, X1, ZC, R: [9, 7.5, 6] } };
})();

// =====================================================================
// Fig 5 · mini dibujo para el paso 2
// =====================================================================
const A5 = (() => {
  const M = 40;
  const X1 = -40;
  const plan = { x: -62, y: -30, w: 124, d: 64, r: 6 };
  const P = k.fitProjection([...k.boxCorners(plan, -14, 0), [X1, 0, 62], [X1 + 2 * M, 0, 62]], 420, 260, { pad: 18, azimuth: 66 });
  const out = [plateSvg(P, plan, 10)];
  out.push(rulerSvg(P, X1, M, 2, 16));
  out.push(`<path class="d-band" d="${k.onTop([[X1, 16.4], [X1 + 2 * M, 16.4], [X1 + 2 * M, 18.2], [X1, 18.2]], 0.9, P, true)}"/>`);
  out.push(railSvg(P, -52, 52, 0));
  out.push(standSvg(P, X1, 0, { pointer: true }) + ballSvg(P, [X1, 0, CAP_TOP + 9], 9, "pos"));
  out.push(standSvg(P, X1 + 2 * M, 0, { pointer: true }) + ballSvg(P, [X1 + 2 * M, 0, CAP_TOP + 7.5], 7.5, "pos"));
  out.push(`<path class="farrow" data-c="f" d="${arrowD([X1 - 7, 0, CAP_TOP + 9], [X1 - 34, 0, CAP_TOP + 9], P)}"/>`);
  out.push(`<path class="farrow" data-c="f" d="${arrowD([X1 + 2 * M + 6, 0, CAP_TOP + 7.5], [X1 + 2 * M + 33, 0, CAP_TOP + 7.5], P)}"/>`);
  return k.figureSvg({
    width: 420,
    height: 260,
    label: "Dibujo del problema: Q1 = 4 µC a la izquierda y Q2 = 2 µC a 2 m; como las dos son positivas, las flechas apuntan hacia afuera: se repelen.",
    body: out,
  });
})();

// =====================================================================
// Page
// =====================================================================
const plate = (opts) => k.plateHtml(opts);

const fig1 = plate({
  fig: "Fig 1",
  title: "El átomo",
  hint: "Botones: quita o añade e⁻",
  readout: "3 p⁺ · 4 n⁰ · 3 e⁻ → neutro",
  keys: [
    { mark: "red", label: "protón (+)" },
    { mark: "raised", label: "neutrón (0)" },
    { mark: "blue", label: "electrón (−)" },
    { mark: "green", label: "fuerza de atracción" },
  ],
  body: card("fig1", A1.svg) + `<div class="ctl" role="group" aria-label="Electrones"><button type="button" data-e-minus>− quitar e⁻</button><button type="button" data-e-plus>+ añadir e⁻</button></div>`,
});

const fig2 = plate({
  fig: "Fig 2",
  title: "Signos",
  hint: "Toca una esfera para cambiar su signo",
  readout: "+/+ repelen · −/− repelen · +/− atraen",
  keys: [
    { mark: "red", label: "carga +" },
    { mark: "blue", label: "carga −" },
    { mark: "green", label: "fuerza sobre cada esfera" },
  ],
  body: card("fig2", A2.svg) + `<div class="ctl" role="group" aria-label="Cambiar signos">${[0, 1, 2].map((t) => `<span class="pair">${["Riel 1", "Riel 2", "Riel 3"][t]}: <button type="button" data-flip="${t}-0">+</button><button type="button" data-flip="${t}-1">+</button></span>`).join("")}</div>`,
});

const fig3 = plate({
  fig: "Fig 3",
  title: "La fórmula",
  hint: "Mueve los controles",
  readout: "F = 1.8 × 10⁻² N · repulsión",
  keys: [
    { mark: "red", label: "carga +" },
    { mark: "blue", label: "carga −" },
    { mark: "green", label: "fuerza F" },
  ],
  body:
    card("fig3", A3.svg) +
    `<div class="formula" aria-live="polite">
      <div class="eq"><span class="t-f">F</span> = <span class="t-k">k</span> · <span class="t-q1">|Q₁|</span> · <span class="t-q2">|Q₂|</span> / <span class="t-d">d²</span></div>
      <div class="tags"><span class="t-k">k = 9 × 10⁹ N·m²/C²</span><span class="t-q1">Q₁ en C</span><span class="t-q2">Q₂ en C</span><span class="t-d">d en m</span><span class="t-f">F en N</span></div>
      <div class="sub" data-sub></div>
    </div>
    <div class="sliders">
      <label><span class="t-q1">Q₁</span><button type="button" class="sgn" data-sign="1">+</button><input type="range" min="1" max="8" step="1" value="4" data-q="1"><output data-out="1">4 µC</output></label>
      <label><span class="t-q2">Q₂</span><button type="button" class="sgn" data-sign="2">+</button><input type="range" min="1" max="8" step="1" value="2" data-q="2"><output data-out="2">2 µC</output></label>
      <label><span class="t-d">d</span><span class="sgn-pad"></span><input type="range" min="1" max="4" step="0.25" value="2" data-q="d"><output data-out="d">2 m</output></label>
    </div>
    <div class="ctl" role="group" aria-label="Experimentos">
      <button type="button" data-x="q1">×2 Q₁</button><button type="button" data-x="q2">×2 Q₂</button><button type="button" data-x="d2">×2 d</button><button type="button" data-x="dh">÷2 d</button><button type="button" data-x="reset">Reiniciar</button>
    </div>
    <div class="change" data-change>Prueba: duplica una carga o la distancia.</div>`,
});

const fig4 = plate({
  fig: "Fig 4",
  title: "Tres cargas",
  hint: "Toca una esfera para cambiar su signo",
  readout: "F = 2.03 × 10⁻² N ←",
  keys: [
    { mark: "green", label: "F₁₂ (Q₂ sobre Q₁)" },
    { mark: "amber", label: "F₁₃ (Q₃ sobre Q₁)" },
    { mark: "lit", label: "F total sobre Q₁" },
  ],
  body:
    card("fig4", A4.svg) +
    `<div class="ctl" role="group" aria-label="Signos">${[["Q₁", "4 µC"], ["Q₂", "2 µC"], ["Q₃", "1 µC"]].map(([n, v], i) => `<span class="pair">${n} = <button type="button" data-flip4="${i}">+</button>${v}</span>`).join("")}</div>
    <div class="sum" data-sum></div>`,
});

const STEPS = [
  { t: "Datos", b: `<ul class="data"><li><span class="t-q1">Q₁ = 4 µC = 4 × 10⁻⁶ C</span></li><li><span class="t-q2">Q₂ = 2 µC = 2 × 10⁻⁶ C</span></li><li><span class="t-d">d = 2 m</span></li><li><span class="t-k">k = 9 × 10⁹ N·m²/C²</span></li><li><span class="t-f">F = ?</span></li></ul><p class="tip">µ (micro) = 10⁻⁶. Pasa siempre a coulombs (C) y metros (m).</p>` },
  { t: "Dibujo", b: `<div class="mini">${A5}</div><p class="tip">Mismo signo (+ y +) → se repelen: flechas hacia afuera.</p>` },
  { t: "Fórmula", b: `<div class="eq big"><span class="t-f">F</span> = <span class="t-k">k</span> · <span class="t-q1">|Q₁|</span> · <span class="t-q2">|Q₂|</span> / <span class="t-d">d²</span></div><p class="tip">Usa los valores sin signo. El signo solo dice si atraen o repelen.</p>` },
  { t: "Sustitución", b: `<div class="eq big"><span class="t-f">F</span> = <span class="t-k">9×10⁹</span> · <span class="t-q1">4×10⁻⁶</span> · <span class="t-q2">2×10⁻⁶</span> / <span class="t-d">2²</span></div><p class="tip"><span class="t-d">2² = 4</span>. ¡No olvides elevar la distancia al cuadrado!</p>` },
  { t: "Exponentes", b: `<div class="calc"><div><b>Números:</b> 9 · 4 · 2 / 4 = <b>18</b></div><div><b>Potencias:</b> 10⁹ · 10⁻⁶ · 10⁻⁶ = <span class="nw">10<sup>9 − 6 − 6</sup></span> = <b>10⁻³</b></div><div class="hl">F = 18 × 10⁻³ N</div></div><p class="tip">Al multiplicar potencias de 10, los exponentes se <b>suman</b>.</p>` },
  { t: "Resultado", b: `<div class="calc"><div>18 × 10⁻³ = <b>1.8 × 10⁻² N</b></div><div class="hl big">F = 0.018 N (repulsión)</div></div><p class="tip">Corre la coma un lugar a la izquierda → el exponente sube 1.</p>` },
];

const fig5 = `<figure class="iso-figure"><div class="iso-plate stepper"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 5</span><span class="iso-plate-corner" data-corner="title">Paso a paso</span><span class="iso-plate-corner" data-corner="hint">Siguiente →</span><span class="iso-plate-corner" data-corner="readout" data-step-readout>paso 1 de 6</span></div>
<ol class="steps-nav">${STEPS.map((s, i) => `<li><button type="button" data-goto="${i}"${i === 0 ? ' aria-current="step"' : ""}><span>${i + 1}</span>${s.t}</button></li>`).join("")}</ol>
<div class="steps">${STEPS.map((s, i) => `<section class="step" data-step="${i}"${i ? " hidden" : ""}><h3><span>${i + 1}</span>${s.t}</h3>${s.b}</section>`).join("")}</div>
<div class="ctl"><button type="button" data-prev>← Anterior</button><button type="button" data-next>Siguiente →</button></div>
</div><figcaption class="iso-legend"><span class="iso-caption">Problema: Q₁ = 4 µC y Q₂ = 2 µC separadas 2 m. ¿Cuánto vale la fuerza? (Es F₁₂ de la Fig 4.)</span></figcaption></figure>`;

const section = (n, title, lead, inner) => `<section class="sec"><h2><span class="n">${n}</span>${title}</h2><p class="lead">${lead}</p>${inner}</section>`;

const body = `
<header class="hero"><p class="kicker">Física · Electrostática</p><h1>Ley de Coulomb</h1><p class="lead">Dos cargas se empujan o se jalan. Cuánto: <span class="eq inline"><span class="t-f">F</span> = <span class="t-k">k</span>·<span class="t-q1">|Q₁|</span>·<span class="t-q2">|Q₂|</span> / <span class="t-d">d²</span></span></p></header>
${section(1, "El átomo", `El núcleo tiene <b class="t-pos">protones (+)</b> y <b>neutrones (0)</b>. Afuera giran los <b class="t-neg">electrones (−)</b>. <b class="t-pos">+</b> y <b class="t-neg">−</b> se atraen: por eso el núcleo los sujeta.`, fig1 + `<ul class="facts"><li>Átomo neutro: nº protones = nº electrones.</li><li>Pierde e⁻ → ion <b class="t-pos">+</b>. Gana e⁻ → ion <b class="t-neg">−</b>.</li><li>Anillo de adentro, más cerca → atracción más fuerte.</li></ul>`)}
${section(2, "Iguales se repelen, opuestas se atraen", `Mira las flechas: <b>apuntan hacia afuera</b> si se repelen y <b>hacia la otra carga</b> si se atraen.`, fig2 + `<div class="rules"><div><span class="chip pos">+</span><span class="chip pos">+</span>← →<b>repelen</b></div><div><span class="chip neg">−</span><span class="chip neg">−</span>← →<b>repelen</b></div><div><span class="chip pos">+</span><span class="chip neg">−</span>→ ←<b>atraen</b></div></div>`)}
${section(3, "La fórmula, desarmada", `Cada color es una parte. Cambia una y mira qué le pasa a <b class="t-f">F</b>.`, fig3 + `<div class="rules two"><div><b>×2 carga</b> → <b class="t-f">F ×2</b></div><div><b>×2 las dos cargas</b> → <b class="t-f">F ×4</b></div><div><b>×2 distancia</b> → <b class="t-f">F ÷4</b></div><div><b>÷2 distancia</b> → <b class="t-f">F ×4</b></div></div>`)}
${section(4, "Tres cargas en línea", `Calcula cada fuerza sobre <b>Q₁</b> por separado y súmalas como flechas: misma dirección se suman, contrarias se restan.`, fig4)}
${section(5, "Resolver un problema", `Siempre los mismos seis pasos.`, fig5)}
<section class="sec"><h2><span class="n">★</span>Para el examen</h2><div class="cheat">
<div><b>k</b> = 9 × 10⁹ N·m²/C²</div><div><b>µC</b> = 10⁻⁶ C · <b>nC</b> = 10⁻⁹ C</div><div><b>d</b> siempre en metros (cm ÷ 100)</div><div>Exponentes: multiplicar → <b>sumar</b>; dividir → <b>restar</b></div><div><b>d</b> al <b>cuadrado</b> en el denominador</div><div>Signo: iguales → repelen; distintos → atraen</div>
</div></section>
<p class="foot">k exacta ≈ 8.99 × 10⁹; en clase se redondea a 9 × 10⁹. Las fuerzas de la Fig 3 se calculan con 9 × 10⁹.</p>
`;

const EXTRA_CSS = `
.iso{--pos-0:#c93a3a;--pos-1:#d94c4c;--pos-2:#e46262;--pos-3:#ee7f7f;--pos-e:#8f1d1d;
--neg-0:#2c55c4;--neg-1:#3a66d6;--neg-2:#4f7be4;--neg-3:#6d95ef;--neg-e:#1a3485;
--neu-0:#9a9aa0;--neu-1:#acacb2;--neu-2:#bdbdc2;--neu-3:#d0d0d4;--neu-e:#55555b;
--c-f:#1f9d5c;--c-f13:#d98a00;--c-d:#7c4dda;--c-k:#b7791f;--c-fr:var(--anatomy-strong);--anatomy-amber:#d98a00;--anatomy-violet:#7c4dda}
.iso[data-theme="dark"]{--pos-0:#7d1f1f;--pos-1:#962828;--pos-2:#ad3434;--pos-3:#c44646;--pos-e:#ff8f8f;
--neg-0:#1a3176;--neg-1:#213e92;--neg-2:#2a4cab;--neg-3:#3a60c6;--neg-e:#9bb8ff;
--neu-0:#2e2e32;--neu-1:#38383d;--neu-2:#434348;--neu-3:#505056;--neu-e:#a9a9b0;
--c-f:#5fd394;--c-f13:#ffb347;--c-d:#a98bff;--c-k:#e6b45c;--anatomy-amber:#ffb347;--anatomy-violet:#a98bff}
${["pos", "neg", "neu"].map((s) => `.q[data-q="${s}"]{--anatomy-paper:var(--${s}-0);--anatomy-shade-0:var(--${s}-0);--anatomy-shade-1:var(--${s}-1);--anatomy-shade-2:var(--${s}-2);--anatomy-shade-3:var(--${s}-3);--anatomy-hi:var(--${s}-e)}`).join("\n")}
.q-sign{fill:none;stroke:#fff;stroke-width:1.5;stroke-linecap:round;display:none;vector-effect:non-scaling-stroke}
.q[data-q="pos"] .q-plus,.q[data-q="neg"] .q-minus,.q[data-q="neu"] .q-zero{display:inline}
.q[data-q="neu"] .q-sign{stroke:var(--neu-e);stroke-width:1.1}
.farrow{stroke:var(--anatomy-card);stroke-width:.9;paint-order:stroke;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.farrow[data-c="f"],.farrow[data-c="f12"]{fill:var(--c-f)}
.farrow[data-c="f13"]{fill:var(--c-f13)}
.farrow[data-c="fr"]{fill:var(--c-fr)}
.wire{stroke-width:1.4}
.flabel{font:600 12.5px/1 ui-sans-serif,system-ui,sans-serif;paint-order:stroke;stroke:var(--anatomy-card);stroke-width:3px;stroke-linejoin:round}
.flabel[data-c="f"],.flabel[data-c="f12"]{fill:var(--c-f)}.flabel[data-c="f13"]{fill:var(--c-f13)}.flabel[data-c="fr"]{fill:var(--c-fr)}.flabel[data-c="d"]{fill:var(--c-d);font-style:italic}
.spoke{stroke-width:1.2}
.d-band{fill:var(--c-d);opacity:.55}
.e-item{transition:opacity .4s}
.e-item[data-off]{opacity:0}
#fig2 .q,#fig4 .q{cursor:pointer}
.iso-swatch[data-mark="amber"] path{stroke:var(--anatomy-amber)}
.t-pos{color:var(--pos-1)}.t-neg{color:var(--neg-1)}
.iso[data-theme="dark"] .t-pos{color:#ff8f8f}.iso[data-theme="dark"] .t-neg{color:#9bb8ff}
.t-f{color:var(--c-f);font-weight:600}.t-k{color:var(--c-k);font-weight:600}.t-d{color:var(--c-d);font-weight:600}
.t-q1,.t-q2{color:var(--pos-1);font-weight:600}
.iso[data-theme="dark"] .t-q1,.iso[data-theme="dark"] .t-q2{color:#ff8f8f}
.iso [data-neg] .t-q1,.iso [data-neg2] .t-q2{color:var(--neg-1)}
.iso[data-theme="dark"] [data-neg] .t-q1,.iso[data-theme="dark"] [data-neg2] .t-q2{color:#9bb8ff}
h1,h2,h3{color:var(--anatomy-strong);font-weight:600;letter-spacing:-.01em}
h1{font-size:34px;margin:4px 0 6px}
h2{font-size:21px;margin:0 0 4px;display:flex;align-items:center;gap:10px}
h2 .n{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--anatomy-strong);color:var(--anatomy-page);font-size:13px;flex:none}
.kicker{font-family:var(--anatomy-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted);margin:0}
.lead{margin:0 0 8px;font-size:15px}
.sec{margin-top:56px}
.hero .lead{font-size:16px}
.eq{font-family:var(--anatomy-mono);font-size:20px;color:var(--anatomy-strong);letter-spacing:.02em}
.eq.inline{font-size:15px;white-space:nowrap}
.eq.big{font-size:22px;margin:8px 0 10px;overflow-wrap:anywhere}
.formula{margin:18px auto 0;text-align:center}
.formula .tags{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;font-size:12.5px;margin-top:4px}
.formula .sub{font-family:var(--anatomy-mono);font-size:13.5px;margin-top:10px;color:var(--anatomy-text);overflow-wrap:anywhere}
.sliders{display:grid;gap:8px;margin:16px auto 0;max-width:440px}
.sliders label{display:grid;grid-template-columns:28px 34px 1fr 58px;align-items:center;gap:8px;font-family:var(--anatomy-mono);font-size:14px}
.sliders input{width:100%;accent-color:var(--anatomy-strong)}
.sliders output{text-align:right;font-variant-numeric:tabular-nums;color:var(--anatomy-strong)}
.ctl{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px}
.ctl .pair{display:inline-flex;align-items:center;gap:6px;font-size:13px}
button{font:inherit;font-size:13px;color:var(--anatomy-strong);background:var(--anatomy-page);border:1px solid var(--anatomy-mid);border-radius:6px;padding:5px 11px;cursor:pointer;min-height:32px}
button:hover{border-color:var(--anatomy-strong)}
button:disabled{opacity:.4;cursor:default}
button:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:3px}
button.sgn,[data-flip],[data-flip4]{min-width:32px;font-weight:700;padding:4px 0}
button[data-s="pos"]{color:#fff;background:var(--pos-1);border-color:var(--pos-1)}
button[data-s="neg"]{color:#fff;background:var(--neg-1);border-color:var(--neg-1)}
.change{text-align:center;margin-top:10px;font-size:14px;color:var(--anatomy-strong);min-height:22px}
.sum{font-family:var(--anatomy-mono);font-size:13.5px;margin:14px auto 0;max-width:460px;display:grid;gap:4px}
.sum div{display:flex;justify-content:space-between;gap:12px}
.sum .tot{border-top:1px solid var(--anatomy-mid);padding-top:6px;color:var(--anatomy-strong);font-weight:600}
.facts{margin:4px 0 0;padding-left:18px}
.rules{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px}
.rules.two{grid-template-columns:repeat(2,1fr)}
.rules>div{background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-faint);padding:10px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;font-size:14px;text-align:center}
.chip{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;color:#fff;font-weight:700}
.chip.pos{background:var(--pos-1)}.chip.neg{background:var(--neg-1)}
.stepper{padding-bottom:64px}
.steps-nav{list-style:none;margin:0 0 16px;padding:0;display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.steps-nav button{font-size:12.5px;padding:4px 10px;display:inline-flex;gap:6px;align-items:center}
.steps-nav button span,.step h3 span{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--anatomy-faint);font-size:11px}
.steps-nav button[aria-current]{border-color:var(--anatomy-strong);background:var(--anatomy-strong);color:var(--anatomy-page)}
.steps-nav button[aria-current] span{background:var(--anatomy-page);color:var(--anatomy-strong)}
.step{min-height:220px;max-width:480px;margin:0 auto;animation:stepin .35s var(--anatomy-ease)}
@keyframes stepin{from{opacity:0;transform:translateY(6px)}}
.step h3{font-size:18px;margin:0 0 10px;display:flex;gap:8px;align-items:center}
.step ul.data{font-family:var(--anatomy-mono);font-size:15px;line-height:1.9;margin:0;padding-left:18px}
.tip{font-size:13.5px;color:var(--anatomy-muted);margin:10px 0 0}
.calc{font-family:var(--anatomy-mono);font-size:15px;display:grid;gap:8px}
.calc .hl{color:var(--c-f);font-weight:700;font-size:18px}
.calc .hl.big{font-size:22px}
.mini svg{max-width:420px;margin:0 auto}
.cheat{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}
.cheat>div{background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-faint);padding:10px 12px;font-size:14px}
.nw{white-space:nowrap}
.foot{font-size:12px;color:var(--anatomy-muted);margin-top:28px}
@media (max-width:560px){#fig1 svg,#fig2 svg,#fig3 svg,#fig4 svg{width:114%;margin-left:-7%}.iso-plate{overflow:hidden}.rules{grid-template-columns:1fr}.rules.two,.cheat{grid-template-columns:1fr}.eq{font-size:17px}.eq.big{font-size:18px}.sliders label{grid-template-columns:26px 32px 1fr 52px}}
@media (prefers-reduced-motion:reduce){.step{animation:none}.e-item{transition:none}}
`;

const LIVE = `
const arrowD = ${arrowD.toString().replace(/k\.iso/g, "iso")};
const still = matchMedia("(prefers-reduced-motion: reduce)");
const KC = 9e9;
const sup = (n) => String(n).replace(/-/g, "⁻").replace(/[0-9]/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
const sci = (v, digits = 2) => { if (v === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(v))); const m = v / 10 ** e; return m.toFixed(digits) .replace(/\\.?0+$/, "") + " × 10" + sup(e); };
const fmtN = (v) => sci(v, 2) + " N";
function onScreen(el, run) { let vis = false; new IntersectionObserver((es) => { vis = es[es.length - 1].isIntersecting; if (vis) run(); }, { rootMargin: "120px 0px" }).observe(el); return () => vis; }
function loop(el, step) {
  let frame = 0, last = 0;
  const visible = onScreen(el, () => kick());
  function tick(now) { const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now; const more = step(dt, still.matches); frame = visible() && more ? requestAnimationFrame(tick) : 0; }
  function kick() { if (!frame && visible()) { last = 0; frame = requestAnimationFrame(tick); } }
  return kick;
}
function springTo(s, target, dt, calm, stiff = 70, drag = 11) {
  if (calm) { s.x = target; s.v = 0; return true; }
  for (let i = 0; i < 4; i++) { s.v += ((target - s.x) * stiff - s.v * drag) * dt / 4; s.x += s.v * dt / 4; }
  if (Math.abs(target - s.x) < 0.01 && Math.abs(s.v) < 0.01) { s.x = target; s.v = 0; return true; }
  return false;
}
const scaleAbout = (pt, s) => " translate(" + pt[0].toFixed(2) + " " + pt[1].toFixed(2) + ") scale(" + s.toFixed(4) + ") translate(" + (-pt[0]).toFixed(2) + " " + (-pt[1]).toFixed(2) + ")";
const place = (el, p, dy = 0, anchor = "middle", dx = 0) => { const [x, y] = iso(p, el.ownerSVGElement.__P); el.setAttribute("x", (x + dx).toFixed(1)); el.setAttribute("y", (y + dy).toFixed(1)); el.setAttribute("text-anchor", anchor); };
const setSignBtn = (btn, s) => { btn.dataset.s = s; btn.textContent = s === "pos" ? "+" : "−"; btn.setAttribute("aria-label", s === "pos" ? "positiva" : "negativa"); };

// ---------- Fig 1 ----------
(() => {
  const D = ${JSON.stringify(A1.data)};
  const P = D.P;
  const root = document.getElementById("fig1");
  const plate = root.closest(".iso-plate");
  const readout = plate.querySelector("[data-readout]");
  const back = root.querySelector('[data-dyn="back"]');
  const front = root.querySelector('[data-dyn="front"]');
  const nucG = root.querySelector("#a-nuc");
  const balls = [...nucG.children];
  const items = [...root.querySelectorAll(".e-item")];
  const spokes = [...root.querySelectorAll(".spoke")];
  const slots = [[D.R_IN, 0], [D.R_IN, Math.PI], [D.R_OUT, Math.PI / 2], [D.R_OUT, -Math.PI / 2]];
  let count = 3, theta = 0, spin = 0.16;
  const centreDepth = depthOf([0, 0, D.ZN], P);
  const minus = plate.querySelector("[data-e-minus]"), plus = plate.querySelector("[data-e-plus]");
  function say() {
    const net = 3 - count;
    const tag = net === 0 ? "neutro" : net > 0 ? "ion +" + (net > 1 ? net : "") : "ion −" + (-net > 1 ? -net : "");
    readout.textContent = "3 p⁺ · 4 n⁰ · " + count + " e⁻ → " + (net > 0 ? "+" + net : net) + " · " + tag;
    minus.disabled = count === 0; plus.disabled = count === 4;
    items.forEach((it, i) => it.toggleAttribute("data-off", i >= count));
  }
  function draw() {
    const c = Math.cos(theta), s = Math.sin(theta);
    // nucleus balls re-sorted by depth
    const placed = D.nuc.map(([x, y, z], i) => { const nx = x * c - y * s, ny = x * s + y * c; return { el: balls[i], dx: nx - x, dy: ny - y, depth: depthOf([nx, ny, D.ZN + z], P) }; });
    placed.forEach((p) => p.el.setAttribute("transform", translateAlong(P, [p.dx, p.dy, 0])));
    const order = [...placed].sort((a, b) => a.depth - b.depth).map((p) => p.el);
    if (order.some((el, i) => nucG.children[i] !== el)) order.forEach((el) => nucG.appendChild(el));
    const lists = { back: [], front: [] };
    spokes.forEach((sp, i) => {
      const t = theta + Math.PI / 4 + i * Math.PI, ux = Math.cos(t), uy = Math.sin(t);
      const behind = depthOf([ux, uy, D.ZN], P) < centreDepth;
      const facing = Math.cos(t - D.a);
      const r0 = behind ? 3 : 9 + 6 * facing;
      sp.setAttribute("d", lineOnTop([ux * r0, uy * r0], [ux * D.R_OUT, uy * D.R_OUT], D.ZN, P));
      (behind ? lists.back : lists.front).push({ el: sp, depth: -1e9 });
    });
    items.forEach((it, i) => {
      const [r, a0] = slots[i];
      const t = theta + a0, ux = Math.cos(t), uy = Math.sin(t);
      it.firstElementChild.setAttribute("transform", translateAlong(P, [ux * r, uy * r, 0]));
      const len = 16 * (D.R_IN / r) ** 2;
      it.lastElementChild.setAttribute("d", arrowD([ux * (r - D.ER - 0.6), uy * (r - D.ER - 0.6), D.ZN], [ux * (r - D.ER - 0.6 - len), uy * (r - D.ER - 0.6 - len), D.ZN], P, 1.7, 5.5));
      const depth = depthOf([ux * r, uy * r, D.ZN], P);
      (depth < centreDepth ? lists.back : lists.front).push({ el: it, depth });
    });
    for (const [layer, list] of [[back, lists.back], [front, lists.front]]) {
      list.sort((a, b) => a.depth - b.depth);
      if (list.some((x, i) => layer.children[i] !== x.el) || layer.children.length !== list.length) list.forEach((x) => layer.appendChild(x.el));
    }
  }
  const kick = loop(root, (dt, calm) => { if (!calm) theta += spin * dt; draw(); return !calm; });
  minus.addEventListener("click", () => { count = Math.max(0, count - 1); say(); });
  plus.addEventListener("click", () => { count = Math.min(4, count + 1); say(); });
  say(); draw(); kick();
})();

// ---------- Fig 2 ----------
(() => {
  const D = ${JSON.stringify(A2.data)};
  const P = D.P;
  const root = document.getElementById("fig2");
  const plate = root.closest(".iso-plate");
  const readout = plate.querySelector("[data-readout]");
  const signs = [["pos", "pos"], ["neg", "neg"], ["pos", "neg"]];
  const pos = D.TRACKS.map(() => ({ x: 40, v: 0 }));
  const FAR = 68, NEAR = 27;
  const cars = D.TRACKS.map((_, t) => [0, 1].map((s) => root.querySelector('[data-car="' + t + "-" + s + '"]')));
  const ballEls = D.TRACKS.map((_, t) => [0, 1].map((s) => root.querySelector('[data-ball="' + t + "-" + s + '"]')));
  const arrows = D.TRACKS.map((_, t) => [0, 1].map((s) => root.querySelector('[data-arrow="' + t + "-" + s + '"]')));
  const btns = D.TRACKS.map((_, t) => [0, 1].map((s) => plate.querySelector('[data-flip="' + t + "-" + s + '"]')));
  const target = (t) => (signs[t][0] === signs[t][1] ? FAR : NEAR);
  function say() {
    const word = (t) => (signs[t][0] === "pos" ? "+" : "−") + "/" + (signs[t][1] === "pos" ? "+" : "−") + " " + (signs[t][0] === signs[t][1] ? "repelen" : "atraen");
    readout.textContent = D.TRACKS.map((_, t) => word(t)).join(" · ");
    D.TRACKS.forEach((_, t) => [0, 1].forEach((s) => { ballEls[t][s].dataset.q = signs[t][s]; setSignBtn(btns[t][s], signs[t][s]); }));
  }
  function draw() {
    D.TRACKS.forEach((y, t) => {
      const c = pos[t].x;
      cars[t][0].setAttribute("transform", translateAlong(P, [40 - c, 0, 0]));
      cars[t][1].setAttribute("transform", translateAlong(P, [c - 40, 0, 0]));
      const rep = signs[t][0] === signs[t][1];
      const L = 20, z = D.ZC, r = D.R + 0.8;
      // left ball at -c, right ball at +c
      arrows[t][0].setAttribute("d", rep ? arrowD([-c - r, y, z], [-c - r - L, y, z], P) : arrowD([-c + r, y, z], [-c + r + Math.min(L * 0.7, c - r - 2), y, z], P));
      arrows[t][1].setAttribute("d", rep ? arrowD([c + r, y, z], [c + r + L, y, z], P) : arrowD([c - r, y, z], [c - r - Math.min(L * 0.7, c - r - 2), y, z], P));
    });
  }
  const flip = (t, s) => { signs[t][s] = signs[t][s] === "pos" ? "neg" : "pos"; say(); kick(); };
  const kick = loop(root, (dt, calm) => {
    let moving = false;
    pos.forEach((p, t) => { if (!springTo(p, target(t), dt, calm)) moving = true; });
    draw();
    return moving;
  });
  D.TRACKS.forEach((_, t) => [0, 1].forEach((s) => {
    ballEls[t][s].addEventListener("click", () => flip(t, s));
    btns[t][s].addEventListener("click", () => flip(t, s));
  }));
  pos.forEach((p, t) => { p.x = target(t); });
  say(); draw(); kick();
})();

// ---------- Fig 3 ----------
(() => {
  const D = ${JSON.stringify(A3.data)};
  const P = D.P;
  const root = document.getElementById("fig3");
  root.querySelector("svg").__P = P;
  const plate = root.closest(".iso-plate");
  const readout = plate.querySelector("[data-readout]");
  const sub = plate.querySelector("[data-sub]");
  const change = plate.querySelector("[data-change]");
  const formula = plate.querySelector(".formula");
  const inputs = { q1: plate.querySelector('[data-q="1"]'), q2: plate.querySelector('[data-q="2"]'), d: plate.querySelector('[data-q="d"]') };
  const outs = { q1: plate.querySelector('[data-out="1"]'), q2: plate.querySelector('[data-out="2"]'), d: plate.querySelector('[data-out="d"]') };
  const signBtn = [plate.querySelector('[data-sign="1"]'), plate.querySelector('[data-sign="2"]')];
  const car2 = root.querySelector("[data-car2]");
  const b1 = root.querySelector('[data-ball="1"]'), b2 = root.querySelector('[data-ball="2"]');
  const a1 = root.querySelector('[data-arrow="1"]'), a2 = root.querySelector('[data-arrow="2"]');
  const band = root.querySelector("[data-d-band]");
  const lab = [root.querySelector('[data-label="1"]'), root.querySelector('[data-label="2"]'), root.querySelector('[data-label="d"]')];
  const st = { q1: 4, q2: 2, d: 2, s1: "pos", s2: "pos" };
  const anim = { d: { x: 2, v: 0 }, r1: { x: 0, v: 0 }, r2: { x: 0, v: 0 }, l: { x: 0, v: 0 } };
  const radius = (q) => 4 + q;
  const force = () => KC * st.q1 * 1e-6 * st.q2 * 1e-6 / (st.d * st.d);
  const F0 = KC * 1e-12 / 16;
  const lenOf = (F) => 6 + 5.4 * Math.log2(F / F0);
  anim.r1.x = radius(st.q1); anim.r2.x = radius(st.q2); anim.l.x = lenOf(force());
  const qs = (q) => q + "×10⁻⁶";
  function say(prev, what) {
    const F = force();
    const rep = st.s1 === st.s2;
    outs.q1.textContent = (st.s1 === "pos" ? "+" : "−") + st.q1 + " µC";
    outs.q2.textContent = (st.s2 === "pos" ? "+" : "−") + st.q2 + " µC";
    outs.d.textContent = st.d + " m";
    setSignBtn(signBtn[0], st.s1); setSignBtn(signBtn[1], st.s2);
    b1.firstElementChild.dataset.q = st.s1; b2.firstElementChild.dataset.q = st.s2;
    formula.toggleAttribute("data-neg", st.s1 === "neg"); formula.toggleAttribute("data-neg2", st.s2 === "neg");
    sub.innerHTML = '<span class="t-f">F</span> = <span class="t-k">9×10⁹</span> · <span class="t-q1">' + qs(st.q1) + '</span> · <span class="t-q2">' + qs(st.q2) + '</span> / <span class="t-d">' + st.d + '²</span> = <b class="t-f">' + fmtN(F) + "</b>";
    readout.textContent = "F = " + fmtN(F) + " · " + (rep ? "repulsión" : "atracción");
    if (prev !== undefined) {
      const ratio = F / prev;
      const txt = ratio >= 1 ? "×" + +ratio.toFixed(3) : "÷" + +(1 / ratio).toFixed(3);
      change.innerHTML = what + ' → <b class="t-f">F ' + txt + "</b> (" + fmtN(prev) + " → " + fmtN(F) + ")";
    }
    plate.querySelector('[data-x="q1"]').disabled = st.q1 * 2 > 8;
    plate.querySelector('[data-x="q2"]').disabled = st.q2 * 2 > 8;
    plate.querySelector('[data-x="d2"]').disabled = st.d * 2 > 4;
    plate.querySelector('[data-x="dh"]').disabled = st.d / 2 < 1;
  }
  function draw() {
    const d = anim.d.x;
    const x1 = D.X0, x2 = D.X0 + D.M * d;
    car2.setAttribute("transform", translateAlong(P, [x2 - D.REST, 0, 0]));
    const r1 = anim.r1.x, r2 = anim.r2.x;
    b1.setAttribute("transform", scaleAbout(iso([x1, 0, D.ZB], P), r1 / D.R0));
    b2.lastElementChild || 0;
    b2.setAttribute("transform", scaleAbout(iso([D.REST, 0, D.ZB], P), r2 / D.R0));
    band.setAttribute("d", onTop([[x1, D.Y_RULER + 0.4], [x2, D.Y_RULER + 0.4], [x2, D.Y_RULER + 2.2], [x1, D.Y_RULER + 2.2]], 0.9, P, true));
    const L = Math.max(4, anim.l.x);
    const rep = st.s1 === st.s2;
    const z1 = D.ZB + r1, z2 = D.ZB + r2;
    if (rep) {
      a1.setAttribute("d", arrowD([x1 - r1 - 0.6, 0, z1], [x1 - r1 - 0.6 - L, 0, z1], P, 2, 7));
      a2.setAttribute("d", arrowD([x2 + r2 + 0.6, 0, z2], [x2 + r2 + 0.6 + L, 0, z2], P, 2, 7));
    } else {
      const room = Math.max(4, (x2 - x1 - r1 - r2) / 2 - 1.5);
      const Li = Math.min(L, room);
      a1.setAttribute("d", arrowD([x1 + r1 * 0.2, 0, z1 + r1 + 3], [x1 + r1 * 0.2 + Li, 0, z1 + r1 + 3], P, 2, 7));
      a2.setAttribute("d", arrowD([x2 - r2 * 0.2, 0, z2 + r2 + 3], [x2 - r2 * 0.2 - Li, 0, z2 + r2 + 3], P, 2, 7));
    }
    if (rep) { place(lab[0], [x1 - r1 - L / 2, 0, z1], -8); place(lab[1], [x2 + r2 + L / 2, 0, z2], -8); }
    else { place(lab[0], [x1 + r1 * 0.2 + Math.min(L, Math.max(4, (x2 - x1 - r1 - r2) / 2 - 1.5)) / 2, 0, z1 + r1 + 3], -8); place(lab[1], [x2 - r2 * 0.2 - Math.min(L, Math.max(4, (x2 - x1 - r1 - r2) / 2 - 1.5)) / 2, 0, z2 + r2 + 3], -8); }
    place(lab[2], [(x1 + x2) / 2, D.Y_RULER + 1.3, 0.9], -6);
  }
  const kick = loop(root, (dt, calm) => {
    const a = springTo(anim.d, st.d, dt, calm, 60, 13);
    const b = springTo(anim.r1, radius(st.q1), dt, calm, 90, 12);
    const c = springTo(anim.r2, radius(st.q2), dt, calm, 90, 12);
    const e = springTo(anim.l, lenOf(force()), dt, calm, 90, 14);
    draw();
    return !(a && b && c && e);
  });
  const set = (patch, what) => { const prev = force(); Object.assign(st, patch); inputs.q1.value = st.q1; inputs.q2.value = st.q2; inputs.d.value = st.d; say(prev, what); kick(); };
  inputs.q1.addEventListener("input", () => set({ q1: +inputs.q1.value }, "Cambiaste Q₁"));
  inputs.q2.addEventListener("input", () => set({ q2: +inputs.q2.value }, "Cambiaste Q₂"));
  inputs.d.addEventListener("input", () => set({ d: +inputs.d.value }, "Cambiaste d"));
  signBtn[0].addEventListener("click", () => set({ s1: st.s1 === "pos" ? "neg" : "pos" }, "Cambiaste el signo de Q₁: solo cambia la dirección"));
  signBtn[1].addEventListener("click", () => set({ s2: st.s2 === "pos" ? "neg" : "pos" }, "Cambiaste el signo de Q₂: solo cambia la dirección"));
  plate.querySelector('[data-x="q1"]').addEventListener("click", () => set({ q1: st.q1 * 2 }, "Duplicaste Q₁"));
  plate.querySelector('[data-x="q2"]').addEventListener("click", () => set({ q2: st.q2 * 2 }, "Duplicaste Q₂"));
  plate.querySelector('[data-x="d2"]').addEventListener("click", () => set({ d: st.d * 2 }, "Duplicaste d"));
  plate.querySelector('[data-x="dh"]').addEventListener("click", () => set({ d: st.d / 2 }, "Partiste d a la mitad"));
  plate.querySelector('[data-x="reset"]').addEventListener("click", () => { Object.assign(st, { q1: 4, q2: 2, d: 2, s1: "pos", s2: "pos" }); inputs.q1.value = 4; inputs.q2.value = 2; inputs.d.value = 2; say(); change.textContent = "Prueba: duplica una carga o la distancia."; kick(); });
  say(); draw(); kick();
})();

// ---------- Fig 4 ----------
(() => {
  const D = ${JSON.stringify(A4.data)};
  const P = D.P;
  const root = document.getElementById("fig4");
  root.querySelector("svg").__P = P;
  const plate = root.closest(".iso-plate");
  const readout = plate.querySelector("[data-readout]");
  const sumEl = plate.querySelector("[data-sum]");
  const Q = [4e-6, 2e-6, 1e-6];
  const X = [0, 2, 4];
  const signs = ["pos", "pos", "pos"];
  const balls = [0, 1, 2].map((i) => root.querySelector('[data-ball="' + i + '"]'));
  const btns = [0, 1, 2].map((i) => plate.querySelector('[data-flip4="' + i + '"]'));
  const ar = { r: root.querySelector('[data-arrow="r"]'), f12: root.querySelector('[data-arrow="12"]'), f13: root.querySelector('[data-arrow="13"]') };
  const drop = root.querySelector("[data-drop]");
  const lab = { f12: root.querySelector('[data-label="12"]'), f13: root.querySelector('[data-label="13"]'), r: root.querySelector('[data-label="r"]') };
  const SCALE = 2600; // world units per newton
  const anim = { a: { x: 0, v: 0 }, b: { x: 0, v: 0 } };
  // signed force on Q1 along +x from charge j
  const fOn1 = (j) => { const d = X[j] - X[0]; const mag = KC * Q[0] * Q[j] / (d * d); const rep = signs[0] === signs[j]; return rep ? -mag : mag; };
  const arrowTxt = (v) => (v < 0 ? "←" : "→");
  const fmt = (v) => sci(Math.abs(v), 3) + " N " + arrowTxt(v);
  function say() {
    const f12 = fOn1(1), f13 = fOn1(2), F = f12 + f13;
    balls.forEach((b, i) => { b.dataset.q = signs[i]; setSignBtn(btns[i], signs[i]); });
    const how = Math.sign(f12) === Math.sign(f13) ? "se suman" : "se restan";
    sumEl.innerHTML = '<div><span class="t-f">F₁₂ = 9×10⁹·4×10⁻⁶·2×10⁻⁶ / 2²</span><span>' + fmt(f12) + '</span></div><div><span style="color:var(--c-f13);font-weight:600">F₁₃ = 9×10⁹·4×10⁻⁶·1×10⁻⁶ / 4²</span><span>' + fmt(f13) + '</span></div><div class="tot"><span>F total (' + how + ')</span><span>' + fmt(F) + "</span></div>";
    readout.textContent = "F = " + fmt(F);
  }
  function draw() {
    const x1 = D.X1, zc = D.ZC, r = D.R[0];
    const a = anim.a.x * SCALE, b = anim.b.x * SCALE;
    const zs = zc + 30;
    ar.f12.setAttribute("d", arrowD([x1, 0, zs], [x1 + a, 0, zs], P, 2, 6.5));
    const z13 = Math.sign(a) === Math.sign(b) ? zs : zs + 6;
    ar.f13.setAttribute("d", arrowD([x1 + a, 0, z13], [x1 + a + b, 0, z13], P, 2, 5));
    const t = a + b;
    const dir = Math.sign(t) || 1;
    ar.r.setAttribute("d", Math.abs(t) > r + 1 ? arrowD([x1 + dir * (r + 0.6), 0, zc], [x1 + t, 0, zc], P, 2.6, 8) : "");
    drop.setAttribute("d", segment([x1 + t, 0, z13], [x1 + t, 0, zc], P));
    place(lab.f12, [x1 + a / 2, 0, zs], -7);
    place(lab.f13, [x1 + a + b, 0, z13], -7, Math.sign(b) < 0 ? "end" : "start", Math.sign(b) < 0 ? -6 : 6);
    place(lab.r, [x1 + t / 2 + dir * r / 2, 0, zc], 14);
  }
  const kick = loop(root, (dt, calm) => {
    const s1 = springTo(anim.a, fOn1(1), dt, calm, 60, 12);
    const s2 = springTo(anim.b, fOn1(2), dt, calm, 60, 12);
    draw();
    return !(s1 && s2);
  });
  const flip = (i) => { signs[i] = signs[i] === "pos" ? "neg" : "pos"; say(); kick(); };
  balls.forEach((b, i) => b.addEventListener("click", () => flip(i)));
  btns.forEach((b, i) => b.addEventListener("click", () => flip(i)));
  anim.a.x = fOn1(1); anim.b.x = fOn1(2);
  say(); draw(); kick();
})();

// ---------- Fig 5 ----------
(() => {
  const plate = document.querySelector(".stepper");
  const steps = [...plate.querySelectorAll(".step")];
  const nav = [...plate.querySelectorAll("[data-goto]")];
  const read = plate.querySelector("[data-step-readout]");
  const prev = plate.querySelector("[data-prev]"), next = plate.querySelector("[data-next]");
  let at = 0;
  const go = (i) => { at = Math.max(0, Math.min(steps.length - 1, i)); steps.forEach((s, j) => (s.hidden = j !== at)); nav.forEach((b, j) => b.toggleAttribute("aria-current", j === at)); nav[at].setAttribute("aria-current", "step"); read.textContent = "paso " + (at + 1) + " de " + steps.length; prev.disabled = at === 0; next.disabled = at === steps.length - 1; };
  nav.forEach((b, i) => b.addEventListener("click", () => go(i)));
  prev.addEventListener("click", () => go(at - 1));
  next.addEventListener("click", () => go(at + 1));
  go(0);
})();
`;

const themeBoot = `<script>(function(){try{var t=new URLSearchParams(location.search).get("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.body.dataset.theme=t;}catch(e){}})();</script>`;

const pageCss = `*{box-sizing:border-box}
html{color-scheme:light dark}
body{margin:0;background:var(--anatomy-page);color:var(--anatomy-text);font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.iso-page{width:min(720px,100% - 32px);margin:48px auto 96px}`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ley de Coulomb</title><style>${k.ISO_CSS}${pageCss}${EXTRA_CSS}</style></head><body class="iso" data-theme="light">${themeBoot}<main class="iso-page">${body}</main><script type="module">${(kitScript() + LIVE).replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;

writeFileSync(join(HERE, "index.html"), html);

// Artifact version: content only, theme follows the viewer (root data-theme or prefers-color-scheme).
const rootCss = `:root{--page-bg:#f2f2ef}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--page-bg:#0b0b0b;color-scheme:dark}}
:root[data-theme="dark"]{--page-bg:#0b0b0b;color-scheme:dark}
body{background:var(--page-bg);margin:0}
.wrap{padding-inline:16px}
#page{background:var(--anatomy-page);color:var(--anatomy-text);font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;min-height:100%}
#page .iso-page{width:min(720px,100%);margin:0 auto;padding-block:40px 80px}`;
const themeSync = `(function(){var el=document.getElementById("page");var mq=matchMedia("(prefers-color-scheme: dark)");function sync(){var t=document.documentElement.getAttribute("data-theme");el.setAttribute("data-theme",t==="dark"||t==="light"?t:(mq.matches?"dark":"light"));}sync();try{mq.addEventListener("change",sync);}catch(e){}new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});})();`;
const art = `<title>Ley de Coulomb</title><style>${rootCss}${k.ISO_CSS}*{box-sizing:border-box}${EXTRA_CSS}</style><div class="iso" id="page" data-theme="light"><div class="wrap"><main class="iso-page">${body}</main></div></div><script>${themeSync}</script><script type="module">${(kitScript() + LIVE).replace(/<\/(script)/gi, "<\\/$1")}</script>`;
writeFileSync(join(HERE, "ley-de-coulomb.html"), art);
console.log("wrote coulomb/index.html", (html.length / 1024).toFixed(0) + " KB");
