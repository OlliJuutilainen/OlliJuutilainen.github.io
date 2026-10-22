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
- `luin-merkit:<tunnus>` – kirjanmerkit (`km`) ja alleviivaukset (`al`). Alleviivauksen kirjaus on sen kentässä `n`.

Paikallisen tekstin tunnus on `p-` + otsikosta tehty lyhenne, verkkotekstin `u-` + osoitteen tiiviste. Saman otsikon uusi versio Latomosta korvaa vanhan ja säilyttää merkinnät.

## 3. Merkintäkieli

Jäsennin noudattaa aiempien md → html -muunnosten konventioita, joiden mallina oli kandidaatintutkielman html-versio. Tuottajan konventiot menevät yleisen Markdownin edelle.

### 3.1 Otsikkolohko

Ensimmäinen `#`-otsikko on teoksen nimi. Sen ja ensimmäisen `##`-otsikon välissä:

- pelkästä kursiivista koostuva kappale on alaotsikko (versaalina, harvennettuna),
- muut kappaleet ovat tietorivejä, joissa rivinvaihdot säilyvät.

Tietoriveiltä arvataan tekijä (2–4 isolla alkavaa sanaa omalla rivillään) ja vuosi.

### 3.2 Luvut ja tunnisteet

Otsikkotasoja on neljä (käyttäjän päätös 21.10.2026): `#` on koko nimikkeen otsikko, `##` pääluku, `###` alaluku ja `####` alaluvun alaluku. Kolme alempaa voivat näkyä aikajanalla (luku 4.4). Syvempi otsikko (`#####`) näkyy `####`-tasona, ja Latomo huomauttaa siitä.

Numeroitu otsikko saa tunnisteen numerostaan: `## 2. Ihmisyys` on `luku-2`, `### 2.1 Valistus` on `luku-2-1`. Numeroimaton `###`-otsikko on versaali kursiivi, kuten tutkielman *Viittauksista ja niiden lyhenteistä*. Latomo huomauttaa, jos numerointi hyppää.

Jokainen tekstilohko (otsikko, kappale, lainauksen kappale, luettelon kohta) saa järjestysnumeron `data-b`. Kirjanmerkit, alleviivaukset ja lukukohta ankkuroidaan siihen ja merkkien määrään lohkon alusta.

### 3.3 Alaviitteet

`^[…]` on alaviite. Se näkyy numerona, ja numero näkyy aina.^[Viitenumeroita ei saa tässä versiossa piiloon, kuten toivottiin.] Leveällä näytöllä viite on sivuhuomiona oikeassa reunuksessa, kapealla numeron napautus avaa sen tekstin lomaan ja sivutetussa näkymässä ponnahdukseen. Viitteen sisällä saa olla kursiivia ja hakasulkeita.

### 3.4 Kirjallisuus

`## Kirjallisuus` (tai Lähteet, Lähdeluettelo, Bibliografia, References) tekee seuraavista kappaleista riippuvasisennettyjä seuraavaan `##`-otsikkoon asti.

Alaviitteen lähdeviittaus muuttuu linkiksi luettelon kohtaan, kun yhteys on varma. Luettelon kohdan tekijä on alun teksti pilkkuun tai sulkuun asti ja vuosi ensimmäinen sulkeissa oleva vuosi (`Kant, Immanuel (2017a).`, `Syrjintä (s.a.).`). Sukunimi ja vuosi (*Singer 2023*) linkittyy, jos luettelossa on tasan yksi tämän tekijän tämän vuoden kohta. Sukunimi ja muu paikannin (*Korsgaard 8.1.2*) linkittyy, jos tekijältä on luettelossa vain yksi kohta tai vain yksi, johon tekstissä ei missään viitata vuosiluvulla. Muuten linkkiä ei tule. Latomo luettelee tarkistuksessa, mitkä viittaukset linkittyvät mihin ja miksi jokin jää ilman. Linkki on alaotsikon harmaa eikä ruoste, haalealla alleviivauksella.

Lyhenteet (*GMS*, *KrV*) linkittyvät lyhenteiden selitykseen ilman erillisiä merkintöjä (käyttäjän päätös 21.10.2026). Selitysosio tunnistetaan otsikosta, jossa on *lyhent* (*Lyhenteet*, *Viittauksista ja niiden lyhenteistä*; englanniksi *abbreviation*), millä tasolla tahansa; osio jatkuu seuraavaan samantasoiseen tai ylempään otsikkoon. Osion kappaleissa ja luettelon kohdissa lyhenteeksi lasketaan kursivoitu yksittäinen 2–5 kirjaimen sana, jossa on vähintään kaksi versaalia: tutkielmasta *GMS*, *MS*, *KpV* ja *KrV*, mutta ei *A*, *1:234* eikä teosten nimiä. Alaviitteessä lyhenne ja sen perässä mahdollinen paikannin (*GMS 4:429*, *MS 6:442–44*, *KrV A1/B1*, *KrV BXXX*) linkittyy siihen kappaleeseen tai luettelon kohtaan, jossa lyhenne määritellään ensimmäisen kerran (tunniste `lyh-gms`). Lyhenneluettelo (`- *KrV* – Puhtaan järjen kritiikki`) vie siis suoraan oikealle riville. Kuten lähdeviittauksetkin, lyhenteet linkittyvät vain alaviitteissä, ei leipätekstissä, eikä selitysosiosta linkitetä edelleen kirjallisuusluetteloon (käyttäjän päätös: minimalismi).

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

Sivua käännetään napauttamalla ruudun reunakolmanneksia, pyyhkäisemällä, nuolinäppäimillä, PageUp/PageDownilla, välilyönnillä tai, jos ne on valittu, sivunapeista. Keskikolmanneksen napautus ei tee mitään: palkit avataan alapalkista tai mobiilin alakaistasta (luku 4.4; käyttäjän päätökset 22.10.2026: hiirellä keskiklikkaus on kauhea tapa, ja mobiilissa napautus avasi palkit liian helposti vahingossa). Sivunappipari on rajattu laatikko, yhtä korkea (34 px) ja kirkas kuin *Merkinnät*- ja *Etsi*-laatikot, ja sen nuolina ovat täytetyt lovetut salmiakit, jotka osoittavat yhteen suuntaan (käyttäjän päätökset 22.10.2026; koverat kyljet kuten logon ja aikajanan salmiakeissa; aiemmin 28 px korkea, hyvin haalea ja nuolina ohuet natsat): työpöydällä alapalkissa edistymisen vasemmalla puolella tai ilman edistymistä oikeassa reunassa, mobiilissa kelluvana palkkinuolen vasemmalla puolella. Rajaus kertoo, ettei siitä aukea aikajana; laatikon puolikkaat ovat kiinni toisissaan, ettei parin keskelle jää rakoa, jonka napautus avaisi aikajanan. Sivunapit ovat oletuksena pois ja ne saa asetuksista päälle (luku 4.5; käyttäjän päätös 22.10.2026: reunojen napautus riittää, ja oikea alanurkka kuuluu palkkinuolelle). Booxin sivunkääntönäppäimet (esim. Palma) kääntävät sivua, kun ne on laitteen sovelluskohtaisissa asetuksissa valittu sivunkääntönäppäimiksi: ne antavat PageDown/PageUpin. Äänenvoimakkuusnäppäiminä ne kääntävät sivua vain, jos selain välittää ne sivulle (`AudioVolumeDown` = seuraava); yleensä ei välitä. Animaatioita ei ole, koska e-ink piirtää ne huonosti.

