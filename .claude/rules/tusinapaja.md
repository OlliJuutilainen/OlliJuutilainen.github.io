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

Kun käyttäjä nimeää Tusinasään sivujen värin (esim. *valkoinen*), hän tarkoittaa tummaa teemaa (käyttäjän päätös); vaalean
teeman vastine on saman tokenin (esim. `--brand`) vaalea arvo.

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

Maa jäässä plussalla (käyttäjän päätös):

- Lämpötilan perässä alaindeksinä Tusinasään hiutale (sama kuin AVULIAAN tuotemerkki `oma-tusinasaa.html`:ssä), kun maan pinta on jäässä
  mutta lukema plussalla. Molemmissa lämpötilatiloissa, jokaisella rivillä, jolla ehto täyttyy.
- Ehdot näkyvistä, pyöristetyistä lukemista (`groundFrozenUnderPlus`): maa enintään −1 (siis alle −0,5) ja
  **RAAKA** (°C) vähintään 1°, **AVULIAS** (TK) vähintään 0. TK:n ja maan eroa ei voi lukemasta arvata, joten
  näkyvällä nollalla hiutaleen puuttuminen kertoo aina, ettei maa ole jäässä (TK −0,4 näkyy nollana). Älä
  laske TK:n rajaa ilman lämpötilasta äläkä nosta sitä ykköseen.
- Maa on FMI Harmonien `GroundTemperature` (pintalämpötila), omana hakunaan, koska edited antaa sille NaN.
  Hetkellinen kuten lämpötila, joten luetaan rivin omalta aikaleimalta. Jos haku epäonnistuu, hiutaleet vain
  jäävät pois. `extractSeries` tunnistaa `groundtemperature`n ennen `temperature`a, joka sisältyy siihen.
- Luku ja hiutale ovat katkeamattomassa `span`issa, koska kapea sarake katkaisisi hiutaleen omalle rivilleen.
- **Maaruutu** (käyttäjän päätös): hiutaleen maan lämpötila otetaan vain kuivalta maalta, koska rannikon ja järvien
  sekaruudussa vesi lämmittää arvoa talvella niin, että hiutale jäisi pois. `findMaaruutu` hakee `LandSeaMask`in
  salon pisteestä ja renkaista 1,25–15 km (8 suuntaa) yhdellä pyynnöllä (`latlon` toistettuna), ja lähin piste,
  jossa maata on vähintään 95 %, antaa maan lämpötilan. Ilman kuivaa maata (ulkosaari) ei hiutaletta. Muu sää
  tulee salon pisteestä. Vastaus ei tule pyyntöjärjestyksessä, joten arvot kohdistetaan sijainnista.
- Valinta talletetaan laitteelle (`tusinasaa.maaruutu`), koska maskihaku hidastaisi joka avausta: avaimena
  koordinaattien SHA-256-tiivisteen alku, arvona pisteen järjestysnumero, ei koordinaatteja. Epäonnistunutta
  hakua ei talleteta. **Jos muutat renkaita tai suuntien järjestystä, vaihda tiivisteen etuliite `maaruutu-1`**,
  muuten talletetut numerot osoittavat vääriin pisteisiin.
- **Kaukainen maaruutu** (yli 5 km; käyttäjän päätös): hiutaleen oikeaan yläkulmaan pieni varoituskolmio
  (`groundFlakeHtml`). Osoitus hiirellä tai napautus näyttää huomautuksen: ensin silmäyksellä mitä merkki tarkoittaa,
  sitten epävarmuus ja etäisyys (`maaruutuNote`). Käyttäjälle näkyvässä tekstissä merkki on **jäisen maan merkki**,
  ei hiutale, eikä huomautusta pidennetä (käyttäjän päätös). Napautus kiinnittää, napautus muualle tai Esc sulkee. Kolmio ei kasvata leveyttä (marginaalit kumoavat sen), koska kaksinumeroinen
  lukema, hiutale ja kolmio eivät muuten mahdu sarakkeeseen. Merkki toistuu jokaisella hiutalerivillä; tapa
  keventää sitä on avoinna (tusina-rata).
- Käänteistä sulamerkkiä (lukema miinuksella, maa sula) ei tehdä (käyttäjän päätös).

