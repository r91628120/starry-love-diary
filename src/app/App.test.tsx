import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { APP_VERSION } from './appMetadata'
import { I18nProvider } from '../i18n/I18nProvider'
import { messages, supportedLocales, type Locale } from '../i18n/messages'
import { PersistenceProvider } from '../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { getDailyLoveQuote } from '../features/today/dailyLoveQuoteRuntime'

function renderApp(initialPath = '/today', locale: Locale = 'zh-TW') {
  return render(
    <I18nProvider initialLocale={locale}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

function renderAppWithRuntime(runtime: PersistenceRuntime, initialPath = '/our', locale: Locale = 'zh-TW') {
  runtime.initial.settings.onboardingCompleted = true
  return render(
    <PersistenceProvider runtime={runtime}>
      <I18nProvider initialLocale={locale}>
        <MemoryRouter initialEntries={[initialPath]}><App /></MemoryRouter>
      </I18nProvider>
    </PersistenceProvider>,
  )
}

afterEach(cleanup)

describe('App routing', () => {
  it.each([
    ['/today', '今天'],
    ['/star-bottle', '星星瓶'],
    ['/footprints', '足跡'],
    ['/our', '我們'],
    ['/clear', '清醒'],
  ])('renders the main route %s with the correct active tab', (path, title) => {
    renderApp(path)

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: title })).toHaveClass('bottom-navigation__item--active')
  })

  it('navigates through all main routes, opens settings, and returns to the originating page', () => {
    renderApp()

    for (const title of ['星星瓶', '足跡', '我們', '清醒']) {
      fireEvent.click(screen.getByRole('link', { name: title }))
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('button', { name: '設定' }))
    expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('heading', { level: 1, name: '清醒' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '清醒' })).toHaveClass('bottom-navigation__item--active')
  })

  it('redirects an unknown route to Today', async () => {
    renderApp('/not-a-route')
    expect(await screen.findByRole('heading', { level: 1, name: '今天' })).toBeInTheDocument()
  })
})

describe('Today Page static UI', () => {
  it('renders the daily love quote and all seven mood options', () => {
    renderApp('/today')

    expect(screen.getByRole('heading', { level: 2, name: '戀愛星語｜每日一句' })).toBeInTheDocument()
    expect(screen.getByText(getDailyLoveQuote('zh-TW', 1))).toBeInTheDocument()

    const moodGroup = screen.getByRole('group', { name: '今天的心情' })
    expect(within(moodGroup).getAllByRole('button')).toHaveLength(7)
  })

  it('opens Settings from Today and returns to Today', () => {
    renderApp('/today')

    fireEvent.click(screen.getByRole('button', { name: '設定' }))
    expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('heading', { level: 1, name: '今天' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '今天' })).toHaveClass('bottom-navigation__item--active')
  })

  it('keeps the heart line within the 30-character UI limit', () => {
    renderApp('/today')

    const input = screen.getByRole('textbox', { name: '今天，有什麼話想留下？' })
    fireEvent.change(input, { target: { value: '這是一段刻意超過三十個字的測試內容，用來確認一句心話輸入框會確實限制長度並保持畫面穩定。' } })

    expect(input).toHaveAttribute('maxlength', '30')
    expect((input as HTMLTextAreaElement).value).toHaveLength(30)
  })
})

describe('Star Bottle Page static UI', () => {
  it('renders four filters and empty real repository statistics', () => {
    renderApp('/star-bottle')

    const filterGroup = screen.getByRole('group', { name: '時間範圍' })
    expect(within(filterGroup).getAllByRole('button')).toHaveLength(4)
    expect(within(filterGroup).getByRole('button', { name: '今日' })).toHaveAttribute('aria-pressed', 'true')

    expect(screen.getAllByText('0')).toHaveLength(3)
    expect(screen.getByText('這個時間範圍還沒有星星')).toBeInTheDocument()
  })

  it('keeps search and filter interactions local and preserves routing', () => {
    renderApp('/star-bottle')

    const input = screen.getByRole('searchbox', { name: '搜尋星星、心情或關鍵字' })
    fireEvent.change(input, { target: { value: '想念' } })
    expect(input).toHaveValue('想念')

    fireEvent.click(screen.getByRole('button', { name: '本月' }))
    expect(screen.getByRole('button', { name: '本月' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: '設定' }))
    expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('heading', { level: 1, name: '星星瓶' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '星星瓶' })).toHaveClass('bottom-navigation__item--active')
  })
})

