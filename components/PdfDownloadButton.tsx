// A real PDF of the sheet, next to the print button.
export default function PdfDownloadButton({ href, filename }: { href: string; filename: string }) {
  return (
    <a
      href={href}
      download={filename}
      className="inline-block rounded-control bg-accent-500 px-5 py-2.5 font-semibold text-brand-900 hover:bg-accent-400"
    >
      Download PDF
    </a>
  );
}
