---
paths:
  - "luin.html"
  - "luin/**"
  - "android/luin/**"
  - "docs/viitteet/**"
---
## Luin

Tässä on vain se, mitä koodista ei näe tai minkä voisi helposti rikkoa. Yksityiskohdat ovat kehittäjän oppaassa
(*opas*, luvut mainittu alla), joka on yksityisessä tusina-rata-repossa: `oppaat/luin-kehittajan-opas.md`.

Käyttäjälle näkyvä teksti puhuu yksikössä, ei *meistä* (*kerro*, ei *kerro meille*), koska kehittäjä on yksi ihminen; poikkeus
on leikillinen puhetapa kuten *Tusinasoftin johtoryhmä*. Kehittäjä on käyttäjälle *Olli* (*suoraan Ollille*, ei *kehittäjälle*);
lisäosan tietosuojasivu jää muodolliseksi.

### Tiedostot

- `luin.html` (juuressa, koska ohjelman nimi on luin.html): pino ja lukija samalla sivulla. Tekstien sisältö on
  IndexedDB:ssä (`luin/tekstit.js`, `LuinTekstit`, lupauksia), kaikki muu localStoragessa (opas 2.3); palvelinta ei ole,
  paitsi postilaatikko. Älä palauta tekstejä localStorageen (5,2 milj. merkkiä koko sivustolle). Testit lukevat tekstin
  `LuinTekstit.lue()`:lla; testin localStorageen kylvämät `luin-teksti:`-avaimet siirtyvät kantaan latauksessa. `tekstit.js?v=` kuten md.js:n.
- **Tusina** (käyttäjän päätös, opas 2.3): pinossa enintään 12; tuleva teksti laskee pisimpään koskemattoman kellarin
  kampihyllystöön (`e.luettu` + `e.laskeutui`, tietorivillä *laskeutui*). Uusi tapa tuoda teksti pinoon kutsuu `pinoonTuli()`a ja `tusina()`a.
- `luin/md.js`: Markdown-jäsennin ja suomen tavutus, yhteinen lukijalle ja Latomolle. Tekstin tunnus pinossa ja Postihuilussa
  on `tekstiTunnus()`, ei `slug()`: slug antaa jokaiselle kreikkalaiselle tai kyrilliselle otsikolle saman `osio`n.
- `luin/latomo.html` (*Latomo*): tarkistaa md:n, täydentää etukentän, siirtää tekstin Luiniin tekstikannan siirrolla (`asetaSiirto()`)
  tai antaa .md:n ladattavaksi. Ohje kirjoittajalle: `luin/latomo-ohje.html`.
- `luin/mika-on-markdown.md`: *Mikä on Markdown* -teksti, avautuu lukimeen uuteen välilehteen
  Latomon johdannon alta (`luin.html#u=luin/mika-on-markdown.md`; ei ponnahdusta, Latomoa ei sotketa). Sisältö ja sävy ovat
  käyttäjän (myös iA Writerin, MarkTextin, Typoran ja Obsidianin esittely; poikkeus Latomon ohjeen iA Writer -linjaan).
  Verkko-osoitteet ovat paljaina sulkeissa, koska verkkolinkit ovat lukimessa oletuksena pois ja linkkiteksti näkyisi ilman osoitetta.
  Ei `luin/tekstit/`-kansioon (robots.txt estää sen).
- `luin/kayttoohje.html`: lukijan käyttöohje, **ei Latomon**. Kun lukijan käyttäjälle näkyvä toiminta muuttuu,
  tarkista käyttöohje.
- Kehittäjän opas ei ole julkisessa repossa eikä Luinissa (käyttäjän päätös). Kun toiminta muuttuu, päivitä opas tusina-radassa.
- `luin/lisaosa/` (*Lukimeen*, opas 7.5): selainlisäosa (MV3, Firefox, Firefox Android ja Chromium samalla
  koodilla, ei taustaskriptiä). Rajapinta Latomoon on vain `latomo.html#lisaosa`, `#md`, `#avaa` ja `#lataa` (`latomoon.js`; taustavälilehti sulkeutuu vain, jos `#lataa` lisää `body`yn `a[download]`-linkin, ja kirjoittaa odotuksen ajaksi Latomon kuittauksen `#lataa-tila` perään sulkeutumisesta):
  jos nimeät ne uudelleen, lisäosa lakkaa toimimasta. Postihuilu käyttää lisäksi `#laatikko-koodi` (attribuutti `data-ei-muistia`), `#laheta`, `#kk-tila`
  (alkaa *Ladottu postitettavaksi*; 0.4.0 odottaa *Lähetetty*) ja `#kk-virhe` sekä `#laatikko-virhe`; vanhat asennetut lisäosat käyttävät niitä yhä.
  Sarja (Perseuksen kirjat erikseen) käyttää lisäksi `#sarja`a. Leikkeen etukentän korvamerkki `leikattu:` kytkee Latomon
  leikesiivouksen (`siivoa()`: yläindeksit, otsikkoriviton HTML-taulukko, tyhjät linkit, peräkkäiset alaviitemerkit yhdeksi `[^ryhma-N]`:ksi,
  jotta yksi merkki avaa kaikki); muuta niitä yhdessä. Haetut alaviitteet
  (`[^viite-N]`, jatkorivit sisennettyinä ilman `>`:tä) ja SEP-sovite toistavat md.js:n `sivunViitteet()`:n ja
  kirjallisuusluettelon (`p.bib` vain kappaleista) sääntöjä: kun muutat niitä, aja `lisaosa-testi.js`. Lukevasta osasta käytetään
  sanaa *lukin* (*Poimi lukimeen*), tuotteesta *Luin* (käyttäjän päätös); asetusten Maalaus-valinta on *Lukimen*. Koko nimistö
  (pääotsikko *Luin.*, alaotsikko *HTML*, virallinen *LUiN.HTML*, osoite, lyhyt muoto, työkalu *lukin*, lisäosa): opas 1.3.
  Lisäosan nimi on *Lukimeen* (juoksevassa tekstissä *lukimeen-lisäosa*) ja sen ensimmäinen nappi *Poimi lukimeen*
  (käyttäjän päätös), pienin alkukirjaimin, i-napissa hakasulkeet. Versiota ei nosteta eikä zippejä anneta pyytämättä; sivuston
  uudet nimi- ja ulkoasulinjaukset viedään lisäosaan vasta silloin (kirjaa odottavat tähän). Lisäosan versionumero ei yksin kerro koodia:
  sovitteita lisätään versiota nostamatta, joten paketoimaton asennus on sen hetken tilannekuva. Kauppaosoitteen
  `lis%C3%A4%C3%A4-lukimeen`, Firefoxin tunnisteen `lisaa-lukimeen@tusinasoft` ja `lisaa-lukimeen.xpi`:n saa jättää.
  Logos- ja Wikipedia-sovitteet (opas 7.5) tekevät vain md.js:n jo ymmärtämää Markdownia,
  koska moottoria ei saanut muuttaa: Logoksen viittaukset ovat alaviitteitä, joiden tekijä–vuosi md.js linkittää kirjallisuus-
  luettelon osioon; Wikipedian wikilinkit ovat tekstissä tekstiä, ja loppuluettelossa ovat vain Pääartikkeli-, Katso myös- ja
  Lisätietoja-ohjausrivien artikkelit ja Katso myös -osio (käyttäjän päätös: kaikki wikilinkit ovat liikaa). Alaviitemerkki `XLUINVIITE…X` on ei-ahne, jotta vierekkäiset merkit eivät sulaudu.
  marxists.org-, Wait But Why- ja OECS-sovitteet (opas 7.5; OECS on psykologian SEP:n vastine)
  tekevät nekin vain md.js:n ymmärtämää Markdownia. OECS:n viittauksista poistetaan APA:n pilkku (*Mitchell 2009*) tarkoituksella:
  md.js linkittää vain SEP-muodon. oecs.mit.edu (PubPub) estää pilvikontin, joten sen runko on todentamatta
  (vastine oecs.knowledgefutures.org). Kun muutat niitä tai `samanSivunViitteet()`:ä, aja `hakuteos-pesukone.js` (rikki ja epäilyttävä 0).
  Encyclopedia.com-sovite (koko sivusto, opas 7.5) leikkaa aihesivulta yhden artikkelin (valinta,
  muuten lukukohta) ja kirjoittaa `teos`-kentän hakuteoksesta; Encyclopedia.com on md.js:n `KANTAJA`, jotta lisätietona näkyy hakuteos.
  IRED-sovite (IPA:n psykoanalyysin sanakirja FlippingBookina, opas 7.5) hakee hakusanan sivut sivuston
  hakukoneteksteistä; sovitteen regexeissä ei saa olla sisäkkäisiä valinnaisia kvanttoreita (jumittavat välilehden).
  SAET-sovite (St Andrews Encyclopaedia of Theology, opas 7.5): viittaukset ovat jo SEP-muotoa; Attributions-osio
  (lähdepainos, käännökset) jää tekstiin, Copyright-rivi etukenttään.
  Gutenberg-sovite (opas 7.5) leikkaa koko kirjan. `samanSivunViitteet()`:n kolmas parametri (jatkoehto) estää
  leipätekstin valumisen viitteeseen; ilman sitä käytös on ennallaan. Pesukone syöttää leikkeen Latomoon kuten lisäosa (ei `fill`).
  New Advent- ja CCEL-sovitteet (opas 7.5) kokoavat lyhyen luvun sivulta koko kirjan (enintään 250 sivua samalta
  sivustolta; tietosuojasivu mainitsee). Molemmat ovat md.js:n `KANTAJA`-sivustoja, joten lisätietona on tekijä.
  Psyche–Aeon-sovite (opas 7.5): ingressi jätetään pois tarkoituksella (kursiivina se olisi Luinissa alaotsikko ja
  lähdeviitteessä); anfangi `span.ld-dropcap` on osanvaihdon ainoa merkki.
  European Journal of Psychoanalysis -sovite (opas 7.5): lohkot (Bibliography, Notes, Bio, Publication Date) tunnistetaan
  otsikkosanasta, koska numerointi vaihtelee; APA-pilkku pois kuten OECS:ssä. Etukentässä `tyyppi: tieteellinen`, `teos` ja `numero`
  ilman `sivusto`a (viite toistaisi lehden nimen); `article:published_time` on WordPressin aika, ei julkaisupäivä.
  LacusCurtius-sovite (opas 7.5): Thayerin osoitteissa on `*` (`Isis_and_Osiris*/A.html`), joten niitä ei saa
  kirjoittaa `/* */`-kommenttiin (päättää kommentin). Kääntäjä vain varmasta etusivun lauseesta, muuten kenttä jää tyhjäksi.
  Pykälät ovat leikkeessä `<sup>`:na, jotka Latomo muuntaa (`^2^`); raakaleikkeestä md.js varoittaa niistä.
  Korpora.org/kant-sovite (opas 7.5): teos kootaan sisällysluettelon ja sivujen `<title>`-nimiön mukaan; AA-sivunumerot
  ovat yläindeksejä `4:393` (pahvin vaatimus: näkyvinä merkkeinä). Kappaleraja sivunvaihdossa on mitattu arvaus (opas 7.5); älä muuta
  rajaa mittaamatta uudelleen.
  Wikisource kulkee `wikipedia()`-funktiossa (`ws`; opas 7.5): kun muutat sitä, aja sekä `--sarja wikipedia` (leikkeiden pitää
  pysyä ennallaan) että `--sarja wikisource`.
  Perseus-sovite (opas 7.5) lukee teoksen TEI-XML:n XML:nä, ei `hae()`:lla (HTML-jäsennin rikkoo tyhjät `milestone`it).
  Kirjan nimi alkutekstin kielellä (`psKirja()`, käyttäjän päätös): Ilias Α–Ω ja Odysseia α–ω aakkosin, muu kreikka
  numeroin keraialla (*Republic Αʹ*, 6 = Ϛʹ; keraia U+0374, ei U+02B9, jota Literatassa ei ole), latina roomalaisin (*de Finibus I*),
  vain englanninkielinen *Book 1*. Ei englantilaista *Book*ia alkukieliseen tekstiin.
  Kreikkalaisen teoksen nimi kreikaksi (*Πολιτεία Αʹ*), kun leikkeessä on alkuteksti: Perseus antaa nimen vain englanniksi, joten
  nimet ovat taulukossa `PS_KREIKKA_NIMET` (NFC); puuttuva jää englanniksi. Lisää uusi teos taulukkoon.
  Valinnat ponnahdusikkunassa (opas 7.5): kielet ja kirjat menevät leikkurille muuttujassa
  `__lukimeenPs` (ikkuna asettaa sen `executeScript`-funktiolla ennen tiedostoja), ja XML pysyy sivun muistissa (`__lukimeenPsXml`).
  Ilman valintoja leike on tavulleen sama kuin ilman valintaikkunaa; testi `perseus-valinnat-testi.js` (vertaa pesukoneen leikkeisiin).
  *Kukin omaksi tekstikseen* (opas 7.5): leikkeen `sarja` → `odottaa.sarja` → Latomon piilokenttä `#sarja` (JSON,
  lisäosarajapinta) → siirron `sarja` → lukimen `tuo()`. Muuta ketju yhdessä.
  Kuvateksti on sovitteissa kokonaan kursiivinen kappale, joka alkaa tunnisteella (`*Table 1. …*`; opas 3.2): md.js tunnistaa sen
  siitä (`kuvateksti()`, `p.kuvateksti`), joten älä vaihda muotoa; puuttuvan taulukon huomautus tulee perään hakasulkeissa.
  Taulukon lyhyt solu (`td.lyhyt`) katkeaa vain välilyönnistä, ellei `ahtaatTaulukot()` merkitse taulukkoa ahtaaksi (opas 3.2).
  Rivinvaihto lisäosan leikkeessä on kenoviiva (Turndown `br: '\\'`), ei kaksi välilyöntiä; md.js:n `p.rivit` (kenoviivarivit tai
  lyhyt yksirivinen) on sisentämätön kummallakin kappalejaolla (käyttäjän päätös: sisennys vain leipätekstiin, opas 3.2).
  `ladonta: asiakirja` (Snellman-sovite, opas 7.5): md.js ottaa otsikkolohkon vain etukentästä, ja tekstin alun lyhyet rivit
  (kirjeen paikka ja päiväys, puhuttelu) jäävät tekstiin. Latomo säilyttää avaimen tuntemattomana kuten lomitetun käännöksen. Latomo päättelee
  etukentän poikkeamat samalla ladonnalla (`valmis()`): muuten kirjeen päiväysrivi pudottaa `julkaistu`n.
  Snellman-sovitteen pykälä (oma kappaleensa `§ 1`, `§ 2.`, `§ 19. Logiikasta`) on `####` kuten md.js:n pykäläsarja, ja luento
  (`1. luento`, `Kertaus 4. ja 5. luento, § 3`) `##` (`snOts()`; käyttäjän havainto: pykälät eivät olleet väliotsikoita);
  sääntötekstin rivin alku `§ 6 Näihin …` ja viittaus `§ 6, …` jäävät tekstiksi. `ladonta: asiakirja` -tekstissä md.js ei
  huomauta otsikoiden numeroinnista, koska aukot ovat lähteen (luentoluonnoksesta puuttuvat 5. ja 12. luento).
  Kreikan sivulta lomitettu käännös (`psLomitus()`): etukentän `ladonta: lomitettu käännös` tekee md.js:ssä
  lainauksista `blockquote.kaannos`ia; Latomo säilyttää avaimen tuntemattomana. Kohdistus viitenumeroista (`sup[data-ps]`), ei kappaleista.
  dhammatalks.org-sovite (opas 7.5): kirjan kokoaminen nojaa etusivun `.book-toc`:hen; etukentän `alaotsikko`
  tulee vain sovitteelta (yleinen leike ei kirjoita sitä).
  Open Journal Systems -sovite (opas 7.5; Problemos ja muut journals.vu.lt:n lehdet): tunnistus alustasta (generator ja
  `citation_*`, kokotekstin osoitteesta artikkelisivu), ei verkkotunnuksesta. Otsikko on kokotekstin `h1`, koska `citation_title` ja
  `citation_language` voivat olla toisella kielellä kuin artikkeli. VU:n alaviitemerkki viittaa tiedostonimeen (`1_X.html#footnote-016`),
  ei sivun ankkuriin. Pdf-artikkelista tiivistelmäleike metatiedoista. Testi myös `hakuteos-pesukone.js --sarja ojs`.
  VLE-sovite (vle.lt, opas 7.5) lukee sivun skriptin renderöimän rungon tai, ilman sitä, raa'an rungon ja `ajax.php`:n:
  pidä polut samana (ne antavat saman leikkeen). Hakuteospesukone ajaa vle.lt:n omat skriptit; testi `--sarja vle`.
  EUR-Lex-sovite (opas 7.5): TXT/HTML-sivun XHTML jäsentyy text/html-tyyppinä rikki (tyhjä `<a id>` jää auki ja kopioituu),
  joten kääreiden purku alussa on tarpeen. EUR-Lex haastaa toistuvat haut (AWS WAF, myös curl): pesukoneen välimuistin voi täyttää
  Cellarista (`publications.europa.eu/resource/celex/<CELEX>`, sama asiakirja). Leikkeen etukentässä on avain `laji` (EUR-Lex, Find Case Law).
  PsychOpen-sovite (`psychopen()`) on lähetysjärjestyksessä `ojs()`:n edellä, koska PsychOpen on OJS ja `ojs()` tekisi siitä tiivistelmäleikkeen.
  OJS:n metatiedot luetaan `ojsArvo()`lla (Filosofija. Sociologija koodaa entiteetit kahdesti); tyhjä tiivistelmä ei ole tiivistelmä.
  GRETIL-sovite (opas 7.5): kaksiosaisen säenumeron ensimmäinen osa on luku (otsikko lähteen nimirivistä tai kolofonista, muuten
  numero; nimeä ei keksitä), analyysisarake (padapāṭha) on lomitettu käännös, kappaleiden väliset toisinnot alaviitteitä; testi `--sarja gretil`.
  augustinus.it kokoaa koko teoksen vain teoksen kehyssivulta, kun pääkehyksessä on hakemisto tai oletussivu (`koko`); avattu
  kirja leikataan yksin tavulleen kuten ennen (`--sarja aug`). Koko teoksessa kohta sisältää kirjan (1.5.6).
  Wikisourcen *lyhyet laatikot ennen ensimmäistä pitkää kappaletta* -poisto ei saa viedä väliotsikon käärettä (`div.mw-heading`).
  PubMed antaa skriptittömälle haulle evästetarkistuksen (203), jota ei kierretä; Duodecim (`duodecim()`) on Angular-sovellus,
  joten pesukone ei aja sitä, ja se mitataan sivun skriptit ajavalla selaimella. Duodecimin `RAHOITUS` on *mainokset* (mainospaikka
  `app-adds`), joten se ei ole tuettujen listassa.
  Springer Nature-, PLOS- ja Frontiers-sovitteet (opas 7.5) käyttävät PMC:n `pmcNumeroviitteet()`ia asetuksin: kun muutat
  sitä, aja `--sarja pmc` (tavulleen ennallaan) ja `--sarja lehdet`. PMC:n tekijä–vuosi-viittaus linkittyy, koska sovite kirjoittaa
  kohdan alkuun viittauksen nimiön `Brunton et al. (2013).` (Vancouver-kohdasta md.js ei löydä tekijää eikä vuotta) ja Cochranen
  tutkimustunnuksen `Smith (1997a) {published data only}.` otsikon sijaan: älä poista näitä alkuja siistiäksesi luetteloa. Lehden
  nimi kirjoitetaan sivun lyhenteen mukaan (`pmcLehti()`). Numeroviittauksen linkin tekstissä saa olla hakasulkeet (`<a>[37]</a>`, vanha PLoS Medicine). Lääketieteen kierros: `--sarja laake`. Taulukon solun pystyviiva suojataan ja rivinvaihto on välilyönti (`muunna()`:n `taulukonSolu`, `ojsSolu()`): muuten rivi hajoaa. Springer Nature ja PLOS näyttävät mainospaikkoja mutta elävät
  artikkelimaksuista, joten niillä ei ole `RAHOITUS`ta (käyttäjä ei ole ottanut kantaa).
  Lisäosa on Chrome Web Storessa listaamattomana (opas 7.5; linkki kuvakkeineen Latomossa ja käyttöohjeessa): manifestin `description` enintään 132 merkkiä, ja kaupan
  zipistä poistetaan `browser_specific_settings`. Kun lisäosan `version` nousee ja muutos on yhdistetty, anna käyttäjälle heti
  pyytämättä molemmat zipit liitteenä (Firefoxin allekirjoitukseen ja Chrome Web Storeen, `manifest.json` juuressa), ei pakkausohjetta.
  Kun käyttäjä pyytää uutta versiota, tuo aina zipit; älä koskaan tarjoa muuta päivitysreittiä
  (paketoimattoman lataus, `git pull`), ellei käytäntöä vaihdeta (käyttäjän päätös). Firefoxiin Mozillan allekirjoittama XPI `luin/lisaa-lukimeen.xpi`
  (Latomon linkki; Mozillan kaupassa listaamaton): kun uusi versio allekirjoitetaan, korvaa tiedosto. Kaupan tietosuojaosoite on `luin/tietosuoja.html`: kun lisäosa alkaa
  lukea, säilyttää tai lähettää jotain uutta, päivitä sivu.
