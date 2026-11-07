// SEP-pesukone: Stanford Encyclopedia of Philosophyn artikkelit Lisää lukimeen -lisäosan, Latomon ja md.js:n läpi.
// Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sep-pesukone.js [--vali kansio] [--nayta] dewey cassirer heraclitus …
// Sivut haetaan kerran välimuistiin (oletus: käyttöjärjestelmän tmp/sep-pesukone; SEP:n tekstejä ei viedä repoon),
// myös alaviitesivut, joita lisäosa pyytää. Mittaa jokaisesta artikkelista rakenteen (lähteen h2/h3 vs. tuloksen),
// alaviitteet (tekstillä / lähteen sivulla), kirjallisuusluettelon (lähteen kohdat vs. p.bib vs. tunnistetut), lähdelinkit
// ja niiden oikeellisuuden (linkin tekijä ja vuosi = kohteen tekijä ja vuosi) sekä linkittämättä jääneet tekijä–vuosi-
// ehdokkaat leipätekstin suluissa syineen. --nayta tulostaa jokaisen linkin ja ehdokkaan. Tulos: välimuistiin
// <artikkeli>.md (Latomon jälkeen) ja yhteenveto.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), cp = require('child_process');
const { chromium } = require('playwright');

const arg = process.argv.slice(2);
const otaArvo = n => { const i = arg.indexOf(n); if (i < 0) return null; const v = arg[i + 1]; arg.splice(i, 2); return v; };
const otaLippu = n => { const i = arg.indexOf(n); if (i < 0) return false; arg.splice(i, 1); return true; };
const VALI = otaArvo('--vali') || path.join(os.tmpdir(), 'sep-pesukone');
const NAYTA = otaLippu('--nayta');
const ARTIKKELIT = arg.length ? arg : ['dewey', 'cassirer', 'heraclitus', 'habermas', 'moral-animal', 'capability-approach', 'kant'];
const JUURI = path.resolve(__dirname, '../..');
const LISAOSA = path.join(JUURI, 'luin/lisaosa');
fs.mkdirSync(VALI, { recursive: true });

