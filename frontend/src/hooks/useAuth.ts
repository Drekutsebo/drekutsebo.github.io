import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function useAuth() {
  const [isAuthenticated, setAuthenticated] = useState(() => Boolean(sessionStorage.getItem('volunteer_token')))
  const [showLogin, setShowLogin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onLogout = () => setAuthenticated(false)
    window.addEventListener('volunteer-logout', onLogout)
    return () => window.removeEventListener('volunteer-logout', onLogout)
  }, [])

  async function login(password: string) {
    setLoading(true); setError('')
    try {
      const result = await api.login(password)
      sessionStorage.setItem('volunteer_token', result.token)
      setAuthenticated(true); setShowLogin(false)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось войти')
      return false
    } finally { setLoading(false) }
  }
  function logout() {
    sessionStorage.removeItem('volunteer_token')
    setAuthenticated(false)
    window.dispatchEvent(new Event('volunteer-logout'))
  }
  return { isAuthenticated, showLogin, setShowLogin, error, loading, login, logout }
}
