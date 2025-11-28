#!/usr/bin/env node
/**
 * PHP-WASM Dev Server.
 *
 * This script starts a native Node.js HTTP server that acts as a gateway
 * to the PHP WebAssembly runtime. It intercepts HTTP requests, converts them
 * into a format understood by PHP-WASM, executes the PHP code, and returns
 * the response to the browser.
 *
 * Features:
 * - Lazy initialization of the PHP runtime on the first request.
 * - Forwards HTTP headers, methods, and body to PHP.
 * - Mounts the host current working directory into the PHP virtual filesystem.
 */

import http from "http";
import env from "./env.js"; // Configuration (PHP version, port, host)
import {PHPRequestHandler, PHP} from "@php-wasm/universal";
import {loadNodeRuntime, createNodeFsMountHandler} from "@php-wasm/node";

// ============================================================================
// STATE VARIABLES
// ============================================================================

/**
 * @type {PHPRequestHandler|null}
 * Handles the translation between Node.js HTTP requests and PHP-WASM.
 */
let requestHandler = null;

/**
 * @type {boolean}
 * Flag to prevent concurrent initialization if multiple requests hit the server at startup.
 */
let isInitializing = false;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Reads the request body from a Node.js IncomingMessage stream.
 *
 * @param {http.IncomingMessage} req
 * @returns {Promise<string>} The raw body string.
 */
const readRequestBody = (req) => {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
};

/**
 * Parses raw headers from Node.js into a key-value object.
 * Node.js rawHeaders is an array [key, value, key, value...].
 *
 * @param {string[]} rawHeaders
 * @returns {Record<string, string>}
 */
const parseHeaders = (rawHeaders) => {
  const headers = {};
  if (rawHeaders && rawHeaders.length) {
    for (let i = 0; i < rawHeaders.length; i += 2) {
      headers[rawHeaders[i]] = rawHeaders[i + 1];
    }
  }
  return headers;
};

// ============================================================================
// HTTP SERVER LOGIC
// ============================================================================

const server = http.createServer(async (req, res) => {
  // 1. RUNTIME READY: HANDLE REQUEST
  if (requestHandler) {
    if (!req.url) return;

    try {
      // Prepare the request object for PHP-WASM
      const phpRequest = {
        method: req.method || "GET",
        url: req.url,
        headers: parseHeaders(req.rawHeaders),
        body: await readRequestBody(req),
      };

      // Execute PHP
      const phpResponse = await requestHandler.request(phpRequest);

      // Debug logging if enabled in env config
      if (env.server.debug) {
        console.log("[Request]", phpRequest);
        console.log("[Response]", phpResponse);
      }

      // Clean up headers (x-frame-options is often removed in dev to allow iframing)
      delete phpResponse.headers["x-frame-options"];

      // Write response headers
      Object.keys(phpResponse.headers).forEach((key) => {
        res.setHeader(key, phpResponse.headers[key]);
      });

      // Write status and body
      res.statusCode = phpResponse.httpStatusCode;
      res.end(phpResponse.bytes);
    } catch (err) {
      console.error("[Server Error]", err);
      res.statusCode = 500;
      res.end("Internal PHP-WASM Server Error");
    }
  }

  // 2. RUNTIME NOT READY: INITIALIZE
  else if (!isInitializing) {
    isInitializing = true;
    console.log("[Server] Initializing PHP Runtime...");

    try {
      // Load the WASM binary matching the requested PHP version
      const runtimeId = await loadNodeRuntime(env.php.version);

      // Initialize the Request Handler
      requestHandler = new PHPRequestHandler({
        phpFactory: async () => new PHP(runtimeId),
        documentRoot: env.server.path,
        absoluteUrl: `${env.server.host}:${env.server.port}`,
      });

      // Get the primary PHP instance to configure the filesystem
      const phpInstance = await requestHandler.getPrimaryPhp();

      // Mount the current working directory to the virtual filesystem
      const cwd = process.cwd();
      phpInstance.mkdir(cwd);
      phpInstance.mount(cwd, createNodeFsMountHandler(cwd));
      phpInstance.chdir(cwd);

      // Initialization complete
      isInitializing = false;
      console.log("[Server] Runtime Ready.");

      // Refresh the page (Redirect 302) so the browser retries the request
      // now that the handler is ready.
      res.statusCode = 302;
      res.setHeader("location", req.url ?? "/");
      res.end();
    } catch (err) {
      console.error("[Server Init Error]", err);
      isInitializing = false;
      res.statusCode = 500;
      res.end("Failed to initialize PHP Runtime");
    }
  }
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(env.server.port, async () => {
  console.log(`
PHP server is listening on ${env.server.host}:${env.server.port}
    `);
});
