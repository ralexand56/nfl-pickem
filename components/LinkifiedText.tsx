import { Fragment } from "react";

// Web addresses in admin-written text, with or without http(s)://.
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
// Sentence punctuation right after an address isn't part of it.
const TRAILING = /[.,;:!?)\]}'"]+$/;

// Plain text with its web addresses turned into links. Only http(s) links
// are made, so a note can't carry javascript: or other schemes.
export default function LinkifiedText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const trailing = raw.match(TRAILING)?.[0] ?? "";
    const display = raw.slice(0, raw.length - trailing.length);
    const start = match.index ?? 0;
    const href = /^https?:\/\//i.test(display) ? display : `https://${display}`;
    let url: URL | null = null;
    try {
      url = new URL(href);
    } catch {
      url = null;
    }
    if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) continue;
    parts.push(text.slice(last, start));
    parts.push(
      <a
        key={start}
        href={url.href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="text-link underline break-all"
      >
        {display}
      </a>
    );
    last = start + display.length;
  }
  parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
