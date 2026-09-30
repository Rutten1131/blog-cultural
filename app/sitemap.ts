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

  // 2. Rutas de las categorías activas (artes-vivas redirige a /festival-artes-vivas-loja-2026)
  const categoriaRoutes: MetadataRoute.Sitemap = CATEGORIAS
    .filter((cat) => cat.slug !== "artes-vivas")
    .map((cat) => ({
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
      updatedAt: true,
    },
  });

  const eventoRoutes: MetadataRoute.Sitemap = eventosAprobados.map((evento) => ({
    url: `${baseUrl}/eventos/${evento.slug}`,
    lastModified: evento.updatedAt ?? evento.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // 5. Página estática institucional del Proyecto y Landing pages de alta prioridad SEO
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/eventos`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/eventos/esta-semana`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/eventos/este-fin-de-semana`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/festival-artes-vivas-loja-2026`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/socios-fundadores`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/sobre-el-proyecto`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/publicar`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  // 6. Rutas de los recintos culturales (venues) de Loja
  const venueSlugs = [
    "teatro-benjamin-carrion",
    "teatro-bolivar",
    "teatro-segundo-cueva-celi",
    "casona-cultural",
    "casa-de-la-cultura",
    "plaza-san-sebastian",
    "parque-jipiro",
    "museo-musica-loja",
  ];
  const venueRoutes: MetadataRoute.Sitemap = venueSlugs.map((slug) => ({
    url: `${baseUrl}/lugar/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [homeRoute, ...staticRoutes, ...venueRoutes, ...categoriaRoutes, ...zonaRoutes, ...eventoRoutes];
}
