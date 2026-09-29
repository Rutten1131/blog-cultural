import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatFechaLoja } from "@/lib/fechas";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0d0f17",
              color: "#ffffff",
              fontFamily: "sans-serif",
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Agenda Cultural Loja
            </div>
            <p style={{ fontSize: 24, color: "#9ca3af", marginTop: 12 }}>
              Cartelera oficial de eventos y cultura en Loja, Ecuador
            </p>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const evento = await prisma.evento.findFirst({
      where: { slug, estado: "APROBADO" },
      include: { categoria: true, zona: true },
    });

    if (!evento) {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0d0f17",
              color: "#ffffff",
              fontFamily: "sans-serif",
              fontSize: 36,
            }}
          >
            Evento no encontrado — Agenda Cultural Loja
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const fechaFormateada = formatFechaLoja(evento.fecha, "largo");
    const categoriaNombre = evento.categoria?.nombre || "Cultura";
    const zonaNombre = evento.zona?.nombre || "Loja";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: "#090a0f",
            fontFamily: "sans-serif",
            color: "#ffffff",
            overflow: "hidden",
          }}
        >
          {/* Fondo difuminado si hay imagen del evento */}
          {evento.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={evento.imagenUrl}
              alt=""
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.28,
                filter: "blur(8px)",
              }}
            />
          ) : null}

          {/* Gradiente oscuro encima para legibilidad suprema */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(9,10,15,0.95) 0%, rgba(9,10,15,0.75) 50%, rgba(9,10,15,0.92) 100%)",
            }}
          />

          {/* Contenido principal */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              height: "100%",
              padding: "50px 60px",
              zIndex: 10,
              alignItems: "center",
              justifyContent: "space-between",
              gap: 40,
            }}
          >
            {/* Columna Izquierda: Datos del Evento */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              {/* Header: Marca + Categoría */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "#000000",
                    fontWeight: 800,
                    fontSize: 16,
                    padding: "6px 14px",
                    borderRadius: 999,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {categoriaNombre}
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "#e5e7eb",
                    fontSize: 16,
                    padding: "6px 14px",
                    borderRadius: 999,
                  }}
                >
                  📍 {zonaNombre}
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(34,197,94,0.2)",
                    color: "#4ade80",
                    border: "1px solid rgba(34,197,94,0.4)",
                    fontSize: 15,
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: 999,
                  }}
                >
                  ✨ Entrada Libre
                </span>
              </div>

              {/* Título del Evento */}
              <div style={{ display: "flex", flexDirection: "column", marginTop: 24, marginBottom: 24 }}>
                <h1
                  style={{
                    fontSize: evento.nombre.length > 50 ? 40 : 48,
                    fontWeight: 900,
                    lineHeight: 1.15,
                    color: "#ffffff",
                    letterSpacing: "-0.5px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                  }}
                >
                  {evento.nombre}
                </h1>
                <p
                  style={{
                    fontSize: 22,
                    color: "#fbbf24",
                    fontWeight: 600,
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  📅 {fechaFormateada}
                </p>
                <p
                  style={{
                    fontSize: 19,
                    color: "#d1d5db",
                    marginTop: 4,
                  }}
                >
                  🏛️ {evento.lugar}
                </p>
              </div>

              {/* Footer con Branding Oficial */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  borderTop: "1px solid rgba(255,255,255,0.15)",
                  paddingTop: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#f59e0b",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Agenda Cultural Loja
                </div>
                <span style={{ color: "#6b7280" }}>•</span>
                <div style={{ fontSize: 16, color: "#9ca3af" }}>
                  agendaculturalloja.com
                </div>
              </div>
            </div>

            {/* Columna Derecha: Póster del evento enmarcado */}
            {evento.imagenUrl ? (
              <div
                style={{
                  display: "flex",
                  width: 380,
                  height: 480,
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.15)",
                  flexShrink: 0,
                  backgroundColor: "#1f2937",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={evento.imagenUrl}
                  alt={evento.nombre}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 360,
                  height: 460,
                  borderRadius: 20,
                  border: "2px dashed rgba(245,158,11,0.4)",
                  backgroundColor: "rgba(245,158,11,0.05)",
                  flexShrink: 0,
                  padding: 30,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 50 }}>🎭</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#f59e0b",
                    marginTop: 14,
                  }}
                >
                  Cultura & Arte Loja
                </div>
                <p style={{ fontSize: 15, color: "#9ca3af", marginTop: 8 }}>
                  Vive la experiencia en vivo
                </p>
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generando OG Image:", error);
    return new Response("Error generando imagen Open Graph", { status: 500 });
  }
}
