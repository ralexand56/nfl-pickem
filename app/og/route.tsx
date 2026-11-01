import { ImageResponse } from "next/og";

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
          background: "linear-gradient(135deg, #073934 0%, #0f766e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div style={{ fontSize: 44, fontWeight: 800 }}>The Pick’em Club</div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 2,
              background: "white",
              color: "#0f766e",
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
        <div style={{ fontSize: 34, marginTop: 28, color: "#ccfbf1", maxWidth: 980 }}>
          Weekly picks · automatic scoring · live leaderboard · Super Bowl squares
        </div>
        <div style={{ fontSize: 30, marginTop: 44, fontWeight: 700 }}>
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
