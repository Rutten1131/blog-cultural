/**
 * Script de seed: Inserta ~50 eventos realistas de prueba en la BD.
 * Ejecutar con: npx tsx prisma/seed-50.ts
 */
import { PrismaClient } from "@prisma/client";
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

// Imágenes genéricas por categoría (Unsplash)
const IMAGENES: Record<string, string[]> = {
  "arte-y-exposiciones": [
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1531913764164-f85c3e01b654?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=800&q=80",
  ],
  teatro: [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1570981559687-b08c27f10f3e?auto=format&fit=crop&w=800&q=80",
  ],
  musica: [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
  ],
  ferias: [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555679427-1f6dfeb8d683?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=800&q=80",
  ],
  "artes-vivas": [
    "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=800&q=80",
  ],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const EVENTOS_SEED = [
  // ─── ARTE Y EXPOSICIONES (10) ───
  { nombre: "Exposición Colectiva: Trazos de la Sierra", cat: "arte-y-exposiciones", lugar: "Museo de la Cultura Lojana, Centro Histórico", zona: "El Sagrario", dias: 5, desc: "Muestra colectiva de 12 artistas lojanos que exploran la identidad andina a través de pintura al óleo, acuarela y técnicas mixtas. Entrada libre." },
  { nombre: "Fotografía Documental: Loja en Blanco y Negro", cat: "arte-y-exposiciones", lugar: "Casa de la Cultura Ecuatoriana Núcleo Loja", zona: "El Sagrario", dias: 8, desc: "Retrospectiva fotográfica que documenta 50 años de transformación urbana de Loja. 80 fotografías inéditas de archivos privados." },
  { nombre: "Galería Abierta: Arte Emergente Lojano", cat: "arte-y-exposiciones", lugar: "Galería El Farol, Calle Lourdes", zona: "El Sagrario", dias: 12, desc: "Primera galería abierta con obras de 8 artistas jóvenes menores de 30 años. Escultura, instalación y arte digital." },
  { nombre: "Muestra de Cerámica Precolombina Contemporánea", cat: "arte-y-exposiciones", lugar: "Centro Cultural Alfredo Mora Reyes", zona: "Sucre", dias: 15, desc: "Fusión entre técnicas ancestrales de cerámica saraguro y diseño contemporáneo. Taller abierto de modelado incluido." },
  { nombre: "Pintura Mural en Vivo: Colores de Loja", cat: "arte-y-exposiciones", lugar: "Parque Central Jipiro", zona: "El Valle", dias: 18, desc: "10 muralistas intervienen las paredes del Parque Jipiro en vivo. Música ambiental y feria de ilustración." },
  { nombre: "Exposición Fotográfica: Rostros del Sur", cat: "arte-y-exposiciones", lugar: "Teatro Bolívar, Sala de Exposiciones", zona: "El Sagrario", dias: 22, desc: "Retratos fotográficos de comunidades rurales de la provincia de Loja capturados durante dos años de trabajo de campo." },
  { nombre: "Arte Digital y Proyección Inmersiva", cat: "arte-y-exposiciones", lugar: "Universidad Técnica Particular de Loja", zona: "San Sebastián", dias: 25, desc: "Experiencia inmersiva de arte generativo y proyecciones audiovisuales en el auditorio de la UTPL." },
  { nombre: "Feria de Ilustración y Cómic Lojano", cat: "arte-y-exposiciones", lugar: "Biblioteca Municipal, Centro Histórico", zona: "El Sagrario", dias: 30, desc: "Primer encuentro de ilustradores, caricaturistas y autores de cómic de Loja. Venta de fanzines y talleres." },
  { nombre: "Escultura al Aire Libre: Formas Naturales", cat: "arte-y-exposiciones", lugar: "Jardín Botánico Reinaldo Espinosa", zona: "San Sebastián", dias: 35, desc: "Instalaciones escultóricas con materiales orgánicos y reciclados en los jardines del Botánico de la UNL." },
  { nombre: "Acuarelas del Valle de Cuxibamba", cat: "arte-y-exposiciones", lugar: "Sala de Arte del Municipio de Loja", zona: "El Sagrario", dias: 40, desc: "Paisajes del Valle de Cuxibamba pintados en acuarela por la artista lojana María Fernanda Cueva." },

  // ─── TEATRO (10) ───
  { nombre: "Festival Nocturno de Microteatro Loja 2026", cat: "teatro", lugar: "Teatro Bolívar, Calle Bolívar y Sucre", zona: "El Sagrario", dias: 3, desc: "5 obras de microteatro de 15 minutos cada una, presentadas simultáneamente en diferentes espacios del Teatro Bolívar." },
  { nombre: "Monólogo: Memorias de un Emigrante", cat: "teatro", lugar: "Casa de la Cultura Ecuatoriana Núcleo Loja", zona: "El Sagrario", dias: 7, desc: "Monólogo dramático sobre la migración lojana. Escrito e interpretado por el actor Juan Carlos Medina." },
  { nombre: "Teatro Infantil: El Bosque Encantado", cat: "teatro", lugar: "Teatro Universitario UNL", zona: "San Sebastián", dias: 10, desc: "Obra infantil con títeres gigantes y música en vivo. Ideal para niños de 4 a 12 años. Función doble: 10h00 y 15h00." },
  { nombre: "Comedia Musical: Loja de Mis Amores", cat: "teatro", lugar: "Auditorio del Colegio Bernardo Valdivieso", zona: "El Sagrario", dias: 14, desc: "Comedia musical que recorre las tradiciones, personajes y anécdotas más queridas de la ciudad de Loja." },
  { nombre: "Drama Contemporáneo: Sombras en la Niebla", cat: "teatro", lugar: "Teatro Bolívar", zona: "El Sagrario", dias: 19, desc: "Obra de teatro contemporáneo que aborda la soledad urbana y la desconexión digital. Dirección de Patricia Eguiguren." },
  { nombre: "Improvisación Teatral: Liga de Impro Loja", cat: "teatro", lugar: "Bar Cultural La Verbena", zona: "Sucre", dias: 21, desc: "Show de improvisación teatral competitiva con participación del público. Dos equipos, un ganador." },
  { nombre: "Lectura Dramatizada: Poesía de Benjamín Carrión", cat: "teatro", lugar: "Teatro Nacional Benjamín Carrión", zona: "San Sebastián", dias: 26, desc: "Homenaje teatral a Benjamín Carrión con lectura dramatizada de sus obras más emblemáticas. Acompañamiento musical." },
  { nombre: "Teatro de Sombras: Leyendas Lojanas", cat: "teatro", lugar: "Parque Lineal La Tebaida", zona: "El Valle", dias: 28, desc: "Espectáculo nocturno de teatro de sombras que revive leyendas populares lojanas. Proyección sobre pantalla de tela de 6 metros." },
  { nombre: "Obra de Teatro: La Última Serenata", cat: "teatro", lugar: "Teatro Bolívar, Sala Principal", zona: "El Sagrario", dias: 33, desc: "Drama musical ambientado en la Loja de 1950. Historia de amor, música y tradición. Elenco de 15 actores." },
  { nombre: "Festival Intercolegial de Teatro 2026", cat: "teatro", lugar: "Teatro Universitario UNL", zona: "San Sebastián", dias: 38, desc: "Competencia teatral entre 8 colegios de la provincia. Jurado profesional y premios para las 3 mejores obras." },

  // ─── MÚSICA (10) ───
  { nombre: "Concierto Sinfónico: Noche de Gala OSL", cat: "musica", lugar: "Teatro Nacional Benjamín Carrión, San Sebastián", zona: "San Sebastián", dias: 4, desc: "La Orquesta Sinfónica de Loja presenta un programa de música clásica con obras de Beethoven, Dvorak y Gerardo Guevara." },
  { nombre: "Jazz en el Parque: Loja Jazz Fest", cat: "musica", lugar: "Parque Central Jipiro", zona: "El Valle", dias: 6, desc: "Festival de jazz al aire libre con 4 bandas nacionales e internacionales. Food trucks y cerveza artesanal." },
  { nombre: "Recital de Piano: Clásicos del Romanticismo", cat: "musica", lugar: "Conservatorio Salvador Bustamante Celi", zona: "El Sagrario", dias: 11, desc: "El pianista lojano Andrés Carrión interpreta obras de Chopin, Liszt y Schumann en el histórico Conservatorio." },
  { nombre: "Rock Independiente: Noches de Garaje Loja", cat: "musica", lugar: "La Cafetera Rock Bar", zona: "Sucre", dias: 13, desc: "Ciclo mensual de rock independiente lojano. 3 bandas en vivo, sonido profesional y proyecciones visuales." },
  { nombre: "Encuentro de Bandas de Pueblo 2026", cat: "musica", lugar: "Plaza de San Sebastián", zona: "San Sebastián", dias: 17, desc: "Concurso de bandas de pueblo de 6 cantones de la provincia de Loja. Jurado invitado y premiación en vivo." },
  { nombre: "Música Andina: Voces del Saraguro", cat: "musica", lugar: "Casa de la Cultura Ecuatoriana Núcleo Loja", zona: "El Sagrario", dias: 20, desc: "Concierto de música andina tradicional con instrumentos ancestrales: quena, charango, bombo y rondador." },
  { nombre: "Noche de Trova: Cantautores del Sur", cat: "musica", lugar: "Café Libro El Rincón, Calle Lourdes", zona: "El Sagrario", dias: 24, desc: "Ciclo de trova y cantautoría con 5 músicos lojanos. Poesía, guitarra y voz en un ambiente íntimo." },
  { nombre: "Festival de Coros Universitarios", cat: "musica", lugar: "Catedral de Loja", zona: "El Sagrario", dias: 29, desc: "Encuentro coral con participación de 6 universidades ecuatorianas. Repertorio sacro y contemporáneo en la Catedral." },
  { nombre: "Concierto Acústico: Guitarras de Loja", cat: "musica", lugar: "Teatro Bolívar", zona: "El Sagrario", dias: 32, desc: "Tres guitarristas lojanos de renombre interpretan piezas de Lauro, Barrios y compositores ecuatorianos." },
  { nombre: "Electrónica y Arte Sonoro: Frecuencias Sur", cat: "musica", lugar: "Explanada UTPL", zona: "San Sebastián", dias: 37, desc: "Festival de música electrónica experimental y arte sonoro. DJs locales, mapping y visuales en vivo." },

  // ─── FERIAS (10) ───
  { nombre: "Feria Artesanal Manos Lojanas", cat: "ferias", lugar: "Parque Central de Loja", zona: "El Sagrario", dias: 2, desc: "Más de 40 artesanos lojanos exhiben productos en cerámica, tejido, joyería y tallado en madera. Talleres gratuitos." },
  { nombre: "Mercado de Emprendedores Creativos", cat: "ferias", lugar: "Plaza de San Sebastián", zona: "San Sebastián", dias: 9, desc: "Feria mensual de emprendimientos creativos: diseño gráfico, moda sostenible, papelería artesanal y gastronomía local." },
  { nombre: "Festival Gastronómico: Sabores de Loja", cat: "ferias", lugar: "Parque Recreacional Jipiro", zona: "El Valle", dias: 16, desc: "Festival de gastronomía lojana con 30 puestos de comida típica, concurso de cecina y música en vivo." },
  { nombre: "Feria del Libro Loja 2026", cat: "ferias", lugar: "Biblioteca Municipal de Loja", zona: "El Sagrario", dias: 23, desc: "Feria editorial con más de 20 editoriales ecuatorianas, firmas de autores, talleres de escritura y cuenta-cuentos infantil." },
  { nombre: "Expo Café Loja: Tercer Encuentro Barista", cat: "ferias", lugar: "Centro de Convenciones Pío Jaramillo Alvarado", zona: "Sucre", dias: 27, desc: "Exposición de café de especialidad del sur de Ecuador. Competencia de baristas, catación y rueda de negocios." },
  { nombre: "Feria Navideña Lojana", cat: "ferias", lugar: "Calle Lourdes, Centro Histórico", zona: "El Sagrario", dias: 31, desc: "Mercado navideño con artesanías, gastronomía decembrina, villancicos en vivo y actividades para toda la familia." },
  { nombre: "Feria de Diseño y Moda Sostenible", cat: "ferias", lugar: "Galería El Farol", zona: "El Sagrario", dias: 34, desc: "Emprendedores de moda sostenible presentan colecciones con materiales reciclados y técnicas artesanales lojanas." },
  { nombre: "Mercado Orgánico y Agroecológico", cat: "ferias", lugar: "Parque Lineal La Tebaida", zona: "El Valle", dias: 36, desc: "Feria semanal de productos orgánicos de pequeños productores de Loja, Vilcabamba y Malacatos." },
  { nombre: "Expo Turismo Loja: Destinos del Sur", cat: "ferias", lugar: "Hotel Howard Johnson Loja", zona: "Sucre", dias: 39, desc: "Feria de turismo con operadoras, hoteles y destinos de la provincia de Loja. Conferencias y sorteos de paquetes turísticos." },
  { nombre: "Feria Intercultural de los Pueblos del Sur", cat: "ferias", lugar: "Estadio Federativo Reina del Cisne", zona: "El Valle", dias: 42, desc: "Encuentro de pueblos y nacionalidades del sur del Ecuador: gastronomía, danza, artesanías y medicina ancestral." },

  // ─── ARTES VIVAS (10) ───
  { nombre: "Festival Internacional de Artes Vivas Loja 2026", cat: "artes-vivas", lugar: "Múltiples sedes, Centro Histórico de Loja", zona: "El Sagrario", dias: 1, desc: "El festival más importante de artes escénicas del sur del Ecuador. 30 compañías, 50 funciones en 10 días." },
  { nombre: "Danza Contemporánea: Cuerpos en Movimiento", cat: "artes-vivas", lugar: "Teatro Nacional Benjamín Carrión", zona: "San Sebastián", dias: 7, desc: "Compañía de danza contemporánea de Quito presenta obra sobre migración y memoria corporal. 60 minutos." },
  { nombre: "Performance Urbana: Intervenciones Efímeras", cat: "artes-vivas", lugar: "Calle Lourdes y Parque Central", zona: "El Sagrario", dias: 10, desc: "Artistas de performance intervienen el espacio público con acciones artísticas sorpresa. Recorrido por el centro." },
  { nombre: "Circo Contemporáneo: Gravedad Cero", cat: "artes-vivas", lugar: "Parque Recreacional Jipiro", zona: "El Valle", dias: 15, desc: "Espectáculo de circo contemporáneo con acrobacia aérea, malabares y clown. Compañía invitada de Colombia." },
  { nombre: "Danza Folklórica: Estampas del Ecuador", cat: "artes-vivas", lugar: "Plaza de la Independencia", zona: "El Sagrario", dias: 20, desc: "Ballet folclórico que recorre las 4 regiones del Ecuador a través de la danza: costa, sierra, oriente e insular." },
  { nombre: "Teatro Callejero: Payasos sin Fronteras", cat: "artes-vivas", lugar: "Mercado Central de Loja", zona: "El Sagrario", dias: 22, desc: "Compañía de teatro callejero con humor, acrobacia y participación del público en pleno mercado central." },
  { nombre: "Laboratorio de Creación Escénica", cat: "artes-vivas", lugar: "Centro Cultural Alfredo Mora Reyes", zona: "Sucre", dias: 26, desc: "Taller intensivo de 3 días para creadores escénicos. Metodologías de creación colectiva y dramaturgia del cuerpo." },
  { nombre: "Noche de Spoken Word y Poesía Escénica", cat: "artes-vivas", lugar: "Bar Cultural La Verbena", zona: "Sucre", dias: 30, desc: "Encuentro de poesía hablada con performance escénica. 8 poetas de Loja, Cuenca y Guayaquil." },
  { nombre: "Butoh y Movimiento: Danza del Alma", cat: "artes-vivas", lugar: "Jardín Botánico Reinaldo Espinosa", zona: "San Sebastián", dias: 35, desc: "Espectáculo de danza Butoh al atardecer en los jardines del Botánico. Experiencia contemplativa y sonora." },
  { nombre: "Maratón de Danza Urbana: Breaking Loja", cat: "artes-vivas", lugar: "Explanada del Parque Jipiro", zona: "El Valle", dias: 41, desc: "Competencia de breakdance con crews de Loja, Cuenca, Machala y Guayaquil. DJ en vivo y premiación." },
];

async function main() {
  console.log("🌱 Iniciando seed de 50 eventos...\n");

  // Obtener categorías y zonas de la BD
  const categoriasDb = await prisma.categoria.findMany();
  const zonasDb = await prisma.zona.findMany();

  const catMap = new Map(categoriasDb.map((c) => [c.slug, c.id]));
  const zonaMap = new Map(zonasDb.map((z) => [z.nombre, z.id]));

  console.log(`  Categorías encontradas: ${categoriasDb.map((c) => c.slug).join(", ")}`);
  console.log(`  Zonas encontradas: ${zonasDb.length}\n`);

  const baseDate = new Date();
  let created = 0;
  let skipped = 0;

  for (const ev of EVENTOS_SEED) {
    const fecha = new Date(baseDate);
    fecha.setDate(fecha.getDate() + ev.dias);
    const fechaStr = fecha.toISOString().slice(0, 10);

    const slug = generarSlug(ev.nombre, fechaStr, ev.lugar);

    // Verificar si ya existe
    const exists = await prisma.evento.findUnique({ where: { slug } });
    if (exists) {
      skipped++;
      console.log(`  ⏭️  Ya existe: ${ev.nombre}`);
      continue;
    }

    const categoriaId = catMap.get(ev.cat) ?? null;
    const zonaId = zonaMap.get(ev.zona) ?? null;
    const imgs = IMAGENES[ev.cat] || IMAGENES["arte-y-exposiciones"];

    await prisma.evento.create({
      data: {
        nombre: ev.nombre,
        slug,
        fecha,
        lugar: ev.lugar,
        descripcion: ev.desc,
        imagenUrl: pick(imgs),
        estado: "APROBADO",
        nombreGestor: "Seed Script Agenda Cultural",
        categoriaId,
        zonaId,
      },
    });

    created++;
    console.log(`  ✅ [${created}] ${ev.nombre} → ${fechaStr}`);
  }

  console.log(`\n🎉 Seed completado: ${created} creados, ${skipped} omitidos (ya existían).`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
