# 04. Agente Hermes — Director General de Crecimiento

> **Ubicación en el VPS:** `/root/agenda-cultural/vps/agenda-cultural-bot-v2.py` & `hermes_agenda_brain.py`  
> **Nombre del Contenedor Docker:** `agenda-cultural-bot` (Puerto interno 8092)  
> **Rol:** Director General Autónomo de Crecimiento (SEO, analítica y optimización de contenido).

---

## 1. Misión y Alcance Técnico

Hermes opera como el cerebro analítico y de estrategia para Agenda Cultural Loja:
1. **Recepción y Supervisión:** Escucha eventos aprobados para estructurar la estrategia de contenidos, títulos con alto CTR y guiones complementarios.
2. **Generación con LLM:** Utiliza Gemini (`gemini-2.5-flash`) bajo un System Prompt riguroso diseñado para maximizar el guardado y compartido en redes sociales y la optimización de intenciones de búsqueda local.
3. **Integración con Google Search Console (GSC):** Conexión vía cuenta de servicio (`gsc_credentials.json`) con permisos `https://www.googleapis.com/auth/webmasters` para consultar impresiones, CTR y posiciones orgánicas.
4. **Coordinación con Puente de Redes:** Lee la data de engagement (likes, alcance, guardados) desde `https://redes-sociales-l5q4.vercel.app` para retroalimentar la generación futura.

---

## 2. Prompts de Sistema y Comandos de Control

En `hermes_agenda_brain.py`, Hermes posee la siguiente identidad de sistema:
- **Rol:** *Director General, de Crecimiento y Estrategia de Agenda Cultural Loja*.
- **Directivas Clave del Prompt:**
  - *"Transformar a Agenda Cultural Loja en el epicentro absoluto de eventos y cultura del sur del Ecuador"*.
  - *"Nuestros posts de imagen deben ser excepcionales: el hook debe detener el pulgar e incitar a GUARDAR y COMPARTIR"*.
  - *"Entregar siempre a César un Guion Express de Reel (30 seg) con gancho y llamada a la acción"*.
- **Comandos Clave de WhatsApp (enviados a César):**
  - `SI`: Aprueba la propuesta de copy/estrategia generada.
  - `NO`: Descarta la propuesta.
  - `REEL`: Solicita la generación de un guion de video vertical de 15 a 30 segundos.
  - `CAMBIO [instrucción]`: Regenera los copys ajustándose a las indicaciones del usuario.
- **Botón de Emergencia:** Comando `PAUSA` que actualiza `PAUSA_EMERGENCIA = true` en la tabla `sistema_config` para suspender toda actividad.

---

## 3. Estado de Verificación de Credenciales (Honestidad Técnica)

- **Search Console API:** Credencial `gsc_credentials.json` presente en VPS con permisos `chmod 600`.
- **Puente Meta Graph:** Administrado por el scheduler central en Vercel, poseedor de los tokens de Meta Business para Agenda Cultural Loja.
