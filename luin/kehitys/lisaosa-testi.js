// Lisää lukimeen -lisäosan selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-testi.js [kuvakansio]
// Lataa luin/lisaosa/ Chromiumiin ja ajaa ketjun: keksitty artikkeli → ponnahdusikkuna → latomo.html#lisaosa →
// (Lisää lukimeen) luin.html#tuo → lukulista. ollijuutilainen.github.io palvellaan tästä reposta.
// Testissä ikkuna avataan välilehtenä, jolloin activeTab ei myönny; siksi lisäosa kopioidaan väliaikaiskansioon ja
// sen manifestiin lisätään <all_urls>. Muuten lisäosa on sama.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const ARTIKKELI = 'https://esimerkki.test/blogi/2026/kirjoitus.html';

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const kappale = n => `<p>${'Tämä on artikkelin leipätekstiä, jota on tarpeeksi, jotta Readability tunnistaa sen sisällöksi. '.repeat(n)}</p>`;
const SIVU = `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>Kokeilukirjoitus | Esimerkkiblogi</title>
<meta property="og:site_name" content="Esimerkkiblogi">
<meta property="article:published_time" content="2026-10-08T07:30:00+03:00">
<meta name="author" content="Maija Meikäläinen"></head><body>
<header><nav><a href="/">Etusivu</a> <a href="/arkisto/">Arkisto</a></nav></header>
<main><article><h1>Kokeilukirjoitus</h1>
${kappale(4)}
<p>Toinen kappale viittaa lähteeseen.<sup><a href="#viite-1" id="ref-1">1</a></sup> Sitten <a href="../2025/vanha.html">vanhaan kirjoitukseen</a> ja sana yhdys­sana.</p>
<figure><a href="/kuvat/iso.jpg"><img src="/kuvat/pieni.jpg" alt="Kuva"></a><figcaption>Kuvateksti jää.</figcaption></figure>
<h2>Väliotsikko</h2>
${kappale(3)}
<p id="valittava">Tämä yksi kappale maalataan valinnaksi, ja siinä on *tähti* ja [hakasulkeet] suojattaviksi.</p>
<table><tr><td>Vuosi</td><td>Teos</td></tr><tr><td>1781</td><td>Kritiikki</td></tr></table>
<iframe src="https://www.youtube.com/embed/x"></iframe>
<ol class="viitteet"><li id="viite-1">Koistinen 2013, 42.</li></ol>
</article></main><footer>© Esimerkkiblogi</footer></body></html>`;

