# Ohjeet Claudelle

## Kieli ja sävy

Vastaa **suomeksi**. Kirjoita tiiviisti ja suoraan. Älä kehu ratkaisujasi äläkä pehmustele;
kerro mitä teit ja mitä mittasit.

Sano **sähköpaperi**, ei *e-ink* (käyttäjän päätös: vierasperäistä termiä ei koskaan ensisijaisesti), niin
käyttäjälle näkyvässä tekstissä, sääntötiedostoissa kuin vastauksissa.

**Kellonaika on aina `HH:MM`** (kaksoispiste, tunti kahdella numerolla: `09:05`), ei `9.05` (käyttäjän päätös),
kaikissa ohjelmissa, kuittauksissa ja tuotetussa tekstissä. `Intl`/`toLocaleTimeString` `fi-FI` antaa pisteen: kokoa osista.

## Julkinen repo ja tusina-rata

Tämä repo on julkinen. **Julkiseen koodiin, sääntöihin, commit-viesteihin ja PR:iin kirjataan ratkaisu ja sen peruste**:
ei sitä, mitä käyttäjä ehdotti tai mitä hänelle tuli mieleen, ei mittauslokeja eikä päivämääräketjuja (*ennen X, sitten Y*).
Kun sääntö on käyttäjän eikä koodista pääteltävissä, riittää lyhyt *(käyttäjän päätös)*.

Ajatustyö on yksityisessä repossa **tusina-rata** (`OlliJuutilainen/tusina-rata`): `myssy/` (konsepti-ideointi),
`oppaat/` (mm. Luinin kehittäjän opas), `backlog/` (mm. Tusinasään työlista) ja `loki/`
(mittaukset, vianetsintä, päätösten historia). Lokit ja mittaukset kirjataan sinne, ei tänne. Jos tarvitset sitä
eikä se ole istunnossa, lisää se. Myssyn ideoista ei toteuteta mitään pyytämättä. Päärepoon jää vain se, mikä
liittyy ohjelmien toimintaan.

## Ohjelmakohtaiset ohjeet

Ohjelmien säännöt ovat omissa tiedostoissaan (käyttäjän päätös):

- `.claude/rules/soitin.md`: KEICK•WALK eli `soitin/` (soitin, Keikkaloihdin, Omat keikkani, ohjeet,
  keikka-analyysin taitopaketti) ja Android-kääre `android/soitin/`.
- `.claude/rules/tusinapaja.md`: Tusinasää eli `tusinapaja.html` (ainoa aktiivinen versio; vanhat versiot ovat
  `tusina-tavaraa`-repossa, eikä niihin kosketa pyytämättä), `generaattori.html`, julkinen `oma-tusinasaa.html`,
  hallintapaneeli `minun-tusinasaa.html` (Minun oma tusinasää, kehitystyön lyhenne **MOTS**), Android-sovellus `android/app/` (julkinen `tusinasaa.apk`) ja sen koodisivu `tusinasaa-koodi.html`.
- `.claude/rules/luin.md`: Luin eli `luin.html`, `luin/` (Latomo, `md.js`, ohjeet, tekstit), Android-kääre
  `android/luin/` ja `docs/viitteet/`. Hegel-repon `pdf_to_markdown.py`:n etukentän lukee Latomo (luin.md, *Tiedostot*).

Claude Code lataa tiedoston itse, kun luet tai muokkaat sen `paths`-kuvioihin osuvaa tiedostoa. Jos
ohjelman työ alkaa muualta (esim. `worker/src/index.js`: reitit `/api/gig`, `/api/drive*` ja `/api/dropbox`
ovat soittimen, `/api/luin` ja `/api/palaute` Luinin, `/api/loc` ja `/api/avain` Tusinasään) tai tiedoston sisältö ei näy kontekstissa, lue se itse ennen muutoksia.

Mihin kirjataan: yhden ohjelman päätös sen omaan tiedostoon, kaikkia ohjelmia koskeva tähän. Kun huomaat
opin, joka palvelisi koko Tusinasoftin kehitystä, ehdota käyttäjälle lyhyttä kirjausta tähän tiedostoon;
käyttäjä päättää. Pidä tämä tiedosto lyhyenä.

Kirjaa säästeliäästi. Sääntötiedostoihin vain se, minkä tuleva istunto voisi uskottavasti rikkoa tai mitä koodista
ei näe. Historia, mittaukset, hylätyt vaihtoehdot ja päivän vaikutelmat eivät kuulu sinne: ne menevät tusina-rataan.

## Todentaminen — tämän repon tärkein sääntö

**Älä väitä mitään, mitä et ole todentanut.** Päättelyketju voi olla uskottava mutta väärä:

- Ehto joka "selvästi" toimisi, ei laukea, koska sama lippu nollataan toisaalla sivuvaikutuksena.
- CSS-sääntö joka "selvästi" on turha, on ainoa syy johonkin näkyvään (spesifisyys).
- Ilmoitus joka näyttää puuttuvan, kirjoitetaan olioon, jota ei koskaan renderöidä.

Käytännössä siis:

- **Aja sivu oikeassa selaimessa** ennen kuin sanot muutoksen toimivan. Playwright ja
  Chromium ovat käytettävissä (`/opt/pw-browsers/chromium`).
- **Vertaa ennen ja jälkeen** samalla syötteellä ja raportoi montako riviä muuttui. Jos
  jotain muuta kuin tarkoitettu muuttui, kerro se itse ennen kuin käyttäjä huomaa.
