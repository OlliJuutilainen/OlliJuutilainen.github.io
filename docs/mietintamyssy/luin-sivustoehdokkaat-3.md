# Luin: sivustoehdokkaat, kolmas satsi (henkilölistan innoittamana, mitattu)

Hyllyyn 20.11.2026. Jatkoa tiedostoille [luin-sivustoehdokkaat.md](luin-sivustoehdokkaat.md) (*vanha lista*) ja
[luin-sivustoehdokkaat-2.md](luin-sivustoehdokkaat-2.md) (*toinen satsi*). Niissä jo käsiteltyjä ei toisteta, paitsi kun
mittaus muutti tietoa. Mitään ei ole toteutettu.

Käyttäjän pyyntö: ihmislistan (Kierkegaard, Hegel, Girard, Vico, Leibniz, Cassirer, Hermann Cohen, Heidegger, Charles
Taylor, Nāgārjuna, Schopenhauer, Whitehead, Levinas, Lacan, Popper, Saussure, J. S. Mill, zarathustralaisuus, Eco, Iris
Murdoch, Tuomas Akvinolainen, Goethe, Snellman, Runeberg, Uuden testamentin kriittiset editiot, latinankieliset Raamatut,
Luther, Bonhoeffer, Husserl, Mestari Eckhart, Giddens, Durkheim, Galilei, Newton, Llull, Douglas Harding, Kuhn, Polanyi,
Alan Watts, Joseph Campbell) innoittamana (1) yksittäisen henkilön tai lajityypin alkutekstien tai kommentaarien pesiä ja
(2) yleisempiä ympäristöjä, joissa nämä sattuvat esiintymään. *Älä optimoi, vaan kahlaa perusteellisesti.*

## Miten mitattu

Kuten toisessa satsissa: pilvikontista 20.11.2026 curlilla ja skriptillä, noin 200 sivua. **Sanat** = näytesivun
`<p>`-kappaleiden sanat (vähintään 8 sanan kappaleet, script/nav/header/footer pois); **kaikki** = koko näkyvä teksti, kun
teksti on taulukoissa tai div-lohkoissa eikä `<p>`:ssä. Mainos- ja lahjoitusmerkit on haettu säännöllisillä lausekkeilla,
joten ne ovat suuntaa-antavia (luin.md, *Rahoitushuomautus*: tarkista sovitetta tehtäessä).

Esto ei estä käyttäjää (lisäosa lukee sivun selaimessa), vaan vain mittauksen. Tässä istunnossa JavaScript-evästeseinän
ohittaminen curlilla estettiin, joten sellaiset sivustot ovat *ei mitattu*. Anubis-sivustot mitattiin curlin omalla
tunnisteella kuten OpenEditionissa.

## Kärki: 12 ensimmäistä

