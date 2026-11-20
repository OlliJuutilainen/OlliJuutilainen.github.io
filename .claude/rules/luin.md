---
paths:
  - "luin.html"
  - "luin/**"
  - "android/luin/**"
  - "docs/viitteet/**"
---
## Luin

Tässä on vain se, mitä koodista ei näe tai minkä voisi helposti rikkoa. Yksityiskohdat ovat kehittäjän oppaassa
`luin/ohje.md` (luvut mainittu alla), historia commit-viesteissä.

Käyttäjälle näkyvä teksti puhuu yksikössä, ei *meistä* (*kerro*, ei *kerro meille*), koska kehittäjä on yksi ihminen; poikkeus
on leikillinen puhetapa kuten *Tusinasoftin johtoryhmä*. Kehittäjä on käyttäjälle *Olli* (*suoraan Ollille*, ei *kehittäjälle*);
lisäosan tietosuojasivu jää muodolliseksi (käyttäjän linjaukset 20.11.2026).

### Tiedostot

- `luin.html` (juuressa, koska ohjelman nimi on luin.html): lukulista ja lukija samalla sivulla. Tekstien sisältö on
  IndexedDB:ssä (`luin/tekstit.js`, `LuinTekstit`, lupauksia; 19.11.2026), kaikki muu localStoragessa (opas 2.3); palvelinta ei ole,
  paitsi postilaatikko. Älä palauta tekstejä localStorageen (5,2 milj. merkkiä koko sivustolle). Testit lukevat tekstin
  `LuinTekstit.lue()`:lla; testin localStorageen kylvämät `luin-teksti:`-avaimet siirtyvät kantaan latauksessa. `tekstit.js?v=` kuten md.js:n.
- **Tusina** (käyttäjän päätös 19.11.2026, opas 2.3): pinossa enintään 12; tuleva teksti laskee pisimpään koskemattoman cellarin
  campihyllystöön (`e.luettu` + `e.laskeutui`, tietorivillä *laskeutui*). Uusi tapa tuoda teksti pinoon kutsuu `pinoonTuli()`a ja `tusina()`a.
- `luin/md.js`: Markdown-jäsennin ja suomen tavutus, yhteinen lukijalle ja Latomolle. Tekstin tunnus pinossa ja Postihuilussa
  on `tekstiTunnus()`, ei `slug()`: slug antaa jokaiselle kreikkalaiselle tai kyrilliselle otsikolle saman `osio`n (19.11.2026).
- `luin/latomo.html` (*Latomo*): tarkistaa md:n, täydentää etukentän, siirtää tekstin Luiniin tekstikannan siirrolla (`asetaSiirto()`, ennen `luin-tuonti`)
  tai antaa .md:n ladattavaksi. Ohje kirjoittajalle: `luin/latomo-ohje.html`.
- `luin/mika-on-markdown.md` (käyttäjän pyyntö 12.11.2026): *Mikä on Markdown* -teksti, avautuu lukimeen uuteen välilehteen
  Latomon johdannon alta (`luin.html#u=luin/mika-on-markdown.md`; ei ponnahdusta, Latomoa ei sotketa). Sisältö ja sävy ovat
  käyttäjän (myös iA Writerin, MarkTextin, Typoran ja Obsidianin esittely; poikkeus Latomon ohjeen iA Writer -linjaan).
  Verkko-osoitteet ovat paljaina sulkeissa, koska verkkolinkit ovat lukimessa oletuksena pois ja linkkiteksti näkyisi ilman osoitetta.
  Ei `luin/tekstit/`-kansioon (robots.txt estää sen).
- `luin/kayttoohje.html`: lukijan käyttöohje, **ei Latomon**. Kun lukijan käyttäjälle näkyvä toiminta muuttuu,
  tarkista käyttöohje.
- `luin/ohje.md`: kehittäjän opas, avautuu `luin.html#u=luin/ohje.md`. Lukulistassa siihen ei ole linkkiä (käyttäjän
  päätös: pois julkisivusta, ei piiloteta repossa).
- `luin/lisaosa/` (*Luin*, opas 7.5): selainlisäosa (MV3, Firefox, Firefox Android ja Chromium samalla
  koodilla, ei taustaskriptiä). Rajapinta Latomoon on vain `latomo.html#lisaosa`, `#md`, `#avaa` ja (0.8.0, *Lataa .md*) `#lataa` (`latomoon.js`; taustavälilehti sulkeutuu vain, jos `#lataa` lisää `body`yn `a[download]`-linkin, ja kirjoittaa odotuksen ajaksi Latomon kuittauksen `#lataa-tila` perään sulkeutumisesta):
  jos nimeät ne uudelleen, lisäosa lakkaa toimimasta. Postihuilu käyttää lisäksi `#laatikko-koodi` (attribuutti `data-ei-muistia`), `#laheta`, `#kk-tila`
  (alkaa *Ladottu postitettavaksi*; 0.4.0 odottaa *Lähetetty*) ja `#kk-virhe` sekä `#laatikko-virhe`; vanhat asennetut lisäosat käyttävät niitä yhä. Leikkeen etukentän korvamerkki `leikattu:` kytkee Latomon
  leikesiivouksen (`siivoa()`: yläindeksit, otsikkoriviton HTML-taulukko, tyhjät linkit, peräkkäiset alaviitemerkit yhdeksi `[^ryhma-N]`:ksi,
  käyttäjän pyyntö 12.11.2026 Wikipedian takia: yksi merkki avaa kaikki); muuta niitä yhdessä. Haetut alaviitteet
  (`[^viite-N]`, jatkorivit sisennettyinä ilman `>`:tä) ja SEP-sovite toistavat md.js:n `sivunViitteet()`:n ja
  kirjallisuusluettelon (`p.bib` vain kappaleista) sääntöjä: kun muutat niitä, aja `lisaosa-testi.js`. Lukevasta osasta käytetään
  sanaa *lukin* (*Poimi lukimeen*), tuotteesta *Luin* (käyttäjän linjaus 6.11.2026); asetusten Maalaus-valinta on *Lukimen* (16.11.2026). Koko nimistö
  (pääotsikko *Luin.*, alaotsikko *HTML*, virallinen *LUiN.HTML*, osoite, lyhyt muoto, työkalu *lukin*, lisäosa): opas 1.3.
  Lisäosan nimi on *Lukimeen* (juoksevassa tekstissä *lukimeen-lisäosa*, käyttäjän päätös 16.11.2026; 15.11. *Luin*) ja sen ensimmäinen
  nappi *Poimi lukimeen* (käyttäjän päätös 16.11.2026; 15.11. *Vie lukimeen*, ennen kumpikin *Lisää lukimeen*). Lisäosassa ne ovat 0.10.0:sta (käyttäjän
  pyyntö 16.11.2026, samalla pienet alkukirjaimet ja i-napin hakasulkeet). Versiota ei nosteta eikä zippejä anneta pyytämättä; sivuston
  uudet nimi- ja ulkoasulinjaukset viedään lisäosaan vasta silloin (kirjaa odottavat tähän). Ei odottavia (0.12.0, 18.11.2026: Postihuilu-napin kolmilinja, pienemmät sormireiät ja huilu 64°:ssa). Lisäosan versionumero ei yksin kerro koodia: sovitteita lisätään versiota nostamatta, joten paketoimaton asennus on sen hetken tilannekuva (18.11.2026 käyttäjän 0.11.0 oli ennen Perseus-sovitetta). Kauppaosoitteen
  `lis%C3%A4%C3%A4-lukimeen`, Firefoxin tunnisteen `lisaa-lukimeen@tusinasoft` ja `lisaa-lukimeen.xpi`:n saa jättää.
  Logos- ja Wikipedia-sovitteet (käyttäjän pyyntö 10.11.2026, opas 7.5) tekevät vain md.js:n jo ymmärtämää Markdownia,
  koska moottoria ei saanut muuttaa: Logoksen viittaukset ovat alaviitteitä, joiden tekijä–vuosi md.js linkittää kirjallisuus-
  luettelon osioon; Wikipedian wikilinkit ovat tekstissä tekstiä, ja loppuluettelossa ovat vain Pääartikkeli-, Katso myös- ja
  Lisätietoja-ohjausrivien artikkelit ja Katso myös -osio (käyttäjän valinta 10.11.2026: kaikki wikilinkit olivat liikaa). Alaviitemerkki `XLUINVIITE…X` on ei-ahne, jotta vierekkäiset merkit eivät sulaudu.
  marxists.org-, Wait But Why- ja OECS-sovitteet (käyttäjän pyyntö 11.11.2026, opas 7.5; OECS on psykologian SEP:n vastine)
  tekevät nekin vain md.js:n ymmärtämää Markdownia. OECS:n viittauksista poistetaan APA:n pilkku (*Mitchell 2009*) tarkoituksella:
  md.js linkittää vain SEP-muodon. oecs.mit.edu (PubPub) estää pilvikontin, joten sen runko on todentamatta; mitattu
  oecs.knowledgefutures.orgista. Kun muutat niitä tai `samanSivunViitteet()`:ä, aja `hakuteos-pesukone.js` (rikki ja epäilyttävä 0).
  Encyclopedia.com-sovite (käyttäjän pyyntö 13.11.2026, koko sivusto, opas 7.5) leikkaa aihesivulta yhden artikkelin (valinta,
  muuten lukukohta) ja kirjoittaa `teos`-kentän hakuteoksesta; Encyclopedia.com on md.js:n `KANTAJA`, jotta lisätietona näkyy hakuteos.
  IRED-sovite (IPA:n psykoanalyysin sanakirja FlippingBookina, 13.11.2026, opas 7.5) hakee hakusanan sivut sivuston
  hakukoneteksteistä; sovitteen regexeissä ei saa olla sisäkkäisiä valinnaisia kvanttoreita (jumitti välilehden).
  SAET-sovite (St Andrews Encyclopaedia of Theology, 14.11.2026, opas 7.5): viittaukset ovat jo SEP-muotoa; Attributions-osio
  (lähdepainos, käännökset) jää tekstiin, Copyright-rivi etukenttään.
  Gutenberg-sovite (14.11.2026, opas 7.5) leikkaa koko kirjan. `samanSivunViitteet()`:n kolmas parametri (jatkoehto) estää
  leipätekstin valumisen viitteeseen; ilman sitä käytös on ennallaan. Pesukone syöttää leikkeen Latomoon kuten lisäosa (ei `fill`).
  New Advent- ja CCEL-sovitteet (14.11.2026, opas 7.5) kokoavat lyhyen luvun sivulta koko kirjan (enintään 250 sivua samalta
  sivustolta; tietosuojasivu mainitsee). Molemmat ovat md.js:n `KANTAJA`-sivustoja, joten lisätietona on tekijä.
  Psyche–Aeon-sovite (14.11.2026, opas 7.5): ingressi jätetään pois tarkoituksella (kursiivina se olisi Luinissa alaotsikko ja
  lähdeviitteessä); anfangi `span.ld-dropcap` on osanvaihdon ainoa merkki.
  European Journal of Psychoanalysis -sovite (15.11.2026, opas 7.5): lohkot (Bibliography, Notes, Bio, Publication Date) tunnistetaan
  otsikkosanasta, koska numerointi vaihtelee; APA-pilkku pois kuten OECS:ssä. Etukentässä `tyyppi: tieteellinen`, `teos` ja `numero`
  ilman `sivusto`a (viite toistaisi lehden nimen); `article:published_time` on WordPressin aika, ei julkaisupäivä.
  LacusCurtius-sovite (16.11.2026, opas 7.5): Thayerin osoitteissa on `*` (`Isis_and_Osiris*/A.html`), joten niitä ei saa
  kirjoittaa `/* */`-kommenttiin (päätti kommentin). Kääntäjä vain varmasta etusivun lauseesta, muuten kenttä jää tyhjäksi.
  Pykälät ovat leikkeessä `<sup>`:na, jotka Latomo muuntaa (`^2^`); raakaleikkeestä md.js varoittaa niistä.
  Korpora.org/kant-sovite (16.11.2026, opas 7.5): teos kootaan sisällysluettelon ja sivujen `<title>`-nimiön mukaan; AA-sivunumerot
  ovat yläindeksejä `4:393` (pahvin vaatimus: näkyvinä merkkeinä). Kappaleraja sivunvaihdossa on mitattu arvaus (opas 7.5); älä muuta
  rajaa mittaamatta uudelleen.
  Wikisource kulkee `wikipedia()`-funktiossa (`ws`; opas 7.5): kun muutat sitä, aja sekä `--sarja wikipedia` (leikkeiden pitää
  pysyä ennallaan) että `--sarja wikisource`.
  Perseus-sovite (16.11.2026, opas 7.5) lukee teoksen TEI-XML:n XML:nä, ei `hae()`:lla (HTML-jäsennin rikkoo tyhjät `milestone`it).
  Kirjan nimi alkutekstin kielellä (`psKirja()`, käyttäjän päätökset 19.11.2026): Ilias Α–Ω ja Odysseia α–ω aakkosin, muu kreikka
  numeroin keraialla (*Republic Αʹ*, 6 = Ϛʹ; keraia U+0374, ei U+02B9, jota Literatassa ei ole), latina roomalaisin (*de Finibus I*),
  vain englanninkielinen *Book 1*. Ei englantilaista *Book*ia alkukieliseen tekstiin.
  Kreikkalaisen teoksen nimi kreikaksi (*Πολιτεία Αʹ*), kun leikkeessä on alkuteksti: Perseus antaa nimen vain englanniksi, joten
  nimet ovat taulukossa `PS_KREIKKA_NIMET` (NFC); puuttuva jää englanniksi. Lisää uusi teos taulukkoon.
  Valinnat ponnahdusikkunassa (käyttäjän pyyntö 19.11.2026, opas 7.5): kielet ja kirjat menevät leikkurille muuttujassa
  `__lukimeenPs` (ikkuna asettaa sen `executeScript`-funktiolla ennen tiedostoja), ja XML pysyy sivun muistissa (`__lukimeenPsXml`).
  Ilman valintoja leike on tavulleen sama kuin ennen; testi `perseus-valinnat-testi.js` (vertaa pesukoneen leikkeisiin).
  Kreikan sivulta lomitettu käännös (`psLomitus()`, käyttäjän pyyntö 16.11.2026): etukentän `ladonta: lomitettu käännös` tekee md.js:ssä
  lainauksista `blockquote.kaannos`ia; Latomo säilyttää avaimen tuntemattomana. Kohdistus viitenumeroista (`sup[data-ps]`), ei kappaleista.
  dhammatalks.org-sovite (16.11.2026, opas 7.5): kirjan kokoaminen nojaa etusivun `.book-toc`:hen; etukentän `alaotsikko`
  tulee vain sovitteelta (yleinen leike ei kirjoita sitä).
  Open Journal Systems -sovite (16.11.2026, opas 7.5; Problemos ja muut journals.vu.lt:n lehdet): tunnistus alustasta (generator ja
  `citation_*`, kokotekstin osoitteesta artikkelisivu), ei verkkotunnuksesta. Otsikko on kokotekstin `h1`, koska `citation_title` ja
  `citation_language` voivat olla toisella kielellä kuin artikkeli. VU:n alaviitemerkki viittaa tiedostonimeen (`1_X.html#footnote-016`),
  ei sivun ankkuriin. Pdf-artikkelista tiivistelmäleike metatiedoista. Testi myös `hakuteos-pesukone.js --sarja ojs`.
  VLE-sovite (vle.lt, 17.11.2026, opas 7.5) lukee sivun skriptin renderöimän rungon tai, ilman sitä, raa'an rungon ja `ajax.php`:n:
  pidä polut samana (ne antavat saman leikkeen). Hakuteospesukone ajaa vle.lt:n omat skriptit; testi `--sarja vle`.
  EUR-Lex-sovite (18.11.2026, opas 7.5): TXT/HTML-sivun XHTML jäsentyy text/html-tyyppinä rikki (tyhjä `<a id>` jää auki ja kopioituu),
  joten kääreiden purku alussa on tarpeen. EUR-Lex haastaa toistuvat haut (AWS WAF, myös curl): pesukoneen välimuistin voi täyttää
  Cellarista (`publications.europa.eu/resource/celex/<CELEX>`, sama asiakirja). Leikkeen etukentässä on avain `laji` (EUR-Lex, Find Case Law).
  PsychOpen-sovite (`psychopen()`) on lähetysjärjestyksessä `ojs()`:n edellä, koska PsychOpen on OJS ja `ojs()` tekisi siitä tiivistelmäleikkeen.
  Lisäosa on Chrome Web Storessa listaamattomana (opas 7.5; linkki kuvakkeineen Latomossa ja käyttöohjeessa): manifestin `description` enintään 132 merkkiä, ja kaupan
  zipistä poistetaan `browser_specific_settings`. Kun lisäosan `version` nousee ja muutos on yhdistetty, anna käyttäjälle heti
  pyytämättä molemmat zipit liitteenä (Firefoxin allekirjoitukseen ja Chrome Web Storeen, `manifest.json` juuressa), ei pakkausohjetta
  (käyttäjän pyyntö 12.11.2026). Kun käyttäjä pyytää uutta versiota, tuo aina zipit; älä koskaan tarjoa muuta päivitysreittiä
  (paketoimattoman lataus, `git pull`), ellei käytäntöä vaihdeta (käyttäjän vaatimus 19.11.2026). Firefoxiin Mozillan allekirjoittama XPI `luin/lisaa-lukimeen.xpi`
  (Latomon linkki; Mozillan kaupassa listaamaton): kun uusi versio allekirjoitetaan, korvaa tiedosto. Kaupan tietosuojaosoite on `luin/tietosuoja.html`: kun lisäosa alkaa
  lukea, säilyttää tai lähettää jotain uutta, päivitä sivu.
