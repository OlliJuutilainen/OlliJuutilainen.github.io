# Ohjeet Claudelle

## Kieli ja sävy

Vastaa **suomeksi**. Kirjoita tiiviisti ja suoraan. Älä kehu ratkaisujasi äläkä pehmustele;
kerro mitä teit ja mitä mittasit.

## Todentaminen — tämän repon tärkein sääntö

**Älä väitä mitään, mitä et ole todentanut.** Tässä projektissa on toistuvasti käynyt niin,
että päättelyketju on ollut uskottava mutta väärä. Konkreettisia esimerkkejä:

- Ehto joka "selvästi" toimisi, ei laukennutkaan, koska sama lippu nollattiin toisaalla
  sivuvaikutuksena.
- CSS-sääntö joka "selvästi" oli turha, oli ainoa syy siihen että solut olivat harmaita
  (spesifisyys).
- Ilmoitus joka näytti puuttuvan, oli itse asiassa olemassa mutta kirjoitettiin olioon,
  jota ei koskaan renderöity.

Käytännössä siis:

- **Aja sivu oikeassa selaimessa** ennen kuin sanot muutoksen toimivan. Playwright ja
  Chromium ovat käytettävissä (`/opt/pw-browsers/chromium`).
- **Vertaa ennen ja jälkeen** samalla syötteellä ja raportoi montako riviä muuttui. Jos
  jotain muuta kuin tarkoitettu muuttui, kerro se itse ennen kuin käyttäjä huomaa.
- **Mittaa, älä arvioi** tyylejä ja rivittymistä. `getComputedStyle` ja `getClientRects`
  kertovat totuuden; silmämääräinen arvio ei.
- Kun mittarisi antaa oudon tuloksen, epäile ensin mittaria. Se on ollut viallinen
  useammin kuin koodi.

### Testaaminen ilman verkkoa

Sivut hakevat dataa FMI:ltä ja met.no:lta. Testeissä ne kannattaa korvata Playwrightin
`page.route`-siepauksella ja lukita kello `addInitScript`-Date-korvauksella. Näin saa
toistettavan marraskuun aamun tai kesäyön riippumatta siitä mikä päivä oikeasti on.
SunCalc ja tz-lookup löytyvät paikallisesti `android/app/src/main/assets/`-kansiosta,
joten niitäkään ei tarvitse hakea verkosta.

## Lue tämä ennen siivoamista

`docs/tusinapaja-backlog.md` sisältää osion **"Tehdyt päätökset"**. Siellä on selitetty,
mikä koodissa näyttää turhalta tai virheeltä mutta on harkittua. Lue se ennen kuin
poistat mitään "kuolleena koodina". Ainakin nämä näyttävät jäämiltä eivätkä ole:

- `class="ditto"` on ilman CSS-sääntöä tarkoituksella.
- `forceDescWhite`, `forceRainWhite` ja `__warn` ovat kytkemättömiä koukkuja, ei roskaa.
- `lowercaseMainDescription` on kutsumaton, mutta työlistan kohta 1 nojaa siihen.

Jos poistat jotain, kirjaa päätös samaan osioon, jotta seuraava kierros ei ala alusta.

## Ympäristön reunaehdot

**Pushaa itse.** Sinulla on oikeus pushata annetulle kehityshaaralle; aiempi 403-este on
poistunut. Jos toimitat tiedoston lisäksi liitteenä, käytä `.txt`-päätettä — `.html`
avautuu puhelimessa renderöitynä sivuna eikä lähdekoodina.

**PR:n jälkeen kysy vain "yhdistetäänkö?"** Älä tarjoudu seuraamaan PR:ää: repossa ei ole
CI-tarkistuksia eikä muita katselmoijia. Käyttäjän **"yhiistä!"** tarkoittaa aina: yhdistä
(merge) kyseinen PR. **"pryhiistä!"** tarkoittaa: tee PR kehityshaarasta ja yhdistä se heti.

**Kehityskone on macOS Big Sur.** Uusin `wrangler` kaatuu siinä hiljaa virheeseen
`dyld: Symbol not found: _SecTrustCopyCertificateChain`, koska sen mukana tuleva esbuild
vaatii macOS 12:n. Siksi `generaattori.html` on pinnattu versioon **`wrangler@3.114.17`**,
joka käyttää eri syntaksia: `kv:key` kaksoispisteellä eikä `--remote`-lippua lainkaan.
**Älä päivitä sitä `@latest`- tai 4-versioon.** Androidilla (Termux) wrangler ei toimi
millään versiolla, koska `workerd` ei käänny Bionicille; sieltä KV-kirjoitus tehdään
Cloudflaren REST-rajapinnalla `curl`-komennolla.

