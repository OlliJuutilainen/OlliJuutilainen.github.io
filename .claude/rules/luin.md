---
paths:
  - "luin.html"
  - "luin/**"
  - "docs/viitteet/**"
---
## Luin (lukulaite)

Tässä on vain se, mitä koodista ei näe tai minkä voisi helposti rikkoa. Yksityiskohdat ovat kehittäjän oppaassa
`luin/ohje.md` (luvut mainittu alla), historia commit-viesteissä.

### Tiedostot

- `luin.html` (juuressa, koska ohjelman nimi on luin.html): lukulista ja lukija samalla sivulla. Kaikki on selaimen
  localStoragessa (opas 2.3); palvelinta ei ole, paitsi postilaatikko.
- `luin/md.js`: Markdown-jäsennin ja suomen tavutus, yhteinen lukijalle ja Latomolle.
- `luin/latomo.html` (*Latomo*): tarkistaa md:n, täydentää etukentän, siirtää tekstin Luiniin avaimella `luin-tuonti`
  tai antaa .md:n ladattavaksi. Ohje kirjoittajalle: `luin/latomo-ohje.html`.
- `luin/kayttoohje.html`: lukijan käyttöohje, **ei Latomon**. Kun lukijan käyttäjälle näkyvä toiminta muuttuu,
  tarkista käyttöohje.
- `luin/ohje.md`: kehittäjän opas, avautuu `luin.html#u=luin/ohje.md`. Lukulistassa siihen ei ole linkkiä (käyttäjän
  päätös: pois julkisivusta, ei piiloteta repossa).
- `luin/kehitys/logo.js` tulostaa logon SVG:n, joka on kopioitu neljään sivuun (luin.html, Latomo, Latomon ohje,
  käyttöohje). Nimen tekstimuoto (aria-label, infolaatikko) on *LUiN.HTML*; tiedostonimet ja polut ovat `luin.html`.
- Asetuskiekon SVG on luin.html:ssä kahdesti (`.ratas`-nappi lukulistassa, `#ratas-polku` lukijassa): pidä yhtenevinä.
- `docs/viitteet/`: viitetyylin varanto (Teologian tyyli 2021, APA 7 -turvaverkko, sinetöity lisälehti, joka avataan
  vain todelliseen tarpeeseen). Etusija ja ratkaistut kysymykset ovat sen `README.md`:ssä. Kun muutat viitteen
  kokoamista (`kokoaViite`) tai lähdeviittausten linkitystä, tarkista varanto ja aja `node docs/viitteet/vertaa-luin.js`.
- Hegel-repon `pdf_to_markdown.py` kirjoittaa etukentän, jonka Latomo lukee (opas 7.1): lähde eriteltynä (`journal`,
  `volume`, `issue`, `pages`), ei `source`-avainta, koska Latomo lukisi sen verkko-osoitteeksi. Pidä avaimet yhteensopivina.

### Käyttäjän linjaukset

- **Ei kaveriversiota** eikä sen mainostusta. Käyttöönotto (oma worker, repo, Dropbox) on myöhempi kysymys (opas 9).
- **Jakaminen on erittäin sivuosassa**: vain lukulistan nimikkeen pieni jakonappi (lähdeviite, verkkotekstin linkki,
  poisto). Lukutietoja ei lisätä viitteeseen pakolla (kytkin `aset.viiteLisa`, oletus pois).
- **Viitenumerot näkyvät aina**; niitä ei saa asetuksista pois.
- **Värit eivät ole soittimen**: ruskea, okra, ruoste, paperi ja muste, kuusi väriä teemaa kohti. E-ink: ei varjoja,
  ei läpikuultavuutta, ei animaatioita. **Ruoste = napautettava.** Tarkoituksellinen poikkeus: lähdeviittauslinkki
  `a.lahde` on `--harmaa` ja sillä on `--viiva`-alleviivaus.
- **Latomon `--harmaa` poikkeaa tarkoituksella** muista Luinin sivuista (Latomon tekstistä suuri osa on pientä harmaata,
  joka näytti ruskealta ruskealla). luin.html, käyttöohje ja Latomon ohje pitävät omat arvonsa; älä yhtenäistä kysymättä.
