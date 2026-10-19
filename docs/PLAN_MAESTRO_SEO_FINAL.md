# 🏆 PLAN MAESTRO DEFINITIVO DE IMPLEMENTACIÓN SEO & ARQUITECTURA
**Proyecto:** Agenda Cultural Loja (`agendaculturalloja.com`)  
**Fecha de Cierre del Acta:** 19 de Octubre de 2026  
**Estatus:** ✅ 100% Blindado y Aprobado por Mesa Directiva (Diana / Hera / César / Abel)

---

## 🏛️ 1. DECISIONES ESTRATÉGICAS FUNDACIONALES

1. **Unificación Pilar y Fin a la Canibalización:**
   - Se consolida `/eventos` como el núcleo central único.
   - **Redirect 301 Permanente:** `/eventos/esta-semana` ➔ `/eventos` (elimina la fragmentación de impresiones en GSC).
   - **Satélite Especializada:** `/eventos/este-fin-de-semana` se mantiene viva, indexable y acotada estrictamente a planes de viernes a domingo (`getRangoFinDeSemanaLojaUTC`).
   - **Categorías Indexables:** `/eventos/categoria/*` mantienen indexación limpia atacando sus disciplinas exactas (*Conciertos*, *Teatro*, *Museos*, *Ferias*).
2. **H1 Humano y Elegante (Veto al H1 Frankenstein):**
   - H1 de la pilar: *`"Eventos en Loja: Cartelera Cultural Actualizada"`*.
   - Las variantes temporales (*hoy*, *esta semana*, *fin de semana*) se gestionan en `<title>`, texto de apoyo y chips de filtrado.
3. **Ética de Marca y Protección Legal (Veto de Hera):**
   - Eliminación total de la palabra *"Oficial"* en recintos y eventos sin convenio institucional directo.
   - Recintos culturales con **Títulos Dinámicos Condicionales**: prometen cartelera solo si hay eventos cargados; si la sala está vacía, prometen horarios e historia para evitar rebote.
4. **Mega-Landing FIAVL 2026 sin Canibalización:**
   - Una sola URL de autoridad (`/festival-artes-vivas-loja-2026`) con anclas internas (`#fechas`, `#sedes`, `#entradas`, `#faq`).
   - FAQ blindado con 2 preguntas institucionales neutras apuntando a la fuente municipal. Cero invención.
   - **Gate de PROMETEO:** Fase 3 bloqueada de redacción hasta que exista certificación de fecha oficial y sedes por parte del Municipio.
5. **Vacuna Anti-Canibalización en Código (`PRIMARY_KEYWORDS`):**
   - Declaración de clave primaria única por ruta para evitar solapes futuros.
   - Resolución de colisión de *`festival de artes vivas loja`*: Canónica en **CULTURAL**, secundaria en TURISMO.
6. **Línea Base GSC Congelada al 19/10/2026:**
   - Seguimiento a +21 días (09/11/2026) y +45 días (03/12/2026).
   - **Criterio de Kill Sprint 0 (FIAVL):** Si el CTR sube ≥15% pero el rebote empeora >10 puntos en 7 días ➔ Reversión inmediata de metadatos.
7. **Skill Editorial Oficial:**
   - Creación de `.agents/skills/redactor-cultural/SKILL.md` con las 12 variables (incluyendo `brand_voice_anchor` y los 3 niveles de lojanidad sin adjetivos vacíos).

---

## 🗺️ 2. MATRIZ DE RUTAS, KEYWORDS Y METADATOS