describe('Footprints Page static UI', () => {
  it('renders the calendar, real empty statistics, diary, and empty recent state', async () => {
    renderApp('/footprints')

    expect(screen.getByRole('heading', { level: 1, name: '足跡' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: /月曆/ })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { selected: true })).toBeInTheDocument()

    const stats = screen.getByRole('region', { name: '本月足跡統計' })
    expect(within(stats).getAllByRole('article')).toHaveLength(4)
    for (const value of ['0 篇', '0 天', '尚無紀錄', '+0']) expect(within(stats).getByText(value)).toBeInTheDocument()

    expect(screen.getByRole('searchbox', { name: '搜尋日記或心情' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '今天的日記' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '今天的日記' })).toHaveAttribute('maxlength', '1000')
    expect(screen.getByText(/0 \/ 1,000/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '近期足跡' })).toBeInTheDocument()
    expect(await screen.findByText('還沒有足跡紀錄')).toBeInTheDocument()
    for (const retired of ['今天也有一點想你。', '一起吃晚餐，是今天最溫柔的片刻。', '先把不知道的事，留在不知道。']) expect(screen.queryByText(retired)).not.toBeInTheDocument()
  })

  it('keeps search local, preserves the active tab, and returns from Settings', () => {
    renderApp('/footprints')

    const input = screen.getByRole('searchbox', { name: '搜尋日記或心情' })
    fireEvent.change(input, { target: { value: '想念' } })
    expect(input).toHaveValue('想念')
    expect(screen.getByRole('link', { name: '足跡' })).toHaveClass('bottom-navigation__item--active')

    fireEvent.click(screen.getByRole('button', { name: '設定' }))
    expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('heading', { level: 1, name: '足跡' })).toBeInTheDocument()
  })
})

describe('Our Page static UI', () => {
  it('renders a memory-first flow without duplicate relationship statistics or fake user data', () => {
    renderApp('/our')

    expect(screen.getByRole('heading', { level: 1, name: '我們' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '我們的回憶牆' })).toBeInTheDocument()
    expect(screen.getByText('尚未加入回憶照片')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '前往照片管理' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /放大查看回憶照片/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '關係統計' })).not.toBeInTheDocument()
    expect(screen.queryByText('星心值')).not.toBeInTheDocument()
    expect(screen.queryByText('累積日記')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '重要日子' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '我們的時刻' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '想對你說' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '我記得的你' })).toBeInTheDocument()
    const wall = document.querySelector('.memory-wall')
    expect(wall?.nextElementSibling).toContainElement(screen.getByRole('heading', { level: 2, name: '重要日子' }))
    expect(document.querySelector('.our-stats')).toBeNull()
    for (const emptyState of ['還沒有重要日子，新增一筆開始記錄。', '還沒有我們的時刻，新增一段想留下的回憶。', '還沒有記錄，寫下一件你想記得的小事。']) expect(screen.getByText(emptyState)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '今天，有什麼想對他／她說？' })).toBeInTheDocument()
    for (const fakeText of ['對方生日', '第一次一起看海', '謝謝你出現在我的生活裡。', '喜歡的飲料', '喜歡的音樂']) expect(screen.queryByText(fakeText, { exact: false })).not.toBeInTheDocument()
  })

  it('keeps empty search and favorite filters usable and preserves the Settings round trip', () => {
    renderApp('/our')
    fireEvent.click(screen.getByRole('button', { name: '只看收藏' }))
    const search = screen.getByRole('searchbox', { name: '搜尋我記得的你' })
    fireEvent.change(search, { target: { value: '音樂' } })
    expect(screen.getByText('還沒有記錄，寫下一件你想記得的小事。')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: '我們' })).toHaveClass('bottom-navigation__item--active')
    fireEvent.click(screen.getByRole('button', { name: '設定' }))
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('heading', { level: 1, name: '我們' })).toBeInTheDocument()
  })

  it('shows repository data after storage reopen and combines search with favorite filtering', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-29' })
    await first.importantDates.createImportantDate({ type: 'first_meeting', title: '咖啡店第一次見面', date: '2026-01-02' })
    await first.memoryMoments.createMemoryMoment({ title: '海邊散步', content: '一起看著海浪。', localDate: '2026-08-20' })
    await first.messageToYou.saveMessage('重新開啟後仍然記得這句話。')
    await first.rememberedYou.createRememberedYouCard({ title: '音樂', content: '喜歡安靜的歌', isFavorite: true, localDate: '2026-08-19' })
    await first.rememberedYou.createRememberedYouCard({ title: '飲料', content: '喜歡無糖茶', localDate: '2026-08-18' })
    first.adapter.close()

    const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-29' })
    renderAppWithRuntime(reopened)
    for (const persistedText of ['咖啡店第一次見面', '海邊散步', '一起看著海浪。', '喜歡安靜的歌', '喜歡無糖茶']) expect(screen.getByText(persistedText)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '只看收藏' }))
    fireEvent.change(screen.getByRole('searchbox', { name: '搜尋我記得的你' }), { target: { value: '音樂' } })
    expect(screen.getByText('喜歡安靜的歌')).toBeInTheDocument()
    expect(screen.queryByText('喜歡無糖茶')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看歷史總覽' }))
    expect(screen.getByText('重新開啟後仍然記得這句話。')).toBeInTheDocument()
  })
})

