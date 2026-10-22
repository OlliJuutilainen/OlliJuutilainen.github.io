// Latomon selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/latomo-testi.js [kuvakansio]
// Tarkistaa: tutkielma läpäisee Latomon muuttumattomana, tyypin ja kenttien vaikutuksen etukenttään ja
// viitteeseen, lisäkentät (osana teosta avaa toimittajat, vuosikerran ja sivut), MarkDownload-leikkeen
// (oletuspohja ja latomo-ohje.html:n suositeltu pohja), pelkän tekstin ehdotukset, julkaisuajan
// tarkkuuden, siirron Luiniin (lukulista ja jakovalikon lukutiedot ehdotuksena) ja puhelimen leveyden.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }
const KANT = fs.readFileSync(path.join(JUURI, 'luin/tekstit/kant-ja-elainetiikka.md'), 'utf8');

// MarkDownloadin oletuspohjalla tallennettu leike (muuttujat täytettyinä).
const OLETUSLEIKE = `---
created: 2026-10-08T10:15:42 (UTC +03:00)
tags: [markdown, writing]
source: https://example.com/blogi/kirjoitus
author: By Maija Meikäläinen
---

# Kirjoitus Markdownista - Esimerkkiblogi

> ## Excerpt
> Lyhyt ote.

---
   **

Ensimmäinen kappale on leipätekstiä, ja se on pitkä, jotta se ei näytä otsikkolohkon tietoriviltä missään tapauksessa.

<iframe src="https://www.youtube.com/embed/x"></iframe>

## Väliotsikko

Toinen kappale.[^Alaviite iA Writerin tapaan.]
`;
// Ohjeen suositeltu pohja: sivuston nimi puuttuu sivulta, joten muuttuja jää täyttämättä.
// Rungossa MarkDownloadin (3.4.0, ajettu Chromiumissa 22.10.2026) tuottamat jäänteet: Strip Images jättää linkitetystä
// kuvasta tyhjän viitelinkin, ja <sup> säilyy HTML:nä.
const SUOSITUSLEIKE = `---
tekijä: Risto Uro
sivusto: {siteName}
julkaistu: 2017-04-03T08:00:00+03:00
lähde: http://blogs.helsinki.fi/uro/2017/04/
haettu: 2017-10-23
---

# Auttaako evoluutio ymmärtämään uskontoa?

Kappale.<sup><a href="http://blogs.helsinki.fi/uro/2017/04/#fn1">1</a></sup> Toinen<sup><a href="https://example.org/x">2</a></sup> ja H<sub>2</sub>O.

[][4]

[4]: https://example.org/kuva
`;

