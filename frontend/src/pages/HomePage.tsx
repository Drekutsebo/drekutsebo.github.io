import {useEffect,useState} from 'react'
import {ArrowRight,ClipboardCheck,RadioTower,Trophy,Users} from 'lucide-react'
import {Link} from 'react-router-dom'
import {api} from '../services/api'
import type {ParticipantResult} from '../types'
export default function HomePage(){
 const [rows,setRows]=useState<ParticipantResult[]>([])
 useEffect(()=>{api.leaderboard().then(setRows).catch(()=>setRows([]))},[])
 const tested=rows.filter(x=>x.testScore!==null).length
 const cards=[{label:'Участников',value:rows.length,icon:Users},{label:'Прошли тест',value:tested,icon:ClipboardCheck},{label:'Лидер рейтинга',value:rows[0]?.totalScore??0,icon:Trophy}]
 const modules=[['Тестирование','10 вопросов · 5 минут','/test','01'],['Посещаемость','Учёт присутствия участников','/attendance','02'],['Симулятор','Результаты виртуальных полётов','/simulator','03'],['Реальные полёты','Результаты прохождения трассы','/flights','04'],['Общий рейтинг','Сводная таблица результатов','/leaderboard','05']]
 return <div className="page"><section className="hero"><div className="hero-copy"><div className="eyebrow"><i/> FPV COMPETITION SYSTEM</div><h1>Точность. Скорость.<br/><em>Пилотирование.</em></h1><p>Единая платформа для проведения соревнований FPV-дронов: от теоретической подготовки до итогового рейтинга пилотов.</p><Link to="/leaderboard" className="primary-button">Открыть рейтинг <ArrowRight size={17}/></Link></div><div className="hero-radar"><div className="radar r1"/><div className="radar r2"/><div className="radar r3"/><div className="radar-core"><RadioTower size={42}/></div><b className="radar-dot d1"/><b className="radar-dot d2"/></div></section>
 <div className="stats-grid">{cards.map(({label,value,icon:Icon})=><div className="stat-card" key={label}><div className="stat-icon"><Icon/></div><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>
 <div className="section-heading"><div><span className="eyebrow">РАЗДЕЛЫ</span><h2>Платформа соревнований</h2></div></div><div className="module-grid">{modules.map(([title,desc,to,n])=><Link className="module-card" to={to} key={to}><span className="module-num">{n}</span><div><h3>{title}</h3><p>{desc}</p></div><ArrowRight size={18}/></Link>)}</div>
 </div>
}
