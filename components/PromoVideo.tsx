"use client";
import { useEffect, useRef, useState } from "react";

// The product tour. Phones get the 9:16 cut, wider screens the 16:9 one; only
// the chosen file is loaded. It plays muted on a loop while on screen (it has
// no audio) and pauses when scrolled away. Visitors who prefer reduced motion
// get a poster and a play button instead of autoplay.
const VERSIONS = {
  wide: { src: "/videos/promo-wide.mp4", poster: "/videos/promo-wide-poster.jpg", ratio: "16 / 9" },
  vertical: { src: "/videos/promo-vertical.mp4", poster: "/videos/promo-vertical-poster.jpg", ratio: "9 / 16" },
};

export default function PromoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  // Decided after mount (it depends on the screen), so the server renders
  // the wide poster and nothing downloads until we know which file to load.
  const [version, setVersion] = useState<keyof typeof VERSIONS | null>(null);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 640px)");
    const pick = () => setVersion(narrow.matches ? "vertical" : "wide");
    pick();
    narrow.addEventListener("change", pick);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return () => narrow.removeEventListener("change", pick);
  }, []);

  // Autoplay only while visible (and only without reduced motion).
  useEffect(() => {
    const video = ref.current;
    if (!video || reducedMotion) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [version, reducedMotion]);

  const v = VERSIONS[version ?? "wide"];

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-card bg-brand-900 shadow-2xl ring-1 ring-black/10 max-sm:max-w-sm"
      style={{ aspectRatio: v.ratio }}
    >
      {version ? (
        <video
          key={version}
          ref={ref}
          src={v.src}
          poster={v.poster}
          muted
          loop
          playsInline
          preload={reducedMotion ? "none" : "metadata"}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label="A 45-second tour of The Pick'em Club: start a group, share the invite link, make picks, the leaderboard and Super Bowl squares"
          className="h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.poster} alt="" className="h-full w-full object-cover" />
      )}
      <button
        type="button"
        onClick={() => {
          const video = ref.current;
          if (!video) return;
          if (video.paused) video.play().catch(() => {});
          else video.pause();
        }}
        aria-label={playing ? "Pause the tour" : "Play the tour"}
        className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
        )}
      </button>
    </div>
  );
}
