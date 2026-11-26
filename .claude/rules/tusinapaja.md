---
paths:
  - "tusinapaja.html"
  - "generaattori.html"
  - "oma-tusinasaa.html"
  - "minun-tusinasaa.html"
  - "tusinasaa-koodi.html"
  - "android/app/**"
---
## Tusinapaja on ainoa aktiivinen versio

**Kaikki työ tehdään tiedostoon `tusinapaja.html`.** Kun käyttäjä sanoo "tusinasää",
hän tarkoittaa tätä tiedostoa (sivun otsikko on `TUSINASÄÄ 12`). Vanhat versiot
(`tusinasaa.html`, `tusinapuuska.html`, `saa_yr.html`, `saa_fmi.html` ym.) on siirretty
repoon `OlliJuutilainen/tusina-tavaraa` (kansio `github-io/arkisto/`). Älä tuo niitä takaisin, älä tutki niitä, älä vertaa
niihin äläkä mainitse niitä vastauksissa, ellei käyttäjä erikseen pyydä juuri sitä tiedostoa.

## Tusinapajan tyylisäännöt

`tusinapaja.html` näyttää tunneittaisen sään viidessä sarakkeessa: aika, lämpötila,
selite, sade, tuuli. Hämärävaiheiden esitystä koskevat säännöt:

- **Ei ajatusviivoja selitesarakkeeseen.** Jokainen merkintä on omalla rivillään.
  Sarakkeessa näkyvä `—` on nollasateen symboli, ei ajatusviiva.
- **Kuivalla tunnilla hämärävaihe on pääsana**, myös kesäyön tunteina. Sateisella
  tunnilla sää on pääsana ja hämärä siirtyy pieneksi merkinnäksi.
- **Sumu ei ole yöllä selite.** Hämärätunnilla sumu ohitetaan kuin kuiva sää, myös jos
  tunnille on ennustettu pieni sademäärä.
- **Sateisella tunnilla ei toisteta vaiheen nimeä** sellaisenaan. Vain ilmoitukset:
  vaiheen alkaminen ja seuraavan vaiheen alkaminen.
- **Alkuaikaa ei koskaan keksitä.** Jos vaiheen todellista alkamishetkeä ei tiedetä,
  ilmoitusta ei anneta.
- Vaiheen oma alkuaika sulkeissa pääselitteen perässä: `porvarillinen hämärä (07:29)`.
  Sulkeutus koskee vain vaiheen omaa alkuaikaa, ei seuraavan vaiheen ilmoitusta eikä
  aurinkotapahtumia — ne nimeävät eri asian.
- Seuraavan vaiheen ilmoitus vain jos vaihe on **eri** kuin tunnin oma **ja** alkaa
  minuutilla `:30` tai myöhemmin. Silloin lyhyt muoto riittää: `nauttinen 06:37`,
  ilman sanoja *hämärä* ja *alkaa*, koska ne käyvät ilmi asiayhteydestä.
- Ditto-rivillä (`»`) ei näytetä paljasta kellonaikaa. Seuraavan vaiheen ilmoitus saa
  jäädä, koska se nimeää vaiheen itse.

Sademäärä:

- Nollasade on `—`. Jos pyöristetty määrä on 0 mutta selite on sateinen, näytetään `0.0 mm`.
- Jos tällöin pyöristämätön ennustearvo on nollaa suurempi (alle 0,05 mm), näytetään
  `~0.0 mm`. Kuivalla selitteellä pieni määrä näkyy edelleen `—`.
- Poikkeus: nowcast-rivillä, jolla met.no on kuiva mutta FMI:n saman tunnin symboli on
  heikkoa sadetta, näytetään `~0.0 mm` kuivan selitteen kanssa. Selite pysyy met.no:n; FMI vain täydentää.

