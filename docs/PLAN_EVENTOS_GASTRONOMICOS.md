# 📋 PLAN MAESTRO TÉCNICO: HUB DE EVENTOS GASTRONÓMICOS EN AGENDACULTURAL-LOJA.COM
**Para:** Cristhopher Reyes & César Reyes Jaramillo  
**De:** Abel (Arquitectura Técnica & Full-Stack Next.js 16)  
**Alineación Estratégica:** Diana (Marketing/GSC) + Hera (Marca/Legal) + Prometeo (BD/Evidencia) + Regla Ternaria GuIAloja

---

## 🎯 1. DEFINICIÓN DEL ACTIVO & LA REGLA DE DESEMPATE

### El Principio de No-Canibalización con `quecomerenloja.com`:
> **Regla Ternaria de Oro:**
> - **`agendaculturalloja.com` (Cultura):** Publica **EVENTOS CON FECHA Y HORA DE CADUCIDAD** (inicio y fin). Ferias, festivales, rutas del café con fecha, catas, concursos y festivales culinarios.
> - **`quecomerenloja.com` (Gastro):** Es el **DIRECTORIO PERMANENTE** de locales, restaurantes, cafeterías con menú y horarios habituales.
> - **Cruce Flywheel:** Si una cata o festival ocurre dentro de una cafetería o restaurante, **Cultura publica el evento** con 1 solo enlace contextual hacia la ficha del local en Gastro.

---

## 🗺️ 2. ARQUITECTURA DE RUTAS Y SILO DE CONTENIDO

Se crea el silo semántico bajo el prefijo exacto de eventos:

```
agendaculturalloja.com
  └── /eventos-gastronomicos/                  ← HUB PILAR GASTRONÓMICO
        ├── /ferias/                           ← Sub-hub: Ferias gastronómicas y Feria de Loja 2026
        ├── /festivales/                       ← Sub-hub: Festivales culinarios y concursos
        ├── /rutas/                            ← Sub-hub: Rutas del café, cacao y queso lojano
        └── /[slug-evento]/                    ← Ficha individual con Schema Event
```

*(Quedan prohibidos los slugs `/gastronomia`, `/comer` o `/restaurantes` dentro de Cultura para no disputarle a Gastro sus términos transaccionales).*

---

## 📊 3. MAPA DE PALABRAS CLAVE (DATA REAL)

| Nivel de Arquitectura | Ruta | Primary Keyword | H1 Estático Aprobado | Schema JSON-LD |
|---|---|---|---|---|
| **Hub Padre** | `/eventos-gastronomicos` | `eventos gastronomicos loja` | *Eventos Gastronómicos en Loja: Ferias, Festivales y Rutas* | `ItemList` + `CollectionPage` |
| **Sub-Hub Ferias** | `/eventos-gastronomicos/ferias` | `feria de loja 2026` *(500 búsq, +900%)* | *Ferias Gastronómicas en Loja y Feria de Loja 2026* | `ItemList` |
| **Sub-Hub Festivales**| `/eventos-gastronomicos/festivales`| `festival gastronomico loja` | *Festivales Gastronómicos y Degustaciones en Loja* | `ItemList` |
| **Sub-Hub Rutas** | `/eventos-gastronomicos/rutas` | `ruta del cafe loja` | *Rutas del Café y Tradición Gastronómica Lojana* | `ItemList` |
| **Ficha de Evento** | `/eventos-gastronomicos/[slug]` | `[nombre del evento] loja` | *[Nombre del Evento]* | `Event` (fechado) |

---

## ⚙️ 4. IMPACTO TÉCNICO EN EL SOFTWARE (CÓDIGO REAL)

### A. Modelo de Datos en Base de Datos (`prisma/schema.prisma`):
Actualmente `prisma/schema.prisma` tiene el modelo `Categoria` con catálogo cerrado (`arte-y-exposiciones`, `teatro`, `musica`, `ferias`, `artes-vivas`).
1. **Opción Recomendada:** Agregar la 6ª categoría oficial:
   - `slug`: `gastronomia` o `eventos-gastronomicos`.
   - `nombre`: `Eventos Gastronómicos`.
2. **Purga Determinista de Eventos:**
   - En las consultas de Prisma, los eventos de esta sección deben cumplir:
     ```ts
     where: {
       estado: "APROBADO",
       categoria: { slug: "eventos-gastronomicos" },
       OR: [
         { fechaFin: { gte: now } },
         { AND: [{ fechaFin: null }, { fecha: { gte: now } }] }
       ]
     }
     ```
   - Si `fechaFin < now - 2 horas` ➔ Pasa automáticamente al histórico de eventos pasados (`EventosPasadosList.tsx`).

### B. Navbar y Menú de Categorías:
1. En `components/Navbar.tsx`:
   - Se agrega al menú desplegable de Categorías:
     ```ts
     { href: "/eventos-gastronomicos", key: "nav.gastro_eventos", fallback: "Eventos Gastronómicos", emoji: "🍲" }
     ```
2. En `components/HomeCategoriasClient.tsx`:
   - Se habilita la tab de eventos gastronómicos con su color distintivo y emoji `🍲`.
   - Se activa la regla de selección dinámica: si la tab gastronómica tiene más eventos en cartelera, se abrirá de primero en la Home.

### C. Clasificación con IA (Groq / Llama 3.3 y DeepSeek):
1. En `lib/clasificarEvento.ts`:
   - Se añade `eventos-gastronomicos` a las categorías permitidas en el System Prompt.
   - Si un gestor sube un evento con palabras clave como *"degustación, cata de café, festival de la cecina, feria gastronómica, hornado, cuyada, festival culinario"*, la IA lo clasificará automáticamente en esta categoría.

---

## 🛡️ 5. CONDICIÓN DE PUBLICACIÓN ANTI-HUMO (HERA & DIANA)

1. **Umbral Mínimo:** La sección no se publica en el menú principal ni en el Home hasta tener **mínimo 6 a 8 eventos gastronómicos reales con fecha, organizador y lugar verificado en Loja**.
2. **Cero Placeholders:** Nada de eventos ficticios. Si no hay feria activa en la semana, la página muestra la convocatoria cívica y el histórico documentado.
3. **Cero Canibalización con Gastro:** Prohibido listar restaurantes con horarios permanentes en esta página. Si el evento es en una cafetería aliada, se incluye:  
   *`"Organizado en: [Nombre de la Cafetería]"`* con enlace saliente hacia `quecomerenloja.com`.

---

## 🚀 6. SECUENCIA DE EJECUCIÓN (PASO A PASO)

1. **Paso 1 (Base de Datos):** Seed de la categoría `eventos-gastronomicos` en MariaDB/Prisma.
2. **Paso 2 (Motor de Rutas Next.js):** Crear `app/eventos-gastronomicos/page.tsx` con su Schema JSON-LD `ItemList` y sub-secciones para Ferias y Festivales.
3. **Paso 3 (IA de Clasificación):** Actualizar `lib/clasificarEvento.ts` para que el formulario público reconozca eventos culinarios.
4. **Paso 4 (UI & Componentes):** Añadir la categoría en `components/HomeCategoriasClient.tsx` y en `components/Navbar.tsx`.
5. **Paso 5 (SEO Registry):** Declarar las claves primarias en `lib/seo-registry.ts` y en `app/sitemap.ts`.
