import { Composition } from "remotion";
import { Promo, PROMO_FRAMES } from "./Promo";
import { FPS, H, W } from "./theme";

export function RemotionRoot() {
  return (
    <Composition id="Promo" component={Promo} durationInFrames={PROMO_FRAMES} fps={FPS} width={W} height={H} />
  );
}
