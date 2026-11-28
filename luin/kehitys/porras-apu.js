// Porrasvalikon (nimikkeen ja valittujen valikko, luin.html naytaPorras()) kohta on alavalikossa: testit avaavat ensin sen
// pääkohdan, kuten käyttäjä. avaaOsa(sivu, k[, kosketus]): jos #pop-valikon kohta data-k=k on suljetussa alavalikossa,
// napauttaa sen pääkohtaa (sisäkkäin, kapealla ruudulla, ensin paluu pääkohtiin, jos toinen alavalikko on auki).
// Alakategorian (ULOSTUS › Imuroi) kohdalle avataan ensin yläosa ja sitten alakategoria.
// Muissa ponnahduksissa (kysely, alleviivaus) ei tee mitään.
async function avaaOsa(sivu, k, kosketus) {
  const t = await sivu.evaluate((k) => {
    const pop = document.getElementById('pop'), b = pop.querySelector('button[data-k="' + k + '"]'), a = b && b.closest('.p-ali');
    if (pop.hidden || !a || a.classList.contains('auki')) return null;
    return { osa: a.dataset.ali, yla: a.dataset.yla || '', takaisin: pop.classList.contains('sisak') && pop.classList.contains('ali-auki') };
  }, k);
  if (!t) return;
  const paina = (s) => kosketus ? sivu.tap(s) : sivu.click(s);
  if (t.yla) { await avaaOsa(sivu, 'ali:' + t.osa, kosketus); await paina('#pop button[data-k="ali:' + t.osa + '"]'); return; }
  if (t.takaisin) {
    // Sisäkkäin auki voi olla alakategoria: paluu vie ensin sen yläosaan, ja vasta sieltä pääkohtiin.
    while (await sivu.$('#pop .p-ali.auki')) await paina('#pop .p-ali.auki button[data-k="takaisin"]');
  }
  await paina('#pop button[data-k="ali:' + t.osa + '"]');
}
module.exports = { avaaOsa };