- **"Vinoneliöestetiikkaa, ei palluraestetiikkaa."** Koverakylkiset salmiakit, antiikva (Literata, `luin/fontit/`, OFL),
  klassinen tyyli. Kirjasinvalinta poistettiin: groteski palaa vain, jos koko ohjelman ulkoasu sovitetaan siihen.
  Tarkoituksellinen poikkeus: sanaselityksen merkin (`IK_SANASTO`) linssi on pyöreä (käyttäjän syrjähyppy 5.11.2026).
  Ohjelman kuoressa ei ole kreikkaa (käyttäjän päätös 6.11.2026; marginaali on *mikro, meso, makro*). Kreikka on vain
  sisällöissä: erillinen osajoukko `literata-kreikka*.woff2`, koska päätiedostoissa ei ole kreikkaa.
- **Suljettu lukuympäristö ilman häiriötekijöitä**: verkkolinkit ovat oletuksena pois (`aset.verkkolinkit`), myös
  kirjallisuusluettelon DOI-linkit. Kuvat näkyvät linkkeinä, koska lukija ei hae mitään kolmannelta osapuolelta.
- **Sanat ovat käyttäjän**: *kirjaus* (alleviivaukseen liitetty muistiinpano; käyttöliittymässä aina tämä sana),
  *Sisälmys* (navin sisällysluettelo, ei *Sisällys*). Peruutusnappi on *älä!* (pienellä, huutomerkillä, kursiivi,
  `--harmaa`), ei *Ei*. Latomon tyhjennyksen vahvistus on *”Oletko aivan varma?” sanoi Lasse Lehtinen.*
- **iA Writer -pohjasta (`luin/ia-writer/`) luovuttiin**, koska se ei toiminut käyttäjän iA Writerissä: älä tarjoa
  sitä ratkaisuksi äläkä kehitä sitä. Tavoite on vain, että sama md näyttää iA Writerin oletusesikatselussa
  järkevältä. Latomon ohje ei mainosta iA Writeria eikä neuvo sen käyttöä; se mainitaan vain, kun se vastaa
  kysymykseen *miksi juuri näin*.
- Uusi oletus koskee vain ensikäyttöä. Tallennettuja asetuksia muutetaan vain kerran, `aset.av`-numeron avulla.

### Markdown-konventiot (opas 3)

- **Käyttäjän omat konventiot menevät yleisen Markdownin edelle**: otsikkolohko (`#`, kursiivi alaotsikko, tietorivit
  `<br>`:llä), `luku-2-1`-tunnisteet, numeroimaton `###` versaalikursiivina (`.caps`), alaviitteet sivuhuomioiksi,
  kirjallisuusluettelo `p.bib`:ksi. Lainausmerkkejä ei muuteta. Muuten noudatetaan iA Writerin protokollaa;
  Pandocin `^[…]` toimii yhä.
- Lähdeviittaus- ja lyhennelinkit (opas 3.4) syntyvät md.js:n omasta päättelystä (`viittaukset()`) **vain varmalla
  yhteydellä**. Ei BibTeX:ää, Pandocia tms. (käyttäjän vaatimus). Lyhenteille ei tehdä merkintöjä tiedostoon. Linkit
  ovat vain alaviitteissä, eivät leipätekstissä, eikä selitysosiosta linkitetä edelleen (minimalismi).
- Regexien `\b` ei toimi ä:n perässä; käytä `(?![\p{L}\p{N}])`.
- **`md.js?v=<SHA-1:n alku>`**: luin.html ja Latomo lataavat md.js:n versiotunnisteella, koska Pages antaa `max-age=600`
  ja käyttäjän selain piti vanhan version. Kun muutat md.js:ää, päivitä tunniste (`md-testi.js` huomauttaa unohduksesta):
  `V=$(sha1sum luin/md.js | cut -c1-8); sed -i -E "s/md\.js\?v=[0-9a-f]+/md.js?v=$V/" luin.html luin/latomo.html`

