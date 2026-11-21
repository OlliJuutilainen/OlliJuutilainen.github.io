// Perseuksen valinnat Lukimeen-lisäosan ponnahdusikkunassa (käyttäjän pyyntö 19.11.2026): kielet ja kirjat. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/perseus-valinnat-testi.js [välimuisti] [kuvakansio]
// Välimuisti on hakuteospesukoneen (oletus tmp/hakuteos-pesukone): Perseuksen sivut ja XML:t haetaan curlilla kerran ja
// tarjotaan sieltä. Vertailuleikkeet (oletukset ennallaan) ovat pesukoneen tuloksia samassa kansiossa, joten aja ensin
//   node luin/kehitys/hakuteos-pesukone.js --sarja perseus
//   node luin/kehitys/hakuteos-pesukone.js <Valtio kreikaksi koko teos> <Valtio englanniksi koko teos>
// (osoitteet alla KOKO_GR ja KOKO_EN). Lisäosa kopioidaan väliaikaiskansioon ja sen manifestiin lisätään <all_urls>
// (ikkuna on testissä välilehti, jolloin activeTab ei myönny), Latomo ja Luin tulevat paikalliselta palvelimelta.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), cp = require('child_process');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const VALI = process.argv[2] || path.join(os.tmpdir(), 'hakuteos-pesukone');
const KUVAT = process.argv[3];
const PS = 'http://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A';
const GR1 = PS + '1999.01.0167%3Abook%3D1%3Asection%3D327a', EN1 = PS + '1999.01.0168%3Abook%3D1%3Asection%3D327a';
const KOKO_GR = PS + '1999.01.0167', KOKO_EN = PS + '1999.01.0168';
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }
// Sama nimeäminen kuin hakuteos-pesukone.js:ssä.
function valimuisti(url) {
  const f = path.join(VALI, url.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 180) + '.html');
  if (!fs.existsSync(f)) {
    fs.mkdirSync(VALI, { recursive: true });
    const k = cp.execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0', '-o', f, '-w', '%{http_code}', url]).toString();
    if (k !== '200') { fs.rmSync(f, { force: true }); return null; }
  }
  return fs.readFileSync(f, 'utf8');
}
const vertailu = u => { const f = path.join(VALI, u.split('text%3A')[1].replace(/[^\p{L}\p{N}_-]+/gu, '_') + '.leike.md'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const ilmanPaivaa = s => String(s || '').replace(/^leikattu: .*$/m, '');

(async () => {
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
  const virheet = [], xmlHaut = [];
  await ctx.route(/^https?:/, r => {
    const u = r.request().url().split('#')[0];
    if (u.startsWith(PAIKALLINEN)) return r.continue();
    if (/^https?:\/\/www\.perseus\.tufts\.edu\/hopper\/(text|dltext)\?/.test(u)) {
      if (/dltext/.test(u)) xmlHaut.push(u);
      const h = valimuisti(u);
      return h ? r.fulfill({ body: h, contentType: /dltext/.test(u) ? 'text/xml' : 'text/html; charset=utf-8' }) : r.fulfill({ status: 404, body: '' });
    }
    return r.abort();
  });
  let id = null;
  for (let i = 0; i < 40 && !id; i++) {
    await new Promise(r => setTimeout(r, 250));
    for (const f of ['Secure Preferences', 'Preferences']) {
      try { const s = JSON.parse(fs.readFileSync(path.join(profiili, 'Default', f), 'utf8')).extensions.settings; id = Object.keys(s).find(k => s[k].path === lisaosa) || id; } catch (e) {}
    }
  }
  tulos('lisäosa latautuu', !!id);
  if (!id) process.exit(1);
  const IKKUNA = `chrome-extension://${id}/ponnahdus.html`;

  const sivu = ctx.pages()[0] || await ctx.newPage();
  // Perseuksen sivun omat virheet (sen skriptit estetään) eivät kuulu testiin.
  let ikkuna = null;
  const valmis = () => ikkuna.waitForFunction(() => typeof leike !== 'undefined' && leike && !psKesken && !psAjastin && !psAjo, null, { timeout: 120000 });
  const avaa = async u => {
    await sivu.goto(u);
    if (!ikkuna || ikkuna.isClosed()) { ikkuna = await ctx.newPage(); ikkuna.on('pageerror', e => virheet.push('ikkuna: ' + e.message)); await ikkuna.setViewportSize({ width: 380, height: 640 }); }
    await ikkuna.goto(IKKUNA);
    const tab = await ikkuna.evaluate(async u => (await chrome.tabs.query({ url: u }))[0].id, u);
    await ikkuna.goto(IKKUNA + '?valilehti=' + tab);
    await valmis();
  };
  const tila = () => ikkuna.evaluate(() => ({
    otsikko: leike.otsikko === document.querySelector('#otsikko').textContent ? leike.otsikko : 'ikkunassa ' + document.querySelector('#otsikko').textContent, meta: document.querySelector('#meta').textContent, sanoja: leike.kokoSanoja, md: leike.koko,
    nakyy: !document.querySelector('#ps').hidden, kieletNakyy: !document.querySelector('#ps-kielet').hidden,
    kielet: (document.querySelector('input[name="kielet"]:checked') || {}).value || '',
    kielinimet: [...document.querySelectorAll('#ps-kielet label')].map(l => l.textContent.trim()).join(' | '),
    kirjat: [...document.querySelectorAll('#ps-kirjat button')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '),
    huomio: document.querySelector('#ps-huomio').textContent, poimi: !document.querySelector('#lukimeen').disabled }));
  const kirja = async n => { await ikkuna.click(`#ps-kirjat button:text-is("${n}")`); };
  const kieli = async v => { await ikkuna.click(`input[name="kielet"][value="${v}"]`); };
  const h2 = md => (md.match(/^## .*/gm) || []).join(' | ');

  // 1. Valtio kreikaksi, kirja 1: oletus on osoitteen kirja ja molemmat kielet, sama leike kuin ennen.
  await avaa(GR1);
  let t = await tila();
  tulos('valitsimet näkyvät Perseuksen sivulla', t.nakyy && t.kieletNakyy && t.kielinimet === 'kreikka ja englanti | kreikka | englanninkielinen käännös', t.kielinimet);
  tulos('oletus: kirja 1 ja molemmat kielet', t.kirjat === '1* 2 3 4 5 6 7 8 9 10 kaikki' && t.kielet === 'molemmat', t.kirjat + ' / ' + t.kielet);
  const v1 = vertailu(GR1);
  tulos('oletusleike sama kuin pesukoneen (kirja 1, lomitus)', v1 && ilmanPaivaa(t.md) === ilmanPaivaa(v1), t.otsikko + ', ' + t.sanoja + ' sanaa');
  tulos('pieni paketti: ei huomiota', t.huomio === '' && t.poimi, t.huomio);
  if (KUVAT) await ikkuna.screenshot({ path: path.join(KUVAT, 'ps-oletus.png'), fullPage: true });

  // 2. Vain alkuteksti.
  await kieli('alku'); await valmis();
  t = await tila();
  tulos('vain alkuteksti: ei lomitusta', t.kielet === 'alku' && !/^ladonta:/m.test(t.md) && /\(alkuteksti\)/.test(t.meta) && t.otsikko === 'Πολιτεία Αʹ' && t.sanoja < 31016,
    t.otsikko + ', ' + t.sanoja + ' sanaa, ' + t.meta);
  tulos('vain alkuteksti: ei englantia', !/Socrates|Glaucon/.test(t.md) && /Σωκράτης|Γλαύκων/.test(t.md));

  // 3. Vain käännös: sama kuin englanninkielisen sivun leike.
  await kieli('kaannos'); await valmis();
  t = await tila();
  const ve = vertailu(EN1);
  tulos('vain käännös: sama kuin englanninkielisen sivun leike', ve && ilmanPaivaa(t.md) === ilmanPaivaa(ve) && /\(käännös\)/.test(t.meta), t.otsikko + ', ' + t.sanoja + ' sanaa');

  // 4. Molemmat kielet, kirjat 1–3 yhteen.
  await kieli('molemmat'); await valmis();
  await kirja('2'); await kirja('3'); await valmis();
  t = await tila();
  tulos('kirjat 1–3: otsikko ja kirjojen väliotsikot', t.otsikko === 'Πολιτεία Αʹ–Γʹ' && h2(t.md) === '## Αʹ | ## Βʹ | ## Γʹ' && t.kirjat.startsWith('1* 2* 3* 4 '),
    t.otsikko + ' / ' + h2(t.md) + ' / ' + t.kirjat);
  tulos('kirjat 1–3: lomitettu, lähde koko teos', /^ladonta: lomitettu käännös$/m.test(t.md) && /^lähde: .*1999\.01\.0167$/m.test(t.md), (t.md.match(/^lähde: .*/m) || [''])[0]);
  tulos('kirjat 1–3: iso paketti, huomio', /^Iso paketti\. .*yksi kieli tai kirja kerrallaan tai kukin omaksi tekstikseen\.$/.test(t.huomio), t.sanoja + ' sanaa: ' + t.huomio);
  if (KUVAT) await ikkuna.screenshot({ path: path.join(KUVAT, 'ps-kirjat-1-3.png'), fullPage: true });
  // Kirjat 1, 2 ja 5.
  await kirja('3'); await kirja('5'); await valmis();
  t = await tila();
  tulos('kirjat 1, 2 ja 5: otsikko', t.otsikko === 'Πολιτεία Αʹ, Βʹ, Εʹ' && h2(t.md) === '## Αʹ | ## Βʹ | ## Εʹ', t.otsikko + ' / ' + h2(t.md));

  // 5. Kaikki: sama kuin koko teos osoitteesta.
  await ikkuna.click('#ps-kirjat button.kaikki'); await valmis();
  t = await tila();
  const vk = vertailu(KOKO_GR);
  tulos('kaikki: sama kuin koko teoksen leike', vk && ilmanPaivaa(t.md) === ilmanPaivaa(vk) && /kaikki\*$/.test(t.kirjat), t.otsikko + ', ' + t.sanoja + ' sanaa');
  // Kirja pois kaikista: 2–10.
  await kirja('1'); await valmis();
  t = await tila();
  tulos('kirja 1 pois: Βʹ–Ιʹ', t.otsikko === 'Πολιτεία Βʹ–Ιʹ' && !/kaikki\*/.test(t.kirjat), t.otsikko + ' / ' + t.kirjat);
  // Kaikki englanniksi: sama kuin englanninkielinen koko teos.
  await ikkuna.click('#ps-kirjat button.kaikki'); await kieli('kaannos'); await valmis();
  t = await tila();
  const vke = vertailu(KOKO_EN);
  tulos('kaikki, vain käännös: sama kuin englanninkielinen koko teos', vke && ilmanPaivaa(t.md) === ilmanPaivaa(vke) && /kirja kerrallaan tai kukin omaksi tekstikseen\.$/.test(t.huomio) && !/yksi kieli/.test(t.huomio), t.sanoja + ' sanaa: ' + t.huomio);
  // Yksi kirja: kaikki pois paitsi 4, otsikko Republic, Book 4.
  for (const n of ['1', '2', '3', '5', '6', '7', '8', '9', '10']) await kirja(n);
  await valmis();
  t = await tila();
  tulos('yksi kirja käännöksenä: Republic, Book 4', t.otsikko === 'Republic, Book 4' && /1999\.01\.0168%3Abook%3D4$/m.test(t.md.match(/^lähde: .*/m)[0]), t.otsikko + ' / ' + t.kirjat);
  // Viimeistä kirjaa ei voi poistaa.
  await kirja('4'); await ikkuna.waitForTimeout(700); await valmis();
  t = await tila();
  tulos('viimeinen kirja jää valituksi', t.kirjat.includes('4*') && t.otsikko === 'Republic, Book 4', t.kirjat);
  const haut = new Set(xmlHaut);
  tulos('XML haetaan kerran teosta kohden', xmlHaut.length === haut.size && haut.size === 2, xmlHaut.length + ' hakua, ' + haut.size + ' eri');

  // 6. Kielivalinta muistetaan, kirjat tulevat osoitteesta.
  await kieli('alku'); await valmis();
  await avaa(GR1);
  t = await tila();
  tulos('kielivalinta muistetaan, kirja osoitteesta', t.kielet === 'alku' && /\(alkuteksti\)/.test(t.meta) && t.kirjat.startsWith('1* 2 '), t.kielet + ' / ' + t.kirjat);

  // 7. Englanninkielinen sivu: ei kielivalintaa, kirjat näkyvät.
  await avaa(EN1);
  t = await tila();
  tulos('englanninkielinen sivu: kirjat ilman kielivalintaa', t.nakyy && !t.kieletNakyy && t.kirjat.startsWith('1* 2 '), t.kirjat);
  tulos('englanninkielinen sivu: muistettu kielivalinta ei muuta leikettä', ilmanPaivaa(t.md) === ilmanPaivaa(ve));

  // 8. Poimi lukimeen kirjoilla 2 ja 3 kahdella kielellä: Luinissa otsikko ja väliotsikot.
  await avaa(GR1);
  await kieli('molemmat'); await valmis();
  await kirja('2'); await kirja('3'); await kirja('1'); await valmis();
  const uusi = ctx.waitForEvent('page');
  await ikkuna.click('#lukimeen');
  const luin = await uusi;
  await luin.waitForURL(/luin\.html#id=/, { timeout: 30000 });
  await luin.waitForSelector('#lukija:not([hidden]) h1', { timeout: 30000 });
  const L = await luin.evaluate(() => ({ h1: document.querySelector('#lukija h1').textContent, h2: [...document.querySelectorAll('#lukija h2')].map(h => h.textContent).join(' | '),
    kaannoksia: document.querySelectorAll('#lukija blockquote.kaannos').length }));
  tulos('Luinissa Πολιτεία Βʹ, Γʹ, kaksi kirjaa, lomitettu', /Πολιτεία Βʹ, Γʹ/.test(L.h1) && /Βʹ.*Γʹ/.test(L.h2) && L.kaannoksia > 100, JSON.stringify(L));

  // 9. Toinen kreikkalainen poiminta ei korvaa ensimmäistä (ennen 19.11.2026 molemmat saivat tunnuksen p-osio).
  await avaa(GR1);
  const uusi2 = ctx.waitForEvent('page');
  await ikkuna.click('#lukimeen');
  const luin2 = await uusi2;
  await luin2.waitForURL(/luin\.html#id=/, { timeout: 30000 });
  await luin2.waitForSelector('#lukija:not([hidden]) h1', { timeout: 30000 });
  const pino = await luin2.evaluate(() => JSON.parse(localStorage.getItem('luin-lista') || '[]').map(e => e.id + ' ' + e.title));
  tulos('kaksi kreikkalaista kirjaa pinossa eri tunnuksin', pino.length === 2 && new Set(pino.map(x => x.split(' ')[0])).size === 2 && !pino.some(x => /^p-osio /.test(x)), pino.join(' | '));

  // 10. Kirjat 2 ja 3 kukin omaksi tekstikseen (21.11.2026): ikkuna kertoo kaksi tekstiä, ja Latomon kautta pinoon tulee kaksi
  // tekstiä, joista kirja 2 on päällimmäisenä ja auki; kumpikin on sama kuin kirjan oma leike.
  await avaa(GR1);
  await kirja('2'); await kirja('3'); await kirja('1'); await valmis();
  tulos('laajuus näkyy, kun kirjoja on useampi', await ikkuna.evaluate(() => !document.querySelector('#ps-laajuus').hidden &&
    document.querySelector('input[name="laajuus"]:checked').value === 'yhteen'));
  await ikkuna.click('input[name="laajuus"][value="erikseen"]'); await valmis();
  const s10 = await ikkuna.evaluate(() => ({ n: leike.sarja ? leike.sarja.length : 0, ots: leike.sarja ? leike.sarja.map(x => x.otsikko).join(' | ') : '', meta: document.querySelector('#meta').textContent,
    kirja: leike.sarja ? leike.sarja.map(x => x.md) : [] }));
  tulos('erikseen: sarjassa kaksi kirjaa', s10.n === 2 && s10.ots === 'Πολιτεία Βʹ | Πολιτεία Γʹ' && /2 tekstiä/.test(s10.meta), s10.ots + ' / ' + s10.meta);
  if (KUVAT) await ikkuna.screenshot({ path: path.join(KUVAT, 'ps-erikseen.png'), fullPage: true });
  // Vertailu: kirja 3 yksin (osoitteen kirja) on sama leike kuin sarjan toinen.
  const pino0 = await luin2.evaluate(() => JSON.parse(localStorage.getItem('luin-lista') || '[]').length);
  const uusi3 = ctx.waitForEvent('page');
  await ikkuna.click('#lukimeen');
  const luin3 = await uusi3;
  await luin3.waitForURL(/luin\.html#id=/, { timeout: 60000 });
  await luin3.waitForSelector('#lukija:not([hidden]) h1', { timeout: 30000 });
  const p3 = await luin3.evaluate(() => ({ auki: document.querySelector('#lukija h1').textContent, lista: JSON.parse(localStorage.getItem('luin-lista') || '[]').map(e => e.title) }));
  tulos('erikseen: pinoon kaksi tekstiä, kirja 2 päällimmäisenä ja auki', p3.lista.length === pino0 + 2 && p3.lista[0] === 'Πολιτεία Βʹ' && p3.lista[1] === 'Πολιτεία Γʹ' && /Πολιτεία Βʹ/.test(p3.auki),
    p3.auki + ' / ' + p3.lista.join(' | '));
  const kolmas = await luin3.evaluate(() => { const e = JSON.parse(localStorage.getItem('luin-lista')).find(x => x.title === 'Πολιτεία Γʹ'); return LuinTekstit.lue(e.id); });
  tulos('erikseen: kirja 3 on ladottu (yläindeksit ja etukenttä)', /^ladonta: lomitettu käännös$/m.test(kolmas || '') && /\^\d/.test(kolmas || '') && !/<sup>/.test(kolmas || '') && /^# Πολιτεία Γʹ$/m.test(kolmas || ''),
    String(kolmas).slice(0, 120));

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await ctx.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
