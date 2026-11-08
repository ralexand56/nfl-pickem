import { kickoffLabel } from "@/lib/pick-sheets";

type Game = { id: string; date: Date; homeTeam: string; awayTeam: string; isTiebreaker: boolean | null };

// The printable sheet itself: every game with check boxes, a name line and a
// tiebreaker. Pages wrap it with their own (print-hidden) header and pitch.
export default function PickSheet({ name, games, note }: { name: string; games: Game[]; note?: string }) {
  const tiebreaker = games.find((g) => g.isTiebreaker) ?? games[games.length - 1];
  return (
    <div className="printable rounded-card border border-border bg-white p-5 text-black">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <div className="text-xl font-bold">{name}</div>
          <div className="text-xs text-gray-600">
            {note ?? "Circle or check one team per game."} Times are Eastern.
          </div>
        </div>
        <div className="text-sm">
          Name: <span className="inline-block w-40 sm:w-56 border-b border-black align-bottom" />
        </div>
      </div>

      <div className="overflow-x-auto">
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
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 text-sm">
        <div>
          <span className="font-semibold">Tiebreaker:</span> total points in{" "}
          {tiebreaker.awayTeam} @ {tiebreaker.homeTeam}:{" "}
          <span className="inline-block w-20 border-b border-black align-bottom" />
        </div>
        <div className="text-xs text-gray-600">Run your pick’em online at thepickemclub.com</div>
      </div>
    </div>
  );
}
