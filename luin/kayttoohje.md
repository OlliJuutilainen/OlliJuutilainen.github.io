---
tekijä: Tusinasoft
viite: Tusinasoft (2026). *Lukimen käyttöohje*.
---

# Lukimen käyttöohje

*Pino, lukeminen, latomo ja lukimeen-lisäosa*

Tusinasoft\
marraskuu 2026

> [!huomautus]- TEKOÄLYVAROITUS [viesti kehittäjältä]; 27.11.2026
>
> Hyvät lukimen käyttäjät. Luin-työkalu ja sitä ympäröivä kokonaisuus ei olisi voinut tällaisenaan syntyä ilman tekoälytyökalujen vipuvartta. Ohjelma on kaikesta huolimatta kuitenkin kohtalaisen paljon minun näköiseni, ja suuri osa ominaisuuksista ja ratkaisuista on kuitenkin saanut vatkautua miljoona kertaa oman sipulini kautta.
>
> Vaikka himmeli on syntynyt häikäisevän nopeasti ja verrattain vaivattomasti, on työmäärä ollut toisaalta myös … verrattain suuri – etenkin huomioon ottaen, että homma liittyy pääasiallisiin elämän toimiini vain epäsuorasti.
>
> Koska ohjelmaan on vuodattunut sydämestä aivan hirvittävä määrä ominaisuuksia, ne ansaitsisivat tulla ymmärretyiksi, mikä vaatisi selkeää alkuun pääsemisen ohjeistusta sekä myös perusteellista ohjekirjaa. Ikävä kyllä juuri tuo suuri ominaisuuksien määrä tekee ohjeiden laatimisesta kenties vielä itse ominaisuuksien kehittämistä suuremman homman: ainakin minun luonteelleni.
>
> Suoraan sanoen en usko, että saan motivoitua itseäni uhraamaan hyvien ohjeiden laatimiseen vaadittavaa aikaa edes tulevan vuoden aikana tai kuka ties kenties koskaan. Jos luin ottaa omituisesti tuulta alleen, motivaationi laittaa asia kuntoon kohenee toki merkittävästi.
>
> Ohjelman tekoälykirjoitettuun koodiin nähden täysin tekoälygeneroitu proosateksti vasta on se suoranainen häpeäpilkku. Tarjoan tutustuville käyttäjille kuitenkin tämän täysin tekoälyllä muodostetun ohjeen. Ohje kuitenkin epäsuorasti sisältää minunkin ajatuksiani, ja varmasti kärsivällinen ihminen saa siitä pumpattua jotain irti.
>
> Jos olet innostunut käyttämään lukinta ja jokin ominaisuus mietityttää, kehottaisin olemaan matalalla kynnyksellä minuun yhteydessä sen sijaan, että yrittäisit epätoivoisesti etsiä tietoa alla olevasta ohjeesta. Suoraan kysymykseen ja kymmeneen vastaaminen on kuitenkin minulle satoja kertoja pienempi vaiva kuin saada mikään edes kelvollisesti läpivalaistu versio tästä manuaalista.
>
> Yhteydenottoonkin on kynnyksensä, tiedän sen. Mutta minä olen nyt puhunut.
>
> Hyviä lukemisia. Lukekaa ennemmin jotain Luinin hakemistosta kuin tätä manuaalia, sen sanon.
>
> –Olli

## 1. Aluksi

### 1.1 Mikä luin on

LUiN.HTML eli luin on internetin lukemisen tyyssija. Se kokoaa verkosta löytyvät ja itse ladotut tekstit yhteen paikkaan, pinoon, ja näyttää ne kirjan tapaan: lukukohta säilyy, otsikot näkyvät aikajanalla merkkipaaluina, alaviitteet avautuvat numerostaan, ja tekstiin voi tehdä kirjanmerkkejä, alleviivauksia ja kirjauksia.

Luin toimii selaimessa puhelimella, sähköpaperinäytöllä, tabletilla ja tietokoneella. Tunnuksia ei tarvita, eikä niitä voi luoda. Pino, lukukohdat, merkinnät ja asetukset tallentuvat siihen selaimeen, jossa luet. Mitään ei lähetetä minnekään, ellet itse ota käyttöön postihuilua (luku 9) tai pyydä sanaselitystä tai lausekäännöstä (luku 7).

Iloa on kahdenlaista. Kirjoittaja voi jakaa oman epäkaupallisen tekstinsä lukimessa luettavaksi, eikä lukijan tarvitse olla valmiiksi lukimen käyttäjä. Lukija taas saa verkon pitkät tekstit luettavaksi samalla mukavuudella kuin sähkökirjan: tekstin voi poimia talteen heti ja lukea myöhemmin, ja lukeminen jatkuu siitä, mihin edellisellä kerralla jäi.

### 1.2 Osat ja nimet

- **Pino** on lukimen etusivu: luettavat ja kesken olevat tekstit, enintään tusina kerrallaan.
- Pinosta teksti avautuu **lukimeen** eli lukunäkymään. Pino ja lukunäkymä ovat samalla sivulla, `luin.html`.
- **Kellarin veivihyllystö** on pinon alla. Sinne laskeutuvat tekstit, joihin et ole hetkeen koskenut, ja sinne voit siirtää luetut. Vielä syvemmällä on **ö-mappi**, ja kellarin veivihyllystön ylimpänä on **käsikirjasto** teksteille, joihin palaat aina uudelleen.
- **Latomo** tarkistaa ja latoo tekstin lukimeen: oman tekstisi tai verkosta leikatun.
- **Lukimeen** on selainlisäosa, joka leikkaa avoimen verkkosivun artikkelin latomon kautta pinoon. Juoksevassa tekstissä sitä kutsutaan lukimeen-lisäosaksi.
- **Postihuilu** kuljettaa tekstit ja halutessasi merkinnät laitteelta toiselle. Avaimena on itse keksitty tai arvottu **laatikkolause**.
- Lisäksi on tuettujen sivustojen lista *Lukimessa luettavaa*, sanaselitys omana sivunaan, palautelomake ja Android-sovellus.

### 1.3 Suljettu lukuympäristö

Luin on tehty lukemisen rauhaan. Tekstissä ei ole mainoksia, ponnahduksia eikä suosituksia. Linkit muille sivuille ovat oletuksena pois päältä, joten napautus ei vie vahingossa pois tekstistä. Kuvat näkyvät pelkkinä linkkeinä, koska luin ei hae mitään kolmannelta osapuolelta. Lukiessa verkkoa käyttävät vain sanaselitys ja lausekäännös, ja nekin vain silloin, kun napautat niitä.

Ulkoasu on klassinen ja hillitty: antiikvakirjasin (Literata), kuusi väriä teemaa kohti, ei varjoja, ei läpikuultavuutta eikä animaatioita, jotta sähköpaperikin näyttää kaiken siististi. **Ruosteenvärinen on napautettavaa.** Valinnat, luettelomerkit ja kunniamerkit ovat salmiakkeja, ja tietoa antavien i-nappien kehyksenä ovat hakasulkeet.

### 1.4 Tästä ohjeesta

Tämä ohje on itsekin lukimessa luettava teksti, joten sillä voi kokeilla kaikkea, mitä se kuvaa: aikajanaa, Sisälmystä, hakua, alleviivausta ja alaviitteitä.[^Tämä on alaviite. Leveällä näytöllä rullatessa se näkyy valmiiksi tekstin oikealla puolella, muuten se avautuu numerostaan.]

Napit, valinnat ja kentät on kirjoitettu kursiivilla niin kuin ne näkyvät ruudulla, esimerkiksi *Poimi pinoon*. *Napauta* tarkoittaa hiirellä klikkausta. Kosketusnäytön ja hiiren erot kerrotaan siellä, missä niitä on. Sähköpaperilaite on lukimelle kosketusnäyttö.

Kiireiselle on erillinen pikaohje (pinon alla linkki *Pikaohje*). Sanasto lukimen omista sanoista on liitteenä tämän ohjeen lopussa.

## 2. Tekstit pinoon

Tekstin voi tuoda pinoon luin-linkistä, lukimeen-lisäosalla, latomosta, postihuilusta tai Android-sovelluksen jakovalikosta. Kaikki tavat päätyvät samaan pinoon, ja luin muistaa, mistä teksti tuli.

### 2.1 Luin-linkki

Luin-linkki avaa verkossa olevan Markdown-tiedoston suoraan lukimeen. Se on lukimen osoite, jonka perässä on `#u=` ja tiedoston osoite, esimerkiksi `luin.html#u=luin/mika-on-markdown.md`. Teksti tallentuu pinoon, ja myöhemmin se avautuu pinosta, vaikkei verkkoon olisi yhteyttä. Kun avaat saman linkin uudelleen, luin hakee tekstin uusimman version, ja kirjanmerkit ja alleviivaukset pysyvät.

Dropboxin jakolinkki kelpaa sellaisenaan: luin muuttaa sen suoraksi latauslinkiksi. Google Driven linkit eivät toimi, koska Drive ei salli selaimen hakua toiselta sivustolta.

Jaettavan linkin saa pinosta nimikkeen valikosta (*Kopioi linkki*, luku 12.1). Sen esikatselu näyttää viestimissä tekstin nimen eikä pelkkää lukimen nimeä.

### 2.2 Lukimeen-lisäosa

Lukimeen-lisäosa poimii avoimen verkkosivun artikkelin lukimeen. Sen saa

- Chrome-pohjaisiin työpöytäselaimiin (kuten Chrome, Brave, Edge ja Vivaldi) Chrome Web Storesta,
- Firefoxiin, myös Androidilla, ladattavana lisäosatiedostona (`luin/lisaa-lukimeen.xpi`).

Linkit kumpaankin ovat latomon alussa kohdassa *Lukimeen*. Androidin Chrome ja Brave eivät tue lisäosia; Androidilla lisäosa toimii siis vain Firefoxissa.

Kun sivulla on luettavaa, napauta selaimen työkalupalkissa lukimeen-lisäosan salmiakkia. Ikkuna lukee sivun ja näyttää sivuston nimen sekä sanojen ja alaviitteiden määrän. Nappi *Poimi lukimeen* leikkaa artikkelin ilman valikkoja, mainoksia ja muuta sivun tilpehööriä, latoo sen latomossa ja avaa sen lukimessa. Teksti tallentuu tämän selaimen pinoon, luitpa sitä heti tai et.

Jos olet maalannut sivulta osan tekstiä, ikkunassa on valinta *Vain valittu kohta*. Silloin poimitaan vain valinta, esimerkiksi yksi luku pitkältä sivulta.

*Poimi lukimeen* -napin alla on pieni plussa. Se avaa lisänapit, ja valinta muistetaan:

- *Säädä latomossa* vie leikkeen latomoon, jossa voit tarkistaa ja muokata tekstiä ja sen tietoja ennen kuin siirrät sen lukimeen (luku 10).
- *Lataa .md* antaa latomon latoman tekstin Markdown-tiedostona. Latomo käy työssä taustavälilehdellä ja sulkeutuu itsestään (Androidin Firefoxissa se avautuu eteen ja jää auki).
- *Postihuilu* lähettää tekstin postihuilulla toisiin laitteisiisi (luku 9). Kirjoita laatikkolause tai arvo uusi napista *Arvo*, ja paina *Soita huilua!*. Valinta *Lisää tämän selaimen pinoon heti* (oletuksena päällä) tuo tekstin myös tämän selaimen pinoon; ilman sitä teksti menee vain laatikkoon. Lisäosa muistaa lauseen. Ikkunan i-nappi kertoo laatikkolauseen säännöt.

Perseus Digital Libraryn sivulla ikkunassa on ennen poimintaa kaksi lisävalintaa. *Kielet*: alkuteksti ja englanninkielinen käännös lomitettuna, pelkkä alkuteksti tai pelkkä käännös (vain kun Perseus tarjoaa käännöksen). *Kirjat*: yksi, useampi tai kaikki kirjat, ja useampi *yhdeksi tekstiksi* tai *kukin omaksi tekstikseen*. Koko klassikko kerralla voi olla raskas hitaalle laitteelle. Jos teksti tökkii, poimi pienempi paketti: yksi kieli tai kirja kerrallaan.

Avoimen Kalevalan (kalevala.finlit.fi) runon sivulta poimitaan se runo, runoluettelon sivulta (*Runot*) koko Kalevala. Sananselitykset, kommentaarit, Lönnrotin omat alaviitteet ja käsikirjoituksen erot tulevat alaviitteiksi, joten koko Kalevala on raskas hitaalle laitteelle: runo kerrallaan on kevyempi. Saman palvelimen Kantelettaresta poimitaan avattu osa kokonaan. Henrik Ibsens skrifterin näytelmän kommentaari haetaan palasina (*Peer Gyntissä* niitä on 1 800), joten poiminta kestää hetken.

### 2.3 Mitä leike tuo mukanaan

Leikkeessä ovat otsikko, tekijä, sivusto ja julkaisuaika, mikäli sivu kertoo ne, sekä artikkelin alaviitteet ja kirjallisuusluettelo. Lisäksi luin lisää tekstiin muutaman asian, jotka eivät ole lähteessä samassa muodossa:

