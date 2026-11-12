/* Lisää lukimeen: ponnahdusikkuna. Ei taustaskriptiä: ikkuna ajaa leikkurin välilehdellä, jättää tuloksen lisäosan
   muistiin ja avaa Latomon, jonka latomoon.js täyttää. Androidin Firefoxissa ei ole valikko- eikä pikanäppäinrajapintaa,
   joten kaikki tapahtuu tästä ikkunasta.
   Postihuilu (käyttäjän pyynnöt 9.11.2026 ja 10.11.2026; ennen Lähetä postina -valinta): napista aukeavat laatikkolause,
   Soita huilua! ja ohje. Soita huilua! antaa leikkeen Latomolle, joka lähettää sen laatikkoon ja, kun Lisää tämän selaimen
   lukulistaan heti on valittuna (oletus), avaa sen myös tämän selaimen Luinissa. Ilman sitä teksti ei tule tämän selaimen
   lukulistaan eikä lause jää Latomon muistiin (kaverin kone). Lauseen sääntö ja ohje ovat samat kuin luin/posti.js:ssä
   (kopio, koska lisäosa ei lataa sivuston tiedostoja); lause ja valinnat muistetaan lisäosan muistissa.
   Arvo (0.7.0, käyttäjän pyyntö 12.11.2026): laatikkolause.js on tavulleen sama kopio kuin luin/laatikkolause.js
   (laatikkolause-testi.js tarkistaa); virke näkyy napin vieressä, kunnes kentän lause muuttuu. */
const api = globalThis.browser || globalThis.chrome;
const LATOMO = 'https://ollijuutilainen.github.io/luin/latomo.html#lisaosa';
const TIEDOSTOT = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js'];
const $ = id => document.getElementById(id);
const luku = n => n.toLocaleString('fi-FI') + (n === 1 ? ' sana' : ' sanaa');
let leike = null, arvottu = null;

// Sama kuin luin/posti.js: koodi() ja koodiVirhe().
function koodi(s) {
  s = String(s || '').trim();
  const m = /^https?:\/\/\S*#l=([^&\s]*)$/i.exec(s);
  if (m) { try { s = decodeURIComponent(m[1]); } catch (e) { s = m[1]; } }
  return s.trim().toLowerCase();
}
function koodiVirhe(k) {
  if (!k) return 'Anna laatikkolause.';
  const vaarat = [];
  String(k).replace(/[^a-z0-9-]/g, c => {
    c = /\s/.test(c) ? 'välilyönti' : '”' + c + '”';
    if (!vaarat.includes(c)) vaarat.push(c);
  });
  if (vaarat.length) return 'Laatikkolauseessa saa olla vain kirjaimia a–z, numeroita ja yhdysmerkkejä (-). Ei kelpaa: ' + vaarat.join(', ') + '.';
  if (k.length < 24) return 'Laatikkolauseessa on oltava vähintään 24 merkkiä (nyt ' + k.length + ').';
  if (k.length > 52) return 'Laatikkolauseessa voi olla enintään 52 merkkiä (nyt ' + k.length + ').';
  return '';
}

function valittu() { return leike && leike.valinta && $('valinta').checked; }
function huiluAuki() { return !$('posti-osa').hidden; }

function nayta() {
  const kv = koodiVirhe(koodi($('koodi').value));
  $('arvottu').textContent = arvottu && koodi($('koodi').value) === arvottu.lause ? arvottu.virke : '';
  $('koodi-virhe').textContent = $('koodi').value.trim() ? kv : '';
  if (!leike) return;
  const sanoja = valittu() ? leike.valintaSanoja : leike.kokoSanoja;
  const viitteita = valittu() ? leike.valintaViitteita : leike.kokoViitteita;
  $('meta').textContent = [leike.sivusto, sanoja ? luku(sanoja) : '',
    viitteita ? viitteita + (viitteita === 1 ? ' alaviite' : ' alaviitettä') + ' haettu' : ''].filter(Boolean).join(' · ');
  const tyhja = !(valittu() ? leike.valinta : leike.koko);
  $('lukimeen').disabled = $('latomoon').disabled = tyhja;
  $('soita').disabled = tyhja || !!kv;
  $('tila').textContent = tyhja ? 'Sivulta ei löytynyt artikkelia. Maalaa luettava kohta ja avaa ikkuna uudelleen.' : '';
}