- `luin/kehitys/logo.js` tulostaa logon SVG:n, joka on kopioitu seitsemään sivuun (luin.html, Latomo, Latomon ohje,
  käyttöohje, tietosuoja, palaute, tuetut sivustot). Nimen tekstimuoto (aria-label, infolaatikko) on *LUiN.HTML*; tiedostonimet ja polut ovat `luin.html`.
  i:n piste on Lukimeen-salmiakki (käyttäjän pyyntö 18.11.2026, `glis()`:n `ontto`): `kuvake.svg`:n mittasuhteet, kärki versaalien
  korkeudella, ja ulkoreunan koillissärmä jatkuu glissandoviivan yläreunaksi. Viiva on ruostetta N:n vinoviivaan asti ja kulkee N:n
  takaa (`vaijeri`, käyttäjän luonnos 18.11.2026; `'eteen'` kokeiltu, toimii myös); N:n alta loppupisteeseen musteella. Loppupiste on
  yhä täytetty koverakylkinen. HTML-rivin kirjaimet ovat keskellä yläpuolisia paksuja runkoja (`hlinja`, käyttäjän pyynnöt 18.11.2026; mitat `logo.js`:ssä).
- Luinin kuvake on Lukimeen-lisäosan salmiakki (käyttäjän pyyntö 9.11.2026): `luin/kuvakkeet/` (välilehden SVG
  tumman teeman ruosteineen, 32 px Safarille, 180 px kotivalikkoon paperitaustalla), linkitetty samoihin viiteen
  sivuun. Neliöt ovat salmiakkia. Linkin esikatselu (`og:image`, absoluuttinen osoite) on tumman teeman väreillä, koska
  viestimet ovat useimmiten tummia (käyttäjän linjaus 9.11.2026): kaikilla sivuilla, myös Latomossa, leveä LUiN.HTML-logo
  (`jako-logo-tumma-4.png`, 1200 × 630, niin kapea, että keskineliöksi rajattunakin näkyy kokonaan; salmiakkineliö oli korttina
  liian korkea).
  Kun kuva muuttuu, vaihda tiedostonimi: viestimet pitävät vanhan osoitteen kuvan välimuistissa.
  Kaikki kuvakkeet, myös lisäosan, syntyvät `luin/kehitys/lisaosa-kuvakkeet.js`:stä; muuta ne yhdessä.
- `luin/palaute.html` (käyttäjän pyyntö 10.11.2026): viesti kehittäjälle (nimi ja sähköposti vapaaehtoisia, vain viesti pakollinen) reitille
  `POST /api/palaute`. Worker toimittaa viestin kehittäjän postilaatikkoon tekstinä (salaisuus `PALAUTE_LAATIKKO`, ei repoon),
  joten se kantautuu Luinin lukulistaan Postihuilun tapaan. Linkit: Asetusten alin pieni *palaute* (`?mista=asetukset`; pinosta pois käyttäjän pyynnöstä 12.11.2026), käyttöohjeen loppu,
  infolaatikon loppusanojen *pyyntöä* (`?mista=tietoa`; loppusanat ja allekirjoitus käyttäjän) ja Latomon plussan takana *kerro* (`?mista=`). Testi `palaute-testi.js`.
- Latomon lisäosarivin pikku plussa (käyttäjän pyyntö 10.11.2026) avaa sivustotoiveiden kappaleen (käyttäjän sanamuoto),
  jossa on linkki tuettujen sivustojen listaan `luin/sivustot.html` (omana sivunaan uudessa välilehdessä, ei ponnahdusta;
  käyttäjän pyyntö 13.11.2026, lista kasvaa). Kun leike.js saa uuden sovitteen, lisää sivusto sen listaan `#sivustot`,
  paitsi jos sivusto näyttää mainoksia eikä siellä ole lahjoitusnappia (alla *Rahoitushuomautus*). **Supersalmiakki** (Luinin logo eli
  `luin/kuvakkeet/kuvake.svg` ruosteella, omassa vasemmassa sarakkeessaan; nimet, selite ja kirjainotsikot alkavat samasta x:stä; käyttäjän pyynnöt 15. ja 16.11.2026) vain Luinin sertifioimille eli käyttäjän itse siedettävästi läpikäymille: SEP, Wikipedia, marxists.org,
  Ensyklopedia Logos. Älä lisää sitä kysymättä.
  **Mutrudollari** (käyttäjän kokeilu 17.11.2026; makaava S ja kaksi vaakaviivaa, samalla mutrusuu) samassa sarakkeessa: sivusto,
  jolle voi lahjoittaa mutta joka elää käytännössä mainoksista (`rahoitus: mainokset ja lahjoitukset`). Toistaiseksi vain selitteessä;
  älä merkitse sillä sivustoja kysymättä.
- Asetuskiekon SVG on luin.html:ssä kahdesti (`.ratas`-nappi lukulistassa, `#ratas-polku` lukijassa): pidä yhtenevinä.
- `android/luin/` (opas 7.6, käyttäjän pyyntö 16.11.2026): Android-kääre *Luin.* (`fi.tusinasaa.luin`). WebView lataa
  `luin.html`:n verkosta; `luin.html` tietää sovelluksesta vain `window.LuinApp`in olemassaolon (`NAPIT_AINA`: sivunkäännön tavat saa
  sammuttaa kaikki, koska napit kääntävät aina; käyttäjän pyyntö 16.11.2026), vaan silta `android/luin/src/main/assets/silta.js` kytkee
  sen (`window.LuinApp`). Silta nojaa tunnisteisiin `#lukija` (äänenvoimakkuusnapit ovat PageDown/PageUp vain sen näkyessä),
  `body`n taustaväriin, latomon `#md`:hen sekä siihen, että lataukset ovat `URL.createObjectURL`- ja `a.click()`-latauslinkkejä
  ja kopiointi `navigator.clipboard`ia: kun muutat niitä, aja `silta-testi.js`. **Kääreestä ei tehdä uutta versiota pyytämättä**
  (käyttäjän vaatimus 16.11.2026): älä muuta `android/luin/`:ta (myös `silta.js` on APK:n sisällä), älä nosta `versionCode`a
  äläkä rakenna `luin/luin.apk`:ta, ellei käyttäjä pyydä. Korjaa sovelluksen ongelmat `luin.html`:ssä, jonka sovellus lataa verkosta. Allekirjoitusavain `android/luin/julkinen.jks` on repossa tarkoituksella kuten
  soittimessa; älä vaihda sitä, tai päivitys vaatii poiston ja pino katoaa.
- `docs/viitteet/`: viitetyylin varanto (Teologian tyyli 2021, APA 7 -turvaverkko, sinetöity lisälehti, joka avataan
  vain todelliseen tarpeeseen). Etusija ja ratkaistut kysymykset ovat sen `README.md`:ssä. Kun muutat viitteen
  kokoamista (`kokoaViite`) tai lähdeviittausten linkitystä, tarkista varanto ja aja `node docs/viitteet/vertaa-luin.js`.
- Hegel-repon `pdf_to_markdown.py` kirjoittaa etukentän, jonka Latomo lukee (opas 7.1): lähde eriteltynä (`journal`,
  `volume`, `issue`, `pages`), ei `source`-avainta, koska Latomo lukisi sen verkko-osoitteeksi. Pidä avaimet yhteensopivina.

### Käyttäjän linjaukset

- **Nimet pienellä keskellä virkettä** (käyttäjän päätös 16.11.2026, opas 1.3): käyttäjälle näkyvässä suomenkielisessä tekstissä
  *luin*, *latomo*, *postihuilu*, *pino*, *laatikkolause*, *lukimeen-lisäosa*, *luin-linkki*. Iso alkukirjain vain virkkeen,
  otsikon, sivun nimen ja nappinimen alussa (*Luin.*, *Pinoon*, *Latomon ohje*), napin tai kentän nimen lainauksessa
  (`span.ui`: *Postihuilu*, *Arvo*, *Merkinnät*) ja englanninkielisessä tekstissä. Koodin kommentit ja kehittäjän opas jäivät.
- **Luin ei taivu käyttäjälle näkyvässä tekstissä** (käyttäjän päätös 16.11.2026, opas 1.3): taivutettuna *lukin* (*lukimen pino*,
  *lukimessa*, *lukimeen*, *lukinta*), ei *luinin*, *luinissa*, *luiniin*. *Luinin* vain vahvasti koko organisaation laajuisesta
  entiteetistä (*Luinin sertifioima*, Latomon *Luinin ystäviä ovat…*), ja silloin aina isolla, erisnimenä.
- **Pino ja cellarin campihyllystö** (käyttäjän päätökset 12.11. ja 15.11.2026): käyttöliittymässä lukulista on *Pino* ja luettujen
  näkymä *Cellarin campihyllystö* (kaikilla Luinin sivuilla ja lisäosassa; käyttäjän nimi 17.11.2026, c:llä tarkoituksella; samana päivänä ennen *Kellarin kampihyllystö*, ennen *Kellarin veivihyllystö* ja *Uumen*). Nimi on aina kokonainen, ei pelkkä
  *campihyllystö* (pituus on käyttäjän valinta: sana toistuu harvoin). Pino taipuu sisäpaikallissijoissa (*pinoon*, *pinossa*, *pinosta*,
  ei *pinolle*), samoin cellarin campihyllystö (*cellarin campihyllystöön*, *-ssä*, *-stä*). Koodin tunnisteet (`luin-lista`, `#lista`,
  `tila.arkisto`, reitti `#arkisto`) jäivät ennalleen. Uuteen käyttäjälle näkyvään tekstiin ei *lukulistaa*, *uumenta*, *hyllyä*,
  *pölyhyllyä* eikä *arkistohyllyä* (*cellarin campihyllystö* on käyttäjän nimeämä poikkeus).
- **Cellarin campihyllystö ja valinta** (käyttäjän pyyntö 10.11.2026): luetuksi merkitty teksti jää `luin-lista`an lipulla
  `e.luettu` (aika), ja `#arkisto` vain suodattaa, joten mitään ei kopioida. Pinossa ei ole Postihuilua, ohjeita eikä
  Latomoa (käyttäjän rajaus; poikkeus nimikkeen valikon *Muuta metatietoja* ja *Uusi laitos*, alla); linkki cellarin campihyllystöön on pinon alalaidassa himmeänä ja vain, kun siellä on jotain. Sanat
  *Luin.* ja *Poimi cellarin campihyllystöstä.* (15.11.2026, ennen *Poimi uumenesta.* ja *Puhalla pölyt.*) ovat käyttäjän. Valinnan merkki on asetusten kytkimen salmiakki (ei ruutua: "ei Windows 95").