### 4.2 Kohta

Lukukohta on ensimmäinen näkyvä merkki: `{ b: lohko, o: merkki, s: katkelma }`. Kun kirjasinta, kokoa tai näkymää vaihdetaan, Luin palaa sivulle, jolla sama merkki on. Katkelman avulla kohta löytyy myös, kun teksti on päivittynyt ja lohkojen numerot ovat siirtyneet. Merkkilaskussa ohitetaan sivuhuomiot, viitenumerot ja tavutuksen pehmeät tavuviivat.

### 4.3 Alleviivaukset, kirjaukset ja kirjanmerkit

Tekstin valinta avaa valikon, jonka painikkeet ovat ikoneita (nimi näkyy vihjeenä ja ruudunlukijalle): alleviivaa (*Abc* liioitellun paksun ruosteisen viivan päällä), kirjaa (lyhyt paksu kynä, kärki vasemmalla alhaalla), kopioi (kaksi lomittaista suorakaidetta, molemmat yhtenäisviivaisia) ja kuparinen kirjanmerkkinauha. Automaattisessa tilassa (oletus) valinta muuttuu heti alleviivaukseksi: hiirellä painikkeen noustessa, kosketuksella kun valinta on pysynyt 1,2 sekuntia samana. Kesken sanan alkava valinta laajenee koko sanaan. Alleviivauksen napautus näyttää sen kirjauksen ja antaa kirjoittaa tai muokata kirjausta, kopioida katkelman tai poistaa alleviivauksen (ikonina sama viiva, jonka päällä on tekstin sijaan raksi); jos kirjaus on, poistonapin tilalle tulee iso nappi, jossa on poiston ikoni, yliviivattu kynä ja kysymys *Poista myös kirjaus?*, ja sen vieressä *älä!*, joka palauttaa valikon. Kirjauksen esikatselu yliviivataan, ja ison napin napautus ohitetaan 0,4 sekunnin ajan, ettei tuplanapautus poista vahingossa. Kopioinnin jälkeen ikonin tilalla on rasti.

Kirjaus on alleviivaukseen liitetty muistiinpano. *Kirjaa* alleviivaa valinnan ja avaa tekstilaatikon, joka kasvaa tekstin mukana enintään 30 % ruudun korkeudesta ja vierii sen jälkeen. Kirjauksen pituus on enintään 5 000 merkkiä, ja jäljellä oleva määrä näkyy laatikon alla. Raja suojaa vain tallennustilaa: localStorage on yhteinen koko sivustolle (noin 5 Mt). *Tallenna*, Ctrl+Enter tai napautus muokkaimen ulkopuolelle tallentaa; *Peruuta* ja Esc peruvat muutoksen, ja juuri tehty alleviivaus poistuu. Kirjoittamisen aikana muokkain pysyy näkyvällä alueella näppäimistön yläpuolella, eikä sivunäkymää aseteta uudelleen. Jos sovellus siirtyy taustalle kesken kirjoittamisen, luonnos tallennetaan.

Kirjanmerkki lisätään vasemman alanurkan nauhasta (ääriviiva alapalkin tekstien värillä; työpöydällä alapalkissa, mobiilissa kelluvana, aina näkyvissä eikä asetuksista poistettavissa; käyttäjän päätös 22.10.2026) tai valinnan valikosta, ja se menee aina luettavan kappaleen alkuun (käyttäjän päätös 21.10.2026): nauhasta ruudun ylimmän rivin kappaleen, valikosta valinnan kappaleen. Kohta tuodaan näkyviin, jotta merkin ilmestyminen näkyy. Sivutettuna kappale on sivun ensimmäisen rivin kappale; jos se alkoi edellisellä sivulla, siirrytään sille sivulle. Vierityksessä ruutua vieritetään sen verran, että nauha näkyy. Samaan kappaleeseen ei tehdä toista kirjanmerkkiä. Kun ruudulla (sivutettuna sivulla) on kirjanmerkki, nauha on kuparinen ja sen napautus poistaa näkyvät kirjanmerkit.

Tekstissä nauha on sisennetyn kappaleen sisennyksessä ensimmäisen rivin kohdalla (nousijoiden yläreunasta perusviivaan). Muuten, jos kappaleen yläpuolella on tilaa (kappaleväli, otsikon tai luvun vaihto, sivun yläreuna), nauha on tekstin vasemmassa laidassa ensimmäisen rivin yläpuolella, 4 px nousijoiden yläpuolella, jotta se kuuluu alla olevaan kappaleeseen. Tilaa on, jos nousijoiden ja edellisen rivin laskijoiden väli on vähintään nauhan korkeus 15 px + 4 px; mitat luetaan kirjasimesta canvasilla. Sivutettuna nauha on `position: fixed`, jotta se mahtuu sivun yläreunan ja yläpalkin väliseen kaistaan, jonka `#sivu` muuten leikkaisi. Vasta jos kumpaakaan tilaa ei ole, nauha on vasemmassa reunuksessa kuten ennen; samoin vanhat kesken kappaletta olevat kirjanmerkit. Kirjanmerkit, alleviivaukset ja kirjaukset ovat listana aikajanan alla laatikossa *Merkinnät*. Listan osiot *Kirjanmerkit* sekä *Alleviivaukset ja kirjaukset* supistuvat otsikon vieressä olevasta pienestä salmiakista (täynnä auki, ontto kiinni), ja tila muistetaan asetuksissa (käyttäjän pyyntö 21.10.2026). Listassa alleviivattua katkelmaa ei alleviivata (käyttäjän päätös 21.10.2026): alleviivaus näkyy vain tekstissä itsessään.

### 4.4 Aikajana

Palkit uudistettiin 22.10.2026 (käyttäjän päätökset). Työpöytä ja mobiili erotetaan syöttötavasta, ei leveydestä: kosketusnäyttö (`pointer: coarse`) on mobiili (`body.mobiili`; Boox-laitteet leveydestä riippumatta), hiiri on työpöytä myös kapeassa tai suurennetussa ikkunassa (käyttäjän päätös 22.10.2026; ensimmäisessä versiossa myös enintään 700 px:n ikkuna oli mobiili, jolloin palkit piiloutuivat työpöydällä). Aikajanan oletustason ehto (luku 4.5) on ennallaan.

