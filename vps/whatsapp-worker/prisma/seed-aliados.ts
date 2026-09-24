import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace("/", ""),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Comprobando aliados comerciales...");
  const countAliados = await prisma.aliado.count();

  if (countAliados === 0) {
    console.log("Insertando aliados iniciales...");
    await prisma.aliado.createMany({
      data: [
        {
          nombre: "Hotel Gran Victoria Boutique",
          tipo: "HOSPEDAJE",
          descripcion: "Exclusivo hotel boutique ubicado en el corazón colonial de Loja. Habitaciones elegantes con detalles en madera, desayuno lojano de cortesía y atención de primer nivel.",
          ubicacion: "Calle Bernardo Valdivieso y José Antonio Eguiguren (Centro Histórico), Loja",
          mapaUrl: "https://maps.google.com/?q=Hotel+Gran+Victoria+Loja",
          rangoPrecio: "$45 - $80 / noche",
          servicios: "Wifi fibra óptica, Desayuno gourmet, Restaurante & Bar, Parqueadero cubierto privado, Room service",
          cuartos: "Habitaciones Matrimoniales Superior, Suites Ejecutivas con balcón colonial, Habitaciones Familiares",
          telefono: "593991234567",
          websiteUrl: "https://granvictoriahotel.com",
          redesUrl: "https://instagram.com/hotelgranvictoria",
          imagenUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
          destacado: true,
          activo: true,
        },
        {
          nombre: "Hostal Colonial Puerta del Sol",
          tipo: "HOSPEDAJE",
          descripcion: "Alojamiento acogedor y tradicional a solo 2 cuadras del Parque Central y Puerta de la Ciudad. Ideal para turistas, familias y viajeros de negocios que buscan confort y economía.",
          ubicacion: "Av. Universitaria y 10 de Agosto, Loja",
          mapaUrl: "https://maps.google.com/?q=Puerta+de+la+Ciudad+Loja",
          rangoPrecio: "$25 - $40 / noche",
          servicios: "Wifi gratuito, Café lojano de cortesía 24/7, Asesoría turística, Agua caliente continua, Tv por cable",
          cuartos: "Individuales ejecutivas, Dobles gemelas, Triples para grupos y amigos",
          telefono: "593987654321",
          websiteUrl: "https://puertadelsolhostal.ec",
          redesUrl: "https://facebook.com/hostalpuertadelsol",
          imagenUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
          destacado: true,
          activo: true,
        },
        {
          nombre: "Cabañas & Resort Ecológico Vilcabamba Valley",
          tipo: "HOSPEDAJE",
          descripcion: "Sumérgete en el valle de la eterna juventud. Hermosas cabañas rústicas con vista a los cerros Mandango y Podocarpus, piscina temperada y senderos de naturaleza.",
          ubicacion: "Valle de Vilcabamba (A 40 min de Loja)",
          mapaUrl: "https://maps.google.com/?q=Vilcabamba+Loja",
          rangoPrecio: "$50 - $95 / noche",
          servicios: "Piscina al aire libre, Spa natural, Senderismo guiado, Restaurante orgánico vegano/tradicional, Zona de fogata",
          cuartos: "Cabañas privadas con hamaca, Suites panorámicas de luna de miel, Bungalows familiares",
          telefono: "593979876543",
          websiteUrl: "https://vilcabambaresort.com",
          redesUrl: "https://instagram.com/vilcabambaresort",
          imagenUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
          destacado: true,
          activo: true,
        },
      ],
    });
    console.log("¡3 Aliados creados exitosamente!");
  } else {
    console.log(`Ya existen ${countAliados} aliados en la base de datos.`);
  }

  console.log("Comprobando atractivos cantonales...");
  const countAtractivos = await prisma.atractivoCantonal.count();

  if (countAtractivos === 0) {
    console.log("Insertando atractivos cantonales...");
    await prisma.atractivoCantonal.createMany({
      data: [
        {
          nombre: "Los Picachos y Cascada La Virgen",
          canton: "Saraguro",
          descripcion: "Formaciones rocosas milenarias sagradas para la cosmovisión andina del pueblo indígena Saraguro, acompañadas de una hermosa cascada y senderismo místico.",
          distancia: "A 1h 15 min de Loja (65 km)",
          ruta: "Vía Panamericana Norte Loja - Cuenca hasta Saraguro (cooperativas de buses cada 30 min desde el Terminal Terrestre de Loja).",
          imagenUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
          mapaUrl: "https://maps.google.com/?q=Saraguro+Loja",
          activo: true,
        },
        {
          nombre: "Cerro Mandango y Reserva Vilcabamba",
          canton: "Vilcabamba (Loja)",
          descripcion: "El emblemático 'Dios acostado' de Vilcabamba. Ruta de trekking y mirador con vista 360° a todo el valle de la longevidad y avistamiento de aves.",
          distancia: "A 45 min de Loja (40 km)",
          ruta: "Vía al Sur por Malacatos hacia Vilcabamba. Acceso señalizado desde la plaza central.",
          imagenUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
          mapaUrl: "https://maps.google.com/?q=Cerro+Mandango+Vilcabamba",
          activo: true,
        },
        {
          nombre: "Bosque Petrificado de Puyango",
          canton: "Puyango",
          descripcion: "Una de las mayores colecciones de madera fosilizada del planeta con más de 100 millones de años, en medio de un bosque seco tropical único.",
          distancia: "A 2h 45 min de Loja (110 km)",
          ruta: "Vía Loja - Catamayo - Catacocha - Puyango.",
          imagenUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
          mapaUrl: "https://maps.google.com/?q=Bosque+Petrificado+de+Puyango",
          activo: true,
        },
      ],
    });
    console.log("¡Atractivos cantonales creados exitosamente!");
  } else {
    console.log(`Ya existen ${countAtractivos} atractivos cantonales.`);
  }
}

main()
  .then(() => {
    console.log("Seeding completado.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error en seed-aliados:", e);
    process.exit(1);
  });
