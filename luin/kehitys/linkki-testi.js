// Lataa md ja Linkitä tiedostoon (käyttäjän pyyntö 16.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/linkki-testi.js [kuvakansio]
// Tarkistaa: nimikkeen ja valittujen valikon järjestys (porrasvalikko: Exportātiō, Latomo, Luin.; Poista alimpana); Lataa md antaa pinon tekstin tavulleen;
// Linkitä tiedostoon hylkää virheellisen osoitteen, 404:n, verkkosivun ja eri tekstin muuttamatta mitään; hyväksyy
// Dropbox-jakolinkin, jonka tiedostossa on eri otsikkolohko mutta sama leipäteksti; osoite etukenttään (myös tekstiin,
// jossa etukenttää ei ollut), merkinnät ennallaan ja valikossa sen jälkeen Kopioi linkki.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { avaaOsa } = require('./porras-apu');

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

const MD = `---
tekijä: Testi Kirjoittaja
---

# Koeteksti

Ensimmäinen kappale, jossa on alleviivaus.

Toinen kappale pysyy samana.
`;
const ILMAN = `# Toinen koe

Kappale ilman etukenttää.
`;
// Tiedostossa eri otsikkolohko (alaotsikko) mutta sama leipäteksti: kelpaa.
const KELPAA = MD.replace('# Koeteksti\n', '# Koeteksti\n\n*Alaotsikko tiedostossa*\n');
const ERI = MD.replace('pysyy samana', 'muuttui');
const DB = 'https://www.dropbox.com/scl/fi/abc/koe.md?rlkey=x&dl=0';

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const ctx = await selain.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  const haetut = [];
  await ctx.route('https://dl.dropboxusercontent.com/**', (r) => {
    const u = r.request().url(); haetut.push(u);
    const body = /koe\.md/.test(u) ? KELPAA : /eri\.md/.test(u) ? ERI : /sivu\.md/.test(u) ? '<!DOCTYPE html><html><body>Dropbox</body></html>' : /ilman\.md/.test(u) ? ILMAN : null;
    if (body == null) return r.fulfill({ status: 404, body: 'ei', headers: { 'Access-Control-Allow-Origin': '*' } });
    r.fulfill({ status: 200, body, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
  });
  // Tekstit ovat tekstikannassa (luin/tekstit.js, 19.11.2026), muu localStoragessa.
  const ls = (k) => page.evaluate(k => k.startsWith('luin-teksti:') ? LuinTekstit.lue(k.slice(12)) : JSON.parse(localStorage.getItem(k)), k);

  await page.goto(U + 'luin.html#');
  await page.evaluate(([md, ilman]) => {
    const l = [
      { id: 'p-koeteksti', added: 2, title: 'Koeteksti', src: 'paikallinen' },
      { id: 'p-toinen-koe', added: 1, title: 'Toinen koe', src: 'paikallinen' }];
    localStorage.setItem('luin-lista', JSON.stringify(l));
    localStorage.setItem('luin-teksti:p-koeteksti', JSON.stringify(md));
    localStorage.setItem('luin-teksti:p-toinen-koe', JSON.stringify(ilman));
    localStorage.setItem('luin-merkit:p-koeteksti', JSON.stringify({ km: [], al: [{ segs: [{ b: 1, s: 0, e: 11, x: 'Ensimmäinen' }] }] }));
  }, [MD, ILMAN]);
  await page.reload(); await page.waitForSelector('#nimikkeet li');
  const merkit0 = await ls('luin-merkit:p-koeteksti');

  async function avaa(id) { await page.click(`#nimikkeet button.jako[data-id="${id}"]`); return page.$$eval('#pop button[data-k]:not(.p-takaisin)', bs => bs.map(b => b.dataset.k).join()); }

  // 1. Järjestys.
  let j = await avaa('p-koeteksti');
  tulos('linkittömän valikko: linkita, lataa, …, luin, poista', j === 'ali:vienti,ali:latomo,ali:luin,lisa,viite,linkita,lataa,viemerk,huiluta,luokittele,tiedot,laitos,luin,kasikirja,merk,poista', j);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'linkki-valikko.png') });

  // 2. Lataa md.
  await avaaOsa(page, 'lataa');
  const [lataus] = await Promise.all([page.waitForEvent('download'), page.click('#pop button[data-k="lataa"]')]);
  const ladattu = fs.readFileSync(await lataus.path(), 'utf8');
  tulos('Lataa md: pinon teksti tavulleen, nimi slugista', ladattu === MD && lataus.suggestedFilename() === 'koeteksti.md', lataus.suggestedFilename());

  // 2b. Vie merkinnät pinosta (EXPORTĀTIŌ): laatikko otsikoineen ja valintoineen, tiedosto kuten tekstin omassa viennissä.
  await avaa('p-koeteksti');
  await avaaOsa(page, 'viemerk');
  const vmJarj = await page.$$eval('#pop .p-ali.auki button[data-k]:not(.p-takaisin)', bs => bs.map(b => b.dataset.k).join());
  await page.click('#pop button[data-k="viemerk"]');
  const vm = await page.evaluate(() => ({ ots: document.querySelector('#pop .kys').firstChild.textContent, selite: document.querySelector('#pop .kys .lk-selite').textContent,
    val: [...document.querySelectorAll('#pop button.vk')].map(b => b.textContent + '=' + b.getAttribute('aria-pressed')).join(), luokka: document.getElementById('pop').className }));
  tulos('Vie merkinnät: Lataa .md:n alla, Huiluta laatikkoon -kohdan yllä', vmJarj === 'lisa,viite,linkita,lataa,viemerk,huiluta', vmJarj);
  tulos('Vie merkinnät: otsikko tekstitiedostoon, määrät, asetusten valinnat', vm.ots === 'Vie merkinnät tekstitiedostoon' &&
    vm.selite === '”Koeteksti”: 1 alleviivaus, 0 kirjausta ja 0 kirjanmerkkiä.' &&
    vm.val === 'Alleviivaukset=true,Kirjaukset=true,Kirjanmerkit=false,Edistymisen tilanne=false', JSON.stringify(vm));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'linkki-vie-merkinnat.png') });
  await page.click('#pop button[data-k="v:vieAl"]');
  await page.click('#pop button[data-k="v:vieKi"]');
  const vmPois = await page.evaluate(() => ({ ok: document.querySelector('#pop button[data-k="ok"]').disabled, al: JSON.parse(localStorage.getItem('luin-asetukset')).vieAl }));
  tulos('Vie merkinnät: valinnat muistetaan, Vie pois ilman merkintävalintoja', vmPois.ok && vmPois.al === 0, JSON.stringify(vmPois));
  await page.click('#pop button[data-k="v:vieAl"]');
  await page.click('#pop button[data-k="v:vieKi"]');
  const [vmLataus] = await Promise.all([page.waitForEvent('download'), page.click('#pop button[data-k="ok"]')]);
  const vmMd = fs.readFileSync(await vmLataus.path(), 'utf8');
  tulos('Vie merkinnät: tiedosto ladattu ja alleviivaus mukana', vmLataus.suggestedFilename() === 'koeteksti-merkinnat.md' && /Ensimmäinen/.test(vmMd),
    vmLataus.suggestedFilename() + ' ' + JSON.stringify(vmMd.slice(0, 160)));

  // 3. Hylkäykset.
  async function linkita(u) {
    await avaa('p-koeteksti');
    await avaaOsa(page, 'linkita');
    await page.click('#pop button[data-k="linkita"]');
    await page.fill('#pop input', u);
    await page.press('#pop input', 'Enter');
    await page.waitForFunction(() => { const b = document.querySelector('#pop button[data-k="ok"]'); return !b || !b.disabled; });
    return page.evaluate(() => { const t = document.querySelector('#pop .tila'); return document.querySelector('#pop').hidden ? '' : t && !t.hidden ? t.textContent : '?'; });
  }
  const hylatyt = [];
  for (const [u, odotus] of [['ei osoite', /verkko-osoite/], ['https://www.dropbox.com/s/x/puuttuu.md?dl=0', /HTTP 404/],
    ['https://www.dropbox.com/s/x/sivu.md?dl=0', /verkkosivu/], ['https://www.dropbox.com/s/x/eri.md?dl=0', /ei ole sama/]]) {
    const t = await linkita(u);
    hylatyt.push(u + ': ' + t);
    tulos('hylkäys: ' + u, odotus.test(t), t);
    await page.keyboard.press('Escape');
  }
  if (KUVAT) { await linkita('https://www.dropbox.com/s/x/eri.md?dl=0'); await page.screenshot({ path: path.join(KUVAT, 'linkki-hylatty.png') }); await page.keyboard.press('Escape'); }
  tulos('hylkäykset eivät muuttaneet tekstiä eikä pinoa', (await ls('luin-teksti:p-koeteksti')) === MD && !(await ls('luin-lista'))[0].osoite);

  // 4. Hyväksyntä.
  const t = await linkita(DB);
  const md1 = await ls('luin-teksti:p-koeteksti'), l1 = await ls('luin-lista');
  tulos('hyväksyntä: ponnahdus suljettu, Dropbox-osoite muunnettu haussa', t === '' && haetut.some(u => /dl\.dropboxusercontent\.com\/scl\/fi\/abc\/koe\.md\?rlkey=x$/.test(u)), t + ' ' + haetut.slice(-1));
  tulos('osoite etukenttään, muu ennallaan', md1 === MD.replace('tekijä: Testi Kirjoittaja\n', 'tekijä: Testi Kirjoittaja\nosoite: ' + DB + '\n'), JSON.stringify(md1.slice(0, 120)));
  tulos('pinossa osoite, md.js lukee sen', l1[0].osoite === DB && await page.evaluate(m => LuinMD.parse(m).meta.osoite, md1) === DB);
  tulos('merkinnät ennallaan', JSON.stringify(await ls('luin-merkit:p-koeteksti')) === JSON.stringify(merkit0));
  j = await avaa('p-koeteksti');
  tulos('linkitetyn valikko: Kopioi linkki linkin paikalla', j === 'ali:vienti,ali:latomo,ali:luin,lisa,viite,linkki,lataa,viemerk,huiluta,luokittele,tiedot,laitos,luin,kasikirja,merk,poista', j);
  await page.keyboard.press('Escape');

  // 5. Teksti ilman etukenttää.
  await page.click('#nimikkeet button.jako[data-id="p-toinen-koe"]');
  await avaaOsa(page, 'linkita');
  await page.click('#pop button[data-k="linkita"]');
  await page.fill('#pop input', 'https://www.dropbox.com/s/y/ilman.md?dl=0');
  await page.press('#pop input', 'Enter');
  await page.waitForFunction(() => document.querySelector('#pop').hidden);
  const md2 = await ls('luin-teksti:p-toinen-koe');
  tulos('ilman etukenttää: etukenttä lisätty alkuun', md2 === '---\nosoite: https://www.dropbox.com/s/y/ilman.md?dl=0\n---\n\n' + ILMAN, JSON.stringify(md2));
  const ennenJalkeen = await page.evaluate(([a, b]) => LuinMD.parse(a).html === LuinMD.parse(b).html, [ILMAN, md2]);
  tulos('ilman etukenttää: jäsennetty teksti sama', ennenJalkeen);

  // 6. Valittujen valikko.
  await page.click('#nimikkeet button.valitse[data-id="p-koeteksti"]');
  await page.click('#val-valikko');
  j = await page.$$eval('#pop button[data-k]:not(.p-takaisin)', bs => bs.map(b => b.dataset.k).join());
  tulos('valittujen valikko: Poista alimpana', j === 'ali:vienti,ali:latomo,ali:luin,viitteet,zip,luokittele,luin,kasikirja,merk,poista', j);

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