- **Työpöydällä** ylä- ja alapalkki ovat pysyviä kuten ennen. Alapalkissa on vasemmalla kirjanmerkkinauha ja oikealla sivunapit ja edistyminen. Natsaa ja nykyisen osion nimeä ei enää ole: osion nimi näkyy avatun aikajanan yläpuolella. Alapalkin napautus (muualta kuin kirjanmerkistä ja sivunapeista) avaa aikajanan ja uusi napautus sulkee sen. Tekstin klikkaus ei avaa aikajanaa missään tilassa; sivutettuna reunojen klikkaus kääntää sivua kuten ennen. Palkkinuolta työpöydällä ei ole, koska alapalkki näkyy aina.
- **Mobiilissa** palkit ovat piilossa. Ruudun alareunassa on reunukseton kaista, jossa kirjanmerkkinauha kelluu vasemmassa ja palkkinuoli oikeassa alanurkassa tekstipalstan reunojen linjassa, joten ne seuraavat marginaalia. Palkkinuoli (käyttäjän päätös 22.10.2026) on ylös osoittava lovettu koverakylkinen salmiakki kuten sivunapeissa: kiinni hienovarainen ääriviiva alapalkin tekstien värillä kirjanmerkkinauhan tapaan, auki täytetty tekstin värillä ja alas osoittava. Se vain kertoo, että palkit aukeavat alakaistasta: kaistan napautus missä tahansa (muualla kuin kelluvissa napeissa) avaa yhtä aikaa yläpalkin ja aikajanakerroksen, ja uusi napautus sulkee ne. Ne tulevat tekstin päälle, joten teksti ei siirry. Tekstin napautus ei avaa palkkeja (käyttäjän päätös 22.10.2026; aiemmin avasi vierityksessä mikä tahansa kohta ja sivutettuna keskikolmannes, mikä tapahtui liian helposti vahingossa). Kerroksen ylärivillä on vasemmalla osion nimi ja oikealla edistyminen; *Merkinnät* ja *Etsi* ovat kaistalla kelluvien välissä, joten kelluvat eivät liiku kerroksen avautuessa. Ilman sivunappeja ne ovat kirjanmerkin ja nuolen välin keskellä; jos sivunapit on valittu, ne ovat nuolen vasemmalla puolella, ja *Merkinnät* ja *Etsi* siirtyvät vasemmalle 12 px kirjanmerkistä, jotta kaistan keskelle jää mahdollisimman paljon tilaa palkkien avaamiseen ja sulkemiseen. Jos ne eivät mahdu kelluvien väliin vähintään 12 px:n välein (kapea ruutu ja leveä marginaali), ne ovat omalla rivillään aikajanan alla. Vain kaistan napautus avaa ja sulkee palkit: vieritys, sivunkääntö, pyyhkäisy ja näppäimet eivät vaikuta niihin. (Ensimmäisessä versiossa yli 48 px:n vieritys ja sivunkääntö sulkivat ne.) Kaistalla ei ole selaimen napautuskorostusta (`-webkit-tap-highlight-color`), koska näkymättömän kaistan napautus väläytti koko kaistan; e-ink piirtää välähdyksen huonosti. Hyppy palkkien ollessa auki vie kohdan yläpalkin alapuolelle eikä sen alle.

Natsaa ei ole kummassakaan (käyttäjän päätös 22.10.2026; aiemmin alapalkissa natsa, joka osoitti kiinni ylös ja auki alas). Sijainnit lasketaan merkkimäärästä, joten aikajana ei muutu kirjasinkoon mukana. Luettu osa (nykyiseen kohtaan asti) on piirretty tekstin värillä, tuleva viiva ja salmiakit haalealla harmaalla; kirjanmerkit ovat kuparisia kummallakin puolella. Muodot ovat nuottien tapaan (käyttäjän päätös 21.10.2026): suurempi aika-arvo on ontompi.^[Muodot erottuvat ilman värejäkin, joten aikajana toimii harmaasävyisessä e-ink-näytössä.]

- pääluku: iso ontto salmiakki (vaaleassa teemassa valkoinen; paperin värinen täyte peittää viivan),
- alaluku: pienempi täytetty salmiakki,
- alaluvun alaluku: lähes pistemäinen täytetty salmiakki,
- kirjanmerkki: ruosteenvärinen nauha viivan alla,
- nykyinen kohta: musta kolmio ja hiusviiva,
- paluumajakka (luku 4.8): ontto kolmio ja katkoviiva.

Etappimerkit (pääluku, alaluku, alaluvun alaluku) pienennettiin 21.10.2026 (käyttäjän päätös): pääluku 0,8- ja alaluvut 0,7-kertaisiksi. Samana päivänä alaluvut suurennettiin hiukan (1,15- ja 1,35-kertaisiksi), koska alaluvun alaluvut sulautuivat viivaan, ja nykyisen kohdan jälkeisten pienempi kokoluokka poistettiin turhana kokojen kirjona: tuleva osa erottuu pelkällä harmaalla. Mitat ovat `JANA.koko`-taulukossa; kirjanmerkin nauha ei muuttunut.

Edistyminen (prosentit tai sivunumero) on työpöydällä vain alapalkissa, joka näkyy myös aikajanan ollessa auki; aikajanan yläriville sitä ei toisteta. Mobiilissa alapalkkia ei ole, joten edistyminen on aikajanakerroksen ylärivin oikeassa reunassa. Napautus ja veto toimivat lukutavan mukaan (käyttäjän päätös 21.10.2026). Vierityksessä magneettia ei ole: napautus vie suhteelliseen kohtaan, myös merkin vieressä. Sivutettuna välimuotoja ei ole: osoitin pysähtyy vain merkkeihin eli tekstin alkuun, jokaisen tason otsikoihin (myös alalukujen alalukuihin), kirjanmerkkeihin, paluumajakan kummitusmerkkiin ja voimassa olevaan kohtaan, ja lähin voittaa. Pysäkit ovat samat riippumatta siitä, mitkä merkit aikajanalle on valittu näkyviin.^[Oletus on, että ilman e-ink-laitetta luetaan mieluummin vierittäen. E-ink-näytössä veto ei näin tee ilotulitusta: osoitin siirtyy vain pysäkiltä toiselle.] Vedettäessä yläpuolella näkyy, mihin osioon päädytään. Vedettäessä (hiirellä tai sormella; käyttäjän pyyntö 21.10.2026) osoitin seuraa vetoa, ja voimassa oleva kohta jää haalean harmaaksi haamuosoittimeksi. Teksti ei liiku eikä luettu osa muutu ennen irrotusta. Liikkeessä siirretään vain osoittimen `transform`ia kerran ruudunpäivitystä kohden, jotta e-ink päivittää vain pienen alueen.

Sivutettuna vapaa kohta pyöristetään sen sivun alkuun (`sivunAlku()`), joten osoitin hyppää vedettäessä sivu kerrallaan ja näyttää tarkalleen, mihin irrotus vie; irrotuksen jälkeen kohta on sama kuin sivua käännettäessä. Sivujakoa ei lasketa uudelleen hyppykohdasta alkaen, koska silloin sivunumerot ja sivujen rajat muuttuisivat joka hypyllä. Merkin lähellä osoitin tarttuu merkkiin kuten ennenkin. Ruudun ulkopuolisille sivuille ei voi käyttää `caretRangeFromPoint`ia, joten sivun ensimmäinen merkki haetaan puolitushaulla merkkien laatikoista.

### 4.5 Asetukset

