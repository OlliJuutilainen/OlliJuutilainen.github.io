// Hakuteospesukone: Ensyklopedia Logoksen, Wikipedian (fi, en) ja Open Encyclopedia of Cognitive Sciencen artikkelit sekä
// marxists.orgin ja Wait But Whyn kirjoitukset sekä Encyclopedia.comin, IPA:n IRED-sanakirjan ja St Andrews Encyclopaedia of Theologyn artikkelit sekä Project Gutenbergin kirjat, New Adventin ja CCEL:n kirkkoisät, Psychen ja Aeonin esseet, European Journal of Psychoanalysisin artikkelit, Open Journal Systems -lehtien (Problemos ym.) artikkelit, LacusCurtiuksen Loeb-käännökset ja Visuotinė lietuvių enciklopedijan artikkelit sekä EUR-Lexin ja Find Case Law'n oikeustapaukset ja PubMed Centralin, Ubiquity Pressin ja SPIP-lehtien artikkelit sekä Political Conceptsin hakusanat ja Project Voxin filosofisivut ja Embryo Projectin artikkelit sekä CDLJ, CDLB, CDLN ja Журнальный залin tekstit sekä Fabulan artikkelit ja Folktextsin sadut sekä A Celebration of Women Writersin kirjat ja CHS:n ja Zeithistorische Forschungenin artikkelit sekä BOMBin haastattelut ja proosa ja PsychOpenin artikkelit sekä Projekt Gutenberg-DE:n kirjat, SLS:n editiot ja Snellmanin asiakirjat sekä PoPuPS-lehtien artikkelit ja Religion Onlinen kirjat ja artikkelit sekä isidore.co:n Akvinolainen ja KB:n tekstiportaalin teokset sekä Michigan Publishingin artikkelit ja Philological Museumin uuslatina sekä Book of Concordin tunnustukset, Nova Vulgatan kirjat, EOS:n ja MPRL:n kirjat, Newton Projectin transkriptiot ja The Latin Libraryn tekstit sekä augustinus.it:n Augustinus ja GRETILin sanskritteksit ja laparola.netin Uusi testamentti, PubMedin tiivistelmät ja The Conversationin artikkelit sekä Girardian Lectionaryn, Phenomenology Onlinen, Lacan Onlinen, Hedgehog Review'n ja The Immanent Framen kirjoitukset sekä Springer Naturen (BMC, Springer, nature.com), PLOSin, Frontiersin ja journal.fi:n pdf-lehden artikkelit sekä Wisdom Libraryn, Bibliotheca Augustanan, Access to Insightin, Hume Texts Onlinen, Perseids CTS:n, CELTin, Standard Ebooksin, Rousseau Onlinen, PROPYLÄENin, Hamannin HKB:n, schleiermacher digitalin, Humboldtin kirjeiden, Liviuksen ja avesta.orgin tekstit sekä Avoimen Kalevalan ja Kantelettaren runot ja asiakirjat sekä Henrik Ibsens skrifterin näytelmät, kirjeet ja runot ja Henry Parlands Skrifterin tekstit sekä HUDOCin ja Finlexin oikeustapaukset sekä WiBiLexin ja Themelioksen artikkelit sekä Persée- ja Cambridge Core -lehtien artikkelit sekä TextGrid Repositoryn teokset ja Schellingin Nachlass-Editionin tekstit Lukimeen-lisäosan, Latomon ja md.js:n läpi (käyttäjän pyynnöt
// 10.11.2026 ja 11.11.2026; SEP:lle on sep-pesukone.js). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/hakuteos-pesukone.js [--vali kansio] [--nayta] [--elava] [--sarja logos|wikipedia|oecs|mia|wbw|enc|ired|saet|gutenberg|newadvent|ccel|psyche|ejp|ojs|lacus|korpora|dhamma|wikisource|substack|iep|oyc|ndpr|tascabile|bmcr|ojs2|noema|matuschak|fivebooks|perseus|pg|tertullian|vle|pressbooks|openedition|hypotheses|manifold|forummagnum|janeway|scielo|obp|fadedpage|archive|folger|wikimuut|gwern|larb|tri16|eurlex|fcl|pmc|ubiquity|spip|pc|vox|embryo|cdli|zz|fabula|folk|cww|chs|zf|bomb|ojs3|pgde|sls|snellman|popups|ro|aquinas|kb|michigan|pm|boc|nv|eoa|np|ll|aug|gretil|laparola|pubmed|tc|viisi|lehdet|laake|laake2|wl|ba|ati|hume|cts|celt|se|rousseau|propylaen|hkb|schleiermacher|wvh|livius|avesta|zk|pr|lb|kal|ib|pl|hudoc|finlex|wibilex|themelios|persee|cambridge|tg|schelling] [osoitteet]
// Sivut haetaan kerran välimuistiin (oletus: tmp/hakuteos-pesukone; tekstejä ei viedä repoon), myös sivut, joita lisäosa
// pyytää (Logoksen viitatut artikkelit, marxists.orgin alaviitesivut). Mittaa lähteen ja tuloksen otsikot, alaviitteet,
// kirjallisuusluettelon (p.bib, tunnistetut kohdat), lähdelinkit, rikkinäiset ja epäilyttävät (luettelon kohdasta puuttuu
// linkin vuosi tai nimi), Wikipedian artikkeliluettelon pituuden ja jäänteet (muokkaa-linkit, raaka HTML, merkit).
// --nayta tulostaa otsikot, varoitukset ja epäilyttävät kohteet. Tulos: välimuistiin <nimi>.md ja <nimi>.leike.md.
// Ennen ja jälkeen (22.11.2026): --ulos kansio kirjoittaa tulokset muualle kuin välimuistiin (sama välimuisti kummallekin
// ajolle), ja --vertaa kansio vertaa jokaista <nimi>.md:tä aiemman ajon samannimiseen ja kertoo muuttuneet rivit.
// OECS:n sivut ovat oecs.knowledgefutures.orgista: oecs.mit.edu (PubPub) estää pilvikontin.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), cp = require('child_process');
const { chromium } = require('playwright');

