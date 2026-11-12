/* Postihuilun kuvio (käyttäjän valinnat ja säännöt 12.11.2026; ideointi docs/mietintamyssy/luin-postihuilu-kuvitus*).
   Yksi huilu, aina vinossa pystyssä (kulma 68° vaakatasosta, nokka ylhäällä oikealla), ei koskaan vaakatasossa:
   - hyllyn Postihuilu-otsikon oikealla puolella ja asetusten Postihuilu-osiossa, josta lähtee kulmikas viisiviivasto;
   - huilutetun (Postihuilun kautta kantautuneen) tekstin nimen perässä.
   Käyttäjän säännöt:
   - Viisi sormireikää kuin viisi viivaa (käyttäjän valinta 12.11.2026, ennen kolme): koveria salmiakkeja Luinin logon
     mittasuhteissa (leveys/korkeus 0,767, kaarevuus 0,38), pitkittäin putken suuntaan, kärjet hipaisten (eivät lomitu).
     Alimman reiän alakärki on ehdottomasti kellon pohjaviivan sisäpinnassa (käyttäjä: "ehdoton dogmi", ei hajurakoa), ja
     ketju täyttää tilan ääniaukon leukaan asti (RAKO); reikien koko seuraa tästä (6 px:n huilussa noin 0,5 sisäkorkeudesta).
     Reikä ei koskaan halkaise ihoa. Huilun pituus ja yläosa ovat ennallaan (mietintämyssyn versio A).
   - Suu on symmetrinen. Ääniaukko nokkahuilun ikkunan tapaan (käyttäjän valinta 12.11.2026, mietintämyssyn
     luin-postihuilu-aaniaukko.html versio 5 reikäkoolla 0,65, ja leuka): melko ylhäällä matala täytetty siivu reikien
     värillä ja sen reunoilta kelloa kohti tyhjän suorakulmion ääriviiva, jonka ulkoreuna on siivun päiden linjassa.
     Alaosassa "leukaperät ja leveä leuka": sivut kääntyvät ensin vinosti (45°) sisäänpäin ja puolivälissä matkaa
     keskiviivalle loput 90°:sta vaakasuoraksi leuaksi.
   - Viivat ovat ohuita, mutta mittoja ei pienennetä niiden mukana. Viivasto lähtee viuhkana alimman reiän alakärjestä
     (ei valmiiksi levällään) yhtenä alas suuntautuvana nippuna, avautuu kaarteessa (alin viiva leveimmällä ulkokaarella)
     vaakasuoraksi ja jatkuu kulmikkaana, selvästi näkyvin taittein:
     vain alkuviuhka kaartuu (käyttäjä: "ikäänkuin aaltomuotojen loputtomuudesta kvantteihin tässä siirrytään").
   - Nuotit ilmestyvät vasta Soita huilua! -napin painalluksesta ja vain napin yläpuolelle; muodostelma on joka kerta
     uusi ja epäsäännöllinen (ei portaita). Nuotit ovat viivoilla, ja jokaiselle viivalle tulee yksi ääni jossain
     järjestyksessä (käyttäjä 12.11.2026: viisi reikää, viisi viivaa).
   - Ei ruostetta (ruoste = napautettava).
   Mitat: huilu()-paikalliskoordinaateissa nokan kärki on origossa, akseli +x ja kello x = L. */
