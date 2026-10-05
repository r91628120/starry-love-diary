import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { StarrySkyPage } from '../../pages/StarrySkyPage'
import { StarrySkyTopicsPage } from '../../pages/StarrySkyTopicsPage'
import { StarrySkyInvitePage } from '../../pages/StarrySkyInvitePage'
import { formatStarrySkyTopicShare } from '../../services/starrySkyTopicShare'

function renderSky(path = '/our/starry-sky', locale = 'zh-TW') { return render(<I18nProvider initialLocale={locale as never}><MemoryRouter initialEntries={[path]}><Routes><Route path="/our/starry-sky" element={<StarrySkyPage/>}/><Route path="/our/starry-sky/topics" element={<StarrySkyTopicsPage/>}/><Route path="/our/starry-sky/invite" element={<StarrySkyInvitePage/>}/></Routes></MemoryRouter></I18nProvider>) }
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Starry Sky Phase 2A', () => {
  it('renders the home with twelve categories, featured topic, custom topic, and unpaired pairing card', () => {
    renderSky(); expect(screen.getByRole('heading', { level: 1, name: '💕 我們的星空' })).toBeInTheDocument(); expect(screen.getByText(/我們已一起點亮 0 次心話/u)).toBeInTheDocument(); expect(screen.getByRole('button', { name: '查看心話歷史' })).toBeInTheDocument(); expect(screen.getAllByRole('button', { name: /A 我在你心裡/u })).toHaveLength(1); expect(screen.getAllByRole('button', { name: /L 心情/u })).toHaveLength(1); expect(screen.getByText('Q001')).toBeInTheDocument(); expect(screen.getByText('✨ 自己出一題')).toBeInTheDocument(); expect(screen.getByRole('button', { name: '輸入配對碼' })).toBeInTheDocument(); expect(screen.queryByText('這些功能會在後續階段開放；目前不會建立配對。')).not.toBeInTheDocument()
  })
  it('opens the selected category and renders its ten official questions', () => {
    renderSky(); fireEvent.click(screen.getByRole('button', { name: /C 你眼中的我/u })); expect(screen.getByRole('heading', { level: 1, name: '心話題庫' })).toBeInTheDocument(); expect(screen.getByText('Q021')).toBeInTheDocument(); expect(screen.getByText('Q030')).toBeInTheDocument(); expect(screen.getAllByText(/選這題/u)).toHaveLength(10)
  })
  it('switches categories and opens the local invitation presentation route for the selected official topic', () => {
    renderSky('/our/starry-sky/topics'); fireEvent.click(screen.getByRole('tab', { name: /B｜被愛/u })); expect(screen.getByText('Q011')).toBeInTheDocument(); expect(screen.getByText('Q020')).toBeInTheDocument(); fireEvent.click(screen.getAllByRole('button', { name: '選這題' })[0]); expect(screen.getByRole('heading', { level: 1, name: '💕 發起心話邀約' })).toBeInTheDocument(); expect(screen.getByText('Q011')).toBeInTheDocument()
  })
  it('keeps all categories in one scrollable tablist and provides controls for later categories', () => {
    renderSky('/our/starry-sky/topics')
    const tablist = screen.getByRole('tablist')
    expect(screen.getAllByRole('tab')).toHaveLength(12)
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.slice(0, 1))).toEqual(['A','B','C','D','E','F','G','H','I','J','K','L'])
    expect(screen.getByRole('button', { name: 'Previous categories' })).toBeDisabled()
    Object.defineProperties(tablist, { clientWidth: { configurable: true, value: 300 }, scrollWidth: { configurable: true, value: 1200 }, scrollLeft: { configurable: true, writable: true, value: 0 } })
    const scrollBy = vi.fn()
    Object.defineProperty(tablist, 'scrollBy', { configurable: true, value: scrollBy })
    fireEvent.scroll(tablist)
    fireEvent.click(screen.getByRole('button', { name: 'Next categories' }))
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number), behavior: 'auto' }))
    Object.defineProperty(tablist, 'scrollLeft', { configurable: true, writable: true, value: 220 })
    fireEvent.scroll(tablist)
    fireEvent.click(screen.getByRole('button', { name: 'Previous categories' }))
    expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: expect.any(Number), behavior: 'auto' }))
    Object.defineProperty(tablist, 'scrollLeft', { configurable: true, writable: true, value: 900 })
    fireEvent.scroll(tablist)
    expect(screen.getByRole('button', { name: 'Next categories' })).toBeDisabled()
    const hTab = screen.getByRole('tab', { name: /H｜/u })
    const scrollIntoView = vi.fn()
    Object.defineProperty(hTab, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    fireEvent.click(hTab)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest', inline: 'nearest' })
    expect(screen.getByText('Q071')).toBeInTheDocument(); expect(screen.getByText('Q080')).toBeInTheDocument()
  })
  it('uses the zh-TW topic source as a bounded fallback while the shell is localized', () => {
    renderSky('/our/starry-sky/topics', 'fr'); expect(screen.getByRole('heading', { level: 1, name: 'Bibliothèque de sujets' })).toBeInTheDocument(); expect(screen.getByText('當你和我相處的時候，你內心最常有什麼感受？')).toBeInTheDocument()
  })
  it('formats an official share without pairing, date, or private content', () => {
    expect(formatStarrySkyTopicShare('官方題目')).toBe('官方題目\n\n——《星星戀愛日記》\n🌙 來自「我們的星空」')
  })
})