const arg = process.argv.slice(2);
const otaArvo = n => { const i = arg.indexOf(n); if (i < 0) return null; const v = arg[i + 1]; arg.splice(i, 2); return v; };
const otaLippu = n => { const i = arg.indexOf(n); if (i < 0) return false; arg.splice(i, 1); return true; };
const VALI = otaArvo('--vali') || path.join(os.tmpdir(), 'hakuteos-pesukone');
const ULOS = otaArvo('--ulos') || VALI;
const VERTAA = otaArvo('--vertaa');
const NAYTA = otaLippu('--nayta');
// --elava: sivun omat skriptit, tyylit ja kirjasimet verkosta, kuten käyttäjän selaimessa (asiakirja ja sivuston haut yhä
// välimuistista). Kaavat (Frontiers: MathJax 2, Springer Nature: MathJax 3) syntyvät vasta skriptistä: ilman tätä pesukone näkee
// tyhjän kaavapaikan tai raa'an TeXin. NCBI:n palvelimille ei mennä (tarkistussivu).
const ELAVA = otaLippu('--elava');
// Muuttuneet rivit (diff): 0, kun sama; null, kun vertailukansiossa ei ole tiedostoa.
function muuttuneet(nimi, uusi) {
  const f = VERTAA && path.join(VERTAA, nimi);
  if (!f || !fs.existsSync(f)) return null;
  if (fs.readFileSync(f, 'utf8') === uusi) return 0;
  const g = path.join(os.tmpdir(), 'pesukone-vertaa-' + process.pid);
  fs.writeFileSync(g, uusi);
  let out = '';
  try { out = cp.execFileSync('diff', [f, g], { maxBuffer: 1 << 28 }).toString(); } catch (e) { out = String(e.stdout || ''); }
  fs.rmSync(g, { force: true });
  return out.split('\n').filter(r => /^[<>] /.test(r)).length;
}
const SARJAT = {
  logos: ['https://filosofia.fi/fi/ensyklopedia/descartes-rene', 'https://filosofia.fi/fi/ensyklopedia/habermas-jurgen',
    'https://filosofia.fi/fi/ensyklopedia/bioetiikka', 'https://filosofia.fi/fi/ensyklopedia/zizek-slavoj',
    'https://filosofia.fi/fi/ensyklopedia/hegelin-ensyklopedinen-jarjestelma'],
  wikipedia: ['https://fi.wikipedia.org/wiki/Litte%C3%A4_Maa', 'https://fi.wikipedia.org/wiki/Immanuel_Kant',
    'https://en.wikipedia.org/wiki/Age_of_Enlightenment', 'https://en.wikipedia.org/wiki/Flat_Earth',
    'https://lt.wikipedia.org/wiki/Immanuel_Kant', 'https://lt.wikipedia.org/wiki/Filosofija'],
  // Psykologian ja kognitiotieteen artikkeleita: Complex Dynamical Systems, Working Memory, Intelligence, Emotions, Signal
  // Detection Theory (kaavat, taulukot), Attention (taulukko, kuvat).
  oecs: ['00hsw4x2', '1rgtz41v', 'r4aze9cq', 'bhn7j5s7', '608a12kc', 'xdqgwrkq'].map(p => 'https://oecs.knowledgefutures.org/pub/' + p),
  // Eri vuosikymmenten sivupohjat: alaviitteet samalla ja toisella sivulla, koko teos yhdellä sivulla, suomenkielinen osasto.
  mia: ['archive/marx/works/1844/manuscripts/labour.htm', 'archive/marx/works/1867-c1/ch01.htm', 'archive/lenin/works/1917/staterev/ch01.htm',
    'archive/marx/works/1845/theses/theses.htm', 'archive/lukacs/works/history/hcc05.htm', 'suomi/lenin/1917/valtio-ja-vallankumous.htm',
    'suomi/marx-engels/1848/kommunistisen-puolueen-manifesti/ch01.htm'].map(p => 'https://www.marxists.org/' + p),
  wbw: ['2015/01/artificial-intelligence-revolution-1.html', '2016/03/sound.html', '2017/04/neuralink.html', '2014/05/life-weeks.html',
    '2014/06/taming-mammoth-let-peoples-opinions-run-life.html'].map(p => 'https://waitbutwhy.com/' + p),
  // Encyclopedia.com (13.11.2026): monen artikkelin aihesivut (ensimmäinen artikkeli) ja artikkelien omat osoitteet eri
  // hakuteoksista: International Dictionary of Psychoanalysis (myös katkennut byline), IESS, Encyclopedia of Philosophy,
  // New Catholic Encyclopedia.
  enc: ['people/medicine/psychology-and-psychiatry-biographies/carl-gustav-jung', 'people/medicine/psychology-and-psychiatry-biographies/sigmund-freud',
    'psychology/dictionaries-thesauruses-pictures-and-press-releases/jung-carl-gustav-1875-1961',
    'psychology/dictionaries-thesauruses-pictures-and-press-releases/collective-unconscious-analytical-psychology',
    'psychology/dictionaries-thesauruses-pictures-and-press-releases/transference', 'psychology/dictionaries-thesauruses-pictures-and-press-releases/psychoanalysis',
    'social-sciences/applied-and-social-sciences-magazines/psychoanalysis', 'humanities/encyclopedias-almanacs-transcripts-and-maps/jung-carl-gustav-1875-1961',
    'religion/encyclopedias-almanacs-transcripts-and-maps/free-will'].map(p => 'https://www.encyclopedia.com/' + p),
  // IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis (13.11.2026): FlippingBook-kirjan lyhimmät hakusanat (Amae,
  // Setting, Liberman) keskeltä hakusanaa; leikkuri hakee sisällysluettelon ja hakusanan muut sivut (noin 50 sivua välimuistiin).
  ired: ['8', '920', '1045'].map(n => 'https://online.flippingbook.com/view/544664/' + n + '/'),
  // St Andrews Encyclopaedia of Theology (14.11.2026): kaikki viisi uskontoa, alaluvut kolmeen tasoon (Social Trinitarianism),
  // ristiviittaukset (section 5), lähdepainoksen Attributions-kappale (Dōgen), kaksi tekijää (Hasidism) ja 17 000 sanan artikkelit.
  saet: ['Buddhism/Dogen', 'Buddhism/BuddhismandWesternPsychology', 'Christianity/SocialTrinitarianism', 'Christianity/EusebiusofCaesarea',
    'Islam/Iblis', 'Hinduism/Yoga', 'Judaism/TheologyandPraxisinHasidism'].map(p => 'https://www.saet.ac.uk/' + p),
  // Project Gutenberg (14.11.2026): kokonaiset kirjat eri aikojen merkinnöin. DP (span.pagenum, a.fnanchor → div.footnote):
  // Critique of Judgement; TEI (span.tei-pb, viitteet dt/dd): James, Schopenhauer; vanhat (p.footnote kappaleen perässä,
  // p.toc): Critique of Pure Reason, Meditations, Ethics, Treatise, Critique of Practical Reason, Augustinus; ilman viitteitä:
  // Republic, Beyond Good and Evil; suomeksi: Kalevala (23 000 säettä), Seitsemän veljestä.
  gutenberg: ['4280', '48433', '5683', '621', '38427', '2680', '3800', '4705', '3296', '1497', '4363', '7000', '11940']
    .map(n => 'https://www.gutenberg.org/cache/epub/' + n + '/pg' + n + '-images.html'),
  // New Advent (14.11.2026): yhden sivun teokset (Ignatius, Justinos, Tertullianus, Khrysostomoksen homilia), Irenaeuksen luku
  // (kootaan Book I), Stromatan sisällysluettelo (kootaan kahdeksan kirjaa), Catholic Encyclopedia ja Summa.
  newadvent: ['fathers/0104', 'fathers/0126', 'fathers/0301', 'fathers/210201', 'fathers/0103101', 'fathers/0210', 'cathen/11567b', 'summa/1002']
    .map(p => 'https://www.newadvent.org/' + p + '.htm'),
  // CCEL (14.11.2026): Ignatiuksen luku (kootaan kirje kahtena recensiona), Justinoksen 1. apologian juuri (68 lukua), Tertullianuksen
  // Apologian luku (otsikot kappaleina), Tunnustusten luku (kootaan Book I), Khrysostomoksen pitkä homilia yksin, Lutherin Galatalaiskirje.
  ccel: ['schaff/anf01/anf01.v.ii.i', 'schaff/anf01/anf01.viii.ii', 'schaff/anf03/anf03.iv.iii.i', 'schaff/npnf101/npnf101.vi.I_1.I',
    'schaff/npnf111/npnf111.vi.i', 'luther/galatians/galatians.iv'].map(p => 'https://ccel.org/ccel/' + p + '.html'),
  // Psyche ja Aeon (14.11.2026): sama julkaisija ja alusta. Psychoanalyysi, Jung ja kiintymyssuhde: Ideas-esseet, Guide
  // (luvut, Key points, Learn more), Aeonin pitkät esseet (nostolainaukset, kuvatekstit).
  psyche: ['https://psyche.co/ideas/for-donald-winnicott-the-psyche-is-not-inside-us-but-between-us',
    'https://psyche.co/ideas/jungs-archetypes-are-a-mirror-that-shows-who-and-what-we-are',
    'https://psyche.co/ideas/my-failed-analysis-gave-me-confidence-and-taught-me-when-to-quit',
    'https://psyche.co/ideas/why-so-many-of-us-see-our-loved-ones-after-they-have-died',
    'https://psyche.co/guides/how-to-reconnect-with-your-inner-child',
    'https://aeon.co/essays/when-clinging-to-old-hopes-gets-in-the-way-of-healing-and-growth',
    'https://aeon.co/essays/learn-your-own-attachment-style-to-become-a-better-parent',
    'https://aeon.co/essays/what-do-we-know-about-social-attachment-and-human-nature'],
  // European Journal of Psychoanalysis (15.11.2026): lihavoidut väliotsikot kahdella tasolla (lihavoitu kursiivi ###), numeroidut
  // otsikot, linkittömät [1]-viitteet (Notes, Note, Wordin tyhjät ankkurit), merkittömät viitteet (Consciousness), References-
  // otsikko, kuvatekstit h6:na, sisennetyt lainaukset, artikkeli ilman väliotsikoita ja viitteitä.
  ejp: ['freuds-compass-a-critical-defense-of-oedipal-bodies', 'freud-and-the-21st-century-political',
    'a-large-language-model-is-structured-like-the-unconscious-the-ordinary-perverse-psychosis-of-ai',
    'a-martian-among-the-spectra-autism-subjectivity-and-philosophy',
    'psychoanalysis-and-artificial-intelligence-metapsychological-foundations-clinical-implications-and-the-transformation-of-analytic-practice',
    'the-reticular-system-in-freud-and-lacans-theories', 'consciousness-and-cognitive-sciences',
    'the-voice-that-ends-opera-moses-encounter-and-the-failure-of-representation-in']
    .map(p => 'https://www.journal-psychoanalysis.eu/articles/' + p + '/'),
  // LacusCurtius (16.11.2026): Loebin käännökset luvuin ja pykälin, Loebin ja Thayerin viitteet, säkeet ja kuvataulukko (Suetonius),
  // kääntäjä teoksen etusivulta (Plutarkhos), viitteetön kirja vuosilukutaulukkoineen (Cassius Dio), sivuille jaettu kirja
  // (Tacituksen Annals 1B → 1A…1E, Isis ja Osiris A → A…E, Strabo 1B1 → luvut 1–4 väliotsikoin ja viitteen tunniste kappaleessa,
  // Quintilianus ilman h1:tä), h1 Tekijä: Teos ja lukuluettelo (Frontinus) ja Smithin sanakirjan artikkeli (h4-tiedot,
  // viittaamaton Thayer's Note loppuun).
  lacus: ['Suetonius/12Caesars/Julius*', 'Plutarch/Lives/Caesar*', 'Cassius_Dio/44*', 'Tacitus/Annals/1B*',
    'Plutarch/Moralia/Isis_and_Osiris*/A', 'Strabo/1B1*', 'Quintilian/Institutio_Oratoria/1A*', 'Frontinus/Strategemata/1*',
    'secondary/SMIGRA*/Corona'].map(p => 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/' + p + '.html'),
  // Open Journal Systems (16.11.2026): Vilnan yliopiston lehdet (journals.vu.lt). Problemos 2026 (liettua ja englanti,
  // artikkelisivulta kokoteksti), 2025 (kokotekstin sivu; liettuankielinen ilman väliotsikoita), 2024 (h3-osiot), 2023 ja 2020
  // (div.footnote), 2019 (tekijä h3:na, toisen kielen otsikko h2:na, tyhjä h1), pdf-artikkeli 2017 (Readabilitylle);
  // Literatūra (kaksi luetteloa), Religija ir kultūra (h2 ja h4), Politologija (taulukot), Kalbotyra.
  ojs: ['problemos/en/article/view/49370', 'problemos/en/article/view/46565', 'problemos/en/article/view/42172/41773',
    'problemos/en/article/view/42215', 'problemos/en/article/view/34758/35144', 'problemos/en/article/view/32069',
    'problemos/en/article/view/17104/16240', 'problemos/en/article/view/12735', 'problemos/en/article/view/12734/11466',
    'problemos/en/article/view/10890', 'literatura/en/article/view/44682', 'religija-ir-kultura/en/article/view/48020',
    'politologija/en/article/view/45186', 'kalbotyra/en/article/view/45716'].map(p => 'https://www.journals.vu.lt/' + p)
    // Filosofija. Sociologija (lmaleidykla.lt, 22.11.2026): pdf-artikkelit tiivistelmäleikkeenä (kahdesti koodatut &nbsp;), numeron
    // nimiösivu ja sisällys ilman tiivistelmää.
    .concat(['6953', '6844', '7192', '7193'].map(n => 'https://www.lmaleidykla.lt/ojs/index.php/filosofija-sociologija/article/view/' + n)),
  // OJS muualla (16.11.2026, pahvin A7): Con-Textos Kantianos (revistas.ucm.es, HTML-galleyt). journal.fi:n lehdet ovat
  // Anubis-botintorjunnan takana, Kant e-prints julkaisee vain pdf:iä.
  ojs2: ['89493', '89488', '89482', '89492', '89473'].map(n => 'https://revistas.ucm.es/index.php/KANT/article/view/' + n),
  // Korpora.org/kant (16.11.2026): Akademie-Ausgaben sivuista kootut teokset. Grundlegung (viitteitä sivunvaihdon yli, h5-
  // otsikot), Was ist Aufklärung? (nimiö ja teksti samalla sivulla), KpV (nimiösivu, h2–h5, §-otsikot), Logik (I + otsikko),
  // Anthropologie (rinnakkaisviittaukset), KrV B:n Ästhetik (teos yli rajan: osa) ja kirje (vain sivu).
  // dhammatalks.org (16.11.2026): kirja etusivulta ja luvun sivulta. Noble Strategy (allekirjoitus, ohjattu meditaatio), Mind Like
  // Fire Unbound (säkeet, sivunumerot), Skill in Questions (sivun omat viitteet, sutta-lainaukset, osat ja luvut), Buddhist
  // Romanticism (loppuviitteet omalla sivullaan, sisäkkäinen sisällysluettelo), Meditations 1 (44 puhetta).
  // Wikisource (16.11.2026): en (Meiklejohnin KrV:n johdanto: sivunumerot, otsake, viitteet), de (Aufklärung: Textdaten,
  // PageNumber, viitteet), la (Descartesin Meditatio I Adamin ja Tanneryn laitoksena), fi (Ahon Rautatie, luku; otsikkomalline).
  wikisource: ['https://en.wikisource.org/wiki/Critique_of_Pure_Reason_(Meiklejohn)/Introduction',
    'https://de.wikisource.org/wiki/Beantwortung_der_Frage:_Was_ist_Aufkl%C3%A4rung%3F',
    'https://la.wikisource.org/wiki/Meditationes_de_prima_philosophia_(Adam_et_Tannery)/Meditatio_I', 'https://fi.wikisource.org/wiki/Rautatie:_I_luku',
    // Vikišaltiniai (22.11.2026): Donelaitiksen Metai (säkeet dl/dd-riveinä, otsakemalline), Daukantas (pitkä proosa) ja perustuslaki
    // (artiklat otsikkoina ennen ensimmäistä pitkää kappaletta).
    ...['Metai', 'Būdas_senovės_lietuvių,_kalnėnų_ir_žemaičių', 'Lietuvos_Respublikos_Konstitucija'].map(p => 'https://lt.wikisource.org/wiki/' + p),
    // sv (26.11.2026): teoksen kokoaminen sisällysluettelosivulta: Fänrik Ståls sägner (erilliset sivut, otsakkeessa linkki
    // takaisin), Julqvällen (alasivut) ja yksittäinen runo Vårt land.
    ...['F%C3%A4nrik_St%C3%A5ls_s%C3%A4gner', 'Julqv%C3%A4llen', 'V%C3%A5rt_land'].map(p => 'https://sv.wikisource.org/wiki/' + p)],
  // Substack (16.11.2026, alusta): The Convivial Society (alaviitteet, lainaukset, jako- ja tilausnapit) ja Experimental History
  // (kuvat kuvateksteineen, alaviitteet), myös omalla verkkotunnuksella.
  // Internet Encyclopedia of Philosophy (16.11.2026): Stoicism (osiot ja alaosiot, sanasto), Kant: Metaphysics, Hegel: Social and
  // Political Thought (neljä otsikkotasoa, kirjallisuus kahtena alalukuna), Descartes (pitkä kirjallisuus).
  // Open Yale Courses (16.11.2026): luentojen litteraatiot. Kaganin Death (luvut aikaleimoin, puhujat), Shapiron Introduction to
  // Political Philosophy, Gendlerin Philosophy and the Science of Human Nature, Fryn Theory of Literature, Martinin Uusi testamentti
  // ja Hayesin Heprealainen Raamattu.
  // Notre Dame Philosophical Reviews (16.11.2026): Wordin loppuviitteet (_edn), REFERENCES-kappale, arvio ilman viitteitä, vanhat arviot.
  // Il Tascabile ja Doppiozero (16.11.2026): italialaiset esseelehdet; kuvat, mainokset ja liittyvät artikkelit pois.
  tascabile: ['https://www.iltascabile.com/letterature/stati-salute/', 'https://www.iltascabile.com/linguaggi/alchimista-suono/',
    'https://www.iltascabile.com/linguaggi/identita-comunita/', 'https://www.doppiozero.com/anne-carson-le-urla-di-antigonick',
    'https://www.doppiozero.com/addestrati-allorrore', 'https://www.doppiozero.com/bartov-la-sconfitta-morale-di-israele'],
  // Bryn Mawr Classical Review (16.11.2026): Wordin viitteet (_ftn), kokoomateoksen Authors and titles, kreikkaa (2026.10.38).
  // Noema ja Emergence Magazine (16.11.2026): nostolainaukset (toistuvat tekstissä), kuvatekstit, kehotteet, tekijätiedot.
  noema: ['https://www.noemamag.com/a-radical-new-proposal-for-how-mind-emerges-from-matter', 'https://www.noemamag.com/a-new-kind-of-creative-poverty',
    'https://www.noemamag.com/a-generation-revolts', 'https://emergencemagazine.org/essay/benchmarking/',
    'https://emergencemagazine.org/essay/seeds-and-our-coevolved-psyches/', 'https://emergencemagazine.org/essay/new-life-for-the-ezo-spruce/'],
  // Andy Matuschakin esseet (16.11.2026): reunahuomautukset (span.sidenote, ttft:n span.marginnote), kaksoisresepti, sisällys.
  matuschak: ['https://andymatuschak.org/prompts/', 'https://andymatuschak.org/books/', 'https://andymatuschak.org/hmwl/',
    'https://numinous.productions/ttft/'],
  // Five Books (16.11.2026): haastattelut, kirjat väliotsikoiksi, nostolainaukset ja tukipyyntö pois.
  fivebooks: ['massimo-pigliucci-stoicism', 'key-philosophical-texts-western-nigel-warburton', 'chinese-philosophy-michael-puett']
    .map(p => 'https://fivebooks.com/best-books/' + p + '/'),
  // Perseus (16.11.2026): koko kirja TEI-XML:stä. Valtio englanniksi (Stephanus, puhujat, viitteet) ja kreikaksi (Beta-koodi),
  // Thukydides (kirja.luku.pykälä), Ilias kreikaksi (säkeet, card). Kreikankieliset sivut lomittuvat englannin kanssa
  // (16.11.2026, ladonta: lomitettu käännös); Thukydides myös kreikaksi.
  // Perseus: Valtio englanniksi ja kreikaksi, Thukydides, Ilias kreikaksi, de Finibus latinaksi koko teoksena (18.11.2026:
  // treema + ja iktus /, hakemisto pois).
  perseus: ['1999.01.0168:book=1:section=327a', '1999.01.0167:book=1:section=327a', '1999.01.0200:book=1:chapter=1',
    '1999.01.0199:book=1:chapter=1', '1999.01.0133:book=1:card=1', '2007.01.0036'].map(p => 'http://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A' + p.replace(/:/g, '%3A').replace(/=/g, '%3D')),
  // Pressbooks (17.11.2026): pressbooks.pub ja useimmat yliopistojen verkot estävät pilvikontin, joten TMU:n ja PALNI:n palvelimet.
  // Toimitettu kokoelma (luvun tekijät, Pressbooksin alaviitteet), Wordin alaviitteet (_ftn) ja osiot, 13 osan klassikko
  // käännöksineen kirjan etusivulta, oppikirja (luvut ilman osia).
  pressbooks: ['https://pressbooks.palni.org/catholicimagination/chapter/incarnating-the-homily/',
    'https://pressbooks.palni.org/biblicalnarrative/chapter/2-author-narrator-worldview/',
    'https://pressbooks.library.torontomu.ca/nicomacheanethics/', 'https://pressbooks.palni.org/psychopathology/chapter/chapter-1/'],
  // OpenEdition (17.11.2026): Astérion (ranska, tiivistelmät fr/en, alaviitteet, kappalenumerot, lainaukset), EJPAP (englanti,
  // alaotsikko, kirjallisuus), kirjan luku ilman tekijää (motto, alaviitteet) ja tekijän kanssa. Anubis päästää curlin oman
  // tunnisteen läpi (selaimen tunnisteelle se antaa JavaScript-haasteen), joten openedition.orgille ei lähetetä Mozilla/5.0:aa.
  openedition: ['https://journals.openedition.org/asterion/12724', 'https://journals.openedition.org/ejpap/6584',
    'https://books.openedition.org/editionscnrs/89827', 'https://books.openedition.org/ies/7650'],
  // Hypotheses.org (17.11.2026): saksa (WP Footnotes, twentyeleven), ranska (40 ja 34 viitettä, twentyfourteen), englanti
  // (twentyfifteen). Kuten openedition.org, haetaan curlin omalla tunnisteella.
  hypotheses: ['https://djgd.hypotheses.org/2985', 'https://cmhn.hypotheses.org/12639', 'https://antiquitebnf.hypotheses.org/35200',
    'https://ghil.hypotheses.org/9137'],
  // Manifold (17.11.2026): Minnesotan yliopiston kustantamon tietokirja loppuviitteineen (Notes-osio) ja CUNY:n romaani.
  manifold: ['https://manifold.umn.edu/read/epub-9781452932958/section/25f2fc34-dea0-4233-a63f-1901e504ae69',
    'https://cuny.manifoldapp.org/read/black-no-more/section/08dbb712-67f5-45e4-924e-03e9c045447e'],
  // ForumMagnum (17.11.2026): LessWrong (kaksi kirjoitusta, 9 ja 13 viitettä) ja EA Forum (Next.js:n virtaamat palat, 14 viitettä).
  forummagnum: ['https://www.lesswrong.com/posts/2zyskdas6TsL9dqNg/outer-space-is-not-consistently-big',
    'https://www.lesswrong.com/posts/GSseMxyeJmqQgKQi4/the-siren-song-of-the-inside-game',
    'https://forum.effectivealtruism.org/posts/JadwtSNrdsSaF6Ciq/intrasolar-and-extrasolar-space-governance'],
  // Janeway (17.11.2026): OLH saksaksi (osiot, kuvat, alaviitteet, kirjallisuus), Orbit, C21 ja Glossa. Anubis kuten openedition.org.
  janeway: ['https://olh.openlibhums.org/article/id/20095/', 'https://orbit.openlibhums.org/article/id/10021/',
    'https://c21.openlibhums.org/article/id/16680/', 'https://www.glossa-journal.org/article/id/17649/'],
  // SciELO (17.11.2026): Diánoia (Meksiko; pääkirjoitus ilman viitteitä, artikkeli otsikon alaviitteineen, tiivistelmät es/en,
  // kirjallisuus) ja Ideas y Valores (Kolumbia). www.scielo.br on Bunny Shield -haasteen takana.
  scielo: ['https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S0185-24502025000100101&lng=es&nrm=iso',
    'https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S0185-24502025000100103&lng=es&nrm=iso',
    'http://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0120-00622024000200009&lng=es&nrm=iso',
    'http://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0120-00622024000200027&lng=es&nrm=iso'],
  // Open Book Publishers (17.11.2026): Lameris, Feeling Colour (osat, loppuviitteet, kirjallisuus, filmografia) luvun sivulta ja
  // toimitettu kokoelma sisällyksestä.
  obp: ['https://books.openbookpublishers.com/10.11647/obp.0380/ch1.xhtml', 'https://books.openbookpublishers.com/10.11647/obp.0360/contents.xhtml'],
  // Faded Page (17.11.2026): romaani (fpgen 4.59), elämäkerta alaviitteineen ja hakemistoineen, walesinkielinen kertomus 32
  // alaviitteellä ja ranskalainen romaani. Kirjan HTML aukeaa vain istuntoevästeellä (kirjan sivu → link.php → html.php), joten
  // välimuistiin haetaan curlilla evästeiden kanssa ennen ajoa (ks. opas 7.5).
  fadedpage: ['20190320', '20260639', '20220612', '20161011'].map(p => 'https://www.fadedpage.com/books/' + p + '/html.php'),
  // Internet Archiven tekstiversiot (17.11.2026): Max Müllerin Kant-käännös 1881 (OCR, juoksevat otsakkeet, kreikan OCR-roskaa),
  // William Jamesin Principles of Psychology (Toronto) ja saksankielinen Google-skannaus (fraktuura-OCR).
  archive: ['immanuelkantscri033491mbp', 'principlesofpsyc01jameuoft', 'zarathustracomm00naumgoog']
    .map(i => 'https://archive.org/stream/' + i + '/' + i + '_djvu.txt'),
  // Folger Shakespeare (17.11.2026): Hamlet kokonaan, Macbethin yksi kohtaus ja Myrskyn kokonainen näytelmä (laulut).
  folger: ['hamlet/read/', 'macbeth/read/1/3/', 'the-tempest/read/'].map(p => 'https://www.folger.edu/explore/shakespeares-works/' + p),
  // Wikipedia muilla kielillä (17.11.2026, pahvin *20 sivustosovitetta* 14): Kant italiaksi, saksaksi, ranskaksi, tanskaksi,
  // espanjaksi, viroksi, ruotsiksi ja kreikaksi (ohjausrivit, Katso myös -osiot, sisarprojektit, taulukot, lainausmalline).
  wikimuut: ['it/Immanuel_Kant', 'de/Immanuel_Kant', 'fr/Emmanuel_Kant', 'da/Immanuel_Kant', 'es/Immanuel_Kant', 'et/Immanuel_Kant',
    'sv/Immanuel_Kant', 'el/%CE%99%CE%BC%CE%BC%CE%AC%CE%BD%CE%BF%CF%85%CE%B5%CE%BB_%CE%9A%CE%B1%CE%BD%CF%84']
    .map(p => 'https://' + p.split('/')[0] + '.wikipedia.org/wiki/' + p.split('/')[1]),
  // Gwern.net (17.11.2026): pitkä katsaus (69 alaviitettä, päivämäärävälit, hinnat), essee ja lyhyt muistiinpano.
  gwern: ['spaced-repetition', 'scaling-hypothesis', 'note/variance-component'].map(p => 'https://gwern.net/' + p),
  // Los Angeles Review of Books (17.11.2026): kahden kirjan haastattelu (lainaukset, osanvaihdot) ja yhden kirjan arvio.
  larb: ['agency-biology-lamarck-aristotle-jessica-riskin-melanie-challenger', 'arrows-of-desire-peter-wollen-film-criticism-director']
    .map(p => 'https://lareviewofbooks.org/article/' + p + '/'),
  // 3:16 (17.11.2026): kaksi End Times -haastattelua (nostolainaukset alussa, kysymykset 3:16:, vastaajan nimi tai nimikirjaimet).
  tri16: ['being', 'camus-and-fanon'].map(p => 'https://www.3-16am.co.uk/articles/' + p),
  // EUR-Lex (18.11.2026, pahvin *10 sivustosovitetta* 1A): Schrems I englanniksi ja suomeksi (vanha muoto), Botin ratkaisuehdotus
  // samassa asiassa, Meta Platforms 2023 (coj-muoto, sisällysluettelo) ja Rantosin ratkaisuehdotus (coj), tuore tuomio 2024 suomeksi.
  eurlex: ['EN/TXT/?uri=CELEX:62014CJ0362', 'FI/TXT/?uri=CELEX:62014CJ0362', 'EN/TXT/HTML/?uri=CELEX:62014CC0362',
    'EN/TXT/HTML/?uri=CELEX:62021CJ0252', 'EN/TXT/HTML/?uri=CELEX:62021CC0252', 'FI/TXT/HTML/?uri=CELEX:62023CJ0021']
    .map(p => 'https://eur-lex.europa.eu/legal-content/' + p),
  // Find Case Law (18.11.2026, pahvin 1B): UKSC (puhujarivi, alakohdat, lainaukset), Rwanda-tuomio (kaksi puhujaa, numerottomat
  // lainaukset), EWCA Civ (kursiiviset ja alleviivatut väliotsikot), EWHC (Ch) (I:-otsikot, alakohdat), EWHC (Admin) (päiväys
  // numeroina, puhujarivi ja ensimmäinen otsikko otsakkeessa, sivunvaihdon katkaisemat lainauksen kappaleet). Sivun skripti
  // kirjoittaa kappalenumerot linkeiksi (Paragraph, Copy link to this paragraph), joten aja myös --elava: tulosten pitää olla samat.
  fcl: ['uksc/2024/12', 'uksc/2023/42', 'ewca/civ/2022/379', 'ewhc/ch/2024/1', 'ewhc/admin/2026/3056'].map(p => 'https://caselaw.nationalarchives.gov.uk/' + p),
  // PubMed Central (18.11.2026, pahvin 2): Medical Historyn kaksi artikkelia (alaviitteet, tiivistelmä, avainsanat) ja kliininen
  // artikkeli (kirjallisuusluettelo, taulukot). PMC antaa kontille reCAPTCHA-sivun noin neljännestä peräkkäisestä hausta alkaen.
  pmc: ['PMC12041326', 'PMC11949638', 'PMC6334128'].map(p => 'https://pmc.ncbi.nlm.nih.gov/articles/' + p + '/'),
  // Lääketieteen kierros PMC:ssä (22.11.2026): JAMA Netw Open (Key Points), BMJ (järjestelmällinen katsaus, joulunumero),
  // Lancet Public Health, eLife, Cureus (tapausselostus), Cochrane, World Psychiatry, Scand J Prim Health Care (laadullinen),
  // BMC Med Res Methodol (kaavat), Dtsch Ärztebl (kuvatapaus), NEJM (tekijän käsikirjoitus), Lancet (RCT) ja Bull WHO.
  laake: ['PMC13583879', 'PMC9992728', 'PMC11957479', 'PMC11587887', 'PMC12005723', 'PMC12860570', 'PMC11339634', 'PMC11403163',
    'PMC12135696', 'PMC11687162', 'PMC12442802', 'PMC7616851', 'PMC7618965', 'PMC11865846'].map(p => 'https://pmc.ncbi.nlm.nih.gov/articles/' + p + '/'),
  // Lääketieteen toinen kierros: vaikeat syötteet. Kaavat (MathML: Stat Methods Med Res, BMC Med Res Methodol; kaavat kuvina:
  // vanhat BMC:n artikkelit PMC:ssä, PLOS), takaisin vedetyt artikkelit (PMC, Springer Nature, PLOS, Frontiers), videot (JoVE,
  // eLife), esipainos (medRxiv PMC:ssä), Research in context -laatikko (eClinicalMedicine) ja hoitosuositus (Can Fam Physician).
  laake2: [...['PMC10507591', 'PMC9900140', 'PMC12483616', 'PMC212708', 'PMC194902', 'PMC10746143', 'PMC11785453', 'PMC10828604',
    'PMC10746309', 'PMC11601726', 'PMC10575658', 'PMC9983058'].map(p => 'https://pmc.ncbi.nlm.nih.gov/articles/' + p + '/'),
    ...['10.1186/s12874-025-02615-0', '10.1186/s12874-025-02714-y', '10.1186/s12889-020-09939-0', '10.1186/s12889-024-20086-8']
      .map(d => 'https://link.springer.com/article/' + d),
    ...['plosmedicine/article?id=10.1371/journal.pmed.1004491', 'plosone/article?id=10.1371/journal.pone.0092230',
      'plosmedicine/article?id=10.1371/journal.pmed.1004358'].map(p => 'https://journals.plos.org/' + p),
    ...['psychiatry/articles/10.3389/fpsyt.2022.990678', 'public-health/articles/10.3389/fpubh.2025.1627621',
      'public-health/articles/10.3389/fpubh.2025.1514501'].map(p => 'https://www.frontiersin.org/journals/' + p + '/full')],
  // Ubiquity Press (18.11.2026, pahvin 3): IRSP (alaviitteet, APA-viittaukset, taulukot ja kuvat), Utrecht Law Review (138
  // alaviitettä, ei kirjallisuutta), Journal of Open Psychology Data ja Journal of Cognition.
  ubiquity: ['https://rips-irsp.com/en/articles/10.5334/irsp.1284', 'https://utrechtlawreview.org/en/articles/10.36633/ulr.1185',
    'https://openpsychologydata.metajnl.com/en/articles/10.5334/jopd.141', 'https://www.journalofcognition.org/en/articles/10.5334/joc.520'],
  // SPIP (18.11.2026, pahvin 4): Vacarme (crayon-luokat, 14 alaviitettä, post-scriptum, kuvat), La Vie des idées (chapo, 12 alaviitettä),
  // Books & Ideas (10 alaviitettä), LMSI (crayon, abbr.published) ja remue.net (pelkkä .texte).
  spip: ['https://vacarme.org/article3289.html', 'https://laviedesidees.fr/Carnino-Hilaire-Perez-Lamy-Histoire-globale-des-techniques',
    'https://booksandideas.net/A-critique-of-the-ideology-of-property', 'https://lmsi.net/L-Extermination-de-la-Commune',
    'https://remue.net/l-ironie-des-choses-d-alain-roussel'],
  // Political Concepts (18.11.2026, pahvin 5): Wordista liitetyt viitteet (Consciousness-Raising: viitteiden id:t rikki, fn32
  // toistuu), Fetishism, Democratization ja Spontaneity (sisällysluettelo, omat ankkurit).
  pc: ['consciousness-raising-camila-lobo', 'fetishism-allan-m-hillani', 'democratization-adi-m-ophir', 'spontaneity-maya-kronfeld']
    .map(p => 'https://www.politicalconcepts.org/' + p + '/'),
  // Project Vox (18.11.2026, pahvin 6): Tullia d'Aragona, Cavendish, Conway ja Shepherdin ranskankielinen käännös (osiot
  // data-vox-section, sisällysluettelo #page_menu, kuvagalleriat).
  vox: ['tullia-daragona-c-1505-1556', 'cavendish-1623-1673', 'conway-1631-1679', 'shepherd-1777-1847-francais']
    .map(p => 'https://projectvox.org/' + p + '/'),
  // Embryo Project Encyclopedia (18.11.2026, pahvin 7): oikeustapaus (kaksi tekijää), tekniikka, henkilö, tietokanta.
  embryo: ['roe-v-wade-1973', 'use-morphine-and-scopolamine-induce-twilight-sleep', 'william-smellie-1697-1763', 'atlas-protein-sequence-and-structure']
    .map(p => 'https://embryo.asu.edu/pages/' + p),
  // Cuneiform Digital Library Journal, Bulletin ja Notes (18.11.2026, pahvin 8): CDLJ 2026-2 (20 viitettä, 103 kirjallisuuden
  // kohtaa), CDLJ 2024-1 (h2-otsikot), CDLB 2011-1 (vanha muoto, viitteet taulukossa), CDLN 2024-1 (translitteraatiotaulukko).
  cdli: ['cdlj/2026-2', 'cdlj/2024-1', 'cdlb/2011-1', 'cdln/2024-1'].map(p => 'https://cdli.earth/articles/' + p),
  // Журнальный зал (18.11.2026, pahvin 9): Новый Журнал 2021/305: Zaharovin proosa (31 000 sanaa, loppuviite [i], luvut keskitettyinä),
  // Kuznecovan muistelma (yläindeksiviitteet ilman linkkejä) ja lyhyt teksti. Teksti on templatessa (sivun skripti ei aja pesukoneessa).
  zz: ['cherez-dve-nedeli-my-budem-schastlivy', 'galina-kuzneczova-poslednyaya-lyubov-ivana-bunina', 'iz-novyh-kumranskih-rukopisej']
    .map(p => 'https://magazines.gorky.media/nj/2021/305/' + p + '.html'),
  // Fabula (18.11.2026, pahvin 10; Lodel kuten OpenEdition): Acta fabulan arvio (kirjan tiedot, 6 viitettä, tiivistelmät fr ja en)
  // ja kaksi Fabula-LhT:n artikkelia (38 viitettä, kirjallisuus p.bibliographie kapiteeleineen, lainaukset p.quotation).
  fabula: ['revue/document21061.php', 'lht/30/escola.html', 'lht/30/abiven.html'].map(p => 'https://www.fabula.org/' + p),
  // Folktexts (D. L. Ashliman; 18.11.2026, varakohde 11): satutyyppikokoelmat (1430, 510A Cinderella) ja Grimmin satu (grimm053).
  folk: ['type1430', 'type0510a', 'grimm053'].map(p => 'https://sites.pitt.edu/~dash/' + p + '.html'),
  // A Celebration of Women Writers (18.11.2026, varakohde 12): Finch 1713 (sisällys- ja erratataulukot, nimiösivu), Cavendishin
  // Blazing World (ei section#main), Behnin The Emperor of the Moon ja Rokeya Sakhawat Hossainin Sultana's Dream.
  cww: ['finch/1713/miscellany-poems', 'newcastle/blazing/blazing', 'behn/emperor/emperor', 'sultana/dream/dream']
    .map(p => 'https://digital.library.upenn.edu/women/' + p + '.html'),
  // Center for Hellenic Studies (18.11.2026, varakohde 14): Classical Inquiries (Nagy, §-kappaleet, Wordin viitteet [1], Bibliography),
  // toinen CI-artikkeli ja Classics@-artikkeli.
  chs: ['https://classical-inquiries.chs.harvard.edu/revisiting-the-question-of-etymology-and-essence/',
    'https://classical-inquiries.chs.harvard.edu/stitching-together-the-lelantine-war/',
    'https://classics-at.chs.harvard.edu/1-the-athenian-empire-and-resistance-to-tyranny/'],
  // Zeithistorische Forschungen (18.11.2026, varakohde 15): vihon 1/2026 neljä artikkelia (kuvat ja videot, 39–119 viitettä).
  zf: ['6304', '6271', '6282', '6291'].map(p => 'https://zeithistorische-forschungen.de/1-2026/' + p),
  // BOMB Magazine (18.11.2026, varakohde 16): Shepardin novelli (2007), Vasilyukin haastattelu (2024) ja Luiselli (2026).
  bomb: ['2007/10/01/the-zero-meter-diving-team', '2024/08/22/sasha-vasilyuk-by-alia-volz', '2026/06/15/valeria-luiselli-beginning-middle-end']
    .map(p => 'https://bombmagazine.org/articles/' + p + '/'),
  // PsychOpen GOLD (18.11.2026, varakohde 17; OJS 3.1, HTML-galleria iframessa #article-html-frame): Social Psychological Bulletin
  // artikkelisivulta ja gallerian sivulta sekä Journal of Social and Political Psychology.
  ojs3: ['https://spb.psychopen.eu/index.php/spb/article/view/12465', 'https://spb.psychopen.eu/index.php/spb/article/view/12465/12465.html',
    'https://jspp.psychopen.eu/index.php/jspp/article/view/15851'],
  // Projekt Gutenberg-DE (20.11.2026): kirja kootaan luvuista. Hegel, Glauben und Wissen (luvun sivu, alaviitteet span.footnote,
  // Titelseite ja kuvaluku pois), Kantin Grundlegung, Freudin Traumdeutung (sivunumerot a.pageref, luvun otsikko toistuu h3:na),
  // Schopenhauerin Aphorismen kirjan sivulta.
  pgde: ['georg-wilhelm-friedrich-hegel/books/glauben-und-wissen/chapter/3', 'immanuel-kant/books/grundlegung-zur-metaphysik-der-sitten/chapter/3',
    'sigmund-freud/books/sigmund-freud-die-traumdeutung/chapter/4', 'arthur-schopenhauer/books/aphorismen/']
    .map(p => 'https://projekt-gutenberg.org/authors/' + p),
  // SLS:n editiot (20.11.2026): Topeliuksen romaanin osa (kootaan kolme osaa kommentteineen), sama johdanto, Westermarckin
  // Sex år i Marocko luvun sivulta (12 lukua), artikkeli kokoelmasta ilman nimiötä ja von Wrightin kirje (86 kirjettä: yksin).
  sls: ['https://topelius.sls.fi/sv/collection/205/text/20227/ch1', 'https://topelius.sls.fi/sv/collection/205/introduction',
    'https://westermarck.sls.fi/sv/collection/3/text/137', 'https://westermarck.sls.fi/sv/collection/1/text/148',
    'https://vonwright.sls.fi/sv/collection/146/text/11587'],
  // Snellmanin kootut teokset (20.11.2026): lehtikirjoitus alaviitteineen ja asiakirjoja eri vuosikymmeniltä.
  snellman: ['freja-nro-33-2841840-kansantaloutta-arvostelu', 'freja-nro-36-851840-ajattelemattomuutta-tietyiss%C3%A4-%E2%80%9Dk%C3%A4sitt%C3%A4m%C3%A4tt%C3%B6miss%C3%A4-ajatuksissa%E2%80%9D']
    .map(p => 'https://snellman.kootutteokset.fi/fi/dokumentit/' + p),
  // PoPuPS (20.11.2026): Bulletin d'analyse phénoménologique, ranskaksi (111 viitettä, kirjallisuus) ja saksaksi (Hegel-kritiikki).
  popups: ['1676', '1643', '1659'].map(n => 'https://popups.uliege.be/1782-2041/index.php?id=' + n),
  // Religion Online (20.11.2026): Hartshornen Anselm's Discovery luvun sivulta (OCR, sivun alalaidan viitteet, sivunumerot) ja kirjan
  // sivulta toinen kirja, prosessifilosofian artikkeli WordPressin alaviitteineen ja Whitehead-artikkeli.
  ro: ['book-chapter/preface/', 'book/omnipotence-and-other-theological-mistakes/',
    'article/grace-and-social-science-nonsensory-perception-of-god-in-a-constructive-postmodern-wesleyan-philosophy/',
    'article/the-metaphysical-significance-of-whiteheads-creativity/'].map(p => 'https://www.religion-online.org/' + p),
  // isidore.co (20.11.2026): Akvinolainen latina–englanti-taulukoina: De veritate q. 1, Summan kysymys 2, Contra Gentiles I.
  aquinas: ['QDdeVer1.htm', 'summa/FP/FP002.html', 'ContraGentiles1.htm'].map(p => 'https://isidore.co/aquinas/' + p),
  // KB:n tekstiportaali (20.11.2026): SKS:n Frygt og Bæven (selitykset erilliseltä sivulta, tekstikritiikki, tekijän viitteet, SKS:n
  // sivut) ja ADL:n Kierkegaard-valikoima (sivunvaihdot, a.note-viitteet, nimiösivu).
  kb: ['sks-fb-txt-root', 'adl-texts-kierkegaard02val-root'].map(p => 'https://tekster.kb.dk/text/' + p),
  // Michigan Publishing (20.11.2026; Janeway, Anubis kuten OpenEdition): Ergon Kant-artikkeli ja Philosophers' Imprintin artikkeli.
  michigan: ['ergo/article/id/9258/', 'phimp/article/id/8528/'].map(p => 'https://journals.publishing.umich.edu/' + p),
  // The Philological Museum (20.11.2026): Erasmuksen adagio (text | trans, kommentaari), Garnet (1lat | 1eng, appcrit) käännöksen
  // sivulta, Forsettin näytelmä (act1 | act1trans) ja Milton.
  pm: ['herc/text.html', 'garnet/1eng.html', 'forsett/act1.html', 'milton/text.html'].map(p => 'http://www.philological.bham.ac.uk/' + p),
  // zettelkasten.de (26.11.2026): kramdownin alaviitteet, kuvatekstit ja kuvaajan kiitos, vieraskirjoittaja, opas, saksankielinen.
  zk: ['posts/get-what-you-want-from-highlighting/', 'introduction/', 'posts/field-report-6-phd-student-3-years/',
    'communications-with-zettelkastens/', 'de/posts/zettelkasten-eisberg/'].map(p => 'https://zettelkasten.de/' + p),
  // Paul Grahamin esseet (16.11.2026): <br><br>-kappaleet, Notes-viitteet, päiväys ensimmäisenä kappaleena.
  pg: ['greatwork', 'hwh', 'useful'].map(p => 'https://www.paulgraham.com/' + p + '.html'),
  // Tertullian Project (16.11.2026): Porfyrioksen De abstinentia (Taylor 1823) viitenä sivuna kirjan 1 sivulta.
  tertullian: ['https://www.tertullian.org/fathers/porphyry_abstinence_01_book1.htm'],
  bmcr: ['2026/2026.10.35', '2026/2026.10.36', '2026/2026.10.37', '2026/2026.10.38', '2024/2024.03.20', '2021/2021.05.12']
    .map(p => 'https://bmcr.brynmawr.edu/' + p + '/'),
  ndpr: ['kant-on-freedom-nature-and-judgment-the-territory-of-the-third-critique', 'facticity-and-the-fate-of-reason-after-kant',
    'ascent-philosophy-and-paradise-lost', 'the-cambridge-companion-to-hegel-and-nineteenth-century-philosophy',
    'becoming-who-we-are-politics-and-practical-philosophy-in-the-work-of-stanley-cavell'].map(p => 'https://ndpr.nd.edu/reviews/' + p + '/'),
  oyc: ['philosophy/phil-176/lecture-1', 'philosophy/phil-176/lecture-12', 'political-science/plsc-114/lecture-2',
    'philosophy/phil-181/lecture-3', 'english/engl-300/lecture-1', 'religious-studies/rlst-152/lecture-1', 'religious-studies/rlst-145/lecture-1']
    .map(p => 'https://oyc.yale.edu/' + p),
  iep: ['stoicism', 'kantmeta', 'hegelsoc', 'descarte'].map(p => 'https://iep.utm.edu/' + p + '/'),
  substack: ['https://theconvivialsociety.substack.com/p/do-not-resign-from-life', 'https://theconvivialsociety.substack.com/p/ai-is-not-conscious-but-it-is-becoming',
    'https://www.experimental-history.com/p/actually-good-advice', 'https://www.experimental-history.com/p/i-like-em-thick'],
  dhamma: ['NobleStrategy/', 'MindLikeFire/Section0007.html', 'SkillInQuestions/', 'BuddhistRomanticism/Section0006.html', 'Meditations1/']
    .map(p => 'https://www.dhammatalks.org/books/' + p),
  // Visuotinė lietuvių enciklopedija (17.11.2026): sivun omat skriptit ajetaan (välimuistista), koska ne kokoavat artikkelin,
  // tekijän ja kirjallisuuden. Kant ja Vydūnas (R: ja L:, kolme kuvaa), Platonas (vain L: ilman R:-otsaketta), Greimas (R:
  // pilkuin), fenomenologija (ei kuvaa), Lietuva (lyhyt yleisartikkeli ilman kirjallisuutta).
  vle: ['immanuel-kant', 'platonas', 'vydunas', 'algirdas-julius-greimas', 'fenomenologija', 'lietuva'].map(p => 'https://www.vle.lt/straipsnis/' + p + '/'),
  // Book of Concord (20.11.2026): Augsburgin tunnustus artiklan sivulta, Iso katekismus etusivulta, Schmalkaldenin artiklat
  // (kolme tasoa, luokaton pohja) ja Yksimielisyyden ohjeen selitys luvun sivulta.
  boc: ['augsburg-confession/of-god/', 'large-catechism/', 'smalcald-articles/iii/of-sin/', 'solid-declaration/rule-and-norm/']
    .map(p => 'https://bookofconcord.org/' + p),
  // Nova Vulgata (20.11.2026): proosa (Roomalaiskirje, 1. Mooseksen kirja), Psalmit (Liber-jako, säkeet) ja Ruut.
  nv: ['nt_epist-romanos', 'vt_genesis', 'vt_psalmorum', 'vt_ruth'].map(p => 'https://www.vatican.va/archive/bible/nova_vulgata/documents/nova-vulgata_' + p + '_lt.html'),
  // Edition Open Sources ja MPRL (20.11.2026): Pseudo-Proklos (luku 3, taulukot, kuvat, säeluku, transkriptiot, kirjallisuus),
  // Guidobaldo del Monte (EOS 4) ja MPRL:n kokoomateos (Melammu, luvun tekijät).
  eoa: ['https://edition-open-sources.org/sources/12/3/index.html', 'https://edition-open-sources.org/sources/4/2/index.html',
    'https://www.mprl-series.mpg.de/proceedings/7/3/index.html'],
  // Newton Project (20.11.2026): latinankielinen Ilmestyskirja-johdanto (käännös erikseen), kirkkohistorian Proœmium
  // (114 viitettä), sekalaiset muistiinpanot ja Philosophical Transactionsin kirje.
  np: ['THEM00046', 'THEM00054', 'THEM00073', 'NATP00023'].map(p => 'https://www.newtonproject.ox.ac.uk/view/texts/normalized/' + p),
  // The Latin Library (20.11.2026): Erasmuksen Moriae encomium, Querela pacis, Colloquia (sisällyssivu) ja Ciceron De officiis I.
  ll: ['erasmus/moriae.shtml', 'erasmus/querela.shtml', 'erasmus/coll.shtml', 'cicero/off1.shtml'].map(p => 'https://www.thelatinlibrary.com/' + p),
  // augustinus.it (20.11.2026): Tunnustukset kehyksistä (index2.htm, kirja 1 sisäkehyksessä) ja italiasta, De civitate Dei 1
  // (luvun tiivistelmät), De Trinitate 1, Sermo 1 (H5-otsikot, numero ilman lukua) ja Soliloquia 1. Koko teos (22.11.2026): Tunnustusten
  // hakemisto ja Soliloquian oletussivu (kirja 1 kehyksessä).
  aug: ['latino/confessioni/index2.htm#kehys=conf_01.htm', 'italiano/confessioni/conf_04_libro.htm', 'latino/cdd/cdd_01_libro.htm', 'latino/trinita/trinita_01_libro.htm',
    'latino/discorsi/discorso_001_testo.htm', 'latino/soliloqui/soliloqui_1_testo.htm', 'latino/confessioni/index2.htm', 'latino/soliloqui/index2.htm'].map(p => 'https://www.augustinus.it/' + p),
  // GRETIL (20.11.2026): Mūlamadhyamakakārikā (viite tekstinä // MMK_1.1 //, luvut numeroin), Vigrahavyāvartanī (painoksen sivut Vv 216,
  // proosa ja säkeet) ja Meghadūta (span.ref). Luvut (22.11.2026): Buddhacarita (kolofonien nimet, analyysisarake), Saundarananda
  // (nimirivit) ja Raghuvaṃśa (toisinnot kappaleiden välissä).
  gretil: ['sa_nAgArjuna-mUlamadhyamakakArikA', 'sa_nAgArjuna-vigrahavyAvartanI', 'sa_kAlidAsa-meghadUta', 'sa_azvaghoSa-buddhacarita',
    'sa_azvaghoSa-saundarAnanda', 'sa_kAlidAsa-raghuvaMza'].map(p => 'https://gretil.sub.uni-goettingen.de/gretil/corpustei/transformations/html/' + p + '.htm'),
  // PubMed (22.11.2026): tiivistelmäsivu (Holt-Lunstad ym. 2010). Sivu antaa skriptittömälle haulle evästeen vaativan
  // tarkistussivun (koodi 203), jota ei kierretä: pesukone luettelee sivun puuttuvaksi, ellei välimuistissa ole selaimesta
  // tallennettua sivua (pubmed.ncbi.nlm.nih.gov_20668659_.html).
  pubmed: ['https://pubmed.ncbi.nlm.nih.gov/20668659/'],
  // The Conversation (22.11.2026): uskontotiede (Leonard Cohen, kuvatekstit ja video), ilmasto, kirja-arvio ja kaksi tekijää (tuhkarokko).
  tc: ['10-years-after-leonard-cohens-passing-his-grappling-with-the-divine-lives-on-295955',
    '300-glaciers-have-disappeared-from-the-american-west-since-the-mid-20th-century-the-survivors-have-a-few-things-in-common-294084',
    'agatha-christie-a-world-of-mystery-is-a-brilliant-exploration-of-the-life-of-the-queen-of-crime-295778',
    'bangladesh-has-lost-900-children-to-measles-a-warning-to-other-countries-where-vaccine-rates-have-slipped-292288'].map(p => 'https://theconversation.com/' + p),
  // laparola.net/greco (22.11.2026): Johannes 1 ja Roomalaiskirje 8 varianttien kanssa, Markus 16 (pitkä loppu) ja Matteus 5 ilman variantteja.
  laparola: ['rif1=50&rif2=1&varianti=s', 'rif1=52&rif2=8&varianti=s', 'rif1=48&rif2=16&varianti=s', 'rif1=47&rif2=5&varianti=n']
    .map(q => 'https://www.laparola.net/greco/index.php?' + q),
  // Viisi sivustoa yleisen leikkauksen mittaukseen (21.11.2026, sivustoehdokkaat-3 kohta 8): Girardian Lectionary, Phenomenology
  // Online, Lacan Online, The Hedgehog Review ja The Immanent Frame.
  viisi: ['https://girardianlectionary.net/reflections/year-a/proper27a/', 'https://girardianlectionary.net/learn/nuechterlein-on-girardian-anthropology-in-a-nutshell/',
    'https://phenomenologyonline.com/sources/textorium/baldursson-stefan-the-nature-of-at-homeness/', 'https://phenomenologyonline.com/sources/textorium/james-susan-the-experience-of-homebirth/',
    'https://phenomenologyonline.com/scholars/arendt-hannah/',
    'https://www.lacanonline.com/2010/09/what-does-lacan-say-about-the-mirror-stage-part-i/', 'https://www.lacanonline.com/2016/10/pornography-and-the-paradoxes-of-pleasure-on-the-identity-of-perception/',
    'https://hedgehogreview.com/issues/why-america-needs-a-third-founding/articles/on-democratic-habits', 'https://hedgehogreview.com/issues/distinctions-that-define-and-divide/articles/what-are-the-humanities-good-for',
    'https://tif.ssrc.org/2026/11/04/emanant-selves/', 'https://tif.ssrc.org/2026/07/15/bloody-metaphysics-three-new-books-on-the-19th-century/'],
  // Avoimet tieteelliset lehtialustat (21.11.2026): PMC (sama artikkeli kuin ensimmäinen BMC:n, Frontiersin tekijä–vuosi-artikkeli),
  // Springer Nature (kolme BMC-lehteä taulukkosivuineen, nature.com, Springerin kommentti ilman osioita ja tutkimusartikkeli),
  // PLOS (Medicine ilman taulukoita, ONE taulukot JATS-XML:stä), Frontiers (APA-lehti, numeroviitteet ja taulukot) ja journal.fi:n
  // pdf-lehti (OJS: tiivistelmäleike). PMC antaa reCAPTCHA-sivun peräkkäisille hauille: täytä välimuisti muutaman minuutin välein.
  // Satsi 5 (sivustoehdokkaat-5, 22.11.2026). Wisdom Library: Visuddhimagga kirjan sivulta (koko kirja, noin 190 sivua), luvun
  // sivulta (alasivut) ja tekstisivulta (yläluku kootaan).
  wl: ['https://www.wisdomlib.org/buddhism/book/visuddhimagga-the-pah-of-purification',
    'https://www.wisdomlib.org/buddhism/book/visuddhimagga-the-pah-of-purification/d/doc1085157.html',
    'https://www.wisdomlib.org/buddhism/book/visuddhimagga-the-pah-of-purification/d/doc1085015.html'],
  // Bibliotheca Augustana (tha.de/~harsch): uusi sivupohja (Fichten luku → koko teos hakemistosta, hakemisto itse, Wertherin
  // kirjeet sivunumeroin, Tuomas Kempiläisen kirjat porro-ketjuina, Fransiskuksen säkeet rivinumeroin, Novaliksen fragmentit) ja
  // vanha (Schellingin Freiheitsschrift alaviitteineen, Hamann viitteet omalla sivullaan, Fransiskuksen sääntö väliotsikoin).
  ba: ['germanica/Chronologie/19Jh/Fichte/fic_ve02.html', 'germanica/Chronologie/19Jh/Fichte/fic_1wi0.html',
    'germanica/Chronologie/18Jh/Goethe/goe_w101.html', 'Chronologia/Lspost15/ThomasKempis/kem_i101.html',
    'italica/Cronologia/secolo13/Francesco/fra_cant.html', 'germanica/Chronologie/19Jh/Novalis/nov_blue.html',
    'germanica/Chronologie/19Jh/Schelling/sch_frei.html', 'germanica/Chronologie/18Jh/Hamann/ham_aes1.html',
    'Chronologia/Lspost13/Franciscus/fra_regn.html'].map(p => 'https://www.tha.de/~harsch/' + p),
  // Access to Insight: BPS:n kommentaarikäännös loppuviitteineen (Wheel 377), Soma Theran Satipaṭṭhāna ja sutta ilman viitteitä.
  ati: ['lib/authors/nanamoli/wheel377.html', 'lib/authors/soma/wayof.html', 'tipitaka/mn/mn.010.soma.html'].map(p => 'https://accesstoinsight.org/' + p),
  // Hume Texts Online (davidhume.org, 22.11.2026): osio (Of Miracles: osat, alaviitteet ja monikappaleinen loppuviite), koko
  // Treatise (Ad1739, johdanto roomalaisin sivuin, kirjat, osat ja jaksot, Appendixin lisäykset, toimituksen ins/del), koko
  // esseekokoelma (esseittäin numeroidut viitteet samoin tunnuksin, Millerin sivut), History of Englandin luku (marginaalivuodet,
  // ei sivuja), lyhyt teos yhdellä sivulla (Letter: marginaaliviitteet, q-lainaukset), osan sisällyssivu (haetaan Full Text),
  // yksittäinen essee kokoelman osana, Dialogues (Kemp Smithin sivut) ja Dissertation (Humen omat kappalenumerot, * * *).
  hume: ['e/10', 't/full', 'empl1/full', 'h/1', 'l', 't/1/1', 'empl1/dt', 'd/full', 'p/full'].map(p => 'https://davidhume.org/texts/' + p),
  // Perseids CTS (Capitains Nemo, First1KGreek): Filonin Vita Mosis kreikaksi (kirja 1 rajapinnasta, englanti lomitettuna, Mangeyn
  // sivut), Opificio englanniksi (yksitasoinen, koko teos, Yongen viitteet), Filonin teosluettelo, 1. Klemens (luku ja pykälä, koko
  // teos, Perseuksen englanti) ja Palaiphatos (luvut otsikoineen, CHS:n englanti).
  cts: ['greekLit/tlg0018/tlg022/opp-grc1/1.1-1.20', 'greekLit/tlg0018/tlg001/1st1K-eng1/1-40', 'greekLit/tlg0018',
    'greekLit/tlg1271/tlg001/1st1K-grc1/1.1-1.3', 'greekLit/tlg1553/tlg001/1st1K-grc1/prologue-19'].map(p => 'https://cts.perseids.org/read/' + p),
  // CELT (University College Cork): Berkeleyn Principles (pykälät, alaviitteinä painosten erot) ja Theory of Vision, Swiftin Gulliver
  // (osat ja luvut, dokumentit dokumentissa), Patrikin Confessio latinaksi (korjaukset, foliot) ja Scéla Mucce Meic Dathó (rivinumerot, säkeistöt).
  celt: ['E710001-001', 'E710001-002', 'E726000-001', 'L201060', 'G301016'].map(d => 'https://research.ucc.ie/celt/document/' + d),
  // Standard Ebooks: kirja kootaan single-page-versiosta. The Prince (johdanto alalukuineen, 48 loppuviitettä), Social Contract,
  // Kalevala (säkeet), Humen Enquiryn lukusivu (XHTML-sivulta koko kirja) ja Discourses on Livyn sisällyssivu (kirjat ja luvut).
  se: ['niccolo-machiavelli/the-prince/w-k-marriott/text/single-page', 'jean-jacques-rousseau/the-social-contract/g-d-h-cole/text/single-page',
    'elias-lonnrot/the-kalevala/john-martin-crawford/text/single-page', 'david-hume/an-enquiry-concerning-human-understanding/text/chapter-10',
    'niccolo-machiavelli/discourses-on-livy/ninian-hill-thomson/text'].map(p => 'https://standardebooks.org/ebooks/' + p),
  // rousseauonline.ch (Genèven laitos 1780–89): Contrat social (48 alaviitettä, yksi kolmen kappaleen yli), Tunnustusten kirja,
  // Émilen nide (kirjat I–IV), Discours sur l'inégalité (Rousseaun loppuviitteet note 1 → (Note 1)) ja d'Alembertin kirje (tekijä).
  rousseau: ['du-contrat-social-ou-principes-du-droit-politique', 'les-confessions-de-jj-rousseau-livre-second', 'volume-4-emile-ou-de-l-education-tome-premier',
    'discours-sur-l-origine-et-les-fondemens-de-l-inegalite-parmi-les-hommes', 'lettre-de-m-d-alembert-a-m-rousseau'].map(p => 'https://www.rousseauonline.ch/Text/' + p + '.php'),
  // PROPYLÄEN (goethe-biographica.de): Goethen kirjeet (Kestnerille: apparaatti, rivikommentaari, lainatut kirjeet; Nr. 188 pitkä
  // kommentaari, section.attachment), kirjeet Goethelle (regesti ja rivittämätön teksti, pitkä kirje), päiväkirja (yksi rivi; apparaatti),
  // Begegnungen und Gespräche (yksi ja kaksi todistusta) ja kirje, jonka tekstiä ei vielä ole verkossa (GB 3).
  propylaen: ['GB02_BR160_0', 'GB02_BR188_0', 'RA01_0036_00038', 'RA01_0007_00008', 'GT01_0040', 'GT01_0243', 'BuG01_A_0067', 'BuG01_A_0188', 'GB03_BR208_0']
    .map(p => 'https://goethe-biographica.de/id/' + p),
  // Hamann HKB (hamann-ausgabe.de): kirjeet veljelle (47 reunahuomautusta, apparaatti, säkeet) ja vanhemmille, uusi kirje ilman ZH-sivuja
  // (keskitetyt latinan rivit), Entwurf ja Abschrift, Zwei Entwürfe, Herderit Hamannille (19 korjausta, kaksi kirjoittajaa), fremde Hand
  // ja taulukkorivit.
  hkb: ['150', '9', '0', '300', '400', '539', '1000', '1150'].map(n => 'https://hamann-ausgabe.de/HKB/Briefe/' + n),
  // BBAW:n editiot (22.11.2026). schleiermacher digital: Kollegheft Ästhetik 1819 (toimittajan kommentit, tekijän reunahuomautukset,
  // Odebrechtin sivut, luentotunnit), Notizen zur Ästhetik I (kommentit lemmoineen, poistot), Klamrothin Nachschrift (luentotunnit
  // otsikoissa, korjaukset, 1,4 Mt) ja kaksi kirjettä (KGA V/10:n sivut; toinen Lesetext-näkymästä, jolloin kommentit haetaan
  // kriittisestä tekstistä).
  schleiermacher: ['vorlesungen/detail.xql?id=S0008746', 'vorlesungen/detail.xql?id=S0008559', 'vorlesungen/detail.xql?id=S0008518',
    'briefe/detail.xql?id=S0006428&view=k', 'briefe/detail.xql?id=S0006431&view=l'].map(p => 'https://schleiermacher-digital.de/' + p),
  // Wilhelm von Humboldtin kielitieteellinen kirjeenvaihto: kriittisestä näkymästä (Lesetext haetaan), sanskrit kuvina ja
  // translitteroituna, kirjoittajan vaihdot, sic, osoiterivit ja jälkikirjoitus (700 Lesetext-näkymästä).
  wvh: ['Brief?id=608', 'Brief?id=86', 'Brief?id=300', '700?view=leser'].map(p => 'https://wvh-briefe.bbaw.de/' + p),
  // Persia ja Kreikka (22.11.2026). Livius.org: artikkeli piiloviitteineen ja kuvagallerioineen (Magians), välilehdin jaettu
  // artikkeli (Persian Influence, neljä sivua) ja sen keskeltä avattu numeroitu sarja (Darius: 9-death, kymmenen sivua), lähdekäännös
  // viitteineen ja kääntäjineen (Photius), Behistunin hakemistosivu (46 tekstisivua kootaan), kirjoitus translitteraatioineen ja
  // kirjallisuuksineen (A2Sa) sekä tekstikokoelman sivu, jonka välilehdet kuuluvat kokoelmalle (Avesta: Zoroastrian dualism).
  livius: ['articles/concept/magians', 'articles/misc/persian-influence-on-greek-culture', 'articles/person/darius-the-great/9-death',
    'sources/content/ctesias-overview-of-the-works/photius-excerpt-of-ctesias-persica', 'sources/content/behistun-persian-text',
    'sources/content/achaemenid-royal-inscriptions/a2sa', 'sources/content/avesta/avesta-zoroastrian-dualism'].map(p => 'https://www.livius.org/' + p + '/'),
  // avesta.org: Dhallan kirjan osa (reunahuomautukset NOTE-sarakkeessa, kirjan sivut [68]), Bundahishn (SBE, taulukko yhtenä
  // palstana), muinaispersialaiset kirjoitukset (teksti ja käännös rinnakkain), Vendidad 1 ja Mihr Yasht (SBE-sivupohja: huomautukset
  // kappaleina, tietotaulukot ja Symbol-fontin kreikka). Sivusto antaa tiheistä hauista 429:n: välimuisti hakee 2 s välein.
  avesta: ['dhalla/history2.htm', 'mp/bundahis.html', 'op/op.htm', 'vendidad/vd1sbe.htm', 'ka/yt10sbe.htm'].map(p => 'https://www.avesta.org/' + p),
  lehdet: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC12573812/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12634050/',
    ...['10.1186/s40337-025-01422-8', '10.1186/s12889-025-22978-9', '10.1186/s12939-025-02606-z', '10.1007/s40519-025-01772-x',
      '10.1007/s00127-025-02928-x'].map(d => 'https://link.springer.com/article/' + d), 'https://www.nature.com/articles/s41366-024-01652-x',
    'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1004371', 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0331975',
    'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1710851/full',
    'https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2025.1623411/full', 'https://journal.fi/sla/article/view/176544'],
  korpora: ['aa04/393', 'aa08/035', 'aa05/030', 'aa09/011', 'aa07/119', 'aa03/052', 'aa10/010'].map(p => 'https://korpora.org/kant/' + p + '.html'),
  // Projekt Runeberg (26.11.2026): käsin ladottu teos ja sen luku (Fänrik Ståls sägner), faksimiliteoksen nide artikkeleineen ja
  // elämäkerran skannattuine sivuineen (Samlade skrifter I) ja artikkeli (Maj-sång), proosaa artikkeleina (Fältskärns berättelser,
  // första cykeln), pelkät skannatut sivut (Fredrika Runebergin Teckningar och drömmar, Hanna) ja yksi skannattu sivu.
  pr: ['fstal/', 'fstal/1a.html', 'runeberg/1/', 'runeberg/1/majsang.html', 'faltskar/a/', 'faltskar/a/003.html', 'teckningar/',
    'teckningar/0020.html', 'jlrhanna/'].map(p => 'https://runeberg.org/' + p),
  // Litteraturbanken (26.11.2026): e-teksti runoina (Runebergin Dikter 1998, 348 sivua, osat ja johdanto) ja proosana (Fredrika
  // Runebergin Sigrid Liljeholm 1862, Snellmanin Tyskland 1842) sekä koneluettu faksimili (Fänrik Ståls sägner 1860).
  lb: ['RunebergJL/titlar/Dikter/sida/III/etext', 'RunebergFC/titlar/SigridLiljeholm/sida/I/etext', 'SnellmanJV/titlar/Tyskland/sida/I/etext',
    'RunebergJL/titlar/F%C3%A4nrikSt%C3%A5lsS%C3%A4gner1860/sida/11/faksimil'].map(p => 'https://litteraturbanken.se/f%C3%B6rfattare/' + p),
  // Avoin Kalevala: runot (ensimmäinen: kolme kommentaarilajia ja Lönnrotin alaviitteet; 32. ja 50.: painetun numeroinnin
  // poikkeamat), Uuden Kalevalan esipuhe, artikkelin luku ja koko Kalevala runoluettelosta; Kantelettaren ensimmäinen osa (1840).
  kal: ['kalevala/runot/runo_01.xml', 'kalevala/runot/runo_32.xml', 'kalevala/runot/runo_50.xml', 'kalevala/esipuheet/esipuhe.xml',
    'kalevala/artikkelit/kalevala-ja-kansanrunousaineisto/01_johdanto.xml', 'kalevala/runot.html', 'kanteletar/Kanteletar_1840_osa1.xml']
    .map(p => 'https://editiot.finlit.fi/exist/apps/' + p),
  // Henrik Ibsens skrifter: varhainen säenäytelmä (Fjeldfuglen), proosanäytelmä (Et dukkehjem, 455 kommentaaria), Peer Gynt (1 804
  // kommentaaria, kohtauksen vaihdot, säkeistöt repliikissä), kirje, runokokoelma Digte ja yksittäinen runo.
  ib: ['DRVIT_Fj%7CFjht.html', 'DRVIT_Du%7CDuht.html', 'DRVIT_PG%7CPGht.html', 'BREV_1844-1871ht%7CB18660304BB.html', 'DIKTSAML_Diht.html',
    'DIKT_Diktht%7CBlaDigtftAftenvanSkoven.html?modus=enkeltdikt'].map(p => 'https://www.ibsen.uio.no/' + p),
  // Henry Parlands Skrifter: romaani Sönder koottuna luvusta, Idealrealisation (1929) koottuna runosta, yksittäinen julkaistu
  // runo, proosateksti, kritiikki ja johdanto (Inledning: vain avattu teksti).
  // HUDOC (Euroopan ihmisoikeustuomioistuin): täysistunnon tuomio 1989 (Soering: rekisterin alaviite, rivi riviltä kokoonpano ja
  // edustajat, lainaukset, erillinen mielipide alaviitteineen), suuren jaoston tuomiot 2001 ja 2005 (kansilehdellä ei kokoonpanoa),
  // tutkittavaksi ottamista koskeva päätös (Banković), jaoston tuomio 2026 (rekisterin tiivistelmä, numeroitu ratkaisuosa,
  // eriävä mielipide), suuren jaoston tuomio 2024 (KlimaSeniorinnen, 121 000 sanaa) ja ranskankielinen suuren jaoston tuomio.
  // Sivu on skriptisovellus: aja --elava.
  hudoc: ['001-57619', '001-59587', '001-70442', '001-22099', '001-253539', '001-233206', '001-253950'].map(i => 'https://hudoc.echr.coe.int/eng?i=' + i),
  // Finlexin oikeuskäytäntö: KKO:n ennakkopäätös (seloste, kursiiviset väliotsikot, esittelijän mietintö ja jäsenten lausumat),
  // vanha KKO:n ennakkopäätös (versaaliotsikot, kaksi säännösriviä), KHO:n ennakkopäätös ((1)-kohdat, lihavoitu seloste),
  // hovioikeuden ratkaisu (asianumero, numeroitu luettelo) ja ruotsinkielinen HD-seloste. Next.js-sivu: aja --elava.
  finlex: ['fi/oikeuskaytanto/korkein-oikeus/ennakkopaatokset/2024/1', 'fi/oikeuskaytanto/korkein-oikeus/ennakkopaatokset/1995/1',
    'fi/oikeuskaytanto/korkein-hallinto-oikeus/ennakkopaatokset/2024/1', 'fi/oikeuskaytanto/hovioikeudet/2026/helsinki/10512110',
    'sv/rattspraxis/hogsta-domstolen/prejudikat/2024/1'].map(p => 'https://www.finlex.fi/' + p),
  pl: ['5#itemId=5_1008', '1#itemId=1_30', '1#itemId=1_9', '2#itemId=2_89', '3#itemId=3_1040', '5#itemId=5_1002']
    .map(p => 'https://parland.sls.fi/index.php?p=texts&bookId=' + p),
  // WiBiLex (die-bibel.de, Angular SSR): Filon (AT), Logos (UT, kreikkaa), Monotheismus (AT, kuvat, kolme otsikkotasoa, letzte
  // Änderung), Aas (lyhin, heprea ja kreikka), Hahn (UT), Omrit (UT, 14 kuvaa), Bibelfilme (pisin, 29 000 sanaa, 42 luetteloa) ja
  // Menschensohn (WiBiLexin hakemiston osoite, jonka sivu on Gute Nachricht Bibelin sanaselitys). CloudFront torjuu curlin (403)
  // mutta palvelee selainta: pesukone hakee sivut selaimella (alla). Ilman --elava: sivun skripti korvaa artikkelin
  // otsattomassa selaimessa 404-sivulla (sovelluksen rajapinta vastaa 400).
  wibilex: ['altes-testament/philo-von-alexandrien', 'neues-testament/logos', 'altes-testament/monotheismus-at', 'altes-testament/aas',
    'neues-testament/hahn', 'neues-testament/omrit', 'neues-testament/bibelfilme-nt', 'neues-testament/menschensohn']
    .map(p => 'https://www.die-bibel.de/ressourcen/wibilex/' + p),
  // Themelios (The Gospel Coalition): 1975 ja 1986 (viitteet linkittämättä viivan alla), 2002 ja 2005 (Uusi Paavali-näkökulma,
  // taulukot), 2016 (Wordin _ftn-viitteet), 2026 (Modern Footnotes, tiivistelmä), arvioartikkeli 2026 (93 viitettä) ja kirja-arviot
  // 2011 (kustannustiedot) ja 2026.
  themelios: ['article/inerrancy-and-new-testament-exegesis', 'article/paul-and-the-law-observations-on-some-recent-debates',
    'article/mistakes-of-the-new-perspective-on-paul', 'article/justification-ecclesiology-and-the-new-perspective',
    'article/john-barclays-paul-and-the-gift-and-the-new-perspective-on-paul', 'article/retrieving-athanasius-ruled-readings-and-trinitarian-exegesis',
    'article/lamb-of-the-free-a-review-article', 'review/the-new-moody-atlas-of-the-bible', 'review/genesis-alexander']
    .map(p => 'https://www.thegospelcoalition.org/themelios/' + p + '/'),
  // Persée: koneluetut sivut haetaan palvelimelta sivu kerrallaan. Revue française de sociologie 1960 (viitteet (1), taulukot
  // kuvina), Annales 1958 (viitteet sivuittain 1., 2., merkit usein kadonneet), Annales 1929 (merkit sanaan liimattuina) ja saman
  // numeron arvio (sivun keskeltä alkava asiakirja), L'Année psychologique 1904 (54 sivua, sotkuiset juoksevat otsakkeet),
  // MEFR 2008 (juokseva numerointi, viite jatkuu seuraavalle sivulle, kuvat) ja L'Année psychologique 2008 (kirjallisuus,
  // kirjeenvaihtajan huomautus sähköposteineen).
  persee: ['rfsoc_0035-2969_1960_num_1_1_1734', 'ahess_0395-2649_1958_num_13_4_2781', 'ahess_0003-441x_1929_num_1_1_1033',
    'ahess_0003-441x_1929_num_1_1_1048_t1_0104_0000_4', 'psy_0003-5033_1904_num_11_1_3675', 'mefr_1123-9891_2008_num_120_2_10550',
    'psy_0003-5033_2008_num_108_2_30971'].map(p => 'https://www.persee.fr/doc/' + p),
  // Cambridge Core: avoimet artikkelit eri aloilta (Hegel Bulletin, Medical History 98 alaviitettä, Kantian Review, Religious
  // Studies, JRAS 105 alaviitettä), vapaasti luettava vanha artikkeli numeroviittauksin [25] (European Psychiatry 2005), avoin
  // artikkeli yläindeksiviittauksin ja kuvina olevin taulukoin (BJPsych Open), tilaajille suljettu artikkeli ja pelkkänä pdf:nä
  // julkaistu hyväksytty käsikirjoitus (tiivistelmäleikkeet).
  cambridge: ['hegel-bulletin/article/hegel-on-childless-marriage/E06064BD601FAFF4EBF6816440995C5C',
    'medical-history/article/have-you-a-table-epistemic-instability-experimental-tabulation-and-the-presentation-of-medical-statistics-in-and-after-the-indian-plague-commission-18989/6F3E8B6FBB4E4374018400A369FA9C2D',
    'kantian-review/article/how-to-use-someone-merely-as-a-means/4DDF60DF29EB55D3DF64633B8BBC9C96',
    'religious-studies/article/worldview-studies/F3445C11686C131AA1FC36533944AB45',
    'journal-of-the-royal-asiatic-society/article/from-pedlar-to-industrial-pioneer-and-back-a-jewish-merchant-in-modernising-afghanistan-1920s1940s/C2756665A751A27B8AC4F36DEADBAE1D',
    'european-psychiatry/article/mental-illness-stigma-concepts-consequences-and-initiatives-to-reduce-stigma/3AE7283F0F35980994B4BD71E92C3C08',
    'bjpsych-open/article/antidepressant-use-and-risk-of-adverse-outcomes-populationbased-cohort-study/6AAA6943E55F8B08DD9E25155E72931F',
    'hegel-bulletin/article/hegel-and-colonialism/61B53799DD191018664EE38446E0915D',
    'european-psychiatry/article/childhood-trauma-and-functional-impairment-in-adult-adhd-mediating-roles-of-symptoms-and-depression/89E11A9883CC87D843F13ADE4CACFECA']
    .map(p => 'https://www.cambridge.org/core/journals/' + p),
  // TextGrid Repository (Digitale Bibliothek): romaani säkeineen ja tähtirivein (Ofterdingen), runo (Mnemosyne), runokokoelma
  // koottuna kokoelmasivulta ([Hymnen]), fragmentit laitossivulta (Schlegelin Athenaeum-fragmentit), säedraama (Der zerbrochne
  // Krug), proosadraama (Die Räuber) ja essee alaviitteineen (Über naive und sentimentalische Dichtung).
  // Schelling Nachlass-Edition: Nachschrift (Illinois: 67 reunamerkintää, toimittajan huomautukset; Koosen: lehdet, huomautus
  // lemmoineen), Sämmtliche Werken teksti alaviitteineen (Philosophie der Offenbarung, Buch 1: SW XIII; Clara: SW IX), Weltalterin
  // käsikirjoitus (reunamerkinnät, Bogen-numerot, kaava), Berliner Einleitung (poistot, peruttu poisto, alamerkintä) ja kirje Goethelle.
  schelling: ['8527', '7746', '8534', '8201', '7479', '8121', '106'].map(n => 'https://schelling.badw.de/text/' + n + '/'),
  tg: ['sv8t.0', 'qdvk.0', 'qfgd.0', 'v37c.0', 'r0sb.0', 'v0fv.0', 'v0fk.0'].map(p => 'https://textgridrep.org/browse/' + p),
};
const SARJA = otaArvo('--sarja');
const OSOITTEET = arg.length ? arg : SARJA ? SARJAT[SARJA] : Object.values(SARJAT).flat();
const JUURI = path.resolve(__dirname, '../..');
const LISAOSA = path.join(JUURI, 'luin/lisaosa');
fs.mkdirSync(VALI, { recursive: true });
fs.mkdirSync(ULOS, { recursive: true });

