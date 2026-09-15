import type { ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { PrimaryButton, SecondaryButton } from './Buttons'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  children?: ReactNode
}

export function ConfirmDialog({ open, title, description, onConfirm, onCancel, confirmLabel, cancelLabel, danger = false, children }: ConfirmDialogProps) {
  const { t } = useI18n()
  if (!open) return null

  return <div className="dialog-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description"><h2 id="confirm-dialog-title">{title}</h2><p id="confirm-dialog-description">{description}</p>{children}<div className="confirm-dialog__actions"><SecondaryButton onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</SecondaryButton><PrimaryButton className={danger ? 'button--danger' : ''} onClick={onConfirm}>{confirmLabel ?? t('common.confirm')}</PrimaryButton></div></section></div>
}
