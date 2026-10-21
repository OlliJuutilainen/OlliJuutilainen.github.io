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
  await kuva('1-alku');

  // Sivutus: yksikään näkyvän sivun rivi ei saa ulottua sivualueen alle.
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.sivutus = 'sivut'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
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

  tulos('ei sivuvirheitä', sivuvirheet.length === 0, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  process.exitCode = virheita ? 1 : 0;
});
