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
const NIMI = { fi: 'Finnish', en: 'English', la: 'Latin', grc: 'Ancient Greek', el: 'Greek', de: 'German', fr: 'French', sv: 'Swedish', sa: 'Sanskrit', af: 'Afrikaans', da: 'Danish', mul: 'Translingual' };
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
  edes: { pop: 70, fi: ['Adverb', 'at least'], la: ['Verb', 'second-person singular present active subjunctive of edō'] },
  is: { pop: 99, en: ['Verb', 'third-person singular present of be'], af: ['Verb', 'present of wees'] },
  est: { pop: 70, la: ['Verb', 'is'], fr: ['Noun', 'east'] },
  gut: { pop: 60, de: ['Adjective', 'good'], en: ['Noun', 'intestine'] },
  ethos: { pop: 30, en: ['Noun', 'character of a people'], grc: ['Noun', 'custom, habit'] },
  // Translingual (mul) kuten oikeassa rajapinnassa: ISO 639 -kielikoodit ja symbolit (mitattu 6.11.2026).
  as: { pop: 98, mul: ['Symbol', ['Symbol for attosecond.', 'ISO 639-1 language code for Assamese.']], en: ['Conjunction', 'to such an extent'], fi: ['Noun', '(music) A-flat'], af: ['Noun', 'axle'] },
  // As kuten oikeassa rajapinnassa: englanniksi vain taivutusviittaus (plural of A), Translingual arseeni.
  As: { pop: 60, mul: ['Symbol', 'Symbol for arsenic.'], en: ['Noun', { muoto: 'plural of', k: 'A' }] },
  to: { pop: 97, mul: ['Symbol', 'ISO 639-1 language code for Tongan.'], en: ['Preposition', 'in the direction of'] },
  km: { pop: 50, mul: ['Symbol', ['Symbol for kilometre.', 'ISO 639-1 language code for Khmer.']], da: ['Noun', 'abbreviation of kilometer'] },
  jos: { pop: 90, fi: ['Conjunction', 'if'], en: ['Noun', 'a made-up English sense'] },
  etymon: { pop: 20, en: ['Noun', 'an earlier form of a word'] },
  IV: { pop: 40, mul: ['Numeral', 'Roman numeral four.'], en: ['Noun', 'intravenous drip'] }
};
// Etymologiat (action=parse) kuten oikea Wikisanakirja: kielen osio h2, Etymology tai Etymology 1, 2 … (h3), sanaluokat sen alla.
// Osion teksti sisältää oman otsikkonsa ja alaosionsa (section=N), siksi mukana on ääntämys ja sanaluokka, joita ei saa näkyä.
const E = {
  kello: { Finnish: ['From <span class="etyl"><a href="https://en.wikipedia.org/wiki/Proto-Finnic_language">Proto-Finnic</a></span> <i class="Latn mention" lang="urj-fin-pro"><a href="/wiki/Reconstruction:Proto-Finnic/kello">*kello</a></i>; compare <i class="Latn mention" lang="fi"><a href="/wiki/kellua#Finnish">kellua</a></i>.<sup class="reference">[1]</sup>'] },
  as: { English: ['From Middle English <i>as</i>, from Old English <i>eallswā</i>.'] },
  // As on englanniksi pelkkä taivutusviittaus (plural of A), mutta sillä on tässä oma etymologia: muoto pysyy, ei hyppyä A:han.
  As: { English: ['Own etymology of the plural As.'] },
  kanteli: { Finnish: ['A made-up etymology for <i>kanteli</i>.'] },
  kantele: { Finnish: [] },
  Kant: { English: ['From the surname of <a href="/wiki/Immanuel_Kant" title="x">Immanuel Kant</a>.', 'Second sense of Kant.'], German: ['From <span class="etyl">Middle High German</span> <i><a href="/wiki/kant#Middle_High_German">kant</a></i>.'] }
};
const NIMET = Object.fromEntries(Object.entries(NIMI).map(([k, v]) => [k, v]));
function parse(u) {
  const q = u.searchParams, o = q.get('page'), e = E[o];
  if (!e) return { error: { code: 'missingtitle' } };
  const osiot = []; let n = 0;
  for (const kieli of Object.keys(S[o]).filter(k => k !== 'pop').map(k => NIMET[k])) {
    osiot.push({ toclevel: 1, level: '2', line: kieli, index: String(++n) });
    const et = e[kieli] || [];
    const nimeta = et.length > 1;
    et.forEach((t, i) => {
      osiot.push({ toclevel: 2, level: '3', line: 'Etymology' + (nimeta ? ' ' + (i + 1) : ''), index: String(++n), teksti: t });
      osiot.push({ toclevel: 3, level: nimeta ? '4' : '3', line: 'Noun', index: String(++n) });
    });
    if (!et.length) osiot.push({ toclevel: 2, level: '3', line: 'Pronunciation', index: String(++n) });
  }
  if (q.get('prop') === 'sections') return { parse: { title: o, sections: osiot.map(({ teksti, ...x }) => x) } };
  const s = osiot.find(x => x.index === q.get('section'));
  return { parse: { title: o, text: '<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><div class="mw-heading mw-heading3"><h3 id="Etymology">' + s.line + '</h3></div>' +
    '<div class="NavFrame"><div class="NavHead">Etymology tree</div><div class="NavContent">PUU</div></div>' +
    '<p>' + s.teksti + '</p><style>.x{}</style>' + (/Second/.test(s.teksti) ? '<ul><li>Cognate one</li><li>Cognate two<ul><li>SISÄ</li></ul></li></ul>' : '') +
    '<div class="mw-heading mw-heading4"><h4 id="Pronunciation">Pronunciation</h4></div><ul><li>IPA: ÄÄNTÄMYS</li></ul>' +
    '<div class="mw-heading mw-heading4"><h4 id="Noun">Noun</h4></div><p><b>' + o + '</b></p><ol><li>MÄÄRITELMÄ</li></ol></div>' } };
}
function taita(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ').replace(/[,'’]/g, ''); }
function rest(o) {
  const e = S[o]; if (!e) return null;
  const j = {};
  for (const k of Object.keys(e)) {
    if (k === 'pop') continue;
    const [pos, d] = e[k];
    const html = d => typeof d === 'string' ? d : '<span class="form-of-definition use-with-mention">' + d.muoto + ' <span class="form-of-definition-link"><i class="Latn mention" lang="' + k + '"><a rel="mw:WikiLink" href="/wiki/' + encodeURIComponent(d.k) + '#' + NIMI[k] + '" title="' + d.k + '">' + d.k + '</a></i></span></span>';
    const osa = { partOfSpeech: pos, language: NIMI[k], definitions: [].concat(d).map(x => ({ definition: html(x) })) };
    // Oikean rajapinnan avaimet: Translingual on avaimen en alla ennen englantia, muinaiskreikka koodittomien kielten
    // avaimessa other (λόγος, ψυχή; mitattu 6.11.2026).
    const avain = k === 'mul' ? 'en' : k === 'grc' ? 'other' : k;
    if (k === 'mul') j.en = [osa].concat(j.en || []); else (j[avain] = j[avain] || []).push(osa);
  }
  return j;
}
const pyynnot = [];
const KERRAN_429 = new Set(['jos']); // ensimmäinen REST-haku antaa 429:n (Wikisanakirjan pyyntörajoitus)
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
      p.categories = Object.keys(S[o]).filter(k => k !== 'pop').map(k => 'Category:' + NIMI[k] + (typeof [].concat(S[o][k][1])[0] === 'string' ? ' lemmas' : ' non-lemma forms'))
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

