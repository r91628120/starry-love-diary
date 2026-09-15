import { describe, expect, it, vi } from 'vitest'
import { checkForSoftUpdate, compareSemanticVersions, fetchRemoteVersionConfig, getNativePlatform, openStoreUrl, parseRemoteVersionConfig } from './updateCheckService'

const config = {
  ios: { latestVersion: '0.1.1', minimumVersion: '0.1.0', storeUrl: 'https://apps.apple.com/example' },
  android: { latestVersion: '0.1.1', minimumVersion: '0.1.0', storeUrl: 'https://play.google.com/store/apps/details?id=example' },
}

const fetchConfig = (value: unknown = config) => vi.fn().mockResolvedValue({ ok: true, json: async () => value }) as unknown as typeof fetch

describe('updateCheckService', () => {
  it('compares semantic versions numerically', () => {
    expect(compareSemanticVersions('0.1.0', '0.1.0')).toBe(0)
    expect(compareSemanticVersions('0.1.9', '0.1.10')).toBe(-1)
    expect(compareSemanticVersions('0.1.10', '0.1.9')).toBe(1)
  })

  it('detects only supported native platforms', () => {
    expect(getNativePlatform({ Capacitor: { getPlatform: () => 'ios' } })).toBe('ios')
    expect(getNativePlatform({ Capacitor: { getPlatform: () => 'android' } })).toBe('android')
    expect(getNativePlatform({ Capacitor: { getPlatform: () => 'web' } })).toBeUndefined()
  })

  it('returns a soft update only when the native platform has a newer version', async () => {
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig() })).resolves.toMatchObject({ platform: 'ios', storeUrl: config.ios.storeUrl })
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'android' } }, fetcher: fetchConfig() })).resolves.toMatchObject({ platform: 'android', storeUrl: config.android.storeUrl })
    await expect(checkForSoftUpdate({ currentVersion: '0.1.1', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig() })).resolves.toBeUndefined()
    await expect(checkForSoftUpdate({ currentVersion: '0.1.2', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig() })).resolves.toBeUndefined()
  })

  it('fails safely for missing URLs, fetch failures, malformed config, and web runtime', async () => {
    const missingUrl = { ...config, ios: { ...config.ios, storeUrl: '' } }
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'ios' } }, fetcher: fetchConfig(missingUrl) })).resolves.toMatchObject({ storeUrl: '' })
    await expect(checkForSoftUpdate({ currentVersion: '0.1.0', host: { Capacitor: { getPlatform: () => 'web' } }, fetcher: fetchConfig() })).resolves.toBeUndefined()
    await expect(fetchRemoteVersionConfig(vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch)).resolves.toBeUndefined()
    expect(parseRemoteVersionConfig({ ios: {} })).toBeUndefined()
    expect(openStoreUrl('', vi.fn())).toBe(false)
  })
})