Hammasratas avaa asetukset. Ne koskevat kaikkia tekstejä tällä laitteella. *Ulkoasu*: teema, liikkuminen (vieritys tai sivut; käyttäjän päätös 21.10.2026: nimi oli *Näkymä* ja paikka viimeisenä; *Sivut*-sanan alla pieni lisäkytkin *Sivunvaihtopainikkeet*, ks. alla), koko, kappalejako (väli tai sisennys), reunat (liehu tai tasattu), marginaali ja tavutus. Osiot *Teksti* ja *Aikajana* ovat sateenvarjolistoja (käyttäjän päätös 21.10.2026), joissa kukin kohta kytketään päälle tai pois:

- *Teksti → Näytä:*: sisällysluettelo, kirjanmerkit, alleviivaukset. Alleviivausten alla on pienempi lisäkytkin *Sukkela alleviivaus*. Se on himmeä ja pois käytöstä, kun alleviivaukset on piilotettu, koska näkymätöntä alleviivausta ei tehdä automaattisesti; valikon alleviivausikoni toimii silti. Sukkela alleviivaus ei avaa valikkoa maalauksen jälkeen (käyttäjän päätös 22.10.2026); valikon saa napauttamalla alleviivausta. Piilotetut alleviivaukset eivät myöskään avaa valikkoa napautettaessa.
- *Aikajana → Näytä:*: *Pääluvut*, *Alaluvut* (pääluvut ja alaluvut, oletus) tai *Kaikki* (myös alalukujen alaluvut) yhtenä valintana, kirjanmerkit ja edistyminen. Tasot ovat kumulatiivisia, joten valittu taso sytyttää myös sitä ylemmät (*Alaluvut* myös *Pääluvut*, *Kaikki* molemmat; käyttäjän päätös 21.10.2026). Valitun tason napautus sammuttaa sen, ja ylemmät jäävät: *Kaikki* palaa *Alaluvut*-tasoon, *Alaluvut* *Pääluvut*-tasoon ja *Pääluvut* sammuttaa kaikki etappimerkit. Alemman tason napautus asettaa sen tason (käyttäjän päätös 21.10.2026). Edistyminen näkyy työpöydällä alapalkissa ja mobiilissa aikajanakerroksen ylärivillä: vierityksessä prosentteina, sivuina sivunumerona.

Oletuksena kaikki muu näkyy, aikajanalla pääluvut ja alaluvut, ja sukkela alleviivaus on päällä; muut oletukset: vaalea (tai laitteen tumma), 19 px, väli, tasattu (reunat; käyttäjän päätös 21.10.2026, oli liehu), varovainen tavutus, keski (marginaali), vieritys. Aiemmin tallennetuissa asetuksissa olivat vanhat oletukset, joten ne vaihdetaan kerran: sukkela alleviivaus päälle (`av: 2`) ja aikajanan *Kaikki*, joka oli oletus 21.10.2026 hetken, takaisin *Alaluvut*-tasoon (`av: 3`; itse valittu *Pääluvut* säilyy). Marginaalin oletus koskee myös aiemmin tallentaneita, koska arvoa ei ennen ollut.

Marginaali (käyttäjän pyyntö 22.10.2026) on yksi arvo molemmille sivureunoille: *Ohut* 16 px, *Keski* 24 px (oletus) ja *Reilu* 36 px; askel on 1,5-kertainen. *Ohut* on asetusta edeltävä leveys pikselilleen (sivutettuna 480 px:n ja leveämmällä ruudulla 20 px kuten ennen), joten siihen pääsee aina takaisin. Ylä- ja alareunaa ei säädetä, koska ne ovat palkkien välissä. Rivi näkyy asetuksissa vain, kun ruutu on kapeampi kuin tekstin mitta 33 em ja leveimmät marginaalit (`33 × koko + 72` px; 19 px:n koolla alle 699 px), eli käytännössä puhelimissa; leveämmällä marginaalista ei olisi vaikutusta. Reunushuomioiden kanssa marginaali on aina 16 px. Leveämpää kuin 36 px ei ole, koska tasattu teksti alkaa jo 412 px:n ruudulla jättää rivien sanavälit leveiksi (40 px:llä kokeiltuna 35,5 merkkiä riville ja silmin nähtäviä aukkoja); raja on tarkoituksellinen. Mitattu 412 px:llä: merkkejä riville vierityksessä 40,3 / 38,8 / 36,4, kandidaatintutkielma sivutettuna 55 / 57 / 60 sivua. Nimiösivun yläväli on 14 % palstan leveydestä, joten se kapenee marginaalin mukana muutaman pikselin.

*Sivunvaihtopainikkeet* (käyttäjän pyyntö 22.10.2026) näyttää tai piilottaa sivunapit. Oletuksena se on pois (käyttäjän päätös 22.10.2026; samana päivänä aiemmin päällä, ja `av: 5` kytkee sen kerran pois myös tallennetuista asetuksista, koska päällä-arvo oli silloin oletus eikä valinta). Se on *Sukkelan alleviivauksen* tapaan pieni lisäkytkin, joka kuuluu yhteen vaihtoehtoon: se on 16 px sisennettynä *Sivut*-sanan alla (paikka mitataan, koska kirjasin vaihtelee) ja himmeänä pois käytöstä vierityksessä. Ilman sivunappeja sivua käännetään reunojen napautuksella, pyyhkäisyllä tai näppäimillä. Kirjanmerkkinauhaa ei voi kytkeä pois.

Kirjasinvalinta (antiikva tai groteski) poistettiin 21.10.2026. Groteski ei sovi valikkojen, salmiakkien ja logon kanssa; se otetaan takaisin vain, jos koko ohjelman ulkoasu sovitetaan siihen. Vanha tallennettu valinta ohitetaan.

### 4.6 Merkintöjen vienti ja tuonti

Asetusten alimpana ovat kaksi supistettua osiota, *Vie merkinnät tekstitiedostoon* ja *Tuo merkinnät tekstitiedostosta* (käyttäjän päätös 21.10.2026; ennen yksi yhteinen osio). Ne näkyvät vain tekstiä luettaessa ja koskevat avointa tekstiä. Niitä edeltää johdanto: luettuun muodostuneet merkinnät ovat vain tämän selaimen muistissa, ja ne voi viedä tekstitiedostoon ja tuoda toisessa laitteessa takaisin. Huomiota *Asetukset koskevat kaikkia tekstejä tällä laitteella* ei enää ole (käyttäjän päätös 21.10.2026).

Kummassakin osiossa valitaan alleviivaukset, kirjaukset, kirjanmerkit ja edistymisen tilanne, ja kummassakin on vain nappi (*Vie*, *Tuo*). Viennin oletus on alleviivaukset ja kirjaukset, ja valinnat muistetaan. Tuonnissa kaikki on valittuna aina, kun asetukset avataan; valintoja ei muisteta. Nappia ei voi painaa ilman valintoja (vienti vaatii jonkin merkintälajin, koska pelkkä edistymisen tilanne ei ole merkintätiedosto; tuonnissa pelkkä edistymisen tilanne antaa sijainnin).