Tämä kappale on myös suomea, ja jos ponillehan ei ole sivua. Kissoi on kirjoitusvirhe, mutta se on myös testi.

Hänen mukaansa Kantin filosofia on vaikea, ja se on totta. Kantelx on keksitty sana, jolla on kaksi lähintä.

Lauseessa on kursiivi *ars longa vita brevis* ja toinen *ars long Vita breve* sekä *cogito* ja *pratityasamutpadaa* tässä.

Suomen kappale, jossa on kreikkaa λογος ja kovan onnen ilmaus sekä xyzzyq, jota ei ole.

Sed quod est in rebus psyche et quae sunt in animo, ut ita dicam, tamen nec enim ad hoc.

Der Begriff Strasse ist nicht das, was die Leute auf der Strasse sagen, und das ist auch gut so.

Hän ei jaksanut edes lukea sitä, ja *edes* kursiivissa on toinen tapaus, kuten myös ”hän ei edes yrittänyt” lainauksessa.

The book on Kant's ethics is long, and it is the one that was written by them.

As we went to the market, the distance was one km and the room was Part IV of the house, and it was the one.

They read it *as* a draft, and he called it “as good” as the rest of the book that was there.

The ethos of the book is Dasein, and the so-called “ethos” is not that, but as he said, “it is the ethos of the people and it is the one that was there”.
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
      if (KERRAN_429.delete(o)) return route.fulfill({ status: 429, headers: h, body: '{}' });
      const j = rest(o);
      return route.fulfill(j ? { status: 200, headers: h, body: JSON.stringify(j) } : { status: 404, headers: h, body: '{}' });
    }
    if (u.pathname === '/w/api.php' && u.searchParams.get('action') === 'parse') return route.fulfill({ status: 200, headers: h, body: JSON.stringify(parse(u)) });
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
  tulos('oletukset: sanaselitys valikossa, käännös ei, sukkela päällä', oletus.k === 0 && oletus.s === 1 && oletus.suk === 1 && oletus.av === 7, JSON.stringify(oletus));

  // Selitys tekstin kohdasta: odotetaan, kunnes Haetaan… vaihtuu.
  // n: monesko esiintymä, tai 'kappaleen alku#monesko' (kokonainen sana siinä kappaleessa).
  async function selita(sana, n) {
    pyynnot.length = 0;
    await p.evaluate(([sana, n]) => {
      const T = window.__luin.nyt().txt;
      let b = -1, s = -1, c = 0;
      if (typeof n === 'string') {
        const [alku, m] = n.split('#'), i = T.findIndex(t => t.startsWith(alku));
        const re = new RegExp('(?<![\\p{L}])' + sana + '(?![\\p{L}])', 'gu'), osumat = i < 0 ? [] : [...T[i].matchAll(re)];
        const o = osumat[+(m || 0)];
        if (!o) throw new Error('ei löydy: ' + sana + ' / ' + n);
        return window.__luin.selitys(i, o.index, o.index + sana.length);
      }
      for (let i = 0; i < T.length && b < 0; i++) { let j = -1; while ((j = T[i].indexOf(sana, j + 1)) >= 0) { if (c++ === (n || 0)) { b = i; s = j; break; } } }
      if (b < 0) throw new Error('ei löydy: ' + sana);
      window.__luin.selitys(b, s, s + sana.length);
    }, [sana, n]);
    await p.waitForFunction(() => { const t = document.querySelector('#pop .sk-runko'); return t && !/Haetaan/.test(t.textContent); }, null, { timeout: 5000 });
    await p.waitForTimeout(150); // alkuperän saatavuus (osioluettelo) ja mahdollinen perusmuoto
    return p.evaluate(() => {
      const q = s => document.querySelector('#pop ' + s), qa = s => [...document.querySelectorAll('#pop ' + s)];
      return { ots: q('.sk-o').textContent, huom: qa('.sk-huom').map(e => e.textContent), varo: qa('.sk-varo').map(e => e.textContent),
        kielet: qa('.sk-kieli').map(e => e.textContent), maar: qa('.sk-ol li').map(e => e.textContent), vaihdot: qa('.sk-vaihto').map(e => e.textContent),
        tieto: (q('.sk-tieto') || {}).textContent || '', lisaa: !!q('.sk-lisa'), takaisin: !!q('.sk-takaisin'), raksi: !!q('.sk-sulje'),
        muoto: (q('.sk-muoto') || {}).textContent || '', lambda: !!q('.sk-ots svg.sanasto'), logos: !!q('.sk-logos') && !q('.sk-logos').hidden && q('.sk-logos').textContent === 'ΛΟΓΟΣ' };
    });
  }
  const ymp = (sana, n) => p.evaluate(([sana, n]) => {
    const T = window.__luin.nyt().txt; let c = 0;
    for (let i = 0; i < T.length; i++) { let j = -1; while ((j = T[i].indexOf(sana, j + 1)) >= 0) { if (c++ === (n || 0)) return window.__luin.selitysYmparisto(i, j, j + sana.length); } }
  }, [sana, n]);

  let r = await selita('kelloon');
  tulos('fi: pelkkä taivutusmuoto (kelloon) → perusmuoto ensin, taivutus pienellä (”kelloon” · illative singular)',
    r.ots === 'kello' && r.muoto === '”kelloon” · illative singular' && /clock/.test(r.maar[0]) && !r.huom.length && r.raksi && !r.takaisin && !r.lambda && r.logos,
    JSON.stringify(r) + ' ' + pyynnot.join(' · '));
  tulos('fi: perusmuodon päätös: muodon määritelmät, muodon osioluettelo, perusmuodon määritelmät (3 pyyntöä + perusmuodon osiot)',
    pyynnot.slice(0, 3).join(' | ') === '/api/rest_v1/page/definition/kelloon | /w/api.php?action=parse&format=json&formatversion=2&origin=*&redirects=1&disableeditsection=1&page=kelloon&prop=sections | /api/rest_v1/page/definition/kello', pyynnot.join(' · '));
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

  // Alkuperä (käyttäjän pyyntö 12.11.2026): epsilon otsikossa ja valitsimen riveillä; laatikko ennen määritelmiä.
  const ety = () => p.evaluate(() => {
    const q = s => document.querySelector('#pop ' + s), qa = s => [...document.querySelectorAll('#pop ' + s)];
    const l = q('.sk-ety-laatikko'), runko = q('.sk-runko');
    return { ots: q('.sk-o').textContent, nappi: !!q('.sk-ots button.sk-ety'), painettu: qa('button.sk-ety').map(b => b.getAttribute('aria-pressed')),
      auki: !!l, teksti: l ? l.querySelector('.sk-ety-runko').textContent : '', kielet: l ? [...l.querySelectorAll('.sk-kieli')].map(e => e.textContent) : [],
      ensin: !!l && runko.querySelector('.sk-ety-laatikko, .sk-kieli') === l, sanat: l ? [...l.querySelectorAll('button.sk-sana')].map(b => b.dataset.sana) : [],
      kpl: l ? l.querySelectorAll('.sk-ety-p').length : 0, rivit: l ? l.querySelectorAll('.sk-ety-li').length : 0, nakyy: !document.querySelector('#pop').hidden,
      etymon: !!l && l.querySelector('.sk-ety-ots .sk-osa').textContent === 'ΕΤΥΜΟΝ' };
  });
  const odotaEty = () => p.waitForFunction(() => { const t = document.querySelector('#pop .sk-ety-runko'); return t && !/Haetaan/.test(t.textContent); }, null, { timeout: 5000 });
  r = await selita('kelloon');
  let e = await ety();
  tulos('alkuperä: linssi otsikon sanan perässä, laatikko kiinni, ei osion tekstin hakua ennen napautusta',
    e.nappi && !e.auki && e.painettu.join() === 'false' && !pyynnot.some(u => /prop=text/.test(u)), JSON.stringify(e));
  pyynnot.length = 0;
  await p.click('#pop .sk-ots button.sk-ety');
  await odotaEty();
  e = await ety();
  tulos('alkuperä: epsilon avaa laatikon ensimmäiseksi, vain etymologia (ei puuta, ääntämystä, sanaluokkaa eikä viitettä)',
    e.auki && e.ensin && e.painettu.join() === 'true' && /^From Proto-Finnic \*kello; compare kellua\.$/.test(e.teksti) && !e.kielet.length && e.kpl === 1 && e.etymon, JSON.stringify(e));
  tulos('alkuperä: avaus hakee vain osion tekstin (osioluettelo jo muistissa)',
    pyynnot.length === 1 && /page=kello&prop=text&section=2/.test(pyynnot[0]), pyynnot.join(' · '));
  tulos('alkuperä: Wikisanakirjan sana on linkki eteenpäin, rekonstruktio ja Wikipedia eivät', e.sanat.join() === 'kellua', JSON.stringify(e.sanat));
  await kuva('sk-alkupera-kello');
  await p.click('#pop .sk-ety-sulje');
  e = await ety();
  tulos('alkuperä: laatikon raksi sulkee vain laatikon', !e.auki && e.nakyy && e.painettu.join() === 'false', JSON.stringify(e));
  pyynnot.length = 0;
  await p.click('#pop .sk-ots button.sk-ety');
  await odotaEty();
  tulos('alkuperä: uudelleenavaus välimuistista', pyynnot.length === 0, pyynnot.join(' · '));
  await p.click('#pop .sk-ots button.sk-ety');
  e = await ety();
  tulos('alkuperä: epsilon sulkee uudelleen painettuna', !e.auki && e.nakyy, JSON.stringify(e));
  await p.click('#pop .sk-ots button.sk-ety');
  await odotaEty();
  await p.click('#pop .sk-ety-laatikko button.sk-sana');
  await p.waitForFunction(() => document.querySelector('#pop .sk-o').textContent === 'kellua' && !/Haetaan/.test(document.querySelector('#pop .sk-runko').textContent));
  e = await ety();
  tulos('alkuperä: linkki eteenpäin sulkee laatikon (uusi sana)', !e.auki && e.nakyy, JSON.stringify(e));

  r = await selita('Kantelx');
  e = await ety();
  const vaihtoEty = await p.evaluate(() => [...document.querySelectorAll('#pop .sk-vaihdot li')].map(li => !!li.querySelector('button.sk-ety')));
  const vaihtoHaut = pyynnot.filter(u => /action=parse/.test(u)).length;
  tulos('alkuperä: valitsimessa ei linssiä eikä alkuperähakuja (käyttäjän linjaus: vasta valitun sanan selityksessä)', vaihtoEty.join() === 'false,false' && !e.nappi && !vaihtoHaut, JSON.stringify(vaihtoEty) + ' ' + vaihtoHaut);
  tulos('ΛΟΓΟΣ vain selitysikkunassa: valitsimessa piilossa', !r.logos, JSON.stringify(r));
  await kuva('sk-alkupera-valitsin');
  await p.click('#pop .sk-vaihto[data-i="1"]');
  await p.waitForFunction(() => document.querySelector('#pop .sk-o').textContent === 'kanteli' && document.querySelector('#pop .sk-ots button.sk-ety'));
  await p.click('#pop .sk-ots button.sk-ety');
  await odotaEty();
  e = await ety();
  tulos('alkuperä: valittu sana saa linssin, ja se avaa alkuperän ensimmäiseksi', e.auki && e.ensin && /made-up etymology/.test(e.teksti) && e.painettu.join() === 'true', JSON.stringify(e));
  await kuva('sk-alkupera-kanteli');
  r = await selita('Kantelx');
  await p.click('#pop .sk-vaihto[data-i="0"]');
  await p.waitForFunction(() => document.querySelector('#pop .sk-o').textContent === 'kantele');
  await p.waitForTimeout(200);
  e = await ety();
  tulos('alkuperä: sivulla ei etymologiaa → ei linssiä', !e.nappi && !e.auki, JSON.stringify(e));

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
  // Sama kaikissa kielissä (käyttäjän linjaus 6.11.2026): tekstin kielestä löytyvään ei tule muiden kielten tietoja.
  const ainoa = (r, ots, kieli) => r.ots === ots && r.kielet.length === 1 && r.kielet[0].startsWith(kieli);
  r = await selita('is', 'The book');
  tulos('en: englannista löytyvään ei tule muiden kielten tietoja (is, ei afrikaansia)', ainoa(r, 'is', 'English') && !/Afrikaans|wees/.test(r.kielet.join() + r.maar.join()), JSON.stringify(r));
  // Translingual (käyttäjän palaute 6.11.2026: as, in, to, did näyttivät ensin Translingualin): rajapinta antaa sen avaimen en
  // alla, joten se näkyi englantina. Nyt tekstin kielestä löytyvään ei tule Translingualia, kielikoodit eivät näy koskaan,
  // ja symbolin näköinen kirjoitusasu (IV) saa Translingualin tekstin kielen perään.
  r = await selita('to', 'As we');
  tulos('en: to vain englantia, ei Translingualia', ainoa(r, 'to', 'English') && !/Translingual|Tongan/.test(r.kielet.join() + r.maar.join()), JSON.stringify(r));
  r = await selita('As', 'As we');
  tulos('en: As virkkeen alussa → as ensin (määritelmä ennen taivutusviittausta plural of A), vain englantia', r.ots === 'as' && r.kielet.length === 2 && r.kielet.every(k => k.startsWith('English')) && /to such an extent/.test(r.maar[0]) && /plural of A/.test(r.maar[1]) && !/attosecond|Assamese|arsenic/.test(r.maar.join()), JSON.stringify(r));
  // Tekstin kielen pikkusana ei liudu kursiivissa eikä lyhyessä lainauksessa (käyttäjän palaute 6.11.2026: as toi suomen
  // as-sävelen englannin ja Translingualin perään).
  r = await selita('as', 'They read#0');
  tulos('en: kursiivin pikkusana (*as*) vain englantia, ei suomea', ainoa(r, 'as', 'English') && !/Finnish|A-flat|Translingual/.test(r.kielet.join() + r.maar.join()), JSON.stringify(r));
  r = await selita('as', 'They read#1');
  tulos('en: lyhyen lainauksen pikkusana (“as good”) vain englantia', ainoa(r, 'as', 'English') && !/Finnish|A-flat/.test(r.kielet.join() + r.maar.join()), JSON.stringify(r));
  r = await selita('km', 'As we');
  tulos('en: km (ei englantia): Translingual ensin, ilman kielikoodia, tanska perässä', r.kielet[0].startsWith('Translingual') && /kilometre/.test(r.maar[0]) && !/Khmer/.test(r.maar.join()) && /Danish/.test(r.kielet.join()), JSON.stringify(r));
  r = await selita('IV', 'As we');
  tulos('en: symbolin näköinen IV: englanti ensin, Translingual perässä', r.kielet.length === 2 && r.kielet[0].startsWith('English') && r.kielet[1].startsWith('Translingual'), JSON.stringify(r));
  r = await selita('jos');
  tulos('verkkovirhe pysäyttää ketjun (429 suomesta: ei muiden kielten tietoja, virheilmoitus)', !r.kielet.length && /Haku ei onnistunut/.test(r.tieto), JSON.stringify(r));
  r = await selita('jos');
  tulos('virheen jälkeen uusi yritys: vain suomi', ainoa(r, 'jos', 'Finnish'), JSON.stringify(r));
  r = await selita('est', 'Sed quod');
  tulos('la: latinasta löytyvään ei tule muiden kielten tietoja (est, ei ranskaa)', ainoa(r, 'est', 'Latin'), JSON.stringify(r));
  r = await selita('gut', 'Der Begriff');
  tulos('de: saksasta löytyvään ei tule muiden kielten tietoja (gut, ei englantia)', ainoa(r, 'gut', 'German'), JSON.stringify(r));
  r = await selita('ethos', 'The ethos');
  tulos('en: leipätekstissä vain englanti (ethos)', ainoa(r, 'ethos', 'English'), JSON.stringify(r));
  r = await selita('Dasein', 'The ethos');
  tulos('en: iso alkukirjain keskellä virkettä jättää muut kielet mukaan (Dasein: englanti ensin, saksa perässä)', r.kielet.length === 2 && r.kielet[0].startsWith('English') && r.kielet[1].startsWith('German'), JSON.stringify(r));
  r = await selita('ethos', 'The ethos#1');
  tulos('en: lyhyt lainaus liudentuu (“ethos”: englanti ensin, kreikka perässä)', r.kielet.length === 2 && r.kielet[0].startsWith('English') && r.kielet[1].startsWith('Ancient Greek'), JSON.stringify(r));
  r = await selita('ethos', 'The ethos#2');
  tulos('en: oman kielensä erottava lainaus on kuin leipäteksti (vain englanti)', ainoa(r, 'ethos', 'English'), JSON.stringify(r));
  const kk = await p.evaluate(() => window.__luin.selitysKetju('grc', {}, false, false)[0][0].r);
  tulos('grc: kreikan kaksi kieltä pysyvät yhdessä', JSON.stringify(kk) === '["grc","el"]', JSON.stringify(kk));
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
    const so = document.createRange(); so.selectNodeContents(document.querySelector('#pop .sk-o').firstChild);
    const o = so.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(document.querySelector('#pop .sk-lisa'));
    const l = r.getBoundingClientRect(), pop = document.querySelector('#pop').getBoundingClientRect();
    const lr = document.createRange(); lr.selectNodeContents(document.querySelector('#pop .sk-logos')); const lg = lr.getBoundingClientRect();
    return { pop: { x: pop.left, y: pop.top, w: pop.width, h: pop.height }, lisa: { x: l.left, y: l.top, w: l.width, h: l.height }, sana: { x: o.left, y: o.top, w: o.width, h: o.height },
      logos: { x: lg.left, y: lg.top, w: lg.width, h: lg.height } };
  });
  // Linssi-epsilon piiloon pikselimittauksen ajaksi: sen varsi kurkottaa sanan alle (mitataan erikseen alla).
  await p.evaluate(() => { document.querySelector('#pop .sk-ots .sk-ety').style.visibility = 'hidden'; });
  const png = await p.screenshot({ clip: { x: m.pop.x, y: m.pop.y, width: m.pop.w, height: m.pop.h } });
  await p.evaluate(() => { document.querySelector('#pop .sk-ots .sk-ety').style.visibility = ''; });
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
    // Otsikkorivi: sanan oikealta laidalta ruudun reunaan (1 px reunus pois); linssi-epsilon sanan perässä jää alueen
    // vasempaan päähän omaksi ryhmäkseen.
    const otsS = sar(X(Math.max(m.sana.x + m.sana.w, m.logos.x + m.logos.w) - ox + 4), W - X(2), X(2), ylin);
    // Ryhmät: merkki ja raksi erillään.
    const ryh = []; otsS.forEach(x => { if (ryh.length && x - ryh[ryh.length - 1][1] <= X(2)) ryh[ryh.length - 1][1] = x; else ryh.push([x, x]); });
    const lisaS = sar(X(m.lisa.x - ox - 2), X(m.lisa.x - ox + m.lisa.w + 2), X(m.lisa.y - oy), X(m.lisa.y - oy + m.lisa.h));
    const raksi = ryh[ryh.length - 1], raksiR = riv(raksi[0], raksi[1] + 1, X(2), ylin);
    // Sanan peruslinja: sanan musteen alin rivi (kelloon: ei alapidennyksiä).
    const sanaR = riv(X(m.sana.x - ox), X(m.sana.x - ox + m.sana.w), X(m.sana.y - oy), ylin);
    const logosR = riv(X(m.logos.x - ox), X(m.logos.x - ox + m.logos.w), X(m.logos.y - oy), X(m.logos.y - oy + m.logos.h));
    // Takaisin CSS-pikseleiksi: vasen laita pikselin alku, oikea laita pikselin loppu.
    const va = v => +(v / K).toFixed(2), oi = v => +((v + 1) / K).toFixed(2);
    return { ryhmat: ryh.map(g => [va(g[0]), oi(g[1])]), lisa: [va(lisaS[0]), oi(lisaS[lisaS.length - 1])], raksiAla: oi(raksiR[raksiR.length - 1]), raksiYla: va(raksiR[0]),
      sanaAla: oi(sanaR[sanaR.length - 1]), sanaYla: va(sanaR[0]), logosYla: va(logosR[0]), logosAla: oi(logosR[logosR.length - 1]), K };
  }, [png.toString('base64'), m]);
  const raksi = kuvaus.ryhmat[kuvaus.ryhmat.length - 1];
  tulos('raksin muste lisää-linkin oikean laidan tasalla (±1 px)', raksi && Math.abs(raksi[1] - kuvaus.lisa[1]) <= 1, JSON.stringify(kuvaus));
  // Otsikossa ei ole lambdaa (käyttäjän pyyntö 12.11.2026): sanan perässä vain linssi-epsilon ja oikeassa reunassa raksi.
  tulos('otsikossa sanan oikealla puolella vain raksi (linssi piilossa mittauksessa), ei lambdaa', kuvaus.ryhmat.length === 1 && !(await p.evaluate(() => !!document.querySelector('#pop .sk-ots svg.sanasto'))), JSON.stringify(kuvaus.ryhmat));
  // Linssi-epsilonin peruslinja sanan peruslinjalla: epsilonin polun alareuna (musteen keskiviiva) ja sanan peruslinja.
  const ep = await p.evaluate(() => {
    const e = document.querySelector('#pop .sk-ots .sk-ety .e').getBoundingClientRect(), c = document.querySelector('#pop .sk-ots .sk-ety circle').getBoundingClientRect();
    const so = document.createRange(); so.selectNodeContents(document.querySelector('#pop .sk-o').firstChild); const o = so.getClientRects();
    const viim = o[o.length - 1];
    return { eAla: +e.bottom.toFixed(2), eYla: +e.top.toFixed(2), kehaYla: +c.top.toFixed(2), kehaVasen: +c.left.toFixed(2), sanaLoppu: +viim.right.toFixed(2) };
  });
  tulos('linssi-epsilon: epsilonin alareuna hieman sanan alareunan alapuolella (0…2,4 px), kehän sisäreuna lähellä epsilonin musteen yläpuolta (≤ 2,5 px), pieni hajurako sanaan (1–5 px)',
    ep.eAla + .475 - (kuvaus.sanaAla + m.pop.y) >= 0 && ep.eAla + .475 - (kuvaus.sanaAla + m.pop.y) <= 2.4 && (ep.eYla - .475) - (ep.kehaYla + .55) <= 2.5 && ep.kehaVasen - ep.sanaLoppu >= 1 && ep.kehaVasen - ep.sanaLoppu <= 5, JSON.stringify(Object.assign(ep, { sanaAla: kuvaus.sanaAla + m.pop.y })));
  // Raksi on λόγος-rivillä (12.11.2026; ennen sanan peruslinjalla), kuten ἔτυμον-laatikon raksi omalla rivillään.
  tulos('raksi λόγος-otsikon rivillä (muste otsikon musteen korkeudella ±1 px)', kuvaus.raksiYla >= kuvaus.logosYla - 1 && kuvaus.raksiAla <= kuvaus.logosAla + 1,
    JSON.stringify({ raksi: [kuvaus.raksiYla, kuvaus.raksiAla], logos: [kuvaus.logosYla, kuvaus.logosAla] }));
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
  // Lambda on asetuksissakin tekstin värinen (käyttäjän pyyntö 6.11.2026; okra 5.11. oli väliaikainen), linssi ruostetta.
  tulos('asetukset: lambda tekstin väriä, linssi ruostetta', ase.lambda === ase.teksti && ase.linssi !== ase.teksti, JSON.stringify(ase));
  tulos('asetukset: Sanaselitys ja Lausekäännös ilman palvelun nimeä', /^Sanaselitys$/.test(ase.nimi.trim()) && /^Lausekäännös$/.test(ase.kaannos.trim()), ase.nimi + ' / ' + ase.kaannos);
  if (KUVAT) await p.locator('#asetukset button[data-kytkin="sukSana"]').locator('xpath=ancestor::div[contains(@class,"asetus")]').screenshot({ path: path.join(KUVAT, 'sk-asetukset.png') });
  if (KUVAT) await p.locator('#asetukset button[data-kytkin="sanakirja"]').locator('xpath=ancestor::div[contains(@class,"asetus")]').screenshot({ path: path.join(KUVAT, 'sk-asetukset-valikossa.png') });

  // Tallennettu av 5 (käännös päällä pilotin oletuksena) → av 6: käännös pois kerran.
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.av = 5; a.kaannos = 1; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await p.reload(); await p.waitForTimeout(400);
  const av = await p.evaluate(() => ({ k: window.__luin.aset.kaannos, av: window.__luin.aset.av }));
  tulos('av 6→7: tallennettu pilotin käännös pois kerran', av.k === 0 && av.av === 7, JSON.stringify(av));

  // Kapea kosketusruutu (360 px): pitkä otsikko rivittyy, eikä se, merkki ja raksi mene päällekkäin, eikä ikkuna ylitä ruutua.
  await p.setViewportSize({ width: 360, height: 740 });
  await p.waitForTimeout(300);
  for (const sana of ['pratityasamutpadaa', 'Kantelx']) {
    await selita(sana);
    const k = await p.evaluate(() => {
      const R = s => document.querySelector('#pop ' + s).getBoundingClientRect(), pop = document.querySelector('#pop').getBoundingClientRect();
      const o = R('.sk-o'), x = R('.sk-sulje svg');
      return { pois: pop.left < 0 || pop.right > innerWidth, paalle: o.right > x.left + .5 };
    });
    tulos('360 px: ' + sana + ' ilman päällekkäisyyttä', !k.pois && !k.paalle, JSON.stringify(k));
    await kuva('sk-360-' + sana);
    await p.click('#pop .sk-sulje');
  }

  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join(' | '));
  // Otsikot vievät sanan λόγος ja ἔτυμον (varalla etymon) selitykseen, vihje suomeksi ja latinalaisittain.
  r = await selita('kelloon');
  const vihjeet = await p.evaluate(() => [document.querySelector('#pop .sk-logos').title, document.querySelector('#pop .sk-ots .sk-ety').title]);
  pyynnot.length = 0;
  await p.click('#pop .sk-logos');
  await p.waitForFunction(() => document.querySelector('#pop .sk-o').textContent === 'λόγος' && !/Haetaan/.test(document.querySelector('#pop .sk-runko').textContent));
  const lg = await p.evaluate(() => ({ kielet: [...document.querySelectorAll('#pop .sk-kieli')].map(e => e.textContent) }));
  tulos('ΛΟΓΟΣ vie sanan λόγος selitykseen (muinaiskreikka); vihjeet Sana (logos) ja linssissä Alkuperä', lg.kielet[0] && lg.kielet[0].startsWith('Ancient Greek') && vihjeet.join('|') === 'Sana (logos)|Alkuperä', JSON.stringify(lg) + ' ' + vihjeet.join('|'));
  r = await selita('kelloon');
  await p.click('#pop .sk-ots button.sk-ety');
  await odotaEty();
  const etyVihje = await p.evaluate(() => document.querySelector('#pop .sk-ety-ots .sk-osa').title);
  pyynnot.length = 0;
  await p.click('#pop .sk-ety-ots .sk-osa');
  await p.waitForFunction(() => document.querySelector('#pop .sk-o').textContent === 'etymon' && !/Haetaan/.test(document.querySelector('#pop .sk-runko').textContent));
  const etyHaut = pyynnot.filter(u => /definition/.test(u)).map(u => decodeURIComponent(u.split('/').pop()));
  tulos('ΕΤΥΜΟΝ vie sanaan ἔτυμον, varalla etymon (tekosanastossa vain etymon); vihje Alkuperä (etymon)', etyHaut.slice(0, 2).join('|') === 'ἔτυμον|etymon' && etyVihje === 'Alkuperä (etymon)', etyHaut.join('|') + ' ' + etyVihje);
  await p.click('#pop .sk-sulje');

  // Monta kieltä ja monta etymologiaa: kielen nimi ja numero, luettelorivit omina kappaleinaan (sisäluettelo pois).
  r = await selita('Kantin');
  if (r.ots === 'Kant') {
    await p.click('#pop .sk-ots button.sk-ety');
    await odotaEty();
    e = await ety();
    tulos('alkuperä: kielet selityksen järjestyksessä nimettyinä, numerot (English · 1, English · 2, German)',
      e.kielet.join('|') === 'English · 1|English · 2|German' && e.rivit === 2 && !/SISÄ|PUU|ÄÄNTÄMYS|MÄÄRITELMÄ/.test(e.teksti), JSON.stringify(e));
    await kuva('sk-alkupera-kant');
    await p.click('#pop .sk-sulje');
  } else tulos('alkuperä: Kant', false, JSON.stringify(r));
  // Kaksi sivua samassa selityksessä (virkkeen alun As ja as): alaotsikolla oma epsilon, laatikko sen alle.
  r = await selita('As');
  const alaots = await p.evaluate(() => [...document.querySelectorAll('#pop .sk-alaots')].map(a => a.querySelector('span').textContent + ':' + !!a.querySelector('button.sk-ety')));
  if (alaots.length) {
    await p.click('#pop .sk-alaots button.sk-ety');
    await odotaEty();
    const a = await p.evaluate(() => {
      const l = document.querySelector('#pop .sk-ety-laatikko'), al = document.querySelector('#pop .sk-alaots');
      return { jalkeen: !!l && l.parentElement.previousElementSibling === al, teksti: l ? l.textContent : '',
        otsikko: document.querySelector('#pop .sk-ots button.sk-ety').getAttribute('aria-pressed'), alaots: al.querySelector('button.sk-ety').getAttribute('aria-pressed') };
    });
    tulos('alkuperä: taivutusmuoto omalla etymologialla pysyy (As ei → A); alaotsikon linssi avaa laatikon sen alle, otsikon linssi ennallaan',
      JSON.stringify(alaots) === '["As:true"]' && a.jalkeen && /Own etymology of the plural As/.test(a.teksti) && a.otsikko === 'false' && a.alaots === 'true', JSON.stringify(alaots) + ' ' + JSON.stringify(a));
    await kuva('sk-alkupera-alaots');
    await p.click('#pop .sk-sulje');
  } else tulos('alkuperä: As ja as alaotsikkona', false, JSON.stringify(r));

  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
});
