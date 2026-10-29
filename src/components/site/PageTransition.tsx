import { getImageProps } from "next/image";

import studio1 from "@/assets/studio/image-1.jpg";
import studio2 from "@/assets/studio/image-2.jpg";

import { pageTransitionScript } from "./page-transition-script";

/**
 * Inline <head> script for the page transitions (see page-transition-script.ts
 * for the runtime, global.css for the choreography). The reel's stand-in
 * footage is two studio stills at 1080 px wide.
 */
export default function PageTransition() {
  const reelSrcs = [studio2, studio1].map((img) => {
    const { props } = getImageProps({ src: img, alt: "", width: 1080 });
    // The 1x candidate: 1080 px wide.
    return (props.srcSet ?? "").split(", ")[0].replace(/ 1x$/, "") || props.src;
  });

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
