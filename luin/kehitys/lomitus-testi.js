// Lomitetun käännöksen palstojen värit. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/lomitus-testi.js [kuvakansio]
// Rinnakkain käännös on --sitaatti-värinen vain, kun alkuteksti ja käännös ovat samaa kirjaimistoa (italia–englanti);
// kreikka–englanti on neutraali (muste). Yksipalstaisena käännös on lainaus kuten ennen, ja Käännös-tilassa leipätekstiä.
// Kielet-asetuksen vaihto (lomitusLuokat() asettelun jälkeen) tuo luokan takaisin.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

const ITALIA = `---
ladonta: lomitettu käännös
---

# Lettera a Francesco Vettori

Venuta la sera, mi ritorno a casa ed entro nel mio scrittoio; e in sull’uscio mi spoglio quella veste cotidiana, piena di fango e di loto, e mi metto panni reali e curiali.

> At nightfall I return home and seek my writing room, and, divesting myself on its threshold of my rustic garments, stained with mud and mire, I assume courtly attire.

E rivestito condecentemente, entro nelle antique corti delli antiqui huomini, dove, da loro ricevuto amorevolmente, mi pasco di quel cibo che solum è mio e ch’io nacqui per lui.

> And thus suitably clothed, enter within the ancient courts of ancient men, by whom, being cordially welcomed, I am fed with the food that alone is mine, and for which I was born.
`;

const KREIKKA = `---
ladonta: lomitettu käännös
---

# Πολιτεία

κατέβην χθὲς εἰς Πειραιᾶ μετὰ Γλαύκωνος τοῦ Ἀρίστωνος προσευξόμενός τε τῇ θεῷ καὶ ἅμα τὴν ἑορτὴν βουλόμενος θεάσασθαι τίνα τρόπον ποιήσουσιν ἅτε νῦν πρῶτον ἄγοντες.

> I went down yesterday to the Piraeus with Glaucon the son of Ariston, that I might offer up my prayers to the goddess; and also because I wanted to see in what manner they would celebrate the festival.

καλὴ μὲν οὖν μοι καὶ ἡ τῶν ἐπιχωρίων πομπὴ ἔδοξεν εἶναι, οὐ μέντοι ἧττον ἐφαίνετο πρέπειν ἣν οἱ Θρᾷκες ἔπεμπον.

> I was delighted with the procession of the inhabitants; but that of the Thracians was equally, if not more, beautiful.
`;

const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

// Värit laskettuina: teeman muuttujan arvo samalla tavalla kuin selain sen tekstille antaa.
const mittaa = p => p.evaluate(() => {
  const art = document.getElementById('teksti'), bq = art.querySelector('blockquote.kaannos'), alku = art.querySelector('p.alku');
  const vari = v => { const d = document.createElement('span'); d.style.color = 'var(' + v + ')'; art.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
  return { rinnakkain: art.classList.contains('rinnakkain'), sama: art.classList.contains('sama-kirjaimisto'),
    kaannos: getComputedStyle(bq).color, alku: getComputedStyle(alku).color, muste: getComputedStyle(art).color,
    sitaatti: vari('--sitaatti'), parit: art.querySelectorAll('div.pari').length };
});

palvelin.listen(0, async () => {
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const sivuvirheet = [];

  const avaa = async (md, leveys, korkeus, aset) => {
    const p = await (await b.newContext({ viewport: { width: leveys, height: korkeus } })).newPage();
    p.on('pageerror', e => sivuvirheet.push(e.message));
    await p.goto(BASE + 'luin.html');
    await p.evaluate(([md, aset]) => {
      localStorage.clear();
      localStorage.setItem('luin-asetukset', JSON.stringify(Object.assign({ av: 11 }, aset)));
      localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' }));
    }, [md, aset]);
    await p.goto('about:blank');
    await p.goto(BASE + 'luin.html#tuo');
    await p.waitForFunction(() => window.__luin && window.__luin.nyt() && document.querySelector('#teksti blockquote.kaannos'));
    await p.waitForTimeout(600); // kirjasinten lataus asettelee
    return p;
  };
  const kuva = async (p, n) => { if (KUVAT) await p.screenshot({ path: path.join(KUVAT, n + '.png') }); };

  let p = await avaa(ITALIA, 1280, 900, { teema: 'vaalea' });
  let m = await mittaa(p);
  tulos('italia–englanti työpöydällä: rinnakkain, käännös --sitaatti', m.rinnakkain && m.sama && m.parit === 2 && m.kaannos === m.sitaatti && m.alku === m.muste && m.sitaatti !== m.muste, JSON.stringify(m));
  await kuva(p, 'lomitus-italia-1280');
  await p.close();

  p = await avaa(KREIKKA, 1280, 900, { teema: 'vaalea' });
  m = await mittaa(p);
  tulos('kreikka–englanti työpöydällä: rinnakkain, käännös neutraali', m.rinnakkain && !m.sama && m.parit === 2 && m.kaannos === m.muste, JSON.stringify(m));
  await kuva(p, 'lomitus-kreikka-1280');
  await p.close();

  p = await avaa(ITALIA, 412, 824, { teema: 'vaalea' });
  m = await mittaa(p);
  tulos('italia–englanti mobiilissa: yksipalstainen, käännös lainauksena', !m.rinnakkain && m.kaannos === m.sitaatti, JSON.stringify(m));
  await p.close();

  p = await avaa(ITALIA, 1280, 900, { teema: 'tumma', sysi: 1 });
  m = await mittaa(p);
  tulos('italia–englanti Sysissä: käännös teeman --sitaatti', m.rinnakkain && m.sama && m.kaannos === m.sitaatti && m.sitaatti !== m.muste, JSON.stringify(m));
  await p.close();

  p = await avaa(ITALIA, 1280, 900, { teema: 'vaalea', lomitus: 'kaannos' });
  m = await mittaa(p);
  tulos('italia–englanti Käännös-tilassa: leipätekstiä', !m.sama && m.kaannos === m.muste, JSON.stringify(m));
  await p.close();

  // Kielet-asetuksen vaihto: asettelu kirjoittaa art.className:n uudelleen, lomitusLuokat() palauttaa luokan.
  p = await avaa(ITALIA, 1280, 900, { teema: 'vaalea', lomitus: 'alku' });
  const ennen = await p.evaluate(() => document.getElementById('teksti').classList.contains('sama-kirjaimisto'));
  await p.evaluate(() => document.querySelector('#lukija .ratas').click());
  await p.waitForSelector('#asetukset:not([hidden])');
  await p.click('.asetus[data-a="lomitus"] button[data-arvo="molemmat"]');
  await p.waitForTimeout(400);
  m = await mittaa(p);
  tulos('Kielet: Alkuteksti → Molemmat tuo värin', !ennen && m.rinnakkain && m.sama && m.kaannos === m.sitaatti, JSON.stringify({ ennen, m }));
  await p.close();

  tulos('ei sivuvirheitä', sivuvirheet.length === 0, sivuvirheet.join(' | '));
  await b.close();
  palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
});
