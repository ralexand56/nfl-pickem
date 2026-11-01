import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { BODY, C, DISPLAY } from "./theme";

// Fade + rise in, starting at `delay` frames.
export function useEnter(delay = 0, distance = 40) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return {
    opacity: interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    transform: `translateY(${(1 - p) * distance}px)`,
  };
}

// Fade the whole scene out over its last frames so cuts feel smooth.
export function SceneFade({ children, duration }: { children: React.ReactNode; duration: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, duration - 12, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
}

// Step label + headline used by each feature scene.
export function Caption({ step, title, sub }: { step: string; title: string; sub: string }) {
  const a = useEnter(0);
  const b = useEnter(6);
  const c = useEnter(12);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 640 }}>
      <div style={{ ...a, fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: C.tan }}>
        {step}
      </div>
      <div style={{ ...b, fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, lineHeight: 1.02, letterSpacing: -1.5, color: "#fff" }}>
        {title}
      </div>
      <div style={{ ...c, fontFamily: BODY, fontSize: 34, lineHeight: 1.4, color: C.soft }}>{sub}</div>
    </div>
  );
}

// White app card, like the site's cards.
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.surface,
        borderRadius: 28,
        boxShadow: "0 30px 80px rgba(0,0,0,.45)",
        padding: 40,
        fontFamily: BODY,
        color: C.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Charcoal backdrop with a soft tan glow, shared by feature scenes.
export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(1200px 700px at 78% 40%, ${C.charcoal3} 0%, ${C.charcoal} 70%)`,
        display: "flex",
        alignItems: "center",
        padding: "0 140px",
        gap: 110,
      }}
    >
      {children}
    </div>
  );
}

// Animated pick-sheet logo: checks draw in after `delay` frames.
export function LogoMark({ size = 200, delay = 0, onDark = true }: { size?: number; delay?: number; onDark?: boolean }) {
  const frame = useCurrentFrame();
  const draw = (start: number) =>
    interpolate(frame - delay - start, [0, 10], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  const card = onDark ? "#ffffff" : C.charcoal2;
  const line = onDark ? "#b5b1aa" : "#8c8882";
  const empty = onDark ? "#d7d4cf" : "#5a5753";
  const check = (y: number, start: number) => (
    <path
      d={`M${16 + 12 * 0.24} ${y + 12 * 0.52} l${12 * 0.19} ${12 * 0.2} l${12 * 0.36} -${12 * 0.42}`}
      fill="none"
      stroke={C.charcoal}
      strokeWidth={2.04}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={draw(start)}
    />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect x="9" y="3" width="46" height="58" rx="9" fill={card} />
      <rect x="24" y="0.5" width="16" height="7" rx="3.5" fill={C.tan} />
      <rect x="16" y="15" width="12" height="12" rx="3" fill={C.tan} />
      {check(15, 6)}
      <rect x="32" y="19" width="16" height="4" rx="2" fill={line} />
      <rect x="16" y="31" width="12" height="12" rx="3" fill={C.tan} />
      {check(31, 16)}
      <rect x="32" y="35" width="12" height="4" rx="2" fill={line} />
      <rect x="17" y="48" width="10" height="10" rx="2.5" fill="none" stroke={empty} strokeWidth="2" />
      <rect x="32" y="51" width="14" height="4" rx="2" fill={empty} />
    </svg>
  );
}

// Phone frame for chat / mobile moments.
export function Phone({ children, width = 520 }: { children: React.ReactNode; width?: number }) {
  return (
    <div
      style={{
        width,
        height: width * 2.05,
        borderRadius: 64,
        background: "#0f0e0d",
        padding: 18,
        boxShadow: "0 40px 100px rgba(0,0,0,.55)",
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 48, background: C.paper, overflow: "hidden", position: "relative", fontFamily: BODY }}>
        {children}
      </div>
    </div>
  );
}
