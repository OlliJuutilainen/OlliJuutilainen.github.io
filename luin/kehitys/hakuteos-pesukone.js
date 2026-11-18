// Hakuteospesukone: Ensyklopedia Logoksen, Wikipedian (fi, en) ja Open Encyclopedia of Cognitive Sciencen artikkelit sekä
// marxists.orgin ja Wait But Whyn kirjoitukset sekä Encyclopedia.comin, IPA:n IRED-sanakirjan ja St Andrews Encyclopaedia of Theologyn artikkelit sekä Project Gutenbergin kirjat, New Adventin ja CCEL:n kirkkoisät, Psychen ja Aeonin esseet, European Journal of Psychoanalysisin artikkelit, Open Journal Systems -lehtien (Problemos ym.) artikkelit, LacusCurtiuksen Loeb-käännökset ja Visuotinė lietuvių enciklopedijan artikkelit sekä EUR-Lexin ja Find Case Law'n oikeustapaukset Lukimeen-lisäosan, Latomon ja md.js:n läpi (käyttäjän pyynnöt
// 10.11.2026 ja 11.11.2026; SEP:lle on sep-pesukone.js). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/hakuteos-pesukone.js [--vali kansio] [--nayta] [--sarja logos|wikipedia|oecs|mia|wbw|enc|ired|saet|gutenberg|newadvent|ccel|psyche|ejp|ojs|lacus|korpora|dhamma|wikisource|substack|iep|oyc|ndpr|tascabile|bmcr|ojs2|noema|matuschak|fivebooks|perseus|pg|tertullian|vle|pressbooks|openedition|hypotheses|manifold|forummagnum|janeway|scielo|obp|fadedpage|archive|folger|wikimuut|gwern|larb|tri16|eurlex|fcl] [osoitteet]
// Sivut haetaan kerran välimuistiin (oletus: tmp/hakuteos-pesukone; tekstejä ei viedä repoon), myös sivut, joita lisäosa
// pyytää (Logoksen viitatut artikkelit, marxists.orgin alaviitesivut). Mittaa lähteen ja tuloksen otsikot, alaviitteet,
// kirjallisuusluettelon (p.bib, tunnistetut kohdat), lähdelinkit, rikkinäiset ja epäilyttävät (luettelon kohdasta puuttuu
// linkin vuosi tai nimi), Wikipedian artikkeliluettelon pituuden ja jäänteet (muokkaa-linkit, raaka HTML, merkit).
// --nayta tulostaa otsikot, varoitukset ja epäilyttävät kohteet. Tulos: välimuistiin <nimi>.md ja <nimi>.leike.md.
// OECS:n sivut ovat oecs.knowledgefutures.orgista: oecs.mit.edu (PubPub) estää pilvikontin.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), cp = require('child_process');
const { chromium } = require('playwright');

const arg = process.argv.slice(2);
const otaArvo = n => { const i = arg.indexOf(n); if (i < 0) return null; const v = arg[i + 1]; arg.splice(i, 2); return v; };
const otaLippu = n => { const i = arg.indexOf(n); if (i < 0) return false; arg.splice(i, 1); return true; };
const VALI = otaArvo('--vali') || path.join(os.tmpdir(), 'hakuteos-pesukone');
const NAYTA = otaLippu('--nayta');
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
    'politologija/en/article/view/45186', 'kalbotyra/en/article/view/45716'].map(p => 'https://www.journals.vu.lt/' + p),
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
    'https://la.wikisource.org/wiki/Meditationes_de_prima_philosophia_(Adam_et_Tannery)/Meditatio_I', 'https://fi.wikisource.org/wiki/Rautatie:_I_luku'],
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
  // lainaukset), EWCA Civ (kursiiviset ja alleviivatut väliotsikot), EWHC (Ch) (I:-otsikot, alakohdat).
  fcl: ['uksc/2024/12', 'uksc/2023/42', 'ewca/civ/2022/379', 'ewhc/ch/2024/1'].map(p => 'https://caselaw.nationalarchives.gov.uk/' + p),
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
  korpora: ['aa04/393', 'aa08/035', 'aa05/030', 'aa09/011', 'aa07/119', 'aa03/052', 'aa10/010'].map(p => 'https://korpora.org/kant/' + p + '.html')
};
const SARJA = otaArvo('--sarja');
const OSOITTEET = arg.length ? arg : SARJA ? SARJAT[SARJA] : Object.values(SARJAT).flat();
const JUURI = path.resolve(__dirname, '../..');
const LISAOSA = path.join(JUURI, 'luin/lisaosa');
fs.mkdirSync(VALI, { recursive: true });

