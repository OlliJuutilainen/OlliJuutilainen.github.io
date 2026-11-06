// Lisää lukimeen vs. MarkDownload samalla verkkosivulla, molemmat Latomon läpi. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/vertaa-markdownload.js sivu.html https://sivun.osoite/ [välimuisti]
//     [--lisa notes.html=https://sivun.osoite/notes.html …]
// sivu.html on sivun tallennettu HTML (esim. curl), jota ei viedä repoon. --lisa tarjoaa muita saman sivuston sivuja,
// joita lisäosa hakee (SEP:n alaviitesivu); muut pyynnöt estetään. MarkDownload 3.2.0 (AMO:n viimeisin) haetaan
// välimuistikansioon (oletus: käyttöjärjestelmän tmp) ja ajetaan Latomon ohjeen suositusasetuksin; Lisää lukimeen
// ajaa luin/lisaosa/:n kirjastot ja leike.js:n. Tulostaa rakenteen, etukentän, viitteen ja leipätekstin erot sen jälkeen,
// kun tunnetut muotoerot (luettelomerkin välit, viitelinkit tekstin sisään) on yhtenäistetty. Tulokset: välimuistiin.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), cp = require('child_process');
const { chromium } = require('playwright');

const ARG = process.argv.slice(2), LISAT = {};
for (let i = ARG.indexOf('--lisa'); i >= 0; i = ARG.indexOf('--lisa')) { const [f, u] = ARG[i + 1].split('='); LISAT[u.split('#')[0]] = f; ARG.splice(i, 2); }
const [SIVU, OSOITE, VALI = path.join(os.tmpdir(), 'vertaa-markdownload')] = ARG;
if (!SIVU || !OSOITE) { console.error('Käyttö: vertaa-markdownload.js sivu.html https://osoite/ [välimuisti]'); process.exit(2); }
const JUURI = path.resolve(__dirname, '../..');
const LISAOSA = path.join(JUURI, 'luin/lisaosa');
const XPI = 'https://addons.mozilla.org/firefox/downloads/file/4006297/markdownload-3.2.0.xpi';
const MDL = path.join(VALI, 'markdownload-3.2.0');

// Latomon ohjeen (latomo-ohje.html#markdownload) suositusasetukset.
const MDL_ASET = { headingStyle: 'atx', hr: '___', bulletListMarker: '-', codeBlockStyle: 'fenced', fence: '```',
  emDelimiter: '*', strongDelimiter: '**', linkStyle: 'referenced', linkReferenceStyle: 'full', imageStyle: 'noImage',
  imageRefStyle: 'inlined', frontmatter: '---\ntekijä: {byline}\nsivusto: {siteName}\njulkaistu: {publishedTime}\nlähde: {baseURI}\nleikattu: {date:YYYY-MM-DD}\n---\n# {title}\n',
  backmatter: '', title: '{title}', includeTemplate: true, saveAs: false, downloadImages: false, imagePrefix: '{title}/',
  mdClipsFolder: 'nettiartikkelit', disallowedChars: '[]#^', downloadMode: 'downloadsApi', turndownEscape: true, contextMenus: true };

