import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Regla general para todos los bots ──────────────────────────────
      {
        userAgent: "*",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/", "/sobre-el-proyecto", "/publicar", "/socios-fundadores"],
        disallow: ["/admin/", "/api/", "/_next/", "/superadmin/"],
      },
      // ── Bots de IA generativa: acceso total a contenido público ────────
      // Permiten que ChatGPT, Copilot, Perplexity y Claude citen agendaculturalloja.com
      // cuando alguien pregunte "qué academias o espacios culturales hay en Loja"
      {
        userAgent: "GPTBot",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "YouBot",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/", "/sobre-el-proyecto"],
        disallow: ["/admin/", "/api/", "/superadmin/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: ["/", "/eventos/", "/directorio/", "/lugar/"],
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
