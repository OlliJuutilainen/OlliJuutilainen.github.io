// Luinin selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/testi.js polku/teksti.md [kuvakansio]
// Käynnistää oman tiedostopalvelimen, syöttää tekstin Latomon tavoin (luin-tuonti → #tuo)
// ja mittaa: rakenteen, sivutuksen (leikkautuvat rivit), koon muutoksen paluun samaan
// kohtaan, alleviivauksen ja kirjauksen säilymisen, merkintöjen viennin ja aikajanan hypyn.
// Kuvat kuvakansioon, jos annettu.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const MD = fs.readFileSync(process.argv[2], 'utf8');
const KUVAT = process.argv[3];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.png': 'image/png' };

const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

palvelin.listen(0, async () => {
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 412, height: 824 }, acceptDownloads: true })).newPage();
  const sivuvirheet = [];
  p.on('pageerror', e => sivuvirheet.push(e.message));
  const kuva = async n => { if (KUVAT) await p.screenshot({ path: path.join(KUVAT, n + '.png') }); };
  const tila = () => p.evaluate(() => ({ s: window.__luin.tila.sivu, n: window.__luin.tila.sivuja, a: window.__luin.tila.ankkuri }));

  await p.goto(BASE + 'luin.html');
  await p.evaluate(md => { localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); }, MD);
  await p.goto('about:blank');
  await p.goto(BASE + 'luin.html#tuo');
  await p.waitForTimeout(600);

  const r = await p.evaluate(() => {
    const d = window.__luin.nyt().doc;
    return { h2: document.querySelectorAll('#teksti h2').length, h3: document.querySelectorAll('#teksti h3').length,
      viitteet: document.querySelectorAll('.fnref').length, notes: d.notes, lohkot: document.querySelectorAll('#teksti [data-b]').length,
      lahteet: document.querySelectorAll('p.bib').length, varoitukset: d.warnings.length };
  });
  tulos('rakenne', r.viitteet === r.notes && r.lohkot > 0, JSON.stringify(r));
  // Jokainen alaviitteen lähdeviittaus osoittaa kirjallisuusluettelon kohtaan.
  const lv = await p.evaluate(() => { const a = [...document.querySelectorAll('a.lahde')];
    return { n: a.length, rikki: a.filter(x => { const k = document.getElementById(x.getAttribute('href').slice(1)); return !k || !k.classList.contains('bib'); }).length }; });
  tulos('lähdeviittaukset', lv.rikki === 0, JSON.stringify(lv));
  await kuva('1-alku');

  // Sivutus: yksikään näkyvän sivun rivi ei saa ulottua sivualueen alle. Valikon alleviivausta
  // varten automaattinen alleviivaus pois (oletus on päällä).
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.sivutus = 'sivut'; a.auto = 0; a.av = 3; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await p.reload(); await p.waitForTimeout(500);
  const n = (await tila()).n;
  let leikattu = 0;
  for (let i = 0; i < n; i++) {
    leikattu += await p.evaluate(() => {
      const sv = document.querySelector('#sivu').getBoundingClientRect(); let v = 0;
      const tw = document.createTreeWalker(document.querySelector('#teksti'), NodeFilter.SHOW_TEXT); let t;
      while ((t = tw.nextNode())) { const q = document.createRange(); q.selectNodeContents(t); for (const k of q.getClientRects()) if (k.width && k.left >= sv.left && k.right <= sv.right && k.bottom > sv.bottom + 0.5) v++; }
      return v;
    });
    await p.keyboard.press('ArrowRight');
  }
  tulos('sivutus', leikattu === 0, n + ' sivua, leikkautuvia rivejä ' + leikattu);

  // Jokaisen sivun kohta vie takaisin samalle sivulle (löysi tavutusrajan ja sisällyssivun viat).
  const harha = await p.evaluate(() => {
    const L = window.__luin, v = [];
    for (let s = 0; s < L.tila.sivuja; s++) {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: s ? 'ArrowRight' : 'Home', bubbles: true }));
      const s0 = L.tila.sivu; L.mene(L.tila.ankkuri);
      if (L.tila.sivu !== s0) v.push(s0 + '→' + L.tila.sivu);
    }
    return v;
  });
  tulos('sivun kohta', harha.length === 0, harha.join(', '));

  // Koon muutos ja paluu: sama sivu ja sama ankkuri.
  await p.keyboard.press('Home');
  for (let i = 0; i < Math.floor(n / 3); i++) await p.keyboard.press('ArrowRight');
  const ennen = await tila();
  await p.click('#lukija .ratas');
  for (let i = 0; i < 3; i++) await p.click('#asetukset button[data-askel="1"]');
  for (let i = 0; i < 3; i++) await p.click('#asetukset button[data-askel="-1"]');
  await p.click('#asetukset .sulje'); await p.waitForTimeout(200);
  const jalkeen = await tila();
  tulos('koon paluu', ennen.s === jalkeen.s && ennen.a.b === jalkeen.a.b && ennen.a.o === jalkeen.a.o, 'sivu ' + ennen.s + ' → ' + jalkeen.s);
  await kuva('2-sivu');

  // Alleviivaus valinnasta ja säilyminen.
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('#teksti p[data-b]')].find(x => x.textContent.length > 120 && x.getBoundingClientRect().width);
    const t = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
    const q = document.createRange(); q.setStart(t, 2); q.setEnd(t, Math.min(t.length, 40));
    getSelection().removeAllRanges(); getSelection().addRange(q); window.__luin.valinta();
  });
  await p.click('#pop button[data-k="ali"]');
  await p.reload(); await p.waitForTimeout(500);
  tulos('alleviivaus säilyy', await p.evaluate(() => document.querySelectorAll('mark.ali').length > 0));

  // Automaattinen alleviivaus: valinta muuttuu heti alleviivaukseksi, mutta ei silloin, kun
  // alleviivaukset on piilotettu tekstistä. Piilotettuina niillä ei ole näkyvää viivaa.
  const autoAli = await p.evaluate(() => {
    const L = window.__luin, a = L.aset, valitse = () => {
      const el = [...document.querySelectorAll('#teksti p[data-b]')].find(x => x.textContent.length > 120 && x.getBoundingClientRect().width && !x.querySelector('mark'));
      const t = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
      const q = document.createRange(); q.setStart(t, 2); q.setEnd(t, Math.min(t.length, 40));
      getSelection().removeAllRanges(); getSelection().addRange(q); L.valinta();
    };
    const n0 = L.nyt().merk.al.length;
    a.auto = 1; valitse(); const n1 = L.nyt().merk.al.length;
    document.querySelector('#pop').hidden = true;
    a.alTekstissa = 0; document.documentElement.classList.add('ali-piilo'); valitse(); const n2 = L.nyt().merk.al.length;
    const viiva = getComputedStyle(document.querySelector('mark.ali')).textDecorationLine;
    getSelection().removeAllRanges(); document.querySelector('#pop').hidden = true;
    L.nyt().merk.al.pop(); a.auto = 0; a.alTekstissa = 1; document.documentElement.classList.remove('ali-piilo');
    return { n0, n1, n2, viiva };
  });
  tulos('automaattinen alleviivaus', autoAli.n1 === autoAli.n0 + 1 && autoAli.n2 === autoAli.n1 && autoAli.viiva === 'none', JSON.stringify(autoAli));

  // Kirjaus valinnasta, säilyminen ja vienti oletusvalinnoilla (alleviivaukset ja kirjaukset).
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('#teksti p[data-b]')].find(x => x.textContent.length > 120 && x.getBoundingClientRect().width && !x.querySelector('mark'));
    const t = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
    const q = document.createRange(); q.setStart(t, 2); q.setEnd(t, Math.min(t.length, 40));
    getSelection().removeAllRanges(); getSelection().addRange(q); window.__luin.valinta();
  });
  await p.click('#pop button[data-k="kir"]');
  await p.keyboard.type('Testikirjaus');
  await p.click('#pop button[data-k="tallenna"]');
  await p.reload(); await p.waitForTimeout(500);
  await p.click('#lukija .ratas'); await p.click('#vienti summary');
  const [lataus] = await Promise.all([p.waitForEvent('download'), p.click('#vie')]);
  const vienti = fs.readFileSync(await lataus.path(), 'utf8');
  await p.click('#asetukset .sulje');
  tulos('kirjaus ja vienti', /\n> .+\n\nTestikirjaus\n/.test(vienti) && !/KIRJANMERKKI/.test(vienti), lataus.suggestedFilename() + ', ' + vienti.split('\n').length + ' riviä');

  // Aikajana: viimeisen pääluvun merkki vie sen otsikkoon.
  await p.click('#ala-nappi');
  const kohde = await p.evaluate(() => {
    const t = window.__luin.nyt().doc.toc.filter(x => x.lvl === 1).pop();
    const g = [...document.querySelectorAll('#jana-svg g')].find(x => x.textContent === t.text);
    const bb = g.getBoundingClientRect(); return { x: bb.left + bb.width / 2, y: bb.top + bb.height / 2, nimi: t.text };
  });
  await p.mouse.click(kohde.x, kohde.y); await p.waitForTimeout(150);
  tulos('aikajanan hyppy', (await p.textContent('#ala-kohta')) === kohde.nimi, kohde.nimi);
  await kuva('3-aikajana');

  // Aikajanan veto sivutettuna: voimassa oleva kohta ja sivu pysyvät vedon ajan, vedettävä
  // osoitin hyppää sivun alusta toiseen, ja irrotus vie sille sivulle. Jokaisen sivun alku vie
  // takaisin samalle sivulle.
  const alut = await p.evaluate(() => {
    const L = window.__luin, v = [];
    for (let i = 0; i < L.tila.sivuja; i++) { L.mene(L.sivunAlku(i)); if (L.tila.sivu !== i) v.push(i + '→' + L.tila.sivu); }
    return v;
  });
  tulos('sivujen alut', alut.length === 0, alut.slice(0, 6).join(', '));
  const veto = async (x0, x1, askelia) => {
    const r = await p.evaluate(() => { const b = document.querySelector('#jana-svg').getBoundingClientRect(); return { l: b.left, w: b.width, y: b.top + 21 }; });
    const ennen = await p.evaluate(() => ({ s: window.__luin.tila.sivu, a: JSON.stringify(window.__luin.tila.ankkuri), y: scrollY }));
    await p.mouse.move(r.l + x0 * r.w, r.y); await p.mouse.down();
    const xt = new Set(); let pysyi = true, haamu = true;
    for (let i = 1; i <= askelia; i++) {
      await p.mouse.move(r.l + (x0 + (x1 - x0) * i / askelia) * r.w, r.y); await p.waitForTimeout(20);
      const t = await p.evaluate(() => ({ s: window.__luin.tila.sivu, a: JSON.stringify(window.__luin.tila.ankkuri), y: scrollY,
        g: document.querySelector('#j-veto')?.getAttribute('transform'), h: !!document.querySelector('#jana-svg .haamu') }));
      if (t.s !== ennen.s || t.a !== ennen.a || t.y !== ennen.y) pysyi = false;
      if (!t.g || !t.h) haamu = false; else xt.add(parseFloat(t.g.slice(10)));
    }
    await p.mouse.up(); await p.waitForTimeout(150);
    const jalkeen = await p.evaluate(() => ({ s: window.__luin.tila.sivu, a: window.__luin.tila.ankkuri, y: scrollY,
      g: !!document.querySelector('#j-veto'), h: !!document.querySelector('#jana-svg .haamu') }));
    return { ennen, xt: [...xt], pysyi, haamu, jalkeen, r };
  };
  await p.evaluate(() => window.__luin.mene({ b: 0, o: 0 }));
  const vs = await veto(0.2, 0.3, 40);
  const sivuX = await p.evaluate(w => { const L = window.__luin, o = k => (L.nyt().cum[k.b] + k.o) / L.nyt().total, a = [];
    for (let i = 0; i < L.tila.sivuja; i++) a.push(13 + o(L.sivunAlku(i)) * (w - 26));
    // Merkin lähellä (14 px) osoitin tarttuu merkkiin kuten ennenkin; muualla sivun alkuun.
    L.nyt().doc.toc.forEach(t => a.push(13 + o({ b: t.b, o: 0 }) * (w - 26)));
    L.nyt().merk.km.forEach(k => a.push(13 + o(k) * (w - 26)));
    return a; }, vs.r.w);
  const kvantti = vs.xt.every(x => sivuX.some(s => Math.abs(s - x) < 0.01));
  tulos('aikajanan veto sivutettuna', vs.pysyi && vs.haamu && kvantti && !vs.jalkeen.g && !vs.jalkeen.h && vs.jalkeen.s !== vs.ennen.s,
    'sivu ' + (vs.ennen.s + 1) + ' → ' + (vs.jalkeen.s + 1) + ', osoittimen paikkoja ' + vs.xt.length + ' / 40 askelta' + (kvantti ? ', kaikki sivujen alkuja tai merkkejä' : ', EI sivujen alkuja'));

  // Kirjanmerkin nauha kappaleen alussa: ensimmäisen rivin yläpuolella tai sisennyksessä, ei
  // reunuksessa eikä tekstin päällä. Oletuskoossa tilaa on joka lohkon yläpuolella, paitsi
  // sisennystilassa kappaleeseen kiinni olevalla koodilohkolla (pre), joka saa olla reunuksessa.
  // Molemmat kappalejaot, jokainen sivu, kirjanmerkki joka lohkon alussa.
  const kappalejako = async kpl => {
    await p.click('#lukija .ratas'); await p.click('#asetukset [data-a="kappale"] button[data-arvo="' + kpl + '"]');
    await p.click('#asetukset .sulje'); await p.waitForTimeout(100);
  };
  const nauhat = { yla: 0, sis: 0, reunus: [], paalla: [] };
  for (const kpl of ['vali', 'sisennys']) {
    await kappalejako(kpl);
    const v = await p.evaluate(kpl => {
      const L = window.__luin, n = L.nyt(), alkup = n.merk.km, v = { yla: 0, sis: 0, reunus: [], paalla: [] };
      n.merk.km = n.blocks.map((el, b) => ({ id: 'k' + b, b, o: 0, s: n.txt[b].slice(0, 40), t: 0, osio: '' }));
      for (let s = 0; s < L.tila.sivuja; s++) {
        L.mene(L.sivunAlku(s));
        const rivit = [];
        const tw = document.createTreeWalker(document.querySelector('#teksti'), NodeFilter.SHOW_TEXT); let t;
        while ((t = tw.nextNode())) {
          if (t.parentElement.closest('.sidenote,.luin-ui,input') || !t.nodeValue.trim()) continue;
          const fs = parseFloat(getComputedStyle(t.parentElement).fontSize), q = document.createRange(); q.selectNodeContents(t);
          for (const x of q.getClientRects()) rivit.push({ l: x.left, r: x.right, t: x.top + 0.41 * fs, b: x.bottom - 0.09 * fs });
        }
        document.querySelectorAll('.km').forEach(m => {
          const b = +m.dataset.k.slice(1), el = n.blocks[b], mr = m.getBoundingClientRect();
          const tt = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let e;
          while ((e = tt.nextNode()) && e.parentElement.closest('.sidenote,.fnref,.luin-ui,input'));
          const q = document.createRange(); q.setStart(e, 0); q.setEnd(e, 1); const rs = q.getClientRects(), fr = rs[rs.length - 1];
          const fs = parseFloat(getComputedStyle(e.parentElement).fontSize);
          if (mr.bottom <= fr.top + 0.41 * fs + 0.5 && Math.abs(mr.left - fr.left) < 0.5) v.yla++;
          else if (mr.right <= fr.left && mr.left >= el.getBoundingClientRect().left) v.sis++;
          else if (el.tagName !== 'PRE') v.reunus.push(kpl + ' ' + b);
          if (rivit.some(x => x.r > mr.left + 0.5 && x.l < mr.right - 0.5 && x.b > mr.top + 0.5 && x.t < mr.bottom - 0.5)) v.paalla.push(kpl + ' ' + b);
        });
      }
      n.merk.km = alkup; L.mene(L.tila.ankkuri);
      return v;
    }, kpl);
    nauhat.yla += v.yla; nauhat.sis += v.sis; nauhat.reunus.push(...v.reunus); nauhat.paalla.push(...v.paalla);
  }
  await kappalejako('vali');
  tulos('kirjanmerkin nauha kappaleen alussa', !nauhat.reunus.length && !nauhat.paalla.length,
    'yläpuolella ' + nauhat.yla + ', sisennyksessä ' + nauhat.sis + (nauhat.reunus.length ? ', reunuksessa ' + nauhat.reunus.slice(0, 4) : '') + (nauhat.paalla.length ? ', tekstin päällä ' + nauhat.paalla.slice(0, 4) : ''));

  // Kirjanmerkkinappi sivulla, joka alkaa kesken kappaleen: merkki kappaleen alkuun, ja
  // siirrytään sille sivulle; toinen painallus poistaa sen.
  const kesken = await p.evaluate(() => { const L = window.__luin; for (let s = 3; s < L.tila.sivuja; s++) { L.mene(L.sivunAlku(s)); if (L.tila.ankkuri.o > 0) return { s, b: L.tila.ankkuri.b }; } });
  const kmEnnen = await p.evaluate(() => window.__luin.nyt().merk.km.length);
  await p.click('#km-nappi'); await p.waitForTimeout(100);
  const kmNyt = await p.evaluate(() => ({ s: window.__luin.tila.sivu, km: window.__luin.nyt().merk.km.map(k => k.b + ':' + k.o), lit: document.querySelector('#km-nappi').getAttribute('aria-pressed'), nauhoja: document.querySelectorAll('.km').length }));
  await p.click('#km-nappi'); await p.waitForTimeout(100);
  const kmPois = await p.evaluate(() => window.__luin.nyt().merk.km.length);
  tulos('kirjanmerkki kesken alkavalla sivulla', kmNyt.s < kesken.s && kmNyt.km.indexOf(kesken.b + ':0') >= 0 && kmNyt.lit === 'true' && kmNyt.nauhoja >= 1 && kmPois === kmEnnen,
    'sivu ' + (kesken.s + 1) + ' → ' + (kmNyt.s + 1) + ', kirjanmerkki ' + kesken.b + ':0, toinen painallus poisti');

  // Vieritys: luettu kohta → mene() → sama kohta (ei ajaudu riviä ylöspäin).
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.sivutus = 'vieritys'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await p.reload(); await p.waitForTimeout(400);
  const ajautuma = await p.evaluate(() => {
    const L = window.__luin, H = document.documentElement.scrollHeight, v = [];
    for (let y = 0; y < H - innerHeight; y += 377) {
      window.scrollTo(0, y); const a = L.nykyinenKohta(); L.mene(a); const c = L.nykyinenKohta();
      if (a.b !== c.b || a.o !== c.o) v.push(y + ': ' + a.b + '/' + a.o + ' → ' + c.b + '/' + c.o);
    }
    return v;
  });
  tulos('vierityksen kohta', ajautuma.length === 0, ajautuma.slice(0, 4).join(', '));

  // Aikajanan veto vierityksessä: sivu ei vierity vedon aikana, osoitin liikkuu vapaasti.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(100);
  await p.click('#ala-nappi');
  const vv = await veto(0.2, 0.3, 40);
  tulos('aikajanan veto vierityksessä', vv.pysyi && vv.haamu && !vv.jalkeen.g && !vv.jalkeen.h && vv.jalkeen.y > vv.ennen.y && vv.xt.length > 2 && vv.xt.every((x, i) => !i || x > vv.xt[i - 1]),
    'scrollY ' + vv.ennen.y + ' → ' + Math.round(vv.jalkeen.y) + ', osoittimen paikkoja ' + vv.xt.length + ' / 40 askelta');

  tulos('ei sivuvirheitä', sivuvirheet.length === 0, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  process.exitCode = virheita ? 1 : 0;
});
