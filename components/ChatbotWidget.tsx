"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { parseImagenesHabitacion } from "@/lib/habitaciones";

/** Categoría / tipo de habitación del aliado (imagenes = JSON string con las URLs) */
interface HabitacionAliado {
  id: number;
  nombre: string;
  precio?: string | null;
  caracteristicas?: string | null;
  imagenes?: string | null;
}


interface Aliado {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  ubicacion: string;
  mapaUrl?: string | null;
  rangoPrecio?: string | null;
  servicios?: string | null;
  cuartos?: string | null;
  numeroCuartos?: number | null;
  estrellas?: number | null;
  telefono?: string | null;
  websiteUrl?: string | null;
  redesUrl?: string | null;
  imagenUrl?: string | null;
  habitaciones?: HabitacionAliado[];
}

interface Atractivo {
  id: number;
  nombre: string;
  canton: string;
  descripcion: string;
  distancia: string;
  ruta: string;
  imagenUrl?: string | null;
  mapaUrl?: string | null;
}

interface EventoItem {
  id: number;
  nombre: string;
  fecha: string;
  lugar: string;
  slug: string;
  imagenUrl?: string | null;
  descripcion?: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  eventos?: EventoItem[];
  aliados?: Aliado[];
  atractivos?: Atractivo[];
  /** Ficha de venta de un aliado puntual (flujo "Háblame de este hotel") */
  aliadoDetalle?: Aliado | null;
  /** Paso actual del flujo de venta (1 a 5) */
  ventaPaso?: number | null;
  /** Botones para que el usuario avance el flujo de venta con un toque */
  respuestasRapidas?: string[];
  time: string;
}

const PREGUNTAS_SUGERIDAS = [
  "🏨 ¿Dónde hospedarse en Loja?",
  "🍽️ ¿Dónde comer en Loja?",
  "🌿 ¿Qué visitar en Loja?",
  "☕ ¿Dónde tomar un café lojano?",
];

