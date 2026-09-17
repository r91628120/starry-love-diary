import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const infoPlist = readFileSync(resolve(root, 'ios/App/App/Info.plist'), 'utf8')
const project = readFileSync(resolve(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8')
const nativeLocalizations = ['zh-Hant-TW', 'en', 'ja', 'ko', 'es', 'fr']

describe('iOS native localization metadata', () => {
  it('declares every supported app language for iOS bundle localization', () => {
    expect(infoPlist).toMatch(/<key>CFBundleDevelopmentRegion<\/key>\s*<string>zh-Hant-TW<\/string>/)
    const localizations = infoPlist.match(/<key>CFBundleLocalizations<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1] ?? ''
    expect([...localizations.matchAll(/<string>([^<]+)<\/string>/g)].map((match) => match[1])).toEqual(nativeLocalizations)
  })

  it('keeps Xcode project localization metadata aligned with the bundle declaration', () => {
    expect(project).toMatch(/developmentRegion = "zh-Hant-TW";/)
    const knownRegions = project.match(/knownRegions = \(([\s\S]*?)\);/)?.[1] ?? ''
    nativeLocalizations.forEach((locale) => expect(knownRegions).toContain(locale))
    expect(knownRegions).toContain('Base')
  })
})
