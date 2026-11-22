---
paths:
  - "soitin/**"
  - "android/soitin/**"
---
## KEICK•WALK (`soitin/`, `android/soitin/`)

`soitin/` on työryhmän keikkasoitin *KEICK•WALK* (nimeämissääntö alempana). **Keikkatietoja (otsikko, mp3-linkki, settilista) ei
saa koskaan tallentaa repoon**, ei edes esimerkkinä. Ne ovat samassa KV:ssä avaimella
`gig:<tunnus>`, ja worker palvelee ne reitillä `GET /api/gig?k=<tunnus>`. Soitin lukee
tunnuksen osoitteen #-osasta (`soitin/#tunnus` tai kappaleeseen `soitin/#tunnus/3`;
useampisettisessä keikassa toisen setin kappale 3 on `soitin/#tunnus/2/3`).

### Keikka ja settilista

- Keikan valinnainen `sub`-kenttä (päivämäärä tai muu lisätieto) näkyy soittimessa otsikon alla
  harmaana kursiivina, mutta ei välilehden otsikossa. Puuttuvana tai tyhjänä riviä ei ole, eikä oletustekstiä (käyttäjän päätös).
  Vanhoissa keikoissa tyhjä rivi voi olla nollaleveä välilyönti `​`; soitin ohittaa sen, ja Keikkaloihdin poistaa sen haettaessa.
- **Ei-biisi eli x-rivi** (pelkkä `3:42`, `3:42 [Nimi]`, `3:42 [x] Nimi` tai `3:42 [x]`,
  missä kohtaa settiä tahansa; nimettömänä setin alussa `[INTRO]`, lopussa `[OUTRO]`, välissä `[VÄLI]`)
  ei kasvata numerointia, vaan numeron paikalla on harmaa `0.`, `x.` tai `-.` (soittimen lista ja nyt soi
  -kenttä, Keikkaloihtimen esikatselu). Merkin voi antaa itse: `[x]`, `[0]` tai `[-]` (myös `[–]`,
  `[—]`). Merkitön on `x.`, paitsi jos missään setissä ei ole kahta ei-biisiä peräkkäin: silloin setin
  alussa `0.`, lopussa `x.` ja välissä `-.` (käyttäjän päätös; automaattinen intro lasketaan
  mukaan). Keikkaloihdin tallentaa merkittömän nimettömän ei-biisin muodossa `[]` ja merkin muodossa
  `[0]` / `[0] Nimi`. Vanhat `[x]`-muotoiset keikat näkyvät `x.`-merkkisinä. Merkkisääntöjä ei selitetä Keikkaloihtimessa, vain `ohje.html#eibiisit`-osiossa.
  Ei-biisi tallennetaan otsikkoon eikä omaksi kentäkseen, koska worker päästää kappaleista läpi vain `t`, `title`, `set` ja `name`;
  näin kaverin workeria ei tarvitse päivittää.
- **Väliaika** (käyttäjän päätös): setti, jonka ainoa raita on ei-biisi `[Väliaika]` (kirjainkoko vapaa,
  kielimallin saatteessa `---` / `47:20 [VÄLIAIKA]` / `---`), näkyy soittimessa setin otsikkorivinä: sama koko, väli
  ja kursiivi kuin `li.set`:llä, numerosarake tyhjä, *[Väliaika]* kappaleiden
  nimien kohdalla ja väliajan kesto setin keston sarakkeessa. Rivi on nappi (hyppy väliajan alkuun), linkkinappia ei ole,
  ja soidessa kuulokkeet ovat numerosarakkeessa. Väliaika ei vie setin numeroa: seuraava setti on (ii), ja linkit
  (`#tunnus/2/3`) käyttävät näkyvää numeroa (`setInfo[k].no`, `finishSets()`); sisäisesti väliaika on oma settinsä,
  joten *setti*-asennossa soitto pysähtyy väliajan alkuun. Keikkaloihtimen esikatselu (`numbered()`) näyttää saman.
  Väliaika, joka ei ole yksin setissään, on tavallinen ei-biisi.
- **Setin kesto** (käyttäjän päätös): setin ensimmäisen biisin alusta viimeisen biisin loppuun, eli biisien
  väliset ei-biisit (spiikit) lasketaan mukaan ja vain setin alun ja lopun ei-biisit (intro, outro, aplodit, `[Vielä!]`
  encoresetin alussa) jäävät pois. Sama soittimessa (`renderLens`) ja Keikkaloihtimen esikatselussa.
  **Summamerkkiä Σ ei ole missään** (käyttäjän päätös): kesto on setin otsikkorivin oikeassa laidassa ilman merkkiä.
- Keikkaloihdin tallentaa ja näyttää alkuajat aina sadasosan tarkkuudella (`0:00.00`, `17:30.02`),
  myös haetun vanhan keikan listassa; soitin hyppää tallennettuun aikaan sellaisenaan.

### Keikkaloihdin (`soitin/uusi.html`)

