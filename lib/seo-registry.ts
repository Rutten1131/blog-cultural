/**
 * 🛡️ REGISTRO CENTRAL DE PRIMARY KEYWORDS (LA VACUNA ANTI-CANIBALIZACIÓN)
 *
 * Cada ruta pública declarada en este archivo tiene asignada una y solo una `primary_keyword`.
 * Regla de Oro: Ninguna ruta puede compartir la misma palabra clave primaria.
 * Esto evita canibalización interna en Google Search Console.
 */

export interface RouteSeoDefinition {
  route: string;
  primaryKeyword: string;
  h1: string;
  description: string;
  status: "ACTIVE" | "REDIRECT_301" | "NOINDEX_UNTIL_EVIDENCE";
}

export const PRIMARY_SEO_REGISTRY: Record<string, RouteSeoDefinition> = {
  // ── Página Pilar ──
  "/eventos": {
    route: "/eventos",
    primaryKeyword: "eventos en loja",
    h1: "Eventos en Loja: Cartelera Cultural Actualizada",
    description: "Página pilar central. Absorbe la intención macro de cartelera, eventos hoy y eventos de la semana.",
    status: "ACTIVE",
  },

  // ── Satélite Temporal ──
  "/eventos/este-fin-de-semana": {
    route: "/eventos/este-fin-de-semana",
    primaryKeyword: "qué hacer este fin de semana en loja",
    h1: "Qué hacer este fin de semana en Loja: Eventos y Cartelera",
    description: "Satélite temporal que filtra estrictamente de viernes a domingo.",
    status: "ACTIVE",
  },

  // ── Satélites Temáticas / Categorías ──
  "/eventos/categoria/musica": {
    route: "/eventos/categoria/musica",
    primaryKeyword: "conciertos en loja",
    h1: "Conciertos en Loja y Eventos de Música en Vivo 2026",
    description: "Música en vivo, recitales sinfónicos y festivales.",
    status: "ACTIVE",
  },
  "/eventos/categoria/teatro": {
    route: "/eventos/categoria/teatro",
    primaryKeyword: "teatro en loja",
    h1: "Teatro en Loja: Obras, Funciones y Cartelera Escénica",
    description: "Artes escénicas, dramaturgia y microteatro.",
    status: "ACTIVE",
  },
  "/eventos/categoria/arte-y-exposiciones": {
    route: "/eventos/categoria/arte-y-exposiciones",
    primaryKeyword: "arte y exposiciones en loja",
    h1: "Arte y Exposiciones en Loja: Museos, Galerías y Muestras",
    description: "Muestras de pintura, fotografía, escultura y galerías.",
    status: "ACTIVE",
  },
  "/eventos/categoria/ferias": {
    route: "/eventos/categoria/ferias",
    primaryKeyword: "ferias en loja",
    h1: "Ferias y Artesanías en Loja: Calendario y Participantes",
    description: "Ferias de emprendimiento, artesanales y agroecológicas.",
    status: "ACTIVE",
  },
  "/eventos-gastronomicos": {
    route: "/eventos-gastronomicos",
    primaryKeyword: "feria de loja 2026", // Certificada en core.seo_keywords (500 búsquedas, +900%)
    h1: "Eventos Gastronómicos en Loja: Ferias, Festivales y Rutas del Café",
    description: "Hub consolidado de eventos culinarios, ferias gastronómicas y festivales cafeteros de Loja.",
    status: "ACTIVE",
  },

  // ── Mega-Landing Evento Ancla (CULTURAL Canónica) ──
  "/festival-artes-vivas-loja-2026": {
    route: "/festival-artes-vivas-loja-2026",
    primaryKeyword: "festival de artes vivas loja 2026",
    h1: "Festival de Artes Vivas Loja 2026 (FIAVL)",
    description: "Mega-landing con anclas internas (#fechas, #sedes, #entradas, #faq).",
    status: "ACTIVE",
  },

  // ── Recintos Culturales ──
  "/lugar/teatro-bolivar": {
    route: "/lugar/teatro-bolivar",
    primaryKeyword: "teatro bolivar loja",
    h1: "Teatro Simón Bolívar",
    description: "Ficha de recinto con title condicional (cartelera vs ubicación/historia).",
    status: "ACTIVE",
  },
  "/lugar/teatro-segundo-cueva-celi": {
    route: "/lugar/teatro-segundo-cueva-celi",
    primaryKeyword: "teatro segundo cueva celi",
    h1: "Teatro de Artes Segundo Cueva Celi",
    description: "Ficha de recinto con title condicional.",
    status: "ACTIVE",
  },
  "/lugar/museo-musica-loja": {
    route: "/lugar/museo-musica-loja",
    primaryKeyword: "museo de la musica loja",
    h1: "Museo de la Música de Loja",
    description: "Página de atracción con horarios y salas de exposición.",
    status: "ACTIVE",
  },
  "/lugar/centro-cultural-alfredo-mora-reyes": {
    route: "/lugar/centro-cultural-alfredo-mora-reyes",
    primaryKeyword: "centro cultural alfredo mora reyes",
    h1: "Centro Cultural Municipal Alfredo Mora Reyes",
    description: "Teatro municipal y centro de artes plásticas con cartelera en vivo.",
    status: "ACTIVE",
  },
  "/lugar/museo-cultura-lojana": {
    route: "/lugar/museo-cultura-lojana",
    primaryKeyword: "museo de la cultura lojana",
    h1: "Museo de la Cultura Lojana",
    description: "Museo central del Ministerio de Cultura frente al Parque Central de Loja.",
    status: "ACTIVE",
  },
  "/lugar/nano-casa-museo": {
    route: "/lugar/nano-casa-museo",
    primaryKeyword: "ñaño casa museo",
    h1: "Ñaño Casa Museo",
    description: "Espacio cultural ecológico y artístico del maestro Boris Salinas en Loja.",
    status: "ACTIVE",
  },
  "/lugar/sala-eduardo-kingman": {
    route: "/lugar/sala-eduardo-kingman",
    primaryKeyword: "sala eduardo kingman loja",
    h1: "Galería y Sala de Exposiciones Eduardo Kingman",
    description: "Sala de arte contemporáneo de la Casa de la Cultura Núcleo de Loja.",
    status: "ACTIVE",
  },
  "/lugar/escena-continua": {
    route: "/lugar/escena-continua",
    primaryKeyword: "escena continua loja",
    h1: "Escena Continua",
    description: "Sala de teatro independiente y formación actoral en Loja.",
    status: "ACTIVE",
  },

  // ── Directorio Cultural de Loja (Academias, Elencos, Productoras) ──
  "/directorio": {
    route: "/directorio",
    primaryKeyword: "directorio cultural loja",
    h1: "Directorio Cultural de Loja",
    description: "Guía oficial de escuelas de arte, academias de danza, elencos y productoras.",
    status: "ACTIVE",
  },
  "/directorio/lojadanza-ballet-escuela": {
    route: "/directorio/lojadanza-ballet-escuela",
    primaryKeyword: "lojadanza escuela de ballet",
    h1: "Lojadanza - Ballet Escuela",
    description: "Centro formativo integral de danza clásica, contemporánea y jazz en Loja.",
    status: "ACTIVE",
  },
  "/directorio/cano-artes-escenicas": {
    route: "/directorio/cano-artes-escenicas",
    primaryKeyword: "cano artes escenicas loja",
    h1: "CANO Artes Escénicas",
    description: "Compañía de teatro físico, producción escénica y escuela actoral en Loja.",
    status: "ACTIVE",
  },
  "/directorio/reysodance-academia": {
    route: "/directorio/reysodance-academia",
    primaryKeyword: "reysodance academia de baile loja",
    h1: "ReysoDance - Centro de Formación Dancística",
    description: "Academia especializada en ritmos latinos, salsa, bachata y danza urbana en Loja.",
    status: "ACTIVE",
  },
  "/directorio/cache-dance-studio": {
    route: "/directorio/cache-dance-studio",
    primaryKeyword: "cache dance studio loja",
    h1: "Caché Dance Studio",
    description: "Estudio formativo de danzas urbanas, hip hop y ritmos latinos en Loja.",
    status: "ACTIVE",
  },
  "/directorio/maktub-estudio-arte": {
    route: "/directorio/maktub-estudio-arte",
    primaryKeyword: "maktub danza arabe loja",
    h1: "Maktub - Estudio de Arte y Danza",
    description: "Centro pionero y especializado en danza oriental, bellydance y fusión en Loja.",
    status: "ACTIVE",
  },
  "/directorio/loxa-dance-escuela": {
    route: "/directorio/loxa-dance-escuela",
    primaryKeyword: "loxa dance escuela de baile",
    h1: "Loxa Dance Escuela de Baile",
    description: "Academia formativa de danza urbana, ritmos modernos y alta competencia en Loja.",
    status: "ACTIVE",
  },
  "/directorio/ballet-ciudaddeloja": {
    route: "/directorio/ballet-ciudaddeloja",
    primaryKeyword: "ballet folklorico ciudad de loja",
    h1: "Ballet Folclórico Internacional Ciudad de Loja",
    description: "Agrupación representativa del rescate dancístico tradicional y andino lojano.",
    status: "ACTIVE",
  },
  "/directorio/la-septima-produccion": {
    route: "/directorio/la-septima-produccion",
    primaryKeyword: "la septima produccion cultural loja",
    h1: "La Séptima Producción Cultural",
    description: "Elenco de artes escénicas contemporáneas, dramaturgia histórica y teatro experimental.",
    status: "ACTIVE",
  },
  "/directorio/fundacion-mundos-opuestos": {
    route: "/directorio/fundacion-mundos-opuestos",
    primaryKeyword: "circo social mundos opuestos loja",
    h1: "Fundación Cultural Mundos Opuestos",
    description: "Compañía y escuela de acrobacia aérea, malabares y pedagogía circense en Loja.",
    status: "ACTIVE",
  },
  "/directorio/conservatorio-salvador-bustamante": {
    route: "/directorio/conservatorio-salvador-bustamante",
    primaryKeyword: "conservatorio salvador bustamante celi loja",
    h1: "Conservatorio Superior Salvador Bustamante Celi",
    description: "Institución cumbre de formación musical académica, instrumental y sinfónica en Loja.",
    status: "ACTIVE",
  },

  // ── Redirección Permanente (Consolidada en Pilar) ──
  "/eventos/esta-semana": {
    route: "/eventos/esta-semana",
    primaryKeyword: "",
    h1: "",
    description: "Redirige vía 301 permanente a /eventos para evitar canibalización.",
    status: "REDIRECT_301",
  },
};

/**
 * Función de validación de integridad (ejecutable en CI/CD o build).
 * Verifica que no existan dos rutas activas con la misma palabra clave primaria.
 */
export function validarIntegridadSeoRegistry(): { valido: boolean; errores: string[] } {
  const vistos = new Map<string, string>();
  const errores: string[] = [];

  for (const [ruta, def] of Object.entries(PRIMARY_SEO_REGISTRY)) {
    if (def.status === "REDIRECT_301" || !def.primaryKeyword) continue;
    const kw = def.primaryKeyword.toLowerCase().trim();
    if (vistos.has(kw)) {
      errores.push(`[COLISIÓN SEO] La keyword '${kw}' está duplicada en '${vistos.get(kw)}' y '${ruta}'.`);
    } else {
      vistos.set(kw, ruta);
    }
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}
