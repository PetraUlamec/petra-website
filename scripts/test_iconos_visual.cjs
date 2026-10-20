const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.PETRA_EVIDENCE;
assert.ok(output);
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/studio/catalogo-base.json'), 'utf8'));
const files = {
  '/art.js': 'src/data/botanicalArt.ts',
  '/model.js': 'src/components/three/BotanicalSpecimen.tsx',
  '/three.js': 'node_modules/three/build/three.module.js',
  '/three.core.js': 'node_modules/three/build/three.core.js',
  '/SVGLoader.js': 'node_modules/three/examples/jsm/loaders/SVGLoader.js',
  '/BufferGeometryUtils.js': 'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js',
};
const server = http.createServer((request, response) => {
  if (request.url === '/catalog.json') {
    response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(catalog)); return;
  }
  if (files[request.url]) {
    const filename = files[request.url];
    let source = fs.readFileSync(path.join(root, filename), 'utf8');
    if (/\.tsx?$/.test(filename)) source = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    response.setHeader('Content-Type', 'text/javascript'); response.end(source); return;
  }
  if (request.url === '/react.js') { response.setHeader('Content-Type', 'text/javascript'); response.end('export const useMemo = callback => callback(); export const useEffect=()=>{}; export const jsx=()=>null; export const jsxs=jsx;'); return; }
  response.setHeader('Content-Type', 'text/html');
  response.end(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#f6f0df;color:#382e25;font:14px system-ui}#cards{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:16px}article{height:210px;text-align:center;border:1px solid #d6cbb5;border-radius:10px;background:#fffaf0;display:flex;flex-direction:column;align-items:center;justify-content:center}article svg{width:142px;height:142px}small{color:#7b6952}canvas{display:block}.labels{position:absolute;inset:0;pointer-events:none;display:grid;grid-template-columns:repeat(6,1fr)}.labels span{height:210px;display:flex;align-items:end;justify-content:center;padding:0 6px 15px;text-align:center;box-sizing:border-box}</style><div id="cards"></div><script type="importmap">{"imports":{"three":"/three.js","react":"/react.js","react/jsx-runtime":"/react.js","@/data/botanicalArt":"/art.js","three/examples/jsm/loaders/SVGLoader.js":"/SVGLoader.js","three/examples/jsm/utils/BufferGeometryUtils.js":"/BufferGeometryUtils.js"}}</script><script type="module">
import * as THREE from 'three';
import {buildBotanicalSpecimen} from '/model.js';
const catalog=await (await fetch('/catalog.json')).json();
window.showIcons = (start) => {
 document.querySelector('#cards').innerHTML=catalog.plants.slice(start,start+24).map(plant=>'<article>'+catalog.ingredientDrawings[plant.id].replaceAll('#aabbcc',plant.color).replaceAll('#ddeeff',plant.color2)+'<strong>'+plant.nombre+'</strong><small>'+catalog.visualProfiles[plant.id].kind+'</small></article>').join('');
};
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1200,840);renderer.setPixelRatio(1);
renderer.setClearColor('#f6f0df');renderer.outputColorSpace=THREE.SRGBColorSpace;
const camera=new THREE.OrthographicCamera(-2.25,2.25,1.575,-1.575,0.01,100);
camera.position.set(0,0,10);
const allParts=catalog.plants.map(plant=>buildBotanicalSpecimen(plant));
window.geometryResults=allParts.map((parts,index)=>{
 const bounds=new THREE.Box3();let vertices=0;let finite=true;
 for(const part of parts){bounds.union(part.geometry.boundingBox);vertices+=part.geometry.attributes.position.count;finite&&=Array.from(part.geometry.attributes.position.array).every(Number.isFinite);}
 const size=bounds.getSize(new THREE.Vector3());return {id:catalog.plants[index].id,parts:parts.length,vertices,finite,minY:bounds.min.y,size:[size.x,size.y,size.z]};
});
window.showModels=(start)=>{
 document.querySelector('#cards').style.display='none';
 document.querySelector('canvas')?.remove();document.querySelector('.labels')?.remove();
 document.body.append(renderer.domElement);
 const labels=document.createElement('div');labels.className='labels';document.body.append(labels);
 const scene=new THREE.Scene();scene.add(new THREE.AmbientLight(0xffffff,2));
 const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(-3,5,7);scene.add(light);
 for(let offset=0;offset<24&&start+offset<catalog.plants.length;offset++){
  const index=start+offset;const group=new THREE.Group();
  group.position.set(-1.875+(offset%6)*0.75,0.90-Math.floor(offset/6)*0.7875,0);
  group.scale.setScalar(1.65);
  for(const part of allParts[index])group.add(new THREE.Mesh(part.geometry,new THREE.MeshStandardMaterial({color:part.color,roughness:.85,side:THREE.DoubleSide})));
  scene.add(group);const label=document.createElement('span');label.textContent=catalog.plants[index].nombre;labels.append(label);
 }
 renderer.render(scene,camera);
};
window.ready=true;
</script>`);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 920 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.ready, { timeout: 60000 });
    const geometry = await page.evaluate(() => window.geometryResults);
    assert.equal(geometry.length, 167);
    for (const model of geometry) {
      assert.ok(model.parts > 0 && model.vertices > 0 && model.finite, model.id);
      assert.ok(model.parts <= 16, `${model.id} draw calls`);
      assert.ok(Math.abs(model.minY) < 0.0001, `${model.id} grounding`);
      assert.ok(model.size[0] <= .291 && model.size[1] <= .391 && model.size[2] <= .261, `${model.id} bounds`);
    }
    for (let start = 0; start < 167; start += 24) {
      await page.evaluate(offset => window.showIcons(offset), start);
      assert.equal(await page.locator('#cards svg').count(), Math.min(24, 167 - start));
      await page.locator('#cards').screenshot({ path: path.join(output, `iconos-${start}.png`) });
    }
    for (let start = 0; start < 167; start += 24) {
      await page.evaluate(offset => window.showModels(offset), start);
      await page.screenshot({ path: path.join(output, `modelos-${start}.png`) });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'geometria.json'), JSON.stringify({ status: 'PASS', models: geometry, errors }, null, 2));
    console.log('PASS 167 SVG illustrations, 167 extruded models, finite geometry, bounded dimensions, grounded bases, 14 contact sheets, no JS errors');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
