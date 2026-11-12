// Postihuilun kuvio luin.html:ään (käyttäjän valinnat 12.11.2026, docs/mietintamyssy/luin-postihuilu-kuvitus*.md):
// lukulistan otsikon alle lyhyt huilu, jonka tuutista lähtee kulmikas nelilinja (kaista 15 px), ja huilutetun tekstin
// merkiksi sama huilu vinossa pystyssä 68° vaakatasosta, nokka ylhäällä oikealla.
// Säännöt (käyttäjä): reiät ovat reikiä, eivät koskaan ylitä putken reunaviivoja; reiät ovat pitkittäin putken suuntaan
// ketjuna, jossa salmiakkien kärjet menevät hiukan lomittain; ikkuna on reikien värinen (ei ruostetta: ruoste = napautettava);
// suu on symmetrinen.
// Käyttö: node luin/kehitys/postihuilu-kuvio.js [--tarkista]
// Tulostaa kaistan SVG:n (luin.html, .huilukaista) ja huilun (luin.html, HUILUTETTU). Liitä ne luin.html:ään.
'use strict';

function f(n) { return Math.round(n * 100) / 100; }
// Sama kovera salmiakki kuin luin.html:n sal().
function sal(cx, cy, rx, ry, c) {
  c = c == null ? 0.38 : c;
  var P = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]], d = 'M' + f(P[0][0]) + ' ' + f(P[0][1]);
  for (var i = 0; i < 4; i++) {
    var a = P[i], b = P[(i + 1) % 4];
    d += 'Q' + f(cx + (a[0] + b[0] - 2 * cx) * c) + ' ' + f(cy + (a[1] + b[1] - 2 * cy) * c) + ' ' + f(b[0]) + ' ' + f(b[1]);
  }
  return d + 'Z';
}

// Huilu: nokka origossa, akseli +x, kello x = L, keskiviiva y = 0.
function huilu(L, T, o) {
  o = o || {};
  var sw = o.sw || 1.1, k = o.k || .8, vari = o.vari || 'currentColor', h = T / 2, bk = T * .82;
  var px = T * .107, py = T * .286, cy = T * .25, ky = T * .107;
  var runko = 'M' + f(L) + ' ' + f(-h) + 'H' + f(bk) + 'L' + f(px) + ' ' + f(-py) + 'Q0 ' + f(-cy) + ' 0 ' + f(-ky) + 'V' + f(ky) +
    'Q0 ' + f(cy) + ' ' + f(px) + ' ' + f(py) + 'L' + f(bk) + ' ' + f(h) + 'H' + f(L) + 'Z';
  var x1 = bk + T * .1, w = T * .45, d = T * .34;
  var ikkuna = 'M' + f(x1) + ' ' + f(-h) + 'H' + f(x1 + w) + 'L' + f(x1 + w * .65) + ' ' + f(-h + d) + 'H' + f(x1) + 'Z';
  // Reiät: pitkä akseli putken suuntaan (A), poikittain B = 0,74 A, ja A on osuus k putken sisäkorkeuden puolikkaasta,
  // joten poikittainen B jää reilusti reunasta. Väli 1,8 A: kärjet menevät lomittain 0,2 A.
  var sisa = h - sw / 2, A = sisa * k, B = A * .74, vali = A * 1.8;
  var a0 = x1 + w + T * .15, b0 = L - T * .35, keski = (a0 + b0) / 2, xs = [keski - vali, keski, keski + vali];
  var reiat = xs.map(function (x) { return sal(x, 0, A, B, .38); }).join('');
  return {
    sw: sw,
    tarkistus: { A: A, B: B, sisa: sisa, xs: xs, alku: a0, loppu: b0, lomitus: 2 * A - vali, ikkunaLoppu: x1 + w },
    svg: '<path d="' + runko + '" fill="none" stroke="' + vari + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="' + ikkuna + reiat + '" fill="' + vari + '"/>'
  };
}

