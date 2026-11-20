// Sysi, Sysin, TCF-valkaisu, CLARVS·ET·DISTINCTVS ja sähköpapyrosointi (käyttäjän pyynnöt 17.11. ja 20.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sahkopaperi-testi.js [kuvakansio]
// Tarkistaa: 1) Sähköpapyrosoi asetukset on suorakaidenappi Ulkoasu-otsikon rivillä (työpöytä ja 360 px) eikä peitä raksia;
// 2) painallus tanssittaa vain napin (tausta, teksti, kehä) musta–TCF-vuorottelua neljä vaihetta lopputilaan, asetukset
// vaihtuvat neljännessä vaiheessa, leveys pysyy, toinen painallus kesken ei tee mitään, ja lopuksi nappi tarjoaa
// Oletusasetukset, joka palauttaa laitteen oletukset samalla vatkauksella; 3) vaaleassa kontrastikytkin (TCF) muuttaa vain
// taustan ja musteen, tummassa (Sysi) koko paletin: muuttujat ja tyylisäännöt; nimi Sysi tai TCF-valkaisu teeman mukaan;
// 4) TCF-vihje vain hiiren viipymästä (sulkeutuu heti hiiren lähtiessä kytkimeltä), kosketuksella ei lainkaan;
// 7–8) teeman ruudukko, CLARVS ja teemojen alakytkimet (käyttäjän säännöt 20.11.2026): toisen teeman alakytkimet eivät näy,
// teema palauttaa muistamansa alakytkimet, CLARVS pitää kutinsa teemaa vaihdettaessa eikä pyyhi muistia, Sysin on Sysin
// alakytkin, ja papyrosointinappi on Sysinissäkin tavallinen.
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

## Ensimmäinen luku

Ensimmäinen kappale, jossa on alaviite.[^1]

${'Täytettä kappaleeksi. '.repeat(60)}

