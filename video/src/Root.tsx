import { Composition } from "remotion";
import { Promo, PROMO_FRAMES } from "./Promo";
import { FPS, H, VH, VW, W } from "./theme";

export function RemotionRoot() {
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={PROMO_FRAMES} fps={FPS} width={W} height={H} defaultProps={{ vertical: false }} />
      {/* 9:16 for Instagram Reels, TikTok, YouTube Shorts and Stories. */}
      <Composition id="PromoVertical" component={Promo} durationInFrames={PROMO_FRAMES} fps={FPS} width={VW} height={VH} defaultProps={{ vertical: true }} />
    </>
  );
}
