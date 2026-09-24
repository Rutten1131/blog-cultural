# Worker de WhatsApp para Agenda Cultural Loja

## Descripción

Este worker:
1. Escucha mensajes del grupo de WhatsApp "Eventos de Loja"
2. Extrae URLs de los mensajes
3. Visita las URLs para extraer información
4. Determina si son eventos culturales de Loja
5. Guarda los posts en la BD para moderación
6. NO envía mensajes de vuelta al grupo (modo solo escucha)

## Estructura

```
whatsapp-worker/
├── Dockerfile          # Configuración del contenedor
├── docker-compose.yml  # Configuración del servicio
├── worker.js           # Worker principal
├── lib/
│   ├── url-extractor.js  # Extrae URLs y visita páginas
│   └── classifier.js     # Clasifica con IA si es evento
├── .env                # Variables de entorno
├── deploy.sh           # Script de deploy para Linux
└── deploy.ps1          # Script de deploy para Windows
```

## Requisitos

- Docker instalado en el VPS
- Node.js 20+ (en el Dockerfile)
- Puppeteer (para scraping)
- Prisma (para BD)
- Evolution API configurada

## Configuración

1. Copiar el archivo `.env` con las variables necesarias
2. Ejecutar `docker-compose up -d` para levantar el servicio
3. Verificar en `http://localhost:8083/health`

## Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Verifica que el worker está corriendo |
| `/webhook/whatsapp` | POST | Recibe mensajes del grupo de WhatsApp |
| `/scrape/manual` | POST | Scrapea URLs manualmente |
| `/posts` | GET | Lista posts pendientes de moderación |
| `/posts/:id` | PATCH | Actualiza estado de un post |
| `/setup/webhook` | POST | Configura el webhook en Evolution API |

## Despliegue

1. Ejecutar `./deploy.sh` (Linux) o `./deploy.ps1` (Windows)
2. Verificar logs con `docker logs whatsapp-worker`

## Notas

- El worker usa Puppeteer para visitar URLs y extraer información
- La clasificación con IA usa Groq API (llama3-8b-8192)
- Los posts se guardan en la BD con estado "PENDIENTE" para moderación
- El webhook se configura automáticamente en Evolution API
- El servicio se reinicia automáticamente si falla

## Próximos pasos

- Crear panel admin para moderar posts
- Integrar con el bot de WhatsApp existente
- Añadir más fuentes de scraping (Facebook, Instagram)

## Contacto

Para soporte: contactar a Abel en el grupo de WhatsApp