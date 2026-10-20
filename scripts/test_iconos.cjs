const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/studio/catalogo-base.json'), 'utf8'));

test('cada ingrediente tiene ilustración propia exportada y perfil semántico', () => {
  assert.equal(catalog.plants.length, 167);
  for (const plant of catalog.plants) {
    assert.ok(catalog.ingredientDrawings?.[plant.id], plant.id);
    assert.ok(catalog.visualProfiles?.[plant.id]?.kind, plant.id);
    assert.match(catalog.ingredientDrawings[plant.id], /viewBox="0 0 100 100"/);
    assert.doesNotMatch(catalog.ingredientDrawings[plant.id], /NaN|undefined|<script|<image|<foreignObject/);
  }
});

test('partes y preparados distintos no heredan el dibujo equivocado', () => {
  const expected = {
    'herbario-kiwi-deshidratado': 'kiwi',
    'herbario-platano-deshidratado': 'banana',
    'herbario-jengibre-en-rodajas': 'ginger-slice',
    'herbario-bayas-de-goji': 'goji',
    'herbario-granada-deshidratada': 'arils',
    'herbario-vainilla-en-vaina': 'vanilla',
    'herbario-macis': 'mace',
    'herbario-hoja-de-pandan': 'blade',
    'herbario-trigo-sarraceno-tostado': 'buckwheat',
    tila: 'linden',
  };
  for (const [id, kind] of Object.entries(expected)) assert.equal(catalog.visualProfiles?.[id]?.kind, kind, id);
});

test('no hay dibujos exactamente duplicados entre ingredientes distintos', () => {
  const seen = new Map();
  for (const plant of catalog.plants) {
    const drawing = catalog.ingredientDrawings?.[plant.id];
    assert.ok(drawing, plant.id);
    const geometry = drawing.replace(/data-ingredient="[^"]*"/g, '').replaceAll('#aabbcc', plant.color).replaceAll('#ddeeff', plant.color2);
    assert.ok(!seen.has(geometry), `${plant.id} duplica ${seen.get(geometry)}`);
    seen.set(geometry, plant.id);
  }
});

test('todos los consumidores transmiten identidad, también Studio y 3D', () => {
  for (const file of ['src/components/clasica/Lamina.tsx', 'src/app/clasica/tes/[id]/FichaTe.tsx', 'src/components/hud/TeaPanel.tsx']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const tag of source.matchAll(/<PlantaSVG\b[^>]+/g)) assert.match(tag[0], /plantId=/, file);
  }
  assert.match(fs.readFileSync(path.join(root, 'public/studio/studio.js'), 'utf8'), /ingredientDrawings/);
  assert.match(fs.readFileSync(path.join(root, 'src/components/three/PlantSprig.tsx'), 'utf8'), /BotanicalSpecimen/);
});
