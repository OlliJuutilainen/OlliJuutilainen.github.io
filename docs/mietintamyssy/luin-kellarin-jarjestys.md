# Kellarin veivihyllystön järjestys

*Luin: miten runsas kokoelma järjestyy lukijan omilla tavoilla. Kehitysvaihtoehtojen selvitys, hyllyyn 17.11.2026.
Ensimmäinen versio toteutettiin samana päivänä (luku 9); muu on ehdotusta.*

---

## 0. Tiivistelmä

Pino on ja pysyy tulojärjestyksessä. Järjestäminen tapahtuu kellarin veivihyllystössä, ja sitä varten tekstistä
tarvitaan vain kahdenlaista tietoa:

1. **Sitä, mikä on jo olemassa** ja syntyy ilman vaivaa: laji (tieteellinen, blogi, kaunokirjallinen), alkuperä
   (verkosta poimittu, itse ladottu, linkistä avattu), tekijä, julkaisuvuosi, merkintöjen määrä, edistyminen ja luettu-aika.
   Nämä riittävät jo seitsemään järjestykseen.
2. **Kahta asiaa, jotka vain lukija tietää**: *asiasanat* (filosofia, psykologia; yksi teksti monessa) ja *ajoitus*
   (tekstin paikka aikajanalla, jos se on muu kuin julkaisuvuosi: Hegel-tutkimus Hegelin vuosille, Septuaginta ennen
   Senecaa). Lisäksi lukutila *käsikirjasto* teksteille, joihin palataan aina.

Suositeltu ja toteutettu malli on **fasettikortisto**: monta riippumatonta järjestystä samoille korteille, ei yhtä
hierarkiaa. Automaattiset fasetit eivät maksa mitään. Käsin annettavat ovat aina vapaaehtoisia, ja niitä voi antaa
kolmessa paikassa: latomossa halutessa, pinossa kevyesti ja kellarissa monelle kerralla. Kaaosta ehkäisee yhteinen
sanasto, joka näkyy aina, kun sanaa kirjoitetaan. Jo syntynyttä kaaosta paimentaa monivalinta. Laskureita,
muistutuksia ja luokittelemattomien listaa ei ole, koska ne tekisivät järjestämisestä pelin.

---

## 1. Lähtötilanne (mitattu koodista 17.11.2026)

| Tieto | Missä | Syntyy |
|---|---|---|
| tulojärjestys | `luin-lista` (taulukon järjestys, uusi `unshift`) | aina |
| luettu-aika | `e.luettu` | *Luin.*-napista |
| edistyminen | `e.pct` | lukiessa |
| tekijä, vuosi, sivusto, alaotsikko | `e.author`, `e.year`, `e.sivusto`, `e.ala` | jäsennyksestä (`lisaaListaan`) |
| laji | etukentän `tyyppi:` | latomo (valinta), lisäosa (`blogi`) |
| alkuperäinen osoite, hakupäivä | etukentän `lähde:`, `haettu:` | lisäosa, latomo |
| lisäosan korvamerkki | etukentän `leikattu:` | lisäosa (latomo muuntaa sen `haettu`ksi) |
| tulotapa | `e.src` (`paikallinen`, `laatikko`, `osoite`) | tuonnista |
| merkinnät | `luin-merkit:<id>` (`al`, kirjaus `n`, `km`) | lukiessa |
| laitos | `e.laitos`, `e.alkup` | uusi laitos |

Kellarin veivihyllystö oli ennen tätä yksi luettelo luettu-ajan mukaan (uusin ensin). Pinon linjaus (15.11.2026) on
selvä: *ei kansioita, ryhmiä eikä erikoisvärejä*. Latomo säilyttää tuntemattomat etukentän avaimet, joten uusi avain
kulkee sen läpi muuttumattomana.

**Huomio**: latomo kirjoittaa korvamerkin `leikattu:` uudelleen avaimena `haettu:`, joten valmiista tekstistä ei näe
varmasti, tuliko se lisäosasta. *Poimittu verkosta* päätellään siksi alkuperäisestä osoitteesta (`lähde:`) tai
hakupäivästä. Itse ladottu teksti, jolle on käsin annettu lähdeosoite, lasketaan verkosta poimituksi. Se on
harkittu kompromissi: sekin on verkosta.

---

## 2. Ongelma ja reunaehdot

