// The printable pick sheet as a real PDF file (one Letter page), so it can be
// downloaded and can show up in search results on its own. Mirrors the
// on-page sheet in components/PickSheet.tsx.
import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { kickoffLabel } from "@/lib/pick-sheets";

type Game = { date: Date; homeTeam: string; awayTeam: string; isTiebreaker: boolean | null };

const PAGE = { width: 612, height: 792 }; // US Letter, points
const MARGIN = 54;
const BLACK = rgb(0, 0, 0);
const GRAY = rgb(0.4, 0.4, 0.4);
const RULE = rgb(0.75, 0.75, 0.75);

export async function buildPickSheetPdf({ name, games }: { name: string; games: Game[] }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(name);
  pdf.setAuthor("The Pick’em Club");
  pdf.setSubject("Free printable NFL pick sheet");
  pdf.setKeywords(["NFL", "pick sheet", "pick'em", "printable"]);
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const right = PAGE.width - MARGIN;
  let y = PAGE.height - MARGIN;

  page.drawText(name, { x: MARGIN, y: y - 18, size: 20, font: bold, color: BLACK });
  y -= 36;
  page.drawText("Check one team per game. Times are Eastern.", {
    x: MARGIN, y, size: 10, font: regular, color: GRAY,
  });
  page.drawText("Name:", { x: right - 230, y, size: 11, font: regular, color: BLACK });
  page.drawLine({ start: { x: right - 192, y: y - 2 }, end: { x: right, y: y - 2 }, thickness: 0.8, color: BLACK });
  y -= 30;

  // Column x positions.
  const col = { kickoff: MARGIN, away: MARGIN + 140, at: MARGIN + 322, home: MARGIN + 342 };
  page.drawText("Kickoff", { x: col.kickoff, y, size: 11, font: bold });
  page.drawText("Away", { x: col.away, y, size: 11, font: bold });
  page.drawText("Home", { x: col.home, y, size: 11, font: bold });
  y -= 7;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 1.5, color: BLACK });

  // Fit up to 16 games comfortably on one page.
  const rowHeight = Math.min(30, Math.floor(470 / Math.max(games.length, 1)));
  const box = 11;
  for (const g of games) {
    const k = kickoffLabel(g.date);
    const baseline = y - rowHeight / 2 - 4;
    page.drawText(`${k.day} · ${k.time}`, { x: col.kickoff, y: baseline, size: 10, font: regular, color: GRAY });
    for (const [x, team] of [[col.away, g.awayTeam], [col.home, g.homeTeam]] as const) {
      page.drawRectangle({ x, y: baseline - 1.5, width: box, height: box, borderColor: BLACK, borderWidth: 0.8 });
      page.drawText(team, { x: x + box + 7, y: baseline, size: 11, font: regular, color: BLACK });
    }
    page.drawText("@", { x: col.at, y: baseline, size: 10, font: regular, color: GRAY });
    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.5, color: RULE });
  }

  const tiebreaker = games.find((g) => g.isTiebreaker) ?? games[games.length - 1];
  if (tiebreaker) {
    y -= 34;
    const label = "Tiebreaker:";
    page.drawText(label, { x: MARGIN, y, size: 11, font: bold });
    const text = ` total points in ${tiebreaker.awayTeam} @ ${tiebreaker.homeTeam}:`;
    const labelWidth = bold.widthOfTextAtSize(label, 11);
    page.drawText(text, { x: MARGIN + labelWidth, y, size: 11, font: regular });
    const lineStart = MARGIN + labelWidth + regular.widthOfTextAtSize(text, 11) + 6;
    page.drawLine({ start: { x: lineStart, y: y - 2 }, end: { x: lineStart + 60, y: y - 2 }, thickness: 0.8, color: BLACK });
  }

  const footer = "Free from The Pick’em Club. Run your pick’em online at thepickemclub.com";
  page.drawText(footer, {
    x: (PAGE.width - regular.widthOfTextAtSize(footer, 9)) / 2,
    y: MARGIN - 18,
    size: 9,
    font: regular,
    color: GRAY,
  });

  return pdf.save();
}

// Response for a pick-sheet PDF: shown in the browser, saved under a readable
// name, and cached for an hour at the CDN like the HTML sheets.
export function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
