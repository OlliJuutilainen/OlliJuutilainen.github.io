# Tusinasää 12 (Android)

Tämä hakemisto sisältää Android-sovelluksen, joka käynnistää Tusinasään työpajaversion
(`tusinapaja.html`) WebView-näkymässä. Sovellus lataa sivun verkosta
(`https://ollijuutilainen.github.io/tusinapaja.html`), jotta tuorein frontti päivittyy ilman
uutta buildiä. Verkoton ympäristö ei ole tuettu, koska itse työpajasivu hakee säätiedot
API-kutsuilla. Sovellus odottaa ensisijaisesti, että se avataan deeplinkillä (esim.
QR-koodista), joka sisältää sijaintitiedon joko koordinaatteina tai Cloudflare Worker
-palvelusta haettavana tunnisteena. Jos sovellus käynnistetään ilman deeplinkkiä,
oletussijaintina käytetään koordinaatteja `60.2633, 25.3244`, jolloin otsikoksi muodostuu
**"TUSINASÄÄ 12 · LEMMINKÄISEN TEMPPELI"**.

## Rakentaminen

```bash
./gradlew :app:assemblePerusDebug
```

Rakennettu APK löytyy `app/build/outputs/apk/debug/` -hakemistosta. Se voidaan asentaa
esimerkiksi `adb install` -komennolla. Huomaa, että juuriprojektiin on liitetty myös
kehitysvaiheessa olevat moduulit (`:odotushuone`, `:ouroboros`) sekä keikkasoitin
(`:soitin`). Siksi komennossa on moduuliprefiksi `:app:` – ilman sitä Gradle rakentaa
kaikki moduulit (ja kaatuu, jos soittimen tunnusta ei ole asetettu, ks. alla).

Projektissa on mukana Gradlen 8.4 wrapperi ja Android Gradle Plugin 8.3.2.

## Asentaminen laitteelle

Kun olet tässä `android`-hakemistossa ja Android-laite on yhdistetty USB:llä sekä ADB
on sallittu, voit asentaa debug-version suoraan komennolla:

```bash
./gradlew :app:installPerusDebug
```

Gradle kokoaa sovelluksen tarvittaessa ja kutsuu taustalla `adb install` -prosessia
vain `:app`-moduulille. Näin kehitysvaiheen sivuprojektit (`:odotushuone`,
`:ouroboros`) eivät päädy laitteelle vahingossa. Jos tarvitset muiden moduulien
asennuksia, kohdenna komento vastaavaan moduuliin (esim. `./gradlew :ouroboros:installDebug`).

## Sijaintiversiot (Haakis)

Sovelluksesta on kaksi varianttia (`productFlavors` tiedostossa `app/build.gradle`):

- **perus** (`fi.tusinasaa`, "Tusinasää 12"): kuten ennenkin, avautuu deeplinkillä tai
  oletussijaintiin.
- **haakis** (`fi.tusinasaa.haakis`, "Tusinasää Haakis"): asentuu perusversion rinnalle omalla
  kuvakkeellaan ja avaa aina sisäänrakennetun token+avain-parin. Sillä ei ole VIEW-suodattimia,
  joten `tusinasaa://`-linkit menevät edelleen perusversiolle.

Haakis-version token ja avain **eivät ole repossa**. Lisää ne Macin tiedostoon
`~/.gradle/gradle.properties` (generaattorin tulosteesta: `t=` ja `k=` Android-linkistä):

```properties
tusinasaa.haakis.token=<TOKEN>
tusinasaa.haakis.key=<AVAIN>
```

Rakennus ja asennus:

```bash
./gradlew :app:installHaakisDebug
```

Jos ominaisuudet puuttuvat, Gradle keskeyttää Haakis-rakennuksen virheeseen. Huomaa, että
`:app:assembleDebug` rakentaa molemmat variantit ja kaatuu siis samaan, ellei ominaisuuksia ole
asetettu. Jos purku epäonnistuu (esim. tokenia ei ole KV:ssä), sivu näyttää virheen eikä
vaihda oletussijaintiin.

Uusi sijaintiversio tehdään samalla mallilla: uusi flavor `build.gradle`en, kansio
`app/src/<nimi>/` (`AndroidManifest.xml` + `res/values/strings.xml`) ja ominaisuudet
`tusinasaa.<nimi>.token` / `.key`.

## Soitin (keikkasoitin Light Phonelle)

Moduuli `:soitin` (`fi.tusinasaa.soitin`, nimi "Soitin") avaa keikkasoittimen
(`https://ollijuutilainen.github.io/soitin/`) WebView-näkymässä samaan tapaan kuin Tusinasää
avaa työpajasivun. Sivu ladataan verkosta, koska worker antaa keikkatiedot vain
`ollijuutilainen.github.io`-alkuperälle. Sovellukseen paketoitu sivu ei saisi niitä.

