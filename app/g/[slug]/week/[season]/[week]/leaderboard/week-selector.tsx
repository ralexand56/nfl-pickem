"use client";

import { useRouter } from "next/navigation";
import { useGroup } from "@/components/GroupProvider";
import { getWeekLabel, getWeekStatus, type WeekStatus } from "@/lib/weeks";

type WeekOption = {
  week: number;
  season: number;
};

type WeekSelectorProps = {
  availableWeeks: WeekOption[];
  currentSeason: number;
  currentWeek: number;
  // The live NFL week from ESPN, used to tag options; currentSeason and
  // currentWeek above are the week being viewed.
  liveNfl: { season: number | null; week: number | null };
};

// Native <option>s can't hold a badge, so tag the live and future weeks in
// text. Past weeks stay untagged to keep the list short.
const statusSuffix = (status: WeekStatus | null) =>
  status === "current" ? " (this week)" : status === "upcoming" ? " (upcoming)" : "";

export default function WeekSelector({
  availableWeeks,
  currentSeason,
  currentWeek,
  liveNfl,
}: WeekSelectorProps) {
  const router = useRouter();
  const group = useGroup();

  return (
    <select
      title="Select week"
      value={`${currentSeason}-${currentWeek}`}
      onChange={(e) => {
        const [s, w] = e.target.value.split("-");
        router.push(`/g/${group.slug}/week/${s}/${w}/leaderboard`);
      }}
      className="px-3 py-2 rounded-control border border-border bg-surface text-text"
    >
      {availableWeeks.map((aw) => (
        <option key={`${aw.season}-${aw.week}`} value={`${aw.season}-${aw.week}`}>
          {getWeekLabel(aw.week)}
          {statusSuffix(getWeekStatus(aw.season, aw.week, liveNfl))}
        </option>
      ))}
    </select>
  );
}
