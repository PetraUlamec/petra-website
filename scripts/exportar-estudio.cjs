const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(filename) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, filename), 'utf8'), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const resolve = (name) => {
    if (name.startsWith('react')) return require(name);
    if (name.endsWith('vivoStore')) return { getVivo: () => ({ teas: [], plants: [] }) };
    const target = name.startsWith('@/') ? `src/${name.slice(2)}.ts` : path.join(path.dirname(filename), `${name}.ts`);
    return load(target);
  };
  vm.runInNewContext(source, { exports: module.exports, require: resolve }, { timeout: 1000 });
  return module.exports;
}
const Illustration = load('src/components/clasica/PlantaSVG.tsx').default;
const formas = load('src/data/formasPlanta.ts').FORMAS_PLANTA;
const shapes = Object.keys(formas);
const drawings = Object.fromEntries(shapes.map(forma => [forma, renderToStaticMarkup(React.createElement(Illustration, { forma, color: '#aabbcc', color2: '#ddeeff' }))]));
fs.writeFileSync(path.join(root, 'public/studio/catalogo-base.json'), JSON.stringify({ teas: load('src/data/teas.ts').TEAS, plants: load('src/data/plants.ts').PLANTS, drawings, formas }, null, 2) + '\n');
