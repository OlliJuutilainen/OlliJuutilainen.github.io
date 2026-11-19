// Tiedot ja uusi laitos (käyttäjän pyyntö 15.11.2026): pinon valikosta Latomoon ja takaisin. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/laitos-testi.js [kuvakansio]
// Tarkistaa: valikon kohdat; tietojen säädössä lukittu tekstikenttä, merkintöjen siirto tasan (tekijän lisäys siirtää
// lohkoja, ja sama lyhyt sana naapurikappaleessa houkuttelisi katkelmahaun väärään kohtaan), muuttumaton tallennus
// tavulleen samana ja muuttuneen leipätekstin hylkäys; uuden laitoksen kolme valintaa (toinen laitos merkintöineen,
// ilman merkintöjä, korvaava) ja irronneen merkinnän ilmoitus; alkuperäisen koskemattomuus; osoitteesta haetun tekstin
// suoja uudelleenhaulta.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const MD = `# Koeteksti

## 1. Johdanto

Heidegger kirjoittaa, että Dasein on aina jo maailmassa. Tämä ensimmäinen kappale on pitkä.

Toisessa kappaleessa Dasein esiintyy taas, ja tässä kohdassa alleviivaus osuu sanaan.

Kolmas kappale poistetaan uudessa laitoksessa kokonaan, ja siinä on oma alleviivaus.

Neljäs kappale muuttuu hieman: tämä lause säilyy ennallaan ja siinä on kirjanmerkki.

## 2. Loppu

