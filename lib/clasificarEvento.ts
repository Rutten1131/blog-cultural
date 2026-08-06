import "server-only";
import { CATEGORIAS, ZONAS } from "./constants";

export interface ClasificacionResultado {
  categoriaSlug: string | null;
  zonaNombre: string | null;
  confianza: number | null;
}

export async function clasificarEvento(datos: {
  nombre: string;
  lugar: string;
  descripcion: string;
}): Promise<ClasificacionResultado> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn("GROQ_API_KEY no configurada. Omitiendo clasificación IA.");
    return { categoriaSlug: null, zonaNombre: null, confianza: null };
  }

  const listaCategorias = CATEGORIAS.map(
    (c) => `- ${c.slug} (${c.nombre})`
  ).join("\n");

  const listaZonas = ZONAS.map((z) => `- ${z.nombre} (${z.tipo})`).join("\n");

  const systemPrompt = `Eres un clasificador experto de eventos culturales para la ciudad de Loja, Ecuador.
Tu tarea es analizar el nombre, lugar y descripción de un evento y asignarle exactamente una categoría y una zona (parroquia) de las listas cerradas provistas.

CATEGORÍAS PERMITIDAS (utiliza exactamente el slug):
${listaCategorias}

ZONAS PERMITIDAS (utiliza exactamente el nombre):
${listaZonas}

REGLAS STRICTAS:
1. Responde ÚNICAMENTE un objeto JSON válido sin texto alrededor, sin explicaciones ni markdown/codeblocks.
2. Estructura exacta requerida:
{
  "categoria": "slug-de-categoria-permitida",
  "zona": "Nombre Exacto de Zona Permitida",
  "confianza": 0.95
}
3. "categoria" debe coincidir EXACTAMENTE con uno de los slugs de las categorías permitidas.
4. "zona" debe coincidir EXACTAMENTE con uno de los nombres de zonas permitidas.
5. "confianza" es un número decimal entre 0 y 1. Si no estás seguro del lugar o la categoría, asigna una confianza baja (ej. 0.3).
`;

  const userPrompt = `Evento a clasificar:
Nombre: ${datos.nombre}
Lugar: ${datos.lugar}
Descripción: ${datos.descripcion}`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Error en llamada a API Groq:",
        response.status,
        await response.text()
      );
      return { categoriaSlug: null, zonaNombre: null, confianza: null };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { categoriaSlug: null, zonaNombre: null, confianza: null };
    }

    const parsed = JSON.parse(content);

    const categoriaValida = CATEGORIAS.some((c) => c.slug === parsed.categoria)
      ? parsed.categoria
      : null;

    const zonaValida = ZONAS.some((z) => z.nombre === parsed.zona)
      ? parsed.zona
      : null;

    const confianzaValida =
      typeof parsed.confianza === "number" &&
      parsed.confianza >= 0 &&
      parsed.confianza <= 1
        ? parsed.confianza
        : null;

    return {
      categoriaSlug: categoriaValida,
      zonaNombre: zonaValida,
      confianza: confianzaValida,
    };
  } catch (error) {
    console.error("Error en clasificarEvento:", error);
    return { categoriaSlug: null, zonaNombre: null, confianza: null };
  }
}