describe('Clear Page static UI',()=>{
 it('renders five scenarios, four tools, latest summary, records, quote and tip',()=>{renderApp('/clear');expect(screen.getByRole('heading',{level:1,name:'清醒'})).toBeInTheDocument();const group=screen.getByRole('group',{name:'今天，我需要哪一種清醒？'});expect(within(group).getAllByRole('button')).toHaveLength(5);expect(within(screen.getByRole('region',{name:'清醒工具'})).getAllByRole('button')).toHaveLength(4);expect(screen.getByRole('heading',{level:2,name:'最近一次整理'})).toBeInTheDocument();expect(screen.getByRole('heading',{level:2,name:'最近清醒紀錄'})).toBeInTheDocument();expect(screen.getByText('清醒不是停止喜歡，而是不再把自己弄丟。')).toBeInTheDocument();expect(screen.getByRole('heading',{level:2,name:'小提醒'})).toBeInTheDocument();expect(screen.getByRole('link',{name:'清醒'})).toHaveClass('bottom-navigation__item--active')})
 it('supports local scenarios, opens a formal tool, and does not create stars without a completed record',()=>{renderApp('/clear');const scenario=screen.getByRole('button',{name:'我在等他的訊息'});fireEvent.click(scenario);expect(scenario).toHaveAttribute('aria-pressed','true');expect(screen.queryByRole('button',{name:'存成清醒星星'})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'開始「開始整理心情」'}));expect(screen.getByRole('heading',{level:2,name:'發生什麼事？'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'回到清醒首頁'}));fireEvent.click(screen.getByRole('button',{name:'設定'}));fireEvent.click(screen.getByRole('button',{name:'返回'}));expect(screen.getByRole('heading',{level:1,name:'清醒'})).toBeInTheDocument()})
 it('shows completed repository history after reopen and never restores retired fake records',async()=>{const backing=createMemoryStorageBacking();const first=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'zh-TW',localDate:'2026-08-29'});await first.clearRecords.complete({triggerType:'waiting_response',facts:'真正保存的等待事實',emotions:['anxious'],emotionIntensity:4,nextActionType:'take_a_walk'});first.adapter.close();const reopened=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'zh-TW',localDate:'2026-08-29'});renderAppWithRuntime(reopened,'/clear');expect((await screen.findAllByText('真正保存的等待事實')).length).toBeGreaterThan(0);for(const retired of ['我把注意力放回自己，先過好今天的小日子。','我意識到他不會給我穩定回應，這段關係讓我越來越累。','我發現我害怕孤單，所以才把他的忽冷忽熱當作喜歡。'])expect(screen.queryByText(retired)).not.toBeInTheDocument()})
 it('resumes a Love Boat draft at the saved question after storage reopen',async()=>{const backing=createMemoryStorageBacking();const first=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'zh-TW',localDate:'2026-08-29'});const draft=await first.loveBoatAssessments.createDraft();await first.loveBoatAssessments.updateDraft(draft.id,{aAnswers:{a01:3},currentQuestionIndex:1});first.adapter.close();const reopened=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'zh-TW',localDate:'2026-08-29'});renderAppWithRuntime(reopened,'/clear');fireEvent.click(screen.getByRole('button',{name:/暈船法典/}));await waitFor(()=>expect(screen.getByRole('heading',{level:2,name:'他很久沒有回覆時，我會很難專心做自己的事。'})).toBeInTheDocument());expect(screen.getByText('目前回答已即時保存在這台裝置。')).toBeInTheDocument()})
 it('returns a Love Boat draft to Clear without completing or awarding, then resumes after reopen',async()=>{const backing=createMemoryStorageBacking();const first=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'zh-TW',localDate:'2026-08-29'});renderAppWithRuntime(first,'/clear');fireEvent.click(screen.getByRole('button',{name:/暈船法典/}));fireEvent.click(await screen.findByRole('button',{name:'開始看看'}));fireEvent.click(await screen.findByRole('radio',{name:'常常'}));await waitFor(()=>expect(screen.getByRole('radio',{name:'常常'})).toHaveAttribute('aria-checked','true'));expect(screen.getByText('1 / 12')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'下一題'}));await waitFor(()=>expect(screen.getByRole('heading',{level:2,name:'他很久沒有回覆時，我會很難專心做自己的事。'})).toBeInTheDocument());fireEvent.click(screen.getByRole('button',{name:'← 回到清醒首頁'}));expect(screen.getByRole('heading',{level:1,name:'清醒'})).toBeInTheDocument();const draft=await first.loveBoatAssessments.getActiveDraft();expect(draft?.aAnswers.a01).toBe(3);expect(draft?.currentQuestionIndex).toBe(1);expect(await first.loveBoatAssessments.list()).toEqual([]);expect((await first.scores.getAwards()).filter((award)=>award.awardType==='clear_completed')).toEqual([]);expect(await first.stars.getStars()).toEqual([]);cleanup();first.adapter.close();const reopened=await initializePersistence({adapter:new MemoryStorageAdapter(backing),defaultLocale:'zh-TW',localDate:'2026-08-29'});renderAppWithRuntime(reopened,'/clear');fireEvent.click(screen.getByRole('button',{name:/暈船法典/}));await waitFor(()=>expect(screen.getByRole('heading',{level:2,name:'他很久沒有回覆時，我會很難專心做自己的事。'})).toBeInTheDocument());expect((await reopened.loveBoatAssessments.getActiveDraft())?.id).toBe(draft?.id)})
 it.each([
  ['開始整理心情','clear.tools.organize.title'],
  ['暈船法典','clear.tools.boatGuide.title'],
  ['戀愛腦檢測','clear.tools.loveBrain.title'],
  ['喜歡？習慣？','clear.tools.likeOrHabit.title'],
 ] as const)('shows the current tool context heading for %s',async(label,key)=>{renderApp('/clear');const tools=screen.getByRole('region',{name:'清醒工具'});fireEvent.click(within(tools).getByRole('button',{name:new RegExp(label)}));const heading=await screen.findByRole('heading',{level:2,name:messages['zh-TW'][key]});expect(heading).toHaveClass('clear-tool-context__name')})
 it('rerenders the current tool context in the selected locale',async()=>{renderApp('/clear');let tools=screen.getByRole('region',{name:'清醒工具'});fireEvent.click(within(tools).getByRole('button',{name:/戀愛腦檢測/}));expect(await screen.findByRole('heading',{level:2,name:'戀愛腦檢測'})).toHaveClass('clear-tool-context__name');fireEvent.click(screen.getByRole('button',{name:'設定'}));fireEvent.click(screen.getByRole('button',{name:'English'}));fireEvent.click(screen.getByRole('button',{name:'Back'}));tools=screen.getByRole('region',{name:'Clarity tools'});fireEvent.click(within(tools).getByRole('button',{name:/Love-pattern check/}));expect(await screen.findByRole('heading',{level:2,name:'Love-pattern check'})).toHaveClass('clear-tool-context__name')})
})

