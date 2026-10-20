/**
 * 🗺️ Catálogo Oficial de los 16 Cantones de la Provincia de Loja
 * y motor de resolución geo-territorial a partir de parroquias, lugares y texto.
 */

export interface CantonDefinicion {
  slug: string;
  nombre: string;
  parroquiasYLocalidades: string[];
}

export const CANTONES_LOJA: CantonDefinicion[] = [
  {
    slug: "loja",
    nombre: "Loja",
    parroquiasYLocalidades: [
      "el sagrario", "sucre", "el valle", "san sebastián", "san sebastian", "punzara", "carigán", "carigan",
      "chantaco", "chuquiribamba", "el cisne", "gualel", "jimbilla", "malacatos", "quinara", "san lucas",
      "san pedro de vilcabamba", "santiago", "taquil", "vilcabamba", "yangana", "jipiro", "zamora huayco",
      "motupe", "casona", "teatro bolívar", "teatro bolivar", "benjamín carrión", "benjamin carrion", "puerta de la ciudad"
    ],
  },
  {
    slug: "catamayo",
    nombre: "Catamayo",
    parroquiasYLocalidades: ["catamayo", "la toma", "san pedro de la bendita", "el tambo", "guayabal", "el paraíso", "el paraiso"],
  },
  {
    slug: "saraguro",
    nombre: "Saraguro",
    parroquiasYLocalidades: ["saraguro", "san antonio de cumbe", "el tablón", "el tablon", "lluzhapa", "manu", "manú", "san pablo de tenta", "san sebastián de yúluc", "selva alegre", "urdaneta"],
  },
  {
    slug: "calvas",
    nombre: "Calvas",
    parroquiasYLocalidades: ["calvas", "cariamanga", "chile", "san vicente", "colaisaca", "el lucero", "utuana", "sanguillín", "sanguillin", "ahuaca"],
  },
  {
    slug: "paltas",
    nombre: "Paltas",
    parroquiasYLocalidades: ["paltas", "catacocha", "cangonamá", "cangonama", "guachanamá", "guachanama", "lauro guerrero", "oriana", "san antonio", "casanga", "yamana"],
  },
  {
    slug: "zapotillo",
    nombre: "Zapotillo",
    parroquiasYLocalidades: ["zapotillo", "mangahurco", "garzareal", "limones", "paletillas", "bolaspamba", "cazaderos", "guayacan", "guayacán", "florecimiento"],
  },
  {
    slug: "puyango",
    nombre: "Puyango",
    parroquiasYLocalidades: ["puyango", "alamor", "ciena", "el limo", "floresta", "mercator", "bosque petrificado"],
  },
  {
    slug: "celica",
    nombre: "Celica",
    parroquiasYLocalidades: ["celica", "cruzpamba", "chahuarpamba", "pozul", "pózul", "sabanilla", "san juan de pózul"],
  },
  {
    slug: "gonzanama",
    nombre: "Gonzanamá",
    parroquiasYLocalidades: ["gonzanama", "gonzanamá", "changaimina", "nambacola", "purunuma", "sacapalca", "quilanga antigua"],
  },
  {
    slug: "quilanga",
    nombre: "Quilanga",
    parroquiasYLocalidades: ["quilanga", "san antonio de las aradas", "fundochamba"],
  },
  {
    slug: "espindola",
    nombre: "Espíndola",
    parroquiasYLocalidades: ["espindola", "espíndola", "amaluza", "bellavista", "jimbura", "santa teresita", "27 de abril", "el ingenio", "el airombo"],
  },
  {
    slug: "sozoranga",
    nombre: "Sozoranga",
    parroquiasYLocalidades: ["sozoranga", "nueva fátima", "nueva fatima", "tacamoros"],
  },
  {
    slug: "macara",
    nombre: "Macará",
    parroquiasYLocalidades: ["macara", "macará", "larama", "la victoria", "sabiango"],
  },
  {
    slug: "pindal",
    nombre: "Pindal",
    parroquiasYLocalidades: ["pindal", "chaquinal", "12 de diciembre", "milagros"],
  },
  {
    slug: "chaguarpamba",
    nombre: "Chaguarpamba",
    parroquiasYLocalidades: ["chaguarpamba", "buenavista", "el rosario", "santa rufina", "amarillos"],
  },
  {
    slug: "olmedo",
    nombre: "Olmedo",
    parroquiasYLocalidades: ["olmedo", "la tingue"],
  },
];

/**
 * Resuelve de forma determinista el cantón de un evento dado su lugar, parroquia (zona) y descripción.
 */
export function resolverCantonEvento(datos: {
  lugar?: string | null;
  parroquiaNombre?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
}): { slug: string; nombre: string } {
  const texto = `${datos.lugar || ""} ${datos.parroquiaNombre || ""} ${datos.nombre || ""} ${datos.descripcion || ""}`.toLowerCase();

  // 1. Evaluar primero cantones externos a Loja (Catamayo, Saraguro, Zapotillo, etc.)
  for (const canton of CANTONES_LOJA) {
    if (canton.slug === "loja") continue; // Reservamos Loja como base

    for (const localidad of canton.parroquiasYLocalidades) {
      if (texto.includes(localidad)) {
        return { slug: canton.slug, nombre: canton.nombre };
      }
    }
  }

  // 2. Si no es un cantón externo, verificar si coincide con localidades de Loja cantón
  const cantonLoja = CANTONES_LOJA.find((c) => c.slug === "loja")!;
  for (const localidad of cantonLoja.parroquiasYLocalidades) {
    if (texto.includes(localidad)) {
      return { slug: cantonLoja.slug, nombre: cantonLoja.nombre };
    }
  }

  // Fallback por defecto: Cantón Loja (capital provincial)
  return { slug: "loja", nombre: "Loja" };
}
