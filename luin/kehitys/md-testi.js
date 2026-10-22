// md.js:n jäsennystesti ilman selainta. Ajo repon juuressa:
//   node luin/kehitys/md-testi.js
// Tarkistaa iA Writerin merkinnät (ia-merkinnat.md), Teologian tyylin mukaiset viitteet
// (kokoaViite), päivämäärät ja tekijät sekä sen, että kandidaatintutkielman ja kehittäjän oppaan
// rakenne pysyy ennallaan.
const fs = require('fs');
const path = require('path');
require(path.resolve(__dirname, '../md.js'));
const M = globalThis.LuinMD;

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (ok || tieto == null ? '' : ' – ' + tieto)); }
function sama(nimi, saatu, odotettu) { tulos(nimi, saatu === odotettu, JSON.stringify(saatu) + ' ≠ ' + JSON.stringify(odotettu)); }
const lkm = (s, re) => (s.match(re) || []).length;
const lue = p => fs.readFileSync(path.resolve(__dirname, p), 'utf8');

// iA Writerin merkinnät
const d = M.parse(lue('ia-merkinnat.md')), h = d.html;
sama('alaviitteet ([^…], [^tunnus], ^[…], sitaatit)', d.notes, 6);
tulos('alaviite tekstin seassa', h.includes('<span class="fnnum">1</span>Näin sanoo Koistinen 2013, 42</span>'));
tulos('alaviitteen määritelmä ja toinen kappale', h.includes('Ensimmäinen kappale jatkuu laiskasti.<br>Toinen kappale sisennettynä.'));
tulos('sitaatti ja paikannin', h.includes('Vanity Press, 2006, s. 23.</span>'));
sama('rivinvaihdot (\\, kaksi välilyöntiä, <br>)', lkm(/<p data-b="4">.*?<\/p>/.exec(h)[0], /<br>/g), 3);
tulos('otsikkolohkon kenoviiva pois tietoriviltä', d.lines[0] === 'Lokakuussa 2026', d.lines[0]);
tulos('yliviivaus, korostus, ylä- ja alaindeksit', h.includes('<del>yliviivattu</del>') && h.includes('<span class="korostus">korostettu</span>') &&
  h.includes('100m<sup>2</sup>') && h.includes('y<sup>(a+b)</sup>') && h.includes('H<sub>2</sub>O'));
tulos('suojaus', h.includes('Suojattu *tähti* ja ==.'));
tulos('paljas osoite ja sulut', h.includes('<a class="url" href="https://example.com/polku_(sulku)">https://example.com/polku_(sulku)</a>. ja'));
sama('sisäkkäiset luettelot kääreissä', lkm(h, /<li class="sisus">/g), 3);
tulos('lohkot eivät ole sisäkkäin', !/<li[^>]*data-b="\d+"[^>]*>(?:(?!<\/li>).)*<li[^>]*data-b/s.test(h));
tulos('numeroinnin jatko kääreen jälkeen', h.includes('<li value="2" data-b="20">Kaksi</li>'));
sama('tehtävät', lkm(h, /class="tehtava"/g) + ':' + lkm(h, /ruutu tehty/g), '2:1');
sama('taulukon rivit', lkm(h, /<tr data-b=/g), 3);
tulos('taulukon tasaus ja yhdistetty solu', h.includes('<td colspan="2" class="t-left">yhdistetty</td>') && h.includes('<th class="t-right">Oikea</th>'));
tulos('ristiviittaukset', h.includes('<a href="#luku-1">Rivit ja korostukset</a>') && h.includes('<a href="#nimioity-otsikko">luku 1</a>'));
tulos('viitelinkit', lkm(h, /href="https:\/\/example.com\/viite"/g) === 2);
tulos('etukentän muuttuja', h.includes('Muuttuja: Tusinasoft.'));
tulos('kuvat linkkeinä', d.kuvia === 2 && h.includes('<a class="kuva" href="https://example.com/logo.png">[kuva: Logo]</a>') && h.includes('<span class="kuva">[kuva]</span>'));
tulos('kommentit pois', !/kommentti|Tämäkään/.test(h));
tulos('{{TOC}} ja +++', h.includes('<div class="toc-paikka"></div>') && h.includes('<div class="sivunvaihto"'));
tulos('setext-otsikko', h.includes('<h2 id="setext-otsikko"'));
tulos('sisennetty koodi ja nelinkertainen aita', h.includes('<code>Sarkaimella sisennetty koodi.</code>') && h.includes('<code>```\naita aidan sisällä\n```</code>'));
tulos('matematiikan huomautus', d.warnings.some(w => /Matematiikkaa/.test(w.msg)));
sama('julkaisuaika tietoriviltä', d.paatelty.julkaistu, '2026-10');

// Muunnos iA Writerin alaviitteiksi
sama('^[…] → [^…]', M.iaAlaviitteet('A.^[B [c] d] `^[e]`\n```\n^[f]\n```\n'), 'A.[^B [c] d] `^[e]`\n```\n^[f]\n```\n');

