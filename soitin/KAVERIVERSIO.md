# Keikkasoitin omalla Cloudflare-tilillä

Tällä ohjeella saat Ollin keikkasoittimen omaan käyttöösi niin, että **keikkasi ovat sinun
Cloudflare-tililläsi ja äänitiedostot sinun Dropboxissasi**. Ollin sivu toimii vain
näyttämönä: se soittaa keikan, jonka linkki osoittaa sinun tiliisi. Olli ei näe keikkojasi,
ellet anna hänelle linkkiä, eikä hänen tilinsä osallistu mihinkään.

Käyttöönotto vie noin puoli tuntia ja tehdään kerran. Sen jälkeen uusi keikka on viiden
minuutin homma: mp3 Dropboxiin, biisilista lomakkeeseen, yksi komento Terminaliin.

## Mitä tarvitset

- Macin, jossa on Terminal. Käyttöjärjestelmän versiolla ei ole väliä: komento käyttää vain
  `curl`- ja `security`-ohjelmia, jotka ovat valmiina jokaisessa Macissa. Node.js:ää tai
  muuta asennettavaa ei tarvita.
- Ilmaisen Cloudflare-tilin. Ilmaistason rajat (100 000 hakua ja 1 000 tallennusta päivässä)
  ovat moninkertaiset tähän tarpeeseen.
- Dropboxin äänitiedostoille.

## Miten osat liittyvät toisiinsa

```
Dropbox (mp3)  ←──────── soitin-sivu soittaa äänen suoraan Dropboxista
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

1. **Äänitiedosto Dropboxiin.** Jaa → *Kopioi linkki* (asetus: kuka tahansa linkin saanut
   voi katsoa).
2. **Avaa kirjanmerkki** ja varmista, että yläreunassa lukee *Omat asetukset*. Ilman sitä
   sivu tekee Ollin komennon, joka ei toimi sinun Macillasi.
3. **Täytä otsikko, Dropbox-linkki ja biisilista.** Sivun ohje kertoo biisilistan muodot,
   setit ja intron. Sivu muuttaa Dropbox-linkin suoraksi tiedostolinkiksi itse. Tarkista
   esikatselu.
4. **Kopioi komento → liitä Terminaliin → Enter.** Ensimmäinen vastausrivi sisältää
   `"success":true`, ja sen alla tulostuvat tallennetut keikan tiedot.
5. **Kopioi linkki ja avaa se itse ensin.** Linkki on muotoa
   `https://ollijuutilainen.github.io/soitin/#<tunnus>@soitin.<jotain>`.

Jos linkki näyttää heti tallennuksen jälkeen *Keikkaa ei löytynyt*, odota minuutti ja lataa
uudelleen. Cloudflare jakaa tallennuksen maailmalle viiveellä.

**Korjaus:** kirjoita keikan tunnus apusivun Tunnus-kenttään ja paina **Hae**. Korjaa, kopioi
uusi komento ja aja se. Linkki pysyy samana.

**Poisto:** Cloudflaressa **Workers KV → soitin**, avain `gig:<tunnus>` → poista. Jos haluat
vain lopettaa kuuntelun, voit myös poistaa Dropboxin jakolinkin.

**Kappaleen linkki:** soittimen biisilistan linkkinapit kopioivat linkin suoraan kappaleeseen
(`…#<tunnus>@soitin.<jotain>/3`). Ne toimivat sellaisenaan.

---

## Dropbox-kansio soittolistana (valinnainen)

Yhden äänitiedoston ja biisilistan sijaan keikaksi voi antaa jaetun Dropbox-kansion. Kansion
äänitiedostot ovat kappaleita nimen mukaisessa järjestyksessä, ja soitin soittaa ne
peräkkäin. Biisilistaa ei kirjoiteta: kappaleiden nimet tulevat tiedostonimistä.

