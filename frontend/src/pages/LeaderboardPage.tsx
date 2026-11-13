import {useEffect,useState} from 'react'
import {RefreshCw,Trophy} from 'lucide-react'
import PageTitle from '../components/PageTitle'
import {api} from '../services/api'
import type {ParticipantResult} from '../types'
export default function LeaderboardPage(){
 const [rows,setRows]=useState<ParticipantResult[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 async function load(){setLoading(true);setError('');try{setRows(await api.leaderboard())}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки')}finally{setLoading(false)}}
 useEffect(()=>{load();const id=setInterval(load,30000);return()=>clearInterval(id)},[])
 return <div className="page"><PageTitle eyebrow="РЕЗУЛЬТАТЫ" title="Общий рейтинг" description="Итоговая таблица участников по результатам всех этапов."><button className="secondary-button" onClick={load}><RefreshCw size={16}/> Обновить</button></PageTitle>
 <div className="formula"><Trophy/><div><b>Формула рейтинга</b><span>Тест + ворота симулятора + ворота реальных полётов</span></div></div>
 {error&&<div className="alert error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>Место</th><th>Участник</th><th>Группа</th><th>Тест</th><th>Симулятор</th><th>Полёты</th><th>Итого</th></tr></thead><tbody>{loading?<tr><td colSpan={7}>Загрузка...</td></tr>:rows.length===0?<tr><td colSpan={7}>Пока нет участников. Организатор должен загрузить список.</td></tr>:rows.map((p,i)=><tr key={p.id}><td><span className={`rank rank-${i+1}`}>{i+1}</span></td><td className="name">{p.fullName}</td><td>{p.group||'—'}</td><td>{p.testScore??'—'}</td><td>{p.simulatorGates??'—'}</td><td>{p.flightGates??'—'}</td><td className="score">{p.totalScore}</td></tr>)}</tbody></table></div><p className="hint">При равенстве баллов выше участник с лучшим тестом, затем с большим результатом реальных полётов.</p></div>
}