- `luin/kehitys/logo.js` tulostaa logon SVG:n, joka on kopioitu seitsemään sivuun (luin.html, Latomo, Latomon ohje,
  käyttöohje, tietosuoja, palaute, tuetut sivustot). Nimen tekstimuoto (aria-label, infolaatikko) on *LUiN.HTML*; tiedostonimet ja polut ovat `luin.html`.
  i:n piste on Lukimeen-salmiakki (`glis()`:n `ontto`): `kuvake.svg`:n mittasuhteet, kärki versaalien
  korkeudella, ja ulkoreunan koillissärmä jatkuu glissandoviivan yläreunaksi. Viiva on ruostetta N:n vinoviivaan asti ja kulkee N:n
  takaa (`vaijeri`; `'eteen'` toimii myös); N:n alta loppupisteeseen musteella. Loppupiste on
  täytetty koverakylkinen. HTML-rivin kirjaimet ovat keskellä yläpuolisia paksuja runkoja (`hlinja`; mitat `logo.js`:ssä).
- Luinin kuvake on Lukimeen-lisäosan salmiakki: `luin/kuvakkeet/` (välilehden SVG
  tumman teeman ruosteineen, 32 px Safarille, 180 px kotivalikkoon paperitaustalla), linkitetty samoihin
  sivuihin. Neliöt ovat salmiakkia. Linkin esikatselu (`og:image`, absoluuttinen osoite) on tumman teeman väreillä, koska
  viestimet ovat useimmiten tummia (käyttäjän päätös): kaikilla sivuilla, myös Latomossa, leveä LUiN.HTML-logo
  (`jako-logo-tumma-4.png`, 1200 × 630, niin kapea, että keskineliöksi rajattunakin näkyy kokonaan; salmiakkineliö on korttina
  liian korkea).
  Kun kuva muuttuu, vaihda tiedostonimi: viestimet pitävät vanhan osoitteen kuvan välimuistissa.
  Kaikki kuvakkeet, myös lisäosan, syntyvät `luin/kehitys/lisaosa-kuvakkeet.js`:stä; muuta ne yhdessä.
- `luin/palaute.html`: viesti kehittäjälle (nimi ja sähköposti vapaaehtoisia, vain viesti pakollinen) reitille
  `POST /api/palaute`. Worker toimittaa viestin kehittäjän postilaatikkoon tekstinä (salaisuus `PALAUTE_LAATIKKO`, ei repoon),
  joten se kantautuu Luinin pinoon Postihuilun tapaan. Linkit: Asetusten alin pieni *palaute* (`?mista=asetukset`; ei pinossa), käyttöohjeen loppu,
  infolaatikon loppusanojen *pyyntöä* (`?mista=tietoa`; loppusanat ja allekirjoitus käyttäjän) ja Latomon plussan takana *kerro* (`?mista=`). Testi `palaute-testi.js`.
- Latomon lisäosarivin pikku plussa avaa sivustotoiveiden kappaleen (käyttäjän sanamuoto),
  jossa on linkki tuettujen sivustojen listaan `luin/sivustot.html` (omana sivunaan uudessa välilehdessä, ei ponnahdusta,
  koska lista kasvaa). Kun leike.js saa uuden sovitteen, lisää sivusto sen listaan `#sivustot`,
  paitsi jos sivusto näyttää mainoksia eikä siellä ole lahjoitusnappia (alla *Rahoitushuomautus*). **Supersalmiakki** (Luinin logo eli
  `luin/kuvakkeet/kuvake.svg` ruosteella, omassa vasemmassa sarakkeessaan; nimet, selite ja kirjainotsikot alkavat samasta x:stä) vain Luinin sertifioimille eli käyttäjän itse siedettävästi läpikäymille: SEP, Wikipedia, marxists.org,
  Ensyklopedia Logos ja Snellmanin kootut teokset (koko korpus pesty, `snellman-pesukone.js`). Älä lisää sitä kysymättä.
  **Mutrudollari** (makaava S ja kaksi vaakaviivaa, samalla mutrusuu) samassa sarakkeessa: sivusto,
  jolle voi lahjoittaa mutta joka elää käytännössä mainoksista (`rahoitus: mainokset ja lahjoitukset`). Toistaiseksi vain selitteessä;
  älä merkitse sillä sivustoja kysymättä.
- Asetuskiekon SVG on luin.html:ssä kahdesti (`.ratas`-nappi pinossa, `#ratas-polku` lukijassa): pidä yhtenevinä.
- `android/luin/` (opas 7.6): Android-kääre *Luin.* (`fi.tusinasaa.luin`). WebView lataa
  `luin.html`:n verkosta; `luin.html` tietää sovelluksesta vain `window.LuinApp`in olemassaolon (`NAPIT_AINA`: sivunkäännön tavat saa
  sammuttaa kaikki, koska napit kääntävät aina), vaan silta `android/luin/src/main/assets/silta.js` kytkee
  sen (`window.LuinApp`). Silta nojaa tunnisteisiin `#lukija` (äänenvoimakkuusnapit ovat PageDown/PageUp vain sen näkyessä),
  `body`n taustaväriin, latomon `#md`:hen sekä siihen, että lataukset ovat `URL.createObjectURL`- ja `a.click()`-latauslinkkejä
  ja kopiointi `navigator.clipboard`ia: kun muutat niitä, aja `silta-testi.js`. **Kääreestä ei tehdä uutta versiota pyytämättä**
  (käyttäjän päätös): älä muuta `android/luin/`:ta (myös `silta.js` on APK:n sisällä), älä nosta `versionCode`a
  äläkä rakenna `luin/luin.apk`:ta, ellei käyttäjä pyydä. Korjaa sovelluksen ongelmat `luin.html`:ssä, jonka sovellus lataa verkosta. Allekirjoitusavain `android/luin/julkinen.jks` on repossa tarkoituksella kuten
  soittimessa; älä vaihda sitä, tai päivitys vaatii poiston ja pino katoaa.
- `docs/viitteet/`: viitetyylin varanto (Teologian tyyli 2021, APA 7 -turvaverkko, sinetöity lisälehti, joka avataan
  vain todelliseen tarpeeseen). Etusija ja ratkaistut kysymykset ovat sen `README.md`:ssä. Kun muutat viitteen
  kokoamista (`kokoaViite`) tai lähdeviittausten linkitystä, tarkista varanto ja aja `node docs/viitteet/vertaa-luin.js`.
- Hegel-repon `pdf_to_markdown.py` kirjoittaa etukentän, jonka Latomo lukee (opas 7.1): lähde eriteltynä (`journal`,
  `volume`, `issue`, `pages`), ei `source`-avainta, koska Latomo lukisi sen verkko-osoitteeksi. Pidä avaimet yhteensopivina.

### Käyttäjän linjaukset

- **Nimet pienellä keskellä virkettä** (opas 1.3): käyttäjälle näkyvässä suomenkielisessä tekstissä
  *luin*, *latomo*, *postihuilu*, *pino*, *laatikkolause*, *lukimeen-lisäosa*, *luin-linkki*. Iso alkukirjain vain virkkeen,
  otsikon, sivun nimen ja nappinimen alussa (*Luin.*, *Pinoon*, *Latomon ohje*), napin tai kentän nimen lainauksessa
  (`span.ui`: *Postihuilu*, *Arvo*, *Merkinnät*) ja englanninkielisessä tekstissä. Ei koske koodin kommentteja eikä kehittäjän opasta.
- **Luin ei taivu käyttäjälle näkyvässä tekstissä** (opas 1.3): taivutettuna *lukin* (*lukimen pino*,
  *lukimessa*, *lukimeen*, *lukinta*), ei *luinin*, *luinissa*, *luiniin*. *Luinin* vain vahvasti koko organisaation laajuisesta
  entiteetistä (*Luinin sertifioima*, Latomon *Luinin ystäviä ovat…*), ja silloin aina isolla, erisnimenä.
