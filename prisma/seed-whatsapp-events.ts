/**
 * Script para transformar los eventos reales del chat de WhatsApp
 * "Agenda Cultural Participativa 2026 🎭🎷" en publicaciones/eventos activos de la plataforma.
 *
 * Ejecución: npx tsx prisma/seed-whatsapp-events.ts
 */

import { PrismaClient, EstadoEvento } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace("/", ""),
});
const prisma = new PrismaClient({ adapter });

function generarSlug(nombre: string, fecha: string, lugar: string): string {
  const raw = `${nombre}-${fecha}-${lugar}`;
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface EventoWhatsApp {
  nombre: string;
  fecha: string; // ISO string
  lugar: string;
  descripcion: string;
  imagenUrl: string;
  multimedia?: string[];
  videoUrl?: string;
  categoriaSlug: string;
  zonaNombre: string;
  nombreGestor: string;
}

const EVENTOS_WHATSAPP: EventoWhatsApp[] = [
  {
    nombre: "Feria del Libro Carlos Carrión",
    fecha: "2026-08-13T10:30:00.000Z",
    lugar: "Plaza de la Cultura, Loja",
    descripcion: `El Municipio de Loja y Editorial Saeta Profunda invitan cordialmente a la ciudadanía a ser parte de la Feria del Libro Carlos Carrión, un espacio para celebrar la literatura, la lectura y el legado de uno de los grandes referentes de las letras lojanas, Carlos Carrión Figueroa, flamante ganador del Premio Nacional Eugenio Espejo 2026.

📖 Colectivos y Editoriales participantes:
• Leo Aquicito
• BookStore Librería
• Sinapsis de Palabras
• Lumbrera Espacio Cultural
• Circuito Creativo de Palabras
• Feria Brote del Sur
• Casa de la Cultura Ecuatoriana Benjamín Carrión – Núcleo de Loja
• Universidad Técnica Particular de Loja (UTPL)

📚 Habrá Book Truck, libros desde $1, firmas de autores y encuentro directo entre lectores y escritores lojanos.`,
    imagenUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.facebook.com/share/p/1azVbNc1iu/?mibextid=wwXIfr",
    categoriaSlug: "ferias",
    zonaNombre: "El Sagrario",
    nombreGestor: "Municipio de Loja y Editorial Saeta Profunda"
  },
  {
    nombre: "Gala de Homenaje: Carlos Carrión Figueroa (Premio Eugenio Espejo 2026)",
    fecha: "2026-08-21T20:00:00.000Z",
    lugar: "Teatro Bolívar, Loja",
    descripcion: `El Municipio de Loja invita a la ciudadanía a ser parte del homenaje solemne al destacado escritor lojano Carlos Carrión Figueroa, galardonado con el Premio Nacional Eugenio Espejo 2026.

Una velada memorable para celebrar su trayectoria, aporte literario y legado a las letras ecuatorianas y lojanas. Contará con intervenciones artísticas, lectura de semblanzas y la participación de la Casa de la Cultura Núcleo de Loja y la academia.

Entrada libre hasta llenar aforo. #LojaEsArteYCultura`,
    imagenUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.facebook.com/share/p/1Bhr3Lg7wA/?mibextid=wwXIfr",
    categoriaSlug: "arte-y-exposiciones",
    zonaNombre: "El Sagrario",
    nombreGestor: "Municipio de Loja"
  },
  {
    nombre: "Presentación: 'Cráneo de mar sobre páramo andino' y Revista Escanzel III",
    fecha: "2026-08-13T19:00:00.000Z",
    lugar: "Lumbrera – Espacio Cultural (Sucre y Lourdes)",
    descripcion: `Jornada especial de literatura y publicaciones independientes en el centro histórico de Loja:

1. Presentación del poemario "Cráneo de mar sobre páramo andino" del poeta Agustín Guambo. Una inmersión en el paisaje andino, la memoria y el territorio.
2. Lanzamiento oficial de la Revista Escanzel #3: "La guerra y la paz", con testimonios, archivo histórico, artes visuales, crónicas y debate.

Al finalizar, círculo de palabra y After literario en el Jardín 5 Elementos con micrófono abierto, proyección holográfica y perreo místico.`,
    imagenUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://drive.google.com/drive/folders/1xVuO6pcW3s87AePrQtoeHE_A942LW5by",
    categoriaSlug: "arte-y-exposiciones",
    zonaNombre: "Sucre",
    nombreGestor: "Equipo Escanzel & Lumbrera Cultural"
  },
  {
    nombre: "Recital Poético: La's Quina Poética",
    fecha: "2026-08-15T19:30:00.000Z",
    lugar: "Lumbrera – Espacio Cultural (Sucre y Lourdes)",
    descripcion: `✨📖 RECITAL POÉTICO: LA’S QUINA POÉTICA 🎙️🌿

Una noche íntima para encontrarnos con la poesía, la palabra viva y las voces de reconocidos autores y creadores lojanos.

🎙️ Participan:
• Paulina Jaramillo
• Arquímides Salinas
• Ángel Avendaño
• Sofía Palacios
• Elvyn Ojeda
• René Pineda
• Patricio Guzmán

Ven a escuchar, compartir y vivir la poesía en voz alta. Entrada libre y gratuita.`,
    imagenUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.instagram.com/p/DcCHvFwlPPl/",
    categoriaSlug: "arte-y-exposiciones",
    zonaNombre: "Sucre",
    nombreGestor: "Lumbrera Espacio Cultural"
  },
  {
    nombre: "Exposición Plástica: 'Palimpsesto' de Óscar Arturo Cuenca",
    fecha: "2026-08-13T11:00:00.000Z",
    lugar: "Casona Cultural de Loja",
    descripcion: `La imagen también escribe. La exposición artística "Palimpsesto" del artista plástico lojano Óscar Arturo Cuenca abre sus puertas en las salas de la Casona Cultural.

Una propuesta plástica que revela capas de memoria, materia, texturas y miradas sobre la identidad y el paso del tiempo.

Permanencia: Del 13 de agosto al 4 de septiembre de 2026.
Ingreso gratuito para todo público. #LojaEsArteYCultura`,
    imagenUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.facebook.com/share/r/17HRms96Lm/?mibextid=wwXIfr",
    categoriaSlug: "arte-y-exposiciones",
    zonaNombre: "El Sagrario",
    nombreGestor: "Casona Cultural / Óscar Cuenca"
  },
  {
    nombre: "Exposición: 'Relicarios: Guardianes de la Memoria' de Bayardo Cuenca",
    fecha: "2026-08-14T11:00:00.000Z",
    lugar: "Museo Puerta de la Ciudad, Loja",
    descripcion: `Muestra artística del destacado Maestro Bayardo Cuenca en el emblemático Museo Puerta de la Ciudad.

"Relicarios: Guardianes de la Memoria" es un viaje escultórico y matérico que resguarda la iconografía, las tradiciones y los testimonios ancestrales de nuestra región.

📅 Permanencia: Del 14 de agosto al 14 de septiembre de 2026.
🎟️ Ingreso libre y gratuito. Organiza: Municipio de Loja.`,
    imagenUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.facebook.com/share/p/1JL9utrejx/?mibextid=wwXIfr",
    categoriaSlug: "arte-y-exposiciones",
    zonaNombre: "El Sagrario",
    nombreGestor: "Municipio de Loja - Museo Puerta de la Ciudad"
  },
  {
    nombre: "Noches de Cine Foro: 'Virgen del Cisne: Más allá del milagro'",
    fecha: "2026-08-19T19:00:00.000Z",
    lugar: "Teatrino de la Casona Cultural, Loja",
    descripcion: `El cine nos invita a mirar, reflexionar y descubrir las historias que forman parte viva de nuestra identidad.

El Municipio de Loja, a través de su agenda cultural, presenta la proyección especial de “Virgen del Cisne: Más allá del milagro”, dirigida por el cineasta José Paúl Moreira. Una producción que profundiza en la devoción, los rituales, la fe y la trascendencia sociocultural de la romería lojana.

🎟️ Entrada libre y gratuita. Foro de preguntas con el director y actores al culminar la función.`,
    imagenUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.instagram.com/p/DcOJZYAvb5v/?igsh=aWd1aWh1dzFta2hp",
    categoriaSlug: "artes-vivas",
    zonaNombre: "El Sagrario",
    nombreGestor: "Municipio de Loja & José Paúl Moreira"
  },
  {
    nombre: "Cine Bajo las Estrellas en la Reserva Zamora Huayco",
    fecha: "2026-08-15T19:00:00.000Z",
    lugar: "Reserva Natural de Zamora Huayco, Loja",
    descripcion: `Hay experiencias que no se miden por la duración de una película, sino por los momentos que dejan. 

Una noche al aire libre para desconectarte del ruido urbano:
🎬 Proyección de cine al aire libre
🔥 Fogata encendida y malvaviscos
🍽️ Cena y piqueos para compartir
🎶 Música acústica en vivo con ukelele
🌌 Cielo estrellado en plena naturaleza

Inversión: $15 por persona. Cupos limitados para adultos. Organiza: Puntos Suspensivos.`,
    imagenUrl: "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.instagram.com/reel/Db_RH06yxMb/?igsh=MWM1bnE5bXVjZTh0dA==",
    categoriaSlug: "artes-vivas",
    zonaNombre: "Punzara",
    nombreGestor: "Puntos Suspensivos Aventura"
  },
  {
    nombre: "Cine Bajo las Estrellas: Edición Adolescentes (12 a 17 años)",
    fecha: "2026-08-22T18:30:00.000Z",
    lugar: "Reserva Natural de Zamora Huayco, Loja",
    descripcion: `¡Cambia las pantallas de siempre por una noche de naturaleza, amigos y cine bajo las estrellas!

Edición especial dirigida a adolescentes de 12 a 17 años:
🎥 Proyección de película juvenil en pantalla gigante al aire libre
🔥 Fogata con malvaviscos
🍔 Comida y bebidas
🎶 Música en vivo con ukelele
🌲 Actividades de integración al aire libre en un entorno seguro y monitoreado.

Inversión: $15. Cupos limitados con reserva previa.`,
    imagenUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.instagram.com/p/Db7cv-lFoF2/?igsh=MTJiY2NrMTk0b2Z0Mw==",
    categoriaSlug: "artes-vivas",
    zonaNombre: "Punzara",
    nombreGestor: "Puntos Suspensivos Campamento"
  },
  {
    nombre: "Canción Presente (6ª Edición): Recital Cantautor y Poesía",
    fecha: "2026-08-13T20:30:00.000Z",
    lugar: "Gato Suco — Rocafuerte e/ Macará y 24 de Mayo",
    descripcion: `Una velada bohemia de cantautores, poesía y guitarra en mano.

🎤 Músicos y cantautores en vivo:
• Felipe Serrano
• Agüita de Remedio
• Bruno Paladines
• Jhamil Coronel
• Camilo Bustos

✍️ Poeta invitada de honor: Paulina Soto.
🎟️ Entrada: $3. Inicio puntual.`,
    imagenUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.instagram.com/p/Db_bYFOmpun/?igsh=bzJveXNlbnFxcHRm",
    categoriaSlug: "musica",
    zonaNombre: "Sucre",
    nombreGestor: "Colectivo Canción Presente"
  },
  {
    nombre: "Concierto Tributo a Iron Maiden: Jo Salvador en Loja",
    fecha: "2026-08-21T20:00:00.000Z",
    lugar: "Teatro Segundo Cueva Celi, Loja",
    descripcion: `¡La fuerza del heavy metal llega a Loja! Directamente desde Quito, Jo Salvador presenta el homenaje más potente y aclamado a Iron Maiden.

⚡ Un show cargado de clásicos legendarios: The Trooper, Fear of the Dark, Hallowed Be Thy Name, Aces High y más.
🎟️ Entradas disponibles en Micromercado Raquelita y a través de la App CLIPP.`,
    imagenUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85",
    multimedia: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85"
    ],
    videoUrl: "https://www.facebook.com/share/p/19QVF8cqDa/?mibextid=wwXIfr",
    categoriaSlug: "musica",
    zonaNombre: "El Sagrario",
    nombreGestor: "Loja Rock Producciones"
  },
  {
    nombre: "Noche de Gala: 'Boleros, Pasillos y Algo Más'",
    fecha: "2026-08-18T20:00:00.000Z",
    lugar: "Teatro Bolívar, Loja",
    descripcion: `Una noche mágica dedicada a las melodías inolvidables de nuestra identidad ecuatoriana y latinoamericana.

Participan sobre el escenario del emblemático Teatro Bolívar:
🎺 Rondalla Municipal de Loja
🎙️ Chalo
🎸 Mean Boys
✨ La Majo

Un viaje sonoro por el romanticismo, los pasillos lojanos y los boleros de siempre. Entrada libre.`,
    imagenUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.facebook.com/share/1J5oAwPbXM/?mibextid=wwXIfr",
    categoriaSlug: "musica",
    zonaNombre: "El Sagrario",
    nombreGestor: "Municipio de Loja & Rondalla Municipal"
  },
  {
    nombre: "Estreno de Videoclip: Banda Roxanne (Rock Lojano)",
    fecha: "2026-08-19T17:00:00.000Z",
    lugar: "Plataformas Digitales & YouTube Oficial",
    descripcion: `La banda lojana de rock independiente Roxanne presenta su más reciente producción musical y videoclip oficial.

Con presencia destacada en charts y festivales independientes, Roxanne continúa apostando por música propia 100% hecha en Loja. ¡Apoyemos el talento local!`,
    imagenUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://youtu.be/CKji0p9BHCk?si=uXAEsbMM0n0hDhVw",
    categoriaSlug: "musica",
    zonaNombre: "El Sagrario",
    nombreGestor: "Roxanne Banda Oficial"
  },
  {
    nombre: "Noche de Microteatro con Teatro Quimera: 'Amigas Maduras' y más",
    fecha: "2026-08-25T19:00:00.000Z",
    lugar: "Teatrino de la Casona Cultural, Loja",
    descripcion: `Dos obras de comedia ligera, enredos y situaciones cotidianas con el elenco de Teatro Quimera:

1. "Amigas maduras": Dos amigas. Una casa. Una convivencia... bastante complicada. 😂 Dicen que vivir juntas fortalece la amistad, pero ellas van a demostrar que también puede ponerla a prueba.
2. Comedia de enredos: Un padre empeñado en hacer de su hijo una estrella, y un productor con planes muy distintos.

🎟️ Entrada: Aporte voluntario. Cupos limitados por aforo del Teatrino.`,
    imagenUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.facebook.com/share/r/1EF2SdWp7X/?mibextid=wwXIfr",
    categoriaSlug: "teatro",
    zonaNombre: "El Sagrario",
    nombreGestor: "Teatro Quimera & Casona Cultural"
  },
  {
    nombre: "Comedia Teatral: 'La Mejor Obra del Año'",
    fecha: "2026-08-13T20:00:00.000Z",
    lugar: "Escena Continua (Máximo Agustín Aguirre y González Suárez)",
    descripcion: `♦️ LA MEJOR OBRA DEL AÑO ♦️

Sinopsis: Javier y Susy tienen un sueño colosal: presentar “La mejor obra del año”. Una maratónica tarea que les tomará 10 años de sus vidas, incontables dolores de cabeza y el curioso detalle de que casi nadie parece interesado en asistir...

Una comedia autorreferencial imperdible sobre la pasión teatral y la perseverancia artística en Loja.`,
    imagenUrl: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://forms.gle/RRL6fEXLnGaXJ7NB9",
    categoriaSlug: "teatro",
    zonaNombre: "San Sebastián",
    nombreGestor: "Escena Continua Compañía Teatral"
  },
  {
    nombre: "Obra de Teatro Social: '¿Por qué no me quieres?'",
    fecha: "2026-08-31T19:30:00.000Z",
    lugar: "Teatrino de la Casona Cultural, Loja",
    descripcion: `*¿Por qué no me quieres?* no es solo una obra de teatro. Es un espejo que nos interpela a mirar aquello que como sociedad muchas veces preferimos ignorar.

Una conmovedora historia sobre el abandono, la resiliencia familiar, la vulnerabilidad infantil y las marcas invisibles que definen una vida.

🎟️ Preventa de entradas en Micromercado Raquelita y App Clipp.`,
    imagenUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.instagram.com/p/Db-z4aSFjrt/?igsh=MTd5Yno1b3JvbGFyNg==",
    categoriaSlug: "teatro",
    zonaNombre: "El Sagrario",
    nombreGestor: "Colectivo Escénico Loja"
  },
  {
    nombre: "Gran Jornada Comunitaria del Circo Social Loja",
    fecha: "2026-08-21T10:00:00.000Z",
    lugar: "Paseo Cultural de la Rocafuerte, Loja",
    descripcion: `¡El arte circense toma las calles de Loja!

El Circo Social Loja y el Municipio de Loja invitan a familias, jóvenes y niños a disfrutar de una jornada al aire libre con:
🤹 Talleres lúdicos de malabares y acrobacia básica
🎪 Presentaciones de clown y teatro de calle
🎨 Dinámicas de integración comunitaria

Horario continuo: de 10:00 a 17:00. Actividad 100% gratuita.`,
    imagenUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.facebook.com/share/p/1CHrtUqSvi/?mibextid=wwXIfr",
    categoriaSlug: "artes-vivas",
    zonaNombre: "El Sagrario",
    nombreGestor: "Circo Social Loja & Municipio de Loja"
  },
  {
    nombre: "Taller de Lectoescritura: Ópera Rock 'Notre-Dame de Paris'",
    fecha: "2026-08-18T17:00:00.000Z",
    lugar: "Centro Cultural Rincón de la Lectura, Loja",
    descripcion: `El Maestro Jaime Paredes invita a todos los amantes de las letras y las artes escénicas al Taller de Lectoescritura semanal.

En esta sesión especial se analizará "Notre-Dame de Paris", el célebre musical francés en formato de ópera-rock de Riccardo Cocciante y Luc Plamondon, basado en la monumental novela de Víctor Hugo.

Discusión de textos, libreto, música y dramaturgia. Entrada libre.`,
    imagenUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.facebook.com/share/r/19CcdeEsVq/?mibextid=wwXIfr",
    categoriaSlug: "arte-y-exposiciones",
    zonaNombre: "Sucre",
    nombreGestor: "Mtro. Jaime Paredes - Rincón de la Lectura"
  },
  {
    nombre: "Mesa Técnica Interinstitucional: Rumbo al FIAVL 2026",
    fecha: "2026-08-18T10:00:00.000Z",
    lugar: "Salón de los Alcaldes, Municipio de Loja",
    descripcion: `El trabajo articulado fortalece al Festival Internacional de Artes Vivas Loja (FIAVL 2026).

Mesa de trabajo y coordinación técnica presidida por la alcaldesa Diana Guayanay, la viceministra de Cultura Pamela Cortés, autoridades provinciales y delegados del sector artístico-cultural para planificar la programación y proyección internacional del festival más importante del país.`,
    imagenUrl: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.facebook.com/share/1gpQ8NmaiK/?mibextid=wwXIfr",
    categoriaSlug: "artes-vivas",
    zonaNombre: "El Sagrario",
    nombreGestor: "Alcaldía de Loja & Ministerio de Cultura"
  },
  {
    nombre: "Presentación Editorial: 'Las Edades de la Lluvia'",
    fecha: "2026-08-12T18:00:00.000Z",
    lugar: "Espacio Sinapsis de Palabras, Loja",
    descripcion: `CUATRO VOCES. UNA MISMA TIERRA.

"Las edades de la lluvia" es una creación de Karen Calva (@karen_alexza), Ana Cevallos Carrión (@ana.g.cevallos), Lia Matute (@lia_matute) y Evelyn Pintado (@evelynpintadorodriguez), cuatro autoras de Loja, Macará y Cariamanga que encuentran un punto común en la escritura y la memoria del sur ecuatoriano.

Estructura de la obra:
🌧️ Aquí no escampa
🌧️ Aquí el invierno se quedó a dormir
🌱 Aquí germina
✨ Aquí se siente

Una producción celebrada por Colectivo Sinapsis.`,
    imagenUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=85",
    videoUrl: "https://www.instagram.com/p/Db8xzUHIPlS/?igsh=YTZ2cHk5eHJiYXRz",
    categoriaSlug: "arte-y-exposiciones",
    zonaNombre: "El Sagrario",
    nombreGestor: "Colectivo Sinapsis & Autoras Lojanas"
  }
];

