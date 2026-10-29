export function initFactsNav(): () => void {
  const ac = new AbortController();
  const cleanups: Array<() => void> = [];

  const root = document.querySelector<HTMLElement>("[data-facts]");

  if (root) {
    // Section nav: the chip of the section under the nav turns grey.
    const links = Array.from(
      root.querySelectorAll<HTMLAnchorElement>(".facts-nav a.chip"),
    );
    const setActive = (id: string) =>
      links.forEach((l) => {
        const on = l.getAttribute("href") === `#${id}`;
        l.classList.toggle("chip--active", on);
        if (on) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      });
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-18% 0px -78% 0px" },
    );
    root
      .querySelectorAll<HTMLElement>(".facts-sec")
      .forEach((s) => spy.observe(s));
    cleanups.push(() => spy.disconnect());
  }

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
  };
}
