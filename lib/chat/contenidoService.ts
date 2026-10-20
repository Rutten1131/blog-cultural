/**
 * Repositorio Unificado de Servicios de Contenido para el Chatbot.
 * 
 * ARQUITECTURA MULTI-DB SIMULADA / PREPARADA:
 * Este servicio abstrae de dónde provienen los datos:
 * - Eventos: proviene de DB Eventos (Agenda Cultural).
 * - Restaurantes y Cafeterías: proviene de DB Gastronomía (Qué Comer en Loja).
 * - Hoteles, Hospedaje y Rutas/Atractivos: proviene de DB Turismo (Agenda Turística Loja).
 * 
 * En el estado actual (mientras las 3 DBs de contenido conviven en la base general):
 * Este módulo mapea cada llamada al modelo correspondiente con sus filtros semánticos.
 * Cuando se activen DB_GASTRONOMIA_URL y DB_TURISMO_URL, SOLO se cambian las llamadas
 * internas de este archivo hacia los clientes respectivos (prismaGastro, prismaTurismo)
 * sin tocar el prompt, el widget ni la API de chat.
 */

import { prisma } from "@/lib/prisma";
import { prismaBot } from "@/lib/prisma-bot";

export interface EventoItem {
  id: number;
  nombre: string;
  fecha: Date;
  lugar: string;
  slug: string;
  imagenUrl: string | null;
  descripcion: string;
}

export interface HabitacionItem {
  nombre: string;
  precio: string | null;
  caracteristicas: string | null;
  orden?: number;
}

export interface AliadoItem {
  id: number;
  nombre: string;
  tipo: "HOSPEDAJE" | "GASTRONOMIA" | "CAFETERIA" | string;
  imagenUrl: string | null;
  servicios: string | null;
  telefono: string | null;
  destacado: boolean;
  activo: boolean;
  descripcion: string;
  mapaUrl: string | null;
  rangoPrecio: string | null;
  redesUrl: string | null;
  ubicacion: string;
  websiteUrl: string | null;
  ubicacionLat: number | null;
  ubicacionLng: number | null;
  estrellas: number | null;
  numeroCuartos: number | null;
  canton?: string | null;
  habitaciones?: HabitacionItem[];
  distanciaKm?: number | null;
  distanciaTexto?: string;
}

export interface AtractivoItem {
  id: number;
  nombre: string;
  canton: string;
  descripcion: string;
  distancia: string;
  ruta: string;
  imagenUrl?: string | null;
  mapaUrl?: string | null;
  activo: boolean;
}

// ─────────────────────────────────────────────────────────────
// 1. SERVICIO DE EVENTOS CULTURALES (Fuente: DB Eventos)
// ─────────────────────────────────────────────────────────────
export const eventosService = {
  /**
   * Obtiene eventos por IDs específicos (usado en caché e hidratación)
   */
  async obtenerPorIds(ids: number[]): Promise<EventoItem[]> {
    if (!ids || ids.length === 0) return [];
    return prisma.evento.findMany({
      where: { id: { in: ids }, estado: "APROBADO" },
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        slug: true,
        imagenUrl: true,
        descripcion: true,
      },
    });
  },

  /**
   * Búsqueda para planificación de visita
   */
  async obtenerParaPlanVisita(desde: Date, hasta?: Date, limite = 4): Promise<EventoItem[]> {
    return prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        fecha: hasta ? { gte: desde, lte: hasta } : { gte: desde },
      },
      orderBy: { fecha: "asc" },
      take: limite,
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        slug: true,
        imagenUrl: true,
        descripcion: true,
      },
    });
  },

  /**
   * Búsqueda por rango de fechas
   */
  async obtenerPorRango(desde: Date, hasta: Date, limite = 8): Promise<EventoItem[]> {
    return prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        fecha: { gte: desde, lte: hasta },
      },
      orderBy: { fecha: "asc" },
      take: limite,
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        slug: true,
        imagenUrl: true,
        descripcion: true,
      },
    });
  },

  /**
   * Búsqueda temática por palabras clave
   */
  async obtenerPorTematica(
    palabras: string[],
    desde?: Date,
    hasta?: Date,
    limite = 6
  ): Promise<EventoItem[]> {
    const filtrosOr = palabras.flatMap((palabra) => [
      { nombre: { contains: palabra } },
      { descripcion: { contains: palabra } },
      { lugar: { contains: palabra } },
    ]);

    return prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        ...(desde && hasta
          ? { fecha: { gte: desde, lte: hasta } }
          : desde
          ? { fecha: { gte: desde } }
          : {}),
        OR: filtrosOr,
      },
      orderBy: { fecha: "asc" },
      take: limite,
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        slug: true,
        imagenUrl: true,
        descripcion: true,
      },
    });
  },

  /**
   * Búsqueda de eventos pasados / históricos
   */
  async obtenerPasados(antesDe: Date, palabras: string[] = [], limite = 6): Promise<EventoItem[]> {
    const filtrosOr =
      palabras.length > 0
        ? palabras.flatMap((palabra) => [
            { nombre: { contains: palabra } },
            { descripcion: { contains: palabra } },
            { lugar: { contains: palabra } },
          ])
        : undefined;

    return prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        fecha: { lt: antesDe },
        ...(filtrosOr ? { OR: filtrosOr } : {}),
      },
      orderBy: { fecha: "desc" },
      take: limite,
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        slug: true,
        imagenUrl: true,
        descripcion: true,
      },
    });
  },

  /**
   * Cartelera general de próximos eventos
   */
  async obtenerProximos(desde: Date, limite = 6): Promise<EventoItem[]> {
    return prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        fecha: { gte: desde },
      },
      orderBy: { fecha: "asc" },
      take: limite,
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        slug: true,
        imagenUrl: true,
        descripcion: true,
      },
    });
  },

  /**
   * Candidatos para resolver preguntas referenciales ("¿de qué se trata eso?")
   */
  async obtenerCandidatosReferenciales(limite = 30): Promise<EventoItem[]> {
    return prisma.evento.findMany({
      where: { estado: "APROBADO" },
      orderBy: { fecha: "asc" },
      take: limite,
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        slug: true,
        imagenUrl: true,
        descripcion: true,
      },
    });
  },
};