function kierra(p, th) { var c = Math.cos(th), s = Math.sin(th); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
// Vino huilu: kulma vaakatasosta, nokka ylhäällä oikealla.
function vino(kulma, L, T, o) {
  var th = (180 - kulma) * Math.PI / 180, hu = huilu(L, T, o), h = T / 2, pad = hu.sw;
  var pts = [[0, -h], [0, h], [L, -h], [L, h]].map(function (p) { return kierra(p, th); });
  var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(0, xs) - pad, y0 = Math.min.apply(0, ys) - pad;
  var lw = Math.max.apply(0, xs) + pad - x0, lh = Math.max.apply(0, ys) + pad - y0;
  return { suhde: lw / lh, svg: '<svg class="huilutettu" viewBox="' + f(x0) + ' ' + f(y0) + ' ' + f(lw) + ' ' + f(lh) + '" role="img" aria-label="Postihuilusta">' +
    '<g transform="rotate(' + f(180 - kulma) + ')">' + hu.svg + '</g></svg>' };
}

// Kaista: lyhyt huilu (paksuus 5 px, pituus 4 ×) ja kellosta kulmikas nelilinja, joka levenee kellon sisältä täyteen väliin.
// Mitat CSS-pikseleinä (ei viewBoxia), joten mikään ei veny; viivat piirretään 640 px:iin, ja SVG leikkaa ne
// lukulistan leveyteen (enintään 40rem − 32 px).
function kaista() {
  var T = 5, sw = 1, L = T * 4, n = 4, sp = 2.4, amp = .8, jakso = 22, levea = L * 1.4, alku = T / 2 - sw - .3, loppu = 640;
  var H = Math.ceil(Math.max(T, (n - 1) * sp + sp * 1.06 + amp * 2) + sw + 2), cy = H / 2, x0 = .5 + L;
  function e(s) { var t = Math.max(0, Math.min(1, s / levea)); return t * t * (3 - 2 * t); }
  function aalto(s) { var q = (s % jakso) / jakso; return amp * (q < .5 ? -1 + 4 * q : 3 - 4 * q); }
  function y(s, p) {
    var taysi = ((n - 1) / 2 - p) * sp, al = ((n - 1) / 2 - p) * (2 * alku / (n - 1)), t = e(s);
    return cy + al + (taysi - al) * t + aalto(s) * t;
  }
  // Levenemisen aikana tiheä näyte, sen jälkeen vain siksakin taitteet (viivat ovat niiden välillä suoria).
  var ss = [];
  for (var s = 0; s <= levea; s += .5) ss.push(s);
  for (var v = Math.ceil(levea / (jakso / 2)) * jakso / 2; x0 + v < loppu; v += jakso / 2) ss.push(v);
  ss.push(loppu - x0);
  var d = '';
  for (var i = 0; i < n; i++) d += 'M' + ss.map(function (s) { return f(x0 + s) + ' ' + f(y(s, i)); }).join('L');
  var nuotit = [[2.1, 0], [3.2, 1], [4.3, 1.5], [5.4, 2.5], [6.5, 3]].map(function (q) {
    var s = L * q[0]; return sal(x0 + s, y(s, q[1]), sp * .5, sp * .53, .42);
  }).join('');
  return { korkeus: H, svg: '<svg class="huilukaista" width="100%" height="' + H + '" aria-hidden="true">' +
    '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width=".75" stroke-linejoin="miter"/>' +
    '<path d="' + nuotit + '" fill="currentColor"/>' +
    '<g transform="translate(.5 ' + cy + ')">' + huilu(L, T, { sw: sw }).svg + '</g></svg>' };
}

function tarkista(L, T, sw, k) {
  var c = huilu(L, T, { sw: sw, k: k }).tarkistus, vika = [];
  if (c.B >= c.sisa) vika.push('reuna');
  if (c.xs[0] - c.A < c.ikkunaLoppu) vika.push('ikkuna');
  if (c.xs[0] - c.A < c.alku - 1e-9 || c.xs[2] + c.A > c.loppu + 1e-9) vika.push('ketju ei mahdu');
  if (c.lomitus <= 0) vika.push('ei lomitu');
  return 'L ' + L + ', T ' + T + ': reiän ja reunan väli ' + f(c.sisa - c.B) + ', lomitus ' + f(c.lomitus) +
    ', vara alussa ' + f(c.xs[0] - c.A - c.alku) + (vika.length ? ' VIKA ' + vika.join(', ') : ' ok');
}

if (require.main === module) {
  if (process.argv.includes('--tarkista')) {
    console.log(tarkista(20, 5, 1, .8));
    console.log(tarkista(25.6, 6.4, 1.1, .8));
    console.log(tarkista(32, 8, 1.1, .8));
  } else {
    var k = kaista(), v = vino(68, 25.6, 6.4, {});
    console.log('// kaista, korkeus ' + k.korkeus + ' px\n' + k.svg + '\n\n// HUILUTETTU, leveys/korkeus ' + f(v.suhde) + '\n' + v.svg);
  }
}
module.exports = { huilu: huilu, vino: vino, kaista: kaista, sal: sal };
