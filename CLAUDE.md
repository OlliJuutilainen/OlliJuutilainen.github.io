# Ohjeet Claudelle

## Kieli ja sävy

Vastaa **suomeksi**. Kirjoita tiiviisti ja suoraan. Älä kehu ratkaisujasi äläkä pehmustele;
kerro mitä teit ja mitä mittasit.

Sano **sähköpaperi**, ei *e-ink* (käyttäjän vaatimus 17.11.2026: vierasperäistä termiä ei koskaan ensisijaisesti), niin
käyttäjälle näkyvässä tekstissä, sääntötiedostoissa kuin vastauksissa.

**Kellonaika on aina `HH:MM`** (kaksoispiste, tunti kahdella numerolla: `09:05`), ei `9.05` (käyttäjän vaatimus 19.11.2026)
kaikissa ohjelmissa, kuittauksissa ja tuotetussa tekstissä. `Intl`/`toLocaleTimeString` `fi-FI` antaa pisteen: kokoa osista.

## Ohjelmakohtaiset ohjeet

Ohjelmien säännöt ovat omissa tiedostoissaan (käyttäjän päätös 3.11.2026, Tusinasää 21.11.2026; ennen ne olivat
tässä tiedostossa, joka oli kasvanut 118 000 merkkiin ja latautui jokaiseen istuntoon):

- `.claude/rules/soitin.md`: KEICK•WALK eli `soitin/` (soitin, Keikkaloihdin, Omat keikkani, ohjeet,
  keikka-analyysin taitopaketti) ja Android-kääre `android/soitin/`.
- `.claude/rules/tusinapaja.md`: Tusinasää eli `tusinapaja.html` (ainoa aktiivinen versio; vanhat versiot ovat
  `tusina-tavaraa`-repossa, eikä niihin kosketa pyytämättä), `generaattori.html`, Android-sovellus `android/app/` ja
  `docs/tusinapaja-backlog.md`.
- `.claude/rules/luin.md`: Luin eli `luin.html`, `luin/` (Latomo, `md.js`, ohjeet, tekstit), Android-kääre
  `android/luin/` ja `docs/viitteet/`. Hegel-repon `pdf_to_markdown.py`:n etukentän lukee Latomo (luin.md, *Pdf:stä muunnettu teksti*).

Claude Code lataa tiedoston itse, kun luet tai muokkaat sen `paths`-kuvioihin osuvaa tiedostoa. Jos
ohjelman työ alkaa muualta (esim. `worker/src/index.js`: reitit `/api/gig`, `/api/drive*` ja `/api/dropbox`
ovat soittimen, `/api/luin` ja `/api/palaute` Luinin, `/api/loc` Tusinasään) tai tiedoston sisältö ei näy kontekstissa, lue se itse ennen muutoksia.

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

## Ympäristön reunaehdot

**Pushaa itse.** Sinulla on oikeus pushata annetulle kehityshaaralle; aiempi 403-este on
poistunut. Jos toimitat tiedoston lisäksi liitteenä, käytä `.txt`-päätettä — `.html`
avautuu puhelimessa renderöitynä sivuna eikä lähdekoodina.

**PR:n jälkeen kysy vain "yhdistetäänkö?"** Älä tarjoudu seuraamaan PR:ää: repossa ei ole
CI-tarkistuksia eikä muita katselmoijia. Käyttäjän **"yhiistä!"** tarkoittaa aina: yhdistä
(merge) kyseinen PR. **"pryhiistä!"** tarkoittaa: tee PR kehityshaarasta ja yhdistä se heti. Kun toteutettavasta asiasta on
päästy yhteisymmärrykseen (käyttäjä on sanonut esim. "tee"), toimi kuin hän olisi sanonut "pryhiistä!" eikä kysy erikseen
(käyttäjän vaatimus 19.11.2026).

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

## Alatunniste

Käyttäjän päätös 21.10.2026: kaikissa repon ohjelmissa, joihin se mielekkäästi sopii, on alalaidassa
hienovarainen `<p class="foot">© TUSINASOFT 2026</p>` (keskitetty, pieni, harvennettu, haalea; tyyli
sivun omilla väreillä). Vuosiluku on vuosi, jolloin ohjelmaa viimeksi päivitettiin: kun muutat ohjelmaa
myöhempänä vuonna, päivitä sen vuosiluku. Alatunniste on `tusinapaja.html`:ssä, `generaattori.html`:ssä,
`lyriikkamuunnin.html`:ssä, `luin.html`:ssä, Latomossa, Latomon ohjeessa, tuettujen sivustojen sivulla, Luinin käyttöohjeessa ja palautesivulla, Keikkaloihtimessa, Omat keikkani -listassa ja
soittimen ohjesivuilla. Sitä ei ole soitinsivulla (`soitin/index.html`, käyttäjän päätös 19.10.2026),
esityksissä (`vauva.html`, *Maailmankuvien kääntäjä*), uudelleenohjaussivulla `index.html` eikä
kokoruudun kelloissa (Odotushuone, Ouroboros).
Luinin sivuilla ©-merkki on SVG (ks. `.claude/rules/luin.md`). Muiden ohjelmien alatunnisteissa on tavallinen ©.

## Repon rakenne

`docs/mietintamyssy/` on hylly konsepti-ideoinnille (käyttäjän pyyntö 2.11.2026): pohdintoja mahdollisia
myöhempiä toteutuksia varten, ei toteutettuja eikä päätettyjä. Lisää uusi idea omana tiedostonaan ja riville
kansion `README.md`:hen. Älä toteuta niistä mitään pyytämättä.

**Kuvitellut profiilit ovat vain alkusysäyksiä; repo on julkinen** (käyttäjän linjaus 21.11.2026). Kun käyttäjä kysyy, mitä
joku (titteli, työpaikka, aiheet) saisi ohjelmasta, profiili ei tallennu minnekään: ei myssyyn, oppaisiin, koodin kommentteihin,
commit-viesteihin, PR:iin eikä käyttäjälle näkyvään tekstiin, eikä se ohjaa ohjelman logiikkaa. Ei myöskään profiilin
aihepalettia. Jäljelle jää se, mihin työ johti (alustat, sovitteet, mittaukset), ja ideat menevät myssyn yleisiin tiedostoihin,
ei profiilin omaan tiedostoon.

**Vanhat versiot ja käyttämätön tavara siirretään repoon `OlliJuutilainen/tusina-tavaraa`** (kansio `github-io/`,
alkuperäiset polut säilyttäen; käyttäjän päätös 22.11.2026). Päärepoon ei jätetä arkistokansioita eikä rinnakkaisia vanhoja
versioita, jotka häiritsevät uusimpien käsittelyä.

Sijaintikoordinaatit eivät saa päätyä selväkielisinä repoon (Tusinasään sijaintitoken, tusinapaja.md).

Repon juuressa on `.nojekyll`: ilman sitä GitHub Pagesin Jekyll muuntaa etukentällisen `.md`-tiedoston `.html`:ksi, jolloin `.md`-osoite antaa 404 ja Luin ei saa tekstiä (mitattu 21.10.2026: `luin/ohje.md` ja `luin/tekstit/kant-ja-elainetiikka.md` 404, `.html`-versiot 200). Älä poista.