- **Pino ja kellarin kampihyllystö**: käyttöliittymässä lukulista on *Pino* ja luettujen
  näkymä *Kellarin kampihyllystö* (kaikilla Luinin sivuilla ja lisäosassa; k:lla). Nimi on aina kokonainen, ei pelkkä
  *kampihyllystö* (pituus on käyttäjän valinta: sana toistuu harvoin). Pino taipuu sisäpaikallissijoissa (*pinoon*, *pinossa*, *pinosta*,
  ei *pinolle*), samoin kellarin kampihyllystö (*kellarin kampihyllystöön*, *-ssä*, *-stä*). Koodin tunnisteet (`luin-lista`, `#lista`,
  `tila.arkisto`, reitti `#arkisto`) ovat vanhoja nimiä; älä nimeä niitä uudelleen. Uuteen käyttäjälle näkyvään tekstiin ei *lukulistaa*, *uumenta*, *hyllyä*,
  *pölyhyllyä* eikä *arkistohyllyä* (*kellarin kampihyllystö* on käyttäjän nimeämä poikkeus).
- **Kellarin kampihyllystö ja valinta**: luetuksi merkitty teksti jää `luin-lista`an lipulla
  `e.luettu` (aika), ja `#arkisto` vain suodattaa, joten mitään ei kopioida. Pinossa ei ole Postihuilua, ohjeita eikä
  Latomoa (käyttäjän rajaus; poikkeus nimikkeen valikon *Muuta metatietoja* ja *Uusi laitos*, alla); linkki kellarin kampihyllystöön on himmeänä ja vain, kun siellä on jotain.
- **Pinon alla** (`.pino-ala`): 1. kellarilinkki vasemmalla (kampi palstan laidasta), 2. *Soita postihuilua*
  vasemmalla samassa koossa ja tyylissä, vain kun laatikkolause on annettu (pelkkä teksti, hakee laatikon heti), 3. linkit. **Postihuilu
  on poissa pinosta** (käyttäjän päätös: esitäyttämätön laatikko on epätyydyttävä ja paikka laatikkolauseelle liian näkyvä); lause annetaan
  asetuksissa tai `#l=`:llä. Kellarilinkki, ö-mapin linkki ja paluulinkki ovat .64rem; mitat em:inä, joten ne pienenevät yhdessä. Sanat
  *Luin.* ja *Poimi kellarin kampihyllystöstä.* ovat käyttäjän. Valinnan merkki on asetusten kytkimen salmiakki (ei ruutua: "ei Windows 95").
- **Ö-mappien mappi ö** (käyttäjän nimi; `#omappi`; opas 2.4): taipuu
  *ö-mappien mappiin ö*, *-mapissa ö*, *-mapista ö* (ö aina viimeisenä). Kellarin kampihyllystön nimikkeen ja valittujen
  valikossa pinoon noston rinnalla *Siirrä ö-mappien mappiin ö.*, sieltä *Palauta kellarin kampihyllystöön.* `e.omappi` (aika)
  lisätään, `e.luettu` jää; ö-mapin teksti ei näy pinossa eikä kellarissa. Linkki (`#om-linkki`) on kellarin alalaidassa vain,
  kun siellä on jotain: ääripäiden ö:t ovat mappisulkimen renkaita, alleviivaus renkaan alakärjestä toiseen, ei nuolta.
  Linkkien tekstit ovat aina illatiivissa: *kellarin kampihyllystöön*, *ö-mappien mappiin ö*.
  Rengas: x-akselilla litistetty soikio (.81), viivan sisäreunan laki versaalien
  korkeudella, alakärki 3,8 px perusviivan alla ja alleviivauksen (svg, .85 px) alareuna tasan siinä; täytetty muoto, viiva
  kyljissä paksumpi ja alhaalla alleviivauksen paksuinen; yhdysviiva piirretty versaalien ja renkaan keskikohtien puoliväliin; laella leveä viisto irvistysrako (ulkoreunat lähempänä kuin sisäreunat); ö:n pisteet samanlaisia pieniä
  rakorenkaita. Polut ja mitat tuottaa `luin/kehitys/orengas.js`; muuta parametreja siellä, älä polkuja käsin. Ö-mapin
  otsikossa molemmat ö:t ovat samoja renkaita ilman alleviivausta (`OTS_OMAPPI`, pienennettynä kuten otsikon kampi:
  keskikohta kammen navan korkeudella, laki versaalikorkeudella, viimeinen .8 em:n päässä; nimi `aria-label`issa). Ö-mapissa
  ei ole *Takaisin pinoon* -tekstiä eikä pinomerkkiä (logo riittää); vasemmassa alakulmassa kellarilinkki peilattuna (`#ark-paluu`:
  nuoli vasemmalle, kampi `scaleX(-1)` tekstin oikealla). Testi `omappi-testi.js`.
- **Kellarin kampi**: kellarilinkin ulkokaari kääntyy alhaalta suoraksi nuolen varreksi;
  kellarin otsikon perässä (`KAMPI`) sama kampi otsikon harmaalla ilman vartta, ja kaari jatkuu alhaalta kehää 70° oikealle
  ylös. Pinon otsikon perässä samalla idealla pinomerkki (`PINOM`). Molemmat hyvin pieninä (kampi 1,05 em, pinomerkki 1,15 em
  leveä), rako 1 em viimeisestä kirjaimesta, keskikohta samalla korkeudella perusviivasta kuin kellarilinkin kammen napa (testi mittaa).
  Navan renkaan pää on leikattu kammen suuntaisesti molemmissa kammissa (vaakasuora pää näyttää typerältä):
  rengas jatkuu 75°:een ja `clipPath` (`KAMPI_LEIKKAUS`, evenodd-lovi) leikkaa sen idän pisteen kautta.
  Nimikkeen valikkonappi on `button.jako` (latomo-testi ja ulkoklikkauksen poikkeus nojaavat siihen). Zip-vienti
  (`vieZip()`) jäsentää avaamattoman tekstin erilliseen dokumenttiin (`virtuaaliNyt()`) ja käyttää `merkinnatMd()`:tä: pidä
  tulos samana kuin tekstin oma vienti.
- **Pinomerkki** (käyttäjän päätös): paluu pinoon on kolmen kirjan pino
  kaikilla Luinin sivuilla, ei pirtti eikä kotimerkki. Sama polku kahdeksassa paikassa; muuta ne yhdessä. Koko 40 px
  (musteen alareuna logon kärjen tasolla, vasen laita `--v-laita`), viiva `stroke-width: .9` eli 1,05 px. Koodin tunnisteet (`.koti`,
  `a.kotimerkki`, `#ark-koti`) ovat vanhoja nimiä. Käyttöohjeen tekstinsisäinen `.ik.koti` on tekstin kokoinen.
- **Pinomerkin paikka**: yläoikealla (kellarin kampihyllystö ja alasivut: Latomo, ohjeet, palaute,
  tietosuoja) vaakapaikka on sama kaikkialla eli pinon asetuskiekon vasemmalla puolella, ja musteen alareuna on logon
  loppupisteen alakärjen tasolla (ei kiekon keskilinjalla). Logot ovat eri kokoisia,
  joten pystypaikka eroaa kellarin kampihyllystön ja alasivujen välillä. Navin yläpalkissa merkki on vasemmalla palkin keskilinjalla.
- **Logo on aina linkki pinoon**: luin.html:ssä `a.logo-linkki`, alasivuilla `a.koti`. Kellarin kampihyllystössä pinomerkin vasemmalla
  on versaalilinkki *Takaisin pinoon* (`#ark-takaisin`, sama osoite kuin merkillä) ja kampihyllystölinkki pinon alla on versaalia. Ö-mappien mapissa ö ei paluutekstiä eikä merkkiä (yllä).
- **Ei kaveriversiota** eikä sen mainostusta. Käyttöönotto (oma worker, repo, Dropbox) on myöhempi kysymys (opas 9).
- **Jakaminen on erittäin sivuosassa**: vain pinon nimikkeen pieni valikkonappi (lähdeviite, linkki, *Lataa md*,
  tiedot ja laitos, *Luin.*, poisto; kolme salmiakkia). *Luin.* on molemmissa salmiakkivalikoissa
  toiseksi alimpana, vain poisto sen alla.
- **Linkitä tiedostoon** (`kysyTiedosto()`): linkittömällä tekstillä *Kopioi linkin* paikalla.
  Hyväksyy julkisen .md-osoitteen (Dropbox muunnetaan kuten Latomossa), jos leipäteksti on sama kuin pinossa
  (`leipaMuuttui()`, sama sääntö kuin tietojen säädössä), ja kirjoittaa sen etukentän `osoite:`-riviksi, jotta
  *Muuta metatietoja* säilyttää sen. Testi `linkki-testi.js`.
- **Laatikon ohi napautus vain sulkee sen** (käyttäjän päätös, koko Luin, `nielaise()`): auki olevan ponnahduksen
  tai infolaatikon vihjeen ulkopuolinen napautus ei laukaise linkkiä, nappia eikä sivunkääntöä. Uusi ohimenevä laatikko
  käyttää samaa document-tason kaappauskuuntelijaa. Vain `isTrusted`-napautus nielaistaan (ohjelman `a.click()` lataa
  tiedostot ponnahduksen ollessa auki). Testi `ulkoklikkaus-testi.js`.
- **Tiedot ja uusi laitos** (käyttäjän nimi, opas 7.1, `tuoPinosta()`): *Muuta metatietoja* lukitsee
  leipätekstin (merkinnät eivät saa voida irrota muualta kuin otsikkolohkosta); *Uusi laitos* antaa muokata ja kysyy
  tallennettaessa: toinen laitos merkintöineen, ilman merkintöjä vai korvaava. Merkinnät siirretään lohkot rinnastamalla
  (`kohdista()`), ei pelkällä katkelmahaulla (se osuu naapurikappaleeseen). **Pino pysyy pinona**: laitos näkyy vain tietorivin
  *2. laitos* -sanoina, ei kansioita, ryhmiä eikä erikoisvärejä (käyttäjän päätös). Testi `laitos-testi.js`. Lukutietoja ei lisätä viitteeseen pakolla (kytkin `aset.viiteLisa`, oletus pois).
- **Luokittelu ja kellarin järjestys** (opas 2.5):
  pino pysyy tulojärjestyksessä eikä näytä luokittelua; järjestykset ja välikortit (`li.valiots`) vain kellarin kampihyllystössä.
  Nimikkeen kentät (`asiasanat`, `ajoitus`, `kasikirja`) ovat totuus ja etukentän `asiasanat:`/`ajoitus:` niiden peili: avaimeton
  tuonti ei pyyhi niitä (`lkMdsta(…, false)`), vain *Muuta metatietoja* ja korvaava laitos (`tosi`, etukenttä kirjoitetaan ennen
  Latomoon siirtoa). Käsikirjasto ei mene etukenttään. Ehdotukset eivät lisää mitään ilman napautusta, eikä luokittelemattomista
  muistuteta (käyttäjän päätös: ei pelillistä). **Käsikirja ei voi tulla pinoon** (käyttäjän päätös): se on aina kellarin
  kampihyllystössä ylimpänä omana *Käsikirjasto*-välikorttinaan kaikissa järjestyksissä, ei Poimi- eikä ö-mappitoimintoa, tuonti ja
  Postihuilu eivät nosta sitä; sijainti aina `kellarissa()`/`pinossa()`/`omapissa()`-funktioilla, ei suoraan `e.luettu`sta. Sanat *asiasana*, *ajoitus*, *käsikirjasto*, *luokittele*, *järjestys* (ei *tagi*,
  *kategoria*, *hylly*). Testit `luokittelu-testi.js` ja `linkki-testi.js` (valikon järjestys). **Sanaston huolto**
  (järjestysrivin *sanasto*): nimeäminen koskee koko kokoelmaa, ja toiseksi sanaksi nimetty yhdistyy siihen; ei poistoa.
  **Välikortti on suodatin** (`button.vo`, `tila.kortti`): napautus näyttää vain sen ryhmän, toinen napautus tai järjestysrivin
  *kaikki kortit* palauttaa kaikki. Valinta ja valittujen valikko käyttävät `nakyvat()`a, ei `naytettavat()`a. Kortti pysyy
  harmaana (kortiston jakaja ilman värejä); ruoste on vain *kaikki kortit* -napissa.
- **Rahoitushuomautus** (käyttäjän päätös, opas 3.2 ja 7.5): sovitteiden sivustoja ei poisteta (Luin on myös
  itsenäisen käytön väline), mutta leike.js:n `RAHOITUS` kirjoittaa etukenttään `rahoitus:` ja md.js tekee tekstin alkuun
  hakasulkeisen yläotsakkeen. 1) Mainokset ilman lahjoitusnappia: sivusto piiloon tuettujen listasta, huomautus mainos-
  rahoituksesta. 2) Mainokset ja lahjoitus: ensin *Huom. huom.!*, sitten kehotus harkita lahjoitusta. 3) Lahjoitukset ilman
  mainoksia: vähemmän moralisoiva toteamus. Vain sovitesivustoille, ei yleiselle leikkeelle eikä Bloggerille. Uudelle
  sovitteelle tarkista sivuston mainokset ja lahjoitusmahdollisuus.
- **Lähde tekstin lopussa** (käyttäjän päätös: lähteen kunnioitus, ei vain etukentässä; opas 3.2, md.js `lahdeOsio()`):
  verkko-osoitteellisen `lähde:`n tekstin loppuun ennen Tekijänoikeuksia *Lähde*-osio sanoin (sivusto, `ylläpitäjä`, `polku`,
  haettu) ja osoitteena, myös `alkuteksti`. Ei pois kytkettävä. Lisää uudelle sovitteelle `yllapitaja` ja `polku`, kun sivu kertoo
  ne (Snellman). Snellmanin alkuteksti on vain huono OCR-pdf, joten siitä ei tehdä kielivalintaa eikä lomitusta.
- **Lisätieto** (käyttäjän hierarkia, opas 7.3): nimen jälkeinen rivi pinossa ja jakolinkin esikatselussa on
  `LuinMD.lisatieto()`: verkkojulkaisun sivusto (ei tekijä) › alaotsikko › kirjan osan teos › tekijä. Gutenbergin kaltainen
  kantajasivusto ei ole julkaisu. Pidä pino ja jakolinkki samassa funktiossa. Julkaisupäivä pinossa on avoin kysymys.
