# Luin: sosiaalilääketieteen tutkija lukijana

Hyllyyn 21.11.2026. Käyttäjän kysymys: miten Helsingin yliopiston sosiaalilääketieteen post doc -tutkija (ei lääketieteen
taustaa; aiheina esimerkiksi lihavuus, syömishäiriöt ja huono-osaisen taustan vaikutukset) voisi hyötyä lukimesta, mihin asti
se taipuu ja mitä apajia vielä olisi. Tilastografiikkaa ei toisteta, eikä sitä haluta minimalistiseen md-pakkaan.

Samana päivänä tehty (opas 7.5, `--sarja slt`): Springer Nature- (BMC, Springer, nature.com), PLOS- ja Frontiers-sovitteet,
PMC:n tekijä–vuosi-viittaukset ilman APA-pilkkua ja OJS:n tiivistelmäleikkeen erilliset DOI:t edellisen kohdan perään.

## Mihin lukin taipuu

- **Artikkeli kokonaisena tekstinä**: tiivistelmä avainsanoineen, osiot, numeroviittaukset alaviitteinä viitteen tekstein
  (Vancouver), tekijä–vuosi-viittaukset linkkeinä kirjallisuuteen, kirjallisuusluettelo. Alleviivaukset, kirjaukset ja
  merkintöjen vienti toimivat kuten humanistisessa tekstissä.
- **Taulukot tekstinä** (ruudukko, yhdistetyt solut tyhjiksi): regressiotaulukot ja perustaulukot ovat luettavissa, ja haku
  osuu niihin. Leveän taulukon esitystä kapealla ruudulla ei ole mitattu (lukijan testi 412 px:llä: leikkautuvia rivejä 0).
- **Kuvista jää kuvateksti** (*Fig. 1 …*): kuvaaja itse ei tule. Tämä on rajaus, ei puute: kuvaajat luetaan lähteestä.
- **Ei**: kaavat kuvina (PLOS), lisäaineistot, interaktiiviset kuvat, viitteenhallinta (EndNote ja Zotero hoitavat sen;
  lukimen lähdeviite on Teologian tyyli).
- Pdf:nä julkaistu (Sosiaalilääketieteellinen aikakauslehti, Yhteiskuntapolitiikka, THL:n raportit, Heldan väitöskirjat):
  OJS-lehdestä tiivistelmäleike, muuten `pdf_to_markdown.py` ja Latomo.

## Apajat

Mitattu pilvikontista 21.11.2026; *esto* = kontti ei päässyt, selaimessa lisäosa lukee sivun silti (yleinen leike tai sovite).

| Lähde | Tila | Huomio |
|---|---|---|
| PubMed Central | sovite | Avoimet biolääketieteen artikkelit, myös osa Elsevierin, Wileyn, SAGEn ja T&F:n OA-artikkeleista kopioina. Kontti saa reCAPTCHAn peräkkäisistä hauista. |
| BMC (BMC Public Health, Journal of Eating Disorders, International Journal for Equity in Health, IJBNPA) | sovite | Ohjautuu link.springer.comiin. |
| Springer (Social Psychiatry and Psychiatric Epidemiology, Eating and Weight Disorders) ja nature.com (International Journal of Obesity) | sovite | Vain avoimet artikkelit kokonaisina. |
| PLOS ONE, PLOS Medicine, PLOS Global Public Health | sovite | Taulukot XML:stä. |
| Frontiers (Psychology, Psychiatry, Public Health, Nutrition) | sovite | |
| Sosiaalilääketieteellinen aikakauslehti (journal.fi/sla) | OJS, pdf | Tiivistelmäleike; koko teksti pdf:stä. |
| PubMed (pubmed.ncbi.nlm.nih.gov) | esto (evästeseinä) | Vain tiivistelmä. Mahdollinen jatko: tiivistelmäleike metatiedoista ja PMC-linkki näkyvänä tekstinä (vrt. `ojsTiivistelma()`); PMC-kopion haku toiselta sivustolta ei onnistu ilman taustaskriptiä. |
| Europe PMC | esto (403) | Sama sisältö kuin PMC; ei tarvetta. |
| medRxiv | esto (Cloudflare) | Esipainokset; mittaa selaimessa. |
| Elsevier (Social Science & Medicine, SSM – Population Health, Appetite, Body Image), Wiley (Obesity Reviews, International Journal of Eating Disorders, Sociology of Health & Illness), T&F (Fat Studies), SAGE, OUP, Cambridge, BMJ (JECH), The Lancet | esto (403) | Suurin osa maksumuurin takana; osa OA-artikkeleista on PMC:ssä. Selaimessa yleinen leike; sovite vasta käyttäjän havainnosta. |
| Duodecim (duodecimlehti.fi) | Angular, sisältö skriptillä | Mittaa selaimessa; osa maksullista. |
| Helda (helda.helsinki.fi) | DSpace-sovellus | Väitöskirjat pdf:nä. |
| Käypä hoito, Terveyskirjasto | toimii | Kliininen viiteteksti: haetaan, ei lueta (toisen satsin linjaus). Lihavuuden ja syömishäiriöiden suositukset ovat rajatapaus. |
| The Conversation | toimii (572 kt) | Tutkijoiden yleistajuiset artikkelit; mittaa yleinen leike ja lisenssi. |

## Kun jatketaan

1. PubMed-tiivistelmäsivu: mittaa selaimessa, mitä yleinen leike antaa; tiivistelmäleike vain, jos se on huono.
2. The Conversation ja Duodecim yleisellä leikkeellä.
3. Elsevierin ja Wileyn OA-artikkelin sivu selaimessa (käyttäjän tai tutkijan koneelta), jos niitä luetaan muualta kuin PMC:stä.
