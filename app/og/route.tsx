import { ImageResponse } from "next/og";
import { LOGO_ON_DARK, pickSheetSvg, svgDataUri } from "@/lib/logo";

// Link preview image (texts, social posts, search) at /og. Referenced from
// the root metadata with an absolute thepickemclub.com URL, rather than the
// opengraph-image file convention, whose host Next.js picks from the Vercel
// deployment (preview or "primary" domain) instead of metadataBase.
const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          background: "linear-gradient(135deg, #1d1c1a 0%, #36332f 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          {/* ImageResponse renders plain <img>; next/image can't be used here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgDataUri(pickSheetSvg(LOGO_ON_DARK))} width={72} height={72} alt="" />
          <div style={{ fontSize: 44, fontWeight: 800 }}>The Pick’em Club</div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 2,
              background: "#f2a33a",
              color: "#1d1c1a",
              padding: "6px 14px",
              borderRadius: 8,
            }}
          >
            NFL
          </div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
          NFL pick’em for family & friends.
        </div>
        <div style={{ fontSize: 34, marginTop: 28, color: "#d7d4cf", maxWidth: 980 }}>
          Weekly picks · automatic scoring · live leaderboard · Super Bowl squares
        </div>
        <div style={{ fontSize: 30, marginTop: 44, fontWeight: 700, color: "#f2a33a" }}>
          $10 per NFL season · thepickemclub.com
        </div>
      </div>
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
    }
  );
}
