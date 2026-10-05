import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function LoveDeliveryOverlay({ children }: { children: ReactNode }) {
  return createPortal(<div className="love-delivery-time-picker-backdrop" role="presentation">{children}</div>, document.body)
}