- **Ö-mappien mappi ö** (käyttäjän pyyntö ja nimi 17.11.2026, ensin *ö-mappien ö-mappi*; `#omappi`, opas 2.4): taipuu
  *ö-mappien mappiin ö*, *-mapissa ö*, *-mapista ö* (ö aina viimeisenä). Cellarin campihyllystön nimikkeen ja valittujen
  valikossa pinoon noston rinnalla *Siirrä ö-mappien mappiin ö.*, sieltä *Palauta cellarin campihyllystöön.* `e.omappi` (aika)
  lisätään, `e.luettu` jää; ö-mapin teksti ei näy pinossa eikä kellarissa. Linkki (`#om-linkki`) on kellarin alalaidassa vain,
  kun siellä on jotain: ääripäiden ö:t ovat mappisulkimen renkaita, alleviivaus renkaan alakärjestä toiseen, ei nuolta.
  Linkkien tekstit ovat aina illatiivissa (käyttäjän korjaus 17.11.2026): *cellarin campihyllystöön*, *ö-mappien mappiin ö*.
  Rengas (käyttäjän pyynnöt 17.11.2026, kolmas kierros): x-akselilla litistetty soikio (.81), viivan sisäreunan laki versaalien
  korkeudella, alakärki 3,8 px perusviivan alla ja alleviivauksen (svg, .85 px) alareuna tasan siinä; täytetty muoto, viiva
  kyljissä paksumpi ja alhaalla alleviivauksen paksuinen; yhdysviiva piirretty versaalien ja renkaan keskikohtien puoliväliin; laella leveä viisto irvistysrako (ulkoreunat lähempänä kuin sisäreunat); ö:n pisteet samanlaisia pieniä
  rakorenkaita. Polut ja mitat tuottaa `luin/kehitys/orengas.js`; muuta parametreja siellä, älä polkuja käsin. Ö-mapin
  otsikossa molemmat ö:t ovat samoja renkaita ilman alleviivausta (`OTS_OMAPPI`, pienennettynä kuten otsikon kampi:
  keskikohta kammen navan korkeudella, laki versaalikorkeudella, viimeinen .8 em:n päässä; nimi `aria-label`issa). Ö-mapissa
  ei ole *Takaisin pinoon* -tekstiä eikä pinomerkkiä (logo riittää); vasemmassa alakulmassa kellarilinkki peilattuna (`#ark-paluu`:
  nuoli vasemmalle, kampi `scaleX(-1)` tekstin oikealla). Testi `omappi-testi.js`.
- **Kellarin kampi** (käyttäjän pyynnöt 16.–17.11.2026): kellarilinkin ulkokaari kääntyy alhaalta suoraksi nuolen varreksi;
  kellarin otsikon perässä (`KAMPI`) sama kampi otsikon harmaalla ilman vartta, ja kaari jatkuu alhaalta kehää 70° oikealle
  ylös (ensin 40°). Pinon otsikon perässä samalla idealla pinomerkki (`PINOM`). Molemmat hyvin pieninä (kampi 1,05 em, pinomerkki 1,15 em
  leveä), rako 1 em viimeisestä kirjaimesta, keskikohta samalla korkeudella perusviivasta kuin kellarilinkin kammen napa (testi mittaa).
  Navan renkaan pää on leikattu kammen suuntaisesti molemmissa kammissa (käyttäjän pyyntö 17.11.2026: vaakasuora pää näytti
  typerältä): rengas jatkuu 75°:een ja `clipPath` (`KAMPI_LEIKKAUS`, evenodd-lovi) leikkaa sen idän pisteen kautta.
  Nimikkeen valikkonappi on yhä `button.jako` (latomo-testi ja ulkoklikkauksen poikkeus nojaavat siihen). Zip-vienti
  (`vieZip()`) jäsentää avaamattoman tekstin erilliseen dokumenttiin (`virtuaaliNyt()`) ja käyttää `merkinnatMd()`:tä: pidä
  tulos samana kuin tekstin oma vienti.
- **Pinomerkki** (käyttäjän valinta 12.11.2026, mietintämyssyn luonnos *Ulkoneva*): paluu pinoon on kolmen kirjan pino
  kaikilla Luinin sivuilla, ei pirtti eikä kotimerkki. Sama polku kahdeksassa paikassa; muuta ne yhdessä. Koko 40 px
  (suurennettu 12.11.2026 kahdesti, ennen 28 px ja 22 px; musteen paikat ennallaan: alareuna logon kärjen tasolla, vasen laita `--v-laita`), viiva `stroke-width: .9` eli 1,05 px. Koodin tunnisteet (`.koti`,
  `a.kotimerkki`, `#ark-koti`) jäivät. Käyttöohjeen tekstinsisäinen `.ik.koti` on tekstin kokoinen.
- **Pinomerkin paikka** (käyttäjän pyynnöt 12.11.2026): yläoikealla (cellarin campihyllystö ja alasivut: Latomo, ohjeet, palaute,
  tietosuoja) vaakapaikka on sama kaikkialla eli pinon asetuskiekon vasemmalla puolella, ja musteen alareuna on logon
  loppupisteen alakärjen tasolla kuten ennen pirtin lattiaviiva (ei kiekon keskilinjalla). Logot ovat eri kokoisia,
  joten pystypaikka eroaa cellarin campihyllystön ja alasivujen välillä. Navin yläpalkissa merkki on vasemmalla palkin keskilinjalla.
- **Logo on aina linkki pinoon** (käyttäjän pyyntö 12.11.2026): luin.html:ssä `a.logo-linkki`, alasivuilla `a.koti`. Cellarin campihyllystössä pinomerkin vasemmalla
  on versaalilinkki *Takaisin pinoon* (`#ark-takaisin`, sama osoite kuin merkillä; ennen *Takaisin ylihyllyyn*) ja campihyllystölinkki pinon alalaidassa on versaalia. Ö-mappien mapissa ö ei paluutekstiä eikä merkkiä (yllä).
- **Ei kaveriversiota** eikä sen mainostusta. Käyttöönotto (oma worker, repo, Dropbox) on myöhempi kysymys (opas 9).
- **Jakaminen on erittäin sivuosassa**: vain lukulistan nimikkeen pieni valikkonappi (lähdeviite, linkki, *Lataa md*,
  tiedot ja laitos, *Luin.*, poisto; kolme salmiakkia, ennen jakomerkki). *Luin.* on molemmissa salmiakkivalikoissa
  toiseksi alimpana, vain poisto sen alla (käyttäjän pyyntö 16.11.2026).
- **Linkitä tiedostoon** (käyttäjän pyyntö 16.11.2026, `kysyTiedosto()`): linkittömällä tekstillä *Kopioi linkin* paikalla.
  Hyväksyy julkisen .md-osoitteen (Dropbox muunnetaan kuten Latomossa), jos leipäteksti on sama kuin pinossa
  (`leipaMuuttui()`, sama sääntö kuin tietojen säädössä), ja kirjoittaa sen etukentän `osoite:`-riviksi, jotta
  *Muuta metatietoja* säilyttää sen. Testi `linkki-testi.js`.
- **Laatikon ohi napautus vain sulkee sen** (käyttäjän vaatimus 16.11.2026, koko Luin, `nielaise()`): auki olevan ponnahduksen
  tai infolaatikon vihjeen ulkopuolinen napautus ei laukaise linkkiä, nappia eikä sivunkääntöä. Uusi ohimenevä laatikko
  käyttää samaa document-tason kaappauskuuntelijaa. Vain `isTrusted`-napautus nielaistaan (ohjelman `a.click()` lataa
  tiedostot ponnahduksen ollessa auki). Testi `ulkoklikkaus-testi.js`.
- **Tiedot ja uusi laitos** (käyttäjän pyyntö ja nimi 15.11.2026, opas 7.1, `tuoPinosta()`): *Muuta metatietoja* lukitsee
  leipätekstin (merkinnät eivät saa voida irrota muualta kuin otsikkolohkosta); *Uusi laitos* antaa muokata ja kysyy
  tallennettaessa: toinen laitos merkintöineen, ilman merkintöjä vai korvaava. Merkinnät siirretään lohkot rinnastamalla
  (`kohdista()`), ei pelkällä katkelmahaulla (osui naapurikappaleeseen). **Pino pysyy pinona**: laitos näkyy vain tietorivin
  *2. laitos* -sanoina, ei kansioita, ryhmiä eikä erikoisvärejä (käyttäjän linjaus 15.11.2026). Testi `laitos-testi.js`. Lukutietoja ei lisätä viitteeseen pakolla (kytkin `aset.viiteLisa`, oletus pois).
- **Luokittelu ja kellarin järjestys** (käyttäjän pyyntö 17.11.2026, opas 2.5, selvitys `docs/mietintamyssy/luin-kellarin-jarjestys.md`):
  pino pysyy tulojärjestyksessä eikä näytä luokittelua; järjestykset ja välikortit (`li.valiots`) vain cellarin campihyllystössä.
  Nimikkeen kentät (`asiasanat`, `ajoitus`, `kasikirja`) ovat totuus ja etukentän `asiasanat:`/`ajoitus:` niiden peili: avaimeton
  tuonti ei pyyhi niitä (`lkMdsta(…, false)`), vain *Muuta metatietoja* ja korvaava laitos (`tosi`, etukenttä kirjoitetaan ennen
  Latomoon siirtoa). Käsikirjasto ei mene etukenttään. Ehdotukset eivät lisää mitään ilman napautusta, eikä luokittelemattomista
  muistuteta (käyttäjän vaatimus: ei pelillistä). **Käsikirja ei voi tulla pinoon** (käyttäjän päätös 17.11.2026): se on aina cellarin
  campihyllystössä ylimpänä omana *Käsikirjasto*-välikorttinaan kaikissa järjestyksissä, ei Poimi- eikä ö-mappitoimintoa, tuonti ja
  Postihuilu eivät nosta sitä; sijainti aina `kellarissa()`/`pinossa()`/`omapissa()`-funktioilla, ei suoraan `e.luettu`sta. Sanat *asiasana*, *ajoitus*, *käsikirjasto*, *luokittele*, *järjestys* (ei *tagi*,
  *kategoria*, *hylly*). Testit `luokittelu-testi.js` ja `linkki-testi.js` (valikon järjestys).
- **Rahoitushuomautus** (käyttäjän säännöt 15.11.2026, opas 3.2 ja 7.5): sovitteiden sivustoja ei poisteta (Luin on myös
  itsenäisen käytön väline), mutta leike.js:n `RAHOITUS` kirjoittaa etukenttään `rahoitus:` ja md.js tekee tekstin alkuun
  hakasulkeisen yläotsakkeen. 1) Mainokset ilman lahjoitusnappia: sivusto piiloon tuettujen listasta, huomautus mainos-
  rahoituksesta. 2) Mainokset ja lahjoitus: ensin *Huom. huom.!*, sitten kehotus harkita lahjoitusta. 3) Lahjoitukset ilman
  mainoksia: vähemmän moralisoiva toteamus. Vain sovitesivustoille, ei yleiselle leikkeelle eikä Bloggerille. Uudelle
  sovitteelle tarkista sivuston mainokset ja lahjoitusmahdollisuus.
- **Lisätieto** (käyttäjän hierarkia 12.11.2026, opas 7.3): nimen jälkeinen rivi pinossa ja jakolinkin esikatselussa on
  `LuinMD.lisatieto()`: verkkojulkaisun sivusto (ei tekijä) › alaotsikko › kirjan osan teos › tekijä. Gutenbergin kaltainen
  kantajasivusto ei ole julkaisu. Pidä pino ja jakolinkki samassa funktiossa. Julkaisupäivä pinossa on avoin kysymys.
- **Jakolinkki** (käyttäjän pyyntö 12.11.2026, opas 7.3): *Kopioi linkki* antaa oman workerin `luin` (`worker/luin/`, ei
  `tusinasaa-worker`: käyttäjän valinta) sivun `?t=&u=`, jotta esikatselussa näkyy tekstin nimi. Sivulla ei saa olla `og:url`ia, meta refreshiä eikä 302:ta: hakijat seuraisivat niitä
  `luin.html`:ään ja näyttäisivät taas *Luin.*. Julkaisu: `npx -y wrangler@3.114.17 deploy --config worker/luin/wrangler.toml`.
- **Ei sanaa *lukulaite*** käyttäjälle näkyvään tekstiin (käyttäjän päätös 15.11.2026: Luin ei ole laite eikä e-lukijan
  kilpailija). Virallinen kuvaus on *internetin lukemisen tyyssija* (infolaatikko, käyttöohje, `og:description`, jakoworker).
  i-nappien kehys on hakasulkeet, ei salmiakki (pinon tietoa, Postihuilu, laatikkolause Luinissa ja Latomossa; salmiakit
  ovat täällä valintoja, luettelomerkkejä ja kunniamerkkejä). Lisäosan ponnahduksessa hakasulkeet ovat 0.10.0:sta, ja sen valintaruudut ovat asetusten kytkimen salmiakkeja (16.11.2026).