describe('Settings Page static UI',()=>{
 it('renders the eight Settings sections without retired Clear or notification cards or Bottom Navigation',()=>{renderApp('/settings');expect(screen.getByRole('heading',{level:1,name:'設定'})).toBeInTheDocument();for(const title of ['基本資料','重要日子','照片與回憶','日記與星星','使用與說明','語言','隱私與資料','關於'])expect(screen.getByRole('heading',{level:2,name:title})).toBeInTheDocument();expect(screen.queryByRole('heading',{level:2,name:'清醒'})).not.toBeInTheDocument();expect(screen.queryByRole('heading',{level:2,name:'通知'})).not.toBeInTheDocument();expect(screen.queryByRole('switch')).not.toBeInTheDocument();expect(screen.queryByLabelText('提醒時間')).not.toBeInTheDocument();expect(screen.queryByRole('navigation')).not.toBeInTheDocument();expect(APP_VERSION).toBe('0.1.1');expect(screen.getByText(APP_VERSION)).toBeInTheDocument();expect(screen.getByText('隱私政策')).toBeInTheDocument();expect(screen.getByText('使用條款')).toBeInTheDocument()})
 it('opens the seven-heart-notes reveal photo manager and returns to Settings',()=>{renderApp('/settings');fireEvent.click(screen.getByRole('button',{name:/七句心話・照片顯影/}));expect(screen.getByRole('heading',{level:1,name:'七句心話・照片顯影'})).toBeInTheDocument();expect(screen.getByText('尚未選擇照片')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'返回'}));expect(screen.getByRole('heading',{level:1,name:'設定'})).toBeInTheDocument()})
 it('opens Moment photo management from Settings and returns to Settings',()=>{renderApp('/settings');fireEvent.click(screen.getByRole('button',{name:'我們的時刻'}));expect(screen.getByRole('heading',{level:1,name:'我們的時刻'})).toBeInTheDocument();expect(screen.getByRole('heading',{level:2,name:'我們的時刻'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'返回'}));expect(screen.getByRole('heading',{level:1,name:'設定'})).toBeInTheDocument()})
 it('supports six language options, actionable data clearing, and back without reminder controls',()=>{renderApp('/today');fireEvent.click(screen.getByRole('button',{name:'設定'}));expect(screen.queryByRole('switch')).not.toBeInTheDocument();expect(screen.queryByLabelText('提醒時間')).not.toBeInTheDocument();const languages=screen.getByRole('group',{name:'語言'});expect(within(languages).getAllByRole('button')).toHaveLength(6);fireEvent.click(within(languages).getByRole('button',{name:'English'}));expect(within(languages).getByRole('button',{name:'English'})).toHaveAttribute('aria-pressed','true');fireEvent.click(within(languages).getByRole('button',{name:'繁體中文'}));expect(screen.getByRole('button',{name:/清空目前戀情資料/u})).toBeEnabled();expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'返回'}));expect(screen.getByRole('heading',{level:1,name:'今天'})).toBeInTheDocument()})
})

describe('Six-language visual smoke coverage', () => {
  it.each(supportedLocales)('renders Today and Settings in %s without raw i18n keys or the retired demo name', (locale) => {
    const today = renderApp('/today', locale)
    expect(today.container.textContent).not.toMatch(/\b(?:today|settings|common|nav)\.[A-Za-z]/)
    expect(today.container.textContent).not.toMatch(/阿澤|A-Ze|アーゼ|아저/)
    cleanup()

    const settings = renderApp('/settings', locale)
    expect(settings.container.textContent).not.toMatch(/\b(?:today|settings|common|nav)\.[A-Za-z]/)
    expect(settings.container.textContent).not.toMatch(/阿澤|A-Ze|アーゼ|아저/)
  })
})
