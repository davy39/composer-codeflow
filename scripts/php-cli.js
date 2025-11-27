#!/usr/bin/env node
/**
 * @file php-cli.js
 * @description
 * PHP-WASM CLI EXECUTABLE.
 *
 * PURPOSE:
 * Loads the PHP-WASM runtime and executes PHP scripts or Composer commands.
 * This script assumes a "Sidecar" proxy is ALREADY RUNNING on localhost:9999.
 *
 * RESPONSIBILITIES:
 * 1. Mounts the current working directory so PHP can access files.
 * 2. Injects `LOCAL_PROXY_URL` environment variable for network requests.
 * 3. Pipes PHP stdout/stderr to the Node.js console.
 * 4. Handles CLI arguments and "disable_functions" configuration.
 */

import { PHP } from "@php-wasm/universal";
import { loadNodeRuntime, createNodeFsMountHandler } from "@php-wasm/node";
import env from "./env.js"; // Ensure this file exists and exports { php: { version: '...' } }
import path from 'node:path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROXY_URL = 'http://127.0.0.1:9999';

// ============================================================================
// MAIN EXECUTION
// ============================================================================

(async () => {
    try {
        // 1. Initialize PHP Runtime
        // Loads the WebAssembly binary specified in env.js
        const phpRuntimeId = await loadNodeRuntime(env.php.version);
        const php = new PHP(phpRuntimeId);

        // 2. File System Setup
        // Mount the host's current directory (process.cwd) into the PHP VFS.
        // This is crucial for Composer to see 'composer.json'.
        php.mkdir(process.cwd());
        php.mount(process.cwd(), createNodeFsMountHandler(process.cwd()));
        php.chdir(process.cwd());

        // 3. Argument Parsing
        // Remove 'node' and 'php-cli.js' from argv to get pure PHP arguments.
        let args = process.argv.slice(2);
        
        // Handle explicit disable_functions argument if passed
        if (args.includes("--disable-functions")) {
            args.splice(args.indexOf("--disable-functions"), 1);
            args = ["-d", "disable_functions=proc_open,popen", ...args];
        }

        // 4. Environment Variables Setup
        const envVars = {
            // Point the PHP internal client to our pre-launched Sidecar Proxy
            'LOCAL_PROXY_URL': `${PROXY_URL}/?url=`,
            
            // Standard Composer Env Vars
            'COMPOSER': process.env.COMPOSER || 'composer.json',
            'COMPOSER_PROCESS_TIMEOUT': process.env.COMPOSER_PROCESS_TIMEOUT || '600',
            
            // Force Composer to use 'file_get_contents' (streams) instead of 'curl'.
            // WASM curl emulation is often incomplete; streams work better with the proxy.
            'COMPOSER_DISABLE_CURL': '1', 

            // Self-reference for recursive calls
            'PHP_BINARY': path.resolve(process.cwd(), 'scripts/php-cli.js'),            
            
            ...process.env // Forward host environment variables
        };

        // 5. Execute PHP
        const response = await php.cli(["php", ...args], {
            env: envVars
        });

        // 6. Output Streaming Helper
        // Reads binary chunks from the PHP process and writes them to the console.
        const streamToNodeWritable = async (readable, writable) => {
            const reader = readable.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) writable.write(Buffer.from(value));
                }
            } finally {
                try { reader.releaseLock(); } catch (e) { /* ignore */ }
            }
        };

        // Pipe stdout and stderr simultaneously
        const stdoutStreaming = streamToNodeWritable(response.stdout, process.stdout);
        const stderrStreaming = streamToNodeWritable(response.stderr, process.stderr);

        // Wait for completion
        const exitCode = await response.exitCode;
        await Promise.all([stdoutStreaming, stderrStreaming]).catch(() => {});

        process.exit(typeof exitCode === 'number' ? exitCode : 0);

    } catch (err) {
        console.error(`[Host Error] PHP execution failed: ${err}`);
        process.exit(1);
    }
})();