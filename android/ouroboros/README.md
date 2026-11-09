# ΒΟΡΟΦΘΟΡΟΣ (Android)

ΒΟΡΟΦΘΟΡΟΣ on Jetpack Compose -pohjainen erillinen Android-sovellus, joka tarjoaa
22 minuutin ja 22 sekunnin mittaisen rauhoittumisajastimen. Käyttöliittymä on
sijoitettu täysin Composeen ilman XML- tai WebView-kerroksia.

## Ohjaus

Kosketus toimii vain napin eli rinkulan alueella (neliö, jonka sivu on kaksi rinkulan
halkaisijaa); muualla ruudulla se ei tee mitään.

- **Napautus:** käynnistää kellon (soi), pysäyttää tauolle tai jatkaa.
- **Pitkä painallus (1 s):** pysäyttää kellon kokonaan kaikissa tiloissa (käyttäjän päätös
  9.11.2026). Soiva kello soi loppuun, eikä napautus sillä aikaa käynnistä uutta. Alusta
  aloittamista ei ole.

## Laitteen napit

Sovellus käsittelee Light Phone 3:n napit itse (`dispatchKeyEvent`), kun se on etualalla;
Key Mapperin ΒΟΡΟΦΘΟΡΟΣ-kartat poistetaan käytöstä.

| Nappi | Toiminto |
| --- | --- |
| 319 | taskulamppu päälle/pois |
| FOCUS | BinaryEye |
| pitkä äänenvoimakkuus ylös | Tusinasää sijaintilinkillä |
| pitkä äänenvoimakkuus alas | Tidal |
| ylös → alas (1 s) | Native Alpha |
| alas → ylös (1 s) | KEICK•WALK |

Lyhyt äänenvoimakkuuspainallus säätää mediaäänenvoimakkuutta napin noustessa; sarjan jälkeen
ensimmäisen painalluksen säätö perutaan. Muut napit menevät järjestelmälle. Toisen sovelluksen
avattuaan ΒΟΡΟΦΘΟΡΟΣ sulkeutuu. HOME-nappia sovellus ei saa koskaan (Android käsittelee sen
itse), joten pitkän HOME-painalluksen kartat jäävät Key Mapperiin.

Tusinasään token ja avain eivät ole repossa. Lisää ne Macin tiedostoon
`~/.gradle/gradle.properties`; ilman niitä ΒΟΡΟΦΘΟΡΟΣin rakennus keskeytyy virheeseen:

```properties
ouroboros.tusinasaa.token=<TOKEN>
ouroboros.tusinasaa.key=<AVAIN>
```

Asennus (`android`-kansiossa) ja nappiloki:

```bash
ANDROID_SERIAL=LP3LHMA541401108 ./gradlew :ouroboros:installDebug
adb -s LP3LHMA541401108 logcat | grep "nappi "
```

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
   **ΒΟΡΟΦΘΟΡΟΣ**.
4. Ensimmäisellä käynnistyskerralla sovellus jää lepotilaan, kunnes napautat
   näyttöä. Jos sovellus katoaa heti, tarkista laitteesta, ettei järjestelmä
   sulje sitä oikeuksien tai virransäästöasetusten vuoksi, ja varmista tarvittaessa
   `adb logcat` -lokista ettei ajossa näy poikkeuksia.
