const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PETRA_BASE || 'http://127.0.0.1:3111';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const headers = { 'Content-Type': 'application/json', 'x-taller-key': process.env.PETRA_TEST_KEY };
const output = process.env.PETRA_EVIDENCE;
assert.ok(headers['x-taller-key'] && output);
(async () => {
  const catalog = await (await fetch(`${base}/studio/catalogo-base.json`)).json();
  const live = await (await fetch(`${base}/api/catalogo`)).json();
  const original = live.teas.find(tea => tea.id === catalog.teas[0].id) || catalog.teas[0];
  const fixture = { ...original, nombre: 'Verificación local de iconos', plantas: catalog.plants.map(plant => ({ plantaId: plant.id, porQueEnEsteMix: 'Solo prueba local.' })) };
  assert.ok((await fetch(`${base}/api/catalogo`, { method: 'POST', headers, body: JSON.stringify({ tipo: 'tea', item: fixture }) })).ok);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/studio/index.html?lang=es`);
    await page.waitForFunction(() => Number(document.querySelector('#tea-price').value) > 0);
    const studio = await page.evaluate(async () => {
      const catalog = await (await fetch('/studio/catalogo-base.json')).json();
      return catalog.plants.map(plant => {
        const rendered = window.drawing(plant);
        return { id: plant.id, matches: rendered.getAttribute('data-ingredient') === plant.id, paths: rendered.querySelectorAll('path').length };
      });
    });
    assert.ok(studio.every(item => item.matches && item.paths > 0));
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    await page.goto(`${base}/clasica/tes/${fixture.id}`);
    for (const plant of catalog.plants) assert.ok(await page.locator(`svg[data-ingredient="${plant.id}"]`).count(), plant.id);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/te?q=low`);
    await page.waitForFunction(() => window.__petraUi);
    await page.evaluate(id => window.__petraUi.getState().focusTea(id), fixture.id);
    for (let start = 0; start < catalog.plants.length; start += 6) {
      const ids = catalog.plants.slice(start, start + 6).map(plant => plant.id);
      await page.evaluate(id => window.__petraUi.getState().setPlant(id), ids[0]);
      await page.waitForFunction(ids => {
        const found = new Set();
        window.__scene?.traverse(object => { if (object.userData.botanicalProfile) found.add(object.name.slice('specimen-'.length)); });
        return ids.every(id => found.has(id));
      }, ids, { timeout: 20000 });
    }
    const samples = ['herbario-kiwi-deshidratado', 'herbario-fresa-en-laminas', 'herbario-macis'];
    for (const id of samples) {
      await page.evaluate(id => window.__petraUi.getState().setPlant(id), id);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(output, `${id}-sala.png`) });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'integracion.json'), JSON.stringify({ status: 'PASS', studio: studio.length, classic: catalog.plants.length, models: catalog.plants.length, pages: 28, widths: [320, 390, 1440], errors }, null, 2));
    console.log('PASS Studio and classic 167/167; actual R3F room 167/167 across 28 ingredient pages; mobile layout; no JS errors');
  } finally {
    await browser.close();
    assert.ok((await fetch(`${base}/api/catalogo`, { method: 'POST', headers, body: JSON.stringify({ tipo: 'tea', item: original }) })).ok);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