(async () => {
  // Lisäosasta testikopio, jonka manifestissa <all_urls>.
  const lisaosa = fs.mkdtempSync(path.join(os.tmpdir(), 'lisaosa-'));
  fs.cpSync(path.join(JUURI, 'luin/lisaosa'), lisaosa, { recursive: true });
  const man = JSON.parse(fs.readFileSync(path.join(lisaosa, 'manifest.json'), 'utf8'));
  man.host_permissions.push('<all_urls>');
  fs.writeFileSync(path.join(lisaosa, 'manifest.json'), JSON.stringify(man, null, 2));
  const profiili = fs.mkdtempSync(path.join(os.tmpdir(), 'lisaosa-profiili-'));

  const ctx = await chromium.launchPersistentContext(profiili, { channel: 'chromium', headless: true,
    args: ['--disable-extensions-except=' + lisaosa, '--load-extension=' + lisaosa] });
  const virheet = [];
  // Vain http(s): reitti '**/*' sieppaisi myös lisäosan omat tiedostot (chrome-extension://), ja ikkuna jäisi tyhjäksi.
  await ctx.route(/^https?:/, r => {
    const u = new URL(r.request().url());
    if (u.href.split('#')[0] === ARTIKKELI) return r.fulfill({ body: SIVU, contentType: 'text/html; charset=utf-8' });
    if (u.hostname === 'ollijuutilainen.github.io') {
      const p = path.join(JUURI, decodeURIComponent(u.pathname));
      if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ body: fs.readFileSync(p), contentType: TYYPIT[path.extname(p)] || 'application/octet-stream' });
    }
    return r.abort();
  });

  // Lisäosan tunnus profiilista (ei taustaskriptiä, joten service workeria ei ole).
  let id = null;
  for (let i = 0; i < 40 && !id; i++) {
    await new Promise(r => setTimeout(r, 250));
    for (const f of ['Secure Preferences', 'Preferences']) {
      try {
        const s = JSON.parse(fs.readFileSync(path.join(profiili, 'Default', f), 'utf8')).extensions.settings;
        id = Object.keys(s).find(k => s[k].path === lisaosa) || id;
      } catch (e) {}
    }
  }
  tulos('lisäosa latautuu', !!id, id || 'tunnusta ei löytynyt profiilista');
  if (!id) { await ctx.close(); process.exit(1); }
  const IKKUNA = `chrome-extension://${id}/ponnahdus.html`;

  const artikkeli = ctx.pages()[0] || await ctx.newPage();
  artikkeli.on('pageerror', e => virheet.push('artikkeli: ' + e.message));
  await artikkeli.goto(ARTIKKELI);

  // Ikkuna sulkee itsensä napin jälkeen (window.close), joten joka kerta uusi välilehti.
  let ikkuna = null;
  const avaaIkkuna = async () => {
    if (!ikkuna || ikkuna.isClosed()) { ikkuna = await ctx.newPage(); ikkuna.on('pageerror', e => virheet.push('ikkuna: ' + e.message)); }
    await ikkuna.goto(IKKUNA);
    const tab = await ikkuna.evaluate(async u => (await chrome.tabs.query({ url: u }))[0].id, ARTIKKELI);
    await ikkuna.goto(IKKUNA + '?valilehti=' + tab);
    await ikkuna.waitForFunction(() => !document.querySelector('#lukimeen').disabled || /voi|löytynyt/.test(document.body.textContent), null, { timeout: 5000 });
  };
  // Nappi avaa uuden välilehden; odotetaan sen asettuvan (Latomo, tai Luin jos nappi oli Lisää lukimeen).
  const paina = async (nappi, minne) => {
    const uusi = ctx.waitForEvent('page');
    await ikkuna.click(nappi);
    const p = await uusi;
    p.on('pageerror', e => virheet.push('välilehti: ' + e.message));
    await p.waitForURL(minne, { timeout: 8000 });
    await p.waitForTimeout(700);
    return p;
  };

  // 1. Koko artikkeli: ikkuna näyttää otsikon ja sanamäärän, valintariviä ei ole.
  await avaaIkkuna();
  const ik = await ikkuna.evaluate(() => ({ otsikko: document.querySelector('#otsikko').textContent, meta: document.querySelector('#meta').textContent,
    valinta: !document.querySelector('#valintarivi').hidden }));
  tulos('ikkuna: otsikko ja sanamäärä', ik.otsikko === 'Kokeilukirjoitus' && /^Esimerkkiblogi · \d+ sanaa$/.test(ik.meta) && !ik.valinta, JSON.stringify(ik));
  if (KUVAT) { await ikkuna.setViewportSize({ width: 360, height: 300 }); await ikkuna.screenshot({ path: path.join(KUVAT, 'lisaosa-ikkuna.png') }); }

  // 2. Avaa Latomossa: leike tekstikentässä, MarkDownload-tila päällä korvamerkistä, siivous tehty.
  const latomo = await paina('#latomoon', /latomo\.html$/);
  const L = await latomo.evaluate(() => ({ md: document.querySelector('#md').value, t: window.__latomo.tulos(),
    mdl: document.querySelector('#mdl').getAttribute('aria-pressed'), tila: document.querySelector('#mdl-tila').textContent.trim(), hash: location.hash }));
  const raaka = L.md, md = L.t.md;
  tulos('Latomo: leike tekstikentässä, osoitteesta pois #lisaosa', /^---\ntekijä: Maija Meikäläinen\nsivusto: Esimerkkiblogi\njulkaistu: 2026-10-08T07:30:00\+03:00\nlähde: https:\/\/esimerkki\.test\/blogi\/2026\/kirjoitus\.html\nleikattu: \d{4}-\d\d-\d\d\n---\n# Kokeilukirjoitus\n\n/.test(raaka) && L.hash === '',
    raaka.split('\n').slice(0, 9).join(' | '));
  tulos('Latomo: korvamerkki kytkee MarkDownload-tilan', L.mdl === 'true' && /^haettu: \d{4}-\d\d-\d\d$/m.test(md) && !/leikattu/.test(md), L.mdl + ' | ' + L.tila);
  tulos('viite koottu', /^Meikäläinen, Maija \(2026\)\. Kokeilukirjoitus\./.test(L.t.koottu || ''), L.t.koottu);
  tulos('oman sivun yläindeksilinkki numeroksi', /lähteeseen\.\^1\^ Sitten/.test(md), (md.match(/lähteeseen\..{0,40}/) || [''])[0]);
  tulos('suhteellinen linkki absoluuttiseksi', /^\[\d+\]: https:\/\/esimerkki\.test\/blogi\/2025\/vanha\.html$/m.test(raaka), (raaka.match(/^\[\d+\]: .*vanha.*$/m) || ['ei löydy'])[0]);
  tulos('kuvat ja tyhjä kuvalinkki pois, kuvateksti jää', !/!\[|\[\]\(|\[\]\[|pieni\.jpg|iso\.jpg/.test(raaka) && /Kuvateksti jää\./.test(raaka));
  tulos('pehmeä tavuviiva pois', /yhdyssana/.test(raaka) && !/­/.test(raaka));
  tulos('upotus pois', !/iframe|youtube/.test(raaka));
  tulos('Markdown-merkit suojattu', /\\\*tähti\\\* ja \\\[hakasulkeet\\\]/.test(raaka), (raaka.match(/.{0,5}tähti.{0,30}/) || [''])[0]);
  tulos('otsikkorivitön taulukko Markdowniksi', /\| Vuosi \| Teos \|\n\| --- \| --- \|\n\| 1781 \| Kritiikki \|/.test(md), (md.match(/\|[^\n]*Vuosi[^\n]*\n[^\n]*\n[^\n]*/) || ['ei taulukkoa'])[0]);
  tulos('väliotsikko ##', /^## Väliotsikko$/m.test(md));
  await latomo.close();

  // 3. Lisää lukimeen: Latomo painaa itse Avaa Luinissa, ja teksti on Luinin lukulistassa.
  await avaaIkkuna();
  const luin = await paina('#lukimeen', /luin\.html#id=/);
  const lista = await luin.evaluate(() => ({ lista: JSON.parse(localStorage.getItem('luin-lista') || '[]'), avain: Object.keys(localStorage).filter(k => k.startsWith('luin-teksti:')),
    tuonti: localStorage.getItem('luin-tuonti') }));
  const e = lista.lista[0] || {};
  tulos('Lisää lukimeen: lukulistassa', lista.lista.length === 1 && e.title === 'Kokeilukirjoitus' && e.author && lista.avain.length === 1 && lista.tuonti === null,
    JSON.stringify({ n: lista.lista.length, title: e.title, author: e.author, sivusto: e.sivusto, avain: lista.avain }));
  const luinTeksti = await luin.evaluate(() => document.body.innerText);
  tulos('Luin näyttää tekstin', /Kokeilukirjoitus/.test(luinTeksti) && /Väliotsikko/.test(luinTeksti));
  if (KUVAT) await luin.screenshot({ path: path.join(KUVAT, 'lisaosa-luin.png') });
  await luin.close();

  // 4. Valinta: rivi näkyy ja on valittuna; Latomoon menee vain valittu kappale otsikon alle.
  await artikkeli.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById('valittava'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await avaaIkkuna();
  const v = await ikkuna.evaluate(() => ({ nakyy: !document.querySelector('#valintarivi').hidden, valittu: document.querySelector('#valinta').checked, meta: document.querySelector('#meta').textContent }));
  tulos('valinta: rivi näkyy ja on valittuna', v.nakyy && v.valittu && /· 1[0-9] sanaa$/.test(v.meta), JSON.stringify(v));
  const latomo2 = await paina('#latomoon', /latomo\.html$/);
  const raaka2 = await latomo2.inputValue('#md');
  tulos('valinta: vain valittu kappale', /# Kokeilukirjoitus\n\nTämä yksi kappale maalataan valinnaksi/.test(raaka2) && !/leipätekstiä|Väliotsikko/.test(raaka2) && /^leikattu: /m.test(raaka2),
    raaka2.split('\n').slice(6).join(' | ').slice(0, 200));
  await latomo2.close();

  // 5. Pelkkä Latomo osoitteella #lisaosa ilman odottavaa leikettä: tekstikenttä tyhjä.
  const tyhja = await ctx.newPage();
  await tyhja.goto('https://ollijuutilainen.github.io/luin/latomo.html#lisaosa');
  await tyhja.waitForTimeout(600);
  tulos('ei odottavaa leikettä: Latomo tyhjä', (await tyhja.inputValue('#md')) === '');
  await tyhja.close();

  // 6. Lyhyt sivu: Readability palauttaa senkin, ja sanamäärä taipuu. Tyhjä sivu: napit pois ja neuvo.
  await artikkeli.setContent('<html><body><p>Lyhyt.</p></body></html>');
  await avaaIkkuna();
  const lyhyt = await ikkuna.evaluate(() => ({ pois: document.querySelector('#lukimeen').disabled, meta: document.querySelector('#meta').textContent }));
  tulos('lyhyt sivu: 1 sana', !lyhyt.pois && / · 1 sana$/.test(lyhyt.meta), JSON.stringify(lyhyt));
  await artikkeli.setContent('<html><body></body></html>');
  await avaaIkkuna();
  const ei = await ikkuna.evaluate(() => ({ pois: document.querySelector('#lukimeen').disabled, tila: document.querySelector('#tila').textContent }));
  tulos('tyhjä sivu: napit pois ja neuvo', ei.pois && /Maalaa luettava kohta/.test(ei.tila), JSON.stringify(ei));

  tulos('ei sivuvirheitä', virheet.length === 0, virheet.join(' / '));
  await ctx.close();
  fs.rmSync(lisaosa, { recursive: true, force: true }); fs.rmSync(profiili, { recursive: true, force: true });
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
