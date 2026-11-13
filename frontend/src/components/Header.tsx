import { LogIn, LogOut, Menu, RadioTower, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthContext } from './AuthProvider'

export default function Header({onMenuClick}: {onMenuClick: () => void}) {
  const {isAuthenticated, showLogin, setShowLogin, login, logout, error, loading} = useAuthContext()
  const [password, setPassword] = useState('')
  async function submit(e: React.FormEvent) { e.preventDefault(); const ok = await login(password); if (ok) setPassword('') }
  return <>
    <header className="header">
      <button className="mobile-menu icon-button" onClick={onMenuClick} aria-label="Меню"><Menu/></button>
      <div className="header-brand"><div className="brand-icon"><RadioTower size={21}/></div><div><strong>FPV ARENA</strong><span>Competition management</span></div></div>
      <div className="header-right"><span className="system-status"><i/> Система соревнований</span>
        {isAuthenticated ? <button className="volunteer-button" onClick={logout}><ShieldCheck size={17}/> Волонтёр <LogOut size={15}/></button> :
          <button className="volunteer-button" onClick={()=>setShowLogin(true)}><LogIn size={17}/> Вход волонтёра</button>}
      </div>
    </header>
    {showLogin && <div className="modal-backdrop" onMouseDown={()=>setShowLogin(false)}><form className="login-modal" onSubmit={submit} onMouseDown={e=>e.stopPropagation()}>
      <button type="button" className="modal-close icon-button" onClick={()=>setShowLogin(false)}><X/></button>
      <div className="modal-symbol"><ShieldCheck size={27}/></div><h2>Вход волонтёра</h2><p>Введите общий пароль, установленный организатором.</p>
      <input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" required/>
      {error && <div className="error-text">{error}</div>}
      <button className="primary-button full" disabled={loading}>{loading?'Проверка...':'Войти в систему'}</button>
    </form></div>}
  </>
}
