# 05. Automatización de Redes Sociales (Facebook e Instagram)

> **Mecanismo de Despacho:** Puente en Vercel (`https://redes-sociales-l5q4.vercel.app`)  
> **API de Destino:** Meta Graph API (Página oficial de Facebook e Instagram Business de Agenda Cultural Loja)  
> **Módulos Locales:** `lib/redesSociales.ts` & `vps/whatsapp-worker/lib/redes-sociales-worker.js`

---

## 1. Reglas de Publicación, Límites Diarios y Topes de Urgencia

1. **Límite Diario Estándar:** Base de **5 eventos por día** programados en Facebook e Instagram.
2. **Excepción de Urgencia con Tope Duro (Anti-Saturación):**
   - Si un evento ocurre **MAÑANA** o en menos de 24 horas y los 5 cupos del día están ocupados, el sistema habilita cupos adicionales con un **TOPE DURO DE 7 PUBLICACIONES/DÍA**.
   - No se publican más de 7 eventos en un mismo día bajo ninguna circunstancia para evitar penalizaciones por spam en el algoritmo de Meta.
3. **Regla de Caducidad Estricta:**
   - **No publicar eventos que comiencen en menos de 3 horas o que ya hayan finalizado.** Si un evento es detectado con retraso, se omite de redes sociales para no generar publicaciones obsoletas.
4. **Control de Zona Horaria (Invariante Loja UTC-5):**
   - El conteo de cupos se realiza estrictamente en el huso horario de Ecuador (`America/Guayaquil`), calculando el día natural desde las 00:00:00 hasta las 23:59:59 (UTC-5).
5. **Idempotencia y Formatos:**
   - Se controla que no se dupliquen publicaciones del mismo evento para el mismo formato (Feed, Carrusel, Reel). Las Stories y Reels de recordatorio no consumen cupo del Feed principal si se configuran como efímeras.

---

## 2. Requisitos Técnicos Estrictos de Imágenes para Meta Graph API

| Parámetro | Requisito Meta Graph API | Manejo en el Sistema |
|---|---|---|
| **Formato de Archivo** | Solo **JPEG** (`image/jpeg`) para publicaciones de Feed en Instagram. | Toda imagen original (incluso si en la web se usa WebP/AVIF) se convierte o sirve en JPEG desde el CDN para el webhook de redes. |
| **Relación de Aspecto (Aspect Ratio)** | Entre **4:5 (0.80 vertical)** y **1.91:1 (horizontal)**. | Los afiches verticales de teatro/conciertos (~A4, ratio 0.71) deben ajustarse con lienzo/relleno a 4:5 para no ser rechazados. |
| **Resolución Máxima / Mínima** | Ancho mínimo: 320px; recomendado: 1080px. | Las fotos extraídas de carruseles de Instagram se capturan en su máxima resolución original desde el JSON. |

---

## 3. Video y Reels

- La Graph API para Reels exige una **URL directa a un archivo de video MP4** (no enlaces embebidos de YouTube).
- El flujo para Reels contempla la compilación con FFmpeg en el VPS a partir del afiche + audio cultural, generando un `.mp4` vertical (9:16) alojado en Bunny CDN antes de despacharse al puente de Vercel.