- Tarkistaa settilistan ja tulostaa `kv:key put` -komennon samalla wrangler-versiolla kuin `generaattori.html`.
- **Nimet** (käyttäjän päätös): sivun nimi on kaikissa teksteissä (ohjeet, otsikot, kommentit) *Keikkaloihdin* (taivutus *Keikkaloihtimen*,
  *-loihtimessa*, *-loihtimeen*), ei *apusivu*. Keikkaloihtimeen annettava lista on käyttäjälle
  näkyvissä teksteissä *settilista*, ei *biisilista*, ja soittimen näyttämä lista on *kappalelista*.
  Koodin kommenteissa vanha *biisilista* tarkoittaa samaa.
- **DAW-markkerit**: settilistaksi käy myös Logicin markkerilistan kopio
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
  kuudestoistaosan välein). Oikealla Abletonilla testaamatta; `ohje.html`:n Ableton-osio on viimeisenä DAW:ista
  Logicin ja Reaperin jälkeen ja kertoo, ettei toimintoa ole testattu (käyttäjän päätös). Sen jälkeen on Audacity (labelien vienti,
  `RE_AUDACITY`; oikealla Audacityllä testaamatta, valikkojen nimet muistinvaraisia).
  Nimeämätön markkeri on missä tahansa DAW:ssa pelkkä aika eli ei-biisi. Aikaleimallinen `---`-rivi (markkeri nimeltä `---`) on setinvaihto.
  Markkerien vienti tiedoston mukana (WAVin cue-osio) on hylätty (käyttäjän päätös); äänitiedoston oletetaan alkavan aikajanan alusta.
- Suomenkielisessä tekstissä sana on foneettisesti *markkeri* (*markkerin*, *markkerit*, *markkerilista*; käyttäjän päätös);
  englanninkielinen *Marker* vain DAW:n valikon tai komennon nimessä (*Create Marker*, *List Editors → Marker*, oletusnimi *Marker 3*).
  Poikkeus: `#markerit`-osion avausvirke käyttää muotoa *marker-merkintöjen*, koska se esittelee sanan. Ankkuri `#markerit` pysyy.
- **Keikkaloihtimessa ei ole syntaksiohjeita kenttien alla** (käyttäjän päätös: sivua käytetään kymmeniä
  kertoja, ja ohjeet ärsyttävät). Settilistan alla on vain kehotus ja linkki; merkinnät ja
  vientiohjeet ovat `ohje.html`:n osioissa `#settilista` ja `#markerit`.
  `#markerit`-virke alkaa turkoosilla `SUOSITUS`-merkillä (sama `.merkki` kuin HUOM, ilman kaksoispistettä)
  ja korostaa, että markkerit istutetaan **manuaalisesti** (käyttäjän päätös).

### Aikakoodit kielimallilta

- Settilistan alla on tekstilinkki *OMALLA VASTUULLA: aikakoodit kielimallilta*, joka avaa lyhyen ohjeen (käyttäjän päätös).
  **Taitopaketti on pääreitti, saate B-polku** (käyttäjän päätös): laatikossa ensin *Claudelle (Opus)* ja *Kopioi aloituslause*, sitten *Kopioi saate*.
  Aloituslause on `Etsi keikkatallenteesta kappaleiden alkuajat ja setinvaihdot KEICK•WALK-settilistaksi.`, ja ohjeet
  käskevät ensin kirjoittamaan `/keik` ja valitsemaan taidon ponnahdusvalikosta (liitetty `/keikka-analyysi`-alku ei muutu taidoksi).
  Claude.ai:n itse tuottama englanninkielinen aloitus ei ole repossa eikä sitä voi muuttaa; opas neuvoo korvaamaan sen aloituslauseella.
- **Saate** näkyy sivulla vain nappina, ei tekstikenttänä (käyttäjän päätös); teksti on vain `llmPrompt()`-funktiossa, ei oppaassa, ettei siitä ole kahta versiota.
  Saate on suomeksi ja Markdown-otsikoin: tekoälyavustaja kysyy ensin yhdessä viestissä keikan rakenteen (biisimäärät seteittäin, encorebiisit, väliaika, intro- ja outronauhat) ja
  toiveen yli minuutin välispiikeistä, aloittaa asennukset ja pyytää sitten tiedoston ja käskyn *läpivalaise*. Mittaus
  tehdään koodilla; ilman koodin ajoa aikoja ei anneta. Ajat ovat navigointimerkkejä, eivät levyn raitarajoja.
  Saatteeseen lisätään vain yleispäteviä oppeja, ei yhden keikan erikoisuuksia (käyttäjän päätös).
  Vastausmuoto on settilistan muoto: `3. 12:05` nimetön biisi, pelkkä aika ei-biisi, `---` setinvaihto, `aika [VÄLIAIKA]`
  oma settinsä, encoret yhdessä setissä `(+)`, jonka jokainen encore alkaa rivillä `aika [Vielä!]`.
  Lohkon jälkeen epävarmimmat rajat, pelkkään kappalemäärään nojaavat rajat, poikkeavat määrät ja mittauskeinot.
  Kesto lisätään saatteeseen *Tärkeintä*-luettelon viimeiseksi, jos äänilinkistä saatiin. Vanhat `[Encore]`-rivit
  ovat tavallisia ei-biisejä. Jäsennin ohittaa koodilohkon ```- ja ~~~-rivit ja hyväksyy `--- (Nimi)` ilman aikaa.
  Saatteen muutoksen jälkeen aja `node soitin/keikka-analyysi/rakenna.mjs`.
- Oppaan osio `#kielimalli` on HUOM-huomion jälkeen harmaalla merkillä *OMALLA VASTUULLA:*, jonka perässä
  otsikon teksti on samalla kirjasimella ja harmaalla, mutta kursiivina ja pienaakkosin (käyttäjän päätös; otsikko pysyy h4-kokoisena,
  jotta kolmio on muiden alaosioiden linjassa). Järjestys: *Suositus: Claude ja taitopaketti* (numeroitu lista lataamisesta tarkistukseen),
  *Ilman taitopakettia: saate*, sitten malli ja taulukko (sarake *Kokeiltu*: Claude Opus *toimii*, Claude Sonnet *heikompi, ei suositella*,
  ChatGPT *ei kokeiltu*); mallien nimet tarkistaa käyttäjä.
