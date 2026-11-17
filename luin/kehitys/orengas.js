// Ö-mappien mapin ö:n mappirengas (käyttäjän pyynnöt 17.11.2026). Tuottaa luin.html:n #om-linkin renkaat ja otsikon
// OTS_OMAPPI-renkaat sekä niiden CSS-mitat:  node luin/kehitys/orengas.js
const f = x => (Math.round(x * 1000) / 1000 + '').replace(/^0\./, '.').replace(/^-0\./, '-.');
function soikio(cx, cy, rx, ry) {
  return 'M' + f(cx) + ' ' + f(cy + ry) + 'A' + f(rx) + ' ' + f(ry) + ' 0 1 1 ' + f(cx) + ' ' + f(cy - ry) +
    'A' + f(rx) + ' ' + f(ry) + ' 0 1 1 ' + f(cx) + ' ' + f(cy + ry) + 'Z';
}
// Rengas: ulkosoikio (rx, ry), viivan paksuus kyljissä ts, ylhäällä tt, alhaalla tb. Rako ylhäällä: ulkoreunojen väli go, sisäreunojen gi.
function rengas(cx, cy, rx, ry, ts, tt, tb, go, gi) {
  const rxi = rx - ts, ryi = ry - (tt + tb) / 2, cyi = cy + (tt - tb) / 2;
  const ao = go / 2, ai = gi / 2;
  const po = [ao, cy - ry * Math.sqrt(1 - (ao / rx) ** 2)], pi = [ai, cyi - ryi * Math.sqrt(1 - (ai / rxi) ** 2)];
  const d = [pi[0] - po[0], pi[1] - po[1]], kt = -po[0] / d[0], ylaY = po[1] + d[1] * kt, ala = [po[0] + d[0] * 3, po[1] + d[1] * 3];
  return { polku: soikio(cx, cy, rx, ry) + soikio(cx, cyi, rxi, ryi),
    lovi: 'M' + f(cx) + ' ' + f(ylaY) + 'L' + f(cx + ala[0]) + ' ' + f(ala[1]) + 'L' + f(cx - ala[0]) + ' ' + f(ala[1]) + 'Z' };
}
// p: ry (renkaan ulkosäde pystyyn), lit (rx/ry), ts, tt, tb, go, gi; pisteet: pry, plit, pts, ptt, ptb, pgo, pgi, pdx (keskeltä), pnosto (rako renkaan lakeen).
function o(p) {
  const rx = p.ry * p.lit, prx = p.pry * p.plit;
  const pcy = p.pry + 0.0, cy = pcy + p.pry + p.pnosto + p.ry, h = cy + p.ry, w = 2 * rx, cx = rx;
  const r = rengas(cx, cy, rx, p.ry, p.ts, p.tt, p.tb, p.go, p.gi);
  const p1 = rengas(cx - p.pdx, pcy, prx, p.pry, p.pts, p.ptt, p.ptb, p.pgo, p.pgi), p2 = rengas(cx + p.pdx, pcy, prx, p.pry, p.pts, p.ptt, p.ptb, p.pgo, p.pgi);
  return { w, h, cx, cy, leik: 'M-20 -20H' + f(w + 20) + 'V' + f(h + 20) + 'H-20Z' + r.lovi + p1.lovi + p2.lovi, polku: r.polku + p1.polku + p2.polku };
}
function svg(p, luokka, id) {
  const g = o(p);
  return '<svg class="' + luokka + '" viewBox="0 0 ' + f(g.w) + ' ' + f(g.h) + '" aria-hidden="true"><clipPath id="' + id + '" clipPathUnits="userSpaceOnUse"><path clip-rule="evenodd" d="' +
    g.leik + '"/></clipPath><path clip-path="url(#' + id + ')" fill-rule="evenodd" d="' + g.polku + '"/></svg>';
}
const R = { o, svg, f }, EM = 11.84, e = x => R.f(x / EM) + 'em';
const LINKKI = { ry: 7.86, lit: .85, ts: 1.8, tt: 1.3, tb: 1, go: 1.6, gi: 3.4, pry: 2.4, plit: .85, pts: .85, ptt: .7, ptb: .7, pgo: .45, pgi: .9, pnosto: 1.6 };
LINKKI.pdx = LINKKI.ry * LINKKI.lit * .46;
const OTS = { ry: 4.65, lit: .85, ts: 1.45, tt: 1.05, tb: .9, go: 1.1, gi: 2.3, pry: 1.75, plit: .85, pts: .7, ptt: .6, ptb: .6, pgo: .35, pgi: .7, pnosto: 1.2 };
OTS.pdx = OTS.ry * OTS.lit * .46;
const gl = R.o(LINKKI), go = R.o(OTS);
console.log(JSON.stringify({
  linkki: { w: e(gl.w), h: e(gl.h), cx: e(gl.cx), vas: R.svg(LINKKI, 'orengas vas', 'orengas-leikkaus-1'), oik: R.svg(LINKKI, 'orengas oik', 'orengas-leikkaus-2') },
  ots: { w: e(go.w), h: e(go.h), ry: e(OTS.ry), vas: R.svg(OTS, 'orengas', 'ots-orengas-1'), oik: R.svg(OTS, 'orengas', 'ots-orengas-2') } }, null, 1));
