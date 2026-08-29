import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  ariaLabel: string
  children: ReactNode
}

export function IconButton({ ariaLabel, className = '', children, type = 'button', ...props }: IconButtonProps) {
  return <button className={`icon-button ${className}`.trim()} type={type} aria-label={ariaLabel} {...props}>{children}</button>
}
