import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { I18nProvider } from '../i18n/I18nProvider'

const pairMocks = vi.hoisted(() => ({
  body: 'identity loading',
  createPairInvite: vi.fn(),
  resolvePairInvite: vi.fn(),
  claimPairInvite: vi.fn(),
  endPair: vi.fn(),
  loadPairState: vi.fn(),
  shareNativeText: vi.fn(),
  copyText: vi.fn(),
}))

vi.mock('../features/our/PairedFeatureIdentityBoundary', () => ({
  PairedFeatureIdentityBoundary: ({ children }: { children: ReactNode }) => pairMocks.body === 'pair screen' ? <>{children}</> : <div>{pairMocks.body}</div>,
}))
vi.mock('../lib/firebase/pairClient', () => ({
  createPairInvite: (...args: unknown[]) => pairMocks.createPairInvite(...args),
  resolvePairInvite: (...args: unknown[]) => pairMocks.resolvePairInvite(...args),
  claimPairInvite: (...args: unknown[]) => pairMocks.claimPairInvite(...args),
  endPair: (...args: unknown[]) => pairMocks.endPair(...args),
  loadPairState: (...args: unknown[]) => pairMocks.loadPairState(...args),
}))
vi.mock('../services/nativeTextShare', () => ({ shareNativeText: (...args: unknown[]) => pairMocks.shareNativeText(...args) }))
vi.mock('../services/shareText', () => ({ copyText: (...args: unknown[]) => pairMocks.copyText(...args) }))

import { PairPage } from './PairPage'
import { pairMessages, pairShareMessages } from '../i18n/pairMessages'

function renderPairPage(body: string) {
  pairMocks.body = body
  render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/our/pair']}><Routes><Route path="/our/pair" element={<PairPage />} /><Route path="/our" element={<p>our home</p>} /></Routes></MemoryRouter></I18nProvider>)
}

afterEach(() => {
  cleanup()
  pairMocks.body = 'identity loading'
  pairMocks.createPairInvite.mockReset()
  pairMocks.resolvePairInvite.mockReset()
  pairMocks.claimPairInvite.mockReset()
  pairMocks.endPair.mockReset()
  pairMocks.loadPairState.mockReset()
  pairMocks.shareNativeText.mockReset()
  pairMocks.copyText.mockReset()
})

describe('PairPage stable shell', () => {
  it.each(['identity loading', 'identity error', 'Apple durable-identity gate'])('keeps Back available during %s without Pair mutation', (body) => {
    renderPairPage(body)
    expect(screen.getByText(body)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(screen.getByText('our home')).toBeInTheDocument()
    expect(pairMocks.createPairInvite).not.toHaveBeenCalled()
    expect(pairMocks.resolvePairInvite).not.toHaveBeenCalled()
    expect(pairMocks.claimPairInvite).not.toHaveBeenCalled()
  })

  it('shares and explicitly copies the complete friendly invitation without changing its opaque token', async () => {
    pairMocks.body = 'pair screen'
    pairMocks.loadPairState.mockResolvedValue(null)
    pairMocks.createPairInvite.mockResolvedValue({ inviteId: 'opaque_TEST-token_123' })
    pairMocks.shareNativeText.mockResolvedValue('shared')
    pairMocks.copyText.mockResolvedValue('copied')
    renderPairPage('pair screen')
    await screen.findByRole('button', { name: '建立邀請' })
    fireEvent.click(screen.getByRole('button', { name: '建立邀請' }))
    await screen.findByRole('button', { name: '分享邀請' })

    fireEvent.click(screen.getByRole('button', { name: '分享邀請' }))
    await waitFor(() => expect(pairMocks.shareNativeText).toHaveBeenCalledTimes(1))
    const [sharedText] = pairMocks.shareNativeText.mock.calls[0]
    expect(sharedText).toContain('opaque_TEST-token_123')
    expect(sharedText).toContain('我們 → 專屬配對 → 我收到邀請')
    expect(sharedText).not.toMatch(/uid|firebase|apple|diary/i)

    fireEvent.click(screen.getByRole('button', { name: '複製邀請' }))
    await waitFor(() => expect(pairMocks.copyText).toHaveBeenCalledWith(sharedText))
    expect(screen.getByText('邀請內容已複製')).toBeInTheDocument()
    expect(pairMocks.resolvePairInvite).not.toHaveBeenCalled()
    expect(pairMocks.claimPairInvite).not.toHaveBeenCalled()
  })

  it('provides complete localized invitation copy for every supported locale', () => {
    for (const messages of Object.values(pairShareMessages)) {
      expect(messages['pair.share']).toBeTruthy()
      expect(messages['pair.shareTitle']).toBeTruthy()
      expect(messages['pair.shareMessage']).toContain('{inviteId}')
      expect(messages['pair.copied']).toBeTruthy()
      expect(messages['pair.shareError']).toBeTruthy()
    }
    for (const messages of Object.values(pairMessages)) {
      expect(messages['pair.end']).toBeTruthy()
      expect(messages['pair.endConfirmTitle']).toBeTruthy()
      expect(messages['pair.endConfirmBody']).toBeTruthy()
    }
  })

  it('requires confirmation before ending and refreshes after trusted success', async () => {
    pairMocks.body = 'pair screen'
    pairMocks.loadPairState.mockResolvedValueOnce({ pairId: 'pair-id', memberUids: ['alice', 'bob'], status: 'active' }).mockResolvedValueOnce(null)
    pairMocks.endPair.mockResolvedValue({ status: 'unpaired' })
    renderPairPage('pair screen')
    await screen.findByRole('button', { name: '解除專屬配對' })
    fireEvent.click(screen.getByRole('button', { name: '解除專屬配對' }))
    expect(pairMocks.endPair).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(pairMocks.endPair).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '解除專屬配對' }))
    fireEvent.click(screen.getByRole('button', { name: '解除配對' }))
    await waitFor(() => expect(pairMocks.endPair).toHaveBeenCalledTimes(1))
    await screen.findByRole('button', { name: '建立邀請' })
  })
})
