# Luin: sivustoehdokkaat, neljäs satsi (tieteelliset lehtialustat)

Hyllyyn 21.11.2026. Jatkoa satsien 1–3 tiedostoille. Tehty samana päivänä (opas 7.5, `--sarja lehdet`): Springer Nature-
(BMC, Springer, nature.com), PLOS- ja Frontiers-sovitteet, PMC:n tekijä–vuosi-viittaukset ilman APA-pilkkua ja OJS:n
tiivistelmäleikkeen erilliset DOI:t edellisen kohdan perään.

## Mihin lukin taipuu tieteellisessä artikkelissa

- Teksti kokonaisena: tiivistelmä avainsanoineen, osiot, numeroviittaukset alaviitteinä viitteen tekstein (Vancouver),
  tekijä–vuosi-viittaukset linkkeinä kirjallisuuteen, kirjallisuusluettelo.
- Taulukot tekstiruudukkona; haku osuu niihin. Leveän taulukon esitystä kapealla ruudulla ei ole mitattu.
- Kuvista jää kuvateksti, kuvaaja ei tule. Rajaus, ei puute.
- Ei: kaavat kuvina (PLOS), lisäaineistot, viitteenhallinta. Pdf-lehdistä OJS:n tiivistelmäleike tai `pdf_to_markdown.py`.

## Alustat

Mitattu pilvikontista 21.11.2026; *esto* = kontti ei päässyt, selaimessa lisäosa lukee sivun silti.

| Lähde | Tila | Huomio |
|---|---|---|
| PubMed Central | sovite | Avoimet biolääketieteen artikkelit, myös osa suurten kustantajien OA-artikkeleista kopioina. reCAPTCHA peräkkäisille hauille. |
| Springer Nature (link.springer.com, BMC, nature.com) | sovite | BMC ohjautuu link.springer.comiin; taulukot omilta sivuiltaan. |
| PLOS | sovite | Taulukot XML:stä. |
| Frontiers | sovite | |
| journal.fi:n pdf-lehdet | OJS | Tiivistelmäleike; Anubis päästää curlin oman tunnisteen. |
| PubMed | esto (evästeseinä) | Vain tiivistelmä. Jatko: tiivistelmäleike metatiedoista ja PMC-linkki tekstinä; PMC-kopion haku toiselta sivustolta ei onnistu ilman taustaskriptiä. |
| Europe PMC | esto (403) | Sama sisältö kuin PMC. |
| medRxiv | esto (Cloudflare) | Esipainokset; mittaa selaimessa. |
| Elsevier, Wiley, T&F, SAGE, OUP, Cambridge, BMJ, The Lancet | esto (403) | Enimmäkseen maksumuurin takana; osa OA-artikkeleista PMC:ssä. Sovite vasta käyttäjän havainnosta. |
| Duodecim | Angular, sisältö skriptillä | Mittaa selaimessa. |
| Helda ja muut DSpace-arkistot | sovellus | Opinnäytteet pdf:nä. |
| Käypä hoito, Terveyskirjasto | toimii | Kliininen viiteteksti: haetaan, ei lueta (toisen satsin linjaus). |
| The Conversation | toimii | Tutkijoiden yleistajuiset artikkelit; mittaa yleinen leike ja lisenssi. |

## Kun jatketaan

1. PubMed-tiivistelmäsivu selaimessa: tiivistelmäleike vain, jos yleinen leike on huono.
2. The Conversation ja Duodecim yleisellä leikkeellä.
3. Suurten kustantajien OA-artikkelin sivu selaimessa, jos niitä luetaan muualta kuin PMC:stä.
