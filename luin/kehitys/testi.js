// Luinin selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/testi.js polku/teksti.md [kuvakansio]
// Käynnistää oman tiedostopalvelimen, syöttää tekstin Latomon tavoin (luin-tuonti → #tuo)
// ja mittaa: rakenteen, sivutuksen (leikkautuvat rivit), koon muutoksen paluun samaan
// kohtaan, alleviivauksen ja kirjauksen säilymisen, merkintöjen viennin, aikajanan hypyn, haun,
// paluumajakan, siirtymien kumouksen, palkit ja navin laatikot (mobiili 412 ja 360 px, työpöytä 1280 ja 1440 px).
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
// Palkkien yhteiset laidat (käyttäjän pyyntö 29.10.2026), palkit ja asetukset auki: musteen etäisyys ruudun reunasta laskettuna
// laatikoista ja tunnetuista sivuväleistä (‹ 0,05 em, osion nimi 0,04 em, edistyminen 0,058 em, kiekon kehä 0,84 px svg:n reunan
// sisällä, aikajanan päät ilman tikkuja; sivuvälit ja kehä mitattu pikseleistä 29.10.2026).
// Samalla raksin ja kiekon keskikohdat, navinäkymän värit ja ensimmäisen pääluvun merkki.
// (Päälukujen määrää ei verrata: lomittuvista pääluvuista voi näkyä vain yksi, karsiPaallekkaiset().)
const laidat = pg => pg.evaluate(() => {
  const q = s => document.querySelector(s), R = s => q(s).getBoundingClientRect(), cs = s => getComputedStyle(q(s)), em = s => parseFloat(cs(s).fontSize);
  const vw = document.documentElement.clientWidth, svg = R('#jana-svg'), xr = window.__luin.janaRajat(svg.width), r2 = x => +x.toFixed(2);
  const sn = !q('#sivunapit').hidden, kn = !q('#kumonapit').hidden, kiekko = R('#lukija .ratas svg');
  const v = { km: R('#km-nappi svg').left, takaisin: R('.takaisin').left + parseFloat(cs('.takaisin').paddingLeft) + .05 * em('.takaisin'),
    kohta: R('#jana-kohta').left + .04 * em('#jana-kohta'), merk: R('#merk-avaa').left, jana: svg.left + xr[0] };
  const o = { kiekko: vw - (kiekko.right - .84), pros: vw - (R('#jana-pros').right - .058 * em('#jana-pros')), jana: vw - (svg.left + xr[1]),
    [kn ? 'kumonapit' : sn ? 'sivunapit' : 'nuoli']: vw - R(kn ? '.kumo-pari' : sn ? '#sivu-se' : '#palkki-nuoli').right };
  for (const k in v) v[k] = r2(v[k]); for (const k in o) o[k] = r2(o[k]);
  // Etappimerkkien muste mahtuu janalle, ja ensimmäisen näkyvän pääluvun vasemmalle puolelle mahtuu kuvitteellinen
  // päälukumerkki (käyttäjän pyyntö 30.10.2026). Pääluvun musteen puolileveys = polku + kehän jiiri 1,033 (luin.html janaKarjet()).
  const J = window.__luin.JANA, kR = J.koko[1][0] + 1.033;
  const etapit = [...q('#jana-svg').querySelectorAll('.j1, .j2, .j3')].map(e => { const b = e.getBBox(), j = e.classList.contains('j1') ? 1.033 : 0; return { j1: !!j, v: b.x - j, o: b.x + b.width + j }; });
  const ekaJ1 = etapit.filter(e => e.j1).sort((a, b) => a.v - b.v)[0];
  const mahtuu = etapit.every(e => e.v >= xr[0] - .01 && e.o <= xr[1] + .01) && (!ekaJ1 || ekaJ1.v >= xr[0] + 2 * kR - .01);
  return { v, o, kiekkoKeski: kiekko.left + kiekko.width / 2, harmaa: cs('.takaisin').color, kiekkoVari: cs('#lukija .ratas').color, nappiVari: cs('#sivu-ed svg').fill,
    j1: q('#jana-svg').querySelectorAll('.j1').length, mahtuu };
});
const raksiKeski = pg => pg.evaluate(() => { const r = document.querySelector('#asetukset .sulje svg').getBoundingClientRect(); return r.left + r.width / 2; });
const laidatOk = (l, vo, oo) => Object.values(l.v).every(x => Math.abs(x - vo) <= .35) && Object.values(l.o).every(x => Math.abs(x - oo) <= .35) &&
  l.kiekkoVari === l.harmaa && l.nappiVari === l.harmaa && l.j1 > 0 && l.mahtuu && Math.abs(l.raksi - l.kiekkoKeski) < .01;

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
    const ok = k => k && (k.classList.contains('bib') || (/^lyh-/.test(k.id) || /^H[2-4]$/.test(k.tagName)) && k.closest('#teksti'));
    return { n: a.length, lyh: a.filter(x => !document.getElementById(x.getAttribute('href').slice(1)).classList.contains('bib')).length, rikki: a.filter(x => !ok(document.getElementById(x.getAttribute('href').slice(1)))).length }; });
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
  // Pääluku alkaa aina uudelta sivulta, ja alaluvun otsikon jälkeen samalla sivulla on vähintään kaksi tekstiriviä
  // (paitsi jos otsikko on sivun ensimmäinen). Rivit lasketaan tekstisolmujen laatikoista, ei koodin omasta mittarista.
  const otsikot = await p.evaluate(() => {
    const art = document.querySelector('#teksti'), ar = art.getBoundingClientRect(), st = window.__luin.tila.stride;
    const sar = r => Math.floor((r.left - ar.left + 2) / st); let h2huono = 0, h3huono = 0;
    for (const h of art.querySelectorAll('h2')) { const pv = h.previousElementSibling; if (pv && pv.tagName !== 'HR') { const rr = pv.getClientRects(); if (sar(rr[rr.length - 1]) >= sar(h.getClientRects()[0])) h2huono++; } }
    for (const h of art.querySelectorAll('h3')) {
      const r0 = h.getClientRects()[0], pp = sar(r0), rivit = new Set(); if (r0.top - ar.top < 2) continue;
      const tw = document.createTreeWalker(art, NodeFilter.SHOW_TEXT); let t;
      while ((t = tw.nextNode())) {
        if (!(h.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) || h.contains(t) || !t.textContent.trim() || t.parentElement.closest('h2,h3,h4,nav,.fntoggle,.sidenote')) continue;
        const q = document.createRange(); q.selectNodeContents(t); for (const k of q.getClientRects()) if (sar(k) === pp && k.height > 4) rivit.add(Math.round((k.top + k.bottom) / 16));
      }
      if (rivit.size < 2) h3huono++;
    }
    return { h2huono, h3huono, siirretty: document.querySelectorAll('h3.sivulle').length };
  });
  tulos('pääluku uudelle sivulle, alaluku ei yksin sivun pohjalle', otsikot.h2huono === 0 && otsikot.h3huono === 0, JSON.stringify(otsikot));

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

  // Navinäkymä (verho) estää valinnasta alleviivaamisen (1.11.2026): suljetaan se ennen valintaa.
  if (await p.evaluate(() => !document.querySelector('#jana').hidden)) await p.click('#ala-nappi');
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

  // Aikajana: viimeisen piirretyn pääluvun merkki vie sen otsikkoon (viimeinen pääluku ei aina mahdu janan loppuun).
  await avaaPalkit();
  const kohde = await p.evaluate(() => {
    const g = [...document.querySelectorAll('#jana-svg .j1')].map(e => e.parentNode).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).pop();
    const bb = g.getBoundingClientRect(); return { x: bb.left + bb.width / 2, y: bb.top + bb.height / 2, nimi: g.querySelector('title').textContent };
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
  const osumia = await p.locator('#haku .osuma').count(), valittava = Math.min(2, osumia - 1);
  await p.click('#haku .osuma[data-i="' + valittava + '"]'); await p.waitForTimeout(150);
  const hv = await p.evaluate(i => {
    const L = window.__luin, h = L.nyt().haku, o = h.osumat[i], hl = CSS.highlights.get('haku'), r = hl && [...hl][0];
    const rr = r && r.getBoundingClientRect(), sv = document.querySelector('#sivu').getBoundingClientRect();
    return { kiinni: document.querySelector('#haku').hidden, teksti: r && r.toString().replace(/\u00ad/g, ''), odotus: o.n ? null : L.nyt().txt[o.b].slice(o.s, o.e),
      nakyy: !!rr && rr.left >= sv.left && rr.right <= sv.right && rr.top >= sv.top && rr.bottom <= sv.bottom, kohta: L.tila.ankkuri.b === o.b && L.tila.ankkuri.o === o.a, viite: !!o.n };
  }, valittava);
  await p.click('#etsi-avaa'); await p.waitForTimeout(100);
  const merkitty = await p.evaluate(() => document.querySelector('#haku .osuma[aria-current]')?.dataset.i);
  await p.click('#haku input'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
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
  await p.click('#etsi-avaa'); await p.fill('#haku input', vq); await p.waitForTimeout(300);
  await p.click('#haku .osuma[data-i="0"]'); await p.waitForTimeout(200);
  const va = await p.evaluate(() => {
    const L = window.__luin, h = L.nyt().haku, o = h.osumat[0], pop = document.querySelector('#pop'), hl = CSS.highlights.get('haku'), r = hl && [...hl][0];
    const rr = r && r.getBoundingClientRect(), pr = pop.getBoundingClientRect(), fn = document.querySelector('#teksti label.fnref[for="fn' + o.n + '"]').getBoundingClientRect();
    const sv = document.querySelector('#sivu').getBoundingClientRect();
    return { n: o.n, viite: !pop.hidden && pop.classList.contains('viite'), teksti: r && r.toString().replace(/\u00ad/g, ''),
      sisalla: !!rr && pop.contains(r.startContainer) && rr.top >= pr.top && rr.bottom <= pr.bottom, fnSivulla: fn.left >= sv.left && fn.right <= sv.right };
  });
  await p.evaluate(() => document.body.click()); await p.waitForTimeout(100);
  await p.click('#etsi-avaa'); await p.click('#haku .h-viit'); await p.waitForTimeout(200);
  const vk = await p.evaluate(() => ({ osumia: document.querySelectorAll('#haku .osuma').length, painettu: document.querySelector('#haku .h-viit').getAttribute('aria-pressed'),
    tallessa: JSON.parse(localStorage.getItem('luin-asetukset')).hakuViit, auki: !document.querySelector('#haku').hidden }));
  await p.click('#haku .h-viit'); await p.waitForTimeout(200);
  const vk2 = await p.locator('#haku .osuma').count();
  await p.click('#haku .sulje');
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
    // Aikajanan päät palkkien laidoissa ja janan korkeus (luin.html: janaRajat, JANA.y; 29.10.2026).
    const r = await p.evaluate(() => { const b = document.querySelector('#jana-svg').getBoundingClientRect(), L = window.__luin, xr = L.janaRajat(b.width);
      return { l: b.left, w: b.width, y: b.top + L.JANA.y, x0: xr[0], x1: xr[1] }; });
    const ennen = await p.evaluate(() => ({ s: window.__luin.tila.sivu, a: JSON.stringify(window.__luin.tila.ankkuri), y: scrollY }));
    await p.mouse.move(r.l + x0 * r.w, r.y); await p.mouse.down();
    const xt = new Set(); let pysyi = true, haamu = true, raja = true;
    for (let i = 1; i <= askelia; i++) {
      await p.mouse.move(r.l + (x0 + (x1 - x0) * i / askelia) * r.w, r.y); await p.waitForTimeout(20);
      const t = await p.evaluate(() => ({ s: window.__luin.tila.sivu, a: JSON.stringify(window.__luin.tila.ankkuri), y: scrollY,
        g: document.querySelector('#j-veto')?.getAttribute('transform'), h: !!document.querySelector('#jana-svg .haamu'),
        l: document.querySelector('#j-luettu')?.getAttribute('d'),
        e: [...document.querySelectorAll('#jana-svg g[data-f]')].map(g => [+g.dataset.f, g.classList.contains('tuleva')]) }));
      if (t.s !== ennen.s || t.a !== ennen.a || t.y !== ennen.y) pysyi = false;
      if (!t.g || !t.h) haamu = false; else xt.add(parseFloat(t.g.slice(10)));
      // Luetun osan raja seuraa vedettävää osoitinta (käyttäjän pyyntö 22.10.2026).
      if (t.g) {
        const gx = parseFloat(t.g.slice(10)), lx = parseFloat(t.l.split('H').pop()), f = (gx - r.x0) / (r.x1 - r.x0);
        if (Math.abs(gx - lx) > 0.01 || t.e.some(([ef, tul]) => tul !== ef > f + 1e-9)) raja = false;
      }
    }
    await p.mouse.up(); await p.waitForTimeout(150);
    const jalkeen = await p.evaluate(() => ({ s: window.__luin.tila.sivu, a: window.__luin.tila.ankkuri, y: scrollY,
      g: !!document.querySelector('#j-veto'), h: !!document.querySelector('#jana-svg .haamu') }));
    return { ennen, xt: [...xt], pysyi, haamu, raja, jalkeen, r };
  };
  // Sivutettuna välimuotoja ei ole (käyttäjän päätös 21.10.2026): osoitin pysähtyy vain tekstin
  // alkuun, otsikoihin, kirjanmerkkeihin, majakkaan ja voimassa olevaan kohtaan, myös kun
  // aikajanalla näkyvät vain pääluvut eikä kirjanmerkkejä.
  await p.evaluate(() => { const L = window.__luin; L.aset.janaTaso = 1; L.aset.kmJanalla = 0; L.mene({ b: 0, o: 0 }); });
  const vs = await veto(0.2, 0.3, 40);
  const pys = await p.evaluate(([x0, x1]) => { const L = window.__luin, n = L.nyt(), o = k => (n.cum[k.b] + k.o) / n.total, a = [];
    a.push({ x: x0 + o({ b: 0, o: 0 }) * (x1 - x0), k: '0:0' });
    n.doc.toc.forEach(t => a.push({ x: x0 + o({ b: t.b, o: 0 }) * (x1 - x0), k: t.b + ':0', lvl: t.lvl }));
    n.merk.km.forEach(k => a.push({ x: x0 + o(k) * (x1 - x0), k: k.b + ':' + k.o }));
    L.aset.janaTaso = 2; L.aset.kmJanalla = 1;
    return a; }, [vs.r.x0, vs.r.x1]);
  const pysakki = x => pys.find(s => Math.abs(s.x - x) < 0.01);
  const kvantti = vs.xt.every(pysakki), piilotettu = vs.xt.some(x => (pysakki(x) || {}).lvl > 1);
  const perille = pys.some(s => s.k === vs.jalkeen.a.b + ':' + vs.jalkeen.a.o);
  tulos('aikajanan veto sivutettuna', vs.pysyi && vs.haamu && vs.raja && kvantti && piilotettu && perille && !vs.jalkeen.g && !vs.jalkeen.h && vs.jalkeen.s !== vs.ennen.s,
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

  // Kirjanmerkkinappi (käyttäjän päätös 22.10.2026): merkki näkymän ylimmän kappalejaon alkuun. Jos sivulla ei
  // ole yhtään kappaleen alkua, merkki tulee edelliseen kappalejakoon ja näkymä siirtyy taaksepäin sivunkäännöin.
  const alkuSivulla = () => p.evaluate(() => { const L = window.__luin, n = L.nyt(), al = document.querySelector('#teksti, article, main') && 0, a = L.tila;
    const art = n.blocks[0].parentElement, l = art.getBoundingClientRect().left;
    for (let b = 0; b < n.blocks.length; b++) { const r = n.blocks[b].getClientRects()[0]; if (r && Math.floor((r.left - l + 2) / a.stride) === a.sivu) return b; } return -1; });
  const kesken = await p.evaluate(() => { const L = window.__luin; for (let s = 3; s < L.tila.sivuja; s++) { L.mene(L.sivunAlku(s)); if (L.tila.ankkuri.o > 0) return { s, b: L.tila.ankkuri.b }; } });
  const odotettu = await alkuSivulla();
  const kmEnnen = await p.evaluate(() => window.__luin.nyt().merk.km.length);
  await p.click('#km-nappi'); await p.waitForTimeout(100);
  const kmNyt = await p.evaluate(() => ({ s: window.__luin.tila.sivu, km: window.__luin.nyt().merk.km.map(k => k.b + ':' + k.o), lit: document.querySelector('#km-nappi').getAttribute('aria-pressed'), nauhoja: document.querySelectorAll('.km').length }));
  await p.click('#km-nappi'); await p.waitForTimeout(100);
  const kmPois = await p.evaluate(() => window.__luin.nyt().merk.km.length);
  tulos('kirjanmerkki ylimpään sivulla alkavaan kappaleeseen', odotettu > kesken.b && kmNyt.s === kesken.s && kmNyt.km.indexOf(odotettu + ':0') >= 0 && kmNyt.lit === 'true' && kmNyt.nauhoja >= 1 && kmPois === kmEnnen,
    'sivu ' + (kesken.s + 1) + ', kirjanmerkki ' + odotettu + ':0 (kesken ollut ' + kesken.b + '), toinen painallus poisti');
  // Sivu ilman kappaleen alkua: etsitään sivu, jolla alkuSivulla() on -1, ja tarkistetaan paluu edelliseen kappalejakoon.
  const tyhja = await p.evaluate(() => { const L = window.__luin, n = L.nyt(), l = n.blocks[0].parentElement.getBoundingClientRect().left;
    const alut = new Set(n.blocks.map(el => { const r = el.getClientRects()[0]; return r ? Math.floor((r.left - l + 2) / L.tila.stride) : -1; }));
    for (let s = 1; s < L.tila.sivuja; s++) if (!alut.has(s)) { L.mene(L.sivunAlku(s)); if (!L.tila.ankkuri.ed && L.tila.sivu === s) return { s, b: L.tila.ankkuri.b }; } return null; });
  if (tyhja) {
    await p.click('#km-nappi'); await p.waitForTimeout(100);
    const t2 = await p.evaluate(() => ({ s: window.__luin.tila.sivu, km: window.__luin.nyt().merk.km.map(k => k.b + ':' + k.o) }));
    tulos('kirjanmerkki edelliseen kappalejakoon, kun sivulla ei ole alkua', t2.s < tyhja.s && t2.km.indexOf(tyhja.b + ':0') >= 0, 'sivu ' + (tyhja.s + 1) + ' → ' + (t2.s + 1) + ', kirjanmerkki ' + tyhja.b + ':0');
    await p.click('#km-nappi'); await p.waitForTimeout(100);
  } else console.log('HUOM  ei sivua ilman kappaleen alkua tässä tekstissä');

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
  await p.click('#etsi-avaa'); await p.fill('#haku input', vq); await p.waitForTimeout(300);
  await p.click('#haku .osuma[data-i="0"]'); await p.waitForTimeout(200);
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
  tulos('aikajanan veto vierityksessä', vv.pysyi && vv.haamu && vv.raja && !vv.jalkeen.g && !vv.jalkeen.h && vv.jalkeen.y > vv.ennen.y && vv.xt.length > 2 && vv.xt.every((x, i) => !i || x > vv.xt[i - 1]),
    'scrollY ' + vv.ennen.y + ' → ' + Math.round(vv.jalkeen.y) + ', osoittimen paikkoja ' + vv.xt.length + ' / 40 askelta');

  // Vierityksessä ei ole magneettia: napautus 5 px pääluvun merkin oikealla puolella vie
  // suhteelliseen kohtaan eikä otsikkoon.
  const mg = await p.evaluate(() => { const L = window.__luin, n = L.nyt(), t = n.doc.toc.filter(x => x.lvl === 1)[3];
    const b = document.querySelector('#jana-svg').getBoundingClientRect(), xr = L.janaRajat(b.width), w = xr[1] - xr[0];
    return { x: b.left + xr[0] + (n.cum[t.b] / n.total) * w + 5, y: b.top + L.JANA.y, b: t.b, w, x0: xr[0] }; });
  await p.mouse.click(mg.x, mg.y); await p.waitForTimeout(150);
  const mgA = await p.evaluate(m => { const L = window.__luin, n = L.nyt(), a = L.tila.ankkuri, r = document.querySelector('#jana-svg').getBoundingClientRect();
    return { k: a.b + ':' + a.o, ero: r.left + m.x0 + (n.cum[a.b] + a.o) / n.total * m.w - m.x }; }, mg);
  tulos('ei magneettia vierityksessä', mgA.k !== mg.b + ':0' && Math.abs(mgA.ero) < 1.5, 'otsikko ' + mg.b + ':0, perillä ' + mgA.k + ', ero napautukseen ' + mgA.ero.toFixed(2) + ' px');

  // Kirjanmerkin nauha (käyttäjän pyyntö 4.11.2026): osuma nauhaan vie tasan kirjanmerkkiin myös 2,5 px keskeltä
  // (nauha 6,2 px), mutta saman x:n napautus viivalla vie yhä suhteelliseen kohtaan. Kirjanmerkki on pääluvun
  // jälkeisen kappaleen alussa, joten sivutettuna lähin pysäkki olisi otsikko.
  const kmj = await p.evaluate(() => { const L = window.__luin, n = L.nyt(), t = n.doc.toc.filter(x => x.lvl === 1)[3], b = t.b + 1;
    n.merk.km.push({ id: 'testikm-jana', b, o: 0, s: n.txt[b].slice(0, 40), t: 1, osio: t.text }); L.mene({ b: 0, o: 0 });
    return { b, f: n.cum[b] / n.total }; });
  await p.waitForTimeout(300);
  const kmjNapsu = async (dx, y) => {
    await p.evaluate(() => window.__luin.mene({ b: 0, o: 0 })); await p.waitForTimeout(300);
    const r = await p.evaluate(f => { const L = window.__luin, b = document.querySelector('#jana-svg').getBoundingClientRect(), xr = L.janaRajat(b.width);
      const x = b.left + xr[0] + f * (xr[1] - xr[0]), e = [...document.querySelectorAll('#jana-svg .j-km')].find(e => { const q = e.getBoundingClientRect(); return Math.abs((q.left + q.right) / 2 - x) < .5; });
      return { x, top: b.top, piirretty: !!e }; }, kmj.f);
    await p.mouse.click(r.x + dx, r.top + y); await p.waitForTimeout(300);
    const a = await p.evaluate(() => window.__luin.tila.ankkuri);
    return { k: a.b + ':' + a.o, piirretty: r.piirretty };
  };
  const JK = await p.evaluate(() => window.__luin.JANA), kmjT = [await kmjNapsu(-2.5, JK.km + 4), await kmjNapsu(2.5, JK.km + 4), await kmjNapsu(2.5, JK.y)];
  await p.evaluate(() => { const L = window.__luin, n = L.nyt(); n.merk.km = n.merk.km.filter(k => k.id !== 'testikm-jana'); L.mene({ b: 0, o: 0 }); });
  await p.waitForTimeout(300);
  tulos('kirjanmerkin nauha aikajanalla', kmjT[0].piirretty && kmjT[0].k === kmj.b + ':0' && kmjT[1].k === kmj.b + ':0' && kmjT[2].k !== kmj.b + ':0',
    'kirjanmerkki ' + kmj.b + ':0; nauha −2,5 px → ' + kmjT[0].k + ', +2,5 px → ' + kmjT[1].k + ', viiva +2,5 px → ' + kmjT[2].k);

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
    // Aikajanalta tehty hyppy: alle 10 % ei jätä mitään, 10–50 % vain kummitusmerkin, yli 50 % myös laatikon (22.10.2026).
    const N = L.nyt(), kummi = () => !!L.majakka() && !!document.querySelector('#jana-svg .j-majakka');
    const kohdassa = osuus => { const i = N.cum.findIndex(c => c / N.total >= osuus); return Math.max(i, 1); };
    const hyppyJanalta = async (lahto, osuus) => {
      window.scrollTo(0, 0); await odota(); await odota();
      L.hyppaa({ b: lahto, o: 0 }); await odota(); await odota();
      L.hyppaa({ b: kohdassa(osuus), o: 0 }, false, false, 'jana'); await odota();
      return { maj: !!L.majakka(), laatikko: nakyy() };
    };
    const j5 = await hyppyJanalta(0, 0.05), j30 = await hyppyJanalta(0, 0.3), j90 = await hyppyJanalta(0, 0.9);
    const pieni = !j5.maj, alle50 = j30.maj && !j30.laatikko, yli50 = j90.maj && j90.laatikko;
    // Muu kuin aikajanan hyppy ei kuulu kynnyksiin: pieni siirtymäkin jättää kummituksen ja laatikon.
    window.scrollTo(0, 0); await odota(); await odota();
    L.hyppaa({ b: kohdassa(0.05), o: 0 }); await odota();
    const muu = !!L.majakka() && nakyy();
    return { iso, ylos, takaisin, pieni, alle50, yli50, muu, j5, j30, j90 };
  });
  tulos('paluumajakka', mj.iso && mj.ylos && mj.takaisin && mj.pieni && mj.alle50 && mj.yli50 && mj.muu, JSON.stringify(mj));

  // Sisällysluettelon linkki ei jätä majakkaa, vaikka vie kirjan loppuun (22.10.2026).
  const sl = await p.evaluate(async () => {
    const L = window.__luin, odota = () => new Promise(r => setTimeout(r, 300)), nav = [...document.querySelectorAll('nav.sisallys a[data-go]')];
    if (!nav.length) return { ohitettu: true };
    // Palkit auki: tekstialueen linkki ei toimi (26.10.2026), joten ne suljetaan ensin.
    if (!document.querySelector('#jana').hidden) document.querySelector('#ala-nappi').click();
    window.scrollTo(0, 0); await odota(); await odota();
    nav[nav.length - 1].click(); await odota();
    return { linkkeja: nav.length, siirtyi: scrollY > 2 * innerHeight, majakka: !document.getElementById('majakka').hidden };
  });
  tulos('sisällysluettelo ei jätä majakkaa', sl.ohitettu || sl.siirtyi && !sl.majakka, JSON.stringify(sl));

  // Lähdeviittaus (alaviite → kirjallisuus) jättää majakan aina, myös alle puolen kirjan matkalla.
  const lahdeV = await p.evaluate(async () => {
    const L = window.__luin, odota = () => new Promise(r => setTimeout(r, 300)), N = L.nyt();
    const linkit = [...document.querySelectorAll('#teksti a.lahde[href^="#kirj-"]')].filter(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); return t && t.dataset.b; });
    if (!linkit.length) return { ohitettu: true };
    window.scrollTo(0, 0); await odota(); await odota();
    // Lyhin matka: sääntö ei saa riippua etäisyydestä.
    const d = a => Math.abs(N.cum[+a.closest('[data-b]').dataset.b] - N.cum[+document.getElementById(a.getAttribute('href').slice(1)).dataset.b]);
    linkit.sort((x, y) => d(x) - d(y));
    const a = linkit[0], b0 = +a.closest('[data-b]').dataset.b, bt = +document.getElementById(a.getAttribute('href').slice(1)).dataset.b;
    L.hyppaa({ b: b0, o: 0 }); await odota();
    a.click(); await odota();
    return { matka: +Math.abs((N.cum[b0] - N.cum[bt]) / N.total).toFixed(2), majakka: !document.getElementById('majakka').hidden };
  });
  tulos('lähdeviittaus jättää majakan', lahdeV.ohitettu || lahdeV.majakka, JSON.stringify(lahdeV));

  // Alaviitteen lyhennelinkki (md.js, viittaukset()) vie lyhenteen selitykseen; lähtökohta on edempänä,
  // joten nuoli osoittaa alas, ja paluu vie takaisin.
  const ly = await p.evaluate(async () => {
    const L = window.__luin, odota = () => new Promise(r => setTimeout(r, 300));
    const linkit = [...document.querySelectorAll('#teksti a.lahde')].filter(x => !document.getElementById(x.getAttribute('href').slice(1)).classList.contains('bib'));
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
  // vaikuta niihin. Kirjanmerkki on kaistan vasemmassa reunassa oma neliönsä (27.10.2026), palkkinuoli palkkien oikeassa
  // laidassa (29.10.2026), sivunapit (jos valittu) nuolen oikealla puolella. Sivutettuna reunat kääntävät sivua.
  // Palkkien avaus ei poista paluumajakkaa.
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
  const pv1b = await palkit();   // tekstin napautus sulkee auki olevat palkit (26.10.2026)
  await kaista();
  await kaista();
  const pv2 = await palkit();
  await kaista();
  await m.mouse.wheel(0, 400); await m.waitForTimeout(200);
  const pv3 = await palkit();
  await kaista();
  await m.mouse.wheel(0, 400); await m.waitForTimeout(200);
  const pv4 = await palkit();
  tulos('mobiilin palkit vierityksessä', !pv0.yla && !pv0.jana && !pvT.jana && pv1.yla && pv1.jana && !pv1b.jana && !pv1b.yla && !pv2.yla && !pv2.jana && pv3.jana && !pv4.jana && !pv4.yla,
    [pv0, pvT, pv1, pv1b, pv2, pv3, pv4].map(x => (x.yla ? 'Y' : '-') + (x.jana ? 'J' : '-')).join(' → '));
  tulos('palkkinuoli kääntyy', !pv0.alas && pv1.alas && !pv2.alas,
    JSON.stringify([pv0, pv1, pv2].map(x => x.alas)));
  // Kirjanmerkkilohko vasemmassa reunassa (symbolista yhtä kauas palkin reunaan ja erottimeen, 17 px; 28.10.2026), nuoli tai sivunappien laatikko
  // palkkien oikeassa laidassa 17 px ruudun reunasta ja Merkinnät/Etsi omalla rivillään aikajanan alla palkkien vasemmassa laidassa 17 px
  // ruudun reunasta (29.10.2026; ennen nuoli tekstipalstan linjassa ja laatikot ruudun reunassa).
  const linja = async () => { await avaaPalkitM(); await m.waitForTimeout(100); return m.evaluate(() => {
    const q = s => document.querySelector(s).getBoundingClientRect(), art = document.querySelector('#teksti'), sv = q('#sivu');
    // Sivutettuna #teksti on palstojen levyinen ja siirretty; näkyvä palsta on #sivu + marginLeft, leveys style.width.
    const t = document.body.classList.contains('sivutus') ? { left: sv.left + parseFloat(art.style.marginLeft), right: sv.left + parseFloat(art.style.marginLeft) + parseFloat(art.style.width) } : q('#teksti'), kmb = q('#km-nappi'), km = q('#km-nappi svg'), n = q('.jana-napit'), sn = document.querySelector('#sivunapit');
    // Nuolen viewBox on musteen rajat viivan ulkoreunoineen: laatikon reuna = musteen reuna. Sivunappien näkyvä
    // laatikko on nappien reunoissa (#sivunapit on napautusalue ruudun reunaan asti).
    const nu = q('#palkki-nuoli'), snr = sn.hidden ? null : q('#sivu-se'), ala = q('#ala'), rivi = q('#ala-rivi'), js = q('#jana-svg');
    return { kmLohko: [kmb.left, +kmb.width.toFixed(2), +kmb.height.toFixed(2)], kmValit: [+(km.left - kmb.left).toFixed(2), +(kmb.right - 1 - km.right).toFixed(2)],
      nuoli: +(innerWidth - (snr || nu).right).toFixed(2), snNuoli: snr && +(q('#sivu-ed').left - nu.right).toFixed(2),
      napit: [+(n.left - js.left).toFixed(2), +(rivi.top - n.bottom).toFixed(2), +(n.top - js.bottom).toFixed(2)], kerros: Math.round(innerHeight - ala.top) }; }); };
  const lvv = await linja();
  // Paluumajakka säilyy, kun palkit avataan kaistasta.
  await kaista();
  const mjp = await m.evaluate(async () => { const L = window.__luin; L.hyppaa({ b: L.nyt().blocks.length - 1, o: 0 }); await new Promise(r => setTimeout(r, 300)); return !!L.majakka(); });
  await kaista();
  const mjp2 = await m.evaluate(() => !!window.__luin.majakka() && !document.querySelector('#jana').hidden);
  tulos('palkkien avaus ei poista majakkaa', mjp && mjp2);
  // Sivutettuna, sivunapit valittuina.
  await m.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.sivutus = 'sivut'; a.sivunapit = 1; a.kumoNapit = 0; a.av = 5; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
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
  const ps3 = await palkit();   // reunanapautus palkit auki: vain sulkee, ei käännä (26.10.2026)
  await kaista();
  await m.click('#sivu-ed'); await m.waitForTimeout(100);
  const ps4 = await palkit();
  // Kaistan keskeltä palkit sulkeutuvat.
  const kx = await m.evaluate(() => { const n = document.querySelector('#km-nappi').getBoundingClientRect(), s = document.querySelector('#palkki-nuoli').getBoundingClientRect(); return (n.right + s.left) / 2; });
  await m.mouse.click(kx, 824 - 22); await m.waitForTimeout(100);
  const ps5 = await palkit();
  tulos('mobiilin palkit sivutettuna', !ps0.jana && !psT.jana && psT.s === ps0.s && ps1.yla && ps1.jana && ps2.jana && ps2.s === ps1.s + 1 && !ps3.jana && ps3.s === ps2.s && ps4.jana && ps4.s === ps3.s - 1 && !ps5.jana && !ps5.yla,
    [ps0, psT, ps1, ps2, ps3, ps4, ps5].map(x => (x.yla ? 'Y' : '-') + (x.jana ? 'J' : '-') + x.s).join(' → '));
  const ls = await linja();
  const lohkoOk = l => l.kmLohko[0] === 0 && l.kmLohko[2] === 43 && l.kmValit[0] === 17 && l.kmValit[1] === 23 && Math.abs(l.nuoli - 17) < 0.6 &&
    l.napit[0] === 17 && l.napit[1] >= 8 && l.napit[2] >= 0;
  tulos('kirjanmerkkilohko, nuoli ja Merkinnät/Etsi-rivi (412 px)', lohkoOk(lvv) && lohkoOk(ls) && lvv.snNuoli === null && Math.abs(ls.snNuoli - 24) < 0.6,
    'vieritys ' + JSON.stringify(lvv) + ', sivut ' + JSON.stringify(ls));
  // Sivunappien ja kirjanmerkin ympäriltä ei avaudu aikajana (27.10.2026): napin ylä- ja alapuoli sekä oikean napin
  // oikea puoli ruudun reunaan asti kääntävät sivua, kirjanmerkkilohkon vasen reuna kuuluu kirjanmerkille.
  const osumat = await m.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), ed = q('#sivu-ed'), se = q('#sivu-se'), r = q('#ala-rivi');
    const id = (x, y) => { const e = document.elementFromPoint(x, y); return e && (e.closest('button, #sivunapit') || e).id; };
    return { reuna: id(innerWidth - 1, r.top + r.height / 2), yliSe: id(se.left + 5, r.top + 2), alleEd: id(ed.left + 5, r.bottom - 1), vasen: id(1, r.top + r.height / 2),
      raot: [+(ed.top - r.top).toFixed(1), +(r.bottom - ed.bottom).toFixed(1)] }; });
  if (await m.evaluate(() => !document.querySelector('#jana').hidden)) await kaista();
  const na0 = await palkit();
  const rr = await m.evaluate(() => document.querySelector('#ala-rivi').getBoundingClientRect().bottom);
  await m.mouse.click(411, rr - 3); await m.waitForTimeout(100);
  const na1 = await palkit();
  const edx = await m.evaluate(() => document.querySelector('#sivu-ed').getBoundingClientRect().left + 5);
  await m.mouse.click(edx, rr - 1); await m.waitForTimeout(100);
  const na2 = await palkit();
  tulos('sivunappien ja kirjanmerkin napautusalueet', osumat.reuna === 'sivunapit' && osumat.yliSe === 'sivunapit' && osumat.alleEd === 'sivunapit' && osumat.vasen === 'km-nappi' &&
    !na1.jana && na1.s === na0.s + 1 && !na2.jana && na2.s === na0.s, JSON.stringify({ osumat, s: [na0.s, na1.s, na2.s], jana: [na1.jana, na2.jana] }));
  // Sivunvaihtopainikkeet asetuksista: kytkin on Sivut-sanan alla, ja vierityksessä se on pois käytöstä.
  await asetuksetM();
  const kyt = await m.evaluate(() => { const s = document.querySelector('#asetukset button[data-arvo="sivut"]').getBoundingClientRect(), k = document.querySelector('#sivunapit-kytkin button[data-kytkin="sivunapit"]');
    return { ero: +(k.getBoundingClientRect().left - s.left).toFixed(1), pois: k.disabled }; });
  await m.click('#sivunapit-kytkin button[data-kytkin="sivunapit"]'); await m.click('#asetukset .sulje'); await m.waitForTimeout(100);
  const ilman = await m.evaluate(() => ({ piilo: document.querySelector('#sivunapit').hidden, tallessa: JSON.parse(localStorage.getItem('luin-asetukset')).sivunapit }));
  await asetuksetM(); await m.click('#sivunapit-kytkin button[data-kytkin="sivunapit"]'); await m.click('#asetukset [data-a="sivutus"] button[data-arvo="vieritys"]'); await m.waitForTimeout(100);
  // Asetukset pysyvät auki Liikkumisen vaihtuessa.
  const kytV = await m.evaluate(() => ({ pois: document.querySelector('#sivunapit-kytkin button[data-kytkin="sivunapit"]').disabled, nakyy: !document.querySelector('#sivunapit').hidden }));
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
  const vapaa360 = () => mob360.evaluate(() => { const k = document.querySelector('#km-nappi').getBoundingClientRect(), n = document.querySelector('#palkki-nuoli').getBoundingClientRect(); return { x: (k.right + n.left) / 2, y: k.top + k.height / 2 }; });
  const kaista360 = async () => { const v = await vapaa360(); await mob360.mouse.click(v.x, v.y); await mob360.waitForTimeout(100); };
  await kaista360();
  const m3 = await mob360.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), n = q('.jana-napit'), km = q('#km-nappi'), sn = q('#sivunapit'), nu = q('#palkki-nuoli'), ku = q('.kumo-pari');
    const pa = (a, c) => a.right > c.left && a.left < c.right && a.bottom > c.top && a.top < c.bottom;
    const merk = q('#merk-avaa'), se = q('#sivu-se');
    return { kumo: !document.querySelector('#kumonapit').hidden, paalla: pa(n, km) || pa(n, sn) || pa(n, nu) || pa(n, ku) || pa(sn, nu) || pa(km, nu) || pa(km, sn) || pa(km, ku) || pa(nu, ku),
      korkeus: [se.height, merk.height, ku.height] }; });
  tulos('Merkinnät ja Etsi kapealla ruudulla (sivunapit ja kumonapit)', m3.kumo && !m3.paalla, JSON.stringify(m3));
  // Mobiilissa laidat 17 px kummallakin puolella marginaalista riippumatta (tässä Reilu).
  const l3 = await laidat(mob360); await mob360.click('#lukija .ratas'); l3.raksi = await raksiKeski(mob360); await mob360.click('#asetukset .sulje');
  tulos('palkkien laidat mobiilissa (360 px, sivunapit ja kumonapit)', laidatOk(l3, 17, 17), JSON.stringify(l3));
  tulos('sivunapit ja kumonapit laatikoiden korkuiset', m3.korkeus[0] === m3.korkeus[1] && m3.korkeus[2] === m3.korkeus[1], JSON.stringify(m3));
  // Sisälmys (4.11.2026): Etsin oikealla puolella samalla rivillä, laatikko auki napista; tekstialueen napautus laatikon
  // ulkopuolella sulkee vain laatikon (navi auki, sivu sama); raksi sulkee; kohdan valinta hyppää ja jättää majakan.
  const sisT = () => mob360.evaluate(() => ({ navi: !document.querySelector('#jana').hidden, pop: document.querySelector('#sisalmys').hidden ? '' : 'sisalmys', s: window.__luin.tila.sivu, maj: !!window.__luin.majakka() }));
  if (await mob360.evaluate(() => document.querySelector('#jana').hidden)) await kaista360();
  const sg = await mob360.evaluate(() => { const e = document.querySelector('#etsi-avaa').getBoundingClientRect(), s = document.querySelector('#sis-avaa').getBoundingClientRect(); return { oikealla: s.left > e.right, rivi: s.top === e.top, h: s.height === e.height }; });
  await mob360.click('#sis-avaa'); await mob360.waitForTimeout(100);
  const ss1 = await sisT(), pr = await mob360.evaluate(() => document.querySelector('#sisalmys').getBoundingClientRect().right);
  await mob360.mouse.click(Math.min(359, pr + 4), 300); await mob360.waitForTimeout(100);
  const ss2 = await sisT();
  await mob360.click('#sis-avaa'); await mob360.click('#sisalmys .sulje'); await mob360.waitForTimeout(100);
  const ss3 = await sisT();
  await mob360.click('#sis-avaa'); await mob360.click('#sisalmys .s-kohta:last-child'); await mob360.waitForTimeout(300);
  const ss4 = await sisT();
  // Navin laatikot mobiilissa (käyttäjän pyyntö 5.11.2026): yksi kerrallaan palkkien laitojen välissä, yläpalkin ja navin
  // välissä; toisen napin painallus vaihtaa laatikon samaan tilaan, saman napin painallus sulkee.
  const lkT = () => mob360.evaluate(() => {
    const R = s => document.querySelector(s).getBoundingClientRect(), a = {};
    for (const id of ['merkinnat', 'haku', 'sisalmys']) if (!document.getElementById(id).hidden) { const r = R('#' + id); a[id] = [r.left, r.right, r.top, r.bottom].map(Math.round); }
    // Palaa takaisin -laatikko (edellisen testin hyppy) nostaa alarajaa.
    const mj = document.querySelector('#majakka');
    return { a, yp: R('.ylapalkki').bottom, ala: (mj.hidden ? R('#ala') : R('#majakka')).top, maj: !mj.hidden, ae: ['#merk-avaa', '#etsi-avaa', '#sis-avaa'].map(s => document.querySelector(s).getAttribute('aria-expanded')[0]).join('') };
  });
  await mob360.click('#merk-avaa'); await mob360.waitForTimeout(100); const lk1 = await lkT();
  await mob360.click('#sis-avaa'); await mob360.waitForTimeout(100); const lk2 = await lkT();
  await mob360.click('#sis-avaa'); await mob360.waitForTimeout(100); const lk3 = await lkT();
  const lkOk = (t, id) => Object.keys(t.a).join() === id && t.a[id][0] === 17 && t.a[id][1] === 343 && t.a[id][2] === t.yp + 12 && t.a[id][3] === t.ala - 12;
  tulos('navin laatikot mobiilissa yksi kerrallaan', lkOk(lk1, 'merkinnat') && lk1.ae === 'tff' && lkOk(lk2, 'sisalmys') && lk2.ae === 'fft' && !Object.keys(lk3.a).length && lk3.ae === 'fff',
    JSON.stringify([lk1, lk2, lk3]));
  tulos('Sisälmys', sg.oikealla && sg.rivi && sg.h && /sisalmys/.test(ss1.pop) && ss1.navi && !ss2.pop && ss2.navi && ss2.s === ss1.s && !ss3.pop && ss3.navi && !ss4.pop && ss4.navi && ss4.s > ss1.s && ss4.maj,
    JSON.stringify({ sg, ss1, ss2, ss3, ss4 }));
  await mob360.context().close();

  // Siirtymien kumous (käyttäjän pyyntö 5.11.2026). Oletuksena kumonapit näkyvät vain sivunappien kanssa; kytkin näyttää ne
  // missä tahansa tilassa. Pari on sivunappien oikealla puolella 12 px:n raon päässä, oikea reuna 17 px ruudun reunasta, ja raon
  // puolikkaat kuuluvat lähemmälle parille. Hyppy kumoutuu ja tehdään uudelleen samalle sivulle, nopea sivusarja kumoutuu
  // kerralla ja hidas sivu kerrallaan, uusi siirtymä tyhjentää uudelleen tehtävät, vierityksessä paluu tarkkaan kohtaan.
  const ku = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true })).newPage();
  ku.on('pageerror', e => sivuvirheet.push(e.message));
  const kuAset = async a => { await ku.evaluate(a => localStorage.setItem('luin-asetukset', JSON.stringify(Object.assign({ av: 5 }, a))), a); await ku.reload(); await ku.waitForTimeout(500); };
  await ku.goto(BASE + 'luin.html');
  await ku.evaluate(md => localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })), MD);
  await ku.goto(BASE + 'luin.html#tuo'); await ku.waitForTimeout(600);
  const kaistaK = async () => { const v = await ku.evaluate(() => { const k = document.querySelector('#km-nappi').getBoundingClientRect(), n = document.querySelector('#palkki-nuoli').getBoundingClientRect(); return { x: (k.right + n.left) / 2, y: k.top + k.height / 2 }; });
    await ku.mouse.click(v.x, v.y); await ku.waitForTimeout(100); };
  const kNakyy = () => ku.evaluate(() => !document.querySelector('#kumonapit').hidden);
  await kuAset({ sivutus: 'sivut' }); const kn1 = await kNakyy();
  await kuAset({ sivutus: 'sivut', sivunapit: 1 }); const kn2 = await kNakyy();
  await kuAset({ sivutus: 'vieritys', sivunapit: 1 }); const kn3 = await kNakyy();
  tulos('kumonapit oletuksena vain sivunappien kanssa', !kn1 && kn2 && !kn3, JSON.stringify([kn1, kn2, kn3]));
  await kuAset({ sivutus: 'sivut', sivunapit: 1 });
  const kul = await ku.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), se = q('#sivu-se'), pa = q('.kumo-pari'), r = q('#ala-rivi'), y = r.top + r.height / 2;
    const id = (x, y) => { const e = document.elementFromPoint(x, y); return e && (e.closest('button, #sivunapit, #kumonapit') || e).id; };
    return { rako: +(pa.left - se.right).toFixed(2), reuna: +(innerWidth - pa.right).toFixed(2), korkeus: pa.height,
      osumat: [id(se.right + 3, y), id(pa.left - 3, y), id(innerWidth - 1, y), id(pa.left + 10, y), id(pa.right - 10, y), id(pa.left + 10, r.top + 1)] }; });
  tulos('kumonappien paikka ja napautusalue', kul.rako === 12 && kul.reuna === 17 && kul.korkeus === 34 &&
    JSON.stringify(kul.osumat) === JSON.stringify(['sivunapit', 'kumonapit', 'kumonapit', 'kumo-taakse', 'kumo-eteen', 'kumonapit']), JSON.stringify(kul));
  const kut = () => ku.evaluate(() => { const L = window.__luin; return { s: L.tila.sivu, t: document.querySelector('#kumo-taakse').getAttribute('aria-disabled') === 'false',
    e: document.querySelector('#kumo-eteen').getAttribute('aria-disabled') === 'false', maj: !!L.majakka(), jana: !document.querySelector('#jana').hidden }; });
  await ku.evaluate(() => window.__luin.mene({ b: 20, o: 0 })); await ku.waitForTimeout(100);
  const kh0 = await kut();
  await ku.click('#kumo-taakse', { force: true }); await ku.waitForTimeout(50);   // ei mitään kumottavaa: ei tee mitään eikä avaa aikajanaa
  const kh0b = await kut();
  await ku.evaluate(() => { const L = window.__luin; L.hyppaa({ b: L.nyt().blocks.length - 1, o: 0 }); }); await ku.waitForTimeout(100);
  const kh1 = await kut();
  await ku.click('#kumo-taakse'); await ku.waitForTimeout(100);
  const kh2 = await kut();
  await ku.click('#kumo-eteen'); await ku.waitForTimeout(100);
  const kh3 = await kut();
  tulos('hypyn kumous ja uudelleen', !kh0.t && !kh0.e && kh0b.s === kh0.s && !kh0b.jana && kh1.s > kh0.s && kh1.t && !kh1.e && kh1.maj &&
    kh2.s === kh0.s && !kh2.t && kh2.e && !kh2.maj && !kh2.jana && kh3.s === kh1.s && kh3.t && !kh3.e, JSON.stringify([kh0, kh0b, kh1, kh2, kh3]));
  // Sivusarja: kolme nopeaa käännöstä = yksi siirtymä; kaksi yli 2 s:n välein = kaksi; uusi siirtymä tyhjentää uudelleen tehtävät.
  await ku.evaluate(() => window.__luin.mene({ b: 20, o: 0 })); await ku.waitForTimeout(100);
  const ks0 = (await kut()).s;
  for (let i = 0; i < 3; i++) await ku.keyboard.press('ArrowRight');
  const ks1 = (await kut()).s;
  await ku.click('#kumo-taakse'); await ku.waitForTimeout(50);
  const ks2 = await kut();
  await ku.keyboard.press('ArrowRight'); const ks3 = await kut();
  await ku.waitForTimeout(2100); await ku.keyboard.press('ArrowRight'); await ku.waitForTimeout(50);
  await ku.click('#kumo-taakse'); await ku.waitForTimeout(50); const ks4 = await kut();
  tulos('sivusarjan kumous', ks1 === ks0 + 3 && ks2.s === ks0 && ks2.e && !ks3.e && ks3.s === ks0 + 1 && ks4.s === ks0 + 1, JSON.stringify({ ks0, ks1, ks2, ks3, ks4 }));
  // Palkit auki (verho): kumous toimii ja palkit jäävät auki.
  await kaistaK(); const kv0 = await kut();
  await ku.click('#kumo-taakse'); await ku.waitForTimeout(50); const kv1 = await kut();
  tulos('kumous palkkien ollessa auki', kv0.jana && kv1.jana && kv1.s === ks0, JSON.stringify([kv0, kv1]));
  // Kytkin: ilman sivunappeja päälle, ja vierityksessä näkyy yhä; paluu tarkkaan vierityskohtaan.
  await kuAset({ sivutus: 'sivut' });
  await kaistaK(); await ku.click('#lukija .ratas');
  await ku.click('#asetukset button[data-kytkin="kumoNapit"]'); await ku.waitForTimeout(50);
  const kk1 = await ku.evaluate(() => ({ n: !document.querySelector('#kumonapit').hidden, a: window.__luin.aset.kumoNapit, p: document.querySelector('#asetukset button[data-kytkin="kumoNapit"]').getAttribute('aria-pressed') }));
  await ku.click('#asetukset [data-a="sivutus"] button[data-arvo="vieritys"]'); await ku.waitForTimeout(100);
  await ku.click('#asetukset .sulje');
  const kk2 = await kNakyy();
  await ku.evaluate(() => window.scrollTo(0, 3333)); await ku.waitForTimeout(200);
  const ky0 = await ku.evaluate(() => scrollY);
  await ku.evaluate(() => { const L = window.__luin; L.hyppaa({ b: L.nyt().blocks.length - 1, o: 0 }); }); await ku.waitForTimeout(100);
  const ky1 = await ku.evaluate(() => scrollY);
  await ku.click('#kumo-taakse'); await ku.waitForTimeout(100);
  const ky2 = await ku.evaluate(() => scrollY);
  tulos('kumonappien kytkin ja vierityksen kumous', kk1.n && kk1.a === 1 && kk1.p === 'true' && kk2 && ky1 > ky0 + 1000 && ky2 === ky0, JSON.stringify({ kk1, kk2, y: [ky0, ky1, ky2] }));
  await ku.context().close();

  // Light Phone (360 × 413, 29.10.2026). Vierityksessä sivu ei levene sivusuunnassa: ylipitkät sanat ja osoitteet katkeavat
  // (SEP:n Dewey-leike oli 690 px leveä), myös suurimmalla kirjasinkoolla. Verkkolinkit ovat oletuksena tavallista tekstiä,
  // myös kirjallisuusluettelon (käyttäjän päätös 30.10.2026). Asetukset, jotka eivät muuta asettelua (verkkolinkit, teema, aikajana), eivät
  // asettele tekstiä uudelleen (Deweyllä sivutettuna jokainen napautus kesti 3,3 s); marginaali asettelee.
  const lp = await (await b.newContext({ viewport: { width: 360, height: 413 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  lp.on('pageerror', e => sivuvirheet.push(e.message));
  await lp.goto(BASE + 'luin.html');
  await lp.evaluate(md => { localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify({ koko: 32, av: 5 })); }, MD);
  await lp.goto(BASE + 'luin.html#tuo'); await lp.waitForTimeout(600); await lp.reload(); await lp.waitForTimeout(600);
  const leveys = () => lp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const yli32 = await leveys();
  await lp.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.koko = 19; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await lp.reload(); await lp.waitForTimeout(600);
  const yli19 = await leveys();
  tulos('vierityksessä ei vaakavieritystä (360 px, koko 32 ja 19)', yli32 === 0 && yli19 === 0, 'ylitys ' + yli32 + ' ja ' + yli19 + ' px');
  const linkit = () => lp.evaluate(() => {
    const A = [...document.querySelectorAll('#teksti a')], ulko = a => !/^#/.test(a.getAttribute('href') || a.dataset.href || '#');
    return { ulko: A.filter(ulko).length, toimii: A.filter(a => ulko(a) && a.hasAttribute('href')).length };
  });
  const vl0 = await linkit();
  await lp.evaluate(() => document.querySelector('#lukija .ratas').click());
  const as0 = await lp.evaluate(() => window.__luin.tila.asetteluja);
  await lp.click('#asetukset [data-kytkin="verkkolinkit"]');
  await lp.click('#asetukset [data-a="teema"] button[data-arvo="tumma"]');
  await lp.click('#asetukset [data-a="janaTaso"] button[data-arvo="2"]');
  const as1 = await lp.evaluate(() => window.__luin.tila.asetteluja), vl1 = await linkit();
  await lp.click('#asetukset [data-a="marginaali"] button[data-arvo="reilu"]');
  const as2 = await lp.evaluate(() => window.__luin.tila.asetteluja);
  await lp.click('#asetukset [data-kytkin="verkkolinkit"]');
  const vl2 = await linkit(), vlTallessa = await lp.evaluate(() => JSON.parse(localStorage.getItem('luin-asetukset')).verkkolinkit);
  tulos('verkkolinkit oletuksena pois, kytkin palauttaa kaikki', vl0.toimii === 0 && vl1.toimii === vl1.ulko && vl2.toimii === 0 && vlTallessa === 0,
    JSON.stringify({ vl0, vl1, vl2 }));
  tulos('asetus asettelee tekstin vain, jos asettelu muuttuu', as1 === as0 && as2 === as0 + 1, 'asetteluja ' + [as0, as1, as2].join(' → '));
  await lp.context().close();

  // Työpöytä: palkit pysyviä, alapalkissa ei osion nimeä eikä natsaa, palkin napautus avaa ja sulkee aikajanan,
  // palkkinuoli kääntyy, tekstin napautus vierityksessä ei tee mitään.
  const tp = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  tp.on('pageerror', e => sivuvirheet.push(e.message));
  await tp.goto(BASE + 'luin.html');
  await tp.evaluate(md => { localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify({ av: 4 })); }, MD);
  await tp.goto(BASE + 'luin.html#tuo'); await tp.waitForTimeout(600);
  const tila2 = () => tp.evaluate(() => ({ yla: getComputedStyle(document.querySelector('.ylapalkki')).display !== 'none', jana: !document.querySelector('#jana').hidden,
    mob: document.body.classList.contains('mobiili'), teksti: document.querySelector('#ala-rivi').innerText.trim(), pros: getComputedStyle(document.querySelector('#jana-pros')).display !== 'none' && /^\d+ %$/.test(document.querySelector('#jana-pros').textContent), ala: !document.querySelector('#ala-pros'),
    nuoli: (n => n.display === 'none' ? 'ei' : (n.transform !== 'none' ? 'alas' : 'ylös'))(getComputedStyle(document.querySelector('#palkki-nuoli'))) }));
  const t0 = await tila2();
  await tp.mouse.click(640, 400); await tp.waitForTimeout(100);
  const t1 = await tila2();
  await tp.mouse.click(640, 785); await tp.waitForTimeout(100);
  const t2 = await tila2();
  await tp.mouse.click(640, 785); await tp.waitForTimeout(100);
  const t3 = await tila2();
  tulos('työpöydän palkit', !t0.mob && t0.yla && !t0.jana && t0.teksti === '' && t0.ala && !t1.jana && t2.jana && t2.pros && t2.yla && !t3.jana,
    JSON.stringify([t0, t1, t2, t3].map(x => (x.yla ? 'Y' : '-') + (x.jana ? 'J' : '-') + ' "' + x.teksti + '"')));
  // Palkkinuoli myös työpöydällä (käyttäjän vaatimus 22.10.2026): kiinni ylös ja ontto, auki alas ja täytetty.
  tulos('työpöydän palkkinuoli', t0.nuoli === 'ylös' && t2.nuoli === 'alas' && t3.nuoli === 'ylös', [t0, t2, t3].map(x => x.nuoli).join(' → '));
  // Työpöydällä vasen laita 24 px (kirjanmerkkinapin symboli) ja oikea 29 px (kiekko ja ruoto).
  await tp.mouse.click(640, 785); await tp.waitForTimeout(100);
  const lt = await laidat(tp); await tp.click('#lukija .ratas'); lt.raksi = await raksiKeski(tp); await tp.click('#asetukset .sulje');
  await tp.mouse.click(640, 785); await tp.waitForTimeout(100);
  tulos('palkkien laidat työpöydällä', laidatOk(lt, 24, 29), JSON.stringify(lt));
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
  // Navin laatikot työpöydällä (käyttäjän pyyntö 5.11.2026): leveällä kolme rinnakkain nappien järjestyksessä (Merkinnät
  // vasemmassa laidassa, Etsi keskellä, Sisälmys oikeassa laidassa), yläpalkin ja navin välissä, ei päällekkäin. Raon
  // napautus sulkee Etsin ja Sisälmyksen, ei Merkintöjä eikä navia. Kavennus jättää viimeksi avatun koko leveydelle; navin
  // sulku sulkee laatikot.
  await tp.setViewportSize({ width: 1440, height: 900 }); await tp.waitForTimeout(400);
  await tp.mouse.click(720, 885); await tp.waitForTimeout(100);
  const ltT = () => tp.evaluate(() => {
    const R = s => document.querySelector(s).getBoundingClientRect(), a = {};
    for (const id of ['merkinnat', 'haku', 'sisalmys']) if (!document.getElementById(id).hidden) { const r = R('#' + id); a[id] = [r.left, r.right, r.top, r.bottom].map(Math.round); }
    return { a, yp: R('.ylapalkki').bottom, ala: R('#ala').top, navi: !document.querySelector('#jana').hidden,
      ae: ['#merk-avaa', '#etsi-avaa', '#sis-avaa'].map(s => document.querySelector(s).getAttribute('aria-expanded')[0]).join('') };
  });
  for (const s of ['#merk-avaa', '#etsi-avaa', '#sis-avaa']) { await tp.click(s); await tp.waitForTimeout(100); }
  const lt1 = await ltT(), [M, H, S] = [lt1.a.merkinnat, lt1.a.haku, lt1.a.sisalmys];
  const rinn = !!(M && H && S) && M[0] === 24 && S[1] === 1440 - 29 && M[1] < H[0] && H[1] < S[0] && Math.abs((H[0] + H[1]) / 2 - (24 + 1411) / 2) <= 1 &&
    [M, H, S].every(r => r[2] === lt1.yp + 12 && r[3] === lt1.ala - 12) && lt1.ae === 'ttt';
  if (M && H) { await tp.mouse.click(Math.round((M[1] + H[0]) / 2), 400); await tp.waitForTimeout(100); }
  const lt2 = await ltT();
  await tp.click('#sis-avaa'); await tp.waitForTimeout(100);
  await tp.setViewportSize({ width: 800, height: 900 }); await tp.waitForTimeout(400);
  const lt3 = await ltT();
  await tp.click('#etsi-avaa'); await tp.waitForTimeout(100);
  const lt4 = await ltT();
  await tp.mouse.click(400, 885); await tp.waitForTimeout(100);
  const lt5 = await ltT();
  tulos('navin laatikot työpöydällä', rinn && Object.keys(lt2.a).join() === 'merkinnat' && lt2.navi && lt2.ae === 'tff' &&
    Object.keys(lt3.a).join() === 'sisalmys' && lt3.a.sisalmys[0] === 24 && lt3.a.sisalmys[1] === 800 - 29 && lt3.ae === 'fft' &&
    Object.keys(lt4.a).join() === 'haku' && lt4.ae === 'ftf' && !lt5.navi && !Object.keys(lt5.a).length && lt5.ae === 'fff',
    JSON.stringify([lt1, lt2, lt3, lt4, lt5].map(x => x.a)) + ' ' + [lt1, lt2, lt3, lt4, lt5].map(x => x.ae).join(','));
  await tp.context().close();

  // Maalauskone (pilotti 5.11.2026): Luinin oma maalaus tarttuu sanoihin ilman selaimen valintaa, kahvat ovat
  // merkkien reunoilla ja niiden veto säätää aluetta; kosketuksella pitkä painallus ja veto maalaavat, napautus ja
  // vieritys eivät. Valikon lisät: kopio viitteellä, sanakirja (Wiktionary siepattuna) ja käännös (DeepL-osoite).
  {
  const mk = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await mk.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE.slice(0, -1) });
  const mp = await mk.newPage();
  mp.on('pageerror', e => sivuvirheet.push(e.message));
  const skHaut = [];
  await mp.route('https://en.wiktionary.org/**', r => {
    const w = decodeURIComponent(r.request().url().split('/').pop()); skHaut.push(w);
    const j = w === 'perusmuoto' ? { fi: [{ partOfSpeech: 'Noun', language: 'Finnish', definitions: [{ definition: 'base form' }] }] }
      : { fi: [{ partOfSpeech: 'Noun', language: 'Finnish', definitions: [{ definition: '<a href="/wiki/Appendix:Glossary#x">genitive</a> of <i><a href="/wiki/perusmuoto#Finnish">perusmuoto</a></i>' }] }] };
    r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(j) });
  });
  await mp.addInitScript(() => { window.__avattu = []; window.open = (u, n, f) => { window.__avattu.push(u); window.__ikkuna = [n, f || '']; return null; }; });
  await mp.goto(BASE + 'luin.html');
  await mp.evaluate(md => { localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify({ av: 5 })); }, MD);
  await mp.goto(BASE + 'luin.html#tuo'); await mp.waitForTimeout(600);
  // Pitkän kappaleen sanojen keskikohdat (sanan kolmas merkki), kappale ruudun keskellä.
  const sanat = () => mp.evaluate(() => {
    const el = [...document.querySelectorAll('#teksti p[data-b]')].find(x => x.textContent.length > 300 && !x.querySelector('mark'));
    el.scrollIntoView({ block: 'center' });
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), out = []; let t;
    while ((t = tw.nextNode())) { if (t.parentElement.closest('.sidenote, .fnref')) continue; const re = /[\p{L}]{6,}/gu; let m;
      while ((m = re.exec(t.data))) { const q = document.createRange(); q.setStart(t, m.index + 2); q.setEnd(t, m.index + 3); const r = q.getClientRects()[0]; if (r) out.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); } }
    return { b: +el.dataset.b, s: out };
  });
  const mtila = () => mp.evaluate(() => {
    const L = window.__luin, n = L.nyt(), al = n.merk.al, h = al[al.length - 1], K = document.querySelectorAll('.kahva');
    const reunat = h ? h.segs.every(s => { const t = n.txt[s.b], w = /[\p{L}\p{N}]/u; return !(w.test(t[s.s - 1] || '') && w.test(t[s.s])) && !(w.test(t[s.e] || '') && w.test(t[s.e - 1])); }) : false;
    const mk = h && [...document.querySelectorAll('mark.ali[data-h="' + h.id + '"]')], eka = mk && mk.length && mk[0].getClientRects()[0], vika = mk && mk.length && [...mk[mk.length - 1].getClientRects()].pop();
    return { n: al.length, x: h ? h.segs.map(s => s.x).join(' ') : '', reunat, sel: getSelection().toString(), kahvat: !document.querySelector('#kahvat').hidden,
      kahvaEro: eka ? [Math.abs(K[0].getBoundingClientRect().left - eka.left), Math.abs(K[1].getBoundingClientRect().left - vika.right)].map(v => +v.toFixed(2)) : null,
      luonnos: document.querySelectorAll('mark.luonnos').length, pop: document.querySelector('#pop').hidden ? '' : document.querySelector('#pop').className };
  });
  const veda = async (a, z) => { await mp.mouse.move(a.x, a.y); await mp.mouse.down(); await mp.mouse.move(z.x, z.y, { steps: 8 }); await mp.mouse.up(); await mp.waitForTimeout(250); };
  let sw = await sanat();
  await veda(sw.s[2], sw.s[5]);
  const m0 = await mtila();
  // Kahvat vasta alleviivauksen napautuksesta (käyttäjän päätös 5.11.2026).
  await mp.mouse.click(sw.s[3].x, sw.s[3].y); await mp.waitForTimeout(200);
  const m1 = await mtila();
  const ks = await mp.evaluate(() => { const k = document.querySelector('.kahva[data-paa="loppu"]'), r = k.querySelector('svg').getBoundingClientRect();
    return { w: r.width, h: r.height, rako: +(r.top - (k.getBoundingClientRect().top + parseFloat(k.style.getPropertyValue('--kh')))).toFixed(2) }; });
  tulos('kahvan salmiakki 20 × 25 px rivin alla', ks.w === 20 && ks.h === 25 && ks.rako === 1, JSON.stringify(ks));
  const oma = await mp.evaluate(() => [document.documentElement.classList.contains('oma-maalaus'), getComputedStyle(document.querySelector('#teksti')).userSelect]);
  tulos('Luinin maalaus sanarajoihin ilman selaimen valintaa', oma[0] && oma[1] === 'none' && m0.n === 1 && m0.reunat && m0.sel === '' && !m0.kahvat && !m0.pop &&
    m1.kahvat && m1.kahvaEro.every(v => v < .5) && /rivi/.test(m1.pop), JSON.stringify({ oma, m0, m1 }));
  // Loppukahvan veto kaksi sanaa eteenpäin (kahvan ja sormen ero säilyy).
  const lk = await mp.evaluate(() => { const r = document.querySelector('.kahva[data-paa="loppu"] .k-ote').getBoundingClientRect(); return { x: r.left + 22, y: r.top + 8 }; });
  await veda(lk, { x: lk.x + sw.s[7].x - sw.s[5].x, y: lk.y + sw.s[7].y - sw.s[5].y });
  const m2 = await mtila();
  const m2t = await mp.evaluate(() => { const n = window.__luin.nyt(), m = JSON.parse(localStorage.getItem('luin-merkit:' + n.e.id)); return m.al[m.al.length - 1].segs.map(s => s.x).join(' '); });
  tulos('loppukahvan veto', m2.n === 1 && m2.x.length > m1.x.length && m2.x.indexOf(m1.x) === 0 && m2.reunat && m2.kahvaEro.every(v => v < .5) && m2t === m2.x, JSON.stringify({ ennen: m1.x, jalkeen: m2.x }));
  // Ilman sukkelaa: luonnos ja valikko; Esc poistaa luonnoksen.
  await mp.evaluate(() => { window.__luin.aset.auto = 0; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
  sw = await sanat();
  await veda(sw.s[1], sw.s[3]);
  const m3 = await mtila();
  // Valikon järjestys (käyttäjän päätös 5.11.2026): alleviivaus, kirjaus, (sanakirja yhdelle sanalle), käännös, kopio; ei kirjanmerkkiä.
  const jarj = await mp.evaluate(() => [...document.querySelectorAll('#pop button[data-k]')].map(b => b.dataset.k).join());
  await mp.mouse.click(sw.s[2].x, sw.s[2].y); await mp.waitForTimeout(200);
  const m3b = await mtila();
  await mp.keyboard.press('Escape'); await mp.waitForTimeout(100);
  const m4 = await mtila();
  tulos('luonnos ja valikko ilman sukkelaa', m3.luonnos > 0 && m3.n === 1 && /rivi/.test(m3.pop) && !m3.kahvat && jarj === 'ali,kir,kaanna,kopioi' && m3b.kahvat && m3b.luonnos > 0 &&
    m4.luonnos === 0 && !m4.kahvat && !m4.pop, JSON.stringify({ m3, jarj, kahvatNapautuksesta: m3b.kahvat, m4 }));
  // Kopio viitteellä: lyhyt (Sukunimi vuosi, luku) ja pitkä (koko viite ja luku).
  const kopioi = async tapa => {
    await mp.evaluate(t => { window.__luin.aset.kopioViite = t; }, tapa);
    const w = await sanat(); await veda(w.s[1], w.s[3]); await mp.click('#pop button[data-k="kopioi"]'); await mp.waitForTimeout(150);
    const r = await mp.evaluate(() => ({ leike: '', ote: [...document.querySelectorAll('mark.luonnos')].map(m => m.textContent).join('').replace(/­/g, ''),
      lyhyt: window.__luin.lyhytViite(), viite: (window.__luin.nyt().e.viite || '').replace(/\*/g, ''), loc: (window.__luin.paikannin(+document.querySelector('mark.luonnos').closest('[data-b]').dataset.b) || {}).s || '' }));
    r.leike = await mp.evaluate(() => navigator.clipboard.readText());
    await mp.keyboard.press('Escape');
    return r;
  };
  const ikoni = async t => { await mp.evaluate(t => { window.__luin.aset.kopioViite = t; }, t); const w = await sanat(); await veda(w.s[1], w.s[3]);
    const n = await mp.evaluate(() => document.querySelectorAll('#pop button[data-k="kopioi"] svg path').length); await mp.keyboard.press('Escape'); return n; };
  const ikonit = [await ikoni('ei'), await ikoni('lyhyt'), await ikoni('pitka')];
  const kl = await kopioi('lyhyt'), kp = await kopioi('pitka');
  tulos('kopio viitteellä', kl.leike === kl.ote + ' (' + kl.lyhyt + (kl.loc ? ', ' + kl.loc : '') + ')' && kp.leike.indexOf(kp.ote + '\n\n' + kp.viite) === 0 && (!kp.loc || kp.leike.endsWith(' ' + kp.loc)),
    JSON.stringify({ lyhyt: kl.leike.slice(-60), pitka: kp.leike.slice(-80) }));
  tulos('kopion ikoni kertoo viitteen', ikonit[0] === 0 && ikonit[1] === 1 && ikonit[2] === 1, JSON.stringify(ikonit));
  await mp.evaluate(() => { window.__luin.aset.kopioViite = 'ei'; });
  // Sanakirja: työpöydän tuplaklikkaus avaa sen suoraan (ei valikkoa, ei alleviivausta); perusmuoto on napautettava,
  // ‹ palaa edelliseen sanaan, lisää vie sanan Wikisanakirjan sivulle.
  sw = await sanat();
  const nEnnen = (await mtila()).n;
  await mp.mouse.dblclick(sw.s[4].x, sw.s[4].y); await mp.waitForTimeout(350);
  const sk1 = await mp.evaluate(() => ({ luokka: document.querySelector('#pop').className, teksti: document.querySelector('#pop').innerText, linkit: [...document.querySelectorAll('#pop button.sk-sana')].map(x => x.dataset.sana),
    takaisin: !!document.querySelector('#pop .sk-takaisin'), lisaa: (document.querySelector('#pop a.sk-lisa') || {}).href || '' }));
  const sk1t = await mtila();
  await mp.click('#pop button.sk-sana'); await mp.waitForTimeout(300);
  const sk2 = await mp.evaluate(() => document.querySelector('#pop').innerText);
  await mp.click('#pop button.sk-takaisin'); await mp.waitForTimeout(300);
  const sk3 = await mp.evaluate(() => document.querySelector('#pop .sk-ots span').textContent);
  tulos('sanakirja tuplaklikkauksesta', /sanakirja/.test(sk1.luokka) && sk1t.n === nEnnen && !sk1t.kahvat && sk1.linkit.join() === 'perusmuoto' && /genitive of perusmuoto/.test(sk1.teksti) &&
    !sk1.takaisin && /^https:\/\/en\.wiktionary\.org\/wiki\//.test(sk1.lisaa) && !/valikko|englanninkielinen/.test(sk1.teksti) && /base form/.test(sk2) && /‹/.test(sk2) && sk3.length > 0 && skHaut.length === 2,
    JSON.stringify({ linkit: sk1.linkit, haut: skHaut, lisaa: sk1.lisaa }));
  await mp.keyboard.press('Escape');
  // Käännös: DeepL:n osoite lähde- ja kohdekielellä, / kenoviivalla.
  sw = await sanat(); await veda(sw.s[1], sw.s[2]);
  await mp.click('#pop button[data-k="kaanna"]');
  const dl = await mp.evaluate(() => window.__avattu.pop() || ''), dlIk = await mp.evaluate(() => window.__ikkuna);
  tulos('käännös DeepL-osoitteeseen', /^https:\/\/www\.deepl\.com\/translator#(fi|en|de|fr|sv)\/(fi|en)\/[^/]+$/.test(dl), dl.slice(0, 90));
  // Sama nimetty välilehti joka kerta, ilman noopeneria, joka estäisi uudelleenkäytön (käyttäjän pyyntö 5.11.2026).
  tulos('käännös samaan DeepL-välilehteen', dlIk && dlIk[0] === 'luin-deepl' && !/noopener/.test(dlIk[1]), JSON.stringify(dlIk));
  await mp.keyboard.press('Escape');
  // Selaimen tapa: teksti valittavissa kuten ennen.
  await mp.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.maalaus = 'selain'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await mp.reload(); await mp.waitForTimeout(400);
  const st = await mp.evaluate(() => [document.documentElement.classList.contains('oma-maalaus'), getComputedStyle(document.querySelector('#teksti')).userSelect]);
  tulos('selaimen maalaus', !st[0] && st[1] !== 'none', JSON.stringify(st));
  await mk.close();
  // Kosketus: pitkä painallus ja veto maalaavat, napautus ja vieritys eivät.
  const kk = await b.newContext({ viewport: { width: 412, height: 824 }, hasTouch: true, isMobile: true });
  const kp2 = await kk.newPage();
  kp2.on('pageerror', e => sivuvirheet.push(e.message));
  const cdp = await kk.newCDPSession(kp2);
  await kp2.route('https://en.wiktionary.org/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ fi: [{ partOfSpeech: 'Noun', language: 'Finnish', definitions: [{ definition: 'test' }] }] }) }));
  const kosk = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await kp2.goto(BASE + 'luin.html');
  await kp2.evaluate(md => { localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify({ av: 5 })); }, MD);
  await kp2.goto(BASE + 'luin.html#tuo'); await kp2.waitForTimeout(600);
  const ksanat = await kp2.evaluate(() => {
    const el = [...document.querySelectorAll('#teksti p[data-b]')].find(x => x.textContent.length > 300);
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 200);
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), out = []; let t;
    while ((t = tw.nextNode())) { if (t.parentElement.closest('.sidenote, .fnref')) continue; const re = /[\p{L}]{6,}/gu; let m;
      while ((m = re.exec(t.data))) { const q = document.createRange(); q.setStart(t, m.index + 2); q.setEnd(t, m.index + 3); const r = q.getClientRects()[0]; if (r) out.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); } }
    return out;
  });
  const kn = () => kp2.evaluate(() => ({ n: window.__luin.nyt().merk.al.length, x: (window.__luin.nyt().merk.al.slice(-1)[0] || { segs: [] }).segs.map(s => s.x).join(' '), y: scrollY }));
  const [ka, kz] = [ksanat[1], ksanat[4]];
  await kosk('touchStart', ka.x, ka.y); await kp2.waitForTimeout(80); await kosk('touchEnd'); await kp2.waitForTimeout(500);
  const kt0 = await kn();
  await kosk('touchStart', ka.x, ka.y); for (let i = 1; i <= 6; i++) { await kosk('touchMove', ka.x, ka.y - i * 25); await kp2.waitForTimeout(20); } await kosk('touchEnd'); await kp2.waitForTimeout(700);
  const kt1 = await kn();
  await kp2.evaluate(y => window.scrollTo(0, y), kt0.y); await kp2.waitForTimeout(200);
  await kosk('touchStart', ka.x, ka.y); await kp2.waitForTimeout(600);
  for (let i = 1; i <= 8; i++) { await kosk('touchMove', ka.x + (kz.x - ka.x) * i / 8, ka.y + (kz.y - ka.y) * i / 8); await kp2.waitForTimeout(30); }
  await kosk('touchEnd'); await kp2.waitForTimeout(300);
  const kt2 = await kn();
  const kk2 = await kp2.evaluate(() => !document.querySelector('#kahvat').hidden);
  tulos('kosketusmaalaus', kt0.n === 0 && kt1.n === 0 && kt1.y !== kt0.y && kt2.n === 1 && kt2.x.split(' ').length >= 3 && !kk2, JSON.stringify({ napautus: kt0.n, vieritys: [kt1.n, kt0.y, kt1.y], maalaus: kt2.x, kahvat: kk2 }));
  // Sukkela sanasto (oletus): pelkkä pitkä painallus sanaan (ei vetoa) avaa vain sanakirjan, ei alleviivausta eikä kahvoja.
  // Pois päältä sama painallus avaa valikon sanakirjoineen, ja luonnoksen napautus tuo kahvat.
  const [kb] = [ksanat[7]];
  const kTila = () => kp2.evaluate(() => ({ n: window.__luin.nyt().merk.al.length, luonnos: document.querySelectorAll('mark.luonnos').length, kahvat: !document.querySelector('#kahvat').hidden,
    pop: document.querySelector('#pop').hidden ? '' : document.querySelector('#pop').className, napit: [...document.querySelectorAll('#pop button[data-k]')].map(b => b.dataset.k).join() }));
  await kosk('touchStart', kb.x, kb.y); await kp2.waitForTimeout(600); await kosk('touchEnd'); await kp2.waitForTimeout(400);
  const kt3 = await kTila();
  await kp2.keyboard.press('Escape');
  await kp2.evaluate(() => { window.__luin.aset.sukSana = 0; });
  await kosk('touchStart', kb.x, kb.y); await kp2.waitForTimeout(600); await kosk('touchEnd'); await kp2.waitForTimeout(300);
  const kt4 = await kTila();
  await kosk('touchStart', kb.x, kb.y); await kp2.waitForTimeout(60); await kosk('touchEnd'); await kp2.waitForTimeout(400);
  const kt5 = await kTila();
  tulos('pitkä painallus sanaan: sukkela sanasto', kt3.n === kt2.n && /sanakirja/.test(kt3.pop) && kt3.luonnos > 0 && !kt3.kahvat &&
    kt4.n === kt2.n && kt4.napit === 'ali,kir,sk,kaanna,kopioi' && !kt4.kahvat && kt5.kahvat, JSON.stringify({ kt3, kt4, kahvatNapautuksesta: kt5.kahvat }));
  await kk.close();
  }

  tulos('ei sivuvirheitä', sivuvirheet.length === 0, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  process.exitCode = virheita ? 1 : 0;
});
