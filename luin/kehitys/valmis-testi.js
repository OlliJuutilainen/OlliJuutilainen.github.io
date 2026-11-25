// Valmis teksti (luin/tekstit.js valmisLue/valmisKirjoita, luin.html valmisAvain()). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/valmis-testi.js
// 1. Iso teksti tallentuu valmiiksi ensimmäisellä avauksella, ja uudelleenavaus käyttää sitä: HTML, lohkot ja doc samat
// kuin jäsennettynä. 2. Asetuksen vaihto (tavutus) valmiista avatussa tekstissä jäsentää HTML:n uudelleen. 3. Muuttunut
// teksti ja muu tavutus eivät käytä vanhaa valmista. 4. Pieni teksti ei tallennu. 5. Poisto poistaa valmiin.
// 6. Enintään kuusi valmista; pisimpään käyttämätön poistuu. 7. Ei sivuvirheitä.
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const { chromium } = require('playwright');
const JUURI = path.resolve(__dirname, '../..');
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

// Yli 100 000 merkin teksti: luvut, alaviite, kursiivi ja tavutettavia pitkiä sanoja.
const ISO = '# Koeteksti\n\n*Alaotsikko*\n\n' + Array.from({ length: 14 }, (_, l) => `## ${l + 1}. Luku\n\n` + Array.from({ length: 24 }, (_, k) =>
  `Kappale ${l + 1}.${k + 1}: yhteiskuntafilosofian ja oikeudenmukaisuusteorian *perustavanlaatuiset* kysymykset[^v${l}-${k}] ` +
  'koskevat valtiosääntöoikeudellista legitimiteettiä sekä kansalaisyhteiskunnan toimintaedellytyksiä. ' +
  'Epäjärjestelmällisyys ja ennakkoluulottomuus kuuluvat samaan sanastoon kuin järjestelmällisyys.\n\n' +
  `[^v${l}-${k}]: Viite ${l + 1}.${k + 1}.\n`).join('\n')).join('\n');
