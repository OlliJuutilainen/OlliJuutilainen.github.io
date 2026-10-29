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

## Alatunniste

Käyttäjän päätös 21.10.2026: kaikissa repon ohjelmissa, joihin se mielekkäästi sopii, on alalaidassa
hienovarainen `<p class="foot">© TUSINASOFT 2026</p>` (keskitetty, pieni, harvennettu, haalea; tyyli
sivun omilla väreillä). Vuosiluku on vuosi, jolloin ohjelmaa viimeksi päivitettiin: kun muutat ohjelmaa
myöhempänä vuonna, päivitä sen vuosiluku. Alatunniste on `tusinapaja.html`:ssä, `generaattori.html`:ssä,
`lyriikkamuunnin.html`:ssä, `luin.html`:ssä, Latomossa, Latomon ohjeessa, Luinin käyttöohjeessa, Keikkaloihtimessa, Omat keikkani -listassa ja
soittimen ohjesivuilla. Sitä ei ole soitinsivulla (`soitin/index.html`, käyttäjän päätös 19.10.2026),
esityksissä (`vauva.html`, *Maailmankuvien kääntäjä*), uudelleenohjaussivulla `index.html` eikä
kokoruudun kelloissa (Odotushuone, Ouroboros).
Luinin sivuilla (`luin.html`, Latomo, Latomon ohje, käyttöohje) ©-merkki on SVG (käyttäjän pyyntö 29.10.2026):
suora salmiakki (920 × 920 fonttiyksikköä, viiva 58) ja sen sisällä Literatan oman ©-merkin (`copyright`) sisempi C
sellaisenaan, fontin koossa. Ensimmäinen versio (koverakylkinen salmiakki ja itse piirretty C, jonka terävät
häntäpäät) hylättiin: C:tä ei tunnistanut, se oli liian iso salmiakkiin nähden, ja koverat kyljet ahdistivat sitä.
Keskikohta on versaalin keskilinjalla (mitattu pikseleistä, ero 0,25 px eli yksi laitepikseli DPR 4:llä), ja
rivin korkeus pysyi ennallaan; `aria-label="©"`. Muiden ohjelmien alatunnisteissa on tavallinen ©.

## Repon rakenne

`arkisto/`-kansion vanhentuneet sääsivut sisältävät samannäköistä logiikkaa kuin
`tusinapaja.html`, mutta korjauksia ei viedä niihin eikä niitä ehdoteta.

`generaattori.html` luo salatun sijaintitokenin ja siihen liittyvän avaimen. Se toimii
täysin selaimessa eikä lähetä mitään verkkoon; se vain tulostaa valmiin komennon, jonka
käyttäjä ajaa itse. `worker/src/index.js` palvelee `GET /api/loc` -reittiä Cloudflaren
KV:stä. Koordinaatit eivät saa päätyä selväkielisenä repoon.