function muista() {
  api.storage.local.set({ posti: { on: huiluAuki(), k: koodi($('koodi').value), heti: $('heti').checked } });
}

// avaa: Latomo painaa itse (Avaa Luinissa tai, postin kanssa, lähetyksen). posti: { k, avaaNyt, eiMuistia } tai null.
async function laheta(avaa, posti) {
  $('lukimeen').disabled = $('latomoon').disabled = $('soita').disabled = true;
  await api.storage.local.set({ odottaa: { md: valittu() ? leike.valinta : leike.koko, avaa, posti, aika: Date.now() } });
  await api.tabs.create({ url: LATOMO });
  window.close();
}

async function aloita() {
  const { posti } = await api.storage.local.get('posti');
  if (posti) {
    $('koodi').value = posti.k || '';
    // Ennen 10.11.2026 valinta oli Älä avaa nyt (alaAvaa) ja Postihuilu Lähetä postina (on).
    $('heti').checked = 'heti' in posti ? !!posti.heti : !posti.alaAvaa;
    if (posti.on) { $('posti-osa').hidden = false; $('postihuilu').setAttribute('aria-expanded', 'true'); }
  }
  $('postihuilu').addEventListener('click', function () {
    const auki = !huiluAuki();
    $('posti-osa').hidden = !auki; this.setAttribute('aria-expanded', String(auki));
    muista(); nayta();
    if (auki && !$('koodi').value) $('koodi').focus();
  });
  $('heti').addEventListener('change', muista);
  $('arvo').addEventListener('click', () => { arvottu = globalThis.LuinLause.arvo(); $('koodi').value = arvottu.lause; muista(); nayta(); });
  $('koodi').addEventListener('input', () => { muista(); nayta(); });
  $('koodi').addEventListener('change', () => { const k = koodi($('koodi').value); if (k) $('koodi').value = k; muista(); nayta(); });
  $('koodi').addEventListener('keydown', e => { if (e.key === 'Enter' && !$('soita').disabled) $('soita').click(); });
  $('kysy').addEventListener('click', function () {
    const auki = $('ohje').hidden;
    $('ohje').hidden = !auki; this.setAttribute('aria-expanded', String(auki));
  });
  nayta();
  // ?valilehti= antaa testin osoittaa välilehden (testissä ikkuna on itse aktiivinen välilehti).
  const pakko = Number(new URLSearchParams(location.search).get('valilehti'));
  const [tab] = pakko ? [await api.tabs.get(pakko)] : await api.tabs.query({ active: true, currentWindow: true });
  try {
    const r = await api.scripting.executeScript({ target: { tabId: tab.id }, files: TIEDOSTOT });
    leike = r && r[0] && r[0].result;
  } catch (e) { leike = null; }
  if (!leike) {
    $('otsikko').textContent = 'Tätä sivua ei voi leikata';
    $('tila').textContent = 'Selaimen omat sivut ja lisäosakaupat ovat lisäosilta suljettuja.';
    return;
  }
  $('otsikko').textContent = leike.otsikko;
  if (leike.valinta) { $('valintarivi').hidden = false; $('valinta').checked = true; }
  $('valinta').addEventListener('change', nayta);
  $('lukimeen').addEventListener('click', () => laheta(true, null));
  // Muokkaa Latomossa täyttää kelpaavan lauseen valmiiksi, kun Postihuilu on auki, mutta ei lähetä.
  $('latomoon').addEventListener('click', () => {
    const k = koodi($('koodi').value);
    laheta(false, huiluAuki() && !koodiVirhe(k) ? { k, avaaNyt: false } : null);
  });
  $('soita').addEventListener('click', () => {
    const k = koodi($('koodi').value), heti = $('heti').checked;
    if (koodiVirhe(k)) return;
    laheta(true, { k, avaaNyt: heti, eiMuistia: !heti });
  });
  nayta();
}

aloita();