- **Geminiä ei käytetä eikä sitä saa kehottaa missään** (käyttäjän päätös). Taulukon alla on kuitenkin
  `p.huom` *Geminiä ei toistaiseksi suositella* perusteluineen (kuuntelee eikä mittaa koodilla; saatetta ei ole kokeiltu
  sillä), ettei lukija päättele toimivuutta Claudesta. **Sonnetia ei suositella** (käyttäjän päätös).
- **Taitopaketti `soitin/keikka-analyysi/`**: Clauden taito (`SKILL.md` ja `scripts/`), ladattavana `soitin/keikka-analyysi.zip`
  (kansio zipin juuressa, kuten Claude.ai vaatii; kuvaus alle 200 merkkiä). `SKILL.md` tehdään `llmPrompt()`-tekstistä komennolla
  `node soitin/keikka-analyysi/rakenna.mjs`, joka lisää taidon omat kappaleet (`LISAYKSET`: asennus vaiheeseen 1 ja työjärjestys vaiheeseen 2)
  ankkuririvien perään ja kirjoittaa toistettavan zipin; `--tarkista` kertoo, ovatko ne ajan tasalla. Älä muokkaa `SKILL.md`:tä käsin.
  `rakenna.mjs` ei ole zipissä.
  - Vaiheen 2 työjärjestys on ylhäältä alas (yleiskuva → rakenne → rajat → lähikuvat → taulukko → tarkistus ehdokkaita vasten). Skriptin
    ehdokkaat ovat lähtökohta ja omaa lisäkoodia saa ajaa; rajaa ei oteta mukaan tai jätetä pois määrän takia. Lisäohjeet eivät korjaa
    malliajon rakennevirheitä, jos kielto on jo olemassa: puuttuva mittaus kuuluu skriptiin.
  - **Ei omaa luokkaa DJ-nauhalle eikä aplodeille** (käyttäjän päätös): nauhan tunnusmerkit (taso vähintään 8 dB alle musiikin mediaanin ja
    pulssin selkeys ≥ 0,6, kun edellinen osio ei täytä niitä) ovat rivin huomautus *nauhan tunnusmerkit*, ja tarkistin nostaa kappalerivin
    sen kohdalla TARKISTA-listalle. Sekunnin osia ei tarkenneta: vastausmuoto on kokonaiset sekunnit ja alku merkitään noin sekunti ennen
    ensimmäistä ääntä (muutos vaatisi saatteen ja tarkistimen muuttamista).
  - Ehdokkaiden luokat (RAJA, SAUMA, MODULAATIO?, BREAK, SPIIKKI, HÄNTÄ, HEIKKO), raja-arvot ja huomautukset ovat `scripts/analyysi.py`:ssä.
    HÄNTÄ on välttämätön: ilman sitä jokainen aplodien alku luokittuisi kappaleen aluksi. Soittamaton jakso lasketaan puheen, hiljaisuuden ja
    kohinan yhdisteenä, ja enintään 2,5 s:n välit nielaistaan (ina pilkkoo puheen lyhyillä hiljaa-lohkoilla); siksi encore-aplodit ja niitä
    seuraava puhe voivat yhdessä olla SPIIKKI. Tallenteen viimeisten 2 s:n ehdokkaat jätetään pois.
  - `--tarkista lista.txt [--setit] [--encoret]` tarkistaa vastauksen muodon; tarkistimen hyväksymien listojen pitää mennä Keikkaloihtimesta läpi
    0 virheellä. Kerrotusta poikkeava määrä ei estä OK:ta vaan tulostuu rivinä *MÄÄRÄ POIKKEAA*, koska suurin hallusinaatioriski on
    kappalemäärän pakottaminen täyteen. *Määrät täsmäävät* -rivi ei todista rajojen paikkoja. `--riippuvuudet`, `--ehdokkaat ehdokkaat.json`
    (TARKISTA-rivit), `--yleiskuva [S]` ja `--piirteet piirteet.npz`; omassa koodissa `from analyysi import lataa_piirteet, osio`.
  - `scripts/analyysi.py` (ffmpeg tai imageio-ffmpeg, numpy, scipy; valinnainen inaSpeechSegmenter) purkaa tiedoston
    16 kHz:n s16-memmapiksi ja käsittelee sen 10 min:n paloissa. Liukuvan mediaanin reunat peilataan, koska `nearest` nielaisee alun hiljaisuuden.
    Ilman inaa puhe arvioidaan karkeasti ja tuloste kertoo sen. inan kevyt asennus:
    `pip install --no-deps inaSpeechSegmenter && pip install tensorflow-cpu pandas scikit-image soundfile pytextgrid`.
    `scripts/zoom.py` piirtää mel-spektrogrammin ja tasokäyrän PNG:ksi ilman kuvakirjastoja (`--ruudukko t1,t2,…`, enintään 6).
  - `scripts/testi.py` tekee synteettisen tallenteen tunnetuin rajoin (myös modulaatio samassa tempossa ja hiljaisempi tasapulssinen nauha)
    ja vaatii jokaiselle rajalle ehdokkaan ±1,5 s:n päästä oikealla luokalla, ei ylimääräisiä RAJA/SAUMA-ehdokkaita, sekä valmiiden
    settilistojen tarkistukset. Aja se analyysin tai tarkistimen muutoksen jälkeen, inalla ja ilman.