### Lukija (opas 4)

- **Mobiili = kosketusnäyttö** `(pointer: coarse)`; hiiri on työpöytä myös kapeassa ikkunassa (leveysehdolla palkit
  piiloutuivat työpöydällä). Aikajanan oletustason ehto `(max-width: 700px), (pointer: coarse)` on erillinen.
- **Tekstin napautus ei avaa palkkeja** (ne avautuivat vahingossa). Vain alakaistan tai alapalkin napautus avaa ja
  sulkee ne; vieritys ja sivunkääntö eivät vaikuta, eikä keskiklikkaus työpöydällä avaa ("hiirellä kauhea tapa").
  Alapalkissa ei ole natsaa eikä osion nimeä.
- Navinäkymän merkit ovat kahdessa linjassa musteesta mitattuina (`--v-laita` / `--o-laita`, opas 4.4). Laidat ovat
  kokonaislukuja, koska Chromium pyöristää SVG:n ja reunuksen paikan kokonaiseen CSS-pikseliin.
- **Verho** (`verhoAuki()`: navi, Asetukset tai navin laatikko auki): sen takana eivät toimi tekstin napautus,
  reunanapautus, pyyhkäisy, valinta eikä alleviivaus, eikä rulla käännä sivua. Toimivat: sivunkääntö näppäimillä sekä
  alapalkin kirjanmerkki- ja sivunapit (ahtaassa navinäkymässä ne ovat piilossa, ks. alla). Tekstialueen napautus sulkee Asetukset, Etsin ja Sisälmyksen tai navin;
  Merkinnät sulkeutuu vain napistaan tai raksistaan.
  Asetusten avaus sulkee navin.
- **Navin laatikot** (opas 4.7.2, `sijoitaLaatikot()`): Merkinnät, Sisälmys ja Etsi avautuvat nappiensa järjestyksessä
  vasemmalle, keskelle ja oikealle, koko korkeudelle palkkien väliin **ilman hajurakoa** (käyttäjän pyyntö 6.11.2026):
  rinnakkain ruudun kolmanneksina reunasta reunaan, muuten yksi kerrallaan koko leveydellä. Rinnakkain vain, jos kolme
  19rem:n saraketta rakoineen mahtuu laitojen väliin. Hyppy laatikosta ja navin sulku sulkevat kaikki kolme, paitsi
  että hakuosuma jättää rinnakkain Etsin auki, kun se on palstan vieressä eikä peitä osumaa (`suljeHypynTielta()`).
- **Ahdas navinäkymä** (käyttäjän pyyntö 6.11.2026, opas 4.7.2, `naviAlas()`): mobiilissa, kun laatikot eivät mahdu
  rinnakkain, kolme laatikkonappia siirtyvät alapalkkiin (`#ala-laatikot`), jos mahtuvat: ensin palkkinuolen kanssa,
  sitten ilman (Light Phone 360 px), muuten ne jäävät aikajanan alle. Silloin navissa ei ole kirjanmerkkiä eikä
  sivunappeja, auki olevan laatikon nappi himmenee, laatikon ollessa auki aikajanakerros on piilossa (`laatikko-auki`),
  ja paljaan alapalkin napautus vie suoraan lukunäkymään.
- `AudioVolumeDown`/`Up` kääntävät sivua siltä varalta, että selain välittää äänenvoimakkuusnäppäimet (Boox). Ei kuollutta koodia.
- **Aikajanan merkit nuottien tapaan**: suurempi aika-arvo ontompi (pääluku iso ontto salmiakki, alaluku pienempi
  täytetty, alaluvun alaluku lähes pistemäinen). Vain luettu osa on tekstin värinen; tulevat merkit ja kirjanmerkit
  ovat `--viiva`-harmaita, eivät pienempiä.
- **Peitto** (opas 4.4, `karsiPaallekkaiset()`): törmäys ei ole pelkkä lomittuminen, vaan kärjet menevät toistensa
  kehän sisäalaan. Merkin musteen pitää mahtua janalle, ja ensimmäisen näkyvän pääluvun vasemmalle puolelle mahtuu
  kuvitteellinen päälukumerkki (`testi.js` tarkistaa).