- **Jakolinkki** (opas 7.3): *Kopioi linkki* antaa oman workerin `luin` (`worker/luin/`, ei
  `tusinasaa-worker`: käyttäjän päätös) sivun `?t=&u=`, jotta esikatselussa näkyy tekstin nimi. Sivulla ei saa olla `og:url`ia, meta refreshiä eikä 302:ta: hakijat seuraisivat niitä
  `luin.html`:ään ja näyttäisivät taas *Luin.*. Julkaisu: `npx -y wrangler@3.114.17 deploy --config worker/luin/wrangler.toml`.
- **Ei sanaa *lukulaite*** käyttäjälle näkyvään tekstiin (käyttäjän päätös: Luin ei ole laite eikä e-lukijan
  kilpailija). Virallinen kuvaus on *internetin lukemisen tyyssija* (infolaatikko, käyttöohje, `og:description`, jakoworker).
  i-nappien kehys on hakasulkeet, ei salmiakki (pinon tietoa, Postihuilu, laatikkolause Luinissa ja Latomossa; salmiakit
  ovat täällä valintoja, luettelomerkkejä ja kunniamerkkejä). Lisäosan ponnahduksessa on samoin hakasulkeet, ja sen valintaruudut ovat asetusten kytkimen salmiakkeja.
- **Sysi, TCF-valkaisu ja sähköpapyrosointi** (`aset.kontrasti`, `SAHKOPAPERI`): vaaleassa
  kontrastikytkin (*TCF-valkaisu*) muuttaa **vain taustan** #fff:ksi ja musteen täysmustaksi, ei muita sävyjä (hidas
  sähköpaperitila toistaa harmaat, sotkuinen on vain tausta). Tummassa vastaava kytkin on *Sysi* (`aset.sysi`):
  tausta #000, tekstivärit himmeämpiä ja lämpimämpiä, viivat himmeämpiä kuin tummassa. Ei yötila eikä
  meripihkaa. Muste-kontrasti 10,5 on käyttäjän valitsema keskitie. Sivuvärit ovat musteesta kauempana kuin tummassa
  (muuten lomitetun käännöksen kielet eivät erotu); älä kavenna eroja. Ei oranssiin eikä punaiseen. Arvot CSS:n kommentissa. TCF-vihje (käyttäjän sanat): **vain hiirellä**
  viipymästä (1 s), ja hiiren lähtö kytkimeltä sulkee heti; kosketusnäytöllä ei vihjettä lainkaan (liikaa häiriötä). *Sähköpapyrosoi asetukset*
  on **kertanappi, ei kytkin** eikä muista mitään: kun asetukset ovat taulun mukaiset, samassa paikassa on *Oletusasetukset*
  (`laitteenOletus()`, vain taulun avaimet). Ohut suorakaidenappi, otsikkoa pienempi ja `--huomio`n värinen; painallus tanssittaa **vain napin
  alaa kehineen**: pelkkä musta (`mustin`, ei Sysi) ja TCF vuorotellen, ei tavallisten teemojen välisävyjä, 0,7 s vaihe;
  neljännessä jää lopputilan oikea väri (papyrosointi: musta, TCF, musta, TCF lähtöteemasta riippumatta), asetukset
  vaihtuvat siinä ja kuittaus jää `PAPYRUS_MS` (2,2 s). Tanssin mustassa teksti ja kehä ovat poikkeuksellisesti #fff. Tämä on käyttäjän tilaama tarkoituksellinen poikkeus
  animaatiokiellosta (sähköpaperin virkistysvitsi); ei koko näytön valoshowta. Taulun sisältö on käyttäjän
  (vaalea, TCF, sivunkääntö, reuna ja nuolinapit, ei pyyhkäisyä, laitteen painikkeet). Testi `sahkopaperi-testi.js`.
- **Sysin** (`aset.sysin`, Sysin oikealla): yölukutila,
  jota käyttäjä pitää hämäryyden ylärajana (muste 5,0: **ei himmeämmäksi kysymättä**). Sivuvärien Y-suhde musteeseen kuten Sysissä
  (erottuvuus), ruoste poikkeuksena .42, ettei näytä harmaalta. Arvot CSS:n kommentissa. CLARVS sulkee
  Sysin (ja Sysinin) pois. **Sysin on Sysin alakytkin**: vielä pienempi, näkyvissä vain Sysin ollessa valittuna
  (paikka varataan `visibility`llä, ei hyppelyä). **Sysinin ollessa päällä Sysin napautus antaa tavallisen Sysin**
  (Sysin pois), ei sammuta kumpaakin (käyttäjän päätös). Papyrosointinappi on Sysinissäkin tavallinen.
- **Teeman alakytkimet** (`aset.kontrasti` = TCF, `aset.sysi` = Sysi, `aset.sysin`): **Vaalean tai Tumman napautus antaa
  aina perusteeman** ja sammuttaa kaikki kolme (käyttäjän päätös), paitsi CLARVSin alla, jossa muisti säilyy. **Toisen teeman alakytkimet eivät
  näy lainkaan** (`.piilossa`, paikka varattuna): vaaleassa ei Sysiä eikä Sysiniä, tummassa ei TCF:ää. CLARVS on molempien yhteinen
  ja pitää kutinsa teemaa vaihdettaessa; se **peittää** TCF:n ja Sysin muistia pyyhkimättä, joten sen sammutus palauttaa edellisen
  (esim. Sysinin). **CLARVSin ollessa päällä mikään alakytkin ei näy** (paikka varattuna).
- **CLĀRVS · ET · DISTĪNCTVS** (käyttäjän nimi, makronit tarkoituksella anakronistisesti; Literatassa
  ei ole valmiita Ā- ja Ī-merkkejä, joten ne ovat yhdistyvällä makronilla U+0304, `aset.clarus`; kursiivissa harvennus irrottaa makronin kirjaimestaan, joten Ā ja Ī ovat `span.mk`-laatikoissa, joiden harvennus on marginaalina `--ls`): korkea kontrasti samana valintana
  kummassakin teemassa (valkoinen/musta). Välisävyjä enintään kaksi: yksi harmaa ja ruoste (okra = muste, valo = paperi,
  valitsemattomilla ei himmennystä); älä lisää kolmatta. Sulkee Sysin/TCF:n pois. **Teeman ruudukko, kiinteät paikat, ei hyppelyä**
  (`.teema-ruudukko`): Vaalea ja alla TCF, Tumma ja alla Sysi (Tumma TCF:n oikealla), alimmalla rivillä harvennettu CLARVS,
  vaaleassa vasemmassa laidassa ja tummassa Tumman kohdalla (ahtaalla harvennus tiivistyy, `sijoitaClarus()`).
  Harvennus on kummassakin teemassa sama: vaaleassa viimeisen kirjaimen oikea reuna on tasan Tumma-sanan oikeassa reunassa.
  Alakytkimet Sivunkäännön lisäkytkimiä pienempinä (asiantuntijan valintoja). Himmeys:
  valitsematon CLARVS (.6) > oman teeman valitsematon alakytkin (`.ala`, .42). Nimi Descartesin nimiösivun tapaan (V eikä U), interpunkti väleineen
  (ilman välejä ahdas). Hiirellä viipymästä vihje *kirkkaasti erottuva*
  (käyttäjän sanat, `#cd-vihje`), muuten kuten TCF-vihje (`VIHJEET`).
- **Viitenumerot näkyvät aina**; niitä ei saa asetuksista pois.
- **Sivunkäännön tavat** (opas 4): *Reunanapautus*, *Pyyhkäisy*, *Nuolinapit* (`sivunapit`) ja pahnan pohjimmaisena
  *Laitteen painikkeet* (`sivuLaite`; näppäimistö, sivunkääntönäppäimet, äänenvoimakkuus; pois ollessaan
  näppäimet eivät käännä, äänenvoimakkuutta ei estetä). Pakollinen viimeinen tapa vain kolmesta ensimmäisestä (`PAKKOTAVAT`), koska
  selaimessa ei tiedetä, onko laitteessa painikkeita; Android-sovelluksessa myös laitteen painikkeet kelpaavat. Lista on tiiviimpi
  (25 px, .76rem) kuin muut nipukat, jottei neljä riviä veny.
- **Kohdat osanvaihdoista** (opas 3.2, md.js `RE_VALI`): otsikottoman jakson `–––`/`* * *`/`---`/⁂
  tekevät kohdat (i), (ii) … (`res.kohdat`, `vali`), eivät otsikoita. Kohta on vaihdon jälkeinen lohko, ei merkki. Sisälmyksessä
  ne ovat alkusanoineen (`sisalmysKohdat()`, `alkusanat()`; testi `sisalmys-vali-testi.js`): tekstin oma
  sisällysluettelo ja `toc` eivät muutu.
- **Kohdat yläindekseistä** (opas 3.2): etukentän `kohdat: yläindeksit` (Perseus-sovite) tekee
  yläindeksinumeroista aikajanan kohtia ja vedon pysäkkejä (`res.kohdat`, `nyt.kohdat`), **ei otsikoita eikä `toc`-rivejä**:
  `toc`in varassa ovat Sisälmys, merkintöjen osiot ja paikannin. Perseuksessa book on luku ja section kohta; kirjaimellisen
  kohdan numero-osa on osio (Valtio: Stephanus-sivu 327, kohta 327a). Ciceron luvut (caput) eivät
  ole tasoa: viitenumeron tasot luetaan teoksen `refsDecl`istä.
  Kohtanumero on `sup.kohta` ja harmaa (`--harmaa`; käyttäjän päätös; okra on merkintöjen, ruoste napautettavan).
- **Kielet** (`aset.lomitus`, opas 3.2): lomitetussa käännöksessä molemmat, alkuteksti tai käännös
  pelkällä CSS-luokalla; piilotettu kieli pysyy DOMissa (kohdat, merkinnät ja aikajana eivät muutu). Älä poista piilotettua tekstiä
  DOMista äläkä jäsennä tekstiä tilan mukaan uudelleen. `asettele()`:n `art.className` pyyhkii luokan, siksi `lomitusLuokat()`.
  *Molemmat* on rinnakkain (`div.pari`, opas 3.2) aina, kun kaksi vähintään `RINN_MIN` em:n palstaa mahtuvat, myös sivutettuna ja
  kosketusnäytöllä (mahdollisimman usein, palstat saavat kaventua). Alkuteksti kelluu, pari on `flow-root`,
  ei reunushuomioita; sivutettuna `parienAlut()` pitää parin puolet samalla sivulla.
- **Värit eivät ole soittimen**: ruskea, okra, ruoste, paperi ja muste, kuusi väriä teemaa kohti. Sähköpaperi: ei varjoja,
  ei läpikuultavuutta, ei animaatioita. **Ruoste = napautettava.** Tarkoituksellinen poikkeus: lähdeviittauslinkki
  `a.lahde` on `--harmaa` ja sillä on `--viiva`-alleviivaus.
- **Latomon `--harmaa` poikkeaa tarkoituksella** muista Luinin sivuista (Latomon tekstistä suuri osa on pientä harmaata,
  joka näyttäisi ruskealta ruskealla). luin.html, käyttöohje ja Latomon ohje pitävät omat arvonsa; älä yhtenäistä kysymättä.
- **"Vinoneliöestetiikkaa, ei palluraestetiikkaa."** Koverakylkiset salmiakit, antiikva (Literata, `luin/fontit/`, OFL),
  klassinen tyyli. Kirjasinvalintaa ei ole: groteski palaa vain, jos koko ohjelman ulkoasu sovitetaan siihen.
  Tarkoituksellinen poikkeus: sanaselityksen merkin (`IK_SANASTO`) linssi on pyöreä.
  Ohjelman kuoressa ei ole kreikkaa (käyttäjän päätös; marginaali on *mikro, meso, makro*), paitsi sanaselityksessä
  (käyttäjän päätös: lingua francat vuodelta 0 ja 2026): merkkien lambda ja linssi-epsilon sekä otsikot ΛΟΓΟΣ ja ΕΤΥΜΟΝ.
  Kreikka tulee erillisistä osajoukoista `literata-kreikka*.woff2` (U+0370–03FF) ja
  `literata-kreikka-laaja*.woff2` (polytoninen U+1F00–1FFF), koska päätiedostoissa ei ole kreikkaa.
- **Suljettu lukuympäristö ilman häiriötekijöitä**: verkkolinkit ovat oletuksena pois (`aset.verkkolinkit`), myös
  kirjallisuusluettelon DOI-linkit. Kuvat näkyvät linkkeinä, koska lukija ei hae mitään kolmannelta osapuolelta.
- **Sanat ovat käyttäjän**: *kirjaus* (alleviivaukseen liitetty muistiinpano; käyttöliittymässä aina tämä sana),
  *Sisälmys* eikä *Sisällys* tai *sisällysluettelo* (ensisijainen nimi navissa, tekstin alun otsikossa ja ohjeiden otsikoissa; asetuksissa *Sisällysluettelo*, koska *Sisälmys* ei toimi yksin ilman kontekstia; ohjeiden juoksevassa tekstissä *sisällysluettelo* käy vaihteluna, ja vieraan sivuston sisällysluettelo on sisällysluettelo). Peruutusnappi on *älä!* (pienellä, huutomerkillä, kursiivi,
  `--harmaa`), ei *Ei*. Latomon tyhjennyksen vahvistus on pelkkä *Oletko aivan varma?* ilman lainausmerkkejä ja sanojan
  nimeä (ei sitaattivitsejä; älä palauta). Latomon pääpainike on *Avaa lukimessa*.
- **iA Writer -pohjasta (`luin/ia-writer/`) on luovuttu**, koska se ei toimi käyttäjän iA Writerissä: älä tarjoa
  sitä ratkaisuksi äläkä kehitä sitä. Tavoite on vain, että sama md näyttää iA Writerin oletusesikatselussa
  järkevältä. Latomon ohje ei mainosta iA Writeria eikä neuvo sen käyttöä; se mainitaan vain, kun se vastaa
  kysymykseen *miksi juuri näin*.
- **Ensikäytön oletukset** (käyttäjän päätös): aikajanalla kosketusnäytöllä luvut ja osiot, hiirellä kaikki tasot (`aset.janaTasot`, tasot erillisiä kytkimiä); kosketusnäytöllä ja sähköpaperilla sivunkääntö ja kaikki sen tavat (myös painikkeet) päällä, hiirellä vieritys (`sivutusOletus()`). Sähköpaperin tunnistusta ei ole todennettu oikealla laitteella.
- **Mikro-marginaali on myös pidempi rivi** (`MITTA`, `mitta()`, CSS `--mitta`): 40 em, Meso ja Makro 33 em. Siksi Marginaali-rivi näkyy aina. Vierityksen reunushuomiot ratkaistaan 33 em:llä, ja Mikro pitenee niiden kanssa vain jäljelle jäävään tilaan. Uusi mittaa käyttävä laskelma käyttää `mitta()`a tai `asettele()`n `mi`:tä, ei kiinteää 33:a.
- **Kirjasinkoon oletus kosketusnäytöllä riippuu ruudusta** (`oletusKoko()`): kunnes käyttäjä säätää kokoa (`aset.kokoKasin`), `aset.koko` lasketaan joka latauksella. Uusi koon muuttaja asettaa `kokoKasin = 1`. Käyttöliittymän (palkit, napit) koko on laitteen tiheyden asia, ei tämän.
- Uusi oletus koskee vain ensikäyttöä. Tallennettuja asetuksia muutetaan vain kerran, `aset.av`-numeron avulla. Tallennetut asetukset ohittavat OLETUKSEN, joten päätetty oletus ei näy vanhalla käyttäjällä ilman `av`-siirtoa. Muuttaessasi oletusta nosta `av` ja siirrä.

