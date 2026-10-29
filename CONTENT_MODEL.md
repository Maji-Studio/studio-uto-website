# Content Model

The shapes the pages consume are defined in `src/lib/content/types.ts`: `SiteSettings`, `StudioSection` / `StudioBlock` (the fact-sheet and Information sections), `Impression` and `ContentImage`.

Pages never import content directly. They await the getters in `src/lib/content/index.ts` (`getSiteSettings`, `getStudioPhotos`, `getStudioSections`, `getInformationSections`, `getImpressionen`) and pass the result down as props. Today those return the bundled data built in `src/lib/content/static.ts`; the source can change by editing `index.ts` alone.

Purely decorative imagery (the homepage chrome intro, the page-transition reel, the `/sketch/` sections) stays a direct static import inside its component.

The CMS documentation (Payload collections and globals) follows once the content has moved there.
