import type { Env } from '../types'

const encoder = new TextEncoder()
function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  return Uint8Array.from(atob(normalized), c => c.charCodeAt(0))
}
async function key(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
export async function createToken(env: Env): Promise<string> {
  const header = toBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payload = toBase64Url(encoder.encode(JSON.stringify({ role: 'volunteer', exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 })))
  const data = `${header}.${payload}`
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await key(env.JWT_SECRET), encoder.encode(data)))
  return `${data}.${toBase64Url(signature)}`
}
export async function verifyToken(env: Env, token: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const data = `${parts[0]}.${parts[1]}`
    const valid = await crypto.subtle.verify('HMAC', await key(env.JWT_SECRET), fromBase64Url(parts[2]), encoder.encode(data))
    if (!valid) return false
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1]))) as { role: string; exp: number }
    return payload.role === 'volunteer' && payload.exp > Math.floor(Date.now() / 1000)
  } catch { return false }
}