| # | Sivusto | Kenelle | Mitattu | Miksi |
|---|---|---|---|---|
| 1 | **Det Kgl. Biblioteks tekstportal** (tekster.kb.dk): *Søren Kierkegaards Skrifter* (sks.dk ohjaa tänne), Arkiv for Dansk Litteratur, Grundtvigs Værker, Danmarks Breve, Louis Hjelmslev og hans kreds | Kierkegaard (myös Hegel, Luther hakemistoissa), Saussuren perillinen Hjelmslev | *Frygt og Bæven* (`/text/sks-fb-txt-root`): **40 996 sanaa yhdellä sivulla** | Koko teos sivulla, ja siinä SKS:n koneisto: 496 kommenttilinkkiä erilliseen selitysosaan (`sks-fb-kom-root#fb-2`), 110 painoksen sivunumeroa (`pagination edition`), 39 tekstikritiikin huomautusta (`apparatus-criticus`). Henkilö- ja paikkamerkinnät ovat emojisymboleita (👤, 📌, ►), jotka yleinen leikkaus toistaisi tekstissä: sovite tarpeen. Kommentit alaviitteiksi ja sivunumerot Korporan tapaan. Lisenssi CC0 (sivun linkki). Rails/Blacklight, palvelin renderöi; yksi sovite kattaa kaikki kokoelmat. |
| 2 | **isidore.co/aquinas** (Joseph Kennyn HTML-laitos) | Tuomas Akvinolainen | *De veritate* q. 1 latina–englanti: **37 361 sanaa**, 321 riviparia; englanti yksin 21 642 | Latina ja käännös ovat samalla taulukkorivillä kappale kappaleelta: suoraan lukimen *lomitetuksi käännökseksi* (`ladonta: lomitettu käännös`, kuten Perseus). Kattaa Summan, Contra Gentilesin, Sententiae-kommentaarin ja kiistakysymykset. Latina yksin myös **Corpus Thomisticum**issa (q. 1: 17 781 sanaa; vanhalla listalla). |
| 3 | **Religion Online** (religion-online.org; WordPress) | Whitehead ja prosessiajattelu, Bonhoeffer, Girard, Heidegger, Kierkegaard, Eckhart, Luther, Taylor | Hartshornen *Anselm's Discovery*, Part One: **39 238 sanaa**; prosessifilosofian artikkeli 5 702 sanaa, 240 alaviitemerkkiä | Kokonaisia teologian ja uskonnonfilosofian kirjoja luvuittain ja *Process Studies* -tyyppisiä artikkeleita. Haun ensimmäisellä sivulla: Whitehead 9, Eckhart 10, Heidegger 9, Kierkegaard 9, Girard 8, Bonhoeffer 7, Taylor 7, Luther 5 osumaa (haku näyttää noin kymmenen kerrallaan, joten alarajoja). Ei mainosmerkkejä. Sovite: kirja kootuksi, WordPressin `footnote-ref`-alaviitteet. |
| 4 | **Michigan Publishing** (journals.publishing.umich.edu): *Philosophers' Imprint*, *Ergo* | Kant, analyyttinen ja varhaismoderni filosofia | Ditter (Phil. Imprint): 10 941; Stratmann, *Rationalism Self-Restrained: Kant, Autonomy, and the Bounds of Sense* (Ergo): 12 719 | **Alusta on Janeway**, mutta nykyinen `janeway()` ei tunnista sitä: tunnistin vaatii `#main_article.article-body` tai `itemprop`, ja Michiganissa on `<article id="main_article">` ilman niitä. Muu merkintä sama (`.article-section`, `a.xref-fn`, `footnotemarker`, `citation_*`). Todennäköisesti tunnistimen laajennus riittää: pienin työ koko listalla. Anubis päästää curlin omalla tunnisteella. |
| 5 | **PoPuPS** (popups.uliege.be, Liègen yliopisto; Lodel 1.0): *Bulletin d'analyse phénoménologique* ym. | Husserl, Heidegger, Levinas, Merleau-Ponty, Hegel | Merleau-Ponty ja Einstein: 9 111; *Im Denken, aber nicht in den Dingen* (Hegel-kritiikki, saksaksi): 15 142 | Lodel-merkintä kuten OpenEditionissa (111 `footnotecall` ja `notesbaspage`, `resume`, `bibliographie`, `texte`). Fabula-sovitteen Lodel-apufunktiot (toinen satsi) sopinevat; OpenEdition-sovitteen tunnistus tuskin osuu. Fenomenologian ranskankielinen pää, jota OpenEdition ei kata. |
| 6 | **SLS:n digitaaliset editiot**: Zacharias Topelius Skrifter, Henry Parlands Skrifter, Westermarck, von Wright, Edelfelt | Snellmanin ja Runebergin aikalaisympäristö; Durkheimin aikalainen Westermarck | Topelius, *Planeternas skyddslingar*, johdanto: **40 563 sanaa**, alaviitemerkkejä 2 475 | Angular, mutta palvelin renderöi tekstin. Kokoelma osittain (*Omslag*, *Titelblad*, *Förord*, *Inledning*, teksti), joten sovite kokoaisi. Sama alusta kaikilla SLS:n editioilla: alustasovite. Runebergia SLS:n verkkoeditioissa ei ole. |
| 7 | **J. V. Snellmanin kootut teokset** (snellman.kootutteokset.fi; Drupal 7) | Snellman | Noin 2 950 asiakirjaa (295 luettelosivua); 40 asiakirjan näytteen pisin 1 525 sanaa | Asiakirjat ovat yksittäin lyhyitä (kriteeri 2: rajatapaus), mutta niissä on koneisto: alaviitteet (`see-footnote`, `footnotes`), ruotsinkielinen alkuteksti rinnalla ja pdf. Ainoa paikka, jossa koko Snellman on suomeksi tekstinä. |
| 8 | **Projekt Gutenberg-DE** (projekt-gutenberg.org), uudistettu | Hegel, Kant, Schopenhauer, Goethe, Luther, Freud, Cassirer | Hegel, *Glauben und Wissen*, luku 3: 8 704 sanaa | Sivusto on nyt WordPress (7.1.5), eikä etusivulla tai lukusivulla näkynyt mainosverkkojen merkkejä (vanhan listan aikaan Spiegelin mainosalusta: tarkista). Kirja luvuittain (`/books/<kirja>/chapter/N`): sovite kokoaisi koko kirjan. Tekijäsivuilla teoksia: Freud 31, Kant 20, Cassirer 2 (*Idee und Gestalt*, *Zur Logik der Kulturwissenschaften*); Eckhart, Bonhoeffer, Husserl, Cohen ja Kierkegaard 0 (näillä osoitteilla). |
| 9 | **Book of Concord** (bookofconcord.org; Hugo) | Luther | Iso katekismus, *Ten Commandments*: 23 731 sanaa; Augsburgin tunnustuksen artikla 70 sanaa | Tunnustuskirjat; pitkät osat yhdellä sivulla, lyhyet artiklat kukin omallaan, joten sovite kokoaisi tunnustuksen. |
| 10 | **Edition Open Sources / Edition Open Access** (MPIWG) | Galilei, Newton, tieteenhistoria (Kuhnin maasto) | Pseudo-Proklos, luku: 7 371 sanaa, 338 alaviitemerkkiä | 14 EOS-nidettä HTML:nä luvuittain, mm. Guidobaldo del Monte, *The Equilibrium Controversy*, *Science in Court Society* (Galilein Firenze), Cusanuksen matemaattiset kirjoitukset. Sama alusta: *Max Planck Research Library for the History and Development of Knowledge* (mprl-series.mpg.de, artikkeleita ei mitattu). |
| 11 | **Nova Vulgata** (vatican.va) | latinankielinen Raamattu | Roomalaiskirje: 7 032 sanaa yhdellä sivulla | Kirja kerrallaan, jaenumerot tekstissä, ei koneistoa. Vanhan listan karsinta (jaetiedot) koski jaesovelluksia; tämä on kokonaista tekstiä. Mittaa ensin yleinen leikkaus. |
| 12 | **laparola.net/greco** | UT:n kriittiset editiot | Joh. 1: 1 491 sanaa sivulla | Kreikkalainen UT luvuittain, valinnaisesti tekstivariantit käsikirjoitussiglumeineen, Westcott–Hort, Tischendorf ja bysanttilainen teksti rinnalla. Lomake lähettää POSTin, joten luvulla ei ole pysyvää osoitetta (sovite lukee näkyvän sivun). Rajatapaus kriteerin 2 kannalta, mutta lähin avoin kriittinen editio. |