### Kansiokeikka (lisäominaisuus)

Keikka voi olla myös Dropbox- tai Google Drive -kansio
(`{ title, folder }` KV:ssä audio-linkin ja settilistan sijaan). Worker lukee kansion palvelun
rajapinnasta joka haulla ja palauttaa `files`-listan. Tiedostot ovat kappaleita nimen mukaisessa
järjestyksessä, ja alikansiot ovat settejä. Dropbox tarvitsee workerin salaisuudet
`DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET` ja `DROPBOX_REFRESH_TOKEN` (linkit tilapäisiä, 4 h), Drive
salaisuuden `GOOGLE_API_KEY` (linkit pysyviä, kansio jaettu kaikille linkin saaneille).
Tarkistusreitit `/api/dropbox` ja `/api/drive`. Ohje: `kayttoonotto.html` ja `ohje.html`, liitteet.

**Kansio-ominaisuus ei saa vaikuttaa tavalliseen keikkaan** (yksi pitkä tiedosto ja settilista) eikä kaveriohjeen selkeyteen (käyttäjän päätös).
- Tavallisen keikan koodipolku pysyy ennallaan: kansiokoodi on omissa osioissaan
  (`Lisäominaisuus`-otsikot), ja yhteisissä funktioissa se on vain `files`-haaroina. Kansion
  tapahtumakäsittelijät kytketään vasta, kun kansiokeikka ladataan. Tavallinen keikka ei tee
  yhtään Dropbox- tai Google-pyyntöä.
- Keikkaloihtimessa kansiotila avataan sivun lopun tekstilinkistä; yhden tiedoston kenttä ei tarkista kansiolinkkejä.
- Kaveriohjeissa (`kayttoonotto.html`, `ohje.html`) kansiokeikasta on vain maininta johdannossa ja liite sivun lopussa.
- Soitin vaihtaa tiedoston vähän ennen edellisen loppua eikä vasta `ended`-tapahtumassa, koska
  lopun `pause`-tapahtuma saisi Android-kääreen (`silta.js`) laskemaan sovelluksen pois
  etualalta. Älä siirrä vaihtoa `ended`-tapahtumaan.

### Kaveriversio ja ohjeet

