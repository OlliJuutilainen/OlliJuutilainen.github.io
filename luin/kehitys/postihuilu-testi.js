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
  tulos(`T ${T}: viisi reikää, sivukärjet irti reunaviivan sisäpinnasta`, m.reiat.length === 5 && m.B < m.sisa - sw / 2, m.sisa - m.B);
  tulos(`T ${T}: huilun pituus täysikokoisten reikien mukainen`, lahes(m.L, m.bk + m.sisa * .9 + 6 * m.sisa / H.LOGO + sw / 2), m.L);
  tulos(`T ${T}: logon mittasuhde`, lahes(m.B / m.A, H.LOGO), m.B / m.A);
  tulos(`T ${T}: reiät hipaisevat (ei rakoa, ei lomitusta)`, m.reiat.every((x, i) => !i || lahes(x - m.reiat[i - 1], 2 * m.A)));
  tulos(`T ${T}: alin alakärki pohjaviivan sisäpinnassa (ehdoton)`, lahes(m.reiat[m.reiat.length - 1] + m.A, m.L - sw / 2));
  tulos(`T ${T}: ylin reikä nokan jälkeen`, m.reiat[0] - m.A > m.bk);
  // Ääniaukko (käyttäjä 12.11.2026): siivu ja ääriviiva samassa linjassa, leuka 45° ja puolivälissä vaakaan, ilmaa reikiin ja seiniin.
  const a = m.aukko, au = H.aukko(m), u = au.ulko, i = a.viiva / 2;
  const v = au.viiva.slice(1).split('L').map(p => p.split(' ').map(Number));
  tulos(`T ${T}: aukko nokan suoran osan jälkeen`, a.x0 > m.bk);
  tulos(`T ${T}: ääriviivan ulkoreuna siivun päiden linjassa`, Math.abs(v[0][1] - i + a.W) < .006 && Math.abs(v[v.length - 1][1] + i - a.W) < .006);
  tulos(`T ${T}: leuka ensin 45°, sitten vaakaan puolivälissä keskiviivalle`, lahes(u[2][0] - u[1][0], u[2][1] - u[1][1]) && lahes(Math.abs(u[2][1]), a.W / 2) && lahes(u[3][0], u[2][0]));
  tulos(`T ${T}: rako aukon leuasta ylimmän reiän kärkeen 0,2 × paksuus`, lahes(m.reiat[0] - m.A - a.x2, T * .2), m.reiat[0] - m.A - a.x2);
  tulos(`T ${T}: aukko irti seinistä`, m.sisa - a.W > sw, m.sisa - a.W);
}
// Viuhka (käyttäjä 12.11.2026): kaikki viivat lähtevät kärjestä samaan suuntaan (huilun akseli alas), eivät leikkaa
// toisiaan, ja ylin viiva ei nouse kärjen yläpuolelle eikä käänny taaksepäin (sinkoutuminen).
for (const keskiY of [20, 30, 40]) {
  const k = H.kaista({ vasen: 150, yla: -8, keskiY, oikea: 358 });
  const viivat = k.svg.match(/<path d="([^"]+)"/)[1].split('M').filter(Boolean).map(v => v.split('L').map(p => p.split(' ').map(Number)));
  const alku = viivat.map(v => v[0]), suunta = viivat.map(v => Math.atan2(v[1][1] - v[0][1], v[1][0] - v[0][0]) * 180 / Math.PI);
  const yksi = alku.every(p => Math.hypot(p[0] - alku[0][0], p[1] - alku[0][1]) < 1e-6) && suunta.every(a => Math.abs(a - 112) < 1);
  // Ylin viiva: y kasvaa (alas) tai pysyy, kunnes se on vaakasuora; x ei palaa taaksepäin kaarteen jälkeen.
  const ylin = viivat[viivat.length - 1].filter(p => p[0] <= k.xz), alin = viivat[0].filter(p => p[0] <= k.xz);
  const eiNouse = ylin.every((p, i) => !i || p[1] >= ylin[i - 1][1] - 1e-6);
  const ulkona = Math.min(...alin.map(p => p[0])) < Math.min(...ylin.map(p => p[0])) - 1;
  // Ei risteä: naapuriviivojen janat eivät leikkaa toisiaan yhteisen varren jälkeen.
  const leikkaa = (a, b, c, d) => { const r = (p, q, s) => (q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]);
    return r(a, b, c) * r(a, b, d) < 0 && r(c, d, a) * r(c, d, b) < 0; };
  const jarjestys = viivat.every((v, i) => !i || !v.some((p, j) => j > 1 && j < v.length - 1 && viivat[i - 1].some((q, l) => l > 1 && l < viivat[i - 1].length - 1 && leikkaa(p, v[j + 1], q, viivat[i - 1][l + 1]))));
  tulos(`viuhka (keskiY ${keskiY}): yhdestä alas suuntautuvasta vektorista, ylin ei nouse, alin ulkokaarella, ei risteä`, yksi && eiNouse && ulkona && jarjestys,
    JSON.stringify({ yksi, eiNouse, ulkona, jarjestys }));
}
// Nuotit (käyttäjän säännöt 12.11.2026): aina viivalla, jokaiselle viivalle yksi ääni kierrosta kohti, jakson keskellä,
// ensimmäinen ja viimeinen jakso soi, ei kahta tyhjää peräkkäin, ei samaa viivaa peräkkäin eikä porrasta. Eri napin leveyksillä (3–12 jaksoa).
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const nv = { paikka: 0, ulos: 0, reuna: 0, aukot: 0, porras: 0, toisto: 0, paallekkain: 0, kallistus: 0, loppu: 0, viivat: 0 }; let kerrat = 0, aukollisia = 0;
for (const [x0, x1] of [[241, 358], [237, 344], [617, 734], [300, 358], [100, 358]]) {
  const k = H.kaista({ vasen: 150, yla: -8, keskiY: 40, oikea: x1 }), kes = H.jaksonKeskit(k, x0, x1);
  for (let i = 0; i < 2000; i++) {
    const q = H.nuottiPaikat(k, x0, x1, H.arvoNuotit(rnd)); kerrat++;
    for (const a of q) {
      if (a.p < 0 || a.p > 4 || a.p !== Math.round(a.p)) nv.ulos++;
      if (kes.indexOf(a.x) < 0 || Math.abs(a.y - k.y(a.x, a.p)) > 1e-9 || a.x > k.loppu) nv.paikka++;

    }
    if (new Set(q.map(a => a.x)).size !== q.length) nv.paallekkain++;
    // Jokaiselle viivalle yksi ääni: jokainen viiden ryhmä on eri viivoilla, ja vähintään viisi soi, kun jaksoja on viisi.
    for (let r = 0; r < q.length; r += 5) { const ryhma = q.slice(r, r + 5).map(a => a.p); if (new Set(ryhma).size !== ryhma.length) nv.viivat++; }
    if (kes.length >= 5 && q.length < 5) nv.viivat++;
    // Kallistus: alamäessä (viiva laskee oikealle) 22° oikealle, ylämäessä 0°.
    for (const a of q) {
      const alamaki = k.y(a.x + .5, 0) > k.y(a.x - .5, 0), kl = k.nuottiKallistus(a.x);
      if (alamaki ? Math.abs(kl - 22 * Math.PI / 180) > 1e-9 : kl !== 0) nv.kallistus++;
    }
    if (Math.abs((k.loppu - k.xz) / (k.jakso / 2) - Math.round((k.loppu - k.xz) / (k.jakso / 2))) > 1e-9 || k.loppu > x1 || x1 - k.loppu >= k.jakso / 2) nv.loppu++;
    const soi = kes.map(x => q.some(a => a.x === x));
    if (!soi[0] || !soi[soi.length - 1]) nv.reuna++;
    for (let j = 1; j < soi.length; j++) if (!soi[j] && !soi[j - 1]) nv.aukot++;
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

// Selaimessa: hylly ja asetukset ennen ja jälkeen Soita huilua! -painalluksen.
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
    const hylly = () => p.evaluate(() => {
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
        viivatOikea: l.getBoundingClientRect().right - viivat.right,
        nuotit: nb && { vasen: nb.left - nappi.left, oikea: nappi.right - nb.right, ala: syote.top - nb.bottom, viivastonAlle: nb.bottom - viivat.bottom },
        merkityt: document.querySelectorAll('.n-ots svg.merkitty').length,
        merkkiRako: (() => { const m = os.querySelector('svg.merkitty').getBoundingClientRect(); return [m.top < hr.bottom && m.bottom > hr.top, hr.left - m.right]; })(),
        huilutetut: document.querySelectorAll('.n-ots svg.huilutettu').length, nOts: [...document.querySelectorAll('.n-ots')].map(x => x.textContent),
        vaaka: document.documentElement.scrollWidth <= innerWidth };
    });
    const e = await hylly();
    tulos(`${w} px: huilu i-napin oikealla puolella, ei kosketa siihen`, e.kysyRako > 0, Math.round(e.kysyRako * 10) / 10);
    tulos(`${w} px: huilutetun huilun keskikohta 0,29 em perusviivan yläpuolella`, Math.abs(e.keski - .29) < .02, Math.round(e.keski * 1000) / 1000);
    tulos(`${w} px: ei nuotteja ennen painallusta`, !e.nuotit);
    tulos(`${w} px: merkintöjen merkki vain merkityllä, huilu sen oikealla puolella samalla rivillä`, e.merkityt === 1 && e.merkkiRako[0] && e.merkkiRako[1] > 2, e.merkkiRako[1].toFixed(1));
    tulos(`${w} px: siksak päättyy kokonaiseen palaan lohkon sisällä`, e.viivatOikea >= 0 && e.viivatOikea < 15.5, Math.round(e.viivatOikea * 10) / 10 + ' px oikeaan reunaan');
    tulos(`${w} px: huilutettu vain kantautuneella, nimet ennallaan`, e.huilutetut === 1 && e.nOts.join('|') === 'Kant ja eläinetiikka|Käyttöohje');
    await p.fill('#lisaa-syote', 'lyhyt'); await p.click('#lisaa-kentta .huilunappi'); await p.waitForTimeout(200);
    tulos(`${w} px: kelpaamaton lause ei soita`, !(await hylly()).nuotit);
    await p.fill('#lisaa-syote', LAUSE); await p.click('#lisaa-kentta .huilunappi'); await p.waitForTimeout(400);
    const j = await hylly();
    tulos(`${w} px: painallus tuo nuotit napin yläpuolelle, eivät viivaston alle`, j.nuotit && j.nuotit.vasen >= 0 && j.nuotit.oikea >= 0 && j.nuotit.ala > 2 && j.nuotit.viivastonAlle <= 1, JSON.stringify(j.nuotit));
    tulos(`${w} px: ei vaakavieritystä hyllyllä`, j.vaaka);
    if (KUVAT) await p.screenshot({ path: path.join(KUVAT, `postihuilu-hylly-${w}.png`), clip: { x: 0, y: 0, width: w, height: 640 } });
    await p.click('.ratas'); await p.click('#laatikko-osio > summary'); await p.waitForTimeout(200);
    const aset = () => p.evaluate(() => {
      const l = document.querySelector('#huilulohko-aset'), svg = l.querySelector('svg.huilukuvio'), nu = svg.querySelector('path.nuotit'), nb = nu && nu.getBoundingClientRect();
      const R = l.getBoundingClientRect(), kuvio = svg.querySelector('path').getBBox();
      const arvo = document.querySelector('#laatikko-arvo').getBoundingClientRect(), kentta = document.querySelector('#laatikko-koodi').getBoundingClientRect();
      const kysy = document.querySelector('#laatikko-kysy').getBoundingClientRect(), nappi = l.querySelector('.huilunappi').getBoundingClientRect();
      return { arvoKentta: arvo.left - kentta.right, arvoRivi: Math.abs((arvo.top + arvo.bottom) / 2 - (kentta.top + kentta.bottom) / 2),
        nappi: nappi.right - arvo.right, viivatLohkossa: kuvio.x >= 0, viiva: [...l.querySelectorAll('*')].some(e => parseFloat(getComputedStyle(e).borderBottomWidth) > 0 && !e.matches('button')), nuotit: nb && { vasen: nb.left - nappi.left, oikea: nappi.right - nb.right, ala: nappi.top - nb.bottom },
        vaaka: document.documentElement.scrollWidth <= innerWidth };
    });
    const a = await aset();
    tulos(`${w} px: Arvo laatikkolauseen tekstikentän oikealla puolella samalla rivillä`, a.arvoKentta >= 4 && a.arvoKentta <= 12 && a.arvoRivi < 1, JSON.stringify(a));
    tulos(`${w} px: Soita huilua! oikeassa reunassa, viuhka lohkon sisällä, ei erotteluviivaa, ei nuotteja ennen painallusta`, Math.abs(a.nappi) < .5 && a.viivatLohkossa && !a.viiva && !a.nuotit, JSON.stringify(a));
    await p.fill('#laatikko-koodi', LAUSE); await p.click('#laatikko-tallenna'); await p.waitForTimeout(400);
    const a2 = await aset();
    tulos(`${w} px: asetuksissa painallus tuo nuotit napin yläpuolelle`, a2.nuotit && a2.nuotit.vasen >= 0 && a2.nuotit.oikea >= 0 && a2.nuotit.ala > 2, JSON.stringify(a2.nuotit));
    tulos(`${w} px: ei vaakavieritystä asetuksissa`, a2.vaaka);
    if (KUVAT) await (await p.$('#laatikko-osio')).screenshot({ path: path.join(KUVAT, `postihuilu-asetukset-${w}.png`) });
    tulos(`${w} px: ei sivuvirheitä`, !virheet.length, virheet.join(' | '));
    await p.close();
  }
  await b.close();
  console.log(viat ? viat + ' vikaa.' : 'Kaikki kunnossa.');
  process.exit(viat ? 1 : 0);
})();