- **Numeroi tiedostot:** `01 Intro.mp3`, `02 Toinen biisi.mp3` … `10 …`. Järjestys menee
  numeron mukaan (2 ennen 10:tä), ja alkunumero jää pois kappaleen nimestä. Alaviivat
  muuttuvat välilyönneiksi. `00 [Intro].mp3` saa numeron 0 kuten biisilistassakin.
  Huom: ilman numeroa nimen alussa oleva luku katoaa myös (`99 Luftballons.mp3` →
  *Luftballons*), joten numeroi aina.
- **Setit ovat alikansioita.** Jokainen alikansio on oma settinsä nimen mukaisessa
  järjestyksessä: `1`, `2` … Numeron jälkeinen nimi on setin otsikko (`3 (+)` → *(+)*,
  `2 Encore` → *(Encore)*). Pääkansion omat tiedostot ovat ensimmäinen setti. Syvemmät kansiot
  ja muut kuin äänitiedostot (kuvat, tekstit) ohitetaan.
- **Kansio luetaan joka kerta, kun soitin avataan.** Kansioon lisätty tai uudelleennimetty
  tiedosto näkyy seuraavalla avauksella ilman uutta komentoa.
- Enintään 44 tiedostoa (Cloudflaren ilmaistason raja).
- Kansion pitää olla **sinun omassa Dropboxissasi**, eli samalla tilillä, jolle alla tehdään
  avain. Toisen jakama kansio ei toimi.

### Käyttöönotto (kerran, noin 15 minuuttia)

Tämä tarvitaan yhden tiedoston keikkojen lisäksi. Ne toimivat edelleen ilman tätä.

**1. Päivitä workerin koodi.** Kansiotuki on uudessa koodissa. Toista kohdan 3 vaiheet 5–6
(**Edit code**, korvaa kaikki, **Deploy**). Sama on tehtävä aina, kun Olli kertoo
päivittäneensä workeria.

**2. Dropbox-sovellus.** Sovellus on vain avain, jolla workerisi saa lukea Dropboxiasi.

1. Avaa <https://www.dropbox.com/developers/apps> ja kirjaudu omalla Dropbox-tililläsi.
2. **Create app** → **Scoped access** → **Full Dropbox** → nimeksi esim. `soitin-` ja oma
   nimesi (nimen pitää olla Dropboxissa ainutlaatuinen) → **Create app**.
3. Välilehti **Permissions**: ruksi `files.metadata.read`, `files.content.read` ja
   `sharing.read`. Paina alhaalta **Submit**. Tee tämä **ennen** seuraavaa kohtaa, sillä
   avain saa vain ne oikeudet, jotka ovat päällä sen tekohetkellä.
4. Välilehti **Settings**: kopioi talteen **App key** ja **App secret** (*Show*).

Kaikki oikeudet ovat lukuoikeuksia: avaimella ei voi muuttaa eikä poistaa mitään.
App secret on kuitenkin salainen, eli **älä liitä sitä keskusteluun, äläkä myöskään Claudelle.**

**3. Pysyvä avain (refresh token).** Avaa selaimessa tämä osoite niin, että `APP_KEY`:n
tilalla on App key:

```
https://www.dropbox.com/oauth2/authorize?client_id=APP_KEY&response_type=code&token_access_type=offline
```

Hyväksy (**Continue → Allow**). Sivulle tulee koodi. Aja Terminalissa heti (koodi vanhenee
muutamassa minuutissa) korvaten `KOODI`, `APP_KEY` ja `APP_SECRET`:

```
curl -sS https://api.dropboxapi.com/oauth2/token -d code=KOODI -d grant_type=authorization_code -u APP_KEY:APP_SECRET
```

Vastauksessa on `"refresh_token": "…"`. Kopioi lainausmerkkien välinen osa talteen.
Se on salainen kuten App secret. Jos vastaus on `invalid_grant`, koodi ehti vanhentua tai sitä
käytettiin jo kerran. Avaa osoite uudelleen ja aja komento uudella koodilla.

