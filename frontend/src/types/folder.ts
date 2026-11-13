import type { Meme } from './meme'

export type MemeFolder = {
  id: string
  name: string
  createdAt: string
}

export type MemeFolderDetail = MemeFolder & {
  memes: Meme[]
}
