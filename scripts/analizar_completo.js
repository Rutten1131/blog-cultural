const fs = require('fs');
const path = require('path');

const dir = 'D:\\Abel paginas\\agenda cultural\\software\\planificador palabras claves';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

const keywordMap = new Map();
const fileDetails = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  const buf = fs.readFileSync(filePath);
  let content = '';
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    content = buf.toString('utf16le');
  } else {
    content = buf.toString('utf8');
  }

  const lines = content.split(/\r?\n/);
  let headerIndex = -1;
  let delimiter = '\t';

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Keyword\t')) {
      headerIndex = i;
      delimiter = '\t';
      break;
    } else if (lines[i].includes('Keyword,')) {
      headerIndex = i;
      delimiter = ',';
      break;
    }
  }

  let fileKws = [];

  if (headerIndex !== -1) {
    for (let j = headerIndex + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;
      
      let cols = [];
      if (delimiter === '\t') {
        cols = line.split('\t');
      } else {
        // Simple CSV splitter or regex
        cols = line.split(',');
      }

      if (cols.length >= 3) {
        const kw = cols[0].trim().replace(/^"|"$/g, '');
        if (!kw || kw.startsWith('Keyword Stats')) continue;
        const avgStr = cols[2] ? cols[2].trim().replace(/^"|"$/g, '') : '';
        const avg = avgStr ? parseInt(avgStr.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        const c3m = cols[3] ? cols[3].trim().replace(/^"|"$/g, '') : '';
        const cYoY = cols[4] ? cols[4].trim().replace(/^"|"$/g, '') : '';
        const competition = cols[5] ? cols[5].trim().replace(/^"|"$/g, '') : '';
        const compIndex = cols[6] ? cols[6].trim().replace(/^"|"$/g, '') : '';

        fileKws.push({ kw, avg });

        if (!keywordMap.has(kw) || (keywordMap.get(kw).avg < avg)) {
          keywordMap.set(kw, {
            keyword: kw,
            avg,
            avgStr,
            c3m,
            cYoY,
            competition,
            compIndex,
            sources: [file]
          });
        } else {
          const existing = keywordMap.get(kw);
          if (!existing.sources.includes(file)) {
            existing.sources.push(file);
          }
        }
      }
    }
  }

  fileDetails.push({
    file,
    delimiter: delimiter === '\t' ? 'TAB (TSV)' : 'COMMA (CSV)',
    count: fileKws.length,
    keywords: fileKws.map(k => `${k.kw} [${k.avg}]`).join(' | ')
  });
}

const list = Array.from(keywordMap.values()).sort((a, b) => b.avg - a.avg);

console.log('=== RESUMEN POR ARCHIVO ===');
fileDetails.forEach(f => {
  console.log(`Archivo: ${f.file}`);
  console.log(`Formato: ${f.delimiter} | Total extraídas: ${f.count}`);
  console.log(`Keywords: ${f.keywords}`);
  console.log('------------------------------------------------');
});

console.log(`\n=== TODAS LAS KEYWORDS ÚNICAS DEDUPLICADAS (${list.length} en total) ===`);
list.forEach((k, idx) => {
  console.log(`${idx + 1}. "${k.keyword}" => ${k.avg} búsquedas/mes | Comp: ${k.competition} (${k.compIndex}) | 3M: ${k.c3m} | YoY: ${k.cYoY} | Fuentes: [${k.sources.join(', ')}]`);
});
