// Latomon selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/latomo-testi.js [kuvakansio]
// Tarkistaa: tutkielma läpäisee Latomon muuttumattomana, tyypin ja kenttien vaikutuksen etukenttään ja
// viitteeseen, lisäkentät (osana teosta avaa toimittajat, vuosikerran ja sivut), MarkDownload-leikkeen
// (oletuspohja ja latomo-ohje.html:n suositeltu pohja), pelkän tekstin ehdotukset, julkaisuajan
// tarkkuuden, blogin nimen ja kaunokirjallisen kokoelman alaotsikon paikalla, siirron Luiniin (lukulista ja
// jakovalikon lukutiedot ehdotuksena) ja puhelimen leveyden.
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
// Ohjeen suositeltu pohja (leikattu: on korvamerkki): sivuston nimi puuttuu sivulta, joten muuttuja jää täyttämättä.
// Rungossa MarkDownloadin (3.4.0, ajettu Chromiumissa 22.10.2026) tuottamat jäänteet: Strip Images jättää linkitetystä
// kuvasta tyhjän viitelinkin, ja <sup> säilyy HTML:nä.
const SUOSITUSLEIKE = `---
tekijä: Risto Uro
sivusto: {siteName}
julkaistu: 2017-04-03T08:00:00+03:00
lähde: http://blogs.helsinki.fi/uro/2017/04/
leikattu: 2017-10-23
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
  const mdlRivi = () => p.evaluate(() => !document.querySelector('#mdl-rivi').hidden);
  tulos('MarkDownload-rivi piilossa tavallisella tekstillä', !(await mdlRivi()));
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
  tulos('MarkDownload tunnistetaan', (await ehdotukset()).some(x => /MarkDownload/.test(x)) && !(await mdlRivi()));
  await p.click('.ehdotus button:has-text("Käytä MarkDownload-tilaa")');
  await p.waitForTimeout(300);
  tulos('ehdotuksesta päälle kytketty rivi näkyy', (await mdlRivi()) && (await p.getAttribute('#mdl', 'aria-pressed')) === 'true');
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
  tulos('blogin nimi alaotsikon paikalla', await p.textContent('#tiedot .ala') === 'Risto Uron blogi' && !/Risto Uron blogi/.test(await p.textContent('#tiedot .meta')), await p.textContent('#tiedot'));
  tulos('blogin viite Teologian tyylin mukaan', t.koottu === 'Uro, Risto (2017). Auttaako evoluutio ymmärtämään uskontoa? *Risto Uron blogi* huhtikuu/2017. http://blogs.helsinki.fi/uro/2017/04/ (luettu 23.10.2017).', t.koottu);
  tulos('yläindeksit ja tyhjä linkki', /^Kappale\.\^1\^ Toinen\^\[2\]\(https:\/\/example\.org\/x\)\^ ja H~2~O\.\n\n\n\n\[4\]:/m.test(t.md) &&
    /1 tyhjä linkki\. 3 HTML-indeksiä Markdowniksi\./.test(await p.textContent('#mdl-tila')), await p.textContent('#mdl-tila'));
  tulos('kuukausi etukenttään', /^julkaistu: 2017-04$/m.test(t.md), etu(t).replace(/\n/g, ' | '));

  // 5b. Korvamerkki uudella sivulla (tila pois): leikattu: näyttää rivin ja kytkee tilan päälle ilman ehdotusta;
  // tulokseen avain haettu, joten valmis teksti ei ole enää merkitty. Pois kytkeminen koskee vain tätä tekstiä.
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => virheet.push(e.message));
  await p2.goto(BASE + 'luin/latomo.html');
  await p2.setInputFiles('#tiedosto', { name: 'suositus.md', mimeType: 'text/markdown', buffer: Buffer.from(SUOSITUSLEIKE) });
  await p2.waitForTimeout(450);
  const tila2 = () => p2.evaluate(() => [!document.querySelector('#mdl-rivi').hidden, document.querySelector('#mdl').getAttribute('aria-pressed'),
    !document.querySelector('#mdl-tila').hidden, [...document.querySelectorAll('.ehdotus p')].some(x => /MarkDownload/.test(x.textContent))]);
  let t2 = await p2.evaluate(() => window.__latomo.tulos()), s2 = await tila2();
  tulos('korvamerkki kytkee tilan', s2.join() === 'true,true,true,false' && /^haettu: 2017-10-23$/m.test(t2.md) && !/leikattu/.test(t2.md), s2.join() + ' | ' + etu(t2).replace(/\n/g, ' | '));
  await kuva('2b-korvamerkki');
  await p2.click('#mdl');
  await p2.waitForTimeout(300);
  s2 = await tila2(); t2 = await p2.evaluate(() => window.__latomo.tulos());
  tulos('korvamerkityn saa pois', s2.join() === 'true,false,false,false' && /<sup>/.test(t2.md), s2.join());
  await p2.setInputFiles('#tiedosto', { name: 'valmis.md', mimeType: 'text/markdown', buffer: Buffer.from(SUOSITUSLEIKE) });
  await p2.waitForTimeout(450);
  tulos('pois-valinta ei siirry seuraavaan tekstiin', (await tila2()).join() === 'true,true,true,false', (await tila2()).join());
  t2 = await p2.evaluate(() => window.__latomo.tulos());
  await p2.setInputFiles('#tiedosto', { name: 'valmis.md', mimeType: 'text/markdown', buffer: Buffer.from(t2.md) });
  await p2.waitForTimeout(450);
  tulos('valmis teksti ei ole merkitty', (await tila2()).join() === 'false,false,false,false', (await tila2()).join());
  await p2.close();

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

  // 7. Luiniin: lukulista näyttää sivuston alaotsikon paikalla (ei toistoa tietorivillä), jakovalikon viitteessä
  // ei ole lukutietoja ennen kuin ne valitaan.
  await p.click('#avaa');
  await p.waitForTimeout(800);
  const ylla = await p.evaluate(() => [document.querySelector('#teksti header.tt .sub'), document.querySelector('#teksti header.tt .meta')].map(x => x && x.textContent));
  tulos('ladotussa blogin nimi alaotsikkona', ylla[0] === 'Tusinablogi' && !/Tusinablogi/.test(ylla[1] || ''), JSON.stringify(ylla));
  await p.goto(BASE + 'luin.html');
  await p.waitForTimeout(400);
  const lista = await p.$eval('.nimike', x => [x.querySelector('.n-ala') && x.querySelector('.n-ala').textContent, x.querySelector('.n-tieto').textContent]);
  tulos('lukulistassa sivusto alaotsikkona', lista[0] === 'Tusinablogi' && !/Tusinablogi/.test(lista[1]), JSON.stringify(lista));
  await p.click('.nimike button.jako');
  const v0 = await p.textContent('#pop .v-teksti');
  await p.click('#pop button[data-k="lisa"]');
  const v1 = await p.textContent('#pop .v-teksti');
  tulos('lukutiedot vain valittaessa', v0 === 'Kokeilu (2026). Tusinablogi 8.10.2026 klo 14.05.' && /Luettu HTML-versiona \d+\.\d+\.\d{4}\.$/.test(v1), v0 + ' → ' + v1);
  await kuva('3-jako');

  // 7b. Kaunokirjallinen: kenttä Kokoelma näkyy oletuksena, ja kokoelma on alaotsikon paikalla.
  await p.goto(BASE + 'luin/latomo.html');
  await syota('# Sammakko ja kaivo\n\nSammakko asui kaivossa, ja kaivon suulta näkyi pyöreä pala taivasta, jota se piti koko maailmana pitkään.');
  await p.selectOption('#tyyppi', 'kaunokirjallinen');
  await p.fill('#k-tekijä', 'Olli Juutilainen');
  await p.fill('#k-teos', 'Sammakon seikkailut');
  await p.waitForTimeout(300);
  t = await T();
  const nimio = await p.textContent('.kentta[data-k="teos"] label');
  tulos('kaunokirjallisen kokoelma', nimio === 'Kokoelma' && await p.textContent('#tiedot .ala') === 'Sammakon seikkailut' &&
    t.koottu === 'Juutilainen, Olli (s.a.). Sammakko ja kaivo. *Sammakon seikkailut*.', nimio + ' | ' + t.koottu);
  await p.selectOption('#tyyppi', 'tieteellinen');
  await p.waitForTimeout(300);
  tulos('tieteellisessä teos tietorivillä', await p.textContent('.kentta[data-k="teos"] label') === 'Osana teosta tai lehteä' && !(await p.$('#tiedot .ala')) &&
    /Sammakon seikkailut/.test(await p.textContent('#tiedot .meta')), await p.textContent('#tiedot'));

  // Blogin etusivu: monta linkitettyä väliotsikkoa ja juuriosoite lähteenä → varoitus, Ohita piilottaa sen; yksittäisen kirjoituksen osoite ei laukaise.
  const ETUSIVU = (lahde) => `---\nlähde: ${lahde}\nhaettu: 2026-10-22\n---\n\n# Blogi\n\n### [Yksi][1]\n\nTeksti yksi.\n\n### [Kaksi][2]\n\nTeksti kaksi.\n\n### [Kolme][3]\n\nTeksti kolme.\n\n[1]: https://blogi.example/2026/10/yksi.html\n[2]: https://blogi.example/2026/09/kaksi.html\n[3]: https://blogi.example/2026/07/kolme.html\n`;
  const varoitus = () => p.locator('.ehdotus', { hasText: 'blogin etusivulta' }).count();
  await p.goto(BASE + 'luin/latomo.html');
  await syota(ETUSIVU('https://blogi.example/'));
  tulos('etusivuvaroitus', (await varoitus()) === 1);
  await p.click('.ehdotus:has-text("blogin etusivulta") button:has-text("Ohita")');
  await p.waitForTimeout(300);
  tulos('etusivuvaroitus ohitettu', (await varoitus()) === 0);
  await syota(ETUSIVU('https://blogi.example/2026/10/yksi.html'));
  tulos('yksittäisessä kirjoituksessa ei varoitusta', (await varoitus()) === 0);

  // 8. Puhelimen leveys: ei vaakavieritystä.
  await p.setViewportSize({ width: 360, height: 760 });
  await p.goto(BASE + 'luin/latomo.html');
  await tiedostona('kant-ja-elainetiikka.md', KANT);
  await p.selectOption('#tyyppi', 'tieteellinen');
  await p.waitForTimeout(300);
  const leveys = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  tulos('360 px ilman vaakavieritystä', leveys[0] <= leveys[1], leveys.join(' / '));
  await kuva('4-kapea');

  // 9. Tyhjennys: nappi vain tekstin kanssa, vahvistus (älä! peruu), sitten kaikki tyhjäksi; MarkDownload-kytkin säilyy.
  await p.fill('#osoite', 'https://example.com/teksti.md');
  await p.fill('#k-laji', 'Muutettu laji');
  await p.waitForTimeout(300);
  const nakyvat = () => p.evaluate(() => ['#tyhjenna', '#varmistus', '#tiedot-osio'].map(s => !document.querySelector(s).hidden));
  const n0 = await nakyvat();
  await p.click('#tyhjenna');
  const n1 = await nakyvat(), kysymys = await p.textContent('#varmistus-kysymys');
  await kuva('5-varmistus');
  await p.click('#tyhjenna-ei');
  const n2 = await nakyvat(), md2 = await p.inputValue('#md');
  tulos('älä! peruu', n0.join() === 'true,false,true' && n1.join() === 'false,true,true' && n2.join() === 'true,false,true' && md2 === KANT, [n0, n1, n2].join(' | ') + ' – ' + kysymys);
  const leveys2 = await p.evaluate(() => { document.querySelector('#varmistus').hidden = false; const l = [document.documentElement.scrollWidth, document.documentElement.clientWidth]; document.querySelector('#varmistus').hidden = true; return l; });
  tulos('vahvistus 360 px:n leveydellä', leveys2[0] <= leveys2[1], leveys2.join(' / '));
  await p.click('#tyhjenna');
  await p.click('#tyhjenna-kylla');
  await p.waitForTimeout(300);
  const jalki = await p.evaluate(() => ({ md: document.querySelector('#md').value, osoite: document.querySelector('#osoite').value,
    nimi: document.querySelector('#tiedostonimi').textContent, tila: window.__latomo.tila(), tulos: window.__latomo.tulos() }));
  const n3 = await nakyvat();
  tulos('kaikki tyhjäksi', !jalki.md && !jalki.osoite && /pudota/.test(jalki.nimi) && !Object.keys(jalki.tila.arvot).length && jalki.tulos === null &&
    n3.join() === 'false,false,false' && (await p.getAttribute('#mdl', 'aria-pressed')) === 'false' && await p.evaluate(() => document.querySelector('#mdl-rivi').hidden), JSON.stringify(n3) + ' ' + JSON.stringify(jalki.tila.arvot));
  // Uusi teksti tyhjennyksen jälkeen: kentät tulevat uudesta tekstistä, eivät vanhoista.
  await tiedostona('kant-ja-elainetiikka.md', KANT);
  t = await T();
  // Vanhaa lajia ja osoitetta ei saa olla.
  tulos('uusi teksti tyhjennyksen jälkeen', !/Muutettu laji|example\.com\/teksti/.test(t.md) && (await kentat()).laji !== 'Muutettu laji', JSON.stringify(etu(t)));

  // 10. Otsikkolohkon tietorivit ja peräkkäiset alaviitteiden määrittelyt ovat jo erillään (pdf:stä muunnettu kirja).
  await p.goto(BASE + 'luin/latomo.html');
  await syota('# Kirja\n\nEtu Suku, *Kirja: alaotsikko*.\nCham: Palgrave Macmillan 2022.\nDOI 10.1007/x.\n\n' +
    'Leipätekstiä, joka on niin pitkä, ettei sitä lueta otsikkolohkon tietoriviksi missään tapauksessa, vaikka se onkin ensimmäinen kappale.[^1][^2][^3]\n\n' +
    '[^1]: Eka.\n[^2]: Toka.\n[^3]: Kolmas.\n');
  const e2 = await ehdotukset();
  tulos('tietorivit ja alaviitteet eivät ole rivitettyä tekstiä', !e2.some(x => /tyhjiä rivejä/.test(x)), e2.join(' / '));

  // 11. Otsikkolohko kentistä: lyhyt #-otsikko ja tietorivit, joissa ISBN ja lisenssi (pdf:stä muunnettu kirja).
  const KIRJA = '# Müller, *Kantianism for Animals*\n\nNico Dario Müller, *Kantianism for Animals: A Radical Kantian Animal Ethic*.\n' +
    'Cham: Palgrave Macmillan 2022. ISBN 978-3-031-01929-6.\nDOI 10.1007/978-3-031-01930-2. Lisenssi CC BY 4.0.\n\n' +
    'Leipätekstiä, joka on niin pitkä, ettei sitä lueta otsikkolohkon tietoriviksi missään tapauksessa, vaikka se onkin ensimmäinen kappale.\n';
  await syota(KIRJA);
  tulos('otsikkolohkon ehdotus', (await ehdotukset()).some(x => /Tekstin alku ei vastaa kenttiä/.test(x)));
  await p.click('.ehdotus button:has-text("…ja säilytä tekstin lisätiedot")');
  await p.waitForTimeout(400);
  tulos('alku kentistä lisätiedoin', (await p.inputValue('#md')).startsWith('# Kantianism for Animals\n\n*A Radical Kantian Animal Ethic*\n\nNico Dario Müller\\\n' +
    'Cham: Palgrave Macmillan 2022\\\nDOI 10.1007/978-3-031-01930-2\\\nISBN 978-3-031-01929-6. Lisenssi CC BY 4.0.\n\nLeipätekstiä'), (await p.inputValue('#md')).slice(0, 200));
  tulos('ehdotus poistuu, etukenttä tyhjä', !(await ehdotukset()).some(x => /Tekstin alku/.test(x)) && !/^---/.test((await T()).md), (await T()).md.slice(0, 120));
  await syota(KIRJA);
  await p.click('.ehdotus button:has-text("Kirjoita alku kentistä")');
  await p.waitForTimeout(400);
  tulos('alku pelkistä kentistä', /^# Kantianism for Animals\n\n\*A Radical Kantian Animal Ethic\*\n\nNico Dario Müller\\\nCham: Palgrave Macmillan 2022\\\nDOI 10\.1007\/978-3-031-01930-2\n\nLeipä/.test(await p.inputValue('#md')));
  await syota(KANT);
  tulos('tutkielmalle ei otsikkolohkon ehdotusta', !(await ehdotukset()).some(x => /Tekstin alku/.test(x)));

  // 12. iA Writerin annotaatiot: kytkin ilmestyy vain annotaatiorivin kanssa, piilottaa rivin tuloksesta mutta ei
  // tekstikentästä, eikä muuta muuta; uusi teksti alkaa ilman piilotusta.
  const ANN = 'Annotations: 0,16552 SHA-256 822928331463b395b118&Claude: 6886,34 9650,106 10028,332 11312,41@Olaus: 44,99 13884,1554';
  const POHJA = '# Kirjoitus\n\nLeipätekstiä, joka on niin pitkä, ettei sitä lueta otsikkolohkon tietoriviksi missään tapauksessa, vaikka se onkin ensimmäinen kappale.\n';
  await syota(POHJA);
  tulos('annotaatiokytkin piilossa ilman annotaatioita', await p.isHidden('#ann'));
  await syota(POHJA + '\n' + ANN + '\n');
  tulos('annotaatiokytkin ilmestyy', await p.isVisible('#ann') && (await p.getAttribute('#ann', 'aria-pressed')) === 'false');
  const annEnnen = (await T()).md, rivitEnnen = annEnnen.split('\n').length;
  tulos('annotaatiot mukana oletuksena', /Annotations:/.test(annEnnen));
  await p.click('#ann');
  await p.waitForTimeout(400);
  const annJalkeen = (await T()).md;
  tulos('annotaatiot piilossa tuloksesta', !/Annotations|SHA-256/.test(annJalkeen) && annJalkeen.replace(/\s+$/, '') === annEnnen.replace(ANN, '').replace(/\s+$/, '') && (await p.getAttribute('#ann', 'aria-pressed')) === 'true', JSON.stringify(annJalkeen.slice(-80)));
  tulos('tekstikenttä ennallaan', (await p.inputValue('#md')).includes(ANN));
  await p.click('#ann');
  await p.waitForTimeout(300);
  tulos('kytkin palauttaa annotaatiot', (await T()).md === annEnnen, String(rivitEnnen));
  await p.click('#ann');
  await tiedostona('ann.md', POHJA + '\n' + ANN + '\n');
  tulos('tiedostosta ladattu teksti alkaa ilman piilotusta', (await p.getAttribute('#ann', 'aria-pressed')) === 'false' && /Annotations:/.test((await T()).md));

  // 13. MarkDownload-leike SEP:stä (29.10.2026): [n]-alaviitemerkit (välilyönti ennen </sup>) yläindeksiksi ilman ^[-alaviitettä,
  // otsikkorivitön HTML-taulukko Markdown-taulukoksi ja taulukon jälkeisten huomautusten rivinumerot tekstikentän riveinä.
  await tiedostona('sep.md', '---\nlähde: https://plato.stanford.edu/entries/dewey/\nleikattu: 2026-10-29\n---\n\n# John Dewey\n\n' +
    '## 1. Bio\n\n## 2. Psychology\n\nHabit.<sup>[<a href="https://plato.stanford.edu/entries/dewey/notes.html#note-7" id="ref-7">7</a>] </sup> Habits.<sup>[<a href="https://plato.stanford.edu/entries/dewey/notes.html#note-8">8</a>] </sup>Kiinni.\n\n' +
    '<table><tbody><tr><td><strong>Mind is</strong></td><td><strong>Consciousness is</strong></td></tr><tr><td>Meanings <em>in</em> life</td><td>A | B</td></tr><tr><td>Yksi</td></tr></tbody></table>\n\n' +
    '### 3.1 Experience\n\nLeipä.\n');
  const sep = await T(), sepV = await p.$$eval('#varoitukset p', x => x.map(e => e.textContent));
  tulos('SEP: alaviitemerkit yläindeksiksi', sep.md.includes('Habit.^\\[[7](https://plato.stanford.edu/entries/dewey/notes.html#note-7)\\]^ Habits.^\\[[8](https://plato.stanford.edu/entries/dewey/notes.html#note-8)\\]^ Kiinni.'), sep.md);
  tulos('SEP: taulukko Markdowniksi', sep.md.includes('\n\n| Mind is | Consciousness is |\n| --- | --- |\n| Meanings *in* life | A \\| B |\n| Yksi |  |\n\n'), sep.md);
  // Viitenumerot ovat 30.10.2026 alkaen Luinin alaviitteitä (md.js, sivunViitteet()).
  tulos('SEP: viitenumerot alaviitteiksi, ei HTML-huomautuksia, rivinumero tekstikentän', /2 alaviitettä · 1 taulukko/.test(await p.textContent('#luvut')) &&
    JSON.stringify(sepV) === JSON.stringify(['rivi 16Pääluvun 3 otsikko puuttuu: 3.1 alkaa ilman sitä. Lisää se ##-rivinä ennen riviä 16. MarkDownload jättää joskus luvun otsikon pois. Miksi?']), (await p.textContent('#luvut')) + ' | ' + sepV.join(' | '));
  tulos('SEP: Miksi?-linkki ohjeeseen', (await p.getAttribute('#varoitukset a', 'href')) === 'latomo-ohje.html#otsikko-puuttuu');
  await p.click('#mdl'); await p.waitForTimeout(300);
  tulos('ilman MarkDownload-tilaa vain neuvo', (await p.$$eval('#varoitukset p', x => x.map(e => e.textContent))).some(x => /^rivi 16Pääluvun 3 otsikko puuttuu: 3\.1 alkaa ilman sitä\. Lisää se ##-rivinä ennen riviä 16\.$/.test(x)));
  await p.click('#mdl'); await p.waitForTimeout(300);
  tulos('SEP: tila kertoo taulukosta', /2 HTML-indeksiä ja 1 HTML-taulukko Markdowniksi\./.test(await p.textContent('#mdl-tila')), await p.textContent('#mdl-tila'));
  // Tunnettu sivusto (29.10.2026): plato.stanford.edu antaa sivuston nimen, etukentän oma nimi voittaa, muut sivustot eivät saa nimeä.
  tulos('SEP: sivuston nimi kenttään ja etukenttään', (await p.inputValue('#k-sivusto')) === 'Stanford Encyclopedia of Philosophy' && /\nsivusto: Stanford Encyclopedia of Philosophy\n/.test(sep.md), await p.inputValue('#k-sivusto'));
  await tiedostona('sep-oma.md', '---\nlähde: https://plato.stanford.edu/entries/dewey/\nleikattu: 2026-10-29\nsivusto: Oma nimi\n---\n\n# John Dewey\n\nTeksti.\n');
  tulos('SEP: etukentän oma sivuston nimi voittaa', (await p.inputValue('#k-sivusto')) === 'Oma nimi', await p.inputValue('#k-sivusto'));
  await tiedostona('muu.md', '---\nlähde: https://example.com/blogi/kirjoitus\nleikattu: 2026-10-29\n---\n\n# Kirjoitus\n\nTeksti.\n');
  tulos('muu sivusto: nimeä ei keksitä', (await p.inputValue('#k-sivusto')) === '', await p.inputValue('#k-sivusto'));

  // 14. Valinnan leike (Download Selection As Markdown): pohjan # {pageTitle} ja valinnan oma pääotsikko peräkkäin, ja
  // lainauksen sisällä kuvakkeiden ja linkkien taulukko (SEP:n Academic Tools).
  await tiedostona('valinta.md', '---\nlähde: https://plato.stanford.edu/entries/dewey/\nleikattu: 2026-10-29\n---\n\n# John Dewey\n\n# John Dewey\n\n' +
    '## 1. Bio\n\nLeipä.\n\n## Academic Tools\n\n> <table class="vert-top"><tbody><tr><td><img src="../../symbols/a.jpg" alt="a"></td><td><a href="https://e.org/c?x=1&amp;y=2" target="other">How to cite</a>.</td></tr>' +
    '<tr><td><img src="../../symbols/b.png" alt="b"></td><td><a href="https://e.org/p">PDF</a> at <a href="https://e.org/">X</a>.</td></tr></tbody></table>\n\n## Other\n\nLoppu.\n');
  const val = await T(), valV = await p.$$eval('#varoitukset p', x => x.map(e => e.textContent));
  tulos('valinta: toistunut pääotsikko pois', (val.md.match(/^# John Dewey$/gm) || []).length === 1 && /toistunut pääotsikko/.test(await p.textContent('#mdl-tila')), await p.textContent('#mdl-tila'));
  tulos('valinta: kuvakkeiden taulukko kappaleiksi', val.md.includes('## Academic Tools\n\n> [How to cite](https://e.org/c?x=1&y=2).\n>\n> [PDF](https://e.org/p) at [X](https://e.org/).\n\n## Other'), val.md);
  tulos('valinta: ei huomautuksia', JSON.stringify(valV) === JSON.stringify(['Ei huomautettavaa.']), valV.join(' | '));

  // 15. MarkDownloadin validateUri: suhteellinen osoite lähteen perään kahdella kauttaviivalla tai ilman erotinta.
  await tiedostona('osoitteet.md', '---\nlähde: https://plato.stanford.edu/entries/dewey/\nleikattu: 2026-10-29\n---\n\n# T\n\nKatso [Sellars][1], [luku][2], [ohje](https://plato.stanford.edu/entries/dewey//../../info.html#c) ja [sama](https://plato.stanford.edu/entries/dewey/).\n\n[1]: https://plato.stanford.edu/entries/dewey//../sellars/\n[2]: https://plato.stanford.edu/entries/dewey//#Psyc\n');
  const os1 = (await T()).md;
  tulos('osoitteet: kaksoiskauttaviiva ratkaistu', os1.includes('[ohje](https://plato.stanford.edu/info.html#c) ja [sama](https://plato.stanford.edu/entries/dewey/).') &&
    os1.includes('[1]: https://plato.stanford.edu/entries/sellars/\n[2]: https://plato.stanford.edu/entries/dewey/#Psyc') && /Korjattu 3 sivun omaa linkkiä\./.test(await p.textContent('#mdl-tila')), os1 + ' | ' + await p.textContent('#mdl-tila'));
  await tiedostona('osoitteet2.md', '---\nlähde: https://e.org/blogi/kirjoitus.html\nleikattu: 2026-10-29\n---\n\n# T\n\n[Kuva](https://e.org/blogi/kirjoitus.html../kuvat/a.html), [ankkuri](https://e.org/blogi/kirjoitus.html#x) ja [toinen](https://e.org/blogi/kirjoitus.htmlnotes.html).\n');
  tulos('osoitteet: liimattu suhteellinen ratkaistu, ankkuri ennallaan', (await T()).md.includes('[Kuva](https://e.org/kuvat/a.html), [ankkuri](https://e.org/blogi/kirjoitus.html#x) ja [toinen](https://e.org/blogi/notes.html).'), (await T()).md);

  await tiedostona('osoitteet3.md', '---\nlähde: https://e.org/blog\nleikattu: 2026-10-29\n---\n\n# T\n\n[Arkisto](https://e.org/blog-archive) ja [x](https://e.org/blog/x).\n');
  tulos('osoitteet: kansioton lähde ei korjaa', (await T()).md.includes('[Arkisto](https://e.org/blog-archive) ja [x](https://e.org/blog/x).'), (await T()).md);

  // 16. SEP:n Notes-sivu (30.10.2026): kun tekstikentässä on artikkelin leike, saman kansion notes.html-leike liitetään perään
  // (etukenttä ja paluulinkkien määrittelyt pois), ja viitenumeroista tulee Luinin alaviitteitä Notes-sivun tekstein.
  await tiedostona('art.md', '---\nlähde: https://plato.stanford.edu/entries/x/\nleikattu: 2026-10-30\n---\n\n# X\n\n' +
    'Yksi.<sup>[<a href="https://plato.stanford.edu/entries/x/notes.html#note-1">1</a>] </sup> Loppu.\n');
  await tiedostona('notes.md', '---\nlähde: https://plato.stanford.edu/entries/x/notes.html\nleikattu: 2026-10-30\n---\n\n# X > Notes (Stanford Encyclopedia of Philosophy)\n\n' +
    '[1.][1] Viitteen teksti.\n\n[1]: https://plato.stanford.edu/entries/x/notes.htmlindex.html#ref-1\n');
  const nt = await T(), ntKentta = await p.inputValue('#md'), ntHtml = await p.evaluate(m => LuinMD.parse(m).html, nt.md);
  tulos('Notes-sivu liitetään perään ja alaviitteet saavat tekstinsä', /^---\nlähde: https:\/\/plato\.stanford\.edu\/entries\/x\/\n/.test(ntKentta) && ntKentta.includes('[1.][1] Viitteen teksti.') &&
    !/ref-1|entries\/x\/notes\.html\n/.test(ntKentta) && (await p.textContent('#tiedostonimi')) === 'Alaviitteet liitetty: notes.md' && /1 alaviitettä/.test(await p.textContent('#luvut')) &&
    ntHtml.includes('<span class="fnnum">1</span>Viitteen teksti.</span>') && !/Notes/.test(ntHtml), ntKentta + ' | ' + ntHtml);
  await tiedostona('muu2.md', '---\nlähde: https://e.org/toinen/notes.html\n---\n\n# Muu\n\nTeksti.\n');
  tulos('eri sivuston notes.html korvaa tekstin', (await p.inputValue('#md')).startsWith('---\nlähde: https://e.org/toinen/notes.html'));

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
});
