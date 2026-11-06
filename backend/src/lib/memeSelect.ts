import { Prisma } from "../generated/prisma/client.js";

export const memeSelect = {
  id: true,
  title: true,
  imageUrl: true,
  userId: true,
  createdAt: true,
  _count: {
    select: {
      likes: true,
    },
  },
} satisfies Prisma.MemeSelect;
