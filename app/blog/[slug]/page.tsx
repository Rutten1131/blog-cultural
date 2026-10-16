import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getPublishedPosts } from '@/lib/blog';
import { renderContent, getVideoEmbedHtml } from '@/lib/markdown';
import { ArticleMedia } from '@/components/ArticleMedia';

// ─────────────────────────────────────────────────────────
// ⚙️  PERSONALIZA ESTOS VALORES PARA TU PROYECTO
// ─────────────────────────────────────────────────────────
const SITE_NAME = 'Agenda Cultural Loja';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.agendaculturalloja.com';
// ─────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: `Artículo No Encontrado | ${SITE_NAME}`,
    };
  }

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${post.titulo} | Blog ${SITE_NAME}`,
    description: post.resumen,
    keywords: [
      post.categoria,
      ...(post.etiquetas || []),
      SITE_NAME,
    ],
    authors: [{ name: post.autor || SITE_NAME }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.titulo,
      description: post.resumen,
      url: postUrl,
      type: 'article',
      publishedTime: post.fecha_publicacion,
      authors: [post.autor || SITE_NAME],
      tags: post.etiquetas,
      images: [
        {
          url: post.imagen
            ? (post.imagen.startsWith('http')
                ? post.imagen
                : `${SITE_URL}/api/blog/${post.slug}/image`)
            : `${SITE_URL}/og-image.png`,
          alt: post.imagen_alt || post.titulo,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.titulo,
      description: post.resumen,
      images: [
        post.imagen
          ? (post.imagen.startsWith('http')
              ? post.imagen
              : `${SITE_URL}/api/blog/${post.slug}/image`)
          : `${SITE_URL}/og-image.png`,
      ],
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getPublishedPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  // Schema.org BlogPosting estructurado
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    headline: post.titulo,
    description: post.resumen,
    image: post.imagen ? [post.imagen] : undefined,
    datePublished: post.fecha_publicacion,
    dateModified: post.fecha_modificacion || post.fecha_publicacion,
    author: {
      '@type': 'Organization',
      name: post.autor || SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    articleSection: post.categoria,
    keywords: post.etiquetas?.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="min-h-screen bg-gray-50 text-gray-900 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-medium">
            <Link href="/" className="hover:text-blue-600 transition">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-xs">{post.titulo}</span>
          </nav>

          {/* Header del post */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                {post.categoria}
              </span>
              <span className="text-xs text-gray-500">📅 {post.fecha_publicacion}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">⏱️ {post.tiempo_lectura || 5} min de lectura</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6 break-words [overflow-wrap:anywhere]">
              {post.titulo}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed border-l-4 border-blue-500 pl-4 bg-blue-50 py-3 rounded-r-2xl break-words [overflow-wrap:anywhere]">
              {post.resumen}
            </p>
          </header>

          {/* Multimedia del Artículo */}
          <ArticleMedia
            image={post.imagen}
            imageAlt={post.imagen_alt}
            videoUrl={post.video_url || undefined}
            title={post.titulo}
          />

          {/* Contenido del Artículo */}
          <div
            className="prose prose-lg max-w-none break-words overflow-hidden [overflow-wrap:anywhere]"
            dangerouslySetInnerHTML={{ __html: renderContent(post.contenido).trim() }}
            suppressHydrationWarning
          />

          {/* Tags */}
          {post.etiquetas && post.etiquetas.length > 0 && (
            <div className="mt-12 pt-6 border-t border-gray-200">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">
                Temas relacionados:
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.etiquetas.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Autor Card */}
          <div className="mt-8 bg-white border border-gray-200 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
            <div className="size-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-2xl">
              ✍️
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{post.autor || SITE_NAME}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {SITE_NAME} — Blog oficial.
              </div>
            </div>
          </div>

          {/* Artículos Recomendados */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Continúa Leyendo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.id || rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                        {rel.categoria}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition mt-2 line-clamp-2">
                        {rel.titulo}
                      </h4>
                    </div>
                    <span className="text-xs text-gray-500 mt-3 block font-medium">Leer más →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Volver */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold"
            >
              ← Volver a todos los artículos
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