// ─────────────────────────────────────────────────────────────
// 2. SERVICIO DE GASTRONOMÍA (Fuente: DB Botempresas / QueComerEnLoja)
// ─────────────────────────────────────────────────────────────
export const gastronomiaService = {
  /**
   * Carga restaurantes y cafeterías activas con sus especialidades/platos
   * MIENTRAS TANTO: Se leen desde la base de datos central de Botempresas (CHATBOT_DB_URL).
   */
  async obtenerRestaurantesYCafes(limite = 20): Promise<AliadoItem[]> {
    return prismaBot.aliados.findMany({
      where: {
        activo: true,
        tipo: { in: ["GASTRONOMIA", "CAFETERIA"] },
      },
      orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
      take: limite,
      include: {
        aliado_habitaciones: {
          orderBy: [{ orden: "asc" }, { id: "asc" }],
        },
      },
    }).then((lista) =>
      lista.map((item) => ({
        ...item,
        habitaciones: item.aliado_habitaciones,
      }))
    ) as unknown as Promise<AliadoItem[]>;
  },

  /**
   * Obtiene restaurantes o cafeterías por lista de IDs desde Botempresas
   */
  async obtenerPorIds(ids: number[]): Promise<AliadoItem[]> {
    if (!ids || ids.length === 0) return [];
    return prismaBot.aliados.findMany({
      where: {
        id: { in: ids },
        activo: true,
        tipo: { in: ["GASTRONOMIA", "CAFETERIA"] },
      },
      include: {
        aliado_habitaciones: {
          orderBy: [{ orden: "asc" }, { id: "asc" }],
        },
      },
    }).then((lista) =>
      lista.map((item) => ({
        ...item,
        habitaciones: item.aliado_habitaciones,
      }))
    ) as unknown as Promise<AliadoItem[]>;
  },
};

