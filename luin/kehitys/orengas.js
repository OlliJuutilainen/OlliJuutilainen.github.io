// Ö-mapin ö:n mappirengas. Tuottaa luin.html:n #om-linkin renkaan ja nuolen kärjen sekä otsikon OTS_OMAPPI-renkaan ja niiden CSS-mitat:
//   node luin/kehitys/orengas.js            JSON (svg:t ja mitat em:inä)
//   node luin/kehitys/orengas.js --kuva     esikatselusivu suurennettuna (stdout, html)
// Rengas on viiva, jolla on keskilinja ja paksuus. Keskilinja on superellipsi: alapuolisko eksponentilla nAla (> 2, joten pohja on
// litteä ja linkin alleviivaus jatkuu siitä oikealle), yläpuolisko ellipsi. Paksuus on pohjassa alleviivauksen paksuinen, suurin
// kyljissä hiukan keskikohdan alapuolella (kulma kMax pohjasta) ja kapenee siitä portaattomasti laen raon reunaan hiusviivaksi
// (käyttäjän linjaus: ei viistettä, klassisemman kirjasimen tuntu). Ö:n pisteet ovat saman muodon pienempiä renkaita.
const f = x => { const s = (Math.round(x * 100) / 100 + ''); return s.replace(/^0\./, '.').replace(/^-0\./, '-.'); };
const sstep = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
// p: lev (ulkoleveys), kork (ulkokorkeus, litteästä pohjasta keskilinjan lakeen + puolet lakipaksuudesta), nAla, tb (pohja),
// ts (suurin), tt (laen laskennallinen paksuus: keskilinjan korkeus), kTasa (pohjan tasapaksu osa, astetta), kMax, rako (keskilinjan
// pään väli laella), kap (kapenemisen eksponentti), paa (pään paksuus).
function rengas(p, x0, y0) {
  const N = 2000, dt = 2 * Math.PI / N, kul = d => d * Math.PI / 180;
  // Keskilinjan puoliakselit: ulkoleveyden puolikas kyljen paksuuden puolikkaalla vähennettynä, korkeus pohjan ja laen paksuuksilla.
  const a = p.lev / 2 - p.ts / 2, b = (p.kork - p.tb / 2 - p.tt / 2) / 2, cx = x0 + p.lev / 2, cy = y0 + p.kork - p.tb / 2 - b;
  const kp = t => { const s = Math.sin(t), c = Math.cos(t), n = Math.abs(t) <= Math.PI / 2 ? p.nAla : 2;
    return [cx + a * Math.sign(s) * Math.abs(s) ** (2 / n), cy + b * Math.sign(c) * Math.abs(c) ** (2 / n)]; };
  // Pää: keskilinja päättyy, kun sen etäisyys pystyakselista on rako/2. Paksuus kapenee portaattomasti suurimmasta (kMax) päähän:
  // cos-käyrä, joten kapeneminen alkaa pehmeästi ja viiva ohenee hiusviivaksi (ei viistettä).
  let loppu = Math.PI; for (let t = Math.PI / 2; t <= Math.PI; t += dt / 8) if (Math.abs(kp(t)[0] - cx) <= p.rako / 2) { loppu = t; break; }
  const w = t => { const u = Math.abs(t); if (u <= kul(p.kMax)) return p.tb + (p.ts - p.tb) * sstep((u - kul(p.kTasa)) / (kul(p.kMax) - kul(p.kTasa)));
    const s = Math.min(1, (u - kul(p.kMax)) / (loppu - kul(p.kMax))); return p.paa + (p.ts - p.paa) * Math.cos(s * Math.PI / 2) ** p.kap; };
  const ulko = [], sisa = [];
  for (let i = 0; i <= N; i++) {
    const t = -Math.PI + i * dt, q = kp(t), e = kp(t - dt / 4), j = kp(t + dt / 4);
    let tx = j[0] - e[0], ty = j[1] - e[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty, ny = tx, h = w(t) / 2; // t kasvaa vastapäivään ruudulla (y alas): normaali (-ty, tx) osoittaa ulos.
    ulko.push([q[0] + nx * h, q[1] + ny * h, t]); sisa.push([q[0] - nx * h, q[1] - ny * h, t]);
  }
  const u = ulko.filter(q => Math.abs(q[2]) <= loppu), s = sisa.filter(q => Math.abs(q[2]) <= loppu);
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
// Mitat px:einä linkin koossa (.64rem = 10,24 px). Laki versaalikorkeuden (7,36 px) yläpuolella .2 px (O:n ylitys), pohja
// alleviivauksen alareunassa ALA px perusviivan alla, pohjan paksuus 1 px kuten kellarilinkin reunaviiva.
const EM = 10.24, CAP = 7.36, ALA = 2.3, YLI = .2;
const LINKKI = { lev: 9.4, kork: CAP + YLI + ALA, nAla: 2.15, tb: 1, ts: 1.3, tt: .55, kTasa: 12, kMax: 78, rako: 1.35, kap: 1, paa: .04, n: 30 };
// Pisteet ovat renkaan pienoiskopioita (käyttäjän linjaus: synkassa emo-ö:n kanssa): sama muoto hiukan matalampana, kehä suhteessa
// paksumpi (käyttäjän linjaus; reikä näkyy vielä 2×-tiheydellä), rako suhteessa pienempi.
const PISTE = { lev: 2.9, kork: 2.85, nAla: 2.15, tb: .56, ts: .72, tt: .28, kTasa: 12, kMax: 78, rako: .32, kap: 1, paa: .03, pnosto: 1.05, pdx: 2.45, n: 16 };
// Otsikon ö (.74rem = 11,84 px; käyttäjän linjaus: otsikko *Mappi ö*, rengas kirjaimena, isompi kuin versaali-O mutta tunnistettavasti
// osa tekstiä, ei kammen kokoinen): runko OKERT kertaa versaali-O (OCAP + 2 · .15 px), ja alakaaren sisäreuna on .6 px
// perusviivan alla (pohja pohjan viivan paksuus + .6 px perusviivan alla).
const OEM = 11.84, OCAP = 8.51, OKERT = 1.43, OK = OKERT * (OCAP + .3) / LINKKI.kork, OALA = LINKKI.tb * OK + .6;
const skaalaa = (p, k) => Object.fromEntries(Object.entries(p).map(([x, v]) => [x, /^(n|nAla|kTasa|kMax)$/.test(x) ? v : v * k]));
const OTS = skaalaa(LINKKI, OK), OPISTE = skaalaa(PISTE, OK);
// Ö-mappiin-linkin nuolen kärki (käyttäjän linjaus: huolellinen, klassinen): täytetty muoto, kärki (0,0) ja varsi eli alleviivaus (1 px)
// vasemmalta. Varren pää on x = -t (linkin oikea reuna), joten kärki on t px sen yli. Ulkoreunat suorahkot kärjestä sakaran päähän
// (-L, ±H), sisäreunat kaartuvat sakaran päästä takaisin varren reunaan r px varren päästä; sakaran pää on terävä (hiusviiva).
// a0, aE: ulkoreunan suunta kärjessä ja päässä (astetta), k0, kE, ki: kaarten ohjauspisteiden osuudet.
const NUOLI = { t: .9, r: 1.6, L: 4.4, H: 2.5, a0: 29, aE: 29, k0: .33, kE: .33, ki: .3 };
function karki(q) {
  const rad = d => d * Math.PI / 180, T = [0, 0], E = [-q.L, -q.H], R = [-q.t - q.r, -.5];
  const d0 = [-Math.cos(rad(q.a0)), -Math.sin(rad(q.a0))], dE = [-Math.cos(rad(q.aE)), -Math.sin(rad(q.aE))];
  const len = Math.hypot(E[0], E[1]), lenI = Math.hypot(E[0] - R[0], E[1] - R[1]);
  const c1 = [d0[0] * len * q.k0, d0[1] * len * q.k0], c2 = [E[0] - dE[0] * len * q.kE, E[1] - dE[1] * len * q.kE];
  const c3 = [E[0] - dE[0] * lenI * q.kE * .8, E[1] - dE[1] * lenI * q.kE * .8], c4 = [R[0] - lenI * q.ki, R[1]];
  const m = p => [p[0], -p[1]], P = p => f(p[0]) + ' ' + f(p[1]);
  return 'M' + P(T) + 'C' + P(c1) + ' ' + P(c2) + ' ' + P(E) + 'C' + P(c3) + ' ' + P(c4) + ' ' + P(R) + 'L' + P(m(R)) +
    'C' + P(m(c4)) + ' ' + P(m(c3)) + ' ' + P(m(E)) + 'C' + P(m(c2)) + ' ' + P(m(c1)) + ' ' + P(T) + 'Z';
}
// Svg 9 px korkea ja keskellä alleviivausta (bottom -5px): reunat ovat kokonaisten pikselien päässä reunaviivan reunoista, joten pyöristys
// ei siirrä kärkeä viivan sivuun (8 px:n svg puolen pikselin päässä siirtyi; mitattu 1×, 2× ja 3×).
const nuoliSvg = q => { const w = Math.ceil(q.L + 1); return { w, svg: '<svg class="nuoli" viewBox="' + -w + ' -4.5 ' + w + ' 9" aria-hidden="true"><path d="' + karki(q) + '"/></svg>' }; };
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
      nuoli: Object.assign(nuoliSvg(NUOLI), { t: NUOLI.t }),
      linkki: { w: e(gl.w, EM), h: e(gl.h + yla(gl, 1), EM), puoli: e(gl.r.cx, EM), svg: svg(LINKKI, PISTE, 'orengas', 1) },
      ots: { w: e(go.w, OEM), h: e(go.h, OEM), ala: e(-OALA, OEM), svg: svg(OTS, OPISTE, 'orengas') } }, null, 1));
  }
}
module.exports = { OCAP, OALA, o, svg, f, karki, nuoliSvg, NUOLI, LINKKI, PISTE, OTS, OPISTE, EM, CAP, ALA };
