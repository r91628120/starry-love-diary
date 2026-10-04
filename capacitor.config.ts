import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.miracle.starrylovediary',
  appName: '星星戀愛日記',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['apple.com'],
    },
  },
  experimental: {
    ios: {
      spm: {
        swiftToolsVersion: '6.1',
        packageOptions: {
          '@capacitor-firebase/authentication': {
            symlink: true,
          },
        },
        packageTraits: {
          '@capacitor-firebase/authentication': ['Lite'],
        },
      },
    },
  },
}

export default config
