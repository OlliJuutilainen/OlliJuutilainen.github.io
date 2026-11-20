// Vakiosivut (maalauskoneen jatko, käyttäjän pyyntö 20.11.2026; opas 3.2): etukentän vakiosivut: AA tekee merkeistä {4:429}
// harmaita sivunumeroita, ja kopion paikannin ottaa valinnan alkua edeltävän merkin (AA 4:429, väli AA 4:429–430). Ilman
// etukenttää aaltosulkeet ovat tekstiä. Ilman {…}-merkkejä linkittömät sivunumeron näköiset yläindeksit (Korpora ^4:393^) ovat
// vakiosivuja, kun etukentässä on vakiosivut.
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node luin/kehitys/vakiosivu-testi.js [kuvakansio]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2] || '';
const TEKSTIT = {
  '/koe/aa.md': '---\nvakiosivut: AA\ntekijä: Immanuel Kant\njulkaistu: 1785\n---\n# Grundlegung zur Metaphysik der Sitten\n\n## Erster Abschnitt\n\n' +
    '{4:393} Es ist überall nichts in der Welt, ja überhaupt auch außer derselben zu denken möglich, was ohne Einschränkung für gut könnte gehalten werden, als allein ein guter Wille.\n\n' +
    'Verstand, Witz, Urteilskraft und wie die Talente des Geistes sonst heißen mögen, oder Mut, Entschlossenheit, Beharrlichkeit im Vorsatze sind ohne Zweifel in mancher Absicht gut und wünschenswert; {4:394} aber sie können auch äußerst böse und schädlich werden.\n\n' +
    'Der gute Wille ist nicht durch das, was er bewirkt oder ausrichtet, gut, sondern allein durch das Wollen.\n',
  '/koe/ilman.md': '---\ntekijä: Immanuel Kant\njulkaistu: 1785\n---\n# Ilman\n\n## Eka\n\n{4:393} Es ist überall nichts in der Welt zu denken.\n',
  '/koe/kohdat.md': '---\nvakiosivut: AA\ntekijä: Immanuel Kant\njulkaistu: 1785\n---\n# Kohdat\n\n^4:393^ Es ist überall nichts in der Welt zu denken möglich.\n\n^4:394^ Aber sie können auch äußerst böse werden.\n'
};
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.md': 'text/markdown; charset=utf-8' };
const palvelin = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split(/[?#]/)[0]);
  if (TEKSTIT[u]) { r.writeHead(200, { 'Content-Type': TYYPIT['.md'] }); return r.end(TEKSTIT[u]); }
  const p = path.join(JUURI, u);
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
}).listen(0);
let virheita = 0;
const tulos = (nimi, ok, tieto) => { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto !== undefined ? ' – ' + tieto : '')); };

