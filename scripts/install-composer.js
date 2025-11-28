#!/usr/bin/env node
/**
 * Installer script for downloading Composer PHAR for the project.
 *
 * Behavior:
 * - Attempts to download Composer using the public CodeTabs CORS proxy
 *   (`https://api.codetabs.com/v1/proxy?quest=<url>`). The proxy is GET-only
 *   and enforces a 5MB max response size.
 * - If the proxy returns a response larger than 5MB or the proxy request
 *   fails for any reason, the script falls back to a direct HTTPS stream
 *   download using Node's built-in `https.get` and streams the result to
 *   the destination file.
 * - The downloaded PHAR is written with executable permissions (mode 0o755).
 *
 * Notes and limitations:
 * - Public proxies have rate limits and reliability constraints; the script
 *   uses the proxy only as a convenience and automatically falls back to a
 *   direct download when appropriate.
 * - If your environment does not provide a global `fetch` (Node < 18), the
 *   proxy attempt may fail; the fallback still uses `https.get` and should
 *   work on all supported Node versions.
 */

import fs from "fs";
import https from "https";
import env from "./env.js";

const composerUrl = `https://getcomposer.org/download/${env.composer.version}/composer.phar`;
// Use CodeTabs free CORS proxy as first attempt; it accepts `quest=<url>`.
// Note: CodeTabs limits requests to 5MB and allows only GET.
const proxyRawUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(composerUrl)}`;

const destinationDirectory = process.env.INIT_CWD
  ? `${process.cwd()}/${env.composer.path}`
  : env.composer.path;
const destinationFilePath = `${destinationDirectory}/${env.composer.name}`;

function ensureDestinationDirectory() {
  fs.existsSync(destinationDirectory) ||
    fs.mkdirSync(destinationDirectory, {recursive: true});
}

(async () => {
  ensureDestinationDirectory();

  // First attempt: download via CodeTabs proxy (raw bytes expected)
  try {
    const resp = await fetch(proxyRawUrl, {method: "GET"});
    if (resp.ok) {
      // Check Content-Length header when provided to avoid exceeding proxy limit
      const contentLength = resp.headers.get("content-length");
      if (contentLength && Number(contentLength) > 5 * 1024 * 1024) {
        console.warn(
          `Proxy response larger than 5MB (Content-Length=${contentLength}), falling back to direct download.`
        );
      } else {
        const arrayBuffer = await resp.arrayBuffer();
        if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
          console.warn(
            `Proxy returned >5MB of data (${arrayBuffer.byteLength} bytes), falling back to direct download.`
          );
        } else {
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(destinationFilePath, buffer, {mode: 0o755});
          console.log(
            `Downloaded composer to ${destinationFilePath} via CodeTabs proxy.`
          );
          return;
        }
      }
    } else {
      console.warn(
        `Proxy request failed with status ${resp.status}, falling back to direct download.`
      );
    }
  } catch (err) {
    console.warn(
      `Proxy fetch failed: ${err?.message ?? err}. Falling back to direct download.`
    );
  }

  // Fallback: use native https.get to stream the file directly to disk
  try {
    await new Promise((resolve, reject) => {
      const req = https.get(composerUrl, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(
            new Error(`Download failed, status code ${res.statusCode}`)
          );
        }
        const fileStream = fs.createWriteStream(destinationFilePath, {
          mode: 0o755,
        });
        res.pipe(fileStream);
        fileStream.on("finish", () => fileStream.close(resolve));
        fileStream.on("error", (err) => reject(err));
      });
      req.on("error", (err) => reject(err));
    });
    console.log(
      `Downloaded composer to ${destinationFilePath} via direct https.get.`
    );
  } catch (err) {
    throw err;
  }
})();