- **Veto**: vierityksessä ei ole magneettia (napautus ja veto vievät suhteelliseen kohtaan). Sivutettuna osoitin pysähtyy
  vain pysäkeille (`janaPysakit()`), jotka eivät riipu aikajanalle valituista merkeistä. Poikkeus kumpaankin (käyttäjän
  pyyntö 4.11.2026): osuma piirrettyyn kirjanmerkin nauhaan vie tasan kirjanmerkkiin (`janaNauhat`). Liikkeessä
  päivitetään vain transform, viivojen päät ja etappien `tuleva`-luokka, kerran ruudunpäivitystä kohden (e-ink).
- ***Palaa takaisin* -laatikko vain lähdeviittauksesta, haulla (toistaiseksi) ja aikajanalta ≥ 50 %** (käyttäjän
  päätökset 6.11.2026): Sisälmys, Merkinnät ja tuonnin kyltti jättävät vain kummitusmerkin. Älä laajenna kysymättä.
- **Siirtymien kumousta ei ole** (käyttäjän päätös 6.11.2026: ei tyydyttävää visuaalista ratkaisua; lukijaa auttavat
  majakka ja kirjanmerkit). Älä palauta sitä kysymättä.
- **Kokoruutu** (opas 4.9): **vain yläpalkin nappi, ei asetusta** (käyttäjän päätös 5.11.2026). Nappi muistaa valinnan
  (`aset.kokoruutu`); selain sallii kokoruudun vain eleestä, joten tekstin avauksen jälkeinen ensimmäinen napautus vie
  kokoruutuun (`krAvaus`). Takaisin-eleen tai alasvedon jälkeen Luin ei palaa ennen seuraavaa avausta. Asentoa ei lukita.
- Kirjanmerkki menee aina kappaleen alkuun (`o: 0`; säännöt opas 4.3).
- **Sivutettuna** pääluku alkaa aina uudelta sivulta (myös JS-varmistus `pakotettu`, koska käyttäjän työpöytäselain ei
  noudattanut CSS:ää). **Sisällysluetteloa ei pakoteta omalle sivulleen**; se kulkee otsikkolohkon perässä.
- Merkintöjen tuonti (opas 4.6): ei virallista tiedostomuodon tunnistetta; vientiä muutetaan vain sen verran kuin
  tuonti ehdottomasti vaatii.
- Valinnan valikon alleviivausikonin 3 px:n ruosteviiva on liioiteltu tarkoituksella.
- **Maalauskone** (pilotti 5.11.2026, opas 4.3): Luinin oma maalaus (`aset.maalaus`, oletus) ottaa selaimen valinnan
  pois tekstistä tarkoituksella (`html.oma-maalaus`, käyttäjä: "lukurauhan astia, ei joka paikan höylä"); kopiointi
  on valikon napissa. Älä palauta valintaa "korjauksena". Sanaraja on `sanassa()`, jota käyttävät myös
  `valintaPaloiksi()` ja viennin `esiintymat()`: pidä ne samana. Kahvat vain alleviivauksen tai luonnoksen
  napautuksesta, ei maalauksen päätteeksi. Yhden sanan valinta (tuplaklikkaus, pitkä painallus ilman vetoa) avaa
  vain sanaselityksen (*Sukkela sanaselitys*, `aset.sukSana`), myös kun valikon sanaselitys on päällä; kytkimet ovat
  toisistaan riippumattomat. **Kerran laajentunut veto ei palaa sanan valinnaksi** (käyttäjän pyyntö 6.11.2026): maalaus, joka palaa
  samaan sanaan, on maalaus (sukkelana alleviivaus, muuten valikko; `maal.laajeni`, hiiren tuplaklikkausveto `hiiriMaalasi`,
  selaimen tapa `tila.vedetty`), ja kahvasta muutettu luonnos avaa valikon myös yhteen sanaan supistuttuaan (`veto.muuttui`). Valinnan valikossa ei ole kirjanmerkkiä: kirjanmerkki vain alapalkin nauhasta. Käyttäjän
  päätökset 5.11.2026.