function valimuisti(url) {
  const f = path.join(VALI, url.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_') + '.html');
  if (!fs.existsSync(f)) {
    const koodi = cp.execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0', '-o', f, '-w', '%{http_code}', url]).toString();
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
    if (/^https:\/\/plato\.stanford\.edu\//.test(u) && /^(document|fetch|xhr)$/.test(r.request().resourceType())) {
      const h = valimuisti(u);
      return h ? r.fulfill({ body: h, contentType: 'text/html; charset=utf-8' }) : r.fulfill({ status: 404, body: '' });
    }
    return r.abort();
  });
  const koodi = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js']
    .map(f => fs.readFileSync(path.join(LISAOSA, f), 'utf8')).join('\n;\n');
  const yht = [];

  for (const a of ARTIKKELIT) {
    const url = 'https://plato.stanford.edu/entries/' + a + '/';
    if (!valimuisti(url)) { console.log('=====', a, 'ei saatu'); continue; }
    // 1. Lähde: rakenne, alaviitemerkit ja kirjallisuusluettelon kohdat sivulta itseltään.
    const s = await ctx.newPage();
    await s.goto(url);
    const lahde = await s.evaluate(() => {
      const osat = ['preamble', 'main-text', 'bibliography', 'other-internet-resources'].map(i => document.getElementById(i)).filter(Boolean);
      const h = sel => osat.reduce((n, o) => n + o.querySelectorAll(sel).length, 0);
      const bib = document.getElementById('bibliography');
      return { h2: h('h2'), h3: h('h3'), h4: h('h4'), sup: document.querySelectorAll('#main-text sup a[href*="notes.html#"], #preamble sup a[href*="notes.html#"]').length,
        bib: bib ? bib.querySelectorAll('li').length + [...bib.querySelectorAll('p')].filter(p => /\b(1[5-9]\d\d|20\d\d)\b/.test(p.textContent)).length : 0 };
    });
    // 2. Lisäosan leike.
    const leike = await s.evaluate(k => (0, eval)(k), koodi);
    await s.close();
    // 3. Latomo.
    const L = await ctx.newPage();
    await L.goto(PAIK + 'luin/latomo.html');
    await L.fill('#md', leike.koko);
    await L.waitForTimeout(800);
    const md = await L.evaluate(() => window.__latomo.tulos().md);
    fs.writeFileSync(path.join(VALI, a + '.md'), md);
    // 4. md.js samalla sivulla (sama koodi kuin Luinissa) ja tuloksen tarkastus DOMista.
    const t = await L.evaluate(md => {
      const r = window.LuinMD.parse(md);
      const d = new DOMParser().parseFromString('<div id="t">' + r.html + '</div>', 'text/html');
      const ids = new Set([...d.querySelectorAll('[id]')].map(e => e.id));
      const kohde = id => d.getElementById(id);
      const sn = [...d.querySelectorAll('.sidenote')];
      const linkit = [...d.querySelectorAll('a.lahde')].map(x => {
        const k = kohde(x.getAttribute('href').slice(1));
        const alku = k ? k.textContent.replace(/\u00ad/g, '').slice(0, 90) : '';
        // Viivojen (–––) tekijä: lähin edeltävä luettelon kappale, joka ei ala viivoilla.
        let viivaTekija = '';
        if (k && /^\s*[–—-]{2,}/.test(alku)) for (let e = k.previousElementSibling; e; e = e.previousElementSibling) {
          if (/^H[2-6]$/.test(e.tagName)) break;
          if (!/^\s*[–—-]{2,}/.test(e.textContent)) { viivaTekija = e.textContent.replace(/\u00ad/g, '').slice(0, 60); break; }
        }
        // Otsikkoketju kohdasta ylöspäin (Works by Dewey → Individual works) tekijättömälle kohdalle.
        let ots = '';
        if (k) {
          const ketju = [];
          for (const e of d.querySelectorAll('h2, h3, h4, h5, h6')) {
            if (!(e.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
            const t = +e.tagName[1];
            while (ketju.length && ketju[ketju.length - 1].t >= t) ketju.pop();
            ketju.push({ t, x: e.textContent });
          }
          ots = ketju.map(x => x.x).join(' | ');
          // Luin ladoo ### ja #### samaksi h4:ksi, joten ketju ei erota A. Works by Dewey → Individual works: viimeisin
          // works by X -otsikko kelpaa, ellei sen jälkeen tule muiden kirjallisuuden otsikkoa.
          let viim = '';
          for (const e of d.querySelectorAll('h2, h3, h4, h5, h6')) {
            if (!(e.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
            if (/(?:works|writings|schriften)\s+(?:by|of|von)\s/i.test(e.textContent)) viim = e.textContent;
            else if (/secondary|studies|other|literature|further|references|bibliograph/i.test(e.textContent)) viim = '';
          }
          if (viim && !/(?:works|writings|schriften)\s+(?:by|of|von)\s/i.test(ots)) ots += ' | ' + viim;
        }
        return { teksti: x.textContent.replace(/\u00ad/g, ''), kohde: x.getAttribute('href').slice(1), alku, ots, alaviite: !!x.closest('.sidenote'),
          viivaTekija, ennen: (() => { let t = ''; for (let n = x.previousSibling; n && t.length < 80; n = n.previousSibling) t = n.textContent + t;
            return t.replace(/\u00ad/g, '').slice(-80); })(), olemassa: !!k };
      });
      // Ehdokkaat: leipätekstin (ei alaviite, ei kirjallisuusluettelo, ei otsikkolohko) sulkujen tekijä–vuosi-parit.
      const ehd = [];
      const NIMI = /(\p{Lu}[\p{L}’'-]+(?:\s+(?:and|&)\s+\p{Lu}[\p{L}’'-]+)?(?:\s+et al\.)?)\s+((?:1[5-9]\d\d|20\d\d)[a-z]?)(?![\p{L}\p{N}])/gu;
      d.querySelectorAll('#t > p:not(.bib), #t > blockquote p, #t li').forEach(p => {
        if (p.closest('header')) return;
        const c = p.cloneNode(true);
        c.querySelectorAll('.sidenote, .fnref, input').forEach(x => x.remove());
        const linkitetyt = [...c.querySelectorAll('a.lahde')].map(x => x.textContent.replace(/\u00ad/g, ''));
        const tx = c.textContent.replace(/\u00ad/g, '');
        const sulut = /\(([^()]{2,200})\)|\[([^\[\]]{2,200})\]/g;
        let m;
        while ((m = sulut.exec(tx))) {
          const sis = m[1] || m[2];
          let n;
          NIMI.lastIndex = 0;
          while ((n = NIMI.exec(sis))) {
            const nimi = n[1], v = n[2];
            const linkissa = linkitetyt.some(l => l === nimi + ' ' + v || l === v || l.endsWith(nimi + ' ' + v) || l.endsWith(' ' + v) && nimi.endsWith(l.split(' ')[0]));
            ehd.push({ nimi, v, sulku: m[1] ? '(' : '[', sis: sis.slice(0, 120), linkissa });
          }
        }
      });
      return {
        h2: d.querySelectorAll('#t > h2').length, h3: d.querySelectorAll('#t > h3').length, h4: d.querySelectorAll('#t > h4').length,
        alaviitteet: sn.length, tyhjat: sn.filter(x => /lähteen omalla sivulla/.test(x.textContent)).length,
        bib: d.querySelectorAll('p.bib').length, kohdat: d.querySelectorAll('p.bib[id^="kirj-"]').length,
        linkit, rikki: linkit.filter(l => !l.olemassa).length, ehd,
        ratkaisematta: r.viittaukset.filter(v => !v.kohde).map(v => v.teksti + ': ' + v.syy),
        varoitukset: r.warnings.length
      };
    }, md);
    await L.close();

    // 5. Oikeellisuus: linkin tekijä (tai jatkovuoden edeltävä tekijä) ja vuosi kohteen alussa.
    const norm = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const vaarat = [];
    let edNimi = '';
    t.linkit.forEach(l => {
      const m = /^(.*?)\s*((?:1[5-9]\d\d|20\d\d)[a-z]?)$/.exec(l.teksti);
      if (!m) return; // lyhenne (HNC) tai paikannin
      const v = m[2];
      // Nimetön vuosi: tekijättömän kohdan (alkaa vuodella) tekijä on osion otsikossa (works by X); muuten edellinen tekijä.
      const osio = /(?:works|writings|schriften)\s+(?:by|of|von)\s+(\S+)/i.exec(l.ots);
      const tekijaton = /^\s*\(?(1[5-9]|20)\d\d/.test(l.alku);
      // Kertova viittaus: tekijä linkin edellä, sulun alussa (Kirk (1954), Rehg (1991 & 1994)).
      const kert = !m[1] && /(\p{Lu}[\p{L}’'-]+(?:\s+(?:and|&)\s+\p{Lu}[\p{L}’'-]+|\s+et al\.)?)\s*\((?:[^()]*?(?:1[5-9]\d\d|20\d\d)[a-z]?[^()]*?(?:&|and|;|,)\s*)?$/u.exec(l.ennen);
      // Pilkulla jatkuva vuosi saman tekijän perässä (Nussbaum 1988, 1992, 2020) ennen kertovaa muotoa.
      const nv = [...l.ennen.matchAll(/(\p{Lu}[\p{L}’'-]+(?:\s+(?:and|&)\s+\p{Lu}[\p{L}’'-]+|\s+et al\.)?)\s+(?:1[5-9]\d\d|20\d\d)[a-z]?/gu)].pop();
      const jatko = !m[1] && nv && /^(?:[^;()\p{Lu}]{0,30}?,\s*(?:1[5-9]\d\d|20\d\d)[a-z]?)*[^;()\p{Lu}]{0,30}?,\s*$/u.test(l.ennen.slice(nv.index + nv[0].length)) ? nv : null;
      const nimi = m[1] || (jatko ? jatko[1] : kert ? kert[1] : tekijaton && osio ? osio[1] : edNimi);
      if (m[1]) edNimi = m[1];
      const suku = nimi.split(/,|\s+(?:and|&|ja)\s+|\s+et al\./)[0].trim();
      // Nimetön vuosi tekijättömään kohtaan on aiheen oma teos (Habermas: Kohlberg ([1976a]: 9–49)), vaikka edellä on nimi.
      const tekijaOk = norm(l.alku).startsWith(norm(suku)) || /^[–—-]{2,}/.test(l.alku) && norm(l.viivaTekija).startsWith(norm(suku)) ||
        tekijaton && !!osio && (norm(osio[1]).startsWith(norm(suku)) || !m[1]);
      const vuosiOk = new RegExp('(^|[^0-9])' + v + '(?![0-9a-z])').test(l.alku);
      // Käännöksen tai painoksen vuosi hakasulussa toisen vuoden perässä (2011 [2012: 58]) ei ole viittaus.
      const kaannos = /(?:1[5-9]\d\d|20\d\d)[a-z]?(?:\s+(?:chapter|chap\.|ch\.|essay|part|vol\.)\s*\d+)?\s*\[$/.test(l.ennen);
      if (!tekijaOk || !vuosiOk || kaannos) vaarat.push((kaannos ? 'käännösvuosi ' : '') + l.teksti + ' → ' + l.alku.slice(0, 60));
    });
    // 6. Puuttuvat: linkittämättä jäänyt ehdokas, jolle luettelossa on tasan yksi kohta (tunniste kirj-nimi-vuosi).
    const slug = x => window_slug(x);
    function window_slug(x) { return norm(x).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    const ids = t.linkit.map(l => l.kohde);
    const kaikkiKohteet = new Set(ids);
    const puuttuvat = t.ehd.filter(e => !e.linkissa);
    const leipaLinkit = t.linkit.filter(l => !l.alaviite).length;
    const tulos = { a, lahde, t, vaarat, puuttuvat, leipaLinkit };
    yht.push(tulos);

    console.log('=====', a);
    console.log(`  rakenne: lähde h2/h3/h4 ${lahde.h2}/${lahde.h3}/${lahde.h4}, tulos ##/###/#### ${t.h2}/${t.h3}/${t.h4}` +
      ` (tulos ilman otsikkolohkoa; lähteessä Bibliography ja Other Internet Resources ovat h2)`);
    console.log(`  alaviitteet: lähteessä ${lahde.sup} merkkiä, tuloksessa ${t.alaviitteet}, joista lähteen sivulla ${t.tyhjat}`);
    console.log(`  kirjallisuus: lähteessä ~${lahde.bib} kohtaa, p.bib ${t.bib}, tunnistettu ${t.kohdat}`);
    console.log(`  lähdelinkit: ${t.linkit.length} (leipätekstissä ${leipaLinkit}, alaviitteissä ${t.linkit.length - leipaLinkit}), rikki ${t.rikki}, väärä kohde ${vaarat.length}`);
    console.log(`  sulkujen tekijä–vuosi-ehdokkaat: ${t.ehd.length}, linkittämättä ${puuttuvat.length}; md.js: ratkaisematta ${t.ratkaisematta.length}, varoituksia ${t.varoitukset}`);
    for (const v of vaarat) console.log('    VÄÄRÄ ' + v);
    if (NAYTA) {
      for (const l of t.linkit) console.log('    linkki ' + (l.alaviite ? '(av) ' : '') + l.teksti + ' → ' + l.alku.slice(0, 60));
      for (const e of puuttuvat) console.log('    ei   ' + e.sulku + e.nimi + ' ' + e.v + '  ‹' + e.sis + '›');
      for (const x of t.ratkaisematta) console.log('    md.js ' + x);
    }
  }
  console.log('\nYHTEENVETO');
  const sum = f => yht.reduce((n, y) => n + f(y), 0);
  console.log(`  artikkeleita ${yht.length}; lähdelinkkejä ${sum(y => y.t.linkit.length)} (leipätekstissä ${sum(y => y.leipaLinkit)}), rikki ${sum(y => y.t.rikki)}, väärä kohde ${sum(y => y.vaarat.length)}`);
  console.log(`  sulkuehdokkaita ${sum(y => y.t.ehd.length)}, linkittämättä ${sum(y => y.puuttuvat.length)}; alaviitteitä ${sum(y => y.t.alaviitteet)}, lähteen sivulla ${sum(y => y.t.tyhjat)}`);
  console.log('  välimuisti ja tulokset: ' + VALI);
  await b.close(); palvelin.close();
})().catch(e => { console.error(e); process.exit(1); });