Käyttäjän sanoin järjestelmän pitää olla *tyydyttävä mutta ei pelillisen tyydyttävä*. Siitä seuraa kaksi
käyttötapaa, jotka molemmat on palveltava ja jotka vetävät eri suuntiin:

1. **Ennaltaehkäisy matalalla kynnyksellä**: kun teksti tulee, sen voi sijoittaa yhdellä napautuksella, jos haluaa.
   Ei pakkoa, ei lomaketta.
2. **Paimennus jälkikäteen**: kun kellarissa on jo 150 luokittelematonta tekstiä, harva valittu siirto (*nämä 12 ovat
   teologiaa*) tuo riittävän järjestyksen ilman kunnostusprojektia.

Muut reunaehdot, jotka rajaavat vaihtoehtoja:

- **Pino pysyy pinona** (käyttäjän linjaus 15.11.2026). Luokittelua saa muokata pinossa, mutta se ei näy eikä järjestä siellä.
- **E-ink**: ei vedä ja pudota -elettä pitkillä listoilla, ei animaatiota, ei läpikuultavuutta. Ruoste on napautettava.
- **Suljettu lukuympäristö**: ei verkkohakuja luokittelua varten (ei kirjastoluettelon rajapintaa, ei kielimallia).
- **localStorage noin 5 Mt** yhteisenä koko sivuston kanssa: luokittelu ei saa kopioida tekstejä.
- **Tiedosto on itsenäinen**: .md-tiedoston pitää kelvata iA Writeriin ja Zettel Notesiin; luokittelu saa näkyä
  etukentässä mutta ei leipätekstissä.
- **Sanasto**: käyttöliittymässä ei *hyllyä* (linjaus 12.11.2026). Kellarin veivihyllystö on aina kokonainen nimi.
- **Merkintäposti** kuljettaa vain merkintöjä. Laitteiden välinen yhtenäisyys on erillinen kysymys (luku 10).

---

## 3. Jäsentymisen akselit

Käyttäjän luettelo ja muutama lisä, kukin luokiteltuna sen mukaan, kuka tiedon tuottaa.

| Akseli | Esimerkki | Tuottaja | Tietomalli | Toteutettu |
|---|---|---|---|---|
| Laji | tieteellinen / blogi / kaunokirjallinen | latomo, lisäosa (automaattinen) | `tyyppi:` | ✓ järjestys *lajin mukaan* |
| Kauno vai asia | kaunokirjallinen / muu | sama kuin laji | `tyyppi:` | ✓ (lajin osana) |
| Alkuperä | poimittu verkosta / ladottu itse / linkistä | automaattinen | `lähde:`, `haettu:`, `e.src` | ✓ *alkuperän mukaan*, sivuston mukaan sisällä |
| Kirjoittaja | Hegel, Pinkard | automaattinen | `e.author` | ✓ *tekijän mukaan* (sukunimen kirjain) |
| Tiedeala, aihe | filosofia, psykologia (monta) | lukija; ehdotus sivustosta | `asiasanat:` | ✓ *asiasanojen mukaan* |
| Kronologia | Septuaginta → Seneca → Hegel → ev.-lut. Raamattu | lukija; oletus julkaisuvuodesta | `ajoitus:` | ✓ *ajoituksen mukaan* (vuosisadoittain) |
| Merkintämäärä | eniten merkityt | automaattinen | `luin-merkit` | ✓ *merkintöjen määrän mukaan* |
| Lukutila | luettu / lukematon / käsikirja | lukija | `e.luettu`, `e.kasikirja` | ✓ käsikirjasto ylimpänä, pino mukaan valinnalla |
| Edistyminen | 0 %, alle puolet, loppuun | automaattinen | `e.pct` | ✓ *edistymisen mukaan* |
| Luettu-aika | viimeksi luetut | automaattinen | `e.luettu` | ✓ oletus |
| Kieli | suomi, saksa, kreikka | automaattinen (md.js tunnistaa kappaleiden kielen) | ei tallennettu | – ehdotus |
| Pituus | essee / kirja | automaattinen (sanamäärä) | ei tallennettu | – ehdotus |
| Oma paikka | *tämä tähän väliin* | lukija | `signum:` | – ehdotus (luku 4.10) |
| Suhteet | jatkoa tälle, vastine tuolle | lukija | linkit | – ehdotus (luku 4.5) |

