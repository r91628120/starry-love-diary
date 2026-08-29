import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function TodayIcon(props: IconProps) {
  return <IconBase {...props}><path d="M6 3.5h12a2 2 0 0 1 2 2v15H4v-15a2 2 0 0 1 2-2Z" /><path d="M8 2v4M16 2v4M4 8h16" /><path d="M12 17s-3-1.7-3-4a1.8 1.8 0 0 1 3-1.3A1.8 1.8 0 0 1 15 13c0 2.3-3 4-3 4Z" /></IconBase>
}

export function BottleIcon(props: IconProps) {
  return <IconBase {...props}><path d="M9 3h6M10 3v4l-3.5 3.2A4.5 4.5 0 0 0 5 13.5V20h14v-6.5a4.5 4.5 0 0 0-1.5-3.3L14 7V3" /><path d="m12 11 .8 1.7 1.9.2-1.4 1.3.4 1.9-1.7-.9-1.7.9.4-1.9-1.4-1.3 1.9-.2L12 11Z" /></IconBase>
}

export function FootprintsIcon(props: IconProps) {
  return <IconBase {...props}><path d="M8.7 10.5c1.9-.7 2.7-3.1 1.9-5.2S7.7 2 5.8 2.7 3.1 5.8 4 8s2.9 3.2 4.8 2.5ZM5.5 13c-1.6.6-2.3 2.6-1.6 4.5s2.6 2.9 4.2 2.3 2.3-2.6 1.6-4.5S7.1 12.4 5.5 13ZM15.3 13.5c-1.9-.7-2.7-3.1-1.9-5.2s2.9-3.2 4.8-2.5 2.7 3.1 1.8 5.3-2.9 3.2-4.8 2.5ZM18.5 16c1.6.6 2.3 2.6 1.6 4.5s-2.6 2.9-4.2 2.3-2.3-2.6-1.6-4.5 2.6-2.9 4.2-2.3Z" /></IconBase>
}

export function OurIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 5h7a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H8l-4 3v-5a3 3 0 0 1-2-2.8V8a3 3 0 0 1 2-3Z" /><path d="M13 8h4a3 3 0 0 1 3 3v6l-3-2h-3" /><path d="M8 11s-2-1.1-2-2.5a1.2 1.2 0 0 1 2-.8 1.2 1.2 0 0 1 2 .8C10 9.9 8 11 8 11Z" /></IconBase>
}

export function ClearIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20.2 15.3A8.4 8.4 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" /><path d="m17 3 .4 1.1L18.5 4l-.9.7.3 1.1-.9-.6-.9.6.3-1.1-.9-.7 1.1.1L17 3Z" /></IconBase>
}

export function SettingsIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></IconBase>
}

export function BackIcon(props: IconProps) {
  return <IconBase {...props}><path d="m15 18-6-6 6-6" /></IconBase>
}

export function SearchIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></IconBase>
}

export function SparkleIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 2c.6 5 2 6.4 7 7-5 .6-6.4 2-7 7-.6-5-2-6.4-7-7 5-.6 6.4-2 7-7Z" /><path d="M19 15c.2 2 1 2.8 3 3-2 .2-2.8 1-3 3-.2-2-1-2.8-3-3 2-.2 2.8-1 3-3Z" /></IconBase>
}

export function ShareIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></IconBase>
}

export function HeartIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 21S3 16 3 9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 9 1.5C21 16 12 21 12 21Z" /></IconBase>
}

export function CalendarIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /><path d="M8 14h2M14 14h2M8 17h2" /></IconBase>
}
