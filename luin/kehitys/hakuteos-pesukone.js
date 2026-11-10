// Hakuteospesukone: Ensyklopedia Logoksen ja Wikipedian (fi, en) artikkelit Lisää lukimeen -lisäosan, Latomon ja md.js:n
// läpi (käyttäjän pyyntö 10.11.2026; SEP:lle on sep-pesukone.js). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/hakuteos-pesukone.js [--vali kansio] [--nayta] [osoitteet]
// Sivut haetaan kerran välimuistiin (oletus: tmp/hakuteos-pesukone; tekstejä ei viedä repoon), myös sivut, joita lisäosa
// pyytää (Logoksen viitatut artikkelit). Mittaa lähteen ja tuloksen otsikot, alaviitteet, kirjallisuusluettelon (p.bib,
// tunnistetut kohdat), lähdelinkit ja rikkinäiset, Wikipedian artikkeliluettelon pituuden ja jäänteet (muokkaa-linkit,
// raaka HTML, merkit). --nayta tulostaa tuloksen alun ja jäänteiden yhteydet. Tulos: välimuistiin <nimi>.md.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), cp = require('child_process');
const { chromium } = require('playwright');

const arg = process.argv.slice(2);
const otaArvo = n => { const i = arg.indexOf(n); if (i < 0) return null; const v = arg[i + 1]; arg.splice(i, 2); return v; };
const otaLippu = n => { const i = arg.indexOf(n); if (i < 0) return false; arg.splice(i, 1); return true; };
const VALI = otaArvo('--vali') || path.join(os.tmpdir(), 'hakuteos-pesukone');
const NAYTA = otaLippu('--nayta');
const OSOITTEET = arg.length ? arg : [
  'https://filosofia.fi/fi/ensyklopedia/descartes-rene', 'https://filosofia.fi/fi/ensyklopedia/habermas-jurgen',
  'https://filosofia.fi/fi/ensyklopedia/bioetiikka', 'https://filosofia.fi/fi/ensyklopedia/zizek-slavoj',
  'https://filosofia.fi/fi/ensyklopedia/hegelin-ensyklopedinen-jarjestelma',
  'https://fi.wikipedia.org/wiki/Litte%C3%A4_Maa', 'https://fi.wikipedia.org/wiki/Immanuel_Kant',
  'https://en.wikipedia.org/wiki/Age_of_Enlightenment', 'https://en.wikipedia.org/wiki/Flat_Earth'];
const JUURI = path.resolve(__dirname, '../..');
const LISAOSA = path.join(JUURI, 'luin/lisaosa');
fs.mkdirSync(VALI, { recursive: true });

function valimuisti(url) {
  const f = path.join(VALI, url.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 180) + '.html');
  if (!fs.existsSync(f) && !fs.existsSync(f + '.puuttuu')) {
    const koodi = cp.execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0', '-o', f, '-w', '%{http_code}', url]).toString();
    if (koodi !== '200') { fs.writeFileSync(f + '.puuttuu', koodi); fs.rmSync(f, { force: true }); }
  }
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
}

const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript' }[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
}).listen(0);

