import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getPublishedPosts } from '@/lib/blog';
import { renderContent } from '@/lib/markdown';
import { ArticleMedia } from '@/components/ArticleMedia';

const SITE_NAME = 'Agenda Cultural Loja';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.agendaculturalloja.com';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: `Artículo no encontrado | ${SITE_NAME}`,
    };
  }

  const title = `${post.titulo || post.title} | ${SITE_NAME}`;
  const description = post.resumen || post.excerpt;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.imagen;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.fecha_publicacion || post.date,
      authors: [post.autor || 'Agenda Cultural Loja'],
      images: [
        {
          url: image,
          alt: post.imagen_alt || post.titulo,
        },
      ],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getPublishedPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="bg-[#eeeef8] text-[#1a1a2e] min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <nav className="flex items-center gap-2 text-sm text-[#64648a] mb-8">
          <Link href="/" className="hover:text-[#6d28d9] transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#6d28d9] transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-[#1a1a2e] font-medium truncate max-w-xs">{post.titulo || post.title}</span>
        </nav>

        <article className="bg-white rounded-3xl p-6 sm:p-12 border border-[#ddddf0] shadow-[0_4px_24px_-4px_rgba(109,40,217,0.10)] overflow-hidden">
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-gradient-to-r from-[#6d28d9] to-[#ec4899] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm">
                {post.categoria}
              </span>
              <span className="text-xs text-[#64648a]">
                {post.fecha_publicacion || post.date} • {post.tiempo_lectura || post.readMinutes || 4} min de lectura
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#1a1a2e] font-['Barlow_Condensed',sans-serif] tracking-tight leading-tight mb-6">
              {post.titulo || post.title}
            </h1>

            <p className="text-lg text-[#64648a] leading-relaxed border-l-4 border-[#6d28d9] pl-4 bg-[#6d28d9]/5 py-3 rounded-r-2xl">
              {post.resumen || post.excerpt}
            </p>
          </header>

          <ArticleMedia
            image={post.imagen}
            imageAlt={post.imagen_alt || post.titulo}
            videoUrl={post.video_url || undefined}
            title={post.titulo || post.title || ''}
          />

          <div
            className="prose prose-lg max-w-none text-[#1a1a2e] mt-8 prose-headings:font-['Barlow_Condensed',sans-serif] prose-headings:font-bold prose-a:text-[#6d28d9] prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: renderContent(post.contenido).trim() }}
          />

          {post.etiquetas && post.etiquetas.length > 0 && (
            <div className="mt-12 pt-6 border-t border-[#ddddf0]">
              <h3 className="text-xs uppercase tracking-wider text-[#64648a] font-bold mb-3">
                Temas relacionados:
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.etiquetas.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-[#eeeef8] text-[#6d28d9] border border-[#ddddf0] text-xs font-medium px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