const PIENI = '# Pieni\n\n' + 'Lyhyt kappale, jossa on muutama sana.\n\n'.repeat(20);

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = `http://localhost:${palvelin.address().port}/`;
  const selain = await chromium.launch();
  const page = await (await selain.newContext({ viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true })).newPage();
  const virheet = []; page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#'); await page.waitForFunction(() => window.LuinTekstit);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-iso', added: 2, title: 'Koeteksti', src: 'paikallinen', ala: '' }, { id: 'p-pieni', added: 1, title: 'Pieni', src: 'paikallinen', ala: '' }]));
    localStorage.setItem('luin-asetukset', JSON.stringify({ av: 11, sivutus: 'sivut', tavutus: 'varovainen' }));
  });
  tulos('koeteksti on yli rajan', ISO.length > 100000, ISO.length + ' merkkiä');
  await page.evaluate(([a, b]) => Promise.all([window.LuinTekstit.kirjoita('p-iso', a), window.LuinTekstit.kirjoita('p-pieni', b)]), [ISO, PIENI]);
  const avaa = async (id) => {
    await page.goto(U + 'luin.html#'); await page.reload(); await page.waitForFunction(() => window.__luin);
    await page.evaluate(i => { location.hash = '#id=' + i; }, id);
    await page.waitForFunction(i => { const n = window.__luin.nyt(); return n && n.e.id === i && window.__luin.tila.asetteluja > 0; }, id);
    await page.waitForTimeout(1600); // tallennus alkaa sekunnin kuluttua avauksesta
    return page.evaluate(() => {
      const n = window.__luin.nyt(), art = document.getElementById('teksti'), dk = {};
      Object.keys(n.doc).forEach(k => { if (k !== 'html') dk[k] = n.doc[k]; });
      return { osuma: n.md !== undefined, html: art.innerHTML, doc: JSON.stringify(dk), lohkot: n.blocks.length, total: n.total, sivuja: window.__luin.tila.sivuja,
        shy: (art.textContent.match(/­/g) || []).length, vika: (n.txt[n.txt.length - 1] || '') };
    });
  };
  const valmis = id => page.evaluate(i => window.LuinTekstit.valmisLue(i).then(o => o && { avain: o.avain, html: o.html.length, doc: !!o.doc, docHtml: 'html' in o.doc }), id);

  // 1. Ensimmäinen avaus jäsentää ja tallentaa, toinen käyttää valmista.
  const a = await avaa('p-iso');
  tulos('ensimmäinen avaus jäsentää', !a.osuma);
  const v1 = await valmis('p-iso');
  tulos('valmis tallentui ilman doc.html:ää', !!v1 && v1.html > 100000 && v1.doc && !v1.docHtml, JSON.stringify(v1));
  const b = await avaa('p-iso');
  tulos('uudelleenavaus käyttää valmista', b.osuma);
  tulos('valmiista sama HTML, doc, lohkot ja sivut', h(a.html) === h(b.html) && a.doc === b.doc && a.lohkot === b.lohkot && a.total === b.total && a.sivuja === b.sivuja,
    `${h(a.html)}/${h(b.html)}, sivuja ${a.sivuja}/${b.sivuja}`);
  tulos('tavuviivat valmiissa', b.shy > 100 && b.shy === a.shy, b.shy);

  // 2. Tavutuksen vaihto valmiista avatussa tekstissä jäsentää HTML:n uudelleen.
  await page.evaluate(() => document.querySelector('#lukija .ratas').click());
  await page.waitForSelector('#asetukset:not([hidden])');
  await page.evaluate(() => document.querySelector('#asetukset .asetus[data-a="tavutus"] button[data-arvo="ei"]').click());
  await page.evaluate(() => document.querySelector('#asetukset .sulje').click());
  await page.waitForTimeout(500);
  const c = await page.evaluate(() => ({ shy: (document.getElementById('teksti').textContent.match(/­/g) || []).length, lohkot: window.__luin.nyt().blocks.length, html: typeof window.__luin.nyt().doc.html }));
  tulos('tavutus pois valmiissa tekstissä: viivat pois, lohkot samat', c.shy === 0 && c.lohkot === a.lohkot && c.html === 'string', JSON.stringify(c));

  // 3a. Muu tavutus ei käytä valmista (asetus jäi Ei:ksi).
  const d = await avaa('p-iso');
  tulos('eri tavutus: ei valmista', !d.osuma && d.shy === 0, `osuma ${d.osuma}, shy ${d.shy}`);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('luin-asetukset')); s.tavutus = 'varovainen'; localStorage.setItem('luin-asetukset', JSON.stringify(s)); });
  // 3b. Muuttunut teksti jäsennetään.
  await page.evaluate(md => window.LuinTekstit.kirjoita('p-iso', md), ISO + '\n\nUusi kappale lopussa.\n');
  const e = await avaa('p-iso');
  tulos('muuttunut teksti: ei vanhaa valmista, uusi kappale näkyy', !e.osuma && /Uusi kappale lopussa/.test(e.vika), `osuma ${e.osuma}, ${e.vika.slice(0, 30)}`);
  const f = await avaa('p-iso');
  tulos('muuttunut teksti tallentui uudeksi valmiiksi', f.osuma && h(f.html) === h(e.html), `osuma ${f.osuma}`);

  // 4. Pieni teksti ei tallennu.
  const g = await avaa('p-pieni');
  tulos('pieni teksti ei tallennu', !g.osuma && !(await valmis('p-pieni')));

  // 5. Poisto poistaa valmiin.
  await page.evaluate(() => window.LuinTekstit.poista('p-iso'));
  await page.waitForTimeout(300);
  tulos('poisto poistaa valmiin', !(await valmis('p-iso')));

  // 6. Enintään kuusi: seitsemäs poistaa pisimpään käyttämättömän.
  const jaljella = await page.evaluate(async () => {
    const T = window.LuinTekstit;
    for (let i = 0; i < 7; i++) { await T.valmisKirjoita('v' + i, { avain: 'x', doc: {}, html: 'h' + i }); await new Promise(r => setTimeout(r, 5)); }
    const r = [];
    for (let i = 0; i < 7; i++) r.push(!!(await T.valmisLue('v' + i)));
    return r;
  });
  tulos('enintään kuusi valmista, vanhin pois', JSON.stringify(jaljella) === JSON.stringify([false, true, true, true, true, true, true]), JSON.stringify(jaljella));

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? `\n${virheita} VIKAA` : '\nKaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})();
