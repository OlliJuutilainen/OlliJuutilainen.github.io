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
