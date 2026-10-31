import { eq } from "drizzle-orm";
import { groupMembers, users } from "@/db/schema";
import { db } from "@/db";

// Display info for every member of a group, keyed by user id.
export async function getUserMap(groupId: string) {
  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      email: users.email,
    })
    .from(users)
    .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));
  return Object.fromEntries(
    userList.map((u) => [u.id, { name: u.name || "", image: u.image, email: u.email }])
  );
}
