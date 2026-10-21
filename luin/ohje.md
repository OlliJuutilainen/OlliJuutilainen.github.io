---
viite: Tusinasoft (2026). *Luin: kehittäjän opas*. Luonnos 20.10.2026.
---

# LUIN – KEHITTÄJÄN OPAS

*Lukulista, lukulaite ja Latomo*

Ensimmäinen kokeiluversio, lokakuu 2026.
Tusinasoft

## 1. Mikä Luin on

Luin on selaimessa toimiva lukulaite Markdown-teksteille. Se on tehty ensisijaisesti omien tekstien jakamiseen: kirjoittaja latoo tekstin Latomossa, ja lukija lukee sen Luinissa puhelimella, e-ink-laitteella tai tietokoneella. Kaikki tapahtuu lukijan selaimessa. Palvelinta ei ole, eikä mitään lähetetä minnekään.^[Ainoa verkkopyyntö on #u=-linkin tekstin haku. Sekin on tavallinen tiedostohaku, joka ei lähetä lukijasta mitään.]

Tämä opas on kirjoitettu kehittäjälle, joka tutustuu koodiin. Se on samalla Luinin toinen kokeiluteksti: siinä on lukuja, alalukuja ja alaviitteitä, joten aikajanaa, sisällysluetteloa ja sivuhuomioita voi kokeilla tälläkin.

### 1.1 Kokeilu kandidaatintutkielmalla

1. Avaa `luin/latomo.html`.
2. Valitse tai pudota tutkielman `.md`-tiedosto tekstikenttään. Latomo näyttää rakenteen ja huomautukset.
3. Korjaa lähdeviite tarvittaessa ja paina **Avaa Luinissa**.

Teksti tallentuu tämän selaimen lukulistaan. Toisella laitteella sama tehdään uudelleen kyseisen laitteen selaimessa, esimerkiksi Note Air3:lla Dropsyncin kansiosta valittuna.

Tutkielma on väliaikaisesti myös verkossa (`luin/tekstit/kant-ja-elainetiikka.md`), ja lukulistan linkki *Kokeilu: Kant ja eläinetiikka* avaa sen millä tahansa laitteella (`luin.html#u=luin/tekstit/kant-ja-elainetiikka.md`). Hakukoneita pyydetään ohittamaan kansio (`robots.txt`). Kun kokeilu on ohi, kansio ja linkki poistetaan; repon historiaan tiedosto jää.^[Julkisen repon historiasta tiedoston saa pois vain historiaa uudelleenkirjoittamalla (esimerkiksi `git filter-repo`) ja pakotetulla pushilla.]

### 1.2 Mitä tässä versiossa ei ole

- Kaveriversiota (oma Cloudflare-tili tms.) ei ole, eikä sitä mainosteta.
- Käyttöönottoa ei tarvita. Tekstien säilytys verkossa (KV, repo, Dropbox) on luvun 9 kysymys.
- Sanakirjaa pitkälle painallukselle ei ole. Vaihtoehdot ovat luvussa 9.

## 2. Tiedostot ja tietovirta

### 2.1 Tiedostot

- `luin.html` – lukulista ja lukija samalla sivulla. Juuressa, koska ohjelman nimi on luin.html.
- `luin/md.js` – Markdown-jäsennin ja suomen tavutus. Yhteinen lukijalle ja Latomolle.
- `luin/latomo.html` – generaattori: tarkistaa tekstin, lisää etukentän ja siirtää tekstin Luiniin tai antaa sen ladattavaksi.
- `luin/fontit/` – Literata (OFL), kevennetty: paino 380–700 ja optinen koko 10–36. Noin 83 kt leikkausta kohti.
- `luin/kehitys/logo.js` – logon generaattori. `node luin/kehitys/logo.js` tulostaa SVG:n, joka on kopioitu luin.html:ään ja Latomoon.
- `luin/ohje.md` – tämä opas.

### 2.2 Reitit

Luin lukee kaiken osoitteen #-osasta, joten mitään ei lähde palvelimelle:

- `luin.html` tai `luin.html#` – lukulista.
- `luin.html#id=<tunnus>` – lukulistan teksti tältä laitteelta.
- `luin.html#u=<osoite>` – teksti verkosta. Teksti lisätään lukulistaan, ja jos haku epäonnistuu, käytetään edellistä tallennettua versiota. Suhteellinen osoite toimii: `luin.html#u=luin/ohje.md` avaa tämän oppaan.
- `luin.html#tuo` – Latomon siirto. Latomo kirjoittaa tekstin avaimeen `luin-tuonti`, ja Luin lukee ja poistaa sen.

Dropbox-jakolinkki muutetaan muotoon `dl.dropboxusercontent.com`, jotta sen voi hakea selaimesta.^[Testaamatta oikealla Dropbox-linkillä. Google Driven linkit eivät toimi suoraan, koska Drive ei salli selaimen hakua toiselta sivustolta (sama syy kuin KEICK•WALKin Drive-reitissä).]

### 2.3 Tallennus

Kaikki on selaimen localStoragessa, joka on yhteinen muiden ollijuutilainen.github.io-sivujen kanssa (noin 5 Mt):

- `luin-asetukset` – asetukset (luku 4.5).
- `luin-lista` – lukulista: tunnus, nimi, alaotsikko, tekijä, vuosi, viite, osoite, lukukohta, prosentti, lisätty ja avattu.
- `luin-teksti:<tunnus>` – tekstin Markdown sellaisenaan.
- `luin-merkit:<tunnus>` – kirjanmerkit (`km`) ja alleviivaukset (`al`).

Paikallisen tekstin tunnus on `p-` + otsikosta tehty lyhenne, verkkotekstin `u-` + osoitteen tiiviste. Saman otsikon uusi versio Latomosta korvaa vanhan ja säilyttää merkinnät.

## 3. Merkintäkieli

Jäsennin noudattaa aiempien md → html -muunnosten konventioita, joiden mallina oli kandidaatintutkielman html-versio. Tuottajan konventiot menevät yleisen Markdownin edelle.

### 3.1 Otsikkolohko

Ensimmäinen `#`-otsikko on teoksen nimi. Sen ja ensimmäisen `##`-otsikon välissä:

- pelkästä kursiivista koostuva kappale on alaotsikko (versaalina, harvennettuna),
- muut kappaleet ovat tietorivejä, joissa rivinvaihdot säilyvät.

Tietoriveiltä arvataan tekijä (2–4 isolla alkavaa sanaa omalla rivillään) ja vuosi.

### 3.2 Luvut ja tunnisteet

Numeroitu otsikko saa tunnisteen numerostaan: `## 2. Ihmisyys` on `luku-2`, `### 2.1 Valistus` on `luku-2-1`. Numeroimaton `###`-otsikko on versaali kursiivi, kuten tutkielman *Viittauksista ja niiden lyhenteistä*. Latomo huomauttaa, jos numerointi hyppää.

Jokainen tekstilohko (otsikko, kappale, lainauksen kappale, luettelon kohta) saa järjestysnumeron `data-b`. Kirjanmerkit, alleviivaukset ja lukukohta ankkuroidaan siihen ja merkkien määrään lohkon alusta.

### 3.3 Alaviitteet

`^[…]` on alaviite. Se näkyy numerona, ja numero näkyy aina.^[Viitenumeroita ei saa tässä versiossa piiloon, kuten toivottiin.] Leveällä näytöllä viite on sivuhuomiona oikeassa reunuksessa, kapealla numeron napautus avaa sen tekstin lomaan ja sivutetussa näkymässä ponnahdukseen. Viitteen sisällä saa olla kursiivia ja hakasulkeita.

### 3.4 Kirjallisuus

`## Kirjallisuus` (tai Lähteet, Lähdeluettelo, Bibliografia, References) tekee seuraavista kappaleista riippuvasisennettyjä seuraavaan `##`-otsikkoon asti.

### 3.5 Etukenttä

Tiedoston alussa voi olla etukenttä:

```
---
viite: Sukunimi, Etunimi (2026). *Nimi: alaotsikko*. Opinnäyte. Yliopisto.
osoite: https://…/teksti.md
---
```

`viite` korvaa arvatun lähdeviitteen ja `osoite` kertoo, mistä .md-tiedoston saa verkosta. Latomo kirjoittaa nämä itse. Myös `otsikko`, `tekijä` ja `vuosi` ohittavat arvaukset.

### 3.6 Mitä ei tueta

Kuvat, taulukot ja raaka HTML. Raaka HTML näkyy tekstinä, koska kaikki escapoidaan. Latomo huomauttaa näistä. Lainausmerkit jätetään sellaisiksi kuin ne on kirjoitettu, kuten aiemmissakin muunnoksissa.

## 4. Lukija

### 4.1 Vieritys ja sivutus

Vierityksessä teksti on yksi pitkä palsta. Sivutettu näkymä tehdään CSS-palstoilla: artikkelin korkeus on ruudun korkeus, palstan leveys enintään 33 em, ja palstaväli on niin suuri, että vain yksi palsta näkyy kerrallaan. Sivu vaihdetaan siirtämällä artikkelia palstan ja välin verran (`translateX`). Pääluku alkaa aina uudelta sivulta.

Sivua käännetään napauttamalla ruudun reunakolmanneksia, pyyhkäisemällä, nuolinäppäimillä, PageUp/PageDownilla tai välilyönnillä. Keskikolmannes avaa aikajanan. Animaatioita ei ole, koska e-ink piirtää ne huonosti.

### 4.2 Kohta

Lukukohta on ensimmäinen näkyvä merkki: `{ b: lohko, o: merkki, s: katkelma }`. Kun kirjasinta, kokoa tai näkymää vaihdetaan, Luin palaa sivulle, jolla sama merkki on. Katkelman avulla kohta löytyy myös, kun teksti on päivittynyt ja lohkojen numerot ovat siirtyneet. Merkkilaskussa ohitetaan sivuhuomiot, viitenumerot ja tavutuksen pehmeät tavuviivat.

### 4.3 Alleviivaukset ja kirjanmerkit

Tekstin valinta avaa valikon (Alleviivaa, Kopioi, Kirjanmerkki). Automaattisessa tilassa valinta muuttuu heti alleviivaukseksi: hiirellä painikkeen noustessa, kosketuksella kun valinta on pysynyt 1,2 sekuntia samana. Kesken sanan alkava valinta laajenee koko sanaan. Alleviivauksen napautus antaa kopioida katkelman tai poistaa sen.

Kirjanmerkki lisätään aikajanan alta nykyiseen kohtaan tai valinnan alkuun. Tekstissä se on nauha vasemmassa reunuksessa sen rivin kohdalla. Kirjanmerkit ja alleviivaukset ovat listana alapalkin kohdassa *Kirjanmerkit ja alleviivaukset*.

### 4.4 Aikajana

Alapalkin napautus avaa aikajanan. Sijainnit lasketaan merkkimäärästä, joten aikajana ei muutu kirjasinkoon mukana. Muodot:^[Muodot erottuvat ilman värejäkin, joten aikajana toimii harmaasävyisessä e-ink-näytössä.]

- pääluku: iso täytetty salmiakki,
- alaluku: pienempi ontto salmiakki,
- alaluvun alaluku: pieni täytetty salmiakki harmaana,
- kirjanmerkki: ruosteenvärinen nauha viivan alla,
- nykyinen kohta: musta kolmio ja hiusviiva.

Napautus merkin lähellä vie merkin kohtaan, muualla suhteelliseen kohtaan. Vedettäessä yläpuolella näkyy, mihin osioon päädytään.

### 4.5 Asetukset

Hammasratas avaa asetukset. Ne koskevat kaikkia tekstejä tällä laitteella: teema, kirjasin (antiikva tai groteski), koko, kappalejako (väli tai sisennys), reunat (liehu tai tasattu), tavutus, näkymä, sisällysluettelo, kirjanmerkit tekstissä, automaattinen alleviivaus sekä aikajanan taso ja kirjanmerkit. Oletukset: vaalea (tai laitteen tumma), antiikva, 19 px, väli, liehu, varovainen tavutus, vieritys, automaattinen alleviivaus pois.

## 5. Tavutus

Selaimen oma suomen tavutus puuttuu Androidin Chromesta^[Androidin tavutussanastoissa ei ole suomea. Macin Safari ja Firefox tavuttavat suomea itse; asetus Selaimen kokeilee sitä.], joten `md.js` tavuttaa itse ja lisää pehmeät tavuviivat. Säännöt: konsonanttisääntö, vokaalisääntö ja diftongit. Kirjasäännön mukaan *ie*, *uo* ja *yö* ovat diftongeja vain ensitavussa, mutta yhdyssanoissa ne aloittavat usein jälkiosan (*itse|tietoisuus*), joten ne käsitellään diftongeina kaikkialla paitsi monikon genetiivissä (*talvi-en*).

Yhdyssanojen saumaa säännöt eivät tunne. Virheet ovat aina samaa tyyppiä: yksittäinen konsonantti siirtyy jälkiosan alkuun (*kansalai-soikeus*, *eläi-netiikka*). Siksi rajat luokitellaan:

- konsonanttiryhmän sisällä (*kart-ta*, *Kors-gaard*),
- vokaalien välissä (*ra-di-o*),
- vokaalin ja yksinäisen konsonantin välissä (*ka-la*).

Varovainen tila käyttää vain kahta ensimmäistä ja vaatii 8 kirjaimen sanan ja 3 kirjainta kummallekin puolelle. Tiheä käyttää kaikkia (sana 5, puolet 2). Kursiivia, otsikoita ja sanoja, joissa on c, q, w, x, z tai muu kuin suomen kirjain, ei tavuteta, jottei vieraskielisiä nimiä tavuteta suomen säännöin. Kirjoittaja voi lisätä tekstiin oman pehmeän tavuviivan (U+00AD).

Tasattu palsta kapealla ruudulla tarvitsee tiheän tavutuksen; varovaisella sanavälit venyvät.

## 6. Ulkoasu

### 6.1 Värit

Kuusi väriä kummassakin teemassa: paperi, muste, harmaa, viiva, ruoste ja okra. Ei läpikuultavuutta eikä varjoja, koska e-ink näyttää ne rasteroituina. Ruoste on viitenumeroiden ja kirjanmerkkien väri, okra alleviivausten.

### 6.2 Logo

Ylärivi *LUiN.* on korkeaa, tiivistä antiikvaversaalia (versaalikorkeus 100, paksu runko 15, hiusviiva 3,4). i:n piste ja loppupiste ovat salmiakkeja, joiden kyljet ovat hieman koverat. Hiusviiva kulkee pisteestä päätepisteeseen ja leikkaa N:n vinoviivan.^[Tiiviillä N:llä vinoviiva on niin jyrkkä, ettei sama suora voi kulkea vinoviivaa pitkin: piste nousisi kauas versaalien yläpuolelle. Siksi viiva leikkaa vinoviivan noin 61 %:n korkeudella. Generaattorin parametrit (`yd`, `per`, `c`) ovat tiedostossa `luin/kehitys/logo.js`.] Alarivi *HTML* on ohutta matalaa versaalia, levitettynä ylärivin levyiseksi.

### 6.3 Kirjasimet

Antiikva on Literata, joka on suunniteltu e-lukulaitteille. Groteski on laitteen oma (Roboto, San Francisco). Viitenumerot ovat groteskia kuten aiemmissa html-versioissa.

## 7. Lähdeviite ja jakaminen

Lukulistan nimikkeen oikeassa reunassa on pieni jakonappi. Sen valikosta voi kopioida lähdeviitteen, kopioida linkin (verkkotekstille) tai poistaa nimikkeen listasta. Viite kopioidaan sekä tekstinä että HTML:nä, jolloin kursiivi säilyy esimerkiksi Wordiin liitettäessä.

Muoto on johdettu tutkielman kirjallisuusluettelosta (Helsingin yliopiston teologisen tiedekunnan APA-sovellus):

> Juutilainen, Olli (2026). *Kant ja eläinetiikka: muulajisten arvokkuutta etsimässä*. Uskonnonfilosofian kandidaatintutkielma. Helsingin yliopisto. HTML-versio: https://… (luettu 20.10.2026).

Päivämäärä on tekstin viimeisin avaus tällä laitteella. Osoite on Luin-linkki, jos teksti on verkossa; paikallisella tekstillä osoitetta ei ole.^[Sitaattisääntöjä Clauden projektikansioista ei voitu lukea tästä istunnosta. Muoto on päätelty tutkielman omasta lähdeluettelosta, ja se on yhdessä funktiossa (`viite` luin.html:ssä), joten sen voi vaihtaa helposti.]

## 8. Testaus

Luin on testattu Playwrightilla Chromiumissa. Toistettava testi:

```
NODE_PATH=$(npm root -g) node luin/kehitys/testi.js teksti.md [kuvakansio]
```

Skripti käynnistää oman tiedostopalvelimen, syöttää tekstin avaimeen `luin-tuonti`, avaa `luin.html#tuo` ja mittaa rakenteen, leikkautuvat rivit jokaisella sivulla, jokaisen sivun kohdan paluun samalle sivulle, kirjasinkoon muutoksen ja paluun, alleviivauksen säilymisen, aikajanan hypyn ja vierityksen kohdan pysyvyyden. Sivu antaa testeille koukun `window.__luin` (asetukset, tila, nykyinen kohta, `mene()`, `valinta()`).

Mitattu 20.10.2026 kandidaatintutkielmalla:

- Rakenne vastaa aiempaa html-versiota: samat otsikkotunnisteet, 6 `##`- ja 8 `###`-otsikkoa, 8 lainausta, 21 lähdettä. Alaviitteitä on 52 (vanhassa versiossa 53; md on uudempi).
- Sivutettuna 412 × 824 px: 55 sivua, ei yhtään sivun alareunan yli menevää riviä. Jokaisen sivun kohta vie takaisin samalle sivulle (myös 21 px tiheällä tavutuksella, 66 sivua, ja 1280 × 800 px, 37 sivua). Koon muutos 19 → 22 → 19 px palauttaa saman sivun.
- Vierityksessä luettu kohta pysyy samana, kun siihen palataan (kolme kokoonpanoa).
- Alleviivaus säilyy uudelleenlatauksessa; jakovalikon viite päätyy leikepöydälle.

Testaamatta: oikeat Boox-laitteet, Safari, oikea Dropbox-linkki, kosketusvalinta oikealla Androidilla (automaattinen alleviivaus).

## 9. Avoimet kysymykset

### 9.1 Käyttöönotto

Tekstit voisi säilyttää samaan tapaan kuin keikat: KV-avain `teksti:<tunnus>` ja workerin reitti, jolloin linkki olisi lyhyt `luin.html#<tunnus>`. Toinen tapa on repo (`luin/tekstit/`), mutta se on julkinen. Kolmas on Dropbox-linkki (`#u=`).

### 9.2 Sanakirja

Pitkän painalluksen suomi–suomi-sanakirja vaatii kaksi asiaa: perusmuodon (taivutetusta sanasta) ja määritelmän. Perusmuodon saisi Voikosta (WebAssembly-käännös, useita megatavuja), määritelmän esimerkiksi suomenkielisestä Wikisanakirjasta, jonka rajapinta sallii selainhaut. Android-kääreessä (kuten KEICK•WALKissa) voisi käyttää myös laitteen sanakirjasovellusta.

### 9.3 Muuta myöhemmäksi

- Kahden sivun aukeama leveällä näytöllä.
- Alleviivaukset aikajanalla ja muistiinpanot alleviivauksiin.
- Merkintöjen vienti ja synkronointi laitteiden välillä.
- Lukulistan tuonti ja vienti tiedostona.
