const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
test('persistent volume seeds missing defaults without overwriting Petra edits', () => {
  const { prepararDatos } = require('./preparar-datos.cjs');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'petra-volume-'));
  fs.mkdirSync(path.join(fixture, 'data'));
  for (const filename of ['catalogo-vivo.json', 'overrides.json', 'editor-log.json']) {
    fs.writeFileSync(path.join(fixture, 'data', filename), '{"original":true}');
  }
  prepararDatos(fixture);
  fs.renameSync(path.join(fixture, 'data'), path.join(fixture, 'original-data'));
  prepararDatos(fixture, true);
  const catalog = path.join(fixture, 'data/catalogo-vivo.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(catalog)), { original: true });
  fs.writeFileSync(catalog, '{"petra":"edited"}');
  prepararDatos(fixture, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(catalog)), { petra: 'edited' });
});
test('rooms never render the removed floor guidance circles', () => {
  for (const filename of fs.readdirSync(path.join(root, 'src/scenes'))) {
    if (!filename.endsWith('.tsx')) continue;
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/scenes', filename), 'utf8'), /<Hotspot\b|useHotspots/);
  }
});
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
};
const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'petra-tests-'));
const originalCwd = process.cwd();
process.chdir(isolated);
process.env.TALLER_KEY = 'isolated-test-workshop-key';
delete process.env.STRIPE_SECRET_KEY;
delete process.env.RESEND_API_KEY;
const originalFetch = global.fetch;
after(() => { process.chdir(originalCwd); global.fetch = originalFetch; });
const catalog = require('../src/app/api/catalogo/route.ts');
const contact = require('../src/app/api/contacto/route.ts');
const checkout = require('../src/app/api/checkout/route.ts');
const { TEAS, teaById, teasBySala } = require('../src/data/teas.ts');
const { setVivo } = require('../src/lib/vivoStore.ts');
let sequence = 0;
test('shared spoon rack updates every hover name with the active language', () => {
  const filename = path.join(root, 'src/components/three/SpoonRack.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  let language = 'es';
  instance.require = request => {
    if (request === 'react') return { useState: () => [0, () => {}], useEffect: () => {}, useRef: () => ({ current: null }) };
    if (request === '@/i18n') return { useLang: () => ({ lang: language }) };
    if (request === '@react-three/drei') return { Html: () => null };
    if (request === '@react-three/fiber') return { useFrame: () => {} };
    if (request === './Room') return { WOOD: { marco: '#000000' } };
    return require(request);
  };
  instance._compile(compiled, filename);
  const { cucharas } = require('../src/data/extras.ts');
  const { trExtra } = require('../src/i18n/catalogo.ts');
  for (language of ['es', 'en', 'sl', 'es']) {
    const rack = instance.exports.default({ position: [0, 0, 0] });
    const rendered = rack.props.children[1];
    assert.deepEqual(rendered.map(spoon => spoon.props.nombre), cucharas().map(spoon => trExtra(spoon, language).nombre));
  }
});
test('3D ingredients use bounded six-item pages in front of the shelf', () => {
  const { ingredientPage, ingredientOffset, INSPECTION_POSITION } = require('../src/lib/ingredientLayout.ts');
  assert.deepEqual(ingredientPage(-1, 20), { start: 0, end: 6 });
  assert.deepEqual(ingredientPage(19, 20), { start: 18, end: 20 });
  for (let count = 1; count <= 6; count++) {
    const points = Array.from({ length: count }, (_, index) => ingredientOffset(index, count));
    for (const [index, point] of points.entries()) {
      assert.ok(point[2] + INSPECTION_POSITION[2] > -1.5);
      assert.ok(point[1] + INSPECTION_POSITION[1] < 3.2);
      for (const other of points.slice(index + 1)) assert.ok(Math.hypot(...point.map((value, axis) => value - other[axis])) >= 0.94);
    }
  }
});
test('season boxes match Petra composition and only seasonal boxes include a spoon', () => {
  const { CAJAS } = require('../src/data/boxes.ts');
  const expected = {
    'caja-general': ['queso-casa'],
    'caja-verano': ['limonada-frambuesa'],
    'caja-invierno': ['queso-casa', 'chorizo-valle'],
    'caja-primavera': ['miel-flores'],
    'caja-otono': ['miel-castano'],
  };
  for (const box of CAJAS) {
    assert.deepEqual(box.extras, expected[box.id]);
    assert.equal(box.incluyeTeNormalAlAzar, true);
    assert.equal(box.incluyeCucharaAlAzar, box.estacion !== null);
  }
});
test('expanded ingredient library has at least 100 new unique translated entries', () => {
  const { HERBARIO_AMPLIADO } = require('../src/data/herbario-ampliado.ts');
  const { PLANTS } = require('../src/data/plants.ts');
  const { FORMAS_PLANTA } = require('../src/data/formasPlanta.ts');
  assert.ok(HERBARIO_AMPLIADO.length >= 100);
  assert.equal(new Set(PLANTS.map(plant => plant.id)).size, PLANTS.length);
  for (const plant of HERBARIO_AMPLIADO) {
    assert.ok(FORMAS_PLANTA[plant.forma]);
    assert.ok(plant.nombre && plant.nombres.en && plant.nombres.sl && plant.grupo);
    assert.ok(/^#[0-9a-f]{6}$/i.test(plant.color));
  }
});
function request(body, authenticated = true) {
  return new Request('http://localhost/api/test', { method: 'POST', headers: {
    'Content-Type': 'application/json', 'x-forwarded-for': `test-${++sequence}`,
    ...(authenticated ? { 'x-taller-key': process.env.TALLER_KEY } : {}),
  }, body: JSON.stringify(body) });
}

test('editing a base tea overrides its price, room and composition without duplicates', () => {
  const edited = { ...TEAS[0], precio: 21.75, sala: 'te-premium', plantas: TEAS[0].plantas.slice(0, 2) };
  setVivo({ teas: [edited], extras: [] });
  assert.equal(teaById(edited.id).precio, 21.75);
  assert.equal(teasBySala('te').filter(tea => tea.id === edited.id).length, 0);
  assert.equal(teasBySala('te-premium').filter(tea => tea.id === edited.id).length, 1);
  setVivo({ teas: [], extras: [] });
});
test('catalog editing preserves product id when renaming', async () => {
  const item = { ...TEAS[0], nombre: 'Nombre revisado', precio: 12.34 };
  const response = await catalog.POST(request({ tipo: 'tea', item }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).teas[0].id, item.id);
});
test('edited tea translations persist, sanitize and never reuse stale base copy', async () => {
  const plantId = TEAS[0].plantas[0].plantaId;
  const item = { ...TEAS[0], nombre: 'Nueva mezcla', traducciones: {
    en: { nombre: '  Orchard\u0000 tea  ', paraQueSirve: 'Fruit aroma', plantas: { [plantId]: 'Fresh finish', unknown: 'Discard' } },
    sl: { nombre: 'Sadni čaj', paraQueSirve: 'Sadna aroma', plantas: { [plantId]: 'Svež zaključek' } },
    fr: { nombre: 'Not supported' },
  } };
  const response = await catalog.POST(request({ tipo: 'tea', item }));
  assert.equal(response.status, 200);
  const saved = (await response.json()).teas.find(tea => tea.id === item.id);
  assert.equal(saved.traducciones?.en.nombre, 'Orchard  tea');
  assert.equal(saved.traducciones.fr, undefined);
  assert.equal(saved.traducciones.en.plantas.unknown, undefined);
  const { trTea } = require('../src/i18n/catalogo.ts');
  assert.equal(trTea(saved, 'en').nombre, 'Orchard  tea');
  assert.equal(trTea(saved, 'sl').plantas[0].porQueEnEsteMix, 'Svež zaključek');
  assert.equal(trTea(saved, 'es').nombre, 'Nueva mezcla');
  assert.equal(trTea({ ...saved, traducciones: { en: { nombre: '' } } }, 'en').nombre, 'Nueva mezcla');
  assert.equal(trTea({ ...saved, traducciones: undefined }, 'sl').nombre, 'Nueva mezcla');
  assert.equal(trTea(saved, 'sl').precio, item.precio);
  const legacy = await catalog.POST(request({ tipo: 'tea', item: { ...item, traducciones: undefined, precio: 17 } }));
  const updated = (await legacy.json()).teas.find(tea => tea.id === item.id);
  assert.equal(trTea(updated, 'sl').nombre, 'Sadni čaj');
});
test('custom ingredient names retain English and Slovenian translations', async () => {
  const item = { id: 'test-translated-plant', nombre: 'Limón', nombres: { en: ' Lemon peel ', sl: 'Limonina lupina', fr: 'Ignored' }, latin: 'Citrus limon', forma: 'piel', color: '#e4bb37', color2: '#779750' };
  const response = await catalog.POST(request({ tipo: 'plant', item }));
  assert.equal(response.status, 200);
  const saved = (await response.json()).plants.find(plant => plant.id === item.id);
  assert.deepEqual(saved.nombres, { en: 'Lemon peel', sl: 'Limonina lupina' });
});
test('server SEO catalog merges live tea edits and new products by stable id', async () => {
  const { tesPublicados } = require('../src/lib/catalogoServidor.ts');
  await catalog.POST(request({ tipo: 'tea', item: { ...TEAS[0], id: 'seo-new-tea', nombre: 'Nuevo té SEO' } }));
  const teas = await tesPublicados();
  assert.equal(teas.filter(tea => tea.id === TEAS[0].id).length, 1);
  assert.equal(teas.find(tea => tea.id === TEAS[0].id).nombre, 'Nueva mezcla');
  assert.equal(teas.find(tea => tea.id === 'seo-new-tea').nombre, 'Nuevo té SEO');
});
test('unknown plants and invalid weights cannot enter the public catalog', async () => {
  for (const item of [{ ...TEAS[0], plantas: [{ plantaId: 'unknown', porQueEnEsteMix: '' }] }, { ...TEAS[0], gramos: -1 }]) {
    assert.equal((await catalog.POST(request({ tipo: 'tea', item }))).status, 400);
  }
});
test('catalog requires workshop authentication', async () => {
  assert.equal((await catalog.POST(request({ tipo: 'tea', item: TEAS[0] }, false))).status, 401);
});
test('empty names and prices rounded to zero are rejected', async () => {
  for (const item of [{ ...TEAS[0], nombre: '  ' }, { ...TEAS[0], precio: 0.001 }]) assert.equal((await catalog.POST(request({ tipo: 'tea', item }))).status, 400);
});
test('citrus peel and dried-fruit definitions persist with their visual forms', async () => {
  for (const forma of ['piel', 'fruta-seca']) {
    const plant = { id: `test-${forma}`, nombre: forma, latin: '', forma, color: '#d4b336', color2: '#93804f' };
    const response = await catalog.POST(request({ tipo: 'plant', item: plant }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).plants.find(item => item.id === plant.id).forma, forma);
  }
});
test('runtime site origin supports isolated previews without allowing another origin', () => {
  const { nuevaSesion, claveOk } = require('../src/lib/tallerAuth.ts');
  process.env.SITE_URL = 'http://127.0.0.1:3111';
  const cookie = `petra-taller=${nuevaSesion(process.env.TALLER_KEY)}`;
  assert.equal(claveOk(new Request('http://localhost:3111/api/catalogo', { method: 'POST', headers: { cookie, origin: process.env.SITE_URL } })), true);
  assert.equal(claveOk(new Request('http://localhost:3111/api/catalogo', { method: 'POST', headers: { cookie, origin: 'http://evil.example' } })), false);
  delete process.env.SITE_URL;
});
test('contact rejects null JSON instead of crashing', async () => {
  assert.equal((await contact.POST(request(null))).status, 400);
});
test('contact reports provider failure, never a false success', async () => {
  process.env.RESEND_API_KEY = 'test-not-a-real-key';
  process.env.PEDIDOS_EMAIL_FROM = 'test@example.com';
  process.env.PEDIDOS_EMAIL_TO = 'merchant@example.com';
  global.fetch = async () => new Response('{"error":"failed"}', { status: 500 });
  assert.equal((await contact.POST(request({ nombre: 'Test', email: 'test@example.com', mensaje: 'Test message', consiente: true }))).status, 502);
  global.fetch = originalFetch;
  delete process.env.RESEND_API_KEY;
});
test('missing Stripe configuration never simulates a paid order', async () => {
  assert.equal((await checkout.POST(request({ lines: [{ kind: 'tea', id: TEAS[0].id, qty: 1 }] }))).status, 503);
});
test('workshop sessions require a valid signature and same-origin writes', () => {
  const { nuevaSesion, claveOk } = require('../src/lib/tallerAuth.ts');
  const token = nuevaSesion(process.env.TALLER_KEY);
  assert.ok(token);
  const cookie = `petra-taller=${token}`;
  assert.equal(claveOk(new Request('http://localhost/api/catalogo', { headers: { cookie } })), true);
  assert.equal(claveOk(new Request('http://localhost/api/catalogo', { method: 'POST', headers: { cookie, origin: 'http://evil.example' } })), false);
  assert.equal(claveOk(new Request('http://localhost/api/catalogo', { method: 'POST', headers: { cookie, origin: 'http://localhost' } })), true);
  assert.equal(claveOk(new Request('http://localhost/api/catalogo', { headers: { cookie: cookie + 'forged' } })), false);
});
test('custom roots and berries can be published and used by a tea', async () => {
  const plant = { id: 'test-root', nombre: 'Raíz de prueba', latin: '', forma: 'raiz', color: '#b89050', color2: '#5c8050' };
  assert.equal((await catalog.POST(request({ tipo: 'plant', item: plant }))).status, 200);
  const tea = { ...TEAS[0], plantas: [{ plantaId: plant.id, porQueEnEsteMix: 'Sabor' }] };
  assert.equal((await catalog.POST(request({ tipo: 'tea', item: tea }))).status, 200);
  const { plantById } = require('../src/data/plants.ts');
  setVivo({ teas: [tea], extras: [], plants: [plant] });
  assert.equal(plantById(plant.id).forma, 'raiz');
  assert.equal(teaById(tea.id).plantas[0].plantaId, plant.id);
  setVivo({ teas: [], extras: [] });
});
test('concurrent catalog publications preserve both products', async () => {
  const responses = await Promise.all(['concurrent-one', 'concurrent-two'].map(id => catalog.POST(request({ tipo: 'tea', item: { ...TEAS[0], id } }))));
  assert.ok(responses.every(response => response.status === 200));
  const saved = await (await catalog.GET()).json();
  assert.ok(saved.teas.some(tea => tea.id === 'concurrent-one'));
  assert.ok(saved.teas.some(tea => tea.id === 'concurrent-two'));
});
test('receipt emails cannot be triggered by a forged browser order', async () => {
  const route = require('../src/app/api/pedido-email/route.ts');
  assert.equal((await route.POST(request({ email: 'victim@example.com', total: 100 }))).status, 410);
});
test('Stripe webhook rejects unsigned requests', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_isolated';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_isolated';
  const webhook = require('../src/app/api/stripe-webhook/route.ts');
  assert.equal((await webhook.POST(request({ type: 'checkout.session.completed' }))).status, 400);
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});
test('unpaid sessions never create orders or send email', async () => {
  const { confirmarPedido } = require('../src/lib/pedidosStripe.ts');
  let emails = 0;
  global.fetch = async () => { emails++; throw new Error('unexpected network'); };
  await confirmarPedido({ checkout: { sessions: { retrieve: async () => ({ metadata: { app: 'petra' }, payment_status: 'unpaid' }) } } }, 'cs_test_isolatedunpaid123');
  assert.equal(emails, 0);
  global.fetch = originalFetch;
});
test('confirmed orders send once to customer and merchant despite concurrent retries', async () => {
  const { confirmarPedido } = require('../src/lib/pedidosStripe.ts');
  process.env.RESEND_API_KEY = 're_isolated_test';
  process.env.PEDIDOS_EMAIL_FROM = 'store@example.com';
  process.env.PEDIDOS_EMAIL_TO = 'merchant@example.com';
  const messages = [];
  global.fetch = async (url, options) => { messages.push(JSON.parse(options.body)); return new Response('{"id":"test-email"}', { status: 200, headers: { 'content-type': 'application/json' } }); };
  const id = 'cs_test_isolatedpaid123456';
  const stripe = { checkout: { sessions: {
    retrieve: async () => ({ id, metadata: { app: 'petra' }, payment_status: 'paid', currency: 'eur', livemode: false, created: 1700000000, amount_subtotal: 1000, amount_total: 1490, total_details: { amount_shipping: 490 }, customer_email: 'customer@example.com' }),
    listLineItems: async function* () { yield { description: 'Té', quantity: 1, amount_subtotal: 1000 }; },
  } } };
  await Promise.all([confirmarPedido(stripe, id), confirmarPedido(stripe, id)]);
  await confirmarPedido(stripe, id);
  assert.equal(messages.length, 2);
  assert.ok(messages.some(message => JSON.stringify(message.to).includes('merchant@example.com')));
  assert.ok(messages.every(message => message.subject.includes('TEST')));
  global.fetch = originalFetch;
  delete process.env.RESEND_API_KEY;
});
