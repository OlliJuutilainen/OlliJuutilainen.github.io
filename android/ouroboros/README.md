# Ouroboros (Android)

Ouroboros on Jetpack Compose -pohjainen erillinen Android-sovellus, joka tarjoaa
22 minuutin ja 22 sekunnin mittaisen rauhoittumisajastimen. Käyttöliittymä on
sijoitettu täysin Composeen ilman XML- tai WebView-kerroksia.

## Ohjaus

- **Napautus:** käynnistää, pysäyttää tai jatkaa ajastinta.
- **Tuplanapautus:** nollaa kuluneen ajan ja aloittaa uuden kierroksen.
- **Pitkä painallus:** palauttaa ajastimen lepotilaan ilman uutta käynnistystä.

Sovellus pitää näytön hereillä, piilottaa järjestelmäpalkit ja lukitsee
suunnan pystyasentoon. Viimeistelyvaihe näkyy kahden sekunnin ajan ennen kuin
ajastin palaa lepotilaan.

## Paikallinen äänitiedosto

Sovellus etsii kellon sointia tiedostosta `android/ouroboros/src/main/res/raw/kello.mp3`.
Binaaritiedostoja ei säilytetä tässä repossa, joten lisää äänitiedosto
paikallisesti kyseiseen kansioon (tai korvaa polku haluamallasi äänellä) ennen
kuin ajat sovelluksen.

## Assetit ja visuaalinen rakenne

- Compose-pohjainen sovellus ei käytä SVG-kuvaa ajan etenemisen rinkulaan, vaan
  piirtää taustan ja etenemiskaaren `Canvas`-komponentilla
  (`TimerRing`-funktio `MainActivity.kt`:ssä).
- WebView-pohjainen **Odotushuone**-moduuli tarvitsee tiedoston
  `android/odotushuone/src/main/assets/ouroboros.svg`, joten jos testaat myös
  sitä, varmista että kyseinen tiedosto löytyy luomastasi `assets`-kansiosta.

## Asennusvinkit

1. Varmista, että paikallinen Android SDK on asennettu ja että joko
   `ANDROID_HOME`-ympäristömuuttuja osoittaa sen juureen tai että
   `android/local.properties` sisältää rivin `sdk.dir=/polku/android-sdk`.
   Ilman tätä Gradle ei löydä tarvittavia työkaluja ja kokoaminen katkeaa.
2. Suorita komentoriviltä `./gradlew :ouroboros:assembleDebug` projektin
   `android`-kansion juuresta. Tämä kokoaa APK:n kansioon
   `ouroboros/build/outputs/apk/debug/`.
3. Asenna paketti laitteelle komennolla `adb install -r` ja valitse
   `ouroboros-debug.apk`. Asennuksen jälkeen sovellus löytyy nimellä
   **Ouroboros**.
4. Ensimmäisellä käynnistyskerralla sovellus jää lepotilaan, kunnes napautat
   näyttöä. Jos sovellus katoaa heti, tarkista laitteesta, ettei järjestelmä
   sulje sitä oikeuksien tai virransäästöasetusten vuoksi, ja varmista tarvittaessa
   `adb logcat` -lokista ettei ajossa näy poikkeuksia.
