import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";

// Same brand as the site: warm charcoal, tan accent, Outfit display, Geist body.
export const { fontFamily: DISPLAY } = loadOutfit("normal", {
  weights: ["300", "400", "600", "800"],
  subsets: ["latin"],
});
export const { fontFamily: BODY } = loadGeist("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const C = {
  charcoal: "#1d1c1a",
  charcoal2: "#2a2826",
  charcoal3: "#36332f",
  paper: "#f4f3f1",
  surface: "#ffffff",
  border: "#e1ded9",
  text: "#1c1b19",
  muted: "#4f4b46",
  soft: "#d7d4cf",
  tan: "#cf9a66",
  tanLight: "#e2c39d",
  success: "#16a34a",
};

export const FPS = 30;
export const W = 1920;
export const H = 1080;
