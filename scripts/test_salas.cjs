const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PETRA_BASE || 'http://127.0.0.1:3111';
const output = process.env.PETRA_EVIDENCE;
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
assert.ok(output);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' });
    let page = await context.newPage();
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`); });
    const routes = process.env.PETRA_ROUTES ? process.env.PETRA_ROUTES.split(',') : ['/', '/salon', '/te', '/te-premium', '/nosotros', '/contacto', '/carrito'];
    for (const route of routes) {
      await page.goto(base + route + '?q=low');
      await page.waitForFunction(() => !!window.__scene?.children.length);
      if (route !== '/') await page.locator('[data-door-link]').first().waitFor({ state: 'attached' });
      const doors = await page.locator('[data-door-link]').evaluateAll(buttons => buttons.map(button => ({ text: button.textContent, label: button.getAttribute('aria-label') })));
      assert.equal(await page.evaluate(() => {
        let rings = 0;
        window.__scene.traverse(object => {
          const geometry = object.geometry;
          if (geometry?.type === 'RingGeometry' && geometry.parameters.innerRadius === 0.3 && geometry.parameters.outerRadius === 0.4) rings++;
        });
        return rings;
      }), 0, `Removed guidance circles at ${route}`);
      assert.ok(doors.every(door => door.text === '' && door.label), `Door labels at ${route}`);
      assert.equal((await page.locator('nav > a').first().textContent()).replace(/\s/g, ''), 'P+E-sp');
      await page.waitForTimeout(1300);
      await page.screenshot({ path: path.join(output, `sala-${route.slice(1) || 'entrada'}-desktop.png`) });
      for (const width of [320, 390, 768, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `Overflow at ${route}, ${width}`);
      }
      await page.setViewportSize({ width: 390, height: 900 });
      await page.screenshot({ path: path.join(output, `sala-${route.slice(1) || 'entrada'}-mobile.png`) });
      await page.setViewportSize({ width: 1440, height: 1000 });
      console.log(`PASS: ${route}, logo, nameless accessible doors, mobile width`);
      await page.close();
      page = await context.newPage();
      page.setDefaultTimeout(30000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`); });
    }
    await page.goto(base + '/nosotros?q=low');
    await page.waitForFunction(() => !!window.__scene?.getObjectByName('erik-workbench'));
    for (const name of ['erik-tool-board', 'erik-spoon-process', 'erik-hand-plane', 'erik-spoon-sketch', 'erik-mallet']) {
      assert.ok(await page.evaluate(name => !!window.__scene.getObjectByName(name), name), name);
    }
    const supports = await page.evaluate(() => {
      const scene = window.__scene;
      scene.updateMatrixWorld(true);
      const bounds = name => {
        const root = scene.getObjectByName(name);
        const minimum = [Infinity, Infinity, Infinity];
        const maximum = [-Infinity, -Infinity, -Infinity];
        root.traverse(object => {
          const vertices = object.geometry?.attributes.position;
          if (!vertices) return;
          const point = object.position.clone();
          for (let index = 0; index < vertices.count; index++) {
            point.fromBufferAttribute(vertices, index).applyMatrix4(object.matrixWorld);
            point.toArray().forEach((value, axis) => { minimum[axis] = Math.min(minimum[axis], value); maximum[axis] = Math.max(maximum[axis], value); });
          }
        });
        return { minimum, maximum };
      };
      const names = ['erik-workbench', 'erik-board-support', 'erik-tool-board', 'erik-hand-plane', 'erik-spoon-sketch', 'erik-spoon-process', 'erik-mallet'];
      return Object.fromEntries(names.map(name => [name, bounds(name)]));
    });
    for (const [name, bounds] of Object.entries(supports)) {
      if (name === 'erik-workbench') assert.ok(Math.abs(bounds.minimum[1]) < 0.003, `${name} touches floor: ${bounds.minimum[1]}`);
      if (['erik-hand-plane', 'erik-spoon-sketch', 'erik-spoon-process', 'erik-mallet'].includes(name)) assert.ok(Math.abs(bounds.minimum[1] - 1.05) < 0.003, `${name} rests on workbench: ${bounds.minimum[1]}`);
    }
    assert.ok(supports['erik-board-support'].minimum[1] <= 1.05);
    assert.ok(supports['erik-board-support'].maximum[1] >= supports['erik-tool-board'].maximum[1] - 0.01);
    fs.writeFileSync(path.join(output, 'taller-apoyos.json'), JSON.stringify(supports, null, 2));
    for (const name of ['Banco de Erik', 'Rincón del perro', 'Saludar al perro', 'Ver toda la sala']) {
      assert.equal(await page.getByRole('button', { name, exact: true }).count(), 0);
    }
    await page.locator('summary').filter({ hasText: 'Sobre Petra y Erik' }).click();
    assert.equal(await page.locator('details').getAttribute('open'), '');
    await page.screenshot({ path: path.join(output, 'nosotros-historia-desktop.png') });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({ path: path.join(output, 'nosotros-historia-mobile.png') });
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [language, history] of [['EN', 'About Petra and Erik'], ['SL', 'O Petri in Eriku'], ['ES', 'Sobre Petra y Erik']]) {
      await page.getByRole('button', { name: language, exact: true }).evaluate(button => button.click());
      await page.locator('summary').filter({ hasText: history }).waitFor();
      assert.equal(await page.locator('[data-door-link]').first().textContent(), '');
    }
    await page.getByRole('button', { name: 'Salón', exact: true }).evaluate(button => button.click());
    await page.waitForURL('**/salon');
    await page.goto(base + '/clasica');
    assert.equal((await page.locator('header a').first().textContent()).replace(/\s/g, ''), 'P+E-sp');
    await page.screenshot({ path: path.join(output, 'logo-clasica-sp.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'salas-tests.json'), JSON.stringify({ status: 'PASS', routes, widths: [320, 390, 768, 1440, 1920], noGuidanceCircles: true, namelessDoors: true, logo: 'P + E-sp', closeupControlsRemoved: true, workshopLanguages: ['es', 'en', 'sl'], errors }, null, 2));
    console.log('PASS: workshop, original dog, history without closeup controls, three languages, door navigation, classic logo');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
