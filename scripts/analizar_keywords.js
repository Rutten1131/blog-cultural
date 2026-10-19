const fs = require('fs');
const path = require('path');

const dir = 'D:\\Abel paginas\\agenda cultural\\software\\planificador palabras claves';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

const keywordMap = new Map();

for (const file of files) {
  const filePath = path.join(dir, file);
  // CSVs from Google Keyword Planner in Windows are UTF-16LE
  const buf = fs.readFileSync(filePath);
  let content = '';
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    content = buf.toString('utf16le');
  } else {
    content = buf.toString('utf8');
  }

  const lines = content.split(/\r?\n/);
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Keyword\t') || lines[i].includes('Keyword\t')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex !== -1) {
    for (let j = headerIndex + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;
      const cols = line.split('\t');
      if (cols.length >= 3) {
        const kw = cols[0].trim();
        if (!kw) continue;
        const avgStr = cols[2].trim();
        const avg = avgStr ? parseInt(avgStr.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        const c3m = cols[3] ? cols[3].trim() : '';
        const cYoY = cols[4] ? cols[4].trim() : '';
        const competition = cols[5] ? cols[5].trim() : '';
        const compIndex = cols[6] ? cols[6].trim() : '';
        const bidLow = cols[7] ? cols[7].trim() : '';
        const bidHigh = cols[8] ? cols[8].trim() : '';

        // Monthly trends Oct 2025 - Sep 2026 (cols 14 to 25)
        const monthly = [];
        for (let m = 14; m <= 25; m++) {
          if (cols[m] !== undefined) {
            monthly.push(cols[m].trim());
          }
        }

        if (!keywordMap.has(kw) || (keywordMap.get(kw).avg === 0 && avg > 0)) {
          keywordMap.set(kw, {
            keyword: kw,
            avg,
            avgStr,
            c3m,
            cYoY,
            competition,
            compIndex,
            bidLow,
            bidHigh,
            monthly,
            source: file
          });
        }
      }
    }
  }
}

const list = Array.from(keywordMap.values()).sort((a, b) => b.avg - a.avg);

console.log(`Total keywords unicas procesadas: ${list.length}`);
console.log(JSON.stringify(list, null, 2));
