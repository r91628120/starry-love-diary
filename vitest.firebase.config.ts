import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/lib/firebase/**/*.emulator.test.ts'],
    exclude: ['**/node_modules/**'],
    // The rules suite clears the shared demo project after each case. Keep
    // emulator test files serial so it cannot erase the bootstrap fixture.
    fileParallelism: false,
  },
})