- **Lähde.** Tekstin lopussa on otsikon *Lähde* alla, miltä sivustolta ja milloin teksti on haettu, sekä sen osoite. Lähteen kunnioitus kuuluu lukimen periaatteisiin, joten osiota ei voi poistaa.
- **Tekijänoikeudet.** Jos sivu kertoo tekstin käyttöoikeuksista, ne ovat Lähteen jälkeen otsikon *Tekijänoikeudet* alla: merkintä sellaisenaan, lyhyt selitys ja linkki lisätietoihin.
- **Rahoitushuomautus.** Joidenkin tuettujen sivustojen tekstin alussa on hakasulkeissa huomautus siitä, miten sivusto rahoittaa toimintansa. Jos sivusto elää lahjoituksista, huomautus ehdottaa harkitsemaan lahjoitusta.
- **Julkaisun tila.** Jos lehti on vetänyt artikkelin takaisin tai julkaissut siihen korjauksen tai päivityksen tai teksti on esipainos, jota ei ole vertaisarvioitu, tekstin alussa on siitä huomautus ilmoituksen osoitteineen.
- **Lukimen omat huomautukset.** Mitä luin ei voi näyttää, siitä se kertoo hakasulkeissa harmaalla kursiivilla: kuvana julkaistun kaavan paikalla on *[kaava]*, kuvana julkaistun taulukon kuvatekstin perässä *[Taulukko on lähteessä kuvana.]*. Sivun merkintöinä olevat kaavat tulevat tekstinä ala- ja yläindekseineen, ja numeroitu kaava on omalla rivillään keskellä.

### 2.4 Tuetut sivustot

Lukimeen-lisäosa leikkaa minkä tahansa artikkelisivun yleisin keinoin, mutta yli sadalle sivustolle sillä on oma sovitteensa. Niiltä teksti tulee siistimpänä: alaviitteet oikeille paikoilleen, kirjallisuusluettelo luettelona, sivuston nostolainaukset ja muut sivupalkit pois, ja joskus koko kirja luvun sivulta.

Lista on sivulla *Lukimessa luettavaa*. Sinne pääsee pinon alalaidan linkistä *LUETTAVAA* ja latomon lisäosarivin plussan takaa.

- **Haku.** Kenttä *Etsi sivustoa tai otsikkoa* etsii sivuston nimestä ja kuvauksesta. Kolmannesta kirjaimesta alkaen se etsii myös noin 150 000 tekstin nimestä, jotka on kerätty tuetuilta sivustoilta (myös Project Gutenbergin kirjat). Osumat näkyvät sivustoittain, yksi rivi sivustoa kohden osumien määrineen; rivin napautus avaa sivuston osumat 25 kerrallaan (*näytä lisää*), ja toinen napautus sulkee. Osuma avaa tekstin sivustolla uuteen välilehteen, josta sen voi poimia lukimeen. Rivi *otsikko · tekijä · asiasana* rajaa, mistä kentistä hakusanaa etsitään.
- **Korit.** Hakukentän alla on kolme riviä koreja: aihe (esimerkiksi filosofia, uskonto, antiikki, yleiset), laji (alkuteksti, tutkimus, essee, hakuteos…) ja kieli. Rivit ovat aluksi supistettuina: rivin nimen napautus avaa sen ja toinen supistaa, ja supistetulla rivillä näkyvät vain valitut korit. Korin ensimmäinen napautus ottaa sen mukaan (alleviivattu), toinen jättää sen pois (yliviivattu) ja kolmas palauttaa ennalleen. Korin luku kertoo, montako sivustoa tai otsikko-osumaa siinä on.
- **Supersalmiakki.** Ruosteinen salmiakki nimen vasemmalla puolella merkitsee Luinin sertifioimaa sivustoa, jonka tekstit Olli on itse käynyt läpi: Stanford Encyclopedia of Philosophy, Wikipedia (suomeksi ja englanniksi), Marxists Internet Archive, Ensyklopedia Logos, J. V. Snellmanin kootut teokset ja Perseus Digital Library. Korien alla, kielirivin alapuolella, on pelkkä salmiakki, joka toimii kuten kori: ensimmäinen napautus näyttää vain nämä sivustot (ja otsikkohaun osumatkin vain niiltä), toinen jättää ne pois ja kolmas palauttaa ennalleen. Valinnan aikana salmiakin oikealla lukee himmeästi, mitä se rajaa, ja pois jätettäessä sama teksti on yliviivattu.

Puuttuuko suosikkisi? Sivustoa voi ehdottaa palautesivulla. Maksumuurien kiertämistä luin ei tarjoa: Luinin ystäviä ovat ensisijaisesti omaa tekstiä epäkaupallisesti jakavat ihmiset, tekijänoikeusvapaan tekstin jakaminen ja omaan käyttöön ostetun tekstin lukeminen.

### 2.5 Latomosta

Oman tekstin voi liittää latomoon pelkkänä tekstinä tai Markdown-tiedostona ja avata sen lukimessa napista *Avaa lukimessa*. Latomo on esitelty luvussa 10 ja Markdown-merkinnät luvussa 11. Latomoon pääsee pinon alalaidan linkistä *Uusi teksti latomossa*.

### 2.6 Postihuilusta

Kun laatikkolause on annettu asetuksissa, toisesta laitteesta tai latomosta samaan laatikkoon lähetetyt tekstit tulevat pinoon itsestään aina, kun avaat pinon. Postihuilu on esitelty luvussa 9.

## 3. Pino

### 3.1 Pinon näkymä

Ylhäällä vasemmalla on logo LUiN.HTML. Logo on lukimen kaikilla sivuilla linkki pinoon. Sen vieressä on i-nappi, joka avaa infolaatikon: lyhyt esittely kirjoittajalle ja lukijalle, sanoja postihuilusta ja lukimeen-lisäosasta sekä linkki palautteeseen. Oikeassa yläkulmassa on asetusten kiekko (luku 8).

Otsikon *Pino* alla ovat tekstien nimikkeet. Nimikkeessä on

- **tekstin nimi**, jonka perässä voi olla kaksi pientä merkkiä. Harmaa sivun kuva (sama kuin lukimen *Merkinnät*-napissa) kertoo, että tekstissä on kirjanmerkki, alleviivaus tai kirjaus; kun viet hiiren sen päälle tai napautat sitä, ponnahdus kertoo, mitä merkintöjä on. Pieni vino huilu kertoo, että teksti tuli postihuilusta eikä sitä ole vielä avattu tässä selaimessa.
- **lisätieto**: verkkojulkaisun sivusto (esimerkiksi Stanford Encyclopedia of Philosophy), muuten alaotsikko, kirjan osalla teos tai tekijä.
- **tietorivi**: laitos (*2. laitos*, luku 10.9), tekijä tai sivusto, luettu osuus prosentteina ja päivä, jolloin viimeksi avasit tekstin.

Nimikkeen napautus avaa tekstin siitä kohdasta, mihin jäit. Nimikkeen vasemmalla puolella on valinnan salmiakki (luku 3.5) ja oikealla kolmen salmiakin nappi, joka avaa nimikkeen valikon (luku 3.4).

Tyhjässä pinossa lukee, mistä tekstit tulevat.

### 3.2 Tusina

Pinossa on enintään tusina eli 12 tekstiä. Pinoa ei tarvitse siivota: kun sinne tulee kolmastoista teksti, se teksti, johon olet pisimpään ollut koskematta, laskeutuu kellarin veivihyllystöön. Luin kertoo siitä nimeltä. Laskeutuneen tekstin tietorivillä lukee *laskeutui* ja päivä, ja sen saa takaisin pinoon kellarin veivihyllystön nimikkeen valikosta (*Poimi pinoon*). Mitään ei poisteta.

### 3.3 Pinon järjestys

Pinossa ylimpänä on teksti, jonka viimeksi avasit tai joka viimeksi tuli pinoon. Postihuilun kautta tullut teksti on samanarvoinen kuin avattu. Pölyttyneet tekstit (luku 4.7) ovat pohjalla. Pinoa ei voi lajitella, eikä luokittelu näy siellä: järjestäminen tapahtuu kellarin veivihyllystössä (luku 4.2).

### 3.4 Nimikkeen valikko

Nimikkeen valikossa on kolme pääkohtaa: **ULOSTUS**, **SISUSTUS** ja **HYLLYTYS**. Kukin avaa oman alavalikkonsa. Kun tilaa on, alavalikko avautuu pääkohtien oikealle puolelle (hiirellä myös viipymällä kohdan päällä), muuten pääkohtien tilalle, ja ylärivin nuoli palaa pääkohtiin. ULOSTUS ja SISUSTUS ovat samat pinossa, kellarin veivihyllystössä ja ö-mapissa; HYLLYTYKSEN kohdat riippuvat siitä, missä teksti on.

Valikko mahtuu aina ruudulle. Jos se on ruutua korkeampi, se vierii sisältä, ja alareuna leikkaa napin puoliksi merkiksi siitä, että valikko jatkuu. Napautus valikon ohi vain sulkee sen: se ei avaa linkkiä eikä paina nappia. Tämä koskee kaikkia lukimen ponnahduksia.

#### 3.4.1 ULOSTUS

- **Lähdeviite** ylimpänä. Viite on tekstin oma, tai luin kokoaa sen tiedoista Teologian tyylin mukaan (luku 10.5). Sen alla oleva kytkin *Lisää: luettu HTML-versiona* lisää viitteen perään, milloin luit tekstin ja verkosta avatulle tekstille mistä osoitteesta. Valinta muistetaan, ja se koskee myös merkintöjen viennin otsikkoa.
- **Kopioi lähdeviite** kopioi viitteen tekstinä ja muotoiltuna, joten kursiivi säilyy esimerkiksi tekstinkäsittelyohjelmaan liitettäessä.
- **Kopioi linkki** antaa jakolinkin verkosta avatulle tai tiedostoon linkitetylle tekstille (luku 12.1). Linkittömällä tekstillä sen paikalla on **Linkitä tiedostoon** (luku 12.2).
- **Lataa .md** lataa tekstin Markdown-tiedostona etukenttineen. Tiedoston voi avata missä tahansa tekstieditorissa tai viedä verkkoon ja jakaa.
- **Vie merkinnät** avaa laatikon *Vie merkinnät tekstitiedostoon*: valitse alleviivaukset, kirjaukset, kirjanmerkit ja edistymisen tilanne, ja saat tekstin merkinnät Markdown-tiedostona (luku 6.9). Tekstiä ei tarvitse avata.
- **Huiluta laatikkoon** lähettää tekstin postihuilun laatikkoon, josta se kantautuu toisten laitteittesi pinoihin (luku 9.3).

#### 3.4.2 SISUSTUS

- **Luokittele** antaa tekstille asiasanoja, ajoituksen ja paikan käsikirjastossa (luku 4.3).
- **Muuta metatietoja** avaa tekstin latomoon, jossa voit muuttaa sen nimeä, kirjoittajaa ja julkaisutietoja. Itse teksti on silloin lukittu (luku 10.9).
- **Lado uusi laitos** antaa muokata myös tekstiä. Tallennettaessa valitset, tuleeko pinoon toinen laitos merkintöineen, toinen laitos ilman merkintöjä vai korvaava laitos (luku 10.9).

#### 3.4.3 HYLLYTYS

Pinossa HYLLYTYKSESSÄ ovat:

- **Hyllytä** vie tekstin kellarin veivihyllystöön heti, kun sen aika on, vaikkapa siksi, että se on liian kiinnostava ja työlistalla on muuta. Se kysyy varmuuden vuoksi: *Oletko aivan hylly?* (*Olen* tai *En*).
- **Vie käsikirjastoon** siirtää tekstin käsikirjastoon kellarin veivihyllystön ylimmäksi (luku 4.5).
- **Anna pölyyntyä** himmentää nimikkeen ja painaa sen pinon pohjalle. Samasta kohdasta (*Puhalla pölyt*) sen saa entiselleen (luku 4.7).
- **Poista** alimpana punaisella. Poisto vie tekstin ja sen merkinnät, joten nappi pyytää vielä vahvistuksen: *Vahvista: poista myös merkinnät*.

Kellarin veivihyllystön, ö-mapin ja käsikirjaston HYLLYTYS on kuvattu luvussa 4.

### 3.5 Valinta ja valittujen valikko

Nimikkeen vasemmalla puolella oleva salmiakki valitsee tekstin, ja otsikkorivin salmiakki valitsee kaikki tai tyhjentää valinnan. Kun jotain on valittuna, otsikkorivin oikeaan reunaan tulee valittujen määrä ja valittujen valikko samoin kolmin kohdin:

- ULOSTUS: lähdeviitteiden kopiointi ja *Vie merkinnät (zip)*. Zip-paketissa on jokaisesta tekstistä sama Markdown-tiedosto kuin tekstin omassa merkintöjen viennissä.
- SISUSTUS: *Luokittele* antaa saman asiasanan, ajoituksen tai käsikirjaston kaikille valituille.
- HYLLYTYS: siirrot, *Anna pölyyntyä* ja *Poista*. Vahvistus kertoo, montako tekstiä poistetaan merkintöineen.

### 3.6 Pinon alla

Pinon alla ovat

- **Soita postihuilua** vasemmalla, kun laatikkolause on annettu. Se hakee laatikon heti ja lähettää odottavat merkinnät (luku 9.2).
- **kellarin veivihyllystö** oikealla, kahtena rivinä kammen kanssa, kun kellarin veivihyllystössä on jotain.
- linkit *Pikaohje* ja *Pitkä ohje* (tämä teksti), *Kokeiluteksti: Kant ja eläinetiikka* (väliaikainen esimerkkiteksti), *LUETTAVAA* (tuettujen sivustojen lista, luku 2.4) ja *Sanaselitys* (luku 7.7),
- pienen välin jälkeen *Uusi teksti latomossa*.

## 4. Kellarin veivihyllystö, ö-mappi ja käsikirjasto

Pino on lähinnä lukijaa. Sen alla on kellarin veivihyllystö, jonka hyllyjä liikutetaan veivaamalla kampea, ja vielä syvemmällä ö-mappi. Liike kohti pinoa on *poimimista*, siitä pois *viemistä*.

