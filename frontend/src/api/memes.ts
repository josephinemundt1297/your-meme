import type { Meme, MemeComment } from '../types/meme'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function createMemeFormData(title: string, image: File): FormData {
  const formData = new FormData()
  formData.append('title', title.trim())
  formData.append('image', image)
  return formData
}

export function validateMemeImage(file: File): string | null {
  const maxFileSize = 5 * 1024 * 1024
  if (file.type !== 'image/png') return 'Bitte wähle genau eine PNG-Datei aus.'
  if (file.size > maxFileSize) return 'Die PNG-Datei darf höchstens 5 MiB groß sein.'
  return null
}

export async function uploadMeme(formData: FormData, token: string): Promise<{ id: string }> {
  const response = await fetch(`${apiBaseUrl}/api/memes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Bitte melde dich an, um ein Meme hochzuladen.' : `Das Meme konnte nicht hochgeladen werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' || !('id' in data) || typeof data.id !== 'string') {
    throw new Error('Die Antwort des Servers enthält keine Meme-ID.')
  }

  return { id: data.id }
}

export async function syncCurrentUser(token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/me/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Benutzer konnte nicht synchronisiert werden (${response.status}).`)
  }
}

type MemeApiResponse = {
  id: string
  title: string
  imageUrl: string
  userId: string
  createdAt: string
  likeCount: number
  category?: string
  commentCount?: number
  likedByMe?: boolean
}

type CommentApiResponse = {
  id: string
  content: string
  userId: string
  createdAt: string
  user?: { username?: string }
}

function normalizeComment(item: CommentApiResponse): MemeComment {
  return {
    id: item.id,
    content: item.content,
    userId: item.userId,
    createdAt: item.createdAt,
    author: { id: item.userId, username: item.user?.username ?? 'Community' },
  }
}

export async function createMemeComment(id: string, content: string, token: string): Promise<MemeComment> {
  const response = await fetch(`${apiBaseUrl}/api/memes/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content.trim() }),
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Bitte melde dich an, um zu kommentieren.' : `Der Kommentar konnte nicht gespeichert werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' || !('id' in data) || !('content' in data) || !('userId' in data) || !('createdAt' in data)) {
    throw new Error('Die Antwort des Servers enthält keinen gültigen Kommentar.')
  }

  return normalizeComment(data as CommentApiResponse)
}

export async function setMemeLike(id: string, liked: boolean, token: string): Promise<{ liked: boolean; likeCount: number }> {
  const response = await fetch(`${apiBaseUrl}/api/memes/${encodeURIComponent(id)}/like`, {
    method: liked ? 'POST' : 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Bitte melde dich an, um Memes zu liken.' : `Der Like konnte nicht gespeichert werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' || !('liked' in data) || typeof data.liked !== 'boolean' || !('likeCount' in data) || typeof data.likeCount !== 'number') {
    throw new Error('Die Like-Antwort hat ein unerwartetes Format.')
  }

  return { liked: data.liked, likeCount: data.likeCount }
}

function normalizeMeme(item: MemeApiResponse): Meme {
  return {
    id: item.id,
    title: item.title,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt,
    author: { id: item.userId, username: 'Community' },
    category: item.category ?? 'Community',
    likeCount: item.likeCount,
    commentCount: item.commentCount ?? 0,
    likedByMe: item.likedByMe ?? false,
    emoji: '😂',
  }
}

export async function fetchMemes(signal?: AbortSignal): Promise<Meme[]> {
  const response = await fetch(`${apiBaseUrl}/api/memes`, { signal })

  if (!response.ok) {
    throw new Error(`Memes konnten nicht geladen werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Die Meme-Antwort hat ein unerwartetes Format.')
  }

  return data.map((item: MemeApiResponse) => normalizeMeme(item))
}

export async function fetchMemeById(id: string, signal?: AbortSignal): Promise<Meme | null> {
  const response = await fetch(`${apiBaseUrl}/api/memes/${encodeURIComponent(id)}`, { signal })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Meme konnte nicht geladen werden (${response.status}).`)
  }

  const data: MemeApiResponse = await response.json()
  return normalizeMeme(data)
}

export async function fetchMemeComments(id: string, signal?: AbortSignal): Promise<MemeComment[]> {
  const response = await fetch(`${apiBaseUrl}/api/memes/${encodeURIComponent(id)}/comments`, { signal })

  if (!response.ok) {
    throw new Error(`Kommentare konnten nicht geladen werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Die Kommentar-Antwort hat ein unerwartetes Format.')
  }

  return data.map((item: CommentApiResponse) => normalizeComment(item))
}
