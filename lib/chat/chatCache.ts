/**
 * lib/chat/chatCache.ts
 *
 * Sistema de Caché LRU en memoria + Rate Limiter para el Chatbot.
 * - Cachea respuestas frecuentes (ej: preguntas predeterminadas, qué hacer, dónde comer, hoteles)
 *   reduciendo latencia a <5ms y ahorrando tokens en la API de DeepSeek.
 * - Rate Limiting por IP para evitar abusos o ataques DoS que agoten la cuota de la IA.
 */

interface CacheEntry {
  texto: string;
  aliadosRecomendadosIds: number[];
  eventosRecomendadosIds: number[];
  atractivosRecomendadosIds: number[];
  timestamp: number;
}

// TTL por defecto: 20 minutos (1200000 ms)
const DEFAULT_TTL_MS = 20 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

class ChatResponseCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Normaliza la consulta: minúsculas, sin tildes, sin signos de puntuación extra.
   * Ej: "¿Dónde hospedarse en Loja?" -> "donde hospedarse en loja"
   */
  private normalizarQuery(query: string): string {
    return query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita tildes
      .replace(/[¿?¡!.,;:_()\-]/g, "") // quita signos
      .trim()
      .replace(/\s+/g, " "); // espacios simples
  }

  /**
   * Genera una clave única que combina la consulta normalizada y la zona si existe.
   */
  private generarKey(query: string, zona?: string): string {
    const qNorm = this.normalizarQuery(query);
    const zNorm = zona ? this.normalizarQuery(zona) : "global";
    return `${zNorm}:::${qNorm}`;
  }

  /**
   * Obtiene la respuesta en caché si existe y no ha expirado.
   */
  get(query: string, zona?: string): CacheEntry | null {
    const key = this.generarKey(query, zona);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar expiración
    if (Date.now() - entry.timestamp > DEFAULT_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Almacena una respuesta en caché con LRU eviction si supera el límite.
   */
  set(
    query: string,
    data: {
      texto: string;
      aliadosRecomendadosIds: number[];
      eventosRecomendadosIds: number[];
      atractivosRecomendadosIds: number[];
    },
    zona?: string
  ): void {
    // Si la caché está llena, eliminar la entrada más antigua
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const key = this.generarKey(query, zona);
    this.cache.set(key, {
      ...data,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpia toda la caché (por ejemplo si se actualizan aliados desde el superadmin).
   */
  clear(): void {
    this.cache.clear();
  }

  get stats() {
    return {
      size: this.cache.size,
      maxEntries: MAX_CACHE_ENTRIES,
      ttlMinutes: DEFAULT_TTL_MS / (60 * 1000),
    };
  }
}

// ─── RATE LIMITER EN MEMORIA POR IP ─────────────────────────────────

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class ChatRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  // Máximo 25 peticiones por minuto por IP
  private readonly MAX_REQUESTS = 25;
  private readonly WINDOW_MS = 60 * 1000;

  /**
   * Comprueba si la IP tiene permiso para realizar una petición.
   * Retorna { permitido: boolean, restantes: number, resetEnSegundos: number }
   */
  check(ip: string): { permitido: boolean; restantes: number; resetEnSegundos: number } {
    const now = Date.now();
    const cleanIp = ip || "unknown";

    // Limpieza oportunista si la tabla crece demasiado
    if (this.records.size > 1000) {
      for (const [key, val] of this.records.entries()) {
        if (now > val.resetTime) this.records.delete(key);
      }
    }

    const record = this.records.get(cleanIp);

    if (!record || now > record.resetTime) {
      this.records.set(cleanIp, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return {
        permitido: true,
        restantes: this.MAX_REQUESTS - 1,
        resetEnSegundos: Math.ceil(this.WINDOW_MS / 1000),
      };
    }

    if (record.count >= this.MAX_REQUESTS) {
      return {
        permitido: false,
        restantes: 0,
        resetEnSegundos: Math.ceil((record.resetTime - now) / 1000),
      };
    }

    record.count++;
    return {
      permitido: true,
      restantes: this.MAX_REQUESTS - record.count,
      resetEnSegundos: Math.ceil((record.resetTime - now) / 1000),
    };
  }
}

// Exportar instancias singleton para compartir en el proceso Node/Next.js
export const chatCache = new ChatResponseCache();
export const chatRateLimiter = new ChatRateLimiter();
