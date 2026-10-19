const fs = require('node:fs');
const path = require('node:path');

function prepararDatos(root, iniciar = false) {
  const origin = path.join(root, iniciar ? '.petra-seed' : 'data');
  const target = path.join(root, iniciar ? 'data' : '.petra-seed');
  fs.mkdirSync(target, { recursive: true });
  for (const filename of ['catalogo-vivo.json', 'overrides.json', 'editor-log.json']) {
    const destination = path.join(target, filename);
    if (iniciar && fs.existsSync(destination)) continue;
    JSON.parse(fs.readFileSync(path.join(origin, filename), 'utf8'));
    try {
      fs.copyFileSync(path.join(origin, filename), destination, iniciar ? fs.constants.COPYFILE_EXCL : 0);
    } catch (error) {
      if (!iniciar || error.code !== 'EEXIST') throw error;
    }
  }
}

module.exports = { prepararDatos };
if (require.main === module) prepararDatos(process.cwd(), process.argv.includes('--iniciar'));