### Markdown-konventiot (opas 3)

- **Käyttäjän omat konventiot menevät yleisen Markdownin edelle**: otsikkolohko (`#`, kursiivi alaotsikko, tietorivit
  `<br>`:llä), `luku-2-1`-tunnisteet, numeroimaton `###` versaalikursiivina (`.caps`), alaviitteet sivuhuomioiksi,
  kirjallisuusluettelo `p.bib`:ksi. Lainausmerkkejä ei muuteta. Muuten noudatetaan iA Writerin protokollaa;
  Pandocin `^[…]` toimii yhä.
- Lähdeviittaus- ja lyhennelinkit (opas 3.4) syntyvät md.js:n omasta päättelystä (`viittaukset()`) **vain varmalla
  yhteydellä**. Ei BibTeX:ää, Pandocia tms. (käyttäjän päätös). Lyhenteille ei tehdä merkintöjä tiedostoon. Linkit
  ovat vain alaviitteissä, eikä selitysosiosta linkitetä edelleen (minimalismi). Poikkeus leipätekstissä:
  sulkujen tekijä–vuosi ja kertova *Kahn (1979)* linkittyvät, kun luettelossa on niille tasan yksi kohta (SEP; käyttäjän
  päätös: sulut eivät ole alaviitteitä, linkkejä saa olla kuin tavallisessa lukulaitteessa,
  tappion riski hyvin pieni; `linkitaHaka()`, opas 3.4). Kun muutat viittauksia tai luettelon tunnistusta, aja
  `sep-pesukone.js`: väärä kohde ja rikki pitää olla 0.
- Regexien `\b` ei toimi ä:n perässä; käytä `(?![\p{L}\p{N}])`.
- **`md.js?v=<SHA-1:n alku>`**: luin.html ja Latomo lataavat md.js:n versiotunnisteella, koska Pages antaa `max-age=600`
  ja selain pitää vanhan version. Kun muutat md.js:ää (myös kommenttia), päivitä tunniste (`md-testi.js` huomauttaa unohduksesta):
  `V=$(sha1sum luin/md.js | cut -c1-8); sed -i -E "s/md\.js\?v=[0-9a-f]+/md.js?v=$V/" luin.html luin/latomo.html`

### Lukija (opas 4)

- **Mobiili = kosketusnäyttö** `(pointer: coarse), (hover: none)`; hiiri on työpöytä myös kapeassa ikkunassa (leveysehdolla palkit
  piiloutuisivat työpöydällä). `hover: none` on välttämätön: Booxin Firefox ei täytä `pointer: coarse`a. Pidä ehto samana
  kaikissa kolmessa kohdassa (CSS `--v-laita`, `sivutusOletus()`, `MOBIILI`).
- **Napin avaavat alueet mobiilissa** (`ylaKaista()` ja `tyhjaKohta()`): turvakaistan alla yläpalkin
  korkuinen alue (`--yla`) on kokonaan napautusherkkä, kun palkit ovat kiinni, ja menee tekstin, linkkien ja reunanapautuksen
  edelle (ainoa, joka syrjäyttää reunanapautuksen). Lisäksi ilmeisen tyhjän kohdan napautus avaa navin (ei tekstiä, sivuhuomiota,
  kuvaa tai taulukkoa 1,5 em:n, väh. 28 px:n sisällä; rivien omat laatikot, joten lyhyen rivin oikea puoli on tyhjää); reunanapautus
  (jos päällä) on laitojen ensisijainen toiminto. Alue ei ole herkkä palkkien, paneelin, ponnahduksen, valinnan, maalauksen eikä
  palkkioppaan ollessa auki. Vain kosketus: hiirellä tyhjä kohta ei avaa ("hiirellä kauhea tapa").
- **Tekstin napautus ei avaa palkkeja** (ne avautuisivat vahingossa). Vain alakaistan tai alapalkin napautus avaa ja
  sulkee ne; vieritys ja sivunkääntö eivät vaikuta, eikä keskiklikkaus työpöydällä avaa ("hiirellä kauhea tapa").
  Alapalkissa ei ole natsaa eikä osion nimeä.
- Navinäkymän merkit ovat kahdessa linjassa musteesta mitattuina (`--v-laita` / `--o-laita`, opas 4.4). Laidat ovat
  kokonaislukuja, koska Chromium pyöristää SVG:n ja reunuksen paikan kokonaiseen CSS-pikseliin.
- **Verho** (`verhoAuki()`: navi, Asetukset tai navin laatikko auki): sen takana eivät toimi tekstin napautus,
  reunanapautus, pyyhkäisy, valinta eikä alleviivaus, eikä rulla käännä sivua. Toimivat: sivunkääntö näppäimillä sekä
  alapalkin kirjanmerkki- ja sivunapit (ahtaassa navinäkymässä ne ovat piilossa, ks. alla). Tekstialueen napautus sulkee Asetukset, Etsin ja Sisälmyksen tai navin;
  Merkinnät sulkeutuu vain napistaan tai raksistaan.
  Asetusten avaus sulkee navin.
- **Navin laatikot** (opas 4.7.2, `sijoitaLaatikot()`): **Etsi, Sisälmys ja Merkinnät** (käyttäjän päätös)
  avautuvat nappiensa järjestyksessä vasemmalle, keskelle ja oikealle, koko
  korkeudelle palkkien väliin ilman hajurakoa palkkeihin. Etsi on vasemmalla, koska siellä se ei koskaan peitä
  reunushuomioita (osumat näkyvät niissä livenä). Rinnakkain marginaaleissa (alla) tai, jos ne eivät mahdu, ruudun
  kolmanneksina, kun kolme 19rem:n saraketta rakoineen mahtuu laitojen väliin; muuten yksi kerrallaan koko leveydellä.
  Hyppy laatikosta ja navin sulku sulkevat kaikki kolme, paitsi että hakuosuma jättää rinnakkain Etsin auki, kun se on
  palstan vieressä eikä peitä osumaa (`suljeHypynTielta()`). Reunus on `--viiva` (muste ja `--harmaa` liian kirkkaita).
- **Marginaalit** (opas 4.7.2): Etsi vasemmassa ja Merkinnät oikeassa marginaalissa, ja
  **Sisälmys on palstan levyinen, ei koskaan leveämpi**. Laatikon ja palstan välissä on aina hienon hieno kaistale
  (`LAATIKKO_KAISTA`, 5 px), ja Sisälmys on palstan ja kaistaleiden levyinen. **Auki olevien
  laatikoiden väliin ei jää tilaa.** Laatikot täyttävät marginaalinsa ruudun reunaan. Merkinnät peittää reunushuomiot
  eikä väistä niitä (käyttäjän päätös). Vierityksessä palsta on keskellä ruutua aina, kun laatikot mahtuvat
  (`palstanSiirto()`, .wrapin `left`), joten marginaalit ovat yhtä leveät.
- **Ahdas navinäkymä** (opas 4.7.2, `naviAlas()`): mobiilissa, kun laatikot eivät mahdu
  rinnakkain, kolme laatikkonappia siirtyvät alapalkkiin (`#ala-laatikot`), jos mahtuvat: ensin palkkinuolen kanssa,
  sitten ilman (Light Phone 360 px), muuten ne jäävät aikajanan alle. Silloin navissa ei ole kirjanmerkkiä eikä
  sivunappeja, auki olevan laatikon nappi himmenee, laatikon ollessa auki aikajanakerros on piilossa (`laatikko-auki`),
  ja paljaan alapalkin napautus vie suoraan lukunäkymään.
- **Osiohyppy pitkällä painalluksella** (`osioAloita()`/`osioSivu()`, 1,1 s): reunanapautus (30 % laidoilla), sivunkääntöpainike ja PageDown/PageUp/nuolet/äänenvoimakkuusnäppäimet (toistotapahtuma hyppää myös, jos keyup puuttuu).
  Merkkipaalu (`osioPaalut()`, käyttäjän päätös): taso, jonka paalut osuvat alle kahdelle sivulle, ei kelpaa (ei kategoriaa, jolla ei ole tekstissä merkitystä); luku, jos sen keskiaskel on enintään `OSIO_ASKEL` (20) sivua, muuten osio (myös yläindeksikohtien osiot, Stephanus-sivu); kohta vain ilman lukuja ja osioita; muuten 10 sivua. Testi `osiohyppy-taso-testi.js`.
  Laidalla hyppy peruu jo alkaneen maalauksen (paikallaan pidetty sormi laidalla ei maalaa), **paitsi Sukkelan sanaselityksen sanaa**
  (`sanaSukkelana()`: sähköpaperilla luonnos näkyy viiveellä, ja hyppy pyyhkisi luonnoksen ennen selitystä; testi `osiohyppy-sana-testi.js`); näppäimen toisto ei käännä sivuja.
  Toisto tunnistetaan myös ilman `e.repeat`-lippua (`osioToisto()`: ei keyupia välissä tai alle 120 ms edellisestä keydownista), koska Light Phonen sovelluksessa pitkä painallus juoksuttaa sivuja; testeissä painallusten väli vähintään 120 ms.
  **Näppäin kääntää sivun vasta noustessaan** (keyup, enintään yksi sivu painallusta kohti, ei hypyn jälkeen): testin pelkkä keydown ei käännä. Laitteen näppäinten käytös Booxilla on todentamatta.
- **Seuraava viimeisellä sivulla avaa navin** (`seuraavaPainettu()`): vain tahallinen painallus (painike, reunanapautus, näppäin), ei vedon aikainen käännös, rulla eikä pyyhkäisy; verhon ollessa auki ei tapahdu mitään.
- `AudioVolumeDown`/`Up` kääntävät sivua siltä varalta, että selain välittää äänenvoimakkuusnäppäimet (Boox). Ei kuollutta koodia.
- **Aikajanan merkit nuottien tapaan**: suurempi aika-arvo ontompi (pääluku iso ontto salmiakki, alaluku pienempi
  täytetty, alaluvun alaluku lähes pistemäinen). Vain luettu osa on tekstin värinen; tulevat merkit ja kirjanmerkit
  ovat `--viiva`-harmaita, eivät pienempiä.
- **Peitto** (opas 4.4, `karsiPaallekkaiset()`): törmäys ei ole pelkkä lomittuminen, vaan kärjet menevät toistensa
  kehän sisäalaan. Merkin musteen pitää mahtua janalle, ja ensimmäisen näkyvän pääluvun vasemmalle puolelle mahtuu
  kuvitteellinen päälukumerkki (`testi.js` tarkistaa).
- **Veto**: vierityksessä ei ole magneettia (napautus ja veto vievät suhteelliseen kohtaan). Sivutettuna osoitin pysähtyy
  pysäkeille (`janaPysakit()`), jotka eivät riipu aikajanalle valituista merkeistä, paitsi (`janaKohde()`):
  yli 10 %:n pysäkkivälin sisältä saa valita vapaasti, ja osuma näkyvän salmiakin musteen x-alueelle vie sen
  keskukseen (`janaSalmiakit`). Muuta magneettia ei lisätä. Poikkeus kumpaankin lukutapaan:
  osuma piirrettyyn kirjanmerkin nauhaan vie tasan kirjanmerkkiin (`janaNauhat`). Liikkeessä
  päivitetään vain transform, viivojen päät ja etappien `tuleva`-luokka, kerran ruudunpäivitystä kohden (sähköpaperi).
- ***Palaa takaisin* -laatikko vain lähdeviittauksesta, haulla ja aikajanalta ≥ 50 %** (käyttäjän
  päätös): Sisälmys, Merkinnät ja tuonnin kyltti jättävät vain kummitusmerkin. Älä laajenna kysymättä.
- **Siirtymien kumousta ei ole** (käyttäjän päätös: ei tyydyttävää visuaalista ratkaisua; lukijaa auttavat
  majakka ja kirjanmerkit). Älä palauta sitä kysymättä.
- **Kokoruutu** (opas 4.9): **vain yläpalkin nappi, ei asetusta** (käyttäjän päätös). Nappi muistaa valinnan
  (`aset.kokoruutu`); selain sallii kokoruudun vain eleestä, joten tekstin avauksen jälkeinen ensimmäinen napautus vie
  kokoruutuun (`krAvaus`). Takaisin-eleen tai alasvedon jälkeen Luin ei palaa ennen seuraavaa avausta. Asentoa ei lukita.
- **Palkkivara** (opas 4.9): sivutettuna kosketusnäytöllä dokumentti on `150lvh` korkea (`html.palkkivara`; pienempi vara ei piilota palkkeja Bravella, `luin/kehitys/palkkikoe.html`), jotta pystypyyhkäisy vierittää ja selain piilottaa palkkinsa. Älä palauta `body.sivutus`:n `overflow: hidden`ia sinne äläkä käytä pystyeleitä sivutettuna muuhun (paitsi kokoruudun alasveto, jolloin vara on pois); uusi näkyvä elementti sivutettuna on `position: fixed`.
- **Palkkiopas** (pilotti, opas 4.9, `naytaPalkkiopas()`): iso pyyhkäisymerkki tekstin päällä avauksessa ja sivunkäännön valinnan jälkeen, vain kun selaimen palkit näkyvät (`100lvh` > ikkuna, ei selaimen nimeä). Kun se näkyy, leipäteksti himmenee värinä (`#palkkiopas:not([hidden]) ~ #sivu`, siksi opas on heti ennen `#sivu`a). Käyttäjän päätös: väri paletin haalea `--viiva` (himmennyksen ansiosta erottuu), neljä natsaa, **ei salmiakkeja eikä jäsentelyviivoja** (koristesalmiakit eivät ole tämän ohjelman juttu), selite enintään ison rivin levyinen (`.po-pieni` em-suhteessa). Versaali on toistaiseksi; sen poistoa harkitaan, älä poista kysymättä. Ei läpikuultavuutta, ei animaatiota, ei ota napautuksia; mikä tahansa napautus sulkee sen, tekstialueella tekemättä muuta. Älä tee siitä pientä äläkä siirrä tekstin alle kysymättä.
- **Turvakaista** (opas 4.9): kameran loven kohdalla musta `#turva` (`--turva` = `env(safe-area-inset-top)`, varasääntönä 32 px `paivitaTurva()`), ja kaikki näkymät alkavat sen alta. Light Phone säästetään (kaista 0). Kaistan napautus avaa ja sulkee navin kuten alakaista (vain mobiili ja lukija). Uusi kiinteä elementti tai yläraja ottaa `--turva`/`turva()`:n huomioon; `viewport-fit=cover` on välttämätön, jotta selain kertoo loven.
- **Erikoishaut** (opas 4.7.3): kenoviiva aloittaa erikoishaun (`/lainaus`, `/vieras`, kielet).
  Ehdotuksina vain tekstissä olevat; `ERIK`-taulun komentonimet ovat käyttäjälle näkyviä, älä vaihda niitä kysymättä.
  Lainausmerkkilainaus vaatii vähintään kolme sanaa (1–2 sanaa ovat termejä). Kohdat lasketaan kerran tekstiä kohden (`nyt.erik`).