## Tusinapaja on ainoa aktiivinen versio

**Kaikki työ tehdään tiedostoon `tusinapaja.html`.** Kun käyttäjä sanoo "tusinasää",
hän tarkoittaa tätä tiedostoa (sivun otsikko on `TUSINASÄÄ 12`). Vanhat versiot
(`tusinasaa.html`, `tusinapuuska.html`, `saa_yr.html`, `saa_fmi.html` ym.) on siirretty
kansioon `arkisto/`. Älä muokkaa niitä, älä tutki niitä, älä vertaa niihin äläkä mainitse
niitä vastauksissa, ellei käyttäjä erikseen pyydä juuri sitä tiedostoa.

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

Debug-näkymän saa osoitteen perään lisättävällä `?dbg=1`. Se näyttää mm. `[TW <vaihe>]`
-merkinnät, joista näkee mitä hämärävaihetta koodi kullekin tunnille päättelee. Se on
nopein tapa selvittää, onko vika päättelyssä vai esityksessä.

## Repon rakenne

`arkisto/`-kansion vanhentuneet sääsivut sisältävät samannäköistä logiikkaa kuin
`tusinapaja.html`, mutta korjauksia ei viedä niihin eikä niitä ehdoteta.

`generaattori.html` luo salatun sijaintitokenin ja siihen liittyvän avaimen. Se toimii
täysin selaimessa eikä lähetä mitään verkkoon; se vain tulostaa valmiin komennon, jonka
käyttäjä ajaa itse. `worker/src/index.js` palvelee `GET /api/loc` -reittiä Cloudflaren
KV:stä. Koordinaatit eivät saa päätyä selväkielisenä repoon.

`soitin/` on työryhmän keikkasoitin. **Keikkatietoja (otsikko, mp3-linkki, biisilista) ei
saa koskaan tallentaa repoon**, ei edes esimerkkinä. Ne ovat samassa KV:ssä avaimella
`gig:<tunnus>`, ja worker palvelee ne reitillä `GET /api/gig?k=<tunnus>`. Soitin lukee
tunnuksen osoitteen #-osasta (`soitin/#tunnus` tai kappaleeseen `soitin/#tunnus/3`;
useampisettisessä keikassa toisen setin kappale 3 on `soitin/#tunnus/2/3`).
Keikan valinnainen `sub`-kenttä (päivämäärä tai muu lisätieto) näkyy soittimessa otsikon alla
harmaana kursiivina, mutta ei välilehden otsikossa; tyhjänä riviä ei ole.
Biisilistan ei-biisi eli x-rivi (pelkkä `3:42`, `3:42 [Nimi]`, `3:42 [x] Nimi` tai `3:42 [x]`;
`[0]` = `[x]`, missä kohtaa settiä tahansa, ilman numeroa; nimettömänä setin alussa `[INTRO]`,
lopussa `[OUTRO]`, välissä `[VÄLI]`) tallennetaan otsikkoon eikä omaksi kentäkseen, koska worker
päästää kappaleista läpi vain `t`, `title`, `set` ja `name`; näin kaverin workeria ei tarvitse
päivittää. `soitin/uusi.html` eli **Keikkageneraattori** tarkistaa biisilistan ja tulostaa
`kv:key put` -komennon samalla wrangler-versiolla kuin `generaattori.html`. Käyttäjän päätös:
sivun nimi on kaikissa teksteissä (ohjeet, otsikot, kommentit) *Keikkageneraattori*, ei
*apusivu*. Biisilistaksi käy myös Logicin markerilistan kopio
(SMPTE-aika `01:02:19:12.40⇥Nimi⇥pituus`, `.40` = bitit 0–79; ensimmäisen rivin täydet tunnit
vähennetään; oletusnimi `Marker N` = biisi nimeltä `N`) ja Reaperin SWS-markerilista muodossa
`mp d` (aikaviivain Minutes:Seconds → millisekunnit; `mt d` antaa vain kokonaiset sekunnit).
Logic-listalle Keikkageneraattori näyttää kuvanopeuden valinnan (oletus 25, muistetaan localStorageen
avaimella `soitin-fps`): framet ja bitit muunnetaan sekunneiksi, 23.976/29.97/59.94 korjataan
0,1 %:n jätätyksellä, ja drop frame (`d` tai puolipiste `01:00:04;16`) lasketaan ohitettuine
framenumeroineen. Nimeämätön markeri on missä tahansa DAW:ssa pelkkä aika eli ei-biisi.
Aikaleimallinen `---`-rivi (markeri nimeltä `---`) on setinvaihto. Markerien vienti tiedoston
mukana (WAVin cue-osio) on käyttäjän päätöksellä hylätty; äänitiedoston oletetaan alkavan
aikajanan alusta.
**Keikkageneraattorissa ei ole syntaksiohjeita kenttien alla** (käyttäjän vaatimus: sivua käytetään kymmeniä
kertoja, ja ohjeet ärsyttävät). Biisilistan alla on vain kehotus ja linkki; merkinnät ja
vientiohjeet ovat `ohje.html`:n osioissa `#biisilista` ja `#markerit`.
Keikkageneraattori tallentaa ja näyttää alkuajat aina sadasosan tarkkuudella (`0:00.00`, `17:30.02`),
myös haetun vanhan keikan listassa; soitin hyppää tallennettuun aikaan sellaisenaan.

