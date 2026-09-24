"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";


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
  telefono?: string | null;
  websiteUrl?: string | null;
  redesUrl?: string | null;
  imagenUrl?: string | null;
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
  time: string;
}

const PREGUNTAS_SUGERIDAS = [
  "🏨 ¿Dónde me puedo hospedar en Loja?",
  "🌿 Lugares de naturaleza cerca",
  "🎭 ¿Qué hacer hoy en la ciudad?",
  "☕ ¿Dónde tomar un buen café lojano?",
];

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                      : "bg-white border border-purple-100 text-neutral-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 px-1 font-medium">{m.time}</span>

                {/* TARJETAS DE EVENTOS RECOMENDADOS CON BOTÓN DIRECTO */}
                {m.eventos && m.eventos.length > 0 && (
                  <div className="w-full mt-3 space-y-2.5">
                    <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
                      <span>🎭 Eventos Destacados en Cartelera:</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar snap-x">
                      {m.eventos.map((evento) => (
                        <div
                          key={evento.id}
                          className="min-w-[250px] max-w-[270px] bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-lg shadow-purple-900/5 flex flex-col justify-between snap-start"
                        >
                          {evento.imagenUrl ? (
                            <div className="relative h-28 w-full bg-purple-50">
                              <img
                                src={evento.imagenUrl}
                                alt={evento.nombre}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-full bg-gradient-to-r from-purple-100 to-pink-50 flex items-center justify-center text-2xl">
                              🎭
                            </div>
                          )}

                          <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h4 className="font-bold text-neutral-900 text-xs leading-snug line-clamp-2">
                                {evento.nombre}
                              </h4>
                              <div className="mt-1.5 space-y-0.5 text-[11px] text-neutral-600">
                                <p className="flex items-center gap-1 text-purple-700 font-semibold">
                                  <span>📅</span> {new Date(evento.fecha).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                                <p className="flex items-center gap-1 text-neutral-500 truncate">
                                  <span>📍</span> {evento.lugar}
                                </p>
                              </div>
                            </div>

                            <a
                              href={`/eventos/${evento.slug}`}
                              className="w-full py-2 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
                            >
                              <span>🎟️</span> Ver Evento Completo
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ESCENARIO B2B: TARJETAS COMPACTAS DE ALIADOS (LAS 3 VISIBLES SIN SCROLL) */}
                {m.aliados && m.aliados.length > 0 && (
                  <div className="w-full mt-3 space-y-3">
                    <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
                      <span>⭐ Opciones Recomendadas en Loja:</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 items-stretch">
                      {m.aliados.slice(0, 3).map((aliado) => (
                        <div
                          key={aliado.id}
                          className="bg-white border border-purple-100 rounded-xl overflow-hidden shadow-md shadow-purple-900/5 flex flex-col min-w-0"
                        >
                          {/* Foto del Hotel/Comercio */}
                          <div className="relative h-20 w-full bg-purple-50 shrink-0">
                            {aliado.imagenUrl ? (
                              <img
                                src={aliado.imagenUrl}
                                alt={aliado.nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center text-2xl">
                                🏨
                              </div>
                            )}
                            <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] text-purple-800 font-bold border border-purple-200 shadow-sm">
                              ⭐ Aliado
                            </div>
                            {aliado.rangoPrecio && (
                              <div className="absolute bottom-1 right-1 bg-gradient-to-r from-purple-700 to-pink-600 text-white font-bold px-1.5 py-0.5 rounded text-[9px] shadow-md">
                                {aliado.rangoPrecio}
                              </div>
                            )}
                          </div>

                          {/* Info Compacta */}
                          <div className="p-2 flex-1 flex flex-col justify-between gap-1.5 min-w-0">
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-bold text-neutral-900 text-[10px] leading-tight line-clamp-2">
                                {aliado.nombre}
                              </h4>
                              {aliado.descripcion && (
                                <p className="text-[9px] text-neutral-600 leading-snug line-clamp-3">
                                  {aliado.descripcion}
                                </p>
                              )}

                              <div className="space-y-0.5 text-[9px] leading-snug text-neutral-700">
                                {aliado.ubicacion && (
                                  <p className="line-clamp-2">
                                    <span>📍</span> {aliado.ubicacion}
                                  </p>
                                )}
                                {aliado.cuartos && (
                                  <p className="text-purple-800 font-medium line-clamp-2">
                                    <span>🛏️</span> {aliado.cuartos}
                                  </p>
                                )}
                                {aliado.servicios && (
                                  <p className="text-neutral-500 line-clamp-2">
                                    <span>✨</span> {aliado.servicios}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Botones de Acción Comercial */}
                            <div className="pt-1.5 border-t border-purple-100 flex flex-col gap-1">
                              {aliado.telefono && (
                                <a
                                  href={`https://wa.me/${aliado.telefono.replace(
                                    /\D/g,
                                    ""
                                  )}?text=${encodeURIComponent(
                                    `¡Hola! Vi a ${aliado.nombre} en la Agenda Cultural de Loja. Quisiera consultar disponibilidad y reservar.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Reservar por WhatsApp"
                                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded-lg flex items-center justify-center gap-1 transition-all shadow-sm shadow-emerald-700/20"
                                >
                                  <span>💬</span> Reservar
                                </a>
                              )}

                              <div className="flex gap-1">
                                {aliado.mapaUrl && (
                                  <a
                                    href={aliado.mapaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Ver ubicación en el mapa"
                                    className="flex-1 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-md flex items-center justify-center border border-purple-100 transition-all"
                                  >
                                    📍
                                  </a>
                                )}
                                {aliado.websiteUrl && (
                                  <a
                                    href={aliado.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Sitio web"
                                    className="flex-1 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold rounded-md flex items-center justify-center border border-pink-100 transition-all"
                                  >
                                    🌐
                                  </a>
                                )}
                                {aliado.redesUrl && (
                                  <a
                                    href={aliado.redesUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Redes sociales"
                                    className="flex-1 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-md flex items-center justify-center border border-neutral-200 transition-all"
                                  >
                                    📱
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ESCENARIO B2G: RECOMENDACIÓN CANTONAL CRUZADA (NATURALEZA / PARROQUIAS) */}
                {m.atractivos && m.atractivos.length > 0 && (
                  <div className="w-full mt-3 space-y-3">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
                      <span>🌿 Atractivos Cantonales Sugeridos:</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar snap-x">
                      {m.atractivos.map((atractivo) => (
                        <div
                          key={atractivo.id}
                          className="min-w-[260px] max-w-[280px] bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-lg shadow-emerald-950/5 flex flex-col justify-between snap-start"
                        >
                          <div className="relative h-32 w-full bg-emerald-50">
                            {atractivo.imagenUrl ? (
                              <img
                                src={atractivo.imagenUrl}
                                alt={atractivo.nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center text-3xl">
                                🏞️
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-md text-[10px]">
                              📍 Cantón {atractivo.canton}
                            </div>
                          </div>

                          <div className="p-3.5 space-y-2">
                            <h4 className="font-bold text-neutral-900 text-sm">{atractivo.nombre}</h4>
                            <p className="text-[11px] text-neutral-600 line-clamp-2">
                              {atractivo.descripcion}
                            </p>
                            <div className="bg-emerald-50/60 p-2 rounded-xl text-[11px] space-y-1 border border-emerald-100/60">
                              <p className="text-emerald-800 font-bold">
                                ⏱️ {atractivo.distancia}
                              </p>
                              <p className="text-neutral-600">
                                🚗 <strong className="text-neutral-800">Ruta:</strong> {atractivo.ruta}
                              </p>
                            </div>

                            {atractivo.mapaUrl && (
                              <a
                                href={atractivo.mapaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm"
                              >
                                <span>🗺️</span> Ver Ruta en Google Maps
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-neutral-500 text-xs italic bg-purple-50/70 p-3 rounded-2xl w-fit border border-purple-100">
                <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                <span>Consultando información turística y aliados de Loja...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas Clickables */}
          <div className="p-2.5 bg-neutral-50/80 border-t border-purple-100/80 flex gap-1.5 overflow-x-auto no-scrollbar">
            {PREGUNTAS_SUGERIDAS.map((pregunta, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pregunta)}
                className="px-3 py-1.5 bg-white hover:bg-purple-50 text-neutral-700 hover:text-purple-700 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border border-purple-200/70 shadow-sm shrink-0 cursor-pointer"
              >
                {pregunta}
              </button>
            ))}
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
