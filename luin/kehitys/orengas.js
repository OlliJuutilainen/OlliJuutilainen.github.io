// Ö-mapin ö:n mappirengas. Tuottaa luin.html:n #om-linkin renkaan ja otsikon OTS_OMAPPI-renkaan sekä niiden CSS-mitat:
//   node luin/kehitys/orengas.js            JSON (svg:t ja mitat em:inä)
//   node luin/kehitys/orengas.js --kuva     esikatselusivu suurennettuna (stdout, html)
// Rengas on viiva, jolla on keskilinja ja paksuus. Keskilinja on superellipsi: alapuolisko eksponentilla nAla (> 2, joten pohja on
// litteä ja linkin alleviivaus jatkuu siitä oikealle), yläpuolisko ellipsi. Rengas on matala ja leveä (käyttäjän linjaus: lytistetty).
// Paksuus on pohjassa alleviivauksen paksuinen, kyljissä tuskin enempää (kulma kMax pohjasta) ja kevenee siitä selvästi lakea
// kohti (laki tt); laella leveä viisto irvistysrako (ulkoreunojen väli go, sisäreunojen gi). Ö:n pisteet ovat saman muodon pienempiä
// renkaita.
const f = x => { const s = (Math.round(x * 100) / 100 + ''); return s.replace(/^0\./, '.').replace(/^-0\./, '-.'); };
const sstep = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
// p: lev (ulkoleveys), kork (ulkokorkeus, litteästä pohjasta keskilinjan lakeen + puolet lakipaksuudesta), nAla, tb (pohja),
// ts (suurin), tt (laki), kTasa (pohjan tasapaksu osa, astetta), kMax, go, gi.
function rengas(p, x0, y0) {
  const N = 2000, dt = 2 * Math.PI / N, kul = d => d * Math.PI / 180;
  const w = t => { const u = Math.abs(t); return u <= kul(p.kMax) ? p.tb + (p.ts - p.tb) * sstep((u - kul(p.kTasa)) / (kul(p.kMax) - kul(p.kTasa)))
    : p.ts - (p.ts - p.tt) * sstep((u - kul(p.kMax)) / (Math.PI - kul(p.kMax))); };
  // Keskilinjan puoliakselit: ulkoleveyden puolikas kyljen paksuuden puolikkaalla vähennettynä, korkeus pohjan ja laen paksuuksilla.
  const a = p.lev / 2 - p.ts / 2, b = (p.kork - p.tb / 2 - p.tt / 2) / 2, cx = x0 + p.lev / 2, cy = y0 + p.kork - p.tb / 2 - b;
  const kp = t => { const s = Math.sin(t), c = Math.cos(t), n = Math.abs(t) <= Math.PI / 2 ? p.nAla : 2;
    return [cx + a * Math.sign(s) * Math.abs(s) ** (2 / n), cy + b * Math.sign(c) * Math.abs(c) ** (2 / n)]; };
  const ulko = [], sisa = [];
  for (let i = 0; i <= N; i++) {
    const t = -Math.PI + i * dt, q = kp(t), e = kp(t - dt / 4), j = kp(t + dt / 4);
    let tx = j[0] - e[0], ty = j[1] - e[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty, ny = tx, h = w(t) / 2; // t kasvaa vastapäivään ruudulla (y alas): normaali (-ty, tx) osoittaa ulos.
    ulko.push([q[0] + nx * h, q[1] + ny * h, t]); sisa.push([q[0] - nx * h, q[1] - ny * h, t]);
  }
  // Rako: ulkoreuna katkeaa, kun |x - cx| < go/2 laen puolella, sisäreuna kun < gi/2.
  const paa = (pis, g) => pis.filter(q => Math.abs(q[2]) < Math.PI / 2 || Math.abs(q[0] - cx) >= g / 2 - 1e-9);
  const u = paa(ulko, p.go), s = paa(sisa, p.gi);
  return { u, s: s.reverse(), cx, alin: Math.max(...ulko.map(q => q[1])), ylin: Math.min(...u.map(q => q[1])),
    vas: Math.min(...ulko.map(q => q[0])), oik: Math.max(...ulko.map(q => q[0])) };
}
// Kaarenpituuden mukaan tasaväliset pisteet ja Catmull–Rom-kaaret niiden läpi (avoin ketju).
function tasaa(pis, n) {
  const d = [0]; for (let i = 1; i < pis.length; i++) d.push(d[i - 1] + Math.hypot(pis[i][0] - pis[i - 1][0], pis[i][1] - pis[i - 1][1]));
  const L = d[d.length - 1], ulos = []; let j = 0;
  for (let k = 0; k <= n; k++) { const s = L * k / n; while (j < d.length - 2 && d[j + 1] < s) j++;
    const r = (s - d[j]) / ((d[j + 1] - d[j]) || 1); ulos.push([pis[j][0] + (pis[j + 1][0] - pis[j][0]) * r, pis[j][1] + (pis[j + 1][1] - pis[j][1]) * r]); }
  return ulos;
}
function kaaret(q) {
  let s = '';
  for (let i = 0; i < q.length - 1; i++) {
    const p0 = q[Math.max(i - 1, 0)], p1 = q[i], p2 = q[i + 1], p3 = q[Math.min(i + 2, q.length - 1)];
    s += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' +
      f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
  }
  return s;
}
function polku(r, n) {
  const u = tasaa(r.u, n), s = tasaa(r.s, n);
  return 'M' + f(u[0][0]) + ' ' + f(u[0][1]) + kaaret(u) + 'L' + f(s[0][0]) + ' ' + f(s[0][1]) + kaaret(s) + 'Z';
}
// Ö: rengas ja kaksi pistettä (P: pisteen mitat, pdx pisteen keskikohta renkaan keskeltä, pnosto rako renkaan laesta).
function o(R, P) {
  const ph = P.kork, y0 = ph + P.pnosto;
  const r = rengas(R, 0, y0), p1 = rengas(P, r.cx - P.pdx - P.lev / 2, 0), p2 = rengas(P, r.cx + P.pdx - P.lev / 2, 0);
  return { r, w: R.lev, h: y0 + R.kork, d: polku(r, R.n || 48) + polku(p1, P.n || 28) + polku(p2, P.n || 28) };
}
// Linkin svg on kokonaisen pikselin korkuinen (tyhjää renkaan pisteiden yläpuolella): Chromium pyöristää svg:n laatikon reunat
// pikseleihin, joten murto-osainen korkeus skaalaisi renkaan ja sen pohja osuisi alleviivauksesta sivuun (mitattu 1×, 2× ja 3×).
const yla = (g, kok) => kok ? Math.ceil(g.h - 1e-9) - g.h : 0;
function svg(R, P, luokka, kok) {
  const g = o(R, P), y = yla(g, kok);
  return '<svg class="' + luokka + '" viewBox="0 ' + f(-y) + ' ' + f(g.w) + ' ' + f(g.h + y) + '" aria-hidden="true"><path d="' + g.d + '"/></svg>';
}
// Mitat px:einä linkin koossa (.64rem = 10,24 px). Pohja alleviivauksen alareunassa ALA px perusviivan alla, pohjan paksuus 1 px
// kuten kellarilinkin reunaviiva. Rengas 10,5 × 6,5 px; pisteiden yläreuna on suunnilleen versaalikorkeudella (CAP 7,36 px).
const EM = 10.24, CAP = 7.36, ALA = 2.3;
const LINKKI = { lev: 10.5, kork: 6.5, nAla: 2.6, tb: 1, ts: 1.05, tt: .35, kTasa: 12, kMax: 60, go: 1.7, gi: 2.7, n: 30 };
const PISTE = { lev: 3.45, kork: 1.95, nAla: 2.6, tb: .5, ts: .53, tt: .3, kTasa: 12, kMax: 60, go: .55, gi: .9, pnosto: 1, pdx: 2.65, n: 16 };
// Yhdysviivan keskikohta versaalien keskeltä ja renkaan keskeltä puolivälissä (px perusviivasta).
const YV = (CAP / 2 + (LINKKI.kork / 2 - ALA)) / 2;
// Otsikon rengas (.74rem = 11,84 px): sama muoto, pohja perusviivalla ja keskikohta kammen navan korkeudella (.3176 em = 3,76 px),
// joten koko on linkin renkaan kerroin OK.
const OEM = 11.84, ONAPA = 3.76, OK = 2 * ONAPA / LINKKI.kork;
const skaalaa = (p, k) => Object.fromEntries(Object.entries(p).map(([x, v]) => [x, /^(n|nAla|kTasa|kMax)$/.test(x) ? v : v * k]));
const OTS = skaalaa(LINKKI, OK), OPISTE = skaalaa(PISTE, OK);
const e = (x, em) => (Math.round(x / em * 10000) / 10000 + '').replace(/^(-?)0\./, '$1.') + 'em';
if (require.main === module) {
  const gl = o(LINKKI, PISTE), go = o(OTS, OPISTE);
  if (process.argv.includes('--kuva')) {
    const k = 40;
    console.log('<!doctype html><meta charset="utf-8"><body style="background:#f8f4ea;color:#6b5a44;margin:20px">' +
      '<svg width="' + gl.w * k + '" height="' + gl.h * k + '" viewBox="0 0 ' + f(gl.w) + ' ' + f(gl.h) + '" style="overflow:visible">' +
      '<path fill="currentColor" d="' + gl.d + '"/><rect x="' + f(gl.r.cx) + '" y="' + f(gl.h - LINKKI.tb) + '" width="20" height="' + LINKKI.tb + '" fill="currentColor"/>' +
      '<line x1="-5" x2="30" y1="' + f(gl.h - ALA) + '" y2="' + f(gl.h - ALA) + '" stroke="#c33" stroke-width=".03"/>' +
      '<line x1="-5" x2="30" y1="' + f(gl.h - ALA - CAP) + '" y2="' + f(gl.h - ALA - CAP) + '" stroke="#c33" stroke-width=".03"/></svg></body>');
  } else {
    console.log(JSON.stringify({
      linkki: { w: e(gl.w, EM), h: e(gl.h + yla(gl, 1), EM), puoli: e(gl.r.cx, EM), yv: e(YV, EM), svg: svg(LINKKI, PISTE, 'orengas', 1) },
      ots: { w: e(go.w, OEM), h: e(go.h, OEM), ala: e(ONAPA - OTS.kork / 2, OEM), svg: svg(OTS, OPISTE, 'orengas') } }, null, 1));
  }
}
module.exports = { o, svg, f, LINKKI, PISTE, OTS, OPISTE, EM, CAP, ALA, YV };
