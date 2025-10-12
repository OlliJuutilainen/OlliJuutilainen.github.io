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
./gradlew :app:assembleDebug
```

Rakennettu APK löytyy `app/build/outputs/apk/debug/` -hakemistosta. Se voidaan asentaa
esimerkiksi `adb install` -komennolla. Huomaa, että juuriprojektiin on liitetty myös
kehitysvaiheessa olevat moduulit (`:odotushuone`, `:ouroboros`). Siksi komennossa on
moduuliprefiksi `:app:` – ilman sitä Gradle rakentaa kaikki moduulit.

Projektissa on mukana Gradlen 8.4 wrapperi ja Android Gradle Plugin 8.3.2.

## Asentaminen laitteelle

Kun olet tässä `android`-hakemistossa ja Android-laite on yhdistetty USB:llä sekä ADB
on sallittu, voit asentaa debug-version suoraan komennolla:

```bash
./gradlew :app:installDebug
```

Gradle kokoaa sovelluksen tarvittaessa ja kutsuu taustalla `adb install` -prosessia
vain `:app`-moduulille. Näin kehitysvaiheen sivuprojektit (`:odotushuone`,
`:ouroboros`) eivät päädy laitteelle vahingossa. Jos tarvitset muiden moduulien
asennuksia, kohdenna komento vastaavaan moduuliin (esim. `./gradlew :ouroboros:installDebug`).

## QR-intentin pohja

Manifestissa on sekä `MAIN/LAUNCHER` -intentti että valmiit `VIEW`-intentit, jotka
hyväksyvät `https://tusinasaa.fi/...`, `https://ollijuutilainen.github.io/...`,
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
