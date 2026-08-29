import { Outlet } from 'react-router-dom'
import { BottomNavigation } from '../components'

export function MainLayout() {
  return <div className="app-shell app-shell--with-navigation"><div className="app-shell__content"><Outlet /></div><BottomNavigation /></div>
}
