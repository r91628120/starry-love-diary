import type { ReactNode } from 'react'

interface SectionHeaderProps {
  icon?: ReactNode
  title: string
  action?: ReactNode
}

export function SectionHeader({ icon, title, action }: SectionHeaderProps) {
  return <div className="section-header"><div className="section-header__title">{icon}<h2>{title}</h2></div>{action}</div>
}
