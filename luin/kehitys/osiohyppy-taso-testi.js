// Osiohypyn merkkipaalun taso (osioPaalut(), käyttäjän säännöt 20.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/osiohyppy-taso-testi.js
// Valtion 1. kirjan kaltaisessa tekstissä (yksi luku, Stephanus-osiot yläindeksikohdista) pitkä painallus hyppää osiosta
// seuraavaan eikä kirjan alusta loppuun. Taso, jonka paalut osuvat alle kahdelle sivulle, ei kelpaa; luku, kun sen askel on
// enintään OSIO_ASKEL sivua, muuten osio; kohta vain ilman lukuja ja osioita; ilman tasoa 10 sivua.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const KPL = 'κατέβην χθὲς εἰς Πειραιᾶ μετὰ Γλαύκωνος τοῦ Ἀρίστωνος προσευξόμενός τε τῇ θεῷ καὶ ἅμα τὴν ἑορτὴν βουλόμενος θεάσασθαι τίνα τρόπον ποιήσουσιν ἅτε νῦν πρῶτον ἄγοντες. καλὴ μὲν οὖν μοι καὶ ἡ τῶν ἐπιχωρίων πομπὴ ἔδοξεν εἶναι, οὐ μέντοι ἧττον ἐφαίνετο πρέπειν ἣν οἱ Θρᾷκες ἔπεμπον.';
// Stephanus-sivut 327–346, kohdat a–e: 20 osiota, 100 kohtaa.
const kohdat = [];
for (let s = 327; s < 347; s++) for (const k of 'abcde') kohdat.push(`^${s}${k}^ ${KPL}`);
const ETU = '---\nkohdat: yläindeksit\n---\n\n# Πολιτεία Αʹ\n\n';
const TEKSTIT = {
  valtio: ETU + '## Αʹ\n\n' + kohdat.join('\n\n') + '\n',
  valtioIlmanLukua: ETU + kohdat.join('\n\n') + '\n',
  // Pelkät numerokohdat (de Finibus): ei osioita.
  kohdatVain: ETU + Array.from({ length: 60 }, (_, i) => `^${i + 1}^ ${KPL}`).join('\n\n') + '\n',
  // Artikkeli: 6 lukua, kussakin 2 osiota, lyhyet luvut.
  artikkeli: '# Artikkeli\n\n' + Array.from({ length: 6 }, (_, i) => `## ${i + 1}. Luku\n\n` + [1, 2].map(j => `### ${i + 1}.${j} Osio\n\n` + Array(3).fill(KPL).join('\n\n')).join('\n\n')).join('\n\n') + '\n',
  // Pitkä teksti: 3 pitkää lukua, kussakin 8 osiota.
  pitka: '# Kirja\n\n' + Array.from({ length: 3 }, (_, i) => `## ${i + 1}. Luku\n\n` + Array.from({ length: 8 }, (_, j) => `### ${i + 1}.${j + 1} Osio\n\n` + Array(10).fill(KPL).join('\n\n')).join('\n\n')).join('\n\n') + '\n',
  ilman: '# Ilman otsikoita\n\n' + Array(80).fill(KPL).join('\n\n') + '\n',
};

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const kk = await b.newContext({ viewport: { width: 412, height: 824 }, hasTouch: true, isMobile: true });
  const p = await kk.newPage();
  const sivuvirheet = [];
  p.on('pageerror', e => sivuvirheet.push(e.message));
  const avaa = async md => {
    await p.goto(BASE + 'luin.html');
    await p.evaluate(md => {
      localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' }));
      localStorage.setItem('luin-asetukset', JSON.stringify({ av: 10, teema: 'vaalea', sivutus: 'sivut', sivuReuna: 1, sivuPyyhka: 0, sivunapit: 1, koko: 18, kokoKasin: 1 }));
    }, md);
    await p.goto('about:blank'); await p.goto(BASE + 'luin.html#tuo');
    await p.waitForFunction(() => window.__luin && window.__luin.nyt() && document.querySelector('#teksti [data-b]'));
    await p.waitForTimeout(800);
    return p.evaluate(() => ({ P: window.__luin.osioPaalut(), n: window.__luin.tila.sivuja }));
  };
  // Pitkä painallus PageDown: keydown, 1,3 s, keyup.
  const pitka = async () => { await p.keyboard.down('PageDown'); await p.waitForTimeout(1300); await p.keyboard.up('PageDown'); await p.waitForTimeout(300); return p.evaluate(() => window.__luin.tila.sivu); };
  const lyhyt = async () => { await p.keyboard.press('PageDown'); await p.waitForTimeout(300); return p.evaluate(() => window.__luin.tila.sivu); };

  for (const [nimi, md] of Object.entries(TEKSTIT)) {
    const { P, n } = await avaa(md);
    console.log(`  ${nimi}: ${n} sivua, taso ${P ? P.taso : '-'}, paaluja ${P ? P.sivut.length : 0}` + (P ? ' (' + P.sivut.slice(0, 12).join(' ') + (P.sivut.length > 12 ? ' …' : '') + ')' : ''));
    if (nimi === 'valtio' || nimi === 'valtioIlmanLukua') {
      tulos(nimi + ': taso osio', P && P.taso === 2, P && 'taso ' + P.taso);
      const s1 = await pitka();
      tulos(nimi + ': pitkä painallus vie seuraavaan osioon, ei loppuun', s1 === P.sivut.find(x => x > 0) && s1 < n - 1, `sivu ${s1} / ${n - 1}`);
      const s2 = await pitka();
      tulos(nimi + ': toinen pitkä painallus seuraavaan', s2 === P.sivut.find(x => x > s1), `sivu ${s2}`);
      const s3 = await lyhyt();
      tulos(nimi + ': lyhyt painallus kääntää yhden sivun', s3 === s2 + 1, `sivu ${s3}`);
    }
    if (nimi === 'kohdatVain') tulos('pelkät kohdat: taso kohta', P && P.taso === 3, P && 'taso ' + P.taso);
    if (nimi === 'artikkeli') tulos('artikkeli: taso luku (askel ≤ 20 sivua)', P && P.taso === 1 && n / P.sivut.length <= 20, P && `taso ${P.taso}, askel ${(n / P.sivut.length).toFixed(1)}`);
    if (nimi === 'pitka') tulos('pitkä teksti: taso osio (luvun askel > 20 sivua)', P && P.taso === 2, P && `taso ${P.taso}, luvun askel ${(n / 3).toFixed(1)}`);
    if (nimi === 'ilman') {
      tulos('ilman otsikoita: ei tasoa', P === null);
      const s1 = await pitka();
      tulos('ilman otsikoita: 10 sivua', s1 === Math.min(10, n - 1), `sivu ${s1}`);
    }
  }
  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