### 4.1 Kellarin veivihyllystö

Kellarin veivihyllystöön tulevat tekstit, jotka laskeutuvat pinosta itsestään (luku 3.2), ja tekstit, jotka olet hyllyttänyt. Sinne pääsee pinon alla olevasta linkistä *kellarin veivihyllystö*, joka näkyy, kun siellä on jotain.

Kellarin veivihyllystön tekstejä voi avata, valita ja käsitellä kuten pinossa. Tietorivillä lukee *luettu* tai *laskeutui* ja päivä, jolloin teksti tuli kellariin. Merkinnät ja lukukohta säilyvät.

Nimikkeen valikon HYLLYTYKSESSÄ ovat kellarin veivihyllystössä:

- **Poimi pinoon** nostaa tekstin takaisin pinon kärkeen (pölyttyneen pinon pohjalle).
- **Laita ö-mappiin** siirtää tekstin vielä syvemmälle (vahvistus *Laitetaanko mappiin ö?*, *Joo* tai *Öö ei*).
- **Nosta käsikirjastoon**.
- **Anna pölyyntyä** tai **Puhalla pölyt** ja **Poista**.

Teksti palaa pinoon myös, jos se lähetetään uudelleen postihuilulla tai latomosta. Takaisin pinoon pääsee logosta tai vasemman alakulman linkistä *pino*. Oikeassa alakulmassa on linkki *ö-mappi*, kun siellä on jotain.

### 4.2 Järjestykset ja välikortit

Kellarin veivihyllystön otsikon alla on pieni järjestyksen nappi: lajittelunuoli ja voimassa oleva järjestys. Sen napautus antaa valita järjestyksen:

- **luetuksi merkitsemisen mukaan** (oletus): kellariin tulon mukaan, ja pinosta laskeutuneet omana ryhmänään,
- **tekijän mukaan**: alkukirjaimittain; blogin, lehden tai hakuteoksen kirjoituksella tekijä on julkaisu, muuten ensimmäinen kirjoittaja,
- **kirjoittajan mukaan**: jokainen kirjoittaja omana ryhmänään, teksti jokaisen kirjoittajansa alla,
- **ajoituksen mukaan**: vuosisadoittain, ajoituksen tai julkaisuvuoden mukaan,
- **lajin mukaan**: tieteellinen, blogi tai verkkosivu, kaunokirjallinen,
- **asiasanojen mukaan**: teksti jokaisen asiasanansa alla, ja ryhmä *Ilman asiasanaa*,
- **alkuperän mukaan**: poimittu verkosta, avattu linkistä tai ladottu itse,
- **merkintöjen määrän mukaan**,
- **edistymisen mukaan**.

Valinta *mukana myös pinon tekstit* tuo pinon tekstit kellarin järjestykseen ryhmiin *Kesken pinossa* ja *Lukematta pinossa*. Pino itse ei muutu.

Ryhmien otsikot ovat kuin kortiston välikortteja. **Välikortti on suodatin:** sen napautus näyttää vain sen ryhmän, ja toinen napautus tai nappien alle ilmestyvä linkki *kaikki kortit* tuo muut takaisin. Silloin otsikkorivin salmiakki valitsee vain näkyvän ryhmän, joten esimerkiksi ryhmän *Ilman asiasanaa* voi luokitella kerralla.

Kellarin veivihyllystössä ei ole hakua: sitä selataan järjestyksen ja välikorttien kautta.

### 4.3 Luokittelu

Nimikkeen valikon kohta *Luokittele* (SISUSTUKSESSA) antaa tekstille

- **asiasanoja**, esimerkiksi *filosofia* ja *psykologia*. Teksti voi kuulua moneen. Asiasanan napautus tallentaa heti. Kenttään kirjoittaminen suodattaa jo käytettyjä sanoja, jotta sama asia saa saman sanan, ja uusi sana saa sanaston kirjoitusasun (*hegel* → *Hegel*).
- **ajoituksen**, jos tekstin paikka aikajanalla on muu kuin julkaisuvuosi: Hegel-tutkimus Hegelin vuosille (1807), Septuaginta ennen ajanlaskun alkua (250 eaa.).
- **paikan käsikirjastossa** (luku 4.5).

Ehdotuksina ovat tunnetun sivuston alat Luinin korisanastosta (esimerkiksi Stanford Encyclopedia of Philosophysta *filosofia*, Wikipediasta *yleiset*) sekä saman kirjoittajan tai sivuston muiden tekstien asiasanat. Ehdotukset eivät lisää mitään ilman napautusta, eikä luokittelemattomista teksteistä muistuteta.

Kun valitset monta tekstiä, valittujen valikon *Luokittele* antaa saman asiasanan, ajoituksen tai käsikirjaston kaikille. Asiasana, joka on vain osalla valituista, näkyy puolitäytettynä, ja napautus antaa sen kaikille.

Asiasanat ja ajoitus tallentuvat myös tekstin etukenttään, joten ne kulkevat ladatun .md-tiedoston mukana; latomossa ne ovat valinnaisia kenttiä. Käsikirjasto on lukijan oma tila eikä mene tiedostoon.

### 4.4 Sanasto

Järjestyksen napin alla on linkki *sanasto*, kun jollakin tekstillä on asiasanoja. Se näyttää kaikki asiasanasi ja niiden tekstien määrän (pinossa, kellarin veivihyllystössä ja ö-mapissa). Asiasanan napautus antaa nimetä sen uudelleen kaikissa teksteissä. Jos annat nimeksi toisen asiasanasi, ne yhdistyvät (esimerkiksi *filo* → *filosofia*), ja nappi on silloin *Yhdistä.* Pelkkä kirjainkoon muutos (*stoa* → *Stoa*) on nimeäminen. *älä!* palaa sanastoon.

### 4.5 Käsikirjasto

Käsikirjasto on teksteille, joihin palataan aina uudelleen: hakuteos, työn alla oleva lähde, rakas kirja. Käsikirja ei ole koskaan pinossa eikä ö-mapissa, vaan aina kellarin veivihyllystössä ylimpänä välikortin *Käsikirjasto* alla, valitusta järjestyksestä riippumatta. Postihuilu tai latomon uusi versio ei nosta sitä pinoon.

Käsikirjastoon pääsee luokittelun kytkimestä tai suoraan HYLLYTYKSESTÄ: pinosta *Vie käsikirjastoon*, kellarin veivihyllystöstä *Nosta käsikirjastoon* ja ö-mapista *Poimi käsikirjastoon*. Vahvistus kysyy samalla verbillä (esimerkiksi *Nostetaanko teksti käsikirjastoon?*).

Käsikirjan HYLLYTYKSESSÄ ovat *Poimi pinoon*, *Laita ö-mappiin* ja *Irrota käsikirjastosta*. Kaksi ensimmäistä vievät tekstin pois käsikirjastosta pinoon tai ö-mappiin, ja irrotettu jää kellarin veivihyllystöön tavalliseksi tekstiksi. Kun otat tekstin pois käsikirjastosta luokittelun kytkimestä, se palaa sinne, missä se oli (lukematon pinoon). Käsikirjalla ei ole pölyä.

### 4.6 Ö-mappi

Ö-mappi on kellarin veivihyllystön alla: paikka teksteille, joita et halua enää nähdä mutta et raaski poistaa. Sen otsikko on *Mappi ö*. Ö-mapin tekstit eivät näy pinossa eivätkä kellarin veivihyllystössä.

Ö-mappiin pääsee kellarin veivihyllystön oikean alakulman linkistä *ö-mappi*, joka näkyy, kun siellä on jotain. Ö-mapin HYLLYTYKSESSÄ ovat *Poimi kellarin veivihyllystöön*, joka tuo tekstin takaisin, ja *Poimi käsikirjastoon*. Ö-mapista pääsee pinoon logosta ja kellarin veivihyllystöön vasemman alakulman linkistä *kellarin veivihyllystö*.

### 4.7 Pöly

*Anna pölyyntyä* himmentää nimikkeen hyvin haaleaksi. Pinossa pölyinen teksti painuu pohjalle, myös kellarista poimittuna. Pöly säilyy, kun teksti siirtyy kellarin veivihyllystöön, ö-mappiin tai takaisin pinoon; se lähtee vain puhaltamalla (*Puhalla pölyt*) ja käsikirjastoon siirtyessä. Pöly ei vaikuta tusinaan eikä kellarin järjestykseen, ja se on vain tällä laitteella.

### 4.8 Poistaminen

*Poista* on aina HYLLYTYKSEN alimpana punaisella. Poisto vie tekstin ja kaikki sen merkinnät tältä laitteelta, joten se kysyy vahvistuksen. Ennen poistoa merkinnät voi viedä tiedostoon (*Vie merkinnät*). Toisiin laitteisiin postihuilulla lähetetty teksti ei poistu niistä.

## 5. Lukeminen

### 5.1 Tekstin avaaminen ja lukukohta

Teksti avautuu nimikkeen napautuksesta siihen kohtaan, mihin jäit. Lukukohta tallentuu itsestään, ja se säilyy, kun vaihdat kirjasinkokoa, marginaalia tai lukutapaa: luin palaa sivulle, jolla sama kohta on.

Tekstistä pääset takaisin pinoon yläpalkin vasemmasta kulmasta, kolmen kirjan pinosta.

Tekstin alussa on otsikkolohko (nimi, alaotsikko ja tietorivit) ja sen perässä sisällysluettelo, jonka voi ottaa asetuksista pois (luku 8.3). Linkit tekstin omiin lukuihin ja alaviitteet toimivat aina.

### 5.2 Rullaus ja sivunkääntö

Lukutapoja on kaksi (asetus *Liikkuminen*, luku 8.2):

- **Rullaus**: teksti vierii kuten verkkosivu. Oletus hiirellä.
- **Sivunkääntö**: teksti on sivuina, ja sivu vaihtuu kerralla. Oletus kosketusnäytöllä ja sähköpaperilla.

Sivua käännetään neljällä tavalla, joista mikä tahansa yhdistelmä käy:

- **Reunanapautus**: ruudun oikean reunan napautus kääntää eteenpäin, vasemman taaksepäin. Keskellä napautus ei käännä.
- **Pyyhkäisy** vaakasuunnassa.
- **Nuolinapit** alapalkin oikeassa reunassa.
- **Laitteen painikkeet**: näppäimistön nuolet, PageUp ja PageDown sekä välilyönti, sähköpaperilaitteen sivunkääntönäppäimet ja äänenvoimakkuusnapit, jos selain välittää ne. Näppäimellä sivu kääntyy, kun nostat sormen.

Yksi kolmesta ensimmäisestä on pakko valita, koska selaimessa ei tiedetä, onko laitteessa painikkeita. Android-sovelluksessa laitteen painikkeet riittävät yksinäänkin.

Sivutettuna pääluku alkaa aina uudelta sivulta, eikä alaluvun otsikko jää yksin sivun pohjalle. Kun painat seuraavaa sivua viimeisellä sivulla (painike, reunanapautus tai näppäin), palkit ja aikajana avautuvat.

### 5.3 Osiohyppy

Erittäin pitkä painallus (noin sekunti) reunassa, nuolinapissa tai laitteen sivunkääntö- tai nuolinäppäimellä hyppää seuraavaan merkkipaaluun; vasen puoli ja taaksepäin osoittava näppäin hyppäävät taaksepäin. Lyhyessä tekstissä merkkipaalu on luku, pitkässä (luvussa keskimäärin yli 20 sivua) osio. Kohtaan hypätään vain, jos tekstissä ei ole lukuja eikä osioita, ja jos merkkipaaluja ei ole lainkaan, hypätään kymmenen sivua.

Kun Sukkela sanaselitys on päällä, reunassa sanan päällä pidetty sormi avaa sanaselityksen eikä hyppää. Osioon pääsee silloin reunan tyhjästä kohdasta, nuolinapista tai näppäimestä.

### 5.4 Palkit

**Kosketusnäytöllä** palkit ovat piilossa, jotta ruutu jää tekstille. Ruudun alareunassa on kaista, jonka vasemmassa reunassa on kirjanmerkin nauha ja oikeassa palkkinuoli. Kaistan napautus avaa yläpalkin ja aikajanan tekstin päälle, ja sama napautus sulkee ne. Palkit avautuvat myös

- ruudun yläreunan napautuksesta (yläpalkin korkuinen alue, joka menee reunanapautuksen edelle),
- selvästi tyhjän kohdan napautuksesta tekstin vierestä tai lyhyen rivin perästä,
- kameran loven kohdalle jäävän mustan kaistan napautuksesta (luku 5.7).

Tekstin napautus ei avaa palkkeja, jotta ne eivät avaudu vahingossa. Vieritys ja sivunkääntö eivät sulje niitä.

**Hiirellä** palkit ovat aina näkyvissä, ja alapalkin napautus avaa ja sulkee aikajanan.

**Kun palkit ovat auki, tekstin napautus sulkee ne eikä tee muuta.** Linkit, alleviivaukset ja reunanapautus eivät silloin toimi, joten rauhalliseen lukunäkymään pääsee napauttamalla tekstiä. Sivua kääntävät silloin nuolinapit ja näppäimet.

Yläpalkissa ovat vasemmalla paluu pinoon, oikealla kokoruudun kulmanappi ja asetusten kiekko. Alapalkissa ovat vasemmalla kirjanmerkin nauha (luku 6.1) ja oikealla palkkinuoli ja nuolinapit. Aikajanan alla ovat napit *Etsi*, *Sisälmys* ja *Merkinnät* (luku 7).

