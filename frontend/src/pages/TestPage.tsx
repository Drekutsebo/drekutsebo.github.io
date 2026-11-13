import {useEffect,useRef,useState} from 'react'
import {CheckCircle,ClipboardCheck,Clock,Send} from 'lucide-react'
import PageTitle from '../components/PageTitle'
import ParticipantSelect from '../components/ParticipantSelect'
import {api} from '../services/api'
import type {TestQuestion,TestSession} from '../types'
export default function TestPage(){
 const [participantId,setParticipantId]=useState(''),[questions,setQuestions]=useState<TestQuestion[]>([]),[answers,setAnswers]=useState<Record<string,number>>({}),[session,setSession]=useState<TestSession|null>(null),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false)
 const submitted=useRef(false)
 useEffect(()=>{if(!session||done)return;const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer)},[session,done])
 const remaining=session?Math.max(0,Math.ceil((new Date(session.expiresAt).getTime()-now)/1000)):300
 const mm=String(Math.floor(remaining/60)).padStart(2,'0'),ss=String(remaining%60).padStart(2,'0')
 async function start(){setMessage('');if(!participantId){setMessage('Выберите участника.');return}setBusy(true);try{const [qs,s]=await Promise.all([api.questions(),api.startTest(participantId)]);setQuestions(qs);setSession(s);setAnswers({});submitted.current=false;setDone(false)}catch(e){setMessage(e instanceof Error?e.message:'Не удалось начать тест')}finally{setBusy(false)}}
 async function submit(){if(!session||submitted.current)return;submitted.current=true;setBusy(true);try{const result=await api.submitTest(session.sessionId,Object.entries(answers).map(([questionId,answerIndex])=>({questionId,answerIndex})));setMessage(`Тест завершён. Результат: ${result.score} из ${result.maxScore}.`);setDone(true)}catch(e){setMessage(e instanceof Error?e.message:'Ошибка отправки');setDone(true)}finally{setBusy(false)}}
 useEffect(()=>{if(session&&remaining===0&&!done&&!busy)void submit()},[remaining,session,done,busy])
 if(done)return <div className="page"><PageTitle eyebrow="ТЕОРЕТИЧЕСКИЙ ЭТАП" title="Тест завершён" description="Результат передан серверу."/><div className="result-panel"><CheckCircle size={36}/><h2>{message}</h2><p>Повторная попытка для этого участника недоступна.</p></div></div>
 return <div className="page"><PageTitle eyebrow="ТЕОРЕТИЧЕСКИЙ ЭТАП" title="Тестирование" description="10 вопросов по основам FPV. Время выполнения — 5 минут."><ClipboardCheck className="page-icon"/></PageTitle>
 {!session?<div className="form-card"><h2>Начало тестирования</h2><p className="muted">Выберите себя в списке. После начала теста отсчёт времени запускается на сервере. Предусмотрена одна попытка.</p><label>Участник</label><ParticipantSelect value={participantId} onChange={setParticipantId}/>{message&&<div className="alert error">{message}</div>}<button className="primary-button" disabled={busy} onClick={start}>{busy?'Подготовка...':'Начать тестирование'}</button></div>:
 <><div className={`timer-card ${remaining<60?'warning':''}`}><Clock/><span>Оставшееся время</span><strong>{mm}:{ss}</strong></div>{questions.map((q,i)=><section className="question-card" key={q.id}><span className="eyebrow">ВОПРОС {i+1} ИЗ {questions.length}</span><h3>{q.question}</h3>{q.options.map((option,j)=><label className="answer-option" key={j}><input type="radio" name={q.id} checked={answers[q.id]===j} onChange={()=>setAnswers(a=>({...a,[q.id]:j}))}/>{option}</label>)}</section>)}<button className="primary-button" disabled={busy} onClick={()=>void submit()}><Send size={17}/>{busy?'Отправка...':'Завершить тест'}</button></>}
 </div>
}