Debug-näkymän saa osoitteen perään lisättävällä `?dbg=1`. Se näyttää mm. `[TW <vaihe>]`
-merkinnät, joista näkee mitä hämärävaihetta koodi kullekin tunnille päättelee, ja `[MAA <°C> · <km>]`
eli rivin maan lämpötilan ja maaruudun etäisyyden salosta (ei etäisyyttä, kun salon oma ruutu on kuiva). Se on nopein tapa selvittää, onko vika päättelyssä vai esityksessä.

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
- **Rajat:** `LuinRaja`-luokka omana oliona `loc` (5 pyyntöä minuutissa osoitetta kohden, 150 uutta sijaintia UTC-päivässä),
  vain sallituista alkuperistä. Julkisesti luodun KV-avaimen metatiedoissa on `julkinen: 1`. Päivärajat jakavat ilmaistason
  KV:n 1000 kirjoitusta päivässä (Luin 500, uudet sijainnit 150, muutokset 300, 50 varalla); älä nosta yhtä laskematta summaa.
  Päivärajan 429 on `daily_limit` ja minuuttirajan `rate_limited`: sivut kertovat päivärajasta nollautumisajan (00:00 UTC laitteen ajassa).
- **Muisti:** `tusinapaja.html` tallentaa onnistuneesti puretun `#t=…&k=…`-linkin laitteen localStorageen
  (`tusinasaa.linkki`), ja `index.html` (verkkosovelluksen `start_url`) avaa sen, kun #-osaa ei ole. Android-perusversio
  tallentaa linkin omiin asetuksiinsa ja avaa sen ilman linkkiä käynnistettäessä; jos linkkiä ei ole, se avaa koodisivun.
  Avain ei lähde laitteelta; `start_url`iin sitä ei laiteta, koska Chrome lähettää verkkosovelluksen tiedot Googlelle
  asennuspaketin tekoa varten.
- `tusinapaja.html` hakee sijainnin workerilta kaikkialla paitsi localhostissa, jotta oma verkkotunnus ei katkaise linkkejä.

## Minun oma tusinasää eli MOTS (hallintapaneeli)

Kehitystyön virallinen lyhenne on **MOTS** (käyttäjän päätös): sääntöihin, commit-viesteihin, PR:iin ja tusina-rataan.
Sivuilla nimi kirjoitetaan auki, myös etusivun napissa *Minun · oma · tusinasää* (käyttäjän päätös). Nimi on
interpunktein: napissa välilyöntien kanssa, paneelin otsikossa ilman (käyttäjän päätös). Napin koko teksti on kursiivilla (käyttäjän päätös). Paneelin otsikko
(aforismi) on *MINUN·OMA·TUSINASÄÄ* ja sen alla *sinun oma ”tusina-mää”*, ilman ≈-merkkiä ja lyhenteitä (käyttäjän päätös); kapealla ruudulla
`fitQuote()` pienentää sen palstaan (koko em-mitoin, ei rivitystä). Logo on paneelissa samankokoinen kuin etusivulla, jossa
sen koko tulee rivivälistä (käyttäjän päätös); aforismin paikka sekä avainnäkymän avain ja nimi mitoitetaan logosta.

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
- Rajat: muutoksilla oma `LuinRaja`-olio `locmuutos` (20 minuutissa osoitetta kohden, 300 UTC-päivässä). Profiilin `ct`
  enintään 8192 merkkiä; yksittäinen sijainti edelleen 1024.
- Jokainen muutos tallennetaan heti koko profiilina. Onnistunut tallennus ei näytä ilmoitusta, jotta asettelu ei hypi
  (välit kuten mallissa). Virhe näkyy valitun salon rivin alla ja tarjoaa *yritä uudelleen*. Rivin otsake on *MAAILMAN KESKUS:*
  (käyttäjän päätös; lähteessä *Maailman keskus:*, CSS tekee versaalin), ja valitun salon nimi on linkki säätiedotukseen. Otsakkeen yllä on salko (käyttäjän päätös): kuin
  avainmerkki, jonka kahvana on logon aurinko ilman babylonialaista lukua. Kehä ja säteet luetaan logon poluista
  (`salkoKuva`), joten se olettaa kuvake.js:n osapolkujärjestyksen (kehä, 12 sädettä, luku). Salko on kiteen alakärjessä, ja
  auringon keskellä on valitun salon oma hiutale (kiteen nappi) kuvan oman hiutaleen kokoisena. Valittu salko kaikkinensa
  (kuva, hiutale, otsake ja nimi) on yhtä väriä, sivun kirkkainta `--brand` (tummassa valkoinen; käyttäjän päätös).
  Jalka (käyttäjän päätös): nouseva aurinko eli horisontti otsakkeen MAAILMAN KESKUS kursiivin ylälaidan päästä päähän (ilman
  kaksoispistettä; ei koskaan yli: päät `VAS`/`OIK` mitattu musteesta; mittaa uudelleen, jos otsake tai fontti muuttuu),
  sen päällä kuusikulmion (kärjet sivuilla) yläpuolisko ääriviivana ja kuusi sädettä (12°, 40° ja 64° kummallakin puolella;
  käyttäjän päätös). Ei lisää korkeutta.
