// Palautteen selaintesti (käyttäjän pyyntö 10.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/palaute-testi.js [kuvakansio]
// luin/palaute.html lähettää workerin oikealle koodille (muistissa oleva KV, PALAUTE_LAATIKKO testin lause). Tarkistaa
// lomakkeen ehdot (vain viesti pakollinen), botin piilokentän, ilman salaisuutta 503:n, viestin
// kantautumisen Luinin lukulistaan Postihuilun kautta sekä Latomon pikku plussan.
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require('playwright');
const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const API = 'https://tusinasaa-worker.ollijuutilainen.workers.dev/api/';
const LAUSE = 'kehittajan-palautelaatikko-2026';
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

(async () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'luin-worker-')), 'index.mjs');
  fs.writeFileSync(f, fs.readFileSync(path.join(JUURI, 'worker/src/index.js')));
  const worker = (await import(f)).default;
  const m = new Map();
  const KV = { async put(k, v, o) { m.set(k, { v: String(v), meta: o && o.metadata }); }, async get(k) { return m.has(k) ? m.get(k).v : null; },
    async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(k => ({ name: k, metadata: m.get(k).meta })) }; } };
  const palvelin = http.createServer((q, r) => {
    const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
    if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(r);
  });
  await new Promise(v => palvelin.listen(0, v));
  const OSOITE = 'http://localhost:' + palvelin.address().port + '/';
  const env = { LOCATIONS: KV, ALLOWED_ORIGINS: OSOITE.replace(/\/$/, '') };
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 412, height: 900 } });
  await ctx.route(API + '**', async route => {
    const q = route.request();
    const res = await worker.fetch(new Request(q.url(), { method: q.method(), headers: await q.allHeaders(),
      body: ['GET', 'HEAD', 'OPTIONS'].includes(q.method()) ? undefined : q.postData() }), env, {});
    const h = {}; res.headers.forEach((v, k) => { h[k] = v; });
    await route.fulfill({ status: res.status, headers: h, body: Buffer.from(await res.arrayBuffer()) });
  });
  await ctx.route(/^https?:\/\/(?!localhost)(?!tusinasaa-worker)/, r => r.abort());
  const s = await ctx.newPage();
  const virheet = [];
  s.on('pageerror', e => virheet.push(e.message));

  // 1. Lomakkeen ehdot ja vastaanotto ilman salaisuutta.
  await s.goto(OSOITE + 'luin/palaute.html?mista=latomo');
  const tila = () => s.textContent('#tila');
  await s.click('#laheta');
  const t1 = await tila();
  await s.fill('#viesti', 'Latomo ei tunne Hegel-sivustoa.');
  await s.click('#laheta');
  await s.waitForFunction(() => !/Lähetetään/.test(document.querySelector('#tila').textContent));
  const t2 = await tila();
  await s.fill('#sposti', 'huono-osoite');
  await s.click('#laheta');
  const t3 = await tila();
  tulos('lomake: vain viesti pakollinen, sähköpostin muoto', t1 === 'Kirjoita viesti.' && /Palautteen vastaanotto/.test(t2) &&
    t3 === 'Sähköpostiosoite ei näytä oikealta.' && m.size === 0, [t1, t2, t3].join(' / '));
  await s.fill('#sposti', '');
  await s.fill('#nimi', 'Kaveri');
  await s.click('#laheta');
  await s.waitForFunction(() => !/Lähetetään/.test(document.querySelector('#tila').textContent));
  const t4 = await tila();
  tulos('ilman workerin salaisuutta: ei vielä käytössä', t4 === 'Palautteen vastaanotto ei ole vielä käytössä.' && m.size === 0, t4);

  // 2. Botin piilokenttä: kuitataan, mutta ei tallenneta.
  env.PALAUTE_LAATIKKO = LAUSE;
  await s.evaluate(() => { document.querySelector('#ansa').value = 'http://roskaa.example'; });
  await s.click('#laheta');
  await s.waitForFunction(() => !/Lähetetään/.test(document.querySelector('#tila').textContent));
  tulos('piilokenttä täytetty: ei tallenneta', m.size === 0, await tila());
  await s.evaluate(() => { document.querySelector('#ansa').value = ''; });
  await s.fill('#viesti', 'Latomo ei tunne Hegel-sivustoa.');

  // 3. Lähetys perille.
  await s.fill('#sposti', 'kaveri@esimerkki.test');
  await s.click('#laheta');
  await s.waitForFunction(() => !/Lähetetään/.test(document.querySelector('#tila').textContent));
  const t5 = await tila(), avain = [...m.keys()][0] || '', md = avain ? m.get(avain).v : '';
  tulos('lähetys: kiitos, viesti tyhjäksi, teksti kehittäjän laatikossa', t5 === 'Kiitos! Viesti on perillä.' && await s.inputValue('#viesti') === '' &&
    new RegExp('^luin:' + LAUSE + ':palaute-[0-9a-z]+$').test(avain) &&
    /^# Palaute: Kaveri\n\nNimi: Kaveri {2}\nSähköposti: kaveri@esimerkki\.test {2}\nLähetetty \d{1,2}\.\d{1,2}\.\d{4} klo \d\d\.\d\d {2}\nSivulta: latomo\n\n## Viesti\n\nLatomo ei tunne Hegel-sivustoa\.\n$/.test(md),
    t5 + ' | ' + md.replace(/\n/g, ' ⏎ '));
  if (KUVAT) await s.screenshot({ path: path.join(KUVAT, 'palaute.png'), fullPage: true });

  // 4. Kehittäjän Luin: palaute kantautuu lukulistaan Postihuilun kautta.
  await s.goto(OSOITE + 'luin.html#l=' + LAUSE);
  await s.waitForFunction(() => /kantautui|käytössä/.test(document.querySelector('#viesti').textContent));
  const L = await s.evaluate(() => ({ viesti: document.querySelector('#viesti').textContent,
    lista: JSON.parse(localStorage.getItem('luin-lista') || '[]').map(e => e.title), palaute: [...document.querySelectorAll('#lista a')].filter(a => /palaute\.html/.test(a.getAttribute('href'))).length,
    asetukset: (document.querySelector('.aset-palaute a') || {}).getAttribute?.('href') }));
  tulos('Luin: palaute kantautui hyllylle; hyllyllä ei palautelinkkiä, asetuksissa on', L.viesti === 'Postihuilun kautta kantautui teksti.' && L.lista.join() === 'Palaute: Kaveri' &&
    L.palaute === 0 && L.asetukset === 'luin/palaute.html?mista=asetukset', JSON.stringify(L));

  // 5. Latomon pikku plussa.
  await s.goto(OSOITE + 'luin/latomo.html');
  const ennen = await s.evaluate(() => ({ piilo: document.querySelector('#lisaosa-lisa').hidden, nappi: document.querySelector('#plussa').textContent }));
  await s.click('#plussa');
  const jalkeen = await s.evaluate(() => ({ piilo: document.querySelector('#lisaosa-lisa').hidden, nappi: document.querySelector('#plussa').textContent,
    linkit: [...document.querySelectorAll('#lisaosa-lisa a')].map(a => a.textContent.replace(/\s+/g, ' ') + '>' + a.getAttribute('href')),
    uusi: document.querySelector('#lisaosa-lisa a[href="sivustot.html"]').target === '_blank',
    vari: getComputedStyle(document.querySelector('#plussa')).color === getComputedStyle(document.querySelector('.lisaosa .nimi')).color }));
  tulos('Latomo: plussa avaa palautelinkin ja linkin tuettuihin sivustoihin', ennen.piilo && ennen.nappi === '+' && !jalkeen.piilo && jalkeen.nappi === '–' && jalkeen.vari &&
    jalkeen.linkit.join(' | ') === 'kuulemme mielellämme>palaute.html?mista=latomo | tähän mennessä tuettujen sivustojen lista>sivustot.html' &&
    jalkeen.uusi,
    JSON.stringify(jalkeen));
  if (KUVAT) { await s.setViewportSize({ width: 412, height: 900 }); await s.locator('.lisaosa').screenshot({ path: path.join(KUVAT, 'latomo-plussa.png') });
    await s.screenshot({ path: path.join(KUVAT, 'latomo-plussa-sivu.png') }); }
  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' / '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
