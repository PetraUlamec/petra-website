const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHmac } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PETRA_BASE || 'http://127.0.0.1:3111';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const key = process.env.PETRA_TEST_KEY;
assert.ok(key);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'petra-remember-'));
const options = { executablePath: process.env.CHROMIUM_PATH, headless: true, viewport: { width: 390, height: 844 }, args: ['--enable-unsafe-swiftshader'] };
const endpoint = `${base}/api/taller-sesion`;
const sign = expiry => `${expiry}.${createHmac('sha256', key).update(String(expiry)).digest('hex')}`;
const errors = [];
async function launch() {
  const context = await chromium.launchPersistentContext(profile, options);
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return context;
}
async function checkStudio(context, language) {
  const page = await context.newPage();
  await page.goto(`${base}/studio/index.html?lang=${language}`);
  await page.locator('#session-remembered').waitFor();
  await page.waitForFunction(() => Number(document.querySelector('#tea-price').value) > 0);
  assert.equal(await page.locator('#login-form').isVisible(), false);
  assert.equal(await page.locator('#workshop-key').inputValue(), '');
  assert.equal(await page.locator('html').getAttribute('lang'), language);
  assert.equal(await page.evaluate(() => document.cookie.includes('petra-taller')), false);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.close();
}
(async () => {
  let context = await launch();
  try {
    const before = await (await context.request.get(`${base}/api/catalogo`)).json();
    const anonymous = await context.request.post(endpoint, { data: { action: 'remember' }, headers: { origin: base } });
    assert.equal(anonymous.status(), 401);
    const legacyToken = sign(Date.now() + 12 * 60 * 60 * 1000);
    await context.addCookies([{ name: 'petra-taller', value: legacyToken, url: base, httpOnly: true, sameSite: 'Strict', expires: Date.now() / 1000 + 43200 }]);
    const crossOrigin = await context.request.post(endpoint, { data: { action: 'remember' }, headers: { origin: 'https://untrusted.invalid' } });
    assert.equal(crossOrigin.status(), 401);
    await checkStudio(context, 'es');
    const cookie = (await context.cookies()).find(item => item.name === 'petra-taller');
    assert.ok(cookie && cookie.httpOnly && cookie.sameSite === 'Strict');
    assert.ok(cookie.expires - Date.now() / 1000 > 364 * 86400);
    await context.close();
    context = await launch();
    for (const language of ['es', 'en', 'sl']) await checkStudio(context, language);
    const signedIn = await (await context.request.get(endpoint)).json();
    assert.equal(signedIn.authenticated, true);
    const loggedOut = await context.request.delete(endpoint);
    assert.equal(loggedOut.status(), 200);
    assert.equal((await (await context.request.get(endpoint)).json()).authenticated, false);
    const expired = sign(Date.now() - 1000);
    const rejected = await context.request.post(endpoint, { data: { action: 'remember' }, headers: { origin: base, cookie: `petra-taller=${expired}` } });
    assert.equal(rejected.status(), 401);
    const after = await (await context.request.get(`${base}/api/catalogo`)).json();
    assert.deepEqual(after, before);
    assert.deepEqual(errors, []);
    console.log('PASS: legacy session upgrade; full browser close/reopen; ES/EN/SL; persistent HttpOnly cookie; anonymous/cross-origin/expired rejected; logout; catalog unchanged.');
  } finally { await context.close(); }
})().catch(() => { console.error('FAIL: Studio remembered-session verification; no credentials logged.'); process.exitCode = 1; });