- **Saloston järjestys** (käyttäjän päätös): valittu salko on aina kiteen alakärjessä. Salot ovat kärjillä
  paalutusjärjestyksessä myötäpäivään valitusta alkaen, ja paaluta on jonon lopussa. Valinta kiertää kidettä kehää pitkin
  (`kierra`: JS-animaatio, koska kärjet kulkevat kaarta). Kaikki kierrot ovat rauhallisia:
  nopeus kasvaa rauhallisesti huippuunsa kultaisen leikkauksen kohdalla ja laskee siitä liukuvana jarrutuksena
  (`KIERTO`; huippunopeus ei saa olla korkea), kesto 2,4 s × √(kulma / 180°) (käyttäjän päätös). Valitun vaihtuessa
  hiutaleiden väri ja koko seuraavat kiertoa (`--siirto`): lähtevä himmenee alussa, saapuva kirkastuu lopussa. Kärkikuviot (`KUVIOT`) ovat pystyakselin suhteen symmetrisiä.
  Uusi salko ilmestyy paaluta-paikalle ja kiertyy alas.
  Muun kuin valitun salon napautus ei kierrä (käyttäjän päätös). Ensimmäinen napautus kehystää hiutaleen haalealla
  katkoviivakuusikulmiolla (13 px) ja tuo kiertonapin 34 px hiutaleesta suoraan ulospäin (kaikissa kärjissä samoin; kide on
  siksi alempana): samankokoinen kuusikulmio ja sisällä logon tyylinen aurinko ilman lukua, joka toinen säde kohti
  kuusikulmion kulmaa, keskellä pieni täytetty kuusikulmio (käyttäjän päätös). Kuusikulmion ulkopuolella ohut, pieni
  yksikulmainen suuntanuoli, joka mukailee kuusikulmion ulospäin osoittavaa kulmaa loivennettuna ja reilusti irti siitä: sisäkulma
  kultainen kulma 137,5°, kärkipuoli vajaan puolen kärjen verran häntää pidempi. Kuusikulmion säteen suuntaisten sivujen jatkeista
  (yläkärjessä pystysivujen linjoista) kärjen huippu on täsmälleen omallaan eikä yli, ja häntä jää omastaan vajaaksi. Kärki sinne, minne salko kiertäisi (`suuntaNuoli`, sama
  `kierros` kuin kierrossa; käyttäjän päätökset).
  Napin tai nuolen osoitus hiirellä näyttää viiveellä vihjeen *KESKUKSEEN* kuten avaimen vihje (käyttäjän päätös); nuoli
  on osa nappia, joten sen napautus kiertää. Vihjeen paikka valitaan osoitettaessa (`sijoitaVihje`) niin, ettei se peitä tekstiä,
  hiutaleita, Salkoni-kuvaa eikä nappia. Kehykset ja nappi tulevat esiin ja häipyvät
  pehmeästi. Katkoviiva 0,45 px, levossa hyvin himmeä (peittävyys ,5); hiiren
  alla se kirkastuu maltillisesti (peittävyys 1, sama sävy), eikä mikään muu muutu. Nimi piiloutuu.
  Toinen napautus sulattaa salon muokattavaksi, ja kehykset ja nappi katoavat; kolmas peruu sulatuksen. Kiteen tyhjän
  kohdan napautus tai Esc peruu kehykset; Esc peruu myös sulatuksen kuten Peru (ei ensipaalutuksessa). Reunan salon
  sulaessa keskussalko (Salkoni-kuva, valitun hiutale ja sakara, otsakerivi) häipyy hetkeksi ja muokkaus nousee alimpien
  nimien alle (`asetaSulaPaikka`; käyttäjän päätös); valitun sulaessa ei. Kiertonappi tekee salosta maailman keskuksen: nykyisen keskuksen nimi katoaa heti ja uusi
  tulee esiin häivyttäen 0,25 s sen jälkeen, kun pyörä on pysähtynyt (otsake pysyy). Reunan paikkanimet eivät katoa
  (käyttäjän päätös: kaikkien samanaikainen ilmestyminen oli hassu); kierron aikana nimi häipyy vain alakärjen lähellä,
  jossa se kulkisi Salkoni-kuvan yli. Valitun salon napautus sulattaa kuten ennen.
