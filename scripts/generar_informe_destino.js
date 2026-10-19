const fs = require('fs');
const path = require('path');

const dir = 'D:\\Abel paginas\\agenda cultural\\software\\planificador palabras claves';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv') && !f.startsWith('MASTER_'));

const keywordMap = new Map();

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

  if (headerIndex !== -1) {
    for (let j = headerIndex + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;
      
      let cols = [];
      if (delimiter === '\t') {
        cols = line.split('\t');
      } else {
        cols = line.split(',');
      }

      if (cols.length >= 3) {
        const kw = cols[0].trim().replace(/^"|"$/g, '');
        if (!kw || kw.startsWith('Keyword Stats')) continue;
        const avgStr = cols[2] ? cols[2].trim().replace(/^"|"$/g, '') : '';
        const avg = avgStr ? parseInt(avgStr.replace(/[^0-9]/g, ''), 10) || 0 : 0;
        const c3m = cols[3] ? cols[3].trim().replace(/^"|"$/g, '') : '--';
        const cYoY = cols[4] ? cols[4].trim().replace(/^"|"$/g, '') : '--';
        const competition = cols[5] ? cols[5].trim().replace(/^"|"$/g, '') : 'Desconocido';
        const compIndex = cols[6] ? cols[6].trim().replace(/^"|"$/g, '') : '';

        if (!keywordMap.has(kw) || (keywordMap.get(kw).avg < avg)) {
          keywordMap.set(kw, {
            keyword: kw,
            avg,
            avgStr,
            c3m,
            cYoY,
            competition,
            compIndex
          });
        }
      }
    }
  }
}

const list = Array.from(keywordMap.values()).sort((a, b) => b.avg - a.avg);

// Generar Markdown
let md = `# INFORME MAESTRO DE PALABRAS CLAVE: AGENDA CULTURAL LOJA
> Datos consolidados y desduplicados directamente desde Google Keyword Planner (Google Ads Ecuador / Loja).
> Fecha de extracción: 17 de Octubre de 2026.
> Total de términos únicos auditados: **${list.length}**.

---

## 1. Resumen Ejecutivo de Oportunidades SEO

1. **El verdadero volumen de búsqueda:** La gente en Google busca **"Qué hacer en Loja" (500/mes)** y **"Eventos en Loja" (500/mes)** 10 veces más que *"Agenda cultural loja"* (50/mes). Además, *"eventos en loja"* ha crecido un **+900% interanual**.
2. **El gigante gastronómico:** **"Restaurantes loja" tiene 5.000 búsquedas mensuales** con competencia muy baja (4/100). Crear una categoría o filtro de aliados "Restaurantes & Dónde comer" dentro de la agenda captará ese tráfico masivo.
3. **El fenómeno Artes Vivas y Ferias:** **"Festival de artes vivas loja"** y **"Feria de loja 2026"** registran 500 búsquedas mensuales con crecimientos explosivos de +900% a infinito en temporada.
4. **Turismo Cantonal:** **"Qué hacer en vilcabamba"** y **"Lugares para visitar en loja"** tienen 500 búsquedas al mes cada una, validando el interés de visitantes fuera del centro urbano.

---

## 2. Tabla Consolidada de Palabras Clave (Ordenadas por Volumen Real)

| # | Palabra Clave | Búsquedas Mensuales | Competencia Google Ads | Índice Comp. (0-100) | Cambio 3 Meses | Cambio Interanual (YoY) | Nivel de Oportunidad |
|---|---|---|---|---|---|---|---|
`;

list.forEach((item, index) => {
  let oportunidad = "Long-tail SEO";
  if (item.avg >= 5000) oportunidad = "🔥 Tráfico Masivo (Aliados)";
  else if (item.avg >= 500) oportunidad = "⭐ Prioridad Máxima (Home / Landing)";
  else if (item.avg >= 50) oportunidad = "🎯 Alta Conversión (Categorías / Venues)";

  md += `| ${index + 1} | **${item.keyword}** | ${item.avg > 0 ? item.avg.toLocaleString() : '< 10'} | ${item.competition} | ${item.compIndex || '-'} | ${item.c3m} | ${item.cYoY} | ${oportunidad} |\n`;
});

md += `
---

## 3. Plan de Arquitectura Web Recomendado (Cómo Aplicar Estos Datos)

### A. Títulos y Meta Tags de la Home (\`app/page.tsx\`)
- **Título SEO recomendado:** \`Qué hacer en Loja — Eventos, Agenda Cultural y Turismo Hoy\`
- **H1 Principal:** \`Qué hacer en Loja: Eventos y Cartelera Cultural\`
- **Meta Descripción:** \`Descubre qué hacer en Loja hoy y este fin de semana. Cartelera oficial con eventos culturales, conciertos, teatro, festivales y restaurantes recomendados.\`

### B. Landing Pages Clave a Potenciar
1. **/festival-artes-vivas-loja-2026:**
   - Palabras clave: *festival de artes vivas loja*, *fiavl 2026*, *programacion festival de artes vivas loja*, *entradas festival de artes vivas loja*.
2. **/eventos/categoria/musica:**
   - Palabras clave: *conciertos en loja*, *conciertos en loja 2026*, *musica en vivo loja*.
3. **/eventos/categoria/teatro:**
   - Palabras clave: *teatro en loja*, *obras de teatro loja*, *cartelera de teatro loja*.
4. **/lugar/[slug]:**
   - Palabras clave: *teatro benjamin carrion eventos*, *teatro bolivar loja agenda*, *museo de la musica loja*.
5. **/aliados (o sección Gastronomía):**
   - Palabras clave: *restaurantes loja*, *donde comer en loja*, *cafeterias en loja*.

---

## 4. Versión CSV / Exportable
Este mismo dataset se encuentra desduplicado y limpio en el archivo complementario:
\`D:\\Abel paginas\\agenda cultural\\software\\planificador palabras claves\\MASTER_KEYWORDS_CONSOLIDADAS.csv\`
`;

fs.writeFileSync(path.join(dir, 'INFORME_PALABRAS_CLAVES_CONSOLIDADO.md'), md, 'utf8');

// Generar CSV limpio
let csv = 'Keyword,Avg. monthly searches,Competition,Competition (indexed value),Cambio 3 meses,Cambio interanual\n';
list.forEach(k => {
  csv += `"${k.keyword}",${k.avg},"${k.competition}","${k.compIndex}","${k.c3m}","${k.cYoY}"\n`;
});
fs.writeFileSync(path.join(dir, 'MASTER_KEYWORDS_CONSOLIDADAS.csv'), csv, 'utf8');

console.log('¡Archivos generados exitosamente en la carpeta de destino!');
