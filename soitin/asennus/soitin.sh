#!/bin/bash
# Keikkasoittimen komennot pikakäyttöönoton jälkeen (soitin/pikakayttoonotto.html).
# asenna.sh tallentaa tämän tiedostoksi ~/.soitin/soitin. Keikkaloihdin tekee
# tallennuskomennon valmiiksi; muut komennot ajetaan käsin.
set -eu

DIR=$HOME/.soitin
export PATH="$DIR/node/bin:$PATH"
export WRANGLER_SEND_METRICS=false
# Testeissä SOITIN_KV=--local, jolloin Wrangler käyttää koneen omaa tietokantaa.
KV=${SOITIN_KV:---remote}
OSOITE=$(cat "$DIR/osoite" 2>/dev/null || true)

# Wrangler ajetaan kansiossa ~/.soitin, ettei sen välimuisti (.wrangler) synny siihen
# kansioon, jossa komento sattuu olemaan ajettu.
w() { (cd "$DIR" && node "$DIR/node_modules/wrangler/bin/wrangler.js" --config "$DIR/wrangler.json" "$@"); }

# Wrangler kehottaa virheen jälkeen päivittämään itsensä. Versio on lukittu tarkoituksella.
trap 'echo "Huom: jos Wrangler kehottaa yllä päivittämään itsensä, se on väärä hälytys; älä päivitä." >&2' ERR

tunnus() {
  case "$1" in
    "" | *[!a-z0-9]*) echo "Keikan tunnus puuttuu tai on väärän muotoinen: '$1'" >&2; exit 2 ;;
  esac
}

case "${1:-}" in
  tallenna)
    [ $# -eq 3 ] || { echo "Käyttö: ~/.soitin/soitin tallenna <tunnus> '<keikka>' (Keikkaloihdin tekee tämän)" >&2; exit 2; }
    tunnus "$2"
    w kv key put "gig:$2" "$3" --binding LOCATIONS "$KV" >/dev/null
    TALLESSA=$(w kv key get "gig:$2" --binding LOCATIONS "$KV" --text)
    if [ "$TALLESSA" = "$3" ]; then
      printf '%s\n\nTallennettu: gig:%s\n' "$TALLESSA" "$2"
    else
      printf '%s\n\nTallennettu arvo ei vastaa annettua. Aja komento uudelleen.\n' "$TALLESSA" >&2
      exit 1
    fi
    ;;
  hae)
    [ $# -eq 2 ] || { echo "Käyttö: ~/.soitin/soitin hae <tunnus>" >&2; exit 2; }
    tunnus "$2"
    w kv key get "gig:$2" --binding LOCATIONS "$KV" --text
    echo
    ;;
  poista)
    [ $# -eq 2 ] || { echo "Käyttö: ~/.soitin/soitin poista <tunnus>" >&2; exit 2; }
    tunnus "$2"
    w kv key delete "gig:$2" --binding LOCATIONS "$KV" >/dev/null
    echo "Poistettu: gig:$2"
    ;;
  paivita)
    exec /bin/bash -c "$(curl -fsSL https://ollijuutilainen.github.io/soitin/asennus/asenna.sh)"
    ;;
  drive-avain)
    echo "Liitä Googlen API-avain, kun Wrangler kysyy (Enter a secret value), ja paina Enter."
    echo "Avain ei näy kirjoittaessa."
    w secret put GOOGLE_API_KEY
    if [ -n "$OSOITE" ]; then
      echo "Tarkistus (https://$OSOITE.workers.dev/api/drive):"
      sleep 5
      curl -sS "https://$OSOITE.workers.dev/api/drive"
      echo
    fi
    ;;
  poista-asennus)
    printf 'Poistetaanko kansio ~/.soitin ja Wranglerin kirjautuminen tältä Macilta?\n'
    printf 'Keikat ja worker säilyvät Cloudflaressa. Kirjoita k ja Enter: '
    read -r VASTAUS
    [ "$VASTAUS" = "k" ] || { echo "Ei poistettu."; exit 0; }
    w logout || true
    rm -rf "$DIR"
    echo "Poistettu."
    ;;
  *)
    if [ -n "$OSOITE" ]; then
      echo "Keikkaloihdin (kirjanmerkki):"
      echo "  https://ollijuutilainen.github.io/soitin/uusi.html#w=$OSOITE&tapa=pika"
      echo
    fi
    cat <<'OHJE'
Komennot:
  ~/.soitin/soitin tallenna <tunnus> '<keikka>'   Keikkaloihtimen tekemä tallennus
  ~/.soitin/soitin hae <tunnus>                    näyttää tallennetun keikan
  ~/.soitin/soitin poista <tunnus>                 poistaa keikan
  ~/.soitin/soitin paivita                         päivittää workerin koodin
  ~/.soitin/soitin drive-avain                     Googlen API-avain kansiokeikkoja varten
  ~/.soitin/soitin poista-asennus                  poistaa asennuksen tältä Macilta
Ohje: https://ollijuutilainen.github.io/soitin/pikakayttoonotto.html
OHJE
    ;;
esac
