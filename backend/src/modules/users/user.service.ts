import type { AppDependencies } from "../../types/dependencies.js";

export function createUserService(
  dependencies: Pick<AppDependencies, "database" | "getClerkUser">,
) {
  const prisma = dependencies.database;
  const getClerkUser = dependencies.getClerkUser;

  async function syncCurrentUser(clerkUserId: string) {
    const clerkUser = await getClerkUser(clerkUserId);

    const username = clerkUser.username ?? clerkUser.firstName ?? "MemeFan";

    const user = await prisma.user.upsert({
      where: {
        clerkId: clerkUserId,
      },
      update: {
        username,
      },
      create: {
        clerkId: clerkUserId,
        username,
      },
      select: {
        id: true,
        clerkId: true,
        username: true,
        role: true,
      },
    });

    return user;
  }

  return { syncCurrentUser };
}
