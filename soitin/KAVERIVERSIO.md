# Keikkasoitin omalla Cloudflare-tilillä

Tällä ohjeella saat Ollin keikkasoittimen omaan käyttöösi niin, että **keikkasi ovat sinun
Cloudflare-tililläsi ja äänitiedostot sinun Dropboxissasi tai Google Drivessasi**. Ollin sivu toimii vain
näyttämönä: se soittaa keikan, jonka linkki osoittaa sinun tiliisi. Olli ei näe keikkojasi,
ellet anna hänelle linkkiä, eikä hänen tilinsä osallistu mihinkään.

Käyttöönotto vie noin puoli tuntia ja tehdään kerran. Sen jälkeen uusi keikka on viiden
minuutin homma: äänitiedosto Dropboxiin tai Driveen, biisilista lomakkeeseen, yksi komento
Terminaliin.

## Mitä tarvitset

- Macin, jossa on Terminal. Käyttöjärjestelmän versiolla ei ole väliä: komento käyttää vain
  `curl`- ja `security`-ohjelmia, jotka ovat valmiina jokaisessa Macissa. Node.js:ää tai
  muuta asennettavaa ei tarvita.
- Ilmaisen Cloudflare-tilin. Ilmaistason rajat (100 000 hakua ja 1 000 tallennusta päivässä)
  ovat moninkertaiset tähän tarpeeseen.
- Dropboxin tai Google Driven äänitiedostoille. Dropbox on kokeiltu soittimen kanssa; Drive
  ei vielä (ks. *Äänitiedosto Drivessa* alla).

## Miten osat liittyvät toisiinsa

```
Dropbox / Drive (ääni) ←── soitin-sivu soittaa äänen suoraan Dropboxista tai Drivesta
                              ↑
Cloudflare-worker  ──→  soitin-sivu hakee otsikon ja biisilistan workeristasi
     ↑
Cloudflare KV  ←── Terminal-komento tallentaa keikan (uusi.html tekee komennon)
```

- **Soitin**: `https://ollijuutilainen.github.io/soitin/#<tunnus>@<worker>`. Kaikki
  `#`-merkin jälkeinen jää selaimeen eikä kulje GitHubin palvelimille.
- **Apusivu** `soitin/uusi.html` tarkistaa biisilistan ja tekee valmiin komennon. Se ei
  lähetä mitään verkkoon.
- **Worker** on pieni ohjelma Cloudflaressa. Se lukee keikan KV-tietokannasta ja antaa sen
  soittimelle.
- **API-avain** (token) on Macisi avainnipussa. Komento lukee sen sieltä itse, joten avain ei
  näy ruudulla eikä päädy mihinkään tiedostoon.

Kuka tahansa, jolla on keikan linkki, näkee otsikon ja biisilistan ja voi kuunnella
äänitteen. Linkki on siis avain; tunnus on arvottu, joten sitä ei voi arvata.

---

## Käyttöönotto (kerran)

Cloudflaren näkymät muuttuvat välillä. Jos nappi on eri nimellä kuin tässä, etsi lähin
vastaava tai kysy Claudelta (ks. lopun kohta *Claudelle annettava ohje*).

### 1. Cloudflare-tili

Luo tili osoitteessa <https://dash.cloudflare.com/sign-up>. Kun olet kirjautunut,
selaimen osoiterivillä näkyy `dash.cloudflare.com/` ja sen perässä 32 merkin tunnus
(numeroita ja kirjaimia a–f). **Se on tilisi tunnus.** Kopioi se talteen.

### 2. KV-tietokanta

1. Vasemmasta valikosta **Storage & Databases → Workers KV**
   (suora linkki: <https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces>).
2. **Create instance** (tai *Create namespace*), nimeksi `soitin`, **Create**.
3. Listassa näkyy uuden nimiavaruuden **ID**, 32 merkkiä. Kopioi se talteen.

### 3. Worker

