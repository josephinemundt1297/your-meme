import type { MemeFolder } from '../types/folder'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchFolders(token: string, signal?: AbortSignal): Promise<MemeFolder[]> {
  const response = await fetch(`${apiBaseUrl}/api/folders`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Bitte melde dich an, um deine Ordner zu sehen.' : `Ordner konnten nicht geladen werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Die Ordner-Antwort hat ein unerwartetes Format.')
  }

  return data.filter((item): item is MemeFolder => (
    typeof item === 'object' && item !== null &&
    'id' in item && typeof item.id === 'string' &&
    'name' in item && typeof item.name === 'string' &&
    'createdAt' in item && typeof item.createdAt === 'string'
  ))
}
