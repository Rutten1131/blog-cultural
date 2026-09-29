# 09. Estrategia Editorial, Reglas y Niveles de Autonomía

> **Propósito:** Definir los límites éticos, editoriales y operativos para la operación autónoma de Agenda Cultural Loja.

---

## 1. Guía Editorial y de Comunicación

1. **Voz y Personalidad:**
   - Hospitalario, dinámico, culto, claro y profundamente arraigado en la identidad de Loja y su provincia.
   - Uso de emojis bien dosificados: 🎭 (arte/teatro), 🎷 (música), 📍 (ubicación), 📅 (fecha), ⏰ (hora), ✨ (destacado).
2. **Hashtags Canónicos Obligatorios:**
   - Siempre presentes en cada post social: `#AgendaCultural #Loja #CulturaLoja #EventosLoja` + hashtag de la categoría temática (`#Musica`, `#Teatro`, `#ArtesVivas`, etc.).
3. **Manejo Estricto de Fechas y Horas:**
   - Ecuador continental es **UTC-5 todo el año** (`America/Guayaquil`).
   - Si un evento no tiene hora exacta confirmada, **se omite la línea de hora** en el copy en lugar de imprimir una hora falsa (evitando inventar "12:00").
4. **Temas Prohibidos (Blacklist Editorial):**
   - Política partidista o campañas electorales.
   - Polémicas locales, notas rojas o sucesos judiciales.
   - Contenido explícito no apto para todo público.

---

## 2. Niveles de Autonomía Confirmados

| Nivel | Grado de Autonomía | Comportamiento en Producción | Estado Actual |
|---|---|---|---|
| **Nivel 1** | **Asistido / Copiloto** | El worker y Hermes redactan borradores, sugieren copys y clasifican; un moderador aprueba en `/admin` o por WhatsApp. | Superado |
| **Nivel 2** | **Auto-Aprobación Fluida (Vigente)** | Eventos detectados con **confianza IA ≥ 0.50**, afiche nítido en CDN, lugar real y fecha futura válida **se publican automáticamente en la web y se programan en Facebook e Instagram**. Los casos dudosos quedan pendientes. | **OPERATIVO** |
| **Nivel 3** | **Autónomo Estratégico** | Publicación continua, lectura en bucle de métricas de Meta y GSC para generar páginas evergreen, responder comentarios frecuentes y optimizar horas de publicación según engagement real. | **EN DESARROLLO** |

---

## 3. Mecanismos de Seguridad y Botón de Emergencia

- **Límite Diario Estándar:** 5 eventos por día en redes sociales.
- **Excepción de Urgencia Abierta:** Si un evento es para **MAÑANA**, se habilita un cupo adicional (permitiendo 6 o más publicaciones) para no perder la difusión de eventos inmediatos.
- **Comando de Emergencia (`PAUSA`):** Mensaje o flag que detiene inmediatamente el despacho de nuevos posts a redes sociales y desactiva el scheduler.
- **Auditoría Transparente:** Cada post social guarda quién lo moderó (`SISTEMA_AUTO_PUBLISH` o usuario humano) y el desglose de confianza y fuentes.