### 5.5 Aikajana

Aikajana näyttää koko tekstin vaakaviivana. Otsikot ovat sillä salmiakkeina nuottien tapaan: mitä suurempi aika-arvo, sitä ontompi merkki.

- luku: iso ontto salmiakki,
- osio: pienempi täytetty salmiakki,
- kohta: lähes pistemäinen salmiakki,
- kirjanmerkki: nauha viivan alla,
- nykyinen kohta: musta kolmio ja hiusviiva,
- paluumajakka: ontto kolmio ja katkoviiva (luku 5.6).

Luettu osa on piirretty tekstin värillä ja tuleva haaleammin. Aikajanan yläpuolella ovat vasemmalla nykyisen osion nimi ja oikealla edistyminen: rullatessa prosentit, sivutettuna sivunumero ja sivujen määrä.

Napauta aikajanaa, niin pääset mihin tahansa kohtaan tekstiä. Salmiakin päälle osuva napautus vie tasan sen otsikkoon, ja kirjanmerkin nauhan napautus tasan kirjanmerkkiin.

Aikajanaa voi myös vetää. Vedettäessä osoitin seuraa sormea, yläpuolella näkyvät osio, johon päädyt, ja sivunumero, ja voimassa oleva kohta jää haaleaksi haamuksi. Teksti siirtyy vasta, kun irrotat. Sivutettuna veto pysähtyy vain portaille, jotta osoitin ei hypi turhaan: portaita ovat tekstin alku, luvut ja osiot, kirjanmerkit, viimeinen sivu ja pitkien välien tasaiset väliportaat. Rullatessa veto kulkee vapaasti.

Mitkä tasot aikajanalla näkyvät, valitaan asetuksista (luku 8.5). Jos merkkejä on niin tiheässä, että ne menisivät päällekkäin, tärkeämpi näytetään.

### 5.6 Paluumajakka

Kun hyppäät tekstissä kauas, paluureitti katoaa helposti. Siksi hypyn lähtökohtaan jää majakka:

- Aikajanalle lähtökohtaan jää kummitusmerkki, ontto kolmio katkoviivalla. Sen jättävät tekstin sisäiset linkit (ei kuitenkaan tekstin alun sisällysluettelo), aikajana (vähintään kymmenesosan matkalla), *Merkinnät*-lista, Sisälmys ja haku.
- Lähdeviittauksesta kirjallisuusluetteloon tai lyhenteen selitykseen, haulla ja aikajanalta vähintään puolen tekstin matkalla alhaalle ilmestyy lisäksi laatikko *Palaa takaisin*. Sen kolmio osoittaa paluun suuntaan.

*Palaa takaisin* vie lähtökohtaan ja poistaa majakan; sivutettuna samoin kummitusmerkin luo vetäminen aikajanalla. Majakka katoaa raksista, tekstin napautuksesta tai uudesta kaukaisesta hypystä. Peräkkäiset hakuosumat säilyttävät haun ensimmäisen lähtökohdan. Majakkaa ei tallenneta.

### 5.7 Kokoruutu ja selaimen palkit

**Kokoruutu.** Yläpalkin kulmanappi kiekon vasemmalla puolella vie kokoruutuun, jossa selaimen omat palkit ovat piilossa. Luin muistaa valinnan: kun avaat tekstin seuraavan kerran, ensimmäinen napautus tai sivunkääntö vie kokoruutuun, koska selain ei salli sitä ilman käyttäjän elettä. Samasta napista kokoruutu loppuu ja valinta kumoutuu. Puhelimen takaisin-eleellä tai sivutettuna ruudun yläosasta alas vetämällä pääset hetkeksi selaimen palkkeihin; kokoruutu palaa, kun avaat tekstin uudelleen. Tietokoneella Luin ei muista valintaa: kokoruutuun pääsee vain napista, ja siitä poistuu napista tai Esc-näppäimellä.

**Turvakaista.** Puhelimessa, jonka etukamera on näytön yläreunassa, ruudun yläreunaan jää kokoruudussa musta kaista, jotta kamera ei peitä tekstiä. Kaistan napautus avaa ja sulkee palkit.

**Palkit pois ilman kokoruutua.** Sivunkäännössä selaimen palkit saa piiloon pyyhkäisemällä kerran ylöspäin: teksti ei liiku eikä sivu käänny, mutta selain piilottaa palkkinsa, ja sivu täyttää vapautuneen tilan. Alaspäin pyyhkäisy tuo palkit takaisin. Näin käy selaimissa, jotka piilottavat palkkinsa vieritettäessä. Kun selaimen palkit ovat näkyvissä, tekstin avautuessa sivulla on iso merkki *pyyhkäise ylös*, ja teksti on sen ajan himmeänä; mikä tahansa napautus tai sivunkääntö poistaa merkin.

### 5.8 Tekstin rakenne lukimessa

**Otsikkotasot** ovat luku, osio ja kohta. Lehtiartikkelin ja hakuteoksen artikkelin otsikot ovat osioita eivätkä lukuja, samoin jos tekstissä on korkeintaan kaksi otsikkotasoa ja ylimpiä otsikoita on yli kymmenen. Pykälä on korkeintaan kohta. Lihavoidulla numerolla alkavien kappaleiden sarja (*Corollary 1:*, *Corollary 2:* …) on kohtia eikä otsikoita.

**Osanvaihdot.** Jos teksti on jaettu osiin pelkillä viivoilla tai tähdillä ilman otsikoita (keskitetty –––, \* \* \*, ⁂), osat ovat kohtia (i), (ii), (iii) …, ja ne näkyvät Sisälmyksessä osan ensimmäisin sanoin ja aikajanalla, kun kohdat on valittu näkyviin.

**Alaviitteet.** Viitenumero avaa alaviitteen. Leveällä näytöllä rullatessa alaviitteet ovat valmiiksi tekstin oikealla puolella. Jos pitkä alaviite työntäisi seuraavia kauas omista numeroistaan, siitä näkyy vain alku, ja *lisää…* avaa sen kokonaan (*vähemmän* lyhentää taas). Viitenumerot näkyvät aina.

**Lähdeviittaukset.** Alaviitteessä alleviivattu harmaa lähdeviittaus vie kirjallisuusluetteloon tai lyhenteen selitykseen. Leipätekstissä linkittyvät sulkujen tekijä–vuosi-viittaukset (*Kahn 1979*) ja numeroviittaukset (*[3]*), kun luettelossa on niille yksiselitteinen kohta. Paluu tapahtuu laatikosta *Palaa takaisin*.

**Kirjallisuusluettelo** ladotaan riippuvin sisennyksin eikä sitä tavuteta. Iso kirjallisuusosio, joka vie neljänneksen tekstistä, pysyy lukuna.

**Vakiosivut.** Jos tekstissä on painetun laitoksen vakiosivut (esimerkiksi Kantin Akademie-Ausgabe), sivun alku näkyy tekstissä ohuena pystyviivana ja sivunumero vasemmassa marginaalissa; kapealla ruudulla numero on viivan perässä. Kopion lähteeksi tulee silloin sivu (*AA 4:429*, luku 6.7).

**Kohtanumerot.** Klassikoissa (Perseus) kirjat ovat lukuja ja numeroidut kohdat, kuten Ciceron 1.11 tai Platonin 327a, kohtia, vaikkei niillä ole otsikkoa; Platonin Stephanus-sivut (327) ovat osioita. Kohtanumerot ovat harmaita yläindeksejä.

**Kuvat, taulukot ja kaavat.** Kuvat näkyvät linkkeinä. Taulukot ladotaan taulukkoina, ja kuvateksti on kursiivia. Kaavoista ks. luku 2.3.

**Lähde ja Tekijänoikeudet** ovat tekstin lopussa tieto-osioina (luku 2.3).

**Liian pitkä sana**, kuten osoite tai DOI, katkeaa rivin lopussa eikä levitä sivua.

### 5.9 Lomitettu käännös

Kreikan- tai latinankieliseltä Perseuksen sivulta poimittuun tekstiin voi tulla englanninkielinen käännös kohta kohdalta alkutekstin alle. Silloin asetusten *Teksti*-osiossa on rivi *Kielet*: *Molemmat*, *Alkuteksti* tai *Käännös*. Kohtanumerot jäävät näkyviin kaikissa.

Kun näytölle mahtuu kaksi palstaa, molemmat kielet ovat vierekkäin, alkuteksti vasemmalla, sekä rullatessa että sivuja kääntäessä (esimerkiksi tabletti vaaka-asennossa). Pienempi kirjasin tai kapeampi marginaali tuo vierekkäisen ladonnan kapeammallekin näytölle. Kun alkuteksti ja käännös ovat samoin kirjaimin, kuten latina ja englanti, käännös on lainauksen värinen, jotta palstat erottuvat. Sivutettuna jokainen kirja alkaa uudelta sivulta.

Maalaus pysyy yhden kielen sisällä: alleviivaus, kopio, sanaselitys ja käännös koskevat vain sitä kieltä, josta maalaus alkoi, ja vain näkyvää tekstiä. *Kielet*-rivi vain piilottaa toisen kielen, joten se ei kevennä tekstiä.

## 6. Merkinnät

Merkintöjä on kolmenlaisia: kirjanmerkki, alleviivaus ja kirjaus eli alleviivaukseen liitetty muistiinpano. Kaikki tallentuvat itsestään tähän selaimeen.

### 6.1 Kirjanmerkit

Alapalkin vasemman reunan nauha lisää kirjanmerkin. Se on aina näkyvissä, kosketusnäytöllä alakaistan vasemmassa reunassa. Kirjanmerkki menee aina kappaleen alkuun: ylimmän ruudulla alkavan kappaleen alkuun tai, jos ruudulla ei ala yhtään kappaletta, sen kappaleen alkuun, jota luet; näkymä siirtyy silloin sen verran taaksepäin, että kirjanmerkki näkyy. Samaan kappaleeseen ei tule toista kirjanmerkkiä.

Kun ruudulla on kirjanmerkki, nauha on kuparinen, ja sen napautus poistaa kirjanmerkin. Tekstissä kirjanmerkki näkyy pienenä nauhana kappaleen vasemmassa laidassa. Kirjanmerkit näkyvät myös aikajanalla, ja nauhan napautus siellä vie tasan kirjanmerkkiin.

### 6.2 Maalaus ja alleviivaus

Tekstiä alleviivataan maalaamalla:

- **hiirellä** vetämällä tekstin yli,
- **kosketusnäytöllä** painamalla sanaa hetki (noin puoli sekuntia) ja vetämällä siitä samalla kosketuksella eteenpäin.

Maalaus tarttuu aina kokonaisiin sanoihin. Pelkkä pitkä painallus sanaan ilman vetoa ja hiiren tuplaklikkaus avaavat sanan selityksen (Sukkela sanaselitys, luku 7.5). Kun maalaat pidemmälle, maalaus alleviivaa, vaikka palaisit samalla vedolla takaisin alkuperäiseen sanaan.

Oletuksena maalaus näkyy katkoviivaisena luonnoksena, ja sen viereen avautuu valikko (luku 6.5), jonka ensimmäinen nappi, *asdf* paksun viivan päällä, alleviivaa. Jos kytket asetuksista *Sukkela alleviivaus* päälle, maalaus alleviivautuu heti, ja valikon saa alleviivausta napauttamalla.

Uusi alleviivaus pysähtyy vanhan alleviivauksen rajaan: alleviivaukset eivät mene päällekkäin. Vierekkäiset alleviivaukset erottuvat väreistä, sillä ruoste ja okra vuorottelevat.

**Välimerkit.** Alleviivaus loppuu sanaan, ei välimerkkiin. Virkkeen lopetusmerkki (piste, huutomerkki, kysymysmerkki) tulee mukaan vain, kun alleviivaus kattaa koko virkkeen; pilkku, kaksoispiste ja puolipiste eivät tule koskaan. Lainausmerkit ja sulut pysyvät pareina: jos alleviivaukseen jää avaava merkki ja sen vastinpari tulee heti viimeisen sanan perässä, vastinpari tulee mukaan.

Lukimen oma maalaus ottaa selaimen valinnan pois tekstistä, jotta selaimen värit ja valikot eivät sekoitu alleviivaukseen. Kopioi silloin valikon napista. Jos haluat selaimen oman valinnan takaisin, valitse asetuksista *Maalaus: Tapa: Selaimen* (luku 8.4).

### 6.3 Kahvat

Alleviivauksen tai luonnoksen napautus tuo sen päihin kahvat. Vetämällä kahvaa voit siirtää alkua tai loppua sana kerrallaan. Tartu kahvan nuppiin rivin keskeltä kuten maalatessa. Kahvat pysyvät näkyvissä vedon aikana ja sen jälkeen, ja ne lähtevät, kun napautat muualle, suljet valikon tai käännät sivua.

Jos sormi ei jatka maalausta (joissakin selaimissa veto vierittää sivua), alleviivaa ensin yksi sana, napauta sitä ja vedä kahvasta.

### 6.4 Alleviivaus sivun yli

Sivutettuna alleviivaus voi jatkua seuraavalle sivulle. Kun maalaus tai kahva on hetken sivun viimeisellä rivillä, alapalkin merkit katoavat, ja palkkiin ilmestyy haalea neliö tekstipalstan oikealle puolelle (kapealla näytöllä ruudun reunaan). Sen vieressä on alleviivauksen merkki *asdf* ja nuoli neliöön päin.