## Henkilöittäin

Merkinnät: *sanat* mitattu; *ei mitattu* (syy); *(?)* muistitieto; *katettu* = nykyinen sovite kattaa jo.

- **Kierkegaard:** KB:n tekstiportaali (kärki 1). Storm (toinen satsi: yleinen leikkaus riittää). Religion Online.
- **Hegel:** Projekt Gutenberg-DE (kärki 8); BAP:n Hegel-artikkelit (kärki 5). hegel-system.de (hegel.net, vanhalla listalla)
  on kaavioita ja pdf:iä (Logik-sivu: 30 sanaa), karsittu. Deutsches Textarchiv (vanhalla listalla; Hegelin *Phänomenologie*
  1807 ym.): JavaScript-evästeseinä, ei mitattu; selaimessa aukeaa.
- **Girard:** *Girardian Reflections on the Lectionary* (girardianlectionary.net; WordPress): Proper 27A 8 990 sanaa,
  lahjoitusmerkkejä. Yleinen leikkaus todennäköisesti riittää, mittaa. Raven Foundation ja Imitatio: etusivuilla 133 ja 119
  sanaa, ei artikkelikokoelmaa. Church Life Journal (Notre Dame): 3 099 sanaa.
- **Vico:** *katettu*: it.wikisourcessa Nicolinin Laterza-laitos (*La scienza nuova* 1911–1916, *Autobiografia*, *Le
  orazioni inaugurali*, *De antiquissima*). ISPF:n Vico-portaali 403 (myös toisessa satsissa). Biblioteca Italiana ja
  Classici italiani: yhteys katkesi.
- **Leibniz:** leibniz-translations.com on nyt React-sovellus (HTML tyhjä): pahvin sääntö 5, ohitettu. **gwleibniz.com
  (Leibnitiana) on kaapattu** ja ohjaa uhkapelisivustolle: pois.
- **Cassirer:** Projekt Gutenberg-DE: kaksi teosta. Cassirer Studies: yhteys katkesi.
- **Hermann Cohen:** ei omaa pesää löytynyt; Internet Archiven tekstiversiot (*katettu*).
- **Heidegger, Husserl, Levinas:** PoPuPS/BAP (kärki 5). **Phenomenology Online** (phenomenologyonline.com; WordPress):
  *Textorium*-tekstit, Baldursson 8 874 sanaa; yleinen leikkaus todennäköisesti riittää. Érudit (Philosophiques, Laval
  théologique et philosophique: Levinas-artikkeleita): Anubis myös curlin tunnisteella, ei mitattu. Springer (Husserl Studies
  ym. avoimet artikkelit): *Client Challenge*, ei mitattu. De Gruyter Brill (Open Theology, Open Philosophy): artikkelisivut
  202 ilman sisältöä (WAF), ei mitattu.
- **Charles Taylor:** The Immanent Frame (WordPress): 5 580 sanaa; *A Secular Age* -foorumin osoite ei löytynyt arvaamalla.
  The Hedgehog Review: 7 238 sanaa, maksumuurin merkkejä ei näkynyt. Religion Online.