function normita(md) {
  let runko = md.split('\n---\n').slice(1).join('\n---\n');
  const viitteet = {};
  runko = runko.replace(/^\[(\d+)\]: (\S+).*\n?/gm, (k, n, u) => { viitteet[n] = u; return ''; });
  runko = runko.replace(/\[([^\]]*)\]\[(\d+)\]/g, (k, t, n) => '[' + t + '](' + (viitteet[n] || '?') + ')');
  runko = runko.replace(/^(\s*)-   /gm, '$1- ').replace(/^(\s*)(\d+)\.  /gm, '$1$2. ');
  return runko.split('\n').filter(r => r.trim());
}
const laske = md => ({ merkkejä: md.length, '##': (md.match(/^## /gm) || []).length, '###': (md.match(/^### /gm) || []).length,
  alaviitteet: (md.match(/^\[\^[^\]]+\]:/gm) || []).length,
  yläindeksit: (md.match(/\^[^\s^]+\^/g) || []).length, html: (md.match(/<(sup|sub|table|iframe)\b/g) || []).length });

(async () => {
  fs.mkdirSync(VALI, { recursive: true });
  if (!fs.existsSync(path.join(MDL, 'manifest.json'))) {
    const xpi = path.join(VALI, 'markdownload-3.2.0.xpi');
    cp.execFileSync('curl', ['-sSL', '-o', xpi, XPI]);
    fs.mkdirSync(MDL, { recursive: true });
    cp.execFileSync('unzip', ['-oq', xpi, '-d', MDL]);
  }
  const html = fs.readFileSync(SIVU, 'utf8');
  const lue = (kansio, f) => fs.readFileSync(path.join(kansio, f), 'utf8');
  const b = await chromium.launch();
  const ctx = await b.newContext();
  await ctx.route(/^https?:/, r => { const u = r.request().url().split('#')[0];
    if (u === OSOITE.split('#')[0]) return r.fulfill({ body: html, contentType: 'text/html; charset=utf-8' });
    if (LISAT[u]) return r.fulfill({ body: fs.readFileSync(LISAT[u], 'utf8'), contentType: 'text/html; charset=utf-8' });
    return r.abort(); });

  // MarkDownload: taustasivun koodi sivulla, browser-rajapinta korvattu (vain asetukset).
  const p = await ctx.newPage();
  await p.goto(OSOITE);
  await p.evaluate(aset => { window.browser = { storage: { sync: { get: async () => JSON.parse(JSON.stringify(aset)) } },
    runtime: { getPlatformInfo: async () => ({}), onMessage: { addListener() {} } }, contextMenus: { removeAll() {}, create() {}, onClicked: { addListener() {} } },
    commands: { onCommand: { addListener() {} } }, downloads: {} }; }, MDL_ASET);
  for (const f of ['background/apache-mime-types.js', 'background/moment.min.js', 'background/turndown.js', 'background/turndown-plugin-gfm.js',
    'background/Readability.js', 'shared/context-menus.js', 'shared/default-options.js', 'background/background.js', 'contentScript/contentScript.js'])
    await p.addScriptTag({ content: lue(MDL, f) });
  const mdl = await p.evaluate(async () => (await convertArticleToMarkdown(await getArticleFromDom(getSelectionAndDom().dom))).markdown);

  // Lisää lukimeen: samat tiedostot samassa järjestyksessä kuin ponnahdus.js:n executeScript.
  const p2 = await ctx.newPage();
  await p2.goto(OSOITE);
  const koodi = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js'].map(f => lue(LISAOSA, f)).join('\n;\n');
  const leike = await p2.evaluate(k => (0, eval)(k), koodi);
  await b.close();

  // Latomo
  const srv = http.createServer((q, r) => { const f = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
    if (!f.startsWith(JUURI) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript' }[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r); }).listen(0);
  const b2 = await chromium.launch();
  const tulokset = {};
  for (const [nimi, teksti] of [['markdownload', mdl], ['lisaosa', leike.koko]]) {
    const L = await b2.newPage();
    await L.goto(`http://127.0.0.1:${srv.address().port}/luin/latomo.html`);
    await L.fill('#md', teksti);
    await L.waitForTimeout(700);
    const t = await L.evaluate(() => ({ ...window.__latomo.tulos(), tila: document.querySelector('#mdl-tila').textContent.trim() }));
    tulokset[nimi] = t;
    fs.writeFileSync(path.join(VALI, nimi + '-raaka.md'), teksti);
    fs.writeFileSync(path.join(VALI, nimi + '-latomo.md'), t.md);
    console.log('=====', nimi, JSON.stringify(laske(t.md)));
    console.log('  etukenttä:', t.md.split('\n---\n')[0].replace(/^---\n/, '').replace(/\n/g, ' | '));
    console.log('  viite:', t.koottu);
    console.log('  siivous:', t.tila);
  }
  srv.close(); await b2.close();

  const A = normita(tulokset.markdownload.md), B = normita(tulokset.lisaosa.md);
  const sa = new Set(A), sb = new Set(B);
  const vain = (x, s) => x.filter(r => !s.has(r));
  const va = vain(A, sb), vb = vain(B, sa);
  console.log(`\nLeipäteksti: ${A.length} ja ${B.length} riviä; vain MarkDownloadissa ${va.length}, vain lisäosassa ${vb.length}.`);
  for (const r of va.slice(0, 15)) console.log('  - ' + r.slice(0, 200));
  for (const r of vb.slice(0, 15)) console.log('  + ' + r.slice(0, 200));
  console.log('Tiedostot: ' + VALI);
})().catch(e => { console.error(e); process.exit(1); });
