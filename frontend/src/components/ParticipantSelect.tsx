import {useEffect,useState} from 'react'
import {api} from '../services/api'
import type {Participant} from '../types'
export default function ParticipantSelect({value,onChange}:{value:string;onChange:(v:string)=>void}) {
 const [items,setItems]=useState<Participant[]>([]); const [error,setError]=useState('')
 useEffect(()=>{api.participants().then(setItems).catch(e=>setError(e.message))},[])
 return <>{error&&<p className="error-text">{error}</p>}<select className="form-control" value={value} onChange={e=>onChange(e.target.value)}><option value="">Выберите участника</option>{items.map(p=><option key={p.id} value={p.id}>{p.fullName} — {p.group}</option>)}</select></>
}
