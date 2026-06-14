import { defineConfig } from "vite";
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
//import basicSsl from "@vitejs/plugin-basic-ssl";

/*export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: true,
    https: true
  }
});
*/
export default defineConfig({
  server: {
    host: true,
    https: false   // ❌ disable
  },
  base: './', 
    plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
       },
      manifest: {
        name: 'Indiandost',
        short_name: 'ID',
        theme_color: '#ff4d6d',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
