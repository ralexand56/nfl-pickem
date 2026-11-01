import { LOGO_ON_DARK, LOGO_ON_LIGHT, pickSheetSvg } from "@/lib/logo";

// The pick-sheet mark as inline SVG (static markup from lib/logo.ts).
export default function LogoMark({
  size = 28,
  onDark = false,
  className,
}: {
  size?: number;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={className}
      style={{ display: "inline-flex", width: size, height: size }}
      dangerouslySetInnerHTML={{
        __html: pickSheetSvg(onDark ? LOGO_ON_DARK : LOGO_ON_LIGHT).replace(
          "<svg ",
          `<svg width="${size}" height="${size}" `
        ),
      }}
    />
  );
}