// Etukenttä: MarkDownloadin oletuspohja ja täyttämättömät muuttujat
const ek = M.etukentta('---\ncreated: 2026-10-08T10:00:00 (UTC +03:00)\ntags: [a, b]\nsource: https://x.fi/a\nauthor: {byline}\nlist:\n  - yksi\n  - kaksi\n---\n\n# T');
sama('etukentän aliakset', [ek.meta.haettu, ek.meta['lähde'], ek.meta['tekijä'], ek.meta.list].join('|'), '2026-10-08T10:00:00 (UTC +03:00)|https://x.fi/a||yksi, kaksi');

// Päivämäärät
[['heinäkuussa 2026', '2026-07'], ['8.10.2026 klo 14.05', '2026-10-08 14.05'], ['2026-10-08T07:30:00+03:00', '2026-10-08 07.30'], ['2026-10-08 14.05', '2026-10-08 14.05'], ['8. lokakuuta 2026', '2026-10-08'],
  ['October 8, 2026', '2026-10-08'], ['10/2026', '2026-10'], ['7/26', '2026-07'], ['10 / 26', '2026-10'], ['31/12', ''], ['13/26', ''], ['lokakuu/2026', '2026-10'], ['2026', '2026']].forEach(x => sama('pvm ' + x[0], M.pvmIso(M.pvm(x[0])), x[1]));
sama('pvm viitteeseen', M.pvmMuoto(M.pvm('2017-04'), 'viite'), 'huhtikuu/2017');

// Tekijät
sama('tekijät', M.tekijat('Henna Punkkinen, Elina Merta & Nea Teerioja'), 'Punkkinen, Henna, Elina Merta & Nea Teerioja');
sama('tekijä käänteisenä', M.tekijat('Juutilainen, Olli'), 'Juutilainen, Olli');
sama('yhteisö', M.tekijat('Suomen evankelis-luterilainen kirkko'), 'Suomen evankelis-luterilainen kirkko');

// Teologian tyyli (2021) ja tutkielman kirjallisuusluettelo
const V = M.kokoaViite;
sama('viite: blogi', V({ tyyppi: 'blogi', 'tekijä': 'Risto Uro', julkaistu: '2017-04', otsikko: 'Auttaako evoluutio ymmärtämään uskontoa?', sivusto: 'Risto Uron blogi', 'lähde': 'http://blogs.helsinki.fi/uro/2017/04/', haettu: '2017-10-23' }),
  'Uro, Risto (2017). Auttaako evoluutio ymmärtämään uskontoa? *Risto Uron blogi* huhtikuu/2017. http://blogs.helsinki.fi/uro/2017/04/ (luettu 23.10.2017).');
sama('viite: verkkosivu ilman tekijää', V({ tyyppi: 'blogi', otsikko: 'Mitä usko on?', sivusto: 'Suomen evankelis-luterilainen kirkko', 'lähde': 'https://evl.fi/tutki-uskoa/mita-usko-on', haettu: '25.10.2017' }),
  'Mitä usko on? (s.a.). *Suomen evankelis-luterilainen kirkko*. https://evl.fi/tutki-uskoa/mita-usko-on (luettu 25.10.2017).');
sama('viite: opinnäyte', V({ tyyppi: 'tieteellinen', 'tekijä': 'Olli Juutilainen', julkaistu: '2026-07', otsikko: 'KANT JA ELÄINETIIKKA', alaotsikko: 'Muulajisten arvokkuutta etsimässä', laji: 'Uskonnonfilosofian kandidaatintutkielma', 'yhteisö': 'Helsingin yliopisto' }),
  'Juutilainen, Olli (2026). *Kant ja eläinetiikka: muulajisten arvokkuutta etsimässä*. Uskonnonfilosofian kandidaatintutkielma. Helsingin yliopisto.');
sama('viite: lehtiartikkeli', V({ tyyppi: 'tieteellinen', 'tekijä': 'Kreeta Ranki', julkaistu: '2011', otsikko: 'Miksi eläinten hyvinvoinnista tulisi välittää?', alaotsikko: 'Kantilainen näkökulma hyvinvointitutkimukseen', teos: 'Ajatus', numero: '68', sivut: '35–49' }),
  'Ranki, Kreeta (2011). Miksi eläinten hyvinvoinnista tulisi välittää? Kantilainen näkökulma hyvinvointitutkimukseen. *Ajatus* 68, 35–49.');
sama('viite: artikkeli toimitetussa teoksessa', V({ tyyppi: 'tieteellinen', 'tekijä': 'Nancy Evans Bush', julkaistu: '2009', otsikko: 'Distressing Western Near-Death Experiences', alaotsikko: 'Finding a Way through Abyss', teos: 'The Handbook of Near-Death Experiences: Thirty Years of Investigation', toimittaja: 'Janet M. Holden, Bruce Greyson & Debbie James', paikka: 'Santa Barbara, CA', kustantaja: 'Praeger', sivut: '63–86' }),
  'Bush, Nancy Evans (2009). Distressing Western Near-Death Experiences: Finding a Way through Abyss. *The Handbook of Near-Death Experiences: Thirty Years of Investigation*. Toim. Janet M. Holden, Bruce Greyson & Debbie James. Santa Barbara, CA: Praeger, 63–86.');