- **Nāgārjuna:** Digital Sanskrit Buddhist Canon (dsbcproject.org): sanskritia, luku 3 009 sanaa (teksti div-lohkoissa),
  madhyamaka-luettelot olemassa; *Mūlamadhyamakakārikā* ei varmistettu. The Indian Philosophy Blog (WordPress): 1 210 sanaa,
  lyhyehköjä.
- **Schopenhauer:** Projekt Gutenberg-DE. *Voluntas* (OJS): galleriat tiedostoina, ei HTML:ää.
- **Whitehead:** Religion Online (kärki 3). Cosmos and History (OJS): pelkkiä pdf:iä. **Gifford Lectures**
  (giffordlectures.org) uudistettu: kirjatekstit poistuneet (vanha `/books/…` 404, luentosivulla 0 sanaa), karsittu.
- **Lacan:** Staferla: seminaarit .docx ja .pdf, ei HTML:ää, karsittu. Gaogoa: sekalaista. **Lacan Online** (WordPress):
  peiliaste I 10 587 sanaa, joista osa 49 kommentista; yleinen leikkaus todennäköisesti riittää.
- **Saussure:** **Texto!** (revue-texto.net): vanhat Saussure-tekstit HTML:nä kehyksissä (Bouquet, *Après un siècle…*: 3 038
  sanaa, 72 alaviitemerkkiä; Latin-1-merkistö), käsikirjoitukset ja uudet artikkelit (Lodel 0.9) pdf:nä. Rajatapaus.
  Signo (signosemio.com: Saussure, Eco, Greimas): botintarkistus (*One moment, please*), ei mitattu. Hjelmslevin kokoelma KB:n
  portaalissa (kärki 1).
- **Eco:** Signo (ei mitattu). Doppiozero ja Il Tascabile *katettu*.
- **J. S. Mill:** OLL estää edelleen (toinen satsi); utilitarianism.net 429. Gutenberg *katettu*.
- **Zarathustralaisuus:** avesta.org: sivukartta näyttää Yasnan, Vendidadin ym. HTML-sivut (SBE-käännökset), mutta tekstisivut
  antoivat 429, ei mitattu. Heritage Institute (heritageinstitute.com/zoroastrianism): yleiskatsaus 9 423 sanaa, vanhaa HTML:ää,
  paljon pdf-linkkejä. sacred-texts.com: Cloudflare, ei mitattu.
- **Iris Murdoch, Popper, Kuhn, Giddens:** omaa avointa tekstipesää ei löytynyt; Murdochin seura ei vastannut, LSE Review of
  Books 403. Kuhnin maastoon Edition Open Access (kärki 10).
- **Tuomas Akvinolainen:** isidore.co (kärki 2), Corpus Thomisticum. aquinas.cc 404 (kontista).
- **Goethe:** Projekt Gutenberg-DE; Goethezeitportal: varmenneketju katkesi. Cassirerin *Idee und Gestalt*.
- **Snellman:** kärki 7. **Runeberg:** ei verkkoeditiota; sv-Wikisource (*Fänrik Ståls sägner*, *katettu*) ja Projekt Runeberg
  (vanhalla listalla). SLS:n editiot (kärki 6) ovat aikalaisympäristö.
- **UT:n kriittiset editiot:** laparola.net (kärki 12). NA28 die-bibel.de:ssä: luku sivulla (Joh. 1: 865 sanaa), ei
  apparaattia; mainosmerkit epäselvät, lahjoituksia. SBLGNT: esittelysivu. TC: A Journal of Biblical Textual Criticism
  (jbtc.org): 522, ei mitattu. Text & Canon Institute (WordPress): artikkelia ei löytynyt etusivulta.
- **Latinankieliset Raamatut:** Nova Vulgata (kärki 11). Vulgata die-bibel.de:ssä 404 arvatulla osoitteella; vulsearch
  (Clementina) Cloudflare; drbo.org (Vulgata ja Douay–Rheims): luettelosivu, tekstiä ei mitattu. Latin Library (vanhalla
  listalla): luettelosivu. Corpus Corporum (mlat.uzh.ch) on nyt sovellus (*browser*), ei mitattu.
- **Luther:** Book of Concord (kärki 9). Project Wittenberg: hakemistosivuja, Galatalaiskirjeen kommentaarin luvut
  ohjautuvat osin CCEL:iin (*katettu*). Projekt Gutenberg-DE: vain lyhyitä (*Drei Fabeln*).
- **Bonhoeffer:** Religion Online. dietrich-bonhoeffer.net: portaali (204 sanaa).
- **Mestari Eckhart:** Religion Online (10 osumaa). Eckhart Society (WordPress): etusivu. Bibliotheca Augustanan Eckhart-sivua
  ei löytynyt (vanha osoite 404).
