import type { Participant, ParticipantResult, TestQuestion, TestSession } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('volunteer_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Ошибка API ${response.status}`)
  return data as T
}
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const api = {
  health: () => request<{ok: boolean}>('/api/health'),
  login: (password: string) => request<{token: string}>('/api/volunteer/login', post({password})),
  participants: () => request<Participant[]>('/api/participants'),
  importParticipants: (csv: string) => request<{imported: number}>('/api/participants/import', post({csv})),
  leaderboard: () => request<ParticipantResult[]>('/api/leaderboard'),
  attendance: (participantId: string) => request<{success: boolean}>('/api/attendance', post({participantId})),
  simulator: (participantId: string, gates: number) => request<{success: boolean}>('/api/results/simulator', post({participantId, gates})),
  flights: (participantId: string, gates: number) => request<{success: boolean}>('/api/results/flights', post({participantId, gates})),
  questions: () => request<TestQuestion[]>('/api/test/questions'),
  startTest: (participantId: string) => request<TestSession>('/api/test/start', post({participantId})),
  submitTest: (sessionId: string, answers: {questionId: string; answerIndex: number}[]) =>
    request<{score: number; maxScore: number}>('/api/test/submit', post({sessionId, answers}))
}
