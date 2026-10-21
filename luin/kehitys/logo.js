// LUiN.html-logon generaattori. Ajo: node luin/kehitys/logo.js → tulostaa SVG:n, joka on
// kopioitu sellaisenaan luin.html:ään ja luin/latomo.html:ään.
// Yksikkö: ylärivin versaalikorkeus 100 (perusviiva y = 100). Paksu runko T = 15, hiusviiva t = 3,4.
// i:n piste ja loppupiste ovat salmiakkeja (c < 0,5 = kyljet hieman koverat). Hiusviiva kulkee
// pisteestä päätepisteeseen ja leikkaa N:n vinoviivan noin 61 %:n korkeudella; tiiviillä N:llä
// vinoviiva on niin jyrkkä, ettei sama suora voi kulkea sitä pitkin (piste nousisi y ≈ −140:een).
// Alarivi HTML on ohut (2,1) ja levitetty ylärivin levyiseksi.
const t = 3.4, T = 15;
const f = n => +n.toFixed(2);
function rect(x0, y0, x1, y1) { return `M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`; }
function poly(pts) { return 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z'; }
function dia(cx, cy, rx, ry, c = 0.5) {
  // c = 0.5 suora salmiakki; < 0.5 koverat kyljet
  const q = (ax, ay, bx, by) => `Q${f(cx + (ax + bx - 2*cx) * c)} ${f(cy + (ay + by - 2*cy) * c)} ${f(bx)} ${f(by)}`;
  const N = [cx, cy - ry], E = [cx + rx, cy], S_ = [cx, cy + ry], W = [cx - rx, cy];
  return `M${f(N[0])} ${f(N[1])}` + q(...N, ...E) + q(...E, ...S_) + q(...S_, ...W) + q(...W, ...N) + 'Z';
}
function logo(o = {}) {
  const xh = o.xh ?? 30;           // i:n x-korkeuden yläreuna
  const yd = o.yd ?? 12;           // i:n pisteen keskikohta
  const per = o.per ?? [205, 93];  // loppupisteen keskikohta
  const c = o.c ?? 0.38;
  let P = [];
  // L
  P.push(rect(7, 0, 22, 100), rect(0, 0, 29, t), rect(0, 100 - 4.5, 47, 100), rect(43.8, 76, 47.2, 100));
  // U
  P.push('M62 0V66C62 90 70.5 101.5 81.5 101.5C93 101.5 100 91 100 72V0H96.6V72C96.6 87.5 90.5 96.5 83 96.5C80 96.5 77 93 77 84V0Z');
  P.push(rect(55, 0, 84, t), rect(90, 0, 106.6, t));
  // i
  P.push(rect(118, xh, 133, 100), rect(111, xh, 133, xh + t), rect(111, 100 - t, 140, 100));
  // N
  P.push(poly([[152, 0], [167.5, 0], [190, 100], [174.5, 100]]));
  P.push(rect(152, 0, 155.4, 100), rect(186.6, 0, 190, 100));
  P.push(rect(145, 0, 160, t), rect(180, 0, 196.6, t), rect(145.5, 100 - t, 162, 100));
  const dot = [125.5, yd];
  const W = per[0] + 6.5;
  // HTML
  const y0 = o.hy ?? 117, y1 = y0 + (o.hh ?? 18), sw = o.sw ?? 2.1, ser = 2.6;
  const widths = [13, 13, 17, 11], tot = widths.reduce((a, b) => a + b, 0), gap = (W - tot) / 3;
  let x = 0; const xs = widths.map(w => { const r = x; x += w + gap; return r; });
  const st = [];
  const ln = (x0, y0_, x1, y1_) => st.push(`M${f(x0)} ${f(y0_)}L${f(x1)} ${f(y1_)}`);
  const sw2 = sw / 2;
  // H
  let a = xs[0]; ln(a + sw2, y0, a + sw2, y1); ln(a + 13 - sw2, y0, a + 13 - sw2, y1); ln(a + sw2, (y0 + y1) / 2, a + 13 - sw2, (y0 + y1) / 2);
  // T
  a = xs[1]; ln(a, y0 + sw2, a + 13, y0 + sw2); ln(a + 6.5, y0, a + 6.5, y1);
  // M
  a = xs[2]; ln(a + sw2, y1, a + sw2, y0); ln(a + sw2, y0, a + 8.5, y1); ln(a + 8.5, y1, a + 17 - sw2, y0); ln(a + 17 - sw2, y0, a + 17 - sw2, y1);
  // L
  a = xs[3]; ln(a + sw2, y0, a + sw2, y1 - sw2); ln(a + sw2, y1 - sw2, a + 11, y1 - sw2);
  const serifs = [];
  const hs = (cx, y, w) => serifs.push(rect(cx - w, y - 0.75, cx + w, y + 0.75));
  // pikkupäätteet
  a = xs[0]; [a + sw2, a + 13 - sw2].forEach(cx => { hs(cx, y0 + 0.75, ser); hs(cx, y1 - 0.75, ser); });
  a = xs[1]; hs(a + 6.5, y1 - 0.75, ser);
  a = xs[2]; [a + sw2, a + 17 - sw2].forEach(cx => hs(cx, y1 - 0.75, ser));
  a = xs[3]; hs(a + sw2, y0 + 0.75, ser);
  const lineCol = o.lineCol || 'currentColor';
  const H = y1;
  return `<svg class="logo" viewBox="-2 ${f(Math.min(yd - 10, -2))} ${f(W + 4)} ${f(H - Math.min(yd - 10, -2) + 1)}" role="img" aria-label="LUiN.html">` +
    `<path d="${P.join('')}"/>` +
    `<path d="M${f(dot[0])} ${f(dot[1])}L${f(per[0])} ${f(per[1])}" stroke="${lineCol}" stroke-width="${o.lw ?? 1.8}" fill="none"/>` +
    `<path fill="var(--ruoste)" d="${dia(dot[0], dot[1], 7.5, 8.5, c)}${dia(per[0], per[1], 6.5, 7.5, c)}"/>` +
    `<path d="${st.join('')}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="butt"/>` +
    `<path d="${serifs.join('')}"/>` +
    `</svg>`;
};

module.exports = logo;
if (require.main === module) console.log(logo());
