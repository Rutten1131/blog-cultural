import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.imagen) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Si ya es una URL HTTP directa, redirigir
  if (post.imagen.startsWith('http')) {
    return NextResponse.redirect(post.imagen, 307);
  }

  // Si es Base64 (data:image/...;base64,...)
  const match = post.imagen.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) {
    return new NextResponse('Invalid image data', { status: 400 });
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
