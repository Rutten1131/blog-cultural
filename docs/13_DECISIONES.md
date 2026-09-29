# 13. Registro de Decisiones de Arquitectura (ADR)

> **Propósito:** Documentar el sustento técnico y estratégico de cada decisión estructural del sistema.

---

## ADR-001: Adopción de Polling en lugar de Webhooks para el WhatsApp Worker
- **Contexto:** Evolution API v2 admite un único endpoint de webhook global por instancia.
- **Decisión:** Operar el worker mediante sondeo periódico (polling cada 15 minutos) a través de `/chat/findMessages/`.
- **Resultado:** Aislamiento total, evitando colisiones con otras aplicaciones comerciales conectadas.

---

## ADR-002: Re-hospedaje Inmediato en Bunny CDN
- **Contexto:** Meta firma las URLs de imágenes con parámetros de caducidad temporal.
- **Decisión:** Descargar todo afiche o carrusel detectado y subirlo a Bunny CDN (`culturallojablog.b-cdn.net`).
- **Resultado:** Enlaces permanentes en la cartelera y compatibilidad garantizada a largo plazo.

---

## ADR-003: Estrategia Dual de LLMs para el Asistente Turístico
- **Contexto:** El Chatbot Turístico atiende consultas en tiempo real.
- **Decisión:** Motor primario con `deepseek-chat` (DeepSeek V3) y failover instantáneo a `llama-3.3-70b-versatile` en Groq API.
- **Resultado:** Disponibilidad continua y respuestas fluidas sin interrupciones.

---

## ADR-004: Invariante Estricto de Zona Horaria (UTC-5)
- **Contexto:** Evitar desfases de fecha ocasionados por la interpretación de cadenas sin hora.
- **Decisión:** Tratar las fechas sin hora como mediodía de Loja (17:00 UTC) y centralizar la lógica en `lib/fechas.ts`.
- **Resultado:** Fechas precisas en web, redes sociales y Schema.org.

---

## ADR-005: Auto-Aprobación Fluida (Umbral de Confianza ≥ 50%)
- **Contexto:** Mantener la cartelera actualizada en tiempo real sin cuellos de botella manuales.
- **Decisión:** Cuando un post tiene título claro, fecha futura válida, lugar físico comprobado e imagen en CDN con confianza `≥ 0.50`, se auto-publica en la web y se programa a redes sociales.
- **Resultado:** Agilidad operativa y cartelera permanentemente nutrida.

---

## ADR-006: Fuente Única de Publicación en Redes (Puente Vercel)
- **Contexto:** Evitar publicar dos veces el mismo evento o dispersar credenciales de Meta Graph API.
- **Decisión:** El servicio en Vercel (`https://redes-sociales-l5q4.vercel.app`) es la **única fuente de verdad** autorizada para ejecutar publicaciones a Facebook e Instagram.
- **Resultado:** Control centralizado de tokens de Meta, prevención de duplicados y acceso a métricas de engagement.

---

## ADR-007: Excepción de Urgencia en Límite Diario de Publicaciones
- **Contexto:** Eventos relevantes de última hora que se realizan al día siguiente no podían esperar si el cupo de 5 posts/día estaba lleno.
- **Decisión:** Habilitar un cupo adicional (permitiendo 6 o más publicaciones) para eventos que se celebren **MAÑANA**.
- **Resultado:** Difusión oportuna sin sacrificar la presencia de eventos urgentes.