Toinen käyttäjä pitää keikat omalla Cloudflare-tilillään. Linkki `soitin/#tunnus@soitin.kaveri` hakee keikan osoitteesta
`https://soitin.kaveri.workers.dev` (rajattu `*.workers.dev`-osoitteisiin), ja
`uusi.html#w=…&a=…&n=…` tulostaa wranglerin sijaan `curl`-komennon Cloudflaren
REST-rajapintaan; API-avain luetaan Macin avainnipusta (`security … -s soitin-cf`).
Ilman `@`-osaa ja #-asetuksia molemmat sivut toimivat tavalliseen tapaan. Kaverin
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
  (Keikkaloihtimeen pääsee vain omalla linkillä; käyttäjän päätös).
  Osa *Keikan luominen* alkaa esikatselulla kahdessa palstassa (*Keikkaloihtimessa… /
  …annat / …saat*, välissä haalea pystyviiva), jonka jälkeen tulee vain tämän osan sisällys.
  Sitten Keikkaloihtimen kentät ylhäältä alas (tunnus, otsikko ja lisätieto → äänitiedoston
  linkki → settilista ja DAW-markkerit → *Uuden keikan ja sitä merkkaavan linkin tallentaminen*). Niiden
  jälkeen ovat suljettuina h3-osioina *Settilistan lisäominaisuudet* (ankkurit `#merkinnat` ja vanha
  `#valinnaiset`; sisällä avoimina h4-alaosioina *Setit* ja *Intro, outro ja muut ei-biisit* sekä
  suljettuna *Vaihtoehtoiset sallitut kielenkäytöt*) ja viimeisenä *Aiemmin luodun keikan
  muokkaaminen tai poistaminen* (ei *korjaus*: sana viittaa virheeseen). Ei yläotsikkoa *Edistyneet käyttäjät*;
  *Linkin jakaminen* on soittimen käytössä (suljettuna iPhonen ja ongelmatilanteiden välissä), ja äänitiedoston
  linkin alla on suljettu alaosio *Toiston soljuvuuden optimointi* (ankkuri `#aani`; tiedostomuodot ja Drive/Dropbox; käyttäjän päätös).
  Se on muotoiltu kuten settilistan HUOM (`details.osio.huom`: pieni, sisennetty, ohut viiva vasemmalla), mutta suljettuna, ja HUOM-merkin
  paikalla on otsikko merkin kokoisena, lihavoimattomana, päävärillä (tummassa valkoinen), versaalina, ilman kursiivia, harvennusta ja
  kaksoispistettä (käyttäjän päätös). Sisällys on kahdessa palstassa: vasemmalla kentät, oikealla
  nämä kaksi suljettua osiota. Settilistan lopun lisähuomio (aikojen tarkkuus) on `p.huom`
  HUOM-merkinnällä: pieni, kapea ja sisennetty, ohut viiva vasemmalla, ettei se näytä kuuluvan
  viimeiseen alaosioon eikä raskauta pääraidetta.
  Muut harvemmin tarvittavat osiot ovat suljettuina `<details class="osio">`-lohkoina
  (`details.osio.ala` = h4- tai h5-tason alaosio, esim. Drive, Logic; avattuna sisältö pienempänä
  ja sisennettynä otsikon tekstin linjaan, viiva kolmion alta; otsikko ei liiku. Logic-osion
  versiohuomautus on `p.huom` ilman merkkiä, jotta se sisentyy listan tekstiä pidemmälle; käyttäjän päätös).
  Ilman `.ala`-luokkaa suljettu osio on samantasoisten osioiden vertainen (esim. iPhone, linkin
  jakaminen, muokkaaminen ja poistaminen). Uudet osiot sijoitetaan
  loppupäähän, tarvittaessa suljettuina. #-linkki
  suljetun osion sisään avaa sen ja sen ympäröivät osiot; tulostus avaa kaikki. Kuvat `ohje-soitin.png` ja `-tumma.png` on otettu oikeasta soittimesta keksityllä
  esimerkkikeikalla (sama lista kuin oppaan esimerkissä; intro `[Intro]`, toinen setti nimellä `(Encore)`;
  Playwright, näkymä 560 × 741 px, DPR 2, soitto kohdassa 4:52, keikka ja hiljainen 23:40 mp3
  `page.route`-siepattuina). Jos soittimen ulkoasu muuttuu
  olennaisesti, ota kuvat uudelleen samalla tavalla; oikeita keikkatietoja ei käytetä.
- `soitin/KAVERIVERSIO.md` on vain osoitin näihin sivuihin vanhojen linkkien vuoksi.
- `soitin/pikakayttoonotto.html` on lyhyempi reitti uudelle Macille (mahdollisimman
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
  `SOITIN_KV=--local`; Cloudflaren väliaikainen tili (`wrangler kv namespace list --temporary`) kelpaa rajapintatestiin.
  Ajamatta: oikea Mac, selainkirjautuminen ja workers.dev-nimen rekisteröinti. Väliaikaisen tilin workers.dev-osoite haastaa
  palvelinkeskuksen IP:n (403, `cf-mitigated: challenge`), joten soitinta ei voi testata sitä vasten selaimesta.
- Ohjeissa Google Drive mainitaan ennen Dropboxia.
- **Drive-tiedostot soivat workerin kautta** (`GET /api/drive-file?id=<ID>[&rk=<resourcekey>]`).
  Google palauttaa Driven latauslinkistä 403:n, kun pyynnössä on selaimen otsake
  `Sec-Fetch-Site: cross-site` (ilman otsaketta sama linkki antaa 200/206),
  joten `<audio>` ei voi soittaa sitä suoraan github.io:sta. Worker hakee tiedoston ilman selaimen
  otsakkeita, välittää vain Range-otsakkeen ja hyväksyy vain `audio/*`- ja `video/mp4`-tyypit.
  Keikkaloihdin muuttaa Drive-linkin (`/file/d/<ID>/…`, `open?id=`, `uc?id=` ja vanha
  `drive.usercontent.google.com/download?id=`) tämän reitin osoitteeksi kirjanmerkin workerissa;
  kansiokeikan `driveFileUrl` käyttää samaa reittiä. Dropbox-linkit soivat suoraan.
  Muunnos tehdään myös ilman #-asetuksia (käyttäjä voi tallentaa Drive-keikan kaverin puolesta
  omaan workeriinsa); silloin reitti on `tusinasaa-worker`issa, jonka koodin pitää olla päivitetty.

