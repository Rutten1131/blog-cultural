# 15. Prohibiciones, Restricciones y Lecciones Aprendidas

> **Audiencia:** Desarrolladores, Hermes Engine & Asistentes de IA.  
> **Propósito:** Evitar la repetición de errores pasados y mantener invariantes técnicas críticas.

---

## 1. Lo que NUNCA se debe hacer (Restricciones Críticas)

1. **NUNCA usar `new Date("YYYY-MM-DD")` directamente en código nuevo:**
   - La interpretación de fechas sin zona horaria desfasa los eventos un día antes debido al huso horario UTC-5. Siempre se debe emplear `lib/fechas.ts` con hora fija a mediodía (17:00Z).
2. **NUNCA publicar imágenes crudas en WebP o AVIF en Meta Graph API:**
   - Instagram rechaza de forma estricta los archivos que no sean `image/jpeg` o cuyas proporciones queden fuera del rango 4:5 a 1.91:1. El puente o el worker deben derivar siempre una copia JPEG 4:5.
3. **NUNCA publicar URLs de CDN temporales de Facebook o Instagram:**
   - Las URLs originales de Meta caducan en días por parámetros de firma de seguridad (`&oe=...`). Toda imagen debe re-hospedarse en Bunny CDN antes de guardarse en base de datos.
4. **NUNCA inventar una hora cuando el evento no la especifica:**
   - Si no hay hora confirmada, se omite el renglón `⏰ Hora:` en el caption de redes y en la ficha web en lugar de publicar un ficticio "12:00".
5. **NUNCA borrar las URLs de eventos pasados (evitar 404):**
   - Los eventos que ya concluyeron deben mantenerse en la web con el distintivo de `FINALIZADO / PASADO` para no destruir la autoridad SEO del enlace y redirigir al visitante a eventos futuros.
6. **NUNCA mapear puertos de servicios internos en `0.0.0.0`:**
   - En el VPS, los contenedores `whatsapp-worker` (8083), `evolution-api` (8080) y `hermes-agenda` (8092) deben mapearse a `127.0.0.1` para impedir accesos no autorizados desde internet.
7. **NUNCA publicar sin verificar la regla de idempotencia:**
   - El sistema debe verificar que no exista una publicación previa para el mismo `eventoId` y tipo de formato en `publicaciones_redes_sociales`.
