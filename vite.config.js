import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.js',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron', 'node-schedule', 'electron-store']
            }
          },
          define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
          }
        }
      },
      {
        entry: 'src/main/preload.js',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  }
})
