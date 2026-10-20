const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PETRA_BASE || 'http://127.0.0.1:3111';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
assert.ok(process.env.PETRA_TEST_KEY && process.env.PETRA_EVIDENCE);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(`${base}/studio/index.html`);
    await page.locator('#tea-list button').first().waitFor();
    await page.locator('input[name="content-language"][value="sl"]').waitFor({ timeout: 3000 });
    await page.locator('#workshop-key').fill(process.env.PETRA_TEST_KEY);
    await page.getByRole('button', { name: 'Entrar al taller', exact: true }).click();
    await page.locator('#login-form').waitFor({ state: 'hidden' });
    await page.locator('#new-tea').click();
    const suffix = Date.now();
    const names = { es: `Cítrico local ${suffix}`, en: `Local citrus ${suffix}`, sl: `Domači citrusi ${suffix}` };
    const descriptions = { es: 'Aroma de limón', en: 'Lemon aroma', sl: 'Aroma limone' };
    await page.locator('#open-plant').click();
    await page.locator('#plant-name').fill(`Piel local ${suffix}`);
    await page.locator('#plant-name-en').fill('Local lemon peel');
    await page.locator('#plant-name-sl').fill('Domača limonina lupina');
    await page.locator('#plant-shape').selectOption('piel');
    await page.getByRole('button', { name: 'Guardar ingrediente en borrador' }).click();
    await page.locator('#filter-selected').click();
    for (const lang of ['es', 'en', 'sl']) {
      await page.locator(`input[name="content-language"][value="${lang}"]`).check();
      await page.locator('#tea-name').fill(names[lang]);
      await page.locator('#tea-description').fill(descriptions[lang]);
      await page.locator('#plant-options textarea').first().fill(descriptions[lang]);
      await page.locator('#site-frame').scrollIntoViewIfNeeded();
      await page.frameLocator('#site-frame').getByRole('heading', { name: names[lang], exact: true }).waitFor();
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('petra-lang')), null);
    await page.locator('#publish').click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.startsWith('Publicado.'));
    const catalog = await (await context.request.get(`${base}/api/catalogo`)).json();
    const tea = catalog.teas.find(item => item.nombre === names.es);
    assert.equal(tea.traducciones.sl.nombre, names.sl);
    assert.equal(tea.traducciones.en.paraQueSirve, descriptions.en);
    const htmlResponse = await context.request.get(`${base}/clasica/tes/${tea.id}`);
    assert.equal(htmlResponse.status(), 200);
    const html = await htmlResponse.text();
    assert.ok(html.includes(names.es) && html.includes('Aroma de limón'));
    const sitemap = await (await context.request.get(`${base}/sitemap.xml`)).text();
    assert.ok(sitemap.includes(`/clasica/tes/${tea.id}`));
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#tea-form').screenshot({ path: path.join(process.env.PETRA_EVIDENCE, 'studio-multilingue.png') });
    for (const lang of ['en', 'sl', 'es']) {
      await page.evaluate(language => localStorage.setItem('petra-lang', language), lang);
      await page.goto(`${base}/clasica/tes/${tea.id}`);
      await page.getByRole('heading', { name: names[lang], exact: true }).waitFor();
    }
    await page.evaluate(() => localStorage.setItem('petra-lang', 'sl'));
    await page.goto(`${base}/te?q=low`);
    await page.waitForFunction(() => window.__petraUi);
    await page.evaluate(id => window.__petraUi.getState().focusTea(id), tea.id);
    await page.getByText(names.sl, { exact: true }).first().waitFor();
    await page.getByRole('button', { name: /Domača limonina lupina/ }).first().waitFor();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(process.env.PETRA_EVIDENCE, 'multilingue-browser.json'), JSON.stringify({ passed: true, names, teaId: tea.id, errors, widths: [320, 768, 1440] }, null, 2));
    console.log('PASS: translations persist, preview/classic/3D, custom plants, SEO and responsive Studio');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
