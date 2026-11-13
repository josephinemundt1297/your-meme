import type { MemeFolder, MemeFolderDetail } from '../types/folder'
import type { Meme } from '../types/meme'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function isMeme(value: unknown): value is Meme {
  return typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'title' in value && typeof value.title === 'string' &&
    'imageUrl' in value && typeof value.imageUrl === 'string' &&
    'createdAt' in value && typeof value.createdAt === 'string' &&
    'author' in value && typeof value.author === 'object' && value.author !== null &&
    'likeCount' in value && typeof value.likeCount === 'number' &&
    'commentCount' in value && typeof value.commentCount === 'number'
}

function isFolder(value: unknown): value is MemeFolder {
  return typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'name' in value && typeof value.name === 'string' &&
    'createdAt' in value && typeof value.createdAt === 'string'
}

export async function createFolder(name: string, token: string): Promise<MemeFolder> {
  const response = await fetch(`${apiBaseUrl}/api/folders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  })

  if (!response.ok) {
    throw new Error(response.status === 400 ? 'Bitte gib einen Ordnernamen mit 1 bis 100 Zeichen an.' : response.status === 401 ? 'Bitte melde dich an, um einen Ordner anzulegen.' : `Ordner konnte nicht angelegt werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (
    typeof data !== 'object' || data === null ||
    !('id' in data) || typeof data.id !== 'string' ||
    !('name' in data) || typeof data.name !== 'string' ||
    !('createdAt' in data) || typeof data.createdAt !== 'string'
  ) {
    throw new Error('Die Antwort des Servers enthält keinen gültigen Ordner.')
  }

  return { id: data.id, name: data.name, createdAt: data.createdAt }
}

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

  return data.filter(isFolder)
}

export async function fetchFolderById(id: string, token: string, signal?: AbortSignal): Promise<MemeFolderDetail | null> {
  const response = await fetch(`${apiBaseUrl}/api/folders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Bitte melde dich an, um den Ordner zu sehen.' : response.status === 403 ? 'Du darfst diesen Ordner nicht ansehen.' : `Ordner konnte nicht geladen werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!isFolder(data) || !('memes' in data) || !Array.isArray(data.memes) || !data.memes.every(isMeme)) {
    throw new Error('Die Ordner-Antwort hat ein unerwartetes Format.')
  }

  return { ...data, memes: data.memes }
}
