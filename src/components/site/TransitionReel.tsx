import "./TransitionReel.css";

/*
 * Studio reel shown inside the page transition's rising panel (see
 * PageTransition.tsx for the renderer, global.css for the choreography).
 * Hidden except while a transition runs; its own view-transition-name keeps it
 * live between the page snapshots and the wordmark/menu.
 */
export default function TransitionReel() {
  return (
    <div className="vt-reel" data-vt-reel aria-hidden="true">
      {/* The pagereveal script sizes the canvas and writes the destination label
          before React hydrates this markup, hence suppressHydrationWarning. */}
      <canvas suppressHydrationWarning></canvas>
      <span
        className="vt-reel__dest chip"
        data-vt-reel-dest
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: "" }}
      ></span>
    </div>
  );
}
