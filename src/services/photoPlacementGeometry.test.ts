import { describe, expect, it } from 'vitest'
import { applyPointerDeltaToPlacement, calculatePhotoPlacementGeometry } from './photoPlacementGeometry'

describe('photo placement geometry', () => {
  it('calculates cover geometry for portrait and landscape sources in a square frame', () => {
    const portrait = calculatePhotoPlacementGeometry({ frameWidth: 200, frameHeight: 200, sourceWidth: 100, sourceHeight: 200 }, { zoom: 1 })!
    expect(portrait).toMatchObject({ coverScale: 2, baseWidth: 200, baseHeight: 400, renderedWidth: 200, renderedHeight: 400, panRangeX: 0, panRangeY: 100 })
    const landscape = calculatePhotoPlacementGeometry({ frameWidth: 200, frameHeight: 200, sourceWidth: 200, sourceHeight: 100 }, { zoom: 1 })!
    expect(landscape).toMatchObject({ coverScale: 2, baseWidth: 400, baseHeight: 200, panRangeX: 100, panRangeY: 0 })
  })

  it('calculates a portrait source in a matching portrait frame', () => {
    const geometry = calculatePhotoPlacementGeometry({ frameWidth: 150, frameHeight: 300, sourceWidth: 100, sourceHeight: 200 }, { zoom: 1 })!
    expect(geometry).toMatchObject({ coverScale: 1.5, baseWidth: 150, baseHeight: 300, panRangeX: 0, panRangeY: 0 })
  })

  it('keeps a non-zero pan range when zoom 0.5 makes the rendered image smaller than the frame', () => {
    const input = { frameWidth: 200, frameHeight: 200, sourceWidth: 200, sourceHeight: 240 }
    const top = calculatePhotoPlacementGeometry(input, { positionY: 0, zoom: 0.5 })!
    const center = calculatePhotoPlacementGeometry(input, { positionY: 0.5, zoom: 0.5 })!
    const bottom = calculatePhotoPlacementGeometry(input, { positionY: 1, zoom: 0.5 })!
    expect(top).toMatchObject({ renderedWidth: 100, renderedHeight: 120, panRangeX: 50, panRangeY: 40, translateY: -40 })
    expect(center.translateY).toBe(0)
    expect(bottom.translateY).toBe(40)
  })

  it('maps position 0, 0.5, and 1 to the full horizontal and vertical pan range', () => {
    const input = { frameWidth: 200, frameHeight: 200, sourceWidth: 200, sourceHeight: 200 }
    expect(calculatePhotoPlacementGeometry(input, { positionX: 0, positionY: 0, zoom: 4 })).toMatchObject({ panRangeX: 300, panRangeY: 300, translateX: -300, translateY: -300 })
    expect(calculatePhotoPlacementGeometry(input, { positionX: .5, positionY: .5, zoom: 4 })).toMatchObject({ translateX: 0, translateY: 0 })
    expect(calculatePhotoPlacementGeometry(input, { positionX: 1, positionY: 1, zoom: 4 })).toMatchObject({ translateX: 300, translateY: 300 })
  })

  it('maps pointer distance through the real pan range and clamps both axes', () => {
    const geometry = calculatePhotoPlacementGeometry({ frameWidth: 200, frameHeight: 200, sourceWidth: 200, sourceHeight: 200 }, { zoom: .5 })!
    const moved = applyPointerDeltaToPlacement({ positionX: .5, positionY: .5, zoom: .5 }, 40, -40, geometry)
    expect(moved.positionX).toBeCloseTo(.9)
    expect(moved.positionY).toBeCloseTo(.1)
    expect(moved.zoom).toBe(.5)
    expect(applyPointerDeltaToPlacement({ positionX: .5, positionY: .5, zoom: .5 }, -500, 500, geometry)).toEqual({ positionX: 0, positionY: 1, zoom: .5 })
  })

  it('avoids division by zero on an axis without pan range', () => {
    expect(applyPointerDeltaToPlacement({ positionX: .25, positionY: .75, zoom: 1 }, 500, 500, { panRangeX: 0, panRangeY: 0 })).toEqual({ positionX: .25, positionY: .75, zoom: 1 })
  })

  it('recalculates pixels for responsive frame sizes while stable placement stays unchanged', () => {
    const placement = { positionX: .8, positionY: .2, zoom: .5 }
    const small = calculatePhotoPlacementGeometry({ frameWidth: 100, frameHeight: 100, sourceWidth: 100, sourceHeight: 100 }, placement)!
    const large = calculatePhotoPlacementGeometry({ frameWidth: 240, frameHeight: 240, sourceWidth: 100, sourceHeight: 100 }, placement)!
    expect(small.translateX).toBeCloseTo(15)
    expect(small.translateY).toBeCloseTo(-15)
    expect(large.translateX).toBeCloseTo(36)
    expect(large.translateY).toBeCloseTo(-36)
    expect(placement).toEqual({ positionX: .8, positionY: .2, zoom: .5 })
  })

  it('uses each Memory Wall frame own geometry instead of the wall canvas size', () => {
    const placement = { positionX: .75, positionY: .25, zoom: .5 }
    const portraitFrame = calculatePhotoPlacementGeometry({ frameWidth: 100, frameHeight: 200, sourceWidth: 200, sourceHeight: 200 }, placement)!
    const landscapeFrame = calculatePhotoPlacementGeometry({ frameWidth: 200, frameHeight: 100, sourceWidth: 200, sourceHeight: 200 }, placement)!
    expect(portraitFrame).toMatchObject({ renderedWidth: 100, renderedHeight: 100, translateX: 0, translateY: -25 })
    expect(landscapeFrame).toMatchObject({ renderedWidth: 100, renderedHeight: 100, translateX: 25 })
    expect(landscapeFrame.translateY).toBeCloseTo(0)
  })
})
