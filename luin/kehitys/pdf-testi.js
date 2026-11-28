// Imuroi › PDF (luin/pdf/pdf.js, luin.html imuroiPdf(); käyttäjän pyyntö). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/pdf-testi.js [kuvakansio]
// Tarkistaa: ULOSTUS › Imuroi › .md ja PDF; PDF latautuu nimellä <slug>.pdf, nappi kertoo edistymisen ja kuittaa; A5-sivut,
// metatiedot, kirjanmerkit otsikoista ja linkit; PDF:n lohkojen sisennys, välit ja tasaus ovat lukimen (em-suhteina, erot vain
// pääluvun ylävälissä ja sivunvaihdon katkaisemissa lohkoissa); kreikka, liettua, IAST, kyrillinen, nuoli ja ✓ ilman puuttuvia
// merkkejä, emoji ilmoitetaan puuttuvana; lomitettu käännös pinosta ei muuta avointa tekstiä; piilokehys poistuu; toinen
// painallus kesken työn ei aloita toista. Jos pdftotext on asennettu, myös PDF:n teksti (sanat, alaviite, ei pehmeitä tavuviivoja).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { avaaOsa } = require('./porras-apu');
const PDFLib = require('../pdf/pdf-lib-1.17.1.min.js');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const kappale = (n) => Array.from({ length: n }, (_, i) => `Tämä on koetekstin kappale numero ${i + 1}, jossa on tarpeeksi sanoja rivittymään useammalle riville ja tavuttumaan suomen säännöin: epäjärjestelmällisyydestään, kansalaisoikeuksien ja käyttöliittymäsuunnittelijoiden.`).join('\n\n');
const MD = `---
tekijä: Testi Kirjoittaja
---

# Koeteksti PDF:lle

*Alaotsikko*

## 1. Ensimmäinen luku

${kappale(3)}

Kappale, jossa on alaviite.^[Alaviitteen teksti, joka näkyy sivun alalaidassa.] Lisäksi **lihava**, *kursiivi* ja ***molemmat***.

> Lainaus, jonka vasemmalla on viiva. Lainauksessa on toinen virke.

- ensimmäinen luettelon kohta
- toinen kohta

1. numeroitu yksi
2. numeroitu kaksi

### 1.1 Alaluku

Kreikkaa: ἀρετὴ καὶ φρόνησις. Liettuaa: Ąžuolas ir šešėlis. IAST: dharmaḥ, ṛṣi. Venäjää: Толстой. Nuoli → ja ✓ sekä ≥ 3. Emoji 🙂 puuttuu.

| Sarake | Toinen |
| --- | --- |
| a | 1 |
| b | 2 |

Linkki [esimerkkiin](https://example.org/sivu).

## 2. Toinen luku

${kappale(14)}
`;
// Lomitettu käännös (alkuteksti ja käännös lainauksena), jotta merkitseAlkuteksti() ajetaan PDF:lle pinosta.
const LOMITUS = `---
ladonta: lomitettu käännös
---

# Lomitettu koe

## Α

<sup>1</sup> Μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος οὐλομένην.

> 1 Viha, laula jumalatar, Peleun pojan Akhilleun turmiollinen viha.
`;

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const ctx = await selain.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));

  await page.goto(U + 'luin.html#');
  await page.evaluate(([md, lom]) => {
    localStorage.setItem('luin-lista', JSON.stringify([
      { id: 'p-koe', added: 2, title: 'Koeteksti PDF:lle', src: 'paikallinen' },
      { id: 'p-lomitus', added: 1, title: 'Lomitettu koe', src: 'paikallinen' }]));
    localStorage.setItem('luin-teksti:p-koe', JSON.stringify(md));
    localStorage.setItem('luin-teksti:p-lomitus', JSON.stringify(lom));
  }, [MD, LOMITUS]);
  await page.reload(); await page.waitForSelector('#nimikkeet li');

  // 1. Valikko: ULOSTUS › Imuroi › .md ja PDF.
  await page.click('#nimikkeet button.jako[data-id="p-koe"]');
  await avaaOsa(page, 'pdf');
  const kohdat = await page.$$eval('#pop .p-ali.auki button[data-k]', bs => bs.map(b => b.dataset.k + '=' + b.textContent.trim()).join(' | '));
  tulos('Imuroi: paluu, .md ja PDF', kohdat === 'takaisin=Imuroi | lataa=.md | pdf=PDF', kohdat);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'pdf-imuroi.png') });

  // 2. PDF: lataus, edistyminen, toinen painallus kesken, kuittaus.
  const tilat = [];
  const vahti = setInterval(() => { page.$eval('#pop button[data-k="pdf"]', b => b.textContent).then(t => tilat.push(t), () => {}); }, 150);
  const t0 = Date.now();
  const latausP = page.waitForEvent('download', { timeout: 180000 });
  await page.click('#pop button[data-k="pdf"]');
  await page.waitForTimeout(100);
  await page.click('#pop button[data-k="pdf"]');
  const kesken = await page.$eval('#pop button[data-k="pdf"]', b => b.textContent);
  const lataus = await latausP;
  clearInterval(vahti);
  const ms = Date.now() - t0;
  const tiedosto = await lataus.path();
  const tavut = fs.readFileSync(tiedosto);
  if (KUVAT) fs.copyFileSync(tiedosto, path.join(KUVAT, 'pdf-koe.pdf'));
  await page.waitForTimeout(200);
  const kuittaus = await page.evaluate(() => ({ nappi: (document.querySelector('#pop button[data-k="pdf"]') || {}).textContent, viesti: document.getElementById('viesti').textContent, kehyksia: document.querySelectorAll('iframe').length }));
  tulos('PDF latautuu nimellä koeteksti-pdf-lle.pdf', lataus.suggestedFilename() === 'koeteksti-pdf-lle.pdf' && tavut.slice(0, 5).toString() === '%PDF-', lataus.suggestedFilename() + ', ' + tavut.length + ' t, ' + ms + ' ms');
  tulos('toinen painallus kesken ei aloita toista', kesken === 'PDF on jo tekeillä', kesken);
  tulos('nappi kertoo edistymisen ja kuittaa', tilat.some(t => /^Ladotaan… \d+ s\.$/.test(t)) && tilat.some(t => /^Kirjoitetaan… \d+\/\d+$/.test(t)) && kuittaus.nappi === 'PDF imuroitu.',
    [...new Set(tilat)].slice(0, 4).join(' / ') + ' … ' + kuittaus.nappi);
  tulos('viesti: ladattu ja emoji puuttuvana', kuittaus.viesti === 'Ladattu: koeteksti-pdf-lle.pdf (1 merkkiä puuttui kirjasimesta)', kuittaus.viesti);
  tulos('piilokehys poistettu', kuittaus.kehyksia === 0, String(kuittaus.kehyksia));

  // 3. PDF:n rakenne pdf-libillä.
  const pdf = await PDFLib.PDFDocument.load(tavut);
  const sivut = pdf.getPages(), koko = sivut[0].getSize();
  tulos('A5-sivut, vähintään kolme', sivut.length >= 3 && Math.abs(koko.width - 419.53) < .5 && Math.abs(koko.height - 595.28) < .5, sivut.length + ' s., ' + koko.width.toFixed(2) + ' × ' + koko.height.toFixed(2));
  tulos('metatiedot: otsikko, tekijä, kieli', pdf.getTitle() === 'Koeteksti PDF:lle' && pdf.getAuthor() === 'Testi Kirjoittaja' && /fi/.test(String(pdf.catalog.get(PDFLib.PDFName.of('Lang')))),
    [pdf.getTitle(), pdf.getAuthor(), String(pdf.catalog.get(PDFLib.PDFName.of('Lang')))].join(' / '));
  const outl = pdf.catalog.lookup(PDFLib.PDFName.of('Outlines'));
  const kirjanmerkit = [];
  const kayLapi = (o, taso) => { for (let x = o.lookup(PDFLib.PDFName.of('First')); x; x = x.lookup(PDFLib.PDFName.of('Next'))) { kirjanmerkit.push(taso + ':' + x.lookup(PDFLib.PDFName.of('Title')).decodeText()); if (x.get(PDFLib.PDFName.of('First'))) kayLapi(x, taso + 1); } };
  if (outl) kayLapi(outl, 1);
  tulos('kirjanmerkit otsikoista tasoittain', kirjanmerkit.join(' | ') === '1:1. Ensimmäinen luku | 2:1.1 Alaluku | 1:2. Toinen luku', kirjanmerkit.join(' | '));
  const linkit = sivut.flatMap(s => { const a = s.node.Annots(); return a ? a.asArray().map(r => pdf.context.lookup(r)) : []; })
    .map(a => { const t = a.lookup(PDFLib.PDFName.of('A')); return t ? t.lookup(PDFLib.PDFName.of('URI')).decodeText() : 'sisäinen'; });
  tulos('ulkoinen linkki toimii PDF:ssä', linkit.includes('https://example.org/sivu'), linkit.join(', '));

  // 4. Teksti (vain, jos pdftotext on asennettu).
  let teksti = null;
  try { teksti = execFileSync('pdftotext', ['-enc', 'UTF-8', tiedosto, '-'], { encoding: 'utf8' }); } catch (e) { console.log('—    pdftotext puuttuu: PDF:n tekstiä ei tarkistettu'); }
  if (teksti != null) {
    const puuttuu = ['Koeteksti PDF:lle', 'ἀρετὴ', 'Ąžuolas', 'šešėlis', 'dharmaḥ', 'ṛṣi', 'Толстой', '→', '✓', '≥', 'Alaviitteen teksti', '1. Ensimmäinen luku', 'numeroitu kaksi', 'Sarake']
      .filter(s => teksti.indexOf(s) < 0);
    tulos('teksti: sanat, merkit, alaviite ja luettelo PDF:ssä', !puuttuu.length, puuttuu.length ? 'puuttuu: ' + puuttuu.join(', ') : '');
    const katkot = (teksti.match(/\p{L}-\n+\p{L}/gu) || []).length, pehmeat = teksti.split('\u00ad').length - 1;
    tulos('teksti: ei pehmeitä tavuviivoja, rivinvaihdon tavuviiva näkyvä', !pehmeat && katkot > 0, pehmeat + ' pehmeää, ' + katkot + ' tavuviivalla katkaistua riviä');
  }

  // 5. PDF:n lohkotyylit ovat lukimen: avoimen tekstin lukija ja saman tekstin PDF-kehys data-b-lohkoittain.
  await page.goto(U + 'luin.html#id=p-koe');
  await page.waitForFunction(() => { const a = document.querySelector('#teksti'); return a && a.textContent.length > 200 && !document.querySelector('#lukija').hidden; });
  const vertailu = await page.evaluate(async () => {
    const mitat = (juuri, w, vali) => {
      const o = {};
      juuri.querySelectorAll('[data-b]:not(.pdf-sivu)' + (vali || '')).forEach(el => {
        if (o[el.dataset.b]) return;
        const cs = w.getComputedStyle(el), f = parseFloat(cs.fontSize), em = v => Math.round(parseFloat(v) / f * 100) / 100;
        o[el.dataset.b] = el.tagName + (el.hasAttribute('data-split-to') ? '(katk)' : '') + ' ' + [em(cs.textIndent), em(cs.marginTop), em(cs.marginBottom), cs.textAlign.replace('start', 'left')].join(' ');
      });
      return o;
    };
    const lukin = mitat(document.querySelector('#teksti'), window);
    const e = JSON.parse(localStorage.getItem('luin-lista')).filter(x => x.id === 'p-koe')[0];
    await new Promise((ok, ei) => { if (window.LuinPdf) return ok(); const s = document.createElement('script'); s.src = 'luin/pdf/pdf.js'; s.onload = ok; s.onerror = ei; document.head.appendChild(s); });
    let pdf = null;
    await LuinPdf.tee(window.__luin.pdfAineisto(e, await LuinTekstit.lue(e.id)), (x) => {
      if (x.vaihe === 'kirjoitus' && x.sivu === 1) { const f = document.querySelector('iframe'); pdf = mitat(f.contentDocument.querySelector('.pagedjs_pages'), f.contentWindow, ':not([data-split-from])'); }
    });
    const erot = [];
    Object.keys(lukin).forEach(k => {
      const a = lukin[k], b = pdf[k];
      if (a === b) return;
      // Pääluku alkaa sivun ylälaidasta ilman yläväliä; sivunvaihdon katkaisema lohko menettää alavälinsä.
      if (/^H2 /.test(a) && b === a.replace(/^(H2 [-\d.]+) [\d.]+ /, '$1 0 ')) return;
      if (b && /\(katk\)/.test(b)) return;
      erot.push(k + ': ' + a + ' | ' + b);
    });
    return { n: Object.keys(lukin).length, erot };
  });
  tulos('PDF:n sisennys, välit ja tasaus ovat lukimen', vertailu.n > 20 && !vertailu.erot.length, vertailu.n + ' lohkoa' + (vertailu.erot.length ? ': ' + vertailu.erot.slice(0, 5).join(' ; ') : ''));

  // 6. Lomitettu teksti pinosta, kun toinen teksti on auki: avoin teksti ei muutu.
  const ennen = await page.evaluate(() => ({ html: document.querySelector('#teksti').innerHTML, id: window.__luin.nyt().e.id }));
  const lom = await page.evaluate(async () => {
    const e = JSON.parse(localStorage.getItem('luin-lista')).filter(x => x.id === 'p-lomitus')[0];
    const o = window.__luin.pdfAineisto(e, await LuinTekstit.lue(e.id));
    const r = await LuinPdf.tee(o);
    return { alku: (o.html.match(/class="alku-teksti"/g) || []).length, kaannos: /blockquote class="kaannos"/.test(o.html), sivuja: r.sivuja, puuttuvat: r.puuttuvat };
  });
  const jalkeen = await page.evaluate(() => ({ html: document.querySelector('#teksti').innerHTML, id: window.__luin.nyt().e.id }));
  tulos('lomitettu käännös: alkuteksti merkitty, kreikka kirjasimessa', lom.alku > 0 && lom.kaannos && lom.puuttuvat === 0, JSON.stringify(lom));
  tulos('avoin teksti ennallaan PDF:n jälkeen', ennen.id === jalkeen.id && ennen.html === jalkeen.html);

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
