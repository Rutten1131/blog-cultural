import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Caché en memoria para evitar llamar a Groq si el mismo texto ya fue traducido al mismo idioma
// Clave: `${targetLang}:${hash(text)}`
const translationCache = new Map<string, { title?: string; description: string; location?: string; isTranslated?: boolean }>();
let groqCooldownUntil = 0;


function generateKey(targetLang: string, text: string): string {
  // Hash rápido y simple para textos de cualquier tamaño
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `${targetLang}_${hash}_${text.length}`;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French (Français)",
  de: "German (Deutsch)",
  pt: "Portuguese (Português)",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, location, targetLang } = body;

    if (!description && !title) {
      return NextResponse.json({ error: "Faltan datos para traducir" }, { status: 400 });
    }

    // Si el idioma destino es español, devolver el original
    if (targetLang === "es" || !targetLang) {
      return NextResponse.json({
        title: title || "",
        description: description || "",
        location: location || "",
      });
    }

    const cacheKey = generateKey(targetLang, `${title || ""}:::${description || ""}:::${location || ""}`);
    if (translationCache.has(cacheKey)) {
      return NextResponse.json(translationCache.get(cacheKey));
    }

    const groqKey = process.env.GROQ_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    const targetLanguageName = LANGUAGE_NAMES[targetLang] || targetLang;

    const systemPrompt = `You are a professional literary and cultural translator for the official Cultural and Tourism Agenda of Loja, Ecuador (Agenda Cultural Loja).
Your mission is to translate event information from Spanish into ${targetLanguageName} with exceptional naturalness, richness, and cultural accuracy.

CRITICAL TRANSLATION RULES:
1. NEVER translate proper names of venues, parks, streets, avenues, parishes, and landmarks literally.
   - Examples: Keep "Teatro Benjamín Carrión", "Teatro Bolívar", "Parque Central", "Calle 10 de Agosto", "Vilcabamba", "San Sebastián", "Casa de la Cultura", "Plaza de San Francisco" exactly as they are so tourists can find them in GPS and maps without getting lost.
2. Translate the essence, dates, artistic descriptions, themes, and invites smoothly, accurately, and appealingly for foreign visitors and cultural travelers.
3. If "location" is provided, do NOT translate proper street names or venue names; you may only clarify prepositions if necessary (e.g., "At Teatro Bolívar").
4. Return ONLY a valid JSON object without markdown formatting, code blocks, or extra text.
Format:
{
  "title": "translated title",
  "description": "translated description",
  "location": "translated or preserved location"
}`;

    const userPayload = {
      title: title || "",
      description: description || "",
      location: location || "",
    };

    let translatedData: { title?: string; description: string; location?: string } | null = null;

    // 1. Intentar con Groq si la key está presente y no estamos en enfriamiento por 429
    const now = Date.now();
    if (groqKey && now > groqCooldownUntil) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(userPayload) },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2, // Baja temperatura para consistencia y fidelidad
            max_tokens: 1500,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            translatedData = JSON.parse(content);
          }
        } else if (groqRes.status === 429) {
          // Si Groq nos limita por rate limit (429), activamos enfriamiento de 30 segundos
          // y pasamos automáticamente a DeepSeek
          groqCooldownUntil = Date.now() + 30000;
          console.warn("Groq rate limited (429). Activando cooldown de 30s y pasando a DeepSeek.");
        } else {
          console.error("Groq translate error HTTP:", groqRes.status);
        }
      } catch (err) {
        console.error("Error llamando a Groq para traducción:", err);
      }
    }

    // 2. Fallback a DeepSeek si Groq llegara a fallar
    if (!translatedData && deepseekKey) {
      try {
        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(userPayload) },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 1500,
          }),
        });

        if (dsRes.ok) {
          const data = await dsRes.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            translatedData = JSON.parse(content);
          }
        }
      } catch (err) {
        console.error("Error llamando a DeepSeek para traducción:", err);
      }
    }

    if (!translatedData) {
      // Fallback seguro: devolver original si no se pudo conectar con las IAs
      return NextResponse.json({
        title: title || "",
        description: description || "",
        location: location || "",
        isOriginal: true,
      });
    }

    const result = {
      title: translatedData.title || title || "",
      description: translatedData.description || description || "",
      location: translatedData.location || location || "",
      isTranslated: true,
    };

    // Guardar en caché
    translationCache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error en API translate:", error);
    return NextResponse.json({ error: "Error interno en traducción" }, { status: 500 });
  }
}
