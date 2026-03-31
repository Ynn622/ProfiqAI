import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const buildTime = new Date().toISOString()
const buildVersion = process.env.BUILD_VERSION || buildTime.replace(/[-:TZ.]/g, '').slice(0, 12)

function versionJsonPlugin() {
  return {
    name: 'version-json-plugin',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          {
            version: buildVersion,
            buildTime,
          },
          null,
          2,
        ),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [
    vue(),
    vueDevTools(),
    versionJsonPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
