export function initGalleryTour(): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const cleanups: Array<() => void> = [];

  // "Take a tour" opens the Lightbox on the hero (first slide) instead of
  // jumping to the Grundriss photos.
  document.querySelectorAll<HTMLElement>("[data-tour]").forEach((link) => {
    link.addEventListener(
      "click",
      (event) => {
        const first = link
          .closest("[data-lightbox-gallery]")
          ?.querySelector<HTMLElement>("[data-lightbox-open]");
        if (!first) return;
        event.preventDefault();
        first.click();
      },
      { signal },
    );
  });

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
  };
}
