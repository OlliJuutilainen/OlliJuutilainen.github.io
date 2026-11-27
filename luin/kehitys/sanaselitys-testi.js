// Sanaselityksen selaintesti ilman verkkoa. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sanaselitys-testi.js [kuvakansio] [--ei-taittoa]
// Wikisanakirja korvataan tekosanastolla (page.route): REST-määritelmät ja MediaWikin prefixsearch ja search luokkineen.
// Tekopalvelimen alkuhaku taittaa kirjainkoon ja diakriitit kuten oikea haku luultavasti; --ei-taittoa ajaa saman ilman
// taittoa (vain pienet kirjaimet), jolloin majuminuluku nojaa koko tekstin hakuun. Tarkistaa kielikohtaiset ketjut,
// valitsimen, huomautukset, raksin, asetusten riippumattomuuden ja käännöksen oletuksen sekä sanaselityssivun kielivalikon
// (kielirajaus) ja sanakirjavalikon (Wiktionary ja termipankki päälle ja pois; muut sanakirjat tekoaineistolla: Logeion,
// Wörterbuchnetz, DPD ja Köln, muodot kuten oikeissa vastauksissa 26.11.2026). Kuvat kuvakansioon, jos annettu.
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
const NIMI = { fi: 'Finnish', en: 'English', la: 'Latin', grc: 'Ancient Greek', el: 'Greek', de: 'German', fr: 'French', sv: 'Swedish', sa: 'Sanskrit', af: 'Afrikaans', da: 'Danish',
  es: 'Spanish', it: 'Italian', mul: 'Translingual' };
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
  IV: { pop: 40, mul: ['Numeral', 'Roman numeral four.'], en: ['Noun', 'intravenous drip'] },
  // historia kuten oikeassa sivussa: suomi ei ole sivun ensimmäinen kieli (14.11.2026).
  historia: { pop: 80, la: ['Noun', 'history, narrative'], fi: ['Noun', 'history'] },
  historiaa: { pop: 10, fi: ['Noun', { muoto: 'partitive singular of', k: 'historia' }] },
  // Taulukkohaku: käsitteen-sivua ei ole, mutta tekstihaku löytää käsitteen taivutustaulukosta (taulu: tekstihaun
  // indeksoima taulukon teksti; käyttäjä tarkisti oikeasta hausta 14.11.2026). Napsu käsittee tuo pitkiä johdoksia.
  käsite: { pop: 70, fi: ['Noun', 'concept'], taulu: ['käsitteen', 'käsitettä', 'käsitteet'] },
  käsitteellinen: { pop: 40, fi: ['Adjective', 'conceptual'] },
  käsitteellistää: { pop: 20, fi: ['Verb', 'to conceptualize'] },
  käsitteenmuodostus: { pop: 15, fi: ['Noun', 'concept formation'] },
  käsitys: { pop: 60, fi: ['Noun', 'conception, view'] },
  // Esimerkkilauseessa muoto käsitteen: eri alku, ei saa tulla ehdokkaaksi.
  määritellä: { pop: 50, fi: ['Verb', 'to define'], taulu: ['käsitteen'] },
  // Pituusehto ilman taulukkoa: liikkeen → napsu liikke tuo vain liikkeenjohdon, jatketaan liikeeseen.
  liike: { pop: 65, fi: ['Noun', 'movement'] },
  liikkeenjohto: { pop: 25, fi: ['Noun', 'management'] },
  // Vain pitkiä ehdokkaita: pituusehto ei saa estää tulosta (varalla ensimmäisen napsun pitkät).
  kuvaannollinen: { pop: 30, fi: ['Adjective', 'figurative'] },
  // Kielirajaus: espanja ja italia (sanaselityssivun kielivalikko), määritelmän linkit kielen kanssa ja ilman.
  casa: { pop: 70, es: ['Noun', 'house'], it: ['Noun', 'house, home'], la: ['Noun', 'hut, cottage'] },
  quidditas: { pop: 10, la: ['Noun', 'whatness; compare <a rel="mw:WikiLink" href="./est#Latin" title="est">est</a> and <a rel="mw:WikiLink" href="./gut" title="gut">gut</a>'] },
  // Termipankin rinnalla (sanaselityssivu): adekvaatti on molemmissa.
  adekvaatti: { pop: 15, fi: ['Adjective', '(medicine) adequate'] }
};
const META = new Set(['pop', 'taulu']);
// Etymologiat (action=parse) kuten oikea Wikisanakirja: kielen osio h2, Etymology tai Etymology 1, 2 … (h3), sanaluokat sen alla.
// Osion wikiteksti (prop=wikitext&section=N) sisältää oman otsikkonsa ja alaosionsa, siksi mukana on sanaluokka, jota ei saa näkyä.
// Etymologiamallineet ({{der}} ym.) tarkistavat kielen kuten Module:etymology/templates: nykyinen L2 luetaan sivun
// osioluettelosta otsikkolaskurin mukaan. Pelkän osion jäsennys (section=N) laskee otsikot ykkösestä, joten muu kuin sivun
// ensimmäinen kieli antaa Lua-virheen (mitattu oikeasta sivusta historia 14.11.2026: suomen osio 24, L2 Albanian).
const E = {
  kello: { Finnish: ['From <span class="etyl"><a href="https://en.wikipedia.org/wiki/Proto-Finnic_language">Proto-Finnic</a></span> <i class="Latn mention" lang="urj-fin-pro"><a href="/wiki/Reconstruction:Proto-Finnic/kello">*kello</a></i>; compare <i class="Latn mention" lang="fi"><a href="/wiki/kellua#Finnish">kellua</a></i>.<sup class="reference">[1]</sup>'] },
  as: { English: ['From Middle English <i>as</i>, from Old English <i>eallswā</i>.'] },
  // As on englanniksi pelkkä taivutusviittaus (plural of A), mutta sillä on tässä oma etymologia: muoto pysyy, ei hyppyä A:han.
  As: { English: ['Own etymology of the plural As.'] },
  kanteli: { Finnish: ['A made-up etymology for <i>kanteli</i>.'] },
  kantele: { Finnish: [] },
  Kant: { English: ['From the surname of <a href="/wiki/Immanuel_Kant" title="x">Immanuel Kant</a>.', 'Second sense of Kant.'], German: ['From <span class="etyl">Middle High German</span> <i><a href="/wiki/kant#Middle_High_German">kant</a></i>.'] },
  historia: { Latin: ['From Ancient Greek <i>ἱστορία</i> (Latin).'], Finnish: ['From <span class="etyl">Ancient Greek</span> <i class="Polyt mention" lang="grc"><a href="/wiki/%E1%BC%B1%CF%83%CF%84%CE%BF%CF%81%CE%AF%CE%B1#Ancient_Greek">ἱστορία</a></i>.'] },
  adekvaatti: { Finnish: ['Borrowed from Latin <i>adaequātus</i>.'] }
};
// Tekotermipankki (Tieteen termipankin rajapinta: generator=backlinks sivulle Nimitys:<sana>, prop=revisions; wikiteksti kuten
// oikeissa käsitesivuissa 26.11.2026: Käsite-malline ja Liittyvä nimitys -mallineet). m = määritelmä_fi, l = lisätiedot_fi,
// n = nimitykset [kieli, nimitys]. Terminologiaoppi:polysemia vain mainitsee käsitteen määritelmässään: ei saa tulla käsitteeksi.
const TP = {
  'Filosofia:adekvaatti': { ns: 1150, m: '<br>1. pätevä, luotettava käsitys<br>2. Spinozan ja Leibnizin filosofiassa korkeatasoinen, täsmällinen idea<br>3. Husserlilla puhdas elämys',
    l: 'lat. adaequare=muistuttaa, olla yhtä<br>ks. [[Biologia:adekvaatti|adekvaatti]] myös biologiassa', n: [['suomi', 'adekvaatti'], ['englanti', 'adequate'], ['saksa', 'adäquat']] },
  'Biologia:adekvaatti': { ns: 1112, l: "lat. ''adaequatus'' = tasoitettu", n: [['suomi', 'adekvaatti'], ['englanti', 'adequate']] },
  'Filosofia:täälläolo': { ns: 1150, m: 'Heideggerin yleinen tulkinta ihmisenä olemisesta',
    n: [['suomi', 'siellä oleva'], ['saksa', 'Dasein'], ['suomi', 'täälläolo'], ['englanti', 'being-there']] },
  'Filosofia:intentionaalisuus': { ns: 1150, m: '<br>1. fenomenologiassa tietoisuuden olemuksellinen suuntautuminen mielen ulkopuoliseen objektiin<br>2. mielenfilosofiassa kriteeri mentaalisen erottamiseksi fyysisestä',
    l: 'lat. intendo=osoittaa, tähdätä johonkin<br>ks. myös intentionaalisuus [[Kielitiede:intentionaalisuus|kielitieteessä]].',
    n: [['suomi', 'intentionaalisuus'], ['suomi', 'suuntautuneisuus'], ['englanti', 'intentionality'], ['saksa', 'Intentionalität']] },
  'Filosofia:käsite': { ns: 1150, m: 'ajattelun perusyksikkö tai ajatustiivistymä', n: [['suomi', 'käsite'], ['englanti', 'concept'], ['saksa', 'Begriff']] },
  'Terminologiaoppi:polysemia': { ns: 1122, m: 'tietyssä kielessä esiintyvä [[Nimitys:nimitys|nimitysten]] ja [[Nimitys:käsite|käsitteiden]] välinen suhde', n: [['suomi', 'polysemia']] },
  'Historia:historia': { ns: 1206, m: 'menneisyyden tapahtumat ja niiden tutkimus', n: [['suomi', 'historia'], ['englanti', 'history']] },
  'Filosofia:olemus': { ns: 1150, m: '1. olion piirre, joka määrittää sen, mitä on olla kyseinen olio (olion yksilöolemus) \n\n2. olion piirre, joka määrittää lajin (olion lajiolemus)',
    l: 'kr. eidos, ousia', n: [['suomi', 'olemus'], ['englanti', 'essence'], ['saksa', 'Wesen'], ['kreikka', 'ousia']] },
  // Vain kana: termipankki vastaa virheellä (Wikisanakirjan selityksen pitää tulla silti).
  'Kotieläintiede:kana': { ns: 1300, virhe: true, m: 'x', n: [['suomi', 'kana']] }
};
const tpPyynnot = [];
function tpWiki(t) {
  return '{{Käsite\n' + (t.m ? '|määritelmä_fi=' + t.m + '\n' : '') + (t.l ? '|lisätiedot_fi=' + t.l + '\n' : '') + '|tarkistettu=Kyllä\n}}\n' +
    t.n.map(([k, n]) => '{{Liittyvä nimitys\n|kieli=' + k + '\n|nimitys=' + n + '\n|otsikossa=Kyllä\n|kursivoitu=Ei\n}}').join('\n');
}
const tpReitti = route => {
  const u = new URL(route.request().url()), q = u.searchParams, h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  tpPyynnot.push(decodeURIComponent(u.pathname + u.search));
  // Nimityssivujen olemassaolo (sanaselityssivu ilman Wiktionarya: perusmuoto päätesäännöistä).
  if (q.get('titles')) {
    const on = n => Object.values(TP).some(x => !x.virhe && x.n.some(([, m]) => 'Nimitys:' + m === n));
    return route.fulfill({ status: 200, headers: h, body: JSON.stringify({ batchcomplete: true, query: { pages: q.get('titles').split('|').map(t => on(t) ? { ns: 1098, title: t, pageid: 1 } : { ns: 1098, title: t, missing: true }) } }) });
  }
  const nimi = (q.get('gbltitle') || '').replace(/^Nimitys:/, '');
  const osuvat = Object.entries(TP).filter(([t, x]) => x.n.some(([, n]) => n === nimi) || (x.m || '').includes('[[Nimitys:' + nimi + '|'));
  if (osuvat.some(([, x]) => x.virhe)) return route.fulfill({ status: 500, headers: h, body: '{}' });
  if (!osuvat.length) return route.fulfill({ status: 200, headers: h, body: JSON.stringify({ batchcomplete: true }) });
  // Kohinaa kuten oikeassa vastauksessa: toisen kielen nimityssivu ja luettelosivu linkittävät nimitykseen.
  const pages = osuvat.map(([t, x], i) => ({ pageid: 100 + i, ns: x.ns, title: t, revisions: [{ slots: { main: { contentmodel: 'wikitext', content: tpWiki(x) } } }] }))
    .concat([{ pageid: 9, ns: 1098, title: 'Nimitys:' + nimi + 'x', revisions: [{ slots: { main: { content: '{{Nimityssivu}}\n{{Nimitys\n|kieli=suomi\n}}' } } }] },
      { pageid: 8, ns: 0, title: 'Lista monitieteisistä termeistä', revisions: [{ slots: { main: { content: '[[Nimitys:' + nimi + ']]' } } }] }]);
  return route.fulfill({ status: 200, headers: h, body: JSON.stringify({ batchcomplete: true, query: { pages } }) });
};
// Logeion: detail (sanakirjat, myös pois jätettävä linkkisanakirja) ja find (jäsennys; tuntemattomalle aakkosissa lähin, ei kelpaa).
const LG = {
  'λόγος': { headword: 'λόγος', shortdef: ['λόγος, λόγου, ὁ, word, speech, story'], dicos: [
    { dname: 'LSJ', es: ['λόγος, ὁ, <i>computation, reckoning</i>, <span style="font-variant: small-caps;">Hdt.</span> 3.142.<br>II. <b>relation, correspondence</b>.'] },
    { dname: 'Brill-Montanari', es: ['<a href="https://dictionaries.brillonline.com/x" target="_blank">x</a>'] },
    { dname: 'Middle Liddell', es: ['λόγος, ὁ, <i><b>the word</b></i> by which the inward thought is expressed'] }] }
};
const LG_FIND = { 'λόγου': [{ lemma: 'λόγος', parse: ' - Noun - masculine - genitive singular' }] };
// Wörterbuchnetz: hakusanat sanakirjoittain, tekstitunnukset (pituus) ja artikkeli sanoittain (entiteetit kuten oikeassa).
const WB = { Adelung: { begriff: { lemma: 'Begriff', gram: '', wbnetzid: 'B01071' }, 'straße': { lemma: 'Straße', gram: '', wbnetzid: 'S10001' } }, Campe: { begriff: { lemma: 'Begriff', gram: 'Der', wbnetzid: 'B02041' } },
  DWB: {}, DWB2: { begriff: { lemma: 'BEGRIFF', gram: 'm.', wbnetzid: 'B01517' } } };