Debug-näkymän saa osoitteen perään lisättävällä `?dbg=1`. Se näyttää mm. `[TW <vaihe>]`
-merkinnät, joista näkee mitä hämärävaihetta koodi kullekin tunnille päättelee. Se on
nopein tapa selvittää, onko vika päättelyssä vai esityksessä.

## Testaaminen ilman verkkoa

Sivut hakevat dataa FMI:ltä ja met.no:lta. Testeissä ne kannattaa korvata Playwrightin
`page.route`-siepauksella ja lukita kello `addInitScript`-Date-korvauksella. Näin saa
toistettavan marraskuun aamun tai kesäyön riippumatta siitä mikä päivä oikeasti on.
SunCalc ja tz-lookup löytyvät paikallisesti `android/app/src/main/assets/`-kansiosta,
joten niitäkään ei tarvitse hakea verkosta.

## Lue tämä ennen siivoamista

Työlista on yksityisessä tusina-rata-repossa (`backlog/tusinapaja-backlog.md`), ja sen osio **"Tehdyt päätökset"**
selittää, mikä koodissa näyttää turhalta tai virheeltä mutta on harkittua. Lue se ennen kuin
poistat mitään "kuolleena koodina" (lisää repo istuntoon, jos sitä ei ole). Ainakin nämä näyttävät jäämiltä eivätkä ole:

- `class="ditto"` on ilman CSS-sääntöä tarkoituksella.
- `forceDescWhite`, `forceRainWhite` ja `__warn` ovat kytkemättömiä koukkuja, ei roskaa.
- `lowercaseMainDescription` on kutsumaton, mutta työlistan kohta 1 nojaa siihen.

Jos poistat jotain, kirjaa päätös samaan osioon, jotta seuraava kierros ei ala alusta.

## Sijaintitoken

Arkkitehtuurin alkuperäinen suunnitelma on tusina-radassa (`oppaat/tusinasaa-token-avain.md`); voimassa olevat säännöt ovat tässä.

`generaattori.html` luo salatun sijaintitokenin ja siihen liittyvän avaimen. Se toimii
täysin selaimessa eikä lähetä mitään verkkoon; se vain tulostaa valmiin komennon, jonka
käyttäjä ajaa itse. `worker/src/index.js` palvelee `GET /api/loc` -reittiä Cloudflaren
KV:stä. Koordinaatit eivät saa päätyä selväkielisenä repoon.

Purettu paketti on `{lat, lon, title?, z?, lampo?}`. `lampo: "tuntuu"` vaihtaa lämpötilasarakkeen FMI:n
`FeelsLike`-arvoon kaikilla riveillä (myös nowcast-riveillä, koska nowcastissa sitä ei ole) ja sarakeotsikoksi `TK` (käyttäjän päätös);
kehityksessä sama `?lampo=tuntuu`. TK-sarake on otsaketta `TK` myöten kursiivilla ja luvut ilman astemerkkiä (luokka `tk`; käyttäjän päätös: tuntuu kuin -maailma on kursiivia).
Pakkas- ja hellekorostus (`applyTemperatureMilestones`) lasketaan TK-tilassakin ilman lämpötilasta (`row.airTemp`), ei tuntumasta:
rajapyykki on virallinen ilman lämpötila (käyttäjän päätös).

## Oma Tusinasää (julkinen linkin teko)

`oma-tusinasaa.html` on kenen tahansa käytettävissä (pieni piiri, `noindex`). Se hakee paikan Nominatimilla, tarkistaa
FMI:ltä, että paikalle saa ennusteen, salaa paketin selaimessa kuten generaattori ja tallentaa sen `POST /api/loc`
-reitillä. Worker arpoo tokenin eikä näe avainta eikä koordinaatteja.

- **Vain Pohjoismaat** (käyttäjän päätös): `countrycodes=fi,se,no,dk,ax`. Islanti, Färsaaret, Huippuvuoret ja Grönlanti
  jäävät pois, koska FMI:n ennuste ja met.no:n nowcast eivät kata niitä.