Vie sormi tai osoitin neliön päälle ja pidä hetki: neliö vaalenee, sivu kääntyy, ja alleviivaus ulottuu seuraavan sivun ensimmäiseen sanaan. Siitä jatketaan viemällä sormi takaisin tekstiin; silloin palkki palaa, eikä sivu käänny uudelleen ennen sitä. Taaksepäin sama toimii peilikuvana sivun ensimmäiseltä riviltä: neliö tulee yläpalkin paikalle palstan vasemmalle puolelle (puhelimessa tekstin yläpuolelle).

### 6.5 Valikko

Maalaus avaa valinnan valikon, ja alleviivauksen napautus alleviivauksen valikon. Napit ovat ikoneita, ja hiirellä niiden nimi näkyy vihjeenä.

- **Alleviivaa** (*asdf* paksun viivan päällä): vain valinnan valikossa.
- **Poista** (viiva, jonka päällä on raksi): vain alleviivauksen valikossa. Jos alleviivauksessa on kirjaus, nappi kysyy *Poista myös kirjaus?*, ja *älä!* palauttaa valikon.
- **Kirjaa** (kynä): kirjoita alleviivaukseen kirjaus (luku 6.6).
- **Sanaselitys** (lambda ja suurennuslasi): kun valittuna on enintään kymmenen sanaa (luku 7.5).
- **Käännä** (nuoli ja kielikoodi, esimerkiksi →fi): avaa tekstin käännöksen toiseen välilehteen (luku 7.6). Oletuksena pois valikosta.
- **Kopioi** (kaksi päällekkäistä suorakaidetta): kopioi tekstin, asetuksen mukaan lähteen kanssa (luku 6.7).
- **Raksi** sulkee valikon ja poistaa luonnoksen tai kahvat.

Valikon sulkee myös napautus sen ulkopuolelle. Kirjanmerkkiä valikossa ei ole; kirjanmerkki tulee vain alapalkin nauhasta.

### 6.6 Kirjaukset

*Kirjaa* alleviivaa valinnan ja avaa kirjausruudun. Ruutu kasvaa tekstin mukana ja vierii, kun teksti on pitkä. Kirjauksessa voi olla enintään 5 000 merkkiä, ja jäljellä oleva määrä näkyy ruudun alla.

- *Tallenna*, Ctrl+Enter tai napautus ruudun ulkopuolelle tallentaa.
- *Peruuta* tai Esc peruu muutoksen; juuri tehty alleviivaus poistuu silloin.

Kirjauksellisen alleviivauksen alussa on pieni kynä. Sen napautus näyttää kirjauksen, ja toinen napautus avaa sen muokattavaksi. Jos selain jää taustalle kesken kirjoittamisen, luonnos tallentuu.

### 6.7 Kopiointi ja lähde

Valikon *Kopioi* kopioi alleviivatun tai maalatun tekstin. Asetus *Lähteen sisällyttäminen kopiointiin* (luku 8.4) päättää, mitä tulee mukaan:

- **Ei**: pelkkä teksti.
- **Viittauksena**: teksti ja sulkuihin viittaus, esimerkiksi *(Korsgaard 2018, 8.5.3)*. Tekijät ja vuosi tulevat tekstin lähdeviitteestä; kaksi tekijää yhdistetään &-merkillä, useampi lyhennetään *et al.*
- **Kokonaan**: teksti, koko lähdeviite ja sijainti. Leikepöydälle tulee myös muotoiltu versio kursiiveineen.

Sijainti on tekstin oma tunniste eikä sivunumero: luvun numero (*4.3.4*), muu tekstin oma tunniste (*Osa II, 3b*, *§ 12*) tai luvun alku (*4.0*). Ilman numeroita sijainti on luvun nimi lainausmerkeissä. Jos tekstissä on vakiosivut, sijainti on sivu: *AA 4:429*. Viitteen kanssa kopioikonin etummaisessa sivussa on rivejä: yksi viittaukselle, kaksi koko lähteelle. Kopioinnin jälkeen ikonin tilalla on hetken rasti.

### 6.8 Merkinnät-laatikko

Aikajanan alla oleva *Merkinnät* listaa tekstin kaikki merkinnät kahdessa osiossa: *Kirjanmerkit* sekä *Alleviivaukset ja kirjaukset*. Osiot supistuvat otsikon vieressä olevasta pienestä salmiakista, ja tila muistetaan. Merkinnän napautus vie sen kohtaan. Laatikko sulkeutuu raksista tai napistaan, ei tekstin napautuksesta.

Jos merkinnän kohtaa ei uudesta tekstiversiosta löydy, merkintä ei katoa vaan näkyy listassa merkinnällä *kohtaa ei löydy*.

### 6.9 Merkintöjen vienti ja tuonti

Merkinnät ovat vain tämän selaimen muistissa. Ne voi viedä tekstitiedostoon talteen, omiin muistiinpanoihin tai toiseen laitteeseen.

**Vienti.** Avaa teksti ja sitten asetukset. Alimpana on osio *Vie merkinnät tekstitiedostoon*. Valitse, mitä viedään (alleviivaukset, kirjaukset, kirjanmerkit, edistymisen tilanne; oletuksena alleviivaukset ja kirjaukset), ja paina *Vie*. Vahvistuksen jälkeen saat Markdown-tiedoston, joka on luettava sellaisenaankin: tekstin nimi, lähdeviite ja merkinnät tekstin otsikoiden alla, alleviivaukset lainauksina ja kirjaukset niiden perässä. Saman viennin saa pinosta tekstiä avaamatta (*Vie merkinnät*) ja monesta tekstistä kerralla zip-pakettina (luku 3.5).

**Tuonti.** Avaa toisessa laitteessa sama teksti, sitten asetuksista *Tuo merkinnät tekstitiedostosta*, valitse lajit ja paina *Tuo*, ja valitse tiedosto. Jo olemassa olevia merkintöjä ei tuoda kahteen kertaan, joten saman tiedoston voi tuoda laitteeseen, jossa osa merkinnöistä jo on. Kuittaus kertoo, mitä tuotiin. Jos tiedostossa on edistymisen tilanne, kuittauksessa on kyltti *Jatka siitä, mihin jäit*, joka vie lukukohtaan.

Merkinnät voi siirtää laitteelta toiselle myös postihuilulla (luku 9.4).

## 7. Haku, Sisälmys ja sanaselitys

### 7.1 Navin laatikot

Aikajanan alla ovat napit *Etsi*, *Sisälmys* ja *Merkinnät*. Ne avaavat laatikkonsa nappien järjestyksessä: Etsi vasemmalle, Sisälmys keskelle ja Merkinnät oikealle.

- **Leveällä näytöllä** laatikot voivat olla auki rinnakkain. Kun tilaa on tarpeeksi, Etsi ja Merkinnät ovat tekstin vieressä marginaaleissa ja Sisälmys tekstipalstan levyisenä sen päällä; muuten kukin vie kolmanneksen leveydestä. Leveällä Etsi jää auki tekstin viereen, kun valitset osuman, ja Enter vie seuraavaan.
- **Kapealla näytöllä** auki on yksi laatikko kerrallaan koko tekstin tilassa, ja toisen napin painallus vaihtaa laatikon. Puhelimessa napit siirtyvät alapalkkiin, jos ne mahtuvat sinne; kirjanmerkki ja nuolinapit väistyvät niiden tieltä palkkien ollessa auki. Auki olevan laatikon nappi on haalea, ja laatikko peittää myös aikajanan. Alapalkin tyhjän kohdan napautus palaa suoraan tekstiin.

Saman napin painallus sulkee laatikon. Kun napautat laatikosta kohtaa, joka vie tekstiin, laatikot sulkeutuvat ja aikajana jää auki.

### 7.2 Etsi

Haku löytää sanat, jotka alkavat hakusanalla: *kant* löytää myös sanat *Kantin* ja *kantilainen*, mutta *etiikka* ei löydä sanaa *eläinetiikka*. Kirjainkoolla ei ole väliä.

- Usean sanan haku löytää sanat vain peräkkäin ja samassa järjestyksessä.
- Lainausmerkeissä sana on kokonainen: *"kant"* löytää sanan *Kant* mutta ei sanaa *Kantin*. Lainattuja ja lainaamattomia sanoja voi sekoittaa.
- Alaviitteet ovat mukana, kun osumamäärän oikealla puolella oleva kytkin *alaviitteet* on päällä (oletus).

Osumissa näkyvät osion nimi, sivutettuna sivunumero ja ote, jossa osuma on haalealla taustalla. Listassa on enintään 200 ensimmäistä osumaa, mutta määrä lasketaan kaikista. Osuman napautus vie tekstiin, jossa osuma näkyy samalla taustalla, ja Enter vie lukukohdasta seuraavaan osumaan.

Niin kauan kuin korostus on tekstissä, alapalkissa kirjanmerkin vieressä on samanvärinen painunut suurennuslasi. Kun et enää tarvitse korostusta, napauta lasia tai korostusta itseään (näppäimistöllä myös Esc). Korostuksen napautus ei tee mitään muuta. Hakusana säilyy, kunnes suljet tekstin.

### 7.3 Erikoishaut

Kenoviiva aloittaa erikoishaun. Kirjoita `/` ja komennon alku, niin luin ehdottaa, mitä tekstissä on (`/k` → `/kreikka`, `/l` → `/lainaus`), ja kertoo kohtien määrän.

- `/lainaus` näyttää lainaukset: sisennetyt lainaukset ja vähintään kolmen sanan jaksot lainausmerkeissä.
- `/vieras` näyttää kaikki muulla kuin tekstin kielellä kirjoitetut kohdat.
- Kielen nimi, esimerkiksi `/latina`, näyttää vain sen kielen kohdat. Tunnetut kielet ovat kreikka, latina, saksa, englanti, ranska, ruotsi, liettua, suomi, heprea, arabia, kyrillinen, devanagari ja kiina.

Komennon perään voi kirjoittaa hakusanan: `/lainaus kant` etsii vain lainauksista. Kieli tunnistetaan yleisimmistä sanoista, joten lyhyt vieras sana tai ilmaus (*Dasein*, *a priori*) ei löydy; kreikka ja muut kirjaimistot löytyvät aina.

### 7.4 Sisälmys

*Sisälmys* avaa tekstin sisällysluettelon. Nykyinen luku on merkitty ruosteisella viivalla ja vieritetty listan keskelle, ja sivutettuna rivin oikeassa reunassa on sivunumero. Rivin napautus vie siihen. Sisälmys on aina käytettävissä, vaikka tekstin alun sisällysluettelo olisi asetuksista pois. Tekstissä, jossa ei ole otsikoita eikä osanvaihtoja, Sisälmystä ei ole.

Lehtiartikkelin etu- ja loppuosat (tiivistelmä, kirjallisuus, liitteet) ovat Sisälmyksessä lukujen tasolla välillä erotettuina. Sisälmys sulkeutuu raksista, napistaan, Escistä tai tekstin napautuksesta.

### 7.5 Sanaselitys

Sanaselitys hakee sanan merkityksen englanninkielisestä Wikisanakirjasta (Wiktionary). Se avautuu valikon napista, kun valittuna on enintään kymmenen sanaa (esimerkiksi sanonta tai sananlasku), tai suoraan yhdestä sanasta: kosketusnäytöllä pitkällä painalluksella ilman vetoa ja hiirellä tuplaklikkauksella (*Sukkela sanaselitys*, oletuksena päällä).

- **Ensin tasan tekstin muoto.** Jos sitä ei ole, luin etsii lähimmän: taivutetun muodon perusmuodon (*ponillehan* → *poni*, *käsitteen* → *käsite*) tai diakriitit oikein kirjoitetun sanan (*pratityasamutpadaa* → *pratītyasamutpāda*), ja kertoo, että kyse on lähimmästä osumasta. Useammasta lähimmästä voi valita.
- **Kieli.** Leipätekstissä arvaukset haetaan vain tekstin kielestä, ja jos selitys löytyy vain toisesta kielestä, siitä huomautetaan. Kursiivissa ja lainauksessa kelpaa mikä tahansa kieli, koska vieraskieliset sanat ovat usein kursiivissa.
- **Perusmuoto ensin.** Pelkän taivutusmuodon sijaan luin näyttää perusmuodon ja kertoo taivutuksen pienellä otsikon alla (*”käden” · genitive singular*), paitsi jos taivutusmuodolla on Wikisanakirjassa omia merkityksiä tai oma etymologia. Perusmuotoa voi napauttaa; takaisin ei palata.
- **Alkuperä.** Kun sanan alkuperä on kirjattu, sanan perässä on pieni suurennuslasi, jonka linssissä on ruosteinen epsilon. Se avaa merkitysten yläpuolelle laatikon, jossa on sanan etymologia. Laatikko sulkeutuu linssistä tai omasta raksistaan.
- **Otsikot.** Ikkunan ylimmällä rivillä on huomaamaton ΛΟΓΟΣ ja alkuperän laatikossa ΕΤΥΜΟΝ. Ne eivät näytä linkeiltä, mutta napautettaessa ne vievät sanojen λόγος ja ἔτυμον omiin selityksiin.

Raksi oikeassa yläkulmassa sulkee ikkunan, ja alalaidan plussa avaa sanan Wikisanakirjassa. Lähde ja lisenssi (*Wiktionary, CC BY-SA*) näkyvät ikkunan alarivillä.

Jos kytket *Sukkelan sanaselityksen* pois, pitkä painallus sanaan avaa valikon ja tuplaklikkaus maalaa sanan. Valikon sanaselitys on oma kytkimensä: kumpikin toimii ilman toista (luku 8.4).

### 7.6 Lausekäännös