const WB_PITUUS = { B01071: 141, B02041: 99999, B01517: 2724 };
const WB_ART = { B01071: [['Der', 'recte'], [' ', 'recte'], ['Begriff', 'recte'], [', im fig&#x00fc;rlichen Verstande ', 'recte'], ['ohne Plural', 'italics'], ['.', 'recte']] };
// DPD: tiivistelmä taivutusmuodolle; Köln: tasan sama ei löydy, simple-search antaa diakriittiset ehdokkaat.
const DPD = { dhammassa: '<p class="summary"> <a class="summary-link" href="#dhamma_1_01"> dhamma 1.01 </a> masc. <b>nature; character</b> <a class="summary-link" href="#dhamma_1_01">►</a> </p>' +
  '<p class="summary"> <a class="summary-link" href="#dhamma_1_03"> dhamma 1.03 </a> masc. <b>teaching; discourse; doctrine</b> <a class="summary-link" href="#dhamma_1_03">►</a> </p>' };
const KO_RIVI = "<table class='display'><tr><td class='display' valign=\"top\"> <span style='font-weight:bold'>(H1) <span class='hrefdata'><span style='color:rgb(160,160,160);'> [Printed book page <a href='//x/servepdf.php?page=255'>255</a>,2]</span></span></span><br> " +
  "<span class='sdata_italic_iast'><i>karuṇa</i></span> mf(<i>ā</i>)n. mournful, miserable, <span title='Mahābhārata (Title)'>MBh.</span> <span class='lnum'> [<span title='Cologne record ID'>ID=44557</span>]</span></td></tr>" +
  "<tr><td class='display'> <span style='font-weight:bold'>(H1B) <span class='hrefdata'>[Printed book page 255,3]</span></span><br> <i>karuṇā</i> f. compassion, pity <span class='lnum'> [<span>ID=44560</span>]</span></td></tr></table>";
