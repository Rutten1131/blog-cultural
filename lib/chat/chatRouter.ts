export type TipoIntencion =
  | "SALUDO_CORTE"
  | "AMBIGUO_CONTRADICTORIO"
  | "PLANIFICA_VISITA"
  | "EVENTOS_CULTURALES"
  | "HOSPEDAJE_HOTEL"
  | "GASTRONOMIA_CAFETERIA"
  | "TURISMO_LUGARES_LOJA"
  | "VENTA_ALIADO_CONTINUAR"
  | "WHATSAPP_HANDOFF"
  | "CONSULTA_GENERAL";

export interface DecisionRouter {
  intencion: TipoIntencion;
  confianza: number;
  requiereRepregunta: boolean;
  preguntaAclaratoria?: string;
  terminosBusqueda: string[];
  aliadoDetectado?: string | null;
  /** Si true, el bot debe ofrecer botón de contacto WhatsApp directo con el aliado */
  ofrecerWhatsApp?: boolean;
  /** Fecha detectada en el mensaje del usuario para planificación de visita */
  fechaVisita?: string | null;
}

/**
 * Analiza la consulta del usuario, el historial reciente y el resumen
 * para clasificar la intención antes de tocar la base de datos o generar el prompt.
 *
 * Intenciones disponibles:
 * - SALUDO_CORTE: Saludo, despedida, cortesía simple
 * - AMBIGUO_CONTRADICTORIO: Texto sin sentido o contradictorio → devuelve la pelota
 * - PLANIFICA_VISITA: El usuario quiere planificar toda una visita (evento + hotel + comida)
 * - EVENTOS_CULTURALES: Busca cartelera, conciertos, teatro, agenda cultural
 * - HOSPEDAJE_HOTEL: Busca dónde dormir, hoteles, habitaciones
 * - GASTRONOMIA_CAFETERIA: Busca dónde comer, cafeterías, restaurantes
 * - TURISMO_LUGARES_LOJA: Busca atractivos naturales, cantones, rutas
 * - VENTA_ALIADO_CONTINUAR: Continúa flujo de venta de un aliado (precios, reservar, servicios)
 * - WHATSAPP_HANDOFF: Alta intención de cierre → ofrecer contacto directo por WhatsApp
 * - CONSULTA_GENERAL: Todo lo demás
 */