- **Sysi, TCF-valkaisu ja sähköpapyrosointi** (käyttäjän pyynnöt 17.11.2026, `aset.kontrasti`, `SAHKOPAPERI`): vaaleassa
  kontrastikytkin (*TCF-valkaisu*) muuttaa **vain taustan** #fff:ksi ja musteen täysmustaksi, ei muita sävyjä (hidas
  sähköpaperitila toistaa harmaat, sotkuinen on vain tausta). Tummassa vastaava kytkin on *Sysi* (`aset.sysi`, 20.11.2026, korvasi *Mustimman*,
  joka muutti vain taustan): tausta #000, tekstivärit himmeämpiä ja lämpimämpiä, viivat himmeämpiä kuin tummassa. Ei yötila eikä
  meripihkaa. Käyttäjän kokeilut 20.11.2026: muste-kontrasti 5 ja 8,4 liian sysi, 13 liian lähellä Mustinta; nyt keskitie 10,5
  (Mustin 15,9). Sivuvärit ovat musteesta kauempana kuin tummassa (käyttäjä 20.11.2026: lomitetun käännöksen englanti ei erottunut kreikasta); älä kavenna eroja. Ei oranssiin eikä punaiseen. Arvot CSS:n kommentissa. TCF-vihje (käyttäjän sanat; käyttäjän pyynnöt 20.11.2026): **vain hiirellä**
  viipymästä (1 s), ja hiiren lähtö kytkimeltä sulkee heti; kosketusnäytöllä ei vihjettä lainkaan (liikaa häiriötä; *OK.*-kysymys kokeiltiin). *Sähköpapyrosoi asetukset*
  on **kertanappi, ei kytkin** eikä muista mitään: kun asetukset ovat taulun mukaiset, samassa paikassa on *Oletusasetukset*
  (`laitteenOletus()`, vain taulun avaimet). Ohut suorakaidenappi (ei enää hakasulkeita), otsikkoa pienempi ja `--huomio`n värinen; painallus tanssittaa **vain napin
  alaa kehineen**: pelkkä musta (`mustin`, ei Sysi) ja TCF vuorotellen, ei tavallisten teemojen välisävyjä (käyttäjä 17.11.2026), 0,7 s vaihe;
  neljännessä jää lopputilan oikea väri (papyrosointi: musta, TCF, musta, TCF lähtöteemasta riippumatta), asetukset
  vaihtuvat siinä ja kuittaus jää `PAPYRUS_MS` (2,2 s). Tanssin mustassa teksti ja kehä ovat poikkeuksellisesti #fff. Tämä on käyttäjän tilaama tarkoituksellinen poikkeus
  animaatiokiellosta (sähköpaperin virkistysvitsi); koko näytön valoshowta käyttäjä ei halunnut. Taulun sisältö on käyttäjän
  (vaalea, TCF, sivunkääntö, reuna ja nuolinapit, ei pyyhkäisyä; laitteen painikkeet lisätty 20.11.2026). Testi `sahkopaperi-testi.js`.
- **Sysin** (käyttäjän pyyntö ja nimi 20.11.2026, `aset.sysin`, Sysin oikealla): Sysin ensimmäisen kokeilun yölukutila,
  jota käyttäjä piti hämäryyden ylärajana (muste 5,0: **ei himmeämmäksi kysymättä**). Sivuvärien Y-suhde musteeseen kuten Sysissä
  (erottuvuus), ruoste poikkeuksena .42, ettei näytä harmaalta. Arvot CSS:n kommentissa. CLARVS sulkee
  Sysin (ja Sysinin) pois. **Sysin on Sysin alakytkin** (käyttäjän pyyntö 20.11.2026): vielä pienempi, näkyvissä vain Sysin ollessa valittuna
  (paikka varataan `visibility`llä, ei hyppelyä); arvo säilyy Sysin alla. Papyrosointinappi on Sysinissäkin tavallinen (käyttäjä
  20.11.2026: Oletusasetukset-poikkeus vain hämäsi, ja muut asetukset ovat yhtä kirkkaita).
- **Teeman alakytkimet** (käyttäjän säännöt 20.11.2026, `yksiPaletti()`, `av 10`): kumpikin teema muistaa omat alakytkimensä
  (`aset.kontrasti` = TCF, `aset.sysi` = Sysi, `aset.sysin`), ja teemaan palatessa ne palaavat. **Toisen teeman alakytkimet eivät
  näy lainkaan** (`.piilossa`, paikka varattuna): vaaleassa ei Sysiä eikä Sysiniä, tummassa ei TCF:ää. CLARVS on molempien yhteinen
  ja pitää kutinsa teemaa vaihdettaessa; se **peittää** TCF:n ja Sysin muistia pyyhkimättä, joten sen sammutus palauttaa edellisen
  (esim. Sysinin). TCF:n tai Sysin napautus CLARVSin alla kytkee ne päälle ja CLARVSin pois.
- **CLĀRVS · ET · DISTĪNCTVS** (käyttäjän pyyntö ja nimi 20.11.2026, makronit anakronistisesti saman päivän pyynnöstä; Literatassa
  ei ole valmiita Ā- ja Ī-merkkejä, joten ne ovat yhdistyvällä makronilla U+0304, `aset.clarus`): korkea kontrasti samana valintana
  kummassakin teemassa (valkoinen/musta). Välisävyjä enintään kaksi: yksi harmaa ja ruoste (okra = muste, valo = paperi,
  valitsemattomilla ei himmennystä); älä lisää kolmatta. Sulkee Sysin/TCF:n pois. **Teeman ruudukko, kiinteät paikat, ei hyppelyä**
  (`.teema-ruudukko`): Vaalea ja alla TCF, Tumma ja alla Sysi (Tumma TCF:n oikealla), alimmalla rivillä vasemmassa laidassa
  hyvin leveästi harvennettu CLARVS. Alakytkimet Sivunkäännön lisäkytkimiä pienempinä (asiantuntijan valintoja). Himmeys:
  valitsematon CLARVS (.6) > oman teeman valitsematon alakytkin (`.ala`, .42). Nimi Descartesin nimiösivun tapaan (V eikä U), interpunkti väleineen
  (ilman välejä ahdas; käyttäjän järjestys: väleittä, väleineen, pelkät välit).
- **Viitenumerot näkyvät aina**; niitä ei saa asetuksista pois.
- **Sivunkäännön tavat** (opas 4): *Reunanapautus*, *Pyyhkäisy*, *Nuolinapit* (`sivunapit`, ennen *Painikkeet*) ja pahnan pohjimmaisena
  *Laitteen painikkeet* (`sivuLaite`, käyttäjän pyyntö 20.11.2026; näppäimistö, sivunkääntönäppäimet, äänenvoimakkuus; pois ollessaan
  näppäimet eivät käännä, äänenvoimakkuutta ei estetä). Pakollinen viimeinen tapa vain kolmesta ensimmäisestä (`PAKKOTAVAT`), koska
  selaimessa ei tiedetä, onko laitteessa painikkeita; Android-sovelluksessa myös laitteen painikkeet kelpaavat. Lista on tiiviimpi
  (25 px, .76rem) kuin muut nipukat, jottei neljä riviä veny.
- **Kohdat yläindekseistä** (käyttäjän pyyntö 18.11.2026, opas 3.2): etukentän `kohdat: yläindeksit` (Perseus-sovite) tekee
  yläindeksinumeroista aikajanan kohtia ja vedon pysäkkejä (`res.kohdat`, `nyt.kohdat`), **ei otsikoita eikä `toc`-rivejä**:
  `toc`in varassa ovat Sisälmys, merkintöjen osiot ja paikannin. Perseuksessa book on luku ja section kohta; kirjaimellisen
  kohdan numero-osa on osio (Valtio: Stephanus-sivu 327, kohta 327a; käyttäjän kokeilu 18.11.2026). Ciceron luvut (caput) eivät
  ole tasoa: viitenumeron tasot luetaan teoksen `refsDecl`istä.
  Kohtanumero on `sup.kohta` ja harmaa (`--harmaa`, käyttäjän päätös 19.11.2026; okra on merkintöjen, ruoste napautettavan).
- **Kielet** (käyttäjän pyyntö 19.11.2026, `aset.lomitus`, opas 3.2): lomitetussa käännöksessä molemmat, alkuteksti tai käännös
  pelkällä CSS-luokalla; piilotettu kieli pysyy DOMissa (kohdat, merkinnät ja aikajana eivät muutu). Älä poista piilotettua tekstiä
  DOMista äläkä jäsennä tekstiä tilan mukaan uudelleen. `asettele()`:n `art.className` pyyhkii luokan, siksi `lomitusLuokat()`.
  *Molemmat* on rinnakkain (`div.pari`, opas 3.2) aina, kun kaksi vähintään `RINN_MIN` em:n palstaa mahtuvat, myös sivutettuna ja
  kosketusnäytöllä (käyttäjän pyyntö 19.11.2026: mahdollisimman usein, palstat saavat kaventua). Alkuteksti kelluu, pari on `flow-root`,
  ei reunushuomioita; sivutettuna `parienAlut()` pitää parin puolet samalla sivulla. Kellutus korvasi absoluuttisen alkutekstin ja `rinnakkainKorkeudet()`in.
- **Värit eivät ole soittimen**: ruskea, okra, ruoste, paperi ja muste, kuusi väriä teemaa kohti. Sähköpaperi: ei varjoja,
  ei läpikuultavuutta, ei animaatioita. **Ruoste = napautettava.** Tarkoituksellinen poikkeus: lähdeviittauslinkki
  `a.lahde` on `--harmaa` ja sillä on `--viiva`-alleviivaus.
- **Latomon `--harmaa` poikkeaa tarkoituksella** muista Luinin sivuista (Latomon tekstistä suuri osa on pientä harmaata,
  joka näytti ruskealta ruskealla). luin.html, käyttöohje ja Latomon ohje pitävät omat arvonsa; älä yhtenäistä kysymättä.
- **"Vinoneliöestetiikkaa, ei palluraestetiikkaa."** Koverakylkiset salmiakit, antiikva (Literata, `luin/fontit/`, OFL),
  klassinen tyyli. Kirjasinvalinta poistettiin: groteski palaa vain, jos koko ohjelman ulkoasu sovitetaan siihen.
  Tarkoituksellinen poikkeus: sanaselityksen merkin (`IK_SANASTO`) linssi on pyöreä (käyttäjän syrjähyppy 5.11.2026).
  Ohjelman kuoressa ei ole kreikkaa (käyttäjän päätös 6.11.2026; marginaali on *mikro, meso, makro*), paitsi sanaselityksessä
  (käyttäjän kompromissi 12.11.2026: lingua francat vuodelta 0 ja 2026): merkkien lambda ja linssi-epsilon sekä otsikot λόγος
  ja ἔτυμον (12.11.2026 kokeiltavana majuskeleina ΛΟΓΟΣ, ΕΤΥΜΟΝ). Kreikka tulee erillisistä osajoukoista `literata-kreikka*.woff2` (U+0370–03FF) ja
  `literata-kreikka-laaja*.woff2` (polytoninen U+1F00–1FFF), koska päätiedostoissa ei ole kreikkaa.
- **Suljettu lukuympäristö ilman häiriötekijöitä**: verkkolinkit ovat oletuksena pois (`aset.verkkolinkit`), myös
  kirjallisuusluettelon DOI-linkit. Kuvat näkyvät linkkeinä, koska lukija ei hae mitään kolmannelta osapuolelta.
- **Sanat ovat käyttäjän**: *kirjaus* (alleviivaukseen liitetty muistiinpano; käyttöliittymässä aina tämä sana),
  *Sisälmys* eikä *Sisällys* tai *sisällysluettelo* (käyttäjän päätös 15.11.2026: ensisijainen nimi navissa, tekstin alun otsikossa ja ohjeiden otsikoissa; asetuksissa *Sisällysluettelo*, koska *Sisälmys* ei toimi yksin ilman kontekstia; ohjeiden juoksevassa tekstissä *sisällysluettelo* käy vaihteluna, ja vieraan sivuston sisällysluettelo on sisällysluettelo). Peruutusnappi on *älä!* (pienellä, huutomerkillä, kursiivi,
  `--harmaa`), ei *Ei*. Latomon tyhjennyksen vahvistus on pelkkä *Oletko aivan varma?* ilman lainausmerkkejä ja sanojan
  nimeä (Lasse Lehtinen -vitsit poistettiin käyttäjän pyynnöstä 15.11.2026; älä palauta). Latomon pääpainike on *Avaa lukimessa* (12.11.2026; ennen *Avaa Luinissa*).
- **iA Writer -pohjasta (`luin/ia-writer/`) luovuttiin**, koska se ei toiminut käyttäjän iA Writerissä: älä tarjoa
  sitä ratkaisuksi äläkä kehitä sitä. Tavoite on vain, että sama md näyttää iA Writerin oletusesikatselussa
  järkevältä. Latomon ohje ei mainosta iA Writeria eikä neuvo sen käyttöä; se mainitaan vain, kun se vastaa
  kysymykseen *miksi juuri näin*.
- **Ensikäytön oletukset** (käyttäjän päätös 7.11.2026): aikajanalla kosketusnäytöllä Osiot, hiirellä Kohdat (päätös 19.11.2026, `av 9`); kosketusnäytöllä ja sähköpaperilla sivunkääntö ja kaikki sen tavat (myös painikkeet) päällä, hiirellä vieritys (`sivutusOletus()`). Sähköpaperin tunnistusta ei ole todennettu oikealla laitteella.
- **Mikro-marginaali on myös pidempi rivi** (18.11.2026, `MITTA`, `mitta()`, CSS `--mitta`): 40 em, Meso ja Makro 33 em. Siksi Marginaali-rivi näkyy aina. Vierityksen reunushuomiot ratkaistaan 33 em:llä, ja Mikro pitenee niiden kanssa vain jäljelle jäävään tilaan. Uusi mittaa käyttävä laskelma käyttää `mitta()`a tai `asettele()`n `mi`:tä, ei kiinteää 33:a.
- **Kirjasinkoon oletus kosketusnäytöllä riippuu ruudusta** (16.11.2026, `oletusKoko()`, käyttäjän havainto Note Airilla): kunnes käyttäjä säätää kokoa (`aset.kokoKasin`), `aset.koko` lasketaan joka latauksella. Uusi koon muuttaja asettaa `kokoKasin = 1`. Käyttöliittymän (palkit, napit) koko on laitteen tiheyden asia, ei tämän.
- Uusi oletus koskee vain ensikäyttöä. Tallennettuja asetuksia muutetaan vain kerran, `aset.av`-numeron avulla. Tallennetut asetukset ohittavat OLETUKSEN, joten päätetty oletus ei näy vanhalla käyttäjällä ilman `av`-siirtoa (7.11.2026 päätökset jäivät ilman, korjattu `av 7`:llä 8.11.2026: sivunkäännön kaikki tavat, sisennys, ei sukkelaa alleviivausta, aikajanan kaikki tasot; sivutuksen valintaa ei kosketa). Muuttaessasi oletusta nosta `av` ja siirrä.

### Markdown-konventiot (opas 3)