- **Durkheim:** Les Classiques des sciences sociales: 503 ja katkeava yhteys, ei mitattu. **Persée** (L'Année sociologique,
  Revue philosophique de Louvain): artikkelisivulla vain tiivistelmä; teksti latautuu skannattujen sivujen fragmentteina
  (`data-content-url="…/doc/page/…"`), ja fragmentit alkoivat antaa 500-virheitä. Sovite voisi koota fragmentit samasta
  alkuperästä selaimessa (?): ei todennettu.
- **Galilei:** Edition Open Sources (kärki 10); it.wikisource *katettu*.
- **Newton:** Newton Project: kirje Bentleylle normalisoituna 1 411 sanaa; tekstit normalisoituina ja diplomaattisina.
- **Llull:** lullianarts.narpan.net: Ars Magna ja Ars Brevis *html version* ovat miellekarttoja (7–8 sanaa) ja pdf:iä, karsittu.
  Cervantes Virtualin Llull-portaali: lukunäkymä 403, ei mitattu. Llull DB on tietokanta.
- **Douglas Harding:** headless.org: artikkelit lyhyitä (851 sanaa), lahjoitusmerkkejä. Rajatapaus.
- **Polanyi:** Tradition & Discovery (polanyisociety.org): pdf ja e-kirja, karsittu.
- **Alan Watts:** alanwatts.org ja alanwatts.com: äänitteitä, mainosmerkkejä. organism.earth (Watts-litteraatiot): 403, ei mitattu.
- **Joseph Campbell:** MythBlast (jcf.org; Wix): 1 837 sanaa, raskas sivu (1,2 Mt). Rajatapaus.
- **Kant-lehdet** (käyttäjän maininta): Estudos Kantianos ja Kantian Journal (kantiana.ru): pdf; Revista de Estudios Kantianos:
  Anubis ja 429, ei mitattu. Con-Textos Kantianos ja Korpora *katettu*; Ergo (kärki 4) julkaisee Kant-artikkeleita.

## Raamatunkäännökset ja alkukieliset tekstit (lisäys 20.11.2026)

Käyttäjän rajaus: suomeksi, ranskaksi, englanniksi ja saksaksi joko tutkimuksellisesti arvostetut (kriittisen tekstin
pohjalta tehdyt) tai historiallisesti merkittävät käännökset, hyvälaatuisesta lähteestä. Ei seurojen omia
herätyskäännöksiä eikä KJV:tä roskaversiona. Suomessa jo Kirkkoraamattu 1933/38 kelpaa; ranskassa, saksassa ja englannissa
korkeampi rima, mutta Lutherbibel ja KJV hyvällä laadulla käyvät. Lisäksi kreikka ja latina: myös ei-kriittiset mutta
historiallisesti merkittävät (Textus Receptus, Hieronymuksen Vulgata, Septuaginta) ja moderni kriittinen latina.

**Pääosin jo katettu: Wikisource.** Nykyinen Wikisource-sovite tunnistaa kaikki kielet, ja Wikisourcessa on yksi kirja
yhdellä sivulla. Mitattu (sanat kirjasivulla):

| Käännös | Wikisource | Näyte |
|---|---|---|
| **Agricola, *Se Wsi Testamenti* 1548** | fi | Matteus: 24 301 |
| **Biblia 1776** | fi (*Raamattu 1776/…*) | Roomalaiskirje: 7 839 |
| **Luther, syyskuun testamentti 1522** | de (*Lutherbibel/… (1522)* ja *Das Newe Testament Deutzsch/…*) | Roomalaiskirje: 16 807 |
| **Lemaistre de Sacy (Port-Royal)** | fr (*Bible Sacy/…*) | Luukas: 28 869 |
| **Crampon 1923** (katolinen, aikanaan filologinen, viitteet) | fr | Apostolien teot: 26 596 (koko teksti 36 548 viitteineen) |
| **Segond 1910** | fr | Luukas: 27 125 |
| **Wycliffe** (myös *Early Wycliffe*) | en | Johannes: 19 857 |
| **Tyndale** | en | Johannes: 19 946 |
| **Geneva** | en | Roomalaiskirje: 9 986 |
| **Bishops' Bible** | en | Luukas: 27 170 |
| **King James** | en | 1. Mooseksen kirja: 42 274 |
| **Douay–Rheims (Challoner)** | en | 1. Mooseksen kirja: 42 396 |
| **American Standard Version 1901** (Revised Versionin amerikkalainen laitos, Westcott–Hortin kauden kriittinen teksti) | en | Johannes: 19 889 |
| **Brenton 1879** (Septuagintan englanninnos) | en (*Septuagint (Brenton 1879)/…*) | 1. Mooseksen kirja: 73 836 sanaa, taulukossa (kreikka ja englanti rinnakkain?) |
| **Vulgata Clementina** | la | Johannes: 15 956 |
| **Castellio, *Biblia Sacra* 1551** (humanistilatina) | la | Roomalaiskirje: 7 391 |
| **Septuaginta (Rahlfs)** | el (*Η Παλαιά Διαθήκη (Rahlfs)*) | 1. Mooseksen kirja: 34 260 |
| **Kreikkalainen UT, Konstantinopolin patriarkaatin teksti** (1904) | el (*Καινή Διαθήκη*) | hakemisto mitattu, kirjoja ei |

