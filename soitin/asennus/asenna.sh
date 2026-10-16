#!/bin/bash
# Keikkasoittimen pikakäyttöönotto (soitin/pikakayttoonotto.html). Ajetaan Terminalissa:
#   /bin/bash -c "$(curl -fsSL https://ollijuutilainen.github.io/soitin/asennus/asenna.sh)"
#
# Tämä osa lataa Node.js:n ja Wranglerin kansioon ~/.soitin eikä koske muualle koneeseen.
# Varsinainen työ (kirjautuminen, tietokanta, worker, kirjanmerkki) on asenna.mjs:ssä.
# Uudelleen ajettuna päivittää workerin koodin; tietokanta ja keikat säilyvät.
#
# Versiot on kiinnitetty, jotta Keikkageneraattorin komennot pysyvät samoina. Macin
# /bin/bash on versio 3.2, joten tässä ei käytetä bash 4:n ominaisuuksia.
set -euo pipefail

NODE_V=v24.21.0
WRANGLER_V=4.145.0
LAHDE=${SOITIN_LAHDE:-https://ollijuutilainen.github.io}
DIR=$HOME/.soitin

virhe() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }
vaihe() { printf '\n\033[1m%s\033[0m\n' "$*"; }

# Linux kelpaa vain kokeiluihin; ohje on Macille.
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) ALUSTA=darwin-arm64 ;;
  Darwin-x86_64) ALUSTA=darwin-x64 ;;
  Linux-x86_64) ALUSTA=linux-x64 ;;
  Linux-aarch64) ALUSTA=linux-arm64 ;;
  *) virhe "Tälle koneelle ei ole asennusta: $(uname -s) $(uname -m)." ;;
esac

mkdir -p "$DIR/worker"

if [ "$("$DIR/node/bin/node" --version 2>/dev/null || true)" != "$NODE_V" ]; then
  vaihe "Ladataan Node.js $NODE_V (noin 50 Mt)..."
  TMP=$(mktemp -d)
  TIED=node-$NODE_V-$ALUSTA.tar.gz
  curl -fsSL "https://nodejs.org/dist/$NODE_V/$TIED" -o "$TMP/$TIED" || virhe "Node.js:n lataus epäonnistui. Tarkista verkkoyhteys ja aja komento uudelleen."
  curl -fsSL "https://nodejs.org/dist/$NODE_V/SHASUMS256.txt" -o "$TMP/SHASUMS256.txt" || virhe "Node.js:n tarkistussummien lataus epäonnistui."
  ODOTETTU=$(awk -v f="$TIED" '$2 == f { print $1 }' "$TMP/SHASUMS256.txt")
  if command -v shasum >/dev/null 2>&1; then
    SAATU=$(shasum -a 256 "$TMP/$TIED" | awk '{ print $1 }')
  else
    SAATU=$(sha256sum "$TMP/$TIED" | awk '{ print $1 }')
  fi
  if [ -z "$ODOTETTU" ] || [ "$ODOTETTU" != "$SAATU" ]; then
    rm -rf "$TMP"
    virhe "Ladatun Node.js:n tarkistussumma ei täsmää. Aja komento uudelleen."
  fi
  tar -xzf "$TMP/$TIED" -C "$TMP"
  rm -rf "$DIR/node"
  mv "$TMP/node-$NODE_V-$ALUSTA" "$DIR/node"
  rm -rf "$TMP"
fi
export PATH="$DIR/node/bin:$PATH"
export WRANGLER_SEND_METRICS=false

ASENNETTU=$(node -p 'try { require(process.argv[1]).version } catch (e) { "" }' "$DIR/node_modules/wrangler/package.json")
if [ "$ASENNETTU" != "$WRANGLER_V" ]; then
  vaihe "Asennetaan Wrangler $WRANGLER_V (Cloudflaren työkalu, noin 200 Mt)..."
  npm install --prefix "$DIR" --cache "$DIR/.npm" --no-fund --no-audit --no-update-notifier --loglevel=error "wrangler@$WRANGLER_V" \
    || virhe "Wranglerin asennus epäonnistui. Aja komento uudelleen."
  # npm:n välimuisti (noin 130 Mt) ei jää kotikansioon eikä asennukseen.
  rm -rf "$DIR/.npm"
fi

vaihe "Haetaan workerin koodi ja soittimen komennot..."
hae() {
  curl -fsSL "$LAHDE/$1" -o "$2.uusi" || virhe "Tiedoston $1 lataus epäonnistui. Aja komento uudelleen."
  mv "$2.uusi" "$2"
}
hae worker/src/index.js "$DIR/worker/index.js"
hae soitin/asennus/asenna.mjs "$DIR/asenna.mjs"
hae soitin/asennus/soitin.sh "$DIR/soitin"
chmod 755 "$DIR/soitin"

# </dev/tty: kysymykset toimivat, vaikka komento olisi ajettu putkella (curl … | bash).
exec node "$DIR/asenna.mjs" </dev/tty
