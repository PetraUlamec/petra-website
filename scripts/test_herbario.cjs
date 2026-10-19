const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PETRA_BASE || 'http://127.0.0.1:3111';
const output = process.env.PETRA_EVIDENCE;
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
assert.ok(output);
let browser;
let debugPage;

(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' });
  const page = await context.newPage();
  await page.route('**/te?studio=1', route => route.fulfill({ status: 302, headers: { location: base + '/te?studio=1&q=low' } }));
  debugPage = page;
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR:', error.message); });
  const before = await (await context.request.get(base + '/api/catalogo')).text();
  const catalog = await (await context.request.get(base + '/studio/catalogo-base.json')).json();
  assert.equal(catalog.plants.length, 167);
  assert.equal(catalog.plants.filter(plant => plant.id.startsWith('herbario-')).length, 127);
  assert.equal(Object.keys(catalog.drawings).length, 31);
  for (const plant of catalog.plants) assert.ok(catalog.drawings[plant.forma]);
  await page.goto(base + '/studio/index.html?demo=citrico');
  await page.waitForFunction(() => document.querySelector('#plant-count').textContent === '8 ingredientes');
  assert.equal(await page.locator('#plant-options input[type=checkbox]').count(), 24);
  await page.locator('#more-plants').click();
  assert.equal(await page.locator('#plant-options input[type=checkbox]').count(), 48);
  await page.locator('#category-plant').selectOption('Tés y bases');
  assert.ok((await page.locator('#ingredient-results').innerText()).includes('34 opciones'));
  await page.locator('#plant-options').screenshot({ path: path.join(output, 'herbario-bases.png') });
  await page.locator('#category-plant').selectOption('');
  const examples = ['Sencha', 'Gunpowder verde', 'Matcha', 'Mango deshidratado', 'Limón en rodajas', 'Frambuesa deshidratada', 'Anís estrellado', 'Clavo de olor', 'Coco en láminas', 'Arroz tostado', 'Almendra laminada', 'Hierba limón'];
  const ids = examples.map(name => catalog.plants.find(plant => plant.nombre === name).id);
  for (const name of examples) {
    await page.locator('#search-plant').fill(name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const checkbox = page.locator('#plant-options label').filter({ hasText: name }).getByRole('checkbox');
    await checkbox.check();
    assert.equal(await checkbox.isChecked(), true);
  }
  await page.locator('#search-plant').fill('star anise');
  assert.equal(await page.locator('#plant-options input[type=checkbox]').count(), 1);
  await page.locator('#search-plant').fill('');
  await page.locator('#filter-selected').click();
  assert.equal(await page.locator('#plant-options svg').count(), 20);
  assert.equal(await page.locator('#preview-plants svg').count(), 20);
  await page.locator('#plant-options').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'herbario-seleccion.png') });
  await page.locator('#site-frame').scrollIntoViewIfNeeded();
  const frame = page.frameLocator('#site-frame');
  for (const name of examples) await frame.getByText(name, { exact: true }).first().waitFor();
  await frame.getByText('Anís estrellado', { exact: true }).first().scrollIntoViewIfNeeded();
  await page.locator('#site-frame').screenshot({ path: path.join(output, 'herbario-clasica.png') });
  const navigation = page.waitForEvent('framenavigated', { predicate: candidate => candidate.url().includes('/te?') });
  await page.locator('#preview-3d').click();
  const room = await navigation;
  for (const [index, name] of examples.entries()) {
    console.log('Checking 3D:', name);
    await frame.getByRole('button', { name, exact: true }).click();
    await room.waitForFunction(id => window.__scene?.getObjectByName(`specimen-${id}`)?.children.length > 0, ids[index], { timeout: 30000 });
  }
  assert.ok(await room.evaluate(() => { let count = 0; window.__scene?.traverse(object => { if (object.name.startsWith('specimen-')) count++; }); return count <= 6; }));
  await frame.getByRole('button', { name: 'Anís estrellado', exact: true }).click();
  await page.waitForTimeout(1500);
  await page.locator('#site-frame').screenshot({ path: path.join(output, 'herbario-3d.png') });
  assert.equal(await (await context.request.get(base + '/api/catalogo')).text(), before);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `Overflow ${width}`);
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'herbario-tests.json'), JSON.stringify({ status: 'PASS', total: 167, added: 127, forms: 31, newlyRendered3D: ids.length, filters: true, accentInsensitiveSearch: true, translations: true, noPublication: true, errors }, null, 2));
  console.log('PASS: 127 new entries, 31 forms, filters, search, classic and 12 new 3D families, no publication');
})().catch(async error => {
  if (debugPage) {
    await debugPage.screenshot({ path: path.join(output, 'herbario-failure.png') });
    console.error(await Promise.all(debugPage.frames().map(async frame => ({ url: frame.url(), text: (await frame.locator('body').innerText()).slice(-3500) }))));
  }
  console.error(error); process.exitCode = 1;
}).finally(async () => { await browser?.close(); });
