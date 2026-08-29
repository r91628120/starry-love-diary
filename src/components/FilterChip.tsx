import type { ButtonHTMLAttributes } from 'react'

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export function FilterChip({ className = '', selected = false, type = 'button', ...props }: FilterChipProps) {
  return <button className={`filter-chip ${selected ? 'filter-chip--selected' : ''} ${className}`.trim()} type={type} aria-pressed={selected} {...props} />
}
