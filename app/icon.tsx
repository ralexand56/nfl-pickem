import { ImageResponse } from "next/og";
import { pickSheetIconSvg, svgDataUri } from "@/lib/logo";

// Browser-tab icon: the simplified pick sheet, crisp at 16–32px.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <img src={svgDataUri(pickSheetIconSvg())} width={64} height={64} alt="" />,
    size
  );
}
