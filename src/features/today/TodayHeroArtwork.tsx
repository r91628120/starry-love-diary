import { todayAssets } from '../../assets/uiAssets'

export function TodayHeroArtwork() {
  return (
    <div className="today-hero-artwork" aria-hidden="true">
      <img className="today-hero-artwork__image" src={todayAssets.hero} alt="" />
      <img className="today-hero-artwork__decoration today-hero-artwork__decoration--heart" src={todayAssets.decorations.heartSparkle} alt="" />
    </div>
  )
}
