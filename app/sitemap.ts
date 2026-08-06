import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/types";
import { ZONAS } from "@/lib/constants";
import { SITE_CONFIG } from "@/lib/utils";

function zonaToSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;

  // 1. Ruta principal (Home)
  const homeRoute: MetadataRoute.Sitemap[number] = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  };

  // 2. Rutas de las 5 categorías cerradas
  const categoriaRoutes: MetadataRoute.Sitemap = CATEGORIAS.map((cat) => ({
    url: `${baseUrl}/eventos/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 3. Rutas de las 19 zonas / parroquias oficiales
  const zonaRoutes: MetadataRoute.Sitemap = ZONAS.map((zona) => ({
    url: `${baseUrl}/eventos/zona/${zonaToSlug(zona.nombre)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 4. Rutas dinámicas de eventos únicamente APROBADOS
  const eventosAprobados = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    select: {
      slug: true,
      createdAt: true,
    },
  });

  const eventoRoutes: MetadataRoute.Sitemap = eventosAprobados.map((evento) => ({
    url: `${baseUrl}/eventos/${evento.slug}`,
    lastModified: evento.createdAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [homeRoute, ...categoriaRoutes, ...zonaRoutes, ...eventoRoutes];
}