`soitin/` on työryhmän keikkasoitin *KEICK•WALK* (nimeämissääntö alempana). **Keikkatietoja (otsikko, mp3-linkki, settilista) ei
saa koskaan tallentaa repoon**, ei edes esimerkkinä. Ne ovat samassa KV:ssä avaimella
`gig:<tunnus>`, ja worker palvelee ne reitillä `GET /api/gig?k=<tunnus>`. Soitin lukee
tunnuksen osoitteen #-osasta (`soitin/#tunnus` tai kappaleeseen `soitin/#tunnus/3`;
useampisettisessä keikassa toisen setin kappale 3 on `soitin/#tunnus/2/3`).
Keikan valinnainen `sub`-kenttä (päivämäärä tai muu lisätieto) näkyy soittimessa otsikon alla
harmaana kursiivina, mutta ei välilehden otsikossa. Puuttuvana tai tyhjänä riviä ei ole; oletustekstiä *Milloin soi?*
ei enää ole (käyttäjän päätös 20.10.2026, poistettu muotoilusyistä). Vanhoissa keikoissa tyhjä rivi on voitu
tallentaa nollaleveänä välilyöntinä `\u200b`; soitin ohittaa sen, ja Keikkaloihdin poistaa sen haettaessa.
Settilistan ei-biisi eli x-rivi (pelkkä `3:42`, `3:42 [Nimi]`, `3:42 [x] Nimi` tai `3:42 [x]`,
missä kohtaa settiä tahansa; nimettömänä setin alussa `[INTRO]`, lopussa `[OUTRO]`, välissä `[VÄLI]`)
ei kasvata numerointia, vaan numeron paikalla on harmaa `0.`, `x.` tai `-.` (soittimen lista ja nyt soi
-kenttä, Keikkaloihtimen esikatselu). Merkin voi antaa itse: `[x]`, `[0]` tai `[-]` (myös `[–]`,
`[—]`). Merkitön on `x.`, paitsi jos missään setissä ei ole kahta ei-biisiä peräkkäin: silloin setin
alussa `0.`, lopussa `x.` ja välissä `-.` (käyttäjän sääntö 16.10.2026; automaattinen intro lasketaan
mukaan). Keikkaloihdin tallentaa merkittömän nimettömän ei-biisin muodossa `[]` ja merkin muodossa
`[0]` / `[0] Nimi`. Ennen tätä tallennetut keikat ovat `[x]`-muodossa, joten niiden ei-biisit näkyvät
`x.`-merkkisinä. Merkkisääntöjä ei selitetä Keikkaloihtimessa, vain `ohje.html#eibiisit`-osiossa.
**Väliaika** (käyttäjän päätös 23.10.2026): setti, jonka ainoa raita on ei-biisi `[Väliaika]` (kirjainkoko vapaa,
kielimallin saatteessa `---` / `47:20 [VÄLIAIKA]` / `---`), näkyy soittimessa setin otsikkorivinä: sama koko, väli
ja kursiivi kuin `li.set`:llä (mitattu: korkeus ja tekstin paikka samat), numerosarake tyhjä, *[Väliaika]* kappaleiden
nimien kohdalla ja väliajan kesto setin keston sarakkeessa. Rivi on nappi (hyppy väliajan alkuun), linkkinappia ei ole,
ja soidessa kuulokkeet ovat numerosarakkeessa. Väliaika ei vie setin numeroa: seuraava setti on (ii), ja linkit
(`#tunnus/2/3`) käyttävät näkyvää numeroa (`setInfo[k].no`, `finishSets()`); sisäisesti väliaika on oma settinsä,
joten *setti*-asennossa soitto pysähtyy väliajan alkuun. Keikkaloihtimen esikatselu (`numbered()`) näyttää saman.
Väliaika, joka ei ole yksin setissään, on tavallinen ei-biisi.
**Setin kesto** (käyttäjän päätös 23.10.2026): setin ensimmäisen biisin alusta viimeisen biisin loppuun, eli biisien
väliset ei-biisit (spiikit) lasketaan mukaan ja vain setin alun ja lopun ei-biisit (intro, outro, aplodit, `[Vielä!]`
encoresetin alussa) jäävät pois. Ennen kaikki ei-biisit jäivät pois. Sama soittimessa (`renderLens`) ja
Keikkaloihtimen esikatselussa. **Summamerkkiä Σ ei ole missään** (käyttäjän päätös 23.10.2026: "tuntuu roskalta"):
kesto on setin otsikkorivin oikeassa laidassa ilman merkkiä (`.sig` poistettu, keston paikka mitattu ennallaan). Oppaan
kuvat `ohje-soitin.png` ja `-tumma.png` otettiin samalla uudelleen; repossa olleista puuttuivat jo ennestään otsikon
perusviivan (21.10.) ja ei-biisin keston koon (22.10.) muutokset. Uudet eroavat vanhan koodin renderöinnistä vain Σ:n kohdalta.
Ei-biisi tallennetaan otsikkoon eikä omaksi kentäkseen, koska worker
päästää kappaleista läpi vain `t`, `title`, `set` ja `name`; näin kaverin workeria ei tarvitse
päivittää. `soitin/uusi.html` eli **Keikkaloihdin** tarkistaa settilistan ja tulostaa
`kv:key put` -komennon samalla wrangler-versiolla kuin `generaattori.html`. Käyttäjän päätös:
sivun nimi on kaikissa teksteissä (ohjeet, otsikot, kommentit) *Keikkaloihdin* (taivutus *Keikkaloihtimen*,
*-loihtimessa*, *-loihtimeen*), ei *apusivu*; 20.10.2026 asti nimi oli *Keikkageneraattori*. Samoin käyttäjän päätös: Keikkaloihtimeen annettava lista on käyttäjälle
näkyvissä teksteissä *settilista*, ei *biisilista*, ja soittimen näyttämä lista on *kappalelista*.
Koodin kommenteissa vanha *biisilista* tarkoittaa samaa. Settilistaksi käy myös Logicin markkerilistan kopio
(SMPTE-aika `01:02:19:12.40⇥Nimi⇥pituus`, `.40` = bitit 0–79; ensimmäisen rivin täydet tunnit
vähennetään; oletusnimi `Marker N` = biisi nimeltä `N`) ja Reaperin SWS-markkerilista muodossa
`mp d` (aikaviivain Minutes:Seconds → millisekunnit; `mt d` antaa vain kokonaiset sekunnit).
Logic-listalle Keikkaloihdin näyttää kuvanopeuden valinnan (oletus 25, muistetaan localStorageen
avaimella `soitin-fps`): framet ja bitit muunnetaan sekunneiksi, 23.976/29.97/59.94 korjataan
0,1 %:n jätätyksellä, ja drop frame (`d` tai puolipiste `01:00:04;16`) lasketaan ohitettuine
framenumeroineen. Abletonista (Live 8–12) markkerilistaa ei saa leikepöydälle, joten projektitiedosto
`.als` vedetään settilistakenttään: Keikkaloihdin purkaa sen selaimessa (`DecompressionStream`),
lukee markkerit (Locators) ja kirjoittaa ne kenttään tavallisena settilistana. Iskut muunnetaan
sekunneiksi Main/Master-raidan tempolla ja tempoautomaatiolla Liven tapaan (tempo luetaan
kuudestoistaosan välein; malli dawtool-projektista, jonka Live 8–12 -testitiedostoja vastaan ajat
tarkistettiin 18.10.2026). Oikealla Abletonilla ja oikealla hiiren vedolla testaamatta; käyttäjän
päätöksellä `ohje.html`:n Ableton-osio on viimeisenä DAW:ista Logicin ja Reaperin jälkeen ja kertoo, ettei
toimintoa ole testattu. Sen jälkeen on Audacity (20.10.2026; labelien vienti, jonka Keikkaloihdin
lukee `RE_AUDACITY`-muotona; oikealla Audacityllä testaamatta, valikkojen nimet muistinvaraisia).
Nimeämätön markkeri on missä tahansa DAW:ssa pelkkä aika eli ei-biisi.
Aikaleimallinen `---`-rivi (markkeri nimeltä `---`) on setinvaihto. Markkerien vienti tiedoston
mukana (WAVin cue-osio) on käyttäjän päätöksellä hylätty; äänitiedoston oletetaan alkavan
aikajanan alusta.
Käyttäjän päätös 16.10.2026: suomenkielisessä tekstissä sana on foneettisesti *markkeri* (*markkerin*,
*markkerit*, *markkerilista*); englanninkielinen *Marker* vain DAW:n valikon tai komennon nimessä
(*Create Marker*, *List Editors → Marker*, oletusnimi *Marker 3*). Poikkeus: `#markerit`-osion avausvirke käyttää muotoa *marker-merkintöjen*, koska se
esittelee sanan; puhekielinen *markkeri* vasta sen jälkeen. Ankkuri `#markerit` pysyy ennallaan.
**Keikkaloihtimessa ei ole syntaksiohjeita kenttien alla** (käyttäjän vaatimus: sivua käytetään kymmeniä
kertoja, ja ohjeet ärsyttävät). Settilistan alla on vain kehotus ja linkki; merkinnät ja
vientiohjeet ovat `ohje.html`:n osioissa `#settilista` ja `#markerit`.
`#markerit`-virke alkaa turkoosilla `SUOSITUS`-merkillä (sama `.merkki` kuin HUOM, ilman kaksoispistettä)
ja korostaa, että markkerit istutetaan **manuaalisesti** (käyttäjän päätös 20.10.2026).
**Aikakoodit kielimallilta** (käyttäjän päätös 20.10.2026): settilistan alla on tekstilinkki
*OMALLA VASTUULLA: aikakoodit kielimallilta*, joka avaa lyhyen ohjeen ja napin *Kopioi saate*.
Saatetta ei näytetä sivulla (käyttäjän vaatimus: pelkkä nappi, ei tekstikenttää); se on vain
`llmPrompt()`-funktiossa, ei oppaassa, ettei siitä ole kahta versiota. 23.10.2026 alkaen saate on käyttäjän
pilotin raportin *pahvi A* sanasta sanaan (pilotti: 89 min tallenne, Claude Opus, rakenne 24/24 oikein, alkuaikojen
mediaanipoikkeama käsimerkintään 4,7 s, työ 43 min). Samana päivänä siihen lisättiin Opus + taitopaketti -ajon (ajo C)
yleispätevät opit (käyttäjän linja: ei tämän keikan erikoisuuksia, esim. ei kysymystä DJ-feidin kestosta, koska se
olisi valmistautumista yhden keikan olympialaisiin; sen sijaan yleisiä, kuten *puhe sekoittuu kappaleen alkuun paljon
useammin kuin loppuun*): kappale vaihtuu vasta, kun edellinen loppuu, ja lopun merkki (loppusointu, vaimeneminen,
aplodit, puhe) tai tempon katkos painaa enemmän kuin sävellaji, joten pelkkä sävellajin vaihto samassa tempossa on
modulaatio ja samanlaiset kohdat ratkaistaan samoin; soitto alkaa usein puheen alla; nauha tunnistetaan tasosta ja
pulssista eikä sointivärin vaikutelmasta; liian vähän tai liikaa alkuja → ensin rakenne, sitten rajat; perusteluissa
ei soitinnimiä. Saate on suomeksi ja Markdown-otsikoin: tekoälyavustaja kysyy
ensin yhdessä viestissä keikan rakenteen (biisimäärät seteittäin, encorebiisit, väliaika, intro- ja outronauhat) ja
toiveen yli minuutin välispiikeistä, aloittaa asennukset ja pyytää sitten tiedoston ja käskyn *läpivalaise*. Mittaus
tehdään koodilla; ilman koodin ajoa aikoja ei anneta. Ajat ovat navigointimerkkejä, eivät levyn raitarajoja.
Vastausmuoto on settilistan muoto: `3. 12:05` nimetön biisi, pelkkä aika ei-biisi, `---` setinvaihto, `aika [VÄLIAIKA]`
oma settinsä (ks. väliaika yllä), encoret yhdessä setissä `(+)`, jonka jokainen encore alkaa rivillä `aika [Vielä!]`.
Lohkon jälkeen epävarmimmat rajat, pelkkään kappalemäärään nojaavat rajat, poikkeavat määrät ja mittauskeinot.
Kesto lisätään saatteeseen *Tärkeintä*-luettelon viimeiseksi, jos äänilinkistä saatiin. Vanhat `[Encore]`-rivit
ovat tavallisia ei-biisejä. Jäsennin ohittaa koodilohkon ```- ja ~~~-rivit (~~~ raportin varalta, jos kopioitu saate
katkeaa esimerkkilohkon kohdalla; esimerkki on yhä ```-aidoin, kopiointia Claudeen ei ole testattu) ja hyväksyy
`--- (Nimi)` ilman aikaa. Saatteen muutoksen jälkeen aja `node soitin/keikka-analyysi/rakenna.mjs` (ks. taitopaketti
alla). Oppaassa osio
`#kielimalli` on HUOM-huomion jälkeen harmaalla merkillä *OMALLA VASTUULLA:*, jonka perässä
otsikon teksti on samalla kirjasimella ja harmaalla, mutta kursiivina ja pienaakkosin (käyttäjän
päätös 20.10.2026; otsikko itse pysyy h4-kokoisena, jotta kolmio on muiden alaosioiden linjassa); mallitaulukon nimet
ovat muistinvaraisia, ja käyttäjä tarkistaa ne. **Geminiä ei käytetä eikä sitä saa kehottaa missään** (käyttäjän päätös
23.10.2026; rivi poistettu oppaasta ja Keikkaloihtimen ohjetekstistä). Taulukon alla on kuitenkin käyttäjän pyynnöstä
`p.huom` *Geminiä ei toistaiseksi suositella* perusteluineen (kuuntelee eikä mittaa koodilla; saate kokeiltu vain
Claudella), ettei lukija päättele toimivuutta Claudesta. Painotus on, että saate on todettu toimivaksi
nimenomaan Claudella (Opus); taulukossa on Claude (*toimii*) ja ChatGPT (*ei kokeiltu*), sarake *Kokeiltu*.
**Taitopaketti `soitin/keikka-analyysi/`** (pilotin raportin *pahvi B*, 23.10.2026): Clauden taito (`SKILL.md` ja
`scripts/`), ladattavana `soitin/keikka-analyysi.zip` (kansio zipin juuressa, kuten Claude.ai vaatii; kuvaus alle
200 merkkiä). `SKILL.md` tehdään `llmPrompt()`-tekstistä komennolla `node soitin/keikka-analyysi/rakenna.mjs`, joka
lisää taidon omat kappaleet (`LISAYKSET`: asennus vaiheeseen 1 ja työjärjestys vaiheeseen 2) ankkuririvien perään ja
kirjoittaa toistettavan zipin; `--tarkista` kertoo, ovatko ne ajan tasalla. Älä muokkaa `SKILL.md`:tä käsin.
`rakenna.mjs` ei ole zipissä. **Pahvi C** (23.10.2026): paketti tehtiin kevyemmälle mallille (esim. Sonnet), saate Opukselle.
**Sonnetia ei suositella** (käyttäjän päätös 23.10.2026): käyttäjän Sonnet-ajo paketilla (89 min:n keikka, 2 settiä + 3
encorea) antoi oikean määrän väärin perustein (kappale jaettu kahdeksi BREAKista, joka hyväksyttiin määrän takia; setin 1
lopun kappaleet ja nauha puuttuivat; ilman inaa spiikkirivit alkoivat kesken kappaleiden; `[Vielä!]` viimeisen iskun päällä;
ajat epätarkempia kuin Opuksella). Oppaassa ja Keikkaloihtimessa saate on ensisijainen ja paketti *kokeiluasteella* Opukselle,
taulukossa rivi Claude Sonnet *heikompi, ei suositella*. Vaiheen 2 työjärjestys muutettiin samalla Opukselle: skriptin
ehdokkaat ovat lähtökohta ja omaa lisäkoodia saa ajaa, rajaa ei oteta mukaan tai jätetä pois määrän takia (pahvin *hylkää
BREAK ellei määrä vaadi* poistettu), jokaisen SPIIKKI-jakson alku ja loppu tarkistetaan zoom.py:llä 30–60 s:n ikkunalla
(ei enää kymmenen kuvan rajaa eikä *lopeta*-kohtaa), mainitun nauhan (intro, outro, DJ) alku etsitään erikseen, taulukko,
`--tarkista`. Tarkistimen *Määrät täsmäävät* -rivi sanoo, ettei se todista rajojen paikkoja.
**Ajo C: Opus + paketti** (käyttäjän raportti 23.10.2026, sama 89 min:n keikka, ina asennettu): noin 14 min, ajat
kauttaaltaan hiukan saatteen ajoa tarkemmat, mutta kaksi rakennevirhettä, jotka kumosivat toisensa (`--tarkista` OK):
setin 2 avausbiisi luettiin DJ:ksi (oikea, hiljaisempi ja tasapulssinen DJ liitettiin edelliseen kappaleeseen, koska
tempo oli sama; nauhaohjeen *feidi* johti etsimään väärää feidiä), ja määrävaje sai hyväksymään modulaation (C → D samassa
tempossa) kappaleen rajaksi, vaikka paketti kielsi määrän perusteella valitsemisen. Lisäksi soitinnimiä (koskettimet)
väärin. Päätelmä (Clauden, käyttäjälle perusteltu): ohjeiden lisääminen ei olisi estänyt tätä, koska kielto oli jo
olemassa; työjärjestys muutettiin ylhäältä alas (yleiskuva → rakenne → rajat → lähikuvat → taulukko → tarkistus
ehdokkaita vasten), puuttuva mittaus siirrettiin skriptiin ja nauhaohjeen etsintämalli (*tasainen pulssi, poikkeava
taso tai feidi*) poistettiin. Vaiheen 2 vanha kohta 3 (määrä) ja 5 (nauha) ovat nyt saatteen säännöissä.
**Taitopaketti on pääreitti, saate B-polku** (käyttäjän päätös 23.10.2026, myöhemmin: Opus kirjoitti saatteella
mittauskoodin itse ja työ kesti 43 min, paketin skripti vie alle puoli minuuttia). Oppaan `#kielimalli`: *Suositus:
Claude ja taitopaketti* (numeroitu lista lataamisesta tarkistukseen), sitten *Ilman taitopakettia: saate*, sitten
malli ja taulukko. Keikkaloihtimen laatikossa ensin *Claudelle (Opus)* ja *Kopioi aloituslause*, sitten *Kopioi saate*.
Aloituslause on `Etsi keikkatallenteesta kappaleiden alkuajat ja setinvaihdot KEICK•WALK-settilistaksi.`, ja ohjeet
käskevät ensin kirjoittamaan `/keik` ja valitsemaan taidon ponnahdusvalikosta (käyttäjän kokeilu 23.10.2026: liitetty
`/keikka-analyysi`-alku ei muuttunut taidoksi, mutta kursorin siirto sanan perään avasi valikon). Alun perin:
käyttäjä näki claude.ai:ssa englanninkielisen aloituksen *extract the song start times and set changes from my
concert recording* ilman taidon mainintaa. Se ei ole repossa (tarkistettu grepillä) vaan Clauden itse tuottama, joten
sitä ei voi muuttaa; opas neuvoo korvaamaan sen aloituslauseella.
**Ei omaa luokkaa DJ-nauhalle eikä aplodeille** (käyttäjän päätös 23.10.2026). Ajon C raportti ehdotti NAUHA?-luokkaa;
sitä ei tehty, vaan tunnusmerkit (taso vähintään 8 dB alle musiikin mediaanin ja pulssin selkeys ≥ 0,6, kun edellinen
osio ei täytä niitä) tulevat rivin huomautukseksi *nauhan tunnusmerkit*, ja tarkistin nostaa kappalerivin sen kohdalla
TARKISTA-listalle. Sekunnin osia ei tarkenneta: vastausmuoto
on kokonaiset sekunnit ja alku merkitään noin sekunti ennen ensimmäistä ääntä, skripti antaa ehdokkaat jo puolen sekunnin
tarkkuudella, ja muutos vaatisi saatteen (pahvi A) ja tarkistimen muuttamista; käyttäjä salli tarkennuksen vain ilman
merkittävää hintaa.
Jokaisella ehdokkaalla on luokka: RAJA (tauko tai puhe/aplodit ennen, tempo tai sävelluokat vaihtuvat), SAUMA (musiikkia
molemmin puolin ilman taukoa; tempo vaihtuu, taso muuttuu ≥ 8 dB, edellinen soitto vaimenee ≥ 6 dB 0,5–3 s ennen rajaa
verrattuna 4–12 s:iin, tai sävelluokat vaihtuvat ja tempoero ≥ 3 %), MODULAATIO? (ajo C: sävelluokat vaihtuvat ilman
taukoa, mutta tempoero alle 3 %, taso pysyy eikä soitto vaimene), BREAK (tauko, samat), SPIIKKI (yli 60 s soittamaton
alkaa) sekä pahvin ulkopuolelta HÄNTÄ (rajan jälkeen ei musiikkia; ilman sitä jokainen aplodien alku luokittuisi
kappaleen aluksi) ja HEIKKO (ei taukoa eikä vaihtoa). Tempo sama = ero alle 6 % tai puolikas/tupla, 3:2 ja 2:3 alle 3 %
(ajo C: 82 ja 124 bpm samassa kappaleessa); sävelluokat samat = neljästä vahvimmasta ≥ 3. Rivillä myös sävellaji
(Krumhansl–Kessler, `~D`) ja huomautukset: *soitto vaimenee ennen*, *taso ±N dB* (musiikista musiikkiin), *nauhan
tunnusmerkit* ja puheen lopussa *soitto voi alkaa jo puheen alla*. Soittamaton jakso lasketaan puheen, hiljaisuuden ja
kohinan yhdisteenä, ja enintään 2,5 s:n välit nielaistaan (ajo C: ina pilkkoi puheen alle sekunnin hiljaa-lohkoilla ja
SPIIKKIt katosivat, 5 → 0); siksi encore-aplodit ja niitä seuraava puhe voivat yhdessä olla SPIIKKI. Tallenteen
viimeisten 2 s:n ehdokkaat jätetään pois.
`--tarkista lista.txt [--setit] [--encoret]` tarkistaa vastauksen muodon (saatteen vastausmuoto, juokseva numerointi,
kokonaiset sekunnit, kasvavat ajat, väliaika omana settinään, encoresetti alkaa `[Vielä!]`); tarkistimen hyväksymät
listat menevät Keikkaloihtimesta läpi 0 virheellä (ristiintarkistettu Chromiumissa). Pahvista poiketen kerrotusta
poikkeava määrä ei estä OK:ta: se tulostetaan rivinä *MÄÄRÄ POIKKEAA*, koska pilotin mukaan suurin hallusinaatioriski on
kappalemäärän pakottaminen täyteen. Riippuvuuksien tarkistus on `--riippuvuudet`. `--ehdokkaat ehdokkaat.json` (analyysin
`--json`) lisää OK:n perään TARKISTA-rivit: kappalerivi ilman ehdokasta ±4 s:n päässä tai ilman RAJA/SAUMA-ehdokasta tai
nauhan tunnusmerkkien kohdalla, ei-biisirivi, jonka lähin ehdokas on RAJA tai SAUMA (ajon C virhe 2), ja RAJA/SAUMA-ehdokas,
jota ei ole listassa. Analyysin `--yleiskuva [S]` tulostaa koko tallenteen 20 s:n ikkunoin (taso ja ero musiikin
mediaaniin, tempo, sävellaji, laji; ajon C mukaan hyödyllisin näkymä rakenteeseen), ja `--piirteet piirteet.npz`
tallentaa mittaukset ja lajit tai lukee ne, jos tiedosto on jo olemassa; omassa koodissa `from analyysi import
lataa_piirteet, osio`.
`scripts/analyysi.py` (ffmpeg tai imageio-ffmpeg, numpy, scipy; valinnainen inaSpeechSegmenter) purkaa tiedoston
16 kHz:n s16-memmapiksi ja käsittelee sen 10 min:n paloissa: taso, kaistat, litteys ja kroma 0,5 s:n kehyksin,
iskukäyrä 16 ms:n välein. Ehdokkaat: tauot (yli 9 dB alle minuutin liukuvan mediaanin, mediaani peilaten reunoilla,
koska `nearest` nielaisi alun hiljaisuuden), uutuushuiput (kroma, kaistaprofiili ja taso 20 s:n ikkunoin, reunoilla
kutistuvin ikkunoin), puheen alut ja loput sekä yli minuutin soittamattomat jaksot, joiden sisäiset ehdokkaat
tiivistetään. Yksi rivi ehdokasta kohden, enintään 140. Ilman inaa puhe arvioidaan karkeasti (pulssi, 2–8 Hz:n
vaihtelu, kroman huippu, litteys) ja tuloste kertoo sen. `scripts/zoom.py` piirtää mel-spektrogrammin ja kolmen
kaistan tasokäyrän PNG:ksi ilman kuvakirjastoja; `--ruudukko t1,t2,…` (enintään 6, `--leveys` oletus 30 s) piirtää
kohdat päällekkäin yhteen kuvaan, kohta merkittynä (ajossa C 19 kuvaa luettiin yksitellen). `scripts/testi.py` tekee 6 min:n synteettisen tallenteen (kolme
kappaletta, tauko, aplodit, 70 s puhetta, kappale suoraan puheen perään; pahvi C:ssä lisäksi tauko kappaleen sisällä ja
saumaton kappaleenvaihto, 6:50) ja vaatii jokaiselle seitsemälle tunnetulle rajalle ehdokkaan ±1,5 s:n päästä oikealla
luokalla, ei ylimääräisiä RAJA/SAUMA-ehdokkaita, sekä seitsemän valmiin settilistan tarkistuksen: OK 23.10.2026.
Ajon C jälkeen tallenne on 8:55: viides kappale modulee samassa tempossa ja iskun vaiheessa (MODULAATIO?), ja perään tulee
samassa tempossa 12 dB hiljaisempi tasapulssinen nauha (SAUMA ja *nauhan tunnusmerkit* vain sillä rivillä); lisäksi kolme
`--ehdokkaat`-vertailua (oikea lista ilman TARKISTA-rivejä, modulaatio ja nauha kappaleiksi, kappale ei-biisiksi). Vanha
skripti luokitteli modulaation ja nauhan SAUMAksi (tarkistettu). OK 23.10.2026, 10 rajaa.
Mitattu: 90 min:n mp3 kahdella ytimellä 13,4 s ja enintään 420 Mt muistia; ajon C muutosten jälkeen (synteettinen
toistettuna 89 min:n 96 kbps mp3:ksi, `--yleiskuva`, neljä ydintä) 17,5 s, josta purku 12 s, ja enintään 426 Mt.
ina-haara ajettu 23.10.2026 oikealla inaSpeechSegmenter 0.8.0:lla kevyellä asennuksella `pip install --no-deps
inaSpeechSegmenter && pip install tensorflow-cpu pandas scikit-image soundfile pytextgrid` (inan riippuvuudet
`tensorflow[and-cuda]` ja `onnxruntime-gpu` ovat turhia: `smn`-moottori tarvitsee vain kerasin, onnx on vain
VFS-mallille). Asennus täällä hitaalla latauksella 756 s, ympäristö 1,8 Gt; malli haetaan GitHubista ensimmäisellä
ajolla. Synteettisellä tallenteella ina pilkkoi puheen kuten ajossa C (puhe/hiljaa/kohina vuorotellen): vanha skripti
antoi SPIIKKI 0 ja yhdeksän HÄNTÄ-riviä puheen sisällä, uusi SPIIKIn kohtaan 3:10 (tarkistettu). ina luokittelee
synteettisen nauhan kohinaksi (rivi HÄNTÄ), siksi tunnusmerkit eivät katso lajia ja testi hyväksyy kohdassa 500 SAUMA
tai HÄNTÄ; testi OK sekä inalla että ilman. 89 min:n synteettinen mp3 inalla: 191 s ja enintään 2,15 Gt muistia
(TensorFlow), kaikki 10 spiikkiä SPIIKKInä.
Ajettu Clauden asetuksiin ladattuna oikealla keikalla Sonnetilla ja Opuksella (ks. yllä); ajon C jälkeistä versiota ei
ole ajettu oikealla keikalla. Oppaan `#kielimalli`-osion lopussa on maininta paketista ja HUOM, millä se on kokeiltu.
Keikkaloihdin tallentaa ja näyttää alkuajat aina sadasosan tarkkuudella (`0:00.00`, `17:30.02`),
myös haetun vanhan keikan listassa; soitin hyppää tallennettuun aikaan sellaisenaan.

**Lisäominaisuus: kansiokeikka.** Keikka voi olla myös Dropbox- tai Google Drive -kansio
(`{ title, folder }` KV:ssä audio-linkin ja settilistan sijaan). Worker lukee kansion palvelun
rajapinnasta joka haulla ja palauttaa `files`-listan. Tiedostot ovat kappaleita nimen mukaisessa
järjestyksessä, ja alikansiot ovat settejä. Dropbox tarvitsee workerin salaisuudet
`DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET` ja `DROPBOX_REFRESH_TOKEN` (linkit tilapäisiä, 4 h), Drive
salaisuuden `GOOGLE_API_KEY` (linkit pysyviä, kansio jaettu kaikille linkin saaneille).
Tarkistusreitit `/api/dropbox` ja `/api/drive`. Ohje: `kayttoonotto.html` ja `ohje.html`, liitteet.

Käyttäjän vaatimus: **kansio-ominaisuus ei saa vaikuttaa tavalliseen keikkaan** (yksi pitkä
tiedosto ja settilista) eikä kaveriohjeen selkeyteen.
- Tavallisen keikan koodipolku pysyy ennallaan: kansiokoodi on omissa osioissaan
  (`Lisäominaisuus`-otsikot), ja yhteisissä funktioissa se on vain `files`-haaroina. Kansion
  tapahtumakäsittelijät kytketään vasta, kun kansiokeikka ladataan. Tavallinen keikka ei tee
  yhtään Dropbox- tai Google-pyyntöä.