function muutVastaus(u) {
  const j = b => ({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  const t = b => ({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' }, body: b });
  const q = k => u.searchParams.get(k) || '';
  if (u.hostname === 'anastrophe.uchicago.edu') {
    const w = q('w');
    if (u.pathname.endsWith('/detail')) return j({ detail: Object.assign({ bwl: [], dicos: [], headword: w, lewisshort: [], shortdef: [] }, LG[w] || {}) });
    if (w === 'λογος') return j({ parses: [], word: 'λόγος', description: 'Found λογος with different accentuation.' });
    return j(LG_FIND[w] ? { parses: LG_FIND[w], word: LG_FIND[w][0].lemma } : { parses: [], word: 'λογοδαιδαλία', description: 'Looking for closest alphabetic form.' });
  }
  if (u.hostname === 'api.woerterbuchnetz.de') {
    let m = /^\/open-api\/dictionaries\/([^/]+)\/lemmata\/(.+)$/.exec(u.pathname);
    if (m) { const e = (WB[m[1]] || {})[decodeURIComponent(m[2]).toLowerCase()]; return j({ result_set: e ? [Object.assign({ sigle: m[1], wbnetzlink: 'https://woerterbuchnetz.de/?sigle=' + m[1] + '&lemid=' + e.wbnetzid }, e)] : [], result_count: e ? 1 : 0 }); }
    m = /^\/dictionaries\/([^/]+)\/lemmata\/lemid\/([^/]+)\/2\/json$/.exec(u.pathname);
    if (m) return j([{ lemid: m[2], textid: 1000 }, { lemid: 'seuraava', textid: 1000 + (WB_PITUUS[m[2]] || 10) }]);
    m = /^\/dictionaries\/([^/]+)\/articles\/([^/]+)\/lemid$/.exec(u.pathname);
    if (m) return j((WB_ART[m[2]] || []).map(([word, typeset]) => ({ word, typeset, elementtype: 'sense' })));
  }
  if (u.hostname === 'www.dpdict.net') return j({ summary_html: DPD[q('q')] || '', dpd_html: '', license: {} });
  if (u.hostname === 'sanskrit-lexicon.uni-koeln.de') {
    if (/simple-search/.test(u.pathname)) return j({ result: q('key') === 'karuna' ? [{ key: 'karman', dicthwoutput: 'karman' }, { key: 'karuRa', dicthwoutput: 'karuṇa' }, { key: 'karuRA', dicthwoutput: 'karuṇā' }] : [] });
    return t(q('input') === 'slp1' && q('key') === 'karuRa' ? '<html><body><div id="CologneBasic"><h1>karuṇa</h1>' + KO_RIVI + '</div></body></html>' : "<h2>not found: '" + q('key') + "'</h2>");
  }
  return { status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };
}
const MUUT_ISANNAT = ['https://anastrophe.uchicago.edu/**', 'https://api.woerterbuchnetz.de/**', 'https://www.dpdict.net/**', 'https://sanskrit-lexicon.uni-koeln.de/**'];
const NIMET = Object.fromEntries(Object.entries(NIMI).map(([k, v]) => [k, v]));
function osioLista(o) {
  const e = E[o], osiot = []; let n = 0;
  for (const kieli of Object.keys(S[o]).filter(k => !META.has(k)).map(k => NIMET[k])) {
    osiot.push({ toclevel: 1, level: '2', line: kieli, index: String(++n) });
    const et = e[kieli] || [];
    const nimeta = et.length > 1;
    et.forEach((t, i) => {
      osiot.push({ toclevel: 2, level: '3', line: 'Etymology' + (nimeta ? ' ' + (i + 1) : ''), index: String(++n), teksti: t, kieli });
      osiot.push({ toclevel: 3, level: nimeta ? '4' : '3', line: 'Noun', index: String(++n) });
    });
    if (!et.length) osiot.push({ toclevel: 2, level: '3', line: 'Pronunciation', index: String(++n) });
  }
  return osiot;
}
// Osion wikiteksti: oma otsikko, malline ja sen alaosiot (vain syvemmät; Etymology N:n alla sanaluokka).
function osionWiki(osiot, s) {
  const i = osiot.indexOf(s), ala = [];
  for (const x of osiot.slice(i + 1)) { if (+x.level <= +s.level) break; ala.push(x); }
  return '='.repeat(+s.level) + s.line + '='.repeat(+s.level) + '\n{{luin-testi|' + s.kieli + '|' + s.index + '}}\n' +
    ala.map(x => '='.repeat(+x.level) + x.line + '='.repeat(+x.level) + '\nMÄÄRITELMÄ').join('\n');
}
// Jäsennin: otsikot laskuriin, malline kuten {{der}} (kielen tarkistus nykyisen L2:n mukaan), muut rivit kappaleiksi.
const jasennykset = [];
let RIKKI = false; // jäsennys laskee otsikot väärin (kuten vanha section=N): virheteksti ei saa näkyä alkuperänä
// MOBIILI: Wikimedian mobiilimuotoilu, jonka mobiiliselain (Androidin Firefox) saa: ylimmän tason otsikon jälkeinen sisältö
// <section class="mf-section-N collapsible-block">-kääreessä, alemmat otsikot sen sisällä (mitattu oikeasta vastauksesta 14.11.2026).
let MOBIILI = false;
function mobiiliksi(osat) {
  const tasot = osat.filter(x => x.taso).map(x => x.taso), L = Math.min(...tasot);
  let out = '<section class="mf-section-0" id="mf-section-0">', k = 0;
  for (const x of osat) {
    if (x.taso === L) { k++; out += '</section>' + x.html.replace('class="mw-heading ', 'class="mw-heading section-heading ') + '<section class="mf-section-' + k + ' collapsible-block" id="mf-section-' + k + '">'; }
    else out += x.html;
  }
  return out + '</section>';
}
function jasenna(o, wiki) {
  const osiot = E[o] ? osioLista(o) : [], osat = [];
  let h = 0, out = '';
  for (const rivi of wiki.split('\n')) {
    if (rivi === '__NOTOC__' || !rivi.trim()) continue;
    const m = /^(={1,6})(.+?)\1\s*$/.exec(rivi);
    if (m) { h++; const t = m[1].length; osat.push({ taso: t, html: '<div class="mw-heading mw-heading' + t + '"><h' + t + '>' + m[2] + '</h' + t + '></div>' }); continue; }
    const ml = /^\{\{luin-testi\|([^|]+)\|(\d+)\}\}$/.exec(rivi);
    if (ml) {
      let l2 = '';
      for (let k = h; k >= 1 && !l2; k--) { const x = osiot.find(x => +x.index === k); if (x && x.level === '2') l2 = x.line; }
      if (RIKKI) l2 = 'Albanian';
      jasennykset.push(ml[2] + ':' + (l2 === ml[1] ? 'ok' : l2));
      if (l2 && l2 !== ml[1]) { osat.push({ html: '<p>From <strong class="error"><span class="scribunto-error mw-scribunto-error-1">Lua error in <a href="/wiki/Module:etymology/templates#L-72">Module:etymology/templates</a> at line 72: Language does not match the L2 header (' + l2 + ').</span></strong>.</p>' }); continue; }
      const t = osiot.find(x => x.index === ml[2]).teksti;
      osat.push({ html: '<div class="NavFrame"><div class="NavHead">Etymology tree</div><div class="NavContent">PUU</div></div>' +
        '<p>' + t + '</p><style>.x{}</style>' + (/Second/.test(t) ? '<ul><li>Cognate one</li><li>Cognate two<ul><li>SISÄ</li></ul></li></ul>' : '') });
      continue;
    }
    osat.push({ html: '<p>' + rivi + '</p>' });
  }
  out = MOBIILI && osat.some(x => x.taso) ? mobiiliksi(osat) : osat.map(x => x.html).join('');
  return '<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr">' + out + '</div>';
}
function parse(q) {
  if (q.get('text') !== null) return { parse: { title: q.get('title'), text: jasenna(q.get('title'), q.get('text')) } };
  const o = q.get('page'), e = E[o];
  if (!e) return { error: { code: 'missingtitle' } };
  const osiot = osioLista(o);
  if (q.get('prop') === 'sections') return { parse: { title: o, sections: osiot.map(({ teksti, kieli, ...x }) => x) } };
  const s = osiot.find(x => x.index === q.get('section'));
  if (q.get('prop') === 'wikitext') return { parse: { title: o, wikitext: osionWiki(osiot, s) } };
  return { parse: { title: o, text: jasenna(o, osionWiki(osiot, s)) } };
}
function taita(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ').replace(/[,'’]/g, ''); }
function rest(o) {
  const e = S[o]; if (!e) return null;
  const j = {};
  for (const k of Object.keys(e)) {
    if (META.has(k)) continue;
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
    t = t.filter(o => sanat.every(w => taita(o).split(/\s+/).includes(w) || (S[o].taulu || []).map(taita).includes(w)));
  }
  t.sort((a, b) => S[b].pop - S[a].pop);
  const pages = t.map((o, i) => {
    const p = { ns: 0, title: o, index: i + 1 };
    if (kat.length) {
      p.categories = Object.keys(S[o]).filter(k => !META.has(k)).map(k => 'Category:' + NIMI[k] + (typeof [].concat(S[o][k][1])[0] === 'string' ? ' lemmas' : ' non-lemma forms'))
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

Viimeinen kappale on suomea, ja hän luki historiaa koko illan.

Käsitteen määritelmä ja liikkeen suunta ovat kuvaannon asioita.
`;

palvelin.listen(0, async () => {
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: KUVAT ? 2 : 1 });
  const p = await ctx.newPage();
  const sivuvirheet = [];
  p.on('pageerror', e => sivuvirheet.push(e.message));
  const wikiReitti = route => {
    const u = new URL(route.request().url()), post = route.request().method() === 'POST' ? new URLSearchParams(route.request().postData() || '') : null;
    pyynnot.push((post ? 'POST ' : '') + decodeURIComponent(u.pathname + u.search) + (post ? ' ' + [...post.keys()].filter(k => k !== 'text').map(k => k + '=' + post.get(k)).join('&') : ''));
    const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (u.pathname.startsWith('/api/rest_v1/page/definition/')) {
      const o = decodeURIComponent(u.pathname.slice('/api/rest_v1/page/definition/'.length)).replace(/_/g, ' ');
      if (KERRAN_429.delete(o)) return route.fulfill({ status: 429, headers: h, body: '{}' });
      const j = rest(o);
      return route.fulfill(j ? { status: 200, headers: h, body: JSON.stringify(j) } : { status: 404, headers: h, body: '{}' });
    }
    if (u.pathname === '/w/api.php' && u.searchParams.get('action') === 'parse') {
      const q = new URLSearchParams(u.search); if (post) for (const [k, v] of post) q.set(k, v);
      return route.fulfill({ status: 200, headers: h, body: JSON.stringify(parse(q)) });
    }
    if (u.pathname === '/w/api.php') return route.fulfill({ status: 200, headers: h, body: JSON.stringify(api(u)) });
    return route.fulfill({ status: 404, headers: h, body: '{}' });
  };
  await p.route('https://en.wiktionary.org/**', wikiReitti);
  await p.route('https://tieteentermipankki.fi/**', tpReitti);
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
  tulos('oletukset: sanaselitys valikossa, käännös ei, sukkela päällä', oletus.k === 0 && oletus.s === 1 && oletus.suk === 1 && oletus.av >= 7, JSON.stringify(oletus));

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
  tulos('fi: pelkkä taivutusmuoto (kelloon) → perusmuoto ensin, taivutus pienellä ((”kelloon” · illative singular))',
    r.ots === 'kello' && r.muoto === '(”kelloon” · illative singular)' && /clock/.test(r.maar[0]) && !r.huom.length && r.raksi && !r.takaisin && !r.lambda && r.logos,
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
  tulos('alkuperä: avaus hakee vain osion wikitekstin ja jäsennyksen (osioluettelo jo muistissa)',
    pyynnot.length === 2 && /page=kello&prop=wikitext&section=2$/.test(pyynnot[0]) && /^POST .*title=kello/.test(pyynnot[1]), pyynnot.join(' · '));
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
  tulos('av 6→7: tallennettu pilotin käännös pois kerran', av.k === 0 && av.av >= 7, JSON.stringify(av));

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
    pyynnot.length = 0; jasennykset.length = 0;
    await p.click('#pop .sk-ots button.sk-ety');
    await odotaEty();
    e = await ety();
    tulos('alkuperä: kielet selityksen järjestyksessä nimettyinä, numerot (English · 1, English · 2, German)',
      e.kielet.join('|') === 'English · 1|English · 2|German' && e.rivit === 2 && !/SISÄ|PUU|ÄÄNTÄMYS|MÄÄRITELMÄ/.test(e.teksti), JSON.stringify(e));
    tulos('alkuperä: kolme osiota, yksi jäsennys, jokainen oman kielensä alla',
      pyynnot.filter(u => /^POST/.test(u)).length === 1 && jasennykset.join() === '2:ok,4:ok,7:ok', pyynnot.join(' · ') + ' ' + jasennykset.join());
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

  // Muu kuin sivun ensimmäinen kieli (historia: latina ensin, suomi toisena; käyttäjän havainto 14.11.2026): {{der}} ei saa
  // antaa Lua-virhettä, eikä laatikko saa väittää alkuperää kirjaamattomaksi.
  r = await selita('historiaa');
  tulos('historiaa → historia, taivutus pienellä', r.ots === 'historia' && r.muoto === '(”historiaa” · partitive singular)', JSON.stringify(r));
  pyynnot.length = 0; jasennykset.length = 0;
  await p.click('#pop .sk-ots button.sk-ety');
  await odotaEty();
  e = await ety();
  tulos('alkuperä: muun kuin sivun ensimmäisen kielen etymologiamalline jäsentyy oikean kielen alla (ei Lua-virhettä)',
    e.auki && /^From Ancient Greek ἱστορία\.$/.test(e.teksti) && jasennykset.join() === '5:ok', JSON.stringify(e) + ' ' + jasennykset.join());
  tulos('alkuperä: osion wikiteksti ja yksi jäsennys (POST, sivun nimi)',
    pyynnot.length === 2 && /page=historia&prop=wikitext&section=5$/.test(pyynnot[0]) && /^POST .*title=historia/.test(pyynnot[1]), pyynnot.join(' · '));
  await kuva('sk-alkupera-historia');
  await p.click('#pop .sk-sulje');
  await p.reload(); await p.waitForTimeout(500);
  RIKKI = true;
  r = await selita('historiaa');
  await p.click('#pop .sk-ots button.sk-ety');
  await odotaEty();
  e = await ety();
  RIKKI = false;
  tulos('alkuperä: Lua-virhe ei näy alkuperänä eikä väitä alkuperää kirjaamattomaksi', e.teksti === 'Wikisanakirjan alkuperää ei saatu luettua.', JSON.stringify(e));
  await p.click('#pop .sk-sulje');
  for (const mob of [true, false]) {
    // Mobiilimuoto (Androidin Firefox, käyttäjän havainto 14.11.2026): sama tulos kuin työpöytämuodossa, myös monen osion sivulla.
    MOBIILI = mob;
    await p.reload(); await p.waitForTimeout(500);
    r = await selita('historiaa');
    await p.click('#pop .sk-ots button.sk-ety');
    await odotaEty();
    e = await ety();
    tulos('alkuperä ' + (mob ? 'mobiilimuodossa' : 'työpöytämuodossa (uusi sivu)') + ': historia', /^From Ancient Greek ἱστορία\.$/.test(e.teksti), JSON.stringify(e));
    await p.click('#pop .sk-sulje');
    r = await selita('Kantin');
    await p.click('#pop .sk-ots button.sk-ety');
    await odotaEty();
    e = await ety();
    tulos('alkuperä ' + (mob ? 'mobiilimuodossa' : 'työpöytämuodossa (uusi sivu)') + ': Kant (kolme osiota, kaksi kieltä)', e.kielet.join('|') === 'English · 1|English · 2|German' && e.rivit === 2, JSON.stringify(e));
    await p.click('#pop .sk-sulje');
  }
  MOBIILI = false;

  // Taulukkohaku ja pituusehto (käyttäjän pyyntö 14.11.2026).
  await p.reload(); await p.waitForTimeout(500);
  r = await selita('Käsitteen');
  console.log('     Käsitteen: ' + pyynnot.length + ' pyyntöä: ' + pyynnot.map(u => u.replace(/^.*(gpssearch|gsrsearch)=([^&]*).*$/, '$1=$2').replace(/^\/api\/rest_v1\/page\/definition\//, 'rest:')).join(' · '));
  tulos('fi: taulukkohaku (Käsitteen → käsite, muoto otsikon alla, ei esimerkkilauseen määritellä eikä napsun johdoksia)',
    r.ots === 'käsite' && r.muoto === '(”käsitteen”)' && /concept/.test(r.maar[0]) && !r.huom.length && !r.vaihdot.length && !pyynnot.some(u => /gpssearch/.test(u)), JSON.stringify(r));
  await kuva('sk-kasitteen');
  r = await selita('liikkeen');
  tulos('fi: pituusehto (liikkeen → liike, ei liikkeenjohto)', r.ots === 'liike' && /movement/.test(r.maar[0]) && /lähin osuma/i.test(r.huom.join()), JSON.stringify(r));
  r = await selita('kuvaannon');
  tulos('fi: pituusehto ei estä tulosta, kun lyhyitä ei tule (kuvaannon → kuvaannollinen)', r.ots === 'kuvaannollinen' && /figurative/.test(r.maar[0]), JSON.stringify(r));

  tulos('lukin ei hae Tieteen termipankista (vain sanaselityssivu)', !tpPyynnot.length, tpPyynnot.join(' · '));

  // Sanaselityssivu (luin/sanaselitys.html): sama moottori ilman lukijaa. Kieli on tuntematon, ellei alussa ole kielikoodia
  // ja kaksoispistettä (fi:, en: …), jolloin haku on kuin sen kielen leipätekstissä.
  const sivuvirheet2 = [], muutPyynnot = [];
  p.on('pageerror', e => sivuvirheet2.push(e.message));
  const muutReitti = route => { const u = new URL(route.request().url()); muutPyynnot.push(u.hostname + ' ' + decodeURIComponent(u.pathname + u.search)); return route.fulfill(muutVastaus(u)); };
  for (const h of MUUT_ISANNAT) await p.route(h, muutReitti);
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto(BASE + 'luin/sanaselitys.html');
  const odotaSivu = () => p.waitForFunction(() => { const t = document.querySelector('#selitys .sk-runko'); return t && !/Haetaan/.test(t.textContent); }, null, { timeout: 5000 });
  const sivuTila = () => p.evaluate(() => {
    const q = s => document.querySelector('#selitys ' + s), qa = s => [...document.querySelectorAll('#selitys ' + s)];
    return { ots: q('.sk-o') ? q('.sk-o').textContent : '', huom: qa('.sk-huom').map(e => e.textContent), varo: qa('.sk-varo').map(e => e.textContent),
      kielet: qa('.sk-kieli').map(e => e.textContent), maar: qa('.sk-ol li').map(e => e.textContent), vaihdot: qa('.sk-vaihto').map(e => e.textContent),
      tieto: (q('.sk-tieto') || {}).textContent || '', lisaa: !!q('.sk-lisa'), muoto: (q('.sk-muoto') || {}).textContent || '',
      logos: !!q('.sk-logos') && !q('.sk-logos').hidden, kentta: document.querySelector('#sana').value, osoite: decodeURIComponent(location.hash),
      vihje: !document.querySelector('#vihje').hidden, nakyy: !document.querySelector('#selitys').hidden };
  });
  async function sivu(haku) {
    pyynnot.length = 0;
    await p.fill('#sana', haku);
    await p.press('#sana', 'Enter');
    await odotaSivu();
    await p.waitForTimeout(150);
    return sivuTila();
  }
  const kuvaSivu = async n => { if (KUVAT) await p.screenshot({ path: path.join(KUVAT, n + '.png'), fullPage: true }); };
  r = await sivuTila();
  tulos('sivu: alussa vihje näkyy, selitys ei, kenttä aktiivinen', r.vihje && !r.nakyy && await p.evaluate(() => document.activeElement.id === 'sana'), JSON.stringify(r));
  await kuvaSivu('sivu-alku');
  r = await sivu('kelloon');
  tulos('sivu: kelloon → kello, taivutus pienellä, ei kielihuomautusta (kieli tuntematon), osoitteessa haku',
    r.ots === 'kello' && r.muoto === '(”kelloon” · illative singular)' && !r.huom.length && r.logos && r.lisaa && !r.vihje && r.osoite === '#kelloon', JSON.stringify(r));
  tulos('sivu: Enter jättää hiirellä kentän valituksi seuraavaa sanaa varten', await p.evaluate(() => {
    const k = document.querySelector('#sana'); return document.activeElement === k && k.selectionStart === 0 && k.selectionEnd === k.value.length; }));
  await p.click('#selitys .sk-ots button.sk-ety');
  await p.waitForFunction(() => { const r = document.querySelector('#selitys .sk-ety-runko'); return r && !/Haetaan/.test(r.textContent); });
  e = await p.evaluate(() => ({ ots: document.querySelector('#selitys .sk-ety-ots .sk-osa').textContent, teksti: document.querySelector('#selitys .sk-ety-runko').textContent }));
  tulos('sivu: linssi avaa ΕΤΥΜΟΝ-laatikon', e.ots === 'ΕΤΥΜΟΝ' && /^From Proto-Finnic \*kello; compare kellua\.$/.test(e.teksti), JSON.stringify(e));
  await kuvaSivu('sivu-kelloon');
  // Raksin muste lisää-linkin oikean laidan tasalla kuten selitysikkunassa (±1 px).
  e = await p.evaluate(() => {
    const x = document.querySelector('#selitys .sk-sulje svg').getBoundingClientRect(), l = document.querySelector('#selitys .sk-lisa svg').getBoundingClientRect();
    // Musteen oikea laita: raksin vinoviiva (1,2) päättyy 0,58 px ja plussan vaakaviiva (tylppä pää) 0,65 px laatikon reunasta.
    return { raksi: +(x.right - .58).toFixed(2), lisa: +(l.right - .65).toFixed(2) };
  });
  tulos('sivu: raksin muste lisää-linkin oikean laidan tasalla (±1 px)', Math.abs(e.raksi - e.lisa) <= 1, JSON.stringify(e));
  r = await sivu('as');
  tulos('sivu: as ilman kieltä → kaikki kielet (englanti ensin, sitten suomi)', r.kielet[0] === 'English · Conjunction' && r.kielet[1] === 'Finnish · Noun' && r.kielet.length > 2, JSON.stringify(r));
  r = await sivu('fi: as');
  tulos('sivu: fi: as → vain suomi (kuten suomen leipätekstissä), otsikossa sana ilman koodia', r.ots === 'as' && r.kielet.join('|') === 'Finnish · Noun' && r.kentta === 'fi: as' && r.osoite === '#fi: as', JSON.stringify(r));
  r = await sivu('en:is');
  tulos('sivu: en:is → vain englanti (ei afrikaansia)', r.kielet.join('|') === 'English · Verb', JSON.stringify(r));
  r = await sivu('is');
  tulos('sivu: is ilman kieltä → englanti ja afrikaans', r.kielet.join('|') === 'English · Verb|Afrikaans · Verb', JSON.stringify(r));
  r = await sivu('fi: käsitteen');
  tulos('sivu: fi: käsitteen → käsite taulukkohaulla', r.ots === 'käsite' && r.muoto === '(”käsitteen”)' && /concept/.test(r.maar[0]), JSON.stringify(r));
  r = await sivu('käsitteen');
  tulos('sivu: käsitteen ilman kieltä → käsite loppunapsulla (ehdokkaana tai suoraan)', r.ots === 'käsite' || r.vaihdot.includes('käsite'), JSON.stringify(r));
  r = await sivu('Kantin');
  tulos('sivu: Kantin → Kant (erisnimen perusmuoto), ei kielihuomautusta', r.ots === 'Kant' && !r.huom.some(h => /ei osumaa/.test(h)), JSON.stringify(r));
  r = await sivu('fi: Kantin');
  tulos('sivu: fi: Kantin → Kant ja suomen kielihuomautus', r.ots === 'Kant' && /Suomesta ei osumaa/.test(r.huom.join()), JSON.stringify(r));
  r = await sivu('pratityasamutpada');
  tulos('sivu: majuminuluku kaikista kielistä, huomautus sanoo Haettu eikä Tekstissä (pratityasamutpada → pratītyasamutpāda)',
    r.ots === 'pratītyasamutpāda' && r.huom.join() === 'Haettu pratityasamutpada: sama toisin kirjoitettuna.', JSON.stringify(r));
  r = await sivu('de: Strasse');
  tulos('sivu: de: Strasse → Straße (saksan ketju)', r.ots === 'Straße' && r.huom.join() === 'Haettu Strasse: sama toisin kirjoitettuna.', JSON.stringify(r));
  r = await sivu('λογος');
  tulos('sivu: kreikan kirjaimet tunnistuvat ilman koodia (λογος → λόγος)', r.ots === 'λόγος' && /Ancient Greek/.test(r.kielet[0] || ''), JSON.stringify(r));
  r = await sivu('la: psyche');
  tulos('sivu: la: psyche → ψυχή varoituksin (Haettu psyche, ei tekstin)', r.ots === 'ψυχή' && /^Heikoilla jäillä\. Haettu psyche kreikkalaisin kirjaimin\.$/.test(r.varo.join()), JSON.stringify(r));
  r = await sivu('xyzzyq');
  tulos('sivu: tuntematon sana (kumpikaan lähde)', /^Sanaa ei löytynyt englanninkielisestä Wikisanakirjasta eikä Tieteen termipankista\.$/.test(r.tieto) && r.lisaa, JSON.stringify(r));
  r = await sivu('kantelx');
  tulos('sivu: valitsin ja valinta (kantelx → kantele, kanteli)', r.vaihdot.length >= 2, JSON.stringify(r));
  if (r.vaihdot.length >= 2) {
    await p.click('#selitys .sk-vaihto[data-i="0"]');
    await odotaSivu(); await p.waitForTimeout(150);
    const v = await sivuTila();
    tulos('sivu: vaihtoehdon valinta selittää sen', v.ots === r.vaihdot[0] && v.maar.length > 0, JSON.stringify(v));
  }
  r = await sivu('kelloon');
  await p.click('#selitys .sk-logos');
  await p.waitForFunction(() => document.querySelector('#selitys .sk-o').textContent === 'λόγος' && !/Haetaan/.test(document.querySelector('#selitys .sk-runko').textContent));
  tulos('sivu: ΛΟΓΟΣ vie sanaan λόγος', /Ancient Greek/.test((await sivuTila()).kielet[0] || ''));
  await p.click('#selitys .sk-sulje');
  r = await sivuTila();
  tulos('sivu: raksi tyhjentää selityksen, kentän ja osoitteen, vihje palaa', !r.nakyy && r.kentta === '' && r.osoite === '' && r.vihje && await p.evaluate(() => document.activeElement.id === 'sana'), JSON.stringify(r));
  // Osoitteesta: uusi sivu #-osalla ja #-osan vaihto samalla sivulla (selaimen hakusana).
  await p.goto(BASE + 'luin/sanaselitys.html#fi:kelloon');
  await odotaSivu(); await p.waitForTimeout(150);
  r = await sivuTila();
  tulos('sivu: osoitteen #fi:kelloon täyttää kentän ja selittää', r.kentta === 'fi:kelloon' && r.ots === 'kello', JSON.stringify(r));
  await p.evaluate(() => { location.hash = 'en%3Ais'; });
  await p.waitForFunction(() => document.querySelector('#sana').value === 'en:is');
  await odotaSivu(); await p.waitForTimeout(150);
  r = await sivuTila();
  tulos('sivu: #-osan vaihto hakee uudelleen (en:is)', r.ots === 'is' && r.kielet.join('|') === 'English · Verb', JSON.stringify(r));
  await p.goto(BASE + 'luin/sanaselitys.html#kova+onni');
  await odotaSivu(); await p.waitForTimeout(150);
  r = await sivuTila();
  tulos('sivu: + on väli osoitteessa (#kova+onni)', r.kentta === 'kova onni' && r.ots === 'kova onni', JSON.stringify(r));
  // Kielivalikko (kielirajaus): oletus kaikki kielet; valittu kieli rajaa ketjun ja selityksen siihen, ei löytynyt -viesti
  // nimeää kielen, kreikka latinalaisin kirjaimin haetaan kreikkalaisin, ja vaihto hakee näkyvän selityksen uudelleen.
  await p.goto(BASE + 'luin/sanaselitys.html');
  e = await p.evaluate(() => ({ arvo: document.querySelector('#kieli').value, teksti: document.querySelector('#kieli').selectedOptions[0].textContent,
    vaihtoehdot: [...document.querySelectorAll('#kieli option')].map(o => o.textContent) }));
  tulos('kielivalikko: oletus kaikki kielet, kielet kuten lukemiston kielirivissä aakkosin', e.arvo === '' && e.teksti === 'kaikki kielet' &&
    e.vaihtoehdot.join('|') === 'kaikki kielet|englanti|espanja|italia|kreikka|latina|liettua|ranska|ruotsi|saksa|suomi|tanska', JSON.stringify(e));
  const kieleksi = v => p.selectOption('#kieli', { label: v });
  r = await sivu('edes');
  tulos('kielivalikko: kaikki kielet → edes suomeksi ja latinaksi', r.kielet.join('|') === 'Finnish · Adverb|Latin · Verb', JSON.stringify(r));
  pyynnot.length = 0;
  await kieleksi('latina');
  await odotaSivu(); await p.waitForTimeout(150);
  r = await sivuTila();
  tulos('kielivalikko: vaihto hakee näkyvän selityksen uudelleen (edes → vain latina), kenttä ja osoite ennallaan',
    r.kielet.join('|') === 'Latin · Verb' && r.kentta === 'edes' && r.osoite === '#edes' && !r.huom.length, JSON.stringify(r));
  r = await sivu('fi: edes');
  tulos('kielivalikko: rajauksen ulkopuolinen kielikoodi ei tuo kieltä (latina, fi: edes → latina)', r.ots === 'edes' && r.kielet.join('|') === 'Latin · Verb', JSON.stringify(r));
  r = await sivu('est');
  tulos('kielivalikko: latina, est → vain latina (ei ranskaa)', r.kielet.join('|') === 'Latin · Verb', JSON.stringify(r));
  r = await sivu('quidditas');
  await p.click('#selitys .sk-sana[data-sana="est"]');
  await p.waitForFunction(() => document.querySelector('#selitys .sk-o').textContent === 'est' && !/Haetaan/.test(document.querySelector('#selitys .sk-runko').textContent));
  r = await sivuTila();
  tulos('kielivalikko: määritelmän linkki rajauksen kieleen (est#Latin) pysyy rajauksessa', r.kielet.join('|') === 'Latin · Verb', JSON.stringify(r));
  await sivu('quidditas');
  await p.click('#selitys .sk-sana[data-sana="gut"]');
  await p.waitForFunction(() => document.querySelector('#selitys .sk-o').textContent === 'gut' && !/Haetaan/.test(document.querySelector('#selitys .sk-runko').textContent));
  r = await sivuTila();
  tulos('kielivalikko: kielettömästä linkistä (gut) kaikki kielet', r.kielet.length === 2, JSON.stringify(r));
  await kieleksi('suomi');
  r = await sivu('as');
  tulos('kielivalikko: suomi, as → vain suomi (ei Translingualia eikä englantia)', r.kielet.join('|') === 'Finnish · Noun', JSON.stringify(r));
  r = await sivu('käsitteen');
  tulos('kielivalikko: suomi, käsitteen → käsite taulukkohaulla', r.ots === 'käsite' && r.muoto === '(”käsitteen”)', JSON.stringify(r));
  r = await sivu('historiaa');
  tulos('kielivalikko: suomi, historiaa → historia vain suomeksi', r.ots === 'historia' && r.kielet.join('|') === 'Finnish · Noun', JSON.stringify(r));
  await kieleksi('englanti');
  r = await sivu('is');
  tulos('kielivalikko: englanti, is → vain englanti', r.kielet.join('|') === 'English · Verb', JSON.stringify(r));
  r = await sivu('Kantin');
  tulos('kielivalikko: englanti, Kantin → Kant vain englanniksi (erisnimen perusmuoto rajauksessa)', r.ots === 'Kant' && r.kielet.join('|') === 'English · Proper noun', JSON.stringify(r));
  r = await sivu('IV');
  tulos('kielivalikko: englanti, IV → vain englanti (symbolinkaan Translingual ei tule)', r.kielet.join('|') === 'English · Noun', JSON.stringify(r));
  await kieleksi('tanska');
  r = await sivu('km');
  tulos('kielivalikko: tanska, km → vain tanska (ei Translingualia)', r.kielet.join('|') === 'Danish · Noun', JSON.stringify(r));
  await kieleksi('italia');
  r = await sivu('casa');
  tulos('kielivalikko: italia, casa → vain italia', r.kielet.join('|') === 'Italian · Noun', JSON.stringify(r));
  await kieleksi('kaikki kielet');
  r = await sivu('es: casa');
  tulos('kielikoodi es: kelpaa (es: casa → espanja kuten espanjan leipätekstissä)', r.ots === 'casa' && r.kielet.join('|') === 'Spanish · Noun' && r.kentta === 'es: casa', JSON.stringify(r));
  r = await sivu('logos');
  tulos('kielivalikko: kaikki kielet, logos → englannin logos', r.ots === 'logos' && r.kielet.join('|') === 'English · Noun', JSON.stringify(r));
  await kieleksi('kreikka');
  await odotaSivu(); await p.waitForTimeout(150);
  r = await sivuTila();
  tulos('kielivalikko: kreikka, logos latinalaisin kirjaimin → λόγος kreikkalaisin kirjaimin varoituksin',
    r.ots === 'λόγος' && /Ancient Greek/.test(r.kielet.join()) && /^Heikoilla jäillä\. Haettu logos kreikkalaisin kirjaimin\.$/.test(r.varo.join()), JSON.stringify(r));
  r = await sivu('ψυχη');
  tulos('kielivalikko: kreikka, ψυχη → ψυχή', r.ots === 'ψυχή' && !r.varo.length, JSON.stringify(r));
  await kieleksi('ranska');
  r = await sivu('kello');
  tulos('kielivalikko: ei löytynyt -viesti nimeää kielen (Ranskan sanaa …)', /^Ranskan sanaa ei löytynyt englanninkielisestä Wikisanakirjasta eikä Tieteen termipankista\.$/.test(r.tieto), JSON.stringify(r));
  r = await sivu('kova onni');
  tulos('kielivalikko: ilmaus (Ranskan ilmausta …)', /^Ranskan ilmausta ei löytynyt englanninkielisestä Wikisanakirjasta eikä Tieteen termipankista\.$/.test(r.tieto), JSON.stringify(r));
  await kuvaSivu('sivu-rajaus');
  await p.click('#selitys .sk-sulje');
  pyynnot.length = 0; muutPyynnot.length = 0;
  await p.fill('#sana', 'edes');
  await kieleksi('latina');
  await p.waitForTimeout(300);
  r = await sivuTila();
  tulos('kielivalikko: vaihto ilman näkyvää selitystä ei hae', !r.nakyy && r.vihje && !pyynnot.length && !muutPyynnot.some(x => /edes/.test(x)), JSON.stringify(r));
  await p.goto('about:blank');
  await p.goto(BASE + 'luin/sanaselitys.html#edes');
  await odotaSivu(); await p.waitForTimeout(150);
  r = await sivuTila();
  tulos('kielivalikko: uusi lataus palaa kaikkiin kieliin', await p.evaluate(() => document.querySelector('#kieli').value === '') && r.kielet.length === 2, JSON.stringify(r));
  // Rivin mitat: valikko kentän alla vasemmassa laidassa, napautusalue vähintään 36 px, nuoli tekstin oikealla.
  e = await p.evaluate(() => {
    const s = document.querySelector('#kieli').getBoundingClientRect(), f = document.querySelector('#haku').getBoundingClientRect(),
      l = document.querySelector('.rajaus label').getBoundingClientRect();
    return { vasen: l.left - f.left, korkeus: s.height, alla: s.top >= f.bottom, vari: getComputedStyle(document.querySelector('#kieli')).color };
  });
  tulos('kielivalikko: kentän alla vasemmassa laidassa, korkeus ≥ 36 px, ruoste', Math.abs(e.vasen) < .5 && e.korkeus >= 36 && e.alla && e.vari === 'rgb(140, 84, 38)', JSON.stringify(e));

  // Tieteen termipankki samalla haulla (vain sivu): valitsimessa termipankki ensin alan kera, sitten Wikisanakirja; termiselitys
  // (ala, määritelmät, vastineet napautettavina, termipankin lähde ja linkki); linssi vain, kun alkuperää on (termipankin huomautus
  // tai otsikon sanan Etymology Wikisanakirjassa).
  const termiTila = () => p.evaluate(() => {
    const q = s => document.querySelector('#selitys ' + s), qa = s => [...document.querySelectorAll('#selitys ' + s)];
    return { ots: q('.sk-o') ? q('.sk-o').textContent : '', muoto: (q('.sk-muoto') || {}).textContent || '', kielet: qa('.sk-runko > .sk-kieli').map(e => e.textContent),
      vaihdot: qa('.sk-vaihto').map(e => e.textContent + (e.nextElementSibling ? ' · ' + e.nextElementSibling.textContent : '')),
      termi: qa('.sk-vaihto[data-k="sk-termi"]').length, maar: qa('.sk-ol li').map(e => e.textContent), vast: qa('.sk-vrivi').map(e => e.textContent),
      linssi: !!q('.sk-ots button.sk-ety'), lahde: (q('.sk-lahde') || {}).textContent || '', lisa: q('.sk-lisa') ? q('.sk-lisa').getAttribute('href') : '',
      logos: !!q('.sk-logos') && !q('.sk-logos').hidden, tieto: (q('.sk-runko > .sk-tieto') || {}).textContent || '', huom: qa('.sk-huom').map(e => e.textContent) };
  });
  const odotaRunko = async () => { await odotaSivu(); await p.waitForTimeout(250); };
  async function termiHaku(haku) { tpPyynnot.length = 0; await sivu(haku); await p.waitForTimeout(100); return termiTila(); }
  async function napauta(sel) { await p.click('#selitys ' + sel); await odotaRunko(); return termiTila(); }
  async function etymon() {
    await p.click('#selitys .sk-ots button.sk-ety');
    await p.waitForFunction(() => { const r = document.querySelector('#selitys .sk-ety-runko'); return r && !/Haetaan/.test(r.textContent); });
    return p.evaluate(() => ({ osat: [...document.querySelectorAll('#selitys .sk-ety-runko > *')].map(e => (e.classList.contains('sk-kieli') ? '#' : '') + e.textContent) }));
  }
  r = await termiHaku('adekvaatti');
  tulos('termipankki: adekvaatti → valitsin, termipankki ensin (alat aakkosin), sitten Wikisanakirja',
    r.kielet.join('|') === 'Tieteen termipankki|Wikisanakirja' && r.vaihdot.join('|') === 'adekvaatti · Biologia|adekvaatti · Filosofia|adekvaatti · Finnish' &&
    r.termi === 2 && !r.linssi && !r.logos && tpPyynnot.length === 1 && /gbltitle=Nimitys:adekvaatti/.test(tpPyynnot[0]), JSON.stringify(r) + ' ' + tpPyynnot.join(' · '));
  await kuvaSivu('termi-valitsin');
  r = await napauta('.sk-vaihto[data-k="sk-termi"][data-i="1"]');
  tulos('termipankki: termiselitys (ΛΟΓΟΣ, ala, kolme määritelmää ilman numeroita, vastineet, lähde ja linkki käsitteeseen)',
    r.ots === 'adekvaatti' && r.logos && r.kielet.join('|') === 'Filosofia|Vastineet' && r.maar.length === 3 && r.maar[0] === 'pätevä, luotettava käsitys' &&
    r.vast.join('|') === 'englanti adequate|saksa adäquat' && r.lahde === 'Tieteen termipankki, CC BY-SA' &&
    r.lisa === 'https://tieteentermipankki.fi/wiki/Filosofia:adekvaatti' && !r.muoto && r.linssi, JSON.stringify(r));
  e = await etymon();
  tulos('termipankki: ΕΤΥΜΟΝ ensin termipankin huomautus, sitten Wikisanakirjan alkuperä, lähteet nimettyinä (ei ks.-riviä)',
    e.osat.join('|') === '#Tieteen termipankki|lat. adaequare=muistuttaa, olla yhtä|#Wikisanakirja|Borrowed from Latin adaequātus.', JSON.stringify(e));
  await kuvaSivu('termi-adekvaatti');
  r = await termiHaku('adekvaatti');
  r = await napauta('.sk-vaihto[data-k="sk-vaihto"]');
  tulos('termipankki: Wikisanakirjan rivi antaa Wikisanakirjan selityksen kuten ennen', r.ots === 'adekvaatti' && /adequate/.test(r.maar[0] || '') && r.lahde === 'Wiktionary, CC BY-SA', JSON.stringify(r));
  r = await termiHaku('Dasein');
  tulos('termipankki: vieraskielinen haku (Dasein → täälläolo) valitsimessa suomenkielisenä', r.vaihdot[0] === 'täälläolo · Filosofia' && /^Dasein · /.test(r.vaihdot[1] || ''), JSON.stringify(r));
  r = await napauta('.sk-vaihto[data-k="sk-termi"]');
  tulos('termipankki: täälläolo, haettu muoto otsikon alla (”Dasein” · saksa), vastineet suomi, englanti, saksa',
    r.ots === 'täälläolo' && r.muoto === '(”Dasein” · saksa)' && r.vast.join('|') === 'suomi siellä oleva|englanti being-there|saksa Dasein', JSON.stringify(r));
  tulos('termipankki: ei linssiä, kun alkuperää ei ole (ei huomautusta, Wikisanakirjassa ei sanaa)', !r.linssi, JSON.stringify(r));
  await kuvaSivu('termi-dasein');
  r = await napauta('.sk-sana[data-sana="Dasein"]');
  tulos('termipankki: vastineen napautus vie Wikisanakirjan selitykseen sen kielellä (Dasein, saksa ensin)', r.ots === 'Dasein' && /^German · Noun/.test(r.kielet[0] || '') && r.lahde === 'Wiktionary, CC BY-SA', JSON.stringify(r));
  r = await termiHaku('dasein');
  tulos('termipankki: alkukirjaimen koko toisella haulla (dasein → Nimitys:Dasein)', r.vaihdot[0] === 'täälläolo · Filosofia' && tpPyynnot.length === 2, JSON.stringify(r) + ' ' + tpPyynnot.join(' · '));
  r = await termiHaku('suuntautuneisuus');
  tulos('termipankki: vain termipankissa ja yksi käsite → termiselitys suoraan (synonyymi otsikon alla)',
    r.ots === 'intentionaalisuus' && r.muoto === '(”suuntautuneisuus”)' && r.maar.length === 2 && r.vast.join('|') === 'suomi suuntautuneisuus|englanti intentionality|saksa Intentionalität' && r.linssi && !r.termi, JSON.stringify(r));
  e = await etymon();
  tulos('termipankki: ΕΤΥΜΟΝ pelkkä termipankin huomautus, kun Wikisanakirjassa ei ole alkuperää', e.osat.join('|') === '#Tieteen termipankki|lat. intendo=osoittaa, tähdätä johonkin', JSON.stringify(e));
  r = await termiHaku('käsite');
  tulos('termipankki: määritelmässä mainittu käsite ei ole osuma (Terminologiaoppi:polysemia), kohina pois',
    r.vaihdot.join('|') === 'käsite · Filosofia|käsite · Finnish', JSON.stringify(r));
  r = await napauta('.sk-vaihto[data-k="sk-termi"]');
  tulos('termipankki: käsite ilman huomautusta ja Wikisanakirjan alkuperää → ei linssiä', r.ots === 'käsite' && !r.linssi, JSON.stringify(r));
  r = await termiHaku('historia');
  r = await napauta('.sk-vaihto[data-k="sk-termi"]');
  tulos('termipankki: linssi Wikisanakirjan alkuperästä, kun termipankissa ei ole huomautusta (historia)', r.ots === 'historia' && r.linssi, JSON.stringify(r));
  e = await etymon();
  tulos('termipankki: ΕΤΥΜΟΝ vain Wikisanakirja (suomen alkuperä, ei latinan)', e.osat.join('|') === '#Wikisanakirja|From Ancient Greek ἱστορία.', JSON.stringify(e));
  r = await termiHaku('olemus');
  tulos('termipankki: tyhjällä rivillä erotetut määritelmät, kreikka latinalaisin kirjaimin ilman Wikisanakirjan kieltä',
    r.ots === 'olemus' && r.maar.length === 2 && /yksilöolemus\)$/.test(r.maar[0]) && r.linssi &&
    await p.evaluate(() => !document.querySelector('#selitys .sk-sana[data-sana="ousia"]').dataset.kieli && document.querySelector('#selitys .sk-sana[data-sana="Wesen"]').dataset.kieli === 'German'), JSON.stringify(r));
  r = await termiHaku('kana');
  tulos('termipankki: termipankin virhe ei estä Wikisanakirjaa (kana)', r.ots === 'kana' && /hen/.test(r.maar[0] || '') && !r.termi, JSON.stringify(r));
  r = await termiHaku('kello');
  tulos('termipankki: ei osumaa → Wikisanakirja kuten ennen (ei valitsinta)', r.ots === 'kello' && /clock/.test(r.maar[0] || '') && !r.termi && tpPyynnot.length === 2, JSON.stringify(r));
  await kieleksi('englanti');
  r = await termiHaku('Dasein');
  tulos('termipankki: kielirajaus koskee haettua nimitystä (englanti: Dasein on saksaa → vain Wikisanakirja)', r.ots === 'Dasein' && !r.termi, JSON.stringify(r));
  await kieleksi('saksa');
  r = await termiHaku('Dasein');
  tulos('termipankki: saksa: Dasein → termipankki ja Wikisanakirja', r.vaihdot[0] === 'täälläolo · Filosofia' && r.termi === 1, JSON.stringify(r));
  await kieleksi('kaikki kielet');

  /* ---------- Sanakirjavalikko ja muut sanakirjat ----------
     Kolme tilaa: Wiktionary ja termipankki moottorissa (päähaaran valitsin), pelkkä termipankki moottorissa (o.wikt false, ei
     Wikisanakirjan pyyntöjä) ja ilman moottoria; muut sanakirjat osioina selityksen alla kaikissa. */
  const muutTila = () => p.evaluate(() => {
    const qa = s => [...document.querySelectorAll(s)];
    return { nappi: document.querySelector('#sanakirjat').textContent, osiot: qa('#selitys section.sx:not([hidden])').map(s => s.dataset.l),
      ei: (document.querySelector('#selitys .sx-ei') || {}).textContent || '', runko: (document.querySelector('#selitys .sk-runko > .sk-tieto') || {}).textContent || '',
      ots: (document.querySelector('#selitys .sk-o') || {}).textContent || '', logos: !!document.querySelector('#selitys .sk-logos:not([hidden])'),
      muoto: (document.querySelector('#selitys .sk-runko .sk-muoto') || {}).textContent || '', lahde: (document.querySelector('#selitys .sk-ala .sk-lahde') || {}).textContent || '',
      vast: qa('#selitys .sk-vrivi .sk-sana').map(b => b.dataset.k + ':' + b.dataset.sana), linssi: !!document.querySelector('#selitys .sk-ots button.sk-ety'),
      ala: (() => { const a = document.querySelector('#selitys .sk-ala'); return a ? getComputedStyle(a).display : ''; })(),
      sx: Object.fromEntries(qa('#selitys section.sx:not([hidden])').map(s => [s.dataset.l, {
        ots: [...s.querySelectorAll('.sx-ots')].map(e => e.textContent), muoto: [...s.querySelectorAll('.sx-muoto')].map(e => e.textContent),
        p: [...s.querySelectorAll(':scope > .sx-p')].map(e => e.textContent), kirjat: [...s.querySelectorAll('.sx-kirjat button.sx-auki')].map(e => e.textContent),
        lahde: (s.querySelector('.sx-lahde') || {}).textContent, lisa: (s.querySelector('a.sx-lisa') || {}).href || '' }])) };
  });
  // Valmis: ei Haetaan-tekstiä, ja osio, ei osumaa -rivi tai kehyksen viesti näkyy (rivi tulee vasta, kun kaikki ovat valmiita).
  const odotaMuut = () => p.waitForFunction(() => {
    const r = document.querySelector('#selitys .sk-runko'); if (!r || /Haetaan/.test(r.textContent)) return false;
    return !!document.querySelector('#selitys section.sx:not([hidden])') || !!(document.querySelector('#selitys .sx-ei') || {}).textContent || /\S/.test(r.textContent);
  }, null, { timeout: 5000 }).then(() => p.waitForTimeout(250));
  const hakuMuut = async h => { muutPyynnot.length = 0; pyynnot.length = 0; tpPyynnot.length = 0; await p.fill('#sana', h); await p.press('#sana', 'Enter'); await odotaMuut(); return muutTila(); };
  const lista = () => p.evaluate(() => [...document.querySelectorAll('#sanakirjat-lista button')].map(b => b.querySelector('.vk-nimi').textContent + (b.getAttribute('aria-pressed') === 'true' ? '+' : '-') + (b.getAttribute('aria-disabled') === 'true' ? '!' : '')));
  const valitse = async nimet => { for (const n of nimet) await p.click('#sanakirjat-lista button:has(.vk-nimi:text-is("' + n + '"))'); };
  await p.goto('about:blank');
  await p.goto(BASE + 'luin/sanaselitys.html');
  e = await p.evaluate(() => ({ nappi: document.querySelector('#sanakirjat').textContent, kiinni: document.querySelector('#sanakirjat-lista').hidden, talletettu: localStorage.getItem('luin-sanakirjat') }));
  await p.click('#sanakirjat');
  let l = await lista();
  tulos('sanakirjat: oletuksena Wiktionary ja Tieteen termipankki, kuusi lähdettä, lista kiinni alussa',
    e.nappi === 'Wiktionary, Termipankki' && e.kiinni && e.talletettu === null &&
    l.join('|') === 'Wiktionary+|Tieteen termipankki+|Logeion-|Wörterbuchnetz-|Digital Pāḷi Dictionary-|Monier-Williams-', JSON.stringify([e, l]));
  e = await p.evaluate(() => { const l = document.querySelector('#sanakirjat-lista').getBoundingClientRect(), b = document.querySelector('#sanakirjat').getBoundingClientRect();
    return { alla: l.top >= b.bottom - 1, vasen: Math.abs(l.left - b.left), oikea: l.right <= innerWidth - 16 }; });
  tulos('sanakirjat: lista napin alla sen vasemmasta laidasta (leveällä ruudulla)', e.alla && e.vasen < 1 && e.oikea, JSON.stringify(e));
  await kuvaSivu('sivu-sanakirjat-lista');
  await p.keyboard.press('Escape');
  tulos('sanakirjat: Esc sulkee listan', await p.evaluate(() => document.querySelector('#sanakirjat-lista').hidden && document.activeElement.id === 'sanakirjat'));
  await p.click('#sanakirjat');
  await valitse(['Logeion', 'Wörterbuchnetz', 'Digital Pāḷi Dictionary', 'Monier-Williams']);
  l = await lista();
  await p.click('h1');
  tulos('sanakirjat: valinta napautuksesta, nappi kertoo määrän, ohi napautus sulkee ja tallentaa', l.every(x => x.endsWith('+')) &&
    await p.evaluate(() => document.querySelector('#sanakirjat').textContent === '6 sanakirjaa' && document.querySelector('#sanakirjat-lista').hidden &&
      localStorage.getItem('luin-sanakirjat') === '["wiktionary","termipankki","logeion","woerterbuchnetz","dpd","koln"]'), l.join('|'));

  // 1) Wiktionary ja termipankki: muut saavat Wiktionaryn perusmuodon, linkki vie kaikki uuteen sanaan, ei osumaa -rivi lopuksi.
  r = await hakuMuut('de: Strasse');
  let ts = r.sx.woerterbuchnetz || {};
  tulos('wiktionary: perusmuoto muille (de: Strasse → Straße Wörterbuchnetzissä, ei toista muotoriviä), saksaan sopimattomat eivät hae',
    r.ots === 'Straße' && r.osiot.join() === 'woerterbuchnetz' && ts.ots.join() === 'Straße' && !ts.muoto.length &&
    muutPyynnot.some(x => /lemmata\/Straße$/.test(x)) && !muutPyynnot.some(x => /uchicago|dpdict|koeln/.test(x)) && r.ei === '', JSON.stringify([r, muutPyynnot]));
  await hakuMuut('la: quidditas');
  muutPyynnot.length = 0;
  await p.click('#selitys .sk-sana[data-sana="est"]');
  await p.waitForFunction(() => document.querySelector('#selitys .sk-o').textContent === 'est');
  await odotaMuut();
  tulos('siirto: Wiktionaryn linkki (est) hakee muista uuden sanan', muutPyynnot.some(x => /detail\?w=est&/.test(x)) && !muutPyynnot.some(x => /quidditas/.test(x)), muutPyynnot.join('\n'));
  r = await hakuMuut('kelloon');
  tulos('wiktionary: ei osumaa -rivi muista vasta Wiktionaryn jälkeen (kelloon → kello)', r.ots === 'kello' && !r.osiot.length &&
    r.ei === 'Ei osumaa: Logeion, Wörterbuchnetz, Digital Pāḷi Dictionary, Monier-Williams.', JSON.stringify(r));

  // 2) Pelkkä termipankki: ohi napautus (ΛΟΓΟΣ) ei laukea; haku uudelleen ilman Wikisanakirjan pyyntöjä.
  await p.click('#sanakirjat');
  await valitse(['Wiktionary']);
  pyynnot.length = 0; muutPyynnot.length = 0;
  await p.click('#selitys .sk-logos');
  await odotaMuut();
  r = await muutTila();
  tulos('ilman Wiktionarya: ohi napautus ei laukea (ΛΟΓΟΣ), kelloon haetaan uudelleen pelkästä termipankista ja muista',
    await p.evaluate(() => document.querySelector('#sanakirjat-lista').hidden) && r.ots === 'kelloon' && r.runko === 'Sanaa ei löytynyt Tieteen termipankista.' &&
    !pyynnot.length && r.ei === 'Ei osumaa: Logeion, Wörterbuchnetz, Digital Pāḷi Dictionary, Monier-Williams.' && await p.evaluate(() => !document.querySelector('#selitys .sk-ala .sk-lisa')), JSON.stringify(r));
  r = await hakuMuut('käsitteen');
  tulos('termipankki ilman Wiktionarya: käsitteen → käsite päätesäännöistä, haettu muoto, termipankin lähde, ei Wikisanakirjan pyyntöjä',
    r.ots === 'käsite' && r.muoto === '(”käsitteen”)' && r.lahde === 'Tieteen termipankki, CC BY-SA' && r.logos && !r.linssi && !pyynnot.length &&
    tpPyynnot.some(x => /titles=.*Nimitys:käsite(\||$)/.test(x)) && tpPyynnot.some(x => /gbltitle=Nimitys:käsite$/.test(x)), JSON.stringify(r) + ' ' + tpPyynnot.join(' · '));
  tulos('termipankki ilman Wiktionarya: vastineet ovat uusia hakuja kielikoodin kanssa', r.vast.join('|') === 'sx-hae:en: concept|sx-hae:de: Begriff', r.vast.join('|'));
  await kuvaSivu('sivu-termipankki-yksin');
  muutPyynnot.length = 0; pyynnot.length = 0;
  await p.click('#selitys .sk-sana[data-sana="de: Begriff"]');
  await odotaMuut();
  r = await muutTila();
  tulos('termipankki ilman Wiktionarya: vastine de: Begriff → kenttä ja osoite, käsite saksasta, Wörterbuchnetz', r.ots === 'käsite' && r.muoto === '(”Begriff” · saksa)' &&
    await p.evaluate(() => document.querySelector('#sana').value === 'de: Begriff' && decodeURIComponent(location.hash) === '#de: Begriff') &&
    r.osiot.join() === 'woerterbuchnetz' && !pyynnot.length, JSON.stringify(r));
  await p.click('#selitys .sk-logos');
  await odotaMuut();
  r = await muutTila();
  tulos('termipankki ilman Wiktionarya: ΛΟΓΟΣ hakee sanan λόγος muista (kenttä ennallaan)', r.ots === 'λόγος' && (r.sx.logeion || {}).ots.join() === 'λόγος' &&
    await p.evaluate(() => document.querySelector('#sana').value === 'de: Begriff') && !pyynnot.length, JSON.stringify(r));

  // 3) Ilman moottoria (Wiktionary ja termipankki pois).
  await p.click('#sanakirjat');
  await valitse(['Tieteen termipankki']);
  await p.click('h1');
  r = await hakuMuut('λόγου');
  ts = r.sx.logeion || {};
  tulos('logeion: λόγου → λόγος jäsennyksestä, muoto, lyhyt määritelmä, sanakirjat (linkkisanakirja pois, Middle Liddell ensin)',
    r.osiot.join() === 'logeion' && ts.ots.join() === 'λόγος' && ts.muoto.join() === '(”λόγου” · Noun · masculine · genitive singular)' &&
    ts.p.join() === 'λόγος, λόγου, ὁ, word, speech, story' && ts.kirjat.join('|') === 'Middle Liddell|LSJ' && /logeion\.uchicago\.edu/.test(ts.lisa) && ts.lahde === 'Logeion (Chicagon yliopisto)', JSON.stringify(r));
  tulos('ilman moottoria: otsikko on haku, ΛΟΓΟΣ näkyy, kehyksen lähderivi piilossa, ei Wikisanakirjan eikä termipankin pyyntöjä',
    r.ots === 'λόγου' && r.logos && r.ala === 'none' && r.runko === '' && !pyynnot.length && !tpPyynnot.length && r.ei === '', JSON.stringify(r));
  await p.click('#selitys section.sx[data-l="logeion"] .sx-kirjat button.sx-auki[data-i="1"]');
  e = await p.evaluate(() => { const s = document.querySelector('#selitys section.sx[data-l="logeion"] .sx-sisus[data-i="1"]');
    return { auki: !s.hidden, nimi: s.querySelector('.sx-vk').textContent, kpl: [...s.querySelectorAll('.sx-sisalto .sx-p')].map(x => x.innerHTML) }; });
  tulos('logeion: LSJ aukeaa nimettynä, kursiivi säilyy, rivinvaihto on kappale, tyylit pois', e.auki && e.nimi === 'LSJ' && e.kpl.length === 2 &&
    /<i>computation, reckoning<\/i>/.test(e.kpl[0]) && !/style|span/.test(e.kpl.join()), JSON.stringify(e));
  await kuvaSivu('sivu-logeion');
  await p.click('#selitys section.sx[data-l="logeion"] .sx-kirjat button.sx-auki[data-i="1"]');
  tulos('logeion: toinen napautus sulkee', await p.evaluate(() => document.querySelector('#selitys section.sx[data-l="logeion"] .sx-sisus[data-i="1"]').hidden));
  await p.click('#selitys .sk-logos');
  await odotaMuut();
  r = await muutTila();
  tulos('ilman moottoria: ΛΟΓΟΣ vie sanaan λόγος muissa', r.ots === 'λόγος' && (r.sx.logeion || {}).ots.join() === 'λόγος' && !(r.sx.logeion || {}).muoto.length, JSON.stringify(r));
  r = await hakuMuut('λογος');
  tulos('logeion: aksentiton λογος → λόγος (sama toisin kirjoitettuna); aakkosissa lähin ei kelpaa',
    (r.sx.logeion || {}).ots.join() === 'λόγος' && (r.sx.logeion || {}).muoto.join() === '(”λογος” · sama toisin kirjoitettuna)', JSON.stringify(r));
  r = await hakuMuut('Begriffe');
  ts = r.sx.woerterbuchnetz || {};
  tulos('wörterbuchnetz: Begriffe → Begriff päätesäännöstä, kolme sanakirjaa aikoineen',
    r.osiot.join() === 'woerterbuchnetz' && ts.ots.join() === 'Begriff' && ts.muoto.join() === '(”Begriffe”)' && ts.kirjat.join('|') === 'Adelung|Campe|Grimm, uusi laitos' &&
    r.ei === 'Ei osumaa: Logeion, Digital Pāḷi Dictionary, Monier-Williams.', JSON.stringify(r));
  await p.click('#selitys section.sx[data-l="woerterbuchnetz"] .sx-kirjat button.sx-auki[data-i="0"]');
  await p.waitForFunction(() => !/Haetaan/.test(document.querySelector('#selitys section.sx[data-l="woerterbuchnetz"] .sx-sisus[data-i="0"]').textContent));
  await p.click('#selitys section.sx[data-l="woerterbuchnetz"] .sx-kirjat button.sx-auki[data-i="1"]');
  await p.waitForFunction(() => !/Haetaan/.test(document.querySelector('#selitys section.sx[data-l="woerterbuchnetz"] .sx-sisus[data-i="1"]').textContent));
  e = await p.evaluate(() => { const s = i => document.querySelector('#selitys section.sx[data-l="woerterbuchnetz"] .sx-sisus[data-i="' + i + '"]');
    return { a: s(0).querySelector('.sx-sisalto').innerHTML, an: s(0).querySelector('.sx-vk').textContent, c: s(1).textContent, link: (s(1).querySelector('a.sx-ulos') || {}).href || '' }; });
  tulos('wörterbuchnetz: Adelungin artikkeli sanoittain (entiteetit purettu, kursiivi), Campen pitkä artikkeli linkkinä',
    e.an === 'Adelung · Begriff' && e.a === '<p class="sx-p">Der Begriff, im figürlichen Verstande <i>ohne Plural</i>.</p>' &&
    /Artikkeli on pitkä \(noin 99\s999 sanaa\)/.test(e.c) && /sigle=Campe&lemid=B02041/.test(e.link) && !muutPyynnot.some(x => /articles\/B02041/.test(x)), JSON.stringify(e));
  r = await hakuMuut('dhammassa');
  ts = r.sx.dpd || {};
  tulos('dpd: dhammassa → tiivistelmän kohdat (otsikko kursiivina, nuolilinkit pois)', r.osiot.join() === 'dpd' &&
    ts.p.join('|') === 'dhamma 1.01 masc. nature; character|dhamma 1.03 masc. teaching; discourse; doctrine' && /dpdict\.net\/\?q=dhammassa/.test(ts.lisa), JSON.stringify(r));
  r = await hakuMuut('karuna');
  ts = r.sx.koln || {};
  tulos('köln: karuna → karuṇa diakriitittä (simple-search), rivit ilman sivu- ja tunnistemerkintöjä', r.osiot.join() === 'koln' && ts.ots.join() === 'karuṇa' &&
    ts.muoto.join() === '(”karuna” · sama toisin kirjoitettuna)' && ts.p.join('|') === 'karuṇa mf(ā)n. mournful, miserable, MBh.|karuṇā f. compassion, pity', JSON.stringify(r));
  await kuvaSivu('sivu-koln');
  r = await hakuMuut('xyzzyq');
  tulos('ilman moottoria: ei löytynyt mistään → kehyksen viesti, ei ΛΟΓΟΣta eikä osioita', r.runko === 'Sanaa ei löytynyt valituista sanakirjoista.' && !r.logos && !r.osiot.length && r.ei === '', JSON.stringify(r));
  await kieleksi('saksa');
  r = await hakuMuut('Begriffe');
  tulos('kielivalikko: saksa → vain Wörterbuchnetz; Logeion, DPD ja Köln eivät hae', r.osiot.join() === 'woerterbuchnetz' && !muutPyynnot.some(x => /uchicago|dpdict|koeln/.test(x)), JSON.stringify([r.osiot, muutPyynnot.map(x => x.split(' ')[0])]));
  await kieleksi('suomi');
  r = await hakuMuut('Begriffe');
  tulos('kielivalikko: suomi → yksikään valittu ei kata hakua', !r.osiot.length && r.runko === 'Valitut sanakirjat eivät kata tätä hakua.' && !muutPyynnot.length, JSON.stringify(r));
  await kieleksi('kaikki kielet');
  // Viimeistä päällä olevaa ei voi ottaa pois; valinta muistetaan uudelleenlatauksessa.
  await p.click('#sanakirjat');
  await valitse(['Logeion', 'Wörterbuchnetz', 'Digital Pāḷi Dictionary']);
  l = await lista();
  await p.click('#sanakirjat-lista button:has(.vk-nimi:text-is("Monier-Williams"))', { force: true });
  const l2 = await lista();
  tulos('sanakirjat: viimeistä ei voi ottaa pois', l.join('|') === 'Wiktionary-|Tieteen termipankki-|Logeion-|Wörterbuchnetz-|Digital Pāḷi Dictionary-|Monier-Williams+!' && l2.join() === l.join(), l2.join('|'));
  await p.click('#sanakirjat');
  await p.goto('about:blank');
  await p.goto(BASE + 'luin/sanaselitys.html');
  tulos('sanakirjat: valinta muistetaan (Monier-Williams)', await p.evaluate(() => document.querySelector('#sanakirjat').textContent === 'Monier-Williams'));
  await p.evaluate(() => localStorage.removeItem('luin-sanakirjat'));

  // Kapea kosketusruutu: ei vaakavieritystä, otsikko ja raksi eivät mene päällekkäin, näppäimistö pois haun jälkeen.
  const mctx = await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, deviceScaleFactor: KUVAT ? 2 : 1 });
  const mp = await mctx.newPage();
  mp.on('pageerror', e => sivuvirheet2.push(e.message));
  await mp.route('https://en.wiktionary.org/**', wikiReitti);
  await mp.route('https://tieteentermipankki.fi/**', tpReitti);
  for (const h of MUUT_ISANNAT) await mp.route(h, route => route.fulfill(muutVastaus(new URL(route.request().url()))));
  await mp.goto(BASE + 'luin/sanaselitys.html');
  await mp.tap('#sanakirjat');
  e = await mp.evaluate(() => { const l = document.querySelector('#sanakirjat-lista').getBoundingClientRect();
    return { vasen: l.left, oikea: l.right, ikkuna: innerWidth, leveys: document.documentElement.scrollWidth, rivit: [...document.querySelectorAll('#sanakirjat-lista button')].map(b => b.getBoundingClientRect().height),
      sk: document.querySelector('.sk-osa-valinta').getBoundingClientRect().left - document.querySelector('.rajaus label').getBoundingClientRect().left }; });
  tulos('sanakirjat 360 px: lista palstan sisällä (16 px laidoista), ei vaakavieritystä, rivit ≥ 44 px, taittunut rivi alkaa laidasta',
    e.vasen >= 15.5 && e.oikea <= e.ikkuna - 15.5 && e.leveys <= e.ikkuna && e.rivit.every(h => h >= 44) && Math.abs(e.sk) < .5, JSON.stringify(e));
  if (KUVAT) await mp.screenshot({ path: path.join(KUVAT, 'sivu-360-sanakirjat.png') });
  await mp.tap('h1');
  tulos('sanakirjat 360 px: napautus ohi sulkee listan', await mp.evaluate(() => document.querySelector('#sanakirjat-lista').hidden));
  await mp.fill('#sana', 'pratityasamutpadaa');
  await mp.press('#sana', 'Enter');
  await mp.waitForFunction(() => { const t = document.querySelector('#selitys .sk-runko'); return t && !/Haetaan/.test(t.textContent); }, null, { timeout: 5000 });
  await mp.waitForTimeout(150);
  e = await mp.evaluate(() => {
    const o = document.querySelector('#selitys .sk-o').getBoundingClientRect(), x = document.querySelector('#selitys .sk-sulje svg').getBoundingClientRect();
    return { leveys: document.documentElement.scrollWidth, ikkuna: innerWidth, paalle: o.right > x.left + .5, kentta: document.activeElement.id, ots: document.querySelector('#selitys .sk-o').textContent };
  });
  tulos('sivu 360 px: ei vaakavieritystä eikä päällekkäisyyttä, kenttä ei aktiivinen haun jälkeen', e.leveys <= e.ikkuna && !e.paalle && e.kentta !== 'sana', JSON.stringify(e));
  tulos('sivu: ilman kieltä viimeisenä loppunapsu ja majuminuluku (pratityasamutpadaa → pratītyasamutpāda)', e.ots === 'pratītyasamutpāda', e.ots);
  if (KUVAT) await mp.screenshot({ path: path.join(KUVAT, 'sivu-360.png'), fullPage: true });
  await mp.fill('#sana', 'adekvaatti');
  await mp.press('#sana', 'Enter');
  await mp.waitForFunction(() => document.querySelector('#selitys .sk-vaihto[data-k="sk-termi"]'), null, { timeout: 5000 });
  await mp.tap('#selitys .sk-vaihto[data-k="sk-termi"][data-i="1"]');
  await mp.waitForFunction(() => document.querySelector('#selitys .sk-ots button.sk-ety'), null, { timeout: 5000 });
  await mp.tap('#selitys .sk-ots button.sk-ety');
  await mp.waitForFunction(() => { const r = document.querySelector('#selitys .sk-ety-runko'); return r && !/Haetaan/.test(r.textContent); });
  e = await mp.evaluate(() => {
    const o = document.querySelector('#selitys .sk-o').getBoundingClientRect(), x = document.querySelector('#selitys .sk-sulje svg').getBoundingClientRect();
    return { leveys: document.documentElement.scrollWidth, ikkuna: innerWidth, paalle: o.right > x.left + .5, vast: document.querySelectorAll('#selitys .sk-vrivi').length };
  });
  tulos('sivu 360 px: termiselitys ja ΕΤΥΜΟΝ ilman vaakavieritystä ja päällekkäisyyttä', e.leveys <= e.ikkuna && !e.paalle && e.vast === 2, JSON.stringify(e));
  if (KUVAT) await mp.screenshot({ path: path.join(KUVAT, 'termi-360.png'), fullPage: true });
  await mctx.close();
  // Tumma teema luin-asetuksista kuten muilla alasivuilla.
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.teema = 'tumma'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await p.goto('about:blank');
  await p.goto(BASE + 'luin/sanaselitys.html#as');
  await odotaSivu(); await p.waitForTimeout(150);
  tulos('sivu: tumma teema lukimen asetuksista', await p.evaluate(() => document.documentElement.dataset.teema === 'tumma' && getComputedStyle(document.body).backgroundColor === 'rgb(18, 14, 11)'));
  await kuvaSivu('sivu-tumma');
  tulos('sivu: ei sivuvirheitä', !sivuvirheet2.length, sivuvirheet2.join(' | '));

  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
});