- **Käyttäjän omat konventiot menevät yleisen Markdownin edelle**: otsikkolohko (`#`, kursiivi alaotsikko, tietorivit
  `<br>`:llä), `luku-2-1`-tunnisteet, numeroimaton `###` versaalikursiivina (`.caps`), alaviitteet sivuhuomioiksi,
  kirjallisuusluettelo `p.bib`:ksi. Lainausmerkkejä ei muuteta. Muuten noudatetaan iA Writerin protokollaa;
  Pandocin `^[…]` toimii yhä.
- Lähdeviittaus- ja lyhennelinkit (opas 3.4) syntyvät md.js:n omasta päättelystä (`viittaukset()`) **vain varmalla
  yhteydellä**. Ei BibTeX:ää, Pandocia tms. (käyttäjän vaatimus). Lyhenteille ei tehdä merkintöjä tiedostoon. Linkit
  ovat vain alaviitteissä, eikä selitysosiosta linkitetä edelleen (minimalismi). Poikkeus leipätekstissä:
  sulkujen tekijä–vuosi ja kertova *Kahn (1979)* linkittyvät, kun luettelossa on niille tasan yksi kohta (SEP; käyttäjän
  päätös 6.11.2026 ja linjaus 7.11.2026: sulut eivät ole alaviitteitä, linkkejä saa olla kuin tavallisessa lukulaitteessa,
  tappion riski hyvin pieni; `linkitaHaka()`, opas 3.4). Kun muutat viittauksia tai luettelon tunnistusta, aja
  `sep-pesukone.js`: väärä kohde ja rikki pitää olla 0.
- Regexien `\b` ei toimi ä:n perässä; käytä `(?![\p{L}\p{N}])`.
- **`md.js?v=<SHA-1:n alku>`**: luin.html ja Latomo lataavat md.js:n versiotunnisteella, koska Pages antaa `max-age=600`
  ja käyttäjän selain piti vanhan version. Kun muutat md.js:ää, päivitä tunniste (`md-testi.js` huomauttaa unohduksesta):
  `V=$(sha1sum luin/md.js | cut -c1-8); sed -i -E "s/md\.js\?v=[0-9a-f]+/md.js?v=$V/" luin.html luin/latomo.html`

### Lukija (opas 4)

- **Mobiili = kosketusnäyttö** `(pointer: coarse), (hover: none)`; hiiri on työpöytä myös kapeassa ikkunassa (leveysehdolla palkit
  piiloutuivat työpöydällä). `hover: none` on välttämätön: Booxin Firefox ei täytä `pointer: coarse`a (Palmalla lukijan
  yläpalkki näkyi, 8.11.2026). Pidä ehto samana kaikissa kolmessa kohdassa (CSS `--v-laita`, `sivutusOletus()`, `MOBIILI`).
- **Napin avaavat alueet mobiilissa** (käyttäjän pyyntö 12.11.2026, `ylaKaista()` ja `tyhjaKohta()`): turvakaistan alla yläpalkin
  korkuinen alue (`--yla`) on kokonaan napautusherkkä, kun palkit ovat kiinni, ja menee tekstin, linkkien ja reunanapautuksen
  edelle (ainoa, joka syrjäyttää reunanapautuksen). Lisäksi ilmeisen tyhjän kohdan napautus avaa navin (ei tekstiä, sivuhuomiota,
  kuvaa tai taulukkoa 1,5 em:n, väh. 28 px:n sisällä; rivien omat laatikot, joten lyhyen rivin oikea puoli on tyhjää); reunanapautus
  (jos päällä) on laitojen ensisijainen toiminto. Alue ei ole herkkä palkkien, paneelin, ponnahduksen, valinnan, maalauksen eikä
  palkkioppaan ollessa auki. Vain kosketus: hiirellä tyhjä kohta ei avaa ("hiirellä kauhea tapa").
- **Tekstin napautus ei avaa palkkeja** (ne avautuivat vahingossa). Vain alakaistan tai alapalkin napautus avaa ja
  sulkee ne; vieritys ja sivunkääntö eivät vaikuta, eikä keskiklikkaus työpöydällä avaa ("hiirellä kauhea tapa").
  Alapalkissa ei ole natsaa eikä osion nimeä.
- Navinäkymän merkit ovat kahdessa linjassa musteesta mitattuina (`--v-laita` / `--o-laita`, opas 4.4). Laidat ovat
  kokonaislukuja, koska Chromium pyöristää SVG:n ja reunuksen paikan kokonaiseen CSS-pikseliin.
- **Verho** (`verhoAuki()`: navi, Asetukset tai navin laatikko auki): sen takana eivät toimi tekstin napautus,
  reunanapautus, pyyhkäisy, valinta eikä alleviivaus, eikä rulla käännä sivua. Toimivat: sivunkääntö näppäimillä sekä
  alapalkin kirjanmerkki- ja sivunapit (ahtaassa navinäkymässä ne ovat piilossa, ks. alla). Tekstialueen napautus sulkee Asetukset, Etsin ja Sisälmyksen tai navin;
  Merkinnät sulkeutuu vain napistaan tai raksistaan.
  Asetusten avaus sulkee navin.
- **Navin laatikot** (opas 4.7.2, `sijoitaLaatikot()`): **Etsi, Sisälmys ja Merkinnät** (käyttäjän päätös 7.11.2026; ennen
  Merkinnät vasemmalla ja Etsi oikealla) avautuvat nappiensa järjestyksessä vasemmalle, keskelle ja oikealle, koko
  korkeudelle palkkien väliin ilman hajurakoa palkkeihin (6.11.2026). Etsi on vasemmalla, koska siellä se ei koskaan peitä
  reunushuomioita (osumat näkyvät niissä livenä). Rinnakkain marginaaleissa (alla) tai, jos ne eivät mahdu, ruudun
  kolmanneksina, kun kolme 19rem:n saraketta rakoineen mahtuu laitojen väliin; muuten yksi kerrallaan koko leveydellä.
  Hyppy laatikosta ja navin sulku sulkevat kaikki kolme, paitsi että hakuosuma jättää rinnakkain Etsin auki, kun se on
  palstan vieressä eikä peitä osumaa (`suljeHypynTielta()`). Reunus on `--viiva` (muste ja `--harmaa` liian kirkkaita).
- **Marginaalit** (käyttäjän pyynnöt 7.11.2026, opas 4.7.2): Etsi vasemmassa ja Merkinnät oikeassa marginaalissa, ja
  **Sisälmys on palstan levyinen, ei koskaan leveämpi**. Laatikon ja palstan välissä on aina hienon hieno kaistale
  (`LAATIKKO_KAISTA`, 5 px: 12 px liikaa, 3 px liian vähän), ja Sisälmys on palstan ja kaistaleiden levyinen. **Auki olevien
  laatikoiden väliin ei jää tilaa.** Laatikot täyttävät marginaalinsa ruudun reunaan. Merkinnät peittää reunushuomiot
  eikä väistä niitä (käyttäjän linjaus). Vierityksessä palsta on keskellä ruutua aina, kun laatikot mahtuvat
  (`palstanSiirto()`, .wrapin `left`), joten marginaalit ovat yhtä leveät.
- **Ahdas navinäkymä** (käyttäjän pyyntö 6.11.2026, opas 4.7.2, `naviAlas()`): mobiilissa, kun laatikot eivät mahdu
  rinnakkain, kolme laatikkonappia siirtyvät alapalkkiin (`#ala-laatikot`), jos mahtuvat: ensin palkkinuolen kanssa,
  sitten ilman (Light Phone 360 px), muuten ne jäävät aikajanan alle. Silloin navissa ei ole kirjanmerkkiä eikä
  sivunappeja, auki olevan laatikon nappi himmenee, laatikon ollessa auki aikajanakerros on piilossa (`laatikko-auki`),
  ja paljaan alapalkin napautus vie suoraan lukunäkymään.
- **Osiohyppy pitkällä painalluksella** (käyttäjän pyyntö 8.11.2026, `osioAloita()`/`osioSivu()`, 1,1 s): reunanapautus (30 % laidoilla), sivunkääntöpainike ja PageDown/PageUp/nuolet/äänenvoimakkuusnäppäimet (nuolet lisätty 8.11.2026; toistotapahtuma hyppää myös, jos keyup puuttuu). Merkkipaalu (`osioPaalut()`, käyttäjän säännöt 20.11.2026: Valtion 1. kirjassa ainoa luku vei alusta loppuun): taso, jonka paalut osuvat alle kahdelle sivulle, ei kelpaa (ei kategoriaa, jolla ei ole tekstissä merkitystä); luku, jos sen keskiaskel on enintään `OSIO_ASKEL` (20) sivua, muuten osio (myös yläindeksikohtien osiot, Stephanus-sivu); kohta vain ilman lukuja ja osioita; muuten 10 sivua. Hienompaa sääntöä käyttäjä voi vielä haluta; testi `osiohyppy-taso-testi.js`. Laidalla hyppy peruu jo alkaneen maalauksen (paikallaan pidetty sormi laidalla ei maalaa), **paitsi Sukkelan sanaselityksen sanaa** (`sanaSukkelana()`, 19.11.2026: sähköpaperilla luonnos näkyy viiveellä, sormi pysyi sanalla yli 1,1 s ja hyppy pyyhki luonnoksen ennen selitystä; testi `osiohyppy-sana-testi.js`); näppäimen toisto ei käännä sivuja. Toisto tunnistetaan myös ilman `e.repeat`-lippua (`osioToisto()`: ei keyupia välissä tai alle 120 ms edellisestä keydownista), koska Light Phonen sovelluksessa pitkä painallus juoksutti sivuja (16.11.2026); testeissä painallusten väli vähintään 120 ms. **Näppäin kääntää sivun vasta noustessaan** (keyup, enintään yksi sivu painallusta kohti, ei hypyn jälkeen; käyttäjän pyyntö 17.11.2026: Light Phonessa pitkä painallus kävi ensin seuraavalla sivulla): testin pelkkä keydown ei käännä. Laitteen näppäinten käytös Booxilla on todentamatta (Palmalla pitkä painallus ei hypännyt 17.11.2026).
- **Seuraava viimeisellä sivulla avaa navin** (käyttäjän toive 7.11.2026, `seuraavaPainettu()`): vain tahallinen painallus (painike, reunanapautus, näppäin), ei vedon aikainen käännös, rulla eikä pyyhkäisy; verhon ollessa auki ei tapahdu mitään.
- `AudioVolumeDown`/`Up` kääntävät sivua siltä varalta, että selain välittää äänenvoimakkuusnäppäimet (Boox). Ei kuollutta koodia.
- **Aikajanan merkit nuottien tapaan**: suurempi aika-arvo ontompi (pääluku iso ontto salmiakki, alaluku pienempi
  täytetty, alaluvun alaluku lähes pistemäinen). Vain luettu osa on tekstin värinen; tulevat merkit ja kirjanmerkit
  ovat `--viiva`-harmaita, eivät pienempiä.
- **Peitto** (opas 4.4, `karsiPaallekkaiset()`): törmäys ei ole pelkkä lomittuminen, vaan kärjet menevät toistensa
  kehän sisäalaan. Merkin musteen pitää mahtua janalle, ja ensimmäisen näkyvän pääluvun vasemmalle puolelle mahtuu
  kuvitteellinen päälukumerkki (`testi.js` tarkistaa).
- **Veto**: vierityksessä ei ole magneettia (napautus ja veto vievät suhteelliseen kohtaan). Sivutettuna osoitin pysähtyy
  pysäkeille (`janaPysakit()`), jotka eivät riipu aikajanalle valituista merkeistä, paitsi (käyttäjän pyyntö 17.11.2026,
  `janaKohde()`): yli 10 %:n pysäkkivälin sisältä saa valita vapaasti, ja osuma näkyvän salmiakin musteen x-alueelle vie sen
  keskukseen (`janaSalmiakit`). Muuta magneettia ei lisätä. Poikkeus kumpaankin lukutapaan (käyttäjän
  pyyntö 4.11.2026): osuma piirrettyyn kirjanmerkin nauhaan vie tasan kirjanmerkkiin (`janaNauhat`). Liikkeessä
  päivitetään vain transform, viivojen päät ja etappien `tuleva`-luokka, kerran ruudunpäivitystä kohden (e-ink).
- ***Palaa takaisin* -laatikko vain lähdeviittauksesta, haulla (toistaiseksi) ja aikajanalta ≥ 50 %** (käyttäjän
  päätökset 6.11.2026): Sisälmys, Merkinnät ja tuonnin kyltti jättävät vain kummitusmerkin. Älä laajenna kysymättä.
- **Siirtymien kumousta ei ole** (käyttäjän päätös 6.11.2026: ei tyydyttävää visuaalista ratkaisua; lukijaa auttavat
  majakka ja kirjanmerkit). Älä palauta sitä kysymättä.
- **Kokoruutu** (opas 4.9): **vain yläpalkin nappi, ei asetusta** (käyttäjän päätös 5.11.2026). Nappi muistaa valinnan
  (`aset.kokoruutu`); selain sallii kokoruudun vain eleestä, joten tekstin avauksen jälkeinen ensimmäinen napautus vie
  kokoruutuun (`krAvaus`). Takaisin-eleen tai alasvedon jälkeen Luin ei palaa ennen seuraavaa avausta. Asentoa ei lukita.
