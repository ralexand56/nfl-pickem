import { buildPickSheetPdf, pdfResponse } from "@/lib/pick-sheet-pdf";
import { getThanksgivingGames } from "@/lib/pick-sheets";
import { getCurrentNfl } from "@/lib/server";

export async function GET() {
  const s = (await getCurrentNfl()).season ?? new Date().getFullYear();
  // The last Thanksgiving game is the tiebreaker, as on the page.
  const games = (await getThanksgivingGames(s)).map((g) => ({ ...g, isTiebreaker: false }));
  if (games.length === 0) return new Response("Not found", { status: 404 });
  return pdfResponse(
    await buildPickSheetPdf({ name: `Thanksgiving NFL Pick Sheet ${s}`, games }),
    `thanksgiving-nfl-pick-sheet-${s}.pdf`
  );
}
