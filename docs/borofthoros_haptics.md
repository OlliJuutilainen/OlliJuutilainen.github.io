# ΒΟΡΟΦΘΟΡΟΣ – Haptisen palautteen vianetsintä

## Mahdolliset syyt
- **Laitteen laitteistotila**: Värinämoottori voi olla viallinen, liittimet irti tai järjestelmä käynnissä virransäästötilassa, joka estää haptiset signaalit.
- **Käyttöjärjestelmän asetukset**: Androidin ääni- ja värinäasetukset, "Älä häiritse" -tila tai sovelluksen ilmoituskanavan haptiset asetukset voivat olla pois päältä.
- **Sovelluksen logiikka**: Haptista palautetta kutsutaan vanhentuneilla API-kutsuilla, väärässä säikeessä tai väärässä kontekstissa (esim. ennen kuin `Vibrator` on hankittu).
- **Käyttöoikeudet**: Puuttuva `VIBRATE`-oikeus tai valmistajakohtaiset virransäästörajat voivat estää värinän.
- **Laitekohtaiset rajoitukset**: Jotkin valmistajat vaimentavat heikot haptiset signaalit tai vaativat erikoisrajapintoja.

### Miksi pitkä painallus ei värisytä nyt?
- **Nykyinen toteutus tukeutuu Compose-hapticsiin**: `MainActivity`n pointer-logiikka kutsuu `haptics.performHapticFeedback(HapticFeedbackType.LongPress)` vain, jos pitkä painallus täyttyy ja tila sallii toiminnon.【F:android/ouroboros/src/main/java/fi/ouroboros/android/MainActivity.kt†L286-L307】
- **Kutsu kunnioittaa järjestelmäasetuksia**: Compose delegoi `performHapticFeedback`in näkymälle, jolloin Android jättää värinän väliin, jos käyttäjä on kytkenyt “Kosketusvärinä”/“Touch feedback” -asetuksen pois tai intensiteetin hyvin matalaksi.
- **Sovelluksella ei ole `VIBRATE`-oikeutta**: Manifestissa ei toistaiseksi pyydetä `android.permission.VIBRATE`-oikeutta, joten emme voi ottaa käyttöön omaa `VibratorManager`-varmistusta järjestelmärajoitteiden ohittamiseksi.【F:android/ouroboros/src/main/AndroidManifest.xml†L1-L22】
- **Pitkän painalluksen toiminto vaatii sopivan tilan**: Tilassa `IdleAudioLock` ja `Finishing` long press -haara palauttaa `null`, jolloin värinä ja toiminto jätetään väliin – käyttäjän on helppo tulkita tämä “ei värise” -ongelmaksi, vaikka logiikka suojaa tilasiirtymiä.【F:android/ouroboros/src/main/java/fi/ouroboros/android/MainActivity.kt†L292-L303】

## Vianhakulista
1. Varmista Android-asetuksista, että värinä on käytössä järjestelmätasolla ja sovelluksen ilmoituskanavassa.
2. Lisää manifestiin `android.permission.VIBRATE` ja varmista, että Play Protect / käyttäjä hyväksyy päivityksen.
3. Toteuta Compose-hapticsin rinnalle `VibratorManager`-fallback (esim. pitkä painallus -> kevyt `VibrationEffect.startComposition()`), jotta varmistetaan tuntuma myös silloin, kun järjestelmävaimennus on päällä.
4. Testaa värinä suoraan debug-sovelluksella tai `adb shell` -komennolla varmistaaksesi laitteistotoiminnan.
5. Tarkista lokit (`adb logcat`) käynnin aikana mahdollisten virheilmoitusten varalta.

```kotlin
@RequiresPermission(Manifest.permission.VIBRATE)
private fun HapticFeedback.performOrFallback(vibratorManager: VibratorManager?) {
    performHapticFeedback(HapticFeedbackType.LongPress)
    if (vibratorManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val effect = VibrationEffect.startComposition()
            .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 1f)
            .addPrimitive(VibrationEffect.Composition.PRIMITIVE_TICK, 0.6f)
            .compose()
        vibratorManager.defaultVibrator.vibrate(effect)
    }
}
```
