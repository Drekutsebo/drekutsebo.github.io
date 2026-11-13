import {useState} from 'react'
import {Outlet} from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import {useAuthContext} from './AuthProvider'
export default function Layout() {
  const [open,setOpen]=useState(false)
  const {isAuthenticated}=useAuthContext()
  return <div className="app-shell"><Header onMenuClick={()=>setOpen(true)}/><div className="app-body"><Sidebar open={open} onClose={()=>setOpen(false)} isVolunteer={isAuthenticated}/><main className="main-content"><Outlet/><footer className="footer">FPV Competition Platform <span>•</span> Система проведения соревнований</footer></main></div></div>
}