- **Mittaa, älä arvioi** tyylejä ja rivittymistä. `getComputedStyle` ja `getClientRects`
  kertovat totuuden; silmämääräinen arvio ei.
- **Rivittymistä verrataan pikselin välein** (esim. 280–1300 px), ei muutamalla leveydellä: kynnys voi olla parin pikselin
  levyinen. Rivit lasketaan tekstisolmujen `Range.getClientRects`illa; lohkoelementin `getClientRects` antaa aina yhden.
- Kun mittarisi antaa oudon tuloksen, epäile ensin mittaria.

## Ympäristön reunaehdot

**Pushaa itse** annetulle kehityshaaralle. Jos toimitat tiedoston lisäksi liitteenä, käytä `.txt`-päätettä — `.html`
avautuu puhelimessa renderöitynä sivuna eikä lähdekoodina.

**PR:n jälkeen kysy vain "yhdistetäänkö?"** Älä tarjoudu seuraamaan PR:ää: repossa ei ole
CI-tarkistuksia eikä muita katselmoijia. Käyttäjän **"yhiistä!"** tarkoittaa aina: yhdistä
(merge) kyseinen PR. **"pryhiistä!"** tarkoittaa: tee PR kehityshaarasta ja yhdistä se heti. Kun toteutettavasta asiasta on
päästy yhteisymmärrykseen (käyttäjä on sanonut esim. "tee"), toimi kuin hän olisi sanonut "pryhiistä!" eikä kysy erikseen.

**MACIN REPO EI PÄIVITY ITSESTÄÄN.** Käyttäjän Macin klooni (`~/OlliJuutilainen.github.io`) ei seuraa
GitHubia automaattisesti, eikä se välttämättä ole edes `main`-haarassa. Kun annat Macilla ajettavan käännös-, asennus- tai
skriptikomennon, anna aina ensin `cd ~/OlliJuutilainen.github.io && git checkout main && git pull && git log --oneline -1` ja
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

## Alatunniste

Kaikissa repon ohjelmissa, joihin se mielekkäästi sopii, on alalaidassa (käyttäjän päätös)
hienovarainen `<p class="foot">© TUSINASOFT 2026</p>` (keskitetty, pieni, harvennettu, haalea; tyyli
sivun omilla väreillä). Vuosiluku on vuosi, jolloin ohjelmaa viimeksi päivitettiin: kun muutat ohjelmaa
myöhempänä vuonna, päivitä sen vuosiluku. Alatunniste on `tusinasoft.html`:ssä (Tusinasoftin esittelysivu), `tusinapaja.html`:ssä, `generaattori.html`:ssä, `oma-tusinasaa.html`:ssä, `minun-tusinasaa.html`:ssä, `tusinasaa-koodi.html`:ssä,
`lyriikkamuunnin.html`:ssä, `jouluelokuvabingo.html`:ssä, `luin.html`:ssä, Latomossa, Latomon ohjeessa, tuettujen sivustojen sivulla, palautesivulla ja sanaselityssivulla, Keikkaloihtimessa, Omat keikkani -listassa ja
soittimen ohjesivuilla. Sitä ei ole soitinsivulla (`soitin/index.html`), esityksissä (`vauva.html`, *Maailmankuvien kääntäjä*),
uudelleenohjaussivulla `index.html` eikä kokoruudun kelloissa (Odotushuone, Ouroboros).
Luinin sivuilla ©-merkki on SVG (ks. `.claude/rules/luin.md`). Muiden ohjelmien alatunnisteissa on tavallinen ©.

## Repon rakenne

**Kuvitellut profiilit ovat vain alkusysäyksiä** (käyttäjän päätös). Kun käyttäjä kysyy, mitä
joku (titteli, työpaikka, aiheet) saisi ohjelmasta, profiili ei tallennu minnekään: ei myssyyn, oppaisiin, koodin kommentteihin,
commit-viesteihin, PR:iin eikä käyttäjälle näkyvään tekstiin, eikä se ohjaa ohjelman logiikkaa. Ei myöskään profiilin
aihepalettia. Jäljelle jää se, mihin työ johti (alustat, sovitteet, mittaukset), ja ideat menevät myssyn yleisiin tiedostoihin,
ei profiilin omaan tiedostoon.

**Vanhat versiot ja käyttämätön tavara siirretään repoon `OlliJuutilainen/tusina-tavaraa`** (kansio `github-io/`,
alkuperäiset polut säilyttäen; käyttäjän päätös). Päärepoon ei jätetä arkistokansioita eikä rinnakkaisia vanhoja
versioita, jotka häiritsevät uusimpien käsittelyä. Jako: **tusina-rataan se, mistä voi olla hyötyä** (ideat, oppaat,
suunnitelmat, työlistat, lokit, referenssit), **roskat tusina-tavaraan** (vanhat versiot, kaksoiskappaleet, kuolleet kokeilut).

Sijaintikoordinaatit eivät saa päätyä selväkielisinä repoon (Tusinasään sijaintitoken, tusinapaja.md).

Repon juuressa on `.nojekyll`: ilman sitä GitHub Pagesin Jekyll muuntaa etukentällisen `.md`-tiedoston `.html`:ksi, jolloin
`.md`-osoite antaa 404 ja Luin ei saa tekstiä. Älä poista.
