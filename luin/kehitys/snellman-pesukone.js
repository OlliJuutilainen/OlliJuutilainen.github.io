// Snellmanin koottujen teosten koko korpus (2 949 asiakirjaa 21.11.2026) lisäosan, Latomon ja md.js:n läpi: tarkistuspesu
// sertifiointia varten (käyttäjän pyyntö 21.11.2026: Snellman Luinin sertifioimaksi). hakuteos-pesukone.js mittaa otoksen;
// tämä vertaa jokaisen asiakirjan lopputekstiä sanoittain lähteeseen. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/snellman-pesukone.js [--vali kansio] [--rinn 4] [--raja N] [--tulos tiedosto.jsonl]
//     [--ulos kansio] [--vertaa kansio] [--lista tiedosto | osoitteet]
// --ulos kirjoittaa asiakirjojen .md:t muualle kuin välimuistiin, ja --vertaa vertaa ne aiemman ajon samannimisiin (muuttuneet
// rivit asiakirjoittain ja yhteensä): sama välimuisti, kaksi ajoa, ennen ja jälkeen.
// Ilman osoitteita luettelo haetaan sivuston asiakirjalistasta (295 sivua). Sivut haetaan kerran välimuistiin (oletus
// tmp/snellman-pesukone, hakuteos-pesukoneen nimin; tekstejä ei viedä repoon), kolme kerrallaan: palvelin vastaa 1–4 s:ssa.
// Mittaa asiakirjoittain:
// - sovite: leikkeen etukentässä ladonta: asiakirja (muuten yleinen leike)
// - teksti: suomennoksen ja ruotsinkielisen kentän sanat (alaviitteet pois; sanaraja lohkojen ja rivinvaihtojen välissä, ei
//   tekstin sisäisten elementtien: Stjernva<span>ll</span> on yksi sana) diffillä Luinin leipätekstiin (otsikkolohko,
//   sivuhuomiot, Sisälmys, Lähde ja lisätyt otsikot pois): kadonneet ja ylimääräiset sanat
// - alaviitteet: lähteen viitteiden sanat sivuhuomioiden sanoihin; merkkien määrä
// - metatiedot: otsikko (versaali, tavutusvihje), julkaistu, tekijä (Snellmanille tullut kirje), laji, teos ja numero
// - otsikot, lainaukset ja md.js-varoitukset; jäänteet (raaka HTML, merkki, kenoviiva rivin keskellä)
// Tulos: JSON-rivit tiedostoon ja yhteenveto. Poikkeamat näkyvät yhteenvedossa asiakirjoittain.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), cp = require('child_process');
const { chromium } = require('playwright');

const arg = process.argv.slice(2);
const otaArvo = n => { const i = arg.indexOf(n); if (i < 0) return null; const v = arg[i + 1]; arg.splice(i, 2); return v; };
const VALI = otaArvo('--vali') || path.join(os.tmpdir(), 'snellman-pesukone');
const RINN = +(otaArvo('--rinn') || 4);
const RAJA = +(otaArvo('--raja') || 0);
const TULOS = otaArvo('--tulos') || path.join(VALI, 'tulos.jsonl');
const ULOS = otaArvo('--ulos') || VALI;
const VERTAA = otaArvo('--vertaa');
// Muuttuneet rivit (diff): 0, kun sama; null, kun vertailukansiossa ei ole tiedostoa.
function muuttuneet(nimi, uusi) {
  const f = VERTAA && path.join(VERTAA, nimi);
  if (!f || !fs.existsSync(f)) return null;
  if (fs.readFileSync(f, 'utf8') === uusi) return 0;
  const g = path.join(os.tmpdir(), 'pesukone-vertaa-' + process.pid + '-' + Math.random().toString(36).slice(2));
  fs.writeFileSync(g, uusi);
  let out = '';
  try { out = cp.execFileSync('diff', [f, g], { maxBuffer: 1 << 28 }).toString(); } catch (e) { out = String(e.stdout || ''); }
  fs.rmSync(g, { force: true });
  return out.split('\n').filter(r => /^[<>] /.test(r)).length;
}
const LISTA = otaArvo('--lista');
const JUURI = path.resolve(__dirname, '../..');
const LISAOSA = path.join(JUURI, 'luin/lisaosa');
const SIVU = 'https://snellman.kootutteokset.fi';
fs.mkdirSync(VALI, { recursive: true });
fs.mkdirSync(ULOS, { recursive: true });

