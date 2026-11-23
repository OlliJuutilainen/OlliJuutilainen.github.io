// md.js:n jäsennystesti ilman selainta. Ajo repon juuressa:
//   node luin/kehitys/md-testi.js
// Tarkistaa iA Writerin merkinnät (ia-merkinnat.md), Teologian tyylin mukaiset viitteet
// (kokoaViite), päivämäärät ja tekijät sekä sen, että kandidaatintutkielman ja Dialectic of Enlightenmentin
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
sama('rivinvaihdot (\\, kaksi välilyöntiä, <br>)', lkm(/<p (?:class="rivit" )?data-b="4">.*?<\/p>/.exec(h)[0], /<br>/g), 3);
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
// Lyhyt solu (≤ 16 merkkiä) on td.lyhyt: taulukon asettelu ei kutista sitä lukua kapeammaksi.
tulos('taulukon tasaus, yhdistetty ja lyhyt solu', h.includes('<td colspan="2" class="t-left lyhyt">yhdistetty</td>') && h.includes('<th class="t-right lyhyt">Oikea</th>'));
tulos('ristiviittaukset', h.includes('<a href="#luku-1">Rivit ja korostukset</a>') && h.includes('<a href="#nimioity-otsikko">luku 1</a>'));
tulos('viitelinkit', lkm(h, /href="https:\/\/example.com\/viite"/g) === 2);
tulos('etukentän muuttuja', h.includes('Muuttuja: Tusinasoft.'));
tulos('kuvat linkkeinä', d.kuvia === 2 && h.includes('<a class="kuva" href="https://example.com/logo.png">[kuva: Logo]</a>') && h.includes('<span class="kuva">[kuva]</span>'));
tulos('kommentit pois', !/kommentti|Tämäkään/.test(h));
tulos('{{TOC}} ja +++', h.includes('<div class="toc-paikka"></div>') && h.includes('<div class="sivunvaihto"'));
// Lyhyt numeroimaton loppuosio numeroitujen lukujen perässä on sivuseikka (alalukuna, ks. alempana).
tulos('setext-otsikko', h.includes('<h3 id="setext-otsikko" class="sec caps"'));
tulos('sisennetty koodi ja nelinkertainen aita', h.includes('<code>Sarkaimella sisennetty koodi.</code>') && h.includes('<code>```\naita aidan sisällä\n```</code>'));
tulos('matematiikan huomautus', d.warnings.some(w => /Matematiikkaa/.test(w.msg)));
sama('julkaisuaika tietoriviltä', d.paatelty.julkaistu, '2026-10');

// Muunnos iA Writerin alaviitteiksi
sama('^[…] → [^…]', M.iaAlaviitteet('A.^[B [c] d] `^[e]`\n```\n^[f]\n```\n'), 'A.[^B [c] d] `^[e]`\n```\n^[f]\n```\n');

// Etukenttä: MarkDownloadin oletuspohja ja täyttämättömät muuttujat
const ek = M.etukentta('---\ncreated: 2026-10-08T10:00:00 (UTC +03:00)\ntags: [a, b]\nsource: https://x.fi/a\nauthor: {byline}\nlist:\n  - yksi\n  - kaksi\n---\n\n# T');
sama('etukentän aliakset', [ek.meta.haettu, ek.meta['lähde'], ek.meta['tekijä'], ek.meta.list].join('|'), '2026-10-08T10:00:00 (UTC +03:00)|https://x.fi/a||yksi, kaksi');

// Päivämäärät
[['heinäkuussa 2026', '2026-07'], ['8.10.2026 klo 14.05', '2026-10-08 14:05'], ['2026-10-08T07:30:00+03:00', '2026-10-08 07:30'], ['2026-10-08 14:05', '2026-10-08 14:05'], ['8. lokakuuta 2026', '2026-10-08'],
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
  'Juutilainen, Olli (2026). *Kant ja eläinetiikka: Muulajisten arvokkuutta etsimässä*. Uskonnonfilosofian kandidaatintutkielma. Helsingin yliopisto.');
sama('viite: lehtiartikkeli', V({ tyyppi: 'tieteellinen', 'tekijä': 'Kreeta Ranki', julkaistu: '2011', otsikko: 'Miksi eläinten hyvinvoinnista tulisi välittää?', alaotsikko: 'Kantilainen näkökulma hyvinvointitutkimukseen', teos: 'Ajatus', numero: '68', sivut: '35–49' }),
  'Ranki, Kreeta (2011). Miksi eläinten hyvinvoinnista tulisi välittää? Kantilainen näkökulma hyvinvointitutkimukseen. *Ajatus* 68, 35–49.');
sama('viite: artikkeli toimitetussa teoksessa', V({ tyyppi: 'tieteellinen', 'tekijä': 'Nancy Evans Bush', julkaistu: '2009', otsikko: 'Distressing Western Near-Death Experiences', alaotsikko: 'Finding a Way through Abyss', teos: 'The Handbook of Near-Death Experiences: Thirty Years of Investigation', toimittaja: 'Janet M. Holden, Bruce Greyson & Debbie James', paikka: 'Santa Barbara, CA', kustantaja: 'Praeger', sivut: '63–86' }),
  'Bush, Nancy Evans (2009). Distressing Western Near-Death Experiences: Finding a Way through Abyss. *The Handbook of Near-Death Experiences: Thirty Years of Investigation*. Toim. Janet M. Holden, Bruce Greyson & Debbie James. Santa Barbara, CA: Praeger, 63–86.');
sama('viite: suomennos ja painos', V({ tyyppi: 'tieteellinen', 'tekijä': 'Aristoteles', julkaistu: '2005', otsikko: 'Nikomakhoksen etiikka', suomentaja: 'Simo Knuuttila', painos: '2. tarkistettu painos', paikka: 'Helsinki', kustantaja: 'Gaudeamus' }),
  'Aristoteles (2005). *Nikomakhoksen etiikka*. Suomentanut Simo Knuuttila. 2. tarkistettu painos. Helsinki: Gaudeamus.');
sama('viite: pelkkä otsikko', V({ otsikko: 'Muistiinpanoja' }), '*Muistiinpanoja*.');

// Teologian tyylin alaviitemuodot linkittyvät luetteloon (28.10.2026): A & B, A et al., saman tekijän seuraava vuosi.
const tl = M.parse('# T\n\nA.[^1] B.[^2] C.[^3] D.[^4] E.[^5]\n\n[^1]: Punkkinen et al. 2012, 1776–1777.\n[^2]: Allison 1993, 45–46; 2010, 31.\n' +
  '[^3]: Tuhkanen 2013a; 2013b.\n[^4]: McLoughlin & Lertola 2014, 70–71.\n[^5]: Arffman 2004, 125; Tov 2015, 6.\n\n## Kirjallisuus\n\n' +
  'Allison, Dale (1993). *Eka*.\n\nAllison, Dale (2010). *Toka*.\n\nArffman, Kaarlo (2004). *Kristinuskon historia*. Helsinki: Edita.\n\n' +
  'McLoughlin, Laura Incalcaterra & Jennifer Lertola (2014). Nimi. *Lehti* 8:1, 70–83.\n\n' +
  'Punkkinen, Henna, Elina Merta, Nea Teerioja, Katja Moliis & Eveliina Kuvaja (2012). Nimi. *Lehti* 32:10, 1775–1781.\n\n' +
  'Tov, Emanuel (2015). Nimi. *Open Theology* 1:1.\n\nTuhkanen, Ari (2013a). Eka.\n\nTuhkanen, Ari (2013b). Toka.\n');
sama('tyylin alaviitteet linkittyvät', (tl.html.match(/<a class="lahde" href="#([^"]+)">([^<]*)<\/a>/g) || []).map(x => /#([^"]+)">([^<]*)/.exec(x).slice(1).join('=')).join(' | '),
  'kirj-punkkinen-2012=Punkkinen et al. 2012 | kirj-allison-1993=Allison 1993 | kirj-allison-2010=2010 | kirj-tuhkanen-2013a=Tuhkanen 2013a | ' +
  'kirj-tuhkanen-2013b=2013b | kirj-mcloughlin-2014=McLoughlin &amp; Lertola 2014 | kirj-arffman-2004=Arffman 2004 | kirj-tov-2015=Tov 2015');

// Kandidaatintutkielma ja kehittäjän opas: rakenne ennallaan (luvut 20.10.2026 ja 22.10.2026; 29.10.2026 Kirjallisuus
// alalukuna, h2 6 → 5 ja h3 8 → 9)
const k = M.parse(lue('../tekstit/kant-ja-elainetiikka.md'));
sama('tutkielma: rakenne', [lkm(k.html, /<h2 /g), lkm(k.html, /<h3 /g), lkm(k.html, /<blockquote>/g), lkm(k.html, /class="bib"/g), k.notes, k.blocks, k.warnings.length].join(' '), '5 9 8 21 52 105 0');
sama('tutkielma: Kirjallisuus alalukuna', k.toc.filter(t => t.alas).map(t => t.lvl + ' ' + t.text).join(), '2 Kirjallisuus');