Käyttäjän Raamattu-esimerkki on erityisen opettavainen: se ei ole kronologia julkaisun vaan *aiheen* aikana, ja
siinä on yksi tarkoituksellinen poikkeus (suomalainen ev.-lut. Raamattu oikeassa reunassa, siis 1992). Yksi
vapaaehtoinen numero, ajoitus, tuottaa juuri tämän hyllyn: rautakauden Levantti −1000, Septuaginta −250, Seneca 65,
Hegel-tutkimus 1807, Raamattu 1992. Toteutuksen testi (`luokittelu-testi.js`) on rakennettu tämän esimerkin varaan.

---

## 4. Lähestymistavat

Kymmenen tapaa, kukin arvioituna käyttäjän kahdella käyttötavalla (ennaltaehkäisy E, paimennus P) ja jäykkyydellä.
Mittarina on lisäksi Ranganathanin viisi kirjastotieteen lakia (1931), jotka sopivat yllättävän hyvin myös
henkilökohtaiseen lukimeen:

1. *Kirjat ovat käyttöä varten.* Järjestys palvelee lukemista eikä esittelyä.
2. *Jokaiselle lukijalle kirjansa.* Järjestyksiä on monta, koska lukija etsii eri tavoin eri päivinä.
3. *Jokaiselle kirjalle lukijansa.* Unohtunut teksti löytyy jonkin akselin kautta.
4. *Säästä lukijan aikaa.* Tämä on pelillisyyden vastalääke: jokainen järjestämiseen kulunut minuutti on pois lukemisesta.
5. *Kirjasto on kasvava organismi.* Järjestys ei saa vaatia uudelleenjärjestelyä, kun kokoelma kasvaa.

### 4.1 Kirjastoluokitus (YKL, UDK, Dewey)

Jokaisella tekstillä on yksi luokkanumero hierarkiasta (17.1 filosofian historia, 1 filosofia, 2 uskonto …).

- \+ Valmis, harkittu, kansainvälinen. Kirjastonhoitajan sydäntä lämmittävä.
- \+ Numero järjestää itsestään: 1 < 17 < 17.1 < 2.
- − Jäykkä ja määräävä, juuri mitä käyttäjä ei halua. Teksti on yhdessä paikassa, vaikka se on filosofiaa ja psykologiaa.
- − Luokan valinta vaatii luokitusjärjestelmän tuntemista: korkea kynnys (E heikko).
- − Paimennus vaatii jokaiselle tekstille päätöksen (P heikko).

**Arvio**: ei pohjaksi. Vapaa *signum* (4.10) antaa saman hyödyn niille, jotka haluavat sen.

### 4.2 Vapaa asiasanoitus (tagit, folksonomia)

Litteä joukko sanoja; tekstillä voi olla monta.

- \+ Matalin kynnys: yksi sana, ei hierarkiaa. Monijäsenyys (filo ja psyko) on luonteva.
- \+ Paimennus helppo: anna sama sana monelle kerralla.
- − Rinnakkaismuodot (*filo*, *filosofia*, *Filosofia*, *phil*) syntyvät, jos sanastoa ei näe kirjoittaessa.
- − Litteys: 80 asiasanaa on oma kaaoksensa.

Lievennykset (toteutettu): sanasto näkyy aina kirjoittaessa (latomon kentän alla ja ponnahduksessa), kirjoitus
suodattaa sanastoa, kirjainkoko ei erota sanoja ja uusi sana saa sanaston kirjoitusasun (*hegel* → *Hegel*).
Lievennykset (ehdotus): asiasanan uudelleennimeäminen ja yhdistäminen koko kokoelmassa (luku 10, ykkönen).

**Arvio**: pohjaksi tiedealalle ja aiheille. Nimeksi kirjastonhoitajan oma sana *asiasana* eikä *tagi*.

### 4.3 Fasettiluokitus (Ranganathan, PMEST)

Ranganathanin kaksoispisteluokitus jakoi aiheen viiteen riippumattomaan fasettiin: persoona (mikä), aines (mistä),
toiminta (mitä tehdään), paikka ja aika. Kirja ei ole yhdessä hierarkian kohdassa vaan monen akselin leikkauksessa.