- **Suurennuslasi on hyllyllä** (`LUPA_KAYTOSSA = false`, käyttäjän päätös 5.11.2026; älä ota käyttöön kysymättä; jos lasi
  osoittautuu tarpeettomaksi, käyttäjä harkitsee sen poistoa). Pilotti 5.11.2026, opas 4.3: kahvan kosketusvedossa (ei hiirellä) vedettävän pään rivi näkyy
  1,25-kertaisena rivin yläpuolella. Klooni tarvitsee alkuperäisen lasketut tyylit (`lupaKlooni()`); `#lupa` pysyy
  `pointer-events: none` eikä saa `.luin-ui`-luokkaa. Kahvan kohta luetaan otealueen läpi (`#kahvat.lapi`).
- **Kaarikahva** (käyttäjän päätös 5.11.2026, opas 4.3): ote on rivin keskikorkeudella kuten maalauksessa, ei rivin alla.
  Kahvat pysyvät näkyvissä myös vedon aikana ja jälkeen; alleviivaus pysyy yhtenäisenä (ei katkoviivaa). Nuppi mahtuu
  sanaväliin (0,2 em); älä levennä sitä kysymättä.
  **Alleviivaus on maalattu taustana, ei `text-decorationilla`** (käyttäjän pyyntö 6.11.2026): natiivi alleviivaus pyöristyi
  rivi riviltä eri tavoin, joten kahvan sauma ei osunut viivaan millään kaavalla. Viiva on ankkuroitu merkin laatikon
  alareunaan, ja kahvan jatke ja varsi ovat saman merkin taustaa (`k-alku` / `k-loppu`, `kahvaPaat()`); vain nuppi on SVG.
  Viivan paksuus ja varren korkeus ovat kokonaisia laitepikseleitä, muuten varren pohja karkaa. Älä palauta
  `text-decorationia` äläkä siirrä varsia pseudo-elementteihin (laatikko pyöristyi 1 px eri tavoin). Testi mittaa sauman. Eleen jälkeinen haamuklikkaus nielaistaan (`tila.niele`).
- **Törmäys ja värit** (käyttäjän päätös 5.11.2026): uusi alleviivaus pysähtyy vanhan rajaan, ei lomitu eikä yhdisty.
  Vierekkäiset vuorottelevat ruostetta ja okraa (ketjun vanhin ruoste); muita värejä ei tarvita. Kahvat ovat aina
  samaa väriä kuin viiva (`.kahva.okra`, `kahvaVari()`; käyttäjän päätös 6.11.2026). Samoin okrat ovat kirjauksen kynä
  tekstissä (`.kirm.okra`), valikon poistoikonin viiva (`ikPoista()`) ja kirjausruudun kohdekatkelman viiva (`.ali-teksti.okra`).
- **Alleviivauksen loppumerkit** (käyttäjän säännöt 6.11.2026, opas 4.3): lopetusmerkki vain kokonaiseen virkkeeseen, pilkku/kaksoispiste/puolipiste ei koskaan, valintaan jääneen avaajan sulkeva vastine heti sanan perässä mukaan. Säännöt ovat `valintaPaloiksi()`:ssa eikä naapuri vaikuta niihin; älä siirrä niitä törmäyskoodiin.
- **Kirjauksen kynä** alleviivauksen alussa: napautus näyttää kirjauksen, toinen napautus muokkaa.
- **Sanaselitys ja käännös** ovat ainoat lukijan verkkohaut, vain napautuksesta (poikkeus suljetusta lukuympäristöstä,
  käyttäjän pyyntö 5.11.2026). DeepL-osoitteessa `/` on `\/`, ja lähdekieli on pakollinen (`auto` ei toimi). Käännös on
  oletuksena pois valikosta.