- **Paikkahaku, ei paikannusta** (käyttäjän päätös). Nominatimin ehdot: haku vain pyynnöstä (ei kirjoittaessa),
  enintään kerran sekunnissa, OSM-maininta näkyvissä.
  Hakukenttä hyväksyy myös koordinaatit (`60.1699, 24.9384`, pilkkudesimaalein välilyönnillä); ne ohittavat Nominatimin.
  Maarajaus on hakuohjeen viimeisenä huomautuksena eikä kentän vieressä (käyttäjän päätös: kävijä luulisi kentän kysyvän
  asuinmaata); FMI-tarkistus kertoo, jos paikka ei käy. Hakutulokset ovat valintanappeja, jotta valitsematon tila näkyy.
- **Otsikko on aina `TUSINASÄÄ 12 · <PAIKAN NIMI>`** (käyttäjän päätös): alku ja interpunkti ovat kiinteät, kävijä antaa vain nimen.
- **Lämpötilavalinta on kaksi tuotetta** (käyttäjän päätös): `TUSINASÄÄ 12 RAAKA` renkaalla (tavallinen lämpötila) ja
  `TUSINASÄÄ 12 AVULIAS` hiutaleella (tuntuu kuin). Rengas ja hiutale ovat inline-SVG:t yläindeksinä samassa koossa.
  Nimet ovat vain tällä sivulla; ohjelman otsikkoon ne eivät tule. Ei ™:ää eikä ®:ää.
- **Android-sovellus on julkinen** (käyttäjän päätös; ei pyynnöstä): *Lataa sovellus (APK)* ja *Kopioi koodi* kuten
  paneelissa (alla, *Android-sovellus ja koodi*). Jo asennettu sovellus ottaa paikan myös avaamalla `tusinasaa://`-linkin.
- **Tallennettua ei voi muuttaa:** worker ei tunne avainta eikä siis omistajaa. Ei ylikirjoitusta; uusi paikka on uusi linkki.
  Poikkeus on Minun oma tusinasää -profiili (alla), jonka muuttamiseen tarvitaan kirjoitusavain.
- **Rajat:** `LuinRaja`-luokka omana oliona `loc` (5 pyyntöä minuutissa osoitetta kohden, 50 uutta sijaintia UTC-päivässä),
  vain sallituista alkuperistä. Julkisesti luodun KV-avaimen metatiedoissa on `julkinen: 1`.
- **Muisti:** `tusinapaja.html` tallentaa onnistuneesti puretun `#t=…&k=…`-linkin laitteen localStorageen
  (`tusinasaa.linkki`), ja `index.html` (verkkosovelluksen `start_url`) avaa sen, kun #-osaa ei ole. Android-perusversio
  tallentaa linkin omiin asetuksiinsa ja avaa sen ilman linkkiä käynnistettäessä; jos linkkiä ei ole, se avaa koodisivun.
  Avain ei lähde laitteelta; `start_url`iin sitä ei laiteta, koska Chrome lähettää verkkosovelluksen tiedot Googlelle
  asennuspaketin tekoa varten.
- `tusinapaja.html` hakee sijainnin workerilta kaikkialla paitsi localhostissa, jotta oma verkkotunnus ei katkaise linkkejä.

## Minun oma tusinasää (hallintapaneeli)

`minun-tusinasaa.html` hallitsee salkoprofiilia: enintään kuusi salkoa, valittu salko ja yhteinen lämpötilavalinta.
Katselulinkki (`#t=…&k=…`, myös Android-sovellus ja QR-koodi) näyttää aina valitun salon, joten paneelin valinta ohjaa
kaikkia laitteita, joilla linkki on. Ulkoasu ja sanasto (salko, paalutus, sulata/jäädytä) tulevat tusina-radan mallista
`oppaat/tusinasaa-oma-paneeli-malli.html`.
Käyttäjälle näkyvä sana on kaikilla Tusinasään sivuilla *salko* (*sääsalko*, *salon*, *salkoa*, *salot*), ei *pylväs*
(käyttäjän päätös). Profiilin avain `pylvaat` ja koodin tunnisteet säilyvät, koska tallennetut profiilit ja muut sivut lukevat niitä.

