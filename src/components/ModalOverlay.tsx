import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ModalPlacement = 'center' | 'bottom-sheet'

interface ModalOverlayProps {
  children: ReactNode
  className?: string
  placement?: ModalPlacement
  qa12Overlay?: string
}

let scrollLockDepth = 0
let previousBodyOverflow = ''

/**
 * Places app dialogs above the fixed navigation, keeps their viewport safe-area
 * aware, and restores the invoking control's focus after closing.
 */
export function ModalOverlay({ children, className, placement = 'center', qa12Overlay }: ModalOverlayProps) {
  const opener = useRef<HTMLElement | null>(null)
  const [visibleViewport, setVisibleViewport] = useState<{ height: number; offsetTop: number }>()

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined
    const syncVisibleViewport = () => setVisibleViewport({ height: viewport.height, offsetTop: viewport.offsetTop })
    syncVisibleViewport()
    viewport.addEventListener('resize', syncVisibleViewport)
    viewport.addEventListener('scroll', syncVisibleViewport)
    return () => {
      viewport.removeEventListener('resize', syncVisibleViewport)
      viewport.removeEventListener('scroll', syncVisibleViewport)
    }
  }, [])

  useEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (scrollLockDepth === 0) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    scrollLockDepth += 1

    return () => {
      scrollLockDepth -= 1
      if (scrollLockDepth === 0) document.body.style.overflow = previousBodyOverflow
      opener.current?.focus()
    }
  }, [])

  const classes = ['modal-overlay', `modal-overlay--${placement}`, className].filter(Boolean).join(' ')
  const viewportStyle = visibleViewport ? { '--modal-viewport-height': `${visibleViewport.height}px`, '--modal-viewport-offset': `${visibleViewport.offsetTop}px` } as CSSProperties : undefined
  return createPortal(<div className={classes} data-qa12-overlay={qa12Overlay} role="presentation" style={viewportStyle}>{children}</div>, document.body)
}