- **Sanaselitys** (käyttäjän linjaukset 5.11.2026, opas 4.3): käyttöliittymässä *sanaselitys*, ei *sanakirja* (avain
  `aset.sanakirja` säilyy). Ensin aina tasan tekstin muoto, vasta sen puuttuessa kielikohtainen ketju (`skKetju()`). Tasan samoista muodoista (virkkeen alun *As* ja *as*) määritelmä ennen pelkkää taivutusviittausta (*plural of A*; `skTasan()`), muuten tekstin muoto ensin.
  Taivutusarvaukset (loppunapsu) vain tekstin kielestä, paitsi kursiivissa ja lainauksessa. Wikisanakirjassa ei surffata
  takaisin päin (Luin ei ole selain), merkki ei ole linkki, ja ulos vievät linkit ovat korkean kynnyksen takana. REST-rajapinnan kieliavaimiin ei luoteta (`skNormita()`: Translingual on avaimen `en` alla, muinaiskreikka avaimen `other`); kieli luetaan osan nimestä. Tekstin kielestä löytyvään sanaan ei näytetä muiden kielten tietoja (käyttäjän linjaus 6.11.2026, ensin suomi, sitten kaikki kielet: *edes* ei tuo latinaa, *is* ei afrikaansia; `r`-lippu ketjussa). Kursiivissa tämä liudentuu: tekstin kieli ensin, muut jäävät mukaan; ei kuitenkaan tekstin kielen pikkusanalle (`KIELET`-lista, `y.pikkusana`: *as* ei tuo suomea kursiivissa eikä lainauksessa). Suomenkielinen lainaus on kuin leipäteksti; muissa kielissä vain oman kielensä erottava lainaus (`y.omaKieli`), lyhyt lainaus liudentuu. Englannin iso alkukirjain keskellä virkettä (*Dasein*) jättää muut kielet mukaan, ja kreikan kaksi kieltä näkyvät yhdessä. Lainauksen sisäinen kursiivi on kursiivi. Translingual (`mul`) noudattaa samaa: pois tekstin kielestä löytyvältä, paitsi symbolin näköiselle kirjoitusasulle (IV, CO2, pH); muuten tekstin kielen, ketjun kielten, englannin ja suomen jälkeen; ISO 639 -kielikoodit eivät näy koskaan (käyttäjän palaute 6.11.2026). Verkkovirhe pysäyttää ketjun. Enintään
  10 sanaa (`SK_SANAT`). Raksin ja merkin paikka on mitattu lisää-linkistä; asetuksissakin lambda on tekstin värinen (6.11.2026).
- **Kopion paikannin**: luvun numero, ei sivunumeroita, sanallinen otsikko vain pakosta (käyttäjän linjaus 5.11.2026).
- **Tavutuskiellot** (opas 5): otsikoissa, `.sub`:ssa, `.meta`:ssa, sisällysluettelossa, lihavoinneissa ym. (`OHITA`
  md.js:ssä) ei ole pehmeitä tavuviivoja, ellei sana ole palstaa leveämpi. Kirjallisuusluettelo (`p.bib`) ei tavuta
  lainkaan (Teologian tyyli, APA 7).
- `#teksti { overflow-wrap: break-word }` estää vaakavierityksen (Light Phone, pitkät osoitteet); `testi.js` tarkistaa.

Ratkaisut, jotka näyttävät oudoilta mutta ovat mitattuja:

- `kohdanLaatikko` ottaa merkin laatikoista **viimeisen**: tavutusrajan jälkeisen merkin ensimmäinen laatikko on
  Chromiumissa edellisen rivin tavuviiva.
- Vierityksen kohta on rivi, jonka **keskikohta** on `YLA`:ssa, ja `mene()` vierittää merkin keskikohdan samaan;
  yläreunalla kohta ajautui joka kokomuutoksella rivin ylöspäin.
- Sivutettuna kohdassa voi olla `ed`: sivu ilman tekstilohkoja (sisällysluettelo) ankkuroidaan seuraavan lohkon alkuun
  `ed` sivua ennen sitä.
