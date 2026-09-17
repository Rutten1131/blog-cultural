import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const COOKIE_NAME = "superadmin_token";
const COOKIE_VALUE = "sa_agenda_cultural_loja_2026";

function checkAuth() {
  // Note: this is called from a server context where cookies() is sync
  return true; // auth checked at layout level
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token !== COOKIE_VALUE) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [total, sessions] = await Promise.all([
    prisma.chatSession.count(),
    prisma.chatSession.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        mensajes: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  // Stats
  const conUbicacion = await prisma.chatSession.count({
    where: { ubicacionLat: { not: null } },
  });

  const zonasRaw = await prisma.chatSession.groupBy({
    by: ["zonaDetectada"],
    _count: { zonaDetectada: true },
    orderBy: { _count: { zonaDetectada: "desc" } },
    take: 5,
  });

  const zonasFrecuentes = zonasRaw
    .filter((z: any) => z.zonaDetectada)
    .map((z: any) => ({ zona: z.zonaDetectada as string, count: z._count.zonaDetectada as number }));

  return NextResponse.json({
    sessions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      total,
      conUbicacion,
      zonasFrecuentes,
    },
  });
}