- \+ Vastaa suoraan käyttäjän pyyntöä *erilaisista mahdollisista jäsentymisen tavoista*.
- \+ Useimmat fasetit (laji, alkuperä, tekijä, aika, merkinnät, edistyminen) ovat jo tiedossa: E ja P ilmaisia.
- \+ Kasvaa ilman uudelleenjärjestelyä (laki 5).
- − Näkymiä on monta, ja niiden välillä pitää voida vaihtaa kevyesti.

**Arvio**: valittu kokonaisrakenne. Kellarin veivihyllystö on fasettikortisto: sama korttipakka, monta järjestystä,
ja välikortit sen mukaan. Asiasanat ja ajoitus ovat kaksi lukijan omaa fasettia automaattisten rinnalla.

### 4.4 Kronologinen hylly ja ajoitus

Tekstillä on paikka aikajanalla. Vaihtoehdot tietomalliksi:

| Malli | Esimerkki | + | − |
|---|---|---|---|
| A. Julkaisuvuosi | 1994 (Pinkard) | ilmainen | Hegel-tutkimus hajoaa 1900–2020:lle |
| B. Yksi vuosi | `ajoitus: 1807` | yksinkertainen, järjestyy | välin tieto katoaa |
| C. Väli | `ajoitus: 1770–1831` | elinvuodet, kaudet | järjestetään alun mukaan |
| D. Aikakausi sanana | `rautakausi` | luonteva | ei järjestyksiä ilman taulukkoa |
| E. Aihehenkilö | `aikalainen: Hegel` | kaikki Hegel-tutkimus kerralla | vaatii henkilöiden vuositaulukon |

**Toteutettu**: B, C ja vuosisata (`1800-luku`), eaa./eKr./BC tai miinusmerkki, oletuksena julkaisuvuosi (A).
Ryhmät ovat vuosisatoja suomalaiseen tapaan (*200-luku eaa.* = 299–200 eaa.; ensimmäinen vuosisata on *1–99 jaa.*
eikä *0-luku*). D ja E jäävät: E on houkutteleva (*Hegelin aikalaiset*), mutta sama tulos syntyy, kun antaa monelle
tekstille kerralla ajoituksen 1807 (monivalinta).

Ehdotus myöhemmäksi: **aikajananäkymä**. Lukijan aikajanan tapaan vaakajana, jolla tekstit ovat salmiakkeina
ajoituksensa kohdalla, ja napautus avaa vuosisadan välikortin. Kaunis mutta ei välttämätön; kortisto riittää.

### 4.5 Zettelkasten (Luhmann)

Luhmannin kortisto ei luokitellut vaan *linkitti*: jokainen kortti sai paikkansa jonkin toisen jatkona (21/3a1), ja
rakennekortit (*Strukturzettel*) kokosivat aiheen sisällysluetteloksi.

- \+ Joustavin: järjestys syntyy ajattelusta eikä luokista.
- \+ Rakennekortti on kuratoitu, järjestetty lista, eli kirjastohierarkian ja zettelkastenin sekoitus, jota käyttäjä kuvasi.
- − Tekstit eivät ole lukijan omia muistiinpanoja: lukimen kortti on vieras teksti, ja linkki kahden vieraan tekstin
  välillä on harvinainen tarve.
- − Linkitys on hidasta ja helposti pelillistä (*verkko kasvaa!*).

**Arvio**: ei nyt. Myöhemmin mahdollinen kevyt muoto on **kokoelma** eli rakennekortti: nimetty, käsin järjestetty
lista tekstejä (*Hegel-seminaari kevät 2027*). Se on asiasanan sisarus, jolla on järjestys. Zettel Notesin
puolella lukijan omat muistiinpanot voivat linkittää luin-linkkeihin jo nyt.

### 4.6 Kansiot ja hierarkkiset kokoelmat

- \+ Tuttu.
- − Yksi paikka tekstiä kohden (filo *tai* psyko). Ylläpito kasvaa kokoelman mukana. Pinossa kielletty (linjaus 15.11.2026).

**Arvio**: ei. Asiasana tekee saman ilman yksipaikkaisuutta. Jos hierarkiaa kaivataan, sen voi kirjoittaa sanaan
(*filosofia/fenomenologia*) ja järjestää myöhemmin sisennettynä (ehdotus, ei toteutettu).

### 4.7 Tallennetut haut ja älykkäät kokoelmat

*Filosofia ja luettu ja merkintöjä yli kymmenen*: kysely, joka pitää itsensä ajan tasalla.

