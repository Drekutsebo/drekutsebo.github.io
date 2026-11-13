import {useState} from 'react'
import {Plane,Save} from 'lucide-react'
import PageTitle from '../components/PageTitle'
import ParticipantSelect from '../components/ParticipantSelect'
import {api} from '../services/api'
export default function FlightsPage(){const [id,setId]=useState(''),[gates,setGates]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState('')
 async function save(e:React.FormEvent){e.preventDefault();const n=Number(gates);if(!id||gates===''||!Number.isInteger(n)||n<0){setMsg('Выберите участника и укажите целое неотрицательное число ворот.');return}setBusy(true);setMsg('');try{await api.flights(id,n);setMsg('Результат успешно сохранён.');setId('');setGates('')}catch(x){setMsg(x instanceof Error?x.message:'Ошибка сохранения')}finally{setBusy(false)}}
 return <div className="page"><PageTitle eyebrow="ПАНЕЛЬ ВОЛОНТЁРА" title="Результаты реальных полётов" description="Внесение количества пройденных ворот на реальной трассе."><Plane className="page-icon"/></PageTitle><form className="form-card" onSubmit={save}><h2>Добавить результат</h2><label>Участник</label><ParticipantSelect value={id} onChange={setId}/><label>Количество пройденных ворот</label><input className="form-control" type="number" min="0" step="1" value={gates} onChange={e=>setGates(e.target.value)} placeholder="Например, 12"/>{msg&&<div className="alert">{msg}</div>}<button className="primary-button" disabled={busy}><Save size={17}/>{busy?'Сохранение...':'Сохранить результат'}</button></form></div>}
