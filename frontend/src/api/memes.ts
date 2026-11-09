import type { Meme } from '../types/meme'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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

export async function fetchMemes(signal?: AbortSignal): Promise<Meme[]> {
  const response = await fetch(`${apiBaseUrl}/api/memes`, { signal })

  if (!response.ok) {
    throw new Error(`Memes konnten nicht geladen werden (${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Die Meme-Antwort hat ein unerwartetes Format.')
  }

  return data.map((item: MemeApiResponse): Meme => ({
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
  }))
}
