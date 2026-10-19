const fs = require('fs');
const path = require('path');

const dir = 'D:\\Abel paginas\\agenda cultural\\software\\planificador palabras claves';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

console.log(`Encontrados ${files.length} archivos CSV:\n`);

files.forEach(f => {
  const buf = fs.readFileSync(path.join(dir, f));
  let str = '';
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    str = buf.toString('utf16le');
  } else {
    str = buf.toString('utf8');
  }
  const lines = str.split(/\r?\n/).filter(l => l.trim().length > 0);
  const title = lines[0] || '';
  const dateRange = lines[1] || '';
  
  // keywords en este archivo
  let kwCount = 0;
  let sampleKws = [];
  let headerFound = false;
  for (let l of lines) {
    if (l.startsWith('Keyword\t') || l.includes('Keyword\t')) {
      headerFound = true;
      continue;
    }
    if (headerFound) {
      const parts = l.split('\t');
      if (parts[0]) {
        kwCount++;
        if (sampleKws.length < 5) sampleKws.push(`${parts[0]} (${parts[2] || '0'})`);
      }
    }
  }

  console.log(`Archivo: "${f}"`);
  console.log(`  Título interno: ${title}`);
  console.log(`  Rango fechas: ${dateRange}`);
  console.log(`  Total keywords: ${kwCount}`);
  console.log(`  Muestra: ${sampleKws.join(', ')}`);
  console.log('----------------------------------------------------');
});
