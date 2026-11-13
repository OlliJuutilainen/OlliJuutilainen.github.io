/* Lisää lukimeen: Latomon puoli. Ponnahdusikkuna jättää leikkeen lisäosan muistiin ja avaa latomo.html#lisaosa;
   tämä kirjoittaa leikkeen tekstikenttään kuin käyttäjä olisi liittänyt sen, ja Lisää lukimeen -napilla painaa
   vielä Avaa Luinissa. Rajapinta Latomoon on vain tunnisteita: #md ja #avaa, Postihuilulla (9.11.2026) myös
   #laatikko-koodi, #laheta (Postihuilu; kelpaavalla lauseella painallus lähettää), #kk-tila (Ladottu postitettavaksi…),
   #kk-virhe ja #laatikko-virhe. Kun tekstiä ei lisätä tämän selaimen lukulistaan (10.11.2026), lauseen kenttä saa
   data-ei-muistia-attribuutin, eikä Latomo silloin tallenna lausetta Luinin muistiin. Lataa .md (0.8.0, 12.11.2026)
   painaa #lataa. Taustalla (13.11.2026; ei Androidilla) Latomo on taustavälilehdellä ja sulkee itsensä, kun lataus on
   lähtenyt: Latomo lisää latauslinkin (a[download]) sivuun ja poistaa sen heti, joten linkin näkeminen todistaa latauksen.
   Sulku odottaa 2,5 s, koska Latomo vapauttaa tiedoston osoitteen 2 s:n päästä; välilehti, jolla on vain yksi
   historiamerkintä, saa sulkea itsensä. Jos linkkiä ei näy, Latomo jää taustalle auki. */
(async () => {
  if (location.hash !== '#lisaosa') return;
  const api = globalThis.browser || globalThis.chrome;
  history.replaceState(null, '', location.pathname + location.search);
  const { odottaa } = await api.storage.local.get('odottaa');
  await api.storage.local.remove('odottaa');
  // Vanha leike ei saa ilmestyä Latomoon myöhemmin, jos siirto katkesi kesken.
  if (!odottaa || !odottaa.md || Date.now() - odottaa.aika > 120000) return;
  const $ = id => document.getElementById(id);
  const md = $('md');
  if (!md) return;
  md.value = odottaa.md;
  md.dispatchEvent(new Event('input', { bubbles: true }));
  const posti = odottaa.posti;
  if (posti && posti.k && $('laatikko-koodi') && $('laheta')) {
    if (posti.eiMuistia) $('laatikko-koodi').setAttribute('data-ei-muistia', '');
    $('laatikko-koodi').value = posti.k;
    $('laatikko-koodi').dispatchEvent(new Event('input', { bubbles: true }));
    if (!odottaa.avaa) return;
    // Lähetys ja odotus: onnistunut lähetys kirjoittaa #kk-tilaan "Ladottu postitettavaksi…" (ennen 10.11.2026
    // "Lähetetty…"), epäonnistunut #kk-virheeseen.
    $('laheta').click();
    const lahti = await new Promise(valmis => {
      const alku = Date.now();
      (function katso() {
        const v = $('kk-virhe'), lv = $('laatikko-virhe'), t = $('kk-tila');
        if (v && !v.hidden && v.textContent) return valmis(false);
        if (lv && !lv.hidden && lv.textContent) return valmis(false);
        if (t && !t.hidden && /^(Ladottu postitettavaksi|Lähetetty)/.test(t.textContent)) return valmis(true);
        if (Date.now() - alku > 30000) return valmis(false);
        setTimeout(katso, 150);
      })();
    });
    if (lahti && posti.avaaNyt) $('avaa').click();
    return;
  }
  if (odottaa.lataa && $('lataa')) {
    const vahti = new MutationObserver(() => {});
    vahti.observe(document.body, { childList: true });
    $('lataa').click();
    const lahti = vahti.takeRecords().some(m => [...m.addedNodes].some(n => n.nodeName === 'A' && n.hasAttribute('download')));
    vahti.disconnect();
    if (odottaa.taustalla && lahti) setTimeout(() => window.close(), 2500);
  } else if (odottaa.avaa) $('avaa').click();
})();
