import type { Meme, MemeComment } from '../types/meme'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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

  return data.map((item: CommentApiResponse): MemeComment => ({
    id: item.id,
    content: item.content,
    userId: item.userId,
    createdAt: item.createdAt,
    author: { id: item.userId, username: item.user?.username ?? 'Community' },
  }))
}
