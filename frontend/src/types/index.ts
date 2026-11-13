export interface Participant { id: string; fullName: string; group: string }
export interface ParticipantResult extends Participant {
  attendance: boolean; testScore: number | null; simulatorGates: number | null; flightGates: number | null; totalScore: number
}
export interface TestQuestion { id: string; question: string; options: string[] }
export interface TestSession { sessionId: string; participantId: string; startedAt: string; expiresAt: string }
