const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PETRA_BASE || 'http://127.0.0.1:3111';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  try {
    for (const [language, publish, connected] of [['es', 'Guardar y publicar', 'Conectado a tu tienda'], ['en', 'Save and publish', 'Connected to your shop'], ['sl', 'Shrani in objavi', 'Povezano s tvojo trgovino']]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
      page.on('dialog', dialog => dialog.dismiss());
      await page.goto(`${base}/studio/index.html?lang=${language}`);
      await page.waitForFunction(() => Number(document.querySelector('#tea-price').value) > 0);
      assert.equal(await page.locator('html').getAttribute('lang'), language);
      assert.equal(await page.locator('#publish').innerText(), publish);
      assert.equal(await page.locator('#connection').innerText(), connected);
      await page.locator('#tea-price').fill('12.34');
      const before = await page.evaluate(() => localStorage.getItem('petra-studio-draft'));
      await page.locator('input[name="ui-language"][value="en"]').check();
      await page.locator('input[name="ui-language"][value="sl"]').check();
      await page.locator(`input[name="ui-language"][value="${language}"]`).check();
      assert.equal(await page.locator('#tea-price').inputValue(), '12.34');
      assert.equal(await page.evaluate(() => localStorage.getItem('petra-studio-draft')), before);
      for (const width of [320, 390, 768, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language} overflow ${width}`);
      }
      await page.setViewportSize({ width: 320, height: 700 });
      await page.locator('#open-plant').click();
      assert.ok(await page.locator('#plant-dialog').evaluate(node => node.getBoundingClientRect().right <= innerWidth));
      await page.locator('#close-plant').click();
      assert.ok(await page.locator('#tea-name').evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 16));
      assert.ok(await page.locator('#publish').evaluate(node => node.getBoundingClientRect().height >= 48));
      assert.deepEqual(errors, []);
      assert.deepEqual(writes, []);
      if (process.env.PETRA_EVIDENCE) {
        await page.locator('#tea-form').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(process.env.PETRA_EVIDENCE, `studio-ui-${language}-mobile.png`) });
      }
      await context.close();
    }
    const launcher = fs.readFileSync(path.join(__dirname, '../public/studio/Abrir-PETRA-Studio.html'), 'utf8');
    for (const language of ['es', 'en', 'sl']) assert.ok(launcher.includes(`https://pplusesp.si/studio/index.html?lang=${language}`));
    console.log('PASS Studio UI ES/EN/SL, 320–1920px, DPR3, draft preservation, dialog, mobile targets, no writes');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