### Android-kääre ja Omat keikkani

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
ja tallennusta ei ole. Evästebanneria ei tarvita:
tallennus on käyttäjän itse pyytämää toimintoa eikä lähde laitteelta. Verkossa otsikon perässä on ⓘ-nappi, joka
avaa otsikon alle hennon tietoiskun (ensin omalla rivillään lainausmerkeissä kursiivinen iskulause
*”(1) Valg ðø KEICK → (2) WALK the Geigh!”* (käyttäjän päätös), sitten soittimen esittely, käyttöoppaan linkki
tyhjän rivin jälkeen ja virke *Omien keikkojen luominen vaatii Mac-tietokoneen sekä käyttöönoton (n. 30 min).*,
jossa *käyttöönoton* on linkki; linkit avautuvat uuteen välilehteen, ettei soitto katkea); sovelluksessa nappia ei ole, koska listan WebView ei avaa linkkejä.
Jos muutat `keikat.html`:ää, testaa molemmat sillat; sovellus saa muutoksen vasta uudessa APK:ssa.
Listan ja tunnuskentän yläpuolella on vakiofonttinen kursiivi *Valkkaa keikka!* (käyttäjän päätös; `.pick`:n 36 px:n
yläreunus, ei tietoiskun ollessa auki). Napin, iframen ja listan `<title>`-elementin nimi on *Omat keikkani*.

### Nimi ja logo

**Nimi KEICK•WALK** (käyttäjän päätös): soittimen nimi on kaikissa
käyttäjälle näkyvissä teksteissä (sivut, ohjeet, Keikkaloihdin, sovelluksen nimi ja napit)
*KEICK•WALK* sanan *soitin* sijaan: versaalit, välissä luettelomerkki `•` (U+2022) ilman välilyöntejä,
ei loppupistettä; myös virkkeen alussa sama. Nimeä ei taivuteta: virke kirjoitetaan niin, että nimi on
perusmuodossa, tai käytetään yhdyssanaa (*KEICK•WALK-sivulla*, *KEICK•WALK-linkin*). Logo on
grafiikka ja pysyy muodossa keick·WALK. Polut, komennot,
workerin ja KV:n nimet sekä koodin tunnisteet (`soitin/`, `~/.soitin/soitin`, `soitin.jotain`,
`soitin-keikat`) pysyvät ennallaan, samoin koodin kommenttien *soitin*.

Alatunniste *© TUSINASOFT 2026* (aina yhteen, ilman interpunktia; vuosiluku ks. juuren CLAUDE.md) on listan alalaidassa ja
`</main>`-tagin jälkeen Keikkaloihtimessa, `ohje.html`:ssä, `kayttoonotto.html`:ssä ja `pikakayttoonotto.html`:ssä, mutta ei
soitinsivulla (`index.html`; käyttäjän päätös). Korostusväri on kaikilla soittimen sivuilla Okinawa-turkoosi `#0a7f76` / tummassa
`#1fb5a8` (Sports Walkmanin runko).

**Logo** on SVG-polkuja, koska sovellus näyttää listan assetista ilman verkkoa; generaattori ei ole repossa, joten merkintä on kopioitu
sellaisenaan `keikat.html`:ään, `index.html`:ään ja ohjesivuille. Mitat ovat käyttäjän kanssa iteroituja; älä muuta niitä kysymättä.
Yksikkönä perusviiva 20:
- WALK on Walkman-logon mittasuhteilla (korkeus 16, viiva 3,2, W:n "pakarat" eli kaksi puoliympyräpohjaa,
  A kaarena ja pallo sen sisällä, K:n vinot kaarina, L:n ulkokulma pyöreä) ja tekstin värinen.
- keick on pienillä kirjaimilla ilman nousuja, viiva 2,6, y 4–19,7 (yläreuna kuulokkeiden sangan viivan alareunassa); e:n ja c:n
  alaviivojen keskilinja on L:n alaviivan keskilinjalla (18,4). e on W kyljellään ja yhtä leveä kuin c, c on A kyljellään ilman palloa.
- Turkoosit täytetyt pallot (halkaisija 5,24) ovat tyynyt, A:n pallo ja janan nuppi A:n kohdalla. i:n piste (2,0 alkusanan
  yläpuolella) ja interpunkti ovat pieniä tekstin värisiä palloja (2,6). Interpunkti ja A:n pallo ovat alkusanan keskilinjalla (11,85).
- Kuulokkeet: sanka 1,2, lakipisteen viivan alareuna kirjainten yläreunassa (y 4) ja yläreuna y 2,8; korvalappujen keskipisteet x 3,61 ja
  18,26 (väli 14,65), sangan säde 7,325. Rako oikeasta lapusta k:hon on 9,0: keick•WALK-osa on `<g transform="translate(3 0)">`,
  jonka ulkopuolella ovat sanka ja kaksi tyynyä; k:n vasen reuna on x 29,88.
- Jana (keskilinja 35,83, paksuus 1,5 = nuppi × 4/14 kuten soittimessa) alkaa k:n varren vasemmasta reunasta (polku 0,75 sisempää
  pyöreän pään takia); tekstin värinen nuppiin asti, ja sillä tekstin väriset pisteet (2,6) i:n ja interpunktin kohdalla; nupin jälkeen
  `--line` loppurenkaan kehän keskelle. Nuppi (r 2,62) ja loppurengas (ulkosäde 2,62 = r 2,12 + kehä 1,0) ovat saman kokoisia.
  Janan viivan alareuna on soittimen lisätietorivin pyöreiden kirjainten alareunassa (vain yksirivisellä otsikolla; käyttäjän päätös).