- **Omaan salkoon** (käyttäjän päätös): paneelin kohokohta, iso nappi POISTUn jälkeen (väli 30 px) ennen jakoviivaa ja
  lämpötilavalintaa; avaa katselulinkin uuteen välilehteen. Vain hallintalinkillä (kuten sovellusosio). Tekstin alla tekstin levyinen
  reipas nuoli, 3 px tekstiä lyhyempi kummastakin päästä (ohut varsi ilman perää, kärkenä kapea suora kolmio: auringon
  säteen sukua, ei lovettu navigaattorinuoli; käyttäjän päätös).
- **Valintarivi** (`valinnat`, käyttäjän päätös): (a) … (b) … kursiivilla, vaihtoehto ei katkea. Mahtuessaan yksi keskitetty rivi,
  muuten (`pinoaValinnat`) allekkain vasemmalle tasattuna listana, joka on keskitetty kokonaisuutena.
  Nimet ovat kiteen ulkopuolella (käyttäjän päätös): yläpuoliskon kärjissä hiutaleen yllä, alapuoliskon alla, joten sakarat
  eivät osu nimiin. Nimeä ei rivitetä eikä sakaraa lyhennetä (rivitys olisi pahin, sakaran lyhennys lievempi keino). Täydestä kuusikosta ei ilmoiteta tekstillä (käyttäjän päätös): paaluta-paikan
  puuttuminen kertoo sen.
- Laitteen muistissa `tusinasaa.paneeli` (hallintalinkki) ja `tusinasaa.paneeli.kopio` (viimeksi tallennettu salattu
  paketti). Latauksessa voittaa tuoreempi `muutettu`, koska KV:n muutos näkyy muualle viiveellä.
- Paneelin alla keskellä on versaali, laajentuva *POISTU* (kuten sovellusosion otsake, + / −), josta aukeavat
  *(a) räjäytä ja tuhoa paalupaikka* ja *(b) poistu vähin äänin* (käyttäjän päätös). Rivi piirretään uudelleen joka kerta, joten auki-tila on
  `state.poistuAuki`, ei `<details>`.
  *Räjäytä ja tuhoa paalupaikka* kaataa salot palvelusta, siis kaikilta linkin haltijoilta. *Poistu vähin äänin* vain unohtaa paneelin
  laitteelta (molemmat muistiavaimet ja osoiterivin hallintalinkki) eikä lähetä palveluun mitään: toisen profiilin
  (esim. Haakis) hallintalinkin avannut laite pääsee siitä eroon kaatamatta kaverin salkoja. Älä yhdistä näitä.
- Lämpötilavalinnassa AVULIAAN merkki on sulamerkki eli hävinnyt hiutale (`g-sula`, viivat sakaroiden väleissä), ei hiutale
  (käyttäjän päätös). Yläindeksissä se on 1,3-kertainen ja viiva paksumpi (`--sula-viiva`), jotta se erottuu RAAKAn renkaan
  veroisesti; suurennus transformilla, koska leveämpi merkki muuttaa nappien rivitystä. Tuotenimet ovat `--tuote`-sävyä.
- Leipäteksti IBM Plex Sans ja etusivun esimerkkinäkymä Source Sans 3 isännöitynä itse (`vendor/`, Fontsource, OFL,
  latin-osajoukko), tummassa teemassa pohja `#0c0d0e` ja teksti `#b9bec3` kuten mallissa.

## Etusivu (MOTSin näkymä)

`minun-tusinasaa.html` on myös Tusinasään julkinen etusivu: laite, jolla ei ole paneelia eikä osoitteessa linkkiä, aloittaa
siitä, ja paneelissa logo vie sinne. Sisältö ja mitat ovat mallin ensikäynnistä salkosanastolla.

- Palaavalla (laitteella paneeli) paalutuskappaleen ja *Aloita paalutus* -napin tilalla on *Minun · oma · tusinasää* -nappi, eikä
  sovellusosiota ole etusivulla (käyttäjän päätökset).
- Esimerkkinäkymä on mallin tallennetut rivit (`DEMO`), ei elävää dataa: nyt-rivi ja kolme seuraavaa (käyttäjän päätös). Datalähderivillä linkit Ilmatieteen laitoksen avoimeen
  dataan ja yr.no:hon (käyttäjän päätös); kursiivilla vain *yr.no* (käyttäjän päätös).
- Leipäteksti on tiivis (käyttäjän päätös): riviväli 1.3 17 px:n ja 1.35 15,5 px:n teksteissä. Logo on ylätekstin anfangi,
  joten sen koko ja yläväli seuraavat ylätekstin riviväliä (laskutapa CSS-kommentissa).
