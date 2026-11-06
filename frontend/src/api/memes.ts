import type { Meme } from '../types/meme'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchMemes(signal?: AbortSignal): Promise<Meme[]> {
  const response = await fetch(`${apiBaseUrl}/api/memes`, { signal })

  if (!response.ok) {
    throw new Error(`Memes konnten nicht geladen werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Die Meme-Antwort hat ein unerwartetes Format.')
  }

  return data as Meme[]
}