(async () => {
  await new Promise(r => palvelin.once('listening', r));
  const PAIK = 'http://127.0.0.1:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const ctx = await b.newContext();
  await ctx.route(/^https?:/, r => {
    const u = r.request().url().split('#')[0];
    if (u.startsWith(PAIK)) return r.continue();
    if (/^https:\/\/([a-z]+\.)?(filosofia\.fi|wikipedia\.org)\//.test(u) && /^(document|fetch|xhr)$/.test(r.request().resourceType())) {
      const h = valimuisti(u);
      return h ? r.fulfill({ body: h, contentType: 'text/html; charset=utf-8' }) : r.fulfill({ status: 404, body: '' });
    }
    return r.abort();
  });
  const koodi = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js']
    .map(f => fs.readFileSync(path.join(LISAOSA, f), 'utf8')).join('\n;\n');
  const yht = [];
  for (const url of OSOITTEET) {
    const nimi = decodeURIComponent(url.replace(/\/$/, '').split('/').pop()).replace(/[^\p{L}\p{N}_-]+/gu, '_') + (/wikipedia/.test(url) ? '-' + url.split('//')[1].split('.')[0] : '');
    if (!valimuisti(url)) { console.log('=====', nimi, 'ei saatu'); continue; }
    const s = await ctx.newPage();
    await s.goto(url);
    const lahde = await s.evaluate(() => {
      const w = document.querySelector('#mw-content-text .mw-parser-output');
      if (w) return { otsikot: w.querySelectorAll('h2, h3, h4').length, viitteet: w.querySelectorAll('sup.reference, sup.mw-ref').length };
      const r = document.querySelector('.node-ensyklopedia .field-name-body .field-item');
      return { otsikot: r ? [...r.children].filter(p => p.tagName === 'P' && p.querySelector('a[name] strong, a[id] strong')).length : 0,
        viitteet: r ? [...r.querySelectorAll('a[href]')].filter(a => /\/node\/|\/ensyklopedia\//.test(a.getAttribute('href'))).length : 0 };
    });
    const leike = await s.evaluate(k => (0, eval)(k), koodi);
    await s.close();
    const L = await ctx.newPage();
    await L.goto(PAIK + 'luin/latomo.html');
    await L.fill('#md', leike.koko);
    await L.waitForTimeout(900);
    const md = await L.evaluate(() => window.__latomo.tulos().md);
    fs.writeFileSync(path.join(VALI, nimi + '.md'), md);
    fs.writeFileSync(path.join(VALI, nimi + '.leike.md'), leike.koko);
    const t = await L.evaluate(md => {
      const r = window.LuinMD.parse(md);
      const d = new DOMParser().parseFromString('<div id="t">' + r.html + '</div>', 'text/html');
      const linkit = [...d.querySelectorAll('a.lahde')];
      return { h2: d.querySelectorAll('#t > h2').length, h3: d.querySelectorAll('#t > h3').length, h4: d.querySelectorAll('#t > h4').length,
        alaviitteet: d.querySelectorAll('.sidenote').length, tyhjat: [...d.querySelectorAll('.sidenote')].filter(x => /lähteen omalla sivulla/.test(x.textContent)).length,
        bib: d.querySelectorAll('p.bib').length, kohdat: d.querySelectorAll('p.bib[id^="kirj-"]').length,
        linkit: linkit.length, alaviitteissa: linkit.filter(x => x.closest('.sidenote')).length,
        rikki: linkit.filter(x => !d.getElementById(x.getAttribute('href').slice(1))).length,
        otsikot: [...d.querySelectorAll('#t > h2, #t > h3, #t > h4')].map(h => h.tagName[1] + ' ' + h.textContent.replace(/­/g, '')),
        varoitukset: r.warnings.map(w => w.msg) };
    }, md);
    await L.close();
    const JAANTEET = [/muokkaa wikitekstiä|\[muokkaa|\[edit\]/g, /<\/?(sup|span|table|div|a)\b/g, /XLUINVIITE/g, /redirects here|ohjataan tänne/g, /cite_note|CITEREF/g];
    const jaanteet = JAANTEET.map(re => (md.match(re) || []).length);
    const wl = (/^## Wikipedia[- ]a(rtikkelit|rticles)\n\n((?:- .*\n?)*)/m.exec(md) || [, , ''])[2].split('\n').filter(Boolean).length;
    const tulos = { nimi, lahde, t, jaanteet, wl, viitteita: leike.kokoViitteita, sanoja: leike.kokoSanoja };
    yht.push(tulos);
    console.log('=====', nimi, '(' + url + ')');
    console.log(`  otsikot: lähteessä ${lahde.otsikot}, tuloksessa ##/###/#### ${t.h2}/${t.h3}/${t.h4}; sanoja ${leike.kokoSanoja}`);
    console.log(`  alaviitteet: lähteen merkkejä/linkkejä ${lahde.viitteet}, leikkeessä ${leike.kokoViitteita}, Luinissa ${t.alaviitteet} (lähteen sivulla ${t.tyhjat})`);
    console.log(`  kirjallisuus: p.bib ${t.bib}, tunnistettu ${t.kohdat}; lähdelinkit ${t.linkit} (alaviitteissä ${t.alaviitteissa}), rikki ${t.rikki}`);
    if (wl) console.log(`  Wikipedia-artikkeleita luettelossa ${wl}`);
    console.log(`  jäänteet (muokkaa, raaka HTML, merkki, ohjausrivi, viitetunnus): ${jaanteet.join('/')}; md.js-varoituksia ${t.varoitukset.length}`);
    if (NAYTA) { console.log('  ' + t.otsikot.join('\n  ')); t.varoitukset.slice(0, 8).forEach(v => console.log('    VAR ' + v)); }
  }
  console.log('\nYHTEENVETO');
  const sum = f => yht.reduce((n, y) => n + f(y), 0);
  console.log(`  artikkeleita ${yht.length}; alaviitteitä ${sum(y => y.t.alaviitteet)}, p.bib ${sum(y => y.t.bib)}, lähdelinkkejä ${sum(y => y.t.linkit)}, rikki ${sum(y => y.t.rikki)}, jäänteitä ${sum(y => y.jaanteet.reduce((a, c) => a + c, 0))}`);
  console.log('  välimuisti ja tulokset: ' + VALI);
  await b.close(); palvelin.close();
})().catch(e => { console.error(e); process.exit(1); });