- Sivutettuna `hr.ennen-lukua` (`---` juuri ennen `##`:tä) piilotetaan, koska viiva jäisi yksin omalle sivulleen.
- Vierityksessä pelkkä ikkunan korkeuden muutos ei asettele tekstiä uudelleen (mobiilin osoiterivi).
- `tavutaPitkat()` mittaa ensin kaikki ja kirjoittaa vasta lopuksi, ja `sovellaAsetukset()` asettelee vain
  `ASETTELU`-listan asetuksilla. Älä lomita kirjoituksia mittausten väliin: sivutettuna jokainen asetuksen napautus
  kesti pitkällä tekstillä sekunteja.

### Latomo (opas 7)

- **Etukenttään vain se, mikä poikkeaa tekstistä päätellystä**: kandidaatintutkielma läpäisee Latomon tavulleen samana.
- Kaikki on vapaaehtoista, otsikko riittää. *Tekstityyppi* on oletuksena *ei määritelty* (ei pakollista kategoriaa).
  Kaunokirjallisen tekstin `teos`-kenttä on *Kokoelma* (käyttäjän sateenvarjosana, ei *novellikokoelma*).
- Ehdotukset muuttavat tekstikenttää vain napista.
- MarkDownload-tila on **aina pois sivua avattaessa** (valintaa ei muisteta), ja sen rivi on piilossa, ellei
  etukentässä ole korvamerkkiä `leikattu:` tai tila ole päällä. Latomon ohjeen MarkDownload-osio antaa suosituksen,
  ei oletusarvoja (opas 7.4).
- **Postilaatikko** (opas 2.2): *Lähetä postilaatikkoon* tulostaa `wrangler@3.114.17`-komennon, ja Luin hakee tekstit
  workerin reitiltä `/api/luin`. Laatikon koodi on salasana: sitä ei kirjoiteta repoon. Reitti vaatii, että
  `tusinasaa-worker` on julkaistu tämän repon koodilla (`npx -y wrangler@3.114.17 deploy` repon juuressa).

### Testit (opas 8)

Aja repon juuressa:

- `node luin/kehitys/md-testi.js`: jäsennin ilman selainta (myös `md.js?v=`).
- `NODE_PATH=$(npm root -g) node luin/kehitys/latomo-testi.js [kuvakansio]`: Latomo selaimessa.
- `NODE_PATH=$(npm root -g) node luin/kehitys/testi.js teksti.md [kuvakansio]`: lukija selaimessa (esim. tutkielmalla
  ja oppaalla). Sivun testikoukku on `window.__luin`.
- `node docs/viitteet/vertaa-luin.js`: viitteen kokoaminen Teologian tyylin esimerkkejä vasten.
- `NODE_PATH=$(npm root -g) node luin/kehitys/sanaselitys-testi.js [kuvakansio] [--ei-taittoa]`: sanaselitys tekosanastolla.
  Wikisanakirja antaa pilvikontista 429:n (myös kohteliaalla User-Agentilla ja odottaen), joten oikeaa rajapintaa ei voi
  kokeilla sieltä.

### Väliaikaiset tekstit

Kandidaatintutkielma on **väliaikaisesti** repossa (käyttäjän lupa): `luin/tekstit/kant-ja-elainetiikka.md`, lukulistan
linkki *Kokeiluteksti: Kant ja eläinetiikka* ja `robots.txt`:n rivi `Disallow: /luin/tekstit/`. Samoin
`luin/tekstit/dialectic-of-enlightenment.md` (ilman linkkiä, `luin.html#u=luin/tekstit/dialectic-of-enlightenment.md`).
Kun käyttäjä sanoo kokeilun päättyneen, poista tiedostot, linkki ja robots.txt:n rivi. Muita käyttäjän tekstejä ei
viedä repoon ilman erillistä lupaa.

### Alatunnisteen ©-merkki

Yleissääntö on juuren CLAUDE.md:n osiossa *Alatunniste*. Luinin sivuilla (`luin.html`, Latomo, Latomon ohje,
käyttöohje) ©-merkki on SVG: suora salmiakki ja sen sisällä Literatan oman ©-merkin sisempi C sellaisenaan
(`aria-label="©"`). Muiden ohjelmien alatunnisteissa on tavallinen ©.
