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
`llmPrompt()`-funktiossa, ei oppaassa, ettei siitä ole kahta versiota. Saate on suomeksi ja
Markdown-otsikoin: tekoälyavustaja kysyy ensin yhdessä viestissä kappaleiden, settien ja encorejen
määrän ja pyytää sitten tiedoston ja käskyn *läpivalaise* (tiedosto ja vastaukset riittävät ilman
käskyä). Vastausmuoto on settilistan muoto: `3. 12:05` nimetön biisi, pelkkä aika ei-biisi, `---`
setinvaihto; kaikki encoret yhdessä setissä `(+)`, jonka encorekierrokset alkavat ei-biiseillä
`[Encore]` tai `[Encore 1]`, `[Encore 2]`. Kesto lisätään saatteeseen, jos äänilinkistä saatiin.
Jäsennin ohittaa koodilohkon ```-rivit ja hyväksyy `--- (Nimi)` ilman aikaa. Oppaassa osio
`#kielimalli` on HUOM-huomion jälkeen harmaalla merkillä *OMALLA VASTUULLA:*, jonka perässä
otsikon teksti on samalla kirjasimella ja harmaalla, mutta kursiivina ja pienaakkosin (käyttäjän
päätös 20.10.2026; otsikko itse pysyy h4-kokoisena, jotta kolmio on muiden alaosioiden linjassa); mallitaulukon nimet
ovat muistinvaraisia, ja käyttäjä tarkistaa ne.
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
avaa otsikon alle hennon tietoiskun (ensin omalla rivillään lainausmerkeissä kursiivinen iskulause *”Valg dø KEICK • WALK ðö geig!”*,
jossa pisteen ympärillä on toisin kuin nimessä välilyönnit; sitten soittimen esittely, käyttöoppaan linkki
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
ja setin kytkimen pienet kuulokkeet (`.kuul`, `.minikuul`) ovat vanhalla sangalla viewBoxissa `0.99 4 17.89 16`,
koska ne on mitoitettu tekstiin.
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
otsikko *KEICK•WALK omalle Cloudflare-tilille* on nyt johdannon alussa). Logo on otsikon yläpuolella eikä
oikeassa yläkulmassa, koska puhelimen leveydellä (375 px) otsikolle jäisi logon vieressä 135 px eikä
*Keikkaloihdin* mahdu (mitattu Chromiumissa). Listan ja
tunnuskentän yläpuolella on vakiofonttinen kursiivi *Valkkaa keikka!*; alalaidassa haalea
*© TUSINASOFT* (aina yhteen, ilman interpunktia; käyttäjän päätös 20.10.2026). Sama alatunniste samalla tyylillä on `</main>`-tagin jälkeen Keikkaloihtimessa,
`ohje.html`:ssä, `kayttoonotto.html`:ssä ja `pikakayttoonotto.html`:ssä, mutta ei soitinsivulla
(`index.html`); käyttäjän päätös 19.10.2026. Korostusväri on kaikilla soittimen sivuilla Okinawa-turkoosi `#0a7f76` / tummassa
`#1fb5a8` (Sports Walkmanin runko). Napin, iframen ja listan `<title>`-elementin nimi on edelleen
*Omat keikkani*.
Soitinsivulla logosta on vain kuulokkeet (`.brand`) vasemmassa yläkulmassa (käyttäjän päätös 20.10.2026,
vaihtoehto A; vaihtoehto B eli koko logo otsikon yläpuolella hylättiin): sangan yläreuna h1:n yläreuna + 5 px
(kiinteä `top: 33px`) ja tyynyjen keskipisteet ensimmäisen rivin perusviivalla. Mittakaava 1,0295 rem / 13,38 per
viewBox-yksikkö (kuulokkeet noin 22 × 19,7 px) on peräisin 1,45 rem:n otsikon versaalista. Käyttäjän päätös
20.10.2026: otsikko on pienempi ja reilusti ohuempi (1,3 rem, paino 500, oli 650), perusviiva pysyy tyynyjen
keskellä (`padding-top: 2.5px`; Robotolla 49,5 px, tyynyjen keskipiste 49,47 px), ja otsikon K:n mustereuna on
listan logon k:n kohdalla (padding-left `24,89 yksikköä − 0,08 rem`, Roboton K:n sivuväli; mitattu 46,66 px).
Lisätieto sisennetään samoin, ja sen x-korkeuden yläreuna on listan logon janan alareunassa (h1:n alamarginaali
4,5 px; mitattu 67,18 px). Testiselaimen Interillä K on 0,3 px oikealla ja x-korkeus 1,2 px ylempänä.
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
ja renkaan oikea reuna kytkimen reunoilla; käyttäjän valinta kolmesta leveydestä); setin kytkimen alla entisen stop-merkin ja nuolen tilalla pienet logon kuulokkeet
stop-merkin paikalla ja korkuisina (8 px), *keikka*-asennossa himmennettyinä.
Kappalelistassa ei ole pystyviivaa eikä sen vaatimaa vasenta reunusta (`.track` padding 4 px). Soivan
kappaleen numero on piilotettu, ja sen paikalla ovat logon kuulokkeet (`.kuul`) numeroiden
tapaan oikeaan reunaan tasattuina (`markCurrent()`); numerolaatikko (min. 1.6em) on kuulokkeita
leveämpi, joten otsikko ei siirry (käyttäjän päätös 20.10.2026). Kuulokkeiden tyynyjen alareuna on perusviivalla
(ei g:n tai p:n alareunassa) ja sangan yläreuna tekstin sisältöalueen yläreunassa, vähän korkeimpien kirjainten
yläpuolella (käyttäjän päätökset 20.10.2026; Chromiumin Interillä 17 px:n tekstillä 15 px korkeat). `markCurrent()`
mittaa perusviivan ja sisältöalueen DOMista, koska `system-ui` on eri laitteilla eri fontti. Välillä kokeiltiin
sisältöalueen alareunaan ulottuvia (20 px) ja korkeimpien kirjainten korkuisia (13 px). Soivan kappaleen nimi on lihavoitu ja turkoosi
(`--accent`; ei-biisi pysyy harmaana), ja hiiren alla kappaleen nimi muuttuu turkoosiksi alleviivauksen sijaan. viewBoxissa on 0,5 yksikön vara reunoilla, koska Safari leikkasi
oikean tyynyn reunan viewBoxin rajalla; samasta syystä listan logolla on `overflow: visible`.
Soittimen osoitinpallo (`.knob`) on turkoosi (`--accent`) kuten logon janan nuppi (käyttäjän
vaatimus: soitin harmoniassa logon kanssa).
