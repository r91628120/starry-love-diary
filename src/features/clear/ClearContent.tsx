import { useState } from 'react'
import { clearAssets } from '../../assets/uiAssets'
import { PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const scenarios:Array<{key:TranslationKey;icon:string}>=[
  {key:'clear.scenarios.miss',icon:clearAssets.scenarios.miss},{key:'clear.scenarios.waitingMessage',icon:clearAssets.scenarios.waitingMessage},{key:'clear.scenarios.tooDeep',icon:clearAssets.scenarios.tooDeep},{key:'clear.scenarios.unsureFeelings',icon:clearAssets.scenarios.unsureFeelings},{key:'clear.scenarios.unsureFit',icon:clearAssets.scenarios.unsureFit},
]
const tools:Array<{title:TranslationKey;description:TranslationKey;icon:string}>=[
  {title:'clear.tools.organize.title',description:'clear.tools.organize.description',icon:clearAssets.tools.organizeFeelings},{title:'clear.tools.boatGuide.title',description:'clear.tools.boatGuide.description',icon:clearAssets.tools.boatGuide},{title:'clear.tools.loveBrain.title',description:'clear.tools.loveBrain.description',icon:clearAssets.tools.loveBrainTest},{title:'clear.tools.likeOrHabit.title',description:'clear.tools.likeOrHabit.description',icon:clearAssets.tools.likeOrHabit},
]
const records:Array<{title:TranslationKey,date:TranslationKey,body:TranslationKey,icon:string}>=[
  {title:'clear.records.one.title',date:'clear.records.one.date',body:'clear.records.one.body',icon:clearAssets.records.organizeFeelings},{title:'clear.records.two.title',date:'clear.records.two.date',body:'clear.records.two.body',icon:clearAssets.records.boatGuide},{title:'clear.records.three.title',date:'clear.records.three.date',body:'clear.records.three.body',icon:clearAssets.records.likeOrHabit},
]

export function ClearContent(){const{t}=useI18n();const[selected,setSelected]=useState(0);const[feedback,setFeedback]=useState('');const[saved,setSaved]=useState(false);return <>
  <SoftCard className="clear-scenarios"><SectionHeader title={t('clear.scenarios.title')}/><div className="clear-scenarios__rail" role="group" aria-label={t('clear.scenarios.title')}>{scenarios.map((item,index)=><button type="button" className={selected===index?'is-active':''} aria-pressed={selected===index} onClick={()=>setSelected(index)} key={item.key}><img src={item.icon} alt=""/><span>{t(item.key)}</span></button>)}</div><p className="mock-feedback" aria-live="polite">{t('clear.scenarios.selected',{scenario:t(scenarios[selected].key)})}</p></SoftCard>
  <section className="clear-tools" aria-label={t('clear.tools.label')}>{tools.map((tool,index)=><button type="button" className={index===0?'clear-tool clear-tool--primary':'clear-tool'} onClick={()=>setFeedback(t('clear.tools.feedback',{tool:t(tool.title)}))} key={tool.title}><img src={tool.icon} alt=""/><div><h2>{t(tool.title)}</h2><p>{t(tool.description)}</p></div></button>)}</section><p className="mock-feedback" aria-live="polite">{feedback}</p>
  <SoftCard className="clear-latest"><SectionHeader title={t('clear.latest.title')}/><div className="clear-latest__body"><img src={clearAssets.recentSummaryThumbnail} alt={t('clear.latest.imageAlt')}/><div><time>{t('clear.latest.date')}</time><h3>{t('clear.latest.trigger')}</h3><strong>{t('clear.latest.summaryLabel')}</strong><p>{t('clear.latest.summary')}</p><span>{t('clear.latest.saved')}</span></div></div><SecondaryButton onClick={()=>setFeedback(t('clear.latest.feedback'))}>{t('clear.latest.viewDetails')}</SecondaryButton></SoftCard>
  <section className="clear-records"><SectionHeader title={t('clear.records.title')}/><div>{records.map(record=><article key={record.title}><img src={record.icon} alt=""/><div><h3>{t(record.title)}</h3><time>{t(record.date)}</time><p>{t(record.body)}</p></div><span aria-hidden="true">›</span></article>)}</div><SecondaryButton onClick={()=>setFeedback(t('clear.records.feedback'))}>{t('clear.records.viewAll')}</SecondaryButton></section>
  <SoftCard className="clear-quote"><img className="clear-quote__background" src={clearAssets.quoteBanner} alt=""/><div><SectionHeader title={t('clear.quote.title')}/><blockquote>{t('clear.quote.text')}</blockquote><PrimaryButton onClick={()=>setSaved(true)}><img src={clearAssets.saveStarBottle} alt=""/>{t(saved?'clear.quote.saved':'clear.quote.saveAsStar')}</PrimaryButton></div></SoftCard>
  <SoftCard className="clear-tip"><img src={clearAssets.tip} alt=""/><div><h2>{t('clear.tip.title')}</h2><p>{t('clear.tip.text')}</p></div></SoftCard>
  </>}