// POST-pyynnön (VLE:n ajax.php) runko kuuluu välimuistin avaimeen.
const vmTiedosto = (url, post) => path.join(VALI, (url + (post ? '_' + post : '')).replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 180) + '.html');
/* Tarkistussivu (PMC:n reCAPTCHA Checking your browser, Cloudflaren Just a moment, AWS WAF): curl saa sen koodilla 200,
   ja ennen se jäi välimuistiin artikkelin paikalle, jolloin sovite palautti null ja ajo mittasi hiljaa yleisen leikkeen tai
   tyhjää. Nyt sitä ei tallenneta: sivu on puuttuva (merkintä haaste), haetaan uudelleen seuraavalla ajolla ja luetellaan
   yhteenvedossa. Tarkistusta ei kierretä; hae myöhemmin harvemmin. */
const HAASTE = /<title>[^<]*(Checking your browser|Just a moment|Attention Required|Human Verification)|awswaf\.com\/[^"']*challenge|id="challenge-form"/i;
const haasteet = new Set();
function valimuisti(url, post) {
  const f = vmTiedosto(url, post);
  if (fs.existsSync(f + '.puuttuu') && fs.readFileSync(f + '.puuttuu', 'utf8') === 'haaste' && !haasteet.has(url)) fs.rmSync(f + '.puuttuu');
  if (!fs.existsSync(f) && !fs.existsSync(f + '.puuttuu')) {
    // avesta.org antaa tiheistä hauista 429:n (22.11.2026): kahden sekunnin väli.
    if (/avesta\.org/.test(url)) cp.execFileSync('sleep', ['2']);
    // runeberg.org: robots.txt Crawl-delay 2.
    if (/runeberg\.org/.test(url)) cp.execFileSync('sleep', ['2']);
    // persee.fr: robots.txt kieltää yleiset haravat, joten sivujen palat sekunnin välein (lisäosa hakee vain avatun artikkelin).
    if (/persee\.fr/.test(url)) cp.execFileSync('sleep', ['1']);
    const koodi = cp.execFileSync('curl', ['-sSLg', ...(/openedition\.org|hypotheses\.org|openlibhums\.org|glossa-journal\.org|eur-lex\.europa\.eu|publishing\.umich\.edu|link\.springer\.com|nature\.com|journal\.fi/.test(url) ? [] : ['-A', /augustinus\.it/.test(url) ? 'Mozilla/5.0 (X11; Linux x86_64) Firefox/128.0' : 'Mozilla/5.0']), ...(post ? ['-d', post] : []), '-o', f, '-w', '%{http_code}', url]).toString();
    if (koodi !== '200') { fs.writeFileSync(f + '.puuttuu', koodi); fs.rmSync(f, { force: true }); }
    else if (HAASTE.test(fs.readFileSync(f, 'utf8').slice(0, 20000))) { fs.writeFileSync(f + '.puuttuu', 'haaste'); fs.rmSync(f, { force: true }); haasteet.add(url); }
  }
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
}

const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript' }[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
}).listen(0);