- **Haun korostus sammuu sen omasta napautuksesta** (`sammutaKorostus()`; Esc lisänä, ei varaan):
  napautus ei tee muuta (ei sivunkääntöä, ei alleviivauksen valikkoa); pidä tarkistus reunanapautuksen edellä. Korostuksen
  ollessa päällä alapalkissa on painunut lasi (`#haku-sammuta`), joka sammuttaa sen; `korosta()` päivittää sen näkyvyyden.
- Kirjanmerkki menee aina kappaleen alkuun (`o: 0`; säännöt opas 4.3).
- **Tasattukin kaksirivinen kappale liehuu**, jos ensimmäisen rivin sanaväli olisi yli 1 em
  (`liehutaLyhyet()`, opas 5). Ei ulotu pidempiin kappaleisiin kysymättä. Uusi kirjoitus asettelussa tämän ja `tavutaPitkat()`:n
  jälkeen ei saa muuttaa rivitystä, tai luokka vanhenee.
- **Sisennys vain kappaleelle, jonka edellä on kappale** (CSS `p + p`): sisällysluettelon, otsikkolohkon, otsikon, lainauksen tai luettelon jälkeen ei sisennetä. Älä palauta poikkeusluetteloa.
- **Sivutettuna** pääluku alkaa aina uudelta sivulta (myös JS-varmistus `pakotettu`, koska kaikki työpöytäselaimet eivät
  noudata CSS:ää). **Sisällysluetteloa ei pakoteta omalle sivulleen**; se kulkee otsikkolohkon perässä.
- Merkintöjen tuonti (opas 4.6): ei virallista tiedostomuodon tunnistetta; vientiä muutetaan vain sen verran kuin
  tuonti ehdottomasti vaatii.
- Valinnan valikon alleviivausikonin 3 px:n ruosteviiva on liioiteltu tarkoituksella.
- **Maalauskone** (käyttäjän päätös, pilotti, opas 4.3): Luinin oma maalaus (`aset.maalaus`, oletus) ottaa selaimen valinnan
  pois tekstistä tarkoituksella (`html.oma-maalaus`, käyttäjä: "lukurauhan astia, ei joka paikan höylä"); kopiointi
  on valikon napissa. Älä palauta valintaa "korjauksena". Sanaraja on `sanassa()`, jota käyttävät myös
  `valintaPaloiksi()` ja viennin `esiintymat()`: pidä ne samana. Kahvat vain alleviivauksen tai luonnoksen
  napautuksesta, ei maalauksen päätteeksi. Yhden sanan valinta (tuplaklikkaus, pitkä painallus ilman vetoa) avaa
  vain sanaselityksen (*Sukkela sanaselitys*, `aset.sukSana`), myös kun valikon sanaselitys on päällä; kytkimet ovat
  toisistaan riippumattomat. **Kerran laajentunut veto ei palaa sanan valinnaksi**: maalaus, joka palaa
  samaan sanaan, on maalaus (sukkelana alleviivaus, muuten valikko; `maal.laajeni`, hiiren tuplaklikkausveto `hiiriMaalasi`,
  selaimen tapa `tila.vedetty`), ja kahvasta muutettu luonnos avaa valikon myös yhteen sanaan supistuttuaan (`veto.muuttui`). Valinnan valikossa ei ole kirjanmerkkiä: kirjanmerkki vain alapalkin nauhasta.
- **Suurennuslasi on pinossa** (`LUPA_KAYTOSSA = false`, käyttäjän päätös; älä ota käyttöön kysymättä; jos lasi
  osoittautuu tarpeettomaksi, käyttäjä harkitsee sen poistoa). Pilotti, opas 4.3: kahvan kosketusvedossa (ei hiirellä) vedettävän pään rivi näkyy
  1,25-kertaisena rivin yläpuolella. Klooni tarvitsee alkuperäisen lasketut tyylit (`lupaKlooni()`); `#lupa` pysyy
  `pointer-events: none` eikä saa `.luin-ui`-luokkaa. Kahvan kohta luetaan otealueen läpi (`#kahvat.lapi`).
- **Kaarikahva** (käyttäjän päätös, opas 4.3): ote on rivin keskikorkeudella kuten maalauksessa, ei rivin alla.
  Kahvat pysyvät näkyvissä myös vedon aikana ja jälkeen; alleviivaus pysyy yhtenäisenä (ei katkoviivaa). Nuppi mahtuu
  sanaväliin (0,2 em); älä levennä sitä kysymättä.
  **Alleviivaus on maalattu taustana, ei `text-decorationilla`**: natiivi alleviivaus pyöristyy
  rivi riviltä eri tavoin, joten kahvan sauma ei osu viivaan millään kaavalla. Viiva on ankkuroitu merkin laatikon
  alareunaan, ja kahvan jatke ja varsi ovat saman merkin taustaa (`k-alku` / `k-loppu`, `kahvaPaat()`); vain nuppi on SVG.
  Viivan paksuus ja varren korkeus ovat kokonaisia laitepikseleitä, muuten varren pohja karkaa. Älä palauta
  `text-decorationia` äläkä siirrä varsia pseudo-elementteihin (laatikko pyöristyy 1 px eri tavoin). Testi mittaa sauman. Eleen jälkeinen haamuklikkaus nielaistaan (`tila.niele`).
- **Törmäys ja värit** (käyttäjän päätös): uusi alleviivaus pysähtyy vanhan rajaan, ei lomitu eikä yhdisty.
  Vierekkäiset vuorottelevat ruostetta ja okraa (ketjun vanhin ruoste); muita värejä ei tarvita. Kahvat ovat aina
  samaa väriä kuin viiva (`.kahva.okra`, `kahvaVari()`). Samoin okrat ovat kirjauksen kynä
  tekstissä (`.kirm.okra`), valikon poistoikonin viiva (`ikPoista()`) ja kirjausruudun kohdekatkelman viiva (`.ali-teksti.okra`).
- **Alleviivauksen loppumerkit** (käyttäjän päätös, opas 4.3): lopetusmerkki vain kokonaiseen virkkeeseen, pilkku/kaksoispiste/puolipiste ei koskaan, valintaan jääneen avaajan sulkeva vastine heti sanan perässä mukaan. Säännöt ovat `valintaPaloiksi()`:ssa eikä naapuri vaikuta niihin; älä siirrä niitä törmäyskoodiin.
- **Kummitus ja pito** (opas 4.3, `kummitusAskel()`):
  tekstialueeseen ei kosketa. Kun liikkuva pää on 0,95 s sivun viimeisellä rivillä, alapalkin elementit katoavat näkyvistä ja
  käytöstä, ja palkkiin tulee palkin korkuinen neliö natsanuolineen marginaaliin: vasen reuna palstan oikean reunan linjassa,
  ja jos ei mahdu, ruudun reunassa koko ennallaan; vieressä palstan puolella *asdf →* (valinnan valikon alleviivausmerkki).
  Taaksepäin peilikuvana yläpalkissa: oikea reuna palstan vasemman reunan linjassa, vieressä *← asdf* (mobiilissa palkit ovat vedon aikana kiinni, joten neliö on tekstin
  yläpuolisen kaistan korkuinen; turvakaistan kanssa neliö ulottuu kaistan läpi, mutta natsa ja asdf ovat kaistan alla). Kääntö vain matkana (ulkoa sisään), 0,3 s viipymä, sitten neliö vaalenee 0,25 s (`--valo`,
  "ei adhd-räpsyä") ja sivu kääntyy. Pidon ajan pää pysyy rajan yli seuraavassa sanassa ja neliö palkissa, eikä sama sivu
  käänny uudelleen ("ei saa räpsyä"). **Sivutettuna laita ei käännä vedossa** (laidan ajastin ehtisi
  neliön edelle, kun sormi on viimeisen rivin lopussa ruudun reunan lähellä); älä palauta sitä. Rivi mitataan
  rajan lähimmästä sanan merkistä, ei rajasta (välilyönnin laatikko voi hypätä edelliselle sivulle).
- **Kirjauksen kynä** alleviivauksen alussa: napautus näyttää kirjauksen, toinen napautus muokkaa.
- **Sanaselitys ja käännös** ovat ainoat lukijan verkkohaut, vain napautuksesta (poikkeus suljetusta lukuympäristöstä,
  käyttäjän päätös). DeepL-osoitteessa `/` on `\/`, ja lähdekieli on pakollinen (`auto` ei toimi). Kohdekieli on suomesta
  latina, muista suomi (`kohdeKieli()`). Käännös on oletuksena pois valikosta.
- **Sanaselitys** (käyttäjän päätös, opas 4.3): käyttöliittymässä *sanaselitys*, ei *sanakirja* (avain
  `aset.sanakirja` säilyy). Ensin aina tasan tekstin muoto, vasta sen puuttuessa kielikohtainen ketju (`skKetju()`). Tasan samoista muodoista (virkkeen alun *As* ja *as*) määritelmä ennen pelkkää taivutusviittausta (*plural of A*; `skTasan()`), muuten tekstin muoto ensin.
  Taivutusarvaukset (loppunapsu) vain tekstin kielestä, paitsi kursiivissa ja lainauksessa. Suomessa ennen napsua taulukkohaku (`tx`: tekstihaku indeksoi taivutustaulukot, *käsitteen* → *käsite*; erisnimellä vasta `ne`:n jälkeen, ettei *Kantin* osu *kantin* taulukkoon), ja napsussa pituusehto: yli kirjaimen tekstin sanaa pidemmät ehdokkaat vain, jos lyhyitä ei tule. Wikisanakirjassa ei surffata
  takaisin päin (Luin ei ole selain), merkki ei ole linkki, ja ulos vievät linkit ovat korkean kynnyksen takana. REST-rajapinnan kieliavaimiin ei luoteta (`skNormita()`: Translingual on avaimen `en` alla, muinaiskreikka avaimen `other`); kieli luetaan osan nimestä. Tekstin kielestä löytyvään sanaan ei näytetä muiden kielten tietoja (käyttäjän päätös: ensin suomi, sitten kaikki kielet: *edes* ei tuo latinaa, *is* ei afrikaansia; `r`-lippu ketjussa). Kursiivissa tämä liudentuu: tekstin kieli ensin, muut jäävät mukaan; ei kuitenkaan tekstin kielen pikkusanalle (`KIELET`-lista, `y.pikkusana`: *as* ei tuo suomea kursiivissa eikä lainauksessa). Suomenkielinen lainaus on kuin leipäteksti; muissa kielissä vain oman kielensä erottava lainaus (`y.omaKieli`), lyhyt lainaus liudentuu. Englannin iso alkukirjain keskellä virkettä (*Dasein*) jättää muut kielet mukaan, ja kreikan kaksi kieltä näkyvät yhdessä. Lainauksen sisäinen kursiivi on kursiivi. Translingual (`mul`) noudattaa samaa: pois tekstin kielestä löytyvältä, paitsi symbolin näköiselle kirjoitusasulle (IV, CO2, pH); muuten tekstin kielen, ketjun kielten, englannin ja suomen jälkeen; ISO 639 -kielikoodit eivät näy koskaan. Verkkovirhe pysäyttää ketjun. Enintään
  10 sanaa (`SK_SANAT`). Raksin paikka on mitattu lisää-linkistä; asetuksissakin lambda on tekstin värinen.
- **Alkuperä ja perusmuoto** (opas 4.3): selitysikkunan otsikossa ei ole lambdaa (valikossa ja
  asetuksissa on). Sanan perässä on alaindeksinä linssi-epsilon vain, kun sivulla on etymologia (osioluettelo haetaan heti);
  linssi ja ε alussa ruostetta, osoitettaessa ε muste, auki myös linssi muste. Kehä tiukasti ε:n päällä (diakriitit "kehän takana"); varsi sanan alle. **Ei
  linssiä valitsimeen**: vasta valitun sanan selitykseen. Selitysikkunan ylin rivi ΛΟΓΟΣ (vain kun selitys näkyy) ja laatikon
  ylin rivi ΕΤΥΜΟΝ ovat majuskeleita (ei lukumerkkejä) pienen otsikon koossa, harmaata haaleampina ja hyvin
  väljästi harvennettuina (käyttäjän päätös: huomaamaton, älä suurenna); raksit niiden riveillä. Ne eivät näytä linkeiltä, mutta vievät
  sanan λόγος / ἔτυμον selitykseen (käyttäjän vitsi; vihjeet *Sana (logos)*, *Alkuperä (etymon)*). Määritelmillä ei ole kehystä.
  Lisää-linkki on pelkkä plussa ilman kehystä; raksissa ei kehystä.
  **Etymologiaosiota ei jäsennetä yksinään** (`section=N`): mallineet lukevat kielen otsikkolaskurista, ja muu kuin sivun ensimmäinen
  kieli antaa Lua-virheen. Wikiteksti jäsennetään täyteotsikoiden perässä (`haeAlkupera()`).
  Mobiiliselain saa jäsennyksen `<section class="mf-section-N">`-kääreissä (Androidin Firefox): `skOsiot()` purkaa ne.
  Pilvikontista mobiilimuodon saa oikeasta rajapinnasta POSTilla mobiilin User-Agentin kanssa (GET antaa 429:n).
  **Perusmuoto ensin**: pelkkien taivutusviittausten sivu vaihtuu perusmuotoon, taivutus pienellä kursiivilla, sisennettynä ja sulkeissa otsikon alla Wikisanakirjan
  sanoin ((”käden” · genitive singular)); muoto pysyy, jos sillä on omia merkityksiä tai oma etymologia. Lambdaa ei poisteta
  muualta kysymättä.
