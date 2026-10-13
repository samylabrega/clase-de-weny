// Página "Ley de Gravitación Universal": node gravitacion/build.mjs → gravitacion/index.html
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---- Modelo (la verdad que mueve todo) ----
const G = 6.67e-11;
const BASE = { m1: 10, m2: 10, d: 2 };
const RANGE = { m: [1, 20], d: [1, 6] };

// ---- Mundo: 1 m = 20 unidades; la esfera crece con la raíz cúbica de la masa ----
const WIDTH = 720;
const HEIGHT = 340;
const PER_M = 20;
const R_OF = 3.6; // radio = 3.6·∛m  (20 kg → 9.8, cabe a 1 m)
const PLATE = { x: -122, y: -34, w: 244, d: 86, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const RAIL_X = [-106, 106];
const RAILS = [-12, 12];
const CAR_Z = 3;
const CAR_TOP = 9;
const DIAL_Z = 22;
const DIAL_H = 5;
const DIAL_TOP = DIAL_Z + DIAL_H;
const DIAL_R = 10;
const PILLAR_X = 26;
const PED_TOP = 16;
const RULER = { x: -68, y: 37, w: 136, d: 8, r: 1 }; // el puntero de cada carro lee d directamente

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [-96, 0, 38], [96, 0, 38], [-60, -20, 36]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 62 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 16))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4.5), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));

  // nivel de burbuja (atrás a la izquierda)
  const vial = { x: -100, y: -29, w: 30, d: 8, r: 2 };
  out.push(S(k.slabOf(vial, 0, 3, P, 4, 0.4), { tone: "mid" }));
  const slot = k.insetPlan(vial, 2);
  out.push(S(k.slabOf(slot, 3, 0.2, P, 4), { tone: "lo", flat: true }));
  out.push(L(k.lineOnTop([vial.x + 12, slot.y], [vial.x + 12, slot.y + slot.d], 3.2, P) + k.lineOnTop([vial.x + 18, slot.y], [vial.x + 18, slot.y + slot.d], 3.2, P), { tone: "mid" }));
  out.push(L(k.ring(vial.x + 15, vial.y + 4, 1.8, 3.2, P, 16), { tone: "hi" }));
  out.push(D([at([vial.x + 1.2, vial.y + 4, 3]), at([vial.x + vial.w - 1.2, vial.y + 4, 3])], { size: 0.4 }));

  // placa grabada con G (atrás a la derecha)
  const tag = { x: 58, y: -29, w: 46, d: 10, r: 1.2 };
  out.push(S(k.slabOf(tag, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(k.faceTextSvg(k.topMatrix([tag.x + 4, tag.y + 6.6], 0.8, P, "x"), "G 6.67e-11", { size: 3.6, tone: "mid" }));
  out.push(D([at([tag.x + 1.6, tag.y + 1.6, 0.8]), at([tag.x + tag.w - 1.6, tag.y + tag.d - 1.6, 0.8])], { size: 0.4 }));

  // rieles y topes
  for (const y of RAILS) {
    out.push(S(k.slabOf({ x: RAIL_X[0], y: y - 2, w: RAIL_X[1] - RAIL_X[0], d: 4, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    out.push(D([RAIL_X[0] + 5, -40, 40, RAIL_X[1] - 5].map((x) => at([x, y, 3])), { size: 0.4 }));
  }
  for (const x of [RAIL_X[0] - 6, RAIL_X[1]]) {
    out.push(S(k.slabOf({ x, y: -18, w: 6, d: 36, r: 1.2 }, 0, 8, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x + 3, -13, 8]), at([x + 3, 13, 8])], { size: 0.45 }));
  }

  // regla en metros (0 al centro, mayor cada 1 m)
  out.push(S(k.slabOf(RULER, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-62, 62, 2, 5, RULER.y + 0.6, 0.6, [1.8, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.lineOnTop([0, RULER.y + 0.6], [0, RULER.y + 5.4], 0.6, P), { tone: "hi" }));
  for (const d of [1, 2, 3, 4, 5, 6]) {
    for (const s of [-1, 1]) out.push(k.faceTextSvg(k.topMatrix([(s * d * PER_M) / 2, RULER.y + 7.2], 0.6, P, "x"), String(d), { size: 2.4, tone: d % 2 ? "lo" : "mid", anchor: "middle" }));
  }
  out.push(D([at([RULER.x + 2, RULER.y + 4, 0.6]), at([RULER.x + RULER.w - 2, RULER.y + 4, 0.6])], { size: 0.45 }));
  return out.join("");
}

// Un carro: side = -1 (m₁, a la izquierda) o +1 (m₂). Coordenadas locales: esfera en x = 0.
function carriage(side, name) {
  const plan = { x: side < 0 ? -36 : -8, y: -18, w: 44, d: 36, r: 3 };
  const px = side * PILLAR_X;
  const base = [];
  base.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 3), CAR_Z, 0.1, P)}" style="filter:blur(4px)"/>`);
  // bujes sobre los rieles
  for (const y of RAILS) {
    for (const x of [plan.x + 3, plan.x + plan.w - 11]) {
      base.push(S(k.slabOf({ x, y: y - 3.5, w: 8, d: 7, r: 1 }, 2.4, CAR_Z - 2.4 + 0.2, P, 2), { tone: "lo", crease: "none" }));
    }
  }
  base.push(S(k.slabOf(plan, CAR_Z, CAR_TOP - CAR_Z, P, 5, 0.6), { tone: "mid" }));
  base.push(L(k.lineOnTop([plan.x, -12], [plan.x + plan.w, -12], CAR_TOP, P) + k.lineOnTop([plan.x, 12], [plan.x + plan.w, 12], CAR_TOP, P), { tone: "faint" }));
  base.push(D(k.corners(plan, 3).map(([x, y]) => at([x, y, CAR_TOP])), { size: 0.45 }));
  // puntero hacia la regla
  base.push(S(k.slabOf({ x: -1.4, y: 16, w: 2.8, d: 20.5, r: 0.8 }, CAR_TOP - 1.2, 1, P, 2), { tone: "mid" }));
  base.push(D([at([0, 35.6, CAR_TOP - 0.2])], { size: 0.6, tone: "hi" }));
  // perilla de bloqueo al frente
  const knob = [side * 24, 21.6];
  base.push(S(k.slabOf({ x: knob[0] - 1.4, y: 18, w: 2.8, d: 2.4, r: 0.6 }, 5, 2.6, P, 2), { tone: "mid", crease: "none" }));
  base.push(S(k.cylinder(knob[0], knob[1], 2.6, 3.4, 5.6, P, 20), { tone: "mid" }));
  base.push(L(k.knurl(knob[0], knob[1], 2.6, 3.4, 9, 18, P), { tone: "lo" }));
  // rótulo grabado
  base.push(k.faceTextSvg(k.topMatrix([side * 13, 10.5], CAR_TOP, P, "x"), name, { size: 4.2, tone: "mid", anchor: "middle" }));

  // columna + dinamómetro de reloj
  const gauge = [];
  gauge.push(S(k.slabOf({ x: px - 5, y: -5, w: 10, d: 10, r: 1.5 }, CAR_TOP, 11, P, 3, 0.5), { tone: "mid" }));
  gauge.push(D([at([px - 3, 3, CAR_TOP + 11]), at([px + 3, -3, CAR_TOP + 11])], { size: 0.4 }));
  gauge.push(S(k.cylinder(px, 0, 3, CAR_TOP + 11, DIAL_Z - CAR_TOP - 11, P, 20), { tone: "mid", crease: "none" }));
  gauge.push(S(k.slabOf({ x: px - 1.3, y: -DIAL_R - 3, w: 2.6, d: 3.4, r: 0.6 }, DIAL_Z + 1.2, 2.6, P, 2), { tone: "mid" }));
  gauge.push(S(k.cylinder(px, -DIAL_R - 3.4, 1.8, DIAL_Z + 0.6, 3.8, P, 16), { tone: "mid" }));
  gauge.push(S(k.cylinder(px, 0, DIAL_R, DIAL_Z, DIAL_H, P, 56, 0.6), { tone: "hi", crease: "lo" }));
  gauge.push(L(k.knurl(px, 0, DIAL_R, DIAL_TOP - 2.4, DIAL_TOP, 64, P, 0.3), { tone: "lo" }));
  gauge.push(L(k.ring(px, 0, DIAL_R - 1.4, DIAL_TOP, P, 56), { tone: "lo" }));
  const ticks = k.radialTicks(px, 0, DIAL_R - 2, 28, 2, DIAL_TOP, [0.9, 1.9], P, (-140 * Math.PI) / 180, (280 * Math.PI) / 180);
  gauge.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  const zero = (60 * Math.PI) / 180;
  gauge.push(L(k.lineOnTop([px + Math.sin(zero) * (DIAL_R - 4.4), -Math.cos(zero) * (DIAL_R - 4.4)], [px + Math.sin(zero) * (DIAL_R - 2), -Math.cos(zero) * (DIAL_R - 2)], DIAL_TOP, P), { tone: "hi" }));
  gauge.push(`<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="" style="stroke-width:1.1"/>`);
  gauge.push(D([at([px, 0, DIAL_TOP + 0.2])], { size: 0.9, tone: "hi" }));

  // resorte entre columna y trineo
  const spring = k.coil(px - side * 5, side * 7.5, [0, 14], 2.4, 6.5, "x", P, 18);
  const coil = [L(spring.back, { tone: "lo" }), L(spring.front, { tone: "mid" })];

  // trineo, pedestal y esfera
  const seat = [];
  seat.push(S(k.slabOf({ x: -7, y: -7, w: 14, d: 14, r: 1.5 }, CAR_TOP, 2, P, 3, 0.4), { tone: "mid" }));
  seat.push(S(k.slabOf({ x: side < 0 ? -9 : 7, y: -2, w: 2, d: 4, r: 0.4 }, CAR_TOP + 2, 5, P, 2), { tone: "mid", crease: "none" }));
  seat.push(S(k.cylinder(0, 0, 4, CAR_TOP + 2, PED_TOP - CAR_TOP - 3, P, 24), { tone: "mid" }));
  seat.push(S(k.cylinder(0, 0, 4.8, PED_TOP - 1, 1, P, 28), { tone: "mid" }));
  seat.push(`<g data-part="sphere"><ellipse class="g-shadow" cx="0" cy="0" rx="0" ry="0"/><circle class="g-ball" fill="url(#ball-${name === "m₁" ? 1 : 2})" cx="0" cy="0" r="0"/><circle class="g-glint" cx="0" cy="0" r="0"/></g>`);

  const order = side < 0 ? [base, gauge, coil, seat] : [base, seat, coil, gauge];
  return order.flat().join("");
}

const defs = `<defs>
<radialGradient id="ball-1" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="var(--m1-lite)"/><stop offset=".55" stop-color="var(--m1)"/><stop offset="1" stop-color="var(--m1-deep)"/></radialGradient>
<radialGradient id="ball-2" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="var(--m2-lite)"/><stop offset=".55" stop-color="var(--m2)"/><stop offset="1" stop-color="var(--m2-deep)"/></radialGradient>
</defs>`;

const half = (BASE.d * PER_M) / 2;
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Banco de gravitación: dos esferas, m₁ azul y m₂ naranja, sobre carros que corren en un riel con regla en metros. Cada carro tiene un resorte y un reloj que mide la fuerza de atracción; los dos relojes marcan siempre lo mismo.",
  body: [
    defs,
    bench(),
    `<g data-part="car-1" transform="${k.translateAlong(P, [-half, 0, 0])}">${carriage(-1, "m₁")}</g>`,
    `<g data-part="car-2" transform="${k.translateAlong(P, [half, 0, 0])}">${carriage(1, "m₂")}</g>`,
  ],
});

const figure = k.plateHtml({
  fig: "Fig 1",
  title: "Banco de gravitación",
  hint: "Mueve los deslizadores",
  readout: "F = 1.67×10⁻⁹ N · ×1",
  keys: [
    { mark: "lit", label: "Aguja: F (escala ×2 por marca)" },
    { mark: "raised", label: "Regla: posición en m" },
  ],
  caption:
    "Cada esfera tira de la otra. Los dos relojes marcan lo mismo: la fuerza sobre m₁ es igual a la fuerza sobre m₂ (3ª ley de Newton). Cada marca grande del reloj es el doble de la anterior; la marca resaltada es ×1 = 10 kg, 10 kg a 2 m.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Banco de gravitación interactivo">${svg}</div>`,
});

// ---- Estado vivo ----
const live = `
const P = ${JSON.stringify(P)};
const G = ${G}, PER_M = ${PER_M}, R_OF = ${R_OF}, PED_TOP = ${PED_TOP}, DIAL_TOP = ${DIAL_TOP}, DIAL_R = ${DIAL_R}, PILLAR_X = ${PILLAR_X};
const BASE = ${JSON.stringify(BASE)};
const F0 = G * BASE.m1 * BASE.m2 / (BASE.d * BASE.d);
const K = cameraOf(P).k;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const sup = (n) => String(n).split("").map((c) => SUP[c]).join("");
const num = (x, d = 2) => { const t = (+x.toFixed(d)).toString(); return t; };
function sciParts(x, digits = 2) { let e = Math.floor(Math.log10(x)); let m = x / 10 ** e; if (+m.toFixed(digits) >= 10) { m /= 10; e += 1; } return [+m.toFixed(digits), e]; }
const sci = (x, digits = 2) => { const [m, e] = sciParts(x, digits); return (e === 0 ? num(m, digits) : num(m, digits) + "×10" + sup(e)); };
function ratio(r) {
  if (Math.abs(r - 1) < 0.005) return "×1";
  if (r >= 1) return "×" + num(r, r < 10 ? 2 : 1);
  const inv = 1 / r;
  return Math.abs(inv - Math.round(inv)) < 0.02 ? "×1/" + Math.round(inv) : "×" + num(r, 3);
}
const force = (s) => G * s.m1 * s.m2 / (s.d * s.d);

const target = { ...BASE }, show = { ...BASE };
const svg = $(".iso-stage svg");
const cars = [1, 2].map((i) => {
  const g = svg.querySelector('[data-part="car-' + i + '"]');
  return { g, side: i === 1 ? -1 : 1, needle: g.querySelector('[data-part="needle"]'), ball: g.querySelector(".g-ball"), glint: g.querySelector(".g-glint"), shadow: g.querySelector(".g-shadow") };
});
const readout = $("[data-readout]");

const angleOf = (F) => { const e = Math.max(-10, Math.min(4, Math.log2(F / F0))); return (e + 3) * 20 * Math.PI / 180; };
let needle = angleOf(F0), needleRate = 0;

function drawBench() {
  const F = force(show);
  const pos = [-show.d * PER_M / 2, show.d * PER_M / 2];
  cars.forEach((car, i) => {
    car.g.setAttribute("transform", translateAlong(P, [pos[i], 0, 0]));
    const R = R_OF * Math.cbrt(i === 0 ? show.m1 : show.m2);
    const [cx, cy] = iso([0, 0, PED_TOP - 0.6 + R], P);
    car.ball.setAttribute("cx", cx.toFixed(2)); car.ball.setAttribute("cy", cy.toFixed(2)); car.ball.setAttribute("r", (R * K).toFixed(2));
    car.glint.setAttribute("cx", (cx - R * K * 0.38).toFixed(2)); car.glint.setAttribute("cy", (cy - R * K * 0.42).toFixed(2)); car.glint.setAttribute("r", (R * K * 0.16).toFixed(2));
    const [sx, sy] = iso([0, 0, PED_TOP], P);
    car.shadow.setAttribute("cx", sx.toFixed(2)); car.shadow.setAttribute("cy", sy.toFixed(2)); car.shadow.setAttribute("rx", (4.8 * K).toFixed(2)); car.shadow.setAttribute("ry", (4.8 * K * 0.5).toFixed(2));
    const px = car.side * PILLAR_X, s = Math.sin(needle), c = Math.cos(needle);
    car.needle.setAttribute("d", lineOnTop([px - s * 2.4, c * 2.4], [px + s * (DIAL_R - 2.6), -c * (DIAL_R - 2.6)], DIAL_TOP + 0.2, P));
  });
  const text = "F = " + sci(F) + " N · " + ratio(F / F0);
  if (readout.textContent !== text) readout.textContent = text;
}

// ---- Controles, tabla y pasos en vivo ----
const inputs = { m1: $("#in-m1"), m2: $("#in-m2"), d: $("#in-d") };
function syncPanel() {
  const F = force(target);
  for (const key of ["m1", "m2", "d"]) {
    if (+inputs[key].value !== target[key]) inputs[key].value = target[key];
    $$('[data-val="' + key + '"]').forEach((el) => (el.textContent = num(target[key], 1)));
  }
  $$('[data-val="F"]').forEach((el) => (el.textContent = sci(F)));
  $$('[data-val="ratio"]').forEach((el) => (el.textContent = ratio(F / F0)));
  $$("[data-preset]").forEach((row) => {
    const p = JSON.parse(row.dataset.preset);
    row.toggleAttribute("data-on", p.m1 === target.m1 && p.m2 === target.m2 && p.d === target.d);
  });
  // paso a paso en vivo
  const prod = target.m1 * target.m2, d2 = target.d * target.d, q = prod / d2;
  const [qa, qe] = sciParts(q, 3);
  const c = 6.67 * qa, ex = -11 + qe;
  const [fa, fe] = sciParts(c * 10 ** ex, 2);
  $("#live-sub").innerHTML = 'F = <b class="c-G">6.67×10⁻¹¹</b> · <b class="c-m1">' + num(target.m1, 1) + '</b> · <b class="c-m2">' + num(target.m2, 1) + '</b> / <b class="c-d">(' + num(target.d, 1) + ')²</b>';
  $("#live-num").innerHTML = '= 6.67×10⁻¹¹ · ' + num(prod, 2) + ' / ' + num(d2, 2) + ' = 6.67×10⁻¹¹ · ' + num(q, 4);
  $("#live-exp").innerHTML = num(q, 4) + ' = ' + num(qa, 3) + '×10' + sup(qe) + ' → 6.67·' + num(qa, 3) + ' = ' + num(c, 3) + ' ; 10⁻¹¹·10' + sup(qe) + ' = 10' + sup(ex);
  $("#live-res").innerHTML = 'F = ' + num(c, 3) + '×10' + sup(ex) + ' = <b class="c-F">' + num(fa, 2) + '×10' + sup(fe) + ' N</b>';
  $("#live-m1").textContent = num(target.m1, 1) + " kg"; $("#live-m2").textContent = num(target.m2, 1) + " kg"; $("#live-d").textContent = num(target.d, 1) + " m";
  $("#dm1").textContent = num(target.m1, 1) + " kg"; $("#dm2").textContent = num(target.m2, 1) + " kg"; $("#dd").textContent = num(target.d, 1) + " m";
}

let frame = 0, last = 0, visible = false, touring = !still.matches, clock = 0, idle = 0;
const tour = $$("[data-preset]").map((row) => JSON.parse(row.dataset.preset));
function set(next, fromUser = true) {
  Object.assign(target, next);
  if (fromUser) { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 9000); }
  syncPanel();
  if (!visible) { Object.assign(show, target); needle = angleOf(force(show)); needleRate = 0; drawBench(); }
  run();
}
for (const key of ["m1", "m2", "d"]) inputs[key].addEventListener("input", () => set({ [key]: +inputs[key].value }));
$$("[data-preset]").forEach((row) => row.addEventListener("click", () => set(JSON.parse(row.dataset.preset))));
$("#reset").addEventListener("click", () => set({ ...BASE }));

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    clock += dt;
    const next = tour[Math.floor(clock / 3.2) % tour.length];
    if (next.m1 !== target.m1 || next.m2 !== target.m2 || next.d !== target.d) { Object.assign(target, next); syncPanel(); }
  }
  const a = still.matches ? 1 : 1 - Math.exp(-dt / 0.3);
  let moving = false;
  for (const key of ["m1", "m2", "d"]) {
    show[key] += (target[key] - show[key]) * a;
    if (Math.abs(target[key] - show[key]) < 0.002) show[key] = target[key]; else moving = true;
  }
  const want = angleOf(force(show));
  if (still.matches) { needle = want; needleRate = 0; }
  else for (let i = 0; i < 4; i++) { needleRate += ((want - needle) * 260 - needleRate * 20) * dt / 4; needle += needleRate * dt / 4; }
  if (Math.abs(want - needle) < 0.0005 && Math.abs(needleRate) < 0.0005) { needle = want; needleRate = 0; } else moving = true;
  drawBench();
  frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe($(".iso-stage"));
$(".iso-stage").addEventListener("pointerdown", () => set({}, true));
syncPanel(); drawBench();
`;

// ---- Página ----
const presets = [
  { label: "Base", what: "10 kg · 10 kg · 2 m", p: { m1: 10, m2: 10, d: 2 }, f: "×1", w: 25, note: "referencia" },
  { label: "Duplico m₁", what: "<b class='c-m1'>20</b> · 10 · 2", p: { m1: 20, m2: 10, d: 2 }, f: "×2", w: 50, note: "F es proporcional a m₁" },
  { label: "Duplico las dos", what: "<b class='c-m1'>20</b> · <b class='c-m2'>20</b> · 2", p: { m1: 20, m2: 20, d: 2 }, f: "×4", w: 100, note: "2 × 2 = 4" },
  { label: "Duplico d", what: "10 · 10 · <b class='c-d'>4</b>", p: { m1: 10, m2: 10, d: 4 }, f: "×1/4", w: 6.25, note: "2² = 4 → F ÷ 4" },
  { label: "Triplico d", what: "10 · 10 · <b class='c-d'>6</b>", p: { m1: 10, m2: 10, d: 6 }, f: "×1/9", w: 2.78, note: "3² = 9 → F ÷ 9" },
  { label: "Mitad de d", what: "10 · 10 · <b class='c-d'>1</b>", p: { m1: 10, m2: 10, d: 1 }, f: "×4", w: 100, note: "(½)² = ¼ → F × 4" },
];

const arrowDefs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--F)"/></marker>
<marker id="ah-q" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--anatomy-strong)"/></marker>
<radialGradient id="flat-1" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="var(--m1-lite)"/><stop offset=".55" stop-color="var(--m1)"/><stop offset="1" stop-color="var(--m1-deep)"/></radialGradient>
<radialGradient id="flat-2" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="var(--m2-lite)"/><stop offset=".55" stop-color="var(--m2)"/><stop offset="1" stop-color="var(--m2-deep)"/></radialGradient></defs>`;

const idea = `<svg class="diagram" viewBox="0 0 640 210" role="img" aria-label="Dos masas, m₁ azul y m₂ naranja, con una flecha de fuerza en cada una apuntando hacia la otra. Las dos flechas miden lo mismo.">
${arrowDefs}
<line x1="150" y1="178" x2="470" y2="178" class="dim-d"/><line x1="150" y1="170" x2="150" y2="186" class="dim-d"/><line x1="470" y1="170" x2="470" y2="186" class="dim-d"/>
<text x="310" y="200" class="lbl c-d" text-anchor="middle">d (entre centros)</text>
<circle cx="150" cy="95" r="44" fill="url(#flat-1)" class="ball-edge"/><circle cx="470" cy="95" r="34" fill="url(#flat-2)" class="ball-edge"/>
<circle cx="150" cy="95" r="2.5" class="center"/><circle cx="470" cy="95" r="2.5" class="center"/>
<line x1="200" y1="95" x2="290" y2="95" class="arrow" marker-end="url(#ah)"/>
<line x1="420" y1="95" x2="330" y2="95" class="arrow" marker-end="url(#ah)"/>
<text x="245" y="80" class="lbl c-F" text-anchor="middle">F</text><text x="375" y="80" class="lbl c-F" text-anchor="middle">F</text>
<text x="150" y="35" class="lbl c-m1" text-anchor="middle">m₁</text><text x="470" y="45" class="lbl c-m2" text-anchor="middle">m₂</text>
<text x="310" y="130" class="small" text-anchor="middle">misma F, sentidos opuestos</text>
</svg>`;

const pair = (a, b, attract, ca, cb) => {
  const y = 26;
  const arrows = attract
    ? `<line x1="62" y1="${y}" x2="92" y2="${y}" class="arrow-q" marker-end="url(#ah-q)"/><line x1="178" y1="${y}" x2="148" y2="${y}" class="arrow-q" marker-end="url(#ah-q)"/>`
    : `<line x1="38" y1="${y}" x2="8" y2="${y}" class="arrow-q" marker-end="url(#ah-q)"/><line x1="202" y1="${y}" x2="232" y2="${y}" class="arrow-q" marker-end="url(#ah-q)"/>`;
  return `<svg class="pair" viewBox="0 0 240 52">${arrowDefs}${arrows}<circle cx="50" cy="${y}" r="13" class="${ca}"/><circle cx="190" cy="${y}" r="13" class="${cb}"/><text x="50" y="${y + 5}" text-anchor="middle" class="sign">${a}</text><text x="190" y="${y + 5}" text-anchor="middle" class="sign">${b}</text></svg>`;
};

const mini = (m1, m2, d) => `<svg class="mini" viewBox="0 0 260 90" aria-hidden="true"><circle cx="50" cy="38" r="20" fill="url(#flat-1)" class="ball-edge"/><circle cx="210" cy="38" r="20" fill="url(#flat-2)" class="ball-edge"/>
<line x1="50" y1="74" x2="210" y2="74" class="dim-d"/><line x1="50" y1="68" x2="50" y2="80" class="dim-d"/><line x1="210" y1="68" x2="210" y2="80" class="dim-d"/>
<text x="50" y="43" text-anchor="middle" class="in-ball">${m1}</text><text x="210" y="43" text-anchor="middle" class="in-ball">${m2}</text><text x="130" y="68" text-anchor="middle" class="lbl-s c-d">${d}</text>
<line x1="74" y1="38" x2="104" y2="38" class="arrow thin" marker-end="url(#ah)"/><line x1="186" y1="38" x2="156" y2="38" class="arrow thin" marker-end="url(#ah)"/></svg>`;

const body = `
<header class="hero">
  <p class="kicker">Física 3 · Repaso visual</p>
  <h1>Ley de Gravitación Universal</h1>
  <p class="lead">Toda masa atrae a toda otra masa.</p>
  <nav class="toc"><a href="#s1">1 Idea</a><a href="#s2">2 Fórmula</a><a href="#s3">3 Proporciones</a><a href="#s4">4 vs Coulomb</a><a href="#s5">5 Ejemplo</a><a href="#s6">6 Método</a></nav>
</header>

<section id="s1">
  <h2><span class="n">1</span> La idea básica</h2>
  <div class="card">${idea}</div>
  <div class="chips">
    <div class="chip"><b>Siempre atrae</b><span>cada masa tira de la otra</span></div>
    <div class="chip"><b>Fuerzas iguales</b><span>F sobre m₁ = F sobre m₂</span></div>
    <div class="chip"><b>Sobre la línea</b><span>que une los centros</span></div>
  </div>
  <h3>¿Por qué nunca repele?</h3>
  <div class="grid2">
    <div class="card why">
      <p class="tag">Cargas eléctricas</p>
      <div class="row">${pair("+", "+", false, "q-pos", "q-pos")}<span>repelen</span></div>
      <div class="row">${pair("+", "−", true, "q-pos", "q-neg")}<span>atraen</span></div>
      <p class="foot">Hay dos signos: + y −</p>
    </div>
    <div class="card why">
      <p class="tag">Masas</p>
      <div class="row">${pair("m", "m", true, "mm-1", "mm-2")}<span>atraen</span></div>
      <div class="row ghost"><span class="nope">✕ masa negativa: no existe</span></div>
      <p class="foot">Un solo signo: m siempre &gt; 0 → m₁·m₂ &gt; 0 → <b>solo atracción</b></p>
    </div>
  </div>
</section>

<section id="s2">
  <h2><span class="n">2</span> La fórmula</h2>
  <div class="card formula-card">
    <div class="formula" aria-label="F igual a G por m uno por m dos, dividido entre d al cuadrado">
      <span class="c-F">F</span> <span class="eq">=</span>
      <span class="frac"><span class="top"><span class="c-G">G</span><span class="dot">·</span><span class="c-m1">m₁</span><span class="dot">·</span><span class="c-m2">m₂</span></span><span class="bar"></span><span class="bot"><span class="c-d">d²</span></span></span>
    </div>
    <div class="parts">
      <div class="part b-F"><b class="c-F">F</b><span>fuerza</span><em>N</em></div>
      <div class="part b-G"><b class="c-G">G</b><span>constante universal</span><em>6.67×10⁻¹¹ N·m²/kg²</em></div>
      <div class="part b-m1"><b class="c-m1">m₁</b><span>masa 1</span><em>kg</em></div>
      <div class="part b-m2"><b class="c-m2">m₂</b><span>masa 2</span><em>kg</em></div>
      <div class="part b-d"><b class="c-d">d</b><span>distancia entre centros (¡al cuadrado!)</span><em>m</em></div>
    </div>
    <p class="units">Unidades: <span class="c-G">N·m²/kg²</span> · <span class="c-m1">kg</span> · <span class="c-m2">kg</span> / <span class="c-d">m²</span> = <span class="c-F">N</span> ✓</p>
  </div>
</section>

<section id="s3">
  <h2><span class="n">3</span> ¿Qué pasa con F si cambio algo?</h2>
  ${figure}
  <div class="card controls">
    <label class="ctl"><span class="c-m1">m₁</span><input id="in-m1" type="range" min="${RANGE.m[0]}" max="${RANGE.m[1]}" step="1" value="${BASE.m1}" class="r-m1"><output><span data-val="m1">10</span> kg</output></label>
    <label class="ctl"><span class="c-m2">m₂</span><input id="in-m2" type="range" min="${RANGE.m[0]}" max="${RANGE.m[1]}" step="1" value="${BASE.m2}" class="r-m2"><output><span data-val="m2">10</span> kg</output></label>
    <label class="ctl"><span class="c-d">d</span><input id="in-d" type="range" min="${RANGE.d[0]}" max="${RANGE.d[1]}" step="0.1" value="${BASE.d}" class="r-d"><output><span data-val="d">2</span> m</output></label>
    <div class="result"><span class="c-F">F</span> = <b data-val="F">1.67×10⁻⁹</b> N <span class="pill" data-val="ratio">×1</span><button id="reset" type="button">Reiniciar</button></div>
  </div>
  <div class="card">
    <table class="cmp">
      <thead><tr><th>Cambio</th><th>Datos</th><th>F nueva</th><th class="wbar"></th></tr></thead>
      <tbody>
      ${presets.map((r) => `<tr data-preset='${JSON.stringify(r.p)}' tabindex="0"><td><b>${r.label}</b><small>${r.note}</small></td><td>${r.what}</td><td class="f">${r.f}</td><td class="wbar"><span class="barf" style="width:${r.w}%"></span></td></tr>`).join("")}
      </tbody>
    </table>
    <p class="hint">Toca una fila para verla en el banco.</p>
  </div>
  <div class="rules">
    <div class="rule"><b>Masa ×n</b> → F ×n</div>
    <div class="rule"><b>Distancia ×n</b> → F ÷ n²</div>
  </div>
</section>

<section id="s4">
  <h2><span class="n">4</span> Gravitación vs Coulomb</h2>
  <div class="grid2">
    <div class="card side">
      <p class="tag">Gravitación (Newton)</p>
      <div class="formula sm"><span class="c-F">F</span> = <span class="frac"><span class="top"><span class="c-G">G</span>·<span class="c-m1">m₁</span>·<span class="c-m2">m₂</span></span><span class="bar"></span><span class="bot"><span class="c-d">d²</span></span></span></div>
      ${pair("m₁", "m₂", true, "mm-1", "mm-2")}
    </div>
    <div class="card side">
      <p class="tag">Eléctrica (Coulomb)</p>
      <div class="formula sm"><span class="c-F">F</span> = <span class="frac"><span class="top"><span class="c-k">k</span>·<span class="c-q">q₁</span>·<span class="c-q">q₂</span></span><span class="bar"></span><span class="bot"><span class="c-d">d²</span></span></span></div>
      ${pair("+", "−", true, "q-pos", "q-neg")}
    </div>
  </div>
  <div class="card">
    <table class="vs">
      <thead><tr><th></th><th>Gravedad</th><th>Coulomb</th><th></th></tr></thead>
      <tbody>
        <tr><td>Distancia</td><td class="c-d">1/d²</td><td class="c-d">1/d²</td><td><span class="same">igual</span></td></tr>
        <tr><td>Producto</td><td>m₁·m₂</td><td>q₁·q₂</td><td><span class="same">igual</span></td></tr>
        <tr><td>Fuente</td><td><span class="c-m1">masa</span> (kg)</td><td><span class="c-q">carga</span> (C)</td><td><span class="diff">cambia</span></td></tr>
        <tr><td>Sentido</td><td>solo atrae</td><td>atrae o repele</td><td><span class="diff">cambia</span></td></tr>
        <tr><td>Constante</td><td><span class="c-G">G = 6.67×10⁻¹¹</span><small>N·m²/kg² · muy pequeña</small></td><td><span class="c-k">k = 8.99×10⁹</span><small>N·m²/C² · muy grande</small></td><td><span class="diff">cambia</span></td></tr>
      </tbody>
    </table>
    <p class="scale-note"><span class="c-k">k</span> / <span class="c-G">G</span> ≈ 1.35×10²⁰ → la gravedad es muchísimo más débil.</p>
  </div>
</section>

<section id="s5">
  <h2><span class="n">5</span> Ejemplo con números</h2>
  <p class="prob">Dos masas de 10 kg a 2 m. ¿Cuánto vale F?</p>
  <div class="board">
    <div class="step"><span class="sn">Datos</span><div class="data"><span class="c-m1">m₁ = 10 kg</span><span class="c-m2">m₂ = 10 kg</span><span class="c-d">d = 2 m</span><span class="c-G">G = 6.67×10⁻¹¹</span></div></div>
    <div class="step"><span class="sn">Dibujo</span>${mini("10 kg", "10 kg", "2 m")}</div>
    <div class="step"><span class="sn">Fórmula</span><div class="math">F = <span class="c-G">G</span>·<span class="c-m1">m₁</span>·<span class="c-m2">m₂</span> / <span class="c-d">d²</span></div></div>
    <div class="step"><span class="sn">Sustituir</span><div class="math">F = <span class="c-G">6.67×10⁻¹¹</span> · <span class="c-m1">10</span> · <span class="c-m2">10</span> / <span class="c-d">2²</span></div></div>
    <div class="step"><span class="sn">Operar</span><div class="math">= 6.67×10⁻¹¹ · <b>100</b> / <b>4</b> = 6.67×10⁻¹¹ · <b>25</b></div></div>
    <div class="step"><span class="sn">Exponentes</span><div class="math exp">
      <div>25 = 2.5×10¹</div>
      <div>6.67 · 2.5 = <b>16.675</b></div>
      <div>10⁻¹¹ · 10¹ = 10<sup>−11+1</sup> = <b>10⁻¹⁰</b></div>
      <div>16.675×10⁻¹⁰ = <b>1.67×10⁻⁹</b> <small>(coma 1 lugar a la izquierda → exponente +1)</small></div>
    </div></div>
    <div class="step res"><span class="sn">Resultado</span><div class="math big"><span class="c-F">F ≈ 1.67×10⁻⁹ N</span></div><small>Muy pequeña: ¡por eso no sentimos la atracción entre objetos cotidianos!</small></div>
  </div>
</section>

<section id="s6">
  <h2><span class="n">6</span> Paso a paso para resolver problemas</h2>
  <ol class="method">
    <li><i>1</i><b>Datos</b><span>m₁, m₂, d, G</span></li>
    <li><i>2</i><b>Dibujo</b><span>2 masas + d entre centros</span></li>
    <li><i>3</i><b>Fórmula</b><span>F = G·m₁·m₂/d²</span></li>
    <li><i>4</i><b>Sustituir</b><span>con unidades SI</span></li>
    <li><i>5</i><b>Exponentes</b><span>números × números, 10ˣ·10ʸ = 10ˣ⁺ʸ</span></li>
    <li><i>6</i><b>Resultado</b><span>a×10ⁿ N, con 1 ≤ a &lt; 10</span></li>
  </ol>
  <div class="card traps">
    <p class="tag">Trampas típicas</p>
    <ul>
      <li><b>g → kg</b> ÷ 1000</li><li><b>km → m</b> × 1000</li><li><b>cm → m</b> ÷ 100</li>
      <li><b>d²</b> ¡no olvides elevar!</li><li><b>d</b> entre centros</li><li><b>F</b> igual en las dos masas</li>
    </ul>
  </div>
  <h3>Pruébalo: usa los deslizadores del banco (sección 3)</h3>
  <div class="board live">
    <div class="step"><span class="sn">1 Datos</span><div class="data"><span class="c-m1">m₁ = <span id="live-m1">10 kg</span></span><span class="c-m2">m₂ = <span id="live-m2">10 kg</span></span><span class="c-d">d = <span id="live-d">2 m</span></span></div></div>
    <div class="step"><span class="sn">2 Dibujo</span>${mini('<tspan id="dm1">10 kg</tspan>', '<tspan id="dm2">10 kg</tspan>', '<tspan id="dd">2 m</tspan>')}</div>
    <div class="step"><span class="sn">3 Fórmula</span><div class="math">F = <span class="c-G">G</span>·<span class="c-m1">m₁</span>·<span class="c-m2">m₂</span> / <span class="c-d">d²</span></div></div>
    <div class="step"><span class="sn">4 Sustituir</span><div class="math" id="live-sub"></div></div>
    <div class="step"><span class="sn">5 Operar</span><div class="math" id="live-num"></div></div>
    <div class="step"><span class="sn">5 Exponentes</span><div class="math" id="live-exp"></div></div>
    <div class="step res"><span class="sn">6 Resultado</span><div class="math big" id="live-res"></div></div>
  </div>
</section>
<footer class="end">F = G·m₁·m₂/d² · G = 6.67×10⁻¹¹ N·m²/kg²</footer>
`;

const css = `
.iso{--m1:#5b8cff;--m1-lite:#b9cfff;--m1-deep:#1e3f99;--m2:#ff9a3c;--m2-lite:#ffd6ad;--m2-deep:#a3500a;--dist:#3fd08a;--Gc:#c08cff;--F:#ff6b81;--kc:#2fc6c6;--qc:#f2c94c;--qpos:#ff6b6b;--qneg:#5bb8ff;--chip:#1a1a1a;--line:#2a2a2a}
.iso[data-theme="light"]{--m1:#2f62e0;--m1-lite:#9db8ff;--m1-deep:#173a8f;--m2:#e9771a;--m2-lite:#ffc993;--m2-deep:#93460a;--dist:#178f57;--Gc:#7c4bd1;--F:#d6334a;--kc:#0b8a8a;--qc:#a87a00;--qpos:#e5484d;--qneg:#2f7fd6;--chip:#f1f1ee;--line:#dcdcd8}
*{box-sizing:border-box}
html{color-scheme:dark}
body{margin:0;background:var(--anatomy-page);color:var(--anatomy-text);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
body[data-theme="light"]{color-scheme:light}
main{width:min(820px,100% - 32px);margin:40px auto 80px}
h1,h2,h3{color:var(--anatomy-strong);line-height:1.2}
h1{font-size:clamp(28px,6vw,44px);margin:6px 0 6px;letter-spacing:-.01em}
h2{font-size:22px;margin:56px 0 16px;display:flex;align-items:center;gap:10px}
h3{font-size:16px;margin:24px 0 12px}
.n{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--anatomy-strong);color:var(--anatomy-page);font-size:14px}
.kicker{font-family:var(--anatomy-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted);margin:0}
.lead{font-size:18px;margin:0 0 14px}
.toc{display:flex;flex-wrap:wrap;gap:6px}
.toc a{color:var(--anatomy-text);text-decoration:none;font-size:13px;padding:4px 10px;border-radius:99px;box-shadow:0 0 0 1px var(--line)}
.toc a:hover{color:var(--anatomy-strong)}
.card{background:var(--anatomy-card);box-shadow:0 0 0 1px var(--line);border-radius:10px;padding:16px;margin:12px 0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:640px){.grid2{grid-template-columns:1fr}}
.diagram{width:100%;height:auto;display:block}
.ball-edge{stroke:var(--anatomy-hi);stroke-width:.8}
.center{fill:var(--anatomy-strong)}
.arrow{stroke:var(--F);stroke-width:4;stroke-linecap:round}
.arrow.thin{stroke-width:2.5}
.arrow-q{stroke:var(--anatomy-strong);stroke-width:2.2}
.dim-d{stroke:var(--dist);stroke-width:1.6}
.lbl{font:600 18px ui-sans-serif,system-ui,sans-serif;fill:currentColor}
.lbl-s{font:600 12px ui-sans-serif,system-ui,sans-serif}
.small{font-size:13px;fill:var(--anatomy-muted)}
.in-ball{font:700 10px ui-sans-serif,system-ui,sans-serif;fill:#fff}
.c-m1{color:var(--m1);fill:var(--m1)}.c-m2{color:var(--m2);fill:var(--m2)}.c-d{color:var(--dist);fill:var(--dist)}.c-G{color:var(--Gc)}.c-F{color:var(--F);fill:var(--F)}.c-k{color:var(--kc)}.c-q{color:var(--qc)}
.chips{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media (max-width:640px){.chips{grid-template-columns:1fr}}
.chip{background:var(--chip);border-radius:8px;padding:10px 12px;display:grid}
.chip b{color:var(--anatomy-strong)}.chip span{font-size:13px}
.why .row{display:flex;align-items:center;gap:10px;min-height:52px}
.why .row span{font-size:14px;color:var(--anatomy-strong)}
.pair{width:200px;height:auto;flex:none;overflow:visible}
.side .pair{width:100%;max-width:240px;display:block;margin:8px auto 0}
.q-pos{fill:var(--qpos)}.q-neg{fill:var(--qneg)}.mm-1{fill:var(--m1)}.mm-2{fill:var(--m2)}
.sign{font:700 13px ui-sans-serif,system-ui,sans-serif;fill:#fff}
.nope{font-size:13px!important;color:var(--anatomy-muted)!important;}
.tag{font-family:var(--anatomy-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 6px}
.foot{font-size:13px;margin:8px 0 0}
.formula{display:flex;align-items:center;justify-content:center;gap:14px;font:600 clamp(30px,7vw,52px)/1 ui-serif,Georgia,serif;color:var(--anatomy-strong);padding:10px 0 18px}
.formula.sm{font-size:28px;padding:6px 0}
.frac{display:inline-grid;justify-items:center;gap:6px}
.frac .bar{width:100%;height:2px;background:var(--anatomy-strong)}
.dot{color:var(--anatomy-muted);margin:0 2px}
.parts{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
@media (max-width:700px){.parts{grid-template-columns:repeat(2,1fr)}.b-d{grid-column:span 2}}
.part{display:grid;gap:2px;padding:10px;border-radius:8px;background:var(--chip);border-top:3px solid}
.part b{font:700 20px ui-serif,Georgia,serif}.part span{font-size:12.5px}.part em{font-style:normal;font-family:var(--anatomy-mono);font-size:12px;color:var(--anatomy-strong)}
.b-F{border-color:var(--F)}.b-G{border-color:var(--Gc)}.b-m1{border-color:var(--m1)}.b-m2{border-color:var(--m2)}.b-d{border-color:var(--dist)}
.units{text-align:center;font-family:var(--anatomy-mono);font-size:13px;margin:14px 0 0}
.iso-figure{margin:12px 0 4px}
.controls{display:grid;gap:10px}
.ctl{display:grid;grid-template-columns:32px 1fr 70px;align-items:center;gap:10px;font:600 17px ui-serif,Georgia,serif}
.ctl output{font:13px var(--anatomy-mono);color:var(--anatomy-strong);text-align:right}
input[type=range]{width:100%;accent-color:var(--anatomy-strong);height:28px}
.r-m1{accent-color:var(--m1)}.r-m2{accent-color:var(--m2)}.r-d{accent-color:var(--dist)}
.result{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-family:var(--anatomy-mono);font-size:15px;color:var(--anatomy-strong);padding-top:8px;border-top:1px solid var(--line)}
.pill{background:var(--chip);border-radius:99px;padding:2px 10px}
button{margin-left:auto;font:13px ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-strong);background:transparent;border:1px solid var(--line);border-radius:6px;padding:6px 12px;cursor:pointer}
button:hover{border-color:var(--anatomy-mid)}
table{width:100%;border-collapse:collapse;font-size:14px}
th{font:11px var(--anatomy-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-muted);text-align:left;padding:6px 8px}
td{padding:9px 8px;border-top:1px solid var(--line);vertical-align:middle}
td small{display:block;font-size:12px;color:var(--anatomy-muted)}
.cmp tbody tr{cursor:pointer}
.cmp tbody tr:hover td,.cmp tbody tr:focus td{background:var(--chip)}
.cmp tbody tr[data-on] td{background:var(--chip)}
.cmp tbody tr[data-on] td:first-child{box-shadow:inset 3px 0 0 var(--F)}
.cmp .f{font:700 17px var(--anatomy-mono);color:var(--F);white-space:nowrap}
.wbar{width:32%}
.barf{display:block;height:12px;border-radius:3px;background:var(--F);min-width:2px}
@media (max-width:480px){.cmp td small{display:none}.cmp td,.cmp th{padding:8px 5px}.rule{font-size:14px}}
.hint{font-size:12.5px;color:var(--anatomy-muted);margin:8px 0 0}
.rules{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rule{background:var(--chip);border-radius:8px;padding:12px;text-align:center;font-size:16px;color:var(--anatomy-strong)}
.vs td:nth-child(2),.vs td:nth-child(3){color:var(--anatomy-strong)}
.same,.diff{font:11px var(--anatomy-mono);padding:2px 8px;border-radius:99px;white-space:nowrap}
.same{background:color-mix(in srgb,var(--dist) 22%,transparent);color:var(--dist)}
.diff{background:color-mix(in srgb,var(--F) 20%,transparent);color:var(--F)}
.scale-note{font-size:14px;margin:10px 0 0;color:var(--anatomy-strong)}
.prob{font-size:16px;color:var(--anatomy-strong)}
.board{display:grid;gap:8px;margin:12px 0}
.step{display:grid;grid-template-columns:110px 1fr;align-items:center;gap:12px;background:var(--anatomy-card);box-shadow:0 0 0 1px var(--line);border-radius:10px;padding:12px 14px}
@media (max-width:560px){.step{grid-template-columns:1fr;gap:6px}}
.sn{font:11px var(--anatomy-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-muted)}
.data{display:flex;flex-wrap:wrap;gap:6px 18px;font:600 15px var(--anatomy-mono)}
.math{font:16px var(--anatomy-mono);color:var(--anatomy-strong);overflow-wrap:anywhere}
.math b:not([class]){color:var(--anatomy-strong)}
.math.exp{display:grid;gap:4px}
.math small{color:var(--anatomy-muted);font-size:12px}
.math.big{font-size:22px;font-weight:700}
.step.res{box-shadow:0 0 0 1.5px var(--F)}
.step.res>small{grid-column:1/-1;color:var(--anatomy-muted)}
.mini{width:100%;max-width:260px;height:auto}
.method{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(6,1fr);gap:8px;counter-reset:s}
@media (max-width:760px){.method{grid-template-columns:repeat(2,1fr)}}
.method li{position:relative;display:grid;gap:4px;background:var(--anatomy-card);box-shadow:0 0 0 1px var(--line);border-radius:10px;padding:12px}
.method i{font-style:normal;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--F);color:#fff;font-weight:700;font-size:13px}
.method b{color:var(--anatomy-strong)}.method span{font-size:12.5px}
.traps ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px;font-size:14px}
@media (max-width:560px){.traps ul{grid-template-columns:1fr 1fr}}
.traps b{color:var(--F);font-family:var(--anatomy-mono)}
.g-ball{stroke:var(--anatomy-hi);stroke-width:.6}
.g-glint{fill:#fff;opacity:.55}
.g-shadow{fill:var(--anatomy-halo);opacity:.6}
.end{margin-top:56px;text-align:center;font-family:var(--anatomy-mono);font-size:13px;color:var(--anatomy-muted)}
`;

const themeBoot = `<script>(function(){var q=new URLSearchParams(location.search).get("theme");var t=q||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.boot=t;document.addEventListener("DOMContentLoaded",function(){document.body.dataset.theme=t;});})();</script>`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gravitación Universal</title>${themeBoot}<style>${k.ISO_CSS}${css}</style></head><body class="iso" data-theme="dark"><script>document.body.dataset.theme=document.documentElement.dataset.boot;</script><main>${body}</main><script type="module">${(kitScript() + live).replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;

writeFileSync(join(HERE, "index.html"), html);
console.log("wrote gravitacion/index.html");
