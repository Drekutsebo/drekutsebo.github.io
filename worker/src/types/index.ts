export interface Env {
  GH_TOKEN: string
  GH_OWNER: string
  GH_REPO: string
  GH_BRANCH: string
  GH_DATA_PATH: string
  VOLUNTEER_PASSWORD: string
  JWT_SECRET: string
  ALLOWED_ORIGIN: string
}
export interface Participant { id: string; fullName: string; group: string }
export interface StoredResult { testScore: number | null; simulatorGates: number | null; flightGates: number | null }
export interface TestQuestion { id: string; question: string; options: string[]; correct: number }
export interface TestAttempt { status: 'started' | 'submitted' | 'expired'; sessionId: string; startedAt: string; expiresAt: string; score?: number }
export interface Store {
  version: number
  participants: Participant[]
  attendance: Record<string, boolean>
  results: Record<string, StoredResult>
  testAttempts: Record<string, TestAttempt>
  testSessions: Record<string, { participantId: string; expiresAt: string; used: boolean }>
}