- **Kopion paikannin**: luvun numero, ei sivunumeroita, sanallinen otsikko vain pakosta (käyttäjän päätös).
  Numero on md.js:n `paikat()`-paikannin (opas 3.2): kirjoittajan `4.3.4` sellaisenaan, muuten
  tunnisteiden ketju (*Osa II, 3b*), ja ylempi taso pois, jos alempi numerointi jatkuu sen yli (Korsgaardin Part II alkaa
  luvusta 6 → *6*). Kappaleen alun pykälä tai Tractatus-numero tarkentaa paikantimen kappaleeseen (`kohtamerkit`).
  Tarkkuus on aina alimman numerotason (käyttäjän päätös, `nollat()`): kattavasti kolmitasoisessa luvun alku
  *4.0.0*, kaksitasoisessa *4.0*; luvuittain alusta alkava pykälä alaluvun paikalla (*5.2*), jatkuva yksinään (*§ 88*).
  **Poikkeus: vakiosivut** (opas 3.2): etukentän `vakiosivut: AA` ja merkit `{4:429}` (tai sen
  puuttuessa sivunumeron näköiset yläindeksit) antavat paikantimeksi edeltävän sivun (*AA 4:429*) ja lyhyeksi viitteeksi pelkän sen.
  Ilman etukenttää aaltosulkeet ovat tekstiä; älä tee merkeistä vakiosivuja ilman sitä. Testi `vakiosivu-testi.js`.
- **Tasojen nimet ovat luku, osio ja kohta** (`h2`/`h3`/`h4`; käyttäjän päätös).
  **Ylin taso jää käyttämättä** (md.js `laske`, opas 3.2): korkeintaan kaksi tasoa ja joko yli 10 lukua tai teksti on artikkeli
  (`artikkeli()`: etukentän `teos` ja `numero`/`doi`/`sivut`, tai `sivusto` ilman kantajaa, ei kaunokirjallinen) → kaikki tasoa
  alemmas, sivuseikkojen alennus perutaan. Artikkelin otsikot ovat osioita, eivät lukuja (käyttäjän päätös); kirja, opinnäyte ja
  kolmitasoinen teksti pitävät luvut. **Juokseva otsikko** (lihavoitu numeroitu kappaleen alku sarjana, *Corollary 1:* …) on kohta
  (`res.kohdat`, `ajo`), ei otsikko; sen kappale (`p.ajo`) alkaa sisentämättä ja välin jälkeen (käyttäjän havainto: sisennettynä se näytti oudolta). **Etu- ja loppuosat** (`toc[].oheis`) ovat Sisälmyksessä varsinaisten lukujen tasolla ja
  erotettu välillä (`sisalmysRivit()`), ei sisennettyinä edellisen luvun alle (käyttäjän päätös). Etuosan (Abstract, Summary)
  osanvaihdon jälkeinen otsikoton teksti ennen ensimmäistä lukua (lehtiartikkelin johdanto) on varsinaista tekstiä: Sisälmyksen
  ylimmällä tasolla pelkin alkusanoin, ja `osioKohdassa()` (`nyt.etuLoppu`) antaa sille tekstin nimen eikä tiivistelmän
  viimeistä alaotsikkoa. Otsikkoa ei keksitä.
  Sisällys ja Sisälmys lukevat tasot tekstin ylimmästä tasosta (`tocRaja()`). **Aikajana ei siirrä tasoja**: Luvut, Osiot ja Kohdat
  ovat erillisiä kytkimiä (käyttäjän päätös), ja avoimen tekstin puuttuvat tasot ovat himmeitä (`janaTasotNyt()`).
- **Tekijänoikeusmerkintä** (käyttäjän päätös, md.js `oikeudet()`/`oikeusTaso()`, opas 3.2): etukentän
  `oikeudet:` (ja `oikeudet-lähde:`) → tekstin loppuun otsikko *Tekijänoikeudet*, merkintä sellaisenaan, kaverillinen selitys
  (rento sävy) ja virallinen linkki. Lisäosa kirjoittaa sen vain, kun lähde kertoo (SEP, Logos, Wikipedia,
  `rel="license"`); Latomossa se on valinnainen kenttä, oletuksena piilossa. Taso: kohta; kuivan loppuosion alla aina kohta;
  pelkkien osioiden tai pelkkien lukujen tekstissä sama taso; ilman otsikoita kohta yksin. Merkintä lisätään vasta tasojen
  laskennan jälkeen: se ei saa muuttaa muiden otsikoiden tasoja (`laske`, alennukset) eikä lohkonumeroita (kirjanmerkit),
  eikä sen kappaleista tule kirjallisuusluettelon kohtia (`md-testi.js` tarkistaa).
- **Iso kirjallisuusosio on luku** (käyttäjän päätös, md.js `bibLuku()`, opas 3.2): luvun tasolla oleva
  kirjallisuusotsikko, joka tekstin loppuun asti (myös sen jälkeiset osiot) vie ≥ 25 % tekstistä, pysyy lukuna ja sen
  alaotsikot osioina; alennukset (sivuseikat, `laske`) perutaan vain siltä.
- **Pykälä on korkeintaan alaluvun alaluku** (käyttäjän päätös, `pykalaSarjat()`, opas 3.2): Husserlin tapainen
  lyhyehkö pykälä, merkillä tai ilman, ladotaan `h4`:ksi myös ilman yläotsikoita. Pelkkien pykälien tekstissä
  sisällysluettelot näyttävät ylimmän olemassa olevan tason (`tocRaja()`).
- **Liettuan tavutus** (opas 5, md.js `tavutaLt()`): vain kappaleelle, jonka lukija tunnistaa liettuaksi (`tavutaDOM()`:n
  kolmas parametri); muu teksti tavuttuu suomen säännöin. Liettua on myös `KIELET`-listassa (käännös, sanaselitys,
  `/liettua`): listaan ei sanoja, jotka ovat toisen kielen listassa. md.js:n `BIB`/`OHEIS` tuntevat liettuan luettelonimet.
- **Tavutuskiellot** (opas 5): otsikoissa, `.sub`:ssa, `.meta`:ssa, sisällysluettelossa, lihavoinneissa ym. (`OHITA`
  md.js:ssä) ei ole pehmeitä tavuviivoja, ellei sana ole palstaa leveämpi. Kirjallisuusluettelo (`p.bib`) ei tavuta
  lainkaan (Teologian tyyli, APA 7).
