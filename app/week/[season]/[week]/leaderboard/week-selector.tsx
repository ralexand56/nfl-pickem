"use client";

import { useRouter } from "next/navigation";

type WeekOption = {
  week: number;
  season: number;
};

type WeekSelectorProps = {
  availableWeeks: WeekOption[];
  currentSeason: number;
  currentWeek: number;
};

const WEEK_LABELS: Record<number, string> = {
  19: "Wild Card",
  20: "Divisional",
  21: "Conference",
  22: "Super Bowl",
};

const getWeekLabel = (wk: number) => {
  return WEEK_LABELS[wk] || `Week ${wk}`;
};

export default function WeekSelector({
  availableWeeks,
  currentSeason,
  currentWeek,
}: WeekSelectorProps) {
  const router = useRouter();

  return (
    <select
      title="Select week"
      value={`${currentSeason}-${currentWeek}`}
      onChange={(e) => {
        const [s, w] = e.target.value.split("-");
        router.push(`/week/${s}/${w}/leaderboard`);
      }}
      className="px-3 py-2 rounded-lg border bg-white"
    >
      {availableWeeks.map((aw) => (
        <option key={`${aw.season}-${aw.week}`} value={`${aw.season}-${aw.week}`}>
          {getWeekLabel(aw.week)}
        </option>
      ))}
    </select>
  );
}