(async () => {
  await new Promise(r => palvelin.once('listening', r));
  const PAIK = 'http://127.0.0.1:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  // die-bibel.de: CloudFront antaa curlille ja Playwrightin rajapintahaulle 403:n mutta selaimelle sivun, joten puuttuvat sivut
  // haetaan välimuistiin selaimella (vain asiakirja, ei sivun skriptejä; 3 s väli).
  const selaimella = OSOITTEET.map(u => u.split('#')[0]).filter(u => /^https?:\/\/www\.die-bibel\.de\//.test(u) && !fs.existsSync(vmTiedosto(u)));
  if (selaimella.length) {
    const c = await b.newContext();
    await c.route(/^https?:/, r => r.request().resourceType() === 'document' ? r.continue() : r.abort());
    const s = await c.newPage();
    for (const u of selaimella) {
      const v = await s.goto(u, { waitUntil: 'commit', timeout: 30000 }).catch(() => null);
      if (v && v.status() === 200) { fs.writeFileSync(vmTiedosto(u), await v.text()); fs.rmSync(vmTiedosto(u) + '.puuttuu', { force: true }); }
      else console.log('  (die-bibel.de: ' + (v ? v.status() : 'ei vastausta') + ' ' + u + ')');
      await s.waitForTimeout(3000);
    }
    await c.close();
  }
  const ctx = await b.newContext();
  await ctx.route(/^https?:/, r => {
    const u = r.request().url().split('#')[0];
    if (u.startsWith(PAIK)) return r.continue();
    if (ELAVA && /^(script|stylesheet|font)$/.test(r.request().resourceType()) && !/\.nih\.gov\//.test(u)) return r.continue();
    // augustinus.it: windows-1252, joten tavut sellaisinaan (välimuistin UTF-8-luku rikkoisi italian kirjaimet).
    if (/^https?:\/\/www\.augustinus\.it\//.test(u) && /^(document|fetch|xhr)$/.test(r.request().resourceType())) {
      const h = valimuisti(u);
      const f = h === null ? null : path.join(VALI, u.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 180) + '.html');
      return f ? r.fulfill({ body: fs.readFileSync(f), contentType: 'text/html; charset=windows-1252' }) : r.fulfill({ status: 404, body: '' });
    }
    // avesta.org: palvelin ei kerro merkistöä, ja osa sivuista on ISO-8859-1:tä (Dhallan §), joten tavut sellaisinaan ja
    // text/html ilman charsetia kuten palvelimelta: selain päättelee merkistön sivun metasta tai oletuksesta.
    if (/^https?:\/\/www\.avesta\.org\//.test(u) && /^(document|fetch|xhr)$/.test(r.request().resourceType())) {
      const h = valimuisti(u);
      return h === null ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ body: fs.readFileSync(vmTiedosto(u)), contentType: 'text/html' });
    }
    // TextGrid: koostepalvelu ja metatiedot ovat toisella palvelimella (textgridlab.org), joka sallii CORSin; välimuistin vastaukseen
    // sama otsake, muuten selain hylkää sivun haun.
    if (/^https?:\/\/textgridlab\.org\//.test(u) && /^(fetch|xhr)$/.test(r.request().resourceType())) {
      const h = valimuisti(u);
      return h ? r.fulfill({ body: h, contentType: /\/metadata$/.test(u) ? 'text/xml; charset=utf-8' : 'text/html; charset=utf-8', headers: { 'access-control-allow-origin': '*' } }) : r.fulfill({ status: 404, body: '' });
    }
    // VLE: sivun omat skriptit ja ajax.php (POST) välimuistista; muut palvelimet (reCAPTCHA, Pinterest, MathJax) estetään.
    if (/^https?:\/\/www\.vle\.lt\//.test(u) && /^(script|fetch|xhr)$/.test(r.request().resourceType())) {
      const post = r.request().method() === 'POST' ? r.request().postData() || '' : '';
      const h = valimuisti(u, post);
      const tyyppi = /\.js(\?|$)/.test(u) ? 'text/javascript' : /ajax\.php/.test(u) ? 'application/json' : 'text/html; charset=utf-8';
      return h ? r.fulfill({ body: h, contentType: tyyppi }) : r.fulfill({ status: 404, body: '' });
    }
    if (/^https?:\/\/([a-z0-9-]+\.)*(filosofia\.fi|wikipedia\.org|marxists\.org|waitbutwhy\.com|oecs\.knowledgefutures\.org|oecs\.mit\.edu|encyclopedia\.com|online\.flippingbook\.com|saet\.ac\.uk|gutenberg\.org|newadvent\.org|ccel\.org|psyche\.co|aeon\.co|journal-psychoanalysis\.eu|journals\.vu\.lt|penelope\.uchicago\.edu|korpora\.org|dhammatalks\.org|wikisource\.org|substack\.com|experimental-history\.com|iep\.utm\.edu|oyc\.yale\.edu|ndpr\.nd\.edu|iltascabile\.com|doppiozero\.com|bmcr\.brynmawr\.edu|revistas\.ucm\.es|perseus\.tufts\.edu|noemamag\.com|emergencemagazine\.org|andymatuschak\.org|numinous\.productions|fivebooks\.com|paulgraham\.com|tertullian\.org|vle\.lt|pressbooks\.library\.torontomu\.ca|pressbooks\.palni\.org|openedition\.org|hypotheses\.org|manifold\.umn\.edu|cuny\.manifoldapp\.org|lesswrong\.com|forum\.effectivealtruism\.org|openlibhums\.org|glossa-journal\.org|scielo\.org\.mx|scielo\.org\.ar|scielo\.pt|scielo\.org\.za|scielo\.org\.co|books\.openbookpublishers\.com|fadedpage\.com|archive\.org|folger\.edu|gwern\.net|lareviewofbooks\.org|themarginalian\.org|3-16am\.co\.uk|eur-lex\.europa\.eu|caselaw\.nationalarchives\.gov\.uk|pmc\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov|rips-irsp\.com|utrechtlawreview\.org|openpsychologydata\.metajnl\.com|journalofcognition\.org|vacarme\.org|laviedesidees\.fr|booksandideas\.net|lmsi\.net|remue\.net|politicalconcepts\.org|projectvox\.org|embryo\.asu\.edu|cdli\.earth|magazines\.gorky\.media|fabula\.org|sites\.pitt\.edu|digital\.library\.upenn\.edu|chs\.harvard\.edu|zeithistorische-forschungen\.de|bombmagazine\.org|psychopen\.eu|projekt-gutenberg\.org|bookofconcord\.org|vatican\.va|edition-open-sources\.org|edition-open-access\.de|mprl-series\.mpg\.de|raamattu\.fi|laparola\.net|theconversation\.com|pubmed\.ncbi\.nlm\.nih\.gov|lmaleidykla\.lt|newtonproject\.ox\.ac\.uk|thelatinlibrary\.com|gretil\.sub\.uni-goettingen\.de|girardianlectionary\.net|phenomenologyonline\.com|lacanonline\.com|hedgehogreview\.com|tif\.ssrc\.org|sls\.fi|snellman\.kootutteokset\.fi|popups\.uliege\.be|religion-online\.org|isidore\.co|tekster\.kb\.dk|journals\.publishing\.umich\.edu|philological\.bham\.ac\.uk|philological\.cal\.bham\.ac\.uk|link\.springer\.com|biomedcentral\.com|nature\.com|journals\.plos\.org|frontiersin\.org|journal\.fi|wisdomlib\.org|tha\.de|accesstoinsight\.org|davidhume\.org|cts\.perseids\.org|research\.ucc\.ie|celt\.ucc\.ie|standardebooks\.org|rousseauonline\.ch|goethe-biographica\.de|hamann-ausgabe\.de|schleiermacher-digital\.de|wvh-briefe\.bbaw\.de|livius\.org|zettelkasten\.de|runeberg\.org|litteraturbanken\.se|editiot\.finlit\.fi|ibsen\.uio\.no|hudoc\.echr\.coe\.int|finlex\.fi|textgridrep\.org|schelling\.badw\.de|die-bibel\.de|thegospelcoalition\.org)\//.test(u) && /^(document|persee\.fr|cambridge\.org)\//.test(u) && /^(document|fetch|xhr)$/.test(r.request().resourceType())) {
      const h = valimuisti(u);
      // Standard Ebooksin lukusivut tulevat XHTML:nä (application/xhtml+xml), joten sivu on selaimessa XML-asiakirja kuten oikeasti.
      const xhtml = /^https?:\/\/standardebooks\.org\/ebooks\/.+\/text(\/|$)/.test(u) && r.request().resourceType() === 'document';
      return h ? r.fulfill({ body: h, contentType: xhtml ? 'application/xhtml+xml; charset=utf-8' : 'text/html; charset=utf-8' }) : r.fulfill({ status: 404, body: '' });
    }
    return r.abort();
  });
  const koodi = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js']
    .map(f => fs.readFileSync(path.join(LISAOSA, f), 'utf8')).join('\n;\n');
  const yht = [], virheet = [];
  for (const url of OSOITTEET) {
    // marxists.org: luvut ovat ch01.htm monessa teoksessa, joten nimeen myös kaksi edellistä polun osaa.
    const osat = decodeURIComponent(url.replace(/\/$/, '')).split('/');
    const nimi = (/textgridrep\.org/.test(url) ? ['tg', osat[osat.length - 1]] : /schelling\.badw\.de/.test(url) ? ['sch', ...osat.slice(3)] : /finlex\.fi/.test(url) ? ['fx', ...osat.slice(5)] : /die-bibel\.de/.test(url) ? ['wbl', osat[osat.length - 1]] : /thegospelcoalition\.org/.test(url) ? ['them', osat[osat.length - 1]] : /hudoc\.echr/.test(url) ? ['hd', ...osat.slice(5)] : /cambridge\.org\/core/.test(url) ? ['cam', osat[osat.length - 2].slice(0, 40)] : /hudoc\.echr/.test(url) ? ['hd', (/[?&]i=([\d-]+)/.exec(url) || [])[1] || 'x'] : /runeberg\.org/.test(url) ? ['pr', ...osat.slice(3)] : /editiot\.finlit\.fi/.test(url) ? ['kal', ...osat.slice(5)] : /ibsen\.uio\.no/.test(url) ? ['ib', osat[osat.length - 1].replace(/\?.*$/, '')] : /parland\.sls\.fi/.test(url) ? ['pl', url.split('#itemId=')[1] || 'x'] : /litteraturbanken\.se/.test(url) ? ['lb', osat[4], osat[6], osat[8] || '', osat[9] || ''] : /livius\.org|avesta\.org/.test(url) ? osat.slice(-2) : /schleiermacher-digital/.test(url) ? ['sd', osat[3], url.split('id=')[1] || ''] : /wvh-briefe/.test(url) ? ['wvh', (/(\d+)(?:\?view=\w+)?$/.exec(url) || [])[1] || 'x'] : /hamann-ausgabe\.de/.test(url) ? ['hkb', osat[osat.length - 1]] : /standardebooks\.org/.test(url) ? ['se', osat[5], osat[osat.length - 1]] : /cts\.perseids/.test(url) ? osat.slice(4) : /davidhume\.org/.test(url) ? ['hume', ...osat.slice(osat.indexOf('texts') + 1)] : /publishing\.umich/.test(url) ? [osat[3], osat[osat.length - 1]] : /frontiersin\.org/.test(url) ? osat.slice(-2, -1) : /edition-open|mprl-series/.test(url) ? osat.slice(2, -1) : /newtonproject/.test(url) ? ['newton', osat[osat.length - 1]] : /thelatinlibrary/.test(url) ? osat.slice(-2) : /girardianlectionary|phenomenologyonline|lacanonline|hedgehogreview|tif\.ssrc/.test(url) ? [osat[2].replace(/^www\./, '').split('.')[0], osat[osat.length - 1]] : /augustinus\.it/.test(url) ? ['aug', ...osat.slice(-3)] : /popups\.uliege/.test(url) ? ['popups', url.split('id=')[1]] : /journals\.vu\.lt|revistas\.ucm\.es|psychopen\.eu/.test(url) ? [osat[3], ...osat.slice(osat.indexOf('view') + 1)] : /marxists\.org|encyclopedia\.com|flippingbook|projekt-gutenberg|bookofconcord|sls\.fi|isidore\.co|philological/.test(url) ? osat.slice(-2) : /saet\.ac\.uk|uchicago|korpora|dhammatalks|oyc\.yale|fadedpage|archive\.org/.test(url) ? osat.slice(-2) : /folger\.edu/.test(url) ? osat.slice(osat.indexOf('shakespeares-works') + 1) : /perseus/.test(url) ? [url.split('text%3A')[1] || 'x'] : /cdli\.earth|fabula\.org|zeithistorische/.test(url) ? osat.slice(-2) : /eur-lex|caselaw\.national/.test(url) ? osat.slice(/eur-lex/.test(url) ? 4 : 3) : osat.slice(-1)).join('-').replace(/\.html?$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '_') + (/wikipedia|wikisource/.test(url) ? '-' + url.split('//')[1].split('.')[0] : '');
    if (!valimuisti(url.split('#')[0])) { console.log('=====', nimi, haasteet.has(url.split('#')[0]) ? 'ei saatu (tarkistussivu)' : 'ei saatu'); continue; }
    // Yhden artikkelin virhe (sovite tai md.js kaatuu) kirjataan ja ajo jatkuu; ennen se pysäytti koko sarjan, eikä kaatavaa
    // leikettä ollut tallessa. Leike tallennetaan ennen Latomoa.
    const sivut = [];
    try {
      const s = await ctx.newPage(); sivut.push(s);
      await s.goto(url);
      if (ELAVA) { await s.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {}); await s.waitForTimeout(4000); }
      // Kehyssivusto (augustinus.it): #kehys=<tiedosto> avaa tiedoston principale-kehykseen kuten käyttäjän napautus sisällysluettelossa.
      const kehys = /#kehys=(.+)$/.exec(url);
      if (kehys) { await s.frame({ name: 'principale' }).goto(new URL(kehys[1], url).href); await s.waitForTimeout(1000); }
      if (/vle\.lt/.test(url)) await s.waitForSelector('.z-content', { timeout: 15000 }).catch(() => console.log('  (VLE: .z-content puuttuu, raaka sivu)'));
      const lahde = await s.evaluate(() => {
        const w = document.querySelector('#mw-content-text .mw-parser-output');
        // Livius: piiloviitteet span.note-label (koottavasta artikkelista vain avattu sivu); avesta.org: yläindeksit.
        const lv = /(^|\.)livius\.org$/.test(location.hostname) && document.querySelector('article#content');
        if (lv) return { otsikot: lv.querySelectorAll('h2, h3, h4').length, viitteet: lv.querySelectorAll('span.note-label').length };
        if (/(^|\.)avesta\.org$/.test(location.hostname)) return { otsikot: document.querySelectorAll('h2, h3, h4').length, viitteet: document.querySelectorAll('sup').length };
        // Hume Texts Online: otsikkolohkot ja alaviitemerkit (#n21) tekstiruudussa.
        if (/davidhume\.org$/.test(location.hostname) && document.getElementById('text-pane')) return { otsikot: document.querySelectorAll('#text-pane .content.title').length, viitteet: document.querySelectorAll('#text-pane a[href^="#n"]').length };
        // LacusCurtius: viitemerkit a.ref (saman sivun viitteisiin), otsikkoina h1 (sivuille jaetussa kirjassa vain tämä sivu).
        if (document.querySelector('table.headerbox, table.header') && /uchicago/.test(location.hostname)) return { otsikot: document.querySelectorAll('h1').length, viitteet: document.querySelectorAll('a.ref').length };
        if (w) return { otsikot: w.querySelectorAll('h2, h3, h4').length, viitteet: w.querySelectorAll('sup.reference, sup.mw-ref').length };
        const r = document.querySelector('.node-ensyklopedia .field-name-body .field-item');
        return { otsikot: r ? [...r.children].filter(p => p.tagName === 'P' && p.querySelector('a[name] strong, a[id] strong')).length : 0,
          viitteet: r ? [...r.querySelectorAll('a[href]')].filter(a => /\/node\/|\/ensyklopedia\//.test(a.getAttribute('href'))).length : 0 };
      });
      const leike = await s.evaluate(k => (0, eval)(k), koodi);
      await s.close();
      fs.writeFileSync(path.join(ULOS, nimi + '.leike.md'), leike.koko);
      const L = await ctx.newPage(); sivut.push(L);
      await L.goto(PAIK + 'luin/latomo.html');
      // Kuten latomoon.js: arvo ja input-tapahtuma. Playwrightin fill kesti Gutenbergin kirjalla (1,1 Mt) 42 s, Latomo itse 1,6 s.
      await L.evaluate(md => { const e = document.getElementById('md'); e.value = md; e.dispatchEvent(new Event('input', { bubbles: true })); }, leike.koko);
      await L.waitForTimeout(900);
      const md = await L.evaluate(() => window.__latomo.tulos().md);
      fs.writeFileSync(path.join(ULOS, nimi + '.md'), md);
      const t = await L.evaluate(md => {
        const r = window.LuinMD.parse(md);
        const d = new DOMParser().parseFromString('<div id="t">' + r.html + '</div>', 'text/html');
        const linkit = [...d.querySelectorAll('a.lahde')];
        return { h2: d.querySelectorAll('#t > h2').length, h3: d.querySelectorAll('#t > h3').length, h4: d.querySelectorAll('#t > h4').length,
          alaviitteet: d.querySelectorAll('.sidenote').length, tyhjat: [...d.querySelectorAll('.sidenote')].filter(x => /lähteen omalla sivulla/.test(x.textContent)).length,
          bib: d.querySelectorAll('p.bib').length, kohdat: d.querySelectorAll('p.bib[id^="kirj-"]').length,
          linkit: linkit.length, alaviitteissa: linkit.filter(x => x.closest('.sidenote')).length,
          rikki: linkit.filter(x => !d.getElementById(x.getAttribute('href').slice(1))).length,
          // Epäilyttävä kohde: luettelon kohdasta puuttuu linkin vuosi tai ensimmäinen nimi (Mitchell 2009 → Mitchell, M. (2009) …).
          vaarat: linkit.filter(x => {
            const k = d.getElementById(x.getAttribute('href').slice(1)), t = x.textContent.replace(/­/g, '');
            // Lyhenteen linkki lyhenneosion otsikkoon (HCUP → Abbreviations, PMC12573812) ei ole lähdelinkki.
            if (!k || /^H[1-6]$/.test(k.tagName)) return false;
            const v = (t.match(/(1[5-9]\d\d|20\d\d)/) || [])[1], n = (t.match(/\p{Lu}[\p{L}’'-]+/u) || [])[0];
            // Toistoviiva (—— (2006). …) on edellisen kohdan tekijä.
            return (v && !k.textContent.includes(v)) || (n && !/^\s*[—–-]{2,}/.test(k.textContent) && !k.textContent.replace(/­/g, '').includes(n));
          }).map(x => x.textContent + ' → ' + d.getElementById(x.getAttribute('href').slice(1)).textContent.slice(0, 60)),
          otsikot: [...d.querySelectorAll('#t > h2, #t > h3, #t > h4')].map(h => h.tagName[1] + ' ' + h.textContent.replace(/­/g, '')),
          // Linkittämättä jääneet tekijä–vuosi-viittaukset (22.11.2026): Nimi et al. 2013 ja Nimi and Nimi 2012 tekstissä ja
          // alaviitteissä lähdelinkin ulkopuolella. Yksinimistä (Bishop 2006) ei lasketa: liikaa vääriä (Nature 2018).
          irralliset: (() => {
            const k = d.getElementById('t').cloneNode(true);
            k.querySelectorAll('a.lahde, p.bib, h1, h2, h3, h4, h5, h6, header').forEach(x => x.remove());
            // Alaviite heti perässä (taulukon Berkman et al., 2004 + alaviite viitteen tekstein) on viittaus: merkki †, jota ei lasketa.
            k.querySelectorAll('label.fnref').forEach(x => x.replaceWith('†'));
            return k.textContent.replace(/­/g, '').match(/\p{Lu}[\p{L}’'-]+(?:\s+et al\.,?|\s+(?:and|&)\s+\p{Lu}[\p{L}’'-]+,?)\s+\(?(?:1[5-9]|20)\d\d[a-z]?(?![\p{L}\p{N}])(?!\)?\s*†)/gu) || [];
          })(),
          varoitukset: r.warnings.map(w => w.msg) };
      }, md);
      await L.close();
      const JAANTEET = [/muokkaa wikitekstiä|\[muokkaa|\[edit\]/g, /<\/?(sup|sub|span|table|div|a)\b/g, /XLUINVIITE/g, /redirects here|ohjataan tänne/g, /cite_note|CITEREF/g];
      const jaanteet = JAANTEET.map(re => (md.match(re) || []).length);
      const wl = (/^## Wikipedia[- ]a(rtikkelit|rticles)\n\n((?:- .*\n?)*)/m.exec(md) || [, , ''])[2].split('\n').filter(Boolean).length;
      const tulos = { nimi, lahde, t, jaanteet, wl, viitteita: leike.kokoViitteita, sanoja: leike.kokoSanoja, muutos: muuttuneet(nimi + '.md', md) };
      yht.push(tulos);
      console.log('=====', nimi, '(' + url + ')' + (tulos.muutos === null ? '' : tulos.muutos ? ' MUUTTUI ' + tulos.muutos + ' riviä' : ' ennallaan'));
      console.log(`  otsikot: lähteessä ${lahde.otsikot}, tuloksessa ##/###/#### ${t.h2}/${t.h3}/${t.h4}; sanoja ${leike.kokoSanoja}`);
      console.log(`  alaviitteet: lähteen merkkejä/linkkejä ${lahde.viitteet}, leikkeessä ${leike.kokoViitteita}, Luinissa ${t.alaviitteet} (lähteen sivulla ${t.tyhjat})`);
      console.log(`  kirjallisuus: p.bib ${t.bib}, tunnistettu ${t.kohdat}; lähdelinkit ${t.linkit} (alaviitteissä ${t.alaviitteissa}), rikki ${t.rikki}, epäilyttävä kohde ${t.vaarat.length}, linkittämättä ${t.irralliset.length}`);
      if (NAYTA) t.vaarat.slice(0, 5).forEach(v => console.log('    VÄÄRÄ? ' + v));
      if (NAYTA && t.irralliset.length) console.log('    LINKITTÄMÄTTÄ ' + [...new Set(t.irralliset)].slice(0, 6).join('; '));
      if (wl) console.log(`  Wikipedia-artikkeleita luettelossa ${wl}`);
      console.log(`  jäänteet (muokkaa, raaka HTML, merkki, ohjausrivi, viitetunnus): ${jaanteet.join('/')}; md.js-varoituksia ${t.varoitukset.length}`);
      if (NAYTA) { console.log('  ' + t.otsikot.join('\n  ')); t.varoitukset.slice(0, 8).forEach(v => console.log('    VAR ' + v)); }
    } catch (e) {
      virheet.push(nimi);
      console.log('=====', nimi, '(' + url + ')\n  VIRHE ' + String(e.message || e).split('\n').slice(0, 4).join('\n    '));
      await Promise.all(sivut.map(x => x.close().catch(() => {})));
    }
  }
  console.log('\nYHTEENVETO');
  if (virheet.length) console.log(`  VIRHEITÄ ${virheet.length}: ${virheet.join(', ')} (leike tuloskansiossa <nimi>.leike.md)`);
  if (VERTAA) {
    const m = yht.filter(y => y.muutos), e = yht.filter(y => y.muutos === 0).length, p = yht.filter(y => y.muutos === null).length;
    console.log(`  verrattuna (${VERTAA}): ennallaan ${e}, muuttui ${m.length} (${m.reduce((n, y) => n + y.muutos, 0)} riviä), vertailusta puuttui ${p}` + (m.length ? '\n    ' + m.map(y => y.nimi + ' ' + y.muutos).join('\n    ') : ''));
  }
  const sum = f => yht.reduce((n, y) => n + f(y), 0);
  console.log(`  artikkeleita ${yht.length}; alaviitteitä ${sum(y => y.t.alaviitteet)}, p.bib ${sum(y => y.t.bib)}, lähdelinkkejä ${sum(y => y.t.linkit)}, rikki ${sum(y => y.t.rikki)}, epäilyttäviä ${sum(y => y.t.vaarat.length)}, linkittämättä ${sum(y => y.t.irralliset.length)}, jäänteitä ${sum(y => y.jaanteet.reduce((a, c) => a + c, 0))}`);
  if (haasteet.size) console.log(`  tarkistussivu ${haasteet.size} sivulla (ei välimuistissa, haetaan uudelleen seuraavalla ajolla):\n    ` + [...haasteet].join('\n    '));
  console.log('  välimuisti: ' + VALI + (ULOS !== VALI ? ', tulokset: ' + ULOS : ''));
  await b.close(); palvelin.close();
})().catch(e => { console.error(e); process.exit(1); });
