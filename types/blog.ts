export interface BlogPost {
  id?: number;
  slug: string;
  titulo: string;
  title?: string;
  resumen: string;
  excerpt?: string;
  contenido: string;
  body?: any;
  imagen: string;
  imagen_alt: string;
  video_url?: string | null;
  categoria: string;
  tag?: string;
  etiquetas?: string[];
  canton_slug?: string | null;
  autor: string;
  fecha_publicacion: string;
  date?: string;
  fecha_modificacion?: string | null;
  publicado: boolean;
  tiempo_lectura: number;
  readMinutes?: number;
}

export type BlogPostInput = Omit<BlogPost, 'id' | 'fecha_publicacion' | 'fecha_modificacion'>;
