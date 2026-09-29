/**
 * Google Indexing API Client — Agenda Cultural Loja
 *
 * Notifica a Google Web Search inmediatamente cuando se crea o actualiza un evento
 * usando la Web Search Indexing API v3 (indexing.googleapis.com).
 *
 * Utiliza criptografia nativa de Node.js (crypto + https) para firmar JWT RS256
 * y obtener tokens OAuth2 de la cuenta de servicio sin requerir dependencias externas pesadas.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const KEY_FILE_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, "../google-service-account.json");

let serviceAccountCache = null;
let cachedAccessToken = null;
let tokenExpiresAt = 0;

function cargarCredenciales() {
  if (serviceAccountCache) return serviceAccountCache;
  if (!fs.existsSync(KEY_FILE_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(KEY_FILE_PATH, "utf8");
    serviceAccountCache = JSON.parse(raw);
    return serviceAccountCache;
  } catch (err) {
    console.error("[GoogleIndexer] Error leyendo credenciales:", err.message);
    return null;
  }
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function obtenerTokenAcceso() {
  const ahora = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && ahora < tokenExpiresAt - 60) {
    return cachedAccessToken;
  }

  const creds = cargarCredenciales();
  if (!creds || !creds.private_key || !creds.client_email) {
    return null;
  }

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    exp: ahora + 3600,
    iat: ahora,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(toSign);
  const signature = signer.sign(creds.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${toSign}.${signature}`;

  const bodyData = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }).toString();

  return new Promise((resolve) => {
    const req = https.request(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(bodyData),
        },
        timeout: 10000,
      },
      (res) => {
        let resp = "";
        res.on("data", (c) => (resp += c));
        res.on("end", () => {
          try {
            const data = JSON.parse(resp);
            if (data.access_token) {
              cachedAccessToken = data.access_token;
              tokenExpiresAt = ahora + (data.expires_in || 3600);
              resolve(cachedAccessToken);
            } else {
              console.warn("[GoogleIndexer] No se pudo obtener access token:", data);
              resolve(null);
            }
          } catch (e) {
            console.error("[GoogleIndexer] Error parseando token OAuth:", e.message);
            resolve(null);
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error("[GoogleIndexer] Error solicitando OAuth token:", err.message);
      resolve(null);
    });

    req.write(bodyData);
    req.end();
  });
}

async function forzarIndexacionGoogle(url) {
  try {
    const token = await obtenerTokenAcceso();
    if (!token) {
      console.warn("[GoogleIndexer] Omitido: no hay token de acceso disponible (verificar credenciales)");
      return { success: false, motivo: "Sin credenciales validas" };
    }

    const payload = JSON.stringify({
      url: url.trim(),
      type: "URL_UPDATED",
    });

    return new Promise((resolve) => {
      const req = https.request(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            Authorization: `Bearer ${token}`,
          },
          timeout: 12000,
        },
        (res) => {
          let resp = "";
          res.on("data", (c) => (resp += c));
          res.on("end", () => {
            try {
              const json = JSON.parse(resp);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[GoogleIndexer] PUSH EXITOSO a Google Indexing API: ${url}`);
                resolve({ success: true, data: json });
              } else {
                console.warn(`[GoogleIndexer] Google respondio con status ${res.statusCode}:`, json?.error?.message || resp);
                resolve({ success: false, status: res.statusCode, error: json });
              }
            } catch {
              resolve({ success: res.statusCode === 200, status: res.statusCode, raw: resp });
            }
          });
        }
      );

      req.on("error", (err) => {
        console.error("[GoogleIndexer] Error en peticion a Indexing API:", err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error("[GoogleIndexer] Excepcion en forzarIndexacionGoogle:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Notifica a IndexNow (Bing, Yahoo, DuckDuckGo, Copilot, ChatGPT Search)
 *
 * @param {string} url - URL del evento a indexar
 * @param {string} key - Clave pública de IndexNow
 */
async function notificarIndexNow(url, key = "ad22899d598a4ad2b113783fdd7a8bfc") {
  try {
    const host = "www.agendaculturalloja.com";
    const body = JSON.stringify({
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: [url.trim()],
    });

    return new Promise((resolve) => {
      const req = https.request(
        "https://api.indexnow.org/indexnow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": Buffer.byteLength(body),
          },
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[IndexNow] ⚡ IndexNow PUSH EXITOSO (Bing/Copilot/DuckDuckGo): ${url}`);
            resolve({ success: true, status: res.statusCode });
          } else {
            console.warn(`[IndexNow] IndexNow respondió con código: ${res.statusCode}`);
            resolve({ success: false, status: res.statusCode });
          }
        }
      );

      req.on("error", (err) => {
        console.error("[IndexNow] Error en ping IndexNow:", err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(body);
      req.end();
    });
  } catch (err) {
    console.error("[IndexNow] Excepción en notificarIndexNow:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  forzarIndexacionGoogle,
  notificarIndexNow,
};

