// Tekstikanta (luin/tekstit.js) ja pinon tusina (käyttäjän pyyntö 19.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/tallennus-testi.js [kuvakansio]
// 1. Vanhat localStoragen tekstit siirtyvät kantaan ja aukeavat. 2. Latomosta lukimeen 1,9 milj. merkin teksti, kun
// localStoragessa on 3,6 milj. merkkiä muuta (ennen: tallennustila täynnä). 3. Tusina: kolmastoista tuo pinoon, pisimpään
// koskematon laskeutuu kellarin kampihyllystöön (laskeutui, ei luettu), Poimi nostaa ja laskee seuraavan. 4. Ilman
// IndexedDB:tä kaikki toimii localStoragessa kuten ennen.
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const JUURI = path.resolve(__dirname, '../..'), KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }
const PV = 86400000, NYT = Date.now();
const teksti = (ots, n = 3) => '# ' + ots + '\n\n' + Array.from({ length: n }, (_, i) => 'Kappale ' + (i + 1) + ' tekstistä ' + ots + '. ' + 'Sanoja riittää. '.repeat(20)).join('\n\n') + '\n';

const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
}).listen(0);

(async () => {
  await new Promise(r => palvelin.once('listening', r));
  const U = 'http://127.0.0.1:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const virheet = [];
  async function sivu(ilmanKantaa) {
    const ctx = await b.newContext({ viewport: { width: 900, height: 900 } });
    if (ilmanKantaa) await ctx.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => virheet.push(e.message));
    p.on('dialog', d => { virheet.push('ilmoitus: ' + d.message()); d.dismiss(); });
    return p;
  }
  // localStorage ennen Luinin latausta: saman alkuperän tiedosto, joka ei ole Luin.
  const kylva = (p, o) => p.goto(U + 'luin/mika-on-markdown.md').then(() => p.evaluate(o => { localStorage.clear(); for (const k in o) localStorage.setItem(k, JSON.stringify(o[k])); }, o));
  const latomosta = async (p, md) => {
    await p.goto(U + 'luin/latomo.html');
    await p.evaluate(md => { const e = document.getElementById('md'); e.value = md; e.dispatchEvent(new Event('input', { bubbles: true })); }, md);
    await p.waitForTimeout(md.length > 1e6 ? 4000 : 800);
    await p.click('#avaa');
    await p.waitForURL(/luin\.html#id=/, { timeout: 60000 });
    await p.waitForSelector('#lukija:not([hidden]) h1', { timeout: 60000 });
  };
  const pino = p => p.evaluate(() => [...document.querySelectorAll('#nimikkeet li.nimike')].map(li => li.querySelector('.n-ots').textContent.trim() + ' {' + li.querySelector('.n-tieto').textContent + '}'));

  // 1. Siirto localStoragesta.
  let p = await sivu();
  await kylva(p, { 'luin-lista': [{ id: 'p-a', title: 'Teksti A', added: NYT - 3 * PV }, { id: 'p-b', title: 'Teksti B', added: NYT - 2 * PV }],
    'luin-teksti:p-a': teksti('Teksti A'), 'luin-teksti:p-b': teksti('Teksti B'), 'luin-merkit:p-a': { km: [], al: [] } });
  await p.goto(U + 'luin.html#');
  await p.waitForSelector('#nimikkeet li.nimike');
  let s = await p.evaluate(async () => ({ ls: Object.keys(localStorage).filter(k => k.startsWith('luin-teksti:')), a: await LuinTekstit.lue('p-a'), kanta: LuinTekstit.kanta(),
    merkit: localStorage.getItem('luin-merkit:p-a') != null }));
  tulos('vanhat tekstit siirtyivät kantaan, localStoragesta pois, merkinnät jäivät', s.kanta && !s.ls.length && /^# Teksti A/.test(s.a || '') && s.merkit, JSON.stringify({ ls: s.ls, kanta: s.kanta }));
  await p.click('#nimikkeet a.avaa[href="#id=p-b"]');
  await p.waitForSelector('#lukija:not([hidden]) h1');
  tulos('siirretty teksti aukeaa', /Teksti B/.test(await p.textContent('#lukija h1')));

  // 2. Iso teksti Latomosta, kun localStorage on melkein täynnä muuta.
  await kylva(p, { roska: 'x'.repeat(3.6e6) });
  const iso = '# Πολιτεία\n\n' + Array.from({ length: 4000 }, (_, i) => 'Σωκράτης· κατέβην χθὲς εἰς Πειραιᾶ μετὰ Γλαύκωνος τοῦ Ἀρίστωνος ' + i + '. ' + 'λόγος '.repeat(60)).join('\n\n') + '\n';
  const t0 = Date.now();
  await latomosta(p, iso);
  s = await p.evaluate(async () => { const l = JSON.parse(localStorage.getItem('luin-lista')); return { l: l.map(e => e.id + ' ' + e.title), md: ((await LuinTekstit.lue(l[0].id)) || '').length }; });
  tulos('1,9 milj. merkin teksti lukimeen 3,6 milj. merkin localStoragen rinnalla', s.l.length === 1 && /Πολιτεία/.test(s.l[0]) && s.md >= iso.length - 10 && !virheet.some(v => /ilmoitus/.test(v)),
    iso.length.toLocaleString('fi-FI') + ' merkkiä, ' + (Date.now() - t0) + ' ms, ' + s.l.join());

  // 3. Tusina. Pinossa 12: vanhin tullut (t1) on avattu eilen, joten laskeutuu toiseksi vanhin (t2).
  const lista = [];
  const kv = {};
  for (let i = 1; i <= 12; i++) { lista.unshift({ id: 'p-t' + i, title: 'Tusina ' + i, added: NYT - (20 - i) * PV, opened: i === 1 ? NYT - PV : undefined }); kv['luin-teksti:p-t' + i] = teksti('Tusina ' + i, 1); }
  lista.push({ id: 'p-k1', title: 'Kellarissa', added: NYT - 30 * PV, luettu: NYT - 25 * PV }); kv['luin-teksti:p-k1'] = teksti('Kellarissa', 1);
  kv['luin-lista'] = lista;
  await kylva(p, kv);
  await latomosta(p, teksti('Kolmastoista'));
  await p.goto(U + 'luin.html#');
  await p.waitForSelector('#nimikkeet li.nimike');
  let P = await pino(p);
  const viesti = await p.textContent('#viesti');
  tulos('kolmastoista tuli pinoon, pinossa tusina', P.length === 12 && /^Kolmastoista/.test(P[0]) && P.some(x => /^Tusina 1 /.test(x)) && !P.some(x => /^Tusina 2 /.test(x)), P.map(x => x.split(' {')[0]).join(' | '));
  tulos('laskeutuminen kerrotaan', /”Tusina 2” laskeutui kellarin kampihyllystöön: pinossa on tusina tekstiä\./.test(viesti), viesti);
  if (KUVAT) await p.screenshot({ path: path.join(KUVAT, 'tusina-pino.png'), fullPage: true });
  await p.goto(U + 'luin.html#arkisto');
  await p.waitForSelector('#nimikkeet li.nimike');
  let K = await pino(p);
  const pv = d => { const x = new Date(d); return x.getDate() + '.' + (x.getMonth() + 1) + '.' + x.getFullYear(); };
  tulos('kellarin kampihyllystössä: laskeutui, ei luettu', K.some(x => x.startsWith('Tusina 2 {') && x.includes('laskeutui ' + pv(Date.now())) && !/luettu/.test(x)) && K.some(x => /^Kellarissa .*luettu/.test(x)), K.join(' | '));
  if (KUVAT) await p.screenshot({ path: path.join(KUVAT, 'tusina-kellari.png'), fullPage: true });
  // Poimi takaisin: Tusina 2 palaa, seuraavaksi pisimpään koskematon (Tusina 3) laskeutuu.
  await p.click('#nimikkeet button.jako[data-id="p-t2"]');
  await p.click('#pop button[data-k="luin"]');
  await p.click('#pop button[data-k="ok"]');
  const v2 = await p.textContent('#viesti');
  const l2 = await p.evaluate(() => JSON.parse(localStorage.getItem('luin-lista')));
  const e2 = l2.find(e => e.id === 'p-t2'), e3 = l2.find(e => e.id === 'p-t3');
  tulos('Poimi: palaa pinoon ilman laskeutumismerkkiä, seuraava laskeutuu', !e2.luettu && !e2.laskeutui && e3.luettu && e3.laskeutui && l2.filter(e => !e.luettu && !e.kasikirja && !e.omappi).length === 12 &&
    /Teksti palasi pinoon\. ”Tusina 3” laskeutui/.test(v2), v2);
  // Luin. merkitsee laskeutuneen... luetuksi: pinosta luettu ei saa laskeutumismerkkiä.
  await p.goto(U + 'luin.html#');
  await p.waitForSelector('#nimikkeet li.nimike');
  await p.click('#nimikkeet button.jako[data-id="p-t4"]');
  await p.click('#pop button[data-k="luin"]');
  await p.click('#pop button[data-k="ok"]');
  const e4 = (await p.evaluate(() => JSON.parse(localStorage.getItem('luin-lista')))).find(e => e.id === 'p-t4');
  tulos('Luin. pinosta: luettu, ei laskeutunut', e4.luettu && !e4.laskeutui);
  // Poisto poistaa tekstin kannasta.
  await p.click('#nimikkeet button.jako[data-id="p-t5"]');
  await p.click('#pop button[data-k="poista"]');
  await p.click('#pop button[data-k="poista"]');
  await p.waitForTimeout(300);
  tulos('poisto poistaa tekstin kannasta', await p.evaluate(async () => (await LuinTekstit.lue('p-t5')) === null && !LuinTekstit.on('p-t5')));
  await p.context().close();

  // 4. Ilman IndexedDB:tä.
  p = await sivu(true);
  await kylva(p, { 'luin-lista': [{ id: 'p-a', title: 'Teksti A', added: NYT }], 'luin-teksti:p-a': teksti('Teksti A') });
  await p.goto(U + 'luin.html#id=p-a');
  await p.waitForSelector('#lukija:not([hidden]) h1');
  tulos('ilman kantaa: teksti aukeaa localStoragesta', /Teksti A/.test(await p.textContent('#lukija h1')));
  await latomosta(p, teksti('Ilman kantaa'));
  s = await p.evaluate(() => ({ ls: Object.keys(localStorage).filter(k => k.startsWith('luin-teksti:')).sort(), kanta: LuinTekstit.kanta() }));
  tulos('ilman kantaa: Latomon tuonti localStorageen', !s.kanta && s.ls.join() === 'luin-teksti:p-a,luin-teksti:p-ilman-kantaa', s.ls.join());
  await p.context().close();

  tulos('ei sivuvirheitä eikä ilmoituksia', !virheet.length, virheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