export function clasificarIntencionUsuario(
  mensajeActual: string,
  resumenPrevio: string | null,
  ultimosMensajesTexto: string
): DecisionRouter {
  const q = mensajeActual.trim().toLowerCase();
  const qNorm = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // ─── 1. SALUDO PURO O CORTESÍA ──────────────────────────────
  const esSaludoPuro =
    /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|ola|saludos)[!?. ]*$/i.test(q) ||
    /^(gracias|muchas gracias|ok|dale|de una|entendido|chevere|perfecto|genial|listo)[!?. ]*$/i.test(q);

  if (esSaludoPuro) {
    return {
      intencion: "SALUDO_CORTE",
      confianza: 0.98,
      requiereRepregunta: false,
      terminosBusqueda: [],
    };
  }

  // ─── 2. AMBIGÜEDAD / CONTRADICCIÓN / TEXTO SIN SENTIDO ─────
  const esGibberish =
    /^(.)\1{4,}$/.test(q) ||
    (q.length > 5 && !/[aeiouáéíóú]/i.test(q) && !/\d/.test(q));

  const contradiccionTemporal =
    (q.includes("ayer") || q.includes("pasado")) &&
    (q.includes("mañana") || q.includes("proxima semana") || q.includes("hoy noche"));

  const esDemasiadoVagoOConfuso =
    (q.length <= 3 && !["hoy", "sol", "bar", "red", "pan", "yes", "no"].includes(q)) ||
    (q.split(" ").length === 1 && ["no", "talvez", "quizas", "algo", "nada"].includes(q));

  if (esGibberish || contradiccionTemporal || esDemasiadoVagoOConfuso) {
    return {
      intencion: "AMBIGUO_CONTRADICTORIO",
      confianza: 0.95,
      requiereRepregunta: true,
      preguntaAclaratoria:
        "¡Hola! No te comprendí del todo bien esa parte. 😊 ¿Estás buscando eventos culturales para salir hoy o este fin de semana, o prefieres recomendaciones de hoteles y restaurantes en Loja? Cuéntame y te guío de inmediato.",
      terminosBusqueda: [],
    };
  }

  // ─── 3. WHATSAPP HANDOFF ─────────────────────────────────────
  // Alta intención de cierre: "quiero reservar ya", "me interesa", "cómo contacto", etc.
  const esHandoff =
    /quiero reservar|reservar ahora|reservar ya|me interesa reservar|contactar|como contacto|dame el numero|quiero hablar|escribir por whatsapp|confirmar reserva|hacer la reserva/i.test(q);

  if (esHandoff) {
    return {
      intencion: "WHATSAPP_HANDOFF",
      confianza: 0.97,
      requiereRepregunta: false,
      ofrecerWhatsApp: true,
      terminosBusqueda: [],
    };
  }

  // ─── 4. PLANIFICA TU VISITA (multi-intent) ────────────────────
  // El usuario menciona que viene a Loja + quiere saber qué hacer, dónde comer Y dónde dormir
  // Ejemplos: "vengo este viernes con mi novia", "llego el sábado, qué puedo hacer?",
  //           "voy a visitar Loja en octubre, qué recomiendan?"
  const esPlanificacion = (
    // Señales de visita futura
    /voy a|vamos a|vengo|venimos|llego|llegamos|visitar loja|estaré|estaremos|me quedo|nos quedamos|planear|planear|escapada|viaje a loja|fin de semana en loja/i.test(q) ||
    // Contexto de acompañante + fecha
    (/(pareja|novia|novio|esposa|esposo|familia|amigos|grupo|mi hijo|mis hijos)/i.test(q) && /\b(viernes|sabado|domingo|semana|octubre|noviembre|diciembre|enero|finde|fin de semana|este mes|proximo mes)\b/i.test(q))
  ) && (
    // Y NO es solo una búsqueda de un solo tipo
    !/^(donde (hay|queda|comer|dormir)|que eventos|hoteles|restaurante)/i.test(q)
  );

  let fechaVisita: string | null = null;
  if (esPlanificacion) {
    const matchFecha = q.match(/\b(hoy|mañana|viernes|sabado|domingo|este fin de semana|finde|esta semana|proximo (viernes|sabado|domingo|fin de semana)|en octubre|en noviembre|en diciembre|en enero)\b/i);
    fechaVisita = matchFecha ? matchFecha[0] : null;

    return {
      intencion: "PLANIFICA_VISITA",
      confianza: 0.93,
      requiereRepregunta: false,
      terminosBusqueda: ["evento", "hotel", "restaurante"],
      fechaVisita,
    };
  }

  // ─── 5. CONTINUACIÓN DE FLUJO DE VENTA (referencial) ─────────
  const esContinuacionVenta =
    /cuanto cuesta|precio|donde queda|como llego|que incluye|habitacion|cuarto|reservar|contacto|telefono|whatsapp|menu|plato|ver opciones|cuanto vale|disponibilidad|disponible/i.test(q);

  const hayContextoAliado =
    ultimosMensajesTexto.includes("hotel") ||
    ultimosMensajesTexto.includes("restaurante") ||
    ultimosMensajesTexto.includes("cafet") ||
    ultimosMensajesTexto.includes("hosped") ||
    !!resumenPrevio;

  if (esContinuacionVenta && hayContextoAliado) {
    return {
      intencion: "VENTA_ALIADO_CONTINUAR",
      confianza: 0.9,
      requiereRepregunta: false,
      terminosBusqueda: [],
    };
  }

  // ─── 6. HOSPEDAJE / HOTELES ──────────────────────────────────
  const esHospedaje =
    /hosped|hotel|hostal|dormir|alojam|habitac|quedarm|suite|posada|motel/i.test(qNorm);

  if (esHospedaje) {
    return {
      intencion: "HOSPEDAJE_HOTEL",
      confianza: 0.95,
      requiereRepregunta: false,
      terminosBusqueda: ["hotel", "hospedaje"],
    };
  }

  // ─── 7. GASTRONOMÍA / CAFETERÍAS ─────────────────────────────
  const esComidaOCafe =
    /comer|comida|almorz|cenar|desayun|restaurant|restaurante|cafeter|cafe|barista|cecina|tamal|repe|horchata|plato|gastronom|pizz|hamburgues|sushi|tipic/i.test(qNorm);

  if (esComidaOCafe) {
    return {
      intencion: "GASTRONOMIA_CAFETERIA",
      confianza: 0.95,
      requiereRepregunta: false,
      terminosBusqueda: ["gastronomia", "cafeteria"],
    };
  }

  // ─── 8. TURISMO / NATURALEZA / CANTONES ──────────────────────
  const esTurismo =
    /naturaleza|parque|vilcabamba|podocarpus|saraguro|catamayo|cascada|mirador|senderis|montana|rio|camping|conocer|visitar|atractiv|turism|lugares|mandango|picachos|puyango|zamora/i.test(qNorm);

  if (esTurismo && !/evento|concierto|festival|cartelera|agenda/i.test(qNorm)) {
    return {
      intencion: "TURISMO_LUGARES_LOJA",
      confianza: 0.92,
      requiereRepregunta: false,
      terminosBusqueda: ["turismo", "atractivos"],
    };
  }

  // ─── 9. EVENTOS CULTURALES ────────────────────────────────────
  const esEvento =
    /evento|cartelera|concierto|festival|teatro|musica|obra|feria|tocar|hoy|manana|fin de semana|finde|agenda|presentaci|exposicion|danza|ballet|jazz|rock|pop|folclor/i.test(qNorm);

  if (esEvento) {
    return {
      intencion: "EVENTOS_CULTURALES",
      confianza: 0.92,
      requiereRepregunta: false,
      terminosBusqueda: ["evento"],
    };
  }

  // ─── 10. CONSULTA GENERAL ─────────────────────────────────────
  return {
    intencion: "CONSULTA_GENERAL",
    confianza: 0.7,
    requiereRepregunta: false,
    terminosBusqueda: [],
  };
}
