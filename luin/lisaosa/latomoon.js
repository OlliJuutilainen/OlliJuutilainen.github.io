/* Lisää lukimeen: Latomon puoli. Ponnahdusikkuna jättää leikkeen lisäosan muistiin ja avaa latomo.html#lisaosa;
   tämä kirjoittaa leikkeen tekstikenttään kuin käyttäjä olisi liittänyt sen, ja Lisää lukimeen -napilla painaa
   vielä Avaa Luinissa. Rajapinta Latomoon on vain tunnisteita: #md ja #avaa, postina lähetettäessä (9.11.2026) myös
   #laatikko-koodi, #laheta (Coneelta Cännycälle; kelpaavalla koodilla painallus lähettää), #kk-tila (Lähetetty…),
   #kk-virhe ja #laatikko-virhe. */
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
    $('laatikko-koodi').value = posti.k;
    $('laatikko-koodi').dispatchEvent(new Event('input', { bubbles: true }));
    if (!odottaa.avaa) return;
    // Lähetys ja odotus: onnistunut lähetys kirjoittaa #kk-tilaan "Lähetetty…", epäonnistunut #kk-virheeseen.
    $('laheta').click();
    const lahti = await new Promise(valmis => {
      const alku = Date.now();
      (function katso() {
        const v = $('kk-virhe'), lv = $('laatikko-virhe'), t = $('kk-tila');
        if (v && !v.hidden && v.textContent) return valmis(false);
        if (lv && !lv.hidden && lv.textContent) return valmis(false);
        if (t && !t.hidden && /^Lähetetty/.test(t.textContent)) return valmis(true);
        if (Date.now() - alku > 30000) return valmis(false);
        setTimeout(katso, 150);
      })();
    });
    if (lahti && posti.avaaNyt) $('avaa').click();
    return;
  }
  if (odottaa.avaa) $('avaa').click();
})();
