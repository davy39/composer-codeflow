#!/usr/bin/env node
/**
 * @file proxy.js
 * @description
 * STANDALONE HTTP "SIDECAR" PROXY SERVER.
 *
 * PURPOSE:
 * This script runs a local HTTP server that acts as a bridge for PHP-WASM.
 * PHP-WASM (running in WebContainers/StackBlitz) lacks native access to
 * standard networking capabilities like TCP sockets, SSL certificate validation,
 * and automatic 3xx redirects.
 *
 * HOW IT WORKS:
 * 1. Listens on 127.0.0.1:9999.
 * 2. Receives simple HTTP requests from the PHP CLI.
 * 3. Wraps requests through CodeTabs to bypass CORS/IP restrictions (optional logic).
 * 4. Uses Node.js native `http`/`https` modules to fetch data from the real internet.
 * 5. Handles SSL and Redirects manually.
 * 6. Streams the response back to PHP.
 *
 * USAGE:
 * node proxy.js &
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** @constant {number} PROXY_PORT - The port to listen on. */
const PROXY_PORT = 9999;

/** @constant {string} PROXY_HOST - Bind to localhost. */
const PROXY_HOST = '127.0.0.1';

/** @constant {number} MAX_REDIRECTS - Limit to prevent infinite redirect loops. */
const MAX_REDIRECTS = 5;

// ============================================================================
// HELPER: REDIRECT HANDLER
// ============================================================================

/**
 * Recursively fetches a URL, following HTTP redirects (301, 302, 307, 308).
 * Node's native `http.get` / `https.get` does not follow redirects automatically.
 *
 * @param {string} url - The URL to fetch.
 * @param {http.ServerResponse} res - The response object to pipe data into.
 * @param {number} [redirectCount=0] - Recursion depth counter.
 */
function fetchWithRedirects(url, res, redirectCount = 0) {
    if (redirectCount > MAX_REDIRECTS) {
        if (!res.headersSent) {
            res.writeHead(502); // Bad Gateway
            res.end(`[NodeProxy] Error: Too many redirects (${redirectCount})`);
        }
        return;
    }

    // Select the appropriate client (http vs https)
    const client = url.startsWith('http:') ? http : https;

    const req = client.get(url, {
        headers: {
            // Spoof User-Agent to prevent WAF blocking
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        }
    }, (proxyRes) => {
        // Handle Redirect Codes
        if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
            proxyRes.resume(); // Drain socket to avoid memory leaks
            
            // Resolve relative URLs (e.g., "Location: /login")
            const newLocation = new URL(proxyRes.headers.location, url).toString();
            // console.debug(`[NodeProxy] Redirecting to: ${newLocation}`);
            
            fetchWithRedirects(newLocation, res, redirectCount + 1);
            return;
        }

        // Add CORS headers to satisfy any internal browser security checks
        const headers = { ...proxyRes.headers, 'Access-Control-Allow-Origin': '*' };

        // Remove auth headers to avoid confusing the local client
        delete headers['www-authenticate'];
        delete headers['proxy-authenticate'];
        
        res.writeHead(proxyRes.statusCode, headers);
        
        // Pipe the stream directly
        proxyRes.pipe(res);
    });

    req.on('error', (e) => {
        console.error(`[NodeProxy Error] ${e.message}`);
        if (!res.headersSent) {
            res.writeHead(502);
            res.end(`Proxy Error: ${e.message}`);
        }
    });
}

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

/**
 * Creates the HTTP Server.
 * Expects request format: http://127.0.0.1:9999/?url=https://target.com
 */
const proxyServer = http.createServer((req, res) => {
    try {
        const myUrl = new URL(req.url, `http://${PROXY_HOST}:${PROXY_PORT}`);
        const targetUrl = myUrl.searchParams.get('url');

        if (!targetUrl) {
            res.writeHead(400);
            res.end("[NodeProxy] Missing 'url' query parameter.");
            return;
        }

        // Use CodeTabs to strip CORS headers and mask the IP if necessary
        const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

        console.log(`[NodeProxy] Request: ${targetUrl}`);
        
        fetchWithRedirects(codetabsUrl, res);

    } catch (err) {
        console.error(`[NodeProxy Critical] ${err.message}`);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end("Internal Proxy Server Error");
        }
    }
});

// Start listening
proxyServer.listen(PROXY_PORT, PROXY_HOST, () => {
    console.log(`=======================================================`);
    console.log(`[Host] Sidecar Proxy running at http://${PROXY_HOST}:${PROXY_PORT}`);
    console.log(`[Host] Ready to handle PHP requests...`);
    console.log(`=======================================================`);
});