Ensiversiossa keikka on kiinteä eikä sovelluksessa ole valintaa. Tunnus luetaan
rakennusvaiheessa Gradle-ominaisuudesta, eikä se ole repossa: tunnuksella saa workerista
keikan otsikon, äänilinkin ja biisilistan, ja repo on julkinen. Lisää Macin tiedostoon
`~/.gradle/gradle.properties`:

```properties
soitin.tunnus=<tunnus>
```

Rakennus ja asennus Light Phone 3:een:

```bash
./gradlew :soitin:installDebug -Pandroid.injected.device.serial=LP3LHMA541401108
adb -s LP3LHMA541401108 shell am start -n fi.tusinasaa.soitin/.MainActivity
```

Ilman tunnusta Gradle keskeyttää rakennuksen virheeseen. Key Mapperissa sovellus löytyy
nimellä "Soitin".

Toiminta:

- Soitto jatkuu, kun näyttö sammuu tai siirryt toiseen sovellukseen. Soiton ajaksi sovellus
  nousee etualapalveluksi ja pitää prosessorin hereillä (herätyslukko, enintään 6 h).
- Takaisin-painike soiton aikana vie sovelluksen taustalle. Tauolla se sulkee sovelluksen.
- Oikeassa yläkulmassa on kaksi nappia: ⟳ lataa sivun uudelleen ja × sulkee sovelluksen
  (myös kesken soiton). Seuraava käynnistys lataa sivun alusta. Napit lisää `silta.js`,
  joten verkkoversiossa niitä ei ole.
- `src/main/assets/silta.js` syötetään sivulle, kun se on latautunut. Se kertoo sovellukselle,
  soiko ääni ja mikä kappale on menossa. `soitin/index.html` ei itse tiedä sovelluksesta mitään.
- Kuulokkeiden ja muiden laitteiden mediapainikkeet ohjaavat soitinta: play/pause, seuraava
  (myös tuplapainallus), edellinen sekä pikakelaus eteen/taakse = ±15 s, jos laite lähettää
  sellaisen. Painallus painaa sivun omaa nappia `silta.js`:n `__soitinNappi`-funktion kautta,
  joten setin rajat pätevät kuten kosketuksella. Painikkeet toimivat ensimmäisestä soitosta
  sovelluksen sulkemiseen asti, myös tauolla.
- Jos sivu ei lataudu (esim. ei verkkoa), näkyy virheilmoitus ja "Yritä uudelleen" -painike.
- Android 13:ssa ja uudemmissa soittoilmoitus näkyy vain, jos ilmoituslupa on myönnetty.
  Sovellus ei kysy sitä, mutta soitto toimii ilmankin. Halutessasi:
  `adb -s LP3LHMA541401108 shell pm grant fi.tusinasaa.soitin android.permission.POST_NOTIFICATIONS`

Myöhemmin tunnus voi tulla QR-koodista tai tunnussanasta. Silloin se luetaan metodissa
`MainActivity.openPlayer()`, ja manifestiin lisätään VIEW-suodatin.

## QR-intentin pohja

Manifestissa on sekä `MAIN/LAUNCHER` -intentti että valmiit `VIEW`-intentit, jotka
hyväksyvät `https://ollijuutilainen.github.io/...`,
`https://localhost/...` sekä `tusinasaa://...` -linkit. Deeplink täyttää automaattisesti
WebView:lle välitettävät parametrit (lat/lon, otsikko sekä mahdolliset hash-tunnisteet).

## Manifestimuistio (kevät 2024)

Kevään 2024 paikalliseen Android-bildiin (`Tusinasää`) on lisätty seuraavat
manifestikovennukset. Ne eivät ole tällä hetkellä gitissä, joten muista kopioida ne
manifestiin, kun teet seuraavan APK:n:

- `android:noHistory="true"` ja `android:excludeFromRecents="true"`, jotta sovellus
  sulkeutuu WebView:n poistuttua eikä jää viimeisimpien sovellusten listalle.
- `android:screenOrientation="portrait"`, jotta näkymä lukittuu pystysuuntaan.
- `android:resizeableActivity="false"`, jotta moniajo/pienennys ei ole käytössä.
- Manifestissa käytetään paketilla `fi.tusinasaa` ja
  `@string/app_name` -resurssia sovelluksen nimenä.

Alla muistutus koko aktiviteettilohkosta:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:configChanges="keyboardHidden|orientation|screenSize"
    android:noHistory="true"
    android:excludeFromRecents="true"
    android:screenOrientation="portrait"
    android:resizeableActivity="false">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```
