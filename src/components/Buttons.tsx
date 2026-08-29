import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function PrimaryButton({ className = '', type = 'button', ...props }: ButtonProps) {
  return <button className={`button button--primary ${className}`.trim()} type={type} {...props} />
}

export function SecondaryButton({ className = '', type = 'button', ...props }: ButtonProps) {
  return <button className={`button button--secondary ${className}`.trim()} type={type} {...props} />
}