Valikon *Käännä* avaa maalatun tekstin DeepL-kääntäjässä uudessa välilehdessä: suomenkielisen tekstin latinaksi, muunkielisen suomeksi. Napissa näkyy kohdekieli (→la, →fi), ja hiiren alla vihje kertoo, minne nappi vie. Lausekäännös on oletuksena pois valikosta; sen saa asetuksista (luku 8.4).

Sanaselitys ja lausekäännös ovat ainoat lukiessa verkkoa käyttävät toiminnot, ja nekin vain silloin, kun napautat niitä.

### 7.7 Sanaselitys omana sivunaan

Sanaselitys toimii myös ilman tekstiä omalla sivullaan, `luin/sanaselitys.html`; sinne vie pinon alla oleva linkki *Sanaselitys*. Kirjoita sana ja paina Enter tai lambdaa. Koska kirjoitetulla sanalla ei ole tekstin kieltä, haku kattaa kaikki kielet. Kielikoodi ja kaksoispiste alkuun tekevät hausta kuin sen kielen tekstin sanan: `fi: käsitteen`, `en: running` (myös la, grc, el, de, fr, sv, lt, es, it ja da).

Kentän alla olevasta *kieli*-valikosta haun voi rajata yhteen kieleen, jolloin selitys näyttää vain sen kielen sanat; kielet ovat samat kuin tuettujen sivustojen listan kielirivillä. Kreikka kattaa muinais- ja nykykreikan, ja latinalaisin kirjaimin kirjoitettu sana haetaan silloin kreikkalaisin kirjaimin. Kielen vaihto hakee näkyvän selityksen sanan uudelleen. Oletus on *kaikki kielet*, ja sivu palaa siihen aina avattaessa.

Samalla haulla sivu hakee sanaa myös Tieteen termipankista. Jos sieltä löytyy käsite, jonka nimitys sana on, tulokset ovat ensin listana: ylempänä termipankin käsitteet alan kanssa (*adekvaatti* · Filosofia), alempana Wikisanakirjan osumat. Napauta haluamaasi. Termipankin selityksessä on ala, määritelmät ja vastineet muilla kielillä; vastineen napautus avaa sen Wikisanakirjan selityksen. Vieraskielinen haku löytää suomenkielisen termin (*Dasein* → *täälläolo*), ja haettu sana näkyy pienellä otsikon alla. Linssi on otsikon perässä vain, kun alkuperää on: termipankin oma huomautus (*lat. adaequare*) tai sanan alkuperä Wikisanakirjassa. Kielivalikon rajaus koskee termipankissa haetun sanan kieltä. Termipankki on vain tällä sivulla, ei lukimen selitysikkunassa.

Sen vieressä olevasta *sanakirjat*-valikosta valitaan, mistä haetaan. Oletuksena ovat Wiktionary ja Tieteen termipankki; lisäksi voi valita Logeionin (muinaiskreikka ja latina: LSJ, Lewis & Short ym.), Wörterbuchnetzin (saksan historialliset sanakirjat: Adelung, Campe ja Grimm), Digital Pāḷi Dictionaryn (pali) ja Monier-Williamsin (sanskrit, Kölnin sanakirjat). Mitä tahansa voi ottaa pois, myös Wiktionaryn, kunhan yksi jää. Valinta säilyy tällä laitteella, ja muutos hakee näkyvän selityksen uudelleen, kun valikko suljetaan.

Muut sanakirjat näkyvät selityksen alla omina osioinaan lähteineen. Kukin arvaa perusmuodon itse, joten ne toimivat myös ilman Wiktionarya (*λόγου* → *λόγος*, *Begriffe* → *Begriff*, *karuna* → *karuṇa*); ilman Wiktionarya myös termipankki hakee perusmuotoa (*käsitteen* → *käsite*), ja sen vastineen napautus on uusi haku sen kielen sanana (`de: Begriff`). Kun Wiktionary on mukana, sen löytämä perusmuoto haetaan myös muista, ja Wiktionaryn linkki vie kaikki sanakirjat uuteen sanaan. Logeionin ja Wörterbuchnetzin sanakirjat avautuvat nimestään; hyvin pitkä artikkeli (esimerkiksi Grimmin *geist*) avautuu Wörterbuchnetzissä. Kielivalikko rajaa myös muut: saksaksi haetaan vain Wörterbuchnetzistä ja termipankin saksankielisiä nimityksiä. Sanakirjat, joista sanaa ei löytynyt, luetellaan lopuksi.

Osoitteen #-osa on haku, joten sivun voi lisätä selaimen hakusanaksi muodossa `…/luin/sanaselitys.html#%s`.

## 8. Asetukset

### 8.1 Yleistä

Asetukset avautuvat kiekosta pinon oikeasta yläkulmasta tai lukiessa yläpalkista. Ne koskevat kaikkia tekstejä tässä selaimessa. Lukiessa asetukset sulkeutuvat, kun napautat tekstiä; alapalkki (kirjanmerkki ja nuolinapit) jää käyttöön. Asetusten avaus sulkee palkit.

**Raskas teksti.** Jos teksti on niin raskas, että sen asettelu kestää hitaalla laitteella pitkään (esimerkiksi pitkä kaksikielinen teksti), asetusten ylälaidassa lukee, että muutokset tulevat tekstiin kerralla. Silloin kirjasinkoko, kappalejako, reunat, marginaali, tavutus, liikkuminen, sisällysluettelo ja kielet tulevat tekstiin vasta, kun suljet asetukset; teema ja muut valinnat vaihtuvat heti.

Asetusten alimpana on pieni linkki *palaute* (luku 16) ja Android-selaimessa sen vieressä *Android-sovellus* (luku 13).

### 8.2 Ulkoasu

**Sähköpapyrosoi asetukset** (Ulkoasun otsikon rivillä) asettaa kerralla sähköpaperille sopivat asetukset: vaalea teema, TCF-valkaisu ja sivunkääntö reunanapautuksella, nuolinapeilla ja laitteen painikkeilla ilman pyyhkäisyä. Se ei ole kytkin vaan työnsäästäjä: sen jälkeen asetuksia voi muuttaa tavalliseen tapaan. Painettaessa nappi vilkuttaa hetken mustaa ja valkoista kuin sähköpaperi virkistäessään ruutua. Niin kauan kuin asetukset ovat sähköpapyrosoidut, samassa paikassa on *Oletusasetukset*, joka palauttaa nämä asetukset laitteen oletuksiin.

**Teema.** *Vaalea* tai *Tumma*. Kummankin alla on teeman omat alakytkimet, ja toisen teeman kytkimet eivät näy.

- *TCF-valkaisu* (vaalea) tekee taustasta täysin valkoisen ja musteesta täysmustan; muut sävyt pysyvät ennallaan. Sähköpaperinäytöllä juuri melkein valkoinen tausta näyttää sotkuiselta. Nimi tulee täysin kloorittomasta paperin valkaisusta (*total chlorine free*).
- *Sysi* (tumma) tekee taustasta sysimustan sekä tekstistä ja viivoista himmeämpiä ja lämpimämpiä.
- *Sysin* näkyy Sysin oikealla, kun Sysi on valittuna: vielä himmeämpi ja lämpimämpi, yölukemiseen pimeässä, kun vieressä joku nukkuu. Sysinin ollessa päällä Sysin napautus palauttaa tavallisen Sysin.
- *CLĀRVS · ET · DISTĪNCTVS* (kirkkaasti erottuva) on kummassakin teemassa sama korkean kontrastin tila: musta teksti valkoisella tai valkoinen mustalla, ja kaikki muu vain yhtä harmaata ja ruostetta. Se pysyy, kun teemaa vaihdetaan, eikä se ole päällä yhtä aikaa TCF-valkaisun, Sysin tai Sysinin kanssa. Kun sammutat sen, edellinen valinta palaa.

Vaalean tai Tumman napautus antaa aina tavallisen teeman: TCF-valkaisu, Sysi ja Sysin sammuvat.

**Liikkuminen.** *Rullaus* tai *Sivunkääntö* (luku 5.2). Vaihtoehtojen kuvat, käärö ja koodeksi, valitsevat nekin. Sivunkäännön alla ovat sen tavat: *Reunanapautus*, *Pyyhkäisy*, *Nuolinapit* ja *Laitteen painikkeet*. Rullatessa ne ovat himmeinä pois käytöstä, mutta valinnat säilyvät.

**Kirjasinkoko.** Miinus ja plus. Kosketusnäytöllä oletuskoko riippuu ruudun koosta, kunnes säädät kokoa itse.

**Kappalejako.** *Väli* tai *Sisennys* (oletus). Sisennys on vain kappaleessa, jota edeltää kappale.

**Reunat.** *Liehu* tai *Tasattu* (oletus). Tasattunakin kaksirivinen kappale liehuu, jos sen sanavälit muuten levenisivät aukoiksi.

**Marginaali.** *Mikro*, *Meso* (oletus) tai *Makro*: tekstin sivureunojen tila. Leveällä ruudulla Mikro on myös pidempi rivi (noin 92 merkkiä, muilla noin 76).

**Tavutus.** *Ei*, *Maltillinen* (oletus) tai *Innokas*. Luin tavuttaa suomea omilla säännöillään, koska kaikki selaimet eivät osaa sitä, ja liettuaksi tunnistetun kappaleen liettuan säännöin. Otsikoita, kursiivia, lihavointeja, kirjallisuusluetteloa ja vieraan näköisiä sanoja ei tavuteta, ellei sana ole palstaa leveämpi. Tasattu palsta kapealla ruudulla tarvitsee innokkaan tavutuksen; maltillisella sanavälit venyvät.

### 8.3 Teksti

**Kielet** näkyy vain lomitetussa käännöksessä (luku 5.9).

**Näytä:**

- *Sisällysluettelo* tekstin alussa. Sisälmys on aina käytettävissä.
- *Kirjanmerkit* tekstissä.
- *Alleviivaukset* tekstissä. Piilotetut alleviivaukset eivät avaa valikkoa.
  - *Sukkela alleviivaus*: maalaus alleviivautuu heti ilman valikkoa (oletuksena pois). Ei käytössä, kun alleviivaukset on piilotettu.
  - *Sukkela sanaselitys*: yksi sana (pitkä painallus, tuplaklikkaus) avaa suoraan sanaselityksen (oletuksena päällä).
- *Verkkolinkit*: toimivatko tekstin linkit muille sivuille. Oletuksena pois, myös kirjallisuusluettelon DOI-linkit, jotta lukeminen pysyy omassa rauhassaan eikä napautus vie vahingossa pois tekstistä; linkit näkyvät silloin tavallisena tekstinä. Linkit tekstin omiin lukuihin ja alaviitteet toimivat aina.

### 8.4 Maalaus

**Tapa.** *Lukimen* (oletus) ottaa selaimen oman valinnan pois tekstistä, jotta selaimen värit ja valikot eivät sekoitu alleviivaukseen; kopioi silloin valikon napista. *Selaimen* palauttaa selaimen valinnan, jolloin myös selaimen oma kopiointi toimii (kahvat tulevat silti alleviivauksen napautuksesta).

**Lähteen sisällyttäminen kopiointiin.** *Ei* (oletus), *Viittauksena* tai *Kokonaan* (luku 6.7).

**Valikossa:** *Sanaselitys* (oletuksena päällä) ja *Lausekäännös* (oletuksena pois). Asetuksissa ei näy palvelujen nimiä: sanaselitys tulee Wikisanakirjasta, ja lähde näkyy selitysikkunassa; lausekäännös avautuu DeepL-palveluun, mikä kerrotaan käännösnapin vihjeessä.

### 8.5 Aikajana

**Näytä:** *Luvut*, *Osiot* ja *Kohdat* ovat kukin oma kytkimensä, samoin *Kirjanmerkit*. Oletus on kosketusnäytöllä luvut ja osiot, hiirellä kaikki tasot. Avoimen tekstin puuttuvat tasot ovat himmeinä, mutta niiden valinta säilyy muita tekstejä varten. Edistyminen näkyy aina aikajanan yläpuolella.

### 8.6 Vienti ja tuonti

Lukiessa asetusten alimpana ovat supistetut osiot *Vie merkinnät tekstitiedostoon* ja *Tuo merkinnät tekstitiedostosta* (luku 6.9). Pinon asetuksissa niitä ei ole.

### 8.7 Postihuilu

Asetusten alimpana on supistettu osio *Postihuilu*: laatikkolause, *Arvo*, *Soita huilua!* ja merkintäpostin valinnat (luku 9). Pinon asetuksissa merkintäpostin valinta on kaikkien tekstien oletus; avoimen tekstin asetuksissa sen voi tehdä vain sille tekstille.

### 8.8 Ensikäytön oletukset

Ensimmäisellä käyttökerralla luin valitsee asetukset laitteen mukaan:

- **Kosketusnäyttö ja sähköpaperi:** sivunkääntö kaikin tavoin (reunanapautus, pyyhkäisy, nuolinapit ja laitteen painikkeet), aikajanalla luvut ja osiot, kirjasinkoko ruudun mukaan.
- **Hiiri:** rullaus ja aikajanalla kaikki tasot.
- **Kaikilla:** vaalea teema (tai tumma, jos laite on tummassa tilassa), sisennys, tasattu, Meso, maltillinen tavutus, verkkolinkit pois, Sukkela alleviivaus pois ja Sukkela sanaselitys päällä.

Kun olet muuttanut asetusta, valintasi säilyy.

## 9. Postihuilu ja useampi laite

Pino on oletuksena vain tässä selaimessa. Jos haluat lukea samoja tekstejä usealla laitteella, esimerkiksi tietokoneella löydetyn artikkelin junamatkalla puhelimella, postihuilu on ystäväsi. Se kuljettaa tekstit ja halutessasi merkinnät postilaatikon kautta kaikkiin pinoihin, joissa on sama laatikkolause.

