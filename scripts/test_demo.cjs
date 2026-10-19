const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PETRA_BASE || 'http://127.0.0.1:3111';
const output = process.env.PETRA_EVIDENCE;
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
assert.ok(output);
let debugPage;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' });
  const page = await context.newPage();
  await page.route('**/te?studio=1', route => route.fulfill({ status: 302, headers: { location: base + '/te?studio=1&q=low' } }));
  debugPage = page;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const before = await (await context.request.get(base + '/api/catalogo')).text();
  await page.goto(base + '/studio/index.html?demo=citrico');
  await page.waitForFunction(() => document.querySelector('#plant-count').textContent === '8 ingredientes');
  assert.equal(await page.locator('#preview-plants svg').count(), 8);
  assert.equal(await page.locator('#preview-plants svg').first().evaluate(svg => svg.namespaceURI), 'http://www.w3.org/2000/svg');
  await page.locator('#plant-options').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'demo-selector-visual.png') });
  const frame = page.frameLocator('#site-frame');
  await page.locator('#site-frame').scrollIntoViewIfNeeded();
  await frame.getByRole('heading', { name: 'Sol de huerto · DEMO', exact: true }).waitFor();
  for (const name of ['Piel de limón', 'Piel de naranja', 'Manzana deshidratada', 'Fresa deshidratada', 'Jengibre', 'Canela', 'Menta', 'Hibisco']) await frame.getByText(name, { exact: true }).first().waitFor();
  await page.locator('#site-frame').screenshot({ path: path.join(output, 'demo-clasica.png') });
  await page.getByRole('button', { name: 'Añadir Arándano', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#plant-count').textContent === '9 ingredientes');
  await page.locator('#preview-3d').click();
  await page.locator('#site-frame').scrollIntoViewIfNeeded();
  await frame.getByRole('heading', { name: 'Sol de huerto · DEMO', exact: true }).waitFor({ timeout: 30000 });
  const room = page.frames().find(candidate => candidate.url().includes('/te?'));
  await room.waitForFunction(() => { let count = 0; window.__scene?.traverse(object => { if (object.name.startsWith('specimen-studio-')) count++; }); return count === 6; });
  await frame.getByRole('button', { name: 'Arándano', exact: true }).click();
  await room.waitForFunction(() => !!window.__scene?.getObjectByName('specimen-studio-arandano'));
  await page.waitForTimeout(4000);
  await page.locator('#site-frame').screenshot({ path: path.join(output, 'demo-3d.png') });
  await page.locator('#preview-classic').click();
  await frame.getByText('Arándano', { exact: true }).first().waitFor();
  assert.equal(await (await context.request.get(base + '/api/catalogo')).text(), before, 'Unpublished demo must not change catalog');
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `Studio overflow at ${width}`);
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'demo-tests.json'), JSON.stringify({ status: 'PASS', ingredients: 9, sharedIllustrations: true, threeDimensionalPagination: true, noPublication: true, widths: [390, 768, 1440], errors }, null, 2));
  await browser.close();
  console.log('PASS: visual selection, 9 ingredients in classic and 3D, no publication, responsive');
})().catch(async error => {
  if (debugPage) {
    await debugPage.screenshot({ path: path.join(output, 'demo-failure.png') });
    console.error(await Promise.all(debugPage.frames().map(async frame => ({ url: frame.url(), text: (await frame.locator('body').innerText()).slice(0,2000) }))));
  }
  console.error(error); process.exit(1);
});
