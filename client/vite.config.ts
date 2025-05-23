import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../server/public',
        assetsDir: 'assets',
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3333', // NestJS backend
                changeOrigin: true,
                secure: false,
            },
            '/d': {
                target: 'http://localhost:3333',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