async function main() {
  console.log("🚀 Iniciando carga de publicaciones y eventos extraídos de WhatsApp...");

  // Obtener mapas de categorías y zonas
  const categorias = await prisma.categoria.findMany();
  const zonas = await prisma.zona.findMany();

  const catMap = new Map(categorias.map((c) => [c.slug, c.id]));
  const zonaMap = new Map(zonas.map((z) => [z.nombre, z.id]));

  let creados = 0;
  let actualizados = 0;

  for (const item of EVENTOS_WHATSAPP) {
    const slug = generarSlug(item.nombre, item.fecha.slice(0, 10), item.lugar.slice(0, 30));
    const categoriaId = catMap.get(item.categoriaSlug) || null;
    const zonaId = zonaMap.get(item.zonaNombre) || null;

    const data = {
      nombre: item.nombre,
      slug,
      fecha: new Date(item.fecha),
      lugar: item.lugar,
      descripcion: item.descripcion,
      imagenUrl: item.imagenUrl,
      multimedia: item.multimedia ? item.multimedia : undefined,
      videoUrl: item.videoUrl || null,
      estado: EstadoEvento.APROBADO,
      nombreGestor: item.nombreGestor,
      categoriaId,
      zonaId,
      confianzaClasificacion: 0.98,
    };

    const existing = await prisma.evento.findUnique({ where: { slug } });
    if (existing) {
      await prisma.evento.update({
        where: { slug },
        data,
      });
      actualizados++;
      console.log(` 🔄 Actualizado: "${item.nombre}" (${item.categoriaSlug})`);
    } else {
      await prisma.evento.create({
        data,
      });
      creados++;
      console.log(` ✨ Creado: "${item.nombre}" (${item.categoriaSlug})`);
    }
  }

  console.log(`\n🎉 Proceso completado exitosamente:`);
  console.log(`   - Eventos creados: ${creados}`);
  console.log(`   - Eventos actualizados: ${actualizados}`);
  console.log(`   - Total procesados: ${EVENTOS_WHATSAPP.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error al insertar eventos de WhatsApp:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