// ─────────────────────────────────────────────────────────────
// 3. SERVICIO DE HOSPEDAJE Y TURISMO (Fuente: DB Botempresas / AgendaTuristicaLoja)
// ─────────────────────────────────────────────────────────────
export const turismoService = {
  /**
   * Carga hoteles, hosterías y hostales con sus habitaciones y tarifas
   * MIENTRAS TANTO: Se leen desde la base de datos central de Botempresas (CHATBOT_DB_URL).
   */
  async obtenerHoteles(limite = 20, canton?: string): Promise<AliadoItem[]> {
    const whereClause: any = {
      activo: true,
      tipo: "HOSPEDAJE",
    };

    if (canton && canton.trim()) {
      whereClause.OR = [
        { canton: { equals: canton.trim() } },
        { ubicacion: { contains: canton.trim() } },
        { descripcion: { contains: canton.trim() } },
      ];
    }

    return prismaBot.aliados.findMany({
      where: whereClause,
      orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
      take: limite,
      include: {
        aliado_habitaciones: {
          orderBy: [{ orden: "asc" }, { id: "asc" }],
        },
      },
    }).then((lista) =>
      lista.map((item) => ({
        ...item,
        habitaciones: item.aliado_habitaciones,
      }))
    ) as unknown as Promise<AliadoItem[]>;
  },

  /**
   * Obtiene atractivos cantonales, rutas y naturaleza desde Botempresas
   */
  async obtenerAtractivos(limite = 6): Promise<AtractivoItem[]> {
    return prismaBot.atractivos_cantonales.findMany({
      where: { activo: true },
      take: limite,
    }) as unknown as Promise<AtractivoItem[]>;
  },

  /**
   * Obtiene atractivos por lista de IDs desde Botempresas
   */
  async obtenerAtractivosPorIds(ids: number[]): Promise<AtractivoItem[]> {
    if (!ids || ids.length === 0) return [];
    return prismaBot.atractivos_cantonales.findMany({
      where: { id: { in: ids }, activo: true },
    }) as unknown as Promise<AtractivoItem[]>;
  },

  /**
   * Obtiene hoteles por lista de IDs desde Botempresas
   */
  async obtenerHotelesPorIds(ids: number[]): Promise<AliadoItem[]> {
    if (!ids || ids.length === 0) return [];
    return prismaBot.aliados.findMany({
      where: {
        id: { in: ids },
        activo: true,
        tipo: "HOSPEDAJE",
      },
      include: {
        aliado_habitaciones: {
          orderBy: [{ orden: "asc" }, { id: "asc" }],
        },
      },
    }).then((lista) =>
      lista.map((item) => ({
        ...item,
        habitaciones: item.aliado_habitaciones,
      }))
    ) as unknown as Promise<AliadoItem[]>;
  },
};

// ─────────────────────────────────────────────────────────────
// 4. COORDINADOR MULTI-FUENTE (Orquestador RAG)
// ─────────────────────────────────────────────────────────────
/**
 * Haversine para cálculo de distancia en Km
 */
export function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Anexa cálculo de distancia GPS a aliados (hoteles o restaurantes) y los ordena por cercanía
 */
export function enriquecerConDistanciaGPS<T extends AliadoItem>(
  aliados: T[],
  ubicacion?: { lat: number; lng: number }
): T[] {
  const resultado = aliados.map((a) => {
    let distanciaTexto = "";
    let distanciaKm: number | null = null;
    if (ubicacion?.lat && ubicacion?.lng && a.ubicacionLat !== null && a.ubicacionLng !== null) {
      distanciaKm = calcularDistanciaKm(ubicacion.lat, ubicacion.lng, a.ubicacionLat, a.ubicacionLng);
      if (distanciaKm < 1) {
        distanciaTexto = ` | DISTANCIA GPS: a ${(distanciaKm * 1000).toFixed(0)} metros (¡MUY CERCA!)`;
      } else {
        distanciaTexto = ` | DISTANCIA GPS: a ${distanciaKm.toFixed(1)} km`;
      }
    }
    return { ...a, distanciaKm, distanciaTexto };
  });

  if (ubicacion?.lat && ubicacion?.lng) {
    resultado.sort((a, b) => {
      if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
      if (a.distanciaKm !== null) return -1;
      if (b.distanciaKm !== null) return 1;
      return 0;
    });
  }

  return resultado;
}

/**
 * Consulta unificada simulando las 3 DBs de contenido en paralelo.
 * Si en el futuro una base de datos falla o tarda, las demás continúan operando.
 */
export async function consultarFuentesContenido(options: {
  necesitaRestaurantes?: boolean;
  necesitaHoteles?: boolean;
  necesitaAtractivos?: boolean;
  ubicacion?: { lat: number; lng: number };
}) {
  const [restaurantes, hoteles, atractivos] = await Promise.all([
    options.necesitaRestaurantes !== false
      ? gastronomiaService.obtenerRestaurantesYCafes(15)
      : Promise.resolve([]),
    options.necesitaHoteles !== false
      ? turismoService.obtenerHoteles(15)
      : Promise.resolve([]),
    options.necesitaAtractivos !== false
      ? turismoService.obtenerAtractivos(6)
      : Promise.resolve([]),
  ]);

  // Se unen como aliados unificados enriquecidos con GPS
  const todosAliados = enriquecerConDistanciaGPS([...hoteles, ...restaurantes], options.ubicacion);

  return {
    aliados: todosAliados,
    restaurantes: todosAliados.filter((a) => a.tipo === "GASTRONOMIA" || a.tipo === "CAFETERIA"),
    hoteles: todosAliados.filter((a) => a.tipo === "HOSPEDAJE"),
    atractivos,
  };
}
