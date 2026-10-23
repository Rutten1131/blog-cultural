# 🏛️ PLAN MAESTRO: DIRECTORIO DE ESPACIOS Y ORGANIZACIONES CULTURALES DE LOJA
**Estrategia SEO de Entidades, Conocimiento Local e Infraestructura Web**
**Fecha:** 23 de Octubre de 2026  
**Objetivo:** Dominar el 100% de las búsquedas locales de espacios culturales, teatros, museos, academias de danza y escuelas de música en Loja, Ecuador.

---

## 1. ⚔️ AUDITORÍA ADVERSARIAL: VETO A LA ARQUITECTURA PLANA

### 🔴 El Peligro de Tratar los 20 Registros por Igual
Un error novato de desarrollo sería meter los 20 elementos en la misma ruta `/lugar/[slug]`. 
El Árbitro Adversarial veta esa idea por 3 razones críticas de Google:

1. **Incompatibilidad de Schema.org:**  
   Un teatro es un `@type: "PerformingArtsTheater"` o `"CivicStructure"`.  
   Una academia de danza (como *ReysoDance* o *Lojadanza*) es una `@type: "EducationalOrganization"` o `"DanceGroup"`.  
   Una productora escénica (como *CANO Artes Escénicas*) es una empresa cultural, no un edificio físico abierto al público con horarios de taquilla.
2. **Intención de Búsqueda de Usuario:**
   - Si alguien busca *Teatro Bolívar*, quiere saber: **¿Qué obras hay este fin de semana?** (Intención: Cartelera).
   - Si alguien busca *ReysoDance*, quiere saber: **¿Cuánto cuestan las clases y horarios de ballet?** (Intención: Formación / Matrículas).
3. **Calidad de Página (Anti-Rebote):**
   Si una persona entra a una ficha buscando "horario de visita" de una productora que no tiene sede abierta al público, rebotará en 3 segundos, hundiendo el ranking en Google.

---

## 2. 🏛️ LA ARQUITECTURA DUAL APROBADA (SILO LIMPIO)

Dividimos el directorio en **2 colecciones interconectadas** pero semánticamente diferenciadas:

```
                                  agendaculturalloja.com
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         /lugar/[slug] (10 RECINTOS FÍSICOS)             /directorio/[slug] (10 ORGANIZACIONES/ACADEMIAS)
    (Teatros, Museos, Centros Culturales)           (Academias de Danza, Elencos, Productoras)
                    │                                               │
                    ├─ Con cartelera viva en BD                     ├─ Formación, contactos, redes
                    ├─ Google Maps & Coordenadas                    ├─ WhatsApp directo verificado
                    └─ Schema: PerformingArtsTheater / Museum       └─ Schema: EducationalOrganization / DanceGroup
```

---

## 3. 🗺️ MATRIZ COMPLETA DE LOS 20 REGISTROS VERIFICADOS

### SILO A: Recintos Físicos y Salas de Exposición (`/lugar/[slug]`)

| Slug | Nombre Oficial | Categoría | Dirección / Parroquia | Schema Google |
|---|---|---|---|---|
| `teatro-benjamin-carrion` | Teatro Nacional Benjamín Carrión | Teatro Público | Salvador Bustamante Celi (El Sagrario) | `PerformingArtsTheater` |
| `teatro-bolivar` | Teatro Simón Bolívar | Teatro Patrimonial | Rocafuerte y Olmedo (El Sagrario) | `PerformingArtsTheater` |
| `teatro-segundo-cueva-celi` | Teatro Segundo Cueva Celi | Sala CCE | Rocafuerte y Sucre (El Sagrario) | `PerformingArtsTheater` |
| `casa-de-la-cultura` | CCE Núcleo de Loja | Centro Cultural Provincial | Colón 1312 y Bernardo Valdivieso | `CivicStructure` |
| `casona-cultural` | Casona Cultural | Centro Patrimonial | Bolívar y Eguiguren (El Sagrario) | `CivicStructure` |
| `museo-musica-loja` | Museo de la Música Salvador Zaragocín | Museo Patrimonial | Bernardo Valdivieso y Rocafuerte | `Museum` |
| `museo-cultura-lojana` | Museo de la Cultura Lojana (Ministerio) | Museo Nacional | 10 de Agosto, Parque Central | `Museum` |
| `centro-cultural-alfredo-mora-reyes` | Centro Cultural Alfredo Mora Reyes | Espacio Municipal | Bolívar y Lourdes (El Sagrario) | `PerformingArtsTheater` |
| `nano-casa-museo` | Ñaño Casa Museo | Casa Museo y Taller | Miraflores Bajo (Inés Jiménez y Rumiñahui) | `Museum` |
| `sala-eduardo-kingman` | Galería Eduardo Kingman (CCE) | Sala de Exposiciones | Colón 1312 (Interior CCE) | `ArtGallery` |
| `escena-continua` | Escena Continua | Sala Teatro Independiente | Bolívar entre Riofrío y Azuay | `PerformingArtsTheater` |

