const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = 'http://127.0.0.1:3111';
const output = process.env.PETRA_EVIDENCE;
assert.ok(output);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (const room of ['/te', '/nosotros']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' });
      page.setDefaultTimeout(15000);
      console.log(`Checking ${room}`);
      page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
      page.on('requestfailed', request => console.error('REQUEST FAILED', request.url(), request.failure()));
      await page.goto(base + room + '?q=low');
      await page.waitForFunction(() => !!window.__scene?.getObjectByName('spoon-cuchara-nogal'));
      await page.waitForTimeout(1200);
      const point = () => page.evaluate(() => {
        const scene = window.__scene;
        let camera;
        scene.traverse(object => { if (object.isOrthographicCamera) camera = object; });
        scene.updateMatrixWorld(true);
        camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
        const spoon = scene.getObjectByName('spoon-cuchara-nogal');
        const position = spoon.localToWorld(spoon.position.clone().set(0, 0.15, 0)).project(camera);
        const canvas = document.querySelector('canvas').getBoundingClientRect();
        return { x: canvas.x + (position.x + 1) * canvas.width / 2, y: canvas.y + (1 - position.y) * canvas.height / 2 };
      });
      for (const [language, name] of [['ES', 'Cucharita de nogal'], ['EN', 'Walnut teaspoon'], ['SL', 'Orehova žlička'], ['ES', 'Cucharita de nogal']]) {
        await page.getByRole('button', { name: language, exact: true }).evaluate(button => button.click());
        console.log(`${room}: ${language}`);
        const location = await point();
        await page.mouse.move(location.x, location.y);
        await page.getByText(name, { exact: true }).waitFor({ timeout: 10000 });
        await page.mouse.click(location.x, location.y);
        await page.getByRole('heading', { name, exact: true }).waitFor();
        if (language === 'ES') {
          await page.getByRole('button', { name: 'EN', exact: true }).evaluate(button => button.click());
          await page.getByRole('heading', { name: 'Walnut teaspoon', exact: true }).waitFor();
          assert.match(await page.locator('aside').innerText(), /carved by/i);
          await page.getByRole('button', { name: 'ES', exact: true }).evaluate(button => button.click());
          await page.getByRole('heading', { name, exact: true }).waitFor();
        }
        if (language === 'SL') await page.screenshot({ path: path.join(output, `cucharas-${room.slice(1)}-sl.png`) });
        await page.locator('aside button').first().evaluate(button => button.click());
        await page.waitForTimeout(600);
      }
      console.log(`PASS ${room}: hover ES/EN/SL/ES and open panel changes language`);
      await page.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'cucharas-idiomas-tests.json'), JSON.stringify({ status: 'PASS', rooms: ['/te', '/nosotros'], languages: ['es', 'en', 'sl'], hover: true, openPanel: true, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
