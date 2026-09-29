# 17. Arquitectura Modular del Cerebro Autónomo de Hermes

> **Ubicación en el VPS:** `/root/agenda-cultural/vps/hermes_core/`  
> **Principio de Diseño:** Cero monolitos gigantes. Separación en módulos desacoplados y testeables de menos de 250 líneas cada uno.

---

## 1. Estructura de Paquetes (`hermes_core/`)

```
vps/
├── hermes_core/
│   ├── __init__.py                # Inicialización del paquete y exports limpios
│   ├── config.py                  # Variables de entorno, llaves API y flags de control
│   │
│   ├── memory/                    # Sistema de Memoria y Estado
│   │   ├── __init__.py
│   │   ├── db_client.py           # Conexión asíncrona a MariaDB (PyMySQL/aiomysql)
│   │   ├── learning_store.py      # Lectura y guardado de HallazgoSemanal y MetricaPublicacion
│   │   └── emergency_switch.py    # Consulta del flag PAUSA_EMERGENCIA en sistema_config
│   │
│   ├── playbook/                  # Reglas precargadas y fórmulas de crecimiento
│   │   ├── __init__.py
│   │   ├── meta_rules.py          # Reglas del algoritmo de Meta (Saves, Shares, formato JPEG 4:5)
│   │   └── local_seo_rules.py     # Plantillas Title, Meta Description y Slugs para Loja
│   │
│   ├── generation/                # Generación Cognitiva con LLM
│   │   ├── __init__.py
│   │   ├── prompts.py             # System prompts dinámicos (inyectan aprendizajes de la semana)
│   │   ├── copy_generator.py      # Generador de copys para Facebook e Instagram (3 actos)
│   │   └── reel_script_gen.py     # Generador del guion express de 15-30s para video vertical
│   │
│   ├── analytics/                 # Lectura y Diagnóstico de Datos
│   │   ├── __init__.py
│   │   ├── gsc_service.py         # Cliente Google Search Console (clics, impresiones, queries)
│   │   └── redes_bridge_client.py # Cliente hacia el puente Vercel (lectura de métricas de engagement)
│   │
│   └── loop/                      # Bucle de Aprendizaje y Optimización
│       ├── __init__.py
│       └── weekly_optimizer.py    # Cron dominical: evalúa qué funcionó y actualiza la memoria
│
└── agenda-cultural-bot-v2.py      # Servidor FastAPI delgado que orquesta los módulos
```

---

## 2. Responsabilidad de Cada Módulo

1. **`memory/emergency_switch.py`:**
   - Lee `sistema_config` antes de cada acción. Si `PAUSA_EMERGENCIA == true`, detiene la ejecución inmediatamente.
2. **`memory/learning_store.py`:**
   - Recupera el último `HallazgoSemanal`. Si el último hallazgo indica *"Los posts que empiezan con pregunta de plan tuvieron +45% de guardados"*, ese texto se inyecta como directiva en el prompt.
3. **`playbook/meta_rules.py`:**
   - Valida que el copy incluya llamada a la acción para guardar/compartir y que el afiche esté en relación 4:5.
4. **`generation/copy_generator.py`:**
   - Combina los datos del evento + el Playbook + los aprendizajes de la memoria para generar la propuesta editorial.
5. **`analytics/redes_bridge_client.py`:**
   - Consulta periódicamente `https://redes-sociales-l5q4.vercel.app/api/external/...` para descargar métricas reales de los posts.
6. **`loop/weekly_optimizer.py`:**
   - Compara las métricas de los eventos de la semana, identifica el post ganador y redacta el nuevo aprendizaje en MariaDB.