- \+ Nolla ylläpitoa määrittelyn jälkeen (laki 4).
- − Kyselyn rakentaminen e-ink-kosketusnäytöllä on raskasta. Harvoin tarvittu.

**Arvio**: ei vielä. Lähin kevyt muoto on suodatus: välikortin napautus näyttää vain sen ryhmän (luku 10).

### 4.8 Automaattinen luokitus

Vaihtoehdot karkeasta hienoon:

1. **Sovitesivuston ala** (SEP → filosofia, OECS → kognitiotiede, New Advent → teologia). Varma, ilmainen. *Toteutettu
   ehdotuksena.*
2. **Lukijan oma historia**: saman tekijän tai sivuston muiden tekstien asiasanat. Oppii lukijan sanaston. *Toteutettu ehdotuksena.*
3. **Lähteen omat avainsanat** (OJS:n `citation_keywords`, Wikipedian luokat, blogien tunnisteet). Runsaita ja
   kirjavia: jos ne kirjoitettaisiin suoraan, sanasto täyttyisi vieraista sanoista heti. Vain ehdotuksina ja vasta
   lisäosan seuraavassa versiossa.
4. **Tekstin sisällöstä** (sanojen yleisyys, kirjaston asiasanasto YSO paikallisena tiedostona). Mahdollinen ilman
   verkkoa, mutta epävarma ja raskas.
5. **Kielimalli**. Rikkoo suljetun lukuympäristön; ei.

Käyttäjän sana oli *EHKÄ jossain määrin automaattisesti*. Rajaksi valittiin: **automaatti ehdottaa, lukija päättää**.
Ehdotus on kursiivi ja ensimmäisenä; mitään ei lisätä ilman napautusta. Automaattiset fasetit (laji, alkuperä, tekijä)
ovat eri asia: ne eivät ole lukijan päätöksiä vaan tekstin ominaisuuksia, joten ne järjestävät suoraan.

### 4.9 Käsin järjestetty hyllypaikka

Lukija vetää tekstin haluamaansa kohtaan, kuten paperihyllyssä.

- \+ Täysi vapaus. Raamattu juuri sinne, minne haluaa.
- − Vedä ja pudota pitkässä listassa e-inkillä on tuskaa. Jokainen uusi teksti vaatii paikan (laki 5).

**Arvio**: ei. Ajoitus tuottaa käyttäjän esimerkkihyllyn ilman vetoa, ja signum (alla) kattaa loput.

### 4.10 Signum (selkämerkki)

Kirjaston selkämerkki on luokka ja pääsanan kolme kirjainta: `17.1 HEG`. Henkilökohtaisena versiona **vapaa
järjestysavain**: etukentän `signum:` mikä tahansa merkkijono, ja järjestys *signumin mukaan* järjestää aakkosittain,
numerot luonnollisesti (`2` ennen `10`). Ilman signumia teksti on lopussa.

- \+ Kirjastohierarkia niille, jotka haluavat, kenellekään pakottamatta.
- \+ Yhdellä kentällä mikä tahansa oma järjestys: `RAA 1 Septuaginta`, `RAA 9 KR92`.
- − Vaatii lukijalta oman järjestelmän. Harvojen tarve.

**Arvio**: hyvä seuraava askel, jos ajoitus ja asiasanat osoittautuvat riittämättömiksi. Ei toteutettu.

### 4.11 Lukutilat

| Tila | Merkitys | Missä |
|---|---|---|
| lukematon | ei avattu | pino (`pct` puuttuu tai 0) |
| kesken | avattu | pino (`pct` > 0) |
| luettu | *Luin.* | kellarin veivihyllystö |
| **käsikirja** | luetaan aina uudelleen; lukeminen ei muuta tilaa | merkintä tekstissä, kellarissa ylimpänä |

Kirjastossa *käsikirjasto* on kokoelma, jota ei lainata: hakuteokset, joihin palataan. Se kuvaa käyttäjän kolmatta
tilaa tarkasti. Vaihtoehtoisia nimiä käyttäjän päätettäväksi: *ikuiset*, *vakiolukemisto*, *breviaari* (rukouskirja,
joka luetaan päivittäin), *veivattavat* (kellarin veivihyllystön hengessä: teksti, jota veivataan yhä uudelleen).

