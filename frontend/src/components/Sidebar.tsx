import { ClipboardCheck, Home, Monitor, Plane, Trophy, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
const links = [
  {to:'/',label:'Главная',icon:Home,public:true},
  {to:'/attendance',label:'Посещаемость',icon:Users,public:false},
  {to:'/test',label:'Тестирование',icon:ClipboardCheck,public:true},
  {to:'/simulator',label:'Симулятор',icon:Monitor,public:false},
  {to:'/flights',label:'Реальные полёты',icon:Plane,public:false},
  {to:'/leaderboard',label:'Общий рейтинг',icon:Trophy,public:true}
]
export default function Sidebar({open,onClose,isVolunteer}:{open:boolean;onClose:()=>void;isVolunteer:boolean}) {
  return <><div className={`sidebar-overlay ${open?'visible':''}`} onClick={onClose}/><aside className={`sidebar ${open?'sidebar-open':''}`}>
    <div className="sidebar-top"><span>НАВИГАЦИЯ</span><button className="icon-button sidebar-close" onClick={onClose}><X/></button></div>
    <nav>{links.filter(x=>x.public||isVolunteer).map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} onClick={onClose} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
    <div className="sidebar-bottom"><div className="brand-icon small">FPV</div><div><b>FPV Competition</b><span>Платформа соревнований</span></div></div>
  </aside></>
}
