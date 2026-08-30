import type { ReactNode } from 'react'
import { SoftCard } from '../../components'

export function SettingsSection({title,icon,children,className=''}:{title:string;icon:string;children:ReactNode;className?:string}){return <SoftCard className={`settings-section ${className}`.trim()}><header><img src={icon} alt=""/><h2>{title}</h2></header><div className="settings-section__rows">{children}</div></SoftCard>}

export function SettingsRow({icon,label,value,description,onClick,danger=false,control}:{icon?:string;label:string;value?:string;description?:string;onClick?:()=>void;danger?:boolean;control?:ReactNode}){const content=<>{icon?<img src={icon} alt=""/>:null}<span className="settings-row__copy"><strong>{label}</strong>{description?<small>{description}</small>:null}</span>{control??<><span className="settings-row__value">{value}</span>{onClick?<span className="settings-row__chevron" aria-hidden="true">›</span>:null}</>}</>;const className=`settings-row ${icon?'':'settings-row--no-icon'} ${danger?'settings-row--danger':''}`.trim();return onClick?<button type="button" className={className} onClick={onClick}>{content}</button>:<div className={className}>{content}</div>}
