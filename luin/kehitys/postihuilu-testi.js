// Postihuilun kuvio (luin/huilu.js, käyttäjän säännöt 12.11.2026): geometria ilman selainta ja asettelu Luinissa.
// Käyttö: NODE_PATH=$(npm root -g) node luin/kehitys/postihuilu-testi.js [kuvakansio]
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const JUURI = path.join(__dirname, '..', '..');
const H = require(path.join(JUURI, 'luin', 'huilu.js'));
const KUVAT = process.argv[2];
let viat = 0;
function tulos(nimi, ok, tieto) { if (!ok) viat++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto != null ? ' – ' + tieto : '')); }
const lahes = (a, b) => Math.abs(a - b) < 1e-9;

// Geometria: sivukärjet irti reunasta, logon mittasuhde, reiät hipaisten, alin kärki pohjan sisäpintaan.
for (const [T, sw] of [[4.4, .7], [6.4, .9], [8, 1]]) {
  const m = H.mitat(T, sw);
  tulos(`T ${T}: sivukärjet irti reunaviivan sisäpinnasta (0,5-kertaiset, 16.11.2026)`, H.REIKA === .5 && lahes(m.B, m.sisa * .5) && m.B < m.sisa, m.sisa - m.B);
  tulos(`T ${T}: huilun pituus täysikokoisten reikien mukainen`, lahes(m.L, m.bk + m.sisa * .9 + 6 * m.sisa / H.LOGO + sw / 2), m.L);
  tulos(`T ${T}: logon mittasuhde`, lahes(m.B / m.A, H.LOGO), m.B / m.A);
  tulos(`T ${T}: reiät hipaisevat (ei rakoa, ei lomitusta)`, lahes(m.reiat[1] - m.reiat[0], 2 * m.A) && lahes(m.reiat[2] - m.reiat[1], 2 * m.A));
  tulos(`T ${T}: alin alakärki pohjaviivan sisäpinnassa`, lahes(m.reiat[2] + m.A, m.L - sw / 2));
  tulos(`T ${T}: ylin reikä nokan jälkeen`, m.reiat[0] - m.A > m.bk);
  // Ääniaukko (käyttäjä 12.11.2026): siivu ja ääriviiva samassa linjassa, leuka 45° ja puolivälissä vaakaan, ilmaa reikiin ja seiniin.
  const a = m.aukko, au = H.aukko(m), u = au.ulko, i = a.viiva / 2;
  const v = au.viiva.slice(1).split('L').map(p => p.split(' ').map(Number));
  tulos(`T ${T}: aukko nokan suoran osan jälkeen`, a.x0 > m.bk);
  tulos(`T ${T}: ääriviivan ulkoreuna siivun päiden linjassa`, Math.abs(v[0][1] - i + a.W) < .006 && Math.abs(v[v.length - 1][1] + i - a.W) < .006);
  tulos(`T ${T}: leuka ensin 45°, sitten vaakaan puolivälissä keskiviivalle`, lahes(u[2][0] - u[1][0], u[2][1] - u[1][1]) && lahes(Math.abs(u[2][1]), a.W / 2) && lahes(u[3][0], u[2][0]));
  tulos(`T ${T}: rako aukosta ylimmän reiän kärkeen`, m.reiat[0] - m.A - a.x2 > T * .5, m.reiat[0] - m.A - a.x2);
  tulos(`T ${T}: aukko irti seinistä`, m.sisa - a.W > sw, m.sisa - a.W);
}
// Väljä kolmilinja (käyttäjän pyyntö 16.11.2026): kolme viivaa, harvempi ja korkeampi siksak (alamäki 22°), enintään neljä jaksoa.
{
  const k = H.kaista({ vasen: 150, yla: -8, keskiY: 40, oikea: 5000 }), polut = (k.svg.match(/d="([^"]+)"/)[1].match(/M/g) || []).length;
  tulos('kolme viivaa', k.n === 3 && polut === 3, polut);
  tulos('jakso 48, alamäki 22° vaakatasosta', k.jakso === 48 && Math.abs(Math.atan(4 * k.amp / k.jakso) * 180 / Math.PI - 22) < 1e-9, k.amp);
  tulos('leveälläkin enintään neljä jaksoa', lahes(k.loppu - k.xz, 4 * k.jakso), k.loppu - k.xz);
  const kapea = H.kaista({ vasen: 150, yla: -8, keskiY: 40, oikea: 330 });
  tulos('kapealla lyhenee pala palalta', kapea.loppu <= 330 && 330 - kapea.loppu < kapea.jakso / 2, kapea.loppu);
}
// Syli (käyttäjän palaute 17.11.2026): alin viiva kiertää huilun suun vasemman kautta, viuhkan välit ovat tasaiset (eivät
// repeä eivätkä kasaannu) eikä millekään viivalle tule kärkeä. Pinon mitoilla 320–860 px (napin paikat lohkossa).
for (const [lev, n0, w] of [[288, 171.14, 320], [328, 211.14, 360], [358, 241.14, 390], [360, 243.14, 860]]) {
  const r = H.rajat(6, .75, 68), vasen = 150 + (24 - r.w) / 2, yla = -6; // huilun paikka mitattu pinosta 17.11.2026
  const k = H.kaista({ vasen, yla, keskiY: yla + r.h + 14, oikea: lev, loppuX: lev, alkuX: n0, T: 6, sw: .75, kulma: 68, sp: 8 });
  const viivat = k.svg.match(/d="([^"]+)"/)[1].split('M').filter(Boolean).map(v => v.split('L').slice(0, 81).map(t => t.split(' ').map(Number)));
  const minX = Math.min(...viivat[0].map(q => q[0])), vasemmalla = k.alku[0] - minX;
  let valit = [Infinity, 0];
  for (let i = 0; i < 2; i++) for (let j = 40; j < 81; j++) {
    const q = viivat[i][j], dmin = Math.min(...viivat[i + 1].map(w => Math.hypot(w[0] - q[0], w[1] - q[1])));
    valit = [Math.min(valit[0], dmin), Math.max(valit[1], dmin)];
  }
  let karki = 0;
  for (const v of viivat) for (let j = 1; j < v.length - 1; j++) {
    const a = Math.atan2(v[j][1] - v[j - 1][1], v[j][0] - v[j - 1][0]), b = Math.atan2(v[j + 1][1] - v[j][1], v[j + 1][0] - v[j][0]);
    let t = Math.abs(b - a); if (t > Math.PI) t = 2 * Math.PI - t; karki = Math.max(karki, t);
  }
  const vara = k.syli > n0;
  tulos(`syli ${w} px: alin viiva kiertää suun vasemman kautta`, vara || vasemmalla > 4, Math.round(vasemmalla * 10) / 10 + ' px suun vasemmalla puolella');
  tulos(`syli ${w} px: viuhkan välit tasaiset kaaren loppupuoliskolla`, valit[0] > .6 * k.sp && valit[1] < 1.35 * k.sp, valit.map(x => Math.round(x * 10) / 10).join('–') + ' px (väli ' + k.sp + ')');
  tulos(`syli ${w} px: ei kärkeä kaarella (suurin käänne pisteiden välillä)`, karki < .6, Math.round(karki * 180 / Math.PI) + '°');
}
// Nuotit (käyttäjän säännöt 12.11.2026 ja 16.11.2026): tasan kolme napin kohdalla, viivaston sisällä, jakson keskellä, ei kahta
// tyhjää peräkkäin, ei samaa korkeutta peräkkäin eikä porrasta. Eri napin leveyksillä (3–12 jaksoa).
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const nv = { paikka: 0, ulos: 0, reuna: 0, aukot: 0, porras: 0, toisto: 0, paallekkain: 0, kallistus: 0, loppu: 0 }; let kerrat = 0, aukollisia = 0;
for (const [n0, n1] of [[241, 358], [237, 344], [267, 384], [260, 377], [171, 288]]) {
  // Nuottien väli kuten piirraHuilu(): aina napin kohta (16.11.2026), siksakin loppuun asti.
  // 17.11.2026: siksak päättyy napin oikeaan reunaan (loppuX), nuotit koko napin leveydelle.
  const k = H.kaista({ vasen: 150, yla: -8, keskiY: 40, oikea: n1 + 40, loppuX: n1, alkuX: n0 }), x1 = n1, x0 = n0, kes = H.jaksonKeskit(k, x0, x1);
  for (let i = 0; i < 2000; i++) {
    const q = H.nuottiPaikat(k, x0, x1, H.arvoNuotit(rnd)); kerrat++;
    for (const a of q) {
      if (a.p < 0 || a.p > k.n - 1) nv.ulos++;
      if (kes.indexOf(a.x) < 0 || Math.abs(a.y - k.y(a.x, a.p)) > 1e-9 || a.x > k.loppu) nv.paikka++;

    }
    if (new Set(q.map(a => a.x)).size !== q.length) nv.paallekkain++;
    // Kallistus: alamäessä (viiva laskee oikealle) 22° oikealle, ylämäessä 0°.
    for (const a of q) {
      const alamaki = k.y(a.x + .5, 0) > k.y(a.x - .5, 0), kl = k.nuottiKallistus(a.x);
      if (alamaki ? Math.abs(kl - 22 * Math.PI / 180) > 1e-9 : kl !== 0) nv.kallistus++;
    }
    // 17.11.2026: napin alku alakulmassa (ruudun y suurin, +amp), kolmen välin päässä yläkulma (−amp) ja napin loppu, johon
    // siksak päättyy, puoli väliä sen jälkeen laskevan viivan lepokohdassa (17.11.2026; ensin 0,12 väliä).
    // Syli (17.11.2026): nouseva kaari huilun suusta tarttuu ylämäen puoliväliin 1,5 väliä ennen napin alkua (suoraa puoli väliä
    // yläkulmaan, yhtä pitkä kuin napin lopettava alamäki); varamenettelyssä napin ensimmäisen ylämäen puoliväliin.
    const tri = x => k.y(x, 0) - k.y(k.xz, 0), vali = k.jakso / 2, porras = lahes(k.syli, n0 - 1.5 * vali) ? 1 : lahes(k.syli, n0 - vali) ? 2 : 3, vara = porras === 3;
    if (!lahes(k.loppu, n1) || !lahes(vali, (n1 - n0) / 3.5) || Math.abs(tri(n1 - .5 * vali) + k.amp) > 1e-6 || Math.abs(tri(n1)) > 1e-6 ||
      (porras === 2 ? Math.abs(tri(k.syli) + k.amp) > 1e-6 : Math.abs(tri(k.syli)) > 1e-6 || !(tri(k.syli + .1) < 0)) ||
      (vara ? !lahes(k.syli, n0 + vali / 2) : Math.abs(tri(n0 - vali) + k.amp) > 1e-6 || Math.abs(tri(n0) - k.amp) > 1e-6) ||
      Math.abs(Math.atan(4 * k.amp / k.jakso) * 180 / Math.PI - 22) > 1e-9) nv.loppu++;
    // Tasan kolme nuottia (käyttäjä 16.11.2026), napin kohdalla, eikä soiton sisällä kahta tyhjää jaksoa peräkkäin.
    const soi = kes.map(x => q.some(a => a.x === x)), eka = soi.indexOf(true), vika = soi.lastIndexOf(true);
    // Kolme väliä napin kohdalla, nuotti kunkin keskellä: oikea rako puoli väliä vasenta isompi (17.11.2026).
    if (kes.length !== (vara ? 2 : 3) || !vara && Math.abs((n1 - kes[kes.length - 1]) - (kes[0] - n0) - .5 * k.jakso / 2) > 1e-6) nv.reuna++;
    if (q.length !== kes.length || !soi[0] || !soi[soi.length - 1] || q.some(a => a.x - k.nr * H.LOGO < n0 || a.x + k.nr * H.LOGO > n1)) nv.reuna++;
    for (let j = eka + 1; j <= vika; j++) if (!soi[j] && !soi[j - 1]) nv.aukot++;
    if (soi.includes(false)) aukollisia++;
    const mel = q.map(a => a.p);
    let nousu = true, lasku = true;
    for (let j = 1; j < mel.length; j++) { if (mel[j] <= mel[j - 1]) nousu = false; if (mel[j] >= mel[j - 1]) lasku = false; if (mel[j] === mel[j - 1]) nv.toisto++; }
    if ((nousu || lasku) && mel.length > 2) nv.porras++;
  }
}
tulos(`nuotit: ${kerrat} arvontaa sääntöjen mukaan`, Object.values(nv).every(x => x === 0), JSON.stringify(nv) + `, aukollisia ${Math.round(aukollisia / kerrat * 100)} %`);
// Versiotunniste.
const html = fs.readFileSync(path.join(JUURI, 'luin.html'), 'utf8'), v = (html.match(/huilu\.js\?v=([0-9a-f]+)/) || [])[1];
const oikea = crypto.createHash('sha1').update(fs.readFileSync(path.join(JUURI, 'luin', 'huilu.js'))).digest('hex').slice(0, 8);
tulos('luin.html lataa huilu.js:n oikealla versiotunnisteella', v === oikea,
  v === oikea ? v : `${v} ≠ ${oikea}: V=$(sha1sum luin/huilu.js | cut -c1-8); sed -i -E "s/huilu\\.js\\?v=[0-9a-f]+/huilu.js?v=$V/" luin.html`);

