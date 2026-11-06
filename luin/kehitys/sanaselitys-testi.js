// Sanaselityksen selaintesti ilman verkkoa. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sanaselitys-testi.js [kuvakansio] [--ei-taittoa]
// Wikisanakirja korvataan tekosanastolla (page.route): REST-määritelmät ja MediaWikin prefixsearch ja search luokkineen.
// Tekopalvelimen alkuhaku taittaa kirjainkoon ja diakriitit kuten oikea haku luultavasti; --ei-taittoa ajaa saman ilman
// taittoa (vain pienet kirjaimet), jolloin majuminuluku nojaa koko tekstin hakuun. Tarkistaa kielikohtaiset ketjut,
// valitsimen, huomautukset, raksin, asetusten riippumattomuuden ja käännöksen oletuksen. Kuvat kuvakansioon, jos annettu.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv.slice(2).filter(a => !a.startsWith('--'))[0];
const EI_TAITTOA = process.argv.includes('--ei-taittoa');
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

// Tekosanasto: otsikko → { kieli: [sanaluokka, määritelmä tai { muoto: 'perusmuoto' }], ... }, pop = suosituimmuus.
const NIMI = { fi: 'Finnish', en: 'English', la: 'Latin', grc: 'Ancient Greek', el: 'Greek', de: 'German', fr: 'French', sv: 'Swedish', sa: 'Sanskrit' };
const S = {
  kello: { pop: 90, fi: ['Noun', 'clock'] },
  kelloon: { pop: 5, fi: ['Noun', { muoto: 'illative singular of', k: 'kello' }] },
  poni: { pop: 60, fi: ['Noun', 'pony'] },
  ponille: { pop: 4, fi: ['Noun', { muoto: 'allative singular of', k: 'poni' }] },
  kissa: { pop: 95, fi: ['Noun', 'cat'] },
  kissoja: { pop: 9, fi: ['Noun', { muoto: 'partitive plural of', k: 'kissa' }] },
  kissoille: { pop: 7, fi: ['Noun', { muoto: 'allative plural of', k: 'kissa' }] },
  kissoissa: { pop: 6, fi: ['Noun', { muoto: 'inessive plural of', k: 'kissa' }] },
  kana: { pop: 80, fi: ['Noun', 'hen'] },
  Kanada: { pop: 70, fi: ['Proper noun', 'Canada'] },
  Kant: { pop: 50, en: ['Proper noun', 'Immanuel Kant, German philosopher'], de: ['Proper noun', 'a surname'] },
  kant: { pop: 40, sv: ['Noun', 'edge'] },
  Kantian: { pop: 45, en: ['Adjective', 'of or relating to Kant'] },
  kantele: { pop: 30, fi: ['Noun', 'kantele (instrument)'] },
  kanteli: { pop: 20, fi: ['Noun', 'a made-up second lemma'] },
  'ars longa, vita brevis': { pop: 30, la: ['Proverb', 'art is long, life is short'] },
  'pratītyasamutpāda': { pop: 10, en: ['Noun', 'dependent origination'] },
  'λόγος': { pop: 80, grc: ['Noun', 'word, speech, reason'] },
  logos: { pop: 50, en: ['Noun', 'the divine Word'] },
  'ψυχή': { pop: 60, grc: ['Noun', 'soul, breath'] },
  cogito: { pop: 40, la: ['Verb', 'I think'] },
  Dasein: { pop: 40, de: ['Noun', 'existence'], en: ['Noun', 'being-there'] },
  'Straße': { pop: 40, de: ['Noun', 'street'] },
  'kova onni': { pop: 20, fi: ['Noun', 'bad luck'] },
  kova: { pop: 85, fi: ['Adjective', 'hard'] },
  edes: { pop: 70, fi: ['Adverb', 'at least'], la: ['Verb', 'second-person singular present active subjunctive of edō'] }
};
function taita(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ').replace(/[,'’]/g, ''); }
function rest(o) {
  const e = S[o]; if (!e) return null;
  const j = {};
  for (const k of Object.keys(e)) {
    if (k === 'pop') continue;
    const [pos, d] = e[k];
    const html = typeof d === 'string' ? d : '<span class="form-of-definition use-with-mention">' + d.muoto + ' <span class="form-of-definition-link"><i class="Latn mention" lang="' + k + '"><a rel="mw:WikiLink" href="/wiki/' + encodeURIComponent(d.k) + '#' + NIMI[k] + '" title="' + d.k + '">' + d.k + '</a></i></span></span>';
    j[k] = [{ partOfSpeech: pos, language: NIMI[k], definitions: [{ definition: html }] }];
  }
  return j;
}
const pyynnot = [];
function api(u) {
  const q = u.searchParams, kat = (q.get('clcategories') || '').split('|').filter(Boolean);
  let t = Object.keys(S);
  if (q.get('generator') === 'prefixsearch') {
    const a = q.get('gpssearch');
    t = t.filter(o => EI_TAITTOA ? o.toLowerCase().startsWith(a.toLowerCase()) : taita(o).startsWith(taita(a)));
  } else {
    const sanat = taita(q.get('gsrsearch')).split(/\s+/);
    t = t.filter(o => sanat.every(w => taita(o).split(/\s+/).includes(w)));
  }
  t.sort((a, b) => S[b].pop - S[a].pop);
  const pages = t.map((o, i) => {
    const p = { ns: 0, title: o, index: i + 1 };
    if (kat.length) {
      p.categories = Object.keys(S[o]).filter(k => k !== 'pop').map(k => 'Category:' + NIMI[k] + (typeof S[o][k][1] === 'string' ? ' lemmas' : ' non-lemma forms'))
        .filter(c => kat.includes(c)).map(c => ({ ns: 14, title: c }));
    }
    return p;
  });
  return pages.length ? { batchcomplete: true, query: { pages } } : { batchcomplete: true };
}

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const MD = `---
title: Sanaselityksen koe
---
# Sanaselityksen koe

Ensimmäinen kappale on suomea ja se on aina tässä. Kello soi, ja hän katsoi kelloon, joka oli seinällä.

Tämä kappale on myös suomea, ja ponillehan ei ole sivua. Kissoi on kirjoitusvirhe, mutta se on myös testi.

Hänen mukaansa Kantin filosofia on vaikea, ja se on totta. Kantelx on keksitty sana, jolla on kaksi lähintä.

Lauseessa on kursiivi *ars longa vita brevis* ja toinen *ars long Vita breve* sekä *cogito* ja *pratityasamutpadaa* tässä.

Suomen kappale, jossa on kreikkaa λογος ja kovan onnen ilmaus sekä xyzzyq, jota ei ole.

Sed quod est in rebus psyche et quae sunt in animo, ut ita dicam, tamen nec enim ad hoc.

Der Begriff Strasse ist nicht das, was die Leute auf der Strasse sagen, und das ist auch gut so.

Hän ei jaksanut edes lukea sitä, ja *edes* kursiivissa on toinen tapaus, kuten myös ”hän ei edes yrittänyt” lainauksessa.

The book on Kant's ethics is long, and it is the one that was written by them.
`;

