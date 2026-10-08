import { type ReactNode } from 'react'
import { ModalOverlay } from '../../components/ModalOverlay'

export function LoveDeliveryOverlay({ children }: { children: ReactNode }) {
  return <ModalOverlay className="love-delivery-time-picker-backdrop" placement="bottom-sheet">{children}</ModalOverlay>
}