// Sivuseikkojen pääluvut (käyttäjän pyyntö 29.10.2026): vain tukevalla päälukurungolla.
{
  const proosa = n => Array.from({ length: n }, (_, i) => 'Leipätekstiä, jossa on asiaa ' + i + ' ja jatkoa niin, että kappale on proosaa eikä lyhyt rivi. '.repeat(4)).join('\n\n');
  const luku = (ots, n) => '## ' + ots + '\n\n' + proosa(n) + '\n\n';
  const tasot = md => M.parse(md).toc.map(t => t.lvl + (t.alas ? '*' : '') + ' ' + t.text).join(' | ');
  const sep = '# T\n\n' + luku('1. Johdanto', 4) + luku('2. Teoria', 6) + '### 2.1 Osa\n\n' + proosa(2) + '\n\n' + luku('3. Kritiikki', 5) +
    '## Bibliography\n\n### Primary\n\nKant, I. (1785). *Grundlegung*.\n\n## Academic Tools\n\n> [How to cite](https://e.org/c).\n\n' +
    '## Other Internet Resources\n\n- [A](https://a.org)\n- [B](https://b.org)\n\n## Related Entries\n\n[Kant](https://e.org/kant) | [ethics](https://e.org/e)\n';
  sama('sivuseikat: SEP:n loppu alalukuina', tasot(sep), '1 1. Johdanto | 1 2. Teoria | 2 2.1 Osa | 1 3. Kritiikki | 2* Bibliography | 3* Primary | 2* Academic Tools | 2* Other Internet Resources | 2* Related Entries');
  // Ylin taso käyttämättä (pilotti 7.11.2026): korkeintaan kaksi tasoa ja yli 10 lukua → osiot ja kohdat, alennus perutaan.
  const monta = n => '# T\n\n' + Array.from({ length: n }, (_, i) => luku((i + 1) + '. L' + (i + 1), 1)).join('') + '## Bibliography\n\n### Primary\n\nKant, I. (1785). *Grundlegung*.\n';
  sama('ylin taso: 11 lukua osioiksi', tasot(monta(11)).split(' | ').slice(-4).join(' | '), '2 10. L10 | 2 11. L11 | 2 Bibliography | 3 Primary');
  tulos('ylin taso: laskettu-lippu ja h3/h4', M.parse(monta(11)).laskettu && M.parse(monta(11)).html.includes('<h4 id="primary"'));
  sama('ylin taso: 10 lukua pysyy', tasot(monta(10)).split(' | ').slice(-3).join(' | '), '1 10. L10 | 2* Bibliography | 3* Primary');
  sama('ylin taso: kolme tasoa pysyy', tasot(monta(11).replace('## 2. L2\n', '## 2. L2\n\n### 2.1 A\n\n#### 2.1.1 B\n')).split(' | ').slice(0, 2).join(' | '), '1 1. L1 | 1 2. L2');
  // Iso kirjallisuusosio luvuksi (käyttäjän sääntö 7.11.2026): ≥ 25 % otsikosta tekstin loppuun.
  const kohta = 'Kant, I. (1785). *Grundlegung zur Metaphysik der Sitten*. Riga: Hartknoch, Johann Friedrich.\n\n';
  const bibOsa = k => '## Bibliography\n\n### Primary\n\n' + kohta.repeat(k) + '### Secondary\n\n' + kohta.repeat(k) + '## Other Internet Resources\n\n- [A](https://a.org)\n';
  const lopputasot = md => M.parse(md).toc.map(t => t.lvl + (t.alas ? '*' : '') + (t.laskettu ? 'L' : '') + ' ' + t.text).slice(-5).join(' | ');
  sama('iso kirjallisuus: pieni pysyy osiona', lopputasot(monta(11).replace(/## Bibliography[^]*$/, '') + bibOsa(5)),
    '2L 11. L11 | 2L Bibliography | 3L Primary | 3L Secondary | 2L Other Internet Resources');
  sama('iso kirjallisuus: luku ja alaotsikot osioita (ylin taso käyttämättä)', lopputasot(monta(11).replace(/## Bibliography[^]*$/, '') + bibOsa(10)),
    '2L 11. L11 | 1 Bibliography | 2 Primary | 2 Secondary | 2L Other Internet Resources');
  sama('iso kirjallisuus: sivuseikkojen alennus perutaan', lopputasot('# T\n\n' + [1, 2, 3, 4].map(i => luku(i + '. L' + i, 1)).join('') + bibOsa(5)),
    '1 4. L4 | 1 Bibliography | 2 Primary | 2 Secondary | 2* Other Internet Resources');
  tulos('iso kirjallisuus: h2 ja p.bib', (h => h.includes('<h2 id="bibliography"') && h.includes('<h3 id="primary"') && lkm(h, /class="bib"/g) === 20)(M.parse(monta(11).replace(/## Bibliography[^]*$/, '') + bibOsa(10)).html));
  const sd = M.parse(sep);
  tulos('sivuseikat: kirjallisuusluettelo säilyy', lkm(sd.html, /class="bib"/g) === 1 && sd.html.includes('<h3 id="bibliography" class="sec caps"') && sd.html.includes('<h4 id="primary" class="sec caps"'));
  sama('sivuseikat: lyhyt numeroimaton linkkiosio', tasot('# T\n\n' + luku('1. A', 3) + luku('2. B', 3) + luku('3. C', 3) + '## Linkit\n\n- [x](https://x.fi)\n'),
    '1 1. A | 1 2. B | 1 3. C | 2* Linkit');
  sama('sivuseikat: alun tiivistelmä ja lyhenteet', tasot('# T\n\n' + luku('Tiivistelmä', 1) + luku('Lyhenteet', 1) + luku('Johdanto', 3) + luku('1. A', 3) + luku('2. B', 3)),
    '2* Tiivistelmä | 2* Lyhenteet | 1 Johdanto | 1 1. A | 1 2. B');
  sama('sivuseikat: proosallinen numeroimaton yhteenveto on luku', tasot('# T\n\n' + luku('1. A', 3) + luku('2. B', 3) + luku('3. C', 3) + luku('Yhteenveto', 1) + luku('Lähteet', 1)),
    '1 1. A | 1 2. B | 1 3. C | 1 Yhteenveto | 2* Lähteet');
  sama('sivuseikat: alle kolme lukua, ei muutosta', tasot('# T\n\n' + luku('1. A', 5) + luku('2. B', 5) + luku('Kirjallisuus', 1) + luku('Liitteet', 1)),
    '1 1. A | 1 2. B | 1 Kirjallisuus | 1 Liitteet');
  sama('sivuseikat: liitteissä yli kolmannes, ei muutosta', tasot('# T\n\n' + luku('1. A', 2) + luku('2. B', 2) + luku('3. C', 2) + luku('Liitteet', 4) + luku('Kirjallisuus', 1)),
    '1 1. A | 1 2. B | 1 3. C | 1 Liitteet | 1 Kirjallisuus');
  sama('sivuseikat: keskellä ei alenneta', tasot('# T\n\n' + luku('1. A', 3) + luku('Kiitokset', 1) + luku('2. B', 3) + luku('3. C', 3)),
    '1 1. A | 1 Kiitokset | 1 2. B | 1 3. C');
  sama('sivuseikat: numeroimattomat lyhyet luvut (runot) pysyvät', tasot('# T\n\n' + ['Syksy', 'Talvi', 'Kevät', 'Kesä'].map(x => '## ' + x + '\n\nLyhyt rivi\\\ntoinen rivi\n\n').join('')),
    '1 Syksy | 1 Talvi | 1 Kevät | 1 Kesä');
}
sama('tutkielma: tiedot', [k.title, k.sub, k.author, k.year].join(' | '), 'KANT JA ELÄINETIIKKA | Muulajisten arvokkuutta etsimässä | Olli Juutilainen | 2026');
sama('tutkielma: viite etukentästä', k.viite, 'Juutilainen, Olli (2026). *Kant ja eläinetiikka: Muulajisten arvokkuutta etsimässä*. Uskonnonfilosofian kandidaatintutkielma. Helsingin yliopisto.');
const o = M.parse('# Opas\n\n- Kirjanmerkin perässä on HTML-kommentti `<!-- kohta: … -->` (enintään 40 merkin katkelma).');
tulos('HTML-kommentti koodissa säilyy', o.html.includes('<code>&lt;!-- kohta: … --&gt;</code>'));

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

// Pdf:stä muunnetun kirjan tietorivit (muller_md.py) ja hegelin pdf_to_markdown.py:n etukenttä (Crossref).
const pk = M.parse('# Müller, *Kantianism for Animals*\n\nNico Dario Müller, *Kantianism for Animals: A Radical Kantian Animal Ethic*.\n' +
  'Cham: Palgrave Macmillan 2022. ISBN 978-3-031-01929-6.\nDOI 10.1007/978-3-031-01930-2. Lisenssi CC BY 4.0.' + PITKA);
sama('pdf-kirja: ISBN ei ole päiväys', pk.tiedot.julkaistu, '2022');
sama('pdf-kirja: tietorivien tiedot', JSON.stringify([pk.tiedot['tekijä'], pk.tiedot.otsikko, pk.tiedot.alaotsikko, pk.tiedot.paikka, pk.tiedot.kustantaja, pk.tiedot.doi]),
  JSON.stringify(['Nico Dario Müller', 'Kantianism for Animals', 'A Radical Kantian Animal Ethic', 'Cham', 'Palgrave Macmillan', '10.1007/978-3-031-01930-2']));
const pl = M.parse('# Müller, *Muu teos*\n\nNico Dario Müller, *Kantianism for Animals: A Radical Kantian Animal Ethic*.' + PITKA);
sama('pdf-kirja: eri teoksen lyhyt nimi ei ole otsikko', pl.tiedot.otsikko, 'Müller, Muu teos');
const ph = M.parse('---\ntype: academic\ntitle: The Meaning of Proper Names\nauthor: Sidney Zink\ndate: 1963\njournal: Mind\nvolume: LXXII\nissue: 288\n' +
  'pages: 481–499\ndoi: 10.1093/mind/LXXII.288.481\n---' + PITKA);
sama('hegel: artikkelin viite', ph.viite, 'Zink, Sidney (1963). The Meaning of Proper Names. *Mind* LXXII:288, 481–499. DOI: 10.1093/mind/LXXII.288.481.');
const pc = M.parse('---\ntype: academic\ntitle: Luku\nauthor: A B\ndate: 2022\nbooktitle: Kirja\npages: 59–86\nplace: Cham\npublisher: Palgrave Macmillan\n---' + PITKA);
sama('hegel: luvun teos ja paikka', JSON.stringify([pc.tiedot.tyyppi, pc.tiedot.teos, pc.tiedot.paikka]), JSON.stringify(['tieteellinen', 'Kirja', 'Cham']));

// Lainauksen lähde ja motto (muoto C ja lainauksen sisäinen tyhjä rivi)
const lv = s => M.parse('# T\n\n' + s).html.replace(/^.*?<\/header>/, '');
sama('motto kenoviivalla', lv('> Sä loit.\\\n> – *Ihmebantu* (n. 2008)\n\nLeipä.\n'),
  '<figure class="lainaus motto"><blockquote><p data-b="1">Sä loit.</p></blockquote><figcaption data-b="2">– <em>Ihmebantu</em> (n. 2008)</figcaption></figure><p data-b="3">Leipä.</p>');
tulos('lähde tyhjän >-rivin jälkeen', lv('> Sä loit.\n>\n> — X\n').includes('<figcaption data-b="2">— X</figcaption>'));
tulos('ei lähdettä ilman pakotettua rivinvaihtoa', lv('> Sä loit.\n> – X\n').includes('<blockquote><p data-b="1">Sä loit. – X</p></blockquote>'));
tulos('vuorosanat eivät ole lähde', !lv('> – Mennään.\n>\n> – Mennään vaan.\n').includes('figcaption'));
tulos('leipätekstin lainaus ei ole motto', lv(PITKA.trim() + '\n\n> L.\\\n> – X\n').includes('<figure class="lainaus"><blockquote>'));
sama('Latomo: erillinen lähde lainaukseen', M.lahteetLainaukseen('# T\n\n> Sä loit.\n\n– *I* (n. 2008) \\\n\\\n\\\n\nLeipä.\n'), '# T\n\n> Sä loit.\\\n> – *I* (n. 2008)\n\nLeipä.\n');
sama('Latomo: lähde omana lainauksenaan', M.lahteetLainaukseen('# T\n\n> Sä loit.\n\n> – X\n'), '# T\n\n> Sä loit.\\\n> – X\n');


// Yläindeksiin linkitetty merkki (Latomon <sup>-muunnos) ei ole ^[…]-alaviite; HTML-huomautukset riveittäin.
const yl = M.parse('# T\n\nA.^\\[[7](https://e.org/n.html#note-7)\\]^ B^[2](https://e.org/x)^ C^[[3](u)]^ D^[oikea alaviite] E.\n');
// Alaviitteen osoitteeseen (#note-7) linkitetty merkki on 30.10.2026 alkaen Luinin alaviite (sivun omat viitenumerot, alla).
sama('linkitetty yläindeksi ei ole ^[…]-alaviite', yl.notes, 2);
tulos('linkitetty yläindeksi', yl.html.includes('A.<label class="fnref" for="fn1">1</label>') && yl.html.includes('Alaviitteen 7 teksti on lähteen omalla sivulla') &&
  yl.html.includes(' B<sup><a href="https://e.org/x">2</a></sup> C<sup>[<a href="u">3</a>]</sup> D<label'), yl.html);
const hv = M.parse('# T\n\nA<sup>[<a href="u">1</a>]</sup> ja <b>x</b>.\n\nB <i>y</i>.\n').warnings.map(w => w.ln + ' ' + w.msg);
sama('HTML-huomautus riviä kohden', JSON.stringify(hv), JSON.stringify(['3 6 HTML-merkintää näkyy tekstinä: <sup>, <a>, <b>.', '5 2 HTML-merkintää näkyy tekstinä: <i>.']));

// Lyhyt proosavirke otsikon alla on leipätekstiä, ei tietorivi (käyttäjän pyyntö 12.11.2026, Wait But Why): tekijä etukentästä.
const proosa = M.parse('---\ntekijä: Tim Urban\njulkaistu: 2017-04-20\n---\n# Neuralink\n\nLast month, I got a phone call.\n\nToinen kappale.\n');
sama('proosavirke: tietorivit etukentästä', JSON.stringify(proosa.lines), JSON.stringify(['Tim Urban', '20.4.2017']));
tulos('proosavirke: leipätekstinä otsikkolohkon jälkeen', /<\/header><p[^>]*>Last month, I got a phone call\.<\/p>/.test(proosa.html), proosa.html.slice(0, 300));
sama('proosavirke: kysymys ja kaksoispisteeseen päättyvä', [M.tietorivi('What does it feel like?'), M.tietorivi('Ohje on siirtynyt kahdeksi verkkosivuksi:')].join(), 'false,false');
sama('tietorivi: nimi, päiväys, vuosi, suomentaja ja lyhyt pisteellinen säilyvät', ['Graham J. Hitch & Alan D. Baddeley', 'Julkaistu 5.5.2018',
  'Uskonnonfilosofian kandidaatintutkielma Helsingin yliopistossa heinäkuussa 2026.', 'Englannista suomentanut Markku Roinila.', 'Ensimmäinen kokeiluversio, lokakuu 2026.', 'Karl Marx.']
  .map(M.tietorivi).join(), 'true,true,true,true,true,true');
// Kursivoitu julkaisutieto otsikon alla on tietorivi, ei alaotsikko (SEP); julkaistu on luettu versio, tekijä etukentästä.
const sep4 = M.parse('---\ntekijä: Hildebrand, David\n---\n\n# John Dewey\n\n*First published Thu Nov 1, 2018; substantive revision Sun Mar 31, 2024*\n\n' + PITKA);
sama('julkaisutieto: ei alaotsikkoa', sep4.sub, '');
sama('julkaisutieto: tietorivit', JSON.stringify(sep4.lines), JSON.stringify(['Hildebrand, David', 'First published Thu Nov 1, 2018; substantive revision Sun Mar 31, 2024']));
sama('julkaisutieto: luettu versio', sep4.paatelty.julkaistu, '2024-03-31');
sama('kursivoitu alaotsikko ennallaan', M.parse('# T\n\n*Kirjoitus vuodelta 2018*\n\n' + PITKA).sub, 'Kirjoitus vuodelta 2018');

// Verkkolinkit: osoitteen näköinen linkkiteksti on url (katkeaa mistä tahansa), doi:10.… linkittyy doi.org:iin (29.10.2026).
// Kirjallisuusluettelon linkeillä ei ole poikkeusta (käyttäjän päätös 30.10.2026: kytkin koskee kaikkia).
const vl = M.parse('# T\n\nKatso [luku 3](https://e.org/a#c), <https://e.org/b> ja doi:10.1000/xyz\\_1.\n\n## Bibliography\n\n' +
  '- Aho, A., 2001, *Kirja*. URL = <[https://e.org/arkisto/kirja/][1]\\>\n\n[1]: https://e.org/arkisto/kirja/\n').html;
sama('verkkolinkkien luokat', (vl.match(/<a[^>]*>[^<]*<\/a>/g) || []).join('\n'), [
  '<a href="https://e.org/a#c">luku 3</a>', '<a class="url" href="https://e.org/b">https://e.org/b</a>',
  '<a class="url" href="https://doi.org/10.1000/xyz_1">doi:10.1000/xyz_1</a>',
  '<a class="url" href="https://e.org/arkisto/kirja/">https://e.org/arkisto/kirja/</a>'].join('\n'));

// Tekstin omaan sivuun osoittavat linkit Luinin sisäisiksi (käyttäjän pyyntö 30.10.2026): ankkuri otsikkoon linkin nimen tai
// luvun numeron perusteella; tuntematon jää verkkolinkiksi.
const si = M.parse('---\nlähde: https://e.org/art/\n---\n\n# T\n\n- [1. Alku][1]\n- [2.1 Osa][2]\n\nKatso [kohta 2.1][2], [luku 1](https://e.org/art/#x9), ' +
  '[tuntematon][3] ja [muu sivu](https://e.org/toinen/#Alku).\n\n## 1. Alku\n\nA.\n\n## 2. Keski\n\n### 2.1 Osa\n\nB.\n\n' +
  '[1]: https://e.org/art//#Alku\n[2]: https://e.org/art/index.html#Osa\n[3]: https://e.org/art/#Zzz\n').html;
// Lähdeosion osoite (lahdeOsio()) jää vertailun ulkopuolelle; sitä mitataan alempana.
sama('sisäiset linkit', (si.split('<h4 id="lahde"')[0].match(/<a[^>]*>[^<]*<\/a>/g) || []).join('\n'), ['<a href="#luku-1">1. Alku</a>', '<a href="#luku-2-1">2.1 Osa</a>',
  '<a href="#luku-2-1">kohta 2.1</a>', '<a href="#luku-1">luku 1</a>', '<a href="https://e.org/art/#Zzz">tuntematon</a>',
  '<a href="https://e.org/toinen/#Alku">muu sivu</a>'].join('\n'));

// Verkkosivun omat viitenumerot Luinin alaviitteiksi (käyttäjän pyyntö 30.10.2026). SEP: merkki linkkinä erilliselle Notes-sivulle;
// ilman sivua alaviite kertoo sen, liitetyllä Notes-sivun leikkeellä teksti tulee siitä ja osion otsikko etukenttineen jää pois.
const SEP = '---\nlähde: https://plato.stanford.edu/entries/x/\n---\n\n# X\n\nYksi.^\\[[1](https://plato.stanford.edu/entries/x/notes.html#note-1)\\]^ ' +
  'Kaksi.^\\[[2](https://plato.stanford.edu/entries/x/notes.html#note-2)\\]^ Potenssi 10^2^.\n';
const sp1 = M.parse(SEP);
tulos('SEP: viitenumerot alaviitteiksi ilman Notes-sivua', sp1.notes === 2 && sp1.html.includes('Alaviitteen 1 teksti on lähteen omalla sivulla') && sp1.html.includes('10<sup>2</sup>'), sp1.html);
const sp2 = M.parse(SEP + '\n---\nlähde: https://plato.stanford.edu/entries/x/notes.html\n---\n\n# X > Notes (Stanford Encyclopedia of Philosophy)\n\n' +
  '[1.][1] Ensimmäinen viite.\n\n[2.][2] Toinen alkaa\n\n> lainaus jatkuu.\n\n[1]: https://plato.stanford.edu/entries/x/index.html#ref-1\n');
tulos('SEP: Notes-sivun leike alaviitteiksi', sp2.notes === 2 && sp2.html.includes('<span class="fnnum">1</span>Ensimmäinen viite.</span>') &&
  sp2.html.includes('<span class="fnnum">2</span>Toinen alkaa<br>lainaus jatkuu.</span>') && sp2.toc.filter(t => t.text !== 'Lähde').length === 0 && !/Notes|lähde:/.test(sp2.html), sp2.html);

// Lähdeosio (käyttäjän vaatimus 21.11.2026): verkosta haetun tekstin loppuun lähde sanoin ja osoitteena tekijänoikeuksien edelle.
const lo = M.parse('---\nsivusto: J. V. Snellmanin kootut teokset\nylläpitäjä: Snellman-instituutti\npolku: Dokumentit › Essee\n' +
  'lähde: https://snellman.kootutteokset.fi/fi/dokumentit/teosofia-hahmotelma-1826%E2%80%9328\nhaettu: 2026-11-21\n' +
  'alkuteksti: https://snellman.kootutteokset.fi/sites/default/files/01085.pdf\noikeudet: CC BY 4.0\n---\n\n# T\n\nTeksti.\n');
sama('lähdeosio', lo.html.slice(lo.html.indexOf('<h4 id="lahde"'), lo.html.indexOf('<h4 id="tekijanoikeudet"')),
  '<h4 id="lahde" class="sec caps" data-b="3">Lähde</h4><p class="oik" data-b="4">Teksti on haettu lukimeen 21.11.2026 sivustolta ' +
  '<em>J. V. Snellmanin kootut teokset</em> (ylläpitäjä Snellman-instituutti), osastosta Dokumentit › Essee.<br>' +
  'Osoite:<br><a href="https://snellman.kootutteokset.fi/fi/dokumentit/teosofia-hahmotelma-1826%E2%80%9328">' +
  'snellman.kootutteokset.fi/fi/dokumentit/teosofia-hahmotelma-1826–28</a><br>Alkukielinen teksti (pdf):<br>' +
  '<a href="https://snellman.kootutteokset.fi/sites/default/files/01085.pdf">snellman.kootutteokset.fi/sites/default/files/01085.pdf</a></p>');
// Asiakirja (21.11.2026, Snellmanin kirjeet ja sähkeet): ladonta: asiakirja pitää alun lyhyet rivit tekstissä, ja otsikkolohkon
// tiedot tulevat etukentästä; ilman sitä rivit ovat tietorivejä.
const ak = '---\ntekijä: Alexander Armfelt\nlaji: Virkakirje, sähke\njulkaistu: 1863-08-28\nladonta: asiakirja\n---\n\n# T\n\nSenaattori Snellman\n\nHelsinki\n\n' +
  'Senaatin esitykseen on suostuttu.\n';
const ak1 = M.parse(ak), ak2 = M.parse(ak.replace('ladonta: asiakirja\n', ''));
tulos('ladonta: asiakirja: alun rivit tekstiin, tietorivit etukentästä', ak1.lines.join(' / ') === 'Alexander Armfelt / Virkakirje, sähke, 28.8.1863' &&
  /<p (?:class="rivit" )?data-b="\d+">Senaattori Snellman<\/p>/.test(ak1.html) && ak2.lines.join(' / ') === 'Senaattori Snellman / Helsinki', ak1.lines.join(' / ') + ' | ' + ak2.lines.join(' / '));
// Rivitetty kappale (käyttäjän linjaus 21.11.2026: sisennys vain leipätekstiin): kenoviivarivinvaihdot tai lyhyt yksirivinen
// ilman välimerkkiä lopussa on p.rivit; virke, repliikki, osanvaihto, lähdeosio ja kirjallisuus eivät.
const rv = M.parse('---\nlähde: https://example.org/x\nladonta: asiakirja\n---\n\n# T\n\nKokkolassa 26.9.1827\\\nHerra Joh. Wilh. Snellman\\\nTurku\n\n' +
  'Olet siis toisen kerran nähnyt maailman hirvittävimpiin kuuluvan tulipalon.\n\nRakas veli\n\nNiin.\n\n”Ei kai\n\n–––\n\nAugust\n');
sama('rivitetty kappale', (rv.html.match(/<p[^>]*data-b="\d+">[^<]*/g) || []).map(x => (/class="rivit"/.test(x) ? 'R ' : '- ') + x.replace(/<[^>]*>/, '').slice(0, 12)).join(' | '),
  'R Kokkolassa 2 | - Olet siis to | R Rakas veli | - Niin. | - ”Ei kai | - ––– | R August | - Teksti on ha');
// Kuvateksti: kokonaan kursiivinen kappale, joka alkaa tunnisteella, on p.kuvateksti, tunniste pystyssä;
// taulukon edellä kt-taulukko. Ilman tunnistetta kursiivikappale (How this fits in) ja tunnisteella alkava leipäteksti eivät ole.
const kuvt = M.parse('# T\n\nLeipäteksti on tässä niin pitkä, ettei se ole otsikkolohkon tietorivi vaan leipätekstiä.\n\n' +
  '*Table 1. Research Findings.* \\[Taulukko on lähteessä kuvana.\\]\n\n*Fig. 2 Mean costs (\\*PTSD).*\n\n*Table 3 Odds ratios[^a]*\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n' +
  '*How this fits in*\n\nTable 4 shows that most findings are false.\n\n*1 lentelė. Duomenys*\n\n[^a]: Viite.\n');
sama('kuvateksti', (kuvt.html.match(/<p[^>]*data-b="\d+">(?:<em>)?(?:<span class="kt-nimi">[^<]*<\/span>)?[^<]{0,6}/g) || []).map(x => (/kuvateksti kt-taulukko/.test(x) ? 'KT ' : /kuvateksti/.test(x) ? 'K ' : '- ') + x.replace(/<p[^>]*>/, '').replace(/<\/?em>/, '').replace(/<span class="kt-nimi">([^<]*)<\/span>/, '[$1]')).join(' | '),
  '- Leipät | K [Table 1.] Resea | K [Fig. 2] Mean  | KT [Table 3] Odds  | - How th | - Table  | K [1 lentelė.] Duome');
// Osanvaihdot kohdiksi (käyttäjän pyyntö 21.11.2026): –––, * * *, --- ja ⁂ tekevät otsikottomasta jaksosta kohdat (i), (ii) …
// vaihdon jälkeiseen lohkoon; numerointi alkaa alusta otsikon jälkeen, lopun merkki ei ole kohta, yläindeksikohdat ohittavat.
const ov = M.parse('# T\n\nAlku on tässä kappaleessa, joka on niin pitkä, ettei se ole tietorivi otsikkolohkossa vaan leipätekstiä.\n\n' +
  '–––\n\nB.\n\n* * *\n\nC.\n\n## Luku\n\nD.\n\n---\n\nE.\n\n⁂\n');
sama('osanvaihdot kohdiksi', ov.kohdat.map(k => k.s + '@' + k.b).join(' ') + ' | ' + (ov.html.match(/<p class="vali"[^>]*>[^<]*<\/p>/g) || []).join(''),
  '(i)@1 (ii)@3 (iii)@4 (i)@6 (ii)@7 | <p class="vali" data-b="2">–––</p><p class="vali" data-b="8">⁂</p>');
tulos('osanvaihdot: yksi jakso ilman vaihtoa ei tee kohtia, yläindeksikohdat ohittavat', !M.parse('# T\n\nA.\n\nB.\n').kohdat.length &&
  M.parse('---\nkohdat: yläindeksit\n---\n\n# T\n\nEnsimmäinen ^1^ kappale on niin pitkä, ettei se ole otsikkolohkon tietorivi vaan leipätekstiä.\n\n–––\n\nToinen ^2^ kappale.\n').kohdat.map(k => k.s).join() === '1,2');
tulos('lähdeosio vain verkko-osoitteesta', !/id="lahde"/.test(M.parse('---\nlähde: Kirjan sivu 12\n---\n\n# T\n\nA.\n').html) &&
  !/id="lahde"/.test(M.parse('# T\n\nA.\n').html) && !!lo.lahdeOsio);
// Yleinen sivun lopun viite paluulinkillä (WordPress, Pandoc): ^1^ ja numeroitu kohta, jossa ↩ …#fnref1.
const wp = M.parse('# T\n\nVäite.^1^ Toinen.^2^\n\n1. Ensimmäinen. [↩](https://e.org/p/#fnref1)\n2. Toinen. [↩][9]\n\n[9]: https://e.org/p/#fnref2\n');
tulos('sivun lopun viitteet paluulinkillä', wp.notes === 2 && wp.html.includes('<span class="fnnum">2</span>Toinen.</span>') && !/<ol/.test(wp.html), wp.html);

// Kirjallisuusluettelo millä tahansa otsikkotasolla ja suomeksi, englanniksi tai saksaksi (käyttäjän pyyntö 4.11.2026)
{
  const runko = '---\ntitle: T\n---\n\n# T\n\n## Verpflichtung\n\nLeipäteksti, joka on tarpeeksi pitkä ollakseen tavallinen kappale eikä tietorivi otsikon alla, ja jatkuu.\n\n';
  const lahteet = 'Baum, Manfred: „Freiheit und Verbindlichkeit“, in: Byrd, Sharon (Hg.): Philosophia Practica, Berlin 2005, 31–43.\n\nGuyer, Paul: „The Obligation to be Virtuous“, in: Social Philosophy and Policy 27, 2010, 206–232.\n\n';
  const loppu = '## Verpflichtungsgrund\n\nTavallinen kappale taas, jonka ei pidä olla lähde vaan leipätekstiä, ja siinä on riittävästi sanoja.\n';
  for (const nimi of ['Weiterführende Literatur', 'Literaturverzeichnis', 'Further reading', 'Bibliography', 'Kirjallisuus', 'Käytetty kirjallisuus']) {
    const bh = M.parse(runko + '### ' + nimi + '\n\n' + lahteet + loppu).html;
    tulos('kirjallisuus ### ' + nimi, lkm(bh, /class="bib"/g) === 2 && !/class="bib"[^>]*>Tavallinen/.test(bh), lkm(bh, /class="bib"/g));
  }
  const eib = M.parse(runko + '### Philosophische Funktion\n\n' + lahteet + loppu).html;
  sama('ei kirjallisuutta: ### Philosophische Funktion', lkm(eib, /class="bib"/g), 0);
  const sis = M.parse(runko + '### Weiterführende Literatur\n\n' + lahteet + '#### Primärquellen\n\n' + lahteet + loppu).html;
  sama('kirjallisuus jatkuu alemman tason otsikon yli', lkm(sis, /class="bib"/g), 4);
  const lex = M.parse('---\ntitle: T\n---\n\n# T\n\n## Vernunft\n\n### 1 Eins\n\nText hier.\n\n### 2 Zwei\n\nText hier.\n\n## Vernunft, praktische\n\n### 1 Eins\n\nText hier.\n\n### 3 Drei\n\nText hier.\n');
  sama('numerointi alkaa alusta numeroimattoman ylemmän otsikon jälkeen', lex.warnings.map(w => w.msg).join(' | '), 'Otsikon numero 3 ei jatka edellistä numerointia.');
}

// Rakennetunnisteet ja paikantimet (käyttäjän pyyntö 6.11.2026, md.js tunnus(), paikat(), luuranko()).
{
  const tn = x => { const t = M.tunnus(x); return t ? t.avain + ' ' + t.merkki + (t.nimi ? ' / ' + t.nimi : '') : '—'; };
  [['PT II: Ethics', 'sana:part Part II / Ethics'], ['Ensimmäinen osa', 'sana:osa Osa I'], ['3. luku: Etiikka', 'sana:luku 3 / Etiikka'],
    ['Chapter Three. Kant', 'sana:chapter 3 / Kant'], ['Erster Teil. Von', 'sana:teil Teil I / Von'], ['Second Meditation', 'sana:meditation Meditation II'],
    ['§ 12. Otsikko', 'pykala § 12 / Otsikko'], ['IV. Kingdom', 'rooma. IV / Kingdom'], ['(iv) Foo', 'rooma-pieni() (iv) / Foo'], ['iv. Foo', 'rooma-pieni. iv / Foo'],
    ['a) Foo', 'kirjain) a / Foo'], ['C. Foo', 'kirjain-iso. C / Foo'], ['α΄ Foo', 'kreikkaʹ αʹ / Foo'], ['ιβ΄', 'kreikkaʹ ιβʹ'], ['β. Foo', 'kreikka. β / Foo'],
    ['4.3.4 Foo', 'piste3 4.3.4 / Foo'], ['6 The Kingdom', 'arabia 6 / The Kingdom'],
    ['I Think', '—'], ['Toinen osa ihmisistä on', '—'], ['Partial', '—'], ['Act of God', '—'], ['1990 Foo', '—']].forEach(x => sama('tunnus ' + x[0], tn(x[0]), x[1]));
  const pr = 'Leipätekstiä on tässä tarpeeksi pitkästi, jotta se on proosaa eikä otsikko. '.repeat(4);
  const pk = md => M.parse(md).toc.map(t => t.paikka || '').join(' ');
  // Korsgaard: Part II alkaa luvusta 6, joten osa ei kuulu paikantimeen; luvut eivät myöskään saa huomautusta.
  let k = '# K\n\n';
  [['I', [1, 2]], ['II', [3, 4]]].forEach(([p, cs]) => { k += '## Part ' + p + '\n\n'; cs.forEach(c => { k += '### ' + c + ' Luku\n\n' + pr + '\n\n#### ' + c + '.1 Osio\n\n' + pr + '\n\n'; }); });
  sama('paikannin: jatkuva numerointi ohittaa osan', pk(k), 'Part I 1.0 1.1 2.0 2.1 Part II 3.0 3.1 4.0 4.1');
  sama('paikannin: osa ei katkaise numerointia', M.parse(k).warnings.length, 0);
  let o = '# O\n\n';
  ['I', 'II'].forEach(p => { o += '## Osa ' + p + '\n\n'; [1, 2].forEach(c => { o += '### ' + c + '. Luku\n\n' + pr + '\n\n#### a) Kohta\n\n' + pr + '\n\n#### b) Kohta\n\n' + pr + '\n\n'; }); });
  sama('paikannin: alusta alkava numerointi tarvitsee osan', M.parse(o).toc.slice(-6).map(t => t.paikka).join(' | '), 'Osa II, 1 | Osa II, 1a | Osa II, 1b | Osa II, 2 | Osa II, 2a | Osa II, 2b');
  sama('paikannin: I. ja A.', pk('# T\n\n## I. Yksi\n\n### A. Alku\n\n' + pr + '\n\n### B. Loppu\n\n' + pr + '\n\n## II. Kaksi\n\n### A. Alku\n\n' + pr), 'I I.A I.B II II.A');
  sama('paikannin: H., I., J. ovat kirjaimia', M.parse('# T\n\n## H. a\n\n' + pr + '\n\n## I. b\n\n' + pr + '\n\n## J. c\n\n' + pr).toc.map(t => t.tn.laji).join(), 'kirjain-iso,kirjain-iso,kirjain-iso');
  const kp = M.parse('# T\n\n## Johdanto\n\n§ 1. ' + pr + '\n\n§ 2. ' + pr + '\n\nVälikappale.\n\n§ 3 ' + pr);
  sama('kohtamerkit: pykälät kappaleiden alussa', kp.kohtamerkit.map(k => k.b + ':' + k.s).join(' '), '2:§ 1 3:§ 2 5:§ 3');
  sama('kohtamerkit: yksi pykälä ei riitä', M.parse('# T\n\n§ 1. ' + pr).kohtamerkit.length, 0);
  // Luurangotus
  const lr = md => M.luuranko(md).muutokset.map(m => m.ln + ':' + m.uusi).join(' | ');
  let kp2 = '# K\n\n## Preface\n\n' + pr + '\n\n';
  // Luvut ovat todellisen mittaisia (yli PYK_PITUUS): lyhyinä ja osien yli jatkuvina ne olisivat pykäliä.
  [['I', [1, 2]], ['II', [3, 4]]].forEach(([p, cs]) => { kp2 += 'PART ' + p + '\n\n'; cs.forEach(c => { kp2 += '## ' + c + ' Luku\n\n' + pr.repeat(25) + '\n\n'; }); });
  sama('luuranko: PART-rivit otsikoiksi ja luvut niiden alle', lr(kp2), '7:## PART I | 9:### 1 Luku | 13:### 2 Luku | 17:## PART II | 19:### 3 Luku | 23:### 4 Luku');
  sama('luuranko: CHAPTER ja nimi yhdeksi otsikoksi, kohdat sarjoina', lr('# T\n\nCHAPTER 1\n\nThe Title\n\n' + pr + '\n\n1. Section\n\n' + pr + '\n\na) Sub\n\n' + pr + '\n\nb) Sub\n\n' + pr + '\n\n2. Section\n\n' + pr + '\n\nCHAPTER 2\n\n' + pr),
    '3:## CHAPTER 1. The Title | 9:### 1. Section | 13:#### a) Sub | 17:#### b) Sub | 21:### 2. Section | 25:## CHAPTER 2');
  sama('luuranko: lihavoidut ja kursivoidut rivit', lr('# T\n\n**Johdanto**\n\n' + pr + '\n\n*Tausta*\n\n' + pr + '\n\n**Teoria**\n\n' + pr + '\n\n*Kant*\n\n' + pr),
    '3:## Johdanto | 7:### Tausta | 11:## Teoria | 15:### Kant');
  sama('luuranko: kursiiviotsikko samalla tasolla alemmaksi', lr('# T\n\n## Johdanto\n\n' + pr + '\n\n## *Tausta*\n\n' + pr + '\n\n## Teoria\n\n' + pr), '7:### *Tausta*');
  sama('luuranko: luettelon kohdat eivät ole otsikoita', lr('# T\n\n' + pr + '\n\na) jotain\n\nb) jotain muuta\n\n' + pr + '\n\n1. Asia.\n2. Toinen.\n\n' + pr), '');
  // Pykäläsarja (käyttäjän sääntö 6.11.2026): korkeintaan alaluvun alaluku, merkillä tai ilman, myös ilman yläotsikoita.
  const hus = n => 'Die natürliche Erkenntnis hebt an mit der Erfahrung und verbleibt in der Erfahrung. '.repeat(n);
  const ptoc = md => M.parse(md).toc.map(t => t.lvl + (t.pyk ? 'p' : '') + ' ' + (t.paikka || '')).join(' | ');
  let ide = '# Ideen\n\n## Einleitung\n\n' + hus(6) + '\n\n', np = 1;
  ['Erster', 'Zweiter'].forEach(a => { ide += '## ' + a + ' Abschnitt\n\n'; ['Erstes', 'Zweites'].forEach(k => { ide += '### ' + k + ' Kapitel\n\n'; for (let i = 0; i < 2; i++, np++) ide += '### § ' + np + '. Titel\n\n' + hus(20) + '\n\n'; }); });
  sama('pykälät: alaluvun alaluvuiksi, paikannin § n', ptoc(ide), '1  | 1 1.0 | 2 1.1 | 3p § 1 | 3p § 2 | 2 1.2 | 3p § 3 | 3p § 4 | 1 2.0 | 2 2.1 | 3p § 5 | 3p § 6 | 2 2.2 | 3p § 7 | 3p § 8');
  sama('pykälät ilman merkkiä: numerot jatkuvat kapitelien yli', ptoc(ide.replace(/### § (\d+)\./g, '## $1.')).split(' | ').slice(3, 5).join(' | '), '3p 1 | 3p 2');
  sama('pykälät ilman yläotsikoita', ptoc('# CM\n\n## § 1. A\n\n' + hus(10) + '\n\n## § 2. B\n\n' + hus(10)), '3p § 1 | 3p § 2');
  sama('pykälät: kolmekymmentä lyhyttä numeroitua ilman yläotsikoita', ptoc('# P\n\n' + Array.from({ length: 30 }, (x, i) => '## ' + (i + 1) + '. Teema\n\n' + hus(10)).join('\n\n')).split(' | ')[0], '3p 1');
  sama('pykälät: neljätoista lyhyehköä numeroitua jaksoa (Beauvoir) ovat osioita (yli 10 lukua), eivät pykäliä', ptoc('# A\n\n' + Array.from({ length: 14 }, (x, i) => '## ' + (i + 1) + '. Teema\n\n' + hus(10)).join('\n\n')).split(' | ').slice(0, 3).join(' | '), '2 1 | 2 2 | 2 3');
  sama('pykälät: lyhyen artikkelin viisi jaksoa ennallaan', ptoc('# A\n\n' + Array.from({ length: 5 }, (x, i) => '## ' + (i + 1) + '. Teema\n\n' + hus(10)).join('\n\n')), '1 1 | 1 2 | 1 3 | 1 4 | 1 5');
  sama('pykälät: pitkät luvut osien yli ovat lukuja', ptoc('# K\n\n## Part I\n\n### 1 C\n\n' + hus(80) + '\n\n### 2 C\n\n' + hus(80) + '\n\n## Part II\n\n### 3 C\n\n' + hus(80)), '1 Part I | 2 1 | 2 2 | 1 Part II | 2 3');
  // Paikannin pykälän tarkkuudella (käyttäjän sääntö 6.11.2026): luvun alku 4.0.0 kolmitasoisessa, 4.0 kaksitasoisessa;
  // luvuittain alusta alkava pykälä alaluvun paikalla (5.2), jatkuva yksinään (§ 88).
  const kolme = '# K\n\n' + [1, 2].map(c => '## ' + c + '. Luku\n\n' + pr + '\n\n### ' + c + '.1 A\n\n#### ' + c + '.1.1 X\n\n' + pr + '\n\n### ' + c + '.2 B\n\n' + pr + '\n\n#### ' + c + '.2.1 Y\n\n' + pr).join('\n\n');
  sama('paikannin: kolmitasoinen kirja', pk(kolme), '1.0.0 1.1.0 1.1.1 1.2.0 1.2.1 2.0.0 2.1.0 2.1.1 2.2.0 2.2.1');
  sama('paikannin: kaksitasoinen kirja', pk('# K\n\n## 1. A\n\n' + pr + '\n\n### 1.1 B\n\n' + pr + '\n\n## 2. C\n\n### 2.1 D\n\n' + pr + '\n\n## 3. E\n\n' + pr), '1.0 1.1 2.0 2.1 3.0');
  sama('paikannin: vain luvut, ei nollia', pk('# K\n\n## 1. A\n\n' + pr + '\n\n## 2. B\n\n' + pr), '1 2');
  const nol = M.parse('# K\n\n## 1. A\n\n' + pr + '\n\n§ 1. ' + pr + '\n\n§ 2. ' + pr + '\n\n## 2. B\n\n' + pr + '\n\n§ 1. ' + pr + '\n\n§ 2. ' + pr);
  sama('paikannin: luvuittain alusta alkavat pykälät 5.2-muodossa', nol.toc.map(t => t.paikka).join(' ') + ' | ' + nol.kohtamerkit.map(k => k.s).join(' '), '1.0 2.0 | 1.1 1.2 2.1 2.2');
  const jat = M.parse('# K\n\n## 1. A\n\n' + pr + '\n\n§ 87. ' + pr + '\n\n§ 88. ' + pr + '\n\n## 2. B\n\n§ 89. ' + pr);
  sama('paikannin: jatkuva pykälä riittää yksinään', jat.toc.map(t => t.paikka).join(' ') + ' | ' + jat.kohtamerkit.map(k => k.s).join(' '), '1 2 | § 87 § 88 § 89');
  sama('paikannin: alusta alkavat §-otsikot luvun alla', pk('# K\n\n## 1. A\n\n' + pr + '\n\n### § 1. X\n\n' + pr + '\n\n### § 2. Y\n\n' + pr + '\n\n## 2. B\n\n### § 1. Z\n\n' + pr), '1.0 1.1 1.2 2.0 2.1');
  sama('luuranko: §-rivit ####-otsikoiksi', lr('# I\n\nERSTES KAPITEL\n\n§ 1. Titel\n\n' + hus(20) + '\n\n§ 2. Titel\n\n' + hus(20) + '\n\nZWEITES KAPITEL\n\n§ 3. Titel\n\n' + hus(20)),
    '3:## ERSTES KAPITEL | 5:#### § 1. Titel | 9:#### § 2. Titel | 13:## ZWEITES KAPITEL | 15:#### § 3. Titel');
  sama('luurangotus: ##-pykälät ####:ksi', lr('# I\n\n## Erstes Kapitel\n\n## § 1. A\n\n' + hus(20) + '\n\n## § 2. B\n\n' + hus(20)), '5:#### § 1. A | 9:#### § 2. B');
  sama('luuranko: tutkielma ja Dialectic ennallaan', lr(lue('../tekstit/kant-ja-elainetiikka.md')) + lr(lue('../tekstit/dialectic-of-enlightenment.md')), '');
}

// Leipätekstin haka- ja kaarisulkuviittaukset (käyttäjän päätös 6.11.2026, huomio 7.11.2026, SEP): tekijä ja vuosi sulkujen alussa (vihjesanan jälkeenkin), pilkulla
// jatkuvat vuodet, osion *Selected works by X* tekijättömät kohdat, viivat (–––) edellisen tekijän paikalla. Ei
// linkkiä: kaksiselitteinen vuosi, sulkujen keskellä alkava tekijä, kirjallisuusluettelo itse, lyhenne leipätekstissä.
{
  const sep = M.parse('# T\n\nKuten \\[Heidegger 1929\\] ja \\[Cassirer 1906, 1907a\\] sekä \\[Friedman 2000, chap. 7\\]. Myös (Kahn 1960: 238), (see Kahn 1979) ja (Hülsz 2013, Long 2013). Kertova Kahn (1979) ja sulun keskeltä (kuten Barnes 1982 sanoo). Kaksi tekijää (Celikates & Jaeggi 2009 \\[2017: 261\\]) ja yksi (Watene 2016). Kursiivi välissä (*pace* Barnes 1982) ja (*Timaeus* 39 with Long 2013). Ei: \\[Cassirer 1925\\], (ilmestyi 1929), Kahn (1959–1961), \\[Schilpp 1949\\].\n\n' +
    '## Bibliography\n\n### Selected works by Cassirer\n\n(Ks. \\[Heidegger 1929\\].)\n\n(1906) *Erkenntnisproblem I*. Berlin.\n\n(1907a) *Erkenntnisproblem II*. Berlin.\n\n(1925a) *Sprache und Mythos*.\n\n(1925b) *Philosophie der symbolischen Formen II*.\n\n' +
    '### Secondary\n\nFriedman, M. (2000) *A Parting of the Ways*. Chicago.\n\nKahn, Charles H., 1960, *Anaximander*, New York.\n\n–––, 1979, *The Art and Thought of Heraclitus*, Cambridge.\n\nLong, A. A. 2013, “Heraclitus on Measure,” Cambridge.\n\nBarnes, Jonathan, 1982, *The Presocratic Philosophers*, London.\n\nCelikates, Robin and Rahel Jaeggi, 2009 \\[2017\\], “Technik und Verdinglichung”, in *Handbuch* (zu Habermas 1968), Stuttgart.\n\nWatene, K. 2013, “Nussbaum”, Oxford.\n\n–––, 2016, “Valuing Nature”, Oxford.\n\nWatene, K. and J. Drydyk (eds.), 2016, *Theorizing Justice*, London.\n\nHeidegger, M. (1927) *Sein und Zeit*.\n\n–––, (1929) *Kant und das Problem der Metaphysik*.\n');
  const linkit = [...sep.html.matchAll(/<a class="lahde" href="#([^"]+)">([^<]+)<\/a>/g)].map(m => m[2] + '→' + m[1]);
  sama('hakasulkuviittaukset leipätekstissä', linkit.join(' | '),
    'Heidegger 1929→kirj-heidegger-1929 | Cassirer 1906→kirj-cassirer-1906 | 1907a→kirj-cassirer-1907a | Friedman 2000→kirj-friedman-2000 | ' +
    'Kahn 1960→kirj-kahn-1960 | Kahn 1979→kirj-kahn-1979 | Long 2013→kirj-long-2013 | 1979→kirj-kahn-1979 | Barnes 1982→kirj-barnes-1982 | ' +
    'Celikates &amp; Jaeggi 2009→kirj-celikates-2009 | Watene 2016→kirj-watene-2016 | Barnes 1982→kirj-barnes-1982 | Long 2013→kirj-long-2013');
  sama('hakasulkuviittaukset: raportti', sep.viittaukset.filter(v => !v.kohde).map(v => v.teksti + ': ' + v.syy).join(' | '),
    'Cassirer 1925: Vuosi on luettelossa vain kirjaimin: Cassirer 1925a, Cassirer 1925b.');
}

// Viitelinkki otsikossa (vanhan Lisää lukimeen -leikkeen blogin etusivu, 9.11.2026: ### [Otsikko][1]): Sisälmyksessä ja
// tunnisteessa pelkkä teksti, otsikossa linkki. Määrittelemätön [x][y] jää näkyviin kuten leipätekstissä.
{
  const v = M.parse('# Blogi\n\n## [Ensimmäinen kirjoitus][1]\n\nTeksti.\n\n## [Toinen][kakkos]\n\nTeksti.\n\n## Ei [linkki][9]\n\nTeksti.\n\n[1]: https://blogi.example/1.html\n[kakkos]: https://blogi.example/2.html\n');
  sama('viitelinkki otsikossa: Sisälmys', v.toc.map(t => t.text + '#' + t.id).join(' | '), 'Ensimmäinen kirjoitus#ensimmainen-kirjoitus | Toinen#toinen | Ei [linkki][9]#ei-linkki-9');
  tulos('viitelinkki otsikossa: otsikko on linkki', /<h2[^>]*><a href="https:\/\/blogi\.example\/1\.html">Ensimmäinen kirjoitus<\/a><\/h2>/.test(v.html), (v.html.match(/<h2[^>]*>.*?<\/h2>/) || [])[0]);
}

// Välimuistin ohitus (29.10.2026: selain piti vanhan md.js:n): sivujen ?v= on md.js:n SHA-1:n alku. Muutoksen jälkeen:
//   V=$(sha1sum luin/md.js | cut -c1-8); sed -i -E "s/md\.js\?v=[0-9a-f]+/md.js?v=$V/" luin.html luin/latomo.html
// Samoin posti.js (9.11.2026): sed-komennossa md → posti. Samoin laatikkolause.js (12.11.2026) ja tekstit.js (19.11.2026).
[['md'], ['posti'], ['laatikkolause'], ['tekstit']].forEach(([nimi, sivut]) => {
  const mdV = require('crypto').createHash('sha1').update(fs.readFileSync(path.resolve(__dirname, '../' + nimi + '.js'))).digest('hex').slice(0, 8);
  (sivut || ['../../luin.html', '../latomo.html']).forEach(f => {
    const v = (new RegExp(nimi + '\\.js\\?v=([0-9a-f]+)').exec(lue(f)) || [])[1];
    tulos(nimi + '.js?v= ajan tasalla: ' + f.split('/').pop(), v === mdV, v + ' ≠ ' + mdV + ' (aja kommentin sed-komento)');
  });
});

// Tekijänoikeusmerkintä (käyttäjän säännöt 10.11.2026): taso näkyvistä tasoista, muut otsikot ja lohkot ennallaan,
// merkintä ei ole kirjallisuusluettelon kohta.
(function () {
  const ek = o => '---\noikeudet: ' + o + '\n---\n';
  const hs = h => (h.match(/<h[2-4][^>]*>[^<]*/g) || []).map(x => x.replace(/<h(\d)[^>]*>/, 'h$1 ')).join(' | ');
  const tap = [
    ['ei otsikoita → kohta', '# T\n\nKappale.\n', 'h4 Tekijänoikeudet'],
    ['pelkät luvut → luku', '# T\n\n## Yksi\n\nA.\n\n## Kaksi\n\nB.\n', 'h2 Yksi | h2 Kaksi | h2 Tekijänoikeudet'],
    ['pelkät osiot → osio', '# T\n\n### Yksi\n\nA.\n\n### Kaksi\n\nB.\n', 'h3 Yksi | h3 Kaksi | h3 Tekijänoikeudet'],
    ['luvut ja osiot → kohta', '# T\n\n## Yksi\n\nA.\n\n### Ala\n\nB.\n', 'h2 Yksi | h3 Ala | h4 Tekijänoikeudet'],
    ['pelkät luvut ja kirjallisuus → kohta', '# T\n\n## Yksi\n\nA.\n\n## Kirjallisuus\n\nKant, Immanuel (1781). *KrV*.\n', 'h2 Yksi | h2 Kirjallisuus | h4 Tekijänoikeudet']
  ];
  tap.forEach(([nimi, md, odotus]) => {
    const r = M.parse(ek('CC BY 4.0') + md), r0 = M.parse(md);
    tulos('tekijänoikeudet: ' + nimi, hs(r.html) === odotus && hs(r.html).startsWith(hs(r0.html)) &&
      (r.html.match(/class="bib"/g) || []).length === (r0.html.match(/class="bib"/g) || []).length, hs(r.html));
  });
  // Ylin taso jää käyttämättä (yli 10 lukua, kaksi tasoa) myös merkinnän kanssa.
  const iso = '# T\n\n' + Array.from({ length: 12 }, (_, i) => '## Luku ' + (i + 1) + '\n\nTeksti.\n\n### Ala\n\nLisää.\n').join('\n');
  const a = M.parse(iso), b = M.parse(ek('© 2026 Kirjoittaja') + iso);
  tulos('tekijänoikeudet: muiden otsikoiden tasot ja lohkonumerot ennallaan (laske)', b.laskettu === a.laskettu && a.laskettu && hs(b.html).startsWith(hs(a.html)) &&
    b.toc.slice(0, -1).every((t, i) => t.lvl === a.toc[i].lvl && t.b === a.toc[i].b), hs(b.html).slice(-60));
  const sel = M.parse(ek('Copyright © 2024 by X') + '# T\n\nA.\n').html;
  tulos('tekijänoikeudet: ilman lähdesivua kaikki oikeudet ja tekijänoikeuslaki', /Kaupan joulukuusen koristeita/.test(sel) && /finlex\.fi\/fi\/lainsaadanto\/1961\/404/.test(sel));
  const sep = M.parse('---\noikeudet: Copyright © 2024 by X\noikeudet-lähde: https://plato.stanford.edu/info.html#terms\n---\n# T\n\nA.\n');
  tulos('tekijänoikeudet: lisätietojen osoite kirjoitettuna (verkkolinkit ovat oletuksena pois)',
    /Lisätietoja: Stanford Encyclopedia of Philosophyn käyttöehdot \(Terms of Use\) osoitteessa <a class="url" href="https:\/\/plato\.stanford\.edu\/info\.html#terms">https:\/\/plato\.stanford\.edu\/<wbr>info\.html<wbr>#terms<\/a><\/p>/.test(sep.html),
    (sep.html.match(/Lisätietoja.*$/) || [''])[0]);
  // Lähde- ja tekijänoikeusosion kappaleet ovat p.oik (luin.html: ei sisennystä eikä tasausta), leipäteksti ei.
  const lo = M.parse('---\nlähde: https://example.org/a\noikeudet: Public domain\noikeudet-lähde: https://example.org/ehdot\n---\n# T\n\nA.\n\nB.\n').html;
  tulos('tekijänoikeudet: osioiden kappaleet p.oik, leipäteksti ei', (lo.match(/<p class="oik"/g) || []).length === 4 &&
    (lo.match(/<p[ >]/g) || []).length === 6, (lo.match(/<p[^>]*>/g) || []).join(' '));
  tulos('tekijänoikeudet: ei merkintää ilman etukenttää', !/tekijanoikeudet/.test(M.parse('# T\n\n## A\n\nB.\n').html));
})();

// Rahoitushuomautus (käyttäjän säännöt 15.11.2026): otsikkolohkon alkuun ilman lohkonumeroa, kolme lajia.
(function () {
  const runko = '# T\n\n*Ala*\n\n## A\n\nB.\n';
  const ek = (laji, u) => '---\nrahoitus: ' + laji + (u ? '\nlahjoitusosoite: ' + u : '') + '\n---\n';
  const a = M.parse(runko), m = M.parse(ek('mainokset') + runko);
  tulos('rahoitus: mainokset otsikkolohkon alussa hakasulkeissa', /^<header class="tt"><p class="rahoitus">\[Tämä sivusto pysyy todennäköisesti pystyssä mainostulojen voimin\..*\]<\/p><h1 /.test(m.html), m.html.slice(0, 200));
  tulos('rahoitus: lohkonumerot ja sisällys ennallaan', m.blocks === a.blocks && m.html.replace(/<p class="rahoitus">.*?<\/p>/, '') === a.html);
  tulos('rahoitus: mainoksiin ei lahjoitusosoitetta', !/osoitteessa/.test(M.parse(ek('mainokset', 'https://x.org/d') + runko).html));
  const l = M.parse(ek('lahjoitukset', 'https://donate.wikimedia.org/') + runko).html;
  tulos('rahoitus: lahjoitukset osoitteineen', /\[Lähteen sivusto toimii lahjoitusten varassa\. <span class="ennen-osoite">Lahjoittaa voi osoitteessa<\/span><br><a class="url" href="https:\/\/donate\.wikimedia\.org\/">https:\/\/donate\.wikimedia\.org\/<\/a>\]<\/p>/.test(l), (l.match(/<p class="rahoitus">.*?<\/p>/) || [''])[0]);
  const pitka = M.parse(ek('lahjoitukset', 'https://x.org/a/b?c=1&d=2#e') + runko).html;
  tulos('rahoitus: pitkä osoite katkeaa kauttaviivoista ja ennen ?#&, linkki ennallaan', /<br><a class="url" href="https:\/\/x\.org\/a\/b\?c=1&amp;d=2#e">https:\/\/x\.org\/<wbr>a\/<wbr>b<wbr>\?c=1<wbr>&amp;d=2<wbr>#e<\/a>\]/.test(pitka), (pitka.match(/<p class="rahoitus">.*?<\/p>/) || [''])[0]);
  tulos('rahoitus: mainokset ja lahjoitukset alkaa huomautuksella', /<p class="rahoitus">\[Huom\. huom\.!/.test(M.parse(ek('mainokset ja lahjoitukset', 'https://x.org/d') + runko).html));
  tulos('rahoitus: tuntematon laji tai ilman etukenttää ei huomautusta', !/rahoitus/.test(M.parse(ek('jotain') + runko).html) && !/rahoitus/.test(a.html));
  const ilman = M.parse(ek('lahjoitukset', 'https://x.org/d') + 'Pelkkä teksti.\n').html;
  tulos('rahoitus: ilman otsikkoa tekstin alussa', /^<p class="rahoitus">/.test(ilman), ilman.slice(0, 80));
})();

// Julkaisun tila, Luinin huomautus ja lohkokaava (lääketieteen toinen kierros 22.11.2026).
(function () {
  const runko = '# T\n\n## A\n\nB.\n';
  const a = M.parse(runko);
  const v = M.parse('---\ntila: vedetty takaisin 2024-08-19\ntila-lähde: https://x.org/r\nrahoitus: lahjoitukset\nlahjoitusosoite: https://x.org/d\n---\n' + runko);
  tulos('tila: takaisin vedetty otsikkolohkon alussa ennen rahoitusta, päiväys ja osoite', /^<header class="tt"><p class="tila vakava">\[Julkaisija on vetänyt tämän artikkelin takaisin 19\.8\.2024\. <span class="ennen-osoite">Takaisinvetoilmoitus osoitteessa<\/span><br><a class="url" href="https:\/\/x\.org\/r">https:\/\/x\.org\/<wbr>r<\/a>\]<\/p><p class="rahoitus">/.test(v.html), v.html.slice(0, 260));
  tulos('tila: lohkonumerot ennallaan', v.blocks === a.blocks);
  const e = M.parse('---\ntila: esipainos\n---\n' + runko).html;
  tulos('tila: esipainos ilman osoitetta, ei vakava', /<p class="tila">\[Tämä on esipainos, jota lehti ei ole vielä vertaisarvioinut\.\]<\/p>/.test(e), e.slice(0, 160));
  tulos('tila: tuntematon arvo ei huomautusta', !/class="tila/.test(M.parse('---\ntila: jotain\n---\n' + runko).html));
  const h = M.parse('# T\n\nArvo \\[kaava\\] ja \\[sic\\] ovat.\n\n\\[Kaava (3) on lähteessä kuvana.\\]\n\n*Table 1. Arvot* \\[Taulukko on lähteessä kuvana.\\]\n').html;
  tulos('huomautus: [kaava] tekstissä span.huom, [sic] tekstiä', /Arvo <span class="huom">\[kaava\]<\/span> ja \[sic\] ovat\./.test(h), (h.match(/<p[^>]*>Arvo.*?<\/p>/) || [''])[0]);
  tulos('huomautus: kokonainen huomautus on p.huom', /<p class="huom"[^>]*><span class="huom">\[Kaava \(3\) on lähteessä kuvana\.\]<\/span><\/p>/.test(h));
  tulos('huomautus: kuvatekstin perässä', /<p class="kuvateksti"[^>]*><em><span class="kt-nimi">Table 1\.<\/span> Arvot<\/em> <span class="huom">\[Taulukko on lähteessä kuvana\.\]<\/span><\/p>/.test(h), (h.match(/<p class="kuvateksti.*?<\/p>/) || [''])[0]);
  const k = M.parse('# T\n\n## A\n\nKun on niin, että\n\nx = y~i~\u2003(1)\n\nja sitoviin \u00a0\u00a0\u00a0 (2)\n\nmuu (3)\n').html;
  tulos('lohkokaava: em-väli tai sitovat välit ennen numeroa → p.kaava, pelkkä (3) ei', (k.match(/class="kaava"/g) || []).length === 2 && /<p[^>]*>muu \(3\)<\/p>/.test(k) && !/kaava"[^>]*>muu/.test(k), k);
})();

// Liettua (16.11.2026): tavusäännöt (liudentava i, diftongit, ch/dz/dž) ja kirjallisuusluettelon otsikot.
(() => {
  const tavut = (w, t) => M.tavutaLt(w, t).replace(/\u00ad/g, '-');
  const T = { L: 2, R: 2, min: 5, c: true }, V = { L: 3, R: 3, min: 8, c: false };
  [['tiesiogiai', 'tie-sio-giai'], ['kiaulė', 'kiau-lė'], ['medžiaga', 'me-džia-ga'], ['psichofiziologinė', 'psi-cho-fi-zio-lo-gi-nė'],
    ['Karaliaučiuje', 'Ka-ra-liau-čiu-je'], ['teorija', 'te-o-ri-ja'], ['Lietuvos', 'Lie-tu-vos'], ['sąmonės', 'są-mo-nės'],
    ['straipsnyje', 'straips-ny-je'], ['duona', 'duo-na'], ['neurologiniais', 'neu-ro-lo-gi-niais']]
    .forEach(([w, o]) => sama('liettuan tavutus innokkaana: ' + w, tavut(w, T), o));
  sama('liettuan tavutus maltillisena: konsonanttiryhmä', tavut('Bergsonas', V), 'Berg-sonas');
  sama('liettuan tavutus maltillisena: ei yksinäisen konsonantin rajaa', tavut('tiesiogiai', V), 'tiesiogiai');
  sama('liettuan tavutus: q, w ja x jättävät sanan rauhaan', tavut('Wittgensteinas', T), 'Wittgensteinas');
  const bib = M.parse('# Otsikko\n\n## Įvadas\n\nTeksti (Bergson 2012: 3).\n\n## Literatūra\n\nBergson, H., 2012. *Matière et mémoire*. Paris: PUF.\n\n## Šaltiniai ir literatūra\n\nRiquier, C., 2009. *Archéologie de Bergson*. Paris: PUF.\n').html;
  sama('liettuan kirjallisuusotsikot luetteloksi', lkm(bib, /<p class="bib/g), 2);
})();

// Lomitettu käännös (16.11.2026, Perseus): etukentän ladonta tekee lainauksista käännöksiä; lähderivi ei ole lähde.
(() => {
  const runko = '# Valtio\n\n^327a^ κατέβην χθὲς εἰς Πειραιᾶ.\n\n> I went down yesterday to the Peiraeus.\\\n> – Sokrates\n\n^327b^ προσευξάμενοι δὲ.\n\n> After we had said our prayers.\n';
  const l = M.parse('---\nladonta: lomitettu käännös\n---\n' + runko), t = M.parse(runko);
  sama('lomitettu käännös: lainaukset käännöksiksi', lkm(l.html, /<blockquote class="kaannos">/g), 2);
  tulos('lomitettu käännös: ei lähdettä eikä mottoa', !/figure/.test(l.html) && !l.lahteet.length && l.lomitettu === true);
  tulos('ilman ladontaa lainaus on lainaus', !/kaannos/.test(t.html) && /figure class="lainaus/.test(t.html) && !t.lomitettu);
})();

// Numeroviittaukset (md.js, Numeroviittaukset): numeroitu kirjallisuusluettelo ja viittaukset sen kohtiin vain varmalla yhteydellä.
(() => {
  const luettelo = '## References\n\n1. Smith J. A.\n2. Lee A. B.\n3. Virtanen M. C.\n4. Brown B. D.\n5. Green G. E.\n';
  const teksti = (leipa, kirj) => M.parse('# Otsikko\n\n## Introduction\n\n' + leipa + '\n\n' + (kirj || luettelo)).html;
  const linkit = h => [...h.matchAll(/<a class="lahde" href="#([^"]+)">(\d+)<\/a>/g)].map(m => m[2] + '>' + m[1]).join(' ');
  sama('numeroviittaukset: Vancouverin hakasulut kohtiin', linkit(teksti('Studies [1] showed [2, 3]. Later [4–5] and again [1].')),
    '1>nro-1 2>nro-2 3>nro-3 4>nro-4 5>nro-5 1>nro-1');
  tulos('numeroviittaukset: kohteen id luettelon kohdassa', /<li id="nro-3" data-b="\d+">Virtanen/.test(teksti('Studies [1] showed [2, 3]. Later [4–5] and again [1].')));
  sama('numeroviittaukset: Turndownin suojaus ja kappaleiksi numeroitu luettelo', linkit(teksti('A\\[1\\] b\\[2,3\\] c\\[4-5\\] d\\[1\\].',
    '## References\n\n1\\. A.\n\n2\\. B.\n\n3\\. C.\n\n4\\. D.\n\n5\\. E.\n')), '1>nro-1 2>nro-2 3>nro-3 4>nro-4 5>nro-5 1>nro-1');
  // Ansat: ei yhtään linkkiä eikä nro-id:tä.
  [['alaviitemerkit (ei toistoa)', 'A [1] b [2] c [3] d [4] e [5].'], ['väli [0, 1]', 'In [0, 1] and [1] [2, 3] [4–5] [1].'],
    ['aakkosjärjestys', 'A [4] and [2, 5] then [1] and [3] and [4].'], ['alle puolet viitattu', 'A [1] and [1, 2].', luettelo + '6. F.\n7. G.\n8. H.\n9. I.\n10. J.\n'],
    ['numero yli luettelon', 'A [1] and [2, 3] then [4–5] and [1] and [6].'], ['kaksi numeroitua luetteloa', 'A [1] and [2, 3] then [4–5] and [1].', luettelo + '\n## Further reading\n\n1. X.\n2. Y.\n'],
    ['numeroinnin aukko', 'A [1] and [2, 3] then [4–5] and [1].', '## References\n\n- [1] A.\n- [2] B.\n- [4] D.\n- [5] E.\n'],
    ['numeroitu muu kuin kirjallisuus', 'A [1] and [2, 3] then [4–5] and [1].', '## Appendix\n\n1. A.\n2. B.\n3. C.\n4. D.\n5. E.\n'],
    ['kohdan oma numero ei ole viittaus', 'Teksti ilman viittauksia.', '## References\n\n- [1] A.\n- [2] B.\n- [3] C.\n']]
    .forEach(([nimi, leipa, kirj]) => { const h = teksti(leipa, kirj); tulos('numeroviittaukset: ei linkkiä, ' + nimi, !/class="lahde"/.test(h) && !/id="nro-/.test(h), linkit(h)); });
  // Leikkeen linkit samalle sivulle: kirjallisuusviitteen ankkuri luettelon kohtaan, kuvan ja taulukon ankkuri ei lukuun.
  const U = 'https://x.org/a', leike = (leipa, kirj) => M.parse('---\nlähde: ' + U + '\n---\n# Otsikko\n\n## 1 Intro\n\n' + leipa + '\n\n## 2 Methods\n\nTeksti.\n\n' + (kirj || '## References\n\n-   (1) A.\n-   (2) B.\n')).html;
  const h1 = leike('GQA \\[[2](' + U + '#bib.bib2)\\], see Table [1](' + U + '#S2.T1), Figure [2](' + U + '#fig2) and [1](' + U + '#reference-1).');
  tulos('numeroviittaukset: leikkeen #bib.bib2 ja #reference-1 luettelon kohtiin', h1.includes('<a class="lahde" href="#nro-2">2</a>') && h1.includes('<a class="lahde" href="#nro-1">1</a>'), h1);
  tulos('numeroviittaukset: taulukon ja kuvan ankkuri ei lukuun', h1.includes('href="' + U + '#S2.T1"') && h1.includes('href="' + U + '#fig2"') && !/href="#luku-/.test(h1), h1);
  const h2 = leike('Viite [2](' + U + '#bib.bib2) ilman numeroitua luetteloa.', '## References\n\nA, B. 2001. *Teos*.\n');
  tulos('numeroviittaukset: kirjallisuusviitteen ankkuri ei lukuun ilman luetteloakaan', h2.includes('href="' + U + '#bib.bib2"') && !/href="#luku-/.test(h2), h2);
  const h3 = leike('Katso luku [2](' + U + '#S2).');
  tulos('numeroviittaukset: luvun ankkuri lukuun kuten ennen', /href="#luku-2"/.test(h3), h3);
  const h5 = leike('A [1](' + U + '#bib.bib1), B [2](' + U + '#bib.bib2) ja C [5](' + U + '#bib.bib5).');
  tulos('numeroviittaukset: leikkeen numero yli luettelon, ei yhtään linkkiä kohtiin', !h5.includes('class="lahde"') && !/href="#luku-/.test(h5), h5);
  const h4 = leike('Ankkurin numero eri [2](' + U + '#bib.bib7).');
  tulos('numeroviittaukset: ankkurin numero eri kuin linkin teksti, ei linkkiä kohtaan', !h4.includes('class="lahde"'), h4);
})();

console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
process.exit(virheita ? 1 : 0);
