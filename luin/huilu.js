/* Postihuilun kuvio (käyttäjän valinnat ja säännöt 12.11.2026; ideointi docs/mietintamyssy/luin-postihuilu-kuvitus*).
   Yksi huilu, aina vinossa pystyssä (kulma 68° vaakatasosta, nokka ylhäällä oikealla), ei koskaan vaakatasossa:
   - pinon Postihuilu-otsikon oikealla puolella ja asetusten Postihuilu-osiossa, josta lähtee kulmikas kolmilinja;
   - huilutetun (Postihuilun kautta kantautuneen) tekstin nimen perässä.
   Käyttäjän säännöt:
   - Sormireiät ovat koveria salmiakkeja Luinin logon mittasuhteissa (leveys/korkeus 0,767, kaarevuus 0,38), pitkittäin
     putken suuntaan. Sivukärjet ovat irti reunaviivasta (REIKA), reiät hipaisevat toisiaan kärjistään (eivät lomitu), ja
     alimman reiän alakärki yltää juuri ja juuri kellon pohjaviivan sisäpintaan. Reikä ei koskaan halkaise ihoa. Huilun
     pituus on täysikokoisten reikien (sivukärjet sisäpinnassa) mukainen.
   - Suu on symmetrinen. Ääniaukko nokkahuilun ikkunan tapaan (käyttäjän valinta 12.11.2026, mietintämyssyn
     luin-postihuilu-aaniaukko.html versio 5 reikäkoolla 0,65, ja leuka): melko ylhäällä matala täytetty siivu reikien
     värillä ja sen reunoilta kelloa kohti tyhjän suorakulmion ääriviiva, jonka ulkoreuna on siivun päiden linjassa.
     Alaosassa "leukaperät ja leveä leuka": sivut kääntyvät ensin vinosti (45°) sisäänpäin ja puolivälissä matkaa
     keskiviivalle loput 90°:sta vaakasuoraksi leuaksi.
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
  // Sormireiän koko sisäkorkeudesta (käyttäjä 16.11.2026: pienemmät; ennen 0,65 ja sitä ennen 0,85). api.REIKA, jotta
  // mietintämyssyn vertailusivu voi kokeilla muita kokoja.
  var api = { REIKA: 0.5 };
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

  // Huilun mitat paksuudesta T ja viivasta sw.
  // Reiät ovat REIKA-kertaiset täyteen (sivukärjet sisäpinnassa) verrattuna, ja ketju ankkuroituu alhaalta: alin alakärki
  // pysyy pohjaviivan sisäpinnassa ja huilun pituus on täysikokoisten reikien mukainen (käyttäjä 12.11.2026).
  function mitat(T, sw) {
    var h = T / 2, sisa = h - sw / 2, B = sisa * api.REIKA, A = B / LOGO, bk = T * .82;
    var L = bk + sisa * .9 + 6 * sisa / LOGO + sw / 2, ketjuAlku = L - sw / 2 - 6 * A;
    var W = AUKKO.leveys * sisa, x0 = bk + AUKKO.alku * sisa;
    return { T: T, sw: sw, h: h, sisa: sisa, A: A, B: B, bk: bk, L: L, ketjuAlku: ketjuAlku,
      reiat: [ketjuAlku + A, ketjuAlku + 3 * A, ketjuAlku + 5 * A], karki: L - sw / 2,
      aukko: { W: W, x0: x0, x1: x0 + AUKKO.siivu * sisa, x2: x0 + AUKKO.pituus * sisa, viiva: sw * AUKKO.viiva, leuka: AUKKO.leuka * W } };
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

  // Kaista: vino huilu ja sen kellosta kulmikas kolmilinja oikealle.
  // o: vasen (huilun vasen reuna), yla (huilun yläreuna), keskiY (viivaston keskilinja vaakaosuudella), oikea (viivojen
  //    enimmäisloppu), T, sw (huilu), n (viivoja), sp (viivaväli), vw (viivan paksuus), jakso, amp, palat (siksakin
  //    enimmäispituus puolijaksoina), nr (nuotin puolikorkeus), kulma.
  // Väljä kolmilinja (käyttäjän pyyntö 16.11.2026; ennen neljä viivaa, väli 4, jakso 30, ±2,4, nuotti 3 ja viivasto aina
  // oikeaan reunaan): kolme viivaa, väli 5, jakso 48 ja siksak niin jyrkkä, että alamäkiviiva on 22° vaakatasosta eli
  // kohtisuorassa sille kallistuvaa nuottia vastaan (amp = jakso · tan 22° / 4 ≈ 4,85). Siksak on enintään neljä jaksoa.
  // Samana päivänä syvemmät välit (käyttäjä: "huomattavasti syvemmät"): väli 8 (ennen 5) ja nuotti välin korkuinen
  // (puolikorkeus sp / 2, välissä oleva nuotti hipaisee molempia viivoja); ylin viiva pysyy paikallaan (kutsuja laskee
  // keskiY:n siitä), joten alin viiva kaartuu syvemmälle alas ja vasemmalle.
  // Viuhka: keskilinja on kuutiollinen Bézier kärjestä huilun suuntaan ja kaarena vaakasuoraksi; viivat ovat sen
  // normaalin suuntaisia siirtymiä, jotka kasvavat kärjen nollasta täyteen väliin kaaren matkalla (smoothstep).
  var KAARROS = .6;
  // Sylin tukipisteet väleinä (vali) ja viivaväleinä (sp): vasen ja alas = ensimmäinen tukipiste suusta (kiihtyen alas ja
  // vasemmalle); pohjaX ja syvyys = alin kohta suun kohdalla ja sen syvyys harjasta; harjaEnnen = harjan tukipisteen etäisyys
  // ennen harjan paikkaa; laakso = suoran laakson tukipiste harjan jälkeen; ulosX, ulosY, pohjaUlos, pohjaUlosX = alempien
  // viivojen tukipisteiden siirtymä viivaa kohti; kulma = alempien viivojen lähtösuunnan kääntö vasemmalle viivaa kohti.
  var SYLI = { vasen: .1, alas: .45, pohjaX: 0, syvyys: .5, harjaEnnen: .1, laakso: .35, ulosX: 1.2, ulosY: .3, pohjaUlos: 1, pohjaUlosX: .2, kulma: 10, vahintaan: .25, pisteet: 80 };
  function kaista(o) {
    var T = o.T || 6, sw = o.sw || .75, kulma = o.kulma || 68, sp = o.sp || 8, n = o.n || 3, vw = o.vw || .6;
    var jakso = o.jakso || 48, amp = o.amp == null ? jakso * Math.tan((90 - kulma) * Math.PI / 180) / 4 : o.amp;
    var palat = o.palat == null ? 8 : o.palat, nr = o.nr || sp / 2, r = rajat(T, sw, kulma), th = r.th;
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
    var S = s, xz = E[0] + sp, suunta = 1, syli = null;
    function tri(x) { // 0 alussa, taitteet jakson neljänneksissä; suunta 1: ensin ylös (ruudun y pienenee), −1: ensin alas
      if (x <= xz) return 0;
      // Sylin laakso harjalta napin alun alakulmaan (käyttäjä 17.11.2026): melko suora, ei loiventumista kuopan pohjaan.
      if (syli != null && x >= syli && x <= syli + jakso / 2) return -amp + 2 * amp * (x - syli) / (jakso / 2);
      var u = ((x - xz) / jakso) % 1;
      return suunta * amp * (u < .25 ? -4 * u : u < .75 ? -2 + 4 * u : 4 - 4 * u);
    }
    // Siksak päättyy aina kokonaisen palan (puolijakson) lepokohtaan: kapeammalla näytöllä se lyhenee pala palalta eikä
    // katkea kesken taitteen (käyttäjän pyyntö 12.11.2026). Leveällä näytöllä se on enintään `palat` palaa pitkä.
    var loppu = o.oikea > xz ? xz + Math.min(palat || Infinity, Math.floor((o.oikea - xz) / (jakso / 2))) * (jakso / 2) : xz;
    // o.alkuX ja o.loppuX = Soita huilua! -napin reunat (käyttäjän vaatimukset 17.11.2026): napin alku on aina siksakin
    // alakulmassa, kolmen kulmasta kulmaan ulottuvan välin (`valit`) päässä on yläkulma, ja napin loppu on aivan hiukan sen
    // jälkeen laskevalla viivalla (`yli` väliä, alamäen puolivälissä eli lepokohdassa), johon siksak päättyy. Nappiin mahtuu siis reilut kolme väliä, ja soiton
    // kolme nuottia ovat välien keskikohdissa (lepokohdat). Korkeus seuraa jaksoa, joten alamäki pysyy 22°:ssa. Siksakin
    // alku (lepokohta) asettuu samaan rytmiin vähintään puoli viivaväliä ja alle välin viuhkan jälkeen; suunta (ensin ylös
    // tai alas) valitaan niin, että napin alku osuu alakulmaan. Kapeassa pinossa (320 px), jossa nappi alkaa jo viuhkan
    // kohdalla, ensimmäinen väli alkaa lepokohdastaan napin sisällä. `palat` ei rajaa tätä.
    if (o.loppuX != null && o.alkuX != null && o.alkuX < o.loppuX) {
      var valit = o.valit || 3, yli = o.yli == null ? .5 : o.yli; // .5: alamäen puolivälissä (käyttäjä 17.11.2026; ensin .12)
      var vali = (o.loppuX - o.alkuX) / (valit + yli), xmin = E[0] + sp / 2;
      jakso = 2 * vali;
      if (o.amp == null) amp = jakso * Math.tan((90 - kulma) * Math.PI / 180) / 4;
      // Syli (käyttäjän pyyntö 17.11.2026): napin alun alakulmaa ennen on tasan yksi suora veto edelliseen yläkulmaan
      // (cx), ja siitä huilun suuhun on puhdasta kaarrosta: ei suoraa eikä siksakia. Kukin viiva on oma kuutiollinen
      // Bézier-kaarensa suusta omaan yläkulmaansa; alin kaartaa leveimmin ulkokautta (pitkät kahvat), sisemmät tiukemmin.
      // Kaari lähtee huilun suuntaan ja saapuu kulmaan ylämäen suunnassa (22°), joten kulma on siksakin kulma.
      // Aalto (käyttäjän palaute 17.11.2026): napin vasemmalla ei ole suoraa eikä kulmia. Aaltojen rytmi on sama kuin
      // siksakin (yläkulman paikka väliä ennen nappia, napin alku alakulmassa), mutta kaari nousee yläkulmien korkeudelle
      // vaakasuoraan harjaan (syli) ja laskee siitä tavallisena aaltona (puolikas kosini) napin alun alakulmaan, josta
      // siksak alkaa. Kapeimmassa pinossa (320 px), jossa harja osuisi huilun suun vasemmalle, harja on napin sisällä
      // ensimmäisen yläkulman paikalla, ja nuotteja mahtuu kaksi.
      var raja = P0[0] + SYLI.vahintaan * vali;
      syli = o.alkuX - vali >= raja ? o.alkuX - vali : o.alkuX + vali;
      xz = syli - vali / 2;
      suunta = 1;
      loppu = o.loppuX;
    }
    var taitteet = [];
    for (var xx = xz + jakso / 4; xx < loppu - 1e-6; xx += jakso / 2) if (syli == null || xx > syli + jakso / 2 + 1e-6) taitteet.push(xx);
    var d2 = '', kaikki = [], ylos = [Math.cos((90 - kulma) * Math.PI / 180), -Math.sin((90 - kulma) * Math.PI / 180)];
    // Sylin viivat (käyttäjän ohje 17.11.2026, ulkomutka): suusta ulos kiihtyen alas ja vasemmalle, sitten taite toiseen
    // suuntaan ja pitkä kaarros, jonka alin piste on suunnilleen huilun suun kohdalla x-akselilla; siitä loivasti ylös ja
    // loivasti kääntyvä harja yläkulmien korkeudella; laakso ei loivennu vaan pysyy melko suorana ja törmää napin alun
    // alakulmaan. Kukin viiva on C2-splini (kaarevuus jatkuva: käyttäjän sääntö "ei tarpeettomia nopeita asteluvun
    // kiihdytyksiä") tukipisteiden kautta: suu, vasen-alas, pohja suun alla, harja ja laakson suora, jota pitkin viiva
    // jatkuu kulmaan. Alemmat viivat ovat ulompana: tukipisteet vasemmalla ja alempana, harja ja laakso tasan väli alempana.
    function splini(Q, s0, s1, kpl) {
      var t = [0], m = Q.length;
      for (var a = 1; a < m; a++) t.push(t[a - 1] + Math.max(1e-6, Math.hypot(Q[a][0] - Q[a - 1][0], Q[a][1] - Q[a - 1][1])));
      function toinen(c, sa, sb) { // kiinnitetty kuutiosplini: toiset derivaatat M (Thomasin algoritmi)
        var A = [], B = [], Cc = [], R = [], h = [];
        for (var a = 0; a < m - 1; a++) h.push(t[a + 1] - t[a]);
        for (a = 0; a < m; a++) {
          if (a === 0) { A.push(0); B.push(2 * h[0]); Cc.push(h[0]); R.push(6 * ((Q[1][c] - Q[0][c]) / h[0] - sa)); }
          else if (a === m - 1) { A.push(h[m - 2]); B.push(2 * h[m - 2]); Cc.push(0); R.push(6 * (sb - (Q[m - 1][c] - Q[m - 2][c]) / h[m - 2])); }
          else { A.push(h[a - 1]); B.push(2 * (h[a - 1] + h[a])); Cc.push(h[a]); R.push(6 * ((Q[a + 1][c] - Q[a][c]) / h[a] - (Q[a][c] - Q[a - 1][c]) / h[a - 1])); }
        }
        for (a = 1; a < m; a++) { var w = A[a] / B[a - 1]; B[a] -= w * Cc[a - 1]; R[a] -= w * R[a - 1]; }
        var M = []; M[m - 1] = R[m - 1] / B[m - 1];
        for (a = m - 2; a >= 0; a--) M[a] = (R[a] - Cc[a] * M[a + 1]) / B[a];
        return { M: M, h: h };
      }
      var X = toinen(0, s0[0], s1[0]), Y = toinen(1, s0[1], s1[1]), out = [], T = t[m - 1];
      function arvo(c, S, u) {
        var a = 0; while (a < m - 2 && u > t[a + 1]) a++;
        var h = S.h[a], p = t[a + 1] - u, q = u - t[a];
        return S.M[a] * p * p * p / (6 * h) + S.M[a + 1] * q * q * q / (6 * h) + (Q[a][c] / h - S.M[a] * h / 6) * p + (Q[a + 1][c] / h - S.M[a + 1] * h / 6) * q;
      }
      for (var j = 0; j <= kpl; j++) { var u = T * j / kpl; out.push([arvo(0, X, u), arvo(1, Y, u)]); }
      return out;
    }
    function syliKaari(oi) {
      var k = (oi - siirto(n - 1)) / sp, harjaY = E[1] + oi - amp, vali = jakso / 2, ehdot = SYLI;
      var vali2 = Math.max(.3, Math.min(1, (syli - P0[0]) / (1.6 * vali))); // ahtaalla (360 px) kaarros mataloituu ja kapenee
      var ka = Math.atan2(d[1], d[0]) + ehdot.kulma * k * Math.PI / 180, s0 = [Math.cos(ka), Math.sin(ka)];
      var lasku = [Math.cos((90 - kulma) * Math.PI / 180), Math.sin((90 - kulma) * Math.PI / 180)]; // laakson suunta (22° alas)
      var A = [P0[0] - ehdot.vasen * vali * vali2 - k * ehdot.ulosX * sp, P0[1] + ehdot.alas * vali * vali2 + k * ehdot.ulosY * sp];
      var Bp = [P0[0] + ehdot.pohjaX * vali - k * ehdot.pohjaUlosX * sp, harjaY + ehdot.syvyys * vali * vali2 + k * ehdot.pohjaUlos * sp];
      var H = [syli - ehdot.harjaEnnen * vali, harjaY], Ls = [syli + ehdot.laakso * vali, harjaY + 2 * amp * ehdot.laakso];
      var out;
      // Harjan korkeus: tukipistettä säädetään, kunnes kaaren ylin kohta on tasan yläkulmien korkeudella.
      for (var kierros = 0; kierros < 4; kierros++) {
        out = splini([P0, A, Bp, H, Ls], s0, lasku, SYLI.pisteet);
        // Harja haetaan vasta kaarroksen pohjan jälkeen (alemmilla viivoilla suu on harjaa korkeammalla samalla x:llä).
        var pohja = 0, ylin = Infinity;
        out.forEach(function (q, j) { if (q[1] > out[pohja][1]) pohja = j; });
        out.forEach(function (q, j) { if (j > pohja) ylin = Math.min(ylin, q[1]); });
        H = [H[0], H[1] + (harjaY - ylin)];
      }
      return out;
    }
    for (i = 0; i < n; i++) {
      var oi = siirto(i), pts = syli != null ? syliKaari(oi) : kaari.map(function (c) {
        // Ulommat (alemmat) viivat pullistuvat kaaren keskellä (KAARROS), jotta alin kaartuu syvemmin alas ja vasemmalle
        // (käyttäjän pyyntö 16.11.2026); sisemmät pysyvät ennallaan.
        var q = c.s / S, e = q * q * (3 - 2 * q) * (oi > 0 ? 1 + KAARROS * Math.sin(Math.PI * q) : 1);
        return [c.x + c.nx * oi * e, c.y + c.ny * oi * e];
      });
      var yi = E[1] + oi;
      if (syli == null) pts.push([xz, yi]);
      else pts.push([syli + jakso / 2, yi + amp]); // laakson suora napin alun alakulmaan
      taitteet.forEach(function (x) { pts.push([x, yi + tri(x)]); });
      if (loppu > xz) pts.push([loppu, yi + tri(loppu)]); // lepokohta, napin kohdalla hiukan yläkulman jälkeen
      d2 += 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L');
      kaikki = kaikki.concat(pts);
    }
    var kx = kaikki.map(function (p) { return p[0]; }), ky = kaikki.map(function (p) { return p[1]; });
    return {
      svg: '<path d="' + d2 + '" fill="none" stroke="currentColor" stroke-width="' + vw + '" stroke-linejoin="miter" stroke-miterlimit="12"/>' +
        '<g transform="translate(' + f(nokka[0]) + ' ' + f(nokka[1]) + ') rotate(' + f(180 - kulma) + ')">' + huilu(T, sw) + '</g>',
      y: function (x, p) { return E[1] + siirto(p) + tri(x); },
      // Nuotin kallistus (käyttäjä 12.11.2026): alamäkiviivalla (viiva laskee oikealle, ruudun y kasvaa) oikealle huilun
      // kulmassa (90° − 68° = 22° pystysuorasta), ylämäkiviivalla pystyssä ruudun suhteen.
      nuottiKallistus: function (x) { return tri(x + .01) - tri(x - .01) > 0 ? (90 - kulma) * Math.PI / 180 : 0; },
      sp: sp, n: n, nr: nr, amp: amp, xz: xz, jakso: jakso, loppu: loppu, alku: P0, loppuKaari: E, syli: syli,
      vasenReuna: syli != null ? Math.min.apply(0, kx) - vw : Math.min.apply(0, kaari.map(function (c) { return c.x - Math.abs(c.nx) * 1.5 * sp; })),
      alaY: Math.max(E[1] + siirto(0) + Math.max(amp, nr) + .5, Math.max.apply(0, ky) + vw + .5),
      ylaY: Math.min(E[1] + siirto(n - 1) - Math.max(amp, nr) - .5, Math.min.apply(0, ky) - vw - .5),
      viivaY: function (x, p) { return E[1] + siirto(p) + tri(x); }
    };
  }

  // Nuotit (käyttäjän säännöt 12.11.2026): korkeus aina viivalla tai välissä, ei koskaan ylimmän viivan yläpuolella eikä
  // alimman alapuolella (p 0…n − 1 puolen välein); vaakasuunnassa aina siksakin jakson keskellä (taitteiden puolivälissä, jossa
  // viiva on lepokohdassaan), ei satunnaisessa kohdassa. Yksi nuotti jaksoa kohti (ei
  // päällekkäisiä ääniä); salmiakki kallistuu alamäkiviivalla oikealle huilujen kulmassa ja on ylämäessä pystyssä. Muodostelma arvotaan joka painalluksella uudelleen: jakso saa
  // jäädä välillä tyhjäksi, mutta ei kahta peräkkäin eikä soiton ensimmäistä tai viimeistä. Korkeus on pelkkä arvonta (käyttäjä:
  // ei melodiaestetiikkaa); vain sama korkeus peräkkäin ja porras hylätään. arvoNuotit() palauttaa vain siemenen, jotta sama muodostelma säilyy uudelleenpiirrossa (leveys).
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
    var rx = k.nr * LOGO, out = [];
    x1 = Math.min(x1, k.loppu);
    // Siksakin alku xz on itsekin lepokohta: kapeassa pinossa (320 px) se on napin sisällä, ja ilman sitä nuotit
    // painuisivat napin oikeaan päähän (17.11.2026). Leveämmällä xz on napin vasemmalla puolella eikä vaikuta.
    for (var i = 0, x = k.xz; x <= x1 - rx - 1; x = k.xz + ++i * k.jakso / 2) if (x >= x0 + rx + 1 && (k.syli == null || x > k.syli)) out.push(x);
    return out;
  }
  function kulkuPorras(ps) {
    if (ps.length < 3) return false;
    var nousu = true, lasku = true;
    for (var i = 1; i < ps.length; i++) { if (ps[i] <= ps[i - 1]) nousu = false; if (ps[i] >= ps[i - 1]) lasku = false; }
    return nousu || lasku;
  }
  // Soitossa on tasan kolme nuottia (käyttäjän pyyntö 16.11.2026; ennen nuotti melkein joka jaksoon), ja ne levittyvät
  // koko napin x-välille (käyttäjä 17.11.2026: nuottien ala on selvästi napin ala): napin kohdan ensimmäinen ja viimeinen
  // jaksonkeski soivat aina, ja kolmas on niiden välissä niin, ettei kahta tyhjää ole peräkkäin (viidellä keskeellä keskimmäinen,
  // neljällä toinen kahdesta keskimmäisestä arvottuna).
  function nuottiPaikat(k, x0, x1, nu) {
    var keskit = jaksonKesket(k, x0, x1), m = keskit.length, out = [];
    if (!m || !nu) return out;
    var rnd = satunnainen(nu.siemen), soi = [], ps, yritys = 0, vali;
    if (m <= 3) vali = -1;
    else if (m === 4) vali = 1 + Math.floor(rnd() * 2);
    else vali = Math.floor((m - 1) / 2); // napin levyllä keskeitä on enintään viisi
    for (var j = 0; j < m; j++) soi.push(m <= 3 || j === 0 || j === m - 1 || j === vali);
    do {
      // Korkeudet: pelkkä arvonta viivaston paikoista (kolmella viivalla viisi), ei sama kuin edellinen (ei melodiaestetiikkaa).
      ps = [];
      for (j = 0; j < m; j++) {
        if (!soi[j]) continue;
        var p; do { p = Math.floor(rnd() * (2 * k.n - 1)) / 2; } while (ps.length && p === ps[ps.length - 1]);
        ps.push(p);
      }
    } while (kulkuPorras(ps) && ++yritys < 40);
    var i = 0;
    for (j = 0; j < m; j++) if (soi[j]) { out.push({ x: keskit[j], y: k.y(keskit[j], ps[i]), p: ps[i], j: j }); i++; }
    // Ei koskaan kahta ääntä päällekkäin (käyttäjä: ei kiksejä eikä häröääniä): yksi nuotti jaksoa kohti.
    return out;
  }

  function nuotit(k, x0, x1, lista) {
    var ry = k.nr, rx = ry * LOGO;
    // Alamäessä oikealle huilujen kulmassa, ylämäessä pystyssä.
    return nuottiPaikat(k, x0, x1, lista).map(function (q) { return sal(q.x, q.y, rx, ry, null, k.nuottiKallistus(q.x)); }).join('');
  }

  g.LuinHuilu = api;
  var osat = { mitat: mitat, huilu: huilu, aukko: aukko, vino: vino, rajat: rajat, kaista: kaista, arvoNuotit: arvoNuotit, nuotit: nuotit,
    nuottiPaikat: nuottiPaikat, jaksonKeskit: jaksonKesket,
    sal: sal, LOGO: LOGO };
  for (var nimi in osat) api[nimi] = osat[nimi];
  if (typeof module !== 'undefined' && module.exports) module.exports = g.LuinHuilu;
})(typeof window !== 'undefined' ? window : globalThis);