palvelin.listen(0, async () => {
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: KUVAT ? 2 : 1 });
  const p = await ctx.newPage();
  const sivuvirheet = [];
  p.on('pageerror', e => sivuvirheet.push(e.message));
  await p.route('https://en.wiktionary.org/**', route => {
    const u = new URL(route.request().url());
    pyynnot.push(decodeURIComponent(u.pathname + u.search));
    const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (u.pathname.startsWith('/api/rest_v1/page/definition/')) {
      const o = decodeURIComponent(u.pathname.slice('/api/rest_v1/page/definition/'.length)).replace(/_/g, ' ');
      const j = rest(o);
      return route.fulfill(j ? { status: 200, headers: h, body: JSON.stringify(j) } : { status: 404, headers: h, body: '{}' });
    }
    if (u.pathname === '/w/api.php') return route.fulfill({ status: 200, headers: h, body: JSON.stringify(api(u)) });
    return route.fulfill({ status: 404, headers: h, body: '{}' });
  });
  // Kuvat rajataan selitysikkunaan (tai koko ruutuun, jos ikkuna on kiinni).
  const kuva = async n => {
    if (!KUVAT) return;
    const c = await p.evaluate(() => { const e = document.querySelector('#pop'); if (e.hidden) return null; const r = e.getBoundingClientRect(); return { x: r.left - 12, y: r.top - 12, width: r.width + 24, height: r.height + 24 }; });
    await p.screenshot(Object.assign({ path: path.join(KUVAT, n + '.png') }, c ? { clip: c } : {}));
  };

  // Ensikäyttö: käännös ei ole oletuksena valikossa, sanaselitys on.
  await p.goto(BASE + 'luin.html');
  await p.evaluate(md => { localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'koe' })); }, MD);
  await p.goto('about:blank');
  await p.goto(BASE + 'luin.html#tuo');
  await p.waitForTimeout(500);
  const oletus = await p.evaluate(() => ({ k: window.__luin.aset.kaannos, s: window.__luin.aset.sanakirja, suk: window.__luin.aset.sukSana, av: window.__luin.aset.av }));
  tulos('oletukset: sanaselitys valikossa, käännös ei, sukkela päällä', oletus.k === 0 && oletus.s === 1 && oletus.suk === 1 && oletus.av === 6, JSON.stringify(oletus));

  // Selitys tekstin kohdasta: odotetaan, kunnes Haetaan… vaihtuu.
  async function selita(sana, n) {
    pyynnot.length = 0;
    await p.evaluate(([sana, n]) => {
      const T = window.__luin.nyt().txt;
      let b = -1, s = -1, c = 0;
      for (let i = 0; i < T.length && b < 0; i++) { let j = -1; while ((j = T[i].indexOf(sana, j + 1)) >= 0) { if (c++ === (n || 0)) { b = i; s = j; break; } } }
      if (b < 0) throw new Error('ei löydy: ' + sana);
      window.__luin.selitys(b, s, s + sana.length);
    }, [sana, n]);
    await p.waitForFunction(() => { const t = document.querySelector('#pop .sk-runko'); return t && !/Haetaan/.test(t.textContent); }, null, { timeout: 5000 });
    return p.evaluate(() => {
      const q = s => document.querySelector('#pop ' + s), qa = s => [...document.querySelectorAll('#pop ' + s)];
      return { ots: q('.sk-o').textContent, huom: qa('.sk-huom').map(e => e.textContent), varo: qa('.sk-varo').map(e => e.textContent),
        kielet: qa('.sk-kieli').map(e => e.textContent), maar: qa('.sk-ol li').map(e => e.textContent), vaihdot: qa('.sk-vaihto').map(e => e.textContent),
        tieto: (q('.sk-tieto') || {}).textContent || '', lisaa: !!q('.sk-lisa'), takaisin: !!q('.sk-takaisin'), raksi: !!q('.sk-sulje') };
    });
  }
  const ymp = (sana, n) => p.evaluate(([sana, n]) => {
    const T = window.__luin.nyt().txt; let c = 0;
    for (let i = 0; i < T.length; i++) { let j = -1; while ((j = T[i].indexOf(sana, j + 1)) >= 0) { if (c++ === (n || 0)) return window.__luin.selitysYmparisto(i, j, j + sana.length); } }
  }, [sana, n]);

  let r = await selita('kelloon');
  tulos('fi: tasan sama taivutusmuoto (kelloon), yksi pyyntö', r.ots === 'kelloon' && /illative singular of kello/.test(r.maar[0]) && !r.huom.length && r.raksi && !r.takaisin && pyynnot.length === 1, JSON.stringify(r) + ' ' + pyynnot.length);
  await kuva('sk-kelloon');
  r = await selita('Kello');
  tulos('fi: virkkeen alun iso kirjain → pieni (Kello → kello)', r.ots === 'kello' && !r.huom.length, JSON.stringify(r));
  r = await selita('ponillehan');
  console.log('     ponillehan: ' + pyynnot.length + ' pyyntöä: ' + pyynnot.map(u => u.replace(/^.*(gpssearch|gsrsearch)=([^&]*).*$/, '$1=$2').replace(/^\/api\/rest_v1\/page\/definition\//, 'rest:')).join(' · '));
  tulos('fi: loppunapsu ja perusmuoto (ponillehan → poni)', r.ots === 'poni' && /lähin osuma/i.test(r.huom.join()) && /pony/.test(r.maar.join()), JSON.stringify(r));
  await kuva('sk-ponillehan');
  r = await selita('Kissoi');
  tulos('fi: saman perusmuodon taivutukset yhdistyvät (Kissoi → kissa)', r.ots === 'kissa' && !r.vaihdot.length, JSON.stringify(r));
  r = await selita('Kantin');
  tulos('fi: erisnimi keskellä virkettä (Kantin → Kant, ei kana)', r.ots === 'Kant' && /Suomesta ei osumaa/.test(r.huom.join()), JSON.stringify(r));
  r = await selita('Kantelx');
  tulos('fi: valitsin, kun napsusta tulee kaksi perusmuotoa', r.vaihdot.join('|') === 'kantele|kanteli' && !r.lisaa && /Lähimmät osumat/.test(r.huom.join()), JSON.stringify(r));
  await kuva('sk-valitsin');
  await p.click('#pop .sk-vaihto[data-i="1"]');
  await p.waitForFunction(() => /made-up/.test(document.querySelector('#pop .sk-runko').textContent));
  r = await p.evaluate(() => ({ ots: document.querySelector('#pop .sk-o').textContent, takaisin: !!document.querySelector('#pop .sk-takaisin'), lisaa: !!document.querySelector('#pop .sk-lisa') }));
  tulos('valitsimen valinta ilman paluuta valitsimeen', r.ots === 'kanteli' && !r.takaisin && r.lisaa, JSON.stringify(r));

  let y = await ymp('ars longa vita brevis');
  tulos('ympäristö: kursiivi, vip ja suomi', y.kursiivi && !y.vip && y.kieli === 'fi', JSON.stringify(y));
  y = await ymp('cogito');
  tulos('ympäristö: 1–3 sanan kursiivi leipätekstissä on vip', y.kursiivi && y.vip, JSON.stringify(y));
  r = await selita('ars longa vita brevis');
  tulos('kursiivi: ilmaus ilman pilkkua (ars longa vita brevis)', r.ots === 'ars longa, vita brevis' && /toisin kirjoitettuna/.test(r.huom.join()), JSON.stringify(r));
  r = await selita('ars long Vita breve');
  tulos('kursiivi: ilmaus sanoittain napsien (ars long Vita breve)', r.ots === 'ars longa, vita brevis' && /lähin osuma/i.test(r.huom.join()), JSON.stringify(r));
  r = await selita('cogito');
  tulos('kursiivi: muun kielen tasan sama ja kielihuomautus (cogito)', r.ots === 'cogito' && /Suomesta ei osumaa/.test(r.huom.join()) && r.kielet[0].startsWith('Latin'), JSON.stringify(r));
  r = await selita('pratityasamutpadaa');
  tulos('vip: napsu ja majuminuluku yhtä aikaa (pratityasamutpadaa)', r.ots === 'pratītyasamutpāda', JSON.stringify(r));
  r = await selita('λογος');
  tulos('kreikka: majuminuluku muinaiskreikasta (λογος → λόγος)', r.ots === 'λόγος' && r.kielet[0].startsWith('Ancient Greek') && /toisin kirjoitettuna/.test(r.huom.join()), JSON.stringify(r));
  r = await selita('edes');
  tulos('fi: suomesta löytyvään ei tule muiden kielten tietoja (edes, ei latinaa)', r.ots === 'edes' && r.kielet.length === 1 && r.kielet[0].startsWith('Finnish') && !/Latin/.test(r.maar.join() + r.kielet.join()), JSON.stringify(r));
  r = await selita('edes', 1);
  tulos('kursiivi: suomi ensin, muut kielet saavat jäädä mukaan (liudentunut)', r.kielet.length === 2 && r.kielet[0].startsWith('Finnish') && /Latin/.test(r.kielet[1]), JSON.stringify(r));
  r = await selita('edes', 2);
  tulos('lainaus: kuin suomikonteksti, vain suomi', r.kielet.length === 1 && r.kielet[0].startsWith('Finnish'), JSON.stringify(r));
  r = await selita('kovan onnen');
  tulos('fi: ilmauksen kongruenssi sanoittain (kovan onnen → kova onni)', r.ots === 'kova onni', JSON.stringify(r));
  r = await selita('xyzzyq');
  tulos('ei löydy', /ei löytynyt/.test(r.tieto) && r.lisaa, JSON.stringify(r));
  y = await ymp('psyche');
  tulos('ympäristö: latina tunnistetaan', y.kieli === 'la', JSON.stringify(y));
  r = await selita('psyche');
  tulos('latina: viimeinen oljenkorsi kreikaksi varoituksin (psyche → ψυχή)', r.ots === 'ψυχή' && /Heikoilla jäillä/.test(r.varo.join()), JSON.stringify(r));
  await kuva('sk-psyche');
  r = await selita('Strasse');
  tulos('saksa: ss → ß (Strasse → Straße)', r.ots === 'Straße' && /toisin kirjoitettuna/.test(r.huom.join()), JSON.stringify(r));
  r = await selita("Kant's");
  tulos("englanti: erisnimen pääte (Kant's → Kant)", r.ots === 'Kant' && r.kielet[0].startsWith('English'), JSON.stringify(r));

  // Raksi sulkee.
  await selita('kelloon');
  await p.click('#pop .sk-sulje');
  tulos('raksi sulkee', await p.evaluate(() => document.querySelector('#pop').hidden));

  // Mittaus: raksin muste lisää-linkin oikean laidan tasalla, merkin muste lisää-linkin vasemman laidan tasalla ja raksin
  // alalaita sanan peruslinjalla (pikseleistä; muste = paperista poikkeava väri).
  await selita('kelloon');
  const m = await p.evaluate(() => {
    const q = s => document.querySelector('#pop ' + s).getBoundingClientRect();
    const o = q('.sk-o'), r = document.createRange(); r.selectNodeContents(document.querySelector('#pop .sk-lisa'));
    const l = r.getBoundingClientRect(), pop = document.querySelector('#pop').getBoundingClientRect();
    return { pop: { x: pop.left, y: pop.top, w: pop.width, h: pop.height }, lisa: { x: l.left, y: l.top, w: l.width, h: l.height }, sana: { x: o.left, y: o.top, w: o.width, h: o.height } };
  });
  const png = await p.screenshot({ clip: { x: m.pop.x, y: m.pop.y, width: m.pop.w, height: m.pop.h } });
  const kuvaus = await p.evaluate(async ([b64, m]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width;
    const paperi = [d[(5 * W + 5) * 4], d[(5 * W + 5) * 4 + 1], d[(5 * W + 5) * 4 + 2]];
    const muste = (x, y) => { const i = (y * W + x) * 4; return Math.abs(d[i] - paperi[0]) + Math.abs(d[i + 1] - paperi[1]) + Math.abs(d[i + 2] - paperi[2]) > 60; };
    const sar = (x0, x1, y0, y1) => { const s = []; for (let x = x0; x < x1; x++) { let n = 0; for (let y = y0; y < y1; y++) if (muste(x, y)) n++; if (n) s.push(x); } return s; };
    const riv = (x0, x1, y0, y1) => { const s = []; for (let y = y0; y < y1; y++) { let n = 0; for (let x = x0; x < x1; x++) if (muste(x, y)) n++; if (n) s.push(y); } return s; };
    // Kuvan pikselit (laitepikseleitä, deviceScaleFactor) CSS-pikseleiksi: K.
    const K = W / m.pop.w, X = v => Math.round(v * K);
    const ox = m.pop.x, oy = m.pop.y, ylin = X(m.sana.y - oy + m.sana.h);
    // Otsikkorivi: sanan oikealta laidalta ruudun reunaan (1 px reunus pois).
    const otsS = sar(X(m.sana.x - ox + m.sana.w + 4), W - X(2), X(2), ylin);
    // Ryhmät: merkki ja raksi erillään.
    const ryh = []; otsS.forEach(x => { if (ryh.length && x - ryh[ryh.length - 1][1] <= X(2)) ryh[ryh.length - 1][1] = x; else ryh.push([x, x]); });
    const lisaS = sar(X(m.lisa.x - ox - 2), X(m.lisa.x - ox + m.lisa.w + 2), X(m.lisa.y - oy), X(m.lisa.y - oy + m.lisa.h));
    const raksi = ryh[ryh.length - 1], raksiR = riv(raksi[0], raksi[1] + 1, X(2), ylin);
    // Sanan peruslinja: sanan musteen alin rivi (kelloon: ei alapidennyksiä).
    const sanaR = riv(X(m.sana.x - ox), X(m.sana.x - ox + m.sana.w), X(2), ylin);
    // Takaisin CSS-pikseleiksi: vasen laita pikselin alku, oikea laita pikselin loppu.
    const va = v => +(v / K).toFixed(2), oi = v => +((v + 1) / K).toFixed(2);
    return { ryhmat: ryh.map(g => [va(g[0]), oi(g[1])]), lisa: [va(lisaS[0]), oi(lisaS[lisaS.length - 1])], raksiAla: oi(raksiR[raksiR.length - 1]), raksiYla: va(raksiR[0]),
      sanaAla: oi(sanaR[sanaR.length - 1]), sanaYla: va(sanaR[0]), K };
  }, [png.toString('base64'), m]);
  const merkki = kuvaus.ryhmat[kuvaus.ryhmat.length - 2], raksi = kuvaus.ryhmat[kuvaus.ryhmat.length - 1];
  tulos('raksin muste lisää-linkin oikean laidan tasalla (±1 px)', raksi && Math.abs(raksi[1] - kuvaus.lisa[1]) <= 1, JSON.stringify(kuvaus));
  tulos('merkin muste lisää-linkin vasemman laidan tasalla (±1 px)', merkki && Math.abs(merkki[1] - kuvaus.lisa[0]) <= 1, JSON.stringify({ merkki, lisa: kuvaus.lisa }));
  tulos('raksin alalaita sanan peruslinjalla (±1 px)', Math.abs(kuvaus.raksiAla - kuvaus.sanaAla) <= 1, JSON.stringify({ raksi: [kuvaus.raksiYla, kuvaus.raksiAla], sana: [kuvaus.sanaYla, kuvaus.sanaAla] }));
  // Lambdan haarojen välisen aukon lakipiste raksin haarojen välisen aukon lakipisteen korkeudella (±1 px). Linssi piiloon,
  // koska sen varsi halkoo aukon; lakipiste = aukon ylin tyhjä pikseli (täyttö siemenestä aukon alaosasta).
  const lakipisteet = await (async () => {
    await p.addStyleTag({ content: '#pop .linssi { visibility: hidden !important; }' });
    const out = {};
    for (const [nimi, sel] of [['lambda', '#pop .sk-ots svg.sanasto'], ['raksi', '#pop .sk-sulje svg']]) {
      const r = await p.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, sel);
      const kuva64 = (await p.screenshot({ clip: { x: r.x, y: r.y, width: r.w, height: r.h } })).toString('base64');
      out[nimi] = await p.evaluate(async ([b64, nimi, r]) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const W = c.width, H = c.height, d = g.getImageData(0, 0, W, H).data, K = W / r.w;
        const pa = [d[0], d[1], d[2]];
        const muste = (x, y) => { const i = (y * W + x) * 4; return Math.abs(d[i] - pa[0]) + Math.abs(d[i + 1] - pa[1]) + Math.abs(d[i + 2] - pa[2]) > 60; };
        const u = nimi === 'lambda' ? r.w / 22.5 * K : r.w / 10 * K;
        const raja = Math.round(nimi === 'lambda' ? 17 * u : 8.5 * u + 1), sy = raja - 1;
        // Siemen: rajarivillä ensimmäisen musteen (haara) jälkeinen tyhjä väli ennen toista haaraa.
        let x1 = 0; while (x1 < W && !muste(x1, sy)) x1++;
        let x2 = x1; while (x2 < W && muste(x2, sy)) x2++;
        let x3 = x2; while (x3 < W && !muste(x3, sy)) x3++;
        const sx = Math.round((x2 + x3 - 1) / 2);
        const nahty = new Uint8Array(W * H), pino = [[sx, sy]]; let ylin = H;
        while (pino.length) { const [x, y] = pino.pop(); if (x < 0 || y < 0 || x >= W || y >= raja || nahty[y * W + x] || muste(x, y)) continue;
          nahty[y * W + x] = 1; ylin = Math.min(ylin, y); pino.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
        return +(ylin / K).toFixed(2);
      }, [kuva64, nimi, r]);
      out[nimi] += r.y;
    }
    return out;
  })();
  // Merkki on 0.85-kertainen (6.11.2026), joten lakipisteet eivät enää ole samalla korkeudella; vain suuruusluokka (±3 px).
  tulos('lambdan aukon lakipiste raksin aukon lakipisteen lähellä (±3 px)', Math.abs(lakipisteet.lambda - lakipisteet.raksi) <= 3, JSON.stringify(lakipisteet));
  await kuva('sk-mittaus');
  await p.click('#pop .sk-sulje');

  // Valikon lambda: enintään SK_SANAT sanaa yhdestä kappaleesta (maalaus kahdella kohdalla).
  const lambda = async (sana, lkm) => p.evaluate(([sana, lkm]) => {
    const T = window.__luin.nyt().txt;
    for (let i = 0; i < T.length; i++) { const j = T[i].indexOf(sana); if (j >= 0) {
      const w = T[i].slice(j).split(/\s+/).slice(0, lkm).join(' ');
      return { b: i, s: j, e: j + w.length };
    } }
  }, [sana, lkm]);
  for (const [lkm, odota] of [[1, true], [3, true], [10, true], [11, false]]) {
    const k = await lambda('Ensimmäinen', lkm);
    await p.evaluate(k => { window.__luin.aset.auto = 0; }, k);
    const nappi = await p.evaluate(k => {
      const el = window.__luin.nyt().blocks[k.b];
      const r = document.createRange();
      // Valinta selaimen tavalla: valintaPaloiksi() lukee alueen.
      const ns = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) ns.push(n);
      let c = 0, a = null, z = null;
      for (const t of ns) { const L = t.nodeValue.replace(/­/g, '').length; if (!a && k.s < c + L) a = [t, k.s - c]; if (!z && k.e <= c + L) z = [t, k.e - c]; c += L; }
      r.setStart(a[0], a[1]); r.setEnd(z[0], z[1]);
      getSelection().removeAllRanges(); getSelection().addRange(r);
      window.__luin.valinta();
      const ok = !!document.querySelector('#pop:not([hidden]) button[data-k="sk"]');
      const kaanna = !!document.querySelector('#pop:not([hidden]) button[data-k="kaanna"]');
      document.querySelector('#pop').hidden = true; getSelection().removeAllRanges();
      return { ok, kaanna };
    }, k);
    tulos('valikon lambda ' + lkm + ' sanalla: ' + (odota ? 'on' : 'ei'), nappi.ok === odota && !nappi.kaanna, JSON.stringify(nappi));
  }

  // Asetukset: Sukkela sanaselitys ei ole pois käytöstä, vaikka valikon sanaselitys on pois; tuplaklikkaus avaa silti
  // sanaselityksen. Molemmat päällä: tuplaklikkaus avaa sanaselityksen, ei valikkoa.
  const tupla = async () => {
    const r = await p.evaluate(() => {
      const T = window.__luin.nyt().txt, b = T.findIndex(t => t.includes('kelloon')), el = window.__luin.nyt().blocks[b];
      el.scrollIntoView({ block: 'center' });
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const i = n.nodeValue.indexOf('kelloon'); if (i >= 0) { const r = document.createRange(); r.setStart(n, i + 2); r.setEnd(n, i + 3); const q = r.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; } }
    });
    await p.mouse.dblclick(r.x, r.y);
    await p.waitForTimeout(400);
    return p.evaluate(() => ({ sk: !document.querySelector('#pop').hidden && document.querySelector('#pop').classList.contains('sanakirja'),
      valikko: !document.querySelector('#pop').hidden && document.querySelector('#pop').classList.contains('rivi') }));
  };
  await p.evaluate(() => { const a = window.__luin.aset; a.auto = 1; a.sanakirja = 0; a.sukSana = 1; });
  let t = await tupla();
  tulos('sukkela ilman valikon sanaselitystä: tuplaklikkaus avaa selityksen', t.sk && !t.valikko, JSON.stringify(t));
  await p.keyboard.press('Escape'); await p.evaluate(() => { document.querySelector('#pop').hidden = true; });
  await p.evaluate(() => { const a = window.__luin.aset; a.sanakirja = 1; a.sukSana = 1; });
  t = await tupla();
  tulos('molemmat päällä: tuplaklikkaus avaa selityksen, ei valikkoa', t.sk && !t.valikko, JSON.stringify(t));
  await p.evaluate(() => { document.querySelector('#pop').hidden = true; });
  const ase = await p.evaluate(() => {
    window.__luin.aset.sanakirja = 0;
    document.querySelector('#lukija .ratas').click();
    const nappi = document.querySelector('#asetukset button[data-kytkin="sukSana"]');
    const lambda = nappi.querySelector('svg.sanasto .lambda'), linssi = nappi.querySelector('svg.sanasto .linssi');
    const v = document.querySelector('#asetukset button[data-kytkin="sanakirja"]');
    const tulos = { pois: nappi.disabled, lambda: getComputedStyle(lambda).stroke, linssi: getComputedStyle(linssi).stroke,
      okra: getComputedStyle(document.documentElement).getPropertyValue('--okra').trim(), teksti: getComputedStyle(nappi).color,
      nimi: v.textContent, kaannos: document.querySelector('#asetukset button[data-kytkin="kaannos"]').textContent };
    return tulos;
  });
  tulos('asetukset: Sukkela sanaselitys käytössä ilman valikon sanaselitystä', !ase.pois, JSON.stringify(ase));
  tulos('asetukset: lambda okraa, linssi ruostetta, ei tekstin väriä', ase.lambda !== ase.teksti && /rgb\(176, 122, 22\)/.test(ase.lambda), JSON.stringify(ase));
  tulos('asetukset: Sanaselitys (Wiktionary), ei Sanakirja', /^Sanaselitys \(Wiktionary\)$/.test(ase.nimi.trim()), ase.nimi);
  if (KUVAT) await p.locator('#asetukset button[data-kytkin="sukSana"]').locator('xpath=ancestor::div[contains(@class,"asetus")]').screenshot({ path: path.join(KUVAT, 'sk-asetukset.png') });
  if (KUVAT) await p.locator('#asetukset button[data-kytkin="sanakirja"]').locator('xpath=ancestor::div[contains(@class,"asetus")]').screenshot({ path: path.join(KUVAT, 'sk-asetukset-valikossa.png') });

  // Tallennettu av 5 (käännös päällä pilotin oletuksena) → av 6: käännös pois kerran.
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.av = 5; a.kaannos = 1; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await p.reload(); await p.waitForTimeout(400);
  const av = await p.evaluate(() => ({ k: window.__luin.aset.kaannos, av: window.__luin.aset.av }));
  tulos('av 6: tallennettu pilotin käännös pois kerran', av.k === 0 && av.av === 6, JSON.stringify(av));

  // Kapea kosketusruutu (360 px): pitkä otsikko rivittyy, eikä se, merkki ja raksi mene päällekkäin, eikä ikkuna ylitä ruutua.
  await p.setViewportSize({ width: 360, height: 740 });
  await p.waitForTimeout(300);
  for (const sana of ['pratityasamutpadaa', 'Kantelx']) {
    await selita(sana);
    const k = await p.evaluate(() => {
      const R = s => document.querySelector('#pop ' + s).getBoundingClientRect(), pop = document.querySelector('#pop').getBoundingClientRect();
      const o = R('.sk-o'), m = R('.sk-ots svg.sanasto'), x = R('.sk-sulje svg');
      return { pois: pop.left < 0 || pop.right > innerWidth, paalle: o.right > m.left + .5 || m.right > x.left + .5 };
    });
    tulos('360 px: ' + sana + ' ilman päällekkäisyyttä', !k.pois && !k.paalle, JSON.stringify(k));
    await kuva('sk-360-' + sana);
    await p.click('#pop .sk-sulje');
  }

  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
});