| Ruta (URL) | Rol Arquitectónico | Primary Keyword | H1 Estático Aprobado | `<title>` Dinámico / Aprobado | Directiva Robots |
|---|---|---|---|---|---|
| `/eventos` | **Página Pilar** | `eventos en loja` | *Eventos en Loja: Cartelera Cultural Actualizada* | `Eventos en Loja Hoy y Cartelera Cultural Actualizada` | `index, follow` |
| `/eventos/este-fin-de-semana` | **Satélite Temporal** | `qué hacer este fin de semana en loja` | *Qué hacer este fin de semana en Loja: Eventos y Cartelera* | `Qué hacer este fin de semana en Loja — Eventos y Planes` | `index, follow` |
| `/eventos/esta-semana` | **Redirect 301** | *(Ninguna)* | *(Redirige 301 a `/eventos`)* | *(Redirige 301 a `/eventos`)* | `301 permanente` |
| `/eventos/categoria/musica` | **Satélite Temática** | `conciertos en loja` | *Conciertos en Loja y Música en Vivo 2026* | `Conciertos en Loja 2026 — Música en Vivo y Recitales` | `index, follow` |
| `/eventos/categoria/teatro` | **Satélite Temática** | `teatro en loja` | *Teatro en Loja: Obras, Funciones y Cartelera Escénica* | `Teatro en Loja — Cartelera de Obras y Funciones` | `index, follow` |
| `/eventos/categoria/arte-y-exposiciones` | **Satélite Temática** | `museos en loja` | *Museos en Loja, Galerías y Exposiciones de Arte* | `Museos en Loja y Galerías de Arte — Exposiciones` | `index, follow` |
| `/eventos/categoria/ferias` | **Satélite Temática** | `ferias en loja` | *Ferias y Artesanías en Loja: Feria de Loja 2026* | `Ferias en Loja 2026 — Feria de Loja Fechas y Festivales` | `index, follow` |
| `/lugar/teatro-bolivar` | **Recinto Cultural** | `teatro bolivar loja` | *Teatro Simón Bolívar* | **Condicional:**<br>• Con eventos: `Teatro Bolívar Loja — Cartelera Actualizada y Próximos Eventos`<br>• Sin eventos: `Teatro Bolívar Loja — Horarios, Ubicación e Historia` | `index, follow` |
| `/lugar/teatro-segundo-cueva-celi` | **Recinto Cultural** | `teatro segundo cueva celi` | *Teatro de Artes Segundo Cueva Celi* | **Condicional:**<br>• Con eventos: `Teatro Segundo Cueva Celi — Cartelera y Próximos Eventos`<br>• Sin eventos: `Teatro Segundo Cueva Celi — Ubicación e Historia en Loja` | `index, follow` |
| `/lugar/museo-musica-loja` | **Recinto Cultural** | `museo de la musica loja` | *Museo de la Música de Loja* | `Museo de la Música de Loja — Horarios, Colección y Visitas` | `index, follow` |
| `/festival-artes-vivas-loja-2026` | **Mega-Landing Autoridad**| `festival de artes vivas loja 2026` | *Festival de Artes Vivas Loja 2026 (FIAVL)* | `Festival de Artes Vivas Loja 2026 — Programación y Fechas FIAVL` | `index, follow` |

---

## ⚡ 3. CRONOGRAMA DE EJECUCIÓN TÉCNICA (POR FASES)

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│ FASE 1: BLINDAJE & 301 │ ───> │ FASE 2: CTR EN RECINTOS│ ───> │ FASE 3: FIAVL & SKILL  │
│ (Inmediato - 15 min)   │      │ (Inmediato - 20 min)   │      │ (Gate PROMETEO/Hera)   │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

### 🔹 FASE 1: Blindaje Anti-Canibalización & Sitemap (Ejecución Inmediata)
1. **Redirect 301 en `next.config.ts`:**
   - Registrar redirect permanente de `/eventos/esta-semana` hacia `/eventos`.
2. **Depuración de `app/sitemap.ts`:**
   - Remover `/eventos/esta-semana` del XML del sitemap para canalizar el crawl budget.
