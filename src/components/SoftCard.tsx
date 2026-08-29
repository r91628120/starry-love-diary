import type { HTMLAttributes, ReactNode } from 'react'

interface SoftCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  tone?: 'cream' | 'pink' | 'blue' | 'purple' | 'green' | 'yellow'
}

export function SoftCard({ children, className = '', tone = 'cream', ...props }: SoftCardProps) {
  return <div className={`soft-card soft-card--${tone} ${className}`.trim()} {...props}>{children}</div>
}
