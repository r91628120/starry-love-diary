import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SettingsPage } from '../../pages/SettingsPage'
import { APP_VERSION } from '../../app/appMetadata'
import { SettingsInformationPage } from '../../pages/SettingsInformationPage'
import { I18nProvider } from '../../i18n/I18nProvider'
import { messages, supportedLocales } from '../../i18n/messages'
import { settingsInformationMessages } from '../../i18n/settingsInformationMessages'
import { userGuideMessages } from '../../i18n/userGuideMessages'

afterEach(cleanup)

const informationKeys = Object.keys(settingsInformationMessages['zh-TW']) as Array<keyof (typeof settingsInformationMessages)['zh-TW']>

function renderRoute(path: string, locale = 'zh-TW') {
  return render(<I18nProvider initialLocale={locale as typeof supportedLocales[number]}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/settings/help" element={<SettingsInformationPage kind="help" />} />
    <Route path="/settings/star-heart" element={<SettingsInformationPage kind="star-heart" />} />
    <Route path="/settings/star-bottle-help" element={<SettingsInformationPage kind="star-bottle-help" />} />
    <Route path="/settings/data-help" element={<SettingsInformationPage kind="data-help" />} />
    <Route path="/settings/privacy" element={<SettingsInformationPage kind="privacy" />} />
    <Route path="/settings/terms" element={<SettingsInformationPage kind="terms" />} />
    <Route path="/settings/version" element={<SettingsInformationPage kind="version" />} />
  </Routes></MemoryRouter></I18nProvider>)
}

