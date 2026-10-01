import { footprintsAssets } from '../../assets/uiAssets'

export function FootprintsHero() {
  return (
    <div className="footprints-hero" aria-hidden="true">
      <img className="footprints-hero__scene" src={footprintsAssets.hero} alt="" />
    </div>
  )
}
