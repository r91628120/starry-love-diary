import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../i18n/I18nProvider'
import { messages, supportedLocales, type Locale } from '../i18n/messages'
import { DISMISSED_UPDATE_VERSION_STORAGE_KEY } from '../services/updateCheckService'
import { UpdateCheckNotice } from './UpdateCheckNotice'

const newer = async () => ({ platform: 'ios' as const, latestVersion: '1.0.1', storeUrl: 'https://apps.apple.com/example' })

afterEach(() => localStorage.clear())

describe('UpdateCheckNotice', () => {
  it('shows a soft update only when the check returns one, and dismisses its target version across remounts', async () => {
    localStorage.clear()
    const check = vi.fn(newer)
    const view = render(<I18nProvider initialLocale="zh-TW"><UpdateCheckNotice check={check} /></I18nProvider>)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '稍後再說' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(localStorage.getItem(DISMISSED_UPDATE_VERSION_STORAGE_KEY)).toBe('1.0.1')
    view.unmount()
    render(<I18nProvider initialLocale="zh-TW"><UpdateCheckNotice check={check} /></I18nProvider>)
    await waitFor(() => expect(check).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows a newer remote target after an older target was dismissed', async () => {
    localStorage.setItem(DISMISSED_UPDATE_VERSION_STORAGE_KEY, '1.0.1')
    render(<I18nProvider initialLocale="en"><UpdateCheckNotice check={async () => ({ platform: 'ios', latestVersion: '1.0.2', storeUrl: '' })} /></I18nProvider>)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('uses the configured platform store URL and safely hides the action when it is absent', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<I18nProvider initialLocale="en"><UpdateCheckNotice check={newer} /></I18nProvider>)
    fireEvent.click(await screen.findByRole('button', { name: 'Update now' }))
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://apps.apple.com/example', '_blank', 'noopener,noreferrer'))
    open.mockRestore()

    render(<I18nProvider initialLocale="en"><UpdateCheckNotice check={async () => ({ platform: 'android', latestVersion: '0.1.2', storeUrl: '' })} /></I18nProvider>)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Update now' })).toBeNull()
  })

  it.each(supportedLocales)('has complete update strings in %s', (locale: Locale) => {
    for (const key of ['update.title', 'update.body', 'update.later', 'update.now'] as const) expect(messages[locale][key].trim()).not.toBe('')
  })
})