// POST-pyynnön (VLE:n ajax.php) runko kuuluu välimuistin avaimeen.
function valimuisti(url, post) {
  const f = path.join(VALI, (url + (post ? '_' + post : '')).replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 180) + '.html');
  if (!fs.existsSync(f) && !fs.existsSync(f + '.puuttuu')) {
    const koodi = cp.execFileSync('curl', ['-sSL', ...(/openedition\.org|hypotheses\.org|openlibhums\.org|glossa-journal\.org|eur-lex\.europa\.eu/.test(url) ? [] : ['-A', 'Mozilla/5.0']), ...(post ? ['-d', post] : []), '-o', f, '-w', '%{http_code}', url]).toString();
    if (koodi !== '200') { fs.writeFileSync(f + '.puuttuu', koodi); fs.rmSync(f, { force: true }); }
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
  const ctx = await b.newContext();
  await ctx.route(/^https?:/, r => {
    const u = r.request().url().split('#')[0];
    if (u.startsWith(PAIK)) return r.continue();
    // VLE: sivun omat skriptit ja ajax.php (POST) välimuistista; muut palvelimet (reCAPTCHA, Pinterest, MathJax) estetään.
    if (/^https?:\/\/www\.vle\.lt\//.test(u) && /^(script|fetch|xhr)$/.test(r.request().resourceType())) {
      const post = r.request().method() === 'POST' ? r.request().postData() || '' : '';
      const h = valimuisti(u, post);
      const tyyppi = /\.js(\?|$)/.test(u) ? 'text/javascript' : /ajax\.php/.test(u) ? 'application/json' : 'text/html; charset=utf-8';
      return h ? r.fulfill({ body: h, contentType: tyyppi }) : r.fulfill({ status: 404, body: '' });
    }
    if (/^https?:\/\/([a-z0-9-]+\.)*(filosofia\.fi|wikipedia\.org|marxists\.org|waitbutwhy\.com|oecs\.knowledgefutures\.org|oecs\.mit\.edu|encyclopedia\.com|online\.flippingbook\.com|saet\.ac\.uk|gutenberg\.org|newadvent\.org|ccel\.org|psyche\.co|aeon\.co|journal-psychoanalysis\.eu|journals\.vu\.lt|penelope\.uchicago\.edu|korpora\.org|dhammatalks\.org|wikisource\.org|substack\.com|experimental-history\.com|iep\.utm\.edu|oyc\.yale\.edu|ndpr\.nd\.edu|iltascabile\.com|doppiozero\.com|bmcr\.brynmawr\.edu|revistas\.ucm\.es|perseus\.tufts\.edu|noemamag\.com|emergencemagazine\.org|andymatuschak\.org|numinous\.productions|fivebooks\.com|paulgraham\.com|tertullian\.org|vle\.lt|pressbooks\.library\.torontomu\.ca|pressbooks\.palni\.org|openedition\.org|hypotheses\.org|manifold\.umn\.edu|cuny\.manifoldapp\.org|lesswrong\.com|forum\.effectivealtruism\.org|openlibhums\.org|glossa-journal\.org|scielo\.org\.mx|scielo\.org\.ar|scielo\.pt|scielo\.org\.za|scielo\.org\.co|books\.openbookpublishers\.com|fadedpage\.com|archive\.org|folger\.edu|gwern\.net|lareviewofbooks\.org|themarginalian\.org|3-16am\.co\.uk|eur-lex\.europa\.eu|caselaw\.nationalarchives\.gov\.uk)\//.test(u) && /^(document|fetch|xhr)$/.test(r.request().resourceType())) {
      const h = valimuisti(u);
      return h ? r.fulfill({ body: h, contentType: 'text/html; charset=utf-8' }) : r.fulfill({ status: 404, body: '' });
    }
    return r.abort();
  });
  const koodi = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js']
    .map(f => fs.readFileSync(path.join(LISAOSA, f), 'utf8')).join('\n;\n');
  const yht = [];
  for (const url of OSOITTEET) {
    // marxists.org: luvut ovat ch01.htm monessa teoksessa, joten nimeen myös kaksi edellistä polun osaa.
    const osat = decodeURIComponent(url.replace(/\/$/, '')).split('/');
    const nimi = (/journals\.vu\.lt|revistas\.ucm\.es/.test(url) ? [osat[3], ...osat.slice(osat.indexOf('view') + 1)] : /marxists\.org|encyclopedia\.com|flippingbook/.test(url) ? osat.slice(-3) : /saet\.ac\.uk|uchicago|korpora|dhammatalks|oyc\.yale|fadedpage|archive\.org/.test(url) ? osat.slice(-2) : /folger\.edu/.test(url) ? osat.slice(osat.indexOf('shakespeares-works') + 1) : /perseus/.test(url) ? [url.split('text%3A')[1] || 'x'] : /eur-lex|caselaw\.national/.test(url) ? osat.slice(/eur-lex/.test(url) ? 4 : 3) : osat.slice(-1)).join('-').replace(/\.html?$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '_') + (/wikipedia|wikisource/.test(url) ? '-' + url.split('//')[1].split('.')[0] : '');
    if (!valimuisti(url)) { console.log('=====', nimi, 'ei saatu'); continue; }
    const s = await ctx.newPage();
    await s.goto(url);
    if (/vle\.lt/.test(url)) await s.waitForSelector('.z-content', { timeout: 15000 }).catch(() => console.log('  (VLE: .z-content puuttuu, raaka sivu)'));
    const lahde = await s.evaluate(() => {
      const w = document.querySelector('#mw-content-text .mw-parser-output');
      // LacusCurtius: viitemerkit a.ref (saman sivun viitteisiin), otsikkoina h1 (sivuille jaetussa kirjassa vain tämä sivu).
      if (document.querySelector('table.headerbox, table.header') && /uchicago/.test(location.hostname)) return { otsikot: document.querySelectorAll('h1').length, viitteet: document.querySelectorAll('a.ref').length };
      if (w) return { otsikot: w.querySelectorAll('h2, h3, h4').length, viitteet: w.querySelectorAll('sup.reference, sup.mw-ref').length };
      const r = document.querySelector('.node-ensyklopedia .field-name-body .field-item');
      return { otsikot: r ? [...r.children].filter(p => p.tagName === 'P' && p.querySelector('a[name] strong, a[id] strong')).length : 0,
        viitteet: r ? [...r.querySelectorAll('a[href]')].filter(a => /\/node\/|\/ensyklopedia\//.test(a.getAttribute('href'))).length : 0 };
    });
    const leike = await s.evaluate(k => (0, eval)(k), koodi);
    await s.close();
    const L = await ctx.newPage();
    await L.goto(PAIK + 'luin/latomo.html');
    // Kuten latomoon.js: arvo ja input-tapahtuma. Playwrightin fill kesti Gutenbergin kirjalla (1,1 Mt) 42 s, Latomo itse 1,6 s.
    await L.evaluate(md => { const e = document.getElementById('md'); e.value = md; e.dispatchEvent(new Event('input', { bubbles: true })); }, leike.koko);
    await L.waitForTimeout(900);
    const md = await L.evaluate(() => window.__latomo.tulos().md);
    fs.writeFileSync(path.join(VALI, nimi + '.md'), md);
    fs.writeFileSync(path.join(VALI, nimi + '.leike.md'), leike.koko);
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
          if (!k) return false;
          const v = (t.match(/(1[5-9]\d\d|20\d\d)/) || [])[1], n = (t.match(/\p{Lu}[\p{L}’'-]+/u) || [])[0];
          // Toistoviiva (—— (2006). …) on edellisen kohdan tekijä.
          return (v && !k.textContent.includes(v)) || (n && !/^\s*[—–-]{2,}/.test(k.textContent) && !k.textContent.replace(/­/g, '').includes(n));
        }).map(x => x.textContent + ' → ' + d.getElementById(x.getAttribute('href').slice(1)).textContent.slice(0, 60)),
        otsikot: [...d.querySelectorAll('#t > h2, #t > h3, #t > h4')].map(h => h.tagName[1] + ' ' + h.textContent.replace(/­/g, '')),
        varoitukset: r.warnings.map(w => w.msg) };
    }, md);
    await L.close();
    const JAANTEET = [/muokkaa wikitekstiä|\[muokkaa|\[edit\]/g, /<\/?(sup|span|table|div|a)\b/g, /XLUINVIITE/g, /redirects here|ohjataan tänne/g, /cite_note|CITEREF/g];
    const jaanteet = JAANTEET.map(re => (md.match(re) || []).length);
    const wl = (/^## Wikipedia[- ]a(rtikkelit|rticles)\n\n((?:- .*\n?)*)/m.exec(md) || [, , ''])[2].split('\n').filter(Boolean).length;
    const tulos = { nimi, lahde, t, jaanteet, wl, viitteita: leike.kokoViitteita, sanoja: leike.kokoSanoja };
    yht.push(tulos);
    console.log('=====', nimi, '(' + url + ')');
    console.log(`  otsikot: lähteessä ${lahde.otsikot}, tuloksessa ##/###/#### ${t.h2}/${t.h3}/${t.h4}; sanoja ${leike.kokoSanoja}`);
    console.log(`  alaviitteet: lähteen merkkejä/linkkejä ${lahde.viitteet}, leikkeessä ${leike.kokoViitteita}, Luinissa ${t.alaviitteet} (lähteen sivulla ${t.tyhjat})`);
    console.log(`  kirjallisuus: p.bib ${t.bib}, tunnistettu ${t.kohdat}; lähdelinkit ${t.linkit} (alaviitteissä ${t.alaviitteissa}), rikki ${t.rikki}, epäilyttävä kohde ${t.vaarat.length}`);
    if (NAYTA) t.vaarat.slice(0, 5).forEach(v => console.log('    VÄÄRÄ? ' + v));
    if (wl) console.log(`  Wikipedia-artikkeleita luettelossa ${wl}`);
    console.log(`  jäänteet (muokkaa, raaka HTML, merkki, ohjausrivi, viitetunnus): ${jaanteet.join('/')}; md.js-varoituksia ${t.varoitukset.length}`);
    if (NAYTA) { console.log('  ' + t.otsikot.join('\n  ')); t.varoitukset.slice(0, 8).forEach(v => console.log('    VAR ' + v)); }
  }
  console.log('\nYHTEENVETO');
  const sum = f => yht.reduce((n, y) => n + f(y), 0);
  console.log(`  artikkeleita ${yht.length}; alaviitteitä ${sum(y => y.t.alaviitteet)}, p.bib ${sum(y => y.t.bib)}, lähdelinkkejä ${sum(y => y.t.linkit)}, rikki ${sum(y => y.t.rikki)}, epäilyttäviä ${sum(y => y.t.vaarat.length)}, jäänteitä ${sum(y => y.jaanteet.reduce((a, c) => a + c, 0))}`);
  console.log('  välimuisti ja tulokset: ' + VALI);
  await b.close(); palvelin.close();
})().catch(e => { console.error(e); process.exit(1); });
