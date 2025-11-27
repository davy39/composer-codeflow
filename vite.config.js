import { defineConfig } from 'vite';

export default defineConfig(() => {
    return {
        server: {
            proxy: {
                '^(?!/@vite|/@id|/node_modules|/resources|/assets|/@react-refresh).*': {
                    target: 'http://localhost:2222',
                }
            }
        }
    };
});