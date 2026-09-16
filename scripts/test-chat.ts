import "dotenv/config";

async function test() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  console.log("DeepSeek Key presente:", !!deepseekKey);
  console.log("Groq Key presente:", !!groqKey);

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "Eres el asistente de Loja. Responde JSON con la propiedad 'texto'.",
        },
        { role: "user", content: "hola?" },
      ],
      response_format: { type: "json_object" },
    }),
  });

  console.log("DeepSeek status:", res.status);
  const data = await res.json();
  console.log("DeepSeek response:", JSON.stringify(data, null, 2));
}

test().catch(console.error);