- **Palkkivara** (käyttäjän pyyntö 8.11.2026, opas 4.9): sivutettuna kosketusnäytöllä dokumentti on `150lvh` korkea (`html.palkkivara`; 2 px `100lvh`:ta pidempi ei piilottanut palkkeja Bravella Nordilla, `luin/kehitys/palkkikoe.html`), jotta pystypyyhkäisy vierittää ja selain piilottaa palkkinsa. Älä palauta `body.sivutus`:n `overflow: hidden`ia sinne äläkä käytä pystyeleitä sivutettuna muuhun (paitsi kokoruudun alasveto, jolloin vara on pois); uusi näkyvä elementti sivutettuna on `position: fixed`.
- **Palkkiopas** (pilotti 8.11.2026, opas 4.9, `naytaPalkkiopas()`): iso pyyhkäisymerkki tekstin päällä avauksessa ja sivunkäännön valinnan jälkeen, vain kun selaimen palkit näkyvät (`100lvh` > ikkuna, ei selaimen nimeä). Kun se näkyy, leipäteksti himmenee värinä (`#palkkiopas:not([hidden]) ~ #sivu`, siksi opas on heti ennen `#sivu`a). Käyttäjän linjaukset 8.11.2026: väri paletin haalea `--viiva` (himmennyksen ansiosta erottuu; aiempi neutraali harmaa poistui), neljä natsaa, **ei salmiakkeja eikä jäsentelyviivoja** (koristesalmiakit eivät ole tämän ohjelman juttu), selite enintään ison rivin levyinen (`.po-pieni` em-suhteessa). Versaali on toistaiseksi; sen poistoa harkitaan, älä poista kysymättä. Ei läpikuultavuutta, ei animaatiota, ei ota napautuksia; mikä tahansa napautus sulkee sen, tekstialueella tekemättä muuta. Älä tee siitä pientä äläkä siirrä tekstin alle kysymättä.
- **Turvakaista** (käyttäjän pyyntö 8.11.2026, opas 4.9): kameran loven kohdalla musta `#turva` (`--turva` = `env(safe-area-inset-top)`, varasääntönä 32 px `paivitaTurva()`), ja kaikki näkymät alkavat sen alta. Light Phone säästetään (kaista 0). Kaistan napautus avaa ja sulkee navin kuten alakaista (käyttäjän pyyntö 8.11.2026; vain mobiili ja lukija). Uusi kiinteä elementti tai yläraja ottaa `--turva`/`turva()`:n huomioon; `viewport-fit=cover` on välttämätön, jotta selain kertoo loven.
- **Erikoishaut** (käyttäjän pyyntö 12.11.2026, opas 4.7.3): kenoviiva aloittaa erikoishaun (`/lainaus`, `/vieras`, kielet).
  Ehdotuksina vain tekstissä olevat; `ERIK`-taulun komentonimet ovat käyttäjälle näkyviä, älä vaihda niitä kysymättä.
  Lainausmerkkilainaus vaatii vähintään kolme sanaa (1–2 sanaa ovat termejä). Kohdat lasketaan kerran tekstiä kohden (`nyt.erik`).
- **Haun korostus sammuu sen omasta napautuksesta** (käyttäjän pyyntö 12.11.2026, `sammutaKorostus()`; Esc lisänä, ei varaan):
  napautus ei tee muuta (ei sivunkääntöä, ei alleviivauksen valikkoa); pidä tarkistus reunanapautuksen edellä. Korostuksen
  ollessa päällä alapalkissa on painunut lasi (`#haku-sammuta`, käyttäjän pyyntö 12.11.2026), joka sammuttaa sen; `korosta()` päivittää sen näkyvyyden.
- Kirjanmerkki menee aina kappaleen alkuun (`o: 0`; säännöt opas 4.3).
- **Tasattukin kaksirivinen kappale liehuu**, jos ensimmäisen rivin sanaväli olisi yli 1 em (käyttäjän pyyntö 16.11.2026,
  `liehutaLyhyet()`, opas 5). Ei ulotu pidempiin kappaleisiin kysymättä. Uusi kirjoitus asettelussa tämän ja `tavutaPitkat()`:n
  jälkeen ei saa muuttaa rivitystä, tai luokka vanhenee.
- **Sisennys vain kappaleelle, jonka edellä on kappale** (CSS `p + p`, käyttäjän pyyntö 7.11.2026): sisällysluettelon, otsikkolohkon, otsikon, lainauksen tai luettelon jälkeen ei sisennetä. Älä palauta poikkeusluetteloa.
- **Sivutettuna** pääluku alkaa aina uudelta sivulta (myös JS-varmistus `pakotettu`, koska käyttäjän työpöytäselain ei
  noudattanut CSS:ää). **Sisällysluetteloa ei pakoteta omalle sivulleen**; se kulkee otsikkolohkon perässä.
- Merkintöjen tuonti (opas 4.6): ei virallista tiedostomuodon tunnistetta; vientiä muutetaan vain sen verran kuin
  tuonti ehdottomasti vaatii.
- Valinnan valikon alleviivausikonin 3 px:n ruosteviiva on liioiteltu tarkoituksella.
- **Maalauskone** (pilotti 5.11.2026, opas 4.3): Luinin oma maalaus (`aset.maalaus`, oletus) ottaa selaimen valinnan
  pois tekstistä tarkoituksella (`html.oma-maalaus`, käyttäjä: "lukurauhan astia, ei joka paikan höylä"); kopiointi
  on valikon napissa. Älä palauta valintaa "korjauksena". Sanaraja on `sanassa()`, jota käyttävät myös
  `valintaPaloiksi()` ja viennin `esiintymat()`: pidä ne samana. Kahvat vain alleviivauksen tai luonnoksen
  napautuksesta, ei maalauksen päätteeksi. Yhden sanan valinta (tuplaklikkaus, pitkä painallus ilman vetoa) avaa
  vain sanaselityksen (*Sukkela sanaselitys*, `aset.sukSana`), myös kun valikon sanaselitys on päällä; kytkimet ovat
  toisistaan riippumattomat. **Kerran laajentunut veto ei palaa sanan valinnaksi** (käyttäjän pyyntö 6.11.2026): maalaus, joka palaa
  samaan sanaan, on maalaus (sukkelana alleviivaus, muuten valikko; `maal.laajeni`, hiiren tuplaklikkausveto `hiiriMaalasi`,
  selaimen tapa `tila.vedetty`), ja kahvasta muutettu luonnos avaa valikon myös yhteen sanaan supistuttuaan (`veto.muuttui`). Valinnan valikossa ei ole kirjanmerkkiä: kirjanmerkki vain alapalkin nauhasta. Käyttäjän
  päätökset 5.11.2026.
- **Suurennuslasi on pinossa** (`LUPA_KAYTOSSA = false`, käyttäjän päätös 5.11.2026; älä ota käyttöön kysymättä; jos lasi
  osoittautuu tarpeettomaksi, käyttäjä harkitsee sen poistoa). Pilotti 5.11.2026, opas 4.3: kahvan kosketusvedossa (ei hiirellä) vedettävän pään rivi näkyy
  1,25-kertaisena rivin yläpuolella. Klooni tarvitsee alkuperäisen lasketut tyylit (`lupaKlooni()`); `#lupa` pysyy
  `pointer-events: none` eikä saa `.luin-ui`-luokkaa. Kahvan kohta luetaan otealueen läpi (`#kahvat.lapi`).
- **Kaarikahva** (käyttäjän päätös 5.11.2026, opas 4.3): ote on rivin keskikorkeudella kuten maalauksessa, ei rivin alla.
  Kahvat pysyvät näkyvissä myös vedon aikana ja jälkeen; alleviivaus pysyy yhtenäisenä (ei katkoviivaa). Nuppi mahtuu
  sanaväliin (0,2 em); älä levennä sitä kysymättä.
  **Alleviivaus on maalattu taustana, ei `text-decorationilla`** (käyttäjän pyyntö 6.11.2026): natiivi alleviivaus pyöristyi
  rivi riviltä eri tavoin, joten kahvan sauma ei osunut viivaan millään kaavalla. Viiva on ankkuroitu merkin laatikon
  alareunaan, ja kahvan jatke ja varsi ovat saman merkin taustaa (`k-alku` / `k-loppu`, `kahvaPaat()`); vain nuppi on SVG.
  Viivan paksuus ja varren korkeus ovat kokonaisia laitepikseleitä, muuten varren pohja karkaa. Älä palauta
  `text-decorationia` äläkä siirrä varsia pseudo-elementteihin (laatikko pyöristyi 1 px eri tavoin). Testi mittaa sauman. Eleen jälkeinen haamuklikkaus nielaistaan (`tila.niele`).
- **Törmäys ja värit** (käyttäjän päätös 5.11.2026): uusi alleviivaus pysähtyy vanhan rajaan, ei lomitu eikä yhdisty.
  Vierekkäiset vuorottelevat ruostetta ja okraa (ketjun vanhin ruoste); muita värejä ei tarvita. Kahvat ovat aina
  samaa väriä kuin viiva (`.kahva.okra`, `kahvaVari()`; käyttäjän päätös 6.11.2026). Samoin okrat ovat kirjauksen kynä
  tekstissä (`.kirm.okra`), valikon poistoikonin viiva (`ikPoista()`) ja kirjausruudun kohdekatkelman viiva (`.ali-teksti.okra`).
- **Alleviivauksen loppumerkit** (käyttäjän säännöt 6.11.2026, opas 4.3): lopetusmerkki vain kokonaiseen virkkeeseen, pilkku/kaksoispiste/puolipiste ei koskaan, valintaan jääneen avaajan sulkeva vastine heti sanan perässä mukaan. Säännöt ovat `valintaPaloiksi()`:ssa eikä naapuri vaikuta niihin; älä siirrä niitä törmäyskoodiin.
- **Kummitus ja pito** (käyttäjän pyyntö 7.11.2026, opas 4.3, `kummitusAskel()`; korvasi saman päivän sivun nurkan):
  tekstialueeseen ei kosketa. Kun liikkuva pää on 0,95 s sivun viimeisellä rivillä, alapalkin elementit katoavat näkyvistä ja
  käytöstä, ja palkkiin tulee palkin korkuinen neliö natsanuolineen marginaaliin: vasen reuna palstan oikean reunan linjassa,
  ja jos ei mahdu, ruudun reunassa koko ennallaan; vieressä palstan puolella *asdf →* (valinnan valikon alleviivausmerkki).
  Taaksepäin peilikuvana yläpalkissa: oikea reuna palstan vasemman reunan linjassa, vieressä *← asdf* (mobiilissa palkit ovat vedon aikana kiinni, joten neliö on tekstin
  yläpuolisen kaistan korkuinen; turvakaistan kanssa neliö ulottuu kaistan läpi, mutta natsa ja asdf ovat kaistan alla). Kääntö vain matkana (ulkoa sisään), 0,3 s viipymä, sitten neliö vaalenee 0,25 s (`--valo`,
  "ei adhd-räpsyä") ja sivu kääntyy. Pidon ajan pää pysyy rajan yli seuraavassa sanassa ja neliö palkissa, eikä sama sivu
  käänny uudelleen ("ei saa räpsyä"). **Sivutettuna laita ei käännä vedossa** (poistettu 7.11.2026: laidan 0,65 s ehti
  neliön 0,8 s:n edelle, kun sormi oli viimeisen rivin lopussa ruudun reunan lähellä); älä palauta sitä. Rivi mitataan
  rajan lähimmästä sanan merkistä, ei rajasta (välilyönnin laatikko hyppäsi edelliselle sivulle).
- **Kirjauksen kynä** alleviivauksen alussa: napautus näyttää kirjauksen, toinen napautus muokkaa.
- **Sanaselitys ja käännös** ovat ainoat lukijan verkkohaut, vain napautuksesta (poikkeus suljetusta lukuympäristöstä,
  käyttäjän pyyntö 5.11.2026). DeepL-osoitteessa `/` on `\/`, ja lähdekieli on pakollinen (`auto` ei toimi). Kohdekieli on suomesta
  latina, muista suomi (`kohdeKieli()`, käyttäjän pyyntö 10.11.2026). Käännös on oletuksena pois valikosta.
- **Sanaselitys** (käyttäjän linjaukset 5.11.2026, opas 4.3): käyttöliittymässä *sanaselitys*, ei *sanakirja* (avain
  `aset.sanakirja` säilyy). Ensin aina tasan tekstin muoto, vasta sen puuttuessa kielikohtainen ketju (`skKetju()`). Tasan samoista muodoista (virkkeen alun *As* ja *as*) määritelmä ennen pelkkää taivutusviittausta (*plural of A*; `skTasan()`), muuten tekstin muoto ensin.
  Taivutusarvaukset (loppunapsu) vain tekstin kielestä, paitsi kursiivissa ja lainauksessa. Suomessa ennen napsua taulukkohaku (`tx`: tekstihaku indeksoi taivutustaulukot, *käsitteen* → *käsite*; erisnimellä vasta `ne`:n jälkeen, ettei *Kantin* osu *kantin* taulukkoon), ja napsussa pituusehto: yli kirjaimen tekstin sanaa pidemmät ehdokkaat vain, jos lyhyitä ei tule (käyttäjän pyyntö 14.11.2026). Wikisanakirjassa ei surffata
  takaisin päin (Luin ei ole selain), merkki ei ole linkki, ja ulos vievät linkit ovat korkean kynnyksen takana. REST-rajapinnan kieliavaimiin ei luoteta (`skNormita()`: Translingual on avaimen `en` alla, muinaiskreikka avaimen `other`); kieli luetaan osan nimestä. Tekstin kielestä löytyvään sanaan ei näytetä muiden kielten tietoja (käyttäjän linjaus 6.11.2026, ensin suomi, sitten kaikki kielet: *edes* ei tuo latinaa, *is* ei afrikaansia; `r`-lippu ketjussa). Kursiivissa tämä liudentuu: tekstin kieli ensin, muut jäävät mukaan; ei kuitenkaan tekstin kielen pikkusanalle (`KIELET`-lista, `y.pikkusana`: *as* ei tuo suomea kursiivissa eikä lainauksessa). Suomenkielinen lainaus on kuin leipäteksti; muissa kielissä vain oman kielensä erottava lainaus (`y.omaKieli`), lyhyt lainaus liudentuu. Englannin iso alkukirjain keskellä virkettä (*Dasein*) jättää muut kielet mukaan, ja kreikan kaksi kieltä näkyvät yhdessä. Lainauksen sisäinen kursiivi on kursiivi. Translingual (`mul`) noudattaa samaa: pois tekstin kielestä löytyvältä, paitsi symbolin näköiselle kirjoitusasulle (IV, CO2, pH); muuten tekstin kielen, ketjun kielten, englannin ja suomen jälkeen; ISO 639 -kielikoodit eivät näy koskaan (käyttäjän palaute 6.11.2026). Verkkovirhe pysäyttää ketjun. Enintään
  10 sanaa (`SK_SANAT`). Raksin paikka on mitattu lisää-linkistä; asetuksissakin lambda on tekstin värinen (6.11.2026).