const tiedosto = u => path.join(VALI, u.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 180) + '.html');
function hae(u) {
  const f = tiedosto(u);
  if (fs.existsSync(f) && fs.statSync(f).size > 1000) return Promise.resolve(true);
  return new Promise(r => cp.execFile('curl', ['-sSL', '-A', 'Mozilla/5.0', '-o', f, '-w', '%{http_code}', u], (e, so) => {
    if (so !== '200') fs.rmSync(f, { force: true });
    r(so === '200');
  }));
}
async function kaikki(lista, n, f) {
  let i = 0;
  await Promise.all([...Array(n)].map(async () => { while (i < lista.length) { const k = i++; await f(lista[k], k); } }));
}

// Sanat vertailuun: pienellä, kirjaimet ja numerot, tavutusvihjeet pois.
const SANAT = 't => (t.normalize("NFC").replace(/\\u00ad/g, "").toLowerCase().match(/[\\p{L}\\p{N}]+/gu) || [])';
const sanat = eval(SANAT);

// Diff sanoittain (GNU diff riveittäin): kadonneet ja ylimääräiset sanajaksot.
function sanaDiff(a, b, nimi) {
  const fa = path.join(VALI, '_a_' + nimi), fb = path.join(VALI, '_b_' + nimi);
  fs.writeFileSync(fa, a.join('\n') + '\n'); fs.writeFileSync(fb, b.join('\n') + '\n');
  let out = '';
  try { out = cp.execFileSync('diff', ['--minimal', fa, fb], { maxBuffer: 1 << 28 }).toString(); } catch (e) { out = e.stdout.toString(); }
  fs.rmSync(fa); fs.rmSync(fb);
  // Kustakin muutoksesta lähteen viisi edeltävää sanaa paikaksi (…).
  const pois = [], lisa = [];
  let ryhma = null;
  out.split('\n').forEach(r => {
    const m = /^(\d+)/.exec(r);
    if (m) { ryhma = { pois: [], lisa: [], ennen: a.slice(Math.max(0, +m[1] - 6), Math.max(0, +m[1] - 1)).join(' ') }; pois.push(ryhma); lisa.push(ryhma); }
    else if (r.startsWith('< ')) ryhma.pois.push(r.slice(2));
    else if (r.startsWith('> ')) ryhma.lisa.push(r.slice(2));
  });
  const ryhmat = k => [...new Set(pois)].filter(x => x[k].length).map(x => '(' + x.ennen + ') ' + x[k].join(' '));
  return { pois: ryhmat('pois'), lisa: ryhmat('lisa') };
}

const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript' }[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
}).listen(0);

