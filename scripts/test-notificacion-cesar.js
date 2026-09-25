require('dotenv').config({ path: './vps/whatsapp-worker/.env' });
const { enviarTexto } = require('../vps/whatsapp-worker/lib/evolution-client');

async function testNotificacion() {
  const numeroCesar = "593963410409";
  const appUrl = "https://www.agendaculturalloja.com";
  const testToken = "test_token_verificacion_cesar_2026";
  const linkEdicion = `${appUrl}/editar/${testToken}`;
  const linkPublicado = `${appUrl}/eventos`;

  const mensajePrueba = 
`🔔 *[PRUEBA DE CONEXIÓN] NOTIFICACIÓN DE EVENTO*

📌 *Festival Gastronómico Transfronterizo*
📅 *Fecha:* 2026-09-27
📍 *Lugar:* Plaza San Sebastián
🏛️ *Organizador detectado:* Municipio de Loja
📞 *Contacto extraído del organizador:* 0991234567

🔗 *Origen del post:*
https://www.instagram.com/p/prueba/

✏️ *Link para que editen detalles (Solo este evento):*
${linkEdicion}
_(Expira el 2026-09-27)_

🌐 *Ver en la web:*
${linkPublicado}

*(Mensaje de prueba enviado automáticamente por el bot de Agenda Cultural Loja)*`;

  console.log(`Enviando mensaje de prueba a ${numeroCesar}...`);
  try {
    const res = await enviarTexto(numeroCesar, mensajePrueba);
    console.log("✅ Mensaje enviado exitosamente:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("❌ Error enviando mensaje:", err.message);
  }
}

testNotificacion();