palvelin.listen(0, async () => {
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 760, height: 1100 } });
  const p = await ctx.newPage();
  const virheet = [];
  p.on('pageerror', e => virheet.push(e.message));
  const kuva = async n => { if (KUVAT) await p.screenshot({ path: path.join(KUVAT, n + '.png'), fullPage: true }); };
  const T = () => p.evaluate(() => window.__latomo.tulos());
  const etu = t => (/^---\n([\s\S]*?)\n---\n/.exec(t.md) || [, ''])[1];
  const kentat = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.kentta')].filter(r => !r.hidden).map(r => [r.dataset.k, r.querySelector('input').value])));
  const ehdotukset = () => p.$$eval('.ehdotus p', a => a.map(x => x.textContent));
  const syota = async teksti => { await p.fill('#md', ''); await p.waitForTimeout(50); await p.fill('#md', teksti); await p.waitForTimeout(450); };
  const tiedostona = async (nimi, teksti) => { await p.setInputFiles('#tiedosto', { name: nimi, mimeType: 'text/markdown', buffer: Buffer.from(teksti) }); await p.waitForTimeout(450); };

  await p.goto(BASE + 'luin/latomo.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();

  // 1. Tutkielma sellaisenaan: tulos on tavulleen sama tiedosto, oma viite säilyy.
  await tiedostona('kant-ja-elainetiikka.md', KANT);
  let t = await T(), k = await kentat();
  tulos('tutkielma läpäisee muuttumattomana', t.md === KANT, t.md.length + ' / ' + KANT.length);
  tulos('kentät tekstistä', k['tekijä'] === 'Olli Juutilainen' && k.julkaistu === '7/2026' && k.otsikko === 'KANT JA ELÄINETIIKKA', JSON.stringify(k));
  tulos('^[…]-alaviitteiden muunnosehdotus', (await ehdotukset()).some(x => /\^\[…\]/.test(x)));
  await kuva('1-tutkielma');

  // 2. Tieteellinen tyyppi ja laji: koottu viite = tiedoston oma, joten viite-avain jää pois.
  await p.selectOption('#tyyppi', 'tieteellinen');
  await p.fill('#k-laji', 'Uskonnonfilosofian kandidaatintutkielma');
  await p.fill('#k-yhteisö', 'Helsingin yliopisto');
  await p.waitForTimeout(300);
  t = await T();
  tulos('koottu viite = oma viite', !t.oma && etu(t) === 'tyyppi: tieteellinen\nlaji: Uskonnonfilosofian kandidaatintutkielma\nyhteisö: Helsingin yliopisto', JSON.stringify(etu(t)));

  // 3. Lisäkentät: osana teosta tuo toimittajat, vuosikerran ja sivut.
  await p.click('#lisaa');
  const ennen = await p.$$eval('#lisaa-valikko button', a => a.map(x => x.dataset.k));
  await p.click('#lisaa-valikko button[data-k="teos"]');
  await p.click('#lisaa');
  const jalkeen = await p.$$eval('#lisaa-valikko button', a => a.map(x => x.dataset.k));
  tulos('lisäkentät aukeavat teoksen jälkeen', !ennen.includes('toimittaja') && ['toimittaja', 'numero', 'sivut'].every(x => jalkeen.includes(x)), ennen.join(',') + ' → ' + jalkeen.join(','));
  await p.click('#lisaa');
  await p.fill('#k-teos', 'Kokoomateos');
  await p.click('#lisaa'); await p.click('#lisaa-valikko button[data-k="sivut"]');
  await p.fill('#k-sivut', '1–20');
  await p.waitForTimeout(300);
  t = await T();
  tulos('osana teosta viitteessä', /etsimässä\. \*Kokoomateos\*\. Uskonnonfilosofian kandidaatintutkielma\. Helsingin yliopisto, 1–20\.$/.test(t.koottu), t.koottu);

  // 4. MarkDownloadin oletuspohja: ehdotus, siivous, tiedot, sivuston erotus.
  await tiedostona('leike.md', OLETUSLEIKE);
  tulos('MarkDownload tunnistetaan', (await ehdotukset()).some(x => /MarkDownload/.test(x)));
  await p.click('.ehdotus button:has-text("Käytä MarkDownload-tilaa")');
  await p.waitForTimeout(300);
  k = await kentat();
  tulos('leikkeen tiedot', await p.inputValue('#tyyppi') === 'blogi' && k['tekijä'] === 'Maija Meikäläinen' && k['lähde'] === 'https://example.com/blogi/kirjoitus' && k.haettu === '8.10.2026', JSON.stringify(k));
  tulos('siivous', /1 tyhjä korostus, 1 HTML-rivi, Excerpt-lainaus/.test(await p.textContent('#mdl-tila')), await p.textContent('#mdl-tila'));
  await p.click('.ehdotus button:has-text("Erota sivuston nimeksi")');
  await p.waitForTimeout(300);
  t = await T();
  tulos('sivuston nimi erotettu', /^# Kirjoitus Markdownista$/m.test(await p.inputValue('#md')) && t.koottu === 'Meikäläinen, Maija (s.a.). Kirjoitus Markdownista. *Esimerkkiblogi*. https://example.com/blogi/kirjoitus (luettu 8.10.2026).', t.koottu);
  tulos('tulos ilman jäänteitä', !/Excerpt|\*\*\n|<iframe/.test(t.md) && /tags: \[markdown, writing\]/.test(t.md) && !/^source:/m.test(t.md), etu(t).replace(/\n/g, ' | '));
  tulos('tekstikenttä ennallaan', (await p.inputValue('#md')).includes('<iframe'));
  await kuva('2-leike');

  // 5. Suositeltu pohja: koneen aikaleima kuukauden tarkkuudella, täyttämätön muuttuja ohitetaan.
  await tiedostona('suositus.md', SUOSITUSLEIKE);
  k = await kentat();
  t = await T();
  tulos('suositeltu pohja', !k.sivusto && await p.$eval('.kentta[data-k="julkaistu"] select', s => s.value) === '2' &&
    t.koottu === 'Uro, Risto (2017). Auttaako evoluutio ymmärtämään uskontoa? (huhtikuu/2017). http://blogs.helsinki.fi/uro/2017/04/ (luettu 23.10.2017).', t.koottu);
  await p.fill('#k-sivusto', 'Risto Uron blogi');
  await p.waitForTimeout(300);
  t = await T();
  tulos('blogin viite Teologian tyylin mukaan', t.koottu === 'Uro, Risto (2017). Auttaako evoluutio ymmärtämään uskontoa? *Risto Uron blogi* huhtikuu/2017. http://blogs.helsinki.fi/uro/2017/04/ (luettu 23.10.2017).', t.koottu);
  tulos('yläindeksit ja tyhjä linkki', /^Kappale\.\^1\^ Toinen\^\[2\]\(https:\/\/example\.org\/x\)\^ ja H~2~O\.\n\n\n\n\[4\]:/m.test(t.md) &&
    /1 tyhjä linkki\. 3 HTML-indeksiä Markdowniksi\./.test(await p.textContent('#mdl-tila')), await p.textContent('#mdl-tila'));
  tulos('kuukausi etukenttään', /^julkaistu: 2017-04$/m.test(t.md), etu(t).replace(/\n/g, ' | '));

  // 6. Pelkkä teksti: ehdotukset, otsikko kentästä tekstin alkuun, itse kirjoitettu aika omalla tarkkuudellaan.
  await syota('Ensimmäinen rivi on tässä.\nToinen rivi jatkuu.\nKolmas rivi loppuu.\n\nUusi kappale.');
  const e = await ehdotukset();
  tulos('pelkän tekstin ehdotukset', e.some(x => /tyhjiä rivejä/.test(x)) && e.some(x => /#-otsikkoa/.test(x)), e.join(' / '));
  await p.selectOption('#tyyppi', 'blogi');
  await p.fill('#k-otsikko', 'Kokeilu');
  await p.fill('#k-julkaistu', '8.10.2026 14.05');
  await p.fill('#k-sivusto', 'Tusinablogi');
  await p.waitForTimeout(300);
  t = await T();
  tulos('kirjoitettu aika minuutilleen', t.koottu === 'Kokeilu (2026). *Tusinablogi* 8.10.2026 klo 14.05.' && /^julkaistu: 2026-10-08 14\.05$/m.test(t.md), t.koottu);
  tulos('otsikko tekstin alkuun', /---\n\n# Kokeilu\n\nEnsimmäinen rivi/.test(t.md));
  await p.click('.ehdotus button:has-text("Tee jokaisesta rivistä kappale")');
  await p.waitForTimeout(300);
  tulos('rivit kappaleiksi', (await p.inputValue('#md')).startsWith('Ensimmäinen rivi on tässä.\n\nToinen rivi jatkuu.\n\nKolmas'));

  // 7. Luiniin: lukulista näyttää sivuston, jakovalikon viitteessä ei ole lukutietoja ennen kuin ne valitaan.
  await p.click('#avaa');
  await p.waitForTimeout(800);
  await p.goto(BASE + 'luin.html');
  await p.waitForTimeout(400);
  const lista = await p.$eval('.nimike .n-tieto', x => x.textContent);
  tulos('lukulistassa sivusto', lista.startsWith('Tusinablogi'), lista);
  await p.click('.nimike button.jako');
  const v0 = await p.textContent('#pop .v-teksti');
  await p.click('#pop button[data-k="lisa"]');
  const v1 = await p.textContent('#pop .v-teksti');
  tulos('lukutiedot vain valittaessa', v0 === 'Kokeilu (2026). Tusinablogi 8.10.2026 klo 14.05.' && /Luettu HTML-versiona \d+\.\d+\.\d{4}\.$/.test(v1), v0 + ' → ' + v1);
  await kuva('3-jako');

  // 8. Puhelimen leveys: ei vaakavieritystä.
  await p.setViewportSize({ width: 360, height: 760 });
  await p.goto(BASE + 'luin/latomo.html');
  await tiedostona('kant-ja-elainetiikka.md', KANT);
  await p.selectOption('#tyyppi', 'tieteellinen');
  await p.waitForTimeout(300);
  const leveys = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  tulos('360 px ilman vaakavieritystä', leveys[0] <= leveys[1], leveys.join(' / '));
  await kuva('4-kapea');

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
});