Ennen vientiä ponnahduslaatikko vahvistaa, mitä viedään (*Olet viemässä tekstistä ”…” alleviivaukset ja kirjaukset.*). Tuonti kysyy vahvistuksen vain, jos kaikkea ei ole valittu, ja kertoo, mitä jätetään huomiotta (*Tiedoston mahdollisia kirjanmerkkejä ei tuoda.*); vahvistuksen jälkeen avautuu tiedostonvalinta. Ilman alleviivauksia tuotu kirjaus liitetään vain jo olemassa olevaan samaan alleviivaukseen; muut jäävät tuomatta, ja tilarivi kertoo niiden määrän.

*Vie* antaa Markdown-tiedoston `<otsikko>-merkinnat.md`.

Tiedosto alkaa tekstin nimellä (`#`), alaotsikolla *Luetun merkinnät*, lähdeviitteellä ja `---`-viivalla. Jos edistymisen tilanne viedään, alaotsikon ja lähdeviitteen välissä on tietorivit `Viety: 21.10.2026<br>` ja `Sijainti: 3. Kant ja eläimet › 3.1 Kantin vaikea eläinsuhde`: lukukohta otsikon tarkkuudella, ei tarkemmin (käyttäjän päätös 21.10.2026; ennen ensimmäistä otsikkoa *tekstin alku*). Sen jälkeen otsikot noudattavat tekstin hierarkiaa (`##`, `###` …), mutta mukana ovat vain osiot, joissa on vietäviä merkintöjä, ja niiden yläotsikot. Saman osion merkintöjen välissä on `---`, ja osion viimeisen merkinnän ja seuraavan otsikon välissä kaksi tyhjää riviä.

- Alleviivaus on lainaus (`> …`). Jos kirjaukset viedään, alleviivauksen kirjaus tulee lainauksen jälkeen omana kappaleenaan.
- Kirjanmerkki on `KIRJANMERKKI n`, numeroituna tekstin järjestyksessä. Jos alleviivauksia ei viedä, sen perään lainataan virke, jonka kohdalla kirjanmerkki on. Virke päättyy välimerkkiin, jota seuraa iso kirjain; tavalliset lyhenteet (*esim.*, *mm.*, *ks.* …) ja nimikirjaimet eivät katkaise sitä. Otsikon kohdalla olevasta kirjanmerkistä lainataan seuraavan lohkon ensimmäinen virke.
- Pelkät kirjaukset (tai kirjaukset ja kirjanmerkit, kun kirjanmerkkejä ei ole) ovat luettelona (`- …`) osioidensa otsikoiden alla. Kirjanmerkkien kanssa kirjaus on kappale merkintöjen välissä.
- Merkinnät, joiden kohtaa ei uudesta tekstiversiosta löydy, ovat lopussa omana osionaan.

Tuontia varten vientiin tuli 21.10.2026 kaksi lisää, muuten muoto on ennallaan:

- Jos alleviivattu katkelma esiintyy osiossaan (syvin otsikko, jonka alla se on) useammin kuin kerran, lainauksen ensimmäisen rivin perässä on `[n/m]`: n:s esiintymä m:stä. Esiintymiksi lasketaan vain kohdat, joista alleviivaus voi alkaa ja loppua (sanarajat), joten esimerkiksi *ja* ei osu sanan *Kantin ja* sisään eikä *Kant* sanaan *Kantin*.
- Kirjanmerkin perässä on HTML-kommentti `<!-- kohta: … -->` (enintään 40 merkin katkelma kohdasta, tarvittaessa `kohta n/m:`). Esikatselussa sitä ei näy. Ilman sitä kirjanmerkin kohta katoaisi, kun alleviivaukset viedään (silloin virkettä ei lainata).

*Tuo* lukee viedyn tiedoston ja lisää sen merkinnät avoimeen tekstiin. Tiedostomuotoa ei ole merkitty tunnisteilla, vaan tuonti nojaa siihen, mitä vienti joka tapauksessa kirjoittaa:

- Tiedosto tunnistetaan `#`-otsikosta ja rivistä *Luetun merkinnät*. Jos otsikko on eri kuin avoimen tekstin, merkinnät tuodaan vain, jos ainakin puolet lainauksista löytyy tekstistä.
- Otsikkorivi rajaa haun osioon, kun tekstissä on samantasoinen samanniminen otsikko (samannimisistä edellisen jälkeinen). Lainaus haetaan osiosta `[n/m]`:n mukaisesta esiintymästä; jos tekstiä on muutettu, koko tekstistä lähimpänä osion alkua. Merkintä, jota ei löydy, tuodaan kohdattomana (Merkinnät-laatikossa *kohtaa ei löydy*).
- Merkintöjen välinen `---` on erotin vain tyhjien rivien välissä. Alleviivauksen jälkeinen osa, joka ei ala lainauksella eikä kirjanmerkillä, on saman kirjauksen jatkoa.
- Kirjausta ilman lainausta (vienti ilman alleviivauksia) ei voi kiinnittää tekstiin, joten se jää tuomatta.
- Jo olemassa olevaa ei tuoda toiseen kertaan: sama alleviivaus ja kirjanmerkki samassa kohdassa ohitetaan, ja uusi kirjaus liitetään olemassa olevaan alleviivaukseen. Tiedoston voi siis tuoda laitteeseen, jossa merkinnät jo osittain ovat.
- *Sijainti* ei siirrä lukukohtaa itsestään.

Onnistuneen tuonnin jälkeen Tuo-napin päälle avautuu kuittaus (käyttäjän pyyntö 22.10.2026), jotta nappia ei paineta uudestaan luullen, ettei mitään tapahtunut: ruosteinen rasti ja otsikko (*Merkinnät tuotu*, *Merkinnät olivat jo tallessa*, *Lukukohta tuotu* tai *Ei uutta tuotavaa*), sen alla määrät ja huomiot sekä napit *Palaa tekstiin* ja *Katso merkinnät listasta* (jälkimmäinen avaa Merkinnät-laatikon). Jos sijainti tuotiin, niiden yläpuolella on kyltti: ruosteinen kehys, versaalikursiivi *Jatka siitä, mihin jäit* (tai *Olet jo siellä, mihin jäit*, jos lukukohta on jo samassa osiossa), otsikon nimi ja oikealla täytetty ruosteinen pää, jonka kolmio osoittaa kohdan suuntaan kuten paluumajakassa. Kyltti vie otsikkoon ja jättää paluumajakan. Aiempi ruosteinen tekstilinkki tilarivin kursiivin seassa ei erottunut. Tilarivi jää kuittauksen alle pysyväksi muistiinpanoksi (sama teksti ja linkki *Siirry sijaintiin*). Virheilmoitus näkyy edelleen vain tilarivillä.

Ennen 21.10.2026 viedyssä tiedostossa ei ole `[n/m]`-merkintöjä eikä kirjanmerkkien kommentteja. Toistuvasta lainauksesta valitaan silloin esiintymä, jota sama tuonti ei ole jo käyttänyt ja joka ei ole toisen alleviivauksen sisällä. Kirjanmerkki ilman lainattua virkettä sijoitetaan likimäärin edellisen merkinnän loppuun tai osion alkuun (mieluummin liian aikaisin kuin liian myöhään); jos edellisen ja seuraavan merkinnän välissä on jo kirjanmerkki, se katsotaan samaksi. Tilarivi kertoo likimääräiset ja tuomatta jääneet.

### 4.7 Haku

