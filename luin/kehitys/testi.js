// Luinin selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/testi.js polku/teksti.md [kuvakansio]
// Käynnistää oman tiedostopalvelimen, syöttää tekstin Latomon tavoin (luin-tuonti → #tuo)
// ja mittaa: rakenteen, sivutuksen (leikkautuvat rivit), koon muutoksen paluun samaan
// kohtaan, alleviivauksen ja kirjauksen säilymisen, merkintöjen viennin, aikajanan hypyn, haun
// ja paluumajakan.
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

  // Tuonti: kirjanmerkki ja lukukohta keskimmäiseen lukuun, vienti edistymisen kanssa, merkinnät
  // tyhjiksi, tuonti tiedostonvalinnasta. Merkintöjen pitää palata samoihin kohtiin.
  const osio = await p.evaluate(() => {
    const L = window.__luin, n = L.nyt(), toc = n.doc.toc, i = Math.floor(toc.length / 2), h = toc[i];
    n.merk.km.push({ id: 'testikm', b: h.b + 1, o: 5, s: n.txt[h.b + 1].slice(5, 45), t: 1, osio: h.text });
    L.mene({ b: h.b + 1, o: 0 });
    return { a: h.b, z: toc[i + 1] ? toc[i + 1].b : 1e9, nimi: h.text, merk: JSON.stringify(n.merk) };
  });
  await p.waitForTimeout(300);
  await p.click('#lukija .ratas'); await p.click('#vienti summary'); await p.click('#vie-valinnat button[data-vie="vieEd"]');
  const [lataus2] = await Promise.all([p.waitForEvent('download'), p.click('#vie')]);
  const vienti2 = fs.readFileSync(await lataus2.path(), 'utf8');
  await p.evaluate(() => { const n = window.__luin.nyt(); localStorage.setItem('luin-merkit:' + n.e.id, '{}'); });
  await p.reload(); await p.waitForTimeout(500);
  await p.click('#lukija .ratas'); await p.click('#vienti summary');
  await p.setInputFiles('#tuo-tiedosto', { name: 'merkinnat.md', mimeType: 'text/markdown', buffer: Buffer.from(vienti2) });
  await p.waitForSelector('#vie-tieto button[data-siirry]');
  await p.evaluate(m => { window.__alkup = m; }, osio.merk);
  const vrt = await p.evaluate(() => {
    const m = window.__luin.nyt().merk, k = x => JSON.stringify({ al: x.al.map(h => [h.segs.map(s => [s.b, s.s, s.e]), h.n]), km: x.km.map(q => [q.b, q.o]) });
    return { tieto: document.querySelector('#vie-tieto').textContent, merkit: document.querySelectorAll('mark.ali').length, sama: k(m) === k(JSON.parse(window.__alkup)) };
  });
  await p.click('#vie-tieto button[data-siirry]'); await p.waitForTimeout(400);
  const perilla = (await tila()).a;
  tulos('merkintöjen tuonti', vrt.sama && vrt.merkit > 0 && vienti2.includes('Sijainti: ') && vienti2.includes(osio.nimi) && /<!-- kohta/.test(vienti2) &&
    perilla.b >= osio.a && perilla.b < osio.z, vrt.tieto + ' | siirtymä lohkoon ' + perilla.b + ' (' + osio.nimi + ')');

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

  // Haku: osumien määrä sama kuin riippumattomalla säännöllisellä lausekkeella (sanan alku,
  // fraasi peräkkäin, lainausmerkeissä kokonainen sana), ja osuman valinta vie sen sivulle ja
  // korostaa juuri sen; Enter vie seuraavaan.
  const haku = await p.evaluate(() => {
    const L = window.__luin, n = L.nyt(), K = '[\\p{L}\\p{N}\\p{M}]', v = [];
    const sanat = n.txt.map(t => t.match(/[\p{L}\p{N}\p{M}]+/gu) || []);
    // Fraasin sanat kolmanneksen jälkeisestä lohkosta, jonka neljännen sanan alku esiintyy ainakin kolmesti.
    const laske = re => n.txt.reduce((a, t) => a + (t.match(re) || []).length, 0);
    const b = sanat.findIndex((s, i) => i > n.txt.length / 3 && s.length > 8 && s[3].length >= 6 && s[4].length >= 4 &&
      laske(new RegExp('(?<!' + K + ')' + s[3].slice(0, 4), 'giu')) >= 3);
    const w = sanat[b];
    const kokeet = [
      [w[3].slice(0, 4), new RegExp('(?<!' + K + ')' + w[3].slice(0, 4), 'giu')],
      ['"' + w[3] + '"', new RegExp('(?<!' + K + ')' + w[3] + '(?!' + K + ')', 'giu')],
      [w[3] + ' ' + w[4].slice(0, 3), new RegExp('(?<!' + K + ')' + w[3] + K + '*[^\\p{L}\\p{N}\\p{M}]+' + w[4].slice(0, 3), 'giu')],
      ['”' + w[3] + '” ' + w[4], new RegExp('(?<!' + K + ')' + w[3] + '[^\\p{L}\\p{N}\\p{M}]+' + w[4], 'giu')]];
    kokeet.forEach(([q, re]) => { const a = L.etsi(q).n, c = laske(re); if (a !== c || !a) v.push(q + ': ' + a + ' ≠ ' + c); });
    return { v, q: w[3].slice(0, 4) };
  });
  await p.click('#etsi-avaa'); await p.keyboard.type(haku.q); await p.waitForTimeout(300);
  const osumia = await p.locator('#pop .osuma').count(), valittava = Math.min(2, osumia - 1);
  await p.click('#pop .osuma[data-i="' + valittava + '"]'); await p.waitForTimeout(150);
  const hv = await p.evaluate(i => {
    const L = window.__luin, h = L.nyt().haku, o = h.osumat[i], hl = CSS.highlights.get('haku'), r = hl && [...hl][0];
    const rr = r && r.getBoundingClientRect(), sv = document.querySelector('#sivu').getBoundingClientRect();
    return { kiinni: document.querySelector('#pop').hidden, teksti: r && r.toString().replace(/\u00ad/g, ''), odotus: L.nyt().txt[o.b].slice(o.s, o.e),
      nakyy: !!rr && rr.left >= sv.left && rr.right <= sv.right && rr.top >= sv.top && rr.bottom <= sv.bottom, kohta: L.tila.ankkuri.b === o.b && L.tila.ankkuri.o === o.s };
  }, valittava);
  await p.click('#etsi-avaa'); await p.waitForTimeout(100);
  const merkitty = await p.evaluate(() => document.querySelector('#pop .osuma[aria-current]')?.dataset.i);
  await p.click('#pop input'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const seur = await p.evaluate(() => window.__luin.nyt().haku.valittu);
  tulos('haku', !haku.v.length && hv.kiinni && hv.teksti === hv.odotus && hv.nakyy && hv.kohta && merkitty === String(valittava) && seur === (valittava + 1) % osumia,
    haku.v.join(', ') || haku.q + ': ' + osumia + ' osumaa, valittu ' + (valittava + 1) + '. näkyy ja on korostettu, Enter → ' + (seur + 1) + '.');

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
  // Sivutettuna välimuotoja ei ole (käyttäjän päätös 21.10.2026): osoitin pysähtyy vain tekstin
  // alkuun, otsikoihin, kirjanmerkkeihin, majakkaan ja voimassa olevaan kohtaan, myös kun
  // aikajanalla näkyvät vain pääluvut eikä kirjanmerkkejä.
  await p.evaluate(() => { const L = window.__luin; L.aset.janaTaso = 1; L.aset.kmJanalla = 0; L.mene({ b: 0, o: 0 }); });
  const vs = await veto(0.2, 0.3, 40);
  const pys = await p.evaluate(w => { const L = window.__luin, n = L.nyt(), o = k => (n.cum[k.b] + k.o) / n.total, a = [];
    a.push({ x: 13 + o({ b: 0, o: 0 }) * (w - 26), k: '0:0' });
    n.doc.toc.forEach(t => a.push({ x: 13 + o({ b: t.b, o: 0 }) * (w - 26), k: t.b + ':0', lvl: t.lvl }));
    n.merk.km.forEach(k => a.push({ x: 13 + o(k) * (w - 26), k: k.b + ':' + k.o }));
    L.aset.janaTaso = 2; L.aset.kmJanalla = 1;
    return a; }, vs.r.w);
  const pysakki = x => pys.find(s => Math.abs(s.x - x) < 0.01);
  const kvantti = vs.xt.every(pysakki), piilotettu = vs.xt.some(x => (pysakki(x) || {}).lvl > 1);
  const perille = pys.some(s => s.k === vs.jalkeen.a.b + ':' + vs.jalkeen.a.o);
  tulos('aikajanan veto sivutettuna', vs.pysyi && vs.haamu && kvantti && piilotettu && perille && !vs.jalkeen.g && !vs.jalkeen.h && vs.jalkeen.s !== vs.ennen.s,
    'sivu ' + (vs.ennen.s + 1) + ' → ' + (vs.jalkeen.s + 1) + ', osoittimen paikkoja ' + vs.xt.length + ' / 40 askelta' +
    (kvantti ? ', kaikki pysäkkejä' : ', EI pysäkkejä') + (piilotettu ? ', myös piilotettuja alalukuja' : ', ei piilotettuja alalukuja') + (perille ? ', irrotus pysäkille' : ', irrotus EI pysäkille'));

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

  // Aikajanan veto vierityksessä: sivu ei vierity vedon aikana, osoitin liikkuu vapaasti. Ensimmäiset
  // 6 px ovat napautusta, jolloin osoitin näyttää lähimmän merkin; sen jälkeen paikat kasvavat.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(100);
  await p.click('#ala-nappi');
  const vv = await veto(0.2, 0.3, 40);
  tulos('aikajanan veto vierityksessä', vv.pysyi && vv.haamu && !vv.jalkeen.g && !vv.jalkeen.h && vv.jalkeen.y > vv.ennen.y && vv.xt.length > 2 && vv.xt.slice(8).every((x, i, a) => !i || x > a[i - 1]),
    'scrollY ' + vv.ennen.y + ' → ' + Math.round(vv.jalkeen.y) + ', osoittimen paikkoja ' + vv.xt.length + ' / 40 askelta');

  // Napautus ja veto vierityksessä (käyttäjän päätökset 21.10.2026): napautus 5 px pääluvun merkin
  // vieressä vie otsikkoon, napautus ison tyhjän välin keskellä ja veto merkin viereen suhteelliseen kohtaan.
  const janaGeom = () => p.evaluate(() => { const L = window.__luin, n = L.nyt(), b = document.querySelector('#jana-svg').getBoundingClientRect(), w = b.width - 26;
    const ks = n.doc.toc.filter(t => t.lvl <= L.aset.janaTaso).map(t => ({ b: t.b, o: 0 })).concat(L.aset.kmJanalla ? n.merk.km.filter(k => !k.orpo) : []);
    const xs = [...new Set(ks.map(k => b.left + 13 + (n.cum[k.b] + k.o) / n.total * w))].sort((a, c) => a - c);
    return { l: b.left, y: b.top + 21, w, xs }; });
  const ero = g => p.evaluate(g => { const L = window.__luin, n = L.nyt(), a = L.tila.ankkuri;
    return { k: a.b + ':' + a.o, ero: g.l + 13 + (n.cum[a.b] + a.o) / n.total * g.w - g.x, kohta: document.querySelector('#ala-kohta').textContent }; }, g);
  // Vain pääluvut näkyvissä, jotta merkkien väliin jää tilaa (oppaassa alaluku seuraa päälukua heti).
  // Aiempien hyppyjen majakka poistetaan, ettei se voita napautusta painoarvollaan.
  await p.evaluate(() => { window.__luin.aset.janaTaso = 1; window.__luin.nyt().majakka = null; });
  let g = await janaGeom();
  // Pääluku, jonka lähin näkyvä naapurimerkki on yli 15 px päässä ja johon veto alusta on selvästi veto.
  const t3 = await p.evaluate(g => { const L = window.__luin, n = L.nyt(), X = t => g.l + 13 + n.cum[t.b] / n.total * g.w;
    const t = n.doc.toc.filter(x => x.lvl === 1).find(t => X(t) > g.l + 60 && g.xs.every(x => Math.abs(x - X(t)) < 0.01 || Math.abs(x - X(t)) > 15));
    return { b: t.b, text: t.text, x: X(t) }; }, g);
  const xt3 = t3.x;
  await p.mouse.click(xt3 + 5, g.y); await p.waitForTimeout(150);
  const napOtsikko = await ero({ ...g, x: xt3 });
  // Suurin väli näkyvien merkkien välillä (janan päät mukaan lukien); napautus sen keskelle.
  const rajat = [g.l + 13, ...g.xs, g.l + 13 + g.w]; let iso = 0;
  for (let i = 1; i < rajat.length - 1; i++) if (rajat[i + 1] - rajat[i] > rajat[iso + 1] - rajat[iso]) iso = i;
  const keski = (rajat[iso] + rajat[iso + 1]) / 2;
  await p.evaluate(() => { window.__luin.nyt().majakka = null; });
  await p.mouse.click(keski, g.y); await p.waitForTimeout(150);
  const napVali = await ero({ ...g, x: keski });
  // Edellinen napautus jätti majakan otsikkoon; se tarttuisi vetoon magneettina.
  await p.evaluate(() => { window.__luin.nyt().majakka = null; });
  await p.mouse.move(g.l + 20, g.y); await p.mouse.down();
  for (let i = 1; i <= 20; i++) { await p.mouse.move(g.l + 20 + (xt3 + 5 - g.l - 20) * i / 20, g.y); await p.waitForTimeout(15); }
  await p.mouse.up(); await p.waitForTimeout(150);
  const vetoVieri = await ero({ ...g, x: xt3 + 5 });
  await p.evaluate(() => { window.__luin.aset.janaTaso = 2; });
  tulos('aikajanan napautus ja veto vierityksessä', Math.abs(napOtsikko.ero) < 1 && Math.abs(napVali.ero) < 1.5 && Math.abs(vetoVieri.ero) < 1.5,
    'napautus 5 px merkin vieressä → ' + napOtsikko.kohta + ' (' + napOtsikko.k + ', ero merkkiin ' + napOtsikko.ero.toFixed(2) + ' px); välin (' + (rajat[iso + 1] - rajat[iso]).toFixed(0) + ' px) keskelle → ero ' + napVali.ero.toFixed(2) +
    ' px; veto merkin viereen → ero ' + vetoVieri.ero.toFixed(2) + ' px');

  // Paluumajakka (käyttäjän päätökset 21.10.2026). Tavallinen iso hyppy jättää majakan ilman laatikkoa,
  // eikä myöhempi iso hyppy tai paperin napautus siirrä tai sammuta sitä. Lähdeviittaus jättää laatikon,
  // joka pysyy vierityksessä ja hypyssä ja poistuu raksista (majakka jää) tai paperin napautuksesta.
  // Napautus kummitusmerkin lähellä ja veto sen viereen palaavat.
  const odota = t => p.waitForTimeout(t || 300);
  const mt = () => p.evaluate(() => { const m = window.__luin.majakka(); return { m: m && m.k.b + ':' + m.k.o, laatikko: !document.getElementById('majakka').hidden,
    kummitus: !!document.querySelector('#jana-svg .j-majakka'), y: scrollY, a: window.__luin.tila.ankkuri.b + ':' + window.__luin.tila.ankkuri.o }; });
  const paperi = async () => { const r = await p.evaluate(() => { for (let y = 150; y < innerHeight - 150; y += 20) for (const x of [60, 120, 200]) {
      const e = document.elementFromPoint(x, y); if (e && e.closest('#teksti') && !e.closest('a, .fnref, .km, mark, .sidenote')) return { x, y }; } });
    await p.mouse.click(r.x, r.y); await odota(); };
  const nB = await p.evaluate(() => { window.__luin.nyt().majakka = null; return window.__luin.nyt().blocks.length; });
  await odota(); await p.evaluate(() => window.scrollTo(0, 1234)); await odota();
  const lahto = await mt();
  await p.evaluate(n => window.__luin.hyppaa({ b: n - 1, o: 0 }), nB); await odota();
  const m1 = await mt();
  await p.evaluate(n => window.__luin.hyppaa({ b: Math.floor(n / 2), o: 0 }), nB); await odota();
  const m2 = await mt();
  await paperi();
  const m3 = await mt();
  // Napautus 6 px kummitusmerkin vieressä (lähimmästä näkyvästä merkistä poispäin) palaa.
  g = await janaGeom();
  const xm = g.l + 13 + await p.evaluate(() => { const L = window.__luin, n = L.nyt(), k = L.majakka().k; return (n.cum[k.b] + k.o) / n.total; }) * g.w;
  const naapuri = g.xs.reduce((a, x) => Math.abs(x - xm) > 0.01 && Math.abs(x - xm) < Math.abs(a - xm) ? x : a, Infinity);
  await p.mouse.click(xm + (naapuri > xm ? -6 : 6), g.y); await odota();
  const m4 = await mt();
  tulos('paluumajakka ilman laatikkoa', m1.m === lahto.a && !m1.laatikko && m1.kummitus && m2.m === lahto.a && m3.m === lahto.a && !m4.m && m4.a === lahto.a && Math.abs(m4.y - lahto.y) < 2,
    JSON.stringify({ lahto: lahto.a, m1, m2, m3, m4 }));
  // Lähdeviittaus (hyppaa(k, true) kuten kirjallisuusluetteloon vievä linkki), myös lyhyt hyppy.
  await p.evaluate(() => window.scrollTo(0, 3000)); await odota();
  const lahto2 = await mt();
  await p.evaluate(() => window.__luin.hyppaa({ b: window.__luin.tila.ankkuri.b + 3, o: 0 }, true)); await odota();
  const k1 = await mt();
  await p.evaluate(() => window.scrollBy(0, 2 * innerHeight)); await odota();
  await p.evaluate(n => window.__luin.hyppaa({ b: n - 1, o: 0 }), nB); await odota();
  const k2 = await mt();
  await p.click('#majakka-sulje'); await odota();
  const k3 = await mt();
  // Veto kummitusmerkin viereen (8 px) tarttuu siihen ja palaa.
  g = await janaGeom();
  const xm2 = g.l + 13 + await p.evaluate(() => { const L = window.__luin, n = L.nyt(), k = L.majakka().k; return (n.cum[k.b] + k.o) / n.total; }) * g.w;
  await p.mouse.move(g.l + g.w, g.y); await p.mouse.down();
  for (let i = 1; i <= 20; i++) { await p.mouse.move(g.l + g.w + (xm2 + 8 - g.l - g.w) * i / 20, g.y); await p.waitForTimeout(15); }
  await p.mouse.up(); await odota();
  const k4 = await mt();
  await p.evaluate(n => window.__luin.hyppaa({ b: n - 1, o: 0 }, true), nB); await odota();
  await paperi();
  const k5 = await mt();
  tulos('paluumajakka lähdeviittauksesta', k1.laatikko && k1.m === lahto2.a && k2.laatikko && k2.m === lahto2.a && !k3.laatikko && k3.m === lahto2.a && k3.kummitus &&
    !k4.m && k4.a === lahto2.a && !k5.laatikko && !!k5.m, JSON.stringify({ k1, k2, k3, k4, k5 }));
  const lahdeLinkki = await p.evaluate(() => !!document.querySelector('#teksti a.lahde'));
  if (lahdeLinkki) {
    await p.evaluate(() => { window.__luin.nyt().majakka = null; document.querySelector('#teksti a.lahde').scrollIntoView({ block: 'center' }); }); await odota();
    await p.evaluate(() => document.querySelector('#teksti a.lahde').click()); await odota();
    const k6 = await mt();
    tulos('lähdeviittauslinkki näyttää laatikon', k6.laatikko && !!k6.m, JSON.stringify(k6));
  }
  // Sivutettuna reunan napautus kääntää sivua eikä sulje laatikkoa; keskikolmanneksen napautus sulkee.
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.sivutus = 'sivut'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await p.reload(); await odota(400);
  await p.evaluate(() => { window.__luin.mene(window.__luin.sivunAlku(4)); window.__luin.hyppaa(window.__luin.sivunAlku(8), true); }); await odota();
  const s1 = await mt(), sv = await p.evaluate(() => window.__luin.tila.sivu);
  await p.mouse.click(390, 400); await odota();
  const s2 = await mt(), sv2 = await p.evaluate(() => window.__luin.tila.sivu);
  await p.mouse.click(206, 400); await odota();
  const s3 = await mt();
  tulos('laatikko sivutettuna', s1.laatikko && s2.laatikko && sv2 === sv + 1 && !s3.laatikko && !!s3.m, 'sivu ' + (sv + 1) + ' → ' + (sv2 + 1) + ', ' + JSON.stringify({ s1, s2, s3 }));

  tulos('ei sivuvirheitä', sivuvirheet.length === 0, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  process.exitCode = virheita ? 1 : 0;
});
