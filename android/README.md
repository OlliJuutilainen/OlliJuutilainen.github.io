# Tusinasää Kotkavuori (Android)

Tämä hakemisto sisältää Android-sovelluksen, joka käynnistää Tusinasään työpajaversion
(`tusinapaja.html`) WebView-näkymässä Kotkavuoren koordinaateilla (lat 60.1620, lon 24.8791).

## Rakentaminen

```bash
./gradlew assembleDebug
```

Rakennettu APK löytyy `app/build/outputs/apk/debug/` -hakemistosta. Se voidaan asentaa
esimerkiksi `adb install` -komennolla. Projektissa on mukana Gradlen 8.4 wrapperi ja
Android Gradle Plugin 8.3.2.

## QR-intentin pohja

Manifestissa on tällä hetkellä vain `MAIN/LAUNCHER` -intentti. Jos sovellus halutaan
käynnistää QR-koodilla, lisää manifestiin toinen `intent-filter`, joka reagoi haluamaasi
URI:in (`https://`-linkki tai oma skeema) ja generoi vastaava QR-koodi.
