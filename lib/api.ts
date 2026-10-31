import { NextResponse } from "next/server";
import { GroupAccessError } from "@/lib/group";

// Turns a GroupAccessError from requireGroupMember/requireGroupAdmin into the
// matching JSON response; anything else is rethrown.
export function groupErrorResponse(error: unknown) {
  if (error instanceof GroupAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