Aikajanan alla laatikon *Merkinnät* oikealla puolella on laatikko *Etsi* (suurennuslasi, jonka linssi on kaksi sisäkkäistä onttoa salmiakkia). Se avaa ponnahduslaatikon, jossa on hakukenttä, osumien määrä ja osumalista. Säännöt (käyttäjän päätökset 21.10.2026):

- Haku etsii sanojen alkuja: *kantil* löytää sanat *kantilainen* ja *kantilaisuus*, mutta ei sanan keskeltä (*etiikka* ei löydä sanaa *eläinetiikka*).
- Usean sanan haku on aina fraasi, kuin lainausmerkit olisi kirjoitettu: *kantilainen eläinetiikka* löytää vain nämä sanat peräkkäin tässä järjestyksessä, ei kumpaakin erikseen (JA) eikä jompaakumpaa (TAI). Fraasin jokainen sana on sekin alku.
- Lainausmerkeissä sana on kokonainen: *"kant"* löytää sanan *Kant* (myös *Kant-tulkinnan* alusta), mutta ei sanoja *Kantin* tai *kantilainen*. Lainausmerkeiksi käyvät `"`, `”`, `“`, `„`, `«` ja `»`, ja pariton lainausmerkki koskee hakusanan loppua. Lainausmerkeissä voi olla useampi sana, ja lainattuja ja lainaamattomia voi sekoittaa (*"Kant" eläin*).
- Sana on kirjainten ja numeroiden jono. Sanojen välissä saa olla mitä tahansa muuta (välilyönti, välimerkki, yhdysmerkki), ja hakusanan omat välimerkit ohitetaan: *eläin-etiikka* on kaksi sanaa. Kirjainkoolla ei ole väliä.
- Haku kattaa saman tekstin kuin kohdat (luku 4.2): ei viitenumeroita eikä sisällysluetteloa. Fraasi ei jatku kappaleesta toiseen.
- Alaviitteet ovat mukana, kun osumamäärän oikealla puolella oleva pieni kytkin *alaviitteet* on päällä (oletus; käyttäjän päätös 21.10.2026). Valinta muistetaan asetuksissa (`hakuViit`). Alaviite haetaan omana tekstinään ilman numeroa, eikä fraasi jatku siitä ympäröivään tekstiin. Osuma on listassa viitenumeron kohdalla, ja sen kohdassa lukee *alaviite n*. Valinta vie viitenumeron riville: sivutettuna alaviite avautuu ponnahduslaatikkoon kuten viitenumeroa napautettaessa, vierityksessä kapealla ruudulla se avataan tekstin sisään, ja leveällä se on valmiiksi reunuksessa. Osuma korostetaan alaviitteessä.

Osumista näytetään 200 ensimmäistä; määrä lasketaan kaikista. Osumassa on osion nimi, sivutettuna sivunumero, ja ote, jossa osuma on haalealla taustalla. Napautus (tai Enter, joka vie lukukohdasta seuraavaan osumaan) sulkee laatikon, vie osumaan ja korostaa sen tekstissä samalla taustalla. Korostus tehdään CSS Custom Highlight -rajapinnalla (`::highlight(haku)`), joka ei muuta DOMia, koska kohdat ja alleviivaukset nojaavat tekstisolmuihin; selaimessa, jossa rajapintaa ei ole, korostusta ei ole. Korostus pysyy, kunnes hakua muutetaan tai teksti suljetaan.

Avoimen tekstin viimeisin haku muistetaan (ei tallenneta). Kun laatikko avataan uudelleen, kenttä on täytetty, valittu osuma on merkitty ruosteisella viivalla ja vieritetty näkyviin, eikä kenttää kohdisteta, jotta näppäimistö ei peitä listaa; Enter vie valittua seuraavaan. Ensimmäisellä kerralla kenttä kohdistetaan, ja tyhjän kentän alla on lyhyt ohje. Kirjoittamisen aikana laatikko pysyy näkyvällä alueella näppäimistön yläpuolella (kuten kirjauksen muokkain), osumalista vierii, eikä sivunäkymää aseteta uudelleen.

### 4.8 Paluumajakka

Kun lähdeviittaus vie kirjallisuusluetteloon tai muu hyppy vie kauas, paluureitti katoaa helposti. Siksi ison hypyn lähtökohtaan jää majakka (käyttäjän pyyntö 21.10.2026): alapalkin yläpuolelle, avoimen aikajanan yläpuolelle, ilmestyy pieni laatikko *Palaa takaisin* raksin kera (mobiilissa kaistan yläpuolelle, myös palkkien ollessa kiinni), ja aikajanalla lähtökohdassa on kummitusmerkki, ontto kolmio ja katkoviiva nykyisen kohdan osoittimen tapaan. Laatikon merkki on sama ontto kolmio, ja se osoittaa paluun suuntaan (käyttäjän sääntö 21.10.2026): ylös, kun lähtökohta on tekstissä taaempana, alas, kun se on edempänä (esimerkiksi alaviitteen lyhennelinkistä alun lyhenteiden selitykseen). Suunta päivittyy myös sivua käännettäessä ja vieritettäessä, koska ne eivät poista majakkaa ja voivat viedä lähtökohdan ohi. *Palaa takaisin* vie lähtökohtaan ja poistaa majakan; sivutettuna samoin kummitusmerkin napautus aikajanalla (merkki voittaa samassa kohdassa olevan otsikon salmiakin). Vierityksessä aikajanalla ei ole magneettia, joten kummitusmerkki vain näyttää lähtökohdan.

- Majakan jättävät hypyt: tekstin linkit (lähdeviittaus, muut sisäiset linkit; ei sisällysluettelon linkki), sivutetun alaviitteen ponnahduslaatikon lähdeviittaus, aikajana, *Merkinnät*-lista, haku ja tuonnin kyltti (ja *Siirry sijaintiin*). Sivunkääntö, pyyhkäisy, näppäimet ja vieritys eivät ole hyppyjä.
- Iso hyppy on sivutettuna vähintään kaksi sivua ja vierityksessä vähintään kaksi ruudullista. Lisäksi hypyn pitää olla vähintään puolen kirjan mittainen (osuus kirjan koko pituudesta; käyttäjän päätös 22.10.2026, koska lyhyemmän matkan pääsee takaisin kuin itsestään; luopumista majakasta kokonaan harkitaan). Sisällysluettelon linkki ei jätä majakkaa koskaan. Lähemmäs pääsee takaisin yhdellä sivunkäännöllä.
- Majakka katoaa vain raksista, paluusta, tekstin napautuksesta tai uudesta isosta hypystä, jonka lähtökohdasta tulee uusi majakka. Tekstin napautus poistaa sen ennen kuin napautus käsitellään, joten sivutettuna myös reunan napautus sivunkääntönä poistaa sen; pyyhkäisy, sivunapit ja näppäimet eivät. Palkkien avaus alakaistasta ei poista majakkaa, koska kaista ei ole tekstiä (majakka näkyy avautuvalla aikajanalla).
- Peräkkäiset hakuosumat säilyttävät haun ensimmäisen lähtökohdan, jotta haun jälkeen pääsee takaisin sinne, mistä haku alkoi.
- Vierityksessä majakka muistaa tarkan vierityskohdan, ja paluu vierittää siihen, jos asettelu on ennallaan (sama korkeus ja leveys). Muuten paluu menee kohdan rivin mukaan kuten tallennettu lukukohta. Ankkuri ei riitä yksin: jos ruudun ylimmän rivin kohdalla on lohkojen väli (esimerkiksi sisällysluettelo), ankkuri on seuraava lohko, ja `mene()` vierittäisi sen ylös (mitattu 375 px).
- Majakkaa ei tallenneta; se koskee vain avointa tekstiä tällä lukukerralla.

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

