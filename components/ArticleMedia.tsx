'use client';

import { useState } from 'react';
import { getVideoEmbedHtml } from '@/lib/markdown';

interface ArticleMediaProps {
  image?: string;
  imageAlt?: string;
  videoUrl?: string;
  title: string;
}

/**
 * Componente que muestra imagen y/o video de un artículo.
 * - Si solo hay imagen: muestra la imagen
 * - Si solo hay video: muestra el video
 * - Si hay ambos: muestra tabs para alternar entre imagen y video
 */
export function ArticleMedia({ image, imageAlt, videoUrl, title }: ArticleMediaProps) {
  const hasImage = Boolean(image);
  const hasVideo = Boolean(videoUrl);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  if (!hasImage && !hasVideo) return null;

  // Solo video, sin imagen
  if (!hasImage && hasVideo) {
    return (
      <div className="mb-10">
        <div
          dangerouslySetInnerHTML={{ __html: getVideoEmbedHtml(videoUrl!) }}
          suppressHydrationWarning
        />
      </div>
    );
  }

  // Solo imagen, sin video
  if (hasImage && !hasVideo) {
    return (
      <div className="mb-10 rounded-3xl overflow-hidden border border-gray-200 shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image!}
          alt={imageAlt || title}
          className="w-full h-auto max-h-[520px] object-cover"
        />
      </div>
    );
  }

  // Ambos: imagen + video con tabs
  return (
    <div className="mb-10">
      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('image')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition border ${
            activeTab === 'image'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          📷 Foto
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition border ${
            activeTab === 'video'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          🎥 Video
        </button>
      </div>

      {activeTab === 'image' ? (
        <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image!}
            alt={imageAlt || title}
            className="w-full h-auto max-h-[520px] object-cover"
          />
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: getVideoEmbedHtml(videoUrl!) }} suppressHydrationWarning />
      )}
    </div>
  );
}