// Selaimessa: pino ja asetukset ennen ja jälkeen Soita huilua! -painalluksen.
const { chromium } = require('playwright');
const LAUSE = 'kokeilu-laatikko-lause-huilu';
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 360, 390, 860]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    const virheet = [];
    p.on('pageerror', e => virheet.push(e.message));
    await p.route(/^https?:\/\//, r => r.abort());
    await p.addInitScript(() => {
      if (sessionStorage.getItem('alustettu')) return;
      sessionStorage.setItem('alustettu', '1');
      localStorage.setItem('luin-teksti:p-kant', JSON.stringify('# Kant ja eläinetiikka\n\nTeksti.'));
      localStorage.setItem('luin-teksti:oma', JSON.stringify('# Käyttöohje\n\nTeksti.'));
      localStorage.setItem('luin-merkit:p-kant', JSON.stringify({ km: [{ id: 'k1', b: 1, o: 0 }], al: [] }));
      localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-kant', title: 'Kant ja eläinetiikka', added: 1, src: 'laatikko' },
        { id: 'oma', title: 'Käyttöohje', added: 2, src: 'paikallinen' }]));
    });
    await p.goto('file://' + path.join(JUURI, 'luin.html'));
    await p.waitForTimeout(600);
    // Pinossa Postihuilu on oletuksena kiinni (käyttäjän pyyntö 16.11.2026): vain versaaliotsikko, ei huilua eikä kenttää.
    const kiinni = await p.evaluate(() => {
      const l = document.querySelector('#huilulohko'), nak = q => { const e = document.querySelector(q); return !!(e && e.getClientRects().length); };
      const o = document.querySelector('#lisaa-ots');
      return { ots: nak('#lisaa-ots'), versaali: getComputedStyle(o).textTransform, aria: o.getAttribute('aria-expanded'),
        muut: ['#huilu-kysy', '#huilulohko .huilu-paikka', '#huilulohko .huilukaista', '#lisaa-kentta', '#lisaa-syote'].filter(nak),
        kuvio: l.querySelector('svg.huilukuvio').innerHTML.length };
    });
    tulos(`${w} px: pinon Postihuilu oletuksena kiinni, vain versaaliotsikko`, kiinni.ots && kiinni.versaali === 'uppercase' && kiinni.aria === 'false' && !kiinni.muut.length && !kiinni.kuvio, JSON.stringify(kiinni));
    if (KUVAT) await p.screenshot({ path: path.join(KUVAT, `postihuilu-pino-kiinni-${w}.png`), clip: { x: 0, y: 0, width: w, height: 640 } });
    await p.click('#lisaa-ots'); await p.waitForTimeout(150);
    tulos(`${w} px: otsikko avaa huilun ja kentän`, await p.evaluate(() => document.querySelector('#lisaa-ots').getAttribute('aria-expanded') === 'true' &&
      ['#huilu-kysy', '#lisaa-syote', '#huilulohko .huilunappi'].every(q => document.querySelector(q).getClientRects().length) &&
      document.querySelector('#huilulohko svg.huilukuvio').innerHTML.length > 0));
    // Napin alku alakulmassa, kolme väliä, yläkulma ja napin loppu (siksakin pää) hiukan sen jälkeen (käyttäjä 17.11.2026);
    // 320 px:ssä nappi alkaa jo viuhkan kohdalla, joten vasen reuna ei ole kulma.
    const kulmat = q => p.evaluate(q => {
      const l = document.querySelector(q), R = l.getBoundingClientRect(), n = l.querySelector('.huilunappi').getBoundingClientRect();
      const pts = l.querySelector('svg.huilukuvio path').getAttribute('d').split('M')[1].split('L').slice(81).map(t => t.split(' ').map(Number));
      const kaariLoppu = l.querySelector('svg.huilukuvio path').getAttribute('d').split('M')[1].split('L')[80].split(' ').map(Number);
      const paa = pts.pop(), x0 = n.left - R.left, x1 = n.right - R.left, sis = pts.filter(q => q[0] > x0 - .1 && q[0] < x1 + .1);
      const ys = pts.map(q => q[1]), ala = Math.max(...ys), yla = Math.min(...ys), eka = sis[0], vika = sis[sis.length - 1];
      // Kaaren pää ylämäen puolivälissä 1,5 väliä ennen napin alkua (lepokohta), seuraava piste (suora puoli väliä) yläkulma
      // ja sitä seuraava napin alun alakulma. Kaari on vain nouseva: sen viimeinen veto nousee.
      const v = (x1 - x0) / 3.5, kp = l.querySelector('svg.huilukuvio path').getAttribute('d').split('M')[1].split('L')[79].split(' ').map(Number);
      const sylissa = Math.abs(kaariLoppu[0] - (x0 - 1.5 * v)) < .05 && Math.abs(kaariLoppu[1] - (yla + ala) / 2) < .02 && kp[1] > kaariLoppu[1] &&
        Math.abs(pts[0][0] - (x0 - v)) < .05 && Math.abs(pts[0][1] - yla) < .02 && Math.abs(pts[1][0] - x0) < .05;
      // Toinen porras (ahdas): kaari nousee suoraan yläkulmaan väliä ennen napin alkua.
      const kulmaan = Math.abs(kaariLoppu[0] - (x0 - v)) < .05 && Math.abs(kaariLoppu[1] - yla) < .02 && kp[1] > kaariLoppu[1] && Math.abs(pts[0][0] - x0) < .05;
      return { sylissa, kulmaan, vasen: eka && Math.abs(eka[0] - x0), vasenAla: eka && Math.abs(eka[1] - ala) < .02, kulmia: sis.length,
        vikaYla: vika && Math.abs(vika[1] - yla) < .02, yli: vika && x1 - vika[0], paa: Math.abs(paa[0] - x1), paaAlempana: paa[1] > yla };
    }, q);
    const kpOk = k => k.paa < .05 && k.vikaYla && k.yli > 13 && k.yli < 21 && k.paaAlempana;
    const kp = await kulmat('#huilulohko');
    tulos(`${w} px: pinossa nouseva kaari ylämäen puoliväliin (360 px: yläkulmaan), napin alku alakulmassa, loppu alamäen puolivälissä`, kpOk(kp) && (w < 340 || (w < 380 ? kp.kulmaan : kp.sylissa) && kp.vasen < .05 && kp.vasenAla && kp.kulmia === 4), JSON.stringify(kp));
    const pino = () => p.evaluate(() => {
      const l = document.querySelector('#huilulohko'), svg = l.querySelector('svg.huilukuvio'), nu = svg.querySelector('path.nuotit');
      const rg = document.createRange(); rg.selectNodeContents(document.querySelector('#lisaa-ots')); const t = rg.getBoundingClientRect();
      const runko = svg.querySelector('g path'), bb = runko.getBBox(), m = runko.getScreenCTM();
      const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
      const nappi = l.querySelector('.huilunappi').getBoundingClientRect(), syote = document.querySelector('#lisaa-syote').getBoundingClientRect(), nb = nu && nu.getBoundingClientRect();
      const kysy = document.querySelector('#huilu-kysy').getBoundingClientRect();
      const viivat = svg.querySelector('path').getBoundingClientRect();
      const os = document.querySelector('.n-ots'), hs = os.querySelector('svg.huilutettu'), fs = parseFloat(getComputedStyle(os).fontSize);
      const mk = document.createElement('span'); mk.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; hs.parentNode.insertBefore(mk, hs);
      const perus = mk.getBoundingClientRect().bottom, hr = hs.getBoundingClientRect(); mk.remove();
      return { kysyRako: Math.min(...pts.map(q => q.x)) - kysy.right, keski: (perus - (hr.top + hr.bottom) / 2) / fs,
        viivatVasen: svg.querySelector('path').getBBox().x - (t.right - l.getBoundingClientRect().left),
        viivatOikea: l.getBoundingClientRect().right - viivat.right, viivatNappi: viivat.right - nappi.right,
        nuotit: nb && { vasen: nb.left - nappi.left, oikea: nappi.right - nb.right, maara: (nu.getAttribute('d').match(/M/g) || []).length,
          ala: syote.top - nb.bottom, viivastonAlle: nb.bottom - viivat.bottom },
        merkityt: document.querySelectorAll('.n-ots svg.merkitty').length,
        merkkiRako: (() => { const m = os.querySelector('svg.merkitty').getBoundingClientRect(); return [m.top < hr.bottom && m.bottom > hr.top, hr.left - m.right]; })(),
        huilutetut: document.querySelectorAll('.n-ots svg.huilutettu').length, nOts: [...document.querySelectorAll('.n-ots')].map(x => x.textContent),
        vaaka: document.documentElement.scrollWidth <= innerWidth };
    });
    const e = await pino();
    tulos(`${w} px: huilu i-napin oikealla puolella, ei kosketa siihen`, e.kysyRako > 0, Math.round(e.kysyRako * 10) / 10);
    tulos(`${w} px: huilutetun huilun keskikohta 0,29 em perusviivan yläpuolella`, Math.abs(e.keski - .29) < .02, Math.round(e.keski * 1000) / 1000);
    tulos(`${w} px: ei nuotteja ennen painallusta`, !e.nuotit);
    tulos(`${w} px: merkintöjen merkki vain merkityllä, huilu sen oikealla puolella samalla rivillä`, e.merkityt === 1 && e.merkkiRako[0] && e.merkkiRako[1] > 2, e.merkkiRako[1].toFixed(1));
    tulos(`${w} px: siksak päättyy tasan Soita huilua! -napin oikeaan reunaan`, Math.abs(e.viivatNappi) < .6, Math.round(e.viivatNappi * 100) / 100);
    tulos(`${w} px: huilutettu vain kantautuneella, nimet ennallaan`, e.huilutetut === 1 && e.nOts.join('|') === 'Kant ja eläinetiikka|Käyttöohje');
    await p.fill('#lisaa-syote', 'lyhyt'); await p.click('#lisaa-kentta .huilunappi'); await p.waitForTimeout(200);
    tulos(`${w} px: kelpaamaton lause ei soita`, !(await pino()).nuotit);
    await p.fill('#lisaa-syote', LAUSE); await p.click('#lisaa-kentta .huilunappi'); await p.waitForTimeout(400);
    const j = await pino();
    tulos(`${w} px: painallus tuo kolme nuottia (320 px: kaksi) koko napin x-välille, eivät viivaston alle`, j.nuotit && j.nuotit.maara === (w < 340 ? 2 : 3) && j.nuotit.vasen >= 0 && j.nuotit.oikea >= 0 && (w < 340 || j.nuotit.vasen < 30 && j.nuotit.oikea < 36 && j.nuotit.oikea - j.nuotit.vasen > 12 && j.nuotit.oikea - j.nuotit.vasen < 22) && j.nuotit.ala > 2 && j.nuotit.viivastonAlle <= 1, JSON.stringify(j.nuotit));
    tulos(`${w} px: ei vaakavieritystä pinossa`, j.vaaka);
    if (KUVAT) await p.screenshot({ path: path.join(KUVAT, `postihuilu-pino-${w}.png`), clip: { x: 0, y: 0, width: w, height: 640 } });
    await p.click('.ratas'); await p.click('#laatikko-osio > summary'); await p.waitForTimeout(200);
    const aset = () => p.evaluate(() => {
      const l = document.querySelector('#huilulohko-aset'), svg = l.querySelector('svg.huilukuvio'), nu = svg.querySelector('path.nuotit'), nb = nu && nu.getBoundingClientRect();
      const R = l.getBoundingClientRect(), kuvio = svg.querySelector('path').getBBox();
      const arvo = document.querySelector('#laatikko-arvo').getBoundingClientRect(), kentta = document.querySelector('#laatikko-koodi').getBoundingClientRect();
      const kysy = document.querySelector('#laatikko-kysy').getBoundingClientRect(), nappi = l.querySelector('.huilunappi').getBoundingClientRect();
      return { arvoKentta: arvo.left - kentta.right, arvoRivi: Math.abs((arvo.top + arvo.bottom) / 2 - (kentta.top + kentta.bottom) / 2),
        nappi: nappi.right - arvo.right, viivatLohkossa: kuvio.x >= 0, viivatNappi: svg.querySelector('path').getBoundingClientRect().right - nappi.right, viiva: [...l.querySelectorAll('*')].some(e => parseFloat(getComputedStyle(e).borderBottomWidth) > 0 && !e.matches('button')), nuotit: nb && { vasen: nb.left - nappi.left, oikea: nappi.right - nb.right, ala: nappi.top - nb.bottom, maara: (nu.getAttribute('d').match(/M/g) || []).length },
        vaaka: document.documentElement.scrollWidth <= innerWidth };
    });
    const ka = await kulmat('#huilulohko-aset');
    tulos(`${w} px: asetuksissa napin alku alakulmassa, kolme väliä, loppu alamäen puolivälissä`, kpOk(ka) && ka.sylissa && ka.vasen < .05 && ka.vasenAla && ka.kulmia === 4, JSON.stringify(ka));
    const a = await aset();
    tulos(`${w} px: Arvo laatikkolauseen tekstikentän oikealla puolella samalla rivillä`, a.arvoKentta >= 4 && a.arvoKentta <= 12 && a.arvoRivi < 1, JSON.stringify(a));
    tulos(`${w} px: Soita huilua! oikeassa reunassa, viuhka lohkon sisällä, ei erotteluviivaa, ei nuotteja ennen painallusta`, Math.abs(a.nappi) < .5 && a.viivatLohkossa && !a.viiva && !a.nuotit, JSON.stringify(a));
    await p.fill('#laatikko-koodi', LAUSE); await p.click('#laatikko-tallenna'); await p.waitForTimeout(400);
    const a2 = await aset();
    tulos(`${w} px: asetuksissa siksak päättyy tasan napin oikeaan reunaan`, Math.abs(a2.viivatNappi) < .6, Math.round(a2.viivatNappi * 100) / 100);
    tulos(`${w} px: asetuksissa painallus tuo kolme nuottia koko napin x-välille`, a2.nuotit && a2.nuotit.maara === 3 && a2.nuotit.vasen >= 0 && a2.nuotit.oikea >= 0 && a2.nuotit.vasen < 30 && a2.nuotit.oikea < 36 && a2.nuotit.oikea - a2.nuotit.vasen > 12 && a2.nuotit.oikea - a2.nuotit.vasen < 22 && a2.nuotit.ala > 2, JSON.stringify(a2.nuotit));
    tulos(`${w} px: ei vaakavieritystä asetuksissa`, a2.vaaka);
    if (KUVAT) await (await p.$('#laatikko-osio')).screenshot({ path: path.join(KUVAT, `postihuilu-asetukset-${w}.png`) });
    tulos(`${w} px: ei sivuvirheitä`, !virheet.length, virheet.join(' | '));
    await p.close();
  }
  await b.close();
  console.log(viat ? viat + ' vikaa.' : 'Kaikki kunnossa.');
  process.exit(viat ? 1 : 0);
})();