**Lisäominaisuus: kansiokeikka.** Keikka voi olla myös Dropbox- tai Google Drive -kansio
(`{ title, folder }` KV:ssä audio-linkin ja biisilistan sijaan). Worker lukee kansion palvelun
rajapinnasta joka haulla ja palauttaa `files`-listan. Tiedostot ovat kappaleita nimen mukaisessa
järjestyksessä, ja alikansiot ovat settejä. Dropbox tarvitsee workerin salaisuudet
`DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET` ja `DROPBOX_REFRESH_TOKEN` (linkit tilapäisiä, 4 h), Drive
salaisuuden `GOOGLE_API_KEY` (linkit pysyviä, kansio jaettu kaikille linkin saaneille).
Tarkistusreitit `/api/dropbox` ja `/api/drive`. Ohje: `kayttoonotto.html` ja `ohje.html`, liitteet.

Käyttäjän vaatimus: **kansio-ominaisuus ei saa vaikuttaa tavalliseen keikkaan** (yksi pitkä
tiedosto ja biisilista) eikä kaveriohjeen selkeyteen.
- Tavallisen keikan koodipolku pysyy ennallaan: kansiokoodi on omissa osioissaan
  (`Lisäominaisuus`-otsikot), ja yhteisissä funktioissa se on vain `files`-haaroina. Kansion
  tapahtumakäsittelijät kytketään vasta, kun kansiokeikka ladataan. Tavallinen keikka ei tee
  yhtään Dropbox- tai Google-pyyntöä.
- Keikkageneraattorissa kansiotila avataan sivun lopun tekstilinkistä; yhden tiedoston kenttä ei tarkista
  kansiolinkkejä.
- Kaveriohjeissa (`kayttoonotto.html`, `ohje.html`) kansiokeikasta on vain maininta johdannossa
  ja liite sivun lopussa.
- Soitin vaihtaa tiedoston vähän ennen edellisen loppua eikä vasta `ended`-tapahtumassa, koska
  lopun `pause`-tapahtuma saisi Android-kääreen (`silta.js`) laskemaan sovelluksen pois
  etualalta. Älä siirrä vaihtoa `ended`-tapahtumaan.

Soittimen **kaveriversio**: toinen käyttäjä pitää keikat omalla
Cloudflare-tilillään. Linkki `soitin/#tunnus@soitin.kaveri` hakee keikan osoitteesta
`https://soitin.kaveri.workers.dev` (rajattu `*.workers.dev`-osoitteisiin), ja
`uusi.html#w=…&a=…&n=…` tulostaa wranglerin sijaan `curl`-komennon Cloudflaren
REST-rajapintaan; API-avain luetaan Macin avainnipusta (`security … -s soitin-cf`).
Ilman `@`-osaa ja #-asetuksia molemmat sivut toimivat kuten ennen. Kaverin
workers.dev-osoitetta tai tunnuksia ei kirjoiteta repoon.

