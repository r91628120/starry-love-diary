import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { I18nProvider } from '../i18n/I18nProvider'
import { supportedLocales, type Locale } from '../i18n/messages'

function renderApp(initialPath = '/today', locale: Locale = 'zh-TW') {
  return render(
    <I18nProvider initialLocale={locale}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
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
    expect(screen.getByText('喜歡一個人，也別忘了把自己的心放回自己身上。')).toBeInTheDocument()

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
    expect(screen.getByText('目前沒有符合條件的星星')).toBeInTheDocument()
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
  it('renders the calendar, four statistics, diary, and three recent entries', () => {
    renderApp('/footprints')

    expect(screen.getByRole('heading', { level: 1, name: '足跡' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: '2026 年 8 月月曆' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: '23 日' })).toHaveAttribute('aria-selected', 'true')

    const stats = screen.getByRole('region', { name: '本月足跡統計' })
    expect(within(stats).getAllByRole('article')).toHaveLength(4)
    for (const value of ['18 篇', '23 天', '想念', '+48']) expect(within(stats).getByText(value)).toBeInTheDocument()

    expect(screen.getByRole('searchbox', { name: '搜尋日記內容或心情' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '今天的日記' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '今天的日記' })).toHaveAttribute('maxlength', '1000')
    expect(screen.getByText('0 / 1000')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '近期足跡' })).toBeInTheDocument()
    expect(screen.getAllByText(/今天也有一點想你|一起吃晚餐|先把不知道/)).toHaveLength(3)
  })

  it('keeps search local, preserves the active tab, and returns from Settings', () => {
    renderApp('/footprints')

    const input = screen.getByRole('searchbox', { name: '搜尋日記內容或心情' })
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
  it('renders the memory wall, relationship sections, and four remembered cards', () => {
    renderApp('/our')

    expect(screen.getByRole('heading', { level: 1, name: '我們' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '我們的回憶牆' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '放大查看回憶照片' })).toHaveLength(4)
    expect(within(screen.getByRole('region', { name: '關係統計' })).getAllByRole('article')).toHaveLength(4)
    expect(screen.getByRole('heading', { level: 2, name: '重要日子' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '我們的時刻' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '想對你說' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '我記得的你' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /加入收藏|取消收藏/ })).toHaveLength(4)
  })

  it('supports moment navigation, favorite filtering, search, and Settings round trip', () => {
    renderApp('/our')

    expect(screen.getByText('第一次一起看海')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '下一個時刻' }))
    expect(screen.getByText('一起吃晚餐')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '上一個時刻' }))
    expect(screen.getByText('第一次一起看海')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '只看收藏' }))
    expect(screen.getAllByRole('button', { name: '取消收藏' })).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '全部' }))
    fireEvent.click(screen.getAllByRole('button', { name: '加入收藏' })[0])
    expect(screen.getAllByRole('button', { name: '取消收藏' })).toHaveLength(3)

    const search = screen.getByRole('searchbox', { name: '搜尋我記得的你' })
    fireEvent.change(search, { target: { value: '音樂' } })
    expect(screen.getByText('喜歡的音樂')).toBeInTheDocument()
    expect(screen.queryByText('喜歡的飲料')).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: '我們' })).toHaveClass('bottom-navigation__item--active')
    fireEvent.click(screen.getByRole('button', { name: '設定' }))
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByRole('heading', { level: 1, name: '我們' })).toBeInTheDocument()
  })
})

describe('Clear Page static UI',()=>{
 it('renders five scenarios, four tools, latest summary, records, quote and tip',()=>{renderApp('/clear');expect(screen.getByRole('heading',{level:1,name:'清醒'})).toBeInTheDocument();const group=screen.getByRole('group',{name:'今天，我需要哪一種清醒？'});expect(within(group).getAllByRole('button')).toHaveLength(5);expect(within(screen.getByRole('region',{name:'清醒工具'})).getAllByRole('button')).toHaveLength(4);expect(screen.getByRole('heading',{level:2,name:'最近一次整理'})).toBeInTheDocument();expect(screen.getByRole('heading',{level:2,name:'最近清醒紀錄'})).toBeInTheDocument();expect(screen.getByText('清醒不是停止喜歡，而是不再把自己弄丟。')).toBeInTheDocument();expect(screen.getByRole('heading',{level:2,name:'小提醒'})).toBeInTheDocument();expect(screen.getByRole('link',{name:'清醒'})).toHaveClass('bottom-navigation__item--active')})
 it('supports local scenario and save-star interactions plus Settings round trip',()=>{renderApp('/clear');const scenario=screen.getByRole('button',{name:'我在等他的訊息'});fireEvent.click(scenario);expect(scenario).toHaveAttribute('aria-pressed','true');fireEvent.click(screen.getByRole('button',{name:'存成清醒星星'}));expect(screen.getByRole('button',{name:'已存成清醒星星'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'設定'}));fireEvent.click(screen.getByRole('button',{name:'返回'}));expect(screen.getByRole('heading',{level:1,name:'清醒'})).toBeInTheDocument()})
})

describe('Settings Page static UI',()=>{
 it('renders all nine sections without Bottom Navigation',()=>{renderApp('/settings');expect(screen.getByRole('heading',{level:1,name:'設定'})).toBeInTheDocument();for(const title of ['基本資料','重要日子','照片與回憶','日記與星星','清醒','通知','語言','隱私與資料','關於'])expect(screen.getByRole('heading',{level:2,name:title})).toBeInTheDocument();expect(screen.queryByRole('navigation')).not.toBeInTheDocument();expect(screen.getByText('1.0.0')).toBeInTheDocument();expect(screen.getByText('隱私政策')).toBeInTheDocument();expect(screen.getByText('使用條款')).toBeInTheDocument()})
 it('supports toggles, six language options, destructive confirmation, and back',()=>{renderApp('/today');fireEvent.click(screen.getByRole('button',{name:'設定'}));const toggle=screen.getByRole('switch',{name:'戀愛星語提醒'});expect(toggle).toHaveAttribute('aria-checked','true');fireEvent.click(toggle);expect(toggle).toHaveAttribute('aria-checked','false');const languages=screen.getByRole('group',{name:'語言'});expect(within(languages).getAllByRole('button')).toHaveLength(6);fireEvent.click(within(languages).getByRole('button',{name:'English'}));expect(within(languages).getByRole('button',{name:'English'})).toHaveAttribute('aria-pressed','true');fireEvent.click(within(languages).getByRole('button',{name:'繁中'}));fireEvent.click(screen.getByRole('button',{name:'清空目前戀情資料'}));expect(screen.getByRole('alertdialog')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'取消'}));expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'返回'}));expect(screen.getByRole('heading',{level:1,name:'今天'})).toBeInTheDocument()})
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
