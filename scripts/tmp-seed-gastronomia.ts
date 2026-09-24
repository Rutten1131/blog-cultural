/**
 * Agrega CAFETERIA al enum TipoAliado en la BD y crea datos de prueba:
 * 3 restaurantes (GASTRONOMIA) y 3 cafeterías (CAFETERIA).
 * Ejecutar: npx tsx scripts/tmp-seed-gastronomia.ts
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { stringifyImagenesHabitacion } from "../lib/habitaciones";

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

type NuevoAliado = {
  nombre: string;
  tipo: "GASTRONOMIA" | "CAFETERIA";
  descripcion: string;
  ubicacion: string;
  rangoPrecio: string;
  servicios: string;
  telefono: string;
  websiteUrl: string;
  redesUrl: string;
  imagenUrl: string;
  estrellas: number;
  categorias: { nombre: string; precio: string; caracteristicas: string; imagenes: string[] }[];
};

const NUEVOS: NuevoAliado[] = [
  // ─── RESTAURANTES ───
  {
    nombre: "Restaurante La Huerta Lojana",
    tipo: "GASTRONOMIA",
    descripcion:
      "Comida típica lojana de huerta a la mesa: mote pillo, repe, cecina y tamales al vapor en un patio colonial con terraza.",
    ubicacion: "Av. Universitaria y 18 de Noviembre, Loja",
    rangoPrecio: "$8 - $18 por persona",
    servicios: "Terraza, menú del día, wifi, opciones vegetarianas, parqueadero",
    telefono: "593991110001",
    websiteUrl: "https://lahuertalojana.ec",
    redesUrl: "https://instagram.com/lahuertalojana",
    imagenUrl: U("photo-1517248135467-4c7edcad34c4"),
    estrellas: 4,
    categorias: [
      {
        nombre: "Almuerzo del día",
        precio: "$8 / persona",
        caracteristicas: "Sopa, segundo con arroz, menestra, jugo natural y postre. De lunes a sábado.",
        imagenes: [U("photo-1552566626-52f8b828add9"), U("photo-1414235077428-338989a2e8c0")],
      },
      {
        nombre: "Cena a la carta",
        precio: "$12 - $18 / persona",
        caracteristicas: "Cecina lojana, trucha frita, repe con queso y choclo, más postres de la casa.",
        imagenes: [U("photo-1555396273-367ea4eb4db5")],
      },
    ],
  },
  {
    nombre: "Parrilladas El Fogón del Sur",
    tipo: "GASTRONOMIA",
    descripcion:
      "Parrilladas al carbón y carnes maduradas con música en vivo los viernes. Ambiente rústico ideal para grupos.",
    ubicacion: "Av. Pío Jaramillo Alvarado y Villonaco, Loja",
    rangoPrecio: "$12 - $28 por persona",
    servicios: "Parrilla al carbón, música en vivo viernes, parqueadero, reservas para grupos",
    telefono: "593991110002",
    websiteUrl: "https://elfogondelsur.ec",
    redesUrl: "https://facebook.com/elfogondelsur",
    imagenUrl: U("photo-1544025162-d76694265947"),
    estrellas: 5,
    categorias: [
      {
        nombre: "Parrillada personal",
        precio: "$12 / persona",
        caracteristicas: "Churrasco, chorizo, costilla, papas rústicas, ensalada y chimichurri de la casa.",
        imagenes: [U("photo-1466978913421-dad2ebd01d17"), U("photo-1529193591184-b1d58069ecdd")],
      },
      {
        nombre: "Parrillada familiar",
        precio: "$28 / 3 personas",
        caracteristicas: "Tabla completa de carnes, guarniciones, salsas de la casa y limonada.",
        imagenes: [U("photo-1558030006-450675393462")],
      },
    ],
  },
  {
    nombre: "Sabores de Vilcabamba",
    tipo: "GASTRONOMIA",
    descripcion:
      "Cocina de autor con ingredientes del valle: trucha, vegetales orgánicos y opciones veganas en terraza con vista.",
    ubicacion: "Calle Sucre, frente al parque central de Vilcabamba",
    rangoPrecio: "$10 - $22 por persona",
    servicios: "Terraza con vista, opciones veganas y sin gluten, jugos naturales, wifi",
    telefono: "593991110003",
    websiteUrl: "https://saboresdevilcabamba.ec",
    redesUrl: "https://instagram.com/saboresdevilcabamba",
    imagenUrl: U("photo-1414235077428-338989a2e8c0"),
    estrellas: 4,
    categorias: [
      {
        nombre: "Plato vegano del valle",
        precio: "$10 / plato",
        caracteristicas: "Bowl de quinua, vegetales asados del huerto, palta y aderezo de hierbas.",
        imagenes: [U("photo-1512621776951-a57141f2eefd")],
      },
      {
        nombre: "Trucha al limón",
        precio: "$15 / plato",
        caracteristicas: "Trucha fresca de río con limón, papas nativas y ensalada de la casa.",
        imagenes: [U("photo-1467003909585-2f8a72700288"), U("photo-1519708227418-c8fd9a32b7a2")],
      },
    ],
  },
  // ─── CAFETERÍAS ───
  {
    nombre: "Café El Mirador Lojano",
    tipo: "CAFETERIA",
    descripcion:
      "Café de altura tostado en Loja con la mejor vista de la ciudad. Postres caseros y ambiente tranquilo para conversar.",
    ubicacion: "Av. Villonaco, mirador de la ciudad, Loja",
    rangoPrecio: "$3 - $8 por persona",
    servicios: "Café de especialidad, vista panorámica, postres caseros, wifi, pet friendly",
    telefono: "593991110004",
    websiteUrl: "https://elmiradorlojano.ec",
    redesUrl: "https://instagram.com/elmiradorlojano",
    imagenUrl: U("photo-1509042239860-f550ce710b93"),
    estrellas: 5,
    categorias: [
      {
        nombre: "Café de altura",
        precio: "$3 / taza",
        caracteristicas: "Grano de Vilcabamba tostado artesanalmente: espresso, americano, capuchino o cold brew.",
        imagenes: [U("photo-1495474472287-4d71bcdd2085"), U("photo-1442512595331-e89e73853f31")],
      },
      {
        nombre: "Merienda del mirador",
        precio: "$8 / combo",
        caracteristicas: "Café a elección + torta de chocolate lojana o cheesecake de maracuyá.",
        imagenes: [U("photo-1554118811-1e0d58224f24")],
      },
    ],
  },
  {
    nombre: "Puerta del Sol Coffee",
    tipo: "CAFETERIA",
    descripcion:
      "Cafetería bohemia en el Centro Histórico, a pasos de la Puerta de la Ciudad. Sánduches, jugos y wifi para trabajar.",
    ubicacion: "Calle Bolívar y Sucre, Centro Histórico, Loja",
    rangoPrecio: "$2.50 - $9 por persona",
    servicios: "Wifi de fibra, enchufes en cada mesa, sánduches, jugos naturales, atención hasta las 22h",
    telefono: "593991110005",
    websiteUrl: "https://puertadelsolcoffee.ec",
    redesUrl: "https://instagram.com/puertadelsolcoffee",
    imagenUrl: U("photo-1521017432531-fbd92d768814"),
    estrellas: 4,
    categorias: [
      {
        nombre: "Cafés y métodos",
        precio: "$2.50 - $4",
        caracteristicas: "Espresso, capuchino, V60, prensa francesa y chocolate caliente con canela.",
        imagenes: [U("photo-1461023058943-07fcbe16d735"), U("photo-1514432324607-a09d9b4aefdd")],
      },
      {
        nombre: "Sánduches y desayunos",
        precio: "$4 - $9",
        caracteristicas: "Sánduche de pollo, croissant con jamón, tostadas con palta y combos de desayuno.",
        imagenes: [U("photo-1528735602780-2552fd46c7af")],
      },
    ],
  },
  {
    nombre: "Tostado Café de Altura",
    tipo: "CAFETERIA",
    descripcion:
      "Microtostaduría en El Valle: tueste propio, métodos filtrados y panadería artesanal recién horneada.",
    ubicacion: "Barrio El Valle, vía a Malacatos, Loja",
    rangoPrecio: "$3 - $10 por persona",
    servicios: "Tueste propio, V60 y Chemex, panadería artesanal, venta de café en grano, parqueadero",
    telefono: "593991110006",
    websiteUrl: "https://tostadocafe.ec",
    redesUrl: "https://instagram.com/tostadocafe",
    imagenUrl: U("photo-1447933601403-0c6688de566e"),
    estrellas: 4,
    categorias: [
      {
        nombre: "Métodos filtrados",
        precio: "$3.50 - $5",
        caracteristicas: "V60, Chemex y aeropress con granos de temporada. Cata guiada disponible.",
        imagenes: [U("photo-1497935586351-b67a49e012bf"), U("photo-1504630083234-14187a9df0f5")],
      },
      {
        nombre: "Panadería artesanal",
        precio: "$2 - $10",
        caracteristicas: "Pan de masa madre, croissants, cinnamon rolls y venta de café en grano (250 g y 500 g).",
        imagenes: [U("photo-1509440159596-0249088772ff")],
      },
    ],
  },
];

async function main() {
  // 1. Enum
  await prisma.$executeRawUnsafe(
    "ALTER TABLE `aliados` MODIFY `tipo` ENUM('HOSPEDAJE','GASTRONOMIA','CAFETERIA','EXPERIENCIA','TRANSPORTE','CANTON_GAD','CULTURA_ARTE','COMERCIO','OTRO') NOT NULL DEFAULT 'HOSPEDAJE'"
  );
  const col = await prisma.$queryRawUnsafe<any[]>("SHOW COLUMNS FROM `aliados` LIKE 'tipo'");
  console.log("✔ tipo:", col[0]?.Type);

  // 2. Datos de prueba
  for (const n of NUEVOS) {
    const ya = await prisma.aliado.findFirst({ where: { nombre: n.nombre } });
    if (ya) {
      console.log(`= ${n.nombre} (ya existe)`);
      continue;
    }
    const creado = await prisma.aliado.create({
      data: {
        nombre: n.nombre,
        tipo: n.tipo,
        descripcion: n.descripcion,
        ubicacion: n.ubicacion,
        rangoPrecio: n.rangoPrecio,
        servicios: n.servicios,
        telefono: n.telefono,
        websiteUrl: n.websiteUrl,
        redesUrl: n.redesUrl,
        imagenUrl: n.imagenUrl,
        estrellas: n.estrellas,
        destacado: true,
        activo: true,
        habitaciones: {
          create: n.categorias.map((c, i) => ({
            nombre: c.nombre,
            precio: c.precio,
            caracteristicas: c.caracteristicas,
            imagenes: stringifyImagenesHabitacion(c.imagenes),
            orden: i,
          })),
        },
      },
    });
    console.log(`OK ${n.tipo === "CAFETERIA" ? "☕" : "🍽️"} ${creado.nombre} (ID ${creado.id}) con ${n.categorias.length} categorías`);
  }

  const resumen = await prisma.aliado.groupBy({ by: ["tipo"], _count: true });
  console.log("\nResumen por tipo:", JSON.stringify(resumen));
  await prisma.$disconnect();
}
main();
