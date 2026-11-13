import type { Env, Store } from '../types'

const EMPTY: Store = { version: 1, participants: [], attendance: {}, results: {}, testAttempts: {}, testSessions: {} }

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
}
function decodeBase64Utf8(value: string): string {
  const binary = atob(value.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function getFile(env: Env): Promise<{ store: Store; sha?: string }> {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${env.GH_DATA_PATH}?ref=${env.GH_BRANCH}`
  const response = await fetch(url, { headers: githubHeaders(env) })
  if (response.status === 404) throw new Error('Файл хранилища не найден. Создайте data.json в приватном репозитории.')
  if (!response.ok) throw new Error(`GitHub read failed: ${response.status} ${await response.text()}`)
  const file = await response.json() as { content: string; sha: string }
  return { store: JSON.parse(decodeBase64Utf8(file.content)) as Store, sha: file.sha }
}
function githubHeaders(env: Env): Record<string, string> {
  return { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'fpv-competition-worker' }
}

export async function readStore(env: Env): Promise<Store> {
  return (await getFile(env)).store
}

/**
 * Optimistic concurrency: fetch current blob SHA and PUT against that SHA.
 * On a race GitHub rejects the stale SHA; reload and re-run the mutator.
 */
export async function updateStore<T>(env: Env, mutator: (store: Store) => T): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { store, sha } = await getFile(env)
    const result = mutator(store)
    const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${env.GH_DATA_PATH}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: { ...githubHeaders(env), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update FPV competition data',
        branch: env.GH_BRANCH,
        sha,
        content: encodeBase64Utf8(JSON.stringify(store, null, 2))
      })
    })
    if (response.ok) return result
    const body = await response.text()
    if (response.status !== 409 && response.status !== 422) throw new Error(`GitHub write failed: ${response.status} ${body}`)
  }
  throw new Error('Хранилище занято параллельными изменениями. Повторите операцию.')
}
export function createEmptyStore(): Store { return structuredClone(EMPTY) }
