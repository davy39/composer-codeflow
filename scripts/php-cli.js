#!/usr/bin/env node
/**
 * @file php-cli.js
 * @description
 * PHP-WASM CLI EXECUTABLE (FIXED FOR STACKBLITZ)
 */

import { PHP } from "@php-wasm/universal";
import { loadNodeRuntime, createNodeFsMountHandler } from "@php-wasm/node";
import env from "./env.js"; 
import path from 'node:path';
import { spawn } from 'node:child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROXY_URL = 'http://127.0.0.1:9999';

// ============================================================================
// MAIN EXECUTION
// ============================================================================

(async () => {
    let proxyProcess = null;
    let finalExitCode = 0;
    
    // Helper to kill proxy safely
    const cleanupProxy = () => {
        if (proxyProcess && !proxyProcess.killed) {
            try {
                // StackBlitz specific: SIGKILL is often more reliable for instant cleanup
                // because we are about to exit anyway.
                proxyProcess.kill('SIGKILL'); 
            } catch (e) {
                // Ignore errors if process is already gone
            }
        }
    };

    // Handle Ctrl+C (Manual interruption)
    process.on('SIGINT', () => {
        console.log('\n[Host] Caught interrupt signal');
        cleanupProxy();
        process.exit(130);
    });

    try {
        // ---------------------------------------------------------
        // 0. Start Proxy Server
        // ---------------------------------------------------------
        console.log('[Host] Starting Sidecar Proxy...');
        proxyProcess = spawn('node', [path.resolve(process.cwd(), 'scripts/proxy.js')], {
            stdio: ['ignore', 'pipe', 'pipe'], // Ignore stdin to prevent hanging
            detached: false
        });
        
        // Wait for proxy to be ready
        await new Promise((resolve, reject) => {
            let output = '';
            
            const checkReady = (data) => {
                const str = data.toString();
                output += str;
                // Optional: print proxy logs for debug
                // process.stdout.write('[Proxy] ' + str); 

                if (output.includes('Sidecar Proxy running')) {
                    resolve();
                }
            };
            
            proxyProcess.stdout.on('data', checkReady);
            proxyProcess.stderr.on('data', checkReady);
            
            proxyProcess.on('error', (err) => reject(new Error(`Proxy spawn error: ${err}`)));
            
            proxyProcess.on('close', (code) => {
                if (code !== 0 && !output.includes('Sidecar Proxy running')) {
                     reject(new Error(`Proxy exited prematurely with code ${code}`));
                }
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Proxy server failed to start within 10 seconds. Check scripts/proxy.js'));
            }, 10000);
        });
        
        console.log('[Host] Proxy server is ready');
        
        // ---------------------------------------------------------
        // 1. Initialize PHP Runtime
        // ---------------------------------------------------------
        const phpRuntimeId = await loadNodeRuntime(env.php.version);
        const php = new PHP(phpRuntimeId);

        // ---------------------------------------------------------
        // 2. File System Setup
        // ---------------------------------------------------------
        php.mkdir(process.cwd());
        php.mount(process.cwd(), createNodeFsMountHandler(process.cwd()));
        php.chdir(process.cwd());

        // ---------------------------------------------------------
        // 3. Argument Parsing
        // ---------------------------------------------------------
        let args = process.argv.slice(2);
        
        if (args.includes("--disable-functions")) {
            args.splice(args.indexOf("--disable-functions"), 1);
            args = ["-d", "disable_functions=proc_open,popen", ...args];
        }

        // ---------------------------------------------------------
        // 4. Environment Variables Setup
        // ---------------------------------------------------------
        const envVars = {
            'LOCAL_PROXY_URL': `${PROXY_URL}/?url=`,
            'COMPOSER': process.env.COMPOSER || 'composer.json',
            'COMPOSER_PROCESS_TIMEOUT': process.env.COMPOSER_PROCESS_TIMEOUT || '600',
            'COMPOSER_DISABLE_CURL': '1', 
            'PHP_BINARY': path.resolve(process.cwd(), 'scripts/php-cli.js'),            
            ...process.env
        };

        // ---------------------------------------------------------
        // 5. Execute PHP
        // ---------------------------------------------------------
        const response = await php.cli(["php", ...args], {
            env: envVars
        });

        // ---------------------------------------------------------
        // 6. Output Streaming
        // ---------------------------------------------------------
        const streamToNodeWritable = async (readable, writable) => {
            const reader = readable.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) writable.write(Buffer.from(value));
                }
            } catch (e) {
                console.error('[Host] Stream error:', e);
            } finally {
                try { reader.releaseLock(); } catch (e) {}
            }
        };

        const stdoutStreaming = streamToNodeWritable(response.stdout, process.stdout);
        const stderrStreaming = streamToNodeWritable(response.stderr, process.stderr);

        // Wait for completion
        const result = await response.exitCode;
        await Promise.all([stdoutStreaming, stderrStreaming]).catch(() => {});

        // Ensure result is a number
        finalExitCode = typeof result === 'number' ? result : 0;

    } catch (err) {
        console.error(`[Host Error] Execution failed:`);
        console.error(err);
        finalExitCode = 1;
    } finally {
        // ---------------------------------------------------------
        // 7. CLEANUP & EXIT
        // ---------------------------------------------------------
        // console.log('[Host] Cleaning up...'); // Optional log
        cleanupProxy();
        
        // FORCE EXIT. 
        // This is crucial for StackBlitz/Codeflow to release the terminal.
        process.exit(finalExitCode);
    }
})();