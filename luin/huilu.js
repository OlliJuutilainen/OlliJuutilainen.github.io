/* Postihuilun kuvio (käyttäjän valinnat ja säännöt 12.11.2026; ideointi docs/mietintamyssy/luin-postihuilu-kuvitus*).
   Yksi huilu, aina vinossa pystyssä (kulma 68° vaakatasosta, nokka ylhäällä oikealla), ei koskaan vaakatasossa:
   - hyllyn Postihuilu-otsikon oikealla puolella ja asetusten Postihuilu-osiossa, josta lähtee kulmikas nelilinja;
   - huilutetun (Postihuilun kautta kantautuneen) tekstin nimen perässä.
   Käyttäjän säännöt:
   - Sormireiät ovat koveria salmiakkeja Luinin logon mittasuhteissa (leveys/korkeus 0,767, kaarevuus 0,38), pitkittäin
     putken suuntaan. Sivukärjet yltävät juuri ja juuri reunaviivan sisäpintaan, reiät hipaisevat toisiaan kärjistään
     (eivät lomitu), ja alimman reiän alakärki yltää juuri ja juuri kellon pohjaviivan sisäpintaan. Reikä ei koskaan
     halkaise ihoa. Huilun pituus seuraa näistä.
   - Suu on symmetrinen. Ääniaukkoa ei ole (käyttäjä: poistetaan, ellei se näytä luontevalta).
   - Viivat ovat ohuita, mutta mittoja ei pienennetä niiden mukana. Viivasto lähtee viuhkana alimman reiän alakärjestä
     (ei valmiiksi levällään), kaartuu sileänä kaarena vaakasuoraksi ja jatkuu kulmikkaana, selvästi näkyvin taittein:
     vain alkuviuhka kaartuu (käyttäjä: "ikäänkuin aaltomuotojen loputtomuudesta kvantteihin tässä siirrytään").
   - Nuotit ilmestyvät vasta Soita huilua! -napin painalluksesta ja vain napin yläpuolelle; muodostelma on joka kerta
     uusi ja epäsäännöllinen (ei portaita).
   - Ei ruostetta (ruoste = napautettava).
   Mitat: huilu()-paikalliskoordinaateissa nokan kärki on origossa, akseli +x ja kello x = L. */
(function (g) {
  'use strict';
  var LOGO = 0.767;            // logon salmiakin leveys / korkeus (luin.html:n logo)
  var KAARI = 0.38;            // salmiakin kaarevuus (luin.html sal())
  function f(n) { return Math.round(n * 100) / 100; }
  function sal(cx, cy, rx, ry, c) {
    c = c == null ? KAARI : c;
    var P = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]], d = 'M' + f(P[0][0]) + ' ' + f(P[0][1]);
    for (var i = 0; i < 4; i++) {
      var a = P[i], b = P[(i + 1) % 4];
      d += 'Q' + f(cx + (a[0] + b[0] - 2 * cx) * c) + ' ' + f(cy + (a[1] + b[1] - 2 * cy) * c) + ' ' + f(b[0]) + ' ' + f(b[1]);
    }
    return d + 'Z';
  }

  // Huilun mitat paksuudesta T ja viivasta sw.
  function mitat(T, sw) {
    var h = T / 2, sisa = h - sw / 2, B = sisa, A = B / LOGO, bk = T * .82, ketjuAlku = bk + sisa * .9;
    var L = ketjuAlku + 6 * A + sw / 2;
    return { T: T, sw: sw, h: h, sisa: sisa, A: A, B: B, bk: bk, L: L, ketjuAlku: ketjuAlku,
      reiat: [ketjuAlku + A, ketjuAlku + 3 * A, ketjuAlku + 5 * A], karki: L - sw / 2 };
  }
  // Huilu paikalliskoordinaateissa (SVG-sisältö).
  function huilu(T, sw, vari) {
    var m = mitat(T, sw), h = m.h, L = m.L, bk = m.bk;
    vari = vari || 'currentColor';
    var px = T * .107, py = T * .286, cy = T * .25, ky = T * .107;
    var runko = 'M' + f(L) + ' ' + f(-h) + 'H' + f(bk) + 'L' + f(px) + ' ' + f(-py) + 'Q0 ' + f(-cy) + ' 0 ' + f(-ky) + 'V' + f(ky) +
      'Q0 ' + f(cy) + ' ' + f(px) + ' ' + f(py) + 'L' + f(bk) + ' ' + f(h) + 'H' + f(L) + 'Z';
    var reiat = m.reiat.map(function (x) { return sal(x, 0, m.A, m.B); }).join('');
    return '<path d="' + runko + '" fill="none" stroke="' + vari + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="' + reiat + '" fill="' + vari + '"/>';
  }
  function kierra(p, th) { var c = Math.cos(th), s = Math.sin(th); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  // Vinon huilun rajat nokan kärjen suhteen.
  function rajat(T, sw, kulma) {
    var m = mitat(T, sw), th = (180 - kulma) * Math.PI / 180, h = m.h, pad = sw / 2;
    var pts = [[0, -h], [0, h], [m.L, -h], [m.L, h]].map(function (p) { return kierra(p, th); });
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(0, xs) - pad, y0 = Math.min.apply(0, ys) - pad;
    return { x: x0, y: y0, w: Math.max.apply(0, xs) + pad - x0, h: Math.max.apply(0, ys) + pad - y0, th: th, m: m };
  }
  // Itsenäinen vino huilu (huilutetun tekstin merkki).
  function vino(o) {
    o = o || {};
    var T = o.T || 6.4, sw = o.sw || .9, kulma = o.kulma || 68, r = rajat(T, sw, kulma);
    return '<svg class="' + (o.luokka || 'huilu') + '" viewBox="' + f(r.x) + ' ' + f(r.y) + ' ' + f(r.w) + ' ' + f(r.h) + '"' +
      (o.nimi ? ' role="img" aria-label="' + o.nimi + '"' : ' aria-hidden="true"') + '>' +
      '<g transform="rotate(' + f(180 - kulma) + ')">' + huilu(T, sw) + '</g></svg>';
  }

  // Kaista: vino huilu ja sen kellosta kulmikas nelilinja oikeaan reunaan.
  // o: vasen (huilun vasen reuna), yla (huilun yläreuna), keskiY (viivaston keskilinja vaakaosuudella), oikea (viivojen loppu),
  //    T, sw (huilu), sp (viivaväli), vw (viivan paksuus), jakso, amp, kulma.
  // Viuhka: keskilinja on kuutiollinen Bézier kärjestä huilun suuntaan ja kaarena vaakasuoraksi; viivat ovat sen
  // normaalin suuntaisia siirtymiä, jotka kasvavat kärjen nollasta täyteen väliin kaaren matkalla (smoothstep).
  function kaista(o) {
    var T = o.T || 6, sw = o.sw || .75, kulma = o.kulma || 68, sp = o.sp || 4, n = 4, vw = o.vw || .6;
    var jakso = o.jakso || 30, amp = o.amp == null ? 2.4 : o.amp, r = rajat(T, sw, kulma), th = r.th;
    var nokka = [o.vasen - r.x, o.yla - r.y], d = [Math.cos(th), Math.sin(th)];
    var P0 = kierra([r.m.karki, 0], th); P0 = [nokka[0] + P0[0], nokka[1] + P0[1]];
    var pudotus = Math.max(sp * 2, o.keskiY - P0[1]);
    var E = [P0[0] + pudotus * .5, P0[1] + pudotus];
    var Q = [P0, [P0[0] + d[0] * pudotus * .55, P0[1] + d[1] * pudotus * .55], [E[0] - pudotus * .6, E[1]], E];
    var siirto = function (p) { return ((n - 1) / 2 - p) * sp; };
    var kaari = [], s = 0, ed = null, N = 40;
    for (var i = 0; i <= N; i++) {
      var t = i / N, u = 1 - t;
      var x = u * u * u * Q[0][0] + 3 * u * u * t * Q[1][0] + 3 * u * t * t * Q[2][0] + t * t * t * Q[3][0];
      var y = u * u * u * Q[0][1] + 3 * u * u * t * Q[1][1] + 3 * u * t * t * Q[2][1] + t * t * t * Q[3][1];
      var dx = 3 * u * u * (Q[1][0] - Q[0][0]) + 6 * u * t * (Q[2][0] - Q[1][0]) + 3 * t * t * (Q[3][0] - Q[2][0]);
      var dy = 3 * u * u * (Q[1][1] - Q[0][1]) + 6 * u * t * (Q[2][1] - Q[1][1]) + 3 * t * t * (Q[3][1] - Q[2][1]);
      var l = Math.hypot(dx, dy) || 1;
      if (ed) s += Math.hypot(x - ed[0], y - ed[1]);
      kaari.push({ x: x, y: y, nx: -dy / l, ny: dx / l, s: s }); ed = [x, y];
    }
    var S = s, xz = E[0] + sp;
    function tri(x) { // 0 alussa, taitteet jakson neljänneksissä
      if (x <= xz) return 0;
      var u = ((x - xz) / jakso) % 1;
      return amp * (u < .25 ? -4 * u : u < .75 ? -2 + 4 * u : 4 - 4 * u);
    }
    var taitteet = [];
    for (var xx = xz + jakso / 4; xx < o.oikea; xx += jakso / 2) taitteet.push(xx);
    var d2 = '';
    for (i = 0; i < n; i++) {
      var oi = siirto(i), pts = kaari.map(function (c) {
        var q = c.s / S, e = q * q * (3 - 2 * q);
        return [c.x + c.nx * oi * e, c.y + c.ny * oi * e];
      });
      var yi = E[1] + oi;
      pts.push([xz, yi]);
      taitteet.forEach(function (x) { pts.push([x, yi + tri(x)]); });
      if (o.oikea > xz) pts.push([o.oikea, yi + tri(o.oikea)]);
      d2 += 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L');
    }
    return {
      svg: '<path d="' + d2 + '" fill="none" stroke="currentColor" stroke-width="' + vw + '" stroke-linejoin="miter" stroke-miterlimit="12"/>' +
        '<g transform="translate(' + f(nokka[0]) + ' ' + f(nokka[1]) + ') rotate(' + f(180 - kulma) + ')">' + huilu(T, sw) + '</g>',
      y: function (x, p) { return E[1] + siirto(p) + tri(x); },
      sp: sp, xz: xz, alku: P0, loppuKaari: E, vasenReuna: Math.min.apply(0, kaari.map(function (c) { return c.x - Math.abs(c.nx) * 1.5 * sp; })),
      alaY: E[1] + siirto(-.5) + amp + sp * .75, ylaY: E[1] + siirto(n - .5) - amp - sp * .75
    };
  }

  // Nuotit: epäsäännöllinen muodostelma välille [x0, x1]. Palauttaa luettelon { u (0–1), p (viiva tai väli) }, jotta
  // muodostelma säilyy, kun kaista piirretään uudelleen eri leveydelle. rnd = Math.random tai testin oma.
  function arvoNuotit(rnd) {
    rnd = rnd || Math.random;
    var nmaara = 4 + Math.floor(rnd() * 3), lista = [], yritys = 0;
    while (yritys++ < 50) {
      lista = [];
      // Kerrostettu satunnainen paikka: jokaisella nuotilla oma lohko, sisällä vapaa heitto.
      for (var i = 0; i < nmaara; i++) {
        var u = (i + .15 + rnd() * .7) / nmaara, p = Math.floor(rnd() * 8) / 2 - .5; // -0,5 … 3
        lista.push({ u: u, p: p });
      }
      // Ei portaita: hylätään, jos korkeudet ovat yksitoikkoisesti nousevat tai laskevat tai jos sama korkeus toistuu
      // vierekkäin.
      var nousu = true, lasku = true, toisto = false;
      for (i = 1; i < lista.length; i++) {
        if (lista[i].p <= lista[i - 1].p) nousu = false;
        if (lista[i].p >= lista[i - 1].p) lasku = false;
        if (lista[i].p === lista[i - 1].p) toisto = true;
      }
      if (!nousu && !lasku && !toisto) break;
    }
    // Joskus kaksi ääntä yhtä aikaa (vähintään puolitoista väliä erillään).
    if (rnd() < .45) {
      var j = Math.floor(rnd() * lista.length), q = lista[j].p + (lista[j].p > 1.25 ? -2 : 2);
      lista.push({ u: lista[j].u, p: q });
    }
    return lista;
  }
  function nuotit(k, x0, x1, lista) {
    var ry = k.sp * .75, rx = ry * LOGO, reuna = rx + 1;
    return lista.map(function (nu) {
      var x = x0 + reuna + nu.u * Math.max(0, x1 - x0 - 2 * reuna);
      return sal(x, k.y(x, nu.p), rx, ry);
    }).join('');
  }

  g.LuinHuilu = { mitat: mitat, huilu: huilu, vino: vino, rajat: rajat, kaista: kaista, arvoNuotit: arvoNuotit, nuotit: nuotit,
    sal: sal, LOGO: LOGO };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.LuinHuilu;
})(typeof window !== 'undefined' ? window : globalThis);