(async () => {
  let osoitteet = (LISTA ? fs.readFileSync(LISTA, 'utf8').split('\n').filter(Boolean) : arg).map(u => /^https?:/.test(u) ? u : SIVU + u);
  if (!osoitteet.length) {
    const sivut = [...Array(295).keys()].map(k => SIVU + '/fi/dokumentit?page=' + k);
    await kaikki(sivut, 3, hae);
    const s = new Set();
    sivut.forEach(u => { const f = tiedosto(u); if (fs.existsSync(f)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/href="(\/fi\/dokumentit\/[^"?#]+)"/g)) s.add(SIVU + m[1]); });
    osoitteet = [...s].sort();
  }
  if (RAJA) osoitteet = osoitteet.slice(0, RAJA);
  console.log('asiakirjoja', osoitteet.length);
  await kaikki(osoitteet, 3, hae);

  if (!palvelin.listening) await new Promise(r => palvelin.once('listening', r));
  const PAIK = 'http://127.0.0.1:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const ctx = await b.newContext();
  await ctx.route(/^https?:/, r => {
    const u = r.request().url().split('#')[0];
    if (u.startsWith(PAIK)) return r.continue();
    if (u.startsWith(SIVU + '/') && r.request().resourceType() === 'document') {
      const f = tiedosto(u);
      return fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), contentType: 'text/html; charset=utf-8' }) : r.fulfill({ status: 404, body: '' });
    }
    return r.abort();
  });
  const koodi = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js']
    .map(f => fs.readFileSync(path.join(LISAOSA, f), 'utf8')).join('\n;\n');
  const ulos = fs.createWriteStream(TULOS);
  let valmiit = 0;
  const alku = Date.now();
  await kaikki(osoitteet, RINN, async (url, k) => {
    const nimi = decodeURIComponent(url.split('/').pop());
    const s = await ctx.newPage();
    let t = { url, nimi };
    try {
      await s.goto(url);
      // Lähde: kenttien sanat ilman alaviitteitä, alaviitteiden sanat, metatiedot.
      t.lahde = await s.evaluate(SANAT => {
        const sanat = eval(SANAT);
        const teksti = el => { const k = el.cloneNode(true); k.querySelectorAll('br').forEach(x => x.replaceWith(' '));
          k.querySelectorAll('*').forEach(x => { if (/^(P|DIV|LI|UL|OL|DL|DT|DD|TD|TH|TR|TABLE|THEAD|TBODY|H[1-6]|BLOCKQUOTE|FIGURE|FIGCAPTION|SECTION|HEADER|PRE|HR)$/.test(x.tagName)) x.after(' '); }); return k.textContent; };
        const kentta = sel => {
          const f = document.querySelector(sel + ' .field-item');
          if (!f) return { sanat: [], viitteet: [] };
          const k = f.cloneNode(true);
          const viitteet = [...k.querySelectorAll('ul.footnotes li')].map(li => { li.querySelectorAll('a.footnote-label').forEach(x => x.remove()); return sanat(teksti(li)).join(' '); });
          k.querySelectorAll('ul.footnotes, a.see-footnote').forEach(x => x.remove());
          const sv = sanat(teksti(k));
          return { sanat: /^tulossa$/.test(sv.join(' ')) ? [] : sv, viitteet, merkit: f.querySelectorAll('a.see-footnote').length };
        };
        const kv = s => [...document.querySelectorAll(s + ' .field-item')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
        return { fi: kentta('.field-name-field-suomi'), sv: kentta('.field-name-field-ruotsi'), otsikko: (document.querySelector('.page-title-header') || {}).textContent || '',
          tyyppi: kv('.field-name-field-dokumentin-tyyppi'), pvm: kv('.field-name-tekstilahde-daterange').join(' '), pvmKommentti: kv('.field-name-field-pvm-kommenti').join(' '),
          kirjeenvaihto: kv('.field-name-field-kirjeenvaihto'), pdf: !!document.querySelector('.field-name-field-alkukielinen-pdf a[href$=".pdf"]') };
      }, SANAT);
      const leike = await s.evaluate(k => (0, eval)(k), koodi);
      await s.close();
      t.sovite = /\nladonta: asiakirja\n/.test(leike.koko);
      const L = await ctx.newPage();
      await L.goto(PAIK + 'luin/latomo.html');
      await L.evaluate(md => { const e = document.getElementById('md'); e.value = md; e.dispatchEvent(new Event('input', { bubbles: true })); }, leike.koko);
      const md = await L.evaluate(() => window.__latomo.tulos().md);
      fs.writeFileSync(path.join(ULOS, nimi.slice(0, 150) + '.md'), md);
      t.muutos = muuttuneet(nimi.slice(0, 150) + '.md', md);
      t.luin = await L.evaluate(([md, SANAT]) => {
        const sanat = eval(SANAT);
        const r = window.LuinMD.parse(md);
        const d = new DOMParser().parseFromString('<div id="t">' + r.html + '</div>', 'text/html');
        const juuri = d.getElementById('t');
        const teksti = el => { const k = el.cloneNode(true); k.querySelectorAll('br').forEach(x => x.replaceWith(' '));
          k.querySelectorAll('*').forEach(x => { if (/^(P|DIV|LI|UL|OL|DL|DT|DD|TD|TH|TR|TABLE|THEAD|TBODY|H[1-6]|BLOCKQUOTE|FIGURE|FIGCAPTION|SECTION|HEADER|PRE|HR)$/.test(x.tagName)) x.after(' '); }); return k.textContent; };
        const viitteet = [...juuri.querySelectorAll('.sidenote')].map(x => { const k = x.cloneNode(true); k.querySelectorAll('.fnnum').forEach(y => y.remove()); return sanat(teksti(k)).join(' '); });
        const ots = [...juuri.querySelectorAll('h2, h3, h4, h5')].map(h => h.tagName[1] + ' ' + h.textContent.replace(/\u00ad/g, ''));
        const lainaukset = [...juuri.querySelectorAll('figure, blockquote:not(figure blockquote)')].map(x => teksti(x).replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim().slice(0, 120));
        // Leipäteksti: otsikkolohko, sivuhuomiot, Sisälmys ja Lähde-osio (ja sen perässä olevat) pois.
        juuri.querySelectorAll('header.tt, .sidenote, label.fnref, nav, .toc, .toc-paikka, .rahoitus').forEach(x => x.remove());
        const lahdeOts = [...juuri.querySelectorAll('h2, h3, h4, h5')].reverse().find(h => /^Lähde$/.test(h.textContent.replace(/\u00ad/g, '').trim()));
        if (lahdeOts) { let n = lahdeOts; while (n) { const s = n.nextSibling; n.remove(); n = s; } }
        // Sovitteen lisäämä otsikko Ruotsiksi ei ole lähteessä.
        juuri.querySelectorAll('h2').forEach(h => { if (h.textContent.replace(/\u00ad/g, '').trim() === 'Ruotsiksi') h.remove(); });
        const rivit = [...juuri.querySelectorAll('p.rivit')].length, vali = juuri.querySelectorAll('p.vali').length;
        return { sanat: sanat(teksti(juuri)), viitteet, ots, lainaukset, rivit, vali, varoitukset: r.warnings.map(w => w.msg), taulukot: juuri.querySelectorAll('table').length };
      }, [md, SANAT]);
      await L.close();
      const etu = {};
      (/^---\n([\s\S]*?)\n---/.exec(md) || [, ''])[1].split('\n').forEach(r => { const m = /^([^:]+):\s*(.*)$/.exec(r); if (m) etu[m[1]] = m[2]; });
      t.etu = etu;
      t.otsikko = (/^# (.*)$/m.exec(md) || [, ''])[1];
      t.jaanteet = { html: (md.match(/<\/?(sup|span|table|div|a|p|font|strong|em)\b/g) || []).length, merkki: (md.match(/XLUINVIITE/g) || []).length };
      const a = t.lahde.fi.sanat.concat(t.lahde.sv.sanat), bb = t.luin.sanat;
      t.sanoja = { lahde: a.length, luin: bb.length };
      t.diff = sanaDiff(a, bb, process.pid + '_' + k);
      const va = t.lahde.fi.viitteet.concat(t.lahde.sv.viitteet).join(' ').split(' ').filter(Boolean), vb = t.luin.viitteet.join(' ').split(' ').filter(Boolean);
      t.viitteet = { lahde: t.lahde.fi.viitteet.length + t.lahde.sv.viitteet.length, merkit: (t.lahde.fi.merkit || 0) + (t.lahde.sv.merkit || 0), luin: t.luin.viitteet.length };
      t.viiteDiff = sanaDiff(va, vb, process.pid + '_v' + k);
      delete t.luin.sanat; delete t.lahde.fi.sanat; delete t.lahde.sv.sanat; delete t.luin.viitteet;
    } catch (e) { t.virhe = String(e).slice(0, 300); await s.close().catch(() => {}); }
    ulos.write(JSON.stringify(t) + '\n');
    if (++valmiit % 100 === 0) console.log(valmiit, 'asiakirjaa,', Math.round((Date.now() - alku) / 1000), 's');
  });
  ulos.end();
  await b.close(); palvelin.close();
  // Yhteenveto.
  const yht = fs.readFileSync(TULOS, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const n = f => yht.filter(f).length;
  const sanaa = l => l.reduce((s, x) => s + x.replace(/^\([^)]*\) /, '').split(' ').length, 0);
  console.log('\nYHTEENVETO (' + yht.length + ' asiakirjaa)');
  console.log('  virheitä', n(y => y.virhe), '; yleiseen leikkeeseen', n(y => !y.virhe && !y.sovite));
  console.log('  tekstistä kadonneita sanoja', yht.reduce((s, y) => s + (y.diff ? sanaa(y.diff.pois) : 0), 0), 'asiakirjoissa', n(y => y.diff && y.diff.pois.length),
    '; ylimääräisiä', yht.reduce((s, y) => s + (y.diff ? sanaa(y.diff.lisa) : 0), 0), 'asiakirjoissa', n(y => y.diff && y.diff.lisa.length));
  console.log('  alaviitteitä lähteessä', yht.reduce((s, y) => s + (y.viitteet ? y.viitteet.lahde : 0), 0), ', lukimessa', yht.reduce((s, y) => s + (y.viitteet ? y.viitteet.luin : 0), 0),
    '; viitesanoja kadonnut', yht.reduce((s, y) => s + (y.viiteDiff ? sanaa(y.viiteDiff.pois) : 0), 0), ', ylimääräisiä', yht.reduce((s, y) => s + (y.viiteDiff ? sanaa(y.viiteDiff.lisa) : 0), 0));
  console.log('  md.js-varoituksia', yht.reduce((s, y) => s + (y.luin ? y.luin.varoitukset.length : 0), 0), '; jäänteitä', yht.reduce((s, y) => s + (y.jaanteet ? y.jaanteet.html + y.jaanteet.merkki : 0), 0));
  if (VERTAA) {
    const m = yht.filter(y => y.muutos), e = yht.filter(y => y.muutos === 0).length, p = yht.filter(y => y.muutos === null || y.muutos === undefined).length;
    console.log(`  verrattuna (${VERTAA}): ennallaan ${e}, muuttui ${m.length} (${m.reduce((s, y) => s + y.muutos, 0)} riviä), vertailusta puuttui ${p}`);
    m.sort((a, b) => b.muutos - a.muutos).slice(0, 40).forEach(y => console.log('    ' + y.muutos + '  ' + y.nimi));
  }
  console.log('  tulokset: ' + TULOS);
})().catch(e => { console.error(e); process.exit(1); });
