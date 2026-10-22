// Luinin selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/testi.js polku/teksti.md [kuvakansio]
// Käynnistää oman tiedostopalvelimen, syöttää tekstin Latomon tavoin (luin-tuonti → #tuo)
// ja mittaa: rakenteen, sivutuksen (leikkautuvat rivit), koon muutoksen paluun samaan
// kohtaan, alleviivauksen ja kirjauksen säilymisen, merkintöjen viennin, aikajanan hypyn, haun,
// paluumajakan ja palkit (mobiili 412 ja 360 px, työpöytä 1280 px).
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
  // Mobiilissa (412 px) palkit ovat piilossa, kunnes ne avataan; avaus vain, jos ne ovat kiinni.
  const avaaPalkit = async () => { if (await p.evaluate(() => document.querySelector('#jana').hidden)) await p.click('#ala-nappi'); };
  const asetukset = async () => { await avaaPalkit(); await p.click('#lukija .ratas'); };

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
  // Jokainen alaviitteen lähdeviittaus osoittaa kirjallisuusluettelon kohtaan tai lyhenteen selitykseen.
  const lv = await p.evaluate(() => { const a = [...document.querySelectorAll('a.lahde')];
    const ok = k => k && (k.classList.contains('bib') || /^lyh-/.test(k.id) && k.closest('#teksti'));
    return { n: a.length, lyh: a.filter(x => /^#lyh-/.test(x.getAttribute('href'))).length, rikki: a.filter(x => !ok(document.getElementById(x.getAttribute('href').slice(1)))).length }; });
  tulos('lähdeviittaukset', lv.rikki === 0, JSON.stringify(lv));
  await kuva('1-alku');

  // Sivutus: yksikään näkyvän sivun rivi ei saa ulottua sivualueen alle. Valikon alleviivausta
  // varten sukkela alleviivaus pois (oletus on päällä).
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
  await asetukset();
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

  // Sukkela alleviivaus: valinta muuttuu heti alleviivaukseksi, mutta ei silloin, kun
  // alleviivaukset on piilotettu tekstistä. Piilotettuina niillä ei ole näkyvää viivaa.
  const autoAli = await p.evaluate(() => {
    const L = window.__luin, a = L.aset, valitse = () => {
      const el = [...document.querySelectorAll('#teksti p[data-b]')].find(x => x.textContent.length > 120 && x.getBoundingClientRect().width && !x.querySelector('mark'));
      const t = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
      const q = document.createRange(); q.setStart(t, 2); q.setEnd(t, Math.min(t.length, 40));
      getSelection().removeAllRanges(); getSelection().addRange(q); L.valinta();
    };
    const n0 = L.nyt().merk.al.length;
    a.auto = 1; document.querySelector('#pop').hidden = true; valitse(); const n1 = L.nyt().merk.al.length;
    const popAuto = !document.querySelector('#pop').hidden;
    document.querySelector('#pop').hidden = true;
    a.alTekstissa = 0; document.documentElement.classList.add('ali-piilo'); valitse(); const n2 = L.nyt().merk.al.length;
    const viiva = getComputedStyle(document.querySelector('mark.ali')).textDecorationLine;
    getSelection().removeAllRanges(); document.querySelector('#pop').hidden = true;
    L.nyt().merk.al.pop(); a.auto = 0; a.alTekstissa = 1; document.documentElement.classList.remove('ali-piilo');
    return { n0, n1, n2, viiva, popAuto };
  });
  tulos('sukkela alleviivaus', autoAli.n1 === autoAli.n0 + 1 && autoAli.n2 === autoAli.n1 && autoAli.viiva === 'none' && !autoAli.popAuto, JSON.stringify(autoAli));

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
  await asetukset(); await p.click('#vie-osio summary');
  await p.click('#vie');
  const vahv = await p.textContent('#pop .esi');
  const [lataus] = await Promise.all([p.waitForEvent('download'), p.click('#pop button[data-k="ok"]')]);
  const vienti = fs.readFileSync(await lataus.path(), 'utf8');
  await p.click('#asetukset .sulje');
  tulos('kirjaus ja vienti', /\n> .+\n\nTestikirjaus\n/.test(vienti) && !/KIRJANMERKKI/.test(vienti) && / alleviivaukset ja kirjaukset\. Kirjanmerkkejä ja edistymisen tilannetta ei viedä\.$/.test(vahv),
    lataus.suggestedFilename() + ', ' + vienti.split('\n').length + ' riviä | ' + vahv);

  // Tuonti: kirjanmerkki ja lukukohta keskimmäiseen lukuun, vienti edistymisen kanssa, merkinnät
  // tyhjiksi, tuonti tiedostonvalinnasta. Merkintöjen pitää palata samoihin kohtiin.
  const osio = await p.evaluate(() => {
    const L = window.__luin, n = L.nyt(), toc = n.doc.toc, i = Math.floor(toc.length / 2), h = toc[i];
    n.merk.km.push({ id: 'testikm', b: h.b + 1, o: 5, s: n.txt[h.b + 1].slice(5, 45), t: 1, osio: h.text });
    L.mene({ b: h.b + 1, o: 0 });
    return { a: h.b, z: toc[i + 1] ? toc[i + 1].b : 1e9, nimi: h.text, merk: JSON.stringify(n.merk) };
  });
  await p.waitForTimeout(300);
  await asetukset(); await p.click('#vie-osio summary');
  await p.click('#vie-valinnat button[data-vie="vieKm"]'); await p.click('#vie-valinnat button[data-vie="vieEd"]');
  await p.click('#vie');
  const [lataus2] = await Promise.all([p.waitForEvent('download'), p.click('#pop button[data-k="ok"]')]);
  const vienti2 = fs.readFileSync(await lataus2.path(), 'utf8');
  await p.evaluate(() => { const n = window.__luin.nyt(); localStorage.setItem('luin-merkit:' + n.e.id, '{}'); });
  await p.reload(); await p.waitForTimeout(500);
  // Osittainen tuonti: kirjanmerkit ja edistymisen tilanne pois. Vahvistus kertoo, mitä jätetään
  // huomiotta, ja tiedostosta tulevat vain alleviivaukset ja kirjaukset.
  await asetukset(); await p.click('#tuo-osio summary');
  await p.click('#tuo-valinnat button[data-tuo="km"]'); await p.click('#tuo-valinnat button[data-tuo="ed"]');
  await p.click('#tuo');
  const vahv2 = await p.textContent('#pop .esi');
  const [valitsin] = await Promise.all([p.waitForEvent('filechooser'), p.click('#pop button[data-k="ok"]')]);
  await valitsin.setFiles({ name: 'merkinnat.md', mimeType: 'text/markdown', buffer: Buffer.from(vienti2) });
  await p.waitForFunction(() => document.querySelector('#tuo-tieto').textContent);
  const osit = await p.evaluate(() => { const m = window.__luin.nyt().merk;
    return { al: m.al.length, km: m.km.length, siirry: !!document.querySelector('#tuo-tieto button[data-siirry]'), tieto: document.querySelector('#tuo-tieto').textContent }; });
  tulos('osittainen tuonti', osit.al > 0 && osit.km === 0 && !osit.siirry &&
    vahv2 === 'Olet tuomassa tiedostosta alleviivaukset ja kirjaukset. Tiedoston mahdollisia kirjanmerkkejä ja edistymisen tilannetta ei tuoda.',
    JSON.stringify(osit) + ' | ' + vahv2);
  // Ilman valintoja nappia ei voi painaa.
  const pois = await p.evaluate(() => {
    const paina = (s, pois) => { let b; while ((b = [...document.querySelectorAll(s + ' button[aria-pressed="true"]')].find(x => !pois.includes(x.dataset.vie)))) b.click(); };
    paina('#tuo-valinnat', []); paina('#vie-valinnat', ['vieEd']);
    const r = { tuo: document.querySelector('#tuo').disabled, vie: document.querySelector('#vie').disabled,
      vieEd: document.querySelector('#vie-valinnat button[data-vie="vieEd"]').getAttribute('aria-pressed') };
    document.querySelector('#vie-valinnat button[data-vie="vieAl"]').click(); document.querySelector('#vie-valinnat button[data-vie="vieKi"]').click();
    r.palautettu = !document.querySelector('#vie').disabled;
    return r; });
  tulos('napit pois ilman valintoja', pois.tuo && pois.vie && pois.vieEd === 'true' && pois.palautettu, JSON.stringify(pois));
  await p.evaluate(() => { const n = window.__luin.nyt(); localStorage.setItem('luin-merkit:' + n.e.id, '{}'); });
  await p.reload(); await p.waitForTimeout(500);
  // Kaikki valittuna (oletus avattaessa) tuonti ei kysy vahvistusta vaan avaa tiedostonvalinnan.
  await asetukset(); await p.click('#tuo-osio summary');
  const [valitsin2] = await Promise.all([p.waitForEvent('filechooser'), p.click('#tuo')]);
  const popAuki = await p.isVisible('#pop');
  await valitsin2.setFiles({ name: 'merkinnat.md', mimeType: 'text/markdown', buffer: Buffer.from(vienti2) });
  await p.waitForSelector('#tuo-tieto button[data-siirry]');
  tulos('tuonti ilman vahvistusta', !popAuki);
  await p.evaluate(m => { window.__alkup = m; }, osio.merk);
  const vrt = await p.evaluate(() => {
    const m = window.__luin.nyt().merk, k = x => JSON.stringify({ al: x.al.map(h => [h.segs.map(s => [s.b, s.s, s.e]), h.n]), km: x.km.map(q => [q.b, q.o]) });
    return { tieto: document.querySelector('#tuo-tieto').textContent, merkit: document.querySelectorAll('mark.ali').length, sama: k(m) === k(JSON.parse(window.__alkup)) };
  });
  // Kuittaus peittää Tuo-napin, ja sen kyltti vie tuotuun sijaintiin.
  const kuittaus = await p.evaluate(() => {
    const pop = document.querySelector('#pop'), r = pop.getBoundingClientRect(), t = document.querySelector('#tuo').getBoundingClientRect();
    const keski = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
    return { auki: !pop.hidden && pop.classList.contains('tuotu'), peittaa: pop.contains(keski), ots: pop.querySelector('.t-ots').textContent,
      kyltti: !!pop.querySelector('button.kyltti'), r: [r.left, r.top, r.width, r.height].map(Math.round) };
  });
  tulos('tuonnin kuittaus', kuittaus.auki && kuittaus.peittaa && kuittaus.ots === 'Merkinnät tuotu' && kuittaus.kyltti, JSON.stringify(kuittaus));
  await kuva('tuonnin-kuittaus');
  await p.click('#pop button.kyltti'); await p.waitForTimeout(400);
  const perilla = (await tila()).a;
  tulos('merkintöjen tuonti', vrt.sama && vrt.merkit > 0 && vienti2.includes('Sijainti: ') && vienti2.includes(osio.nimi) && /<!-- kohta/.test(vienti2) &&
    perilla.b >= osio.a && perilla.b < osio.z, vrt.tieto + ' | siirtymä lohkoon ' + perilla.b + ' (' + osio.nimi + ')');

  // Aikajana: viimeisen pääluvun merkki vie sen otsikkoon.
  await avaaPalkit();
  const kohde = await p.evaluate(() => {
    const t = window.__luin.nyt().doc.toc.filter(x => x.lvl === 1).pop();
    const g = [...document.querySelectorAll('#jana-svg g')].find(x => x.textContent === t.text);
    const bb = g.getBoundingClientRect(); return { x: bb.left + bb.width / 2, y: bb.top + bb.height / 2, nimi: t.text };
  });
  await p.mouse.click(kohde.x, kohde.y); await p.waitForTimeout(150);
  tulos('aikajanan hyppy', (await p.textContent('#jana-kohta')) === kohde.nimi, kohde.nimi);
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
    // Alaviitteet mukaan: osumia on lisäksi alaviitteiden teksteissä (ilman numeroa ja tavuviivoja).
    const viit = [...document.querySelectorAll('#teksti .sidenote')].map(s => { const c = s.cloneNode(true); c.querySelector('.fnnum')?.remove(); return c.textContent.replace(/\u00ad/g, ''); });
    const laskeV = re => viit.reduce((a, t) => a + (t.match(re) || []).length, 0);
    kokeet.forEach(([q, re]) => { const a = L.etsi(q, 1).n, c = laske(re) + laskeV(re); if (a !== c) v.push(q + ' (alaviitteet): ' + a + ' ≠ ' + c); });
    return { v, q: w[3].slice(0, 4) };
  });
  await p.click('#etsi-avaa'); await p.keyboard.type(haku.q); await p.waitForTimeout(300);
  const osumia = await p.locator('#pop .osuma').count(), valittava = Math.min(2, osumia - 1);
  await p.click('#pop .osuma[data-i="' + valittava + '"]'); await p.waitForTimeout(150);
  const hv = await p.evaluate(i => {
    const L = window.__luin, h = L.nyt().haku, o = h.osumat[i], hl = CSS.highlights.get('haku'), r = hl && [...hl][0];
    const rr = r && r.getBoundingClientRect(), sv = document.querySelector('#sivu').getBoundingClientRect();
    return { kiinni: document.querySelector('#pop').hidden, teksti: r && r.toString().replace(/\u00ad/g, ''), odotus: o.n ? null : L.nyt().txt[o.b].slice(o.s, o.e),
      nakyy: !!rr && rr.left >= sv.left && rr.right <= sv.right && rr.top >= sv.top && rr.bottom <= sv.bottom, kohta: L.tila.ankkuri.b === o.b && L.tila.ankkuri.o === o.a, viite: !!o.n };
  }, valittava);
  await p.click('#etsi-avaa'); await p.waitForTimeout(100);
  const merkitty = await p.evaluate(() => document.querySelector('#pop .osuma[aria-current]')?.dataset.i);
  await p.click('#pop input'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const seur = await p.evaluate(() => window.__luin.nyt().haku.valittu);
  tulos('haku', !haku.v.length && !hv.viite && hv.kiinni && hv.teksti === hv.odotus && hv.nakyy && hv.kohta && merkitty === String(valittava) && seur === (valittava + 1) % osumia,
    haku.v.join(', ') || haku.q + ': ' + osumia + ' osumaa, valittu ' + (valittava + 1) + '. näkyy ja on korostettu, Enter → ' + (seur + 1) + '.');

  // Alaviitteen osuma sivutettuna: sanalle, jota on vain alaviitteissä, valinta avaa alaviitteen
  // ponnahduslaatikkoon viitenumeron sivulla ja korostaa osuman siinä. Kytkin alaviitteet pois
  // poistaa osumat ja tallentuu; takaisin päälle palauttaa ne.
  await p.evaluate(() => document.body.click()); await p.waitForTimeout(100);
  const vq = await p.evaluate(() => {
    const L = window.__luin, n = L.nyt();
    for (const s of document.querySelectorAll('#teksti .sidenote')) {
      const c = s.cloneNode(true); c.querySelector('.fnnum')?.remove();
      for (const w of c.textContent.replace(/\u00ad/g, '').match(/[\p{L}]{8,}/gu) || []) if (!L.etsi(w).n && L.etsi(w, 1).n) return w;
    }
  });
  await p.click('#etsi-avaa'); await p.fill('#pop input', vq); await p.waitForTimeout(300);
  await p.click('#pop .osuma[data-i="0"]'); await p.waitForTimeout(200);
  const va = await p.evaluate(() => {
    const L = window.__luin, h = L.nyt().haku, o = h.osumat[0], pop = document.querySelector('#pop'), hl = CSS.highlights.get('haku'), r = hl && [...hl][0];
    const rr = r && r.getBoundingClientRect(), pr = pop.getBoundingClientRect(), fn = document.querySelector('#teksti label.fnref[for="fn' + o.n + '"]').getBoundingClientRect();
    const sv = document.querySelector('#sivu').getBoundingClientRect();
    return { n: o.n, viite: !pop.hidden && pop.classList.contains('viite'), teksti: r && r.toString().replace(/\u00ad/g, ''),
      sisalla: !!rr && pop.contains(r.startContainer) && rr.top >= pr.top && rr.bottom <= pr.bottom, fnSivulla: fn.left >= sv.left && fn.right <= sv.right };
  });
  await p.evaluate(() => document.body.click()); await p.waitForTimeout(100);
  await p.click('#etsi-avaa'); await p.click('#pop .h-viit'); await p.waitForTimeout(200);
  const vk = await p.evaluate(() => ({ osumia: document.querySelectorAll('#pop .osuma').length, painettu: document.querySelector('#pop .h-viit').getAttribute('aria-pressed'),
    tallessa: JSON.parse(localStorage.getItem('luin-asetukset')).hakuViit, auki: !document.querySelector('#pop').hidden }));
  await p.click('#pop .h-viit'); await p.waitForTimeout(200);
  const vk2 = await p.locator('#pop .osuma').count();
  await p.evaluate(() => document.body.click());
  tulos('alaviitehaku', va.viite && va.teksti && va.teksti.toLowerCase() === vq.toLowerCase() && va.sisalla && va.fnSivulla && vk.osumia === 0 && vk.painettu === 'false' && vk.tallessa === 0 && vk.auki && vk2 > 0,
    vq + ': alaviite ' + va.n + ' ponnahduslaatikossa, korostus ' + JSON.stringify(va.teksti) + (va.sisalla ? ' laatikossa' : ' EI laatikossa') + '; kytkin pois → ' + vk.osumia + ' osumaa, päälle → ' + vk2 + '.');

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
    await asetukset(); await p.click('#asetukset [data-a="kappale"] button[data-arvo="' + kpl + '"]');
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

  // Alaviitteen osuma vierityksessä: kapealla ruudulla alaviite avautuu tekstin sisään, ja sekä
  // viitenumero että korostettu osuma ovat yläpalkin ja alapalkin välissä.
  await avaaPalkit(); await p.waitForTimeout(150);
  await p.click('#etsi-avaa'); await p.fill('#pop input', vq); await p.waitForTimeout(300);
  await p.click('#pop .osuma[data-i="0"]'); await p.waitForTimeout(200);
  const vav = await p.evaluate(() => {
    const L = window.__luin, o = L.nyt().haku.osumat[0], hl = CSS.highlights.get('haku'), r = hl && [...hl][0], rr = r && r.getBoundingClientRect();
    const yla = document.querySelector('.ylapalkki').getBoundingClientRect().bottom, ala = document.querySelector('#ala').getBoundingClientRect().top;
    const fn = document.querySelector('#teksti label.fnref[for="fn' + o.n + '"]').getBoundingClientRect(), huom = document.querySelector('#teksti .sidenote[data-n="' + o.n + '"]');
    return { auki: document.querySelector('#fn' + o.n).checked && getComputedStyle(huom).display === 'block', korostus: !!r && huom.contains(r.startContainer),
      nakyy: !!rr && rr.top >= yla && rr.bottom <= ala, fn: fn.top >= yla && fn.bottom <= ala, y: rr && [Math.round(fn.top), Math.round(rr.top), Math.round(ala)] };
  });
  tulos('alaviitehaku vierityksessä', vav.auki && vav.korostus && vav.nakyy && vav.fn, JSON.stringify(vav));
  await p.reload(); await p.waitForTimeout(400);

  // Aikajanan veto vierityksessä: sivu ei vierity vedon aikana, osoitin liikkuu vapaasti.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(100);
  await avaaPalkit();
  const vv = await veto(0.2, 0.3, 40);
  tulos('aikajanan veto vierityksessä', vv.pysyi && vv.haamu && !vv.jalkeen.g && !vv.jalkeen.h && vv.jalkeen.y > vv.ennen.y && vv.xt.length > 2 && vv.xt.every((x, i) => !i || x > vv.xt[i - 1]),
    'scrollY ' + vv.ennen.y + ' → ' + Math.round(vv.jalkeen.y) + ', osoittimen paikkoja ' + vv.xt.length + ' / 40 askelta');

  // Vierityksessä ei ole magneettia: napautus 5 px pääluvun merkin oikealla puolella vie
  // suhteelliseen kohtaan eikä otsikkoon.
  const mg = await p.evaluate(() => { const L = window.__luin, n = L.nyt(), t = n.doc.toc.filter(x => x.lvl === 1)[3];
    const b = document.querySelector('#jana-svg').getBoundingClientRect(), w = b.width - 26;
    return { x: b.left + 13 + (n.cum[t.b] / n.total) * w + 5, y: b.top + 21, b: t.b, w }; });
  await p.mouse.click(mg.x, mg.y); await p.waitForTimeout(150);
  const mgA = await p.evaluate(m => { const L = window.__luin, n = L.nyt(), a = L.tila.ankkuri, r = document.querySelector('#jana-svg').getBoundingClientRect();
    return { k: a.b + ':' + a.o, ero: r.left + 13 + (n.cum[a.b] + a.o) / n.total * m.w - m.x }; }, mg);
  tulos('ei magneettia vierityksessä', mgA.k !== mg.b + ':0' && Math.abs(mgA.ero) < 1.5, 'otsikko ' + mg.b + ':0, perillä ' + mgA.k + ', ero napautukseen ' + mgA.ero.toFixed(2) + ' px');

  // Paluumajakka: iso hyppy jättää majakan, paluu vie samaan kohtaan ja poistaa sen, pieni hyppy ei jätä.
  const mj = await p.evaluate(async () => {
    const L = window.__luin, n = L.nyt().blocks.length, nakyy = () => !document.getElementById('majakka').hidden;
    const odota = () => new Promise(r => setTimeout(r, 300));
    // Edellisen hypyn hiljainen jakso (250 ms) ohittaisi vierityksen, jolloin ankkuri jäisi vanhaksi.
    await odota(); window.scrollTo(0, 1000); await odota();
    const a = Object.assign({}, L.tila.ankkuri), y = scrollY;
    L.hyppaa({ b: n - 1, o: 0 }); await odota();
    const iso = nakyy();
    // Lähtökohta jäi taakse: nuoli ylös.
    const ylos = document.getElementById('majakka').classList.contains('ylos');
    document.getElementById('majakka-palaa').click(); await odota();
    const takaisin = L.tila.ankkuri.b === a.b && L.tila.ankkuri.o === a.o && Math.abs(scrollY - y) < 2 && !nakyy();
    L.hyppaa({ b: a.b + 1, o: 0 }); await odota();
    const pieni = !nakyy();
    // Alle puolen kirjan mittainen hyppy ei jätä majakkaa (22.10.2026), vaikka olisi monta ruudullista.
    const N = L.nyt(), puoli = N.cum.findIndex(c => c / N.total >= 0.3);
    window.scrollTo(0, 0); await odota(); await odota();
    L.hyppaa({ b: puoli, o: 0 }); await odota();
    const alle50 = !nakyy();
    return { iso, ylos, takaisin, pieni, alle50 };
  });
  tulos('paluumajakka', mj.iso && mj.ylos && mj.takaisin && mj.pieni && mj.alle50, JSON.stringify(mj));

  // Sisällysluettelon linkki ei jätä majakkaa, vaikka vie kirjan loppuun (22.10.2026).
  const sl = await p.evaluate(async () => {
    const L = window.__luin, odota = () => new Promise(r => setTimeout(r, 300)), nav = [...document.querySelectorAll('nav.sisallys a[data-go]')];
    if (!nav.length) return { ohitettu: true };
    window.scrollTo(0, 0); await odota(); await odota();
    nav[nav.length - 1].click(); await odota();
    return { linkkeja: nav.length, siirtyi: scrollY > 2 * innerHeight, majakka: !document.getElementById('majakka').hidden };
  });
  tulos('sisällysluettelo ei jätä majakkaa', sl.ohitettu || sl.siirtyi && !sl.majakka, JSON.stringify(sl));

  // Alaviitteen lyhennelinkki (md.js, viittaukset()) vie lyhenteen selitykseen; lähtökohta on edempänä,
  // joten nuoli osoittaa alas, ja paluu vie takaisin.
  const ly = await p.evaluate(async () => {
    const L = window.__luin, odota = () => new Promise(r => setTimeout(r, 300));
    const linkit = [...document.querySelectorAll('#teksti a.lahde[href^="#lyh-"]')];
    if (!linkit.length) return { ohitettu: true };
    const a = linkit[linkit.length - 1], kohde = document.getElementById(a.getAttribute('href').slice(1));
    const b0 = +a.closest('[data-b]').dataset.b;
    L.hyppaa({ b: b0, o: 0 }); await odota();
    a.click(); await odota();
    const mj = document.getElementById('majakka'), perilla = L.tila.ankkuri.b === +kohde.dataset.b;
    const alas = !mj.hidden && !mj.classList.contains('ylos');
    document.getElementById('majakka-palaa').click(); await odota();
    return { linkkeja: linkit.length, perilla, alas, takaisin: L.tila.ankkuri.b === b0 };
  });
  tulos('lyhennelinkki', ly.ohitettu || ly.perilla && ly.alas && ly.takaisin, JSON.stringify(ly));

  // Palkit (käyttäjän päätökset 22.10.2026). Mobiilissa (kosketusnäyttö, 412 px) yläpalkki ja aikajanakerros ovat
  // piilossa, ja alakaistan napautus avaa ja sulkee ne yhdessä; tekstin napautus, vieritys ja sivunkääntö eivät
  // vaikuta niihin. Kirjanmerkki ja palkkinuoli kelluvat kaistalla tekstipalstan reunojen linjassa, sivunapit (jos
  // valittu) nuolen vasemmalla puolella. Sivutettuna reunat kääntävät sivua. Palkkien avaus ei poista paluumajakkaa.
  const m = await (await b.newContext({ viewport: { width: 412, height: 824 }, hasTouch: true })).newPage();
  m.on('pageerror', e => sivuvirheet.push(e.message));
  await m.goto(BASE + 'luin.html');
  // av 4 ja sivunapit päällä: vanha tallennus, jossa sivunapit olivat oletuksena päällä (av 5 kytkee ne pois).
  await m.evaluate(md => { localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify({ av: 4, sivunapit: 1 })); }, MD);
  await m.goto(BASE + 'luin.html#tuo'); await m.waitForTimeout(600);
  await m.reload(); await m.waitForTimeout(400);
  const siirto = await m.evaluate(() => ({ sivunapit: window.__luin.aset.sivunapit, av: window.__luin.aset.av }));
  tulos('sivunapit pois oletuksista (av 5)', siirto.sivunapit === 0 && siirto.av === 5, JSON.stringify(siirto));
  // Kaistan napautus nuolen kohdalta (koko kaista on nappi; nuoli ei ota napautuksia).
  const nuoliKohta = () => m.evaluate(() => { const r = document.querySelector('#palkki-nuoli').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const kaista = async () => { const k = await nuoliKohta(); await m.mouse.click(k.x, k.y); await m.waitForTimeout(100); };
  const avaaPalkitM = async () => { if (await m.evaluate(() => document.querySelector('#jana').hidden)) await kaista(); };
  const asetuksetM = async () => { await avaaPalkitM(); await m.click('#lukija .ratas'); };
  const palkit = () => m.evaluate(() => { const n = getComputedStyle(document.querySelector('#palkki-nuoli'));
    return { yla: getComputedStyle(document.querySelector('.ylapalkki')).display !== 'none',
      jana: !document.querySelector('#jana').hidden, s: window.__luin.tila.sivu, alas: n.transform !== 'none', tayte: n.fill }; });
  await m.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.sivutus = 'vieritys'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await m.reload(); await m.waitForTimeout(400);
  await m.evaluate(() => { window.__luin.mene({ b: 30, o: 0 }); }); await m.waitForTimeout(300);
  const pv0 = await palkit();
  const keski = { x: 206, y: 300 };
  await m.mouse.click(keski.x, keski.y); await m.waitForTimeout(100);
  const pvT = await palkit();
  await kaista();
  const pv1 = await palkit();
  await m.mouse.click(keski.x, keski.y); await m.waitForTimeout(100);
  const pv1b = await palkit();
  await kaista();
  const pv2 = await palkit();
  await kaista();
  await m.mouse.wheel(0, 400); await m.waitForTimeout(200);
  const pv3 = await palkit();
  await kaista();
  await m.mouse.wheel(0, 400); await m.waitForTimeout(200);
  const pv4 = await palkit();
  tulos('mobiilin palkit vierityksessä', !pv0.yla && !pv0.jana && !pvT.jana && pv1.yla && pv1.jana && pv1b.jana && !pv2.yla && !pv2.jana && pv3.jana && !pv4.jana && !pv4.yla,
    [pv0, pvT, pv1, pv1b, pv2, pv3, pv4].map(x => (x.yla ? 'Y' : '-') + (x.jana ? 'J' : '-')).join(' → '));
  tulos('palkkinuoli kääntyy ja täyttyy', !pv0.alas && pv0.tayte === 'none' && pv1.alas && pv1.tayte !== 'none' && !pv2.alas && pv2.tayte === 'none',
    JSON.stringify([pv0, pv1, pv2].map(x => [x.alas, x.tayte])));
  // Kelluvat palstan linjassa (musteen reunat) ja Merkinnät/Etsi niiden välissä.
  const linja = async () => { await avaaPalkitM(); await m.waitForTimeout(100); return m.evaluate(() => {
    const q = s => document.querySelector(s).getBoundingClientRect(), art = document.querySelector('#teksti'), sv = q('#sivu');
    // Sivutettuna #teksti on palstojen levyinen ja siirretty; näkyvä palsta on #sivu + marginLeft, leveys style.width.
    const t = document.body.classList.contains('sivutus') ? { left: sv.left + parseFloat(art.style.marginLeft), right: sv.left + parseFloat(art.style.marginLeft) + parseFloat(art.style.width) } : q('#teksti'), km = q('#km-nappi svg'), n = q('.jana-napit'), sn = document.querySelector('#sivunapit');
    // Nuolen viewBox on musteen rajat viivan ulkoreunoineen, kuten kirjanmerkin: laatikon reuna = musteen reuna.
    const nu = q('#palkki-nuoli'), snr = sn.hidden ? null : sn.getBoundingClientRect(), ala = q('#ala');
    const oik = snr ? snr.left : nu.left, vapaa = { v: n.left - km.right, o: oik - n.right };
    return { km: +(km.left - t.left).toFixed(2), nuoli: +(nu.right - t.right).toFixed(2), snNuoli: snr && +(nu.left - snr.right).toFixed(2),
      napitV: +vapaa.v.toFixed(1), napitO: +vapaa.o.toFixed(1), ahdas: document.querySelector('.jana-napit').classList.contains('ahdas'), kerros: Math.round(innerHeight - ala.top) }; }); };
  const lvv = await linja();
  // Paluumajakka säilyy, kun palkit avataan kaistasta.
  await kaista();
  const mjp = await m.evaluate(async () => { const L = window.__luin; L.hyppaa({ b: L.nyt().blocks.length - 1, o: 0 }); await new Promise(r => setTimeout(r, 300)); return !!L.majakka(); });
  await kaista();
  const mjp2 = await m.evaluate(() => !!window.__luin.majakka() && !document.querySelector('#jana').hidden);
  tulos('palkkien avaus ei poista majakkaa', mjp && mjp2);
  // Sivutettuna, sivunapit valittuina.
  await m.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.sivutus = 'sivut'; a.sivunapit = 1; a.av = 5; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await m.reload(); await m.waitForTimeout(400);
  await m.evaluate(() => { window.__luin.mene({ b: 30, o: 0 }); }); await m.waitForTimeout(200);
  const ps0 = await palkit();
  await m.mouse.click(206, 300); await m.waitForTimeout(100);
  const psT = await palkit();
  await kaista();
  const ps1 = await palkit();
  await m.click('#sivu-se'); await m.waitForTimeout(100);
  const ps2 = await palkit();
  await m.mouse.click(390, 300); await m.waitForTimeout(100);
  const ps3 = await palkit();
  await m.mouse.click(20, 300); await m.waitForTimeout(100);
  const ps4 = await palkit();
  // Kaistan keskeltä (Merkinnät ja Etsi ovat vasemmalla) palkit sulkeutuvat.
  const kx = await m.evaluate(() => { const n = document.querySelector('.jana-napit').getBoundingClientRect(), s = document.querySelector('#sivunapit').getBoundingClientRect(); return (n.right + s.left) / 2; });
  await m.mouse.click(kx, 824 - 22); await m.waitForTimeout(100);
  const ps5 = await palkit();
  tulos('mobiilin palkit sivutettuna', !ps0.jana && !psT.jana && psT.s === ps0.s && ps1.yla && ps1.jana && ps2.jana && ps2.s === ps1.s + 1 && ps3.jana && ps3.s === ps2.s + 1 && ps4.jana && ps4.s === ps3.s - 1 && !ps5.jana && !ps5.yla,
    [ps0, psT, ps1, ps2, ps3, ps4, ps5].map(x => (x.yla ? 'Y' : '-') + (x.jana ? 'J' : '-') + x.s).join(' → '));
  const ls = await linja();
  // Ilman sivunappeja Merkinnät ja Etsi ovat kirjanmerkin ja nuolen välin keskellä, sivunappien kanssa vasemmalla.
  tulos('kelluvat palstan linjassa (412 px)', Math.abs(lvv.km) < 0.6 && Math.abs(lvv.nuoli) < 0.6 && Math.abs(ls.km) < 0.6 && Math.abs(ls.nuoli) < 0.6 &&
    Math.abs(ls.snNuoli - 12) < 0.6 && Math.abs(lvv.napitV - lvv.napitO) <= 1 && lvv.napitV >= 12 && Math.abs(ls.napitV - 12) <= 1 && ls.napitO >= 12 && !lvv.ahdas && !ls.ahdas,
    'vieritys ' + JSON.stringify(lvv) + ', sivut ' + JSON.stringify(ls));
  // Sivunvaihtopainikkeet asetuksista: kytkin on Sivut-sanan alla, ja vierityksessä se on pois käytöstä.
  await asetuksetM();
  const kyt = await m.evaluate(() => { const s = document.querySelector('#asetukset button[data-arvo="sivut"]').getBoundingClientRect(), k = document.querySelector('#sivunapit-kytkin button');
    return { ero: +(k.getBoundingClientRect().left - s.left).toFixed(1), pois: k.disabled }; });
  await m.click('#sivunapit-kytkin button'); await m.click('#asetukset .sulje'); await m.waitForTimeout(100);
  const ilman = await m.evaluate(() => ({ piilo: document.querySelector('#sivunapit').hidden, tallessa: JSON.parse(localStorage.getItem('luin-asetukset')).sivunapit }));
  await asetuksetM(); await m.click('#sivunapit-kytkin button'); await m.click('#asetukset [data-a="sivutus"] button[data-arvo="vieritys"]'); await m.waitForTimeout(100);
  // Asetukset pysyvät auki Liikkumisen vaihtuessa.
  const kytV = await m.evaluate(() => ({ pois: document.querySelector('#sivunapit-kytkin button').disabled, nakyy: !document.querySelector('#sivunapit').hidden }));
  await m.click('#asetukset .sulje');
  tulos('sivunvaihtopainikkeiden kytkin', Math.abs(kyt.ero - 16) < 0.6 && !kyt.pois && ilman.piilo && ilman.tallessa === 0 && kytV.pois && !kytV.nakyy, JSON.stringify({ kyt, ilman, kytV }));
  await m.context().close();

  // 360 px leveällä marginaalilla ja sivunapeilla: Merkinnät ja Etsi eivät mene kelluvien päälle.
  const mob360 = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true })).newPage();
  mob360.on('pageerror', e => sivuvirheet.push(e.message));
  await mob360.goto(BASE + 'luin.html');
  await mob360.evaluate(md => { localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify({ sivutus: 'sivut', marginaali: 'levea', sivunapit: 1, av: 5 })); }, MD);
  // #tuo on samassa dokumentissa, joten asetukset luetaan vasta uudelleenlatauksessa.
  await mob360.goto(BASE + 'luin.html#tuo'); await mob360.waitForTimeout(600); await mob360.reload(); await mob360.waitForTimeout(600);
  await mob360.click('#ala-nappi'); await mob360.waitForTimeout(100);
  const m3 = await mob360.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), n = q('.jana-napit'), km = q('#km-nappi'), sn = q('#sivunapit'), nu = q('#palkki-nuoli');
    const pa = (a, c) => a.right > c.left && a.left < c.right && a.bottom > c.top && a.top < c.bottom;
    const merk = q('#merk-avaa');
    return { paalla: pa(n, km) || pa(n, sn) || pa(n, nu) || pa(sn, nu), ahdas: document.querySelector('.jana-napit').classList.contains('ahdas'), korkeus: [sn.height, merk.height], linja: +(sn.top - merk.top).toFixed(2) }; });
  tulos('Merkinnät ja Etsi kapealla ruudulla', !m3.paalla, JSON.stringify(m3));
  tulos('sivunapit laatikoiden korkuiset', m3.korkeus[0] === m3.korkeus[1] && (m3.ahdas || m3.linja === 0), JSON.stringify(m3));
  await mob360.context().close();

  // Työpöytä: palkit pysyviä, alapalkissa ei osion nimeä eikä natsaa, palkin napautus avaa ja sulkee aikajanan,
  // tekstin napautus vierityksessä ei tee mitään.
  const tp = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  tp.on('pageerror', e => sivuvirheet.push(e.message));
  await tp.goto(BASE + 'luin.html');
  await tp.evaluate(md => { localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify({ av: 4 })); }, MD);
  await tp.goto(BASE + 'luin.html#tuo'); await tp.waitForTimeout(600);
  const tila2 = () => tp.evaluate(() => ({ yla: getComputedStyle(document.querySelector('.ylapalkki')).display !== 'none', jana: !document.querySelector('#jana').hidden,
    mob: document.body.classList.contains('mobiili'), teksti: document.querySelector('#ala-rivi').innerText.trim(), pros: getComputedStyle(document.querySelector('#ala-pros')).display !== 'none' }));
  const t0 = await tila2();
  await tp.mouse.click(640, 400); await tp.waitForTimeout(100);
  const t1 = await tila2();
  await tp.mouse.click(640, 785); await tp.waitForTimeout(100);
  const t2 = await tila2();
  await tp.mouse.click(640, 785); await tp.waitForTimeout(100);
  const t3 = await tila2();
  tulos('työpöydän palkit', !t0.mob && t0.yla && !t0.jana && /^\d+ %$/.test(t0.teksti) && t0.pros && !t1.jana && t2.jana && t2.yla && !t3.jana,
    JSON.stringify([t0, t1, t2, t3].map(x => (x.yla ? 'Y' : '-') + (x.jana ? 'J' : '-') + ' "' + x.teksti + '"')));
  // Sivutettuna työpöydällä keskiklikkaus ei avaa aikajanaa (hiirellä kauhea tapa), reunat kääntävät sivua.
  // Kapea hiiri-ikkuna (690 px) on työpöytä: palkit pysyvät.
  await tp.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.sivutus = 'sivut'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await tp.reload(); await tp.waitForTimeout(400);
  // Lohko 30 on leipätekstiä (alussa sisällysluettelon linkit).
  const s0 = await tp.evaluate(() => { window.__luin.mene({ b: 30, o: 0 }); return window.__luin.tila.sivu; });
  await tp.mouse.click(1200, 400); await tp.waitForTimeout(100);
  await tp.mouse.click(640, 400); await tp.waitForTimeout(100);
  const t4 = await tila2(), s1 = await tp.evaluate(() => window.__luin.tila.sivu);
  await tp.setViewportSize({ width: 690, height: 800 }); await tp.waitForTimeout(400);
  const t5 = await tila2();
  tulos('työpöydän keskiklikkaus ja kapea ikkuna', !t4.jana && t4.yla && s1 === s0 + 1 && !t5.mob && t5.yla, JSON.stringify({ s0, s1, t4, t5 }));
  await tp.context().close();

  tulos('ei sivuvirheitä', sivuvirheet.length === 0, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  process.exitCode = virheita ? 1 : 0;
});