### 9.1 Laatikkolause

Laatikkolause on postilaatikon avain: vain sen tietävä pääsee lukemaan laatikon tekstit ja lähettämään laatikkoon. Säännöt:

- 24–52 merkkiä,
- pieniä kirjaimia a–z ilman ääkkösiä, halutessa myös yhdysmerkkejä (-) ja numeroita,
- isot kirjaimet luetaan pieniksi; muita merkkejä ja välilyöntejä ei hyväksytä.

Hyvä laatikkolause on sekä erikoinen että mieleenpainuva. Esimerkiksi *Torikaffeilla on hemmetin mukavaa* → `tori-kaffeilla-on-hemmetin-mukavaa`. Yhdysmerkit auttavat hahmottamaan lauseen ja huomaamaan virhelyönnit.

Nappi *Arvo* ehdottaa arvottua, muistettavaa lausetta, kuten `uninen-merimies-paistaa-17-lettua-saunassa`. Arvottu lause ei ole vielä käytössä; se otetaan käyttöön soittamalla huilua. Lauseen ohje on myös asetuksissa i-napin takana.

### 9.2 Soita huilua ja Soita postihuilua

Anna laatikkolause asetusten *Postihuilu*-osiossa ja paina *Soita huilua!*. Silloin

- lause tallentuu tähän selaimeen,
- laatikko haetaan heti, ja sinne lähetetyt tekstit tulevat pinoon,
- pinon alle ilmestyy nappi *Soita postihuilua*.

Sen jälkeen pino hakee laatikon itsestään aina, kun avaat pinon. *Soita postihuilua* hakee laatikon heti ja lähettää odottavat merkinnät. Kuittaus kertoo vain todella kantautuneen postin; tyhjästä laatikosta ei valiteta.

Lauseen voi vaihtaa tai poistaa samassa paikassa. Laatikon voi ottaa käyttöön myös sen linkistä: latomo antaa lähetyksen jälkeen linkin, joka avattuna toisessa laitteessa antaa sille lauseen ja hakee laatikon. Linkin voi kopioida myös asetusten laatikkolauseen kenttään.

Postihuilun kautta kantautuneen tekstin nimen perässä on pinossa pieni huilu, kunnes avaat tekstin.

### 9.3 Mitä huilu kuljettaa

Laatikkoon lähettävät

- **latomo**: nappi *Postihuilu* ja sen alla *Soita huilua!* (luku 10.7),
- **lukimeen-lisäosa**: plussan takana *Postihuilu* (luku 2.2),
- **pino**: nimikkeen valikon ULOSTUS → *Huiluta laatikkoon*, kun teksti on jo pinossa (tai kellarin veivihyllystössä tai ö-mapissa).

Toisessa laitteessa huilutettu teksti saa saman tunnuksen kuin lähettäjällä, joten sinne huilutetut merkinnät osuvat siihen.

**Varoitus:** huilu korvaa pinossa samannimisen vanhan tekstin uudella. Tämä pitää pinot siisteinä, kun lähetät saman tekstin korjatun version. Jos et halua korvata vanhaa, anna lähetettävälle tekstille eri otsikko.

### 9.4 Merkintäposti

Postihuilu voi kuljettaa myös merkinnät. Kun asetusten Postihuilu-osiossa on valittu *Huiluta myös merkintöjä* (näkyy, kun laatikkolause on annettu; oletuksena pois), sen alle avautuvat lajit: *Alleviivaukset*, *Kirjaukset*, *Kirjanmerkit* ja *Edistymisen tilanne* (oletuksena kaikki).

- Merkinnät lähtevät, kun poistut tekstistä pinoon, luin jää taustalle tai huilutat tekstin.
- Ne tulevat itsestään toiseen laitteeseen, jossa on sama laatikkolause ja sama teksti. Vastaanotto on aina päällä.
- Toisessa laitteessa poistettu merkintä poistuu myös täältä, ja kirjauksen uusin muokkaus jää voimaan. Lukukohdista voittaa uusin, mutta avoimen tekstin lukukohtaa ei siirretä kesken lukemisen.
- Merkintöjen mukana kulkee tekstin luokittelu (asiasanat, ajoitus ja käsikirjasto), ja uusin luokittelu jää voimaan. Pöly ei kulje.

Pinon asetuksissa valinta koskee kaikkia tekstejä. Tekstin omissa asetuksissa (alimpana) sen voi tehdä vain sille tekstille.

### 9.5 Tietoturva ja säilytys

Taianomaisuudestaan huolimatta postihuilu siirtää tietoja laitteeltasi internetiin: huilulla lähetetyt tekstit ja, jos niin valitset, niiden merkinnät kulkevat lukimen postilaatikkoon Cloudflaren palvelimelle. Tekstit säilyvät siellä 30 päivää ja merkinnät vuoden. Tietoihin ei pääse käsiksi arvaamalla, joten ne ovat suojassa laatikkolauseen vahvuuden verran. Kuka tahansa laatikkolauseen tietävä saa tekstit ja merkinnät omalle laitteelleen. Hyvässä ja pahassa: samoinhan toimivat mökin avaimetkin.

Laatikkoon kirjoittamista rajoitetaan kuormituksen estämiseksi. Jos lähetys ei mene läpi, kokeile myöhemmin uudelleen.

## 10. Latomo

### 10.1 Mihin latomoa tarvitaan

Latomo latoo Markdown-tekstin lukimeen helposti luettavaksi, seurattavaksi ja merkittäväksi. Se tarkistaa tekstin rakenteen, täydentää sen tiedot ja lähdeviitteen ja siirtää tekstin lukimeen, antaa sen ladattavaksi tai lähettää sen postihuilulla. Kaikki tapahtuu selaimessa; mitään ei lähetetä verkkoon, ellet käytä postihuilua.

Latomoon pääsee pinon alalaidan linkistä *Uusi teksti latomossa*. Lukimeen-lisäosa käyttää latomoa taustalla, ja *Säädä latomossa* tuo leikkeen sinne tarkistettavaksi.

Latomon alussa ovat linkit sen pitkään ohjeeseen ja tekstiin *Mikä on Markdown* (avautuu lukimeen uuteen välilehteen) sekä lukimeen-lisäosan asennuslinkit. Lisäosarivin plussan takana ovat sivustotoiveet ja tuettujen sivustojen lista.

### 10.2 Teksti kenttään

Liitä teksti kenttään, valitse tiedosto tai pudota .md- tai .txt-tiedosto kenttään. Mitään vaatimusta ei ole, että teksti olisi jäsennelty Markdownin mukaan: pelkkä teksti käy. Merkinnät kuitenkin palkitaan, sillä otsikot, kursiivit, lainaukset ja alaviitteet latoutuvat lukimessa kauniisti (luku 11).

Jos tekstissä on iA Writerin tekijyysmerkinnät, latomo tarjoaa niiden piilottamista.

### 10.3 Tarkistus ja ehdotukset

Kentän alla latomo näyttää tekstin alun niin kuin luin sen näyttää, luvut, ehdotukset ja huomautukset, ja lopussa rakenteen ja lähdeviittaukset.

**Ehdotukset muuttavat tekstiä vain napista.** Niitä ovat esimerkiksi

- otsikko ensimmäisestä rivistä tai tiedoston nimestä,
- sivuston nimen erotus otsikon lopusta,
- rivit kappaleiksi tai runon rivinvaihdot kenoviivoin,
- sisennettyjen proosakohtien palautus koodista tekstiksi,
- alaviitteiden merkintätavan korjaus,
- tekstin alun kirjoitus kentistä (*Kirjoita alku kentistä* tai *…ja säilytä tekstin lisätiedot*),
- rakenne-ehdotus eli luurangotus: jos tekstissä on otsikoiden näköisiä rivejä ilman otsikkomerkintöjä (*CHAPTER 6*, *§ 3*, lihavoidut väliotsikot), latomo ehdottaa niistä otsikoita oikeille tasoille. Hyvin merkitty teksti ei saa ehdotusta.

Huomautukset kertovat esimerkiksi puuttuvasta luvun otsikosta tai tekstinä näkyvistä HTML-merkinnöistä.

### 10.4 Tiedot ja tekstityyppi

Kaikki tiedot ovat vapaaehtoisia; otsikko riittää. Suositus on ainakin kirjoittaja tai blogin nimi. Tiedot luetaan tekstistä, jos siinä on niitä, ja tulokseen tallentuu vain se, mikä poikkeaa tekstistä.

*Tekstityyppi* on oletuksena *ei määritelty*. Vaihtoehdot *tieteellinen*, *blogi tai verkkosivu* ja *kaunokirjallinen* valitsevat tyypin tavalliset kentät:

- kaikilla kirjoittaja, julkaisuaika, otsikko ja alaotsikko,
- tieteellisellä julkaisun laji, yliopisto tai yhteisö ja kaupunki,
- blogilla sivusto, alkuperäinen osoite ja hakupäivä,
- kaunokirjallisella *Kokoelma* (novelli- tai runokokoelma, antologia tai lehti).

*+ Lisää tieto* tarjoaa loput: esimerkiksi suomentajan, painoksen, sarjan, kustantajan, DOI:n, tekijänoikeudet, asiasanat ja ajoituksen. *Osana teosta tai lehteä* avaa toimittajat, vuosikerran ja numeron sekä sivut. Kenttä, jolla on arvo, näkyy aina, joten tyypin vaihto ei piilota tietoa. Julkaisuajan tarkkuus valitaan kentän vieressä.

### 10.5 Lähdeviite

Latomo kokoaa lähdeviitteen kentistä Teologian tyylin (Helsingin yliopiston teologinen tiedekunta, 2021) mukaan: itsenäinen teos kursiivilla, osa ilman; ensimmäinen tekijä käänteisenä; verkko-osoitteen perässä lukupäivä. *Muokkaa itse* antaa kirjoittaa viitteen kokonaan, ja *Kokoa kentistä* palauttaa kootun. Lukija voi lisätä viitteeseen lukutiedot pinon valikosta (*Lisää: luettu HTML-versiona*).

### 10.6 Julkinen osoite

Jos .md-tiedosto on verkossa, kirjoita sen osoite kenttään *Julkinen osoite*. Silloin luin-linkki avaa tekstin kenen tahansa selaimessa. Dropboxin jakolinkki muutetaan suoraksi latauslinkiksi.

### 10.7 Avaa lukimessa, Lataa .md ja Postihuilu

- **Avaa lukimessa** tallentaa tekstin tämän selaimen pinoon ja avaa sen. Samannimisen tekstin uusi versio korvaa vanhan, ja kirjanmerkit ja alleviivaukset siirtyvät mukana.
- **Lataa .md** antaa tekstin etukenttineen tiedostona jaettavaksi tai verkkoon.
- **Postihuilu** kuljettaa tekstin luettavaksi toisella laitteella. Kirjoita laatikkolause (tai *Arvo*) ja paina *Soita huilua!*. Kohdassa *TOISEN LAITTEEN PÄÄSSÄ* on linkki, jonka avaaminen toisessa laitteessa antaa sille laatikkolauseen ja hakee tekstin. Yksi soitto on voimassa 30 päivää. Latomo ei lähetä merkintöjä.

### 10.8 Tyhjennä kentät

*Tyhjennä kentät* näkyy tekstikentän alla, kun siinä on tekstiä. Se tyhjentää tekstin, kentät, oman viitteen, julkisen osoitteen ja tiedoston nimen. Vahvistus kysyy: *Oletko aivan varma?* (*Olen, tyhjennä* tai *älä!*).

### 10.9 Muuta metatietoja ja Lado uusi laitos

Pinon nimikkeen valikon SISUSTUKSESTA teksti avautuu latomoon kahdella tavalla:

- **Muuta metatietoja**: voit muuttaa tekstin nimeä, kirjoittajaa ja julkaisutietoja. Itse teksti on lukittu, joten kirjanmerkit ja alleviivaukset pysyvät paikallaan. Vain otsikkoon tai tietoriveihin osuneet merkinnät voivat irrota. *Tallenna* vie tekstin takaisin pinoon.
- **Lado uusi laitos**: voit muokata myös tekstiä. Tallennettaessa valitset, tuleeko pinoon *toinen laitos merkintöineen*, *toinen laitos ilman merkintöjä* vai *korvaava laitos*. Kahdessa ensimmäisessä alkuperäinen jää pinoon ennalleen, ja uuden nimikkeen tietorivillä lukee esimerkiksi *2. laitos*. Kun merkinnät siirretään, muuttuneista kohdista osa voi irrota. Irronneet eivät katoa: ne näkyvät Merkinnöissä merkinnällä *kohtaa ei löydy*, ja luin kertoo tallennuksen jälkeen, montako niitä on.

### 10.10 Latomon ohje

Latomon alun linkki *Pitkä ohje* avaa latomon ohjeen kirjoittajalle. Ohjeen alussa on huomautus, ettei sitä ole tarkistettu eikä se ole ajan tasalla.

## 11. Oman tekstin kirjoittaminen

Luin lukee Markdownia: tavallista tekstiä, jonka sekaan muotoilut kirjoitetaan yksinkertaisin merkein. Kirjoita `*näin*`, ja saat *näin*. Lukimen merkintätapa pohjautuu iA Writerin tyyliin, ja samat merkinnät ymmärtää lähes jokainen Markdownia käsittelevä ohjelma. Taustaa ja ohjelmasuosituksia on tekstissä *Mikä on Markdown* (`luin.html#u=luin/mika-on-markdown.md`).

