"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { GroupSettings } from "@/lib/group-settings";

// The group the current /g/[slug] page belongs to. The server already checked
// membership; client code uses this only to build links and tell API routes
// which group a request is for (they re-check membership themselves).
export type ClientGroup = {
  slug: string;
  name: string;
  isAdmin: boolean;
  settings: GroupSettings;
};

const GroupContext = createContext<ClientGroup | null>(null);

export function GroupProvider({
  group,
  children,
}: {
  group: ClientGroup;
  children: ReactNode;
}) {
  return <GroupContext.Provider value={group}>{children}</GroupContext.Provider>;
}

export function useGroup(): ClientGroup {
  const group = useContext(GroupContext);
  if (!group) throw new Error("useGroup must be used inside a /g/[slug] page");
  return group;
}

// For components (like the Nav) that also render outside a group.
export function useOptionalGroup(): ClientGroup | null {
  return useContext(GroupContext);
}