Kaveriversion ohjeet ovat HTML-sivuja, koska niitä luetaan Macin selaimella ja niissä kopioidaan
komentoja ja tunnuksia (PDF rikkoo kopioinnin, Markdown näkyy raakatekstinä):
- `soitin/kayttoonotto.html`: kerran tehtävä käyttöönotto. Kentät täyttävät tilin tunnuksen,
  KV-tunnuksen ja workerin osoitteen komentoihin ja linkkeihin (vain selaimen localStorageen).
  Salaisia avaimia sivu ei kysy; Dropboxin App secret syötetään `curl -u`:n kehotteeseen.
  Kohdan 9 jälkeiset numeroimattomat osiot (ongelmat, päivitys, tekoälyavustaja, kansioliite)
  ovat suljettuja `<details class="osio">`-lohkoja, jotta alkuun pääsee ilman ähkyä. #-linkki
  osion sisään (myös `ohje.html`:stä ja `uusi.html`:stä) avaa osion; tulostus avaa kaikki.
- `soitin/ohje.html`: käyttöopas (keikan luominen, biisilista, linkit, soittimen napit, iPhone).
  Järjestys on käyttäjän luonnoksesta. Johdannossa ei ole koko sivun sisällystä, vain virke, joka
  linkittää osat (keikan luominen, soittimen käyttö) ja mainitsee käyttöönoton ja kansioliitteen.
  Osa *Keikan luominen* alkaa esikatselulla kahdessa palstassa (*Keikkageneraattorissa… /
  …annat / …saat*, välissä haalea pystyviiva), jonka jälkeen tulee vain tämän osan sisällys.
  Sitten Keikkageneraattorin kentät ylhäältä alas (tunnus, otsikko ja lisätieto → äänitiedoston
  linkki → biisilista ja DAW-markerit → tallennus), sitten *Biisilistan muut ominaisuudet*
  (avoin osio, jonka sisällä suljettuina setit, ei-biisit ja rivin muut muodot), avoimina
  *Äänitiedoston muoto* ja *Linkin jakaminen*, ja viimeisenä suljettuna *Korjaus ja poisto*.
  Muut harvemmin tarvittavat osiot ovat suljettuina `<details class="osio">`-lohkoina
  (`details.osio.ala` = h4-tason alaosio, esim. Drive, Logic). Uudet osiot sijoitetaan
  loppupäähän, tarvittaessa suljettuina. #-linkki
  suljetun osion sisään avaa sen ja sen ympäröivät osiot; tulostus avaa kaikki. Kuvat `ohje-soitin.png` ja `-tumma.png` on otettu oikeasta soittimesta keksityllä
  esimerkkikeikalla (sama lista kuin oppaan esimerkissä). Jos soittimen ulkoasu muuttuu
  olennaisesti, ota kuvat uudelleen samalla tavalla; oikeita keikkatietoja ei käytetä.
- `soitin/KAVERIVERSIO.md` on vain osoitin näihin sivuihin vanhojen linkkien vuoksi.
- Ohjeissa Google Drive mainitaan ennen Dropboxia.
- **Drive-tiedostot soivat workerin kautta** (`GET /api/drive-file?id=<ID>[&rk=<resourcekey>]`).
  Google palauttaa Driven latauslinkistä 403:n, kun pyynnössä on selaimen otsake
  `Sec-Fetch-Site: cross-site` (mitattu 14.10.2026; ilman otsaketta sama linkki antaa 200/206),
  joten `<audio>` ei voi soittaa sitä suoraan github.io:sta. Worker hakee tiedoston ilman selaimen
  otsakkeita, välittää vain Range-otsakkeen ja hyväksyy vain `audio/*`- ja `video/mp4`-tyypit.
  Keikkageneraattori muuttaa Drive-linkin (`/file/d/<ID>/…`, `open?id=`, `uc?id=` ja vanha
  `drive.usercontent.google.com/download?id=`) tämän reitin osoitteeksi kirjanmerkin workerissa;
  kansiokeikan `driveFileUrl` käyttää samaa reittiä. Dropbox-linkit soivat suoraan.
  Muunnos tehdään myös ilman #-asetuksia (käyttäjä voi tallentaa Drive-keikan kaverin puolesta
  omaan workeriinsa); silloin reitti on `tusinasaa-worker`issa, jonka koodin pitää olla päivitetty.
  Dropbox-linkkeihin muunnos ei koske.

`android/soitin/` on soittimen Android-kääre Light Phonelle. Myöskään keikan tunnusta ei
kirjoiteta repoon: se tulee Gradle-ominaisuudesta `soitin.tunnus` (ks. `android/README.md`).
