const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/keywords_procesadas.json', 'utf8'));

console.log('Total registros:', data.length);
console.log('\n=== TOP PALABRAS CLAVE CON BÚSQUEDAS ===');
data.filter(k => k.avg > 0).forEach((k, idx) => {
  console.log(`${idx + 1}. [${k.avg} búsquedas/mes] "${k.keyword}" | Competencia: ${k.competition} (Índice: ${k.compIndex}) | YoY: ${k.cYoY} | 3M: ${k.c3m}`);
});

console.log('\n=== PALABRAS CLAVE CON VOLUMEN 0 O NO REGISTRADO (LONG-TAIL) ===');
data.filter(k => k.avg === 0).forEach((k, idx) => {
  console.log(`${idx + 1}. [0 o <10/mes] "${k.keyword}"`);
});
