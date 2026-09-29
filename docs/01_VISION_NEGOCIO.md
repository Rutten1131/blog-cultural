# 01. Visión y Contexto del Negocio — Agenda Cultural Loja

> **Audiencia:** Claude Projects (Memoria Maestra), Hermes Engine & Desarrolladores.  
> **Estado:** PRODUCCIÓN ACTIVA.  
> **Hosting Web:** Vercel (`https://www.agendaculturalloja.com` con redirección 301 desde `agendacultural-loja.com`).  
> **Alcance Geográfico Oficial:** **TODA LA PROVINCIA DE LOJA** (Cantón central de Loja con sus 19 parroquias urbanas y rurales, más los 15 cantones provinciales: Catamayo, Saraguro, Paltas, Calvas, Puyango, Macará, Celica, etc.).

---

## 1. Misión y Propósito
**Agenda Cultural Loja** es la plataforma tecnológica y cultural oficial y colaborativa que centraliza la cartelera artística, el turismo provincial, los eventos cantonales y la red de comercio y hospitalidad de Loja, Ecuador.

### Objetivos Fundamentales:
1. **Cartelera Provincial Unificada:** Agrupar en tiempo real eventos de todo el territorio lojano (tanto del cantón capital como de cantones hermanos).
2. **Posicionamiento Orgánico 100% en Google (SEO Canónico):** Convertir el sitio en la fuente de verdad en los motores de búsqueda mediante datos estructurados `Schema.org/Event`, sitemap dinámico conectado a Search Console y páginas temáticas "evergreen".
3. **Automatización Integral de Redes Sociales:** Extracción desatendida y publicación fluida en Facebook e Instagram para alimentar el ecosistema cultural sin depender de tareas manuales repetitivas.
4. **Asistente Virtual Turístico Orgánico:** Guiar a visitantes locales y extranjeros con geolocalización precisa, recomendando aliados comerciales por proximidad de forma natural e integrada.

---

## 2. Personas Clave y Roles

| Nombre / Rol | Responsabilidad en el Sistema |
|---|---|
| **César / Director & Supervisor** | Propietario del proyecto. Supervisa los dashboards, el rendimiento general y recibe notificaciones de control. |
| **Hermes Engine / Hermes v2.0** | Agente director de crecimiento en VPS: monitorea SEO (GSC), métricas de redes, genera copys y coordina la auto-publicación. |
| **WhatsApp Worker** | Recolector silencioso en VPS: rastrea grupos comunitarios, aplica visión computacional con Gemini en afiches y auto-publica eventos calificados. |
| **Puente de Redes Sociales (Vercel)** | Servicio webhook dedicado (`redes-sociales-l5q4.vercel.app`) que custodia los tokens de Meta Graph API y ejecuta la publicación directa a Facebook e Instagram. |
| **Super Administrador** | Acceso en `/superadmin` para la gestión de **Aliados Comerciales** (hoteles, gastronomía) y auditoría del **CRM de Conversaciones**. |
| **Gestores Culturales / Artistas** | Publican eventos vía formulario público (`/publicar`) recibiendo un `editToken` para actualizaciones desatendidas. |

---

## 3. Modelo de Negocio y Monetización

1. **Red de Aliados Comerciales (B2B):**
   - Directorio de establecimientos (`HOSPEDAJE`, `GASTRONOMIA`, `CAFETERIA`, `EXPERIENCIA`, `TRANSPORTE`, `CULTURA_ARTE`, etc.).
   - Recomendación orgánica por cálculo Haversine de cercanía geográfica desde el Chatbot Turístico (sin etiquetas forzadas de patrocinio para preservar la experiencia genuina del usuario).
2. **Turismo Cantonal y B2G:**
   - Difusión de festividades y rutas cantonales enlazadas a los atractivos de la provincia.
3. **Banners Patrocinados:**
   - Carrusel administrable en el Hero de la portada.

---

## 4. Tono Editorial y Pautas de Identidad

- **Personalidad:** Cálida, hospitalaria, artística, contemporánea y orgullosa del patrimonio lojano ("Loja, Capital Cultural del Ecuador").
- **Estilo Visual en Redes Sociales:** Cumplimiento estricto con las especificaciones de Meta: imágenes derivadas en **formato JPEG** y relación de aspecto compatible (**4:5 vertical o 1:1 cuadrado**), impidiendo que afiches WebP o proporciones no soportadas sean rechazados por la Graph API.