### 11.1 Otsikkolohko ja otsikot

- `# Otsikko`: tekstin nimi. Sen alle voi kirjoittaa kursivoidun alaotsikon ja tietorivejä, kuten tekijän ja päiväyksen. Rivin lopun kenoviiva `\` vaihtaa riviä kappaleen sisällä.
- `## Luku`, `### Osio`, `#### Kohta`: otsikot hierarkioineen. Numeroitu otsikko (`## 2. Luku`, `### 2.1 Osio`) antaa kopioinnin sijainniksi numeron.
- `---` omalla rivillään: vaakaviiva. Otsikoton osanvaihto (`---`, `* * *`, `⁂`) tekee osista kohtia (i), (ii) …
- `{{TOC}}` omalla rivillään: sisällysluettelon paikka. `+++`: sivutettuna uusi sivu.

### 11.2 Tekstin merkinnät

- `*kursiivi*`, `**lihavointi**`, `==korostus==` ja `~~yliviivaus~~`.
- `> Lainaus.` Lainauksen lähde omalle rivilleen ajatusviivalla: edellisen rivin loppuun kenoviiva `\` ja seuraavalle `> – Lähde`.
- `- luettelo` ja `1. numeroitu luettelo`; sisäkkäiset luettelot neljällä välilyönnillä.
- Taulukot pystyviivoin: `| sarake | sarake |`.
- `https://…` tai `[linkin teksti](https://…)`: verkkolinkki.
- `// kommentti` rivin alussa: ei näy lukimessa.
- Oman tavuviivan voi lisätä pehmeällä tavuviivalla (U+00AD).

### 11.3 Alaviitteet ja kirjallisuus

- Alaviite suoraan tekstin sekaan: `[^Alaviitteen teksti.]`. Tai tunnuksella: tekstiin `[^1]` ja omalle rivilleen `[^1]: Alaviitteen teksti.`
- `## Kirjallisuus` (tai *Lähteet*, *References*, *Bibliography* ym.): seuraavat kappaleet ovat kirjallisuusluettelon kohtia.
- Alaviitteen viittaus, jolla on kirjallisuusluettelossa yksiselitteinen vastine (tekijä ja vuosi), saa linkin luettelon kohtaan. Luin tekee linkin vain varmalla yhteydellä.

### 11.4 Etukenttä

Tiedoston alussa voi olla etukenttä kahden `---`-rivin välissä. Siinä ovat tiedot, jotka eivät näy tekstissä, esimerkiksi

```
---
tekijä: Etunimi Sukunimi
julkaistu: 2026-11-26
sivusto: Blogin nimi
lähde: https://…
asiasanat: filosofia, etiikka
---
```

Latomo kirjoittaa etukentän itse kentistä, joten sitä ei tarvitse osata. Etukenttään tallentuu vain se, mikä poikkeaa tekstistä päätellystä.

### 11.5 Mitä luin tekee itse

Luin päättelee tekstistä paljon itse: otsikkotasot, artikkelin ja kirjan eron, sisällysluettelon, kirjallisuusluettelon, lähdeviittauslinkit, kielen ja tavutuksen. Lainausmerkkejä ei muuteta. Jos jokin näyttää lukimessa oudolta, latomon huomautukset kertovat yleensä syyn.

## 12. Jakaminen

Jakaminen on lukimessa sivuosassa: kaikki tapahtuu pinon nimikkeen valikosta (ULOSTUS).

### 12.1 Kopioi linkki

*Kopioi linkki* antaa jakolinkin tekstille, joka on avattu luin-linkistä tai linkitetty tiedostoon. Linkin esikatselu näyttää viestimissä tekstin nimen ja lisätiedon. Avattuna se ohjaa saajan lukimeen, ja teksti tallentuu hänen pinoonsa. Saaja näkee tekstin puhtaana: merkintäsi eivät siirry jakolinkissä.

### 12.2 Linkitä tiedostoon

Latomosta tai lisäosalla tuodulla tekstillä ei ole verkko-osoitetta, joten linkin paikalla on *Linkitä tiedostoon*. Lataa teksti (*Lataa .md*), vie tiedosto verkkoon (esimerkiksi Dropboxiin) ja anna sen jakolinkki. Luin hakee tiedoston ja hyväksyy linkin, jos tiedoston teksti on sama kuin pinossa (otsikko ja tietorivit saavat erota). Sen jälkeen valikossa on *Kopioi linkki*.

### 12.3 Lähdeviite ja tiedosto

*Kopioi lähdeviite* kopioi viitteen muotoiltuna, ja *Lataa .md* antaa tekstin tiedostona. Merkintöjen tiedoston saa *Vie merkinnät* -kohdasta (luku 6.9).

## 13. Android-sovellus

Luin on myös Android-sovelluksena *Luin.* (asennustiedosto https://ollijuutilainen.github.io/luin/luin.apk; Android-selaimessa latauslinkki *Android-sovellus* on asetusten alimpana *palaute*-linkin vieressä). Avaa ladattu tiedosto ja salli kerran asennus selaimesta. Sovellus lataa saman lukimen verkosta, joten se päivittyy itsestään. Sen pino on sovelluksen oma: selaimen pino ei siirry sinne itsestään, mutta tekstit saa sinne postihuilulla.

Sovellus tuo selaimeen verrattuna:

- **Äänenvoimakkuusnapit kääntävät sivua** lukiessa (alas eteenpäin), ja pitkä painallus hyppää osioon. Pinossa, latomossa ja kirjoittaessa napit säätävät äänenvoimakkuutta.
- **Lataukset** (*Lataa .md*, merkintöjen vienti, zip) tallentuvat kansioon `Download/Luin`.
- **Kokoruutu** piilottaa järjestelmän palkit.
- **Ilman verkkoa** sovellus aukeaa välimuistista, jos se on avattu laitteella verkossa.
- **Jaa → Luin.**: teksti tai .md-tiedosto latomoon tarkistettavaksi; .md-, .markdown- ja .txt-osoite, Dropbox-linkki ja jakolinkki lukimeen. Pelkkä verkkosivun osoite ei aukea, koska sivun leikkaaminen on lukimeen-lisäosan työ.
- Ulkoiset linkit aukeavat järjestelmän selaimeen. Jos järjestelmä on lopettanut sovelluksen, viimeksi auki ollut teksti avautuu.
- Järjestelmän fonttikoko ei suurenna sivua: kirjasinkoko on lukimen asetus.

## 14. Tiedot ja yksityisyys

- **Kaikki on tässä selaimessa.** Pino, tekstit, lukukohdat, merkinnät ja asetukset tallentuvat tämän selaimen muistiin tällä laitteella. Toisessa selaimessa tai laitteessa pino on oma.
- **Selaimen tietojen tyhjennys** tältä sivustolta vie myös pinon ja merkinnät. Tärkeät merkinnät kannattaa viedä tiedostoon (luku 6.9).
- **Postihuilu** lähettää tekstit (30 päivää) ja valittaessa merkinnät (vuosi) lukimen postilaatikkoon (luku 9.5).
- **Sanaselitys** lähettää valitun sanan Wikisanakirjaan ja **lausekäännös** valitun tekstin DeepL:ään, vain napautuksesta. Sanaselityssivu lähettää kirjoitetun sanan sanakirjavalikossa valituille sanakirjoille (oletuksena Wikisanakirja ja Tieteen termipankki).
- **Luin-linkki** hakee tekstin sen osoitteesta.
- **Lukimeen-lisäosa** lukee vain sen välilehden, jolla painat sen kuvaketta (ja tarvittaessa saman sivuston sivuja, joilla artikkelin alaviitteet tai kirjan muut luvut ovat), ja vie tekstin latomoon. Se ei kerää eikä lähetä tietoja kenellekään. Lisäosan tietosuojaseloste on sivulla `luin/tietosuoja.html`.
- **Latomoon** viedyt tekstit eivät näy edes Ollille, ellei suoraa jakolinkkiä anneta.
- **Palaute** kulkee lomakkeelta Ollin postilaatikkoon.

## 15. Vinkkejä laitteittain

### 15.1 Sähköpaperilaite

- Paina asetuksista *Sähköpapyrosoi asetukset*: vaalea teema, TCF-valkaisu ja sivunkääntö ilman pyyhkäisyä.
- Sivunkääntönäppäimet kääntävät sivua, jos laite välittää ne selaimelle sivunvaihtonäppäiminä. Tarkista laitteen omista sovelluskohtaisista asetuksista, mitä näppäimet lähettävät.
- Ruudun reunanapautus ja nuolinapit ovat varmoja tapoja. Aikajanan veto pysähtyy portaille, joten ruutu ei välky turhaan.
- Jos maalaus ei jatku vetämällä, alleviivaa ensin yksi sana ja jatka kahvasta.
- Pitkä kaksikielinen teksti voi olla hitaalle laitteelle raskas: poimi pienempi paketti tai yksi kieli.

### 15.2 Puhelin

- Palkit avautuvat alareunan kaistasta. Yläreunan napautus avaa ne myös.
- Kokoruutu tai yksi pyyhkäisy ylöspäin antaa tekstille koko ruudun.
- Etsi, Sisälmys ja Merkinnät ovat palkkien ollessa auki alapalkissa, jos ne mahtuvat.
- Lukimeen-lisäosa toimii Androidilla vain Firefoxissa. Muussa selaimessa löydetyn tekstin voi lähettää puhelimeen postihuilulla.

### 15.3 Tietokone

- Hiirellä palkit ovat aina näkyvissä, ja oletuksena teksti rullaa.
- Leveällä näytöllä alaviitteet ovat tekstin vieressä, ja Etsi ja Merkinnät avautuvat marginaaleihin.
- Näppäimet: nuolet, PageUp, PageDown ja välilyönti kääntävät sivua, Enter vie seuraavaan hakuosumaan, Esc sulkee laatikon tai sammuttaa haun korostuksen, Ctrl+Enter tallentaa kirjauksen.

## 16. Palaute

Ongelmat, kehitysehdotukset, sivustotoiveet ja muut ajatukset lukimesta, latomosta ja lukimeen-lisäosasta voi lähettää suoraan Ollille palautesivulla (`luin/palaute.html`). Sinne pääsee asetusten alimmasta linkistä *palaute*, infolaatikon lopusta ja latomon lisäosarivin plussan takaa. Vain viesti on pakollinen; nimi ja sähköposti ovat vapaaehtoisia, ja sähköpostin kannattaa antaa, jos haluat vastauksen.

Hyvä vikailmoitus kertoo laitteen ja selaimen, tekstin (tai sivuston, jolta se on poimittu) ja sen, mitä teit ja mitä tapahtui.

## Liite: lukimen sanasto

- **ajoitus**: tekstin paikka aikajanalla, jos se on muu kuin julkaisuvuosi.
- **asiasana**: luokittelun sana; tekstillä voi olla monta.
- **haamu**: aikajanaa vedettäessä haalea merkki voimassa olevassa kohdassa.
- **huiluttaa**: lähettää teksti postihuilun laatikkoon.
- **kahva**: alleviivauksen pään nuppi, josta aluetta säädetään.
- **kellarin veivihyllystö**: pinon alla oleva näkymä laskeutuneille ja hyllytetyille teksteille.
- **kirjaus**: alleviivaukseen liitetty muistiinpano.
- **kohta**: kolmas otsikkotaso; myös numeroitu kohta tai osanvaihdon jakso.
- **kummitus**: aikajanalle hypyn lähtökohtaan jäävä ontto kolmio; myös sivun yli alleviivatessa palkkiin ilmestyvä neliö.
- **käsikirjasto**: kellarin veivihyllystön ylin osasto teksteille, joihin palataan aina.
- **laatikkolause**: postilaatikon avain.
- **laitos**: tekstin versio; *Lado uusi laitos* tekee uuden.
- **latomo**: tekstin tarkistus ja ladonta lukimeen.
- **lisätieto**: nimikkeen toinen rivi pinossa (sivusto, alaotsikko, teos tai tekijä).
- **luin-linkki**: lukimen osoite, joka avaa verkossa olevan tekstin.
- **lukimessa, lukimeen**: *luin* taivutettuna (*lukimen pino*); myös lukunäkymä, johon teksti avautuu.
- **lukimeen-lisäosa**: selainlisäosa *Lukimeen*.
- **luku**: ylin otsikkotaso.
- **luonnos**: katkoviivainen maalaus ennen alleviivausta.
- **lähdeviite**: tekstin koko lähdetieto; **lähdeviittaus**: tekstin osoitin kirjallisuusluetteloon.
- **maalaus**: tekstin valitseminen vetämällä.
- **majakka**: hypyn lähtökohta, jonne *Palaa takaisin* vie.
- **merkkipaalu**: aikajanan luku tai osio, johon osiohyppy pysähtyy.
- **nimike**: tekstin rivi pinossa.
- **osio**: toinen otsikkotaso.
- **pino**: lukimen etusivu, enintään tusina tekstiä.
- **porras**: sivu, jolle aikajanan veto pysähtyy sivutettuna.
- **postihuilu**: tekstien ja merkintöjen kuljetus laitteelta toiselle.
- **pöly**: himmennys, joka painaa tekstin pinon pohjalle.
- **Sisälmys**: tekstin sisällysluettelo aikajanan alla.
- **sukkela**: heti tapahtuva (*Sukkela alleviivaus*, *Sukkela sanaselitys*).
- **supersalmiakki**: Luinin sertifioiman sivuston merkki.
- **tusina**: pinon enimmäiskoko, 12 tekstiä.
- **ö-mappi**: kellarin veivihyllystön alla oleva mappi, otsikoltaan *Mappi ö*.
