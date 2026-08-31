import "server-only";
import { DateTime } from "luxon";
import type { SelectGame } from "@/db/schema";

const BASE =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export type EspnSeasonType = 1 | 2 | 3; // 1=preseason 2=regular 3=postseason

// App week numbers: 1-18 regular season, 19=Wild Card, 20=Divisional,
// 21=Conference Championships, 22=Super Bowl. ESPN's own postseason week
// numbers restart at 1 and skip a week (4 = Pro Bowl, no games), so this
// isn't a simple offset - verified live against the scoreboard API.
const POSTSEASON_WEEK_MAP: Record<number, number> = {
  19: 1, // Wild Card
  20: 2, // Divisional
  21: 3, // Conference Championships
  22: 5, // Super Bowl (ESPN week 4 is the Pro Bowl)
};

function toEspnWeek(appWeek: number): {
  seasonType: EspnSeasonType;
  week: number;
} {
  if (appWeek >= 19) {
    return { seasonType: 3, week: POSTSEASON_WEEK_MAP[appWeek] ?? appWeek - 18 };
  }
  return { seasonType: 2, week: appWeek };
}

const POSTSEASON_WEEK_REVERSE: Record<number, number> = Object.fromEntries(
  Object.entries(POSTSEASON_WEEK_MAP).map(([appWeek, espnWeek]) => [
    espnWeek,
    Number(appWeek),
  ])
);

// Translates ESPN's own "current week" (season.type + week.number) into this
// app's week numbering. Returns null for preseason, which has no app week.
export function toAppWeek(
  seasonType: number,
  espnWeek: number
): number | null {
  if (seasonType === 2) return espnWeek; // regular season maps directly, 1-18
  if (seasonType === 3) return POSTSEASON_WEEK_REVERSE[espnWeek] ?? null;
  return null; // preseason
}

export type EspnEvent = {
  id: string;
  date: string;
  season?: { year: number; type: number };
  week?: { number: number };
  competitions: Array<{
    competitors: Array<{
      homeAway: "home" | "away";
      score: string;
      team: { displayName: string };
    }>;
  }>;
  status: {
    type: {
      name: string;
      completed: boolean;
    };
  };
};

type EspnScoreboardResponse = {
  events: EspnEvent[];
};

export async function fetchWeekEvents(
  season: number,
  week: number,
  opts?: { noStore?: boolean }
): Promise<EspnEvent[]> {
  const { seasonType, week: espnWeek } = toEspnWeek(week);
  const url = `${BASE}?dates=${season}&seasontype=${seasonType}&week=${espnWeek}`;
  const init: RequestInit & {
    next?: { revalidate?: number };
    cache?: RequestCache;
  } = {};
  if (opts?.noStore) {
    init.cache = "no-store";
  } else {
    init.next = { revalidate: 600 };
  }

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`ESPN scoreboard error ${res.status}`);
  const json: EspnScoreboardResponse = await res.json();
  return json.events ?? [];
}

const STATUS_MAP: Record<
  string,
  "scheduled" | "in_progress" | "final" | "postponed"
> = {
  STATUS_SCHEDULED: "scheduled",
  STATUS_IN_PROGRESS: "in_progress",
  STATUS_HALFTIME: "in_progress",
  STATUS_END_PERIOD: "in_progress",
  STATUS_DELAYED: "in_progress",
  STATUS_FINAL: "final",
  STATUS_FINAL_OVERTIME: "final",
  STATUS_POSTPONED: "postponed",
  STATUS_CANCELED: "postponed",
};

export function mapEspnStatus(
  event: EspnEvent
): "scheduled" | "in_progress" | "final" | "postponed" {
  const name = event.status?.type?.name;
  if (name && STATUS_MAP[name]) return STATUS_MAP[name];
  return event.status?.type?.completed ? "final" : "scheduled";
}

export function normalizeEspnEvent(event: EspnEvent, appWeek: number): SelectGame {
  const competitors = event.competitions?.[0]?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  const dtEastern = DateTime.fromISO(event.date, { zone: "utc" }).setZone(
    "America/New_York"
  );

  return {
    id: event.id,
    season: event.season?.year ?? new Date(event.date).getUTCFullYear(),
    week: appWeek,
    date: new Date(event.date),
    homeTeam: home?.team?.displayName ?? "",
    awayTeam: away?.team?.displayName ?? "",
    status: mapEspnStatus(event),
    homeScore: home?.score != null ? Number(home.score) : null,
    awayScore: away?.score != null ? Number(away.score) : null,
    isMondayNight: dtEastern.weekday === 1, // 1 = Monday in luxon
    isTiebreaker: false, // set by sync logic
  };
}
