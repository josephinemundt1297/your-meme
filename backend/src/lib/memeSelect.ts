import { Prisma } from "../generated/prisma/client.js";

export const memeSelect = {
  id: true,
  title: true,
  imageUrl: true,
  userId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      username: true,
    },
  },
  _count: {
    select: {
      likes: true,
      comments: true,
    },
  },
} satisfies Prisma.MemeSelect;
