import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { getWeekGames, kickoffLabel } from "@/lib/pick-sheets";
import { getWeekLabel } from "@/lib/weeks";

// Schedules change rarely (flexed games); refresh hourly.
export const revalidate = 3600;

type Params = { season: string; week: string };

function parse({ season, week }: Params) {
  const s = Number(season);
  const w = Number(week);
  return Number.isInteger(s) && Number.isInteger(w) && w >= 1 && w <= 22 ? { s, w } : null;
}

const sheetName = (s: number, w: number) =>
  w > 18 ? `NFL ${getWeekLabel(w)} Pick Sheet ${s}` : `NFL Week ${w} Pick Sheet ${s}`;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = parse(await params);
  if (!p) return {};
  const name = sheetName(p.s, p.w);
  return {
    title: { absolute: `${name} – Free Printable | The Pick’em Club` },
    description: `Free printable ${name} with every game, kickoff times and a tiebreaker line. Print it for your office or family pool, or run your pick’em online.`,
    alternates: { canonical: `/pick-sheets/${p.s}/${p.w}` },
  };
}

export default async function WeeklyPickSheet({ params }: { params: Promise<Params> }) {
  const p = parse(await params);
  if (!p) notFound();
  const games = await getWeekGames(p.s, p.w);
  if (games.length === 0) notFound();
  const name = sheetName(p.s, p.w);
  const tiebreaker = games.find((g) => g.isTiebreaker) ?? games[games.length - 1];

  return (
    <div className="bg-bg">
      <section className="bg-brand-900 text-white print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400 mb-2">
            <Link href="/pick-sheets" className="hover:underline">Free printable pick sheets</Link>
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3">{name}</h1>
          <p className="text-lg text-white/90 max-w-2xl">
            All {games.length} games with kickoff times and a tiebreaker. Print one
            for everyone in your pool, or skip the paper and let the scoring
            happen automatically.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrintButton label="Print this pick sheet" />
            <Link
              href="/start"
              className="inline-block rounded-control border border-white/40 px-5 py-2.5 font-semibold text-white hover:bg-white/10"
            >
              Run it online instead
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 print:p-0 print:max-w-none">
        <div className="printable rounded-card border border-border bg-white p-5 text-black">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <div className="text-xl font-bold">{name}</div>
              <div className="text-xs text-gray-600">Circle or check one team per game. Times are Eastern.</div>
            </div>
            <div className="text-sm">
              Name: <span className="inline-block w-56 border-b border-black align-bottom" />
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-1.5 pr-2 font-semibold w-[22%]">Kickoff</th>
                <th className="py-1.5 px-2 font-semibold">Away</th>
                <th className="py-1.5 w-6" />
                <th className="py-1.5 px-2 font-semibold">Home</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const k = kickoffLabel(g.date);
                return (
                  <tr key={g.id} className="border-b border-gray-300">
                    <td className="py-2 pr-2 whitespace-nowrap text-gray-700">
                      {k.day} · {k.time}
                    </td>
                    <td className="py-2 px-2">
                      <span className="mr-2 inline-block h-4 w-4 border border-black align-middle" />
                      {g.awayTeam}
                    </td>
                    <td className="py-2 text-center text-gray-500">@</td>
                    <td className="py-2 px-2">
                      <span className="mr-2 inline-block h-4 w-4 border border-black align-middle" />
                      {g.homeTeam}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 text-sm">
            <div>
              <span className="font-semibold">Tiebreaker:</span> total points in{" "}
              {tiebreaker.awayTeam} @ {tiebreaker.homeTeam}:{" "}
              <span className="inline-block w-20 border-b border-black align-bottom" />
            </div>
            <div className="text-xs text-gray-600">Run your pick’em online at thepickemclub.com</div>
          </div>
        </div>

        <div className="rounded-card bg-brand-900 p-8 text-center text-white print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Done collecting paper sheets?</h2>
          <p className="text-white/85 max-w-xl mx-auto mb-6">
            On The Pick’em Club everyone picks from their phone, picks lock at
            kickoff, and scores and the leaderboard update themselves. Members play
            free.
          </p>
          <Link
            href="/start"
            className="inline-block rounded-control bg-accent-500 px-6 py-3 font-semibold text-brand-900 hover:bg-accent-400"
          >
            Start your group · $10
          </Link>
        </div>

        <p className="text-sm text-text-muted print:hidden">
          <Link href="/pick-sheets" className="underline">All weekly pick sheets</Link>
          {" · "}
          <Link href="/super-bowl-squares" className="underline">Super Bowl squares guide</Link>
          {" · "}Not affiliated with the NFL.
        </p>
      </div>
    </div>
  );
}
