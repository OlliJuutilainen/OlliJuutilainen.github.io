// Laidan osiohyppy ja Sukkela sanaselitys (käyttäjän havainto Note Air3:lla 19.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/osiohyppy-sana-testi.js
// Sivutettuna laidan (30 %) pitkä painallus hyppää osioon OSIO_MS:n (1,1 s) jälkeen ja perii alkaneen maalauksen. Sähköpaperilla
// sanan luonnos näkyy viiveellä, joten sormi pysyi sanalla usein yli 1,1 s, ja hyppy pyyhki luonnoksen ennen sanaselitystä.
// Tarkistaa: laidan sanaa 1,4 s pidetty sormi avaa Sukkelan sanaselityksen eikä käännä sivua (vasen ja oikea laita); 0,7 s
// sama; ilman Sukkelaa sanaselitystä laidan pitkä painallus hyppää edelleen ja pyyhkii luonnoksen (8.11.2026); keskeltä
// pidetty sana avaa selityksen; kahden sormen kosketus ja veto eivät muutu (veto yli 10 px peruu hypyn jo ennestään).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const MD = fs.readFileSync(path.join(JUURI, 'luin/tekstit/kant-ja-elainetiikka.md'), 'utf8');
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const kk = await b.newContext({ viewport: { width: 412, height: 824 }, hasTouch: true, isMobile: true });
  const p = await kk.newPage();
  const sivuvirheet = [];
  p.on('pageerror', e => sivuvirheet.push(e.message));
  const cdp = await kk.newCDPSession(p);
  await p.route('https://en.wiktionary.org/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ fi: [{ partOfSpeech: 'Noun', language: 'Finnish', definitions: [{ definition: 'test' }] }] }) }));
  const kosk = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await p.goto(BASE + 'luin.html');
  // Sähköpapyrosoinnin asetukset (SAHKOPAPERI): sivutettu, reunanapautus päällä, pyyhkäisy pois.
  await p.evaluate(md => {
    localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' }));
    localStorage.setItem('luin-asetukset', JSON.stringify({ av: 9, teema: 'vaalea', kontrasti: 1, sivutus: 'sivut', sivuReuna: 1, sivuPyyhka: 0, sivunapit: 1 }));
  }, MD);
  await p.goto('about:blank'); await p.goto(BASE + 'luin.html#tuo'); await p.waitForTimeout(800);
  const L = 'window.__luin';
  const sivulle = async n => { await p.evaluate(n => { const L = window.__luin; L.mene(L.sivunAlku(n)); }, n); await p.waitForTimeout(300); };
  const tila = () => p.evaluate(() => {
    const pop = document.querySelector('#pop');
    return { sivu: window.__luin.tila.sivu, pop: pop.hidden ? '' : pop.className, luonnos: [...document.querySelectorAll('mark.luonnos')].map(m => m.textContent).join('').replace(/­/g, '') };
  });
  // Sana, jonka vasen reuna on lähinnä ruudun leveyden osuutta fx; vain tämän sivun näkyvät sanat palkkien välissä.
  const sana = fx => p.evaluate(fx => {
    const W = innerWidth, ehdokkaat = [];
    for (const el of document.querySelectorAll('#teksti p[data-b]')) {
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
      while ((t = tw.nextNode())) {
        if (t.parentElement.closest('.sidenote, .fnref, a, mark')) continue;
        const re = /\p{L}{6,}/gu; let m;
        while ((m = re.exec(t.data))) {
          const q = document.createRange(); q.setStart(t, m.index + 2); q.setEnd(t, m.index + 3);
          const r = q.getClientRects()[0];
          if (r && r.width && r.left > 0 && r.right < W && r.top > 120 && r.bottom < innerHeight - 140) ehdokkaat.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, fx: r.left / W, w: m[0] });
        }
      }
    }
    ehdokkaat.sort((a, b) => Math.abs(a.fx - fx) - Math.abs(b.fx - fx));
    return ehdokkaat[0];
  }, fx);
  const pida = async (s, ms) => {
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    const ennen = await tila();
    await kosk('touchStart', s.x, s.y); await p.waitForTimeout(600);
    const kesken = await tila();
    await p.waitForTimeout(ms - 600); await kosk('touchEnd'); await p.waitForTimeout(500);
    return { sana: s.w, fx: +s.fx.toFixed(2), ennen: ennen.sivu, kesken: kesken.luonnos, ...(await tila()) };
  };
  const selitys = t => /sanakirja/.test(t.pop) && t.sivu === t.ennen && t.kesken.length > 0;

  await sivulle(3);
  await p.evaluate(() => { window.__luin.aset.sukSana = 1; });
  const v14 = await pida(await sana(.05), 1400);
  tulos('vasen laita, 1,4 s: sanaselitys, sivu ei käänny', selitys(v14), JSON.stringify(v14));
  const o14 = await pida(await sana(.75), 1400);
  tulos('oikea laita, 1,4 s: sanaselitys, sivu ei käänny', selitys(o14) && o14.fx > .7, JSON.stringify(o14));
  const v07 = await pida(await sana(.05), 700);
  tulos('vasen laita, 0,7 s: sanaselitys', selitys(v07), JSON.stringify(v07));
  const k14 = await pida(await sana(.45), 1400);
  tulos('keskeltä 1,4 s: sanaselitys', selitys(k14), JSON.stringify(k14));

  // Ilman Sukkelaa sanaselitystä laidan pitkä painallus on osiohyppy kuten ennen (8.11.2026): luonnos pyyhitään.
  await p.keyboard.press('Escape');
  await p.evaluate(() => { window.__luin.aset.sukSana = 0; });
  await sivulle(3);
  const h14 = await pida(await sana(.75), 1400);
  tulos('ilman Sukkelaa: oikean laidan 1,4 s hyppää, ei luonnosta eikä valikkoa', h14.sivu > h14.ennen && !h14.luonnos && !h14.pop && h14.kesken.length > 0, JSON.stringify(h14));
  await sivulle(3);
  const h07 = await pida(await sana(.75), 700);
  tulos('ilman Sukkelaa: oikean laidan 0,7 s avaa valikon', /rivi/.test(h07.pop) && h07.sivu === h07.ennen, JSON.stringify(h07));

  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
