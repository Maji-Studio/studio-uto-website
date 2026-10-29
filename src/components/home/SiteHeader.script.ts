export function initClock(): () => void {
  const ac = new AbortController();
  const cleanups: Array<() => void> = [];

  // Keep the date and time current, including when the page stays open.
  const el = document.getElementById("today");
  if (el) {
    const updateClock = () => {
      const now = new Date();
      const weekday = new Intl.DateTimeFormat("de-CH", {
        weekday: "long",
      }).format(now);
      const month = new Intl.DateTimeFormat("de-CH", { month: "long" }).format(
        now,
      );
      const time = new Intl.DateTimeFormat("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
      el.textContent = `${weekday} ${now.getDate()}. ${month} ${now.getFullYear()} ${time} Uhr`;
      el.setAttribute("datetime", now.toISOString());
    };
    updateClock();
    const id = window.setInterval(updateClock, 1000);
    cleanups.push(() => window.clearInterval(id));
  }

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
  };
}
