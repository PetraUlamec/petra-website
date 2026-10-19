"use strict";
const element = (id) => document.getElementById(id);
const make = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const merge = (base, edited) => [...new Map([...base, ...edited].map((item) => [item.id, item])).values()];
const money = (amount) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(amount) || 0);
let base = { teas: [], plants: [] }, catalog = { teas: [], extras: [], plants: [] };
let draft = null, pendingPlants = [], busy = false, changed = false, preview3d = false, previewTimer;
const blank = () => ({ nombre: '', precio: 8, gramos: 60, sala: 'te', colorHoja: '#9fa968', paraQueSirve: '', plantas: [] });
for (const [value, text] of [['fruta', 'Fruta / cítrico'], ['semilla', 'Semilla'], ['piel', 'Piel de cítrico'], ['fruta-seca', 'Rodaja de manzana seca'], ['fresa', 'Fresa en láminas'], ['caliz', 'Cáliz de hibisco'], ['petalos', 'Pétalos secos'], ['rizoma', 'Rizoma / jengibre']]) { const option = make('option', text); option.value = value; element('plant-shape').append(option); }
const pantry = [
  ['limon', 'Piel de limón', 'Citrus limon', 'piel', '#e4bb37', '#779750', 'Un toque cítrico y luminoso.'],
  ['naranja', 'Piel de naranja', 'Citrus sinensis', 'piel', '#df8734', '#71934d', 'Aroma de naranja.'],
  ['manzana', 'Manzana deshidratada', 'Malus domestica', 'fruta-seca', '#e5c98c', '#ad6843', 'Notas suaves de fruta.'],
  ['fresa', 'Fresa deshidratada', 'Fragaria × ananassa', 'fresa', '#c76564', '#8d3949', 'Un acento de frutos rojos.'],
  ['arandano', 'Arándano', 'Vaccinium myrtillus', 'baya', '#5c527c', '#6b9259', 'Un matiz afrutado.'],
  ['jengibre', 'Jengibre', 'Zingiber officinale', 'rizoma', '#c99d64', '#77945a', 'Una nota cálida y especiada.'],
  ['canela', 'Canela', 'Cinnamomum verum', 'corteza', '#ad7144', '#825139', 'Aroma dulce y cálido.'],
  ['menta', 'Menta', 'Mentha spicata', 'hoja', '#739c63', '#4d754c', 'Un final fresco.'],
  ['hibisco', 'Hibisco', 'Hibiscus sabdariffa', 'caliz', '#9e3e59', '#6b854d', 'Un toque floral.'],
  ['hinojo', 'Semillas de hinojo', 'Foeniculum vulgare', 'semilla', '#a69b61', '#71824d', 'Un matiz anisado.'],
].map(([slug, nombre, latin, forma, color, color2, note]) => ({ id: `studio-${slug}`, nombre, latin, forma, color, color2, note }));
let plantFilter = 'all';
let plantLimit = 24;
const searchable = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
const plants = () => merge(merge(base.plants, catalog.plants || []), pendingPlants);
const teas = () => merge(base.teas, catalog.teas || []);
function notice(message, error = false) { element('notice').textContent = message; element('notice').dataset.error = String(error); }
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo conectar. Conservamos tus cambios; vuelve a intentarlo.');
  return data;
}
const post = (url, data) => api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
function preserve() {
  changed = true;
  element('draft-state').textContent = 'Borrador · sin publicar';
  try { localStorage.setItem('petra-studio-draft', JSON.stringify({ draft, pendingPlants })); }
  catch { notice('El navegador no permite guardar borradores. No cierres esta ventana antes de publicar.', true); }
  preview();
}
function discardAllowed() { return !changed || window.confirm('Hay cambios sin publicar. ¿Cambiar de mezcla y descartarlos?'); }
function selectTea(tea) {
  if (!discardAllowed()) return;
  draft = structuredClone(tea); changed = false;
  element('tea-name').value = draft.nombre;
  element('tea-price').value = draft.precio;
  element('tea-weight').value = draft.gramos;
  element('tea-room').value = draft.sala;
  element('tea-color').value = /^#[0-9a-f]{6}$/i.test(draft.colorHoja) ? draft.colorHoja : '#9fa968';
  element('tea-description').value = draft.paraQueSirve;
  element('tea-photo').value = '';
  element('editor-title').textContent = draft.id ? 'Editar mezcla' : 'Crear una mezcla';
  element('draft-state').textContent = draft.id ? 'Versión publicada' : 'Nueva mezcla';
  renderList(); renderPlants(); preview(); setFrame(true);
}
function renderList() {
  const query = element('search-tea').value.toLocaleLowerCase();
  const list = element('tea-list'); list.replaceChildren();
  for (const tea of teas().filter((item) => `${item.nombre} ${item.plantas.map((part) => plants().find((plant) => plant.id === part.plantaId)?.nombre || '').join(' ')}`.toLocaleLowerCase().includes(query))) {
    const button = make('button', undefined, 'tea-choice'); button.type = 'button'; button.setAttribute('aria-pressed', String(tea.id === draft?.id));
    const swatch = make('span', '', 'swatch'); swatch.style.backgroundColor = tea.colorHoja;
    const label = make('span', tea.nombre); label.append(make('small', `${money(tea.precio)} · ${tea.plantas.length} ingredientes`));
    button.append(swatch, label); button.addEventListener('click', () => selectTea(tea)); list.append(button);
  }
}
function renderPlants() {
  const query = searchable(element('search-plant').value);
  const category = element('category-plant').value;
  const previousFocus = document.activeElement?.dataset.plantId;
  const list = element('plant-options'); list.replaceChildren();
  const filtered = plants().filter(item => searchable(`${item.nombre} ${item.latin} ${item.nombres?.en || ''} ${item.nombres?.sl || ''} ${item.grupo || ''} ${base.formas?.[item.forma] || item.forma}`).includes(query) && (!category || (item.grupo || 'Originales y personalizados') === category) && (plantFilter !== 'selected' || draft.plantas.some(part => part.plantaId === item.id)));
  for (const plant of filtered.slice(0, plantLimit)) {
    const selected = draft.plantas.find((part) => part.plantaId === plant.id);
    const block = make('div', undefined, 'plant-option'), label = make('label'), checkbox = make('input');
    block.dataset.selected = String(!!selected);
    checkbox.type = 'checkbox'; checkbox.checked = !!selected; checkbox.dataset.plantId = plant.id;
    const name = make('span', plant.nombre); name.append(make('small', plant.latin || base.formas?.[plant.forma] || plant.forma));
    label.append(checkbox, drawing(plant), name); block.append(label);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) draft.plantas.push({ plantaId: plant.id, porQueEnEsteMix: '' });
      else draft.plantas = draft.plantas.filter((part) => part.plantaId !== plant.id);
      renderPlants(); preserve();
    });
    if (selected) {
      const text = make('textarea'); text.rows = 2; text.maxLength = 2000; text.value = selected.porQueEnEsteMix;
      text.placeholder = 'Qué aporta: sabor, aroma, cantidad o parte utilizada…'; text.setAttribute('aria-label', `Qué aporta ${plant.nombre}`);
      text.addEventListener('input', () => { selected.porQueEnEsteMix = text.value; preserve(); }); block.append(text);
    }
    list.append(block);
  }
  if (!list.childElementCount) list.append(make('p', 'No hay ingredientes aquí. Prueba otra búsqueda o añádelos desde la despensa visual.', 'quiet'));
  element('ingredient-results').textContent = `${Math.min(plantLimit, filtered.length)} de ${filtered.length} opciones · ${draft.plantas.length} en tu mezcla`;
  element('more-plants').hidden = plantLimit >= filtered.length;
  element('library-total').textContent = `${base.plants.length} ingredientes y variedades · ${base.plants.filter(plant => plant.id.startsWith('herbario-')).length} nuevos`;
  if (previousFocus) list.querySelector(`[data-plant-id="${CSS.escape(previousFocus)}"]`)?.focus({ preventScroll: true });
}
function drawing(plant) {
  const template = base.drawings?.[plant.forma];
  if (template && /^#[0-9a-f]{6}$/i.test(plant.color) && /^#[0-9a-f]{6}$/i.test(plant.color2)) {
    const documentSVG = new DOMParser().parseFromString(template.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replaceAll('#aabbcc', plant.color).replaceAll('#ddeeff', plant.color2), 'image/svg+xml');
    const svg = document.importNode(documentSVG.documentElement, true);
    svg.removeAttribute('width'); svg.removeAttribute('height'); return svg;
  }
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg'); svg.setAttribute('viewBox', '0 0 100 130'); svg.setAttribute('aria-hidden', 'true');
  const shape = (name, attrs) => { const node = document.createElementNS(namespace, name); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); svg.append(node); };
  if (!['piel', 'fruta-seca', 'semilla'].includes(plant.forma)) shape('path', { d: 'M48 116 Q62 70 49 20', fill: 'none', stroke: plant.color2, 'stroke-width': '3' });
  if (plant.forma === 'piel') {
    shape('path', { d: 'M24 30 C78 7 90 60 53 62 C15 64 18 99 72 101', fill: 'none', stroke: plant.color, 'stroke-width': '14', 'stroke-linecap': 'round' });
    shape('path', { d: 'M24 26 C78 3 90 56 53 58 C15 60 18 95 72 97', fill: 'none', stroke: '#fff1bb', 'stroke-width': '3' });
  } else if (plant.forma === 'fruta-seca') {
    for (const [cx, cy] of [[36,46],[63,80]]) {
      shape('ellipse', { cx, cy, rx: 24, ry: 29, fill: plant.color, stroke: plant.color2, 'stroke-width': '3' });
      shape('ellipse', { cx, cy, rx: 5, ry: 7, fill: '#fbf3e4' });
      for (let ray = 0; ray < 6; ray++) { const angle = ray * Math.PI / 3; shape('path', { d: `M${cx + Math.cos(angle)*10} ${cy + Math.sin(angle)*10} L${cx + Math.cos(angle)*20} ${cy + Math.sin(angle)*23}`, stroke: plant.color2, opacity: '.5' }); }
    }
  } else if (plant.forma === 'fruta') {
    shape('circle', { cx: 50, cy: 62, r: 30, fill: plant.color });
    shape('path', { d: 'M49 32 Q45 12 68 15 Q74 31 49 32', fill: plant.color2 });
  } else if (plant.forma === 'semilla') {
    for (const [cx, cy] of [[35,40],[64,45],[45,73],[72,84]]) shape('ellipse', { cx, cy, rx: 9, ry: 16, fill: plant.color });
  } else if (plant.forma === 'baya') {
    for (const [cx, cy] of [[38,32],[57,30],[48,48],[65,49],[34,52]]) shape('circle', { cx, cy, r: 11, fill: plant.color });
  } else if (plant.forma === 'raiz' || plant.forma === 'corteza') {
    shape('path', { d: 'M52 33 Q33 54 44 75 L28 106 M48 58 L72 82 M43 77 L62 113', fill: 'none', stroke: plant.color, 'stroke-width': '13', 'stroke-linecap': 'round' });
  } else if (['flor5','margarita','umbela','espiga'].includes(plant.forma)) {
    for (let petal = 0; petal < 6; petal++) { const angle = petal * Math.PI / 3; shape('ellipse', { cx: 50 + Math.cos(angle) * 14, cy: 35 + Math.sin(angle) * 14, rx: 9, ry: 12, fill: plant.color }); }
    shape('circle', { cx: 50, cy: 35, r: 8, fill: '#d4ae49' });
  }
  if (!['piel', 'fruta-seca', 'semilla'].includes(plant.forma)) for (const [height, direction] of [[65,-1],[85,1]]) shape('path', { d: `M51 ${height} Q${51 + direction*35} ${height-28} ${51 + direction*27} ${height-8} Q${51 + direction*17} ${height+9} 51 ${height}`, fill: plant.color2, opacity: '.8' });
  return svg;
}
function addIngredient(plant) {
  if (!plants().some(item => item.id === plant.id)) {
    const { note, ...definition } = plant;
    pendingPlants.push(definition);
  }
  if (!draft.plantas.some(part => part.plantaId === plant.id)) draft.plantas.push({ plantaId: plant.id, porQueEnEsteMix: plant.note || '' });
  renderPlants(); preserve();
}
function createDemo() {
  if (!discardAllowed()) return;
  changed = false;
  selectTea({ ...blank(), nombre: 'Sol de huerto · DEMO', precio: 9.5, gramos: 60, colorHoja: '#d6a24e', paraQueSirve: 'Demostración visual, no receta comercial: piel de limón y naranja, manzana y fresa deshidratadas, jengibre, canela, menta e hibisco. Ingredientes y precio de ejemplo, pendientes de validar por Petra.' });
  for (const index of [0, 1, 2, 3, 5, 6, 7, 8]) addIngredient(pantry[index]);
  notice('Demo sin publicar: cambia ingredientes y compara la página clásica con el 3D. No modifica tu tienda.');
}
function renderPantry() {
  const list = element('pantry-options'); list.replaceChildren();
  for (const plant of pantry) {
    const button = make('button', undefined, 'ingredient-card'); button.type = 'button';
    button.setAttribute('aria-label', `Añadir ${plant.nombre}`);
    button.append(drawing(plant), make('span', plant.nombre), make('small', '+ Añadir'));
    button.addEventListener('click', () => { addIngredient(plant); notice(`${plant.nombre} añadido al borrador. Mira el resultado en la vista previa.`); }); list.append(button);
  }
}
function previewIngredient() {
  const plant = { forma: element('plant-shape').value, color: element('plant-color').value, color2: element('plant-color2').value };
  element('new-plant-preview').replaceChildren(drawing(plant), make('span', element('plant-name').value || 'Tu nuevo ingrediente'));
  for (const button of element('shape-options').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.shape === plant.forma));
}
function renderShapes() {
element('plant-shape').replaceChildren();
for (const [value, label] of Object.entries(base.formas || {})) { const option = make('option', label); option.value = value; element('plant-shape').append(option); }
element('plant-shape').value = 'hoja';
element('shape-options').replaceChildren();
for (const option of element('plant-shape').options) {
  const button = make('button', undefined, 'ingredient-card'); button.type = 'button'; button.dataset.shape = option.value;
  button.append(drawing({ forma: option.value, color: '#c29955', color2: '#6f8753' }), make('span', option.textContent));
  button.addEventListener('click', () => { element('plant-shape').value = option.value; previewIngredient(); }); element('shape-options').append(button);
}
}
for (const id of ['plant-name','plant-shape','plant-color','plant-color2']) element(id).addEventListener('input', previewIngredient);
element('demo-tea').addEventListener('click', createDemo);
for (const value of ['all','selected']) element(`filter-${value}`).addEventListener('click', () => {
  plantFilter = value; plantLimit = 24;
  for (const filter of ['all','selected']) element(`filter-${filter}`).setAttribute('aria-pressed', String(filter === value));
  renderPlants();
});
function preview() {
  if (!draft) return;
  element('preview-name').textContent = draft.nombre || 'Tu próxima mezcla';
  element('preview-description').textContent = draft.paraQueSirve || 'Aquí aparecerá la historia que escribas para este té.';
  element('preview-price').textContent = money(draft.precio); element('preview-weight').textContent = `${draft.gramos || 0} g`;
  element('plant-count').textContent = `${draft.plantas.length} ingredientes`;
  const illustration = element('preview-plants'), ingredients = element('preview-ingredients'); illustration.replaceChildren(); ingredients.replaceChildren();
  for (const part of draft.plantas) {
    const plant = plants().find((item) => item.id === part.plantaId); if (!plant) continue;
    illustration.append(drawing(plant));
    const row = make('li', plant.nombre); row.append(make('small', part.porQueEnEsteMix)); ingredients.append(row);
  }
  clearTimeout(previewTimer); previewTimer = setTimeout(sendPreview, 250);
}
function sendPreview() {
  if (!draft) return;
  const tea = { ...draft, id: draft.id || 'studio-preview', editado: true };
  element('site-frame').contentWindow?.postMessage({ type: 'petra-studio-preview', catalog: { ...catalog, teas: merge(catalog.teas || [], [tea]), plants: merge(catalog.plants || [], pendingPlants) }, teaId: tea.id }, location.origin);
}
function setFrame(force = false) {
  const path = preview3d ? `/${draft?.sala || 'te'}` : `/clasica/tes/${encodeURIComponent(draft?.id || 'studio-preview')}`;
  const url = `${path}?studio=1`;
  if (force || element('site-frame').getAttribute('src') !== url) element('site-frame').src = url;
  else sendPreview();
}
async function refresh() {
  catalog = await api('/api/catalogo'); element('connection').textContent = 'Conectado a tu tienda'; renderList(); if (draft) renderPlants();
}
element('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await post('/api/taller-sesion', { password: element('workshop-key').value }); element('workshop-key').value = ''; element('login-form').hidden = true; notice('Sesión iniciada. Ya puedes guardar y publicar.'); }
  catch (error) { element('login-status').textContent = error.message; }
});
element('logout').addEventListener('click', async () => { try { await api('/api/taller-sesion', { method: 'DELETE' }); element('login-form').hidden = false; notice('Sesión cerrada. Tus cambios sin publicar siguen en este navegador.'); } catch (error) { notice(error.message, true); } });
element('refresh').addEventListener('click', () => refresh().then(() => notice('Catálogo actualizado.')).catch((error) => notice(error.message, true)));
element('search-tea').addEventListener('input', renderList);
element('search-plant').addEventListener('input', () => { plantLimit = 24; renderPlants(); });
element('category-plant').addEventListener('change', () => { plantLimit = 24; renderPlants(); });
element('more-plants').addEventListener('click', () => { plantLimit += 24; renderPlants(); });
element('new-tea').addEventListener('click', () => selectTea(blank()));
element('duplicate').addEventListener('click', () => { const copy = { ...structuredClone(draft), nombre: `${draft.nombre} · nueva mezcla` }; delete copy.id; changed = false; selectTea(copy); preserve(); });
for (const [id, key] of Object.entries({ 'tea-name': 'nombre', 'tea-price': 'precio', 'tea-weight': 'gramos', 'tea-room': 'sala', 'tea-color': 'colorHoja', 'tea-description': 'paraQueSirve' })) {
  element(id).addEventListener('input', (event) => {
    draft[key] = ['precio','gramos'].includes(key) ? Number(event.target.value) : event.target.value;
    if (event.target.validity.valid) event.target.removeAttribute('aria-invalid'); preserve(); if (key === 'sala') setFrame();
  });
  element(id).addEventListener('invalid', (event) => event.target.setAttribute('aria-invalid', 'true'));
}
element('tea-photo').addEventListener('change', () => { changed = true; element('draft-state').textContent = 'Foto pendiente de publicar'; });
element('tea-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (busy) return;
  if (!draft.plantas.length) { notice('Selecciona al menos un ingrediente para esta mezcla.', true); return; }
  if (!window.confirm(`¿Publicar «${draft.nombre}» a ${money(draft.precio)} en la tienda?`)) return;
  busy = true; element('publish').disabled = true;
  try {
    for (const plant of pendingPlants) catalog = await post('/api/catalogo', { tipo: 'plant', item: plant });
    pendingPlants = [];
    const photo = element('tea-photo').files[0];
    if (photo) {
      if (photo.size > 12 * 1024 * 1024) throw new Error('La foto debe pesar menos de 12 MB.');
      const form = new FormData(); form.set('file', photo); form.set('nombre', draft.nombre); form.set('recortar', '0');
      const uploaded = await api('/api/foto', { method: 'POST', body: form }); draft.foto = uploaded.foto;
    }
    catalog = await post('/api/catalogo', { tipo: 'tea', item: draft });
    const saved = catalog.teas.find((tea) => tea.id === draft.id) || catalog.teas.find((tea) => tea.nombre === draft.nombre);
    changed = false; localStorage.removeItem('petra-studio-draft'); selectTea(saved || draft);
    notice('Publicado. Tu tienda clásica y 3D ya usan estos textos, precio e ingredientes.');
  } catch (error) { preserve(); notice(error.message, true); }
  finally { busy = false; element('publish').disabled = false; }
});
element('open-plant').addEventListener('click', () => { previewIngredient(); element('plant-dialog').showModal(); });
element('close-plant').addEventListener('click', () => element('plant-dialog').close());
element('plant-form').addEventListener('submit', (event) => {
  event.preventDefault(); const name = element('plant-name').value.trim();
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
  const id = `planta-${slug || crypto.randomUUID()}`;
  if (plants().some((plant) => plant.id === id)) { element('plant-notice').textContent = 'Ya existe ese ingrediente. Elígelo en el herbario.'; return; }
  pendingPlants.push({ id, nombre: name, latin: element('plant-latin').value, forma: element('plant-shape').value, color: element('plant-color').value, color2: element('plant-color2').value });
  draft.plantas.push({ plantaId: id, porQueEnEsteMix: '' }); renderPlants(); preserve(); element('plant-dialog').close(); element('plant-form').reset();
});
element('backup').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ catalog, draft, pendingPlants }, null, 2)], { type: 'application/json' }));
  const link = make('a'); link.href = url; link.download = `petra-catalogo-${new Date().toISOString().slice(0,10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
element('preview-classic').addEventListener('click', () => { preview3d = false; setFrame(); });
element('preview-3d').addEventListener('click', () => { preview3d = true; setFrame(); });
element('site-frame').addEventListener('load', sendPreview);
window.addEventListener('message', (event) => { if (event.origin === location.origin && event.source === element('site-frame').contentWindow && event.data?.type === 'petra-studio-ready') sendPreview(); });
window.addEventListener('beforeunload', (event) => { if (changed) { event.preventDefault(); event.returnValue = ''; } });
(async () => {
  try {
    base = await api('/studio/catalogo-base.json'); await refresh();
    for (const group of [...new Set(plants().map(plant => plant.grupo || 'Originales y personalizados'))]) {
      const option = make('option', group); option.value = group; element('category-plant').append(option);
    }
    renderPantry(); renderShapes();
    const session = await api('/api/taller-sesion'); element('login-form').hidden = session.authenticated;
    const raw = localStorage.getItem('petra-studio-draft');
    if (raw && window.confirm('Hay un borrador sin publicar. ¿Recuperarlo?')) { const saved = JSON.parse(raw); pendingPlants = saved.pendingPlants || []; selectTea(saved.draft); preserve(); }
    if (!draft) {
      if (new URLSearchParams(location.search).get('demo') === 'citrico') createDemo();
      else selectTea(teas()[0] || blank());
    }
  } catch (error) { element('connection').textContent = 'Sin conexión'; notice(error.message, true); }
})();
