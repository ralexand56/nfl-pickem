import { SelectGame } from "@/db/schema";

const base = process.env.THESPORTSDB_API_BASE!; // e.g. https://www.thesportsdb.com/api/v1/json
const key = process.env.THESPORTSDB_API_KEY!; // free test key "123" ok for dev

export async function fetchSeasonEvents(season: number) {
  // NFL league id on TheSportsDB is 4391
  const url = `${base}/${key}/eventsseason.php?id=4391&s=${season}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error("SportsDB error");
  const json = await res.json();
  return json.events ?? [];
}

type SportsDbEvent = {
  intRound: string | number;
  [key: string]: Record<string, unknown> | string | number | null | undefined;
};

export async function fetchWeekEvents(season: number, week: number) {
  const all = await fetchSeasonEvents(season);
  return all.filter((e: SportsDbEvent) => Number(e.intRound) === week);
}

export function normalizeGame(e: SportsDbEvent): SelectGame {
  const dateIso = `${e.dateEvent}T${e.strTime || "00:00:00"}Z`;
  const d = new Date(dateIso);
  return {
    id: e.idEvent as string || "", // sometimes it's idGame
    season: Number(e.strSeason) || Number(e.intSeason) || d.getUTCFullYear(),
    week: Number(e.intRound),
    date: d,
    homeTeam: typeof e.strHomeTeam === "string" ? e.strHomeTeam : "",
    awayTeam: typeof e.strAwayTeam === "string" ? e.strAwayTeam : "",
    status:
      e.intHomeScore != null && e.intAwayScore != null ? "final" : "scheduled",
    homeScore: e.intHomeScore != null ? Number(e.intHomeScore) : null,
    awayScore: e.intAwayScore != null ? Number(e.intAwayScore) : null,
    isMondayNight: d.getUTCDay() === 1, // Monday
  };
}