Toteutus: käsikirja on lukijan oma lippu (`e.kasikirja`), riippumaton luettu-tilasta. Pinossa se ei näy. Kellarissa
oletusjärjestys nostaa käsikirjaston omaksi ryhmäkseen ylimmäksi, ja tietorivillä lukee *käsikirja*. Valinta
*mukana myös pinon tekstit* tuo kellariin pinon ryhmät *Kesken pinossa* ja *Lukematta pinossa*, jolloin kellari on
koko kokoelman kortisto.

---

## 5. Missä luokittelu syntyy

### 5.1 Latomo: halutessa

Vaihtoehdot: (a) pakollinen kenttä, (b) valinnainen kenttä *+ Lisää tieto* -napin takana, (c) ei mitään.
**Toteutettu (b)** kuten tekijänoikeudet: *Asiasanat* ja *Ajoitus*. Asiasanakentän alla ovat lukimessa jo käytetyt
sanat ruosteena: napautus lisää. Ajoituskenttä tulkitsee (`-250` → *250 eaa.*) tai kertoo, ettei tunnista.
Etukentän `tags` ja `keywords` (Obsidian, iA Writer, MarkDownload) luetaan asiasanoiksi ja kirjoitetaan latomossa
avaimella `asiasanat`.

### 5.2 Lisäosa ja sovitteet: ehkä automaattisesti

Vaihtoehdot: (a) sovite kirjoittaa `asiasanat:` suoraan, (b) sovite kirjoittaa ehdotuksen omaan avaimeensa,
(c) lukin päättelee ehdotuksen osoitteesta. **Toteutettu (c)**: lisäosaa ei tarvinnut muuttaa (versiota ei nosteta
pyytämättä), ja ehdotus päivittyy kaikille vanhoillekin teksteille. (b) on luonteva lisäosan seuraavaan versioon
lähteiden omille avainsanoille (4.8, kohta 3).

### 5.3 Pino: kevyesti

Käyttäjän kaksi vaihtoehtoa toteutuivat kumpikin:

- **Metatietojen avaaminen**: *muuta metatietoja* vie latomoon, jossa asiasanat ja ajoitus ovat kenttinä.
- **Kevyt tapa**: nimikkeen valikon *luokittele* avaa ponnahduksen: ehdotukset, sanasto napautettavina, kenttä uudelle
  sanalle, ajoitus ja käsikirjasto. Napautus tallentaa heti. Kolme napautusta: ⋮, *luokittele*, sana.

Hylätyt pinon vaihtoehdot: pyyhkäisy nimikkeeseen (vaarallinen e-inkillä, jossa pyyhkäisy on vieritystä), asiasanojen
rivi nimikkeen alla (rikkoisi pinon linjauksen), pitkä painallus (ei löydettävissä).

### 5.4 Kellarin veivihyllystö: aktualisoituu

Tässä luokittelu on näkyvää ja hyödyllistä:

- Otsikon alla rivi *järjestys:* ja ruosteinen nimi, joka avaa valikon: kahdeksan järjestystä ja valinta *mukana myös
  pinon tekstit*. Valinta muistetaan.
- Välikortit (versaali, harva, harmaa, ryhmän koko oikealla) kuten kortiston laatikon jakajat.
- Tietorivillä järjestyksen mukainen lisätieto (*ajoitus 250 eaa.*, *21 alleviivausta, 2 kirjausta*) ja aina
  asiasanat ja *käsikirja*.
- Monivalinta: valittujen valikon *Luokittele.* antaa sanan, ajoituksen tai käsikirjaston kaikille. Osalla oleva sana
  on puolitäytetty salmiakki, ja napautus antaa sen kaikille.

---

## 6. Kaaoksen ehkäisy ja paimennus

### 6.1 Periaatteet

1. **Ei mittaria, ei muistutusta.** Ei *37 luokittelematonta*, ei edistymispalkkia, ei merkkiä luokittelemattoman
   nimikkeen vieressä. Ryhmä *Ilman asiasanaa* näkyy vain, kun lukija itse valitsee asiasanajärjestyksen.
2. **Automaattinen ensin.** Seitsemän järjestystä kahdeksasta toimii ilman ainuttakaan lukijan päätöstä.
3. **Sanasto näkyy aina, kun kirjoitetaan.** Rinnakkaismuodot syntyvät, kun sanastoa ei näe.
4. **Monta kerralla.** Paimennus on yksi päätös monelle tekstille, ei monta päätöstä.
5. **Tiedosto on totuuden peili.** Luokittelu kulkee .md-tiedoston mukana, joten se ei jää lukimen vangiksi.

