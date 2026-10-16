import { BlogPost } from '@/types/blog';
import { getDbPool, initDb } from './db';

// Artículos de fallback culturales para Loja
export const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'festival-internacional-artes-vivas-loja',
    titulo: 'Guía Completa del Festival Internacional de Artes Vivas Loja (FIAVL)',
    resumen: 'Todo lo que necesitas saber sobre las fechas, sedes teatrales, espectáculos callejeros y cómo disfrutar del festival cultural más grande del Ecuador.',
    contenido: `
      ## El escenario cultural más importante del país

      Cada noviembre, Loja se transforma en la capital cultural del Ecuador con el **Festival Internacional de Artes Vivas (FIAVL)**. Teatros emblemáticos como el Teatro Benjamín Carrión, el Teatro Bolívar y las plazas históricas se llenan de agrupaciones nacionales e internacionales.

      ### Sedes principales
      - **Teatro Nacional Benjamín Carrión:** Obras de gran formato, danza contemporánea y sinfónicas.
      - **Teatro Bolívar:** Artes escénicas independientes y teatro clásico.
      - **Plaza Central y Calle Bolívar:** Intervenciones de arte callejero, mimos, música en vivo y estatuas vivientes.

      ### Recomendaciones para tu visita
      1. Reserva tus entradas con anticipación para los espectáculos en sala.
      2. Recorre el circuito de arte urbano en el centro histórico durante las tardes.
      3. Disfruta de la gastronomía lojana entre funciones.
    `,
    imagen: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=1200&auto=format&fit=crop',
    imagen_alt: 'Festival de artes vivas en teatro iluminado',
    categoria: 'Teatro',
    etiquetas: ['FIAVL', 'Artes Vivas', 'Teatro', 'Loja'],
    autor: 'Agenda Cultural Loja',
    fecha_publicacion: '2026-10-01',
    publicado: true,
    tiempo_lectura: 4,
  },
  {
    id: 2,
    slug: 'ruta-de-los-museos-centro-historico-loja',
    titulo: 'Ruta de los Museos en el Centro Histórico de Loja',
    resumen: 'Un recorrido patrimonial por el Museo de la Cultura Lojana, Museo de la Música y el Centro Cultural Alfredo Mora Reyes.',
    contenido: `
      ## El legado musical e histórico de Loja

      Loja ostenta con orgullo su título de **Capital Musical y Cultural del Ecuador**. Su centro histórico alberga espacios dedicados a preservar la memoria de sus grandes compositores y artistas plásticos.

      ### Paradas imperdibles
      - **Museo de la Música:** Ubicado en el antiguo Colegio Bernardo Valdivieso, rinde homenaje a insignes como Salvador Bustamante Celi y Segundo Cueva Celi.
      - **Museo Puerta de la Ciudad:** Galería de arte contemporáneo dentro de la emblemática fortaleza de entrada a Loja.
      - **Centro Cultural Alfredo Mora Reyes:** Exposiciones temporales, proyecciones de cine independiente y talleres de formación artística.
    `,
    imagen: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=1200&auto=format&fit=crop',
    imagen_alt: 'Galería de arte y museo cultural',
    categoria: 'Patrimonio',
    etiquetas: ['Museos', 'Historia', 'Música', 'Patrimonio'],
    autor: 'Agenda Cultural Loja',
    fecha_publicacion: '2026-10-05',
    publicado: true,
    tiempo_lectura: 3,
  },
];

export const POSTS = FALLBACK_POSTS;
export const getPost = (slug: string) => FALLBACK_POSTS.find((p) => p.slug === slug);

function parseEtiquetas(etiquetas: any): string[] {
  if (Array.isArray(etiquetas)) return etiquetas;
  if (typeof etiquetas === 'string') {
    try {
      const parsed = JSON.parse(etiquetas);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return etiquetas.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const db = getDbPool();
    const [rows]: any = await Promise.race([
      db.query('SELECT * FROM blog_posts WHERE publicado = 1 ORDER BY fecha_publicacion DESC'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3000))
    ]);

    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        ...r,
        publicado: Boolean(r.publicado),
        etiquetas: parseEtiquetas(r.etiquetas),
        fecha_publicacion: r.fecha_publicacion ? new Date(r.fecha_publicacion).toISOString().split('T')[0] : '',
      }));
    }
  } catch (err: any) {
    console.warn('MySQL fallback activo (getPublishedPosts):', err.message);
  }
  return FALLBACK_POSTS;
}

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  try {
    const db = getDbPool();
    await initDb();
    const [rows]: any = await Promise.race([
      db.query('SELECT * FROM blog_posts ORDER BY fecha_publicacion DESC'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3500))
    ]);

    if (rows) {
      return rows.map((r: any) => ({
        ...r,
        publicado: Boolean(r.publicado),
        etiquetas: parseEtiquetas(r.etiquetas),
        fecha_publicacion: r.fecha_publicacion ? new Date(r.fecha_publicacion).toISOString().split('T')[0] : '',
      }));
    }
  } catch (err: any) {
    console.warn('MySQL fallback admin (getAllPostsAdmin):', err.message);
  }
  return FALLBACK_POSTS;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const db = getDbPool();
    const [rows]: any = await Promise.race([
      db.query('SELECT * FROM blog_posts WHERE slug = ? LIMIT 1', [slug]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3000))
    ]);

    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        ...r,
        publicado: Boolean(r.publicado),
        etiquetas: parseEtiquetas(r.etiquetas),
        fecha_publicacion: r.fecha_publicacion ? new Date(r.fecha_publicacion).toISOString().split('T')[0] : '',
      };
    }
  } catch (err: any) {
    console.warn('MySQL fallback activo (getPostBySlug):', err.message);
  }

  const found = FALLBACK_POSTS.find(p => p.slug === slug);
  return found || null;
}
