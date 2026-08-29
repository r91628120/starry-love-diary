import { useState } from 'react'
import { footprintsAssets, ourAssets } from '../../assets/uiAssets'
import { SectionHeader, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'

const frames = [
  { kind: 'vertical', frame: ourAssets.frames.vertical, position: '22% 25%' },
  { kind: 'horizontal', frame: ourAssets.frames.horizontal, position: '50% 24%' },
  { kind: 'square', frame: ourAssets.frames.square, position: '72% 27%' },
  { kind: 'heart', frame: ourAssets.frames.heart, position: '50% 30%' },
] as const

export function MemoryWall() {
  const { t } = useI18n()
  const [selected, setSelected] = useState<number | null>(null)
  return <SoftCard className="memory-wall">
    <SectionHeader title={t('our.memoryWall')} />
    <p className="memory-wall__count">{t('our.photosCount', { current: 4, max: 60 })}</p>
    <div className="memory-wall__canvas">
      <img className="memory-wall__background" src={ourAssets.memoryWall} alt="" aria-hidden="true" />
      {frames.map((item, index) => <button className={`memory-photo memory-photo--${item.kind}`} type="button" aria-label={t('our.memoryWall.openPhoto')} onClick={() => setSelected(index)} key={item.kind}>
        <img className="memory-photo__image" src={footprintsAssets.hero} alt={t('our.memoryWall.photoAlt')} style={{ objectPosition: item.position }} />
        <img className="memory-photo__frame" src={item.frame} alt="" aria-hidden="true" />
      </button>)}
    </div>
    {selected !== null ? <div className="memory-lightbox" role="dialog" aria-modal="true" aria-label={t('our.memoryWall.openPhoto')}><button type="button" aria-label={t('common.close')} onClick={() => setSelected(null)}>×</button><img src={footprintsAssets.hero} alt={t('our.memoryWall.photoAlt')} style={{ objectPosition: frames[selected].position }} /></div> : null}
  </SoftCard>
}
