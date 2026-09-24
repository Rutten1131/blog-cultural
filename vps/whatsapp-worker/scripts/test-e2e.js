/**
 * Prueba end-to-end del worker de WhatsApp.
 *
 * Simula el webhook tal como lo envía Evolution API v2 y verifica que el
 * mensaje termine guardado como post pendiente en la base de datos.
 *
 * Se escribió en Node (no en shell) porque la imagen Alpine no incluye curl.
 *
 * Ejecutar dentro del contenedor:
 *   docker exec whatsapp-worker-whatsapp-worker-1 node scripts/test-e2e.js
 */

const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:8083";

async function enviarWebhook(payload) {
  const res = await fetch(`${BASE}/webhook/whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const payload = JSON.parse(
    fs.readFileSync(path.join(__dirname, "payload-test.json"), "utf8")
  );

  // ─── Prueba negativa: un chat privado NO debe procesarse ───
  console.log("=== 0. Prueba negativa: mensaje de chat privado ===");
  const privado = JSON.parse(JSON.stringify(payload));
  privado.data.key.remoteJid = "593999999999@s.whatsapp.net";
  const resPrivado = await enviarWebhook(privado);
  console.log(`HTTP ${resPrivado.status} →`, resPrivado.body);

  if (resPrivado.body.received !== false) {
    console.error("\n  FALLA: un chat privado no debería procesarse.");
    process.exitCode = 1;
  } else {
    console.log("  OK: el chat privado fue descartado correctamente.");
  }

  // ─── Prueba negativa: mensaje de grupo SIN texto ───
  console.log("\n=== 0b. Prueba negativa: mensaje de grupo sin texto ===");
  const vacio = JSON.parse(JSON.stringify(payload));
  vacio.data.message = {};
  const resVacio = await enviarWebhook(vacio);
  console.log(`HTTP ${resVacio.status} →`, resVacio.body);

  if (resVacio.body.received !== false) {
    console.error("\n  FALLA: un mensaje vacío no debería procesarse.");
    process.exitCode = 1;
  } else {
    console.log("  OK: el mensaje vacío fue descartado correctamente.");
  }

  // ─── Prueba real: grupo con enlace y datos del evento ───
  console.log("\n=== 1. Enviando webhook simulado (mensaje de grupo) ===");
  const res = await enviarWebhook(payload);
  console.log(`HTTP ${res.status} →`, res.body);

  if (res.body.received !== true) {
    console.error("\n  FALLA: el mensaje de grupo fue rechazado.");
    process.exit(1);
  }

  console.log("\n=== 2. Esperando a que Puppeteer visite la URL (~25s) ===");
  await new Promise((r) => setTimeout(r, 25000));

  console.log("=== 3. Posts guardados en la base de datos ===");
  const postsRes = await fetch(`${BASE}/posts`);
  const data = await postsRes.json();

  console.log(`Total de posts: ${data.total}`);

  if (data.total === 0) {
    console.error("\n  FALLA: no se guardó ningún post.");
    process.exitCode = 1;
    return;
  }

  for (const post of data.posts) {
    console.log("\n  ────────────────────────────────");
    console.log(`  ID          : ${post.id}`);
    console.log(`  Estado      : ${post.estado}`);
    console.log(`  Origen      : ${post.origen}`);
    console.log(`  Título      : ${post.titulo}`);
    console.log(`  Fecha       : ${post.fechaPublicacion ? post.fechaPublicacion : "(no detectada)"}`);
    console.log(`  Lugar       : ${post.lugar}`);
    console.log(`  Imagen      : ${post.imagenUrl}`);
    console.log(`  Confianza   : ${post.confianzaIA}`);
    console.log(`  Grupo       : ${post.grupoId}`);
    console.log(`  URL         : ${post.urlOriginal}`);
    console.log(`  Descripción : ${(post.descripcion || "").slice(0, 120)}...`);
  }

  console.log("\n  Validaciones:");
  const post = data.posts[0];
  const checks = [
    ["el post llega como PENDIENTE", post.estado === "PENDIENTE"],
    ["tiene título", Boolean(post.titulo)],
    ["tiene descripción", Boolean(post.descripcion)],
    ["tiene URL original", Boolean(post.urlOriginal)],
    ["viene del grupo", String(post.grupoId).includes("@g.us")],
    [
      "la fecha es 4 de octubre de 2026 a las 19h00 Loja (05/10 00:00 UTC)",
      post.fechaPublicacion &&
        new Date(post.fechaPublicacion).toISOString() === "2026-10-05T00:00:00.000Z",
    ],
    ["el lugar es Teatro Bolívar", post.lugar === "Teatro Bolívar"],
  ];

  for (const [nombre, ok] of checks) {
    console.log(`    ${ok ? "OK   " : "FALLA"} ${nombre}`);
    if (!ok) process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Error en la prueba end-to-end:", e);
  process.exit(1);
});