- **Alkuperä ja perusmuoto** (käyttäjän pyynnöt 12.11.2026, opas 4.3): selitysikkunan otsikossa ei ole lambdaa (valikossa ja
  asetuksissa on). Sanan perässä on alaindeksinä linssi-epsilon vain, kun sivulla on etymologia (osioluettelo haetaan heti);
  linssi ja ε alussa ruostetta, osoitettaessa ε muste, auki myös linssi muste (14.11.2026). Kehä tiukasti ε:n päällä (diakriitit "kehän takana"); varsi sanan alle. **Ei
  linssiä valitsimeen**: vasta valitun sanan selitykseen. Selitysikkunan ylin rivi ΛΟΓΟΣ (vain kun selitys näkyy) ja laatikon
  ylin rivi ΕΤΥΜΟΝ ovat majuskeleita (kokeilu, ei lukumerkkejä) entisen ALKUPERÄ-otsikon koossa, harmaata haaleampina ja hyvin
  väljästi harvennettuina (käyttäjä: huomaamaton, älä suurenna); raksit niiden riveillä. Ne eivät näytä linkeiltä, mutta vievät
  sanan λόγος / ἔτυμον selitykseen (käyttäjän vitsi; vihjeet *Sana (logos)*, *Alkuperä (etymon)*). Määritelmillä ei ole kehystä.
  Lisää-linkki on pelkkä plussa ilman kehystä (neliö ja salmiakki kokeiltiin); raksissa ei kehystä.
  **Etymologiaosiota ei jäsennetä yksinään** (`section=N`): mallineet lukevat kielen otsikkolaskurista, ja muu kuin sivun ensimmäinen
  kieli oli Lua-virhe (*historia*, 14.11.2026). Wikiteksti jäsennetään täyteotsikoiden perässä (`haeAlkupera()`).
  Mobiiliselain saa jäsennyksen `<section class="mf-section-N">`-kääreissä (Androidin Firefox, 14.11.2026): `skOsiot()` purkaa ne.
  Pilvikontista mobiilimuodon saa oikeasta rajapinnasta POSTilla mobiilin User-Agentin kanssa (GET antaa 429:n).
  **Perusmuoto ensin**: pelkkien taivutusviittausten sivu vaihtuu perusmuotoon, taivutus pienellä kursiivilla, sisennettynä ja sulkeissa otsikon alla Wikisanakirjan
  sanoin ((”käden” · genitive singular); kursiivi on kokeilu sivuosaan väistämiseksi, käyttäjä 13.11.2026); muoto pysyy, jos sillä on omia merkityksiä tai oma etymologia. Lambdaa ei poisteta
  muualta kysymättä.
- **Kopion paikannin**: luvun numero, ei sivunumeroita, sanallinen otsikko vain pakosta (käyttäjän linjaus 5.11.2026).
  Numero on md.js:n `paikat()`-paikannin (käyttäjän pyyntö 6.11.2026, opas 3.2): kirjoittajan `4.3.4` sellaisenaan, muuten
  tunnisteiden ketju (*Osa II, 3b*), ja ylempi taso pois, jos alempi numerointi jatkuu sen yli (Korsgaardin Part II alkaa
  luvusta 6 → *6*). Kappaleen alun pykälä tai Tractatus-numero tarkentaa paikantimen kappaleeseen (`kohtamerkit`).
  Tarkkuus on aina alimman numerotason (käyttäjän sääntö 6.11.2026, `nollat()`): kattavasti kolmitasoisessa luvun alku
  *4.0.0*, kaksitasoisessa *4.0*; luvuittain alusta alkava pykälä alaluvun paikalla (*5.2*), jatkuva yksinään (*§ 88*).
  **Poikkeus: vakiosivut** (käyttäjän pyyntö 20.11.2026, opas 3.2): etukentän `vakiosivut: AA` ja merkit `{4:429}` (tai sen
  puuttuessa sivunumeron näköiset yläindeksit) antavat paikantimeksi edeltävän sivun (*AA 4:429*) ja lyhyeksi viitteeksi pelkän sen.
  Ilman etukenttää aaltosulkeet ovat tekstiä; älä tee merkeistä vakiosivuja ilman sitä. Testi `vakiosivu-testi.js`.
- **Tasojen nimet ovat luku, osio ja kohta** (`h2`/`h3`/`h4`, käyttäjän päätös 7.11.2026; ennen pääluku, alaluku, alaluvun alaluku).
  **Ylin taso jää käyttämättä** (pilotti, md.js `laske`, opas 3.2): korkeintaan kaksi tasoa ja yli 10 lukua → kaikki tasoa alemmas,
  sivuseikkojen alennus perutaan (SEP:n Bibliography on osio). Käyttäjä haluaa myöhemmin parempia perusteita; raja on raja-aita.
  Sisällys, Sisälmys ja aikajana lukevat tasot tekstin ylimmästä tasosta (`tocRaja()`), ja avoimen tekstin puuttuvat
  tasot ovat asetuksissa himmeitä (`janaTasotNyt()`).
- **Tekijänoikeusmerkintä** (käyttäjän pyyntö ja säännöt 10.11.2026, md.js `oikeudet()`/`oikeusTaso()`, opas 3.2): etukentän
  `oikeudet:` (ja `oikeudet-lähde:`) → tekstin loppuun otsikko *Tekijänoikeudet*, merkintä sellaisenaan, kaverillinen selitys
  (käyttäjän toivoma rento sävy) ja virallinen linkki. Lisäosa kirjoittaa sen vain, kun lähde kertoo (SEP, Logos, Wikipedia,
  `rel="license"`); Latomossa se on valinnainen kenttä, oletuksena piilossa. Taso: kohta; kuivan loppuosion alla aina kohta;
  pelkkien osioiden tai pelkkien lukujen tekstissä sama taso; ilman otsikoita kohta yksin. Merkintä lisätään vasta tasojen
  laskennan jälkeen: se ei saa muuttaa muiden otsikoiden tasoja (`laske`, alennukset) eikä lohkonumeroita (kirjanmerkit),
  eikä sen kappaleista tule kirjallisuusluettelon kohtia (`md-testi.js` tarkistaa).
- **Iso kirjallisuusosio on luku** (käyttäjän sääntö 7.11.2026, md.js `bibLuku()`, opas 3.2): luvun tasolla oleva
  kirjallisuusotsikko, joka tekstin loppuun asti (myös sen jälkeiset osiot) vie ≥ 25 % tekstistä, pysyy lukuna ja sen
  alaotsikot osioina; alennukset (sivuseikat, `laske`) perutaan vain siltä. Beauvoirissa näin käy (30 %).
- **Pykälä on korkeintaan alaluvun alaluku** (käyttäjän sääntö 6.11.2026, `pykalaSarjat()`, opas 3.2): Husserlin tapainen
  lyhyehkö pykälä, merkillä tai ilman, ladotaan `h4`:ksi myös ilman yläotsikoita. Pelkkien pykälien tekstissä
  sisällysluettelot ja aikajana näyttävät ylimmän olemassa olevan tason (`tocRaja()`).
- **Liettuan tavutus** (16.11.2026, opas 5, md.js `tavutaLt()`): vain kappaleelle, jonka lukija tunnistaa liettuaksi (`tavutaDOM()`:n
  kolmas parametri); muu teksti tavuttuu suomen säännöin kuten ennen. Liettua on myös `KIELET`-listassa (käännös, sanaselitys,
  `/liettua`): listaan ei sanoja, jotka ovat toisen kielen listassa. md.js:n `BIB`/`OHEIS` tuntevat liettuan luettelonimet.
- **Tavutuskiellot** (opas 5): otsikoissa, `.sub`:ssa, `.meta`:ssa, sisällysluettelossa, lihavoinneissa ym. (`OHITA`
  md.js:ssä) ei ole pehmeitä tavuviivoja, ellei sana ole palstaa leveämpi. Kirjallisuusluettelo (`p.bib`) ei tavuta
  lainkaan (Teologian tyyli, APA 7).
