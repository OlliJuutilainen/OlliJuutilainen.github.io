// Luokittelu ja kellarin veivihyllystön järjestykset (käyttäjän pyyntö 17.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/luokittelu-testi.js [kuvakansio]
// Tarkistaa: pino ennallaan (ei välikortteja, ei uutta tietoriviä); järjestykset ja välikortit kellarin veivihyllystössä
// (tekijä, ajoitus eaa. ennen jaa., laji, asiasanat useassa ryhmässä, alkuperä, merkinnät, edistyminen, käsikirjasto
// ylimpänä kaikissa järjestyksissä, pino mukana); käsikirja ei koskaan pinossa (Poimi- ja ö-mappitoiminto irrottavat sen, tuonti ei nosta); Luokittele-ponnahdus (sanasto, ehdotus sivustosta, sekatila, uusi sana sanaston muodossa, ajoituksen
// tarkistus) ja etukentän kirjoitus; avaimeton uusi versio ei pyyhi asiasanoja; Muuta metatietoja näyttää ne Latomossa
// ja niiden poisto siellä poistaa ne; Lataa .md:ssä ne ovat mukana. Välikortin suodatus (22.11.2026): vain napautetun kortin
// ryhmä, Valitse kaikki ja valittujen valikko koskevat sitä, toinen napautus, kaikki kortit ja järjestyksen vaihto palauttavat kaikki.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { avaaOsa } = require('./porras-apu');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const T = (fm, ots, teksti) => (fm ? '---\n' + fm + '\n---\n\n' : '') + '# ' + ots + '\n\n' + (teksti || 'Ensimmäinen kappale on tässä. Toinen virke seuraa.') + '\n\n## 1. Luku\n\nToinen kappale.\n';
const PAIVA = 86400000, NYT = Date.parse('2026-11-17T10:00:00Z');
// [id, md, nimikkeen lisätiedot]
const TEKSTIT = [
  ['p-hegel-tutkimus', T('tyyppi: tieteellinen\ntekijä: Terry Pinkard\njulkaistu: 1994\najoitus: 1807\ntags: [filosofia, Hegel]', 'Hegel’s Phenomenology'), { luettu: NYT - 5 * PAIVA, pct: 100 }],
  ['p-septuaginta', T('tyyppi: kaunokirjallinen\najoitus: 250 eaa.', 'Septuaginta'), { luettu: NYT - 4 * PAIVA, pct: 40 }],
  ['p-levantti', T('ajoitus: 1000–586 eaa.\nasiasanat: teologia', 'Tekstejä rautakauden Levantista'), { luettu: NYT - 3 * PAIVA, pct: 70 }],
  ['p-seneca', T('tekijä: Lucius Annaeus Seneca\najoitus: 65 jaa.', 'Kirjeitä Luciliukselle'), { luettu: NYT - 2 * PAIVA }],
  ['p-sep', T('tyyppi: blogi\nsivusto: Stanford Encyclopedia of Philosophy\nlähde: https://plato.stanford.edu/entries/hegel/\nhaettu: 2026-11-01\njulkaistu: 2020', 'Georg Wilhelm Friedrich Hegel'), { luettu: NYT - 1 * PAIVA, pct: 100 }],
  ['p-raamattu', T('julkaistu: 1992', 'Raamattu'), { luettu: NYT - 6 * PAIVA, kasikirja: 1 }],
  ['p-areiopagi', T('tyyppi: blogi\nsivusto: Areiopagi\ntekijä: Olli-Pekka Vainio & Aku Visala\njulkaistu: 2024\nlähde: https://www.areiopagi.fi/2024/tiede-ja-usko/', 'Tiede ja usko'), { luettu: NYT - 7 * PAIVA }],
  ['p-pinossa', T('tekijä: Maurice Merleau-Ponty\nasiasanat: filosofia, psykologia', 'Havainnon fenomenologia'), { pct: 12 }],
  ['p-pinossa-2', T('', 'Lukematon'), {}]
];

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const page = await (await selain.newContext({ viewport: { width: 900, height: 1000 } })).newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  // Tekstit ovat tekstikannassa (luin/tekstit.js, 19.11.2026), muu localStoragessa.
  // Etukentän kirjoitus kantaan on asynkroninen, joten tekstiä luettaessa odotetaan hetki.
  const ls = async (k) => { if (k.startsWith('luin-teksti:')) await page.waitForTimeout(300);
    return page.evaluate(k => k.startsWith('luin-teksti:') ? LuinTekstit.lue(k.slice(12)) : JSON.parse(localStorage.getItem(k)), k); };
  await page.goto(U + 'luin.html#');
  await page.evaluate(([TEKSTIT]) => {
    localStorage.clear();
    const lista = [];
    TEKSTIT.forEach(([id, md, lisa], i) => {
      localStorage.setItem('luin-teksti:' + id, JSON.stringify(md));
      // Kuten lisaaListaan(), mutta ilman luokittelua: vanha nimike, joka täydennetään etukentästä (lkTaydenna).
      const d = LuinMD.parse(md);
      lista.push(Object.assign({ id, title: d.title, added: 1000 + i, src: 'paikallinen', author: d.author, sivusto: d.tiedot.sivusto || '' }, lisa));
    });
    // Merkinnät: Hegel-tutkimuksessa 21 alleviivausta (2 kirjausta), SEP:ssä yksi.
    const al = (n, k) => Array.from({ length: n }, (_, j) => ({ b: 1, a: 0, l: 5, t: 'x', n: j < k ? 'kirjaus' : '' }));
    localStorage.setItem('luin-merkit:p-hegel-tutkimus', JSON.stringify({ km: [], al: al(21, 2) }));
    localStorage.setItem('luin-merkit:p-sep', JSON.stringify({ km: [], al: al(1, 0) }));
    localStorage.setItem('luin-lista', JSON.stringify(lista));
  }, [TEKSTIT]);
  // Sama dokumentti ei lataudu uudelleen pelkän osoitteen #-osan vaihtuessa, joten ladataan aina uudelleen.
  let lkm = 0;
  const lataa = (h) => page.goto(U + 'luin.html?n=' + (++lkm) + h);
  await lataa('#');
  await page.waitForSelector('#nimikkeet li');

  // Pino ennallaan.
  const pino = await page.evaluate(() => ({ vo: document.querySelectorAll('#nimikkeet li.valiots').length,
    n: [...document.querySelectorAll('#nimikkeet li.nimike .n-ots')].map(x => x.textContent.trim()),
    tieto: [...document.querySelectorAll('#nimikkeet .n-tieto')].map(x => x.textContent), jarj: !document.getElementById('jarj-rivi').hidden }));
  tulos('pinossa ei välikortteja eikä järjestysriviä', pino.vo === 0 && !pino.jarj, JSON.stringify(pino.vo) + ' ' + pino.jarj);
  tulos('pinon järjestys on avausjärjestys (uusin tullut ensin), ei luokittelu', pino.n.join('|') === 'Lukematon|Havainnon fenomenologia', pino.n.join('|'));
  tulos('pinon tietorivillä ei asiasanoja', !pino.tieto.some(t => /filosofia/.test(t)), pino.tieto.join(' / '));

  async function kellari(j, pinoMukana) {
    await page.evaluate(([j, p]) => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.kellariJarj = j; a.kellariPino = p ? 1 : 0; localStorage.setItem('luin-asetukset', JSON.stringify(a)); }, [j, pinoMukana]);
    await lataa('#arkisto');
    await page.waitForSelector('#nimikkeet li');
    return nakyma();
  }
  // Välikortti on nappi (button.vo), jossa nimi ja ryhmän koko.
  const nakyma = () => page.evaluate(() => [...document.querySelectorAll('#nimikkeet li')].map(li => li.classList.contains('valiots')
    ? '[' + li.querySelector('.vo > span').textContent + ' ' + li.querySelector('.vo-lkm').textContent + ']' : li.querySelector('.n-ots').textContent.trim() + ' {' + li.querySelector('.n-tieto').textContent + '}'));
  const nimet = a => a.map(x => x.replace(/ \{.*\}$/, '')).join(' | ');

  let r = await kellari('luettu');
  tulos('oletus: käsikirjasto ylimpänä, muut luettu-järjestyksessä', nimet(r) === '[Käsikirjasto 1] | Raamattu | [Luetut 6] | Georg Wilhelm Friedrich Hegel | Kirjeitä Luciliukselle | Tekstejä rautakauden Levantista | Septuaginta | Hegel’s Phenomenology | Tiede ja usko', nimet(r));
  tulos('tietorivillä asiasanat, käsikirjan kertoo välikortti', r.some(x => /Hegel’s.*filosofia, Hegel/.test(x)) && !r.some(x => /käsikirja/.test(x)), r.join(' / '));
  tulos('järjestysrivi näkyy', await page.evaluate(() => !document.getElementById('jarj-rivi').hidden && document.getElementById('jarj-arvo').textContent === 'luetuksi merkitsemisen mukaan'));
  // Järjestys-nappi: vain nuoli ja järjestys, nimi aria-labelissa; kellarissa ei hakua.
  tulos('Järjestys-nappi ilman nimitekstiä, nimi aria-labelissa; ei hakua', await page.evaluate(() => { const b = document.getElementById('jarj');
    return !/Järjestys/.test(b.textContent) && b.getAttribute('aria-label') === 'Järjestys: ' + b.textContent && !document.getElementById('kk-etsi') && !document.getElementById('kk-haku'); }));

  r = await kellari('ajoitus');
  tulos('ajoitus: käsikirjasto ylimpänä, eaa. ennen jaa., Hegel-tutkimus Hegelin vuoteen', nimet(r) ===
    '[Käsikirjasto 1] | Raamattu | [1000-luku eaa. 1] | Tekstejä rautakauden Levantista | [200-luku eaa. 1] | Septuaginta | [1–99 jaa. 1] | Kirjeitä Luciliukselle | [1800-luku 1] | Hegel’s Phenomenology | [2000-luku 2] | Georg Wilhelm Friedrich Hegel | Tiede ja usko', nimet(r));
  tulos('ajoitus näkyy tietorivillä', r.some(x => /Septuaginta \{ajoitus 250 eaa\./.test(x)) && r.some(x => /Raamattu \{julkaistu 1992/.test(x)), r.join(' / '));

  r = await kellari('tekija');
  tulos('tekijä: julkaisu (Areiopagi, SEP) tai kirjoittajan sukunimi, tekijätön nimen mukaan', nimet(r) === '[Käsikirjasto 1] | Raamattu | [A 1] | Tiede ja usko | [P 1] | Hegel’s Phenomenology | [S 3] | Kirjeitä Luciliukselle | Septuaginta | Georg Wilhelm Friedrich Hegel | [T 1] | Tekstejä rautakauden Levantista', nimet(r));
  tulos('tekijänä julkaisu, kirjoittajat tietorivillä', r.some(x => /^Tiede ja usko \{Olli-Pekka Vainio & Aku Visala/.test(x)), r.join(' / '));

  r = await kellari('kirjoittaja');
  tulos('kirjoittaja: henkilöittäin sukunimen mukaan, kahden kirjoittajan teksti kummankin alla', nimet(r) ===
    '[Käsikirjasto 1] | Raamattu | [Pinkard, Terry 1] | Hegel’s Phenomenology | [Seneca, Lucius Annaeus 1] | Kirjeitä Luciliukselle | [Vainio, Olli-Pekka 1] | Tiede ja usko | [Visala, Aku 1] | Tiede ja usko | [Ilman kirjoittajaa 3] | Tekstejä rautakauden Levantista | Septuaginta | Georg Wilhelm Friedrich Hegel', nimet(r));

  r = await kellari('laji');
  tulos('laji', nimet(r) === '[Käsikirjasto 1] | Raamattu | [Tieteelliset 1] | Hegel’s Phenomenology | [Kaunokirjallisuus 1] | Septuaginta | [Blogit ja verkkosivut 2] | Georg Wilhelm Friedrich Hegel | Tiede ja usko | [Lajittelemattomat 2] | Kirjeitä Luciliukselle | Tekstejä rautakauden Levantista', nimet(r));

  r = await kellari('asiasana');
  tulos('asiasanat (tags-avain luettu)', nimet(r) === '[Käsikirjasto 1] | Raamattu | [filosofia 1] | Hegel’s Phenomenology | [Hegel 1] | Hegel’s Phenomenology | [teologia 1] | Tekstejä rautakauden Levantista | [Ilman asiasanaa 4] | Georg Wilhelm Friedrich Hegel | Kirjeitä Luciliukselle | Septuaginta | Tiede ja usko', nimet(r));
  // Välikortin suodatus (mietintämyssy 22.11.2026): napautus näyttää vain sen ryhmän, Valitse kaikki koskee sitä, toinen napautus
  // ja järjestysrivin kaikki kortit palauttavat kaikki.
  const kortitNakyy = () => page.evaluate(() => !document.getElementById('kortit-osa').hidden);
  await page.click('#nimikkeet button.vo[data-ots="Ilman asiasanaa"]');
  r = await nakyma();
  tulos('välikortin napautus näyttää vain sen ryhmän', nimet(r) === '[Ilman asiasanaa 4] | Georg Wilhelm Friedrich Hegel | Kirjeitä Luciliukselle | Septuaginta | Tiede ja usko' &&
    await kortitNakyy() && await page.getAttribute('#nimikkeet button.vo', 'aria-pressed') === 'true', nimet(r));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'kortti-suodatus.png') });
  await page.click('#valitse-kaikki');
  tulos('valitse kaikki valitsee vain ryhmän', await page.textContent('#val-maara') === '4 valittu', await page.textContent('#val-maara'));
  await page.click('#val-valikko');
  tulos('valittujen valikko: ryhmän tekstit', await page.textContent('#pop .esi') === '4 tekstiä valittu' &&
    await page.evaluate(() => !!document.querySelector('#pop button[data-k="luokittele"]')), await page.textContent('#pop .esi'));
  await page.mouse.click(5, 5);
  await page.click('#nimikkeet button.vo[data-ots="Ilman asiasanaa"]');
  r = await nakyma();
  tulos('toinen napautus palauttaa kaikki ja nollaa valinnan', r.length === 13 && !(await kortitNakyy()) &&
    await page.evaluate(() => document.getElementById('val-maara').hidden), r.length + ' ' + await page.textContent('#val-maara'));
  await page.click('#nimikkeet button.vo[data-ots="teologia"]');
  await page.click('#kortit');
  tulos('kaikki kortit palauttaa kaikki', (await nakyma()).length === 13 && !(await kortitNakyy()));
  await page.click('#nimikkeet button.vo[data-ots="teologia"]');
  await page.click('#jarj');
  await page.click('#pop button[data-k="j-luettu"]');
  r = await nakyma();
  tulos('järjestyksen vaihto poistaa suodatuksen', nimet(r).startsWith('[Käsikirjasto 1] | Raamattu | [Luetut 6] |') && r.length === 9 && !(await kortitNakyy()), nimet(r));
  await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.kellariJarj = 'asiasana'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });

  r = await kellari('alkupera');
  tulos('alkuperä', nimet(r).startsWith('[Käsikirjasto 1] | Raamattu | [Poimittu verkosta 2] | Tiede ja usko | Georg Wilhelm Friedrich Hegel | [Ladottu itse 4]'), nimet(r));

  r = await kellari('merkinnat');
  tulos('merkinnät', nimet(r).startsWith('[Käsikirjasto 1] | Raamattu | [Runsaasti merkityt 1] | Hegel’s Phenomenology | [Merkityt 1] | Georg Wilhelm Friedrich Hegel | [Merkitsemättömät 4]') &&
    r.some(x => /Hegel’s.*\{21 alleviivausta, 2 kirjausta/.test(x)), nimet(r));

  r = await kellari('edistyminen');
  tulos('edistyminen', nimet(r).startsWith('[Käsikirjasto 1] | Raamattu | [Luettu loppuun 2] | Georg Wilhelm Friedrich Hegel | Hegel’s Phenomenology | [Yli puolet 1] | Tekstejä rautakauden Levantista | [Alle puolet 1] | Septuaginta | [Avaamatta 2]'), nimet(r));

  r = await kellari('luettu', true);
  tulos('pino mukana: kesken ja lukematta omina ryhminään', nimet(r).endsWith('[Kesken pinossa 1] | Havainnon fenomenologia | [Lukematta pinossa 1] | Lukematon') &&
    r.some(x => /Havainnon fenomenologia \{.*pinossa/.test(x)), nimet(r));
  // Sekavalinnalle ei Luin.-toimintoa.
  await page.click('#valitse-kaikki');
  await page.click('#val-valikko');
  const sekat = await page.evaluate(() => [...document.querySelectorAll('#pop button')].map(b => b.dataset.k));
  tulos('sekavalinnassa Luokittele, ei Luin.', sekat.includes('luokittele') && !sekat.includes('luin'), sekat.join(','));
  await page.keyboard.press('Escape');
  await page.mouse.click(5, 5);

  // Järjestysvalikko.
  r = await kellari('luettu');
  await page.click('#jarj');
  await page.click('#pop button[data-k="j-ajoitus"]');
  tulos('järjestysvalikko vaihtaa järjestyksen ja muistaa sen', (await ls('luin-asetukset')).kellariJarj === 'ajoitus' &&
    await page.evaluate(() => document.querySelectorAll('#nimikkeet li.valiots')[1].textContent.startsWith('1000-luku eaa.')));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'kellari-ajoitus.png'), fullPage: true });

  // Luokittele: SEP saa ehdotuksen filosofia.
  await page.click('#nimikkeet button.jako[data-id="p-sep"]');
  await avaaOsa(page, 'luokittele');
  await page.click('#pop button[data-k="luokittele"]');
  const pop1 = await page.evaluate(() => ({ ehd: [...document.querySelectorAll('#pop button.lk-sana.ehd')].map(b => b.dataset.s),
    sanat: [...document.querySelectorAll('#pop button.lk-sana:not(.ehd)')].map(b => b.dataset.s), ph: document.querySelector('#pop input.lk-aj').placeholder }));
  tulos('ehdotus sivustosta, sanasto aakkosittain ilman ehdotettua', pop1.ehd.join() === 'filosofia' && pop1.sanat.join() === 'Hegel,psykologia,teologia', JSON.stringify(pop1));
  tulos('ajoituskentän vihjeenä julkaisuvuosi', /julkaisuvuosi 2020/.test(pop1.ph), pop1.ph);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'luokittele.png') });
  await page.click('#pop button.lk-sana[data-s="filosofia"]');
  let md = await ls('luin-teksti:p-sep');
  tulos('napautus kirjoittaa etukenttään heti', /\nasiasanat: filosofia\n/.test(md), md.split('\n---')[0]);
  // Uusi sana olemassa olevan muodon mukaan: "hegel" → "Hegel".
  await page.fill('#pop input.lk-uusi', 'hegel');
  const suod = await page.evaluate(() => [...document.querySelectorAll('#pop button.lk-sana')].filter(b => !b.hidden).map(b => b.dataset.s));
  tulos('kirjoitus suodattaa sanastoa (valitut jäävät)', suod.join() === 'filosofia,Hegel', suod.join());
  await page.press('#pop input.lk-uusi', 'Enter');
  await page.fill('#pop input.lk-aj', '1770–1831');
  await page.click('#pop button[data-k="ok"]');
  let e = (await ls('luin-lista')).find(x => x.id === 'p-sep');
  md = await ls('luin-teksti:p-sep');
  tulos('uusi sana sanaston muodossa, ajoitus tallessa', JSON.stringify(e.asiasanat) === '["filosofia","Hegel"]' && e.ajoitus === '1770–1831' &&
    /asiasanat: filosofia, Hegel\najoitus: 1770–1831\n---/.test(md), JSON.stringify(e.asiasanat) + ' ' + e.ajoitus);
  tulos('ponnahdus sulkeutui ja ilmoitus', await page.evaluate(() => document.getElementById('pop').hidden && document.getElementById('viesti').textContent), await page.textContent('#viesti'));

  // Väärä ajoitus.
  await page.click('#nimikkeet button.jako[data-id="p-seneca"]');
  await avaaOsa(page, 'luokittele');
  await page.click('#pop button[data-k="luokittele"]');
  await page.fill('#pop input.lk-aj', 'antiikki');
  await page.click('#pop button[data-k="ok"]');
  tulos('väärä ajoitus ei tallennu ja selitys näkyy', await page.evaluate(() => !document.getElementById('pop').hidden && !document.querySelector('#pop .tila').hidden) &&
    (await ls('luin-lista')).find(x => x.id === 'p-seneca').ajoitus === '65 jaa.');
  await page.mouse.click(5, 5);

  // Monivalinta: kahdelle, joista toisella on teologia → sekatila; napautus antaa kaikille.
  r = await kellari('luettu');
  await page.click('#nimikkeet button.valitse[data-id="p-levantti"]');
  await page.click('#nimikkeet button.valitse[data-id="p-septuaginta"]');
  await page.click('#val-valikko');
  await avaaOsa(page, 'luokittele');
  await page.click('#pop button[data-k="luokittele"]');
  const seka = await page.getAttribute('#pop button.lk-sana[data-s="teologia"]', 'aria-pressed');
  await page.click('#pop button.lk-sana[data-s="teologia"]');
  await page.click('#pop button[data-k="kk"]');
  await page.click('#pop button[data-k="ok"]');
  let l = await ls('luin-lista');
  tulos('sekatila ja kaikille lisäys, käsikirjasto kahdelle', seka === 'mixed' &&
    ['p-levantti', 'p-septuaginta'].every(id => { const x = l.find(y => y.id === id); return x.asiasanat.includes('teologia') && x.kasikirja; }), seka);
  tulos('käsikirjasto ei mene etukenttään', !/kasikirja|käsikirja/.test(await ls('luin-teksti:p-septuaginta')));

  // Avaimeton uusi versio (Postihuilu, Latomon Avaa lukimessa) ei pyyhi asiasanoja.
  await page.evaluate(() => { localStorage.setItem('luin-tuonti', JSON.stringify({ md: '# Georg Wilhelm Friedrich Hegel\n\nUusi versio ilman etukenttää.\n' })); });
  await page.goto(U + 'luin.html#tuo');
  await page.waitForSelector('#lukija:not([hidden])');
  e = (await ls('luin-lista')).find(x => x.id === 'p-georg-wilhelm-friedrich-hegel');
  // Tuonnin tunnus on otsikon slug, joten kokeillaan suoraan sillä tunnuksella tallennettua.
  const sepE = (await ls('luin-lista')).find(x => x.id === 'p-sep');
  tulos('(tuonti meni omaan tunnukseensa; vanha ennallaan)', !!e && JSON.stringify(sepE.asiasanat) === '["filosofia","Hegel"]');
  // Luokitellaan pinossa ja lähetetään uusi versio ilman etukenttää. (Suora localStorage-muutos ei käy: sivu tallentaa
  // listansa poistuessaan.)
  await lataa('#');
  await page.waitForSelector('#nimikkeet li');
  await page.click('#nimikkeet button.jako[data-id="p-georg-wilhelm-friedrich-hegel"]');
  await avaaOsa(page, 'luokittele');
  await page.click('#pop button[data-k="luokittele"]');
  await page.fill('#pop input.lk-uusi', 'vanha');
  await page.press('#pop input.lk-uusi', 'Enter');
  await page.fill('#pop input.lk-aj', '1807');
  await page.click('#pop button[data-k="ok"]');
  tulos('luokittelu pinossa ei muuta pinon riviä', await page.evaluate(() => !document.querySelector('#nimikkeet li.valiots') &&
    ![...document.querySelectorAll('#nimikkeet .n-tieto')].some(x => /vanha|1807/.test(x.textContent))));
  await page.evaluate(() => localStorage.setItem('luin-tuonti', JSON.stringify({ md: '# Georg Wilhelm Friedrich Hegel\n\nToinen versio ilman etukenttää.\n' })));
  await lataa('#tuo');
  await page.waitForSelector('#lukija:not([hidden])');
  e = (await ls('luin-lista')).find(x => x.id === 'p-georg-wilhelm-friedrich-hegel');
  tulos('avaimeton uusi versio säilyttää asiasanat ja ajoituksen', JSON.stringify(e.asiasanat) === '["vanha"]' && e.ajoitus === '1807', JSON.stringify(e));

  // Lataa .md: asiasanat mukana.
  await lataa('#');
  await page.waitForSelector('#nimikkeet li');
  await page.click('#nimikkeet button.jako[data-id="p-georg-wilhelm-friedrich-hegel"]');
  await avaaOsa(page, 'lataa');
  const [lataus] = await Promise.all([page.waitForEvent('download'), page.click('#pop button[data-k="lataa"]')]);
  const ladattu = fs.readFileSync(await lataus.path(), 'utf8');
  tulos('Lataa .md:ssä asiasanat ja ajoitus', /^---\nasiasanat: vanha\najoitus: 1807\n---\n\n# Georg/.test(ladattu), ladattu.slice(0, 60));

  // Muuta metatietoja: Latomo näyttää asiasanat, ja niiden poisto siellä poistaa ne.
  await page.click('#nimikkeet button.jako[data-id="p-pinossa"]');
  await avaaOsa(page, 'tiedot');
  await page.click('#pop button[data-k="tiedot"]');
  await page.waitForURL(/latomo\.html#/);
  await page.waitForSelector('#tiedot-osio:not([hidden])');
  const lat = await page.evaluate(() => ({ as: document.getElementById('k-asiasanat').value, nak: !document.querySelector('.kentta[data-k="asiasanat"]').hidden,
    sanasto: [...document.querySelectorAll('.kentta[data-k="asiasanat"] .sanasto button')].map(b => b.textContent) }));
  tulos('Latomo näyttää asiasanat ja sanaston', lat.nak && lat.as === 'filosofia, psykologia' && lat.sanasto.includes('teologia'), JSON.stringify(lat));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'latomo-asiasanat.png'), fullPage: false });
  await page.click('.kentta[data-k="asiasanat"] .sanasto button:has-text("teologia")');
  tulos('sanaston napautus lisää kenttään', await page.inputValue('#k-asiasanat') === 'filosofia, psykologia, teologia', await page.inputValue('#k-asiasanat'));
  await page.fill('#k-asiasanat', 'psykologia');
  await page.click('#avaa');
  await page.waitForURL(/luin\.html/);
  await page.waitForSelector('#nimikkeet li');
  e = (await ls('luin-lista')).find(x => x.id === 'p-pinossa');
  tulos('Latomossa muutettu asiasana tallentui', JSON.stringify(e.asiasanat) === '["psykologia"]', JSON.stringify(e.asiasanat));
  await page.click('#nimikkeet button.jako[data-id="p-pinossa"]');
  await avaaOsa(page, 'tiedot');
  await page.click('#pop button[data-k="tiedot"]');
  await page.waitForURL(/latomo\.html#/);
  await page.waitForSelector('#tiedot-osio:not([hidden])');
  await page.click('.kentta[data-k="asiasanat"] button.pois');
  await page.click('#avaa');
  await page.waitForURL(/luin\.html/);
  await page.waitForSelector('#nimikkeet li');
  e = (await ls('luin-lista')).find(x => x.id === 'p-pinossa');
  md = await ls('luin-teksti:p-pinossa');
  tulos('Latomossa poistettu asiasana poistui', !e.asiasanat && !/asiasanat/.test(md), JSON.stringify(e.asiasanat) + ' ' + md.slice(0, 80));

  // Käsikirja ei ole koskaan pinossa (käyttäjän päätös): se on aina kellarin veivihyllystön käsikirjastossa.
  await lataa('#');
  await page.waitForSelector('#nimikkeet li');
  await page.click('#nimikkeet button.jako[data-id="p-pinossa-2"]');
  await avaaOsa(page, 'luokittele');
  await page.click('#pop button[data-k="luokittele"]');
  await page.click('#pop button[data-k="kk"]');
  await page.click('#pop button[data-k="ok"]');
  const pinoKk = await page.evaluate(() => ({ n: [...document.querySelectorAll('#nimikkeet li.nimike .n-ots')].map(x => x.textContent.trim()),
    ark: !document.getElementById('ark-linkki').hidden, v: document.getElementById('viesti').textContent }));
  tulos('pinosta käsikirjastoon: lähtee pinosta ja ilmoitus kertoo', !pinoKk.n.includes('Lukematon') && pinoKk.ark && /siirtyi käsikirjastoon kellarin veivihyllystöön/.test(pinoKk.v), JSON.stringify(pinoKk));
  r = await kellari('tekija');
  tulos('lukematon käsikirja kellarin käsikirjastossa ilman pinossa-merkintää', r[0] === '[Käsikirjasto 4]' && r.some(x => /^Lukematon \{\}$/.test(x)) &&
    r.indexOf('[A 1]') > r.findIndex(x => x.startsWith('Lukematon')), nimet(r));
  await page.click('#nimikkeet button.jako[data-id="p-pinossa-2"]');
  const kkNapit = await page.evaluate(() => [...document.querySelectorAll('#pop button')].map(b => b.dataset.k + ':' + b.textContent));
  tulos('käsikirjan valikossa Poimi pinoon, Laita ö-mappiin, Irrota käsikirjastosta ja Poista, ei pölyä',
    ['luin:Poimi pinoon', 'omappi:Laita ö-mappiin', 'kasikirja:Irrota käsikirjastosta', 'poista:Poista'].every(x => kkNapit.includes(x)) && !kkNapit.some(x => /^merk:/.test(x)), kkNapit.join(','));
  await page.mouse.click(5, 5);
  await page.click('#nimikkeet button.valitse[data-id="p-raamattu"]');
  await page.click('#nimikkeet button.valitse[data-id="p-seneca"]');
  await page.click('#val-valikko');
  const valNapit = await page.evaluate(() => [...document.querySelectorAll('#pop button')].map(b => b.dataset.k));
  tulos('käsikirjan ja kellarin tekstin valinnassa Poimi ja ö-mappi, ei käsikirjaston kohtaa eikä pölyä', valNapit.includes('luin') && valNapit.includes('omappi') &&
    !valNapit.includes('kasikirja') && !valNapit.includes('merk'), valNapit.join(','));
  await page.mouse.click(5, 5);
  // Uusi versio (Latomon tuonti samalla tunnuksella) ei nosta käsikirjaa pinoon eikä pyyhi luettu-aikaa.
  const raamattu0 = (await ls('luin-lista')).find(x => x.id === 'p-raamattu');
  await page.evaluate(() => localStorage.setItem('luin-tuonti', JSON.stringify({ md: '# Raamattu\n\nUusi versio.\n' })));
  await lataa('#tuo');
  await page.waitForSelector('#lukija:not([hidden])');
  e = (await ls('luin-lista')).find(x => x.id === 'p-raamattu');
  const tk = await page.evaluate(() => document.querySelector('.takaisin').getAttribute('href'));
  tulos('tuotu uusi versio pysyy käsikirjastossa', e.kasikirja && e.luettu === raamattu0.luettu && tk === '#arkisto', JSON.stringify({ kk: e.kasikirja, l: e.luettu, tk }));
  // Käsikirjastosta pois: lukematon palaa pinoon.
  r = await kellari('luettu');
  await page.click('#nimikkeet button.jako[data-id="p-pinossa-2"]');
  await avaaOsa(page, 'luokittele');
  await page.click('#pop button[data-k="luokittele"]');
  await page.click('#pop button[data-k="kk"]');
  await page.click('#pop button[data-k="ok"]');
  r = await kellari('luettu');
  await lataa('#');
  await page.waitForSelector('#nimikkeet li');
  tulos('käsikirjastosta poistettu lukematon palaa pinoon', !r.some(x => x.startsWith('Lukematon')) &&
    await page.evaluate(() => [...document.querySelectorAll('#nimikkeet .n-ots')].some(x => x.textContent.trim() === 'Lukematon')), nimet(r));

  // Sanaston huolto (käyttäjän pyyntö 20.11.2026): nimeäminen uudelleen ja yhdistäminen koko kokoelmassa.
  await page.evaluate(() => {
    const l = JSON.parse(localStorage.getItem('luin-lista'));
    const aseta = (id, a) => { const e = l.find(x => x.id === id); e.asiasanat = a; };
    aseta('p-seneca', ['filo', 'stoa']); aseta('p-septuaginta', ['filo']); aseta('p-levantti', ['teologia', 'filo', 'filosofia']);
    aseta('p-hegel-tutkimus', ['filosofia', 'Hegel']); aseta('p-pinossa', ['filo']);
    localStorage.setItem('luin-lista', JSON.stringify(l));
  });
  await kellari('asiasana');
  tulos('sanasto-linkki järjestysrivillä', await page.evaluate(() => !document.getElementById('sanasto-osa').hidden));
  await page.click('#sanasto');
  const sv = await page.evaluate(() => [...document.querySelectorAll('#pop button.sv')].map(b => b.dataset.s + ':' + b.querySelector('.sv-lkm').textContent));
  tulos('sanasto: kaikki asiasanat määrineen, myös pinon', sv.includes('filo:4') && sv.includes('filosofia:3') && sv.includes('stoa:1'), sv.join(','));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'sanasto.png') });
  await page.click('#pop button.sv[data-s="filo"]');
  await page.fill('#pop input.sv-nimi', 'Filosofia');
  const yh = await page.evaluate(() => ({ ok: document.querySelector('#pop button[data-k="ok"]').textContent, t: document.querySelector('#pop .tila').textContent }));
  tulos('olemassa olevaksi nimetty: Yhdistä ja selite', yh.ok === 'Yhdistä.' && /Yhdistyy asiasanaan filosofia \(3 tekstiä\)/.test(yh.t), JSON.stringify(yh));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'sanasto-yhdista.png') });
  await page.click('#pop button[data-k="ok"]');
  let l2 = await ls('luin-lista');
  const as = id => JSON.stringify(l2.find(x => x.id === id).asiasanat);
  tulos('yhdistetty kaikkiin teksteihin sanaston kirjoitusasulla', as('p-seneca') === '["filosofia","stoa"]' && as('p-septuaginta') === '["filosofia"]' &&
    as('p-pinossa') === '["filosofia"]' && as('p-hegel-tutkimus') === '["filosofia","Hegel"]', ['p-seneca', 'p-septuaginta', 'p-pinossa', 'p-hegel-tutkimus'].map(as).join(' '));
  tulos('sama teksti saa sanan vain kerran', as('p-levantti') === '["teologia","filosofia"]', as('p-levantti'));
  md = await ls('luin-teksti:p-seneca');
  tulos('etukenttä kirjoitettu', /^asiasanat: filosofia, stoa$/m.test(md), md.slice(0, 120));
  tulos('ilmoitus yhdistämisestä', /Asiasana filo yhdistettiin asiasanaan filosofia: 4 tekstiä\./.test(await page.textContent('#viesti')), await page.textContent('#viesti'));
  await page.click('#sanasto');
  await page.click('#pop button.sv[data-s="stoa"]');
  await page.fill('#pop input.sv-nimi', 'Stoa');
  tulos('kirjainkoon muutos on nimeäminen', await page.textContent('#pop button[data-k="ok"]') === 'Nimeä.');
  await page.press('#pop input.sv-nimi', 'Enter');
  l2 = await ls('luin-lista');
  tulos('nimetty uudelleen', as('p-seneca') === '["filosofia","Stoa"]' && /Asiasana stoa on nyt Stoa: 1 teksti\./.test(await page.textContent('#viesti')), as('p-seneca') + ' ' + await page.textContent('#viesti'));
  await page.click('#sanasto');
  await page.click('#pop button.sv[data-s="Hegel"]');
  await page.click('#pop button[data-k="ei"]');
  tulos('älä! palaa sanastoon muuttamatta', await page.evaluate(() => document.querySelectorAll('#pop button.sv').length) > 2 &&
    JSON.stringify((await ls('luin-lista')).find(x => x.id === 'p-hegel-tutkimus').asiasanat) === '["filosofia","Hegel"]');
  await page.mouse.click(5, 5);

  // Suodatetun ryhmän luokittelu kerralla: Ilman asiasanaa → kaikki saavat sanan, ryhmä tyhjenee ja kaikki kortit palaavat.
  r = await kellari('asiasana');
  const ilman = r.find(x => /^\[Ilman asiasanaa /.test(x));
  await page.click('#nimikkeet button.vo[data-ots="Ilman asiasanaa"]');
  await page.click('#valitse-kaikki');
  await page.click('#val-valikko');
  await avaaOsa(page, 'luokittele');
  await page.click('#pop button[data-k="luokittele"]');
  await page.click('#pop button.lk-sana[data-s="filosofia"]');
  await page.click('#pop button[data-k="ok"]');
  r = await nakyma();
  tulos('suodatetun ryhmän luokittelu: ryhmä tyhjenee, kaikki kortit palaavat', !r.some(x => /^\[Ilman asiasanaa /.test(x)) && !(await kortitNakyy()) && r.length > 5,
    (ilman || 'ei ryhmää') + ' → ' + nimet(r));

  tulos('ei sivuvirheitä', virheet.length === 0, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})();
