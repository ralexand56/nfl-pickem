import { users } from "@/db/schema";
import { db } from "@/db";

export async function getUserMap() {
  const userList = await db.select().from(users);
  return Object.fromEntries(
    userList.map((u) => [u.id, { name: u.name || "", image: u.image, email: u.email }])
  );
}
