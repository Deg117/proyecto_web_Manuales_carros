import { copyFile, cp, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const publicRoot = path.join(projectRoot, 'public')
const outputRoot = path.join(projectRoot, 'dist')
const motorModelRelativePath = path.join(
  'models',
  'civic-2003',
  'engine',
  'complete',
  'motor_pbr.glb',
)

function copyPublicAssetsWithoutLargeModels() {
  return {
    name: 'copy-public-assets-without-large-models',
    apply: 'build',
    async closeBundle() {
      const entries = await readdir(publicRoot, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.name === 'models') continue

        await cp(
          path.join(publicRoot, entry.name),
          path.join(outputRoot, entry.name),
          { recursive: true, force: true },
        )
      }

      const motorSource = path.join(publicRoot, motorModelRelativePath)
      const motorOutput = path.join(outputRoot, motorModelRelativePath)
      await mkdir(path.dirname(motorOutput), { recursive: true })
      await copyFile(motorSource, motorOutput)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyPublicAssetsWithoutLargeModels()],
  build: {
    copyPublicDir: false,
  },
})
