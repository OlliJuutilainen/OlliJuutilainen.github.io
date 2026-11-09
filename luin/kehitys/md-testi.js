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
sama('sisäiset linkit', (si.match(/<a[^>]*>[^<]*<\/a>/g) || []).join('\n'), ['<a href="#luku-1">1. Alku</a>', '<a href="#luku-2-1">2.1 Osa</a>',
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
  sp2.html.includes('<span class="fnnum">2</span>Toinen alkaa<br>lainaus jatkuu.</span>') && sp2.toc.length === 0 && !/Notes|lähde:/.test(sp2.html), sp2.html);
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
  sama('luuranko: tutkielma ja opas ennallaan', lr(lue('../tekstit/kant-ja-elainetiikka.md')) + lr(lue('../ohje.md')) + lr(lue('../tekstit/dialectic-of-enlightenment.md')), '');
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
// Samoin posti.js (9.11.2026): sed-komennossa md → posti.
['md', 'posti'].forEach(nimi => {
  const mdV = require('crypto').createHash('sha1').update(fs.readFileSync(path.resolve(__dirname, '../' + nimi + '.js'))).digest('hex').slice(0, 8);
  ['../../luin.html', '../latomo.html'].forEach(f => {
    const v = (new RegExp(nimi + '\\.js\\?v=([0-9a-f]+)').exec(lue(f)) || [])[1];
    tulos(nimi + '.js?v= ajan tasalla: ' + f.split('/').pop(), v === mdV, v + ' ≠ ' + mdV + ' (aja kommentin sed-komento)');
  });
});

console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
process.exit(virheita ? 1 : 0);
