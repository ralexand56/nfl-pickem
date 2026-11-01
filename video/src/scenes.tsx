import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop, Caption, Card, LogoMark, Phone, SceneFade, useEnter } from "./components";
import { BODY, C, DISPLAY, useVertical } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 1. Logo intro ---------------------------------------------------------------
export function Intro({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const word = useEnter(22, 30);
  return (
    <SceneFade duration={duration}>
      <AbsoluteFill style={{ background: C.charcoal, alignItems: "center", justifyContent: "center", gap: 40 }}>
        <div style={{ transform: `scale(${0.6 + pop * 0.4})` }}>
          <LogoMark size={260} delay={8} />
        </div>
        <div style={{ ...word, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center", padding: "0 60px" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 92, color: "#fff", letterSpacing: -1 }}>
            The Pick’em Club
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, letterSpacing: 3, background: C.tan, color: C.charcoal, padding: "8px 18px", borderRadius: 10 }}>
            NFL
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
}

// 2. Hook over the game-day photo --------------------------------------------
export function Hook({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const vertical = useVertical();
  const zoom = interpolate(frame, [0, duration], [1.04, 1.14]);
  const lines = vertical
    ? ["Run your NFL", "pick’em with", "family & friends."]
    : ["Run your NFL pick’em", "with family & friends."];
  const sub = useEnter(40);
  return (
    <SceneFade duration={duration}>
      <AbsoluteFill style={{ background: C.charcoal, overflow: "hidden" }}>
        <Img src={staticFile("hero-watch-party.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: vertical ? "62% 50%" : "50% 50%", transform: `scale(${zoom})`, transformOrigin: "65% 45%" }} />
        <AbsoluteFill style={{ background: vertical ? "linear-gradient(180deg, rgba(29,28,26,.15) 0%, rgba(29,28,26,.55) 45%, rgba(29,28,26,.96) 78%)" : "linear-gradient(90deg, rgba(29,28,26,.96) 0%, rgba(29,28,26,.86) 42%, rgba(29,28,26,.25) 100%)" }} />
        <AbsoluteFill style={{ justifyContent: vertical ? "flex-end" : "center", padding: vertical ? "0 70px 300px" : "0 140px", gap: vertical ? 14 : 30 }}>
          {lines.map((l, i) => {
            const s = useEnter(8 + i * 10, 50);
            return (
              <div key={l} style={{ ...s, fontFamily: DISPLAY, fontWeight: 800, fontSize: vertical ? 100 : 112, lineHeight: 1, letterSpacing: -2, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,.4)" }}>
                {l}
              </div>
            );
          })}
          <div style={{ ...sub, fontFamily: BODY, fontSize: vertical ? 38 : 40, lineHeight: 1.35, color: C.soft, marginTop: 10 }}>
            Skip the spreadsheet. <span style={{ color: C.tan }}>Skip the group-text math.</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneFade>
  );
}

// 3. Start your group ---------------------------------------------------------
export function StartGroup({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const name = "Sunday Squad";
  const typed = name.slice(0, Math.floor(interpolate(frame, [30, 75], [0, name.length], clamp)));
  const checked = frame > 88;
  const pressed = frame > 112 && frame < 122;
  const done = frame > 128;
  const card = useEnter(10);
  const success = useEnter(130, 20);
  return (
    <SceneFade duration={duration}>
      <Backdrop>
        <Caption step="Step 1 · Start" title="Start your group" sub="Name it and pay $10 for the whole season. You’re the commissioner." />
        <div style={{ ...card, flex: useVertical() ? "none" : 1, display: "flex", justifyContent: "center", zoom: useVertical() ? 1.18 : 1 }}>
          {!done ? (
            <Card style={{ width: 760 }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, marginBottom: 10 }}>Start your NFL pick’em group</div>
              <div style={{ fontSize: 26, color: C.muted, marginBottom: 34 }}>Members join free with your invite link.</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 10 }}>Group name</div>
              <div style={{ border: `2px solid ${frame > 28 ? C.tan : C.border}`, borderRadius: 16, padding: "20px 24px", fontSize: 34, height: 86, display: "flex", alignItems: "center" }}>
                {typed}
                <span style={{ width: 3, height: 40, background: C.text, marginLeft: 3, opacity: frame % 30 < 15 && frame < 80 ? 1 : 0 }} />
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "28px 0 34px", fontSize: 25, color: C.muted }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${checked ? C.charcoal : C.border}`, background: checked ? C.charcoal : "#fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {checked ? "✓" : ""}
                </div>
                I’m 18 or older and agree to the Terms
              </div>
              <div style={{ background: C.tan, color: C.charcoal, borderRadius: 16, padding: "24px 0", textAlign: "center", fontFamily: DISPLAY, fontWeight: 600, fontSize: 34, transform: `scale(${pressed ? 0.97 : 1})` }}>
                Continue to payment · $10
              </div>
            </Card>
          ) : (
            <Card style={{ ...success, width: 760 }}>
              <div style={{ background: "#dcfce7", borderRadius: 18, padding: 30, marginBottom: 30 }}>
                <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46 }}>You’re all set! 🏈</div>
                <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>Payment received. Share your invite link.</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 10 }}>Invite link</div>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1, border: `2px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", fontSize: 26, color: C.muted }}>
                  thepickemclub.com/join/s9Xk…
                </div>
                <div style={{ background: C.charcoal, color: "#fff", borderRadius: 14, padding: "18px 30px", fontFamily: DISPLAY, fontWeight: 600, fontSize: 28 }}>Copy</div>
              </div>
            </Card>
          )}
        </div>
      </Backdrop>
    </SceneFade>
  );
}

// 4. Share the invite link ----------------------------------------------------
const CHAT = [
  { me: true, text: "Pick’em is ON this year 🏈 Join here: thepickemclub.com/join/s9Xk", at: 18 },
  { me: false, who: "Marcus", text: "I’m in!", at: 52 },
  { me: false, who: "Grandma Jo", text: "Coming for that #1 spot 😤", at: 78 },
  { me: false, who: "Lisa", text: "Joined. Let’s go 🙌", at: 104 },
];

export function Invite({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const members = Math.round(interpolate(frame, [50, 150], [1, 12], clamp));
  const phone = useEnter(6);
  return (
    <SceneFade duration={duration}>
      <Backdrop>
        <Caption step="Step 2 · Invite" title="Share one link" sub="Drop it in the group chat. Everyone plays free." />
        <div style={{ ...phone, flex: useVertical() ? "none" : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 50, zoom: useVertical() ? 1.12 : 1 }}>
          <Phone width={useVertical() ? 430 : 470}>
            <div style={{ background: C.charcoal, color: "#fff", padding: "54px 30px 22px", fontFamily: DISPLAY, fontWeight: 600, fontSize: 28 }}>
              Football crew 🏈
            </div>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              {CHAT.map((m) => {
                const s = spring({ frame: frame - m.at, fps: 30, config: { damping: 18 } });
                if (frame < m.at) return null;
                return (
                  <div key={m.text} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "82%", transform: `scale(${s})`, transformOrigin: m.me ? "right bottom" : "left bottom" }}>
                    {!m.me && <div style={{ fontSize: 17, color: C.muted, margin: "0 0 4px 12px" }}>{m.who}</div>}
                    <div style={{ background: m.me ? C.tan : "#fff", color: C.text, borderRadius: 24, padding: "16px 20px", fontSize: 23, lineHeight: 1.35, boxShadow: "0 2px 8px rgba(0,0,0,.08)", overflowWrap: "anywhere" }}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </Phone>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: DISPLAY }}>
            <div style={{ fontSize: 150, fontWeight: 300, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{members}</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: C.tan, letterSpacing: 2, textTransform: "uppercase" }}>members</div>
          </div>
        </div>
      </Backdrop>
    </SceneFade>
  );
}

// 5. Make picks ---------------------------------------------------------------
const GAMES: [string, string, "a" | "h", number][] = [
  ["KC", "BUF", "h", 40],
  ["DAL", "PHI", "a", 64],
  ["SF", "SEA", "a", 88],
  ["GB", "CHI", "h", 112],
  ["MIA", "NYJ", "a", 136],
];

function Chip({ label, on }: { label: string; on: boolean }) {
  return (
    <div style={{ minWidth: 110, textAlign: "center", padding: "14px 20px", borderRadius: 14, fontWeight: 600, fontSize: 28, border: `2px solid ${on ? C.charcoal : C.border}`, background: on ? C.charcoal : "#fff", color: on ? "#fff" : C.text }}>
      {label}
    </div>
  );
}

export function Picks({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const left = Math.max(0, 1 * 86400 + 4 * 3600 + 12 * 60 + 9 - Math.floor(frame / 30) * 1);
  const hh = String(Math.floor((left % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const card = useEnter(8);
  const lastPick = [...GAMES].reverse().find((g) => frame >= g[3]);
  const toast = lastPick ? interpolate(frame - lastPick[3], [0, 6, 26, 34], [0, 1, 1, 0], clamp) : 0;
  return (
    <SceneFade duration={duration}>
      <Backdrop>
        <Caption step="Step 3 · Pick" title="Pick every game" sub="Tap a team each week. A countdown shows exactly when picks lock." />
        <div style={{ ...card, flex: useVertical() ? "none" : 1, display: "flex", justifyContent: "center", position: "relative", zoom: useVertical() ? 1.18 : 1 }}>
          <Card style={{ width: 780, padding: 34 }}>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#fef3c7", borderRadius: 16, padding: "18px 24px", fontSize: 27, fontWeight: 600, marginBottom: 18 }}>
              <span>Picks lock in</span>
              <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>1d {hh}:{mm}:{ss}</span>
            </div>
            {GAMES.map(([a, h, pick, at]) => {
              const picked = frame >= at;
              return (
                <div key={a} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 6px", borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 29 }}>{a} @ {h}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Chip label={a} on={picked && pick === "a"} />
                    <Chip label={h} on={picked && pick === "h"} />
                  </div>
                </div>
              );
            })}
          </Card>
          {lastPick && (
            <div style={{ position: "absolute", top: -34, left: "50%", transform: `translate(-50%, ${(1 - toast) * -20}px)`, opacity: toast, background: "#fff", borderRadius: 999, padding: "14px 30px", fontFamily: BODY, fontSize: 26, fontWeight: 600, boxShadow: "0 12px 30px rgba(0,0,0,.35)", color: C.text }}>
              ✓ Pick saved: {lastPick[2] === "a" ? lastPick[0] : lastPick[1]}
            </div>
          )}
        </div>
      </Backdrop>
    </SceneFade>
  );
}

// 6. Leaderboard --------------------------------------------------------------
const PLAYERS = [
  { name: "Grandma Jo", from: 9, to: 12 },
  { name: "Marcus", from: 10, to: 11 },
  { name: "Lisa from work", from: 8, to: 11 },
  { name: "Devin", from: 11, to: 9 },
  { name: "Coach Ray", from: 7, to: 8 },
];

export function Leaderboard({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [40, 120], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const scored = PLAYERS.map((p) => ({ ...p, score: Math.round(p.from + (p.to - p.from) * t) }));
  const startOrder = [...PLAYERS].sort((a, b) => b.from - a.from).map((p) => p.name);
  const endOrder = [...PLAYERS].sort((a, b) => b.to - a.to).map((p) => p.name);
  const ROW = 96;
  const card = useEnter(8);
  return (
    <SceneFade duration={duration}>
      <Backdrop>
        <Caption step="Every week" title="Scores update themselves" sub="Final scores come in automatically. No more adding up the group text on Tuesday." />
        <div style={{ ...card, flex: useVertical() ? "none" : 1, display: "flex", justifyContent: "center", zoom: useVertical() ? 1.18 : 1 }}>
          <Card style={{ width: 760, padding: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 40 }}>Week 8 Leaderboard</div>
              <div style={{ background: C.tan, color: C.charcoal, borderRadius: 999, padding: "6px 18px", fontWeight: 600, fontSize: 22 }}>This week</div>
            </div>
            <div style={{ position: "relative", height: ROW * PLAYERS.length }}>
              {scored.map((p) => {
                const y = interpolate(t, [0, 1], [startOrder.indexOf(p.name), endOrder.indexOf(p.name)]) * ROW;
                const leader = t > 0.95 && endOrder[0] === p.name;
                return (
                  <div key={p.name} style={{ position: "absolute", left: 0, right: 0, top: y, height: ROW - 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", borderRadius: 16, background: leader ? "#fbf6ef" : "#fff", border: `2px solid ${leader ? C.tan : C.border}` }}>
                    <span style={{ fontSize: 31, fontWeight: 600 }}>{leader ? "🏆 " : ""}{p.name}</span>
                    <span style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{p.score} correct</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Backdrop>
    </SceneFade>
  );
}

// 7. Super Bowl squares -------------------------------------------------------
const CLAIM_ORDER = Array.from({ length: 100 }, (_, i) => (i * 37 + 11) % 100);
const HOME_DIGITS = [3, 0, 7, 1, 9, 4, 2, 8, 5, 6];
const AWAY_DIGITS = [6, 2, 9, 4, 0, 7, 1, 5, 8, 3];
const MINE = new Set([14, 47, 77]);
const INITIALS = ["JO", "MA", "LI", "DE", "RA", "KA", "TY", "AL"];

export function Squares({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const claimed = Math.floor(interpolate(frame, [20, 120], [0, 100], clamp));
  const filled = new Set(CLAIM_ORDER.slice(0, claimed));
  const drawn = frame > 132;
  const digitsIn = interpolate(frame, [132, 150], [0, 1], clamp);
  const S = 58;
  const card = useEnter(8);
  return (
    <SceneFade duration={duration}>
      <Backdrop>
        <Caption step="Super Bowl" title="Squares, built in" sub="Members claim squares, you lock the board and draw the numbers with one tap." />
        <div style={{ ...card, flex: useVertical() ? "none" : 1, display: "flex", justifyContent: "center", zoom: useVertical() ? 1.18 : 1 }}>
          <Card style={{ padding: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 600, marginBottom: 14 }}>
              <span>Super Bowl Squares</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: C.muted }}>{claimed} / 100 claimed</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `${S}px repeat(10, ${S}px)`, gap: 6 }}>
              <div />
              {HOME_DIGITS.map((d, i) => (
                <div key={`h${i}`} style={{ height: S * 0.7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, opacity: drawn ? digitsIn : 0.2, color: drawn ? C.text : C.soft }}>
                  {drawn ? d : "?"}
                </div>
              ))}
              {Array.from({ length: 10 }, (_, r) => (
                <React.Fragment key={r}>
                  <div style={{ width: S, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, opacity: drawn ? digitsIn : 0.2, color: drawn ? C.text : C.soft }}>
                    {drawn ? AWAY_DIGITS[r] : "?"}
                  </div>
                  {Array.from({ length: 10 }, (_, c) => {
                    const i = r * 10 + c;
                    const on = filled.has(i);
                    const mine = MINE.has(i);
                    return (
                      <div key={i} style={{ width: S, height: S, borderRadius: 9, background: on ? (mine ? C.tan : "#e1ded9") : "#f4f3f1", border: on ? "none" : "1px solid #ebe9e6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontSize: 17, fontWeight: 600, color: mine ? C.charcoal : C.muted }}>
                        {on ? (mine ? "YOU" : INITIALS[i % INITIALS.length]) : ""}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 22, color: drawn ? C.text : C.muted, fontWeight: drawn ? 600 : 400 }}>
              {drawn ? "🔒 Board locked · numbers drawn" : "Claiming squares…"}
            </div>
          </Card>
        </div>
      </Backdrop>
    </SceneFade>
  );
}

// 8. Call to action -----------------------------------------------------------
export function Outro({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 16 } });
  const a = useEnter(14);
  const b = useEnter(24);
  const c = useEnter(36);
  return (
    <SceneFade duration={duration + 12}>
      <AbsoluteFill style={{ background: `radial-gradient(1100px 650px at 50% 45%, ${C.charcoal3} 0%, ${C.charcoal} 72%)`, alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ transform: `scale(${0.7 + pop * 0.3})` }}>
          <LogoMark size={190} delay={0} />
        </div>
        <div style={{ ...a, fontFamily: DISPLAY, fontWeight: 800, fontSize: 104, color: "#fff", letterSpacing: -2 }}>The Pick’em Club</div>
        <div style={{ ...b, fontFamily: DISPLAY, fontWeight: 300, fontSize: 52, color: C.soft, textAlign: "center", padding: "0 70px", lineHeight: 1.3 }}>
          $10 per NFL season · members play free
        </div>
        <div style={{ ...c, marginTop: 20, background: C.tan, color: C.charcoal, borderRadius: 20, padding: "26px 56px", fontFamily: DISPLAY, fontWeight: 600, fontSize: 46 }}>
          thepickemclub.com
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
}
