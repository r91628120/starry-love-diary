import type { CSSProperties, ReactNode } from 'react'
import { SoftCard } from '../../components'

export function SettingsSection({title,icon,children,className=''}:{title:string;icon:string;children:ReactNode;className?:string}){return <SoftCard className={`settings-section ${className}`.trim()}><header><img src={icon} alt="" aria-hidden="true"/><h2>{title}</h2></header><div className="settings-section__rows">{children}</div></SoftCard>}

export function SettingsRow({ icon, iconClassName = '', iconStyle, label, value, description, onClick, danger = false, unavailable = false, control, controlLayout = 'inline' }: { icon?: string; iconClassName?: string; iconStyle?: CSSProperties; label: string; value?: string; description?: string; onClick?: () => void; danger?: boolean; unavailable?: boolean; control?: ReactNode; controlLayout?: 'inline' | 'below' }) {
  const identity = <><>{icon ? <img className={iconClassName} style={iconStyle} src={icon} alt="" aria-hidden="true" /> : null}</><span className="settings-row__copy"><strong>{label}</strong>{description ? <small>{description}</small> : null}</span></>
  const content = control && controlLayout === 'below'
    ? <><div className="settings-row__identity">{identity}</div><div className="settings-row__actions">{control}</div></>
    : <>{identity}{control ?? <><span className="settings-row__value">{value}</span>{onClick ? <span className="settings-row__chevron" aria-hidden="true">›</span> : null}</>}</>
  const className = `settings-row ${icon ? '' : 'settings-row--no-icon'} ${danger ? 'settings-row--danger' : ''} ${unavailable ? 'settings-row--unavailable' : ''} ${control && controlLayout === 'below' ? 'settings-row--stacked-control' : ''}`.trim()
  return onClick ? <button type="button" className={className} onClick={onClick}>{content}</button> : <div className={className} aria-disabled={unavailable || undefined}>{content}</div>
}