- Keikkaloihtimessa kansiotila avataan sivun lopun tekstilinkistä; yhden tiedoston kenttä ei tarkista
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
- `soitin/ohje.html`: käyttöopas (keikan luominen, settilista, linkit, soittimen napit, iPhone).
  Järjestys on käyttäjän luonnoksesta. Johdannossa ei ole koko sivun sisällystä, vain virke, joka
  linkittää osat (keikan luominen, soittimen käyttö), ja toinen virke mainitsee kansioliitteen.
  Käyttöönotto ja pikakäyttöönotto linkitetään *Keikan luominen* -osan avausvirkkeessä
  (Keikkaloihtimeen pääsee vain omalla linkillä; käyttäjän päätös 16.10.2026).
  Osa *Keikan luominen* alkaa esikatselulla kahdessa palstassa (*Keikkaloihtimessa… /
  …annat / …saat*, välissä haalea pystyviiva), jonka jälkeen tulee vain tämän osan sisällys.
  Sitten Keikkaloihtimen kentät ylhäältä alas (tunnus, otsikko ja lisätieto → äänitiedoston
  linkki → settilista ja DAW-markkerit → *Uuden keikan ja sitä merkkaavan linkin tallentaminen*). Niiden
  jälkeen ovat suljettuina h3-osioina *Settilistan lisäominaisuudet* (ankkurit `#merkinnat` ja vanha
  `#valinnaiset`; sisällä avoimina h4-alaosioina *Setit* ja *Intro, outro ja muut ei-biisit* sekä
  suljettuna *Vaihtoehtoiset sallitut kielenkäytöt*) ja viimeisenä *Aiemmin luodun keikan
  muokkaaminen tai poistaminen* (ei *korjaus*: sana viittaa virheeseen). Käyttäjän päätös 16.10.2026:
  yläotsikko *Edistyneet käyttäjät* poistettiin, *Linkin jakaminen* siirtyi soittimen käyttöön
  (suljettuna iPhonen ja ongelmatilanteiden väliin), ja erillinen *Äänitiedoston muoto* korvattiin
  äänitiedoston linkin suljetulla alaosiolla *Toiston soljuvuuden optimointi* (ankkuri `#aani`;
  tiedostomuodot ja Drive/Dropbox). Se on muotoiltu kuten settilistan HUOM (`details.osio.huom`:
pieni, sisennetty, ohut viiva vasemmalla), mutta suljettuna, ja HUOM-merkin paikalla on otsikko merkin
kokoisena, lihavoimattomana, päävärillä (tummassa valkoinen), versaalina, ilman kursiivia, harvennusta ja kaksoispistettä (käyttäjän päätös 16.10.2026). Sisällys on kahdessa palstassa: vasemmalla kentät, oikealla
  nämä kaksi suljettua osiota. Settilistan lopun lisähuomio (aikojen tarkkuus) on `p.huom`
  HUOM-merkinnällä: pieni, kapea ja sisennetty, ohut viiva vasemmalla, ettei se näytä kuuluvan
  viimeiseen alaosioon eikä raskauta pääraidetta.
  Muut harvemmin tarvittavat osiot ovat suljettuina `<details class="osio">`-lohkoina
  (`details.osio.ala` = h4- tai h5-tason alaosio, esim. Drive, Logic; avattuna sisältö pienempänä
  ja sisennettynä otsikon tekstin linjaan, viiva kolmion alta; otsikko ei liiku. Logic-osion
  versiohuomautus on `p.huom` ilman merkkiä, jotta se sisentyy listan tekstiä pidemmälle; käyttäjän
  päätös 16.10.2026).
  Ilman `.ala`-luokkaa suljettu osio on samantasoisten osioiden vertainen (esim. iPhone, linkin
  jakaminen, muokkaaminen ja poistaminen). Uudet osiot sijoitetaan
  loppupäähän, tarvittaessa suljettuina. #-linkki
  suljetun osion sisään avaa sen ja sen ympäröivät osiot; tulostus avaa kaikki. Kuvat `ohje-soitin.png` ja `-tumma.png` on otettu oikeasta soittimesta keksityllä
  esimerkkikeikalla (sama lista kuin oppaan esimerkissä; intro `[Intro]`, toinen setti nimellä `(Encore)`;
  Playwright, näkymä 560 × 741 px, DPR 2, soitto kohdassa 4:52, keikka ja hiljainen 23:40 mp3
  `page.route`-siepattuina). Jos soittimen ulkoasu muuttuu
  olennaisesti, ota kuvat uudelleen samalla tavalla; oikeita keikkatietoja ei käytetä.
- `soitin/KAVERIVERSIO.md` on vain osoitin näihin sivuihin vanhojen linkkien vuoksi.
- `soitin/pikakayttoonotto.html` on lyhyempi reitti uudelle Macille (käyttäjän pyyntö: mahdollisimman
  vähän Cloudflaren sivuja). Yksi komento ajaa `soitin/asennus/asenna.sh`:n, joka lataa kiinnitetyt
  Node.js:n ja wrangler 4:n (4.145.0) kansioon `~/.soitin` ja ajaa `asenna.mjs`:n: `wrangler login`
  (OAuth selaimessa, ei API-avainta eikä avainnippua), tilin valinta, KV-tietokanta `soitin` (vanhan
  reitin tietokanta kelpaa), workers.dev-nimen kysely suomeksi Cloudflaren rajapinnasta wranglerin
  kirjautumistunnisteella ja `wrangler deploy` (worker `soitin`, kytkentä `LOCATIONS`). Uudelleenajo
  päivittää workerin. Arkikomento on `~/.soitin/soitin` (`soitin.sh`: tallenna, hae, poista, paivita,
  drive-avain, poista-asennus). Keikkaloihtimen kirjanmerkki `uusi.html#w=soitin.nimi&tapa=pika`
  tulostaa `~/.soitin/soitin tallenna <tunnus> '<json>'`. `asenna.sh` on Macin bash 3.2:lle.
  Wrangler 4 ei toimi Big Surissa, mutta tämä reitti on vain kaverin uudelle Macille; Ollin omat
  komennot pysyvät wrangler 3.114.17:ssä. Testaus ilman tiliä: `CLOUDFLARE_API_BASE_URL` ja
  `CLOUDFLARE_API_TOKEN` tynkärajapintaan, `SOITIN_LAHDE` paikalliseen palvelimeen ja
  `SOITIN_KV=--local`. 16.10.2026 reitti ajettiin Linuxissa Cloudflaren väliaikaista tiliä vasten
  (`wrangler kv namespace list --temporary`): asennus, päivitys, tallennus, haku, poisto ja
  drive-avain toimivat oikeassa rajapinnassa. Ajamatta: oikea Mac, selainkirjautuminen ja
  workers.dev-nimen rekisteröinti (väliaikaisella tilillä nimi on valmiina, ja PUT antaa 10036).
  Väliaikaisen tilin workers.dev-osoite haastaa palvelinkeskuksen IP:n (403, `cf-mitigated:
  challenge`), joten soitinta ei voi testata sitä vasten selaimesta; Ollin oma worker ei haasta.
- Ohjeissa Google Drive mainitaan ennen Dropboxia.
- **Drive-tiedostot soivat workerin kautta** (`GET /api/drive-file?id=<ID>[&rk=<resourcekey>]`).
  Google palauttaa Driven latauslinkistä 403:n, kun pyynnössä on selaimen otsake
  `Sec-Fetch-Site: cross-site` (mitattu 14.10.2026; ilman otsaketta sama linkki antaa 200/206),
  joten `<audio>` ei voi soittaa sitä suoraan github.io:sta. Worker hakee tiedoston ilman selaimen
  otsakkeita, välittää vain Range-otsakkeen ja hyväksyy vain `audio/*`- ja `video/mp4`-tyypit.
  Keikkaloihdin muuttaa Drive-linkin (`/file/d/<ID>/…`, `open?id=`, `uc?id=` ja vanha
  `drive.usercontent.google.com/download?id=`) tämän reitin osoitteeksi kirjanmerkin workerissa;
  kansiokeikan `driveFileUrl` käyttää samaa reittiä. Dropbox-linkit soivat suoraan.
  Muunnos tehdään myös ilman #-asetuksia (käyttäjä voi tallentaa Drive-keikan kaverin puolesta
  omaan workeriinsa); silloin reitti on `tusinasaa-worker`issa, jonka koodin pitää olla päivitetty.
  Dropbox-linkkeihin muunnos ei koske.

`android/soitin/` on soittimen Android-kääre (Light Phone, muut Android-puhelimet). Sovellus kysyy
keikan tunnuksen Omat keikkani -näkymässä ja muistaa avatut keikat laitteella. Valmis APK on
`soitin/soitin.apk` (release, ei tunnusta); se päivitetään käsin, kun kääre muuttuu. Myöskään
keikan tunnusta ei kirjoiteta repoon: valinnainen oletuskeikka tulee debug-rakennukseen
Gradle-ominaisuudesta `soitin.tunnus` (ks. `android/README.md`). Allekirjoitusavain
`android/soitin/julkinen.jks` on repossa tarkoituksella; älä vaihda sitä.

