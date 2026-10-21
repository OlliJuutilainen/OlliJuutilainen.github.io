// LUiN.html-logon generaattori. Ajo: node luin/kehitys/logo.js → tulostaa SVG:n, joka on
// kopioitu sellaisenaan luin.html:ään ja luin/latomo.html:ään.
// Yksikkö: ylärivin versaalikorkeus 100 (perusviiva y = 100). Paksu runko T = 15, hiusviiva t = 3,4.
// i:n piste ja loppupiste ovat salmiakkeja (c < 0,5 = kyljet hieman koverat). Hiusviiva kulkee
// pisteestä päätepisteeseen ja leikkaa N:n vinoviivan noin 61 %:n korkeudella; tiiviillä N:llä
// vinoviiva on niin jyrkkä, ettei sama suora voi kulkea sitä pitkin (piste nousisi y ≈ −140:een).
// i:n piste on ruosteinen, loppupiste tekstin värinen. Alarivi HTML on ohut (2,5) ja levitetty
// L:n vasemmasta reunasta N:n oikeaan reunaan.
const t = 3.4, T = 15;
const f = n => +n.toFixed(2);
function rect(x0, y0, x1, y1) { return `M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`; }
function poly(pts) { return 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z'; }
function dia(cx, cy, rx, ry, c = 0.5) {
  // c = 0.5 suora salmiakki; < 0.5 koverat kyljet. Taulukkona särmittäin: [NE, ES, SW, WN].
  const cs = Array.isArray(c) ? c : [c, c, c, c];
  const q = (k, ax, ay, bx, by) => `Q${f(cx + (ax + bx - 2*cx) * cs[k])} ${f(cy + (ay + by - 2*cy) * cs[k])} ${f(bx)} ${f(by)}`;
  const N = [cx, cy - ry], E = [cx + rx, cy], S_ = [cx, cy + ry], W = [cx - rx, cy];
  return `M${f(N[0])} ${f(N[1])}` + q(0, ...N, ...E) + q(1, ...E, ...S_) + q(2, ...S_, ...W) + q(3, ...W, ...N) + 'Z';
}
// Kahden suoran leikkaus: p + t·d ja q + u·e
function leik(p, d, q, e) {
  const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / (d[0] * e[1] - d[1] * e[0]);
  return [p[0] + t * d[0], p[1] + t * d[1]];
}
// Glissando: viiva lähtee i:n pisteen oikeasta kulmasta ja päättyy loppupisteen vasempaan kulmaan.
// i:n pisteen oikea yläsärmä ja loppupisteen vasen alasärmä ovat suoria ja viivan kaltevia, joten
// viivan yläreuna jatkaa edellistä ja alareuna jälkimmäistä ilman porrasta. Kaltevuus s ratkaistaan:
// joko i:n pisteen yläkärki (yla, oletus 0) tai keskikohta (yd) annetaan ja s haetaan, tai s annetaan ja korkeus lasketaan.
function glis(o) {
  const cx = 125.5, rx = o.drx ?? 7.5, prx = o.prx ?? 6.5, pb = o.pb ?? 100.5, px = o.px ?? 212, w = o.lw ?? 1.8;
  const E = cy => [cx + rx, cy];
  // py: loppupisteen keskikohdan (ja sivukärkien) korkeus; oletuksena alareuna pb:ssä
  const Wp = s => [px - prx, o.py ?? pb - s * prx];
  // yla: i:n pisteen yläkärjen korkeus (oletus 0 = versaalien lakipiste); silloin keskikohta = yla + s·rx
  const yla = o.yd != null ? null : (o.yla ?? 0);
  let s = o.s, cy = o.yd ?? 12;
  if (s != null) {
    const W = Wp(s); cy = W[1] - s * (W[0] - cx - rx) - w * Math.hypot(1, s);
  } else {
    const g = s_ => { const W = Wp(s_), cy_ = yla == null ? cy : yla + s_ * rx; return ((W[0] - cx - rx) * -s_ + (W[1] - cy_)) / Math.hypot(1, s_) - w; };
    let a = 0.3, b = 3; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; (g(a) * g(m) <= 0) ? b = m : a = m; }
    s = (a + b) / 2;
    if (yla != null) cy = yla + s * rx;
  }
  const ry = s * rx, pry = s * prx, py = o.py ?? pb - pry, c = o.c ?? 0.38;
  const e = E(cy), W = Wp(s), d = [1, s], nn = Math.hypot(1, s), n = [-s / nn * w, 1 / nn * w];
  // viivan alku: alareuna leikkaa i:n pisteen ES-särmän tangentin kulmassa E
  const qES = [cx + rx * c, cy + ry * c];
  const cLo = leik([e[0] + n[0], e[1] + n[1]], d, e, [qES[0] - e[0], qES[1] - e[1]]);
  // viivan loppu: yläreuna leikkaa loppupisteen WN-särmän tangentin kulmassa W
  const qWN = [px - prx * c, py - pry * c];
  const pUp = leik(e, d, W, [qWN[0] - W[0], qWN[1] - W[1]]);
  return {
    s, cy, ry, py, W: px + prx,
    piste: dia(cx, cy, rx, ry, [0.5, c, c, c]),
    loppu: dia(px, py, prx, pry, [c, c, 0.5, c]),
    viiva: poly([e, pUp, [px, py], W, cLo, [cx, cy]]),
  };
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
  const G = (o.glis ?? true) ? glis(o) : null; // glis: false = vanha keskeltä keskelle -viiva
  const W = G ? G.W : per[0] + 6.5;
  // HTML: musteen vasen reuna on L:n vasemmassa reunassa (x 0) ja oikea N:n oikean päätteen
  // reunassa (196,6), ei loppupisteen alla. Ääripäinä H:n vasemmat päätteet ja L:n alaviivan
  // pystypääte (kuten ylärivin L:ssä).
  const y0 = o.hy ?? 112, y1 = y0 + (o.hh ?? 18), sw = o.sw ?? 2.5, ser = 2.6, sp = 1.5;
  const sw2 = sw / 2, X0 = 0, X1 = 196.6;
  const widths = [13, 13, 17, 11];
  const a0 = X0 + ser - sw2, aL = X1 - widths[3];
  const gap = (aL - a0 - widths[0] - widths[1] - widths[2]) / 3;
  const xs = [a0, a0 + widths[0] + gap, a0 + widths[0] + widths[1] + 2 * gap, aL];
  const st = [];
  const ln = (x0, y0_, x1, y1_) => st.push(`M${f(x0)} ${f(y0_)}L${f(x1)} ${f(y1_)}`);
  // H
  let a = xs[0]; ln(a + sw2, y0, a + sw2, y1); ln(a + 13 - sw2, y0, a + 13 - sw2, y1); ln(a + sw2, (y0 + y1) / 2, a + 13 - sw2, (y0 + y1) / 2);
  // T
  a = xs[1]; ln(a, y0 + sw2, a + 13, y0 + sw2); ln(a + 6.5, y0, a + 6.5, y1);
  // M
  a = xs[2]; ln(a + sw2, y1, a + sw2, y0); ln(a + sw2, y0, a + 8.5, y1); ln(a + 8.5, y1, a + 17 - sw2, y0); ln(a + 17 - sw2, y0, a + 17 - sw2, y1);
  // L
  a = xs[3]; ln(a + sw2, y0, a + sw2, y1); ln(a, y1 - sw2, X1, y1 - sw2);
  const serifs = [];
  const hs = (cx, y, w) => serifs.push(rect(cx - w, y - sp / 2, cx + w, y + sp / 2));
  // pikkupäätteet
  a = xs[0]; [a + sw2, a + 13 - sw2].forEach(cx => { hs(cx, y0 + sp / 2, ser); hs(cx, y1 - sp / 2, ser); });
  a = xs[1]; hs(a + 6.5, y1 - sp / 2, ser);
  a = xs[2]; [a + sw2, a + 17 - sw2].forEach(cx => hs(cx, y1 - sp / 2, ser));
  a = xs[3]; hs(a + sw2, y0 + sp / 2, ser);
  // L:n alaviivan pystypääte kuten ylärivin L:ssä; 24 % korkeudesta jäi alaviivan paksuuden
  // vuoksi lähes näkymättömäksi, joten pääte on 36 %
  serifs.push(rect(X1 - sp, y1 - 0.36 * (y1 - y0), X1, y1));
  const lineCol = o.lineCol || 'currentColor';
  const H = o.vb ?? 135; // viewBoxin alareuna pidetty ennallaan, jotta LUiN ei muuta kokoaan
  const top = Math.min((G ? G.cy - G.ry : yd) - 2, -2);
  const vb = `-2 ${f(top)} ${f(W + 4)} ${f(H - top + 1)}`;
  // HTML:n väri: oletuksena tekstin väri (käyttäjän valinta 21.10.2026), esim. o.htmlCol = 'var(--ruoste)'
  const hc = o.htmlCol ?? 'currentColor';
  const html = `<path d="${st.join('')}" fill="none" stroke="${hc}" stroke-width="${sw}" stroke-linecap="butt"/>` +
    `<path${hc === 'currentColor' ? '' : ` fill="${hc}"`} d="${serifs.join('')}"/>`;
  if (G) {
    // vari: 'piste' = i:n piste ruosteinen, muu musta; 'musta' = kaikki musta; 'ruoste' = piste, viiva ja loppupiste ruosteiset
    const v = o.vari ?? 'piste', R = ' fill="var(--ruoste)"';
    const vr = v === 'ruoste' ? R : '', pr = v === 'musta' ? '' : R;
    return `<svg class="logo" viewBox="${vb}" role="img" aria-label="LUiN.html">` +
      `<path d="${P.join('')}"/>` +
      `<path${vr} d="${G.viiva}"/><path${vr} d="${G.loppu}"/><path${pr} d="${G.piste}"/>` + html + `</svg>`;
  }
  return `<svg class="logo" viewBox="${vb}" role="img" aria-label="LUiN.html">` +
    `<path d="${P.join('')}${dia(per[0], per[1], 6.5, 7.5, c)}"/>` +
    `<path d="M${f(dot[0])} ${f(dot[1])}L${f(per[0])} ${f(per[1])}" stroke="${lineCol}" stroke-width="${o.lw ?? 1.8}" fill="none"/>` +
    `<path fill="var(--ruoste)" d="${dia(dot[0], dot[1], 7.5, 8.5, c)}"/>` +
    html + `</svg>`;
};

module.exports = logo;
logo.glis = glis;
if (require.main === module) console.log(logo());
