import { footprintsAssets } from '../../assets/uiAssets'

export function FootprintsHero() {
  return (
    <div className="footprints-hero" aria-hidden="true">
      <img className="footprints-hero__scene" src={footprintsAssets.hero} alt="" />
      <img className="footprints-hero__decorations" src={footprintsAssets.decorations} alt="" />
    </div>
  )
}