### 6.2 Napautusten hinta (mitattu toteutuksesta)

| Tehtävä | Napautukset |
|---|---|
| Yksi asiasana yhdelle tekstille pinossa tai kellarissa | 3 (⋮, *luokittele*, sana) |
| Uusi asiasana | 2 + kirjoitus + Enter |
| Sama asiasana 12 tekstille | 12 valintaa + 4 (⋮, *Luokittele.*, sana, *Valmis.*) tai *valitse kaikki* |
| Ajoitus 6 Hegel-tekstille | 6 + 3 + kirjoitus |
| Järjestyksen vaihto | 2 |
| Latomossa asiasana sanastosta | 1 (kenttä on auki, kun tekstillä on asiasanoja; muuten + *Lisää tieto* ensin) |

### 6.3 Paimennuksen työkalut myöhemmin

Tärkeysjärjestyksessä:

1. **Sanaston huolto**: asiasanan nimeäminen uudelleen ja kahden yhdistäminen koko kokoelmassa (*filo* → *filosofia*).
   Yksi siirto korjaa vuoden huolimattomuuden. Paras paimennuksen työkalu; ei vielä toteutettu.
2. **Suodatus**: välikortin napautus näyttää vain sen ryhmän, jolloin *Ilman asiasanaa* -ryhmän voi käydä läpi
   valitsemalla kaikki ja antamalla sanan.
3. **Ehdotus monivalinnalle**: jo toteutettu yhdelle ja monelle (ehdotukset lasketaan valituista).

---

## 7. Estetiikka ja vähän huumoria

Kirjastonhoitajan ja arkistonhoitajan päiväunista otettiin vain se, mikä palvelee:

- **Välikortti**: kortiston laatikon jakaja. Versaali ja harvennus kuten pinon otsikko, ei viivaa eikä salmiakkia.
  Kortin oikeassa reunassa ryhmän koko kuin laatikon etiketin luku.
- **Asiasana**: kirjastonhoitajan oma sana (YSO:n asiasanat), ei *tagi*. Pienellä kirjoitettuna kuten kirjastossa.
- **Ajoitus**: arkeologin sana. *Tekstejä rautakauden Levantista* saa ajoituksen *1000–586 eaa.*, ja vuosisatojen
  välikortit ovat suomalaiset (*200-luku eaa.*).
- **Käsikirjasto**: lainaamaton kokoelma, joka on aina käsillä.
- **Tekijätön teos nimen mukaan**: luettelointisäännön mukaan anonyymi teos järjestetään nimensä mukaan. Raamattu on R:n kohdalla.
- **Kellarin veivihyllystö** pysyy kokonaisena nimenä. Selvityksessä se on lyhennetty kellariksi vain siksi, että tämä on
  kehittäjän teksti.

Hylätyt päiväunet, koska ne olisivat pelillisiä tai itsetarkoituksellisia: inventaariopäivä (*kokoelmasi on 87 %
luetteloitu!*), mikrofilmitila, vanhentuneiden kirjojen poistoleima, lainauskortti, jonka päivämääräleimat
kertyvät, ja *pölyindeksi*. Viimeinen oli hauska: tekstin pölykerros kasvaa avaamattomuuden mukaan. Se olisi kuitenkin
juuri sitä mittaria, jota käyttäjä ei halua. Se jää tähän muistiin.

---

## 8. Tekniset valinnat

**Totuus nimikkeessä, peili etukentässä.** Vaihtoehdot olivat (a) etukenttä ainoana totuutena, (b) nimike ainoana,
(c) nimike totuutena ja etukenttä peilinä. (a) häviäisi, kun sama teksti tulee uudelleen avaimettomana (Postihuilu,
latomon *Avaa lukimessa*): merkinnät säilyvät uudessa versiossa, joten luokittelunkin pitää säilyä. (b) jäisi lukimen
vangiksi. **Valittu (c)**: tuleva teksti asettaa asiasanat ja ajoituksen vain, jos sen etukentässä ne ovat.
Poikkeus on *muuta metatietoja* ja korvaava laitos: niissä etukenttä kirjoitetaan ennen latomoon siirtoa, joten
latomosta puuttuva avain tarkoittaa poistoa.

