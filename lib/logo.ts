// The Pick'em Club mark: a pick sheet on a clipboard with two picks made and
// one still open. One definition feeds the nav, favicon, app icon and share
// image. Client-safe (plain strings).

type Palette = { card: string; amber: string; ink: string; line: string; empty: string };

// Charcoal sheet for light backgrounds; white sheet for dark ones.
export const LOGO_ON_LIGHT: Palette = {
  card: "#2a2826", amber: "#f2a33a", ink: "#1d1c1a", line: "#8c8882", empty: "#5a5753",
};
export const LOGO_ON_DARK: Palette = {
  card: "#ffffff", amber: "#f2a33a", ink: "#1d1c1a", line: "#b5b1aa", empty: "#d7d4cf",
};

const check = (x: number, y: number, s: number, c: string) =>
  `<path d="M${x + s * 0.24} ${y + s * 0.52} l${s * 0.19} ${s * 0.2} l${s * 0.36} -${s * 0.42}" fill="none" stroke="${c}" stroke-width="${s * 0.17}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Full mark: clipboard pick sheet, three games, two picked.
export function pickSheetSvg(p: Palette = LOGO_ON_LIGHT) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect x="9" y="3" width="46" height="58" rx="9" fill="${p.card}"/>
<rect x="24" y="0.5" width="16" height="7" rx="3.5" fill="${p.amber}"/>
<rect x="16" y="15" width="12" height="12" rx="3" fill="${p.amber}"/>${check(16, 15, 12, p.ink)}
<rect x="32" y="19" width="16" height="4" rx="2" fill="${p.line}"/>
<rect x="16" y="31" width="12" height="12" rx="3" fill="${p.amber}"/>${check(16, 31, 12, p.ink)}
<rect x="32" y="35" width="12" height="4" rx="2" fill="${p.line}"/>
<rect x="17" y="48" width="10" height="10" rx="2.5" fill="none" stroke="${p.empty}" stroke-width="2"/>
<rect x="32" y="51" width="14" height="4" rx="2" fill="${p.empty}"/>
</svg>`;
}

// Small mark for favicons and app icons: two chunky picks, no fine detail.
export function pickSheetIconSvg(p: Palette = LOGO_ON_LIGHT) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect x="4" y="4" width="56" height="56" rx="13" fill="${p.card}"/>
<rect x="13" y="13" width="17" height="17" rx="4" fill="${p.amber}"/>${check(13, 13, 17, p.ink)}
<rect x="35" y="18.5" width="17" height="6" rx="3" fill="${p.line}"/>
<rect x="13" y="34" width="17" height="17" rx="4" fill="${p.amber}"/>${check(13, 34, 17, p.ink)}
<rect x="35" y="39.5" width="12" height="6" rx="3" fill="${p.line}"/>
</svg>`;
}

export const svgDataUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
