const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function test() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const systemPrompt = `Eres el asistente turístico y cultural oficial de la Agenda Cultural Loja (Ecuador).
EVENTO PRINCIPAL EN DISCUSIÓN:
[ID:91] Boleros Pasillos | Estado:PRÓXIMO | Fecha:sáb, 26 de septiembre de 2026 | Lugar:Teatro Bolivar | Descripción:Concierto en vivo dedicado a los boleros y pasillos tradicionales ecuatorianos y latinoamericanos. | Enlace:/eventos/boleros-pasillos-2026-09-25-teatro-bolivar

INSTRUCCIÓN ESPECIAL: El usuario está preguntando de qué trata o detalles sobre el evento recién mencionado ("Boleros Pasillos"). Explícale cálidamente de qué se trata en 2 o 3 frases amenas y pregúntale si desea saber horarios, ubicación o cómo adquirir las entradas. NO repitas tarjetas si ya se mostraron salvo que sea necesario.

FORMATO DE RESPUESTA — SOLO JSON válido:
{
  "texto": "Tu respuesta cálida, concisa y con pregunta final...",
  "eventosRecomendadosIds": [],
  "aliadosRecomendadosIds": [],
  "atractivosRecomendadosIds": []
}`;

  const messages = [
    { role: 'user', content: 'para la proxima semana? hay algo de boleros o musica?' },
    { role: 'assistant', content: '¡Sí! Para la próxima semana tenemos en cartelera Boleros Pasillos en el Teatro Bolívar.' },
    { role: 'user', content: 'y eso de que es?' }
  ];

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 500
    })
  });

  const d = await res.json();
  console.log("RESULT:");
  console.log(d.choices?.[0]?.message?.content);
}

test();
