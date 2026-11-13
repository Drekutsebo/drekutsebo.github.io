import {useEffect,useMemo,useState} from 'react'
import {Check,Search,Upload,Users} from 'lucide-react'
import PageTitle from '../components/PageTitle'
import {api} from '../services/api'
import type {Participant} from '../types'
export default function AttendancePage(){
 const [items,setItems]=useState<Participant[]>([]),[marked,setMarked]=useState<Set<string>>(new Set()),[query,setQuery]=useState(''),[busy,setBusy]=useState(''),[message,setMessage]=useState('')
 async function load(){try{const [p,r]=await Promise.all([api.participants(),api.leaderboard()]);setItems(p);setMarked(new Set(r.filter(x=>x.attendance).map(x=>x.id)))}catch(e){setMessage(e instanceof Error?e.message:'Ошибка загрузки')}}
 useEffect(()=>{load()},[])
 const filtered=useMemo(()=>items.filter(p=>(p.fullName+' '+p.group).toLowerCase().includes(query.toLowerCase())),[items,query])
 async function mark(id:string){setBusy(id);setMessage('');try{await api.attendance(id);setMarked(s=>new Set(s).add(id))}catch(e){setMessage(e instanceof Error?e.message:'Не удалось сохранить')}finally{setBusy('')}}
 async function importFile(file?:File){if(!file)return;setMessage('');try{const csv=await file.text();const r=await api.importParticipants(csv);setMessage(`Импортировано участников: ${r.imported}`);await load()}catch(e){setMessage(e instanceof Error?e.message:'Ошибка импорта')}}
 return <div className="page"><PageTitle eyebrow="ПАНЕЛЬ ВОЛОНТЁРА" title="Посещаемость" description="Отметка присутствия и загрузка списка участников."><div className="counter"><Users size={18}/>{marked.size} / {items.length}</div></PageTitle>
 <div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Поиск по ФИО или группе" value={query} onChange={e=>setQuery(e.target.value)}/></div><label className="secondary-button upload-button"><Upload size={16}/> Импорт CSV<input type="file" accept=".csv,text/csv" onChange={e=>importFile(e.target.files?.[0])}/></label></div>
 {message&&<div className="alert">{message}</div>}<div className="participant-list">{filtered.map(p=><div className="participant-row" key={p.id}><div className="avatar">{p.fullName.charAt(0)}</div><div className="participant-info"><b>{p.fullName}</b><span>{p.group||'Группа не указана'}</span></div><button disabled={marked.has(p.id)||busy===p.id} className={marked.has(p.id)?'marked-button':'mark-button'} onClick={()=>mark(p.id)}><Check size={16}/>{marked.has(p.id)?'Присутствует':busy===p.id?'Сохранение':'Отметить'}</button></div>)}{filtered.length===0&&<div className="empty">Участники не найдены. Загрузите CSV со списком участников.</div>}</div><p className="hint">Импорт заменяет текущий список участников. Перед загрузкой проверьте CSV: ФИО;Группа.</p></div>
}
