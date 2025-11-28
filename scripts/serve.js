#!/usr/bin/env node

/**
 * @file scripts/serve.js
 * @description
 * Serveur Hybride Optimisé : Node.js (Statique) + PHP-WASM (Dynamique).
 */

import http from "http";
import fs from "fs";
import path from "path";
import net from "node:net";
import {spawn} from "node:child_process";
import {fileURLToPath} from "url";
import {PHPRequestHandler, PHP} from "@php-wasm/universal";
import {loadNodeRuntime, createNodeFsMountHandler} from "@php-wasm/node";
import env from "./env.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = 8000;
const PROXY_PORT = 9999;
const PROXY_SCRIPT = "scripts/proxy.js";

// Chemins absolus (Crucial pour Codeflow)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, ".."); // La racine réelle du projet
const PUBLIC_DIR = path.resolve(process.cwd(), "public"); // Le dossier public de Laravel

// Mime Types pour le serveur statique Node.js
const MIMES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

// ============================================================================
// STATE & HELPERS
// ============================================================================

let requestHandler = null;
let isInitializing = false;
let proxyProcess = null;

// Vérification de port
const isPortTaken = (port) =>
  new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", (err) => resolve(err.code === "EADDRINUSE"))
      .once("listening", () => {
        tester.close();
        resolve(false);
      })
      .listen(port);
  });

// Lecture du body (Uploads/Post)
const readRequestBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });

const parseHeaders = (rawHeaders) => {
  const headers = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    headers[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return headers;
};

// ============================================================================
// LOGIQUE SERVEUR
// ============================================================================

const server = http.createServer(async (req, res) => {
  // --------------------------------------------------------
  // 1. OPTIMISATION MASSIVE : Servir le statique via Node.js
  // --------------------------------------------------------
  // On évite de réveiller PHP pour app.css, app.js, favicon.ico...
  if (req.method === "GET") {
    const safePath = path
      .normalize(req.url.split("?")[0])
      .replace(/^(\.\.[\/\\])+/, "");
    const filePath = path.join(PUBLIC_DIR, safePath);

    // Si le fichier existe physiquement dans /public, on l'envoie direct
    if (
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isFile() &&
      !req.url.endsWith(".php")
    ) {
      const ext = path.extname(filePath);
      res.writeHead(200, {
        "Content-Type": MIMES[ext] || "application/octet-stream",
        "Access-Control-Allow-Origin": "*", // Utile pour Vite
      });
      fs.createReadStream(filePath).pipe(res);
      return; // STOP, on ne va pas plus loin !
    }
  }

  // --------------------------------------------------------
  // 2. Initialisation Lazy du Runtime PHP
  // --------------------------------------------------------
  if (!requestHandler && !isInitializing) {
    isInitializing = true;
    console.log("[Server] Booting PHP-WASM Runtime...");

    try {
      // A. Démarrer le Proxy si besoin
      const portIsBusy = await isPortTaken(PROXY_PORT);
      if (!portIsBusy) {
        console.log("[Host] Starting Proxy...");
        proxyProcess = spawn(
          "node",
          [path.resolve(PROJECT_ROOT, PROXY_SCRIPT)],
          {
            stdio: "ignore",
            detached: false,
          }
        );
        await new Promise((r) => setTimeout(r, 500));
      }

      // B. Charger le Runtime
      const runtimeId = await loadNodeRuntime(env.php.version);

      // C. Configurer le Handler
      requestHandler = new PHPRequestHandler({
        phpFactory: async () => {
          const php = new PHP(runtimeId);

          // MONTAGE SYSTEME FICHIER (CRITIQUE)
          // On monte la racine du projet (PROJECT_ROOT) pour voir 'vendor' et 'temp_app'
          php.mkdir(PROJECT_ROOT);
          php.mount(PROJECT_ROOT, createNodeFsMountHandler(PROJECT_ROOT));

          // On se place dans le dossier public pour l'exécution
          php.chdir(PUBLIC_DIR);

          return php;
        },
        documentRoot: PUBLIC_DIR,
        absoluteUrl: `http://127.0.0.1:${PORT}`,
      });

      isInitializing = false;
      console.log("[Server] PHP Ready.");

      // Recharger la page initiale qui a déclenché le boot
      res.statusCode = 302;
      res.setHeader("location", req.url ?? "/");
      res.end();
      return;
    } catch (err) {
      console.error("[Fatal] PHP Boot Error:", err);
      isInitializing = false;
      res.statusCode = 500;
      res.end("PHP Boot Error");
      return;
    }
  }

  // Si on est encore en train d'initialiser, on fait patienter
  if (!requestHandler && isInitializing) {
    res.statusCode = 202; // Accepted, processing
    res.end("Booting...");
    return;
  }

  // --------------------------------------------------------
  // 3. Exécution PHP (Dynamique)
  // --------------------------------------------------------
  try {
    const phpRequest = {
      method: req.method || "GET",
      url: req.url,
      headers: parseHeaders(req.rawHeaders),
      body: await readRequestBody(req),
      // On force Laravel à comprendre qu'on est en HTTPS derrière un proxy
      serverParams: {
        HTTPS: "on",
        HTTP_X_FORWARDED_PROTO: "https",
      },
    };

    const phpResponse = await requestHandler.request(phpRequest);

    // Nettoyage headers
    delete phpResponse.headers["x-frame-options"];

    Object.keys(phpResponse.headers).forEach((key) => {
      res.setHeader(key, phpResponse.headers[key]);
    });

    res.statusCode = phpResponse.httpStatusCode;
    res.end(phpResponse.bytes);
  } catch (err) {
    // En cas d'erreur PHP, on l'affiche dans la console Node, pas dans le HTML
    console.error("[PHP Error]", err);
    res.statusCode = 500;
    res.end("Internal PHP Error");
  }
});

// ============================================================================
// START
// ============================================================================

process.on("SIGINT", () => {
  if (proxyProcess)
    try {
      proxyProcess.kill();
    } catch (e) {}
  process.exit();
});

server.listen(PORT, () => {
  console.log(`\n[NodeServer] Ready on port ${PORT}`);
});