- **Pitkä reunushuomio katkaistaan** (käyttäjän pyyntö 12.11.2026, `sovitaHuomiot()`, opas 3): vain kun se työntäisi seuraavaa
  huomiota; *lisää…*/*vähemmän* on oma kelluke huomion perässä eikä siinä ole tekstisolmua (teksti `::before`). Älä siirrä nappia
  huomion sisään: ponnahdus, haku ja lohkon kohdat lukevat huomion sisältöä.
- `#teksti { overflow-wrap: break-word }` estää vaakavierityksen (Light Phone, pitkät osoitteet); `testi.js` tarkistaa.

Ratkaisut, jotka näyttävät oudoilta mutta ovat mitattuja:

- `kohdanLaatikko` ottaa merkin laatikoista **viimeisen**: tavutusrajan jälkeisen merkin ensimmäinen laatikko on
  Chromiumissa edellisen rivin tavuviiva.
- Vierityksen kohta on rivi, jonka **keskikohta** on `YLA`:ssa, ja `mene()` vierittää merkin keskikohdan samaan;
  yläreunalla kohta ajautui joka kokomuutoksella rivin ylöspäin.
- Sivutettuna kohdassa voi olla `ed`: sivu ilman tekstilohkoja (sisällysluettelo) ankkuroidaan seuraavan lohkon alkuun
  `ed` sivua ennen sitä.
- Sivutettuna `hr.ennen-lukua` (`---` juuri ennen `##`:tä) piilotetaan, koska viiva jäisi yksin omalle sivulleen.
- Vierityksessä pelkkä ikkunan korkeuden muutos ei asettele tekstiä uudelleen (mobiilin osoiterivi).
- **Raskas teksti** (käyttäjän pyyntö 19.11.2026, `sovellaTaiLykkaa()`, opas 4.5): kun `tila.asetteluMs` > `RASKAS_MS`, `ASETTELU`-asetukset
  asetellaan kerran Asetusten sulkiessa, ja paneelin ylälaidassa on ilmoitus (`#raskas-tieto`, käyttäjän vaatimus; sanoissa ei *latoa* eikä *ladonta*, ettei sekoitu Latomoon). Odotuksen aikana
  ei saa asettaa `--koko`a eikä kielten luokkaa tai kutsua `asettele()`a. Uusi asetusnappi kulkee `sovellaTaiLykkaa()`n kautta. Testi `raskas-testi.js`.
- `tavutaPitkat()` mittaa ensin kaikki ja kirjoittaa vasta lopuksi, ja `sovellaAsetukset()` asettelee vain
  `ASETTELU`-listan asetuksilla. Älä lomita kirjoituksia mittausten väliin: sivutettuna jokainen asetuksen napautus
  kesti pitkällä tekstillä sekunteja.

### Latomo (opas 7)

- **Etukenttään vain se, mikä poikkeaa tekstistä päätellystä**: kandidaatintutkielma läpäisee Latomon tavulleen samana.
- Kaikki on vapaaehtoista, otsikko riittää. *Tekstityyppi* on oletuksena *ei määritelty* (ei pakollista kategoriaa).
  Kaunokirjallisen tekstin `teos`-kenttä on *Kokoelma* (käyttäjän sateenvarjosana, ei *novellikokoelma*).
- Ehdotukset muuttavat tekstikenttää vain napista. Myös luurangotus (`luuranko()`, opas 7.1): hyvin merkitty teksti ei saa
  rakenne-ehdotusta (tutkielma, opas; `md-testi.js` tarkistaa).
- **Latomossa ei ole MarkDownload-tilaa** (käyttäjän päätös 9.11.2026, kun lisäosa pääsi Chrome Web Storeen): ei
  kytkintä, ehdotusta, Excerpt-, validateUri- eikä leikkeen loppurivien käsittelyä. Leike siivotaan vain korvamerkistä.
  Latomon ohjeen ja kehittäjän oppaan MarkDownload-osiot ovat vanhentuneita; käyttäjä ei halua niitä nyt korjattavan. Ohjeen alussa on huomautus *Ei tarkistettu, ei ajan tasalla (16.11.2026)* (käyttäjän pyyntö); poista vasta, kun ohje on tarkistettu.
- **Postihuilu** (käyttäjän nimi 10.11.2026 Latomossa, Luinissa ja lisäosassa; ennen *Coneelta Cännycälle* ja *Lähetä postilaatikkoon*; pyynnöt 9.11.2026, opas 2.2):
  käyttäjälle näkyvät tekstit (Postihuilu, Laatikkolause, *Soita huilua!*, *Huiluta myös merkintöjä*, i-ohje, Latomon
  *TOISEN LAITTEEN PÄÄSSÄ* ja lisäosan johdanto) ovat käyttäjän sanamuotoja: älä siloittele. Latomo ei lähetä merkintöjä
  (käyttäjän päätös 10.11.2026). Latomo kirjoittaa
  tekstin laatikkoon reitillä `POST /api/luin`, ja Luin hakee tekstit samalta reitiltä GET:llä. **Pitkä arvottu laatikon
  koodi (≥ 24 merkkiä) on itse avain**: ei salaisuutta workeriin eikä Päätettä uudelle käyttäjälle,
  laatikolle tai laitteelle (käyttäjä: salakoodi per worker oli liian epäskaalautuva; sen tilalle tämä samana päivänä).
  **Uusi laatikkolause on aina 24–52 merkkiä** (käyttäjän päätökset 9.11.2026 ja 10.11.2026: yläraja 52, ennen 40; lauseella on voitava sekä lähettää että lukea),
  **vain a–z, 0–9 ja `-`** (käyttäjän päätös 10.11.2026): isot kirjaimet luetaan pieniksi, muut merkit hylätään eikä niitä
  siistitä pois. Sääntö ja ohje ovat `luin/posti.js`:ssä, lisäosassa kopiona: muuta yhdessä. Vanha lyhyt koodi toimii vain lukemiseen. Kirjoitukset kulkevat Durable Objectin laskurin `LuinRaja`
  kautta (`LUIN_LASKURI`, `wrangler.toml`): 20 POSTia minuutissa osoitetta kohti ja 500 KV-kirjoitusta UTC-päivässä. Älä palauta
  Cloudflaren ratelimit-sidontaa tai isolaatin muistia: kumpikin päästi Macilta 25 pyyntöä minuutissa läpi (mitattu 9.11.2026). Koodia ei kirjoiteta repoon.
  Pino hakee laatikon enintään minuutin välein ja tyhjän haun jälkeen kerran uudelleen (`haePinoon()`): KV:n listaus näyttää
  edellisen minuutin sisällä luetun tilan. Ei jatkuvaa kyselyä: ilmaistasolla listauksia on 1000 päivässä, ja haku tekee kaksi. Reitti vaatii,
  että `tusinasaa-worker` on julkaistu tämän repon koodilla (`npx -y wrangler@3.114.17 deploy` repon juuressa).
- **Postihuilun kuvio** (käyttäjän valinnat 12.11.2026; ideointi `docs/mietintamyssy/luin-postihuilu-kuvitus*`): `luin/huilu.js`
  (`?v=` kuten md.js:n), piirto `piirraHuilu()`. **Yksikään huilu ei ole vaakatasossa**: aina 64° (`HUILUKULMA`, käyttäjän pyyntö 17.11.2026: hiukan myötäpäivään, svengaa ulkomutkan kanssa; ennen 68°), nokka ylhäällä oikealla. Kaistassa huilu kiertyy suunsa ympäri, joten viuhka ei muutu; siksakin 22° ja nuottien kallistus pysyvät 68°:n mukaisina.
  Pinossa huilu on i-napin oikealla puolella (`.huilu-paikka`, ei otsikon ja i-napin välissä), asetuksissa *Soita huilua!*
  -napin (oikeassa reunassa) yläpuolella oikealle siirrettynä; Arvo on laatikkolauseen tekstikentän oikealla puolella
  samalla rivillä (`.koodikentta`). **Vain alkuviuhka kaartuu**: viivat lähtevät alimman reiän kärjestä sileänä kaarena (syli, alla) ja jatkuvat sitten
  kulmikkaana siksakkina, selvin taittein (käyttäjä: aaltomuodon loputtomuudesta kvantteihin). Viivat ovat ohuita, mutta
  mitat isoja (huilu 6 px, viivaväli 8 px, siksak ±4,85 px): ohut viiva ei ole lupa pienentää. **Väljä kolmilinja** (käyttäjän pyyntö 16.11.2026,
  vertailu `docs/mietintamyssy/luin-postihuilu-valjempi.html`, muunnelma B): kolme viivaa, jakso 48, alamäki 22° vaakatasosta, siksak enintään
  neljä jaksoa. Samana päivänä: väli 8 (ylin viiva paikallaan, alin kaartuu syvemmin alas ja vasemmalle, `KAARROS`), nuotti välin korkuinen,
  **soitossa tasan kolme nuottia, aina napin x-välillä** (käyttäjän vaatimus). 17.11.2026: **siksak päättyy tasan napin oikeaan reunaan**,
  **napin alku aina alakulmassa, kolmen välin päässä yläkulma ja napin loppu sen jälkeen alamäen puolivälissä** (`yli` .5; ensin .12),
  nuotti kunkin välin keskellä (`alkuX`, `loppuX`; jakso joustaa, 22° pysyy); **ei koskaan kahta nuottia vaan aina kolme** (käyttäjä 17.11.2026): kapealla (alle 360 px), jossa kaarelle ei jää tilaa, väli kapenee niin, että kaari, laakso ja 3,5 väliä mahtuvat suusta napin loppuun, eikä napin alku silloin osu alakulmaan (`SYLI.vahintaan`); samalla kaari pienenee mittasuhteet säilyttäen (`kutistus`); pinon lohko enintään 22.5rem. **Syli** (17.11.2026, käyttäjän ohje): suusta
  kiihtyen alas ja vasemmalle, taite ja pitkä kaarros, **alin kohta suun kohdalla x-akselilla**, loiva nousu ja loiva harja yläkulmien
  korkeudella väliä ennen nappia, **laakso suora** (ei loiventumista) napin alun alakulmaan. Kukin viiva on C2-splini tukipisteiden kautta
  (käyttäjän sääntö: ei tarpeettomia nopeita asteluvun kiihdytyksiä); kaikki lähtevät suusta ilmavirran suuntaisesti ja aluksi
  lähekkäin, keskimmäinen on ylimmän ja alimman painotettu keskiarvo (ääripäässä hiukan alimman puoleen). **Perustuslaki: viivat eivät
  koskaan leikkaa toisiaan** (käyttäjä 17.11.2026); välit eivät veny ilman syytä. Muokkaa pienin askelin, älä rakenna uudelleen (`SYLI`, testi mittaa). **Pinon Postihuilu on oletuksena kiinni**
  (käyttäjän pyyntö 16.11.2026): vain versaaliotsikko pienine salmiakkeineen (`#lisaa-ots`, `#huilulohko.auki`), tila ei tallennu. Nuotit ilmestyvät vasta
  painalluksesta (kelpaava lause), vain napin yläpuolelle, joka kerta uutena arvontana (ei portaita), eivätkä liiku.
  **Nuotti aina viivalla tai välissä, ei koskaan viivaston ulkopuolella, ja aina siksakin jakson keskellä**; ensimmäinen
  ja viimeinen soiva jakso rajaavat soiton, ei kahta tyhjää peräkkäin; **yksi nuotti jaksoa kohti, ei koskaan kahta ääntä päällekkäin**;
  salmiakki kallistuu alamäkiviivalla oikealle huilujen kulmassa (22° pystysuorasta), ylämäkiviivalla pystyssä; korkeus pelkkä arvonta (käyttäjä: ei melodiaestetiikkaa). Siksak päättyy aina
  kokonaisen palan lepokohtaan, joten kapeassa näytössä se lyhenee pala palalta. Huilutettu = kantautunut laatikosta (`e.src === 'laatikko'`) eikä vielä avattu tässä selaimessa (`avaa()` asettaa `e.huiluNahty`, uudelleenlähetys poistaa sen; käyttäjä 16.11.2026): sama huilu nimen perässä (`HUILUTETTU`,
  keskikohta 0,29 em perusviivan yläpuolella). Merkintöjen merkki (`MERKITTY`, käyttäjän pyyntö 12.11.2026: kirjanmerkki, alleviivaus
  tai kirjaus) on nimen ja huilun välissä, hienovarainen ja harmaa; viimeinen sana sidotaan merkkeihin (`nimiMerkein()`). Sormireiät logon mittasuhteissa, sivukärjet irti reunaviivasta (`REIKA` 0,5; käyttäjä 12.11.2026 ja pienemmiksi 16.11.2026),
  kärjet hipaisten, alin alakärki pohjaviivan sisäpinnassa (ketju ankkuroituu alhaalta, huilun pituus ennallaan). **Ääniaukko** (`AUKKO`,
  käyttäjän valinta 12.11.2026, nokkahuilun ikkuna): melko ylhäällä matala täytetty siivu reikien värillä, sen päiden linjasta
  kelloa kohti tyhjä ääriviiva, jonka alaosassa leukaperät ja leveä leuka (45° sisäänpäin, puolivälissä keskiviivalle vaakaan). Ei ruostetta. Kaistan luokka ei saa olla
  `.asetus` (asetusrivin alareunaviiva). Nimikkeen kolme salmiakkia ovat pystyssä kärjet hipaisten. Lisäosan
  Postihuilu-napissa on `vino()`-huilu ja sen oikealla **irrallinen** siksak-kolmilinja (0.12.0: väli 8, jakso 48, puolitoista jaksoa; ennen nelilinja kaksi jaksoa, käyttäjä 16.11.2026): viivaston, huilun
  ja tekstin keskilinjat ovat samalla korkeudella (`vertical-align: middle`). Ei viuhkaa huilusta: se kokeiltiin napissa eikä toiminut. Testi `postihuilu-testi.js`. Älä tarjoa hylättyjä
  vaihtoehtoja (vaakahuilu, aaltoileva viivasto, lomittuvat reiät, terävä taite alussa, viisi reikää ja viisi viivaa).
  Viuhkan sisäviivojen jyrkkä käännös on tarkoituksellinen (`kaista()`): älä korjaa sitä kysymättä (historia commitissa f3f21b3).
- **Laatikkolauseen arpoja** (`luin/laatikkolause.js`, käyttäjän pyyntö 12.11.2026: oikeaoppinen ja kohtalaisen muistettava):
  *Arvo* Latomossa, Luinin asetuksissa (täyttää, ei tallenna ennen *Soita huilua!*) ja lisäosassa (0.7.0; tavulleen sama kopio
  `luin/lisaosa/laatikkolause.js`). Kaava laatusana–tekijä–teonsana–luku–kohde–paikka, tasajakauma hylkäysotannalla ja tarkka
  lukumäärä (`MAARA`). **Ei lauseita, joista pitää poistaa ääkköset** (käyttäjän rajaus 12.11.2026): ei ääkkösiä, ei niistä
  pudotettuja muotoja (*delfiinia*) eikä oikeita sanoja, joiden ääkkösellinen vastine on yleinen (*etana*/*etänä*,
  *niittaa*/*niittää*). Samassa paikassa ei lähisynonyymejä. Kun muutat sanoja, aja `python3 luin/kehitys/laatikkolause-sanat.py`
  (`apt-get install voikko-fi python3-libvoikko`, `pip install wordfreq`) ja `laatikkolause-testi.js`, kopioi tiedosto
  lisäosaan ja päivitä `laatikkolause.js?v=` kuten md.js:n.
- **Huiluta laatikkoon** (käyttäjän pyyntö 18.11.2026, opas 2.2, `huiluta()`): nimikkeen valikosta pinon tekstin runko laatikkoon
  tunnuksella `P.avain(id)`, jotta toinen laite saa saman tunnuksen ja merkinnät osuvat. Lähettäjä kirjaa lähetyksen nähdyksi
  (muuten oma haku nostaisi tekstin cellarista pinoon). Merkinnät perässä vain *Huiluta myös merkintöjä* -valinnalla. Testi `huiluta-testi.js`.
- **Merkintäposti** (käyttäjän pyyntö 9.11.2026, opas 2.2): merkinnät kulkevat laatikossa omalla avaimellaan `luinm:`, ei
  tekstien joukossa. Vastaanotto aina, lähetys valinnasta (lukulistassa oletus, tekstin asetuksissa tekstikohtainen).
  Lähettäjä hakee ja yhdistää laatikon version ennen lähetystä; poistot ovat poistomerkintöjä (`merk.del`), jotka
  `tallennaMerkit()` kirjaa. Kun muutat merkintöjen tietomuotoa tai tallennusta, aja `posti-testi.js`.

### Testit (opas 8)

Aja repon juuressa:

- `node luin/kehitys/md-testi.js`: jäsennin ilman selainta (myös `md.js?v=`).
- `NODE_PATH=$(npm root -g) node luin/kehitys/latomo-testi.js [kuvakansio]`: Latomo selaimessa.
- `NODE_PATH=$(npm root -g) node luin/kehitys/testi.js teksti.md [kuvakansio]`: lukija selaimessa (esim. tutkielmalla
  ja oppaalla). Sivun testikoukku on `window.__luin`.
- `NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-testi.js [kuvakansio]`: lisäosa Chromiumissa artikkelista
  lukulistaan ja Lähetä postina.
- `NODE_PATH=$(npm root -g) node luin/kehitys/palaute-testi.js [kuvakansio]`: palautelomake workerin oikealla koodilla,
  kantautuminen Luiniin ja Latomon plussa.
- `NODE_PATH=$(npm root -g) node luin/kehitys/posti-testi.js [kuvakansio]`: postilaatikko ja merkintäposti kahdella
  laitteella workerin oikealla koodilla (muistissa oleva KV).
- `NODE_PATH=$(npm root -g) node luin/kehitys/hakuteos-pesukone.js [--nayta] [osoitteet]`: Logoksen ja Wikipedian oikeat
  artikkelit lisäosan, Latomon ja md.js:n läpi; jäänteiden ja rikkinäisten lähdelinkkien pitää olla 0.
- `NODE_PATH=$(npm root -g) node luin/kehitys/sep-pesukone.js [--nayta]`: seitsemän SEP-artikkelia lisäosan, Latomon ja
  md.js:n läpi; lähdelinkkien oikeellisuus ja linkittämättä jääneet (opas 3.4).
- `NODE_PATH=$(npm root -g) node luin/kehitys/laatikkolause-testi.js [kuvakansio]`: laatikkolauseen arpoja ja Latomon Arvo.
- `NODE_PATH=$(npm root -g) node luin/kehitys/huiluta-testi.js [kuvakansio]`: pinon tekstin huilutus kahdella laitteella (myös `#u=`-tekstit).
- `NODE_PATH=$(npm root -g) node luin/kehitys/postihuilu-testi.js [kuvakansio]`: huilun geometria, `huilu.js?v=` ja kuvio pinossa ja asetuksissa.
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
  toimii POSTilla (14.11.2026), joten jäsennyksen voi kokeilla oikeaa rajapintaa vasten muuntamalla GETit POSTeiksi (`route.fetch`).

### Väliaikaiset tekstit

Kandidaatintutkielma on **väliaikaisesti** repossa (käyttäjän lupa): `luin/tekstit/kant-ja-elainetiikka.md`, lukulistan
linkki *Kokeiluteksti: Kant ja eläinetiikka* ja `robots.txt`:n rivi `Disallow: /luin/tekstit/`. Samoin
`luin/tekstit/dialectic-of-enlightenment.md` (ilman linkkiä, `luin.html#u=luin/tekstit/dialectic-of-enlightenment.md`).
Kun käyttäjä sanoo kokeilun päättyneen, poista tiedostot, linkki ja robots.txt:n rivi. Muita käyttäjän tekstejä ei
viedä repoon ilman erillistä lupaa.

### Alatunnisteen ©-merkki

Yleissääntö on juuren CLAUDE.md:n osiossa *Alatunniste*. Luinin sivuilla (`luin.html`, Latomo, Latomon ohje,
käyttöohje, lisäosan tietosuojasivu, palaute, tuetut sivustot) ©-merkki on SVG: suora salmiakki, korkeus 1,30 × leveys (logon entisen i-pisteen suhde, käyttäjän pyyntö 15.11.2026), ja sen sisällä
Literatan oman ©-merkin sisempi C 1,1-kertaisena (`aria-label="©"`, `margin-right: .15em`). Muiden ohjelmien alatunnisteissa on tavallinen ©.