English Revised Versionista (1881–1885) on Wikisourcessa vain esipuhe. Brentonin sivu on taulukko (`<p>`-sanoja 0), joten
tarkista leike ennen kuin pidät sitä katettuna.

**Uusi alusta: raamattuseurojen lukupalvelu** (raamattu.fi ja die-bibel.de). Molemmissa sama osoitemalli
(`/raamattu/KR38/MAT.1`, `/en/bible/NA28/JHN.1`, USFM-kirjakoodit) ja sama CloudFront-virhesivu, joten ilmeisesti sama
alusta: yksi sovite.

- **raamattu.fi** (Suomen Pipliaseura): **Kirkkoraamattu 1933/38** (`KR38`) ja **Raamattu 1992** (`KR92`) luku kerrallaan,
  Matteus 1: 354 ja 307 sanaa, viitemerkkejä yli 250 sivulla. `KR33` ja `R1776` 404. Sovite kokoaisi kirjan luvuista.
- **die-bibel.de** (Deutsche Bibelgesellschaft): **Nestle–Aland 28** luku kerrallaan (Joh. 1: 865 sanaa, ei apparaattia);
  sivuston esittelysivut *Biblia Sacra Vulgata* (Stuttgartin kriittinen Vulgata, Weber–Gryson) ja *Septuaginta* (Rahlfs)
  ovat olemassa, mutta lukusivujen koodeja ei saatu selville ennen kuin CloudFront alkoi antaa 403:a kaikille hauille.
  Lutherbibel 2017, Zürcher Bibel 2007 ja Einheitsübersetzung 2016: ei mitattu (403). Rahoitus: Raamattuseura, lahjoitukset;
  mainosmerkkien osuma epäselvä.
- Kontti estyi molemmissa muutaman haun jälkeen. Sovitteen pitää koota kirja maltillisesti (luvut peräkkäin, ei rinnakkain).

**Muut:**

- **Nova Vulgata** (vatican.va, kärki 11): moderni kriittinen latina, oli jo kuormassa.
- **AELF** (aelf.org): Ranskan katolisen kirkon liturginen käännös (2013), luku sivulla (Room. 1: 846 sanaa). Kriittispohjainen,
  mutta kirkollinen; rajatapaus.
- **NET Bible** (netbible.org): Joh. 1: 1 356 sanaa ja paljon käännösviitteitä, Cloudflare-merkki. Evankelikaalinen laitos,
  jonka viitteet ovat tekstikriittisesti perusteellisia; käyttäjä päättää.
- **laparola.net** (kärki 12): Westcott–Hort, Tischendorf ja bysanttilainen teksti varianttien kanssa.
- **Textus Receptus:** ei löytynyt hyvälaatuista lähdettä. Wikisourcessa ei ole; textusreceptusbibles.com on
  tunnustuksellinen KJV-only-sivusto (etusivu 130 sanaa), ei mitattu tarkemmin. Lähin: patriarkaatin teksti (yllä) ja
  laparola.netin bysanttilainen teksti.
- **Ei löytynyt vapaasti verkosta:** Bible de Jérusalem, TOB, NRSVue (vain BibleGatewayssa, joka on karsittu jaesovelluksena ja
  mainosten takia), Buber–Rosenzweig (tekijänoikeus voimassa 2035 asti).
- raamattu.uskonkirjat.net: harrastajasivusto, sivu näytti lomakkeen (394 sanaa); ei suositella, kun raamattu.fi ja Wikisource
  kattavat samat.

## Erasmus ja renessanssihumanistit (lisäys 20.11.2026)

Käyttäjän pyyntö: Erasmus Rotterdamilainen ja muut renessanssihumanistit, jos löytyy jotain järkevää. Toisen satsin
renessanssiosiossa jäi mittaamatta Philological Museum (varmenneketju); nyt se aukesi uudesta osoitteesta.

- **The Philological Museum** (philological.cal.bham.ac.uk, Dana F. Suttonin uuslatinan kirjasto, noin 290 teosta
  1400–1800-luvuilta, painottuu brittiläiseen uuslatinaan: Buchanan, Bacon, Milton, Camden, jesuiittadraama; Erasmuksesta adagio
  *Herculei labores*). Latina ja käännös ovat erillisillä sivuilla, joita vihreä neliö linkittää samaan ankkuriin, ja siniset
  neliöt vievät kommentaariin ja tekstikritiikkiin. *Tehty 20.11.2026* (`philological()`): lomitettu käännös kuten Perseuksessa ja
  Akvinolaisessa, kommentit alaviitteinä. Mitattu: Erasmuksen adagio, Garnet (Camdenin latinannos), Forsettin *Pedantius* (näytös 1),
  Miltonin *In quintum Novembris*; ennen vain avattu kieli ilman kommentteja (Miltonista 1 440 sanaa), nyt lomitettuna 26–30
  käännöslohkoa teosta kohti ja 37–131 kommenttia. Erasmus-sivun kommenttiankkurit ovat lähteessä pykälän väärässä kohdassa; sovite
  korjaa lemman perusteella.