[^1]: Alaviitteen teksti.
`;
const SAHKOPAPERI = { teema: 'vaalea', kontrasti: 1, sivutus: 'sivut', sivuReuna: 1, sivuPyyhka: 0, sivunapit: 1, sivuLaite: 1 };
// Tanssin värit: tausta, teksti ja kehä (mustan vaiheen vitivalkoinen teksti on tanssin poikkeus).
const VARIT = { mustin: 'rgb(0, 0, 0) rgb(255, 255, 255) rgb(255, 255, 255)', tcf: 'rgb(255, 255, 255) rgb(0, 0, 0) rgb(0, 0, 0)' };
const MUUTTUJAT = ['--paperi', '--muste', '--harmaa', '--viiva', '--ruoste', '--okra', '--huomio', '--sitaatti', '--hius', '--valo'];

// Kirjaa napin vaiheet (data-vaihe, teksti, tausta, leveys, asetukset) jokaisesta muutoksesta.
function kirjaaVaiheet() {
  const n = document.getElementById('papyrosoi'), t0 = performance.now();
  window.__vaiheet = [];
  const kirjaa = () => window.__vaiheet.push({ t: Math.round(performance.now() - t0), vaihe: n.dataset.vaihe || '', teksti: n.textContent,
    tausta: getComputedStyle(n).backgroundColor, varit: [getComputedStyle(n).backgroundColor, getComputedStyle(n).color, getComputedStyle(n).borderTopColor].join(' '), leveys: Math.round(n.getBoundingClientRect().width * 10) / 10,
    papyrus: ['teema', 'kontrasti', 'sivutus', 'sivuReuna', 'sivuPyyhka', 'sivunapit', 'sivuLaite'].map(k => window.__luin.aset[k]).join(',') });
  window.__havainnoija && window.__havainnoija.disconnect();
  window.__havainnoija = new MutationObserver(kirjaa);
  window.__havainnoija.observe(n, { attributes: true, attributeFilter: ['data-vaihe'], childList: true, characterData: true, subtree: true });
  kirjaa();
}

async function aja(selain, U, kosketus) {
  const laji = kosketus ? '360 px kosketus' : 'työpöytä';
  const ctx = await selain.newContext(kosketus ? { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true }
    : { viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate((md) => {
    localStorage.clear();
    localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-koe', added: 1, title: 'Koeteksti', src: 'paikallinen' }]));
    localStorage.setItem('luin-teksti:p-koe', JSON.stringify(md));
    // Lähtötila tahallaan papyrosoinnin vastakohta: tumma, rullaus, pyyhkäisy päällä, painikkeet pois.
    localStorage.setItem('luin-asetukset', JSON.stringify({ teema: 'tumma', sivutus: 'vieritys', sivuReuna: 0, sivuPyyhka: 1, sivunapit: 0, av: 8 }));
  }, MD);
  await page.reload(); await page.waitForSelector('#nimikkeet li');
  const napauta = async (sel) => { if (kosketus) await page.tap(sel); else await page.click(sel); };
  const nappi = () => page.evaluate(() => document.getElementById('papyrosoi').textContent);

  await napauta('.lhead .ratas');
  await page.waitForSelector('#asetukset:not([hidden])');
  // 1. Paikka ja muoto.
  const p = await page.evaluate(() => {
    const n = document.getElementById('papyrosoi'), h = document.querySelector('.aset-ots h3'), s = document.querySelector('#asetukset .sulje');
    const nr = n.getBoundingClientRect(), hr = h.getBoundingClientRect(), sr = s.getBoundingClientRect(), pr = document.getElementById('asetukset').getBoundingClientRect();
    const o = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
    const cs = getComputedStyle(n);
    const ens = document.querySelector('#asetukset .asetus[data-a="teema"]').getBoundingClientRect();
    return { samaRivi: Math.abs((nr.top + nr.bottom) / 2 - (hr.top + hr.bottom) / 2) < 4, oikea: Math.round(pr.right - nr.right), leveys: Math.round(nr.width),
      korkeus: Math.round(nr.height), raksi: !!(o && s.contains(o)), tyyli: [cs.fontStyle, cs.fontWeight, cs.textTransform].join(' '),
      reunus: cs.borderTopWidth + ' ' + cs.borderTopStyle, teksti: n.textContent, alla: Math.round(ens.top - nr.bottom) };
  });
  tulos(`${laji}: nappi Ulkoasu-otsikon rivillä`, p.samaRivi, JSON.stringify(p));
  tulos(`${laji}: nappi ei peitä raksia`, p.raksi);
  tulos(`${laji}: suorakaide, kursiivi, ohut, versaali, ei hakasulkeita`, /^italic 380 uppercase$/.test(p.tyyli) && p.reunus === '1px solid' && p.teksti === 'Sähköpapyrosoi asetukset', p.tyyli + ' | ' + p.reunus + ' | ' + p.teksti);
  tulos(`${laji}: nappi ei osu Teema-riviin`, p.alla >= 4, p.alla + ' px');
  tulos(`${laji}: kytkimen nimi tummassa Sysi`, await page.evaluate(() => document.querySelector('button[data-teema="tumma"]').textContent) === 'Sysi');
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-ennen-${kosketus ? 'kapea' : 'levea'}.png`) });

  // 2. Papyrosointi tummasta.
  await page.evaluate(kirjaaVaiheet);
  await napauta('#papyrosoi');
  await page.waitForTimeout(700);
  await napauta('#papyrosoi'); // kesken: ei saa vaikuttaa
  if (KUVAT) { await page.waitForTimeout(1500); await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-kuittaus-${kosketus ? 'kapea' : 'levea'}.png`) }); }
  await page.waitForTimeout(KUVAT ? 2400 : 3900);
  let v = await page.evaluate(() => window.__vaiheet);
  const jarj = v.filter(x => x.vaihe).reduce((a, x) => (a[a.length - 1] && a[a.length - 1].vaihe === x.vaihe && a[a.length - 1].t === x.t ? a : a.concat(x)), []);
  const vaiheet = [...new Set(v.map((x, i) => i + ':' + x.vaihe))].map(s => s.split(':')[1]);
  const pelkat = vaiheet.filter((x, i) => x !== vaiheet[i - 1]);
  tulos(`${laji}: vaiheet tummasta`, pelkat.join(' ') === ' mustin tcf mustin tcf ', pelkat.join(' '));
  const tausta = v.filter(x => x.vaihe).every(x => x.varit === VARIT[x.vaihe]);
  tulos(`${laji}: tausta, teksti ja kehä tanssivat`, tausta, JSON.stringify(v.filter(x => x.vaihe).map(x => x.vaihe + ' ' + x.varit)));
  const leveys = new Set(v.filter(x => x.vaihe).map(x => x.leveys));
  tulos(`${laji}: leveys pysyy vatkauksen ajan`, leveys.size === 1 && [...leveys][0] === v[0].leveys, [...leveys].join(', ') + ' / ' + v[0].leveys);
  const ennen4 = v.filter(x => x.t < 1900);
  const papStr = Object.values(SAHKOPAPERI).join(',');
  tulos(`${laji}: asetukset vasta neljännessä vaiheessa`, ennen4.every(x => x.papyrus !== papStr) && v.some(x => x.teksti === 'Sähköpapyrosoitu' && x.papyrus === papStr),
    JSON.stringify(v.map(x => x.t + ' ' + x.vaihe + ' ' + x.teksti + ' ' + x.papyrus)));
  const k4 = v.find(x => x.teksti === 'Sähköpapyrosoitu'), loppu = v[v.length - 1];
  tulos(`${laji}: vaiheet 700 ms, kuittaus noin 2,2 s`, k4 && k4.vaihe === 'tcf' && Math.abs(k4.t - 2100) < 150 && Math.abs(loppu.t - k4.t - 2200) < 200, k4 && (k4.t + ' → ' + loppu.t));
  tulos(`${laji}: lopuksi Oletusasetukset`, loppu.vaihe === '' && loppu.teksti === 'Oletusasetukset', JSON.stringify(loppu));
  const tallessa = await page.evaluate(() => JSON.parse(localStorage.getItem('luin-asetukset')));
  tulos(`${laji}: papyrosoitu tallessa`, Object.keys(SAHKOPAPERI).every(k => tallessa[k] === SAHKOPAPERI[k]));
  const kytkimet = await page.evaluate(() => [...document.querySelectorAll('#asetukset button[data-teema="vaalea"], #asetukset button[data-kytkin^="sivu"], #asetukset .asetus[data-a="teema"] .valinnat button[data-arvo], #asetukset .asetus[data-a="sivutus"] .valinnat button[data-arvo]')].map(b => (b.dataset.kytkin || b.dataset.arvo) + '=' + b.getAttribute('aria-pressed')).join(' '));
  tulos(`${laji}: kytkimet näyttävät uuden tilan`, kytkimet === 'vaalea=true tumma=false kontrasti=true vieritys=false sivut=true sivuReuna=true sivuPyyhka=false sivunapit=true sivuLaite=true', kytkimet);
  tulos(`${laji}: kytkimen nimi vaaleassa TCF-valkaisu`, await page.evaluate(() => document.querySelector('button[data-teema="vaalea"]').textContent) === 'TCF-valkaisu');
  const pv = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).color);
  tulos(`${laji}: TCF: valkoinen tausta, musta muste`, pv === 'rgb(255, 255, 255) rgb(0, 0, 0)', pv);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-papyrosoitu-${kosketus ? 'kapea' : 'levea'}.png`) });

  // 3. TCF muuttaa vain taustan ja musteen, Sysi koko paletin.
  const vertaa = await page.evaluate((M) => {
    const r = document.documentElement, lue = () => { const cs = getComputedStyle(r); return M.map(m => cs.getPropertyValue(m).trim()); };
    const tulos = {};
    for (const t of ['vaalea', 'tumma']) {
      r.dataset.teema = t;
      r.classList.remove('kontrasti'); const a = lue();
      r.classList.add('kontrasti'); const b = lue();
      tulos[t] = M.filter((m, i) => a[i] !== b[i]).map((m, i) => m + '=' + b[M.indexOf(m)]).join(' ');
    }
    r.dataset.teema = window.__luin.aset.teema; r.classList.toggle('kontrasti', !!window.__luin.aset.kontrasti);
    const saannot = [];
    for (const ss of document.styleSheets) { try { for (const sr of ss.cssRules) if (sr.selectorText && /^:root\.kontrasti/.test(sr.selectorText)) saannot.push(sr.selectorText); } catch (e) {} }
    tulos.saannot = saannot.join(' | ');
    return tulos;
  }, MUUTTUJAT);
  tulos(`${laji}: vaaleassa muuttuu vain paperi ja muste`, vertaa.vaalea === '--paperi=#ffffff --muste=#000000', vertaa.vaalea);
  tulos(`${laji}: Sysin paletti`, vertaa.tumma === '--paperi=#000000 --muste=#c9b592 --harmaa=#7b694e --viiva=#392e22 --ruoste=#8a5f33 --okra=#a67c20 --huomio=#726046 --sitaatti=#8b775a --hius=#211a13 --valo=#31281e', vertaa.tumma);
  tulos(`${laji}: ei muita kontrastisääntöjä`, vertaa.saannot === ':root.kontrasti:not([data-teema="tumma"]) | :root.kontrasti[data-teema="tumma"]', vertaa.saannot);

  // 4. TCF-vihje.
  const vihje = () => page.evaluate(() => { const v = document.getElementById('tcf-vihje'); return v.hidden ? '' : v.querySelector('p').textContent; });
  const kontrasti = () => page.evaluate(() => window.__luin.aset.kontrasti);
  const TEKSTI = 'TCF: total chlorine free bleaching eli TÄYSIN klooriton taustapaperin valkaisu';
  const TCF = 'button[data-kytkin="kontrasti"][data-teema="vaalea"]';
  if (!kosketus) {
    await page.hover(TCF);
    await page.waitForTimeout(600);
    tulos(`${laji}: vihje ei vielä 0,6 s:ssa`, (await vihje()) === '');
    await page.waitForTimeout(600);
    tulos(`${laji}: vihje hiiren viipymästä`, (await vihje()) === TEKSTI, await vihje());
    const vr = await page.evaluate(() => { const v = document.getElementById('tcf-vihje').getBoundingClientRect(), p = document.getElementById('asetukset').getBoundingClientRect(); return { sisalla: v.left >= p.left && v.right <= p.right }; });
    tulos(`${laji}: vihje paneelin sisällä`, vr.sisalla);
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'sahkopaperi-tcf-vihje-levea.png') });
    await page.mouse.move(5, 5);
    tulos(`${laji}: hiiren siirto pois sulkee heti`, (await vihje()) === '');
    await page.hover(TCF); await page.waitForTimeout(1200);
    await page.click(TCF);
    tulos(`${laji}: napsautus vihjeen ollessa auki sammuttaa ja sulkee`, (await kontrasti()) === 0 && (await vihje()) === '');
    await page.mouse.move(5, 5);
    await page.click(TCF);
    tulos(`${laji}: napsautus kytkee päälle`, (await kontrasti()) === 1);
    await page.mouse.move(5, 5);
    await page.hover(TCF); await page.waitForTimeout(1200);
    // Napsautus suoraan vihjeen ohi ilman hiiren lähtöä kytkimeltä ei ole mahdollinen; vihjeen oma napsautus sulkee.
    await page.dispatchEvent('#tcf-vihje p', 'click');
    tulos(`${laji}: vihjeen napsautus sulkee`, (await vihje()) === '' && (await kontrasti()) === 1);
    await page.mouse.move(5, 5);
    await page.click('#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]');
    await page.hover('button[data-kytkin="sysi"]'); await page.waitForTimeout(1300);
    tulos(`${laji}: Sysi ei avaa vihjettä`, (await vihje()) === '');
    // CLARVS-vihje (käyttäjän pyyntö 20.11.2026): sama viive ja sulku, tummassakin, CLARVSin alla sen vasemmasta reunasta.
    const cdVihje = () => page.evaluate(() => { const v = document.getElementById('cd-vihje'); return v.hidden ? '' : v.querySelector('p').textContent; });
    await page.mouse.move(5, 5);
    await page.hover('button[data-kytkin="clarus"]'); await page.waitForTimeout(600);
    tulos(`${laji}: CLARVS-vihje ei vielä 0,6 s:ssa`, (await cdVihje()) === '');
    await page.waitForTimeout(600);
    const cv = await page.evaluate(() => { const v = document.getElementById('cd-vihje').getBoundingClientRect(), b = document.querySelector('button[data-kytkin="clarus"]').getBoundingClientRect();
      return { alla: v.top >= b.bottom, vasen: Math.round(v.left - b.left) }; });
    tulos(`${laji}: CLARVS-vihje viipymästä CLARVSin alla`, (await cdVihje()) === 'kirkkaasti erottuva' && cv.alla && cv.vasen === 0, (await cdVihje()) + ' ' + JSON.stringify(cv));
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'sahkopaperi-cd-vihje-levea.png') });
    await page.mouse.move(5, 5);
    tulos(`${laji}: CLARVS-vihje sulkeutuu hiiren lähtiessä`, (await cdVihje()) === '' && (await vihje()) === '');
    await page.click('#asetukset .asetus[data-a="teema"] button[data-arvo="vaalea"]');
  } else {
    await napauta(TCF);
    tulos(`${laji}: kosketus: päällä olevan napautus sammuttaa ilman vihjettä`, (await kontrasti()) === 0 && (await vihje()) === '');
    await napauta(TCF);
    await page.waitForTimeout(1200);
    tulos(`${laji}: kosketus: pois olevan napautus kytkee päälle ilman vihjettä`, (await kontrasti()) === 1 && (await vihje()) === '');
  }

  // 5. Oletusasetukset vaaleasta.
  tulos(`${laji}: nappi yhä Oletusasetukset`, (await nappi()) === 'Oletusasetukset', await nappi());
  await page.evaluate(kirjaaVaiheet);
  await napauta('#papyrosoi');
  await page.waitForTimeout(4700);
  v = await page.evaluate(() => window.__vaiheet);
  const vv = v.map(x => x.vaihe).filter((x, i, a) => x !== a[i - 1]);
  tulos(`${laji}: vaiheet vaaleaan oletukseen`, vv.join(' ') === ' mustin tcf mustin tcf ', vv.join(' '));
  tulos(`${laji}: kuittaus Palautettu`, v.some(x => x.teksti === 'Palautettu' && x.vaihe === 'tcf'));
  const oletus = await page.evaluate(() => ['teema', 'kontrasti', 'sivutus', 'sivuReuna', 'sivuPyyhka', 'sivunapit', 'sivuLaite'].map(k => window.__luin.aset[k]).join(','));
  const odotettu = kosketus ? 'vaalea,0,sivut,1,1,1,1' : 'vaalea,0,vieritys,1,1,1,1';
  tulos(`${laji}: laitteen oletukset palautettu`, oletus === odotettu, oletus);
  tulos(`${laji}: nappi taas Sähköpapyrosoi asetukset`, (await nappi()) === 'Sähköpapyrosoi asetukset', await nappi());
  const tav = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).color);
  tulos(`${laji}: tavallinen vaalea`, tav === 'rgb(250, 245, 234) rgb(35, 28, 20)', tav);

  // 6. Sysi lukimessa: musta tausta, hienovaraisesti himmennetty lämmin teksti.
  await napauta('#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]');
  await napauta('button[data-kytkin="sysi"]');
  await napauta('#asetukset .sulje');
  await page.evaluate(() => { location.hash = '#id=p-koe'; });
  await page.waitForSelector('#lukija:not([hidden])', { state: 'attached' }); await page.waitForTimeout(600);
  await page.evaluate(() => { const o = document.getElementById('palkkiopas'); if (o) o.hidden = true; });
  const tp = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).color);
  tulos(`${laji}: Sysi lukimessa`, tp === 'rgb(0, 0, 0) rgb(201, 181, 146)', tp);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-lukin-sysi-${kosketus ? 'kapea' : 'levea'}.png`) });

  // 7. CLARVS·ET·DISTINCTVS ja teeman ruudukko (käyttäjän pyynnöt 20.11.2026): CLARVS on sama valinta kummassakin teemassa,
  // sulkee Sysin/TCF:n pois, kaksi välisävyä. Ruudukossa kiinteät paikat: Vaalea, TCF ja CLARVS samassa vasemmassa laidassa,
  // Tumma ja Sysi samassa, Tumma TCF:n oikealla puolella; paikat eivät muutu teeman mukana. Himmeys: valitsematon CLARVS >
  // valitsematon oman teeman alakytkin > toisen teeman alakytkin. Alakytkimet pienempiä kuin Sivunkäännön lisäkytkimet.
  await page.evaluate(() => { location.hash = '#'; });
  await page.waitForSelector('#nimikkeet li');
  await napauta('.lhead .ratas');
  await page.waitForSelector('#asetukset:not([hidden])');
  const ruutu = () => page.evaluate(() => {
    const B = s => document.querySelector(s), R = s => B(s).getBoundingClientRect(), vas = s => B(s + ' .sal-ulko').getBoundingClientRect().left;
    const S = { V: 'button[data-arvo="vaalea"]', T: 'button[data-arvo="tumma"]', TCF: 'button[data-teema="vaalea"]', SY: 'button[data-kytkin="sysi"]', CD: 'button[data-kytkin="clarus"]' };
    const o = {}; for (const [n, s] of Object.entries(S)) o[n] = { x: Math.round(vas(s) * 10) / 10, y: Math.round(R(s).top), op: +getComputedStyle(B(s)).opacity, nakyy: getComputedStyle(B(s)).visibility === 'visible' };
    const tcfTeksti = document.createRange(); tcfTeksti.selectNodeContents(B(S.TCF)); const tcfOik = Math.max(...[...tcfTeksti.getClientRects()].map(r => r.right));
    return { o, tilaa: vas(S.T) > tcfOik, nimet: B(S.TCF).textContent + '|' + B(S.SY).textContent + '|' + B(S.CD).textContent,
      pienempi: parseFloat(getComputedStyle(B(S.CD)).fontSize) < parseFloat(getComputedStyle(B('button[data-kytkin="sivunapit"]')).fontSize) };
  });
  // CLARVSin x riippuu teemasta (tummassa Tumman kohdalla), joten se tarkistetaan erikseen.
  const paikat = r => [r.o.V.x, r.o.T.x, r.o.TCF.x, r.o.SY.x, r.o.V.y, r.o.TCF.y, r.o.CD.y].join(',');
  let ru = await ruutu();
  const p0 = paikat(ru);
  tulos(`${laji}: ruudukon sarakkeet ja rivit`, Math.abs(ru.o.V.x - ru.o.TCF.x) < .5 && Math.abs(ru.o.T.x - ru.o.CD.x) < .5 && Math.abs(ru.o.T.x - ru.o.SY.x) < .5 &&
    ru.o.T.y === ru.o.V.y && ru.o.SY.y === ru.o.TCF.y && ru.o.V.y < ru.o.TCF.y && ru.o.TCF.y < ru.o.CD.y && ru.tilaa, JSON.stringify(ru.o));
  tulos(`${laji}: nimet makroneineen ja koko`, ru.nimet === 'TCF-valkaisu|Sysi|CLĀRVS · ET · DISTĪNCTVS' && ru.pienempi, ru.nimet);
  tulos(`${laji}: tummassa TCF piilossa, Sysi näkyy`, !ru.o.TCF.nakyy && ru.o.SY.nakyy && ru.o.SY.op === 1, JSON.stringify([ru.o.TCF, ru.o.SY]));
  const paletti = () => page.evaluate((m) => { const cs = getComputedStyle(document.documentElement), a = window.__luin.aset;
    return { t: a.teema, k: a.kontrasti, s: a.sysi, n: a.sysin, c: a.clarus, luokat: ['kontrasti', 'sysin', 'clarus'].filter(x => document.documentElement.classList.contains(x)).join('+'),
      arvot: [...new Set(m.map(x => cs.getPropertyValue(x).trim()))].sort().join(' ') }; }, MUUTTUJAT);
  await napauta('button[data-kytkin="clarus"]');
  let pc = await paletti();
  ru = await ruutu();
  tulos(`${laji}: paikat eivät hypi`, paikat(ru) === p0, paikat(ru) + ' / ' + p0);
  tulos(`${laji}: CLARVS tummassa peittää Sysin muistia pyyhkimättä`, pc.s === 1 && pc.c === 1 && pc.luokat === 'clarus', JSON.stringify(pc));
  tulos(`${laji}: CLARVS tummassa: musta, valkoinen, harmaa, ruoste`, pc.arvot === '#000000 #a3a3a3 #e8955a #ffffff', pc.arvot);
  await napauta('#asetukset .asetus[data-a="teema"] button[data-arvo="vaalea"]');
  ru = await ruutu();
  tulos(`${laji}: paikat eivät hypi teemaa vaihtaessa`, paikat(ru) === p0, paikat(ru) + ' / ' + p0);
  tulos(`${laji}: vaaleassa CLARVS Vaalean kohdalla`, Math.abs(ru.o.V.x - ru.o.CD.x) < .5, JSON.stringify([ru.o.V, ru.o.CD]));
  pc = await paletti();
  tulos(`${laji}: CLARVS vaaleassa: valkoinen, musta, harmaa, ruoste`, pc.c === 1 && pc.arvot === '#000000 #595959 #803510 #ffffff', pc.arvot);
  ru = await ruutu();
  tulos(`${laji}: CLARVSin alla mikään alakytkin ei näy`, !ru.o.TCF.nakyy && !ru.o.SY.nakyy && (await page.evaluate(() => ['vaalea', 'sysi', 'sysin'].map(k => document.querySelector(k === 'vaalea' ? 'button[data-teema="vaalea"]' : 'button[data-kytkin="' + k + '"]')).filter(b => getComputedStyle(b).visibility === 'visible').length)) === 0, JSON.stringify([ru.o.TCF, ru.o.SY]));
  await napauta('button[data-kytkin="clarus"]');
  ru = await ruutu();
  tulos(`${laji}: vaaleassa Sysi ja Sysin piilossa, TCF näkyy`, ru.o.TCF.nakyy && !ru.o.SY.nakyy && !(await page.evaluate(() => getComputedStyle(document.querySelector('button[data-kytkin="sysin"]')).visibility === 'visible')), JSON.stringify([ru.o.TCF, ru.o.SY]));
  const SN = 'button[data-kytkin="sysin"]', SY = 'button[data-kytkin="sysi"]', TUMMA = '#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]', VAALEA = '#asetukset .asetus[data-a="teema"] button[data-arvo="vaalea"]';
  const CD = 'button[data-kytkin="clarus"]';
  await napauta(TCF);
  pc = await paletti();
  tulos(`${laji}: TCF päälle`, pc.k === 1 && pc.c === 0 && pc.luokat === 'kontrasti', JSON.stringify(pc));
  await napauta(TCF);
  pc = await paletti();
  tulos(`${laji}: TCF pois, CLARVS pysyy pois`, pc.k === 0 && pc.c === 0 && pc.luokat === '', JSON.stringify(pc));
  ru = await ruutu();
  tulos(`${laji}: himmeys: CLARVS > TCF`, ru.o.CD.op > ru.o.TCF.op, JSON.stringify([ru.o.CD.op, ru.o.TCF.op]));
  // 8. Teemojen alakytkimet (käyttäjän säännöt 20.11.2026).
  const sysin = () => page.evaluate(([a, b]) => { const r = s => document.querySelector(s).getBoundingClientRect(), x = r(a), y = r(b), B = s => document.querySelector(s);
    return { nakyy: getComputedStyle(B(b)).visibility === 'visible', rivi: Math.abs((x.top + x.bottom) / 2 - (y.top + y.bottom) / 2) < 1.5 && y.left > x.right,
      pienempi: parseFloat(getComputedStyle(B(b)).fontSize) < parseFloat(getComputedStyle(B(a)).fontSize), nimi: B(b).textContent,
      painettu: B(a).getAttribute('aria-pressed') + B(b).getAttribute('aria-pressed') }; }, [SY, SN]);
  const papNappi = () => page.evaluate(() => { const n = document.getElementById('papyrosoi'), cs = getComputedStyle(n), r = getComputedStyle(document.documentElement);
    return { teksti: n.textContent, vari: cs.color, kehys: cs.borderTopColor, muste: r.getPropertyValue('--muste').trim(), huomio: r.getPropertyValue('--huomio').trim() }; });
  const rgb = h => 'rgb(' + [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';
  await napauta(TCF);
  await napauta(TUMMA);
  pc = await paletti();
  tulos(`${laji}: Tumma palauttaa muistetun Sysin`, pc.t === 'tumma' && pc.k === 1 && pc.s === 1 && pc.luokat === 'kontrasti', JSON.stringify(pc));
  await napauta(SY);
  pc = await paletti();
  tulos(`${laji}: Sysi pois: tavallinen tumma`, pc.s === 0 && pc.luokat === '', JSON.stringify(pc));
  let sn = await sysin();
  tulos(`${laji}: Sysin piilossa, kun Sysi ei ole valittuna`, !sn.nakyy, JSON.stringify(sn));
  await napauta(SY);
  sn = await sysin();
  pc = await paletti();
  tulos(`${laji}: Sysi päälle, Sysin ilmestyy pienempänä Sysin oikealle`, pc.s === 1 && pc.luokat === 'kontrasti' && sn.nakyy && sn.rivi && sn.pienempi && sn.nimi === 'Sysin' && sn.painettu === 'truefalse', JSON.stringify(sn) + ' ' + JSON.stringify(pc));
  let pn = await papNappi();
  tulos(`${laji}: Sysissä nappi tavallinen`, pn.teksti === 'Sähköpapyrosoi asetukset' && pn.vari === rgb(pn.huomio), JSON.stringify(pn));
  await napauta(SN);
  sn = await sysin();
  pc = await paletti();
  tulos(`${laji}: Sysin päälle Sysin alle`, pc.s === 1 && pc.n === 1 && pc.luokat === 'sysin' && sn.painettu === 'truetrue', JSON.stringify(sn) + ' ' + JSON.stringify(pc));
  tulos(`${laji}: Sysinin paletti`, pc.arvot === '#000000 #1c150e #2a2116 #32281b #4c3e2b #53452f #604d31 #6e521b #6f4a22 #927749', pc.arvot);
  pn = await papNappi();
  tulos(`${laji}: Sysinissä nappi tavallinen (ei Oletusasetukset-poikkeusta)`, pn.teksti === 'Sähköpapyrosoi asetukset' && pn.vari === rgb(pn.huomio), JSON.stringify(pn));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-sysin-${kosketus ? 'kapea' : 'levea'}.png`) });
  // CLARVS Sysinin päälle ja pois: Sysin palaa.
  await napauta(CD);
  pc = await paletti();
  sn = await sysin();
  tulos(`${laji}: CLARVS peittää Sysinin, Sysi pois näkyvistä päältä`, pc.c === 1 && pc.luokat === 'clarus' && !sn.nakyy && (await page.evaluate(s => document.querySelector(s).getAttribute('aria-pressed'), SY)) === 'false', JSON.stringify(pc));
  await napauta(CD);
  pc = await paletti();
  tulos(`${laji}: CLARVS pois: Sysin palaa`, pc.c === 0 && pc.s === 1 && pc.n === 1 && pc.luokat === 'sysin', JSON.stringify(pc));
  // CLARVS teeman yli: pitää kutinsa; TCF palaa vaaleassa CLARVSin sammuessa.
  await napauta(CD);
  await napauta(VAALEA);
  pc = await paletti();
  tulos(`${laji}: CLARVS pitää kutinsa vaaleaan`, pc.t === 'vaalea' && pc.c === 1 && pc.luokat === 'clarus', JSON.stringify(pc));
  tulos(`${laji}: CLARVSin alla vaaleassakaan mikään alakytkin ei näy`, (await page.evaluate(() => ['vaalea', 'sysi', 'sysin'].map(k => document.querySelector(k === 'vaalea' ? 'button[data-teema="vaalea"]' : 'button[data-kytkin="' + k + '"]')).filter(b => getComputedStyle(b).visibility === 'visible').length)) === 0, '');
  await napauta(CD);
  pc = await paletti();
  tulos(`${laji}: CLARVS pois vaaleassa: muistettu TCF palaa`, pc.c === 0 && pc.k === 1 && pc.luokat === 'kontrasti', JSON.stringify(pc));
  await napauta(TUMMA);
  pc = await paletti();
  tulos(`${laji}: Tumma palauttaa Sysinin`, pc.t === 'tumma' && pc.luokat === 'sysin', JSON.stringify(pc));
  await napauta(SY);
  pc = await paletti();
  sn = await sysin();
  tulos(`${laji}: Sysi pois, Sysin piiloon muistiin`, pc.s === 0 && pc.n === 1 && pc.luokat === '' && !sn.nakyy, JSON.stringify(pc));
  ru = await ruutu();
  tulos(`${laji}: paikat eivät hypi`, paikat(ru) === p0, paikat(ru) + ' / ' + p0);
  await napauta(VAALEA);
  tulos(`${laji}: ei sivuvirheitä`, !virheet.length, virheet.join(' | '));
  await ctx.close();
}

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = `http://127.0.0.1:${palvelin.address().port}/`;
  const selain = await chromium.launch();
  try { await aja(selain, U, false); await aja(selain, U, true); }
  finally { await selain.close(); palvelin.close(); }
  console.log(virheita ? `\n${virheita} vikaa` : '\nKaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