Kuusi väriä kummassakin teemassa: paperi, muste, harmaa, viiva, ruoste ja okra. Ei läpikuultavuutta eikä varjoja, koska e-ink näyttää ne rasteroituina. Ruoste on viitenumeroiden, kirjanmerkkien ja sisällysluettelon väri (ruoste = napautettava), okra alleviivausten. Ruoste on ruskehtavaa eikä punertavaa; tummassa teemassa paperi on lähes mustaa, jotta himmeähkö ruoste erottuu siitä. Alaviitteiden teksti on hiukan harmaata vaaleampaa (`--huomio`, kontrasti paperiin silti yli 4,9), jotta aina näkyvät sivuhuomiot väistyvät leipätekstin tieltä muttei häviä e-inkillä taustaan. Otsikkolohkon tietorivit (`.meta`) ovat kursiivia.

### 6.2 Logo

Ylärivi *LUiN.* on korkeaa, tiivistä antiikvaversaalia (versaalikorkeus 100, paksu runko 15, hiusviiva 3,4). i:n piste ja loppupiste ovat salmiakkeja, joiden kyljet ovat hieman koverat. Niiden välillä on glissando: viiva lähtee i:n pisteen oikeasta kulmasta, leikkaa N:n vinoviivan ja päättyy loppupisteen vasempaan kulmaan. i:n pisteen oikea yläsärmä ja loppupisteen vasen alasärmä ovat suoria ja samassa kulmassa kuin viiva, joten viiva jatkaa niitä ilman porrasta.^[Tiiviillä N:llä vinoviiva on niin jyrkkä, ettei viiva voi kulkea vinoviivaa pitkin: i:n piste nousisi kauas versaalien yläpuolelle. Generaattorin `glis()` ratkaisee viivan kaltevuuden, kun pisteiden paikat on annettu; salmiakkien korkeus seuraa kaltevuudesta. Parametrit (`sulje`, `py`, `yd`, `c`) ovat tiedostossa `luin/kehitys/logo.js`.] Loppupisteen sivukärjet ovat perusviivalla, joten viiva laskeutuu kirjainten alareunan tasolle ja loppupiste roikkuu hiukan perusviivan alapuolella. Viivan alareuna kulkee N:n oikean kuopan pohjan kautta, joten viivan alle ei jää rakoa; tämä ratkaisee viivan kulman ja loppupisteen vaakapaikan. i:n piste on ruosteinen, muu tekstin värinen. Alarivi *HTML* on ohutta matalaa versaalia, levitettynä L:n vasemmasta reunasta N:n oikeaan reunaan; loppupisteen alle se ei ulotu. Ääripäät ovat teräviä: H:n vasemmat päätteet alkavat L:n kohdalta, ja pienen L:n alaviivan päässä on samanlainen pystypääte kuin ylärivin L:ssä.

### 6.3 Kirjasimet

Teksti on Literataa, joka on suunniteltu e-lukulaitteille. Viitenumerot ovat laitteen omaa groteskia (Roboto, San Francisco) kuten aiemmissa html-versioissa. Groteskia ei voi enää valita tekstin kirjasimeksi (luku 4.5).

## 7. Lähdeviite ja jakaminen

Lukulistan logon oikealla puolella on salmiakkikehyksinen i-nappi, joka avaa yhden virkkeen esittelyn. Lukulistan nimikkeen oikeassa reunassa on pieni jakonappi. Sen valikosta voi kopioida lähdeviitteen, kopioida linkin (verkkotekstille) tai poistaa nimikkeen listasta. Viite kopioidaan sekä tekstinä että HTML:nä, jolloin kursiivi säilyy esimerkiksi Wordiin liitettäessä.

Muoto on johdettu tutkielman kirjallisuusluettelosta (Helsingin yliopiston teologisen tiedekunnan APA-sovellus):

> Juutilainen, Olli (2026). *Kant ja eläinetiikka: muulajisten arvokkuutta etsimässä*. Uskonnonfilosofian kandidaatintutkielma. Helsingin yliopisto. HTML-versio: https://… (luettu 20.10.2026).

Päivämäärä on tekstin viimeisin avaus tällä laitteella. Osoite on Luin-linkki, jos teksti on verkossa; paikallisella tekstillä osoitetta ei ole.^[Sitaattisääntöjä Clauden projektikansioista ei voitu lukea tästä istunnosta. Muoto on päätelty tutkielman omasta lähdeluettelosta, ja se on yhdessä funktiossa (`viite` luin.html:ssä), joten sen voi vaihtaa helposti.]

## 8. Testaus

Luin on testattu Playwrightilla Chromiumissa. Toistettava testi:

```
NODE_PATH=$(npm root -g) node luin/kehitys/testi.js teksti.md [kuvakansio]
```

Skripti käynnistää oman tiedostopalvelimen, syöttää tekstin avaimeen `luin-tuonti`, avaa `luin.html#tuo` ja mittaa rakenteen, leikkautuvat rivit jokaisella sivulla, jokaisen sivun kohdan paluun samalle sivulle, kirjasinkoon muutoksen ja paluun, alleviivauksen säilymisen, automaattisen alleviivauksen (myös piilotettuna), kirjauksen tallennuksen ja viennin, merkintöjen tuonnin (vienti edistymisen kanssa, tyhjennys, tuonti tiedostonvalinnasta: samat kohdat, kuittaus peittää Tuo-napin ja sen kyltti vie sijaintiin), aikajanan hypyn, jokaisen sivun alun (`sivunAlku()` vie samalle sivulle), aikajanan vedon (kohta ja sivu pysyvät vedon ajan, sivutettuna osoitin vain pysäkeille, myös aikajanalta piilotettujen alalukujen kohdalle; vierityksessä napautus merkin vieressä vie suhteelliseen kohtaan), haun (osumien määrä on sama kuin riippumattomalla säännöllisellä lausekkeella neljällä hakutavalla, myös alaviitteiden kanssa; valittu osuma on sivulla ja korostettu; Enter vie seuraavaan), alaviitteen osuman (sivutettuna ponnahduslaatikossa korostettuna, vierityksessä avattuna ja näkyvissä; kytkin pois ja päälle) vierityksen kohdan pysyvyyden, paluumajakan (iso hyppy jättää majakan ja kummitusmerkin, nuoli osoittaa ylös, paluu vie samaan kohtaan, pieni hyppy ei jätä majakkaa), alaviitteen lyhennelinkin (vie lyhenteen selitykseen, nuoli osoittaa alas, paluu vie takaisin) ja palkit: mobiilissa (kosketusnäyttö, 412 px) vanha tallennus (`av: 4`) saa sivunapit pois, tekstin napautus ei avaa palkkeja, alakaistan napautus avaa ja sulkee yläpalkin ja aikajanakerroksen ja palkkinuoli kääntyy ja täyttyy, vieritys ei vaikuta, sivutettuna keskikolmannes ei avaa, sivunapit ja reunan napautus kääntävät sivua palkkien pysyessä auki, kaistan keskikohta sulkee, palkkien avaus ei poista majakkaa, kirjanmerkki ja nuoli ovat palstan reunojen linjassa (0 px), sivunapit 12 px nuolesta ja Merkinnät/Etsi ilman sivunappeja välin keskellä, sivunappien kanssa 12 px kirjanmerkistä, sivunvaihtopainikkeiden kytkin on 16 px Sivut-vaihtoehdon salmiakin oikealla puolella ja kytkee napit; 360 px:llä leveällä marginaalilla ja sivunapeilla Merkinnät ja Etsi eivät mene kelluvien päälle; sivunapit ovat Merkinnät-laatikon korkuiset; työpöydällä (1280 px) palkit näkyvät, alapalkissa on vain edistyminen, tekstin napautus ei avaa aikajanaa (sivutettuna keskiklikkaus ei tee mitään, reunaklikkaus kääntää sivua), palkin napautus avaa ja sulkee sen, ja 690 px:n hiiri-ikkuna on työpöytä. Jokaisen `a.lahde`-linkin kohteen pitää olla kirjallisuusluettelon kohta tai lyhenteen selitys. Sivu antaa testeille koukun `window.__luin` (asetukset, tila, nykyinen kohta, `mene()`, `hyppaa()`, `majakka()`, `sivunAlku()`, `valinta()`, `etsi()`).