sama('viite: suomennos ja painos', V({ tyyppi: 'tieteellinen', 'tekijä': 'Aristoteles', julkaistu: '2005', otsikko: 'Nikomakhoksen etiikka', suomentaja: 'Simo Knuuttila', painos: '2. tarkistettu painos', paikka: 'Helsinki', kustantaja: 'Gaudeamus' }),
  'Aristoteles (2005). *Nikomakhoksen etiikka*. Suomentanut Simo Knuuttila. 2. tarkistettu painos. Helsinki: Gaudeamus.');
sama('viite: pelkkä otsikko', V({ otsikko: 'Muistiinpanoja' }), '*Muistiinpanoja*.');

// Kandidaatintutkielma ja kehittäjän opas: rakenne ennallaan (luvut 20.10.2026 ja 22.10.2026)
const k = M.parse(lue('../tekstit/kant-ja-elainetiikka.md'));
sama('tutkielma: rakenne', [lkm(k.html, /<h2 /g), lkm(k.html, /<h3 /g), lkm(k.html, /<blockquote>/g), lkm(k.html, /class="bib"/g), k.notes, k.blocks, k.warnings.length].join(' '), '6 8 8 21 52 105 0');
sama('tutkielma: tiedot', [k.title, k.sub, k.author, k.year].join(' | '), 'KANT JA ELÄINETIIKKA | Muulajisten arvokkuutta etsimässä | Olli Juutilainen | 2026');
sama('tutkielma: viite etukentästä', k.viite, 'Juutilainen, Olli (2026). *Kant ja eläinetiikka: muulajisten arvokkuutta etsimässä*. Uskonnonfilosofian kandidaatintutkielma. Helsingin yliopisto.');
const o = M.parse(lue('../ohje.md'));
tulos('opas: HTML-kommentti koodissa säilyy', o.html.includes('<code>&lt;!-- kohta: … --&gt;</code>'));

// Kehys: blogin nimi tai kaunokirjallisen kokoelma alaotsikon paikalla, ei toistoa tietorivillä.
const PITKA = '\n\nLeipätekstiä, joka on niin pitkä, ettei sitä lueta otsikkolohkon tietoriviksi missään tapauksessa, vaikka se onkin ensimmäinen kappale.';
const otsake = d => (/<header class="tt">([\s\S]*?)<\/header>/.exec(d.html) || [, ''])[1].replace(/ data-b="\d+"/g, '');
const kb = M.parse('---\ntyyppi: blogi\ntekijä: Maija Meikäläinen\nsivusto: Tusinablogi\njulkaistu: 2026-10\n---\n\n# Kirjoitus' + PITKA);
sama('kehys: blogin nimi alaotsikkona', otsake(kb), '<h1>Kirjoitus</h1><p class="sub">Tusinablogi</p><p class="meta">Maija Meikäläinen<br>lokakuu 2026</p>');
sama('kehys: kenttä', kb.kehys + ' / ' + kb.sub, 'Tusinablogi / ');
const kk = M.parse('---\ntyyppi: kaunokirjallinen\nteos: Sammakon seikkailut\n---\n\n# Sammakko ja kaivo' + PITKA);
sama('kehys: kaunokirjallisen kokoelma', otsake(kk), '<h1>Sammakko ja kaivo</h1><p class="sub">Sammakon seikkailut</p>');
const kt = M.parse('---\ntyyppi: tieteellinen\nteos: Ajatus\n---\n\n# Artikkeli' + PITKA);
sama('kehys: tieteellisen lehti tietorivillä', otsake(kt), '<h1>Artikkeli</h1><p class="meta">Ajatus</p>');
const ko = M.parse('---\ntyyppi: blogi\nsivusto: Tusinablogi\n---\n\n# Kirjoitus\n\n*Oma alaotsikko*\n\nMaija Meikäläinen' + PITKA);
sama('kehys: oma alaotsikko voittaa', otsake(ko) + ' / ' + ko.kehys, '<h1>Kirjoitus</h1><p class="sub">Oma alaotsikko</p><p class="meta">Maija Meikäläinen</p> / ');
const kr = M.parse('---\ntyyppi: blogi\nsivusto: Tusinablogi\n---\n\n# Kirjoitus\n\nMaija Meikäläinen\\\n8.10.2026' + PITKA);
sama('kehys: tekstin tietorivien edellä', otsake(kr), '<h1>Kirjoitus</h1><p class="sub">Tusinablogi</p><p class="meta">Maija Meikäläinen<br>8.10.2026</p>');
const ke = M.parse('---\notsikko: Kirjoitus\nsivusto: Tusinablogi\n---' + PITKA);
sama('kehys: etukentän otsikko, tyyppi määrittelemättä', otsake(ke), '<h1>Kirjoitus</h1><p class="sub">Tusinablogi</p>');

console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
process.exit(virheita ? 1 : 0);
