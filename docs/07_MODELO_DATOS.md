# 07. Modelo de Datos y Entidades — Agenda Cultural Loja

> **ORM:** Prisma 7 (`prisma/schema.prisma`)  
> **Driver:** `@prisma/adapter-mariadb`  
> **Motor:** MariaDB 10+ / MySQL en StackCP

---

## 1. Esquema Relacional de Entidades

```
 ┌────────────────┐         1:N         ┌───────────────┐
 │   Categoria    ├─────────────────────┤    Evento     │
 └────────────────┘                     └───────┬───────┘
                                                │
 ┌────────────────┐         1:N                 │ 1:N (Por tipo y plataforma)
 │      Zona      ├─────────────────────┘       │
 └────────────────┘                             ▼
                                        ┌────────────────────────┐
                                        │  PublicacionRedSocial  │
                                        └───────────┬────────────┘
                                                    │
                                                    │ 1:N
                                                    ▼
                                        ┌────────────────────────┐
                                        │   MetricaPublicacion   │
                                        └────────────────────────┘

 ┌────────────────┐         1:N         ┌───────────────────┐
 │     Aliado     ├─────────────────────┤ AliadoHabitacion  │
 └───────┬────────┘                     └───────────────────┘
         │
         │ 1:N
         ▼
 ┌────────────────────────┐
 │   SolicitudReserva     │
 └───────────▲────────────┘
             │ 1:N
 ┌───────────┴────────────┐         1:N         ┌───────────────────┐
 │      ChatSession       ├─────────────────────┤    ChatMessage    │
 └────────────────────────┘                     └───────────────────┘

 ┌────────────────────────┐         1:N         ┌───────────────────┐
 │       PostSocial       ├─────────────────────┤   ModeracionLog   │
 └────────────────────────┘                     └───────────────────┘

 ┌────────────────────────┐                     ┌───────────────────┐
 │     SistemaConfig      │                     │  HallazgoSemanal  │
 └────────────────────────┘                     └───────────────────┘
```

---

## 2. Descripción de Entidades Principales

### 1. `eventos` (Cartelera Principal)
- `id` (Int, PK)
- `nombre` (VarChar 255), `slug` (VarChar 300, UNIQUE)
- `fecha` (DateTime UTC - 17:00Z cuando no tiene hora específica)
- `horaDefinida` (Boolean, default `true`): Indica si el evento traía una hora real o si se fijó mediodía por defecto.
- `fechaFin` (DateTime UTC, opcional)
- `lugar` (VarChar 255), `descripcion` (Text)
- `imagenUrl` (VarChar 500 - CDN), `multimedia` (Json array de fotos)
- `videoUrl` (VarChar 500 - MP4 para Reels), `mapaUrl` (VarChar 500)
- `hashDeduplicacion` (VarChar 64, UNIQUE): `SHA256(nombre_normalizado + fecha + lugar)`.
- `estado` (`PENDIENTE`, `APROBADO`, `RECHAZADO`)
- `nombreGestor` (VarChar 200), `institucionRelacionada` (VarChar 150)
- `confianzaClasificacion` (Float, scoring IA 0 a 1)
- `editToken` (VarChar 100, UNIQUE para edición por gestor sin cuenta)
- Relaciones FK: `categoriaId`, `zonaId`.

### 2. `publicaciones_redes_sociales` y `metricas_publicacion`
- `publicaciones_redes_sociales`:
  - `id` (Int, PK), `eventoId` (Int, FK hacia `eventos`).
  - `plataforma` (VarChar 50: `FACEBOOK`, `INSTAGRAM`).
  - `tipo` (VarChar 50: `FEED_POST`, `CAROUSEL`, `REEL`, `STORY`).
  - `programadoAt`, `publicadoAt`, `estado` (`PENDIENTE`, `PROGRAMADO`, `PUBLICADO`, `FALLIDO`, `CANCELADO`).
  - Clave única compuesta: `UNIQUE(eventoId, plataforma, tipo)`.
- `metricas_publicacion`:
  - `id` (Int, PK), `publicacionId` (Int, FK).
  - `alcance`, `likes`, `comentarios`, `guardados` (Save rate de IG), `compartidos`, `clicsEnlace`.
  - `periodo` (`24_HORAS`, `7_DIAS`).

### 3. `sistema_config` (Control Global y Botón de Emergencia)
- `clave` (VarChar 50, UNIQUE): `PAUSA_EMERGENCIA`, `MAX_POSTS_DIARIOS`, `TOPE_URGENCIAS`.
- `valor` (VarChar 255). Leído por el worker, Hermes y el puente antes de cualquier despacho.

### 4. `moderacion_log` (Medición Continua del Worker)
- `id` (Int, PK), `postId` (Int), `eventoId` (Int).
- `accion` (`AUTO_APROBADO`, `APROBADO_MANUAL`, `EDITADO`, `RECHAZADO`).
- `usuario` (`SISTEMA_AUTO_PUBLISH` o nombre del moderador).
- `camposEditados` (Json), `confianzaIA` (Float).

---

## 3. Ejemplo Real de Payload JSON de un Evento (Alineado a ADR-004)

```json
{
  "id": 89,
  "nombre": "Festival Internacional de Artes Vivas Loja 2026",
  "slug": "festival-artes-vivas-loja-2026",
  "fecha": "2026-11-14T17:00:00.000Z",
  "horaDefinida": false,
  "fechaFin": "2026-11-24T03:00:00.000Z",
  "lugar": "Teatro Nacional Benjamín Carrión y Plazas de Loja",
  "descripcion": "El mayor festival de artes vivas del Ecuador reúne a elencos nacionales e internacionales...",
  "imagenUrl": "https://culturallojablog.b-cdn.net/eventos/artes-vivas-portada.jpg",
  "multimedia": [
    "https://culturallojablog.b-cdn.net/eventos/artes-vivas-portada.jpg",
    "https://culturallojablog.b-cdn.net/eventos/artes-vivas-programa.jpg"
  ],
  "videoUrl": "https://culturallojablog.b-cdn.net/reels/artes-vivas-trailer.mp4",
  "mapaUrl": "https://maps.google.com/?q=-3.99313,-79.20422",
  "hashDeduplicacion": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "estado": "APROBADO",
  "nombreGestor": "Municipio de Loja / Ministerio de Cultura",
  "confianzaClasificacion": 0.98,
  "categoria": {
    "id": 5,
    "slug": "artes-vivas",
    "nombre": "Artes Vivas"
  },
  "zona": {
    "id": 1,
    "nombre": "El Sagrario",
    "tipo": "URBANA"
  }
}
```