(function (g) {
  'use strict';
  var LOGO = 0.767;            // logon salmiakin leveys / korkeus (luin.html:n logo)
  var KAARI = 0.38;            // salmiakin kaarevuus (luin.html sal())
  // Viuhka: yhteisen varren pituus (px), kaaren säteen vähimmäissuhde sisimmän viivan siirtoon (yli 1: ei sinkoutumista,
  // 1,6: ylin viiva kaartuu siististi), suoran hännän pituus viivaväleinä ja kaaren osuus, jonka kohdalla viivat ovat
  // täysin auki (sen jälkeen samankeskiset, jotta ylin viiva ei nouse kaaren lopussa).
  var VIUHKA = { varsi: 2, kaarre: 1.6, hanta: 1.5, auki: .8 };
  var REIKIA = 5, VIIVOJA = 5; // viisi reikää, viisi viivaa (käyttäjä 12.11.2026)
  var RAKO = .2;               // ylimmän reiän kärjen etäisyys aukon leuasta huilun paksuuden kerrannaisena (1,2 px 6 px:n huilussa)
  // Ääniaukko sisäkorkeuden puolikkaan (sisa) kerrannaisina: puolileveys, siivun alku nokan suoran osan alusta, siivun
  // ja koko aukon pituus putken suuntaan; ääriviiva sw:n kerrannaisena; leuka vie puolet puolileveydestä 45°:ssa.
  var AUKKO = { leveys: .6, alku: .1, siivu: .38, pituus: 1.7, viiva: .7, leuka: .5 };
  function f(n) { return Math.round(n * 100) / 100; }
  // Kovera salmiakki; kulma (rad) kallistaa sen keskipisteensä ympäri (nuotit viivaston mukana).
  function sal(cx, cy, rx, ry, c, kulma) {
    c = c == null ? KAARI : c;
    var co = Math.cos(kulma || 0), si = Math.sin(kulma || 0);
    function q(x, y) { return f(cx + x * co - y * si) + ' ' + f(cy + x * si + y * co); }
    var P = [[0, -ry], [rx, 0], [0, ry], [-rx, 0]], d = 'M' + q(P[0][0], P[0][1]);
    for (var i = 0; i < 4; i++) {
      var a = P[i], b = P[(i + 1) % 4];
      d += 'Q' + q((a[0] + b[0]) * c, (a[1] + b[1]) * c) + ' ' + q(b[0], b[1]);
    }
    return d + 'Z';
  }

  // Huilun mitat paksuudesta T ja viivasta sw. Pituus on ennallaan (aiempien kolmen täysikokoisen reiän mukainen).
  // Reikäketju ankkuroituu alhaalta: alin alakärki pohjaviivan sisäpinnassa, ylin kärki RAKOn päässä aukon leuasta.
  function mitat(T, sw) {
    var h = T / 2, sisa = h - sw / 2, bk = T * .82;
    var L = bk + sisa * .9 + 6 * sisa / LOGO + sw / 2, karki = L - sw / 2;
    var W = AUKKO.leveys * sisa, x0 = bk + AUKKO.alku * sisa, x2 = x0 + AUKKO.pituus * sisa;
    var A = (karki - x2 - RAKO * T) / (2 * REIKIA), B = A * LOGO, ketjuAlku = karki - 2 * REIKIA * A, reiat = [];
    for (var i = 0; i < REIKIA; i++) reiat.push(ketjuAlku + (2 * i + 1) * A);
    return { T: T, sw: sw, h: h, sisa: sisa, A: A, B: B, bk: bk, L: L, ketjuAlku: ketjuAlku, reiat: reiat, karki: karki,
      aukko: { W: W, x0: x0, x1: x0 + AUKKO.siivu * sisa, x2: x2, viiva: sw * AUKKO.viiva, leuka: AUKKO.leuka * W } };
  }
  // Ääniaukko: täytetty siivu ja sen alta leuallinen ääriviiva. Ulkoreunan murtoviiva siirretään viivan puolikkaalla
  // sisäänpäin, jotta ääriviivan ulkoreuna on tasan siivun päiden ja leuan linjassa.
  function aukko(m) {
    var a = m.aukko, W = a.W, j = a.leuka, i = a.viiva / 2, kx = (a.x1 + a.x2) / 2;
    var ulko = [[a.x1, -W], [a.x2 - j, -W], [a.x2, -W + j], [a.x2, W - j], [a.x2 - j, W], [a.x1, W]];
    function siirto(p, q) { // reunan p→q siirtymä sisäänpäin (kohti aukon keskikohtaa)
      var dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
      if ((kx - p[0]) * nx + (0 - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
      return [[p[0] + nx * i, p[1] + ny * i], [q[0] + nx * i, q[1] + ny * i]];
    }
    function leikkaus(e1, e2) {
      var p = e1[0], r = [e1[1][0] - p[0], e1[1][1] - p[1]], q = e2[0], t2 = [e2[1][0] - q[0], e2[1][1] - q[1]];
      var t = ((q[0] - p[0]) * t2[1] - (q[1] - p[1]) * t2[0]) / (r[0] * t2[1] - r[1] * t2[0]);
      return [p[0] + r[0] * t, p[1] + r[1] * t];
    }
    var reunat = [];
    for (var k = 0; k < ulko.length - 1; k++) reunat.push(siirto(ulko[k], ulko[k + 1]));
    var pts = [reunat[0][0]];
    for (k = 0; k < reunat.length - 1; k++) pts.push(leikkaus(reunat[k], reunat[k + 1]));
    pts.push(reunat[reunat.length - 1][1]);
    return {
      siivu: 'M' + f(a.x0) + ' ' + f(-W) + 'H' + f(a.x1) + 'V' + f(W) + 'H' + f(a.x0) + 'Z',
      viiva: 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L'), ulko: ulko
    };
  }
  // Huilu paikalliskoordinaateissa (SVG-sisältö).
  function huilu(T, sw, vari) {
    var m = mitat(T, sw), h = m.h, L = m.L, bk = m.bk;
    vari = vari || 'currentColor';
    var px = T * .107, py = T * .286, cy = T * .25, ky = T * .107;
    var runko = 'M' + f(L) + ' ' + f(-h) + 'H' + f(bk) + 'L' + f(px) + ' ' + f(-py) + 'Q0 ' + f(-cy) + ' 0 ' + f(-ky) + 'V' + f(ky) +
      'Q0 ' + f(cy) + ' ' + f(px) + ' ' + f(py) + 'L' + f(bk) + ' ' + f(h) + 'H' + f(L) + 'Z';
    var reiat = m.reiat.map(function (x) { return sal(x, 0, m.A, m.B); }).join(''), au = aukko(m);
    return '<path d="' + runko + '" fill="none" stroke="' + vari + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="' + au.viiva + '" fill="none" stroke="' + vari + '" stroke-width="' + f(m.aukko.viiva) + '" stroke-linejoin="miter" stroke-linecap="butt"/>' +
      '<path d="' + au.siivu + reiat + '" fill="' + vari + '"/>';
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
    var T = o.T || 6, sw = o.sw || .75, kulma = o.kulma || 68, sp = o.sp || 4, n = o.n || VIIVOJA, vw = o.vw || .6;
    var jakso = o.jakso || 30, amp = o.amp == null ? 2.4 : o.amp, r = rajat(T, sw, kulma), th = r.th;
    var nokka = [o.vasen - r.x, o.yla - r.y], d = [Math.cos(th), Math.sin(th)];
    var P0 = kierra([r.m.karki, 0], th); P0 = [nokka[0] + P0[0], nokka[1] + P0[1]];
    // Viuhka (käyttäjä 12.11.2026: "pohjasta lähtee ensin YHDESTÄ ALAS SUUNTAUTUVASTA vektorista kaarteena avautumaan";
    // alin viiva hakee vasemmalta ulkokaarta). Keskiviiva: varsi huilun akselia alas, ympyränkaari vaakasuoraksi ja lyhyt
    // suora. Viivat ovat keskiviivan normaalisiirtymiä, jotka kasvavat kärjen nollasta täyteen (smoothstep) koko matkalla,
    // joten nippu kulkee ensin lähes yhtenä ja avautuu kaarteessa. Kaaren säde on aina suurempi kuin sisimmän viivan siirto
    // kaarteessa: muuten ylin viiva sinkoutuu suoraan oikealle (vika ennen 12.11.2026).
    var V = VIUHKA, siirto = function (p) { return ((n - 1) / 2 - p) * sp; }, maxSiirto = (n - 1) / 2 * sp;
    var P1 = [P0[0] + d[0] * V.varsi, P0[1] + d[1] * V.varsi];
    var fi0 = Math.atan2(-d[0], d[1]) + Math.PI; // kaaren alkukulma keskipisteestä (suunta d)
    var pystyK = 1 - Math.sin(fi0); // kaaren pudotus säteen kerrannaisena
    var pudotus = Math.max(o.keskiY - P1[1], (maxSiirto * V.kaarre + .5) * pystyK, maxSiirto + sp - (P1[1] - P0[1]));
    var R = pudotus / pystyK, keski = [P1[0] - R * Math.cos(fi0), P1[1] - R * Math.sin(fi0)];
    var E = [keski[0], keski[1] + R], xz = E[0] + V.hanta * sp;
    var linja = [{ x: P0[0], y: P0[1], t: d }], N = 32;
    linja.push({ x: P1[0], y: P1[1], t: d });
    for (var i = 1; i <= N; i++) {
      var fi = fi0 + (Math.PI / 2 - fi0) * i / N;
      linja.push({ x: keski[0] + R * Math.cos(fi), y: keski[1] + R * Math.sin(fi), t: [Math.sin(fi), -Math.cos(fi)] });
    }
    for (i = 1; i <= 8; i++) linja.push({ x: E[0] + (xz - E[0]) * i / 8, y: E[1], t: [1, 0] });
    linja.forEach(function (c, j) { c.s = j ? linja[j - 1].s + Math.hypot(c.x - linja[j - 1].x, c.y - linja[j - 1].y) : 0; });
    // Avautuminen alkaa varren päästä ja päättyy V.auki-osuuden kohdalla kaarta; loppukaari on samankeskinen.
    var sVarsi = linja[1].s, sAuki = sVarsi + V.auki * (linja[N + 1].s - sVarsi);
    var kaaret = [];
    for (i = 0; i < n; i++) kaaret.push(linja.map(function (c) {
      var q = Math.max(0, Math.min(1, (c.s - sVarsi) / (sAuki - sVarsi))), e = q * q * (3 - 2 * q);
      return [c.x - c.t[1] * siirto(i) * e, c.y + c.t[0] * siirto(i) * e];
    }));
    function tri(x) { // 0 alussa, taitteet jakson neljänneksissä
      if (x <= xz) return 0;
      var u = ((x - xz) / jakso) % 1;
      return amp * (u < .25 ? -4 * u : u < .75 ? -2 + 4 * u : 4 - 4 * u);
    }
    // Siksak päättyy aina kokonaisen palan (puolijakson) lepokohtaan: kapeammalla näytöllä se lyhenee pala palalta eikä
    // katkea kesken taitteen (käyttäjän pyyntö 12.11.2026).
    var loppu = o.oikea > xz ? xz + Math.floor((o.oikea - xz) / (jakso / 2)) * (jakso / 2) : xz;
    var taitteet = [];
    for (var xx = xz + jakso / 4; xx < loppu; xx += jakso / 2) taitteet.push(xx);
    var d2 = '';
    for (i = 0; i < n; i++) {
      var oi = siirto(i), pts = kaaret[i].slice();
      var yi = E[1] + oi;
      pts.push([xz, yi]);
      taitteet.forEach(function (x) { pts.push([x, yi + tri(x)]); });
      if (loppu > xz) pts.push([loppu, yi]);
      d2 += 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L');
    }
    return {
      svg: '<path d="' + d2 + '" fill="none" stroke="currentColor" stroke-width="' + vw + '" stroke-linejoin="miter" stroke-miterlimit="12"/>' +
        '<g transform="translate(' + f(nokka[0]) + ' ' + f(nokka[1]) + ') rotate(' + f(180 - kulma) + ')">' + huilu(T, sw) + '</g>',
      y: function (x, p) { return E[1] + siirto(p) + tri(x); },
      // Nuotin kallistus (käyttäjä 12.11.2026): alamäkiviivalla (viiva laskee oikealle, ruudun y kasvaa) oikealle huilun
      // kulmassa (90° − 68° = 22° pystysuorasta), ylämäkiviivalla pystyssä ruudun suhteen.
      nuottiKallistus: function (x) { return tri(x + .01) - tri(x - .01) > 0 ? (90 - kulma) * Math.PI / 180 : 0; },
      sp: sp, n: n, xz: xz, jakso: jakso, loppu: loppu, alku: P0, loppuKaari: E, vasenReuna: Math.min.apply(0, kaaret.map(function (k) { return Math.min.apply(0, k.map(function (q) { return q[0]; })); })) - vw / 2,
      alaY: E[1] + siirto(0) + Math.max(amp, sp * .75) + .5, ylaY: E[1] + siirto(n - 1) - Math.max(amp, sp * .75) - .5,
      viivaY: function (x, p) { return E[1] + siirto(p) + tri(x); }
    };
  }

  // Nuotit (käyttäjän säännöt 12.11.2026): aina viivalla (viisi reikää, viisi viivaa: jokaiselle viivalle yksi ääni
  // jossain järjestyksessä), vaakasuunnassa aina siksakin jakson keskellä (taitteiden puolivälissä, jossa viiva on
  // lepokohdassaan). Yksi nuotti jaksoa kohti (ei päällekkäisiä ääniä); salmiakki kallistuu alamäkiviivalla oikealle huilujen
  // kulmassa ja on ylämäessä pystyssä. Muodostelma arvotaan joka painalluksella uudelleen: jakso saa jäädä tyhjäksi, mutta
  // ei kahta peräkkäin eikä ensimmäistä tai viimeistä. Järjestys on pelkkä arvonta (käyttäjä: ei melodiaestetiikkaa); vain
  // sama viiva peräkkäin ja porras hylätään. Jos jaksoja on paljon (leveä nappi), viiva kierretään useamman kerran läpi.
  // arvoNuotit() palauttaa vain siemenen, jotta sama muodostelma säilyy uudelleenpiirrossa (leveys).
  function arvoNuotit(rnd) { return { siemen: Math.floor((rnd || Math.random)() * 4294967296) }; }
  function satunnainen(siemen) { // mulberry32
    var a = siemen >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Jakson keskikohdat välillä [x0, x1] (nuotin kärjet mahtuvat väliin).
  function jaksonKesket(k, x0, x1) {
    var rx = k.sp * .75 * LOGO, out = [];
    x1 = Math.min(x1, k.loppu);
    for (var x = k.xz + k.jakso / 2; x <= x1 - rx - 1; x += k.jakso / 2) if (x >= x0 + rx + 1) out.push(x);
    return out;
  }
  function kulkuPorras(ps) {
    if (ps.length < 3) return false;
    var nousu = true, lasku = true;
    for (var i = 1; i < ps.length; i++) { if (ps[i] <= ps[i - 1]) nousu = false; if (ps[i] >= ps[i - 1]) lasku = false; }
    return nousu || lasku;
  }
  function nuottiPaikat(k, x0, x1, nu) {
    var keskit = jaksonKesket(k, x0, x1), m = keskit.length, out = [], n = k.n;
    if (!m || !nu) return out;
    var kierrokset = Math.max(1, Math.round(m / (n + 1))), soivia = Math.min(m, n * kierrokset);
    var rnd = satunnainen(nu.siemen), soi, ps, yritys = 0;
    function sekoita(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    do {
      // Tyhjät jaksot: m − soivia kappaletta, ei ensimmäinen eikä viimeinen eikä kaksi peräkkäin.
      var tyhjat = sekoita(Array.from({ length: Math.max(0, m - 2) }, function (_, i) { return i + 1; })).slice(0, m - soivia);
      soi = keskit.map(function (_, j) { return tyhjat.indexOf(j) < 0; });
      var vierekkain = soi.some(function (v, j) { return !v && j && !soi[j - 1]; });
      // Viivat: jokainen kierros on viivojen permutaatio (vajaa kierros: osa viivoista, kukin kerran).
      ps = [];
      for (var r = 0; r < kierrokset; r++) ps = ps.concat(sekoita(Array.from({ length: n }, function (_, i) { return i; })));
      ps = ps.slice(0, soivia);
      var toisto = ps.some(function (p, j) { return j && p === ps[j - 1]; });
    } while ((vierekkain || toisto || kulkuPorras(ps)) && ++yritys < 200);
    var i = 0;
    for (var j = 0; j < m; j++) if (soi[j]) { out.push({ x: keskit[j], y: k.y(keskit[j], ps[i]), p: ps[i], j: j }); i++; }
    return out;
  }
  function nuotit(k, x0, x1, lista) {
    var ry = k.sp * .75, rx = ry * LOGO;
    // Alamäessä oikealle huilujen kulmassa, ylämäessä pystyssä.
    return nuottiPaikat(k, x0, x1, lista).map(function (q) { return sal(q.x, q.y, rx, ry, null, k.nuottiKallistus(q.x)); }).join('');
  }

  g.LuinHuilu = { mitat: mitat, huilu: huilu, aukko: aukko, vino: vino, rajat: rajat, kaista: kaista, arvoNuotit: arvoNuotit, nuotit: nuotit,
    nuottiPaikat: nuottiPaikat, jaksonKeskit: jaksonKesket,
    sal: sal, LOGO: LOGO };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.LuinHuilu;
})(typeof window !== 'undefined' ? window : globalThis);
