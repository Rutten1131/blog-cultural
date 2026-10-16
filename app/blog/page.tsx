import { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts } from '@/lib/blog';

const SITE_NAME = 'Agenda Cultural Loja';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.agendaculturalloja.com';
const BLOG_TITLE = `Blog & Crónicas Culturales | ${SITE_NAME}`;
const BLOG_DESCRIPTION = 'Artículos, guías teatrales, historia, festivales y crónicas culturales de Loja, Ecuador.';

export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
};

export const revalidate = 60;

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  const categories = [
    'Todos',
    ...Array.from(new Set(posts.map((p) => p.categoria).filter(Boolean))),
  ];

  return (
    <div className="bg-[#eeeef8] text-[#1a1a2e] min-h-screen pb-20">
      {/* Hero del Blog con los colores y gradientes de Agenda Cultural */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#6d28d9] text-white py-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.18),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-sm font-semibold text-[#a78bfa] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#ec4899] animate-pulse" />
            Crónicas, Teatro & Tradición
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 font-['Barlow_Condensed',sans-serif] uppercase">
            Blog & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#ec4899] to-[#f472b6]">Cultura Lojana</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-300 font-medium">
            Historias, rutas patrimoniales, detalles de festivales y todo lo que vive en el corazón artístico del sur del Ecuador.
          </p>
        </div>
      </section>

      {/* Grid de Artículos */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id || post.slug}
              className="bg-white rounded-3xl overflow-hidden border border-[#ddddf0] shadow-[0_4px_20px_-4px_rgba(109,40,217,0.10)] hover:shadow-[0_12px_36px_-8px_rgba(109,40,217,0.22)] transition-all duration-300 flex flex-col group hover:-translate-y-1"
            >
              <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={post.imagen}
                  alt={post.imagen_alt || post.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 bg-gradient-to-r from-[#6d28d9] to-[#ec4899] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                  {post.categoria}
                </span>
              </Link>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs text-[#64648a] mb-3">
                  <span>{post.fecha_publicacion || post.date}</span>
                  <span>•</span>
                  <span>{post.tiempo_lectura || post.readMinutes || 4} min de lectura</span>
                </div>

                <h2 className="text-xl font-bold text-[#1a1a2e] group-hover:text-[#6d28d9] transition-colors leading-snug mb-3">
                  <Link href={`/blog/${post.slug}`}>
                    {post.titulo || post.title}
                  </Link>
                </h2>

                <p className="text-sm text-[#64648a] line-clamp-3 mb-6 flex-1">
                  {post.resumen || post.excerpt}
                </p>

                <div className="pt-4 border-t border-[#ddddf0] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6d28d9]">
                    Por {post.autor || 'Agenda Cultural'}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-[#6d28d9] group-hover:text-[#ec4899] flex items-center gap-1 transition-colors"
                  >
                    Leer crónica →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