- Purettu profiili on `{pylvaat: [{lat, lon, title, z?, paikka?}], valittu, lampo?, avain?, muutettu}`. `tusinapaja.html` tunnistaa
  sen `pylvaat`-taulukosta ja näyttää valitun salon kuin tavallisen paketin. `lampo` on profiilin, ei salon.
  Tyhjä profiili näyttää virheen *tähän linkkiin ei ole paalutettu sääsalkoa*.
- **Kirjoitusavain `w` on vain hallintalinkissä** `minun-tusinasaa.html#t=…&k=…&w=…`, ei koskaan katselulinkissä: muuten
  esim. mökin QR-koodin lukija voisi muuttaa salkoja. KV-tietueessa on `wh` = SHA-256(w:n UTF-8-merkkijono), ja
  `PUT /api/loc?t=…` vertaa siihen. GET ei palauta `wh`:ta. Worker ei näe k:ta eikä koordinaatteja tässäkään.
- Profiilin luo paneelin ensipaalutus (`POST /api/loc` kentällä `wh`) tai generaattorin valinta *Minun oma tusinasää
  -hallintapaneeli*. Generaattori olemassa olevalla TOKENilla ja K:lla muuttaa vanhan linkin profiiliksi paikallaan:
  jaetut linkit, QR-koodit ja sijaintiversion APK (esim. Haakis) seuraavat paneelia ilman vaihtoa. Generaattori ei
  edelleenkään lähetä mitään verkkoon, eikä `w` päädy one-paste-komentoon (vain `wh`).
- Rajat: muutoksilla oma `LuinRaja`-olio `locmuutos` (20 minuutissa osoitetta kohden, 200 UTC-päivässä). Profiilin `ct`
  enintään 8192 merkkiä; yksittäinen sijainti edelleen 1024.
- Jokainen muutos tallennetaan heti koko profiilina. Onnistunut tallennus ei näytä ilmoitusta, jotta asettelu ei hypi
  (välit kuten mallissa). Virhe näkyy *Salkoni nyt* -rivin alla ja tarjoaa *yritä uudelleen*. *Salkoni nyt* -otsikko
  on linkki säätiedotukseen.
- Laitteen muistissa `tusinasaa.paneeli` (hallintalinkki) ja `tusinasaa.paneeli.kopio` (viimeksi tallennettu salattu
  paketti). Latauksessa voittaa tuoreempi `muutettu`, koska KV:n muutos näkyy muualle viiveellä.
- Leipäteksti IBM Plex Sans isännöitynä itse (`vendor/ibm-plex-sans/`, OFL, latin-osajoukko), tummassa teemassa pohja
  `#0c0d0e` ja teksti `#b9bec3` kuten mallissa.

## Salkosutkautus (lause hallintalinkin oikopolkuna)

Salkosutkautus (nimi: käyttäjän päätös) avaa paneelin laitteella, jolla hallintalinkkiä ei ole. Hallintalinkki on edelleen varsinainen avain.

- **Näkymä** (käyttäjän päätös): oikean yläkulman avainmerkki (kuusikulmiokahva, jonka sisällä logon kymppi, ykköset
  hampaina; pieni ja hiukan himmeä `--avain`, koska toiminto on harvinainen) avaa näkymän, jossa on vain kenttä, *Arvo*,
  *Sutkauta* ja i-nappi. Avautuessa avain siirtyy salkojen siirtymän käyrällä kentän yläpuolelle niin, että kahvan
  kuusikulmio on logon kuusikulmion kokoinen ja vasen reuna kentän tekstin alun kohdalla (ei linjausta logoon), ja muuttuu sivun kirkkaimmaksi (`--brand`, käyttäjän päätös); sen napautus
  sulkee näkymän. Arvo vain, kun laitteella on paneeli;
  Sutkauta (lähetys, myös Enter) vain, kun lähettämisellä on vaikutus. Kenttä on kaksirivinen ja 16 px, jotta 52 merkkiä
  mahtuu puhelimen leveydelle eikä iOS suurenna sivua.