/** Estrellas de categoría del aliado (1 a 5, por defecto 3). */
function EstrellasAliado({ n, className = "" }: { n?: number | null; className?: string }) {
  const total = Math.min(5, Math.max(1, n ?? 3));
  return (
    <span
      className={`inline-flex items-center gap-[1px] leading-none text-amber-500 ${className}`}
      title={`${total} estrellas`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </span>
  );
}

/** Carrusel de imágenes de un tipo de habitación (flechas + puntos). */
function CarruselHabitacion({ imagenes, alt }: { imagenes: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  if (imagenes.length === 0) return null;

  const actual = Math.min(idx, imagenes.length - 1);
  const mover = (delta: number) =>
    setIdx((i) => (i + delta + imagenes.length) % imagenes.length);

  return (
    <div className="relative h-32 w-full bg-purple-50 shrink-0">
      <img
        src={imagenes[actual]}
        alt={alt}
        className="w-full h-full object-cover"
      />

      {imagenes.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => mover(-1)}
            title="Imagen anterior"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            title="Imagen siguiente"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
          >
            ›
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {imagenes.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === actual ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
          <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            🖼️ {actual + 1}/{imagenes.length}
          </span>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENTES BASE DE TARJETAS DEL CHAT
   TODO lo que envía el asistente (eventos, aliados, atractivos y
   cualquier bloque futuro) usa este mismo formato: rejilla de 3
   columnas sin scroll horizontal, imagen h-20, textos 9-10px y un
   botón de acción de ancho completo abajo.
   ══════════════════════════════════════════════════════════════════ */

type AcentoChat = "purple" | "emerald" | "amber";

const ACENTO_TITULO: Record<AcentoChat, string> = {
  purple: "text-purple-700",
  emerald: "text-emerald-700",
  amber: "text-amber-600",
};

const ACENTO_BORDE: Record<AcentoChat, string> = {
  purple: "border-purple-100",
  emerald: "border-emerald-100",
  amber: "border-amber-200",
};

const ACENTO_BOTON: Record<AcentoChat, string> = {
  purple:
    "bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white shadow-purple-600/20",
  emerald:
    "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-800/20",
  amber: "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-700/20",
};

const ACENTO_VERMAS: Record<AcentoChat, string> = {
  purple: "border-purple-200/70 text-purple-700 hover:bg-purple-50",
  emerald: "border-emerald-200/70 text-emerald-700 hover:bg-emerald-50",
  amber: "border-amber-200/70 text-amber-700 hover:bg-amber-50",
};

/** Cantidad de tarjetas visibles antes de mostrar el botón "ver más" */
const TARJETAS_VISIBLES = 3;

/** Segundos de inactividad antes de mostrar las sugerencias al final del chat */
const SEGUNDOS_PARA_SUGERENCIAS = 12;

/** Etiquetas según el tipo de aliado (hotel / restaurante / cafetería) */
function etiquetasAliado(tipo?: string) {
  if (tipo === "GASTRONOMIA") {
    return {
      boton: "Háblame de este restaurante",
      categorias: "🍽️ Opciones del menú",
      precioCategorias: "💰 Precio por opción del menú",
      esHospedaje: false,
    };
  }
  if (tipo === "CAFETERIA") {
    return {
      boton: "Háblame de esta cafetería",
      categorias: "☕ Especialidades de la casa",
      precioCategorias: "💰 Precio de las especialidades",
      esHospedaje: false,
    };
  }
  return {
    boton: "Háblame de este hotel",
    categorias: "🏨 Tipos de habitación",
    precioCategorias: "💰 Precio por tipo de habitación",
    esHospedaje: true,
  };
}

/** Sección de tarjetas: título + rejilla de 3 columnas + botón "ver más" si hay más de 3 */
function SeccionTarjetas({
  titulo,
  acento = "purple",
  total,
  expandida = false,
  onToggle,
  children,
}: {
  titulo: string;
  acento?: AcentoChat;
  total: number;
  expandida?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  const hayMas = total > TARJETAS_VISIBLES;

  return (
    <div className="w-full mt-3 space-y-2.5">
      <div className={`flex items-center justify-between gap-2 px-1 ${ACENTO_TITULO[acento]}`}>
        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          {titulo}
        </span>
        {hayMas && (
          <span className="text-[9px] font-semibold text-neutral-400 whitespace-nowrap">
            {expandida
              ? `${total} en total`
              : `${TARJETAS_VISIBLES} de ${total}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 items-stretch">{children}</div>

      {hayMas && (
        <button
          type="button"
          onClick={onToggle}
          className={`w-full py-1.5 bg-white rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer ${ACENTO_VERMAS[acento]}`}
        >
          {expandida ? (
            <>
              <span>▲</span> Ver solo los {TARJETAS_VISIBLES} primeros
            </>
          ) : (
            <>
              <span>▼</span> Ver {total - TARJETAS_VISIBLES} más
            </>
          )}
        </button>
      )}
    </div>
  );
}

/** Tarjeta individual: mismo tamaño y estructura para todos los tipos de contenido */
function TarjetaChat({
  children,
  acento = "purple",
  resaltada = false,
}: {
  children: ReactNode;
  acento?: AcentoChat;
  resaltada?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-md flex flex-col min-w-0 transition-all ${
        resaltada
          ? "border-2 border-purple-500 shadow-purple-500/25"
          : `border ${ACENTO_BORDE[acento]} shadow-purple-900/5`
      }`}
    >
      {children}
    </div>
  );
}

/** Imagen superior de la tarjeta con espacio para distintivos (badges) */
function TarjetaImagen({
  src,
  alt,
  emoji,
  badges,
}: {
  src?: string | null;
  alt: string;
  emoji: string;
  badges?: ReactNode;
}) {
  return (
    <div className="relative h-20 w-full bg-purple-50 shrink-0">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="h-full flex items-center justify-center text-2xl">{emoji}</div>
      )}
      {badges}
    </div>
  );
}

/** Cuerpo de la tarjeta: título, información y botón de acción */
function TarjetaCuerpo({ children }: { children: ReactNode }) {
  return <div className="p-2 flex-1 flex flex-col justify-between gap-2 min-w-0">{children}</div>;
}

/** Botón de acción de la tarjeta (siempre de ancho completo, enlace o acción interna) */
function TarjetaBoton({
  children,
  href,
  onClick,
  acento = "purple",
  inactivo = false,
  title,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  acento?: AcentoChat;
  inactivo?: boolean;
  title?: string;
}) {
  const base =
    "w-full py-1.5 font-bold text-[9px] leading-tight rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer";
  const estilo = inactivo
    ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200"
    : `shadow-md ${ACENTO_BOTON[acento]}`;

  if (href) {
    const externo = href.startsWith("http");
    return (
      <a
        href={href}
        title={title}
        {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`${base} ${estilo}`}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} className={`${base} ${estilo}`}>
      {children}
    </button>
  );
}

interface UbicacionData {
  lat: number;
  lng: number;
  ciudad?: string;
  zona?: string;
  direccionDetallada?: string;
  provincia?: string;
  pais?: string;
}

export function ChatbotWidget() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [ubicacion, setUbicacion] = useState<UbicacionData | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "¡Hola! 👋 Te doy la bienvenida a Loja. Pregúntame qué hacer en la ciudad, lugares culturales, rutas de naturaleza o dónde hospedarte con nuestros aliados recomendados.",
      time: "Ahora",
    },
  ]);

  // Estado para ocultar el botón al llegar al final de la página en móvil
  const [btnVisible, setBtnVisible] = useState(true);

  // Secciones de tarjetas que el usuario expandió ("ver más") — clave: id-mensaje + tipo
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});

  const seccionAbierta = (msgId: string, tipo: string) => !!seccionesAbiertas[`${msgId}-${tipo}`];

  const toggleSeccion = (msgId: string, tipo: string) =>
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [`${msgId}-${tipo}`]: !prev[`${msgId}-${tipo}`],
    }));

  /** Muestra solo las 3 primeras tarjetas hasta que el usuario pulse "ver más" */
  const recortarTarjetas = <T,>(lista: T[], msgId: string, tipo: string): T[] =>
    seccionAbierta(msgId, tipo) ? lista : lista.slice(0, TARJETAS_VISIBLES);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Las sugerencias aparecen solo tras unos segundos de inactividad, para no confundir
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    setMostrarSugerencias(false);
    if (loading || !isOpen) return;

    const timer = setTimeout(() => setMostrarSugerencias(true), SEGUNDOS_PARA_SUGERENCIAS * 1000);
    return () => clearTimeout(timer);
  }, [messages, input, loading, isOpen]);

  // Inicializar o recuperar sessionId único
  useEffect(() => {
    let sid = localStorage.getItem("agenda_chat_session_id");
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("agenda_chat_session_id", sid);
    }
    setSessionId(sid);

    // Si ya teníamos ubicación guardada en sesión local
    const savedLoc = localStorage.getItem("agenda_chat_user_loc");
    if (savedLoc) {
      try {
        const parsed = JSON.parse(savedLoc);
        setUbicacion(parsed);
        setLocationStatus("granted");
      } catch {
        // ignore
      }
    }

    // Recuperar historial de mensajes de la sesión para no perder el hilo si recarga la página
    const savedMsgs = localStorage.getItem("agenda_chat_history");
    if (savedMsgs) {
      try {
        const parsedMsgs = JSON.parse(savedMsgs);
        if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
          setMessages(parsedMsgs);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const reiniciarChat = () => {
    localStorage.removeItem("agenda_chat_history");
    const newSid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("agenda_chat_session_id", newSid);
    setSessionId(newSid);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "¡Hola! 👋 Te doy la bienvenida a Loja. Pregúntame qué hacer en la ciudad, lugares culturales, rutas de naturaleza o dónde hospedarte con nuestros aliados recomendados.",
        time: "Ahora",
      },
    ]);
  };

  const solicitarUbicacion = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch("/api/geo-decode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          });
          const geoData = await res.json();
          const infoLoc: UbicacionData = {
            lat,
            lng,
            ciudad: geoData.ciudad || "Loja",
            zona: geoData.zona || "Loja",
            direccionDetallada: geoData.direccionDetallada || null,
            provincia: geoData.provincia || "Loja",
            pais: geoData.pais || "Ecuador",
          };
          setUbicacion(infoLoc);
          setLocationStatus("granted");
          localStorage.setItem("agenda_chat_user_loc", JSON.stringify(infoLoc));

          // Agregar mensaje de bienvenida contextualizado
          const zonaTexto = infoLoc.zona ? `en la zona de ${infoLoc.zona}` : `en ${infoLoc.ciudad}`;
          setMessages((prev) => [
            ...prev,
            {
              id: `geo-welcome-${Date.now()}`,
              sender: "bot",
              text: `📍 ¡Ubicación detectada ${zonaTexto}! Con esto podré recomendarte eventos culturales, sitios para comer o visitar y aliados comerciales más cercanos a ti. ¿Qué te gustaría descubrir hoy?`,
              time: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } catch {
          const infoLoc: UbicacionData = { lat, lng, ciudad: "Loja", zona: "Loja", provincia: "Loja" };
          setUbicacion(infoLoc);
          setLocationStatus("granted");
        }
      },
      () => {
        setLocationStatus("denied");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Si abre por primera vez y nunca ha respondido a ubicación, sugerir activar
      if (locationStatus === "idle") {
        const dismissed = sessionStorage.getItem("agenda_geo_prompt_dismissed");
        if (!dismissed) {
          // Mantener idle para mostrar banner amigable arriba
        }
      }
    }
  }, [messages, isOpen, locationStatus]);

  // Ocultar botón en móvil cuando se llega al footer (scroll hacia abajo al final),
  // y mostrarlo de nuevo al hacer scroll hacia arriba.
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      // Umbral: si está a menos de 120px del final de la página
      const nearBottom = scrollY + viewportHeight >= docHeight - 120;
      const scrollingDown = scrollY > lastScrollY;

      if (nearBottom && scrollingDown) {
        setBtnVisible(false);
      } else if (!scrollingDown) {
        setBtnVisible(true);
      }

      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          ubicacion: ubicacion ? {
            lat: ubicacion.lat,
            lng: ubicacion.lng,
            ciudad: ubicacion.ciudad,
            zona: ubicacion.zona,
            provincia: ubicacion.provincia,
            pais: ubicacion.pais,
          } : undefined,
          messages: [...messages, userMsg].map((m) => ({
            sender: m.sender,
            content: m.text,
          })),
        }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.texto || "Aquí tienes la información:",
        eventos: data.eventos || [],
        aliados: data.aliados || [],
        atractivos: data.atractivos || [],
        aliadoDetalle: data.aliadoDetalle || null,
        ventaPaso: data.ventaPaso ?? null,
        respuestasRapidas: data.respuestasRapidas || [],
        time: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        // Guardar hasta los últimos 20 mensajes para preservar el contexto si recarga
        localStorage.setItem("agenda_chat_history", JSON.stringify(updated.slice(-20)));
        return updated;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "Loja siempre te recibe con los brazos abiertos. ¿Deseas información sobre lugares para visitar, eventos u hoteles?",
          time: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante con Branding Morado/Magenta de Agenda Cultural Loja */}
      <div className={`fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col items-end pointer-events-none transition-all duration-300 ${!btnVisible && !isOpen ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        {!isOpen && (
          <div className="pointer-events-auto mb-1.5 sm:mb-2.5 bg-white/95 text-neutral-800 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl border border-purple-200 shadow-lg shadow-purple-900/10 backdrop-blur-md hidden sm:flex items-center gap-2 animate-bounce">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-purple-600 animate-ping" />
            <span>{t("chat.tooltip", "¿Buscas qué hacer u hospedaje en Loja?")}</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="pointer-events-auto relative group px-3 py-2 sm:px-4 sm:py-3.5 bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 sm:gap-2.5 cursor-pointer border border-white/20"
          aria-label={t("chat.btn_label", "¿Qué hacer en Loja?")}
        >
          {isOpen ? (
            <span className="text-base sm:text-xl px-1">✕</span>
          ) : (
            <>
              <span className="text-base sm:text-xl">🎭</span>
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">{t("chat.btn_label", "¿Qué hacer en Loja?")}</span>
            </>
          )}
        </button>
      </div>

      {/* Ventana Flotante del Chatbot con Estilo Coherente al Sitio Web */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-h-[85vh] h-[640px] bg-white text-neutral-900 border border-purple-100 rounded-3xl shadow-2xl shadow-purple-950/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header con Paleta Oficial Agenda Cultural Loja */}
          <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-pink-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
                  🎭
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 border-2 border-purple-800 rounded-full" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm tracking-wide flex items-center gap-2">
                  {t("chat.title", "¿Qué hacer en Loja?")}
                </h3>
                <p className="text-[11px] text-purple-100/90 font-medium">{t("chat.subtitle", "Turismo, Cartelera Cultural & Aliados")}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={reiniciarChat}
                title="Reiniciar chat y borrar historial"
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-all text-xs font-semibold flex items-center gap-1"
              >
                <span>🔄</span>
                <span className="hidden sm:inline text-[11px]">Nuevo chat</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Banner de Geolocalización Inteligente */}
          {locationStatus !== "granted" && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-3.5 py-2.5 flex items-center justify-between text-xs transition-all">
              <div className="flex items-center gap-2 text-amber-900 pr-2">
                <span className="text-base shrink-0">📍</span>
                <span className="leading-tight text-[11px] sm:text-xs">
                  {locationStatus === "requesting"
                    ? "Detectando tu ubicación en Loja..."
                    : locationStatus === "denied"
                    ? "Sin ubicación (recomendaciones generales)"
                    : "¿Quieres recomendaciones según tu zona en Loja?"}
                </span>
              </div>
              {locationStatus === "idle" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={solicitarUbicacion}
                    className="px-2.5 py-1 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white font-bold rounded-lg text-[10px] shadow-sm transition-all"
                  >
                    Activar
                  </button>
                  <button
                    onClick={() => {
                      setLocationStatus("denied");
                      sessionStorage.setItem("agenda_geo_prompt_dismissed", "true");
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700 text-xs font-bold rounded"
                    title="Omitir"
                  >
                    ✕
                  </button>
                </div>
              )}
              {locationStatus === "denied" && (
                <button
                  onClick={solicitarUbicacion}
                  className="text-[10px] font-bold text-purple-700 hover:underline shrink-0"
                >
                  Reintentar
                </button>
              )}
            </div>
          )}

          {locationStatus === "granted" && ubicacion && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-emerald-800">
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span className="font-semibold truncate max-w-[240px]">
                  Zona: {ubicacion.zona || ubicacion.ciudad || "Loja"}
                </span>
              </div>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                Activa
              </span>
            </div>
          )}

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/40 via-white to-white no-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* Burbuja de Texto */}
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-br-none shadow-md shadow-purple-500/20"
                      : "bg-white border border-purple-100 text-neutral-800 rounded-bl-none shadow-sm whitespace-pre-line"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 px-1 font-medium">{m.time}</span>

                {/* BOTONES DEL FLUJO DE VENTA (respuestas rápidas del paso actual) */}
                {m.sender === "bot" && m.respuestasRapidas && m.respuestasRapidas.length > 0 && (
                  <div className="w-full mt-2 flex flex-wrap gap-1.5">
                    {m.respuestasRapidas.map((respuesta, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(respuesta)}
                        disabled={loading}
                        className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {respuesta}
                      </button>
                    ))}
                  </div>
                )}

                {/* ─── EVENTOS ─── (mismo formato de tarjeta que todo el chat) */}
                {m.eventos && m.eventos.length > 0 && (
                  <SeccionTarjetas
                    titulo="🎭 Eventos Destacados en Cartelera:"
                    total={m.eventos.length}
                    expandida={seccionAbierta(m.id, "eventos")}
                    onToggle={() => toggleSeccion(m.id, "eventos")}
                  >
                    {recortarTarjetas(m.eventos, m.id, "eventos").map((evento) => (
                      <TarjetaChat key={evento.id}>
                        <TarjetaImagen
                          src={evento.imagenUrl}
                          alt={evento.nombre}
                          emoji="🎭"
                          badges={
                            <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] text-purple-800 font-bold border border-purple-200 shadow-sm">
                              📅{" "}
                              {new Date(evento.fecha).toLocaleDateString("es-EC", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                          }
                        />

                        <TarjetaCuerpo>
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-bold text-neutral-900 text-[10px] leading-tight line-clamp-3">
                              {evento.nombre}
                            </h4>
                            <p className="text-[9px] text-neutral-500 leading-snug line-clamp-2">
                              📍 {evento.lugar}
                            </p>
                          </div>

                          <TarjetaBoton href={`/eventos/${evento.slug}`}>
                            <span>🎟️</span> Ver evento
                          </TarjetaBoton>
                        </TarjetaCuerpo>
                      </TarjetaChat>
                    ))}
                  </SeccionTarjetas>
                )}

                {/* ─── ALIADOS COMERCIALES ─── (el botón inicia el flujo de venta del hotel) */}
                {m.aliados && m.aliados.length > 0 && !m.aliadoDetalle && (
                  <SeccionTarjetas
                    titulo="⭐ Opciones Recomendadas en Loja:"
                    total={m.aliados.length}
                    expandida={seccionAbierta(m.id, "aliados")}
                    onToggle={() => toggleSeccion(m.id, "aliados")}
                  >
                    {recortarTarjetas(m.aliados, m.id, "aliados").map((aliado) => {
                      const etiqueta = etiquetasAliado(aliado.tipo).boton;
                      return (
                        <TarjetaChat key={aliado.id}>
                          <TarjetaImagen
                            src={aliado.imagenUrl}
                            alt={aliado.nombre}
                            emoji="🏨"
                            badges={
                              <>
                                <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] text-purple-800 font-bold border border-purple-200 shadow-sm">
                                  ⭐ Aliado
                                </div>
                                {aliado.rangoPrecio && (
                                  <div className="absolute bottom-1 right-1 bg-gradient-to-r from-purple-700 to-pink-600 text-white font-bold px-1.5 py-0.5 rounded text-[9px] shadow-md">
                                    {aliado.rangoPrecio}
                                  </div>
                                )}
                              </>
                            }
                          />

                          <TarjetaCuerpo>
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-bold text-neutral-900 text-[10px] leading-tight line-clamp-3">
                                {aliado.nombre}
                              </h4>
                              <EstrellasAliado n={aliado.estrellas} className="text-[10px]" />
                            </div>

                            <TarjetaBoton
                              onClick={() =>
                                handleSend(`Quiero saber más sobre ${aliado.nombre}`)
                              }
                              title={etiqueta}
                            >
                              <span>💬</span> {etiqueta}
                            </TarjetaBoton>
                          </TarjetaCuerpo>
                        </TarjetaChat>
                      );
                    })}

                  </SeccionTarjetas>
                )}

                {/* ─── FICHA DE VENTA DEL ALIADO ─── (llega con la respuesta del bot) */}
                {m.aliadoDetalle &&
                  [m.aliadoDetalle].map((aliado) => (
                    <div
                      key={`detalle-${m.id}-${aliado.id}`}
                      className="w-full mt-2 bg-gradient-to-br from-purple-50 via-white to-pink-50 border-2 border-purple-200 rounded-2xl p-3 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                          {/* Progreso del flujo de venta (5 pasos) */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700">
                              Paso {m.ventaPaso ?? 1} de 5
                            </span>
                            <div className="flex gap-0.5 ml-auto">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <span
                                  key={n}
                                  className={`h-1 w-4 rounded-full ${
                                    n <= (m.ventaPaso ?? 1) ? "bg-purple-600" : "bg-purple-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-neutral-900 text-xs leading-tight">
                                {aliado.nombre}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <EstrellasAliado n={aliado.estrellas} className="text-[11px]" />
                                {aliado.rangoPrecio && (
                                  <span className="text-[10px] font-bold text-purple-800">
                                    {aliado.rangoPrecio}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSend("¿Qué otros hoteles tienen disponibles?")}
                              title="Ver otros hoteles"
                              className="shrink-0 px-2 h-6 rounded-full bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              🔎 Otros
                            </button>
                          </div>

                          {(m.ventaPaso ?? 1) === 1 && (
                            <p className="text-[11px] text-neutral-700 leading-relaxed">
                              {aliado.descripcion}
                            </p>
                          )}

                          {(m.ventaPaso ?? 1) === 4 && (
                          <div className="grid grid-cols-2 gap-2 text-[10px] leading-snug">
                            <div className="bg-white/80 border border-purple-100 rounded-xl p-2 min-w-0">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-purple-700">
                                📍 Ubicación
                              </p>
                              <p className="text-neutral-700 mt-0.5">{aliado.ubicacion}</p>
                            </div>

                            {(aliado.numeroCuartos != null ||
                              (aliado.cuartos && !(aliado.habitaciones && aliado.habitaciones.length > 0))) &&
                              etiquetasAliado(aliado.tipo).esHospedaje && (
                              <div className="bg-white/80 border border-purple-100 rounded-xl p-2 min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-purple-700">
                                  🛏️ Habitaciones
                                </p>
                                {aliado.numeroCuartos != null && (
                                  <p className="text-neutral-900 font-bold mt-0.5">
                                    {aliado.numeroCuartos} habitaciones en total
                                  </p>
                                )}
                                {aliado.cuartos && !(aliado.habitaciones && aliado.habitaciones.length > 0) && (
                                  <p className="text-neutral-600 mt-0.5">{aliado.cuartos}</p>
                                )}
                              </div>
                            )}

                            {aliado.servicios && (
                              <div className="bg-white/80 border border-purple-100 rounded-xl p-2 col-span-2 min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-purple-700">
                                  ✨ Servicios y comodidades
                                </p>
                                <p className="text-neutral-600 mt-0.5">{aliado.servicios}</p>
                              </div>
                            )}
                          </div>
                          )}

                          {/* PASO 3: tabla de precios por tipo de habitación */}
                          {(m.ventaPaso ?? 1) === 3 && aliado.habitaciones && aliado.habitaciones.length > 0 && (
                            <div className="bg-white/80 border border-purple-100 rounded-xl p-2 space-y-1.5">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-purple-700">
                                {etiquetasAliado(aliado.tipo).precioCategorias}
                              </p>
                              {aliado.habitaciones.map((hab) => (
                                <div
                                  key={hab.id}
                                  className="flex items-start justify-between gap-2 text-[10px] border-b border-purple-50 last:border-0 pb-1 last:pb-0"
                                >
                                  <span className="text-neutral-700 leading-snug">{hab.nombre}</span>
                                  <span className="shrink-0 font-bold text-purple-800">
                                    {hab.precio || "consultar"}
                                  </span>
                                </div>
                              ))}
                              {aliado.rangoPrecio && (
                                <p className="text-[9px] text-neutral-500 pt-0.5">
                                  🏷️ Rango general: {aliado.rangoPrecio}
                                </p>
                              )}
                            </div>
                          )}

                          {/* TIPOS DE HABITACIÓN (paso 2): precio, qué incluye y carrusel de imágenes */}
                          {(m.ventaPaso ?? 1) === 2 && aliado.habitaciones && aliado.habitaciones.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-purple-700">
                                {etiquetasAliado(aliado.tipo).categorias} ({aliado.habitaciones.length})
                              </p>

                              <div className="space-y-2">
                                {aliado.habitaciones.map((hab) => (
                                  <div
                                    key={hab.id}
                                    className="bg-white border border-purple-100 rounded-xl overflow-hidden shadow-sm shadow-purple-900/5"
                                  >
                                    <CarruselHabitacion
                                      imagenes={parseImagenesHabitacion(hab.imagenes)}
                                      alt={hab.nombre}
                                    />
                                    <div className="p-2 space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-bold text-neutral-900 text-[11px] leading-tight">
                                          {hab.nombre}
                                        </h5>
                                        {hab.precio && (
                                          <span className="shrink-0 text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-lg">
                                            {hab.precio}
                                          </span>
                                        )}
                                      </div>
                                      {hab.caracteristicas && (
                                        <p className="text-[10px] text-neutral-600 leading-snug">
                                          {hab.caracteristicas}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Botones de Acción Comercial (a partir del paso 4: qué incluye y cierre) */}
                          {(m.ventaPaso ?? 1) >= 4 && (
                          <div className="pt-2 border-t border-purple-100 flex flex-col gap-1.5">
                            {aliado.telefono && (
                              <a
                                href={`https://wa.me/${aliado.telefono.replace(
                                  /\D/g,
                                  ""
                                )}?text=${encodeURIComponent(
                                  `¡Hola! Vi a ${aliado.nombre} en la Agenda Cultural de Loja. Quisiera consultar disponibilidad y precios.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Reservar por WhatsApp"
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-700/20"
                              >
                                <span>💬</span> Reservar por WhatsApp
                              </a>
                            )}

                            <div className="flex gap-1.5">
                              {aliado.mapaUrl && (
                                <a
                                  href={aliado.mapaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 border border-purple-100 transition-all"
                                >
                                  <span>📍</span> Ubicación
                                </a>
                              )}
                              {aliado.websiteUrl && (
                                <a
                                  href={aliado.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 border border-pink-100 transition-all"
                                >
                                  <span>🌐</span> Web
                                </a>
                              )}
                              {aliado.redesUrl && (
                                <a
                                  href={aliado.redesUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 border border-neutral-200 transition-all"
                                >
                                  <span>📱</span> Redes
                                </a>
                              )}
                            </div>
                          </div>
                          )}
                        </div>
                  ))}

                {/* ─── ATRACTIVOS CANTONALES ─── (mismo formato de tarjeta que todo el chat) */}
                {m.atractivos && m.atractivos.length > 0 && (
                  <SeccionTarjetas
                    titulo="🌿 Atractivos Cantonales Sugeridos:"
                    acento="emerald"
                    total={m.atractivos.length}
                    expandida={seccionAbierta(m.id, "atractivos")}
                    onToggle={() => toggleSeccion(m.id, "atractivos")}
                  >
                    {recortarTarjetas(m.atractivos, m.id, "atractivos").map((atractivo) => (
                      <TarjetaChat key={atractivo.id} acento="emerald">
                        <TarjetaImagen
                          src={atractivo.imagenUrl}
                          alt={atractivo.nombre}
                          emoji="🏞️"
                          badges={
                            <div className="absolute top-1 left-1 bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded text-[8px]">
                              📍 {atractivo.canton}
                            </div>
                          }
                        />

                        <TarjetaCuerpo>
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-bold text-neutral-900 text-[10px] leading-tight line-clamp-3">
                              {atractivo.nombre}
                            </h4>
                            <p className="text-[9px] text-emerald-800 font-semibold leading-snug line-clamp-2">
                              ⏱️ {atractivo.distancia}
                            </p>
                            {atractivo.ruta && (
                              <p className="text-[9px] text-neutral-500 leading-snug line-clamp-2">
                                🚗 {atractivo.ruta}
                              </p>
                            )}
                          </div>

                          {atractivo.mapaUrl && (
                            <TarjetaBoton href={atractivo.mapaUrl} acento="emerald" title="Ver ruta en Google Maps">
                              <span>🗺️</span> Ver ruta
                            </TarjetaBoton>
                          )}
                        </TarjetaCuerpo>
                      </TarjetaChat>
                    ))}
                  </SeccionTarjetas>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-neutral-500 text-xs italic bg-purple-50/70 p-3 rounded-2xl w-fit border border-purple-100">
                <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                <span>Consultando información turística y aliados de Loja...</span>
              </div>
            )}

            {/* Sugerencias: aparecen solo tras unos segundos sin actividad */}
            {!loading && mostrarSugerencias && (
              <div className="w-full pt-1 pb-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 px-0.5 mb-1.5">
                  Sugerencias
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {PREGUNTAS_SUGERIDAS.map((pregunta, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(pregunta)}
                      className="px-2 py-1 bg-white/80 hover:bg-purple-50 text-neutral-500 hover:text-purple-700 rounded-md text-[9px] font-medium text-left leading-snug transition-all border border-purple-200/60 cursor-pointer"
                    >
                      {pregunta}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Barra de Entrada / Input */}
          <div className="p-3 bg-white border-t border-purple-100 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu pregunta sobre qué hacer u hospedaje..."
              className="flex-1 bg-neutral-50 border border-neutral-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-purple-600 placeholder:text-neutral-400 transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