1. Vasemmasta valikosta **Workers & Pages → Create application**
   (suora linkki: <https://dash.cloudflare.com/?to=/:account/workers-and-pages>).
2. **Start with Hello World! → Get started**.
3. Nimeksi `soitin`, **Deploy**.
4. Sivulle tulee workerin osoite muotoa `https://soitin.<jotain>.workers.dev`.
   **Tuo `soitin.<jotain>` on workerisi nimi soittimen kannalta.** Kirjoita se talteen.
5. **Edit code**. Poista editorista kaikki ja liitä tilalle tämän tiedoston koko sisältö:
   <https://raw.githubusercontent.com/OlliJuutilainen/OlliJuutilainen.github.io/main/worker/src/index.js>
6. **Deploy**.

Koodissa on myös reitti `/api/loc`, joka liittyy Ollin sääsivuun. Sinun tililläsi se ei tee
mitään, joten anna sen olla.

### 4. Kytke worker tietokantaan

1. Avaa worker (**Workers & Pages → soitin**) ja valitse **Settings → Bindings → Add**.
2. **KV namespace**.
3. **Variable name**: `LOCATIONS` — täsmälleen näin, isoilla kirjaimilla. Koodi etsii
   tietokantaa tällä nimellä.
4. **KV namespace**: `soitin`.
5. **Deploy** (tai *Add binding*).

**Tarkistus:** avaa selaimessa `https://soitin.<jotain>.workers.dev/api/gig?k=testi1`.

| Näet | Tarkoittaa |
|---|---|
| `{"error":"not_found"}` | Kaikki kunnossa (testikeikkaa ei ole, kuuluukin olla näin). |
| `{"error":"bad_payload"}` | Kytkentä puuttuu tai nimi ei ole täsmälleen `LOCATIONS`. Palaa kohtaan 4. |
| `Hello World!` | Koodi ei ole vaihtunut. Palaa kohdan 3 vaiheisiin 5–6. |

### 5. API-avain

1. Oikeasta yläkulmasta oma profiili → **My Profile → API Tokens → Create Token**.
2. **Create Custom Token → Get started**.
3. Nimeksi `soitin`.
4. **Permissions**: `Account` · `Workers KV Storage` · `Edit`.
5. **Account Resources**: `Include` · oma tilisi.
6. **Continue to summary → Create Token**.
7. Avain näytetään **vain kerran**. Jätä sivu auki seuraavaa kohtaa varten.

Avaimella voi muuttaa kaikkia tilisi KV-tietokantoja. **Älä liitä sitä mihinkään
keskusteluun, sähköpostiin tai muistiinpanoon, äläkä myöskään Claudelle.**

### 6. Avain Macin avainnippuun

Avaa Terminal (Ohjelmat → Lisäohjelmat → Pääte) ja aja:

```
security add-generic-password -a "$USER" -s soitin-cf -w
```

Terminal kysyy avainta kaksi kertaa (`password data for new item` ja `retype`). Liitä se
molemmilla kerroilla ja paina Enter. Mitään ei näy kirjoittaessa; se on normaalia.

Tarkista, että Cloudflare hyväksyy avaimen:

```
curl -sS https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer $(security find-generic-password -s soitin-cf -w)"
```

Vastauksessa pitää olla `"status":"active"`. Nyt voit sulkea Cloudflaren avainsivun.

Jos avain menee vaihtoon, poista vanha ensin komennolla
`security delete-generic-password -s soitin-cf` ja tee tämä kohta uudelleen.

### 7. Kirjanmerkki apusivulle

Kokoa osoite talteen otetuista tiedoista (ilman kulmasulkeita):

```
https://ollijuutilainen.github.io/soitin/uusi.html#w=soitin.<jotain>&a=<tilin tunnus>&n=<KV-tunnus>
```

Avaa se ja tallenna kirjanmerkiksi. Sivun yläreunassa pitää lukea
**Omat asetukset: soitin.&lt;jotain&gt;.workers.dev**. Jos jokin tunnus on väärän mittainen,
sivu kertoo sen punaisella. Tunnukset eivät ole salaisia; ne vain kertovat, mihin
tallennetaan.

Valmista. Tee seuraavaksi testikeikka alla olevalla ohjeella.

---

## Uusi keikka

1. **Äänitiedosto Dropboxiin tai Driveen.** Tiedostomuodoista ks. *Äänitiedoston muoto* alla.
   - Dropbox: Jaa → *Kopioi linkki* (asetus: kuka tahansa linkin saanut voi katsoa).
   - Drive: Jaa → *Yleinen käyttöoikeus: Kaikki, joilla on linkki* → *Kopioi linkki*.
     Muuta linkki ennen seuraavaa vaihetta, ks. *Äänitiedosto Drivessa* alla.
2. **Avaa kirjanmerkki** ja varmista, että yläreunassa lukee *Omat asetukset*. Ilman sitä
   sivu tekee Ollin komennon, joka ei toimi sinun Macillasi.
3. **Täytä otsikko, äänitiedoston linkki ja biisilista.** Kentän otsikossa lukee
   *Dropbox*, mutta Driven muutettu linkki kelpaa samaan kenttään. Sivu muuttaa
   Dropbox-linkin suoraksi tiedostolinkiksi itse; Driven linkkiä se ei muuta. Sivun ohje
   kertoo biisilistan muodot, setit ja intron. Tarkista esikatselu.
4. **Kopioi komento → liitä Terminaliin → Enter.** Ensimmäinen vastausrivi sisältää
   `"success":true`, ja sen alla tulostuvat tallennetut keikan tiedot.
5. **Kopioi linkki ja avaa se itse ensin.** Linkki on muotoa
   `https://ollijuutilainen.github.io/soitin/#<tunnus>@soitin.<jotain>`.

### Äänitiedoston muoto

Soitin käyttää selaimen omaa äänitoistoa, joten muoto ratkaisee, soiko tiedosto kuulijan
laitteessa.

- **AAC** (`.m4a`) on toiminut Ollin rajallisissa kokeiluissa parhaiten. Suosi sitä.
- **MP3** soi kaikissa yleisissä selaimissa, myös iPhonen Safarissa.
- **WAV** soi yleensä, mutta keikan mittainen tiedosto on satoja megatavuja ja latautuu
  hitaasti puhelimeen.
- **FLAC, Ogg ja Opus**: tuki vaihtelee selaimen ja iPhonen version mukaan. Älä käytä niitä
  jaettavassa keikassa.

Keikka on aina yksi äänitiedosto; biisilista merkitsee siihen kappaleiden alkukohdat.

### Äänitiedosto Drivessa

Driven jakolinkki avaa esikatselusivun eikä itse tiedostoa, joten soitin ei voi soittaa sitä
sellaisenaan. Linkki on muotoa

```
https://drive.google.com/file/d/<TIEDOSTON-ID>/view?usp=sharing
```

Kopioi siitä `/d/`:n ja seuraavan `/`:n välinen osa ja kirjoita apusivulle tällainen linkki:

```
https://drive.usercontent.google.com/download?id=<TIEDOSTON-ID>&export=download&confirm=t
```

`confirm=t` ohittaa varoitussivun, jonka Drive näyttää isoista tiedostoista (se ei pysty
tarkistamaan niitä viruksilta).

**Tätä ei ole kokeiltu soittimen kanssa.** Testaa ennen ensimmäistä oikeaa jakoa: soiko ääni,
näkyykö kesto ja toimiiko kelaus keskelle. Kokeile myös iPhonen Safarissa. Jos jokin ei toimi,
kerro Ollille, mikä kohta petti ja mitä soitin näytti.

### Heti tallennuksen jälkeen

Jos linkki näyttää heti tallennuksen jälkeen *Keikkaa ei löytynyt*, odota minuutti ja lataa
uudelleen. Cloudflare jakaa tallennuksen maailmalle viiveellä.

**Korjaus:** kirjoita keikan tunnus apusivun Tunnus-kenttään ja paina **Hae**. Korjaa, kopioi
uusi komento ja aja se. Linkki pysyy samana.

**Poisto:** Cloudflaressa **Workers KV → soitin**, avain `gig:<tunnus>` → poista. Jos haluat
vain lopettaa kuuntelun, voit myös poistaa jakolinkin Dropboxista tai Drivesta.

**Kappaleen linkki:** soittimen biisilistan linkkinapit kopioivat linkin suoraan kappaleeseen
(`…#<tunnus>@soitin.<jotain>/3`). Ne toimivat sellaisenaan.

---

## Kun jokin ei toimi

| Oire | Syy ja korjaus |
|---|---|
| Terminal: `The specified item could not be found in the keychain` | Avain puuttuu avainnipusta. Kohta 6. |
| Terminal: `"success":false` ja `Authentication error` | Avain on väärä tai siltä puuttuu oikeus *Workers KV Storage · Edit*. Kohdat 5–6. |
| Terminal: `"success":false` ja maininta nimiavaruudesta tai tilistä | Kirjanmerkin `a=` tai `n=` on väärä. Kohdat 1, 2 ja 7. |
| Soitin: *Keikan tietoja ei saatu palvelimelta* (virhe 500) | Workerin kytkentä tietokantaan puuttuu. Kohta 4 ja sen tarkistus. |
| Soitin: *Keikan tietojen haku epäonnistui* | Linkin `@`-osa on väärin tai verkko ei toimi. Vertaa kohdan 3 osoitteeseen. |
| Soitin: *Keikkaa ei löytynyt* | Odota minuutti. Jos ei auta: tunnus väärin tai komento jäi ajamatta. |
| Soitin: *Äänitiedoston lataaminen epäonnistui* | Jakolinkki on poistettu tai väärä. Tee se uudelleen ja korjaa keikka. Drivessa tarkista myös, että linkki on muutettu (ks. *Äänitiedosto Drivessa*). |

Tallennuskomentoa ei ole vielä ajettu oikealla Cloudflare-tilillä; sinun testikeikkasi on
ensimmäinen. Jos tallennus antaa virheen, jota taulukossa ei ole, välitä Ollille Terminalin
vastaus sanatarkasti. API-avain ei tulostu siihen, joten sen voi kopioida sellaisenaan.

---

## iPhone

Soitin on verkkosivu, joten erillistä sovellusta ei tarvita. Avaa keikan linkki Safarissa ja
lisää se halutessasi kotinäyttöön (Jaa → *Lisää Koti-valikkoon*).

Näitä ei ole vielä kokeiltu iPhonella. Tarkista ne kerran ja kerro Ollille tulos:

1. Safarissa: paina toistoa ja lukitse näyttö. Jatkuuko ääni? Näkyvätkö lukitusnäytöllä
   kappaleen nimi ja ohjaimet?
2. Kotinäytön kuvakkeesta: aukeaako keikka vai tuleeko ilmoitus *Linkistä puuttuu keikan
   tunnus*?
3. Kotinäytön kuvakkeesta: jatkuuko ääni, kun näyttö lukittuu?

Jos kohta 2 tai 3 epäonnistuu, käytä Safarin välilehteä tai kirjanmerkkiä, kunnes asia on
korjattu.

---

## Claudelle annettava ohje

Jos haluat tehdä käyttöönoton yhdessä Clauden kanssa, aloita uusi keskustelu ja liitä tämä:

> Otan käyttöön ystäväni Ollin keikkasoittimen omalla Cloudflare-tililläni. Ohje on täällä:
> https://github.com/OlliJuutilainen/OlliJuutilainen.github.io/blob/main/soitin/KAVERIVERSIO.md
> (jos et pysty lukemaan sitä, sano, niin liitän sen tekstinä).
>
> Opasta minua yksi vaihe kerrallaan: kerro mitä teen, odota että kerron mitä näin, ja
> jatka vasta sitten. Cloudflaren näkymät ovat voineet muuttua ohjeen kirjoittamisen
> jälkeen; jos kuvaukseni ei vastaa ohjetta, auta löytämään vastaava kohta.
>
> Rajat:
> - Älä koskaan pyydä minua liittämään Cloudflaren API-avainta (tokenia) keskusteluun.
>   Tilin tunnus, KV-tunnus ja workerin osoite eivät ole salaisia, joten ne saa näyttää.
> - Soitinsivu (`soitin/index.html`), apusivu (`soitin/uusi.html`) ja worker-koodi ovat
>   Ollin. Jos jokin vaatisi niihin muutoksen, kirjoita minulle viesti Ollille välitettäväksi,
>   äläkä neuvo muokkaamaan niitä omin päin.
> - Jos jokin vaihe tuntuu turhan raskaalta, saat ehdottaa kevyempää tapaa, mutta kerro
>   ensin mitä se maksaa ja mitä siinä menetetään.
>
> Koneeni on Mac (macOS-versio: ____). Puhelimeni on iPhone. Äänitiedostot ovat
> (Dropboxissa / Google Drivessa): ____. Kun käyttöönotto on valmis,
> tehdään yhdessä testikeikka ja käydään läpi ohjeen iPhone-kohdan tarkistukset.
