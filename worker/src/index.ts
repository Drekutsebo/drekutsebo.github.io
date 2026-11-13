import type { Env, Participant, Store } from './types'
import { readStore, updateStore } from './storage/github'
import { createToken, verifyToken } from './services/auth'
import { QUESTIONS } from './services/questions'

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
const fail = (message: string, status = 400) => json({ error: message }, status)
const nowIso = () => new Date().toISOString()
const publicQuestions = () => QUESTIONS.map(({ id, question, options }) => ({ id, question, options }))

function cors(request: Request, env: Env): Headers {
  const origin = request.headers.get('Origin') || ''
  const allowed = env.ALLOWED_ORIGIN === '*' || origin === env.ALLOWED_ORIGIN ? origin : env.ALLOWED_ORIGIN
  return new Headers({
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  })
}
async function body<T>(request: Request): Promise<T> {
  return await request.json() as T
}
function participantExists(store: Store, id: string): boolean {
  return store.participants.some(p => p.id === id)
}
function scoreOf(store: Store, id: string) {
  const r = store.results[id]
  const test = r?.testScore ?? 0
  const sim = r?.simulatorGates ?? 0
  const flight = r?.flightGates ?? 0
  return { testScore: r?.testScore ?? null, simulatorGates: r?.simulatorGates ?? null, flightGates: r?.flightGates ?? null, totalScore: test + sim + flight }
}
function leaderboard(store: Store) {
  return store.participants.map(p => ({
    ...p, attendance: store.attendance[p.id] === true, ...scoreOf(store, p.id)
  })).sort((a, b) =>
    b.totalScore - a.totalScore ||
    (b.testScore ?? 0) - (a.testScore ?? 0) ||
    (b.flightGates ?? 0) - (a.flightGates ?? 0) ||
    a.fullName.localeCompare(b.fullName, 'ru')
  )
}
function normalizeName(s: string) { return s.trim().replace(/\s+/g, ' ') }
function parseCsv(text: string): Array<{ fullName: string; group: string }> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(x => x.trim()).filter(Boolean)
  if (!lines.length) return []
  const delimiter = lines[0].includes(';') ? ';' : ','
  const rows = lines.map(line => line.split(delimiter).map(x => x.trim().replace(/^"|"$/g, '')))
  const first = rows[0].join(' ').toLowerCase()
  const start = first.includes('фио') || first.includes('имя') || first.includes('name') ? 1 : 0
  return rows.slice(start).map(row => ({ fullName: normalizeName(row[0] || ''), group: normalizeName(row[1] || '') })).filter(p => p.fullName)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = cors(request, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    const url = new URL(request.url)
    const path = url.pathname
    const respond = (data: unknown, status = 200) => {
      const response = json(data, status)
      headers.forEach((v, k) => response.headers.set(k, v))
      return response
    }
    const error = (message: string, status = 400) => respond({ error: message }, status)
    try {
      if (path === '/api/health' && request.method === 'GET') return respond({ ok: true, service: 'fpv-competition-api' })

      if (path === '/api/volunteer/login' && request.method === 'POST') {
        const input = await body<{ password?: string }>(request)
        if (!input.password || input.password !== env.VOLUNTEER_PASSWORD) return error('Неверный пароль', 401)
        return respond({ token: await createToken(env), expiresIn: 28800 })
      }

      const auth = request.headers.get('Authorization') || ''
      const isVolunteer = auth.startsWith('Bearer ') && await verifyToken(env, auth.slice(7))
      const requireVolunteer = () => isVolunteer ? null : error('Требуется авторизация волонтёра', 401)

      if (path === '/api/participants' && request.method === 'GET') {
        const store = await readStore(env)
        return respond(store.participants)
      }
      if (path === '/api/participants/import' && request.method === 'POST') {
        const denied = requireVolunteer(); if (denied) return denied
        const input = await body<{ csv?: string }>(request)
        if (typeof input.csv !== 'string') return error('Ожидается поле csv')
        const rows = parseCsv(input.csv)
        if (!rows.length) return error('В файле не найдено участников')
        if (rows.length > 2000) return error('Максимум 2000 участников', 413)
        const unique = new Map<string, Participant>()
        for (const p of rows) {
          const key = `${p.fullName.toLocaleLowerCase('ru')}|${p.group.toLocaleLowerCase('ru')}`
          if (!unique.has(key)) unique.set(key, { id: crypto.randomUUID(), ...p })
        }
        const participants = [...unique.values()]
        await updateStore(env, store => {
          store.participants = participants
          const valid = new Set(participants.map(p => p.id))
          for (const key of Object.keys(store.attendance)) if (!valid.has(key)) delete store.attendance[key]
          for (const key of Object.keys(store.results)) if (!valid.has(key)) delete store.results[key]
          for (const key of Object.keys(store.testAttempts)) if (!valid.has(key)) delete store.testAttempts[key]
        })
        return respond({ imported: participants.length })
      }

      if (path === '/api/leaderboard' && request.method === 'GET') {
        return respond(leaderboard(await readStore(env)))
      }
      if (path === '/api/attendance' && request.method === 'POST') {
        const denied = requireVolunteer(); if (denied) return denied
        const input = await body<{ participantId?: string }>(request)
        if (!input.participantId) return error('Не указан участник')
        const result = await updateStore(env, store => {
          if (!participantExists(store, input.participantId!)) return false
          store.attendance[input.participantId!] = true
          return true
        })
        return result ? respond({ success: true }) : error('Участник не найден', 404)
      }
      if (path === '/api/results/simulator' && request.method === 'POST') {
        const denied = requireVolunteer(); if (denied) return denied
        const input = await body<{ participantId?: string; gates?: number }>(request)
        if (!input.participantId || !Number.isInteger(input.gates) || input.gates! < 0 || input.gates! > 10000) return error('Некорректные данные результата')
        const result = await updateStore(env, store => {
          if (!participantExists(store, input.participantId!)) return false
          store.results[input.participantId!] ??= { testScore: null, simulatorGates: null, flightGates: null }
          store.results[input.participantId!].simulatorGates = input.gates!
          return true
        })
        return result ? respond({ success: true }) : error('Участник не найден', 404)
      }
      if (path === '/api/results/flights' && request.method === 'POST') {
        const denied = requireVolunteer(); if (denied) return denied
        const input = await body<{ participantId?: string; gates?: number }>(request)
        if (!input.participantId || !Number.isInteger(input.gates) || input.gates! < 0 || input.gates! > 10000) return error('Некорректные данные результата')
        const result = await updateStore(env, store => {
          if (!participantExists(store, input.participantId!)) return false
          store.results[input.participantId!] ??= { testScore: null, simulatorGates: null, flightGates: null }
          store.results[input.participantId!].flightGates = input.gates!
          return true
        })
        return result ? respond({ success: true }) : error('Участник не найден', 404)
      }

      if (path === '/api/test/questions' && request.method === 'GET') return respond(publicQuestions())
      if (path === '/api/test/start' && request.method === 'POST') {
        const input = await body<{ participantId?: string }>(request)
        if (!input.participantId) return error('Выберите участника')
        const session = await updateStore(env, store => {
          if (!participantExists(store, input.participantId!)) return { error: 'Участник не найден' }
          if (store.testAttempts[input.participantId!]) return { error: 'Участник уже использовал попытку' }
          const startedAt = new Date()
          const expiresAt = new Date(startedAt.getTime() + 5 * 60 * 1000)
          const sessionId = crypto.randomUUID()
          store.testAttempts[input.participantId!] = { status: 'started', sessionId, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString() }
          store.testSessions[sessionId] = { participantId: input.participantId!, expiresAt: expiresAt.toISOString(), used: false }
          return { sessionId, participantId: input.participantId!, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString() }
        })
        if ('error' in session) return error(session.error, 409)
        return respond(session)
      }
      if (path === '/api/test/submit' && request.method === 'POST') {
        const input = await body<{ sessionId?: string; answers?: Array<{ questionId: string; answerIndex: number }> }>(request)
        if (!input.sessionId || !Array.isArray(input.answers)) return error('Некорректная отправка ответов')
        const outcome = await updateStore(env, store => {
          const session = store.testSessions[input.sessionId!]
          if (!session || session.used) return { error: 'Сессия не найдена или уже завершена', status: 409 }
          const attempt = store.testAttempts[session.participantId]
          if (!attempt || attempt.sessionId !== input.sessionId || attempt.status !== 'started') return { error: 'Попытка недействительна', status: 409 }
          session.used = true
          const expired = Date.now() > new Date(session.expiresAt).getTime() + 15000
          if (expired) {
            attempt.status = 'expired'
            return { error: 'Время тестирования истекло', status: 410 }
          }
          const answerMap = new Map(input.answers!.map(a => [a.questionId, a.answerIndex]))
          const score = QUESTIONS.reduce((sum, q) => sum + (answerMap.get(q.id) === q.correct ? 1 : 0), 0)
          attempt.status = 'submitted'
          attempt.score = score
          store.results[session.participantId] ??= { testScore: null, simulatorGates: null, flightGates: null }
          store.results[session.participantId].testScore = score
          return { score, maxScore: QUESTIONS.length }
        })
        if ('error' in outcome) return error(outcome.error, outcome.status)
        return respond(outcome)
      }

      return error('Маршрут не найден', 404)
    } catch (e) {
      return error(e instanceof Error ? e.message : 'Внутренняя ошибка сервера', 500)
    }
  }
}
