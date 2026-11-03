import LogoScript from "./Logo.client";
import "./Logo.css";

// Giant UTO wordmark. The variable font only carries the U/T/O glyphs.
// Height stays fixed (font-size); the wordmark is fitted edge-to-edge by driving
// each glyph's variable WIDTH axis as the window scales, and hovering shifts
// width towards the glyph under the pointer — see Logo.script.ts.
export default function Logo({ className }: { className?: string }) {
  return (
    <>
      {/* The head's pagereveal script paints the last fitted state onto these
          nodes before React hydrates them, hence suppressHydrationWarning. */}
      <h1
        className={className ? `logo ${className}` : "logo"}
        aria-label="Studio Uto"
        suppressHydrationWarning
      >
        {["U", "T", "O"].map((glyph) => (
          <span key={glyph} aria-hidden="true" suppressHydrationWarning>
            {glyph}
          </span>
        ))}
      </h1>
      <LogoScript />
    </>
  );
}
