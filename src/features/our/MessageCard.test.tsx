import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter, createMemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { MESSAGE_TO_YOU_TYPES } from '../../data/types'
import { I18nProvider } from '../../i18n/I18nProvider'
import { messages, supportedLocales } from '../../i18n/messages'
import { messageToYouV1Messages } from '../../i18n/messageToYouV1Messages'
import { MessageCard } from './MessageCard'

afterEach(cleanup)
async function setup(locale='zh-TW', backing=createMemoryStorageBacking()){
 const runtime=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'zh-TW',localDate:'2026-09-15'})
 render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale as typeof supportedLocales[number]}><MessageCard/></I18nProvider></PersistenceProvider>)
 return {runtime,backing}
}

describe('Message To You V1',()=>{
  it('defines seven stable keys and complete localized labels',()=>{
  expect(MESSAGE_TO_YOU_TYPES).toEqual(['miss_you','thank_you','sorry','dont_be_mad','tell_you','invite_out','free_message'])
  const keys=Object.keys(messageToYouV1Messages['zh-TW'])
  for(const locale of supportedLocales){expect(Object.keys(messageToYouV1Messages[locale])).toEqual(keys);for(const type of MESSAGE_TO_YOU_TYPES)expect(messages[locale][`messageV1.type.${type}`].trim()).not.toBe('');expect(messages[locale]['heartCard.brand']).toBe('Starry Love Diary')}
  })
  it('uses inclusive prompts in every locale without a masculine default',()=>{
   expect(messages['zh-TW']['messageV1.prompt']).toBe('今天，有什麼想對他／她說？')
   expect(messages.en['messageV1.prompt'].toLowerCase()).not.toContain('him')
   expect(messages.es['messageV1.prompt'].toLowerCase()).not.toContain('él')
   expect(messages.fr['messageV1.prompt'].toLowerCase()).not.toContain('lui')
  })
  it('shows the empty-content error only after save, then clears it for valid input and history',async()=>{
   await setup();const error='內容不能是空白。'
   expect(screen.queryByText(error)).not.toBeInTheDocument()
   fireEvent.click(screen.getByRole('button',{name:'保存這份心意'}));expect(screen.getByText(error)).toBeInTheDocument()
   fireEvent.change(screen.getByRole('textbox',{name:'寫下想說的話'}),{target:{value:'想把這句話留下來。'}});expect(screen.queryByText(error)).not.toBeInTheDocument()
   fireEvent.click(screen.getByRole('button',{name:'查看歷史總覽'}));expect(screen.queryByText(error)).not.toBeInTheDocument()
  })
 it('selects a type, saves immediately into context, and shows optional card action',async()=>{
  const {runtime}=await setup();fireEvent.click(screen.getByRole('radio',{name:'今天有點想你'}));expect(screen.getByRole('radio',{name:'今天有點想你'})).toHaveAttribute('aria-checked','true')
  fireEvent.change(screen.getByRole('textbox',{name:'寫下想說的話'}),{target:{value:'今天經過咖啡店，突然想到你。'}});fireEvent.click(screen.getByRole('button',{name:'保存這份心意'}))
  await screen.findByText('這份心意已留在我們的回憶裡。');expect(await runtime.messageToYou.getEntries()).toHaveLength(1);expect((await runtime.messageToYou.getEntries())[0]).toMatchObject({type:'miss_you',content:'今天經過咖啡店，突然想到你。',localDate:'2026-09-15'});expect(screen.getByRole('button',{name:'做成星光小卡'})).toBeInTheDocument()
 })
 it('keeps user content unchanged while localized system labels change',async()=>{
  const {runtime}=await setup('en');await runtime.messageToYou.createEntry({type:'miss_you',content:'使用者原文',localDate:'2026-09-15'});cleanup();runtime.initial.messageToYouEntries=await runtime.messageToYou.getEntries();render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MessageCard/></I18nProvider></PersistenceProvider>);fireEvent.click(screen.getByRole('button',{name:'View message history'}));expect(screen.getAllByRole('button',{name:/Missing You Today/}).length).toBeGreaterThan(0);expect(screen.getByText('使用者原文')).toBeInTheDocument()
 })
 it('reconciles the legacy singleton once as free_message and survives reopen',async()=>{
  const backing=createMemoryStorageBacking(),stamp='2026-09-10T08:00:00.000Z',adapter=new MemoryStorageAdapter(backing);await adapter.open();await adapter.put('messageToYou',{id:'message-to-you',content:'legacy',createdAt:stamp,updatedAt:stamp});adapter.close()
  const first=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'en',localDate:'2026-09-15'});expect(await first.messageToYou.getEntries()).toEqual([expect.objectContaining({id:'message-to-you',type:'free_message',content:'legacy'})]);first.adapter.close();const second=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'en',localDate:'2026-09-15'});expect(await second.messageToYou.getEntries()).toHaveLength(1)
 })
 it('computes total and category counts from the same filtered entries',async()=>{
  const {runtime}=await setup();await runtime.messageToYou.createEntry({type:'miss_you',content:'a',localDate:'2026-09-15'});await runtime.messageToYou.createEntry({type:'thank_you',content:'b',localDate:'2026-09-10'});runtime.initial.messageToYouEntries=await runtime.messageToYou.getEntries();cleanup();render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MessageCard/></I18nProvider></PersistenceProvider>);fireEvent.click(screen.getByRole('button',{name:'查看歷史總覽'}));expect(screen.getByText('想對你說 · 2 則')).toBeInTheDocument();expect(screen.getByRole('button',{name:/今天有點想你 1/})).toBeInTheDocument();expect(screen.getByRole('button',{name:/今天謝謝你 1/})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:/今天有點想你 1/}));expect(screen.getByText('a')).toBeInTheDocument();expect(screen.queryByText('b')).not.toBeInTheDocument()
 })
  it('groups history by descending year then descending month and opens only the newest group',async()=>{
   const {runtime}=await setup();await runtime.messageToYou.createEntry({type:'miss_you',content:'old-year',localDate:'2025-12-31'});await runtime.messageToYou.createEntry({type:'thank_you',content:'old-month',localDate:'2026-08-31'});await runtime.messageToYou.createEntry({type:'free_message',content:'newest',localDate:'2026-09-15'});runtime.initial.messageToYouEntries=await runtime.messageToYou.getEntries();cleanup();render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MessageCard/></I18nProvider></PersistenceProvider>);fireEvent.click(screen.getByRole('button',{name:'查看歷史總覽'}));expect(screen.getByRole('button',{name:/2026.*2 則/})).toHaveAttribute('aria-expanded','true');expect(screen.getByRole('button',{name:/2025.*1 則/})).toHaveAttribute('aria-expanded','false');expect(screen.getByText('newest')).toBeInTheDocument();expect(screen.queryByText('old-month')).not.toBeInTheDocument()
 })
 it('supports edit and confirmed delete without changing schema',async()=>{
  const {runtime}=await setup();await runtime.messageToYou.createEntry({type:'free_message',content:'before',localDate:'2026-09-15'});runtime.initial.messageToYouEntries=await runtime.messageToYou.getEntries();cleanup();render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="en"><MessageCard/></I18nProvider></PersistenceProvider>);fireEvent.click(screen.getByRole('button',{name:'View message history'}));fireEvent.click(screen.getByText('before'));fireEvent.click(screen.getByRole('button',{name:'Edit'}));fireEvent.change(screen.getByRole('textbox',{name:'Write what you want to say'}),{target:{value:'after'}});fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await screen.findByText('after');fireEvent.click(screen.getByRole('button',{name:'View message history'}));fireEvent.click(screen.getByText('after'));fireEvent.click(screen.getByRole('button',{name:'Delete'}));fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await waitFor(()=>expect(runtime.messageToYou.getEntries()).resolves.toHaveLength(0))
 })
})