- **The Latin Library** (thelatinlibrary.com/erasmus.html, *Neo-Latin*-osasto): Erasmuksen *Moriae Encomium* yhdellä sivulla
  (24 939 sanaa), *Querela Pacis* (9 954), *Institutio Principis Christiani*, *Antibarbari*, *Colloquia* (sisällyssivu, 515 sanaa) ja
  *Scripta selecta*; neo.html-osastolla myös muita humanisteja. Pelkkä latina ilman koneistoa: yleinen leikkaus todennäköisesti
  riittää (ei mitattu pesukoneella).
- **CAMENA** (mateo.uni-mannheim.de, varhaismodernin latinan korpus, ITALI-osasto: Alberti, Alciati ym.): sivut ovat skannauksia
  (tekstisivulla 0 sanaa), karsittu.
- **DBNL** (dbnl.org): Erasmuksesta lähinnä artikkeleita ja vanhoja hollanninnoksia (*De menschelijke zotheid*: 455 sanaa); alusta
  on iso, mutta humanistitekstien kannalta ohut.
- **Center for Thomas More Studies** (thomasmorestudies.org): CTMS- ja opetuslaitokset pdf:inä (28 ja 19 pdf-linkkiä), karsittu.
- **MONLOE** (Montaigne à l'œuvre, Tours) ja **BVH**: sivustot vastaavat, tekstisivuja ei mitattu; ARTFL:n Montaigne (Chicago):
  yhteys katkesi.
- Jo katettu: Wikisource (la, it, fr: Erasmus, Valla, Ficino, Rabelais, Montaigne), Gutenberg (*Praise of Folly*, *Colloquies*,
  *Utopia*), Castellion latinankielinen Raamattu (yllä).
- Ei löytynyt: Erasmuksen *Opera omnia* (ASD) ja *Collected Works* (Toronto) ovat maksullisia, *I Tatti Renaissance Library* samoin.
  Erasmus Center (erasmus.org) ohjaa Rotterdamin kirjaston sivulle.

## Augustinus, Nāgārjuna, Spinoza ja Descartes (lisäys 20.11.2026)

Käyttäjän kysymys henkilölistan ulkopuolelta. Mitattu kontista 20.11.2026.

- **augustinus.it** (Nuova Biblioteca Agostiniana, Città Nuova): koko tuotanto latinaksi ja italiaksi, kirja yhdellä sivulla
  (*Confessiones* I: latina 5 421, italia 7 284 sanaa; *De civitate Dei* I 11 821), samat kappaleankkurit kummassakin. *Tehty
  20.11.2026* (`augustinus()`): lomitettu käännös. Sivusto katkoo yhteyksiä toistuvista hauista (curl 35).
- **GRETIL** (Göttingen): *Mūlamadhyamakakārikā* yhdellä sivulla (7 375 sanaa sanskritia), *Vigrahavyāvartanī* 5 861.
- **Spinoza:** spinozaweb.org on luettelo (teossivulla 35 sanaa); ethicadb.org: *Ethica* kymmenenä versiona (latina Gebhardt,
  Appuhn, Elwes, Stern, Misrahi ym.), mutta osien sivut antoivat kontille 404, ei mitattu. la.wikisourcessa *Ethica*-hakemisto.
- **Descartes:** fr.wikisource (*Méditations métaphysiques*) ja la.wikisource (*Meditationes*): nykyinen Wikisource-sovite.
  Latin Libraryssä ei Descartes-sivua (404).
- **Augustinus muualla:** New Advent ja CCEL (englanti) ja Latin Library (*Confessiones* I: 5 218 sanaa) ovat jo sovitteita.

## Yleisemmät ympäristöt

- **KB:n tekstiportaali**, **Religion Online**, **Michigan Publishing**, **PoPuPS**, **SLS**, **Gutenberg-DE**, **Edition Open
  Access**: kärjessä. Jokainen on alusta tai iso kokoelma, ei yksittäinen sivusto.
- **Persée:** ranskalaisten lehtien vanhat vuosikerrat (Durkheim, Levinas-artikkelit); ks. Durkheim. Iso, mutta vaikea.
- **Érudit, Cairn, Redalyc, Springer, De Gruyter Brill, Cambridge Core:** isot avoimen tieteen alustat, kaikki kontista
  estettyjä tänään (Anubis, 403, WAF, Cloudflare). Ne kannattaa mitata selaimessa ennen kuin hylätään.
- **Hedgehog Review, Church Life Journal, The Immanent Frame:** Taylor- ja Girard-maastoa esseinä; yleinen leikkaus todennäköisesti.

## Jo katettu nykyisillä sovitteilla

- Wikisource: Vico (it), Runeberg (sv), Galilei (it).
- CCEL: Lutherin Galatalaiskirjeen kommentaari (Project Wittenbergin kautta), Eckhart (?).
- Internet Archive: Cohen, Cassirer (?) (Cassirerin tekijänoikeus päättyi EU:ssa 2016).
- OpenEdition: Signata (semiotiikka) (?), Philosophia Scientiae (?).

## Karsitut ja ohitetut

- **Kaapattu:** gwleibniz.com (Leibnitiana).
- **Tekstit poistuneet:** Gifford Lectures.
- **JavaScript-sovellus:** leibniz-translations.com, Corpus Corporum (mlat.uzh.ch).
- **Pdf, docx tai e-kirja:** Staferla, Tradition & Discovery, Estudos Kantianos, Kantian Journal, Cosmos and History, Voluntas,
  Llullin Ars-käännökset, Texton uudet artikkelit.
- **Kaaviot:** hegel-system.de.
- **Lyhyet tai ei tekstikokoelmaa:** Raven Foundation, Imitatio, dietrich-bonhoeffer.net, Eckhart Society, headless.org (rajatapaus).
- **Ei mitattu (esto tai katkos):** Deutsches Textarchiv (evästeseinä), Érudit, Revista de Estudios Kantianos (Anubis),
  Springer, De Gruyter Brill (WAF), sacred-texts.com, vulsearch, organism.earth, Cervantes Virtual (Cloudflare, 403), avesta.org
  (429), Zeno.org ja sks.dk:n vanha osoite (yhteys katkaistiin), IntraText ja Goethezeitportal (varmenneketju), Les Classiques des
  sciences sociales (503), Biblioteca Italiana, Classici italiani, Cassirer Studies, Iris Murdoch Society (yhteys katkesi).

## Ehdotettu järjestys, jos työ otetaan alle

1. **Michigan Publishing**: Janeway-tunnistimen laajennus; todennäköisesti pienin työ. *Tehty 20.11.2026* (`janeway()` laajennettu, MathML tekstiksi). Readability pärjäsi jo kohtuullisesti; sovitteen lisä on viittauslinkit, raa'an HTML:n poisto ja metatiedot.
2. **KB:n tekstiportaali** (SKS): koko teos sivulla, kommentit alaviitteiksi, sivunumerot; yksi sovite viidelle kokoelmalle. *Tehty 20.11.2026* (`kbTeksti()`; mitattu SKS ja ADL).
3. **isidore.co/aquinas**: rinnakkaistaulukko lomitetuksi käännökseksi; Perseuksen `ladonta` on valmiina. *Tehty 20.11.2026* (`aquinas()`).
4. **Religion Online**: kirja koottuna ja alaviitteet. *Tehty 20.11.2026* (`religionOnline()`): kolme viitemuotoa, OCR-sivunumerot.
5. **PoPuPS**: Lodel-apufunktiot Fabulasta. *Tehty 20.11.2026* (`popups()`).
6. **SLS:n editiot** ja **Snellman**: suomalainen pari. *Tehty 20.11.2026* (`sls()`, `snellman()`). Topeliuksen romaanin osat 2 ja 3 eivät tulleet palvelimelta (selain hakee ne rajapinnasta), joten niistä leikataan avattu osa.
7. **Projekt Gutenberg-DE**: kirja koottuna; tarkista rahoitus ensin. *Tehty 20.11.2026* (`gutenbergDe()`): lahjoitukset, ei mainosverkkoja.
8. Yleisen leikkauksen mittaus ennen sovitetta: Book of Concord, Nova Vulgata, Girardian Lectionary, Phenomenology Online,
   Lacan Online, Hedgehog Review, The Immanent Frame, Edition Open Access. *Tehty 20.11.2026*: Book of Concord (`bookOfConcord()`:
   artiklan sivulta koko tunnustus), Nova Vulgata (`novaVulgata()`: luvut, jaenumerot, kappaleet ja säkeet), Edition Open Sources ja
   MPRL (`eoa()`: koko kirja alaviitteineen), Newton Project (`newton()`: Readability pudotti alun ja viitteet) ja The Latin Library
   (`latinLibrary()`: yleinen leikkaus sai tekstin, sovite tekijän, otsikon ja pykälät). raamattu.fi ohitettu: CloudFront esti
   kontin jo toisella haulla (403), joten sovitetta ei voi todentaa. Jäljellä mittaamatta Girardian Lectionary, Phenomenology
   Online, Lacan Online, Hedgehog Review, The Immanent Frame.
9. Estetyt (Érudit, Persée, Springer, DTA, Signo) vain, jos ne saa mitattua selaimessa.
