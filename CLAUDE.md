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
