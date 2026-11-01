import { ImageResponse } from "next/og";
import { LOGO_ON_DARK, pickSheetSvg, svgDataUri } from "@/lib/logo";

// iPhone/iPad home-screen icon: white pick sheet on charcoal (iOS rounds the
// corners itself, so the background fills the square).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d1c1a",
        }}
      >
        <img src={svgDataUri(pickSheetSvg(LOGO_ON_DARK))} width={128} height={128} alt="" />
      </div>
    ),
    size
  );
}
