import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useState } from 'react'
import { ModalOverlay } from './ModalOverlay'

function Example() {
  const [open, setOpen] = useState(false)
  return <><button type="button" onClick={() => setOpen(true)}>Open modal</button>{open ? <ModalOverlay placement="bottom-sheet"><section role="dialog" aria-modal="true"><button type="button" onClick={() => setOpen(false)}>Close modal</button></section></ModalOverlay> : null}</>
}

it('portals above the app tree, locks background scroll, and restores the opener focus', () => {
  render(<Example />)
  const opener = screen.getByRole('button', { name: 'Open modal' })
  opener.focus()
  fireEvent.click(opener)

  const dialog = screen.getByRole('dialog')
  expect(dialog.closest('.modal-overlay')?.parentElement).toBe(document.body)
  expect(dialog.closest('.modal-overlay')).toHaveClass('modal-overlay--bottom-sheet')
  expect(document.body.style.overflow).toBe('hidden')

  fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
  expect(document.body.style.overflow).toBe('')
  expect(document.activeElement).toBe(opener)
})