- Listan logo: viewBox `0.99 -2.6 157.43 41.05`, CSS `calc(1.0295rem / 13.38 * 157.43)` × `calc(… * 41.05)`, `overflow: visible`.
  Samassa mittakaavassa ja kohdassa kuin soitinsivun kuulokkeet, joten sen kuulokkeet ovat tasan soittimen kuulokkeiden päällä
  (käyttäjän päätös); sangan yläreuna 5 px h1:n yläreunan alapuolella, h1:n alamarginaali 34 px.
- Ohjesivuilla (Keikkaloihdin, `ohje.html`, `kayttoonotto.html`, `pikakayttoonotto.html`) sama merkintä 1,25-kertaisena (196,79 × 51,31 px)
  otsakkeena otsikon yläpuolella (oikeaan yläkulmaan *Keikkaloihdin* ei mahdu puhelimella). Sen alla h1 on pelkkä sivun nimi
  (*Keikkaloihdin*, *Käyttöopas*, *Käyttöönotto*, *Pikakäyttöönotto*; käyttäjän päätös), kaikilla neljällä 2 rem, alamarginaali 28 px,
  ja ensimmäisen kirjaimen muste alkaa logon k:n vasemmasta reunasta: sivun lopun skripti mittaa kirjaimen sivuvälin canvasin
  pikseleistä (ankkuri x 29,88), CSS:n `calc(36.11px - 0.075em)` on oletus ilman skriptiä.
- viewBoxeissa on 0,5 yksikön vara reunoilla, koska Safari leikkaa oikean tyynyn reunan viewBoxin rajalla.

### Soitinsivu (`soitin/index.html`)

- Logosta on vain kuulokkeet (`.brand`, viewBox `0.99 2.8 19.89 17.2`) vasemmassa yläkulmassa (käyttäjän päätös): sangan yläreuna
  h1:n yläreuna + 5 px (kiinteä `top: 33px`), mittakaava 1,0295 rem / 13,38 per viewBox-yksikkö.
- **Otsikko** (Figtree 600, käyttäjän päätös: viivan paksuuden suhde versaaliin on sama kuin keick-kirjaimilla): versaali 15,7 yksikköä
  (`calc(1.0295rem / 13.38 * 22.429)`), versaalin yläreuna sangan viivan alareunassa ja perusviiva keick-kirjainten alareunassa (y 19,7).
  `alignTitle()` mittaa ensimmäisen rivin perusviivan DOMista ja siirtää sen paikalleen ylämarginaalilla; alamarginaali muuttuu
  vastakkaiseen suuntaan, joten otsikon alla oleva ei liiku (CSS-arvot pätevät vain oletuskoossa; suurennettu tekstikoko ja muut fontit
  siirtäisivät perusviivaa). Kutsutaan `start()`issa, `fontsReady`ssa ja `resize`ssa. Otsikon K:n ja lisätiedon mustereuna on
  listan logon k:n kohdalla (`main > h1` ja `.sub` sisennys 28,89 yksikköä = 29,88 − 0,99, miinus kirjaimen sivuväli).
- **Chromium pyöristää tekstin perusviivan kokonaiseen CSS-pikseliin**, SVG ei pyöristy, joten piirretty otsikko voi olla 0,5 px
  laskettua ylempänä tai alempana. Mittaa piirrettyä mustetta, älä laskettua.
- Otsikko alkaa aina kuulokkeiden vierestä (käyttäjän päätös): jos ensimmäinen sana ei mahdu kuulokkeiden
  ja nappien väliin, se katkeaa väkisin kahdelle riville (`h1 { overflow-wrap: anywhere }`) eikä siirry nappien alle.
  Muut sanat rivittyvät tavallisesti. Otsikolta varataan yläkulman nappien tila
  (45 px, sovelluksessa 141 px) kelluvalla `.brand-space`-laatikolla vain ensimmäiseltä riviltä, ja se korvaa otsikon
  oikean reunuksen (myös silta.js:n `main>h1{padding-right:136px}`).
- **Aikajana** (käyttäjän päätös): jana 2 px, soitettu osa tekstin värinen, loppu
  `--line`; biisien alut ovat tekstin värisiä palloja janan keskellä, soittokohdan ohittamat 4 px (`.ohi`)
  ja tulevat janan paksuisia 2 px (ero janaan parillinen, jotta pallo ylittää janan yhtä paljon ylä- ja
  alapuolella pikseleiksi pyöristettynä). Ei-biisien alkuja ei merkitä janalle (sääntö toistaiseksi).
  Janan lopussa tekstin värinen 12 px:n rengas (kehä 2 px, `.loppu`) kuten logossa. *setti*-asennossa
  rengas siirtyy keikkajanalla pysähdyskohtaan eli seuraavan setin alkuun, janan jatko palloineen häipyy kokonaan
  (taustan värinen `.jatko`; jatkoa voi silti napauttaa), ja janan pituuden tilalla on pysähdyskohdan aika keikan alusta
  (`.setend`), ei setin pituus, renkaan alla keskellä (käyttäjän päätös; aika ei mene soittokohdan ajan päälle).
  Osoitinpallo (`.knob`) on turkoosi (`--accent`) kuten logon janan nuppi (soitin harmoniassa logon kanssa).