- **Pitkä reunushuomio katkaistaan** (`sovitaHuomiot()`, opas 3): vain kun se työntäisi seuraavaa
  huomiota; *lisää…*/*vähemmän* on oma kelluke huomion perässä eikä siinä ole tekstisolmua (teksti `::before`). Älä siirrä nappia
  huomion sisään: ponnahdus, haku ja lohkon kohdat lukevat huomion sisältöä.
- `#teksti { overflow-wrap: break-word }` estää vaakavierityksen (Light Phone, pitkät osoitteet); `testi.js` tarkistaa.

Ratkaisut, jotka näyttävät oudoilta mutta ovat mitattuja:

- `kohdanLaatikko` ottaa merkin laatikoista **viimeisen**: tavutusrajan jälkeisen merkin ensimmäinen laatikko on
  Chromiumissa edellisen rivin tavuviiva.
- Vierityksen kohta on rivi, jonka **keskikohta** on `YLA`:ssa, ja `mene()` vierittää merkin keskikohdan samaan;
  yläreunalla kohta ajautuisi joka kokomuutoksella rivin ylöspäin.
- Sivutettuna kohdassa voi olla `ed`: sivu ilman tekstilohkoja (sisällysluettelo) ankkuroidaan seuraavan lohkon alkuun
  `ed` sivua ennen sitä.
- Sivutettuna `hr.ennen-lukua` (`---` juuri ennen `##`:tä) piilotetaan, koska viiva jäisi yksin omalle sivulleen.
- Vierityksessä pelkkä ikkunan korkeuden muutos ei asettele tekstiä uudelleen (mobiilin osoiterivi).
- **Raskas teksti** (`sovellaTaiLykkaa()`, opas 4.5): kun `tila.asetteluMs` > `RASKAS_MS`, `ASETTELU`-asetukset
  asetellaan kerran Asetusten sulkiessa, ja paneelin ylälaidassa on ilmoitus (`#raskas-tieto`, käyttäjän päätös; sanoissa ei *latoa* eikä *ladonta*, ettei sekoitu Latomoon). Odotuksen aikana
  ei saa asettaa `--koko`a eikä kielten luokkaa tai kutsua `asettele()`a. Uusi asetusnappi kulkee `sovellaTaiLykkaa()`n kautta. Testi `raskas-testi.js`.
- `tavutaPitkat()` mittaa ensin kaikki ja kirjoittaa vasta lopuksi, ja `sovellaAsetukset()` asettelee vain
  `ASETTELU`-listan asetuksilla. Älä lomita kirjoituksia mittausten väliin: sivutettuna jokainen asetuksen napautus
  kestäisi pitkällä tekstillä sekunteja.

### Latomo (opas 7)

- **Etukenttään vain se, mikä poikkeaa tekstistä päätellystä**: kandidaatintutkielma läpäisee Latomon tavulleen samana.
- Kaikki on vapaaehtoista, otsikko riittää. *Tekstityyppi* on oletuksena *ei määritelty* (ei pakollista kategoriaa).
  Kaunokirjallisen tekstin `teos`-kenttä on *Kokoelma* (käyttäjän sateenvarjosana, ei *novellikokoelma*).
- Ehdotukset muuttavat tekstikenttää vain napista. Myös luurangotus (`luuranko()`, opas 7.1): hyvin merkitty teksti ei saa
  rakenne-ehdotusta (`md-testi.js` tarkistaa).
- **Latomossa ei ole MarkDownload-tilaa** (käyttäjän päätös, koska lisäosa on Chrome Web Storessa): ei
  kytkintä, ehdotusta, Excerpt-, validateUri- eikä leikkeen loppurivien käsittelyä. Leike siivotaan vain korvamerkistä.
  Latomon ohjeen ja kehittäjän oppaan MarkDownload-osiot ovat vanhentuneita; käyttäjä ei halua niitä nyt korjattavan. Ohjeen alussa on huomautus *Ei tarkistettu, ei ajan tasalla*; poista vasta, kun ohje on tarkistettu.
- **Postihuilu** (käyttäjän nimi: Latomossa, Luinissa ja lisäosassa; opas 2.2):
  käyttäjälle näkyvät tekstit (Postihuilu, Laatikkolause, *Soita huilua!*, *Huiluta myös merkintöjä*, i-ohje, Latomon
  *TOISEN LAITTEEN PÄÄSSÄ* ja lisäosan johdanto) ovat käyttäjän sanamuotoja: älä siloittele. Latomo ei lähetä merkintöjä
  (käyttäjän päätös). Latomo kirjoittaa
  tekstin laatikkoon reitillä `POST /api/luin`, ja Luin hakee tekstit samalta reitiltä GET:llä. **Pitkä arvottu laatikon
  koodi (≥ 24 merkkiä) on itse avain**: ei salaisuutta workeriin eikä Päätettä uudelle käyttäjälle,
  laatikolle tai laitteelle (salakoodi workeria kohti ei skaalaudu).
  **Uusi laatikkolause on aina 24–52 merkkiä** (käyttäjän päätös; lauseella on voitava sekä lähettää että lukea),
  **vain a–z, 0–9 ja `-`** (käyttäjän päätös): isot kirjaimet luetaan pieniksi, muut merkit hylätään eikä niitä
  siistitä pois. Sääntö ja ohje ovat `luin/posti.js`:ssä, lisäosassa kopiona: muuta yhdessä. Vanha lyhyt koodi toimii vain lukemiseen. Kirjoitukset kulkevat Durable Objectin laskurin `LuinRaja`
  kautta (`LUIN_LASKURI`, `wrangler.toml`): 20 POSTia minuutissa osoitetta kohti ja 500 KV-kirjoitusta UTC-päivässä. Älä palauta
  Cloudflaren ratelimit-sidontaa tai isolaatin muistia: kumpikaan ei rajoita. Koodia ei kirjoiteta repoon.
  Pino hakee laatikon enintään minuutin välein ja tyhjän haun jälkeen kerran uudelleen (`haePinoon()`): KV:n listaus näyttää
  edellisen minuutin sisällä luetun tilan. Ei jatkuvaa kyselyä: ilmaistasolla listauksia on 1000 päivässä, ja haku tekee kaksi. Reitti vaatii,
  että `tusinasaa-worker` on julkaistu tämän repon koodilla (`npx -y wrangler@3.114.17 deploy` repon juuressa).
- **Postihuilun kuvio** (käyttäjän päätös): `luin/huilu.js` (`?v=` kuten md.js:n), piirto `piirraHuilu()`. Testi `postihuilu-testi.js`.
  Muokkaa pienin askelin, älä rakenna uudelleen (`SYLI`, testi mittaa).
  - **Yksikään huilu ei ole vaakatasossa**: aina 64° (`HUILUKULMA`), nokka ylhäällä oikealla. Kaistassa huilu kiertyy suunsa ympäri, joten viuhka ei muutu; siksakin 22° ja nuottien kallistus pysyvät 68°:n mukaisina.
  - Asetuksissa huilu on *Soita huilua!* -napin (oikeassa reunassa) yläpuolella oikealle siirrettynä; Arvo on laatikkolauseen tekstikentän oikealla puolella
    samalla rivillä (`.koodikentta`). Pinossa ei ole Postihuilua (*Pinon alla*).
  - **Vain alkuviuhka kaartuu**: viivat lähtevät alimman reiän kärjestä sileänä kaarena (syli, alla) ja jatkuvat sitten
    kulmikkaana siksakkina, selvin taittein (käyttäjä: aaltomuodon loputtomuudesta kvantteihin). Viivat ovat ohuita, mutta
    mitat isoja (huilu 6 px, viivaväli 8 px, siksak ±4,85 px): ohut viiva ei ole lupa pienentää.
  - **Väljä kolmilinja**: kolme viivaa, jakso 48, alamäki 22° vaakatasosta, siksak enintään
    neljä jaksoa, väli 8 (ylin viiva paikallaan, alin kaartuu syvemmin alas ja vasemmalle, `KAARROS`), nuotti välin korkuinen.
  - **Soitossa tasan kolme nuottia, aina napin x-välillä, ei koskaan kahta** (käyttäjän päätös). **Siksak päättyy tasan napin oikeaan reunaan**;
    **napin alku aina alakulmassa, kolmen välin päässä yläkulma ja napin loppu sen jälkeen alamäen puolivälissä** (`yli` .5),
    nuotti kunkin välin keskellä (`alkuX`, `loppuX`; jakso joustaa, 22° pysyy). Kapealla (alle 360 px), jossa kaarelle ei jää tilaa, väli kapenee niin, että kaari, laakso ja 3,5 väliä mahtuvat suusta napin loppuun, eikä napin alku silloin osu alakulmaan (`SYLI.vahintaan`); samalla kaari pienenee mittasuhteet säilyttäen (`kutistus`); pinon lohko enintään 22.5rem.
  - **Syli**: suusta kiihtyen alas ja vasemmalle, taite ja pitkä kaarros, **alin kohta suun kohdalla x-akselilla**, loiva nousu ja loiva harja yläkulmien
    korkeudella väliä ennen nappia, **laakso suora** (ei loiventumista) napin alun alakulmaan. Kukin viiva on C2-splini tukipisteiden kautta
    (käyttäjän päätös: ei tarpeettomia nopeita asteluvun kiihdytyksiä); kaikki lähtevät suusta ilmavirran suuntaisesti ja aluksi
    lähekkäin, keskimmäinen on ylimmän ja alimman painotettu keskiarvo (ääripäässä hiukan alimman puoleen). **Perustuslaki: viivat eivät
    koskaan leikkaa toisiaan** (käyttäjän päätös); välit eivät veny ilman syytä.
  - Nuotit ilmestyvät vasta painalluksesta (kelpaava lause), vain napin yläpuolelle, joka kerta uutena arvontana (ei portaita), eivätkä liiku.
    **Nuotti aina viivalla tai välissä, ei koskaan viivaston ulkopuolella, ja aina siksakin jakson keskellä**; ensimmäinen
    ja viimeinen soiva jakso rajaavat soiton, ei kahta tyhjää peräkkäin; **yksi nuotti jaksoa kohti, ei koskaan kahta ääntä päällekkäin**;
    salmiakki kallistuu alamäkiviivalla oikealle huilujen kulmassa (22° pystysuorasta), ylämäkiviivalla pystyssä; korkeus pelkkä arvonta (käyttäjä: ei melodiaestetiikkaa). Siksak päättyy aina
    kokonaisen palan lepokohtaan, joten kapeassa näytössä se lyhenee pala palalta.
  - Huilutettu = kantautunut laatikosta (`e.src === 'laatikko'`) eikä vielä avattu tässä selaimessa (`avaa()` asettaa `e.huiluNahty`, uudelleenlähetys poistaa sen): sama huilu nimen perässä (`HUILUTETTU`,
    keskikohta 0,29 em perusviivan yläpuolella). Merkintöjen merkki (`MERKITTY`: kirjanmerkki, alleviivaus
    tai kirjaus) on nimen ja huilun välissä, hienovarainen ja harmaa; viimeinen sana sidotaan merkkeihin (`nimiMerkein()`).
  - Sormireiät logon mittasuhteissa, sivukärjet irti reunaviivasta (`REIKA` 0,5),
    kärjet hipaisten, alin alakärki pohjaviivan sisäpinnassa (ketju ankkuroituu alhaalta). **Ääniaukko** (`AUKKO`, nokkahuilun ikkuna):
    melko ylhäällä matala täytetty siivu reikien värillä, sen päiden linjasta
    kelloa kohti tyhjä ääriviiva, jonka alaosassa leukaperät ja leveä leuka (45° sisäänpäin, puolivälissä keskiviivalle vaakaan). Ei ruostetta. Kaistan luokka ei saa olla
    `.asetus` (asetusrivin alareunaviiva). Nimikkeen kolme salmiakkia ovat pystyssä kärjet hipaisten.
  - Lisäosan Postihuilu-napissa on `vino()`-huilu ja sen oikealla **irrallinen** siksak-kolmilinja (väli 8, jakso 48, puolitoista jaksoa): viivaston, huilun
    ja tekstin keskilinjat ovat samalla korkeudella (`vertical-align: middle`). Napissa ei viuhkaa huilusta (ei toimi).
  - Älä tarjoa hylättyjä vaihtoehtoja (vaakahuilu, aaltoileva viivasto, lomittuvat reiät, terävä taite alussa, viisi reikää ja viisi viivaa).
    Viuhkan sisäviivojen jyrkkä käännös on tarkoituksellinen (`kaista()`): älä korjaa sitä kysymättä (historia commitissa f3f21b3).
- **Laatikkolauseen arpoja** (`luin/laatikkolause.js`, oikeaoppinen ja kohtalaisen muistettava):
  *Arvo* Latomossa, Luinin asetuksissa (täyttää, ei tallenna ennen *Soita huilua!*) ja lisäosassa (tavulleen sama kopio
  `luin/lisaosa/laatikkolause.js`). Kaava laatusana–tekijä–teonsana–luku–kohde–paikka, tasajakauma hylkäysotannalla ja tarkka
  lukumäärä (`MAARA`). **Ei lauseita, joista pitää poistaa ääkköset** (käyttäjän päätös): ei ääkkösiä, ei niistä
  pudotettuja muotoja (*delfiinia*) eikä oikeita sanoja, joiden ääkkösellinen vastine on yleinen (*etana*/*etänä*,
  *niittaa*/*niittää*). Samassa paikassa ei lähisynonyymejä. Kun muutat sanoja, aja `python3 luin/kehitys/laatikkolause-sanat.py`
  (`apt-get install voikko-fi python3-libvoikko`, `pip install wordfreq`) ja `laatikkolause-testi.js`, kopioi tiedosto
  lisäosaan ja päivitä `laatikkolause.js?v=` kuten md.js:n.
- **Huiluta laatikkoon** (opas 2.2, `huiluta()`): nimikkeen valikosta pinon tekstin runko laatikkoon
  tunnuksella `P.avain(id)`, jotta toinen laite saa saman tunnuksen ja merkinnät osuvat. Lähettäjä kirjaa lähetyksen nähdyksi
  (muuten oma haku nostaisi tekstin kellarista pinoon). Merkinnät perässä vain *Huiluta myös merkintöjä* -valinnalla. Testi `huiluta-testi.js`.
- **Merkintäposti** (opas 2.2): merkinnät kulkevat laatikossa omalla avaimellaan `luinm:`, ei
  tekstien joukossa. Vastaanotto aina, lähetys valinnasta (pinossa oletus, tekstin asetuksissa tekstikohtainen).
  Lähettäjä hakee ja yhdistää laatikon version ennen lähetystä; poistot ovat poistomerkintöjä (`merk.del`), jotka
  `tallennaMerkit()` kirjaa. Kun muutat merkintöjen tietomuotoa tai tallennusta, aja `posti-testi.js`. Paketissa kulkee myös
  luokittelu (`lk`: asiasanat, ajoitus, käsikirjasto), kun lukija on luokitellut tekstin tällä laitteella (`e.lkT`, `lkMuuttui()`;
  ei tuonnin etukentästä); uusin voittaa kokonaisuutena (`P.yhdistaLk()`). Uusi luokittelun muuttaja kutsuu `lkMuuttui()`a.
  `posti.js?v=` on tiedoston SHA-1:n alku kuten md.js:n (luin.html ja Latomo).

### Testit (opas 8)

Aja repon juuressa:

- `node luin/kehitys/md-testi.js`: jäsennin ilman selainta (myös `md.js?v=`).
- `NODE_PATH=$(npm root -g) node luin/kehitys/latomo-testi.js [kuvakansio]`: Latomo selaimessa.
- `NODE_PATH=$(npm root -g) node luin/kehitys/testi.js teksti.md [kuvakansio]`: lukija selaimessa (esim. tutkielmalla).
  Sivun testikoukku on `window.__luin`.
- `NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-testi.js [kuvakansio]`: lisäosa Chromiumissa artikkelista
  pinoon ja Lähetä postina.
- `NODE_PATH=$(npm root -g) node luin/kehitys/palaute-testi.js [kuvakansio]`: palautelomake workerin oikealla koodilla,
  kantautuminen Luiniin ja Latomon plussa.
- `NODE_PATH=$(npm root -g) node luin/kehitys/posti-testi.js [kuvakansio]`: postilaatikko ja merkintäposti kahdella
  laitteella workerin oikealla koodilla (muistissa oleva KV).
- `NODE_PATH=$(npm root -g) node luin/kehitys/hakuteos-pesukone.js [--nayta] [--sarja s] [osoitteet]`: sovitteiden oikeat
  artikkelit lisäosan, Latomon ja md.js:n läpi; jäänteiden, virheiden ja rikkinäisten lähdelinkkien pitää olla 0. Ennen ja jälkeen
  samalla välimuistilla: ensimmäinen ajo `--ulos A`, toinen `--ulos B --vertaa A` (muuttuneet rivit artikkeleittain; sama
  `snellman-pesukone.js`:ssä). Tarkistussivua (PMC:n reCAPTCHA, Cloudflare) ei tallenneta eikä kierretä selaimella: se on
  pääsynvalvontaa. Pesukone luettelee sen sivut; hae ne myöhemmin harvemmin.
- `NODE_PATH=$(npm root -g) node luin/kehitys/sep-pesukone.js [--nayta]`: seitsemän SEP-artikkelia lisäosan, Latomon ja
  md.js:n läpi; lähdelinkkien oikeellisuus ja linkittämättä jääneet (opas 3.4).
- `NODE_PATH=$(npm root -g) node luin/kehitys/snellman-pesukone.js [--vali kansio]`: Snellmanin koko korpus (2 949 asiakirjaa)
  lisäosan, Latomon ja md.js:n läpi, teksti sanoittain lähteeseen; kun muutat Snellman-sovitetta tai `ladonta: asiakirja`a,
  kadonneiden sanojen, viitesanojen, varoitusten ja jäänteiden pitää olla 0 (supersalmiakin ehto). Välimuistin täyttö kestää noin tunnin.
- `NODE_PATH=$(npm root -g) node luin/kehitys/sisalmys-vali-testi.js [kuvakansio]`: osanvaihtojen kohdat Sisälmyksessä.
- `NODE_PATH=$(npm root -g) node luin/kehitys/laatikkolause-testi.js [kuvakansio]`: laatikkolauseen arpoja ja Latomon Arvo.
- `NODE_PATH=$(npm root -g) node luin/kehitys/huiluta-testi.js [kuvakansio]`: pinon tekstin huilutus kahdella laitteella (myös `#u=`-tekstit).
- `NODE_PATH=$(npm root -g) node luin/kehitys/postihuilu-testi.js [kuvakansio]`: huilun geometria, `huilu.js?v=` kuvio asetuksissa, pinossa ei Postihuilua ja Soita postihuilua.
- `NODE_PATH=$(npm root -g) node luin/kehitys/laitos-testi.js [kuvakansio]`: tiedot ja uusi laitos pinosta Latomoon ja takaisin.
- `NODE_PATH=$(npm root -g) node luin/kehitys/omappi-testi.js [kuvakansio]`: ö-mappien mappi ö ja kellarin otsikon kampi.
- `NODE_PATH=$(npm root -g) node luin/kehitys/linkki-testi.js [kuvakansio]`: Lataa md, Linkitä tiedostoon ja valikkojärjestys.
- `NODE_PATH=$(npm root -g) node luin/kehitys/ulkoklikkaus-testi.js [kuvakansio]`: laatikon ohi napautus hiirellä ja kosketuksella, kopioi linkki -napin vihje.
- `NODE_PATH=$(npm root -g) node luin/kehitys/sahkopaperi-testi.js [kuvakansio]`: sähköpapyrosointi, vatkaus, Oletusasetukset, Sysi ja TCF-valkaisu.
- `NODE_PATH=$(npm root -g) node luin/kehitys/raskas-testi.js [kuvakansio]`: raskaan tekstin ladonta kerralla Asetusten sulkiessa.
- `NODE_PATH=$(npm root -g) node luin/kehitys/tallennus-testi.js [kuvakansio]`: tekstikanta (siirto localStoragesta, iso teksti, ilman IndexedDB:tä) ja pinon tusina.
- `NODE_PATH=$(npm root -g) node luin/kehitys/silta-testi.js [kuvakansio]`: Android-kääreen silta Luinin sivuilla mobiiliselaimessa.
- `node docs/viitteet/vertaa-luin.js`: viitteen kokoaminen Teologian tyylin esimerkkejä vasten.
- `NODE_PATH=$(npm root -g) node luin/kehitys/sanaselitys-testi.js [kuvakansio] [--ei-taittoa]`: sanaselitys tekosanastolla.
- `NODE_PATH=$(npm root -g) node luin/kehitys/vakiosivu-testi.js [kuvakansio]`: vakiosivujen merkit, paikannin ja Latomon säilytys.
- `NODE_PATH=$(npm root -g) node luin/kehitys/osiohyppy-sana-testi.js`: laidan pitkä painallus sanalla, Sukkela sanaselitys ja osiohyppy.
- `NODE_PATH=$(npm root -g) node luin/kehitys/osiohyppy-taso-testi.js`: osiohypyn merkkipaalun taso (Valtio, artikkeli, pitkä teksti, pelkät kohdat).
  Wikisanakirja antaa pilvikontista GET-pyynnöille 429:n (myös kohteliaalla User-Agentilla ja odottaen); action=parse
  toimii POSTilla, joten jäsennyksen voi kokeilla oikeaa rajapintaa vasten muuntamalla GETit POSTeiksi (`route.fetch`).

### Väliaikaiset tekstit

Kandidaatintutkielma on **väliaikaisesti** repossa (käyttäjän lupa): `luin/tekstit/kant-ja-elainetiikka.md`, pinon
linkki *Kokeiluteksti: Kant ja eläinetiikka* ja `robots.txt`:n rivi `Disallow: /luin/tekstit/`. Samoin
`luin/tekstit/dialectic-of-enlightenment.md` (ilman linkkiä, `luin.html#u=luin/tekstit/dialectic-of-enlightenment.md`).
Kun käyttäjä sanoo kokeilun päättyneen, poista tiedostot, linkki ja robots.txt:n rivi (`md-testi.js` käyttää molempia
fixtureina: korvaa ne ensin). Muita käyttäjän tekstejä ei viedä repoon ilman erillistä lupaa.

### Alatunnisteen ©-merkki

Yleissääntö on juuren CLAUDE.md:n osiossa *Alatunniste*. Luinin sivuilla (`luin.html`, Latomo, Latomon ohje,
käyttöohje, lisäosan tietosuojasivu, palaute, tuetut sivustot) ©-merkki on SVG: suora salmiakki, korkeus 1,30 × leveys, ja sen sisällä
Literatan oman ©-merkin sisempi C 1,1-kertaisena (`aria-label="©"`, `margin-right: .15em`). Muiden ohjelmien alatunnisteissa on tavallinen ©.
