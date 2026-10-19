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
