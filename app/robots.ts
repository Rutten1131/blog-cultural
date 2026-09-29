import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Regla general para todos los bots ──────────────────────────────
      {
        userAgent: "*",
        allow: ["/", "/eventos/", "/sobre-el-proyecto", "/publicar", "/socios-fundadores"],
        disallow: ["/admin/", "/api/", "/_next/", "/superadmin/"],
      },
      // ── Bots de IA generativa: acceso total a contenido público ────────
      // Permiten que ChatGPT, Copilot y Perplexity citen agendaculturalloja.com
      // cuando alguien pregunte "qué eventos hay en Loja"
      {
        userAgent: "GPTBot",
        allow: ["/", "/eventos/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: ["/", "/eventos/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/eventos/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/eventos/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "YouBot",
        allow: ["/", "/eventos/"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/eventos/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: ["/", "/eventos/"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      // ── Auditoría SEO profesional ────────────────────────────────────
      {
        userAgent: "AhrefsBot",
        allow: ["/", "/eventos/"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "SemrushBot",
        allow: ["/", "/eventos/"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