- Logo sulkee avainnäkymän, jos se on auki; muuten paneelissa se vie etusivulle ja etusivulla paneeliin, mutta etusivulla
  vain, kun laitteen paneelissa on salko pystyssä (`salkoPystyssa`). Muuten etusivun logo ei ole linkki (ei `href`iä), jotta
  ensipaalutukseen ei pääse logosta (käyttäjän päätös). Näkymä on historiassa (`history.state.sivu`),
  joten Takaisin palaa edelliseen näkymään; osoiterivin `replaceState`-kutsut säilyttävät tilan.
- Ylätekstin ensimmäinen pala varaa 18 px oikean yläkulman avainmerkille: ilman sitä teksti osuu avaimeen 500–521 px:n leveydellä.

## Salkosutkautus (lause hallintalinkin oikopolkuna)

Salkosutkautus (nimi: käyttäjän päätös) avaa paneelin laitteella, jolla hallintalinkkiä ei ole. Hallintalinkki on edelleen varsinainen avain.

- **Näkymä** (käyttäjän päätös): oikean yläkulman avainmerkki (kuusikulmiokahva, jonka sisällä logon kymppi, ykköset
  hampaina; kahvan ulkokulmien ja varren alapään pyöristys 1,5 px isossa avaimessa, käyttäjän päätös; pieni ja hiukan himmeä `--avain`, koska toiminto on harvinainen; osoitettaessa `--text`, ei `--brand`, jotta avauksen värisiirtymä säilyy) avaa näkymän, jossa on vain kenttä, *Arvo*,
  *Sutkauta* ja i-nappi. Avautuessa avain siirtyy kentän yläpuolelle niin, että kahvan
  kuusikulmio on logon kuusikulmion kokoinen ja vasen reuna kentän tekstin alun kohdalla (ei linjausta logoon), ja muuttuu sivun kirkkaimmaksi (`--brand`, käyttäjän päätös); sen tai logon napautus
  sulkee näkymän. Avatessa ensin paalupaikka häipyy (0,2 s), ja avain lähtee liikkeelle vasta 0,11 s:n tauon jälkeen
  (käyttäjän päätös). Siirtymä (`SIIRTYMA`) noudattaa kiteen kierron kultaisen leikkauksen käyrää (`KIERTO`), 420 ms
  (käyttäjän päätös); koko kasvaa suhteellisesti, väri ja lomakkeen häivytys samassa tahdissa, nimi SALKOSUTKAUTUS
  syttyy pehmeästi vasta, kun avain on asettunut. Avaimen värille ei CSS-transitiota: se voittaisi animaation kaskadissa.
  Nimet (käyttäjän päätös): nurkan avainta hiirellä osoitettaessa 1,2 s:n viiveellä (käyttäjän päätös) vihje *SALKOSUTKAUTUKSEEN* avaimen
  vasemmalla puolella (ei kosketuksella), alareuna kahvan alareunassa, jotta laatikko ei leikkaa etusivun ylärivin kirjaimia.
  Avoimessa näkymässä avaimen oikealla puolella *SALKOSUTKAUTUS* (ilman interpunktia; käyttäjän päätös) pystynä versaalina (paino 400:n ja 600:n väliltä),
  väljästi harvennettuna (`--brand`), versaalien keskikohta kahvan kuusikulmion keskikohdassa ja versaalit kehän sisäpuolen
  korkuiset; saa jatkua palstan ohi ruudun reunaan asti, ja vasta kun sekään ei riitä (kapea ruutu), koko pienenee, koska
  nimi ei rivity (käyttäjän päätös); se syttyy pehmeästi vasta, kun avain on asettunut. Arvo vain, kun laitteella on paneeli;
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
  sovellusosio (*Onko äppiä?*, tekstit mallista, piilossa ensipaalutuksessa) ja
  `oma-tusinasaa.html`.
- **Koodisivu** `tusinasaa-koodi.html`: perusversio ilman linkkiä avaa sen parametrilla `?sovellus=1`. Sivu tarkistaa
  koodin purkamalla paketin ennen käyttöönottoa (sovellus ei tallenna linkkiä, joka ei aukea) ja antaa tuloksen
  `tusinasaa://open/v1#t=…&k=…`-osoitteena, jonka `TusinaWebViewClient` ohjaa `MainActivity.openLink`ille. Ilman parametria
  tulos avautuu säätiedotuksena. Kelpaa myös kokonainen katselu-, hallinta- tai Android-linkki; `w`:tä ei käytetä.
  Ensiavauksen muutokset (esim. *Aloita paalutus*) tehdään tälle sivulle, ei APK:hon.
