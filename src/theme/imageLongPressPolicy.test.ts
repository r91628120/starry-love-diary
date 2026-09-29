import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const globalCss = readFileSync('src/theme/globals.css', 'utf8')

function ruleBody(selector: string) {
  return globalCss.match(new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]*)\\}`, 'u'))?.[1] ?? ''
}

describe('image long-press policy', () => {
  it('protects every DOM image without changing pointer or text-input interaction', () => {
    const imageRule = ruleBody('img')
    expect(imageRule).toContain('-webkit-touch-callout: none;')
    expect(imageRule).toContain('-webkit-user-select: none;')
    expect(imageRule).toContain('user-select: none;')
    expect(imageRule).not.toContain('pointer-events')
    expect(imageRule).not.toContain('touch-action')
    expect(globalCss).not.toMatch(/\*\s*\{[^}]*user-select:\s*none/u)
  })

  it('covers the iPhone-confirmed page images and MomentCarousel photo output through the shared img selector', () => {
    const targetSources = [
      'src/features/today/TodayHeroArtwork.tsx',
      'src/features/today/CoupleProfileHero.tsx',
      'src/features/today/MoodSelector.tsx',
      'src/features/star-bottle/BottleHeroCard.tsx',
      'src/features/footprints/FootprintsHero.tsx',
      'src/features/footprints/TodayDiaryCard.tsx',
      'src/features/clear/ClearContent.tsx',
      'src/features/our/MomentCarousel.tsx',
      'src/components/PhotoPlacementImage.tsx',
    ].map((path) => [path, readFileSync(path, 'utf8')] as const)

    for (const [path, source] of targetSources) {
      expect(source, path).toMatch(/<img|<PhotoPlacementImage/u)
    }
  })
})
