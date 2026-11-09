// Lisää lukimeen -lisäosan selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-testi.js [kuvakansio]
// Lataa luin/lisaosa/ Chromiumiin ja ajaa ketjun: keksitty artikkeli → ponnahdusikkuna → latomo.html#lisaosa →
// (Lisää lukimeen) luin.html#tuo → lukulista. Latomo ja Luin tulevat tästä reposta paikalliselta palvelimelta: ikkunan
// tabs.create-navigointi ohittaa Playwrightin reitityksen, jolloin Latomo latautui oikealta GitHub Pagesilta ja md.js
// paikallisesta reposta (6.11.2026: Pagesin uudempi Latomo kutsui funktiota, jota haaran md.js:ssä ei ollut).
// Testissä ikkuna avataan välilehtenä, jolloin activeTab ei myönny; siksi lisäosa kopioidaan väliaikaiskansioon ja
// sen manifestiin lisätään <all_urls>. Muuten lisäosa on sama.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const http = require('http');

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

// SEP:n rakenne (keksitty sisältö): johdanto, #main-text, jossa otsikon tunnisteessa on Readabilityn kielteinen sana
// (#ExpeMeta), bibliografia luettelona, Academic Tools, ja alaviitteet erillisellä notes.html-sivulla (alaviite 3 puuttuu).
const SEP = 'https://plato.example/entries/koe/';
const sepKpl = n => `<p>${'Leipätekstiä tietosanakirjan artikkelissa, joka on tarpeeksi pitkä sisällöksi. '.repeat(n)}</p>`;
const SEP_SIVUT = {
  [SEP]: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Koe (Stanford Encyclopedia of Philosophy)</title>
<meta property="citation_author" content="Meikäläinen, Maija"></head><body><div id="container"><div id="navigation"><a href="/">Home</a></div>
<div id="article"><div id="article-content"><div id="aueditable"><h1>Koe</h1><div id="pubinfo"><em>First published Thu Nov 1, 2018</em></div>
<div id="preamble"><p>Johdannon kappale, jonka Readability pudottaa pois, vaikka se on artikkelin alku.</p></div>
<div id="toc"><ul><li><a href="#Eka">1. Eka</a></li><li><a href="#ExpeMeta">2. Experience and Metaphysics</a></li></ul></div>
<div id="main-text"><h2 id="Eka">1. Eka</h2>${sepKpl(5)}<p>Viittaus Deweyyn.<sup>[<a href="notes.html#note-1" id="ref-1">1</a>]</sup> Toinen.<sup>[<a href="notes.html#note-2" id="ref-2">2</a>]</sup> Kolmas.<sup>[<a href="notes.html#note-3" id="ref-3">3</a>]</sup></p>
<h2 id="ExpeMeta">2. Experience and Metaphysics</h2><h3 id="Sub">2.1 Alaluku</h3>${sepKpl(5)}</div>
<div id="bibliography"><h2 id="Bib">Bibliography</h2><ul><li>Dewey, John, 1925, <em>Experience and Nature</em>, Chicago: Open Court.</li><li>Dykhuizen, George, 1973, <em>The Life and Mind of John Dewey</em>, Carbondale.</li></ul></div>
<div id="academic-tools"><h2 id="Aca">Academic Tools</h2><p>How to cite this entry.</p></div>
<div id="other-internet-resources"><h2 id="Oth">Other Internet Resources</h2><ul><li><a href="https://example.org/dewey">Dewey-seura</a></li></ul></div>
<div id="related-entries"><h2 id="Rel">Related Entries</h2><p><a href="../james/">James</a></p></div>
</div></div></div></div></body></html>`,
  [SEP + 'notes.html']: `<!doctype html><html><head><meta charset="utf-8"><title>Notes</title></head><body><div id="aueditable">
<h2>Notes to <a href="index.html">Koe</a></h2>
<div id="note-1"><p><a href="index.html#ref-1">1.</a> Ks. Dykhuizen 1973: 30–31.</p></div>
<div id="note-2"><p><a href="index.html#ref-2">2</a>. Ensimmäinen kappale.</p><blockquote><p>Lainaus alaviitteessä.</p></blockquote><p>Jatko <a href="../james/">Jamesiin</a>.</p></div>
</div></body></html>`
};

// Bloggerin rakenne (keksitty sisältö, klassisen ja Contempo-pohjan luokat): etusivulla kaksi kirjoitusta, joista toinen
// katkaistu (Lue lisää), Featured Post (uusin, vain siinä) ja Popular Posts; kirjoituksessa sitovia välilyöntejä,
// lainaus otsikkotyylinä, kuvateksti taulukossa, lihavoitu väliotsikko. Kirjoituksen oma sivu on myös yksittäinen leike.
const BLOGI = 'https://koeblogi.blogspot.com/';
const BLOG_POSTI = BLOGI + '2026/09/toinen.html';
const blogKpl = n => `<p>&nbsp;${'Blogikirjoituksen virke, jossa on tarpeeksi sanoja sisällöksi. '.repeat(n)}</p>`;
const blogPosti = (otsikko, url, aika, runko, hyppy) => `<div class="post-outer"><div class="post hentry"><h3 class="post-title entry-title"><a href="${url}">${otsikko}</a></h3>
<div class="post-body entry-content">${runko}</div>${hyppy ? `<div class="jump-link"><a href="${url}#more">Lue lisää »</a></div>` : ''}
<div class="post-footer"><span class="post-author vcard">Lähettänyt <span class="fn"><a class="g-profile" href="https://www.blogger.com/profile/1"><span itemprop="name">Maija Bloggaaja</span></a></span></span>
<span class="post-timestamp"><a class="timestamp-link" href="${url}"><abbr class="published" title="${aika}">${aika}</abbr></a></span></div></div></div>`;
const blogSivu = (otsikko, keski) => `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>${otsikko}</title><meta name="generator" content="blogger">
<link rel="alternate" type="application/atom+xml" title="  Koeblogi - Atom" href="${BLOGI}feeds/posts/default"></head><body>
<div class="widget Header"><h1 class="title">Koeblogi</h1></div><div class="main">${keski}</div>
<div class="sidebar"><div class="widget PopularPosts"><ul><li><div class="item-title">Ensimmäinen</div><div class="item-snippet">Suosittu katkelma...</div></li></ul></div></div></body></html>`;
const BLOG_RUNKO_1 = `${blogKpl(4)}<p><br></p><h4 style="text-align: left;">"Lainaus, joka on kirjoitettu otsikkotyylillä ja on pitkä. ${'Lainauksen jatko kulkee. '.repeat(8)}<br>Toinen lainauksen kappale."</h4>
<table class="tr-caption-container"><tbody><tr><td><img src="https://koeblogi.example/kuva.jpg"></td></tr><tr><td class="tr-caption">Kuvateksti taulukossa</td></tr></tbody></table>
<h2><b>Lihavoitu väliotsikko</b></h2>${blogKpl(3)}<span>&nbsp;&nbsp; &nbsp;</span><span>&nbsp;&nbsp; &nbsp;</span><span>&nbsp;Kuvateksti välilyöntien perässä</span>`;
const BLOG_SIVUT = {
  [BLOGI]: blogSivu('Koeblogi', `<div class="widget FeaturedPost"><div class="widget-content"><h3 class="post-title"><a href="${BLOGI}2026/10/uusin.html">Uusin</a></h3>
<abbr class="published" title="2026-10-21T07:02:00-07:00">x</abbr><div class="post-body entry-content"><div class="snippet-item">Uusimman katkelma...</div></div></div></div>
<div class="widget Blog"><div class="blog-posts hfeed">${blogPosti('Ensimmäinen', BLOGI + '2026/09/eka.html', '2026-09-03T10:19:00-07:00', BLOG_RUNKO_1, false)}
${blogPosti('Toinen', BLOG_POSTI, '2026-09-01T23:30:00+03:00', blogKpl(2), true)}</div></div>`),
  [BLOG_POSTI]: blogSivu('Koeblogi: Toinen', `<div class="widget Blog"><div class="blog-posts hfeed">${blogPosti('Toinen', BLOG_POSTI, '2026-09-01T23:30:00+03:00', blogKpl(2) + '<p>Hypyn jälkeinen loppu.</p>', false)}</div></div>`)
};

(async () => {
  // Lisäosasta testikopio, jonka manifestissa <all_urls>.
  const lisaosa = fs.mkdtempSync(path.join(os.tmpdir(), 'lisaosa-'));
  fs.cpSync(path.join(JUURI, 'luin/lisaosa'), lisaosa, { recursive: true });
  const man = JSON.parse(fs.readFileSync(path.join(lisaosa, 'manifest.json'), 'utf8'));
  const palvelin = http.createServer((q, r) => {
    const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
    if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(r);
  }).listen(0);
  await new Promise(r => palvelin.once('listening', r));
  const PAIKALLINEN = 'http://127.0.0.1:' + palvelin.address().port + '/';
  man.host_permissions.push('<all_urls>');
  man.content_scripts[0].matches = [PAIKALLINEN + 'luin/latomo.html*'];
  fs.writeFileSync(path.join(lisaosa, 'manifest.json'), JSON.stringify(man, null, 2));
  const pj = path.join(lisaosa, 'ponnahdus.js');
  fs.writeFileSync(pj, fs.readFileSync(pj, 'utf8').replace('https://ollijuutilainen.github.io/', PAIKALLINEN));
  const profiili = fs.mkdtempSync(path.join(os.tmpdir(), 'lisaosa-profiili-'));

  const ctx = await chromium.launchPersistentContext(profiili, { channel: 'chromium', headless: true,
    args: ['--disable-extensions-except=' + lisaosa, '--load-extension=' + lisaosa] });
  const virheet = [];
  // Vain http(s): reitti '**/*' sieppaisi myös lisäosan omat tiedostot (chrome-extension://), ja ikkuna jäisi tyhjäksi.
  await ctx.route(/^https?:/, r => {
    const u = new URL(r.request().url());
    if (u.hostname === '127.0.0.1') return r.continue();
    if (u.href.split('#')[0] === ARTIKKELI) return r.fulfill({ body: SIVU, contentType: 'text/html; charset=utf-8' });
    if (BLOG_SIVUT[u.href.split('#')[0]]) return r.fulfill({ body: BLOG_SIVUT[u.href.split('#')[0]], contentType: 'text/html; charset=utf-8' });
    if (SEP_SIVUT[u.href.split('#')[0]]) return r.fulfill({ body: SEP_SIVUT[u.href.split('#')[0]], contentType: 'text/html; charset=utf-8' });
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
  const avaaIkkuna = async (sivu = ARTIKKELI) => {
    if (!ikkuna || ikkuna.isClosed()) { ikkuna = await ctx.newPage(); ikkuna.on('pageerror', e => virheet.push('ikkuna: ' + e.message)); }
    await ikkuna.goto(IKKUNA);
    const tab = await ikkuna.evaluate(async u => (await chrome.tabs.query({ url: u }))[0].id, sivu);
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
    if (!p.url().startsWith(PAIKALLINEN)) virheet.push('välilehti ei ole paikallinen: ' + p.url());
    await p.waitForTimeout(700);
    return p;
  };

  // 1. Koko artikkeli: ikkuna näyttää otsikon ja sanamäärän, valintariviä ei ole.
  await avaaIkkuna();
  const ik = await ikkuna.evaluate(() => ({ otsikko: document.querySelector('#otsikko').textContent, meta: document.querySelector('#meta').textContent,
    valinta: !document.querySelector('#valintarivi').hidden }));
  tulos('ikkuna: otsikko ja sanamäärä', ik.otsikko === 'Kokeilukirjoitus' && /^Esimerkkiblogi · \d+ sanaa$/.test(ik.meta) && !ik.valinta, JSON.stringify(ik));
  if (KUVAT) { await ikkuna.setViewportSize({ width: 360, height: 300 }); await ikkuna.screenshot({ path: path.join(KUVAT, 'lisaosa-ikkuna.png') }); }

  // 2. Avaa Latomossa: leike tekstikentässä, siivous päällä korvamerkistä.
  const latomo = await paina('#latomoon', /latomo\.html$/);
  const L = await latomo.evaluate(() => ({ md: document.querySelector('#md').value, t: window.__latomo.tulos(),
    leike: !document.querySelector('#leike-tila').hidden, tila: document.querySelector('#leike-tila').textContent.trim(), hash: location.hash }));
  const raaka = L.md, md = L.t.md;
  tulos('Latomo: leike tekstikentässä, osoitteesta pois #lisaosa', /^---\ntekijä: Maija Meikäläinen\nsivusto: Esimerkkiblogi\njulkaistu: 2026-10-08T07:30:00\+03:00\nlähde: https:\/\/esimerkki\.test\/blogi\/2026\/kirjoitus\.html\nleikattu: \d{4}-\d\d-\d\d\n---\n# Kokeilukirjoitus\n\n/.test(raaka) && L.hash === '',
    raaka.split('\n').slice(0, 9).join(' | '));
  tulos('Latomo: korvamerkki kytkee leikkeen siivouksen', L.leike && /^haettu: \d{4}-\d\d-\d\d$/m.test(md) && !/leikattu/.test(md), L.leike + ' | ' + L.tila);
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
  await tyhja.goto(PAIKALLINEN + 'luin/latomo.html#lisaosa');
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

  // 7. SEP: johdanto, Readabilityn pudottama otsikko, bibliografia kappaleina, navigointiosiot pois, alaviitteet
  // haettuina; puuttuva alaviite 3 jää yläindeksiksi. Luinissa alaviitteet ja kirjallisuusluettelo.
  await artikkeli.goto(SEP);
  await avaaIkkuna(SEP);
  const sepMeta = await ikkuna.textContent('#meta');
  tulos('SEP: ikkuna kertoo haetut alaviitteet', / · 2 alaviitettä haettu$/.test(sepMeta), sepMeta);
  const latomo3 = await paina('#latomoon', /latomo\.html$/);
  const sr = await latomo3.inputValue('#md'), st = await latomo3.evaluate(() => window.__latomo.tulos());
  tulos('SEP: johdanto ja kaikki otsikot', /^# Koe\n\nJohdannon kappale/m.test(sr) && /^## 2\\\. Experience and Metaphysics$/m.test(sr) && /^### 2\.1 Alaluku$/m.test(sr),
    (sr.match(/^#+ .*$/gm) || []).join(' | '));
  tulos('SEP: bibliografia kappaleina, muut lähteet mukana, navigointi pois', /^## Bibliography\n\nDewey, John, 1925, \*Experience and Nature\*, Chicago: Open Court\.\n\nDykhuizen/m.test(sr) &&
    /^## Other Internet Resources$/m.test(sr) && !/Academic Tools|How to cite|Related Entries|sisällys|toc/i.test(sr.replace(/^---[\s\S]*?\n---\n/, '')), (sr.match(/## Bibliography[\s\S]{0,160}/) || ['ei bibliografiaa'])[0].replace(/\n/g, ' | '));
  tulos('SEP: alaviitteet haettu, paluulinkki pois, jatko sisennettynä', /Viittaus Deweyyn\.\[\^viite-1\] Toinen\.\[\^viite-2\]/.test(sr) &&
    /^\[\^viite-1\]: Ks\. Dykhuizen 1973: 30–31\.$/m.test(sr) && /^\[\^viite-2\]: Ensimmäinen kappale\.\n\n    Lainaus alaviitteessä\.\n\n    Jatko \[Jamesiin\]\(https:\/\/plato\.example\/entries\/james\/\)\.$/m.test(sr) && !/ref-1|ref-2/.test(sr),
    (sr.match(/^\[\^viite-[\s\S]*$/m) || ['ei määritelmiä'])[0].replace(/\n/g, ' | ').slice(0, 300));
  tulos('SEP: puuttuva alaviite jää yläindeksiksi', /Kolmas\.\^\\\[\[3\]\(https:\/\/plato\.example\/entries\/koe\/notes\.html#note-3\)\\\]\^/.test(st.md) || /Kolmas\.\[\^viite-3\]/.test(st.md),
    (st.md.match(/Kolmas\..{0,80}/) || [''])[0]);
  await latomo3.close();
  await avaaIkkuna(SEP);
  const luin2 = await paina('#lukimeen', /luin\.html#id=/);
  const L2 = await luin2.evaluate(() => ({ huom: [...document.querySelectorAll('#teksti .sidenote')].map(x => x.textContent.replace(/\u00ad/g, '').trim()),
    bib: [...document.querySelectorAll('#teksti p.bib')].map(x => x.textContent.slice(0, 20)) }));
  tulos('SEP Luinissa: alaviitteiden tekstit ja kirjallisuusluettelo', L2.huom.length === 3 && /Dykhuizen 1973/.test(L2.huom[0]) && /^2Ensimmäinen kappale\.Lainaus alaviitteessä\.Jatko Jamesiin\.$/.test(L2.huom[1]) &&
    L2.bib.length === 2 && /^Dewey, John/.test(L2.bib[0]), JSON.stringify(L2).slice(0, 400));
  await luin2.close();

  // 8. Blogger: etusivu kokoelmana (otsikko blogin nimi, kirjoitukset lukuina päiväyksineen, katkaistu haettuna, Featured
  // Postin uusin mukana, Popular Posts pois), siivous; kirjoituksen sivu yksittäisenä leikkeenä etukenttineen.
  await artikkeli.goto(BLOGI);
  await avaaIkkuna(BLOGI);
  const latomo4 = await paina('#latomoon', /latomo\.html$/);
  const br = await latomo4.inputValue('#md');
  await latomo4.close();
  const brOts = (br.match(/^#+ .*$/gm) || []).join(' | ');
  tulos('Blogger etusivu: blogin nimi, kirjoitukset lukuina, uusin Featured Postista, tekijä', /^tekijä: Maija Bloggaaja$/m.test(br) && !/^sivusto:|^julkaistu:/m.test(br) &&
    brOts === '# Koeblogi | ## Uusin | ## Ensimmäinen | ### Lihavoitu väliotsikko | ## Toinen' && /^## Ensimmäinen\n\n\*3\.9\.2026\*\n\nBlogikirjoituksen virke/m.test(br) && /^## Toinen\n\n\*1\.9\.2026\*$/m.test(br), brOts);
  tulos('Blogger etusivu: katkaistu haettu, hakematon merkitty, sivupalkki pois', /Hypyn jälkeinen loppu\./.test(br) && !/Lue lisää|Suosittu/.test(br) &&
    /Uusimman katkelma\.\.\.\n\n\*Katkelma: koko kirjoitus ei latautunut\.\*/.test(br), (br.match(/## Uusin[\s\S]{0,120}/) || [''])[0].replace(/\n/g, ' | '));
  tulos('Blogger: sitovat välilyönnit, otsikkolainaus, kuvateksti', !/\u00a0/.test(br) && !/^ /m.test(br.replace(/^```[\s\S]*?```$/gm, '')) &&
    /^> "Lainaus, joka on kirjoitettu otsikkotyylillä[^\n]*\n> ?\n> Toinen lainauksen kappale\."$/m.test(br) && /^\*Kuvateksti taulukossa\*$/m.test(br) &&
    /^Kuvateksti välilyöntien perässä$/m.test(br) && !/\|/.test(br), (br.match(/> "Lainaus[\s\S]{0,40}|Kuvateksti.{0,40}/g) || []).join(' / '));
  await artikkeli.goto(BLOG_POSTI);
  await avaaIkkuna(BLOG_POSTI);
  const latomo5 = await paina('#latomoon', /latomo\.html$/);
  const bp = await latomo5.inputValue('#md');
  await latomo5.close();
  tulos('Blogger kirjoitus: otsikko, tekijä, blogin nimi, päivä paikallisena', /^tekijä: Maija Bloggaaja\nsivusto: Koeblogi\njulkaistu: 2026-09-01\nlähde: https:\/\/koeblogi\.blogspot\.com\/2026\/09\/toinen\.html$/m.test(bp) &&
    /^# Toinen\n\nBlogikirjoituksen virke/m.test(bp) && /Hypyn jälkeinen loppu\.\n$/.test(bp), bp.slice(0, 300).replace(/\n/g, ' | '));

  tulos('ei sivuvirheitä', virheet.length === 0, virheet.join(' / '));
  await ctx.close();
  fs.rmSync(lisaosa, { recursive: true, force: true }); fs.rmSync(profiili, { recursive: true, force: true });
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
