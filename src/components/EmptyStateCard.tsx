import type { ReactNode } from 'react'
import { SoftCard } from './SoftCard'
import { SparkleIcon } from './icons'

interface EmptyStateCardProps {
  title: string
  body: string
  action?: ReactNode
}

export function EmptyStateCard({ title, body, action }: EmptyStateCardProps) {
  return <SoftCard className="empty-state" tone="yellow"><SparkleIcon className="empty-state__icon" /><h2>{title}</h2><p>{body}</p>{action}</SoftCard>
}