Mitattu 20.10.2026 kandidaatintutkielmalla:

- Rakenne vastaa aiempaa html-versiota: samat otsikkotunnisteet, 6 `##`- ja 8 `###`-otsikkoa, 8 lainausta, 21 lähdettä. Alaviitteitä on 52 (vanhassa versiossa 53; md on uudempi).
- Sivutettuna 412 × 824 px: 55 sivua, ei yhtään sivun alareunan yli menevää riviä. Jokaisen sivun kohta vie takaisin samalle sivulle (myös 21 px tiheällä tavutuksella, 66 sivua, ja 1280 × 800 px, 37 sivua). Koon muutos 19 → 22 → 19 px palauttaa saman sivun.
- Vierityksessä luettu kohta pysyy samana, kun siihen palataan (kolme kokoonpanoa).
- Alleviivaus säilyy uudelleenlatauksessa; jakovalikon viite päätyy leikepöydälle.

Kirjanmerkin paikka mitattu 21.10.2026 (412 × 824 px, molemmat tekstit, kirjanmerkki joka lohkon alussa, sivutettuna ja vierityksessä): oletuskoossa 19 px jokainen nauha on yläpuolella tai sisennyksessä eikä yksikään osu tekstiin; ainoa poikkeus on sisennystilassa kappaleeseen kiinni oleva koodilohko, jonka nauha on reunuksessa. Myös 26 px:n koossa (375 × 700) ja 1280 × 900 -ikkunassa kaikki ovat yläpuolella tai sisennyksessä. Alle 18 px:n koossa tiheät välit eivät riitä: 17 px:ssä kirjallisuusluettelon merkinnät ja 15 px:ssä lisäksi väliotsikon jälkeiset kappaleet ja luettelon kohdat saavat nauhan reunukseen. Piirto 11 kirjanmerkillä vierityksessä 1,2 → 3,1 ms päivitystä kohden.

Mitattu 21.10.2026 (375 × 760 px): valintavalikko mahtuu yhdelle riville (293 px), kirjanmerkkinauha on 12 × 20 px ja sen ylä- ja alapuolella on 10 px. Viennin kaikki valintayhdistelmät tuottavat yllä kuvatun muodon. Virkkeen poiminta: 149 kirjanmerkkiä 23 merkin välein kuuteen kappaleeseen, jokainen lainaus on kappaleen virke, joka sisältää kirjanmerkin kohdan. Kun ikkunan korkeus pienenee kesken kirjauksen (näppäimistö), muokkain pysyy auki ja näkyvissä, ja sivunäkymä palaa samalle sivulle.

Haku mitattu 21.10.2026 tutkielmalla (ennen alaviitteitä): *kant* 118 osumaa, *"kant"* ja *”Kant”* 39, *kantil* 24. Ponnahduslaatikko mahtuu 412 × 824 ja 375 × 760 px:n ikkunaan Etsi-laatikon yläpuolelle; kun ikkunan korkeus pienenee 420 px:iin kesken haun, laatikko pysyy auki ja näkyvissä ja sivu ennallaan.

Palkit mitattu 22.10.2026 (kandidaatintutkielma ja tämä opas, kaikki testit läpi): työpöydällä (1280 × 800) kuvakaappauksista muuttui vain alapalkin osion nimen ja natsan alue, sivuja edelleen 37. Mobiilissa (412 × 824) sivutetun tutkielman sivumäärä laski 57:stä 53:een, koska yläpalkki ei enää vie tilaa. Isommilla sivunapeilla (44 × 34 px) *Merkinnät* ja *Etsi* mahtuvat kelluvien väliin 412 px:llä (väli 34 px kummallekin puolelle), mutta 360 px:llä (LP3:n leveys) sivutettuna ne ovat omalla rivillään.

Testaamatta: oikeat Boox-laitteet (myös sivunkääntönäppäimet; testattu vain selaimen näppäintapahtumilla), haun korostus Boox-laitteiden WebView-versioissa, Safari, oikea Dropbox-linkki, kosketusvalinta oikealla Androidilla (sukkela alleviivaus), oikea virtuaalinäppäimistö ja tiedoston lataus Boox-laitteiden selaimissa.

## 9. Avoimet kysymykset

### 9.1 Käyttöönotto

Tekstit voisi säilyttää samaan tapaan kuin keikat: KV-avain `teksti:<tunnus>` ja workerin reitti, jolloin linkki olisi lyhyt `luin.html#<tunnus>`. Toinen tapa on repo (`luin/tekstit/`), mutta se on julkinen. Kolmas on Dropbox-linkki (`#u=`).

### 9.2 Sanakirja

Pitkän painalluksen suomi–suomi-sanakirja vaatii kaksi asiaa: perusmuodon (taivutetusta sanasta) ja määritelmän. Perusmuodon saisi Voikosta (WebAssembly-käännös, useita megatavuja), määritelmän esimerkiksi suomenkielisestä Wikisanakirjasta, jonka rajapinta sallii selainhaut. Android-kääreessä (kuten KEICK•WALKissa) voisi käyttää myös laitteen sanakirjasovellusta.

### 9.3 Muuta myöhemmäksi

- Kahden sivun aukeama leveällä näytöllä.
- Alleviivaukset aikajanalla.
- Merkintöjen synkronointi laitteiden välillä.
- Groteski kirjasin, jos koko ohjelman ulkoasu sovitetaan siihen.
- Lukulistan tuonti ja vienti tiedostona.