describe('Settings help, rules, and legal information architecture', () => {
  it.each(supportedLocales)('has every non-empty information key in %s', (locale) => {
    expect(Object.keys(settingsInformationMessages[locale])).toEqual(informationKeys)
    for (const key of informationKeys) {
      expect(messages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
    }
  })

  it('renders the Help & information section and routes each entry', () => {
    renderRoute('/settings')
    expect(screen.getByRole('heading', { name: '使用與說明' })).toBeInTheDocument()
    const destinations: Array<[string, string]> = [
      ['使用說明', '今天'], ['星心值說明', '每日首次開啟 +1'], ['星星瓶說明', '星星瓶只有兩種星星。'], ['資料管理', '匯出文字資料'],
    ]
    for (const [label, destinationText] of destinations) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }))
      expect(screen.getByText(destinationText)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '返回' }))
    }
  })

  it('lists the five main pages and the exact Starheart rules without score-like claims', () => {
    renderRoute('/settings/help')
    for (const label of ['今天', '星星瓶', '足跡', '我們', '清醒', '資料與設定']) expect(screen.getByText(label)).toBeInTheDocument()
    cleanup()
    renderRoute('/settings/star-heart')
    for (const rule of ['每日首次開啟 +1', '新增日記 +7', '每日首次選擇心情 +2', '完成「開始整理心情」 +5', '每日首次成功分享戀愛星語 +10', '其他三個清醒工具 +0']) expect(screen.getByText(rule)).toBeInTheDocument()
    expect(screen.getByText(/不是戀愛評分/)).toBeInTheDocument()
    expect(screen.queryByText(/compatibility|match percentage/i)).not.toBeInTheDocument()
  })

  it.each(supportedLocales)('provides a complete, non-empty user guide in %s', (locale) => {
    const keys = Object.keys(userGuideMessages['zh-TW']) as Array<keyof typeof userGuideMessages['zh-TW']>
    expect(Object.keys(userGuideMessages[locale])).toEqual(keys)
    for (const key of keys) expect(userGuideMessages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
  })

  it.each(supportedLocales)('keeps the Message To You V1 guide localized and non-empty in %s', (locale) => {
    expect(messages[locale]['settings.guide.our.body'].trim()).not.toBe('')
    expect(messages[locale]['settings.guide.our.body']).toContain('300')
  })

  it('documents the complete Message To You V1 flow inside the existing Our guide', () => {
    renderRoute('/settings/help')
    fireEvent.click(screen.getByText('我們'))
    const text = document.body.textContent ?? ''
    for (const value of ['今天有點想你', '今天謝謝你', '對不起啦', '不要生氣了嘛', '有一句話想告訴你', '想約你出去', '我想說的話', '300 字', '內容不可為空白', '保存這份心意', '查看歷史總覽', '本月、本年或全部', '七種心意篩選', '全部心意總數', '每一類的累積數量', '依年、月整理', '編輯或刪除', '做成星光小卡', '儲存心意卡或分享圖片', '不會新增第二筆心意紀錄']) expect(text).toContain(value)
  })

  it('documents the multi-step and safety-critical runtime behavior', () => {
    renderRoute('/settings/help')
    for (const title of ['今天', '星星瓶', '足跡', '我們', '清醒', '資料與設定']) fireEvent.click(screen.getByText(title))
    const text = document.body.textContent ?? ''
    expect(text).toContain('七句心話')
    expect(text).toMatch(/愛心按鈕七次/)
    expect(text).toContain('照片顯影')
    expect(text).toContain('存成清醒星星')
    expect(text).toMatch(/年、月分組/)
    expect(text).toContain('重要日子')
    expect(text).toContain('共 25 題')
    expect(text).toContain('查看結果')
    expect(text).toContain('完成這次檢測')
    expect(text).toMatch(/未完成的答題草稿/)
    expect(text).toContain('匯出文字資料')
    expect(text).toContain('匯出與匯入 App 資料')
    expect(text).toContain('不可復原')
    expect(text).toMatch(/手機相簿原圖/)
  })

  it('explains both Star Bottle types and that counts differ from score points', () => {
    renderRoute('/settings/star-bottle-help')
    expect(screen.getByText('心情星星')).toBeInTheDocument()
    expect(screen.getByText('清醒星星')).toBeInTheDocument()
    expect(screen.getByText(/同一天改心情，只更新同一顆/)).toBeInTheDocument()
    expect(screen.getByText(/主動選擇「存成清醒星星」/)).toBeInTheDocument()
    expect(screen.getByText(/不同系統/)).toBeInTheDocument()
  })

  it('explains the three live data-management functions and that photos are excluded', () => {
    renderRoute('/settings/data-help')
    for (const heading of ['匯出文字資料', '匯出 App 資料', '匯入 App 資料', '照片不包含在資料移轉檔中']) expect(screen.getByText(heading)).toBeInTheDocument()
    expect(screen.getByText(/相同紀錄會保留較新的版本/)).toBeInTheDocument()
    expect(screen.queryByText(/備份與匯出功能目前尚未開放/)).not.toBeInTheDocument()
  })

  it('serves internal privacy, terms, and version pages with formal V1 content', () => {
    renderRoute('/settings/privacy')
    expect(screen.getByText('我們重視你的私人紀錄')).toBeInTheDocument()
    expect(screen.getByText('第三方追蹤')).toBeInTheDocument()
    expect(screen.queryByText(/上架前提供/)).not.toBeInTheDocument()
    cleanup()
    renderRoute('/settings/terms')
    expect(screen.getByText('非專業建議')).toBeInTheDocument()
    expect(screen.getByText('資料保存')).toBeInTheDocument()
    expect(screen.queryByText(/上架前提供/)).not.toBeInTheDocument()
    cleanup()
    renderRoute('/settings/version')
    expect(screen.getByText('星星戀愛日記')).toBeInTheDocument()
    expect(APP_VERSION).toBe('1.0.0')
    expect(screen.getByText(APP_VERSION)).toBeInTheDocument()
    expect(screen.getByText('© 2026 Starry Love Diary')).toBeInTheDocument()
  })

  it('does not render the retired Settings bottom decoration or an empty wrapper', () => {
    renderRoute('/settings')
    expect(document.querySelector('.settings-footer-decoration')).toBeNull()
    expect(readFileSync('src/features/settings/SettingsContent.tsx', 'utf8')).not.toContain('settingsAssets.decorations')
  })

  it('contains no runtime Han text in the new information architecture', () => {
    for (const path of ['src/pages/SettingsInformationPage.tsx', 'src/features/settings/SettingsContent.tsx', 'src/app/App.tsx']) {
      expect(readFileSync(path, 'utf8'), path).not.toMatch(/[\u3400-\u9fff]/u)
    }
  })
})
