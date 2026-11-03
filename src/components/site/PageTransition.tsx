import { staticImages } from "@/lib/static-images";

import { pageTransitionScript } from "./page-transition-script";

/**
 * Inline <head> script for the page transitions (see page-transition-script.ts
 * for the runtime, global.css for the choreography). The reel's stand-in
 * footage is two studio stills at 1080 px wide.
 */
export default function PageTransition() {
  const reelSrcs = [
    staticImages.studioImage2.src,
    staticImages.studioImage1.src,
  ];

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: pageTransitionScript.replace(
          "__REEL__",
          JSON.stringify(reelSrcs),
        ),
      }}
    />
  );
}
