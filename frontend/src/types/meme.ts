export type MemeAuthor = {
  id: string
  username: string
}

export type Meme = {
  id: string
  title: string
  imageUrl: string
  createdAt: string
  author: MemeAuthor
  category: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
  emoji: string
}