- **Johtaminen:** PBKDF2-SHA-256, suola `tusinasaa-avain-1`, 300 000 kierrosta, 88 tavua: tunnus `a` (24), salausavain (32),
  kirjoitusavain (32). **Älä muuta näitä:** jokainen annettu lause lakkaisi toimimasta. Lauseen säännöt kuten lukimen
  laatikkolauseessa (24–52 merkkiä, a–z, 0–9, `-`; isot kirjaimet pieniksi), ja Arvo on `luin/laatikkolause.js`.
- **Worker** `/api/avain?a=…`: tietue `avain:<a>` on hallintalinkki `{t, k, w}` salattuna ja lauseesta johdetun
  kirjoitusavaimen tiiviste `wh`. GET on rajoitettu (`avainhaku`, 10 minuutissa osoitetta kohden), koska ihmisen
  keksimää lausetta voi yrittää arvata; PUT ja DELETE `locmuutos`-rajoin ja vain sallituista alkuperistä. Worker ei
  näe lausetta, hallintalinkkiä eikä koordinaatteja.
- **Profiilin `avain`-kenttä** on lause salattuna avaimella SHA-256(`tusinasaa-avain-lause:` + w): hallintalaitteet
  näkevät nykyisen lauseen ja voivat irrottaa sen, katselulinkin haltija ei. Muut sivut ohittavat kentän; paneelin
  `toProfile` säilyttää sen.
- Lause kiinnittyy laitteen paneeliin, jos sitä ei löydy; ilman paneelia mitään ei luoda. Korvaus ja irrotus (tyhjä
  kenttä) vaativat toisen lähetyksen. Lauseen muutos hakee ensin palvelun profiilin ja käyttää tuoreempaa pohjana, jotta
  vanhentunut näkymä ei kumoa toisen laitteen muutosta.

## Android-sovellus ja koodi

- **Julkinen APK** `tusinasaa.apk` (perusversio, release) on repon juuressa. Perusversio allekirjoitetaan debugissakin
  repon avaimella `android/app/julkinen.jks` (ks. `android/README.md`), jotta julkinen APK ja Macin rakennus asentuvat
  toistensa päälle. Sijaintiversiot (Haakis) pysyvät debug-avaimella. Älä vaihda avainta.
- **Koodi** on katselulinkin t ja k muodossa `TS12-<t>.<k>`, ei koskaan kirjoitusavainta `w`. Sen antavat paneelin
  sovellusosio (*Pitääkö minun asentaa puhelimeen taas uusi äppi?*, tekstit mallista, piilossa ensipaalutuksessa) ja
  `oma-tusinasaa.html`.
- **Koodisivu** `tusinasaa-koodi.html`: perusversio ilman linkkiä avaa sen parametrilla `?sovellus=1`. Sivu tarkistaa
  koodin purkamalla paketin ennen käyttöönottoa (sovellus ei tallenna linkkiä, joka ei aukea) ja antaa tuloksen
  `tusinasaa://open/v1#t=…&k=…`-osoitteena, jonka `TusinaWebViewClient` ohjaa `MainActivity.openLink`ille. Ilman parametria
  tulos avautuu säätiedotuksena. Kelpaa myös kokonainen katselu-, hallinta- tai Android-linkki; `w`:tä ei käytetä.
  Ensiavauksen muutokset (esim. *Aloita paalutus*) tehdään tälle sivulle, ei APK:hon.
