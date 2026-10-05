import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'

const pairMocks = vi.hoisted(() => ({
  body: 'identity loading',
  createPairInvite: vi.fn(),
  resolvePairInvite: vi.fn(),
  claimPairInvite: vi.fn(),
  loadPairState: vi.fn(),
}))

vi.mock('../features/our/PairedFeatureIdentityBoundary', () => ({
  PairedFeatureIdentityBoundary: () => <div>{pairMocks.body}</div>,
}))
vi.mock('../lib/firebase/pairClient', () => ({
  createPairInvite: (...args: unknown[]) => pairMocks.createPairInvite(...args),
  resolvePairInvite: (...args: unknown[]) => pairMocks.resolvePairInvite(...args),
  claimPairInvite: (...args: unknown[]) => pairMocks.claimPairInvite(...args),
  loadPairState: (...args: unknown[]) => pairMocks.loadPairState(...args),
}))

import { PairPage } from './PairPage'

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
  pairMocks.loadPairState.mockReset()
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
})