**Avaimet.** `asiasanat` ja `ajoitus` eivät ole viitteen tietoja (`LuinMD.KENTAT`), joten ne eivät muuta lähdeviitettä.
md.js yhtenäistää `tags`, `tag`, `keywords`, `avainsanat`, `tunnisteet` ja `asiasana` avaimeksi `asiasanat`.
Lisäosan leikkeet eivät kirjoita yhtäkään näistä (tarkistettu: OJS:n avainsanat menevät leipätekstiin), joten
olemassa olevat leikkeet eivät saa vieraita asiasanoja.

**Vanhat nimikkeet** täydennetään etukentästä kerran (`lkTaydenna()`, versio `lk`). Mitattu: 200 noin 100 kt:n tekstiä
JSON-jäsennyksineen ja etukenttineen 20 ms (Node). Etukenttä luetaan vain tekstin alusta (20 000 merkkiä), koska se on
enintään 80 riviä.

**Tila**: asiasanat ovat kahdesti (nimike ja etukenttä), mutta ne ovat muutama sana tekstiä kohden. Merkitsevää ei ole.

**Android-sovellus** lataa luin.html:n verkosta, joten luokittelu tulee sinne ilman uutta versiota.

---

## 9. Toteutettu ensimmäinen versio (17.11.2026)

- md.js: `LuinMD.asiasanat()`, `LuinMD.ajoitus()` ja avainten yhtenäistys.
- luin.html: `luokittele()` (nimikkeen valikko ja valittujen valikko), kellarin järjestykset `jarjesta()` ja välikortit,
  `lkMdsta()`, `lkKirjoita()`, `asetaAvain()`, ehdotukset `LK_EHDOTUS` ja `lkEhdotukset()`, asetukset `kellariJarj` ja
  `kellariPino`.
- Latomo: kentät *Asiasanat* (sanasto alla) ja *Ajoitus* (tulkinta), valinnaisina.
- Käyttöohje, latomon ohje ja kehittäjän opas (luku 2.5).
- Testi `luin/kehitys/luokittelu-testi.js` (35 tarkistusta, käyttäjän Raamattu-hylly mukana). `linkki-testi.js`:n
  valikkojärjestys päivitetty. Ennallaan: md-, latomo-, laitos-, ulkoklikkaus-, silta-, postihuilu-, palaute- ja
  lisäosatestit, `vertaa-luin.js` (13 samaa, 5 eroa ennen ja jälkeen) ja SEP-pesukone (rikki 0, väärä kohde 0).
  Lukijan `testi.js` antaa samat 8 vikaa ennen ja jälkeen muutoksen, joten ne eivät johdu tästä.
- 360 px:n ruudulla ei vaakavieritystä; ponnahdukset mahtuvat ruutuun.

---

## 10. Avoimet kysymykset ja seuraavat askeleet

Käyttäjän päätettäviä nimiä: *asiasana* (vai *aihe*, *tunniste*), *ajoitus* (vai *aikapaikka*), *käsikirjasto* (vai
*ikuiset*, *breviaari*, *veivattavat*), *luokittele* (vai *luetteloi*), *järjestys* (vai *kortisto*).

Ehdotetut seuraavat askeleet tärkeysjärjestyksessä:

1. **Sanaston huolto**: nimeä uudelleen ja yhdistä asiasanoja koko kokoelmassa (6.3).
2. **Suodatus**: välikortin napautus näyttää vain sen ryhmän; toinen napautus palauttaa kaikki.
3. **Laitteiden välinen luokittelu**: merkintäposti (`posti.js`) kuljettamaan asiasanat, ajoituksen ja käsikirjaston.
   Nyt toisella laitteella tehty luokittelu siirtyy vain, kun teksti lähetetään uudelleen etukenttineen.
4. **Signum** (4.10) ja järjestys sen mukaan.
5. **Järjestyksen suunta** (vanhin ensin ja uusin ensin), jos tarve ilmenee.
6. **Kieli** ja **pituus** fasetteina (automaattisia, ilmaisia).
7. **Lähteen avainsanat ehdotuksiksi** lisäosan seuraavassa versiossa (OJS, Wikipedian luokat, blogit).
8. **Kokoelmat** eli rakennekortit (4.5) ja **aikajananäkymä** (4.4), jos kortisto ei riitä.