**4. Salaisuudet workeriin.** Avaa worker (**Workers & Pages → soitin**) → **Settings →
Variables and Secrets → Add**. Lisää kolme muuttujaa, joiden **Type** on **Secret**:

| Variable name | Arvo |
|---|---|
| `DROPBOX_APP_KEY` | App key |
| `DROPBOX_APP_SECRET` | App secret |
| `DROPBOX_REFRESH_TOKEN` | refresh token |

Nimet täsmälleen näin, isoilla kirjaimilla. Paina **Deploy** (tai *Save*).

**Tarkistus:** avaa selaimessa `https://soitin.<jotain>.workers.dev/api/dropbox`.

| Näet | Tarkoittaa |
|---|---|
| `{"ok":true}` | Kaikki kunnossa. |
| `{"error":"dropbox_not_configured"}` | Jokin kolmesta salaisuudesta puuttuu tai sen nimi on väärin. Kohta 4. |
| `{"error":"dropbox_auth"}` | Dropbox ei hyväksynyt avaimia: App key, App secret ja refresh token eivät kuulu yhteen. Kohdat 2–4. |
| `{"error":"not_found"}` | Workerin koodi on vanha. Kohta 1. |

### Uusi kansiokeikka

1. **Kansio Dropboxiin** ja tiedostot numeroituina sinne. Kansion **Jaa → Kopioi linkki**
   (kuka tahansa linkin saanut voi katsoa). Kopioi nimenomaan kansion linkki
   (`dropbox.com/scl/fo/…`), ei yksittäisen tiedoston.
2. **Avaa kirjanmerkki** (*Omat asetukset* näkyvissä), täytä otsikko ja käännä kytkin
   asentoon **kansio**. Liitä kansion linkki.
3. **Kopioi komento → Terminal → Enter**, kuten tavallisessa keikassa.
4. **Tarkista kappaleet:** kirjoita tunnus apusivun Tunnus-kenttään ja paina **Hae**.
   Esikatselu näyttää kappaleet ja setit sellaisina kuin worker ne kansiosta lukee. Jos
   järjestys on väärä, nimeä tiedostot uudelleen Dropboxissa; uutta komentoa ei tarvita.
5. **Avaa linkki itse ensin.** Soitin mittaa avautuessaan jokaisen tiedoston keston
   (*Ladataan kappaleita… 3/12*), joten avaus kestää hetken pidempään kuin yhden tiedoston keikassa.

Kappaleiden välissä voi olla lyhyt tauko, kun seuraava tiedosto latautuu. Jos esitys on yksi
yhtenäinen äänite, yksi tiedosto ja biisilista toimivat saumattomasti.

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
| Soitin: *Äänitiedoston lataaminen epäonnistui* | Dropbox-linkki on poistettu tai väärä. Tee jakolinkki uudelleen ja korjaa keikka. |
| Soitin: *Keikan kansiota ei saatu Dropboxista* | Alla oleva selitys kertoo syyn. Tarkista ensin `…/api/dropbox` (kohta *Dropbox-kansio → Tarkistus*). |
| Soitin: *Kansio ei ole sen Dropbox-tilin omistama…* | Kansio on toisen jakama tai avain on tehty eri Dropbox-tilillä. Siirrä kansio omaan Dropboxiisi. |
| Soitin: *Kansion jakolinkkiä ei löytynyt* | Kansion jakolinkki on poistettu tai luotu uudelleen. Kopioi uusi linkki ja tallenna keikka uudelleen samalla tunnuksella. |
| Soitin: *Kaikkia kappaleita ei saatu ladattua* | Lueteltuja tiedostoja ei voinut soittaa (ehkä vioittunut tai muoto, jota selain ei tunne). Muut soivat. |

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
> Koneeni on Mac (macOS-versio: ____). Puhelimeni on iPhone. Kun käyttöönotto on valmis,
> tehdään yhdessä testikeikka ja käydään läpi ohjeen iPhone-kohdan tarkistukset.