- **Kytkinten symbolit** ovat himmeän harmaita: janakytkimen alla pienoisjana (jana 1 px, alussa täytetty pallo 4 px, lopussa
  hyvin ohut rengas 3,47 px, kehä 0,6 px) kytkimen levyisellä alueella, pallon vasen ja renkaan oikea reuna 2 px kytkimen reunojen
  sisäpuolella (tasan reunoilla jana näyttää optisesti kytkintä leveämmältä; käyttäjän päätös). Setin kytkimen alla pienet logon
  kuulokkeet (`.minikuul`, viewBox `0.99 2.8 19.89 17.2`, 9,5 × 10,986 px; käyttäjän päätös), *keikka*-asennossa himmennettyinä;
  pienoisjana 0,75 px kuulokkeiden keskikohdan alapuolella (`top: 2.75px`).
- **Kappalelista**: ei pystyviivaa eikä sen vaatimaa vasenta reunusta (`.track` padding 4 px). Soivan
  kappaleen numero on piilotettu, ja sen paikalla ovat logon kuulokkeet (`.kuul`, viewBox `0.49 2.3 20.89 18.2`) numeroiden
  tapaan oikeaan reunaan tasattuina (`markCurrent()`); numerolaatikko (min. 1.6em) on kuulokkeita
  leveämpi, joten otsikko ei siirry (käyttäjän päätös). Tyynyjen alareuna on perusviivalla
  ja sangan viivan alareuna versaalin (H) yläreunassa kuten logossa (käyttäjän päätös); mittasuhteet ovat logon.
  `markCurrent()` mittaa perusviivan `getBoundingClientRect`illa (ei `offsetTop`, joka pyöristää) ja versaalin piirtämällä H:n
  canvasille ja lukemalla musteen pikseleistä (`ink()`; `measureText` pyöristää 1/32 em:n portaisiin). Mitta muistetaan vasta,
  kun fontit ovat latautuneet.
- **Ei-biisirivi** on pienempää tekstiä (käyttäjän päätös): hakasulku on yhtä
  korkea kuin tavallisen rivin versaali, ja sen alareuna on tavallisen rivin perusviivalla eli soivan rivin
  kuulokkeiden tyynyjen alareunassa. Kerroin `--xk` ja nosto `--xr` riippuvat fontista, joten `fitExtras()`
  mittaa ne piirtämällä H:n ja kursiivisen [:n canvasille; CSS:n oletukset ovat Figtreen. Nollalevyinen,
  tavallisen kokoinen `.tuki` pitää rivin korkeuden ennallaan ja nostaa perusviivaa marginaaleillaan, ja
  `markCurrent()` mittaa kuulokkeet siitä. Numerosarake pysyy tavallisen levyisenä, joten otsikot alkavat samasta kohdasta.
  Setin otsikko seuraa setin alun pientä `0.`-merkkiä (`alignSetNames`).
- Soivan kappaleen nimi on lihavoitu ja turkoosi (`--accent`; ei-biisi pysyy harmaana), ja hiiren alla kappaleen nimi muuttuu
  turkoosiksi alleviivauksen sijaan.

### Fontti

**Figtree** (käyttäjän päätös; system-ui eli Roboto "kirkui" logon vieressä). Tiedostot `soitin/fontit/` (SIL OFL, lisenssi mukana):
`figtree.woff2` ja `figtree-kursiivi.woff2` (latin) sekä `-ext`-versiot (latin-ext), muuttuva paino 300–900, Google Fontsista
sellaisenaan. Sivuilla `@font-face` on sivun omassa tyylissä (`font-display: block`, `fontit/…`-polut, `<link rel="preload">`
normaalille ja soitinsivulla kursiiville), ja fonttipino on `"Figtree", system-ui, …`. **`lista/keikat.html`:ssä fontti on
data-URI:na** (vain latin), koska sovellus näyttää sivun assetista ilman verkkoa ja assettien juuri on `soitin/lista`.
Merkit →, ←, ▸, ☰, ⌘, ⌫, ✓, ⇥ ja 🔒 puuttuvat Figtreestä ja tulevat varafontista.
Mittaukset (`fitExtras`, `capHeight`, `alignSetNames`, `placeSetEnd`, `alignTitle`) odottavat soitinsivulla lupausta `fontsReady`
(tavallinen ja kursiivinen leike ladattu), koska `document.fonts.ready` ei odota vielä piirtämätöntä kursiivia; ohjesivujen
otsikkolinjaus odottaa otsikon leikettä (`700 1em "Figtree"`). **Älä palauta `document.fonts.ready`-varianttia.**
Figtreen mitat (canvasin musteesta, ±1/400 em): versaali 0,7 em (OS/2 `sCapHeight` 700), `[` ylös 0,8 ja alas 0,1 em (`--xk` 0,7778,
`--xr` 0,0778), K:n sivuväli 0,0925 / 0,0875 / 0,0825 / 0,075 em painoilla 400 / 500 / 600 / 700, kursiivisen l:n 0,0275 em (paino 400),
x-korkeus 0,5 em, hhea 0,95 / −0,25.
