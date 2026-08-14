-- =============================================================================
-- MIGRACIÓN DE DATOS — Fechas de eventos existentes
-- =============================================================================
--
-- CONTEXTO (2026-08-14):
-- Los 54 eventos existentes fueron creados con fechas a "00:00:00 UTC",
-- que interpretadas en zona horaria de Loja (UTC-5) equivalen al DÍA ANTERIOR
-- a las 19:00 hora Ecuador.
--
-- Ejemplo real: "Noches de ferias" — el gestor quiso publicar el 2026-08-14
-- pero quedó guardado como 2026-08-13 19:00 EC (off-by-one de 1 día).
--
-- SOLUCIÓN:
-- Cambiar la hora almacenada de "00:00:00 UTC" → "17:00:00 UTC" (= 12:00 EC
-- del mismo día). Esto es semánticamente neutro:
--   - No asumimos qué hora específica quiso el gestor.
--   - El día calendario (en zona Loja) NO cambia → el evento sigue apareciendo
--     en la misma fecha que el gestor vio al publicarlo.
--   - Se interpreta como mediodía de Loja (instante más neutro del día).
--
-- EFECTO:
--   - Eventos del 14/08 EC almacenados como 14/08 00:00 UTC → pasan a 14/08 12:00 EC
--   - Eventos futuros o pasados NO se ven afectados (sigues siendo futuro/pasado)
--   - El orden de eventos por fecha NO cambia (siguen ordenados por día)
--
-- IDEMPOTENCIA:
--   WHERE TIME(fecha) = '00:00:00' → solo afecta filas con hora UTC midnight.
--   Filas que ya tengan otra hora (ej. eventos nuevos creados con la app
--   arreglada) NO se tocan.
--
-- EJECUCIÓN:
--   mysql -h HOST -u USER -p DB < scripts/migrar-fechas.sql
--   O desde un cliente SQL gráfico.
--
-- REVERSIÓN:
--   UPDATE eventos SET fecha = DATE_SUB(fecha, INTERVAL 17 HOUR)
--   WHERE TIME(fecha) = '17:00:00';
--
-- =============================================================================

-- Dry-run: muestra qué filas se afectarían (NO ejecuta nada)
SELECT id, nombre, fecha, TIME(fecha) AS hora_utc_actual
FROM eventos
WHERE TIME(fecha) = '00:00:00'
ORDER BY fecha;

-- Una vez confirmado que las filas son correctas, descomentar la siguiente
-- línea para aplicar la migración:

-- UPDATE eventos SET fecha = DATE_FORMAT(fecha, '%Y-%m-%d 17:00:00')
-- WHERE TIME(fecha) = '00:00:00';

-- Verificación post-migración (descomentar después de aplicar):
-- SELECT id, nombre, fecha, TIME(fecha) AS hora_utc_nueva
-- FROM eventos
-- ORDER BY fecha;