---

### SILO B: Academias, Elencos y Productoras (`/directorio/[slug]`)

| Slug | Organización | Especialidad Artística | Representante / Dirección | WhatsApp / Contacto |
|---|---|---|---|---|
| `lojadanza-ballet-escuela` | Lojadanza Ballet Escuela | Ballet clásico, contemporáneo y jazz | Aura Ocampo Jaramillo (Edificio Senda / CCE) | 0992872619 / 0994601778 |
| `cano-artes-escenicas` | CANO Artes Escénicas | Productora teatral, musicales y formación | Santiago Carpio Rodríguez | Redes oficiales verificadas |
| `reysodance-academia` | ReysoDance | Danza moderna, ballet y ritmos latinos | 18 de Noviembre y Lourdes | +593 98 007 4261 / 2582306 |
| `cache-dance-studio` | Caché Dance Studio | Danzas urbanas, hip hop y vacacionales | Azuay entre Juan José Peña y Olmedo | +593 99 866 9744 |
| `maktub-estudio-arte` | Maktub Estudio de Arte | Danza árabe, ballet, heels y K-pop | Av. 24 de Mayo y Rocafuerte | 0993413108 |
| `loxa-dance-escuela` | Loxa Dance | Baile deportivo, comercial y competencia | Paul Landy Correa | Redes oficiales y YouTube |
| `ballet-ciudaddeloja` | Ballet Folclórico Internacional Ciudad de Loja | Danza tradicional y folclore andino | Eddy Chininín | Redes oficiales |
| `la-septima-produccion` | La Séptima Producción Cultural | Teatro histórico, proyectos IFAIC | George Gualán | Redes oficiales |
| `fundacion-mundos-opuestos`| Fundación Cultural Mundos Opuestos | Circo, teatro social y caravanas de lectura | Jorge Israel y Carlos Jiménez | Redes oficiales |
| `orquesta-sinfonica-loja` | Orquesta Sinfónica de Loja (OSL) | Música orquestal y temporadas sinfónicas | Karla Ortega / Víctor Hugo López | +593 99 259 3309 |
| `conservatorio-salvador-bustamante` | Conservatorio Salvador Bustamante Celi | Educación musical formal y coro | Wilman Palacios Jaramillo | Av. Salvador Bustamante Celi |

---

## 4. 🚀 PLAN DE CONSTRUCCIÓN POR FASES

### FASE 1: Ampliación de Recintos Físicos en `/lugar/[venue]`
1. Extender el diccionario `VENUES` en `app/lugar/[venue]/page.tsx` para incluir los 5 nuevos recintos (`museo-cultura-lojana`, `centro-cultural-alfredo-mora-reyes`, `nano-casa-museo`, `sala-eduardo-kingman`, `escena-continua`).
2. Vincular los términos de búsqueda para que si un evento ocurre en el "Alfredo Mora Reyes" o en la "Sala Kingman", aparezca automáticamente en la cartelera viva del recinto.
3. Declarar sus coordenadas geográficas exactas para Google Maps y enriquecer el Schema `@graph` con `@type: "Museum"` o `"PerformingArtsTheater"`.

### FASE 2: Creación del Módulo de Organizaciones y Academias (`/directorio`)
1. **Página Hub:** `app/directorio/page.tsx` con filtros por disciplina:
   - `[ Todos ]`
   - `[ 🩰 Academias de Danza ]`
   - `[ 🎭 Teatro & Productoras ]`
   - `[ 🎻 Música & Conservatorio ]`
   - `[ 🏛️ Museos & Galerías ]`
2. **Página Individual:** `app/directorio/[slug]/page.tsx` optimizada para capturar búsquedas de formación:
   - H1: `[Nombre de la Academia]: Clases, Cursos y Ubicación en Loja`
   - Información de contacto, botón de WhatsApp directo, biografía y trayectoria verificada.
   - Si la organización tiene obras o presentaciones registradas en Agenda Cultural, carrusel de: *"Próximas presentaciones de [Organización]"*.

### FASE 3: SEO Registry, Sitemap y Microdatos
1. Registrar todas las URLs en `lib/seo-registry.ts` con su keyword primaria.
2. Incluir las 20 rutas estáticas en `app/sitemap.ts` con prioridad `0.85`.
3. Inyectar JSON-LD específico por tipo de entidad.

### FASE 4: Validación y Compilación
- Ejecutar `npm run build` en bucle hasta lograr **0 errores** y 100% de páginas estáticas generadas sin romper ninguna ruta previa.

---

¿Aprobamos este plan para iniciar de inmediato la Fase 1 en el código de forma autónoma?
