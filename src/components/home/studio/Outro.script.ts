export function initOutro(): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const cleanups: Array<() => void> = [];

  const root = document.querySelector<HTMLElement>("[data-outro]");
  if (root) init(root);

  function init(root: HTMLElement) {
    const live = matchMedia(
      "(min-width: 700px) and (min-height: 520px) and (prefers-reduced-motion: no-preference)",
    );
    const track = root.querySelector<HTMLElement>("[data-outro-track]")!;
    const band = root.querySelector<HTMLElement>("[data-outro-band]")!;
    const page = root.querySelector<HTMLElement>("[data-outro-page]")!;
    const canvas = band.querySelector<HTMLCanvasElement>("canvas")!;

    // The reel easing, cubic-bezier(0.65, 0, 0.35, 1).
    const ease = (() => {
      const [x1, y1, x2, y2] = [0.65, 0, 0.35, 1];
      const bez = (a: number, b: number, t: number) =>
        3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
      return (x: number) => {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let t = x;
        for (let k = 0; k < 8; k++) {
          const d = bez(x1, x2, t) - x;
          const dd =
            (bez(x1, x2, t + 1e-4) - bez(x1, x2, t - 1e-4)) / 2e-4 || 1;
          t -= d / dd;
        }
        return bez(y1, y2, Math.min(1, Math.max(0, t)));
      };
    })();
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const range = (v: number, a: number, b: number) =>
      clamp01((v - a) / (b - a));

    let raf = 0;
    let last = -1;

    function set(el: HTMLElement, e: number) {
      el.style.clipPath = e >= 1 ? "none" : `inset(${(1 - e) * 100}% 0 0 0)`;
      el.style.visibility = e <= 0 ? "hidden" : "visible";
    }

    function apply() {
      raf = 0;
      const r = track.getBoundingClientRect();
      // P: 0 when the stage pins → 1 when it lets go. The band needs no reveal
      // of its own: it scrolls in straight after the prices, so there is no
      // blank screen while the stage pins.
      const P = clamp01(-r.top / Math.max(1, r.height - innerHeight));
      const ePage = ease(range(P, 0.25, 0.75));
      if (last !== ePage) set(page, ePage);
      last = ePage;
      page.style.pointerEvents = ePage < 1 ? "none" : "";
      // Fetch the reel a screen early so the band arrives with photos on it.
      if (r.top < 2 * innerHeight) loadImgs();
      // The reel plays while the band is on screen and the page hasn't covered it.
      setReel(r.top < innerHeight && r.bottom > 0 && ePage < 1);
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    // ---- reel: 12 fps, hard cuts, motion trail ----------------------------
    const FPS = 12;
    const TRAIL = 0.2;
    const SAMPLES = 6;
    const SAMPLE_ALPHA = 1 - Math.pow(1 - TRAIL, 1 / SAMPLES);
    const SHOT = 1.2;
    const MOVES = [
      [1.1, 1.4, 0.05, 0.95],
      [1.45, 1.15, 0.95, 0.1],
    ];
    let imgs: HTMLImageElement[] = [];
    let playing = false;
    let reelRaf = 0;

    function loadImgs() {
      if (imgs.length) return;
      // The grid's lazy photos sit under a clip; fetch them now too, so the
      // page doesn't rise over empty cells.
      for (const img of page.querySelectorAll("img")) img.loading = "eager";
      let srcs: string[] = [];
      try {
        srcs = JSON.parse(root.dataset.reel ?? "[]");
      } catch {}
      imgs = srcs.map((s) => {
        const im = new Image();
        im.src = s;
        return im;
      });
    }

    function setReel(on: boolean) {
      if (on === playing) return;
      playing = on;
      cancelAnimationFrame(reelRaf);
      reelRaf = 0;
      if (!on || !live.matches) return;
      loadImgs();
      const scale = 0.75;
      const w = (canvas.width = Math.round(innerWidth * scale));
      const h = (canvas.height = Math.round(innerHeight * scale));
      const acc = document.createElement("canvas");
      acc.width = w;
      acc.height = h;
      const ctx = acc.getContext("2d")!;
      const out = canvas.getContext("2d")!;
      let first = true;
      let nextPresent = 0;
      let tPrev = 0;

      const shootAt = (t: number) => {
        const shot = Math.floor(t / SHOT);
        const p = (t % SHOT) / SHOT;
        const m = MOVES[shot % MOVES.length];
        const img = imgs[shot % imgs.length];
        if (!img || !img.complete || !img.naturalWidth) return;
        const sc = m[0] + (m[1] - m[0]) * p;
        const xT = m[2] + (m[3] - m[2]) * p;
        const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * sc;
        const dw = img.naturalWidth * s;
        const dh = img.naturalHeight * s;
        ctx.drawImage(img, (w - dw) * xT, (h - dh) / 2, dw, dh);
      };

      const t00 = performance.now();
      const frame = (now: number) => {
        const t = Math.max(0, now - t00) / 1000;
        if (first) {
          ctx.globalAlpha = 1;
          shootAt(t);
        } else {
          ctx.globalAlpha = SAMPLE_ALPHA;
          for (let k = 1; k <= SAMPLES; k++)
            shootAt(tPrev + ((t - tPrev) * k) / SAMPLES);
        }
        tPrev = t;
        if (first || now >= nextPresent) {
          out.drawImage(acc, 0, 0);
          nextPresent = Math.max(nextPresent + 1000 / FPS, now);
        }
        first = false;
        reelRaf = requestAnimationFrame(frame);
      };
      reelRaf = requestAnimationFrame(frame);
    }

    function setMode() {
      const on = live.matches;
      root.classList.toggle("is-live", on);
      if (!on) {
        setReel(false);
        page.style.clipPath = "";
        page.style.visibility = "";
        page.style.pointerEvents = "";
        last = -1;
        return;
      }
      apply();
    }

    live.addEventListener("change", setMode, { signal });
    addEventListener("scroll", () => live.matches && schedule(), {
      passive: true,
      signal,
    });
    addEventListener(
      "resize",
      () => {
        if (!live.matches) return;
        const was = playing;
        setReel(false);
        if (was) setReel(true);
        schedule();
      },
      { signal },
    );
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(reelRaf);
    });
    setMode();
  }

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
  };
}
