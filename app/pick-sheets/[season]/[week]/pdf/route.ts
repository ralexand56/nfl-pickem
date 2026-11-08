import { buildPickSheetPdf, pdfResponse } from "@/lib/pick-sheet-pdf";
import { getWeekGames } from "@/lib/pick-sheets";
import { getWeekLabel } from "@/lib/weeks";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ season: string; week: string }> }
) {
  const { season, week } = await params;
  const s = Number(season);
  const w = Number(week);
  if (!Number.isInteger(s) || !Number.isInteger(w) || w < 1 || w > 22) {
    return new Response("Not found", { status: 404 });
  }
  const games = await getWeekGames(s, w);
  if (games.length === 0) return new Response("Not found", { status: 404 });
  const name = w > 18 ? `NFL ${getWeekLabel(w)} Pick Sheet ${s}` : `NFL Week ${w} Pick Sheet ${s}`;
  const slug = w > 18 ? getWeekLabel(w).toLowerCase().replace(/\s+/g, "-") : `week-${w}`;
  return pdfResponse(await buildPickSheetPdf({ name, games }), `nfl-${slug}-pick-sheet-${s}.pdf`);
}