(async () => {
  await new Promise(r => palvelin.once('listening', r));
  const P = 'http://127.0.0.1:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const sivu = await b.newPage({ viewport: { width: 1000, height: 800 } });
  const virheet = [];
  sivu.on('pageerror', e => virheet.push(e.message));
  await sivu.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const avaa = async u => { await sivu.goto(P + 'luin.html#u=' + u); await sivu.waitForFunction(() => window.__luin && window.__luin.nyt() && window.__luin.nyt().blocks.length > 2, null, { timeout: 15000 }); await sivu.waitForTimeout(300); };
  // Valinta: lohkon b merkeistä s–e (lohkoteksti), kuten valintaPaloiksi.
  const paikka = (b, s, e, b2, e2) => sivu.evaluate(([b, s, e, b2, e2]) => {
    const L = window.__luin, n = L.nyt();
    const segs = [{ b, s, e, x: n.txt[b].slice(s, e) }];
    if (b2 != null) segs.push({ b: b2, s: 0, e: e2, x: n.txt[b2].slice(0, e2) });
    return L.sijainti(segs);
  }, [b, s, e, b2, e2]);
  const lohko = alku => sivu.evaluate(a => window.__luin.nyt().txt.findIndex(t => t.startsWith(a)), alku);

  await avaa('koe/aa.md');
  const merkit = await sivu.evaluate(() => [...document.querySelectorAll('#teksti .vsivu')].map(x => {
    const c = getComputedStyle(x), p = getComputedStyle(x.parentElement);
    return { t: x.textContent, koko: parseFloat(c.fontSize) / parseFloat(p.fontSize), vari: c.color, harmaa: getComputedStyle(document.documentElement).getPropertyValue('--harmaa').trim() };
  }));
  tulos('merkit näkyvät sivunumeroina', merkit.map(m => m.t).join() === '4:393,4:394', JSON.stringify(merkit.map(m => m.t)));
  tulos('merkit pieninä', merkit.every(m => Math.abs(m.koko - .62) < .02), merkit.map(m => m.koko.toFixed(2)).join());
  const harmaa = await sivu.evaluate(() => { const d = document.createElement('span'); d.style.color = 'var(--harmaa)'; document.getElementById('teksti').appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; });
  tulos('merkit harmaina', merkit.every(m => m.vari === harmaa), merkit[0].vari + ' / ' + harmaa);
  tulos('aaltosulkeet eivät jää tekstiin', !(await sivu.evaluate(() => /[{}]/.test(document.getElementById('teksti').textContent))));
  const b1 = await lohko('4:393'), b2 = await lohko('Verstand'), b3 = await lohko('Der gute');
  tulos('ensimmäinen kappale: AA 4:393', (await paikka(b1, 10, 30)) === 'AA 4:393', await paikka(b1, 10, 30));
  const t2 = await sivu.evaluate(b => window.__luin.nyt().txt[b], b2);
  const i394 = t2.indexOf('4:394');
  tulos('ennen merkkiä samassa kappaleessa: AA 4:393', (await paikka(b2, 0, 20)) === 'AA 4:393', await paikka(b2, 0, 20));
  tulos('merkin jälkeen: AA 4:394', (await paikka(b2, i394 + 8, i394 + 20)) === 'AA 4:394', await paikka(b2, i394 + 8, i394 + 20));
  tulos('sivun yli: AA 4:393–394', (await paikka(b2, 0, i394 + 20)) === 'AA 4:393–394', await paikka(b2, 0, i394 + 20));
  tulos('seuraava kappale perii sivun: AA 4:394', (await paikka(b3, 0, 10)) === 'AA 4:394', await paikka(b3, 0, 10));
  if (KUVAT) await sivu.screenshot({ path: path.join(KUVAT, 'vakiosivu.png') });

  await avaa('koe/ilman.md');
  const ilman = await sivu.evaluate(() => ({ vs: document.querySelectorAll('#teksti .vsivu').length, t: document.getElementById('teksti').textContent.includes('{4:393}') }));
  tulos('ilman etukenttää aaltosulkeet ovat tekstiä', ilman.vs === 0 && ilman.t, JSON.stringify(ilman));
  const bi = await lohko('{4:393}');
  tulos('ilman etukenttää paikannin on otsikko', (await paikka(bi, 10, 20)) === '”Eka”', await paikka(bi, 10, 20));

  await avaa('koe/kohdat.md');
  const bk = await lohko('4:394');
  tulos('yläindeksit vakiosivuina: AA 4:394', (await paikka(bk, 8, 20)) === 'AA 4:394', await paikka(bk, 8, 20));

  // Latomo säilyttää avaimen ja merkit: lisäosan leike (yläindeksit HTML:nä) ja aaltosulkeiset merkit.
  await sivu.goto(P + 'luin/latomo.html');
  await sivu.waitForFunction(() => window.__latomo, null, { timeout: 10000 });
  const latomo = async md => { await sivu.evaluate(m => { const e = document.getElementById('md'); e.value = m; e.dispatchEvent(new Event('input', { bubbles: true })); }, md); await sivu.waitForTimeout(900); return sivu.evaluate(() => window.__latomo.tulos().md); };
  const l1 = await latomo('---\nvakiosivut: AA\nlähde: https://korpora.org/kant/aa04/393.html\nleikattu: 2026-11-20\n---\n# Grundlegung\n\n<sup>4:393</sup> Es ist überall nichts in der Welt zu denken.\n');
  tulos('Latomo: leikkeen vakiosivut ja yläindeksi säilyvät', /^vakiosivut: AA$/m.test(l1) && l1.includes('^4:393^'), l1.split('\n').filter(r => /vakio|4:393/.test(r)).join(' / '));
  const l2 = await latomo('---\nvakiosivut: Vv\n---\n# Vigrahavyāvartanī\n\n{216} sarveṣāṃ bhāvānāṃ sarvatra na vidyate svabhāvaś cet.\n');
  tulos('Latomo: aaltosulkeinen merkki säilyy', /^vakiosivut: Vv$/m.test(l2) && l2.includes('{216} sarveṣāṃ'), l2.split('\n').filter(r => /vakio|216/.test(r)).join(' / '));

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa.' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
