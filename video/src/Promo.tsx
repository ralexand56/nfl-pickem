import { AbsoluteFill, Series } from "remotion";
import { C, VerticalContext } from "./theme";
import { Hook, Intro, Invite, Leaderboard, Outro, Picks, Squares, StartGroup } from "./scenes";

// Scene lengths in frames at 30 fps (about 49 seconds total).
export const SCENES = [
  { C: Intro, d: 90 },
  { C: Hook, d: 150 },
  { C: StartGroup, d: 210 },
  { C: Invite, d: 180 },
  { C: Picks, d: 210 },
  { C: Leaderboard, d: 180 },
  { C: Squares, d: 210 },
  { C: Outro, d: 180 },
];
export const PROMO_FRAMES = SCENES.reduce((n, s) => n + s.d, 0);

export function Promo({ vertical = false }: { vertical?: boolean }) {
  return (
    <VerticalContext.Provider value={vertical}>
    <AbsoluteFill style={{ background: C.charcoal }}>
      <Series>
        {SCENES.map(({ C: Scene, d }, i) => (
          <Series.Sequence key={i} durationInFrames={d}>
            <Scene duration={d} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
    </VerticalContext.Provider>
  );
}
