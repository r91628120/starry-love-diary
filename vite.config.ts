import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function readMarketingVersion() {
  const project = readFileSync(new URL('./ios/App/App.xcodeproj/project.pbxproj', import.meta.url), 'utf8')
  const versions = [...project.matchAll(/MARKETING_VERSION = ([^;]+);/gu)].map((match) => match[1].trim())
  const [marketingVersion] = [...new Set(versions)]
  if (!marketingVersion || new Set(versions).size !== 1) throw new Error('Expected one iOS MARKETING_VERSION')
  return marketingVersion
}

export default defineConfig({
  plugins: [react()],
  define: {
    __STARRY_MARKETING_VERSION__: JSON.stringify(readMarketingVersion()),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