Viides kappale pysyy samana.
`;
// Uusi laitos: alkuun uusi kappale, kolmas pois, neljännen loppuun lisäys.
const LAITOS = MD.replace('## 1. Johdanto\n\n', '## 1. Johdanto\n\nUusi alkukappale ennen muita.\n\n')
  .replace('Kolmas kappale poistetaan uudessa laitoksessa kokonaan, ja siinä on oma alleviivaus.\n\n', '')
  .replace('on kirjanmerkki.', 'on kirjanmerkki. Lisäys loppuun.');

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const page = await (await selain.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  // Tekstit ovat tekstikannassa (luin/tekstit.js, 19.11.2026), muu localStoragessa.
  const ls = (k) => page.evaluate(k => k.startsWith('luin-teksti:') ? LuinTekstit.lue(k.slice(12)) : JSON.parse(localStorage.getItem(k)), k);
  const lista = () => ls('luin-lista');
  async function pinoon() { await page.goto(U + 'luin.html#'); await page.waitForSelector('#nimikkeet li'); }
  async function valikko(id, k) {
    await page.click(`#nimikkeet button.jako[data-id="${id}"]`);
    await page.click(`#pop button[data-k="${k}"]`);
    await page.waitForURL(/latomo\.html#/);
    await page.waitForFunction(() => window.__latomo && document.querySelector('#md').value.length > 0);
  }
  async function tallenna() {
    await page.click('#avaa');
    await page.waitForURL(/luin\.html/);
    await page.waitForSelector('#viesti:not([hidden])');
    return page.textContent('#viesti');
  }
  // Avaa tekstin ja tarkistaa jokaisen merkinnän: katkelma osuu kohtaansa, ja odotetut lohkot alkavat oikein.
  async function tarkista(id) {
    // Ensin pinoon: sama osoite uudelleen ei vaihtaisi hashia eikä lukisi merkintöjä uudelleen.
    await page.goto(U + 'luin.html#');
    await page.goto(U + 'luin.html#id=' + encodeURIComponent(id));
    await page.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().txt.length);
    return page.evaluate(() => {
      const n = window.__luin.nyt(), r = { km: [], al: [] };
      n.merk.km.forEach(k => r.km.push({ id: k.id, orpo: !!k.orpo, osuu: n.txt[k.b].slice(k.o, k.o + k.s.length) === k.s, alku: n.txt[k.b].slice(0, 12) }));
      n.merk.al.forEach(h => r.al.push({ id: h.id, n: h.n || '', orpo: h.segs.some(q => q.orpo), osuu: h.segs.every(q => q.orpo || n.txt[q.b].slice(q.s, q.e) === q.x),
        alku: n.txt[h.segs[0].b] == null ? '' : n.txt[h.segs[0].b].slice(0, 12) }));
      return r;
    });
  }

  // Teksti pinoon Latomon tavalla ja merkinnät sen lohkoihin.
  await page.goto(U + 'luin.html#');
  await page.evaluate(md => { localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'koe' })); }, MD);
  await page.goto(U + 'luin.html#tuo');
  await page.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().txt.length);
  const ID = (await lista())[0].id;
  const txt = await page.evaluate(() => window.__luin.nyt().txt);
  const seg = (b, sana, n) => { const s = txt[b].indexOf(sana); return { b, s, e: s + sana.length, x: sana }; };
  const bP = (alku) => txt.findIndex(t => t.startsWith(alku));
  const MERK = {
    km: [{ id: 'k1', b: bP('Neljäs'), o: 0, s: txt[bP('Neljäs')].slice(0, 40), t: 1, osio: '1. Johdanto' }],
    al: [
      { id: 'a-dasein', t: 1, segs: [seg(bP('Toisessa'), 'Dasein')] },
      { id: 'a-kolmas', t: 1, segs: [seg(bP('Kolmas'), 'oma alleviivaus')] },
      { id: 'a-viides', t: 1, segs: [seg(bP('Viides'), 'pysyy samana')] },
      { id: 'a-kirjaus', t: 1, n: 'Kirjaus säilyy.', segs: [seg(bP('Heidegger'), 'maailmassa')] }
    ]
  };
  await page.evaluate(([id, m]) => localStorage.setItem('luin-merkit:' + id, JSON.stringify(m)), [ID, MERK]);
  const ennen = await tarkista(ID);
  tulos('lähtötilanne: 5 merkintää kohdallaan', ennen.km.concat(ennen.al).every(x => x.osuu && !x.orpo) && ennen.al.length === 4);

  // Valikon kohdat.
  await pinoon();
  await page.click(`#nimikkeet button.jako[data-id="${ID}"]`);
  const kohdat = await page.$$eval('#pop button[data-k]', bs => bs.map(b => b.textContent));
  tulos('valikossa muuta metatietoja ja lado uusi laitos', kohdat.includes('muuta metatietoja') && kohdat.includes('lado uusi laitos'), kohdat.join(' | '));
  await page.keyboard.press('Escape');

  // 1. Tietojen säätö: tekijä lisää otsikkolohkoon lohkon, joten leipätekstin lohkot siirtyvät yhdellä.
  await pinoon();
  await valikko(ID, 'tiedot');
  const lt = await page.evaluate(() => ({ ro: document.querySelector('#md').readOnly, nappi: document.querySelector('#avaa').textContent,
    lappu: document.querySelector('#pinosta-lappu').textContent, valinnat: document.querySelector('#laitos-valinnat').hidden,
    ohje: document.querySelector('#pinosta-ohje').textContent }));
  tulos('tietojen säätö: kenttä lukittu, Tallenna tiedot, ei laitosvalintoja', lt.ro && lt.nappi === 'Tallenna tiedot' && lt.valinnat && /tietojen säätö/.test(lt.lappu), JSON.stringify(lt));
  tulos('tietojen säätö: ohje kertoo merkintöjen määrän', /merkinnät \(5\)/.test(lt.ohje), lt.ohje);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'laitos-tiedot.png'), fullPage: false });
  await page.fill('.kentta[data-k="tekijä"] input', 'Maija Meikäläinen');
  await page.evaluate(() => window.__latomo.paivita());
  let v = await tallenna();
  tulos('tietojen säätö: ilmoitus', /^Tiedot päivitetty: ”Koeteksti”\.$/.test(v.trim()), v);
  const mdT = await ls('luin-teksti:' + ID);
  tulos('tietojen säätö: etukentässä tekijä, leipäteksti ennallaan', /tekijä: Maija Meikäläinen/.test(mdT) && mdT.endsWith(MD), mdT.slice(0, 80));
  tulos('tietojen säätö: sama tunniste, ei uutta nimikettä', (await lista()).length === 1);
  const t1 = await tarkista(ID);
  const kaikki = r => r.km.concat(r.al);
  tulos('tietojen säätö: kaikki merkinnät kohdallaan', kaikki(t1).every(x => x.osuu && !x.orpo), JSON.stringify(kaikki(t1).filter(x => !x.osuu || x.orpo)));
  tulos('tietojen säätö: Dasein jäi toiseen kappaleeseen (ei naapuriin)', t1.al.find(x => x.id === 'a-dasein').alku === 'Toisessa kap');
  // Vertailu: pelkkä katkelmahaku (paikanna) olisi vienyt Daseinin ensimmäiseen kappaleeseen.
  const naivi = await page.evaluate(([vb, s]) => {
    const n = window.__luin.nyt();
    for (let d = 0; d < n.txt.length; d++) for (const c of d ? [vb - d, vb + d] : [vb]) { const t = n.txt[c]; if (t != null && t.indexOf(s) >= 0) return t.slice(0, 12); }
  }, [MERK.al[0].segs[0].b, 'Dasein']);
  tulos('(vertailu: pelkkä katkelmahaku olisi osunut naapuriin)', naivi === 'Heidegger ki', naivi);

  // 2. Muuttamaton tallennus on tavulleen sama.
  const merkEnnen = JSON.stringify(await ls('luin-merkit:' + ID));
  await pinoon();
  await valikko(ID, 'tiedot');
  v = await tallenna();
  tulos('muuttamaton tietojen tallennus: teksti ja merkinnät tavulleen samat', (await ls('luin-teksti:' + ID)) === mdT && JSON.stringify(await ls('luin-merkit:' + ID)) === merkEnnen, v);

  // 3. Muuttunut leipäteksti hylätään tietojen säädössä.
  await page.evaluate(([id, md]) => localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'x', pinosta: { id, tila: 'tiedot' } })), [ID, mdT.replace('Viides kappale', 'Viides muuttunut kappale')]);
  await page.goto(U + 'luin.html#tuo');
  await page.waitForSelector('#viesti:not([hidden])');
  v = await page.textContent('#viesti');
  tulos('tietojen säätö: muuttunut leipäteksti hylätään', /Leipäteksti oli muuttunut/.test(v) && (await ls('luin-teksti:' + ID)) === mdT, v);

  // 4. Uusi laitos merkintöineen (oletus).
  await pinoon();
  await valikko(ID, 'laitos');
  const ll = await page.evaluate(() => ({ ro: document.querySelector('#md').readOnly, nappi: document.querySelector('#avaa').textContent,
    valinnat: Array.from(document.querySelectorAll('#laitos-valinnat button')).map(b => b.dataset.v + ':' + b.getAttribute('aria-pressed')) }));
  tulos('uusi laitos: kenttä auki, Tallenna pinoon, kolme valintaa, oletus merkintöineen', !ll.ro && ll.nappi === 'Tallenna pinoon' &&
    ll.valinnat.join() === 'merk:true,tyhja:false,korvaa:false', JSON.stringify(ll));
  if (KUVAT) { await page.locator('#laitos-valinnat').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(KUVAT, 'laitos-valinnat.png') }); }
  const laitosMd = (await page.inputValue('#md')).replace(MD, LAITOS);
  await page.fill('#md', laitosMd);
  await page.evaluate(() => window.__latomo.paivita());
  const alkuperainen = { md: await ls('luin-teksti:' + ID), m: JSON.stringify(await ls('luin-merkit:' + ID)) };
  v = await tallenna();
  tulos('toinen laitos: ilmoitus irronneesta', /^2\. laitos lisättiin pinoon: ”Koeteksti”\. Merkinnöistä 1\/5 ei löytänyt kohtaansa; se on tallessa/.test(v.trim()), v);
  let L = await lista();
  const l2 = L.find(e => e.laitos === 2);
  tulos('toinen laitos: oma tunniste, alkuperäinen tallessa', l2 && l2.id !== ID && /^p-koeteksti-laitos-2$/.test(l2.id) && L.some(e => e.id === ID), l2 && l2.id);
  tulos('toinen laitos: alkuperäinen tavulleen ennallaan', (await ls('luin-teksti:' + ID)) === alkuperainen.md && JSON.stringify(await ls('luin-merkit:' + ID)) === alkuperainen.m);
  const tieto = await page.$$eval('#nimikkeet .n-tieto', es => es.map(e => e.textContent));
  tulos('pinossa: 2. laitos tietorivillä', tieto.some(t => /^2\. laitos · /.test(t)), tieto.join(' | '));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'laitos-pino.png') });
  const t2 = await tarkista(l2.id);
  const orvot = kaikki(t2).filter(x => x.orpo).map(x => x.id);
  tulos('toinen laitos: vain poistetun kappaleen alleviivaus irtosi', orvot.join() === 'a-kolmas', orvot.join());
  tulos('toinen laitos: muut kohdallaan, kirjaus mukana', kaikki(t2).filter(x => !x.orpo).every(x => x.osuu) &&
    t2.al.find(x => x.id === 'a-kirjaus').n === 'Kirjaus säilyy.' && t2.km[0].alku === 'Neljäs kappa' && t2.al.find(x => x.id === 'a-dasein').alku === 'Toisessa kap');
  await page.evaluate(() => document.querySelector('#merk-avaa').click());
  const mm2 = await page.evaluate(() => document.querySelector('#al-lista').textContent);
  tulos('Merkinnöissä irronnut on merkitty', /oma alleviivaus \(kohtaa ei löydy\)/.test(mm2), mm2.slice(0, 160));
  tulos('toinen laitos: ei poistolokia', !(await ls('luin-merkit:' + l2.id)).del);

  // 5. Ilman merkintöjä: kolmas laitos, ei merkintöjä.
  await pinoon();
  await valikko(ID, 'laitos');
  await page.click('#laitos-valinnat button[data-v="tyhja"]');
  tulos('valinta vaihtuu', await page.getAttribute('#laitos-valinnat button[data-v="tyhja"]', 'aria-pressed') === 'true');
  v = await tallenna();
  L = await lista();
  const l3 = L.find(e => e.laitos === 3);
  tulos('kolmas laitos ilman merkintöjä', /^3\. laitos lisättiin pinoon: ”Koeteksti” ilman merkintöjä\.$/.test(v.trim()) && l3 && !(await ls('luin-merkit:' + l3.id)), v);
  tulos('kolmas laitos: alkuperäinen ennallaan', (await ls('luin-teksti:' + ID)) === alkuperainen.md && JSON.stringify(await ls('luin-merkit:' + ID)) === alkuperainen.m);

  // 6. Korvaava laitos: sama tunniste, merkinnät siirretään.
  await pinoon();
  await valikko(ID, 'laitos');
  await page.fill('#md', (await page.inputValue('#md')).replace(MD, LAITOS));
  await page.evaluate(() => window.__latomo.paivita());
  await page.click('#laitos-valinnat button[data-v="korvaa"]');
  v = await tallenna();
  L = await lista();
  tulos('korvaava laitos: ilmoitus', /^Uusi laitos korvasi alkuperäisen: ”Koeteksti”\. Merkinnöistä 1\/5 ei löytänyt/.test(v.trim()), v);
  tulos('korvaava laitos: sama tunniste, ei uutta nimikettä, ei laitosnumeroa', L.length === 3 && !L.find(e => e.id === ID).laitos && (await ls('luin-teksti:' + ID)).indexOf('Uusi alkukappale') >= 0);
  const t3 = await tarkista(ID);
  tulos('korvaava laitos: merkinnät kuten toisessa laitoksessa', kaikki(t3).filter(x => x.orpo).map(x => x.id).join() === 'a-kolmas' && kaikki(t3).filter(x => !x.orpo).every(x => x.osuu));

  // 7. Osoitteesta haettu teksti: tietojen säädön jälkeen #u= ei hae sitä uudelleen.
  await page.goto(U + 'luin.html#u=' + encodeURIComponent('luin/mika-on-markdown.md'));
  await page.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().txt.length);
  const uid = (await lista())[0].id;
  await pinoon();
  await valikko(uid, 'tiedot');
  await page.fill('.kentta[data-k="tekijä"] input', 'Testi Tekijä');
  await page.evaluate(() => window.__latomo.paivita());
  await tallenna();
  await page.goto(U + 'luin.html#u=' + encodeURIComponent('luin/mika-on-markdown.md'));
  await page.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().txt.length);
  tulos('osoitteen teksti: muokattu ei korvaudu uudelleenhaulla', /tekijä: Testi Tekijä/.test(await ls('luin-teksti:' + uid)));

  // 8. Tyhjennys päättää pinotilan.
  await pinoon();
  await valikko(ID, 'tiedot');
  await page.click('#tyhjenna'); await page.click('#tyhjenna-kylla');
  const pt = await page.evaluate(() => ({ ro: document.querySelector('#md').readOnly, b: document.querySelector('#pinosta').hidden, nappi: document.querySelector('#avaa').textContent, h: location.hash }));
  tulos('tyhjennys päättää pinotilan', !pt.ro && pt.b && pt.nappi === 'Avaa lukimessa' && !pt.h, JSON.stringify(pt));

  // Puhelimen leveys: ei vaakavieritystä laitosvalinnoissa.
  await page.setViewportSize({ width: 360, height: 740 });
  await pinoon();
  await valikko(ID, 'laitos');
  const yli = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  tulos('360 px: ei vaakavieritystä', yli <= 0, yli + ' px');
  if (KUVAT) { await page.locator('#laitos-valinnat').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(KUVAT, 'laitos-puhelin.png') }); }

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