**Omat keikkani on myös verkkosoittimessa** (käyttäjän päätös: selainkohtainen lista, ei
käyttäjätunnuksia). Lista `soitin/lista/keikat.html` on yhteinen: Android-sovellus ottaa sen
assetteihin suoraan tästä kansiosta (`android/soitin/build.gradle`, `sourceSets`), ja verkossa
`soitin/index.html` näyttää sen iframessa soittimen päällä (☰ oikeassa yläkulmassa), joten
soitto ei katkea. Sovelluksessa silta on `window.Keikat` (MainActivity), verkossa soittimen
`window.__soitinLista`, joka tallentaa selaimen localStorageen avaimella `soitin-keikat`.
Linkki avaa keikan suoraan soittimeen, ja latautunut keikka tulee listaan itsestään. Pelkkä
`soitin/` ilman tunnusta avaa listan. Sovelluksessa (`window.SoitinApp` olemassa) verkon nappia
ja tallennusta ei ole, ja sivu on pikselilleen sama kuin ennen. Evästebanneria ei tarvita:
tallennus on käyttäjän itse pyytämää toimintoa eikä lähde laitteelta. Verkossa otsikon perässä on ⓘ-nappi, joka
avaa otsikon alle hennon tietoiskun (ensin omalla rivillään lainausmerkeissä kursiivinen iskulause *”(1) Valg ðø KEICK → (2) WALK the Geigh!”* (käyttäjän päätös 22.10.2026; ennen *Valg dø KEICK • WALK ðö geig!*), sitten soittimen esittely, käyttöoppaan linkki
tyhjän rivin jälkeen ja virke *Omien keikkojen luominen vaatii Mac-tietokoneen sekä käyttöönoton (n. 30 min).*,
jossa *käyttöönoton* on linkki; linkit avautuvat uuteen välilehteen, ettei soitto katkea); sovelluksessa nappia ei ole, koska listan WebView ei avaa linkkejä. Jos muutat `keikat.html`:ää,
testaa molemmat sillat; sovellus saa muutoksen vasta uudessa APK:ssa.
**Nimi KEICK•WALK** (käyttäjän päätös 19.10.2026, kirjoitusasu 20.10.2026): soittimen nimi on kaikissa
käyttäjälle näkyvissä teksteissä (sivut, ohjeet, Keikkaloihdin, sovelluksen nimi ja napit)
*KEICK•WALK* sanan *soitin* sijaan: versaalit, välissä luettelomerkki `•` (U+2022) ilman välilyöntejä,
ei loppupistettä; myös virkkeen alussa sama. Aiempi asu *keick·walk.* on poistettu teksteistä (Android
0.12:ssa myös sovelluksen nimestä). Nimeä ei taivuteta: virke kirjoitetaan niin, että nimi on
perusmuodossa, tai käytetään yhdyssanaa (*KEICK•WALK-sivulla*, *KEICK•WALK-linkin*). Logo (alla) on
grafiikka ja pysyy muodossa keick·WALK. Polut, komennot,
workerin ja KV:n nimet sekä koodin tunnisteet (`soitin/`, `~/.soitin/soitin`, `soitin.jotain`,
`soitin-keikat`) pysyvät ennallaan, samoin koodin kommenttien *soitin*.
Listan otsikko on KEICK•WALK-logo (SVG-polkuja, koska sovellus näyttää listan assetista ilman
verkkoa; generaattori kierroksineen ei ole repossa, logon merkintä on kopioitu sellaisenaan
`keikat.html`:ään ja `index.html`:ään). Käyttäjän kanssa iteroidut mitat, yksikkönä perusviiva 20:
WALK on Walkman-logon mittasuhteilla (korkeus 16, viiva 3,2, W:n "pakarat" eli kaksi puoliympyräpohjaa,
A kaarena ja pallo sen sisällä, K:n vinot kaarina, L:n ulkokulma pyöreä) ja tekstin värinen (käyttäjän
päätös 19.10.2026; aiemmin turkoosi). keick on
pienillä kirjaimilla ilman nousuja, viiva 2,6, ja yhtä korkea kuin kuulokkeiden sangan lakipiste
(yläreuna 4); e:n ja c:n alaviivojen keskilinja on L:n alaviivan keskilinjalla (18,4). e on W kyljellään
(selkänä kaksi puoliympyrää) ja yhtä leveä kuin c, c on A kyljellään ilman palloa; leveydet on
skaalattu x-korkeuden 12 mitoista. Turkoosit täytetyt pallot (halkaisija 36/22 × 3,2 = 5,24) ovat
tyynyt, A:n pallo ja janan nuppi A:n kohdalla. i:n piste (2,0 alkusanan yläpuolella) ja interpunkti
ovat pieniä tekstin värisiä palloja (2,6 kuten janan pisteet; käyttäjän päätös 20.10.2026), janan
loppupiste tekstin värinen rengas (ulkohalkaisija 4,6, kehä 1,0; kehä 0,6 haalistui pienessä koossa
harmaaksi). viewBox pidettiin ennallaan (yläreuna −2,6), jotta otsikon mitat eivät muuttuneet. Interpunkti ja A:n pallo ovat alkusanan keskilinjalla (11,85).
Aikajana (keskilinja 24,5) on soittimen janan tyylinen (käyttäjän päätös 19.10.2026): paksuus
nuppi × 4/14 = 1,5 kuten soittimessa 4 px / 14 px; ensimmäisen k:n vasemmasta reunasta nuppiin tekstin
värinen ja sillä tekstin väriset pisteet (2,6) i:n ja interpunktin kohdalla; nupin jälkeen `--line`
loppurenkaan kehän keskelle. Käyttäjän päätös 20.10.2026: jana alkaa k:n varren vasemmasta reunasta
(x 25,88; polku alkaa 26,63:sta, koska pyöreä pää ulottuu 0,75 yli; mitattu Chromiumissa) eikä enää
vasemman tyynyn kohdalta, ja tyynyjen kohdan pisteet poistettiin. Kuulokkeiden sanka 1,2. Korvalappujen keskipisteiden väli on sama kuin A:n
pallon ja janan nupin (12,65; käyttäjän päätös 20.10.2026, aiemmin 13,64): oikea lappu on paikallaan (x 16,26,
rako k:hon ennallaan), vasen siirtyi kohtaan 3,61 janan alun ja pisteen kanssa, ja sangan lakipiste pysyi
(yläreuna 4): kaari kapeni (säde 6,325) ja jalat pitenivät. Logo alkaa siksi kohdasta x = 0,99 (viewBox
`0.99 -2.6 153.43 29.72`, kun jana oli 24,5:ssä; nyt alla). Käyttäjän päätös 20.10.2026 (myöhemmin): sanka nousee 1,2 yksikköä, niin että lakipisteen
viivan alareuna on kirjainten yläreunassa (y 4) ja yläreuna y 2,8; jalat 17,38 → 9,725, kaari ennallaan.
i:n pisteen alareunaan (yläreuna y 2,0) asti nouseva oli hiukan liian korkea. Soitinsivun kuulokkeet (`.brand`)
ovat viewBoxissa `0.99 2.8 17.89 17.2` ja 1,2 yksikköä ylempänä, joten tyynyt eivät liikkuneet. Kappalelistan
ja setin kytkimen pienet kuulokkeet (`.kuul`, `.minikuul`) saivat saman sangan (käyttäjän päätös 20.10.2026: kaikki
kuulokkeet logon mukaisiksi). Ne on mitoitettu tekstiin, joten niiden yläreuna (y 2,8) ja tyynyjen alareuna pysyivät
pikseleissä paikallaan ja kuulokkeet pienenivät suhteessa 16/17,2 (`.minikuul` 10 px korkea, 10,401 px leveä;
`.kuul` `markCurrent()`:ssa; sen korkeus muuttui myöhemmin, ks. kappalelista alla). Mitattu Chromiumissa.
Listan logo on samassa mittakaavassa ja kohdassa kuin soitinsivun kuulokkeet (alla), joten sen kuulokkeet
ovat tasan soittimen kuulokkeiden päällä (käyttäjän päätös 20.10.2026; mitattu Chromiumissa, ero 0,02 px):
1,0295 rem / 13,38 per viewBox-yksikkö (logo 188,9 × 36,6 px), sangan yläreuna 5 px h1:n yläreunan alapuolella;
marginaalit pitävät otsikkorivin 29 px:nä nappien vieressä. Listan logossa (käyttäjän kokeilu 20.10.2026; samana päivänä yhtenäistetty kaikkiin ohjeisiin, ks. alla)
jana on keskilinjalla 31,03 eikä 24,5: viivan alareuna on soittimen lisätietorivin x-korkeuden yläreunassa
(67,2 px Robotolla), ja soittimen otsikon K alkaa logon k:n vasemmasta reunasta (x 25,88 = 46,64 px). Tällöin
A:n pallon ja janan nupin väli ei ole lappujen väli 12,65. viewBox `0.99 -2.6 153.43 36.25`; jana ulottuu
12,5 px otsikkorivin alle, joten listan h1:n alamarginaali on 34 px (oli 22). Ensimmäinen kokeilu, jossa
teksti siirtyi 2,29 yksikköä oikealle soittimen otsikon K:n kohdalle, hylättiin: käyttäjä halusi tekstin
lähemmäs kuulokkeita. Muilla sivuilla logo on 1,25-kertaisena
(WALK 20 px; ei käyttäjän päätöstä muuttaa) mutta merkinnältään sama kuin listassa, jana 31,03:ssa
(käyttäjän päätös 20.10.2026: ohjeisiin nykyistä tilaa vastaava logo; korkeus 45,31 px, janan ja h1:n väli
ennallaan 17 px, `overflow: visible` kuten listassa). Se on otsakkeena Keikkaloihtimessa,
`ohje.html`:ssä, `kayttoonotto.html`:ssä ja `pikakayttoonotto.html`:ssä, ja sen alla h1 on pelkkä sivun nimi:
*Keikkaloihdin*, *Käyttöopas*, *Käyttöönotto*, *Pikakäyttöönotto* (käyttäjän päätös 20.10.2026; entinen
otsikko *KEICK•WALK omalle Cloudflare-tilille* on nyt johdannon alussa). Käyttäjän päätös 21.10.2026: h1 on näillä
neljällä sivulla sama (2 rem, alamarginaali 28 px), ja sen ensimmäisen kirjaimen muste alkaa logon k:n vasemmasta
reunasta (x 26,88 = 32,36 px logon reunasta). Sivun lopun skripti mittaa kirjaimen sivuvälin canvasin pikseleistä,
koska `system-ui` on eri laitteilla eri fontti; CSS:n `calc(32.36px - 0.067em)` on oletus ilman skriptiä. Mitattu
Chromiumissa kuvakaappauksen pikseleistä: ero enintään 0,25 px oletusfontilla, Robotolla ja Interillä. Logo on otsikon yläpuolella eikä
oikeassa yläkulmassa, koska puhelimen leveydellä (375 px) otsikolle jäisi logon vieressä 135 px eikä
*Keikkaloihdin* mahdu (mitattu Chromiumissa). Listan ja
tunnuskentän yläpuolella on vakiofonttinen kursiivi *Valkkaa keikka!* (käyttäjän päätös 20.10.2026: se ja kaikki sen alla 36 px
alempana kuin ennen, `.pick`-täytteenä; tietoiskun ollessa auki väli ennallaan); alalaidassa haalea
*© TUSINASOFT 2026* (aina yhteen, ilman interpunktia; käyttäjän päätös 20.10.2026; vuosiluku ks. *Alatunniste*). Sama alatunniste samalla tyylillä on `</main>`-tagin jälkeen Keikkaloihtimessa,
`ohje.html`:ssä, `kayttoonotto.html`:ssä ja `pikakayttoonotto.html`:ssä, mutta ei soitinsivulla
(`index.html`); käyttäjän päätös 19.10.2026. Korostusväri on kaikilla soittimen sivuilla Okinawa-turkoosi `#0a7f76` / tummassa
`#1fb5a8` (Sports Walkmanin runko). Napin, iframen ja listan `<title>`-elementin nimi on edelleen
*Omat keikkani*.
Soitinsivulla logosta on vain kuulokkeet (`.brand`) vasemmassa yläkulmassa (käyttäjän päätös 20.10.2026,
vaihtoehto A; vaihtoehto B eli koko logo otsikon yläpuolella hylättiin): sangan yläreuna h1:n yläreuna + 5 px
(kiinteä `top: 33px`) ja tyynyjen alareuna ensimmäisen rivin perusviivalla. Mittakaava 1,0295 rem / 13,38 per
viewBox-yksikkö (kuulokkeet noin 22 × 19,7 px) on peräisin 1,45 rem:n otsikon versaalista. Käyttäjän päätös
20.10.2026: otsikko on pienempi ja ohuempi (1,15 rem, paino 400; ensin 650 ja 1,45 rem, sitten 500 ja 1,3 rem), ja sen
versaalin yläreuna on kuulokkeiden sangan viivan alareunassa (y 4) samoin kuin listan logon kirjainten yläreuna
(käyttäjän päätös 20.10.2026; `padding-top: 0.1px`; Robotolla versaali 1456/2048 em = 13,08 px, perusviiva mitattu
46,09 px, versaalin yläreuna 33,01 px, sangan alareuna 32,99 px). Aiemmin perusviiva oli tyynyjen alareunassa
(`padding-top: 6.7px`, 52,69 px) ja sitä ennen tyynyjen keskellä. Otsikon K:n mustereuna on listan logon k:n kohdalla
(padding-left `24,89 yksikköä − 0,0875 rem`, Roboton K:n sivuväli; mitattu 46,67 px). Lisätieto sisennetään samoin, ja
sen x-korkeuden yläreuna on listan logon janan alareunassa (h1:n alamarginaali 9,9 px; mitattu 66,98 px). Ilman
lisätietoa h1:n alamarginaali on 27,4 px. Otsikon nostossa alamarginaaleja kasvatettiin nostetun määrän (6,6 px), joten
lisätieto ja kaikki sen alla pysyivät pikseleissä paikallaan. Testiselaimen Interillä K on 0,3 px oikealla ja perusviiva
noin 1 px ylempänä.
**Nykyinen kuulokedesign ja otsikko (käyttäjän päätökset 20.10.2026; ensin kokeiluna soitinsivulla ja listassa, sitten yhtenäistetty kaikkialle):** korvalappujen väli 14,65 (oikea lappu
x 18,26, vasen paikallaan, sangan säde 7,325, lakipiste ennallaan y 2,8; `.brand`-viewBox `0.99 2.8 19.89 17.2`), ja soittimen
otsikon versaali on yhtä korkea kuin logon kirjaimet (16 yksikköä = 19,70 px; `font-size: calc(1.0295rem / 13.38 * 22.505)`,
Robotolla versaali 0,71094 em): yläreuna sangan viivan alareunassa (32,99 px) ja perusviiva tyynyjen alareunassa (52,69 px),
negatiivisella ylämarginaalilla (−1,32 px), koska rivinkorkeus 1,25 vaatisi muuten negatiivisen yläreunuksen. CSS:n arvot
pätevät vain Robotolla oletuskoossa: käyttäjän puhelimessa (tumma tila, todennäköisesti suurennettu tekstikoko) K oli noin
1,9 px liian alhaalla, ja mitattuna perusviiva poikkesi 134 %:n tekstikoolla 2,31 px ja Interillä 1,00 px. Siksi
`alignTitle()` mittaa ensimmäisen rivin perusviivan DOMista (kuten `markCurrent()`) ja siirtää sen tyynyjen alareunaan
ylämarginaalilla; alamarginaali muuttuu vastakkaiseen suuntaan, joten otsikon alla oleva ei liiku. Kutsutaan `start()`issa,
`document.fonts.ready`ssa ja `resize`ssa. Mitattu: ero 0,000 px Robotolla (100, 120 ja 134 %), Interillä ja DejaVulla;
Robotolla oletuskoossa sivu on pikselilleen ennallaan. Alamarginaalit
(−0,33 / 17,17 px) pitävät lisätiedon ja kaiken sen alla pikseleissä paikallaan; h1:n padding-left käyttää K:n sivuväliä
0,0761 em. Käyttäjän päätös 20.10.2026: väli 14,65 jää, mutta muu logo (kirjaimet, jana, pisteet, nuppi, rengas)
siirtyi 1,0 yksikköä oikealle (puolet levennyksestä; rako oikeasta lapusta k:hon 6,0, oli 7,0 ja levennyksen jälkeen
5,0): listan logon viewBox `0.99 -2.6 154.43 36.25`, k:n vasen reuna x 26,88 (47,87 px). Soittimen otsikko ja lisätieto
siirtyivät samoin (padding-left 25,89 yksikköä; K:n mustereuna 47,86 px Androidin Roboton sivuvälillä). Lisätiedolla on
oma sivuväli 0,0805 em (käyttäjän päätös 20.10.2026; ennen vanhan otsikon K:n 0,0875 rem, jolloin lisätieto alkoi 0,3–0,4 px
k:n vasemmalla puolella): kursiivinen l ja P alkavat k:n kohdalta (mitattu Robotolla 47,81 ja 47,89 px, tavoite 47,87;
T alkaa poikkiviivansa takia noin 1,3 px oikeammalta, numero 2 noin 0,3 px vasemmalta). Yhtenäistetty samana päivänä
kaikkialle, joten yllä olevat 1,15 rem:n, 12,65:n, x 25,88:n ja viewBox-leveyksien 153,43 / 17,89 / 18,89 arvot ovat
historiaa: ohjesivujen logo on listan merkintä 1,25-kertaisena (193,04 × 45,31 px), `.minikuul` viewBox
`0.99 2.8 19.89 17.2` (10 × 11,564 px, keskikohta ennallaan) ja `.kuul` viewBox `0.49 2.3 20.89 18.2` (oikean tyynyn
reuna x 20,88 numeron oikeassa reunassa; yläreuna, tyynyjen alareuna ja oikea reuna pikseleissä ennallaan, leveys kasvoi
vasemmalle). Oppaan kuvat otettu uudelleen ja Android-sovellus 0.15.
**Rako kuulokkeiden ja k:n välillä 9,0 (käyttäjän päätös 21.10.2026, vaihtoehto B kolmesta; oli 6,0).** Keick•WALK-osa
(kirjaimet, jana, pisteet, nuppi, rengas) siirtyi 3 yksikköä oikealle, kuulokkeet pysyivät. Logon viewBox on `0.99 -2.6 157.43 36.25`,
k:n vasen reuna x 29,88 ja listan logon CSS-leveys `calc(1.0295rem / 13.38 * 157.43)`; ohjesivuilla leveys 196,79 px ja otsikon
oletus `calc(36.11px - 0.075em)`, skriptin ankkuri x 29,88. Soitinsivun `main > h1`- ja `.sub`-sisennys käyttää lukua 28,89
(= 29,88 − 0,99). Rako on nyt lähes sangan jalkojen sisäväli (9,48). SVG:ssä siirto on `<g transform="translate(3 0)">`, jonka
ulkopuolella ovat kolme kuulokkeiden osaa (sanka ja kaksi tyynyä). Aiemmat tämän kappaleen luvut x 26,88 / 25,89 / 153,43–154,43 ja
47,87 px ovat historiaa (kaikki +3 yksikköä = +3,69 px). Mitattu Chromiumissa: rako 9,00 yks. kaikilla neljällä ohjesivulla,
otsikon muste 0,25–0,4 px k:n reunasta, soitinsivulla otsikko ja lisätieto 0,07 px. Kaikki aiemmat logon sivutason vertailut
(janan alku jne.) siirtyivät mukana.
**Fontti Figtree (käyttäjän päätös 21.10.2026; oli system-ui eli käytännössä Roboto, joka "kirkui" logon vieressä).** Valittu
Figtreen ja Jostin väliltä silmämääräisesti logoon sopivuudella (Nunito: pyöreät päät, paino 600 vain 18 % paksumpi; DM Sans:
ei tasalevyisiä numeroita, nolla ≈ O; Rubik: interpunkti 2 × koko ja liian raskas; Jost: x-korkeus 0,66 versaalista, pienet tekstit
liian pieniä). Tiedostot `soitin/fontit/` (SIL OFL, lisenssi mukana): `figtree.woff2` ja `figtree-kursiivi.woff2` (latin) sekä
`-ext`-versiot (latin-ext), muuttuva paino 300–900, kopioitu Google Fontsista sellaisenaan. Sivuilla `@font-face` on sivun
omassa tyylissä (`font-display: block`, `fontit/…`-polut, `<link rel="preload">` normaalille ja soitinsivulla kursiiville), ja
fonttipino on `"Figtree", system-ui, …`. **`lista/keikat.html`:ssä fontti on data-URI:na** (vain latin), koska sovellus näyttää
sivun assetista ilman verkkoa ja assettien juuri on `soitin/lista`; tarkistettu `file://`-osoitteesta offline-tilassa (0 verkkopyyntöä,
molemmat leikkeet `loaded`). Merkit →, ←, ▸, ☰, ⌘, ⌫, ✓, ⇥ ja 🔒 puuttuvat Figtreestä ja tulevat varafontista.
Mittaukset (`fitExtras`, `capHeight`, `alignSetNames`, `placeSetEnd`, `alignTitle`) odottavat soitinsivulla lupausta `fontsReady`
(tavallinen ja kursiivinen leike ladattu), koska `document.fonts.ready` ei odota vielä piirtämätöntä kursiivia; ohjesivujen
otsikkolinjaus odottaa otsikon leikettä (`700 1em "Figtree"`). **Älä palauta `document.fonts.ready`-varianttia.** Figtreen mitat
(canvasin musteesta, ±1/400 em): versaali 0,7 em (OS/2 `sCapHeight` 700), `[` ylös 0,8 ja alas 0,1 em (`--xk` 0,7778, `--xr` 0,0778),
K:n sivuväli 0,0925 / 0,0875 / 0,0825 / 0,075 em painoilla 400 / 500 / 600 / 700, kursiivisen l:n 0,0275 em (paino 400),
x-korkeus 0,5 em, hhea 0,95 / −0,25. Roboton arvot (0,71094, 0,0761, 0,0805, 0,7396, 0,1109) ovat historiaa.
**Soitinsivun otsikko paksummaksi (käyttäjän päätös 21.10.2026):** paino 400 → 600 (ennen Robotolla 650 → 500 → 400). Perustelu: Figtreen
viivan paksuus / versaalin korkeus on painolla 600 0,164, eli sama kuin logon keick-kirjainten (2,6 / 16 = 0,1625); WALK (3,2 / 16 = 0,2)
vastaisi painoa 700. Fonttikoko `calc(1.0295rem / 13.38 * 22.857)` (= 16 yksikköä / 0,7 em), marginaalit −2,31 / 17,62 px
(lisätiedon kanssa alamarginaali −0,48 px) ja `.sub` 22,58 px: mitattu niin, että perusviiva on 52,70 px (tyynyjen alareuna
52,69), lisätiedon x-korkeuden yläreuna 66,98 px (perusviiva 73,41) ja nyt soi -rivi 101,53 px kuten ennen (oli 101,52), eli
kaikki otsikon alla on pikselilleen paikallaan. `alignTitle()` korjaa tarvittaessa (testattu 134 %:n tekstikoolla: perusviiva = sangan
alareuna). Oppaan kuvat otettu uudelleen ja Android-sovellus 0.16 (versionCode 16), logon janamuutoksessa 0.17.
**Otsikon perusviiva keick-kirjainten alareunaan (käyttäjän päätös 21.10.2026, myöhemmin; käyttäjä: "keikkaotsikon alareuna
on hiukan logon alareunaan nähden alempana").** keick-kirjaimet ovat y 4–19,7 (WALK ja tyynyt 20), joten otsikon versaali on nyt
15,7 yksikköä (`calc(1.0295rem / 13.38 * 22.429)`) ja `alignTitle()` vie perusviivan y 19,7:ään (tyynyjen alareuna − 0,3 × yksikkö).
Marginaalit −1,69 / 17,67 px (lisätiedon kanssa −0,41 px): mitattu, lisätiedon perusviiva 73,41 px ja nyt soi -rivi 101,53 px kuten
ennen, ilman lisätietoa nyt soi 78,47 px (ennen 78,48). Kaksirivisellä otsikolla kaikki alla oleva nousee 0,67 px, koska rivikorkeus
pieneni. **Chromium pyöristää tekstin perusviivan kokonaiseen CSS-pikseliin** (mitattu DPR 1, 2, 3 ja 4: x,375 → alas, x,5 → ylös),
SVG ei pyöristy. Siksi piirretty otsikko voi olla jopa 0,5 px laskettua ylempänä tai alempana: ennen laskettu 52,70 px piirtyi 53,0:aan
(0,68 px keick-kirjainten alareunan 52,32 alapuolella; käyttäjän havainto), nyt laskettu 52,31 piirtyy 52,0:aan (0,32 px yläpuolella),
mikä on lähin mahdollinen. Lisätieto 73,41 piirtyy 73,0:aan (pyöreiden kirjainten alareuna 73,0–73,25).
**Jana lisätiedon perusviivalle (käyttäjän päätös 21.10.2026, vaihtoehto D ja nupin kokoinen rengas).** Logon jana on keskilinjalla 35,83
(oli 31,03): janan viivan alareuna (jana 1,5) on lisätiedon pyöreiden kirjainten (a, o, e) alareunassa, 73,25 px listan logossa.
Nuppi (r 2,62) ja loppurengas (nyt ulkosäde 2,62 = r 2,12 + kehä 1,0, oli 1,8 + 0,5) ovat saman kokoisia, ja niiden alareuna on 75,5 px
eli viivan alapuolella. viewBox `0.99 -2.6 157.43 41.05` (korkeus +4,8, pohja tasan renkaan alareunassa), listan CSS-korkeus
`calc(… * 41.05)` ja ohjesivuilla 51,31 px; marginaalit ennallaan, joten kaikki logon alla siirtyi 5,9 px alemmas (viivan ja sen
alapuolisen sisällön väli pysyi). Mitattu Chromiumissa päällekkäin esimerkkikeikan soitinsivun kanssa: jana 71,25–73,25, nuppi ja
rengas 69,0–75,5, lisätiedon muste 64,0–73,0/73,25. **Linjaus pätee vain yksiriviseen otsikkoon:** kaksirivisellä toisen rivin
nousujen yläreuna on 67,0 px ja x-korkeuden yläreuna 72,75 px, joten jana osuu x-korkeuden yläreunaan (0,5 px päällekkäin).
Hylätyt (kuvina käyttäjälle): A (kaksi pientä palloa alas), B (jana alas 2,93, nupin alareuna 73,25) ja C (B + nupin kokoinen rengas).
Otsikko alkaa aina kuulokkeiden vierestä (käyttäjän sääntö 20.10.2026): jos ensimmäinen sana ei mahdu kuulokkeiden
ja nappien väliin, se katkeaa väkisin kahdelle riville (`h1 { overflow-wrap: anywhere }`) eikä siirry nappien alle.
Muut sanat rivittyvät tavallisesti, koska `anywhere` katkaisee vain, jos rivillä ei ole muuta katkaisukohtaa
(mitattu Chromiumissa). Entinen `fitTitle()` ja `.pitka` poistettiin. Otsikolta varataan yläkulman nappien tila
(45 px, sovelluksessa 141 px) kelluvalla `.brand-space`-laatikolla vain ensimmäiseltä riviltä, ja se korvaa otsikon
oikean reunuksen (myös silta.js:n `main>h1{padding-right:136px}`).
Soittimen aikajana (käyttäjän päätökset 20.10.2026): jana 2 px, soitettu osa tekstin värinen, loppu
`--line`; biisien alut ovat tekstin värisiä palloja janan keskellä, soittokohdan ohittamat 4 px (`.ohi`)
ja tulevat janan paksuisia 2 px (ero janaan parillinen, jotta pallo ylittää janan yhtä paljon ylä- ja
alapuolella pikseleiksi pyöristettynä). Ei-biisien alkuja ei merkitä janalle (sääntö toistaiseksi).
Janan lopussa tekstin värinen 12 px:n rengas (kehä 2 px, `.loppu`) kuten logossa. *setti*-asennossa
rengas siirtyy keikkajanalla pysähdyskohtaan eli seuraavan setin alkuun (turkoosia pystyviivaa ei enää
ole), janan jatko palloineen häipyy kokonaan (taustan värinen `.jatko`; jatkoa voi silti napauttaa), ja
janan pituuden tilalla on pysähdyskohdan aika keikan alusta (`.setend`), ei setin pituus, renkaan alla
keskellä (käyttäjän valinta viidestä vaihtoehdosta; aika ei mene soittokohdan ajan päälle).
Kytkinten symbolit ovat himmeän harmaita: janakytkimen alla pienoisjana, jonka alussa täytetty pallo ja
lopussa hyvin ohut rengas (kehä 0,6 px) kuten aikajanassa, kytkimen levyisellä alueella (pallon vasen
ja renkaan oikea reuna kytkimen nupin ulkoreunojen kohdalla eli 2 px kytkimen reunojen sisäpuolella, koska tasan reunoilla jana näytti optisesti kytkintä leveämmältä; käyttäjän valinta kolmesta 20.10.2026; jana 1 px, pallo 4 px ja rengas
3,47 px eli kaksi kolmasosaa entisestä, käyttäjän päätös 20.10.2026); setin kytkimen alla entisen stop-merkin ja nuolen tilalla
pienet logon kuulokkeet stop-merkin paikalla, 9,5 px korkeina (9,5 × 10,986 px; aiemmin stop-merkin korkuiset 8 px, sitten
10 ja 9 px; 9,5 käyttäjän päätös 21.10.2026, keskikohta ja janan etäisyys siitä ennallaan), *keikka*-asennossa himmennettyinä. Käyttäjän valinta neljästä 21.10.2026 (B): kuulokkeiden keskikohta on 1 px
ylempänä kuin 10 px:n kuulokkeilla, ja pienoisjana on 0,75 px kuulokkeiden keskikohdan alapuolella (`top: 2.75px`; rivien
pystyakselilla kuulokkeiden keskikohta 287,75 px ja jana 288,5 px). Lista ei siirtynyt (mitattu Chromiumissa).
Kappalelistassa ei ole pystyviivaa eikä sen vaatimaa vasenta reunusta (`.track` padding 4 px). Soivan
kappaleen numero on piilotettu, ja sen paikalla ovat logon kuulokkeet (`.kuul`) numeroiden
tapaan oikeaan reunaan tasattuina (`markCurrent()`); numerolaatikko (min. 1.6em) on kuulokkeita
leveämpi, joten otsikko ei siirry (käyttäjän päätös 20.10.2026). Kuulokkeiden tyynyjen alareuna on perusviivalla
(ei g:n tai p:n alareunassa) ja sangan viivan alareuna versaalin (H) yläreunassa kuten logossa ja soittimen
otsikossa, eli versaali on 16 yksikköä (käyttäjän päätös 21.10.2026; ennen sangan yläreuna puolivälissä versaalin
ja sisältöalueen yläreunan välissä, jolloin sanka oli Robotolla 1,6 px K:n yläpuolella). Mittasuhteet ovat logon
(leveys pienenee samassa suhteessa, ei lytistystä). Chromiumissa 17 px:n tekstillä 15,75 × 13,72 px Robotolla,
16,1 × 14,0 px Interillä (ennen 17,6 × 15,3 ja 17,0 × 14,8). `markCurrent()` mittaa perusviivan DOMista
`getBoundingClientRect`illa (aiempi `offsetTop` pyöristi kokonaisiin pikseleihin, mikä saattoi laskea tyynyt
puolisen pikseliä perusviivan alle) ja versaalin piirtämällä H:n canvasille ja lukemalla musteen pikseleistä
(`ink()`, kuten `fitExtras`; `measureText` pyöristää 1/32 em:n portaisiin), koska `system-ui` on eri laitteilla
eri fontti. Mitta muistetaan vasta, kun fontit ovat latautuneet. Mitattu Chromiumissa Robotolla ja DejaVulla: sangan
alareuna ja tyynyjen alareuna ovat 0,02 px:n päässä fontin mitoista; piirretty K on molemmilla noin 0,26 px
(yksi laitepikseli, DPR 4) mitoista alempana, joten sekä sanka että tyynyt ovat musteeseen nähden saman verran
ylempänä. Välillä kokeiltiin sisältöalueen alareunaan ulottuvia (20 px) ja korkeimpien kirjainten korkuisia (13 px).
Ei-biisirivin teksti (numero, nimi ja kesto) on pienempää (käyttäjän päätös 20.10.2026): hakasulku on yhtä
korkea kuin tavallisen rivin versaali, ja sen alareuna on tavallisen rivin perusviivalla eli soivan rivin
kuulokkeiden tyynyjen alareunassa. Kerroin `--xk` ja nosto `--xr` riippuvat fontista, joten `fitExtras()`
mittaa ne piirtämällä H:n ja kursiivisen [:n canvasille ja lukemalla musteen rajat pikseleistä (measureText
pyöristää rajat 1/32 em:n portaisiin); CSS:n oletukset ovat Roboton (0,7396 ja 0,1109). Nollalevyinen,
tavallisen kokoinen `.tuki` pitää rivin korkeuden ennallaan ja nostaa perusviivaa marginaaleillaan, ja
`markCurrent()` mittaa kuulokkeet siitä, joten ne ovat samankokoiset ja samassa kohdassa kuin tavallisella
rivillä. Numerosarake pysyy tavallisen levyisenä, joten otsikot alkavat samasta kohdasta. Mitattu Chromiumissa
(DPR 4, pikseleistä): hakasulun korkeus ja alareuna poikkeavat versaalista ja perusviivasta Robotolla
0,25 px (myös 134 %:n tekstikoolla), DejaVulla 0,25 px ja Interillä enintään 0,5 px. Setin otsikko seuraa
setin alun pientä `0.`-merkkiä (alignSetNames), joten ei-biisillä alkavan setin otsikko on noin 3,5 px
oikeammalla kuin ennen. Soivan kappaleen nimi on lihavoitu ja turkoosi
(`--accent`; ei-biisi pysyy harmaana), ja hiiren alla kappaleen nimi muuttuu turkoosiksi alleviivauksen sijaan. viewBoxissa on 0,5 yksikön vara reunoilla, koska Safari leikkasi
oikean tyynyn reunan viewBoxin rajalla; samasta syystä listan logolla on `overflow: visible`.
Soittimen osoitinpallo (`.knob`) on turkoosi (`--accent`) kuten logon janan nuppi (käyttäjän
vaatimus: soitin harmoniassa logon kanssa).

## Luin (lukulaite)

`luin.html` (juuressa, koska ohjelman nimi on luin.html) on lukulista ja lukija samalla sivulla.
`luin/md.js` on yhteinen Markdown-jäsennin ja suomen tavutus, `luin/latomo.html` generaattori
(*Latomo*: tarkistaa md:n, täydentää lähdetiedot etukenttään, avaa Luinissa tällä laitteella
avaimen `luin-tuonti` kautta tai antaa .md:n ladattavaksi; Latomon ohje `luin/latomo-ohje.html`, ks. alla). Kehittäjän opas on `luin/ohje.md`; se avautuu
Luinissa osoitteesta `luin.html#u=luin/ohje.md`, mutta lukulistassa siihen ei ole linkkiä (käyttäjän päätös
22.10.2026: pois julkisivusta, ei piiloteta repossa). Lukijan käyttöohje on `luin/kayttoohje.html` (käyttäjän pyyntö
22.10.2026: yksinkertainen, olennaisin ensin; vienti ja muu harvemmin tarvittava lopussa supistettuina osioina).
Se on lukulaitteen ohje, **ei Latomon**; Latomolla on oma ohjeensa (käyttäjän pyyntö 22.10.2026). Lukulistan alla ovat järjestyksessä
*Käyttöohje*, *Kokeiluteksti: Kant ja eläinetiikka* ja pienen välin (12 px) jälkeen *Uusi teksti* **Latomossa** (versaali 27.10.2026 poistettu samana päivänä, käyttäjän päätös). Kun lukijan
käyttäjälle näkyvä toiminta muuttuu, tarkista käyttöohje. Kaikki on selaimen localStoragessa
(`luin-asetukset`, `luin-lista`, `luin-teksti:<id>`, `luin-merkit:<id>`); palvelinta ei ole.
Käyttäjän vaatimukset 20.10.2026:
- **Ei kaveriversiota** eikä sen mainostusta. Käyttöönotto (KV/worker, repo, Dropbox) on myöhempi kysymys.
- **Jakaminen on ERITTÄIN sivuosassa**: vain lukulistan nimikkeen oikean laidan pieni jakonappi, jonka
  ponnahdusvalikosta kopioidaan lähdeviite (ja verkkotekstin linkki) ja poistetaan nimike listasta.
  Viite on tekstin oma (etukentän `viite` tai Latomon kentistä Teologian tyylin 2021 mukaan koottu, md.js
  `kokoaViite`). **Lukutietoja ei lisätä pakolla** (käyttäjän päätös 22.10.2026): viitteen alla on matala kytkin
  *lisää: luettu HTML-versiona*, joka lisää perään `Luettu HTML-versiona osoitteessa <Luin-linkki> (D.M.VVVV).`
  (`aset.viiteLisa`, oletus pois). Ennen lisäys `HTML-versio: … (luettu …)` oli aina mukana.
- **Viitenumerot näkyvät aina**; niitä ei saa asetuksista pois.
- **Värit eivät ole soittimen**: ruskea, okra, ruoste, paperi ja muste, kuusi väriä teemaa kohti, ei
  varjoja eikä läpikuultavuutta (e-ink). Käyttäjän päätös 21.10.2026 (kokeilu): ruoste siirrettiin oranssista ruskeampaan
  (vaalea `#a4541a` → `#8c5426`, tumma `#e0954f` → `#b8794a`; LCh-sävy 58° → 62°, kroma 54 → 41) ja tumman
  teeman paperi tummennettiin (`#18130e` → `#120e0b`), jotta himmeämpi ruoste erottuu (kontrasti 5,66 / 5,37).
  **Latomon `--harmaa` poikkeaa muista Luinin sivuista** (käyttäjän päätös 27.10.2026, koeversio V3 kolmesta: V1 eli
  pienet tekstit musteella oli paikoin selkeämpi mutta kokonaisuutena huonompi): vaalea `#67553f` → `#4f3e28`, tumma
  `#b09b7e` → `#cdb79a`, sama sävy ja kroma (OKLCH), APCA Lc 79 → 88 ja 50 → 65. Syy: Latomon tekstipinnasta noin 40 %
  on pientä (11,5–15 px) `--harmaa`-tekstiä, joka näytti "ruskealta ruskealla", pahiten tummassa teemassa (WCAG 7,17
  antoi väärän kuvan). luin.html, käyttöohje ja Latomon ohje pitävät vanhat arvot; älä yhtenäistä niitä ilman käyttäjää. Aikajanan merkinnät erotetaan muodolla nuottien tapaan (suurempi aika-arvo ontompi;
  käyttäjän päätös 21.10.2026): pääluku iso ontto salmiakki, alaluku pienempi täytetty, alaluvun alaluku
  lähes pistemäinen täytetty. Käyttäjän päätös 21.10.2026 (myöhemmin): etappimerkit pienemmiksi, pääluku 0,8- ja alaluvut
  0,7-kertaisiksi (`JANA.koko`; kirjanmerkin nauha ennallaan); sitten alaluvut hiukan suuremmiksi (1,15- ja 1,35-kertaisiksi:
  alaluvun alaluvut sulautuivat viivaan), ja nykyisen kohdan oikealla puolella olevien pienempi kokoluokka (0,75) poistettiin
  turhana kokojen kirjona: tulevat ovat samankokoisia, vain harmaita. Otsikkotasoja on neljä (# nimi, ## pääluku, ### alaluku, #### alaluvun
  alaluku); aikajanan oletus on pääluvut ja alaluvut, *Kaikki* lisää alalukujen alaluvut; kirjanmerkki ruosteinen nauha viivan
  alla; nykyinen kohta kolmio ja hiusviiva. "Vinoneliöestetiikkaa, ei palluraestetiikkaa." Antiikva
  (Literata, `luin/fontit/`, OFL) ja klassinen tyyli; salmiakkien kyljet hieman koverat (c = 0,38) on
  kompromissi kaartuvan ja terävän välillä.
- **md-konventiot ovat käyttäjän omat** (aiemmat md → html -muunnokset, malli tutkielman html-versio)
  ja menevät yleisen Markdownin edelle: otsikkolohko (#, kursiivi alaotsikko, tietorivit `<br>`:llä),
  `luku-2-1`-tunnisteet, numeroimaton ### versaalikursiivina (`.caps`), alaviitteet sivuhuomioiksi
  (fnref + fntoggle + sidenote), `## Kirjallisuus` → `p.bib`. Lainausmerkkejä ei muuteta.
  Muuten noudatetaan **iA Writerin protokollaa** (käyttäjän päätös 22.10.2026; opas, luku 3): alaviite on
  `[^teksti]` tai `[^1]` + `[^1]: …`; Pandocin `^[…]` (tutkielmaan lipsahtanut) toimii yhä, ja Latomo tarjoaa
  muunnoksen. Rivinvaihto: kenoviiva rivin lopussa, kaksi välilyöntiä tai `<br>`. Lisäksi ~~ == ^ ~, sisäkkäiset
  luettelot (kääre `li.sisus` ilman `data-b`, lohkot eivät ole sisäkkäin), tehtävät, taulukot (rivi = lohko),
  viitelinkit, ristiviittaukset, sitaatit `[s. 23][#avain]`, `[%avain]`, `{{TOC}}`, `+++`, kommentit, setext,
  sisennetty koodi. Kuvat näkyvät linkkeinä eivätkä kuvina (lukija ei hae mitään kolmannelta osapuolelta).
  Otsikkolohkon tietorivi on enintään 100 merkkiä riviltään; pidempi kappale on leipätekstiä (verkkoleike).
- **Latomon remontti** (käyttäjän pyyntö 22.10.2026, toteutus Clauden harkinnalla; opas, luku 7):
  *Tekstityyppi* on oletuksena *ei määritelty*; valittavana tieteellinen, blogi tai verkkosivu, kaunokirjallinen.
  Kentät Teologian tyylin viitteen järjestyksessä, tyypin oletuskentät näkyvissä ja loput *+ Lisää tieto*
  -napista (*Osana teosta tai lehteä* avaa toimittajat, vuosikerran ja sivut). **Kehys** (käyttäjän päätös 22.10.2026):
  blogin nimi ja kaunokirjallisen tekstin kokoelma näkyvät alaotsikon paikalla lukulistassa ja ladotussa tekstissä, jos
  alaotsikkoa ei ole (md.js `kehys`; määrittelemättömällä tyypillä sivusto, tieteellisellä ei kehystä), eivätkä toistu
  tietorivillä. Kaunokirjallisella `teos`-kentän nimi on *Kokoelma* (oletuksena näkyvissä; käyttäjä halusi
  sateenvarjosanan, ei *novellikokoelma*). Kaikki vapaaehtoista, otsikko
  riittää; pelkälle tekstille kentän otsikko lisätään tekstin alkuun. **Etukenttään vain se, mikä poikkeaa
  tekstistä päätellystä** (tutkielma läpäisee Latomon tavulleen samana). Julkaisuajan tarkkuus valitaan:
  blogissa vuodesta minuuttiin (oletus kuukausi), tieteellisessä enintään päivä; itse kirjoitettu ja tekstin
  aika säilyttävät tarkkuutensa, koneen T-aikaleima saa tyypin oletuksen. Ehdotukset muuttavat tekstikenttää
  vain napista. *MarkDownload-leike*-kytkin (Firefoxin lisäosa) siivoaa jäänteet vain
  tuloksesta ja lukee tiedot etukentästä ja leikkeen lopusta; suositellut asetukset ja etukenttäpohja ovat
  Latomon ohjeessa (`latomo-ohje.html#markdownload`; käyttäjän pyyntö 22.10.2026: kaikki asetukset, ei oletusarvoja vaan
  suositus; tulos on iA Writer -yhteensopiva, mutta ohje ei mainosta iA Writeria eikä neuvo sen käyttöä, koska moni ei käytä sitä (käyttäjän päätös 22.10.2026). iA Writer mainitaan vain, kun se vastaa kysymykseen *miksi juuri näin* (merkintöjen alkuperä Merkinnät-osion johdannossa, `^…^`, `^[…]`-muunnos); nimet ja suositukset tarkistettu MarkDownload 3.4.0:n lähdekoodista ja
  sen muunnosketjua Chromiumissa ajamalla, oikealla Firefoxilla testaamatta). Kytkin poistaa myös tyhjät linkit ja muuttaa
  `<sup>`/`<sub>`-merkinnät muotoon `^…^`/`~…~` (hakasulut suojattuina, `^\[[7](…)\]^`, koska `^[` on alaviite; md.js lukee
  myös `^[…](…)^`:n ja `^[…]^`:n yläindeksiksi; 29.10.2026 SEP-leikkeen 58 merkkiä olivat muuttuneet alaviitteiksi) ja
  otsikkorivittömän HTML-taulukon Markdown-taulukoksi (huomautusten rivinumerot muunnetaan tekstikentän riveiksi); md.js
  antaa HTML-merkinnöistä yhden huomautuksen riviä kohden. Kytkin on oletuksena pois; silloin salmiakin tyhjyyden lisäksi sen teksti ja viereinen ohjelinkki ovat
  `--harmaa`-värisiä, päällä teksti musteella ja linkki ruosteella (käyttäjän päätös 22.10.2026). Käyttäjän päätös 23.10.2026:
  kytkin on **aina pois sivua avattaessa** (valintaa ei muisteta; `latomo-markdownload`-avainta ei enää lueta eikä kirjoiteta)
  ja ehdollisessa asemassa (`.ehdollinen`): sisennetty ohuen `--viiva`-viivan taakse, pienempi, ja kytkin on kehystetty
  isommalla salmiakilla (11 × 15 px), koska pelkkä pieni salmiakki näytti luettelomerkiltä. **Korvamerkki** (käyttäjän pyyntö
  27.10.2026, toteutus Clauden harkinnalla; Latomo minimalisoituu, etusijalla tietävät käyttäjät): rivi on piilossa, ja
  se ilmestyy, kun etukentässä on ohjeen pohjan avain `leikattu: {date:YYYY-MM-DD}` (tallennuspäivä, ei *downloaded with
  MarkDownload* -kuonaa), tai kun tila on päällä (ehdotuksesta). Korvamerkki kytkee tilan päälle; kytkimestä sen saa pois vain
  tältä tekstiltä. Tulokseen avain menee nimellä `haettu`, joten valmis teksti ei ole merkitty. Rivillä on vain kytkin ja
  pieni i-salmiakki (Luinin tietoa-napin merkki, 12 px) ohjeeseen; ehtolause *Jos teksti on verkkosivulta tallennettu* ja
  linkkiteksti *asetukset Luinia varten* poistettiin. Ilman korvamerkkiä ehdotus tulee vain oletuspohjasta tai jäänteistä. Testit: `luin/kehitys/md-testi.js` (ilman selainta) ja `latomo-testi.js`.
- **Pdf:stä muunnettu teksti** (käyttäjän pyyntö 23.10.2026; opas, luku 7.1; Latomon ohje `#pdf`): hegel-repon
  (`OlliJuutilainen/hegel`) `pdf_to_markdown.py` kirjoittaa etukenttään Crossrefin tiedot (DOI alkusivuilta,
  `--no-lookup` pois) ja JSTOR-kansilehden lähteen eriteltynä (`journal`, `volume`, `issue`, `pages`; ei enää `source`,
  jonka Latomo lukee verkko-osoitteeksi). Latomo lukee avaimet (ALIAS, `volume`+`issue` → `72:288`) ja ilman etukenttää
  tietoriveiltä DOI:n, `Paikka: Kustantaja vuosi` ja `Tekijä, *Teos*.`; ISBN ei ole päiväys. Rivitysehdotus ohittaa
  tietorivit ja alaviitteiden määrittelyt. **Otsikkolohko kentistä** (käyttäjän pyyntö 23.10.2026, Clauden harkinnalla;
  opas 7.1): kun kenttä ei näy tekstin alussa, ehdotus kirjoittaa alun kentistä tekstiin, toinen nappi säilyttää vanhan
  alun lauseet, joita kentistä ei löydy (ISBN, lisenssi). Uusi alku valitaan tekstikentässä muokattavaksi. Hylätty:
  etukentän tilamerkintä, jolla kentät yliajaisivat näytön (tiedosto näyttäisi iA Writerissä eri alun).
- Latomon *Tyhjennä kentät* (käyttäjän pyyntö 22.10.2026) tyhjentää tekstin, kentät, oman viitteen ja osoitteen; vahvistus
  *”Oletko aivan varma?” sanoi Lasse Lehtinen.* napein *Olen, tyhjennä* / *älä!*. MarkDownload-tila palaa alkutilaan (rivi piiloon; käyttäjän päätös 29.10.2026, ennen kytkin säilyi).
- Logo *LUiN.* / *HTML* (`luin/kehitys/logo.js` tulostaa SVG:n, joka on kopioitu luin.html:ään ja
  Latomoon): korkea tiivis antiikvaversaali, i:n piste ja loppupiste salmiakkeja, alarivi HTML ohuena
  väljänä. Viiva pisteiden välillä on *glissando* (käyttäjän päätös 21.10.2026; esikuva flageolettiglissando):
  se lähtee i:n pisteen oikeasta kulmasta ja päättyy loppupisteen vasempaan kulmaan. i:n pisteen oikea
  yläsärmä ja loppupisteen vasen alasärmä ovat suoria ja samassa kulmassa kuin viiva, joten viivan yläreuna
  jatkaa edellistä ja alareuna jälkimmäistä ilman porrasta (muut särmät koverat). Viiva on suunnikas eikä
  stroke, ja `glis()` ratkaisee kaltevuuden, kun i:n pisteen oikea kulma (x 133), sen yläkärjen korkeus ja
  loppupisteen paikka on annettu; salmiakkien korkeus seuraa kaltevuudesta. Käyttäjän päätös 21.10.2026
  (viimeisin): i:n pisteen keskikohta y 12 ja loppupisteen keskikohta y 100, eli sen sivukärjet ja viivan
  laskeutuminen ovat perusviivalla. Viivan alareuna kulkee N:n oikean kuopan pohjan kautta (vinoviivan oikea
  reuna kohtaa oikean pystyviivan vasemman reunan, x 186,6, y 84,89), joten viivan alle ei jää kuopasta rakoa
  (`sulje`, oletus; mitattu pikseleistä: ennen 469 paperin väristä pikseliä, nyt 0). Tämä ratkaisee
  kaltevuuden 1,305 (52,5°) ja loppupisteen paikan x 204,68: i:n piste 7,5 × 9,78, loppupiste 6,5 × 8,48,
  alakärki 108,5 (HTML alkaa 112). viewBox `-2 -2 215.18 138`; luin.html:ssä logo 99,78 px leveä, Latomossa
  87,31 px, korkeus ja otsikon paikka ennallaan (mitattu). i:n piste
  on ruosteinen, viiva, loppupiste, LUiN ja HTML tekstin värisiä. Hylätyt: viiva keskeltä keskelle (aiempi),
  loppupiste x 214 ja i:n piste keskikohdaltaan y 12 (piste liian kaukana), piste–viiva–piste ja HTML
  ruosteisina (oli käytössä hetken 21.10.2026), kaikki musta (kirvesmäinen), loppupiste N:n alla (x 205, ahdas),
  i:n pisteen yläkärki versaalien lakipisteessä ja loppupisteen alareuna perusviivalla (oli käytössä hetken;
  sivukärkiä perusviivalle kokeiltiin myös yläkärjen ollessa lakipisteessä, jolloin piste venyi 9,11:een),
  loppupiste x 212, y 100 (oli käytössä hetken; viivan alle jäi kuopasta noin 10 yksikön rako), rako suljettuna
  laskemalla loppupistettä (keskikohta 109,6, roikkui HTML-rivin tasolle) tai muuttamalla N:ää.
  Vanha geometria: `logo({ glis: false })`. Käyttäjän päätökset 21.10.2026:
  HTML mahtuu kokonaan LUiN-kirjainten alle (muste x 7–196,6 eli L:n pystyviivan vasemmasta reunasta N:n
  oikean päätteen reunaan, ei loppupisteen alle; käyttäjän päätös 27.10.2026, ennen x 0 eli L:n alapäätteen
  reunasta, `logo({ hx0: 0 })`; mitattu Chromiumissa pikseleistä), alku ja loppu veitsenterävät (H:n
  vasemmat päätteet x 7:ssä, L:n alaviivan päässä ylärivin L:n kaltainen pystypääte), rivi 5 yksikköä
  ylempänä ja viiva 2,1 → 2,5 (viewBox:n korkeus ennallaan, joten LUiN ei muuttanut kokoaan). Pienen L:n
  alaviivan pää N:n alaosan reunaan (x 190) kokeiltiin ja hylättiin.
- Asetusten nappi (käyttäjän päätös 21.10.2026) on volvelle (Apianus, *Astronomicum Caesareum* 1540: kirjan sivulle kiinnitetty
  kiertyvä paperikiekko), ei hammasratas: kaksi sisäkkäistä kehää, ulkokehän 16 asteikkoviivaa (joka neljäs pidempi),
  koverakylkinen salmiakkiosoitin ja paperin värinen napapiste (`var(--paperi)`). Valittu kuudesta luonnoksesta; ensin
  valittu vesiratas (alalyöntiratas, PR 347) vaihdettiin tähän samana päivänä. Hylättyjä: hammasratas, kruunupyörä,
  Katariinan pyörä, kannuksen ratas, Fortunan pyörä, kauharatas (L-koukut näyttivät hakaristiltä), Ramellin kirjat,
  vedessä-versio. SVG on samana kahdessa paikassa (`.ratas`-nappi listassa ja `#ratas-polku`-`<g>` lukijassa), pidä ne yhtenevinä.
- Lukulistan logon oikealla puolella on KEICK•WALKin ⓘ-napin tapaan tietoa-nappi (käyttäjän pyyntö 21.10.2026), mutta
  ympyrän sijaan koverakylkinen salmiakki, jonka sisällä i salmiakkipisteineen (`--harmaa`, auki ruoste). Merkin keskikohta
  on LUiN-versaalien keskilinjalla (mitattu 54,00 / 54,12 px). Se avaa logon alle ohuen `--viiva`-kehyksisen laatikon,
  jossa on vain *LUiN.HTML on lukulaite Markdown-teksteille. Tiedot tallentuvat vain tähän selaimeen.* (käyttäjä: erittäin
  lyhyesti). Kiinni ollessa sivu on pikselilleen ennallaan.
- Nimen tekstimuoto (ei-graafinen, esim. infolaatikko ja logon `aria-label`) on *LUiN.HTML* (käyttäjän päätös 21.10.2026);
  tiedostonimi ja polut pysyvät `luin.html`.
- Repon juuressa on `.nojekyll`: ilman sitä GitHub Pagesin Jekyll muuntaa etukentällisen `.md`-tiedoston `.html`:ksi, jolloin `.md`-osoite antaa 404 ja Luin ei saa tekstiä (mitattu 21.10.2026: `luin/ohje.md` ja `luin/tekstit/kant-ja-elainetiikka.md` 404, `.html`-versiot 200). Älä poista.
- Aikajanapalkki (käyttäjän päätökset 21.10.2026): alapalkin vasemmassa reunassa on aina näkyvä
  kirjanmerkin ääriviiva (`#km-nappi`; ohut viiva alapalkin tekstien värillä `--harmaa`, aiemmin hyvin haalea `--viiva`), joka asettaa kirjanmerkin ilman palkin avaamista ja muuttuu kupariseksi
  (`--ruoste`), kun ruudulla (sivutettuna tällä sivulla) on kirjanmerkki; silloin napautus poistaa näkyvät
  kirjanmerkit. Laatikkoa *Aseta kirjanmerkki* ei ole (käyttäjän päätös 21.10.2026: pelkkä symboli alhaalla riittää). Avatun palkin alla vasemmalla on laatikko *Merkinnät* listasymbolein (avaa kirjanmerkit ja
  alleviivaukset). Aikajanalla vain luettu osa (nykyiseen kohtaan asti) on tekstin värinen; tuleva viiva ja
  salmiakit ja kirjanmerkit ovat `--viiva`-harmaita (kirjanmerkit käyttäjän päätöksellä 22.10.2026; ennen ne näkyivät tulevassa osassa kuparisina), ja vedettäessä nekin vaihtuvat vedenjakajan mukana.
  Natsaa ei ole (käyttäjän päätös 22.10.2026; 21.10.2026 alapalkissa oli `natsanPaikka()`-mitattu natsa).
  Koko palkki on edelleen aikajanan nappi (`#ala-nappi` absoluuttisena alimmaisena); kirjanmerkki ja sivunapit ovat sen päällä,
  ja oikean laidan `#ala-oikea` ei ota napautuksia (`pointer-events: none`), joten edistymisen napautus avaa aikajanan.
  Sivunäkymässä on sivunappipari (`#sivunapit`, käyttäjän päätös 21.10.2026): rajattu, jotta
  näkyy, ettei siitä aukea aikajana; puolikkaat kiinni toisissaan väliviivalla (22.10.2026 alkaen kirkas ja nuolisalmiakein, ks. alla). Edistymisen vasemmalla
  puolella, ilman edistymistä oikeassa reunassa. Booxin sivunkääntönäppäimet antavat PageDown/PageUpin; `AudioVolumeDown`/`Up`
  on lisätty siltä varalta, että selain välittää äänenvoimakkuusnäppäimet. Oikealla Palmalla testaamatta.
- **Palkkien remontti (käyttäjän päätökset 22.10.2026; opas, luku 4.4).** Mobiili = `(pointer: coarse)` eli kosketusnäyttö
  (`body.mobiili`, `asettele()`); hiiri on työpöytä myös kapeassa ikkunassa (käyttäjän päätös 22.10.2026: leveysehdolla palkit
  piiloutuivat työpöydällä). Aikajanan oletustason ehto `(max-width: 700px), (pointer: coarse)` on erillinen ja ennallaan. Työpöydällä ylä- ja alapalkki pysyvät; alapalkissa ei ole
  natsaa eikä nykyisen osion nimeä (`#ala-kohta` poistettu), vain kirjanmerkki vasemmalla ja sivunapit ja edistyminen oikealla.
  Osion nimi näkyy avatun aikajanan ylärivillä. Mobiilissa palkit ovat piilossa: alareunassa on kaista (`--ala` 44 px), jonka
  yläreunassa on haalean haalea viiva `--hius` (viivan ja paperin puoliväli; käyttäjän pyyntö 27.10.2026, ennen reunukseton).
  Kirjanmerkki on kaistan vasemmassa reunassa oma 45 × 43 px:n lohkonsa, nauha keskellä, ja sen erottaa muusta kaistasta
  `--viiva`-pystyviiva, jonka päät ovat 7 px irti kaistan reunoista (27.10.2026; ennen nauha kellui palstan linjassa ja sen vasen
  puoli avasi palkit). Erotin on napin viimeinen pikseli, ja nauhan musteen väli siihen on sama kuin kaistan vasempaan reunaan,
  17 px (käyttäjän pyyntö 27.10.2026; mitattu pikseleistä DPR 1–4; ennen erotin oli 2 px lähempänä). 28.10.2026: käyttäjä ei
  nähnyt erotinta, kun se oli `--hius`-värinen ja vain mobiilissa, joten se on nyt `--viiva` ja myös työpöydän alapalkissa
  (nappi 59 px, väli 24 px kummallakin puolella; napin oikea osa avasi ennen aikajanan). `testi.js` tarkistaa mobiilin välit. Palkkinuoli (`#palkki-nuoli`) on oikeassa alanurkassa tekstipalstan oikean reunan linjassa (`--palsta-o`).
  Työpöydän kirjanmerkki on ennallaan. Kaistan napautus (`#ala-nappi` koko kaistan alla; nuoli ei ota napautuksia) avaa yläpalkin ja
  aikajanakerroksen yhdessä (`palkit-auki`), tekstin päälle ilman siirtymää, ja sulkee ne. **Tekstin napautus ei avaa palkkeja**
  (käyttäjän päätös 22.10.2026, myöhemmin: avautui liian helposti vahingossa; aiemmin vierityksessä mikä tahansa kohta ja sivutettuna
  keskikolmannes). Palkkinuoli on ylös osoittava lovettu koverakylkinen salmiakki (sivunappien nuolen muoto): kiinni `--harmaa`-ääriviiva
  kuten kirjanmerkki, auki täytetty `--muste` ja alas osoittava. Nuoli on myös työpöydällä alapalkin oikeassa reunassa (käyttäjän vaatimus 22.10.2026: alapalkissa ei ollut mitään avaamisen ja sulkemisen merkkiä), jossa se kääntyy aikajanan mukana. Kerroksen ylärivillä
  osion nimi ja oikealla edistyminen (`#jana-pros`); *Merkinnät* ja *Etsi* ovat aikajanan alla omalla rivillään vasemmassa reunassa
  kaistan yläpuolella kuten työpöydällä (käyttäjän pyyntö 27.10.2026; ennen kaistalla kelluvien välissä, `sijoitaJanaNapit()` poistettu). Vain kaistan napautus avaa ja sulkee palkit (käyttäjän päätös 22.10.2026):
  vieritys ja sivunkääntö eivät vaikuta (ensimmäisessä versiossa sulkivat). Työpöydällä keskiklikkaus ei avaa aikajanaa ("hiirellä
  kauhea tapa"), vain alapalkin klikkaus. Sivunapit 52 × 34 px (27.10.2026; ennen 44) eli Merkinnät- ja Etsi-laatikoiden korkuiset, reunus `--harmaa` kaikilta sivuilta
  ennallaan. Niiden napautusalue (`#sivunapit`) on koko palkin korkuinen ja ulottuu ruudun oikeaan reunaan (`--o-reuna`), joten nappien
  ylä-, ala- ja oikealta puolelta ei avaudu aikajana (käyttäjän pyyntö 27.10.2026; myös työpöydällä); tyhjä osa kääntää sen napin
  suuntaan, jonka kohdalla napautus on,
  nuolina täytetyt lovetut koverakylkiset salmiakit (`--muste`; valittu neljästä muodosta, leijat näyttivät pienenä möhkäleiltä).
  `#lukija`ssa ei ole napautuskorostusta (näkymättömän kaistan napautus väläytti kaistan). Palkkien avaus ei poista paluumajakkaa. Kirjanmerkkinauhaa ei voi kytkeä pois (käyttäjän päätös toistaiseksi). Asetuksissa
  *Liikkuminen*-rivin *Sivut*-sanan alla lisäkytkin *Sivunvaihtopainikkeet* (`aset.sivunapit`, oletus pois 22.10.2026 alkaen; sivua
  käännetään reunojen napautuksella; `av: 5` kytkee kerran pois myös tallennetuista; sivunapit ovat palkkinuolen oikealla puolella 24 px:n päässä, ja ilman niitä nuoli on 4 px vasemmempana kuin nappien oikea reuna; käyttäjän pyyntö 28.10.2026, ennen väli 12 px), 16 px sisennettynä
  (`sijoitaNipukka()` mittaa) ja vierityksessä pois käytöstä kuten Sukkela alleviivaus. Mitattu: työpöydän kuvakaappauksessa
  muuttui vain alapalkin osion nimen ja natsan alue; mobiilin sivutettu tutkielma 57 → 53 sivua.
- Aikajanan veto (käyttäjän pyyntö 21.10.2026): osoitin seuraa vetoa, voimassa oleva kohta jää `--viiva`-harmaaksi haamuksi,
  eikä teksti liiku ennen irrotusta. Käyttäjän pyyntö 22.10.2026: luetun ja tulevan raja (musta viiva ja etapit) seuraa
  vedettävää osoitinta, ei haamua. Liikkeessä muuttuvat vain `#j-veto`:n transform, viivojen päät ja rajan ylittäneiden
  etappien `tuleva`-luokka (`vedenjakaja()`; etapeilla `data-f`), kerran ruudunpäivitystä kohden (e-ink).
  Käyttäjän päätös 21.10.2026: vierityksessä aikajanalla ei ole magneettia (napautus ja veto vievät suhteelliseen kohtaan,
  myös merkin vieressä ja kummitusmerkin kohdalla). Sivutettuna välimuotoja ei ole: osoitin pysähtyy vain pysäkeille
  (`janaPysakit()`: tekstin alku, kaikkien tasojen otsikot, kirjanmerkit, majakka, voimassa oleva kohta), lähin voittaa, ja
  pysäkit ovat samat riippumatta aikajanalle valituista merkeistä. Perustelu: ilman e-inkiä luetaan mieluummin vierittäen,
  e-inkissä veto ei tee ilotulitusta. Sivun alkuun pyöristävä `sivunAlku()` jäi vain testien käyttöön.
- Kirjanmerkin paikka (käyttäjän päätökset 21.10.2026 ja 22.10.2026; opas, luku 4.3): kirjanmerkki menee aina kappaleen alkuun
  (`o: 0`). Nauhasta se on näkymän ylimmän kappalejaon eli ylimmän näkymässä alkavan kappaleen alku (`ylinKappaleenAlku()`).
  Jos näkymässä ei ole yhtään kappaleen alkua, se tulee edelliseen kappalejakoon, ja näkymä siirtyy vain sen verran taakse,
  että merkki näkyy (sivunkäännöin tai ylös vierittäen). Valinnan valikosta se menee valinnan kappaleen alkuun. Aiempi
  sääntö (luettava kappale, sivutettuna sivun ensimmäisen rivin kappale) suosi kesken alkanutta kappaletta; testi
  `luin/kehitys/testi.js` tarkistaa molemmat uudet tapaukset sivutettuna, vierityksen tarkistin käsin Playwrightilla. Sivu ilman tekstilohkoa
  (sisällysluettelo) ei kuulu tähän: merkki tulee silloin sivun jälkeiseen kappaleeseen. Nauha on sisennetyssä kappaleessa sisennyksessä, muuten tekstin vasemmassa laidassa ensimmäisen rivin
  yläpuolella, jos tilaa on (kappaleväli, otsikon tai luvun vaihto, sivun yläreuna), ei reunuksessa. Reunus on vain
  varasääntö, kun tilaa ei ole (alle 18 px:n koko, sisennystilan koodilohko) ja vanhoille kesken kappaletta oleville.
  Sivutettuna nauha on `position: fixed`, koska `#sivu` leikkaisi sivun yläreunan kaistan.
  Otsikossa nauhan ja nousijoiden väli on 0,45 em (leipätekstissä 4 px), ja nauhan yläpuolelle jää yläreunassa 14 px
  (`NAUHA_KATTO`; vierityksessä `mene()` ja nauhanapin lisäys vierittävät sen verran; käyttäjän pyyntö 29.10.2026: pääluvussa
  nauha oli kiinni otsikossa ja vierityksessä yläpalkkia vasten tai ruudun yli). Mitattu: pääluvussa väli musteeseen 5 → 12 px.
- **Marginaali** (käyttäjän pyyntö 22.10.2026, toteutus Clauden harkinnalla; opas, luku 4.5): *Ulkoasu*-osiossa Reunojen
  ja Tavutuksen välissä *Marginaali: Ohut | Keski | Reilu* = 16 / 24 / 36 px molemmille sivuille (`MARG`), oletus Keski.
  Arvojen avaimet (`kapea`, `keski`, `levea`) ovat ennallaan, jotta tallennetut asetukset säilyvät; nimet vaihdettiin 22.10.2026.
  Ohut on asetusta edeltävä leveys pikselilleen (mitattu: sama asettelu 360, 412, 702, 760 ja 1200 px:llä). Rivi näkyy vain,
  kun marginaali vaikuttaa (`innerWidth < 33 × koko + 72`). Yläraja on harkittu: 40 px:llä tasattuun tekstiin tuli 412 px:llä
  silmin nähtäviä aukkoja.
- Aikajanan oletus (käyttäjän päätös 22.10.2026): työpöydällä pääluvut ja alaluvut (`janaTaso: 2`), mobiilissa (`(max-width: 700px), (pointer: coarse)`) vain pääluvut (`janaTaso: 1`). Koskee vain ensikäyttöä; tallennettuja asetuksia ei muuteta. Mitattu Chromiumissa: työpöytä Pääluvut+Alaluvut, mobiili vain Pääluvut, tallennettu 2 säilyy mobiilissakin.
- **Postilaatikko** (käyttäjän pyyntö 25.10.2026: Light Phoneen ei voi näppäillä linkkejä; opas, luku 2.2): Latomon
  *Lähetä postilaatikkoon* tulostaa wrangler 3.114.17 -komennon, joka tallentaa tekstin KV:hen avaimella
  `luin:<koodi>:<slug>` (30 päivää). Luin hakee sen workerin reitiltä `/api/luin` lukulistaan, kun laatikon koodi on annettu.
  Laatikko otetaan käyttöön kuten KEICK•WALKin keikka, joko koodilla tai linkillä (käyttäjän pyyntö 25.10.2026): lukulistan
  alla on kenttä *Laatikon koodi tai linkki* (koodi → `#l=`, Luin-linkki sellaisenaan, muu osoite → `#u=`), linkki on
  `luin.html#l=<koodi>`, ja koodin voi vaihtaa tai poistaa lukulistan asetusten osiossa *Postilaatikko*. Koodi on salasana; sitä ei kirjoiteta repoon. Reitti vaatii,
  että `tusinasaa-worker` on julkaistu tämän repon koodilla (`npx -y wrangler@3.114.17 deploy` repon juuressa).
  Testattu `wrangler dev --local`:lla ja Chromiumilla 25.10.2026; oikeaa Cloudflarea ja Light Phonea vasten ajamatta.
- **Lainauksen lähde ja motto** (käyttäjän päätös 27.10.2026, muoto C; opas, luku 3.6): `> Lainaus.\` + `> – Lähde` (myös
  lainauksen sisäinen tyhjä rivi välissä) → `figure.lainaus` ja lähde `figcaption` oikeaan reunaan; otsikon jälkeen ennen
  leipätekstiä `figure.motto` (sisennetty, ei pystyviivaa). Latomo ehdottaa erilleen kirjoitetun lähteen siirtoa lainaukseen.
  Sama iA Writerin esikatselussa pohjalla `luin/ia-writer/Luin.iatemplate` (+ zip; käyttäjän pyyntö 27.10.2026; opas 3.6).
- **Otsikot sivutettuna** (käyttäjän päätös 28.10.2026): pääluku alkaa aina uudelta sivulta (CSS `break-before: column`). Alaluku (`###`), jolle sivun pohjalla mahtuisi vain otsikko tai otsikko ja yksi tekstirivi, siirretään seuraavalle sivulle (`alalukujenAlut()`, luokka `sivulle`). Mitattu synteettisellä tekstillä ikkunakorkeuksilla 560–900 px: huonoja alaluvun alkuja 321 → 0, sivuja 1757 → 1790; kantin tutkielman asettelu ei muuttunut. Lisäys samana päivänä: alaluku siirretään myös, jos sen aloittava lainaus ei mahdu otsikon sivulle kokonaan (synteettinen teksti: 330 → 0 tapausta), ja siirto varmistetaan JS:llä (`pakotettu`), koska käyttäjän työpöytäselain ei pakottanut pääluvun sivunvaihtoa (Chromiumissa toimi; selainta ei tiedetä). `testi.js` tarkistaa pääluvun ja alalukujen rivisäännön.
**Sisällysluetteloa ei pakoteta omalle sivulleen** (käyttäjän päätös 28.10.2026): se kulkee otsikkolohkon perässä samalla sivulla (kantin tutkielma 412 ja 1280 px: otsikko ja sisällys sivulla 1). Aiempi `nav.sisallys { break-before: column }` poistettiin eikä sitä ole JS-varmistuksessakaan; vain pääluku (`h2`) pakotetaan.
- Pitkän painalluksen suomi–suomi-sanakirja on myöhempi idea (opas, luku 9.2).
- **Viitetyylin varanto `docs/viitteet/`** (käyttäjän pyyntö 28.10.2026): Teologian tyyli 2021 säännöiksi purettuna
  (`teologian-tyyli-2021.md`; PDF ei ole repossa), APA 7 -turvaverkko sen aukkoihin (`apa7-turvaverkko.md`, omin sanoin,
  tarkistetut kohdat [✓] lähteineen), sinetöity lisälehti antiikin, kirkkoisien, klassikoiden ja arkistojen merkitsemiseen
  (`lisalehti-antiikki-ja-arkistot.md`; osastokohtaisia ohjeita ei löytynyt, käyttäjän pyyntö: avataan vain todelliseen tarpeeseen)
  ja `vertaa-luin.js`, joka ajaa tyylin esimerkit `kokoaViite`n läpi (28.10.2026: 13 samaa, 5 eroa, erot kirjattu).
  **Alaotsikko alkaa kaksoispisteen jälkeen isolla** kuten tyylin esimerkissä (käyttäjän päätös 28.10.2026, `nimiOsa`; ennen
  suomenkielinen pienennettiin). Pelkän viittauksen alaviite on pisteetön (`Derrida 2019, 143`; käyttäjän päätös 28.10.2026, tukena APA:n sisennetyn lainauksen
  pisteetön viittaus). Etusija: tyylin sääntö > tyylin esimerkeistä johdettu > tutkielman käytäntö > APA 7
  tyylin merkintätavalla. Kun muutat viitteiden kokoamista tai lähdeviittausten linkitystä, tarkista varanto ja aja vertailu.
- **Paluumajakka** (käyttäjän pyyntö 21.10.2026; opas, luku 4.8): ison hypyn (linkki, myös lähdeviittaus; aikajana,
  *Merkinnät*, haku; sivutettuna ≥ 2 sivua, vierityksessä ≥ 2 ruudullista) lähtökohtaan jää alapalkin yläpuolelle
  laatikko *Palaa takaisin* raksin kera ja aikajanalle kummitusmerkki (ontto kolmio, katkoviiva). Laatikon kolmio osoittaa
  paluun suuntaan (käyttäjän sääntö 21.10.2026): lähtökohta taaempana ylös, edempänä alas; päivittyy myös vieritettäessä. Katoaa vain raksista,
  paluusta, tekstin napautuksesta tai uudesta isosta hypystä (joka jättää uuden). Peräkkäiset hakuosumat säilyttävät
  ensimmäisen lähtökohdan. Ei tallenneta.
- **Lähdeviittauslinkit** (käyttäjän heuristiikka 21.10.2026; opas, luku 3.4): alaviitteen *Sukunimi vuosi* tai
  *Sukunimi paikannin* (`Korsgaard 8.1.2`) linkittyy kirjallisuusluettelon kohtaan (`p.bib`, id `kirj-<nimi>-<vuosi>`)
  vain varmalla yhteydellä: vuodella tasan yksi osuma; paikantimella tekijän ainoa kohta tai ainoa, johon ei viitata
  missään vuodella. Muuten ei linkkiä. Teologian tyylin muodot (28.10.2026): `A & B vuosi` (myös *ja*), `A et al. vuosi` (myös *ym.*)
  ja saman tekijän seuraava vuosi puolipisteen jälkeen ilman nimeä (`Allison 1993, 45–46; 2010, 31`), kukin omaan kohtaansa;
  paikantimessa ennen puolipistettä ei saa olla versaalia, jottei seuraavan tekijän viittausta lueta jatkoksi. Ei BibTeX:ää, Pandocia tms. (käyttäjän vaatimus); päättely on md.js:n
  `viittaukset()`, ja Latomo näyttää tuloksen tarkistuksessa. Linkki `a.lahde` on `--harmaa` (alaotsikon väri), ei
  ruoste, ja sillä on `--viiva`-värinen alleviivaus. Vain alaviitteissä, ei leipätekstissä.
  **Lyhenteet** (käyttäjän päätös 21.10.2026; opas, luku 3.4): ei merkintöjä tiedostoon. Osio, jonka otsikossa on
  *lyhent* (tai *abbreviation*), määrittelee lyhenteiksi kursivoidut yksittäiset 2–5 kirjaimen sanat, joissa on vähintään
  kaksi versaalia (*GMS*, *MS*, *KpV*, *KrV*; ei *A*). Alaviitteen lyhenne ja paikannin (`GMS 4:429`, `KrV A1/B1`, `KrV BXXX`)
  linkittyy kappaleeseen tai luettelon kohtaan, jossa lyhenne ensin määritellään (id `lyh-<lyhenne>`); linkki vie aina kappaleen alkuun, ei tarkkaan esiintymään, ja jos kappaletta edeltää suoraan otsikko, otsikkoon (käyttäjän päätös 22.10.2026; id on silloin otsikon). Selitysosiosta ei
  linkitetä edelleen kirjallisuusluetteloon eikä leipätekstiin tule linkkejä (käyttäjän päätös: minimalismi).
- Haku (käyttäjän säännöt 21.10.2026; opas, luku 4.7): aikajanan alla *Merkinnät*-laatikon oikealla puolella laatikko
  *Etsi*, joka avaa ponnahduslaatikon. Haku etsii sanojen alkuja; usean sanan haku on aina fraasi (sanat peräkkäin,
  kuin lainausmerkeissä; ei JA eikä TAI); lainausmerkeissä sana on kokonainen (*"kant"* ei löydä sanaa *kantilainen*).
  Valittu osuma korostetaan `::highlight(haku)`-rajapinnalla, joka ei muuta DOMia.
  Osumamäärän oikealla puolella on hyvin matalan profiilin kytkin *alaviitteet* (sisäkkäiset salmiakit kuten
  asetuksissa; oletuksena päällä, `aset.hakuViit`; käyttäjän pyyntö 21.10.2026). Alaviiteosuma vie viitenumeron
  riville ja näyttää alaviitteen (sivutettuna ponnahduslaatikossa, vierityksessä avattuna tai reunuksessa).
- Asetukset ja merkinnät (käyttäjän päätökset 21.10.2026; opas, luvut 4.3–4.6):
  - **Kirjasinvalinta poistettu.** Groteski näytti valikkojen, salmiakkien ja logon kanssa hirveältä; se palaa
    vain, jos koko ohjelman ulkoasu sovitetaan siihen. Viitenumerot ovat edelleen groteskia.
  - *Teksti* ja *Aikajana* ovat sateenvarjolistoja, joiden otsikko on pelkkä *Näytä:* isolla alkukirjaimella ja kursiivilla (käyttäjän päätökset
    21.10.2026; vasen reuna kuten muilla nimillä (vaihtoehtojen tekstin kohdalle sisennys ja pieni alkukirjain kokeiltiin ja hylättiin); väri sama `--harmaa` kuin h3:lla ja asetusten huomiolla; hajurakoa 8 px yläpuolella, alapuolella tavallinen 1 px kuten muilla nimillä (käyttäjän päätös 21.10.2026; hetken 12 px); sama 8 px:n lisäväli on kaikkien asetusten väliotsikoiden alla, myös *Ulkoasu*-otsikon, eli h3:n ja ensimmäisen nimen väli on 19 px; versaali sekoittuisi h3:een, valitsemattomien himmennys ei käy ja ruoste on napautettavan): *Teksti* sisällysluettelo / kirjanmerkit / alleviivaukset
    (alleviivausten alla pieni lisäkytkin *Sukkela alleviivaus*, oletus päällä, pois käytöstä piilotettuna) ja
    *Aikajana* Pääluvut / Alaluvut (oletus 21.10.2026 alkaen; ennen sitä hetken Kaikki) / Kaikki sekä kirjanmerkit ja
    edistyminen. Tasot ovat kumulatiivisia: *Alaluvut* sytyttää myös *Pääluvut*, *Kaikki* molemmat. Valitun tason napautus sammuttaa sen ja jättää ylemmät (*Pääluvut* sammuttaa kaikki etapit, `janaTaso: 0`); muu napautus asettaa tason (käyttäjän kokeilu 21.10.2026). Vanhat tallennetut asetukset vaihdetaan kerran uusiin oletuksiin (`av: 2` sukkela alleviivaus,
    `av: 3` Kaikki → Alaluvut; itse valittu Pääluvut säilyy).
  - *Ulkoasu*-osiossa heti teeman jälkeen on *Liikkuminen* (Vieritys / Sivut; ennen nimellä *Näkymä* viimeisenä).
    Huomio *Viitenumerot näkyvät aina* poistettiin asetuksista (vaatimus itse pysyy). Vienti- ja tuontiosion napit: *Vie*, *Tuo* (ei sanaa *tiedot*; käyttäjän päätös 21.10.2026).
  - Edistyminen on vain alapalkissa, ei avatun aikajanan ylärivillä. Sivunäkymässä se on sivunumero.
  - *Merkinnät*-listassa alleviivauksia ei koskaan alleviivata; alleviivaus näkyy vain tekstissä itsessään.
    Listan molemmat osiot (*Kirjanmerkit*, *Alleviivaukset ja kirjaukset*) supistuvat otsikon perässä olevasta pienestä
    salmiakista (täynnä auki, ontto kiinni); tila muistetaan (`kmKiinni`, `alKiinni`). Avattuna asettelu pikselilleen ennallaan.
  - Valinnan valikko: *Alleviivaa | Kirjaa | Kopioi |* kuparinen nauha (12 × 20 px, ei sanaa *Kirjanmerkki*).
    Käyttäjän päätös 21.10.2026: valikoissa ikonit tekstien sijaan (`ikNappi`, nimi `aria-label`/`title`):
    alleviivaa = *Abc* 3 px:n ruosteisen viivan päällä (liioiteltu tarkoituksella), kirjaa = täytetty lyhyt
    paksu kynä 45°, oikea yläpää suora ja vasen alapää kärki, kopioi = kaksi lomittaista suorakaidetta ilman
    tekstiviivoja, molemmat yhtenäisviivaisia (ei haamutusta; käyttäjän päätös 22.10.2026), poista alleviivaus = sama viiva ja *Abc*:n paikalla raksi.
    Kopioinnin kuittaus on rasti. Kirjauksellisen alleviivauksen poiston vahvistus (käyttäjän päätös 22.10.2026,
    `varmistaAlPoisto()`): napparivin tilalle iso nappi, jossa poiston ikoni ja yliviivattu kynä (`IK_POISTA_KIR`) sekä
    ruosteinen *Poista myös kirjaus?*, ja oikealla *älä!* (pienellä, huutomerkillä; käyttäjän valinta, ei *Ei*), joka
    palauttaa valikon. *älä!* on kursiivilla ja `--harmaa`, koska peruutus on hiljaisempi kuin poisto (22.10.2026).
    Rivivalikon leveys tulee napeista eikä kirjauksen esikatselusta (`contain: inline-size`; käyttäjän päätös 22.10.2026,
    ennen esikatselu levitti alleviivausvalikon 352 px:iin ja jätti aukon nappien oikealle puolelle); alleviivausvalikossa
    esikatselu katkeaa neljännelle riville, poiston vahvistuksessa ei. Kirjauksen esikatselu yliviivataan ruosteella; ison napin napautus ohitetaan 400 ms (tuplanapautus).
    *Merkinnät*-listan poisto kysyy edelleen *Vahvista*.
    **Kirjaus** on alleviivaukseen liitetty muistiinpano (`h.n`); laatikko kasvaa tarpeen mukaan, raja 5 000
    merkkiä ja jäljellä oleva määrä näkyy. Käyttöliittymässä sana on aina *kirjaus* (käyttäjä puhui myös muistiinpanoista).
  - Asetusten alimpana ovat erilliset supistetut osiot *Vie merkinnät tekstitiedostoon* ja *Tuo merkinnät tekstitiedostosta*
    (käyttäjän päätös 21.10.2026), joita edeltää johdanto *Luettuun muodostuneet merkinnät ovat tallessa vain tämän selaimen muistissa…* (asetusten huomiota *Asetukset koskevat kaikkia tekstejä* ei ole). Reunojen oletus on *Tasattu* (käyttäjän päätös 21.10.2026; jo tallennetut asetukset säilyvät, koska valintaa ei voi erottaa oletuksesta).
    Napit ovat pelkät *Vie* ja *Tuo*, ja ilman valintoja niitä ei voi painaa. Vienti vahvistetaan aina ponnahduslaatikossa;
    tuonti vain, jos kaikkea ei ole valittu (silloin kerrotaan, mitä tiedostosta ei tuoda). Viennin oletus on
    alleviivaukset ja kirjaukset (`av: 4` vaihtaa vanhan oletuksen kerran); tuonnissa kaikki valittuna aina asetuksia avattaessa,
    ei muisteta. Viennin valinnoista viimeisenä on *Edistymisen tilanne* (oletuksena pois: otsikon alle `Viety:` ja
    `Sijainti:` otsikon tarkkuudella, ei tarkemmin). Muotosäännöt (`merkinnatMd()`): otsikot tekstin hierarkian mukaan
    vain osioille, joissa on vietävää, saman osion merkinnät `---`:llä erotettuina; `KIRJANMERKKI n`, jonka perään virke
    vain jos alleviivauksia ei viedä; kirjaus lainauksen jälkeen; pelkät kirjaukset luettelona.
  - **Tuonti** (`tuoMerkinnat()`, käyttäjän pyyntö 21.10.2026: ei virallista tiedostomuodon tunnistetta, vientiä muutetaan
    vain sen verran kuin tuonti ehdottomasti vaatii). Vientiin tuli kaksi lisää: osiossaan toistuvan lainauksen ensimmäisen
    rivin perään `[n/m]` ja kirjanmerkin perään esikatselussa näkymätön `<!-- kohta: katkelma -->`. Tiedosto tunnistetaan
    `#`-otsikosta ja rivistä *Luetun merkinnät*, osiot tekstin otsikoista. Vanhasta viennistä (ilman näitä) tuodaan
    kirjanmerkit likimäärin. Säännöt: `luin/ohje.md`, luku 4.6.
    Onnistunut tuonti (käyttäjän pyyntö 22.10.2026, `naytaTuotu()`) avaa Tuo-napin päälle kuittauksen (ruosteinen rasti,
    *Merkinnät tuotu*, *Palaa tekstiin*, *Katso merkinnät listasta*), jotta nappia ei paineta uudestaan. Tuotu sijainti on
    kyltti: ruosteinen kehys, *Jatka siitä, mihin jäit* ja osion nimi, täytetty ruosteinen pää, jonka kolmio osoittaa suuntaan
    kuten paluumajakassa. Tilarivin kursiivin seassa ollut ruosteinen linkki ei erottunut; tilarivi jää kuittauksen alle.
Tehdyt ratkaisut, jotka näyttävät oudoilta mutta ovat mitattuja (`luin/kehitys/testi.js` tarkistaa ne):
- `kohdanLaatikko` ottaa merkin laatikoista **viimeisen**: tavutusrajan jälkeisen merkin ensimmäinen
  laatikko on Chromiumissa edellisen rivin lopun tavuviiva (6,7 px, edellisellä sivulla).
- Vierityksen kohta on rivi, jonka **keskikohta** on y = 70 (`YLA`), ja `mene()` vierittää merkin
  keskikohdan samaan: yläreunaa käytettäessä otsikon riviltä luettiin edellinen rivi (laatikot
  päällekkäin, line-height 1,25), ja kohta ajautui joka kokomuutoksella rivin ylöspäin.
- Sivutettuna kohdassa voi olla `ed`: sivu ilman tekstilohkoja (sisällysluettelo, voi olla
  monisivuinen) ankkuroidaan seuraavan lohkon alkuun `ed` sivua ennen sitä.
- Sivutettuna `hr.ennen-lukua` (--- juuri ennen ##-otsikkoa) piilotetaan: pääluku alkaa uudelta
  sivulta, ja viiva jäi muuten yksin omalle sivulleen.
- Väriperiaate (käyttäjän päätös 21.10.2026): ruoste = napautettava. Sisällysluettelon linkit ovat kokonaan ruosteella (numero ja teksti; kokeilu, vain numerot ruosteella oli vaihtoehto), otsikkolohkon tietorivit (`.meta`) kursiivia ja alaviitteet (`--huomio`, vaalea #74624a, tumma #a69272) hiukan harmaampia kuin `--harmaa`, mutta kontrasti ≥ 4,9.
- **Lainausten väri** (käyttäjän päätös 27.10.2026: lainaus ei erottunut nopeasti vieritettäessä): `blockquote` on värillä `--sitaatti`, 70 % musteesta harmaaseen Lab-avaruudessa (vaalea `#514331`, kontrasti 8,8; tumma `#c2af94`, 9,0). Käyttäjä valitsi kolmesta näytteestä (0, 50, 70 %) haaleimman.
- Vierityksessä pelkkä ikkunan korkeuden muutos ei aseta tekstiä uudelleen (mobiilin osoiterivi).
- **Tavutuskiellot** (käyttäjän päätös 22.10.2026): otsikoissa (h1–h6), alaotsikossa (`.sub`), tietoriveillä (`.meta`), sisällysluettelossa, lihavoinneissa, taulukon otsikoissa ja kuvateksteissä ei ole pehmeitä tavuviivoja (`OHITA` md.js:ssä), ellei yksittäinen sana ole palstaa leveämpi. **Kirjallisuusluettelo (`p.bib`) ei tavuta lainkaan** (käyttäjän päätös 28.10.2026; Teologian tyyli ja APA 7: ei tavutusta, DOI ja osoite katkeavat vain ilman lisättyä viivaa): `.bib` on `OHITA`ssa, se ei ole `tavutaPitkat()`in kohteissa (ylipitkä sana katkeaa viivatta, `overflow-wrap: anywhere`), ja selaimen tavutustilassa sillä on `hyphens: manual`. Mitattu tutkielmalla: luettelon pehmeät viivat 81 → 0 (tiheä 337 → 0), vierityksessä 0–5 riviä lisää, muu teksti merkilleen sama. Silloin `tavutaPitkat()` (luin.html, kutsutaan `asettele()`ssa) lisää viivat vain siihen sanaan ja poistaa ne, kun palsta levenee; `overflow-wrap: break-word` kattaa sanat, joita ei voi tavuttaa. Mittaus tehdään tilapäisesti `overflow-wrap: normal`illa, koska `break-word` katkoisi sanan jo mittaushetkellä (mittari oli ensin viallinen juuri siksi). Mitattu Chromiumissa 320 px: viivoja vain pitkissä sanoissa, 1280 px: ei yhtään; `testi.js` ennallaan (40 OK, samat kaksi ennestään olevaa VIKAa).
- Tavutus luokittelee rajat; varovainen tila jättää pois vokaalin ja yksinäisen konsonantin välisen
  rajan, koska yhdyssanavirheet (*kansalai-soikeus*) ovat aina sitä tyyppiä. ie/uo/yö ovat diftongeja
  myös ensitavun jälkeen paitsi monikon genetiivissä (*talvi-en*). Kursiivia ei tavuteta.
Kandidaatintutkielma on **väliaikaisesti** repossa (käyttäjän lupa 20.10.2026: "voit laittaa väliaikaisesti
tutkielman nettiin"): `luin/tekstit/kant-ja-elainetiikka.md` (etukenttä + alkuperäinen md muuttamattomana),
lukulistan linkki *Kokeiluteksti: Kant ja eläinetiikka* ja `robots.txt` (`Disallow: /luin/tekstit/`). Kun käyttäjä
sanoo kokeilun päättyneen, poista kansio, linkki ja robots.txt:n rivi. Muita käyttäjän tekstejä ei viedä repoon
ilman erillistä lupaa.
Käyttäjän lupa 25.10.2026 (kiire, ei aikaa siirtotavan rakentamiseen): `luin/tekstit/dialectic-of-enlightenment.md`
(verkosta kopioitu katkelma sellaisenaan, ilman etukenttää ja lukulistan linkkiä; avataan osoitteesta
`luin.html#u=luin/tekstit/dialectic-of-enlightenment.md`). Väliaikainen kuten tutkielma; pysyvä siirtotapa on avoin (opas, luku 9).
