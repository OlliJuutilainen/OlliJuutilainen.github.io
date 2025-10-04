import { test, expect } from '@playwright/test';

const ORIGIN = process.env.ORIGIN_URL!;
const T = process.env.TEST_T!;
const K = process.env.TEST_K!;
const URL = `${ORIGIN}/tusinapaja.html#t=${encodeURIComponent(T)}&k=${encodeURIComponent(K)}`;

test('tusinapaja: /api/loc 200, ei CORS-virheitä, sivu ei kaadu', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  // Odota että /api/loc vastaa 200
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/loc') && r.status() === 200, { timeout: 30000 }),
    page.goto(URL, { waitUntil: 'domcontentloaded' }),
  ]);
  const json = await resp.json();
  expect(json.v === 1 || json.v === "1").toBeTruthy();
  expect(typeof json.iv).toBe('string');
  expect(typeof json.ct).toBe('string');

  // Pieni lisäodotus mahdolliselle purulle/renderille
  await page.waitForTimeout(1000);

  // Ei tunnettuja CORS/MIME-virheitä
  const bad = errors.filter(e =>
    /CORS policy|MIME type|nosniff|NetworkError/i.test(e)
  );
  if (errors.length) {
    console.log('Collected errors:\n' + errors.join('\n'));
  }
  expect(bad).toHaveLength(0);
});
