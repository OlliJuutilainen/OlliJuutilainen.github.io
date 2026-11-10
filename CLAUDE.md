# Ohjeet Claudelle

## Kieli ja sävy

Vastaa **suomeksi**. Kirjoita tiiviisti ja suoraan. Älä kehu ratkaisujasi äläkä pehmustele;
kerro mitä teit ja mitä mittasit.

## Ohjelmakohtaiset ohjeet

KEICK•WALKin ja Luinin säännöt ovat omissa tiedostoissaan (käyttäjän päätös 3.11.2026; ennen ne olivat
tässä tiedostossa, joka oli kasvanut 118 000 merkkiin ja latautui jokaiseen istuntoon):

- `.claude/rules/soitin.md`: KEICK•WALK eli `soitin/` (soitin, Keikkaloihdin, Omat keikkani, ohjeet,
  keikka-analyysin taitopaketti) ja Android-kääre `android/soitin/`.
- `.claude/rules/luin.md`: Luin eli `luin.html`, `luin/` (Latomo, `md.js`, ohjeet, tekstit) ja
  `docs/viitteet/`. Hegel-repon `pdf_to_markdown.py`:n etukentän lukee Latomo (luin.md, *Pdf:stä muunnettu teksti*).

Claude Code lataa tiedoston itse, kun luet tai muokkaat sen `paths`-kuvioihin osuvaa tiedostoa. Jos
ohjelman työ alkaa muualta (esim. `worker/src/index.js`: reitit `/api/gig`, `/api/drive*` ja `/api/dropbox`
ovat soittimen, `/api/luin` ja `/api/palaute` Luinin) tai tiedoston sisältö ei näy kontekstissa, lue se itse ennen muutoksia.

Mihin kirjataan: yhden ohjelman päätös sen omaan tiedostoon, kaikkia ohjelmia koskeva tähän. Kun huomaat
opin, joka palvelisi koko Tusinasoftin kehitystä, ehdota käyttäjälle lyhyttä kirjausta tähän tiedostoon;
käyttäjä päättää. Pidä tämä tiedosto lyhyenä.

Kirjaa säästeliäästi. Sääntötiedostoihin vain se, minkä tuleva istunto voisi uskottavasti rikkoa tai mitä koodista
ei näe. Historia, mittaukset, hylätyt vaihtoehdot ja päivän vaikutelmat eivät kuulu sinne vaan commit-viestiin tai
koodin kommenttiin.

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

**MACIN REPO EI PÄIVITY ITSESTÄÄN.** Käyttäjän Macin klooni (`~/OlliJuutilainen.github.io`) ei seuraa
GitHubia automaattisesti, eikä se välttämättä ole edes `main`-haarassa (9.11.2026: se oli vanhassa
`claude/…`-haarassa ja `main` 1427 committia jäljessä, joten `installDebug` asensi vanhan koodin, vaikka
muutos oli yhdistetty). Kun annat Macilla ajettavan käännös-, asennus- tai skriptikomennon, anna aina
ensin `cd ~/OlliJuutilainen.github.io && git checkout main && git pull && git log --oneline -1` ja
kerro, minkä commitin tai sitä uudemman pitää näkyä. Älä päättele laitteella näkyvästä vanhasta
toiminnasta, että koodi on väärin, ennen kuin asennetun version on todettu uudeksi (esim.
`dumpsys package <paketti> | grep versionName`).

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

## Alatunniste

Käyttäjän päätös 21.10.2026: kaikissa repon ohjelmissa, joihin se mielekkäästi sopii, on alalaidassa
hienovarainen `<p class="foot">© TUSINASOFT 2026</p>` (keskitetty, pieni, harvennettu, haalea; tyyli
sivun omilla väreillä). Vuosiluku on vuosi, jolloin ohjelmaa viimeksi päivitettiin: kun muutat ohjelmaa
myöhempänä vuonna, päivitä sen vuosiluku. Alatunniste on `tusinapaja.html`:ssä, `generaattori.html`:ssä,
`lyriikkamuunnin.html`:ssä, `luin.html`:ssä, Latomossa, Latomon ohjeessa, Luinin käyttöohjeessa ja palautesivulla, Keikkaloihtimessa, Omat keikkani -listassa ja
soittimen ohjesivuilla. Sitä ei ole soitinsivulla (`soitin/index.html`, käyttäjän päätös 19.10.2026),
esityksissä (`vauva.html`, *Maailmankuvien kääntäjä*), uudelleenohjaussivulla `index.html` eikä
kokoruudun kelloissa (Odotushuone, Ouroboros).
Luinin sivuilla ©-merkki on SVG (ks. `.claude/rules/luin.md`). Muiden ohjelmien alatunnisteissa on tavallinen ©.

## Repon rakenne

`docs/mietintamyssy/` on hylly konsepti-ideoinnille (käyttäjän pyyntö 2.11.2026): pohdintoja mahdollisia
myöhempiä toteutuksia varten, ei toteutettuja eikä päätettyjä. Lisää uusi idea omana tiedostonaan ja riville
kansion `README.md`:hen. Älä toteuta niistä mitään pyytämättä.

`arkisto/`-kansion vanhentuneet sääsivut sisältävät samannäköistä logiikkaa kuin
`tusinapaja.html`, mutta korjauksia ei viedä niihin eikä niitä ehdoteta.

`generaattori.html` luo salatun sijaintitokenin ja siihen liittyvän avaimen. Se toimii
täysin selaimessa eikä lähetä mitään verkkoon; se vain tulostaa valmiin komennon, jonka
käyttäjä ajaa itse. `worker/src/index.js` palvelee `GET /api/loc` -reittiä Cloudflaren
KV:stä. Koordinaatit eivät saa päätyä selväkielisenä repoon.

Repon juuressa on `.nojekyll`: ilman sitä GitHub Pagesin Jekyll muuntaa etukentällisen `.md`-tiedoston `.html`:ksi, jolloin `.md`-osoite antaa 404 ja Luin ei saa tekstiä (mitattu 21.10.2026: `luin/ohje.md` ja `luin/tekstit/kant-ja-elainetiikka.md` 404, `.html`-versiot 200). Älä poista.