3. **Página Pilar `/eventos` (`app/eventos/page.tsx`):**
   - Actualizar H1 definitivo: *`"Eventos en Loja: Cartelera Cultural Actualizada"`*.
   - `<title>` definitivo: *`"Eventos en Loja Hoy y Cartelera Cultural Actualizada"`*.
   - Subtítulo de apoyo humano y dinámico.
4. **Vacuna Anti-Canibalización (`lib/seo-registry.ts`):**
   - Crear el registro estricto de `PRIMARY_KEYWORDS` por ruta con validación estática.

---

### 🔹 FASE 2: Rescate de CTR en Recintos Culturales (Ejecución Inmediata)
*Resolver las 154 impresiones con 1 clic en Teatro Bolívar y Cueva Celi con títulos condicionales.*
1. **Lógica Condicional en `app/lugar/[venue]/page.tsx`:**
   - Consultar en `generateMetadata` si el venue tiene `eventosVigentes.length > 0`:
     - **Si hay eventos:** Promociona cartelera y funciones actualizadas.
     - **Si NO hay eventos:** Cambia automáticamente a *Horarios, Ubicación e Historia*, evitando la tasa de rebote por falsa expectativa.
2. **Schema `PerformingArtsTheater` y `CivicStructure`:**
   - Enriquecer los metadatos de recintos con coordenadas GPS, dirección de Centro Histórico y teléfono de contacto para el Local Pack de Google.

---

### 🔹 FASE 3: Mega-Landing FIAVL 2026 & Skill Editorial (Condicionada)
1. **Espera de Gate PROMETEO:**
   - No se escribe agenda ficticia. Se certifica fecha oficial de noviembre 2026 y sedes con fuente municipal.
2. **Estructura de Anclas en `/festival-artes-vivas-loja-2026`:**
   - Bloques con id: `#fechas`, `#sedes`, `#entradas`, `#faq`.
3. **FAQ Blindado sin Reclamación "Oficial":**
   - Pregunta 1: *¿Cuándo se realiza el Festival Internacional de Artes Vivas Loja 2026?*
   - Pregunta 2: *¿Dónde se publicará la programación de obras del FIAVL 2026?* (Con enlace a canales municipales).
   - Schema JSON-LD `FAQPage` + `Event`.
4. **Instalación de la Skill Editorial en `.agents/skills/redactor-cultural/SKILL.md`:**
   - Documento de contrato editorial con las 12 variables de entrada y estilo exigidas por Diana y Hera.

---

## 📈 4. TABLERO DE CONTROL GSC (BASELINE CONGELADO 19/10/2026)

| Activo / URL Auditada | Impresiones GSC | Clics GSC | CTR Base | Posición Media | Objetivo +21d (09/11) | Objetivo +45d (03/12) | Criterio de Alerta / Kill |
|---|---|---|---|---|---|---|---|
| `/festival-artes-vivas-loja-2026` | 220 | 8 | 3.6% | 6.6 | Posición < 4.5 | **Top 3 (< 3.0)** | Si rebote sube >10 pts en 7d ➔ Revert |
| `/` (Home) | 148 | - | - | 5.5 | Posición < 4.0 | Top 3 | Monitor continuo |
| `/lugar/teatro-bolivar` | 90 | 0 | 0.0% | 9.6 | CTR > 4.0% | CTR > 8.0% | Title condicional activo |
| `/lugar/teatro-segundo-cueva-celi` | 64 | 1 | 1.5% | 9.8 | CTR > 3.5% | CTR > 6.0% | Title condicional activo |
| `/eventos` (Pilar unificada) | - | - | - | 22.5 | Posición < 14.0 | **Top 8 (< 8.0)** | Canibalización eliminada |
| `/eventos/esta-semana` | 48 | 1 | 2.0% | - | ➔ Consolidada | ➔ Consolidada | Redirect 301 verificado |
| `/lugar/museo-musica-loja` | 4 | 0 | 0.0% | - | Impresiones > 50 | Clics activos | Título de atracción activo |
