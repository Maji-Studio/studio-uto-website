import { BEARING, INK_HEIGHT, fitO, inkWidth } from "@/lib/o-glyph";
import type { Axes, Rect } from "@/lib/o-glyph";

export function initOClock(): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const cleanups: Array<() => void> = [];

  // A light O with thin top/bottom strokes: the tallest counter the font gives.
  const CLOCK_AXES: Axes = { wght: 14, cont: 100 };
  const OPEN_MS = 760;
  const CLOSE_MS = 560;
  const DIGITS_DELAY = 420; // on open, the level and scale lead the time
  const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"; // the chip hover fill
  const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)"; // the page transition

  const trigger = document.getElementById("today");
  const logoO = document.querySelectorAll<HTMLElement>(".logo > span")[2];
  const root = document.querySelector<HTMLElement>(".o-clock");

  if (trigger && logoO && root) {
    const glyph = root.querySelector<HTMLElement>(".o-clock__o")!;
    const win = root.querySelector<HTMLElement>(".o-clock__window")!;
    const face = root.querySelector<HTMLElement>(".o-clock__face")!;
    const ink = root.querySelector<HTMLElement>(".o-clock__layer--ink")!;
    const times = root.querySelectorAll<HTMLElement>(".o-clock__time");
    const scaleMarks = root.querySelectorAll<HTMLElement>(
      ".o-clock__scale > [data-i]",
    );
    const closeBtn = root.querySelector<HTMLElement>(".o-clock__close")!;

    const reducedMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const px = (n: number) => `${n}px`;
    const pad = (n: number) => String(n).padStart(2, "0");
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    // EASE_IN_OUT, for the rAF-driven zoom.
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let state: "closed" | "opening" | "open" | "closing" = "closed";
    let rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
    let axes: Axes = CLOCK_AXES;
    let timer = 0;
    cleanups.push(() => window.clearTimeout(timer));
    let lastSecond = -1;

    // ── The O ────────────────────────────────────────────────────────────────

    const viewport = (): Rect => ({
      x: 0,
      y: 0,
      w: root.clientWidth,
      h: root.clientHeight,
    });

    // Where the wordmark's O ink sits right now, and its axes (both change with
    // the logo's fit and hover).
    const logoInk = (): { rect: Rect; axes: Axes } => {
      const r = logoO.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(logoO).fontSize);
      const fvs = logoO.style.fontVariationSettings;
      const axis = (tag: string, fallback: number) => {
        const m = fvs.match(new RegExp(`"${tag}"\\s+([\\d.]+)`));
        return m ? parseFloat(m[1]) : fallback;
      };
      const m = logoO.style.transform.match(/scaleX\(([\d.]+)\)/);
      const sx = m ? parseFloat(m[1]) : 1;
      return {
        rect: {
          x: r.left + BEARING * fs * sx,
          y: r.top,
          w: inkWidth(axis("wdth", 100) / 100) * fs * sx,
          h: INK_HEIGHT * fs,
        },
        axes: { wght: axis("wght", 100), cont: axis("CONT", 50) },
      };
    };

    // Set the glyph onto a box, with the white counter behind it.
    const setO = (r: Rect, a: Axes) => {
      rect = r;
      axes = a;
      const fit = fitO(r, a);
      glyph.style.fontSize = px(fit.fs);
      glyph.style.fontVariationSettings = `"wght" ${a.wght}, "wdth" ${fit.wdth}, "CONT" ${a.cont}`;
      glyph.style.left = px(r.x - BEARING * fit.fs * fit.sx);
      glyph.style.top = px(r.y);
      glyph.style.transform = `scaleX(${fit.sx})`;
      // Tuck the window a few px under the ink so no page shows at the seam.
      const seam = Math.min(3, fit.cap / 3, fit.side / 3);
      const c = fit.counter;
      Object.assign(win.style, {
        left: px(c.x - seam),
        top: px(c.y - seam),
        width: px(c.w + 2 * seam),
        height: px(c.h + 2 * seam),
      });
      Object.assign(face.style, {
        left: px(c.x),
        top: px(c.y),
        width: px(c.w),
        height: px(c.h),
      });
      root.style.setProperty("--cap", px(fit.cap));
      root.style.setProperty("--side", px(fit.side));
    };

    const zoom = (
      from: { rect: Rect; axes: Axes },
      to: () => { rect: Rect; axes: Axes },
      ms: number,
    ) =>
      new Promise<void>((resolve) => {
        const t0 = performance.now();
        const frame = (now: number) => {
          const t = reducedMotion() ? 1 : Math.min(1, (now - t0) / ms);
          const p = easeInOut(t);
          const end = to();
          setO(
            {
              x: lerp(from.rect.x, end.rect.x, p),
              y: lerp(from.rect.y, end.rect.y, p),
              w: lerp(from.rect.w, end.rect.w, p),
              h: lerp(from.rect.h, end.rect.h, p),
            },
            {
              wght: lerp(from.axes.wght, end.axes.wght, p),
              cont: lerp(from.axes.cont, end.axes.cont, p),
            },
          );
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });

    // ── The face ─────────────────────────────────────────────────────────────

    // Each character sits in its own slot, clipped top and bottom. A new
    // character rises in from below and the one it replaces leaves upward, so
    // after the opening roll only the digits that change move.
    const roll = (box: HTMLElement, text: string, enter: boolean) => {
      const chars = [...text];
      while (box.children.length < chars.length) {
        const slot = document.createElement("span");
        slot.className = "o-clock__slot";
        box.append(slot);
      }
      chars.forEach((ch, i) => {
        const slot = box.children[i] as HTMLElement;
        const cur = slot.querySelector<HTMLElement>(
          ":scope > span:not(.is-leaving)",
        );
        if (cur?.textContent === ch) return;

        const next = document.createElement("span");
        next.textContent = ch;
        slot.append(next);
        if (reducedMotion()) {
          cur?.remove();
          return;
        }
        next.animate(
          [{ transform: "translateY(105%)" }, { transform: "translateY(0)" }],
          {
            duration: enter ? 760 : 560,
            delay: enter ? DIGITS_DELAY + i * 70 : 0,
            easing: EASE_OUT,
            fill: "backwards",
          },
        );
        if (cur) {
          cur.classList.add("is-leaving");
          cur
            .animate(
              [
                { transform: "translateY(0)" },
                { transform: "translateY(-105%)" },
              ],
              { duration: 560, easing: EASE_OUT, fill: "forwards" },
            )
            .finished.then(() => cur.remove());
        }
      });
    };

    // Scale marks slide in from (or out to) the right edge; the labels sit 44px
    // in, so they travel that much further.
    const scaleOffset = (el: HTMLElement) =>
      el.tagName === "B" ? "translateX(calc(100% + 44px))" : "translateX(100%)";

    const show = (now: Date, enter: boolean) => {
      const s = now.getSeconds();
      // Both layers roll the same characters on the same frame, so the inverted
      // copy under the level stays locked to the one above it.
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      times.forEach((box) => roll(box, time, enter));

      // The level eases up a step each second and drops instantly at :00.
      const level = `inset(${(1 - s / 60) * 100}% 0 0 0)`;
      ink.style.transition = enter || s < lastSecond ? "none" : "";
      ink.style.clipPath = level;
      lastSecond = s;

      if (enter && !reducedMotion()) {
        ink.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: level }], {
          duration: 900,
          easing: EASE_OUT,
          fill: "backwards",
        });
        scaleMarks.forEach((el) => {
          el.animate([{ transform: scaleOffset(el) }, { transform: "none" }], {
            duration: 420,
            delay: Number(el.dataset.i) * 9,
            easing: EASE_OUT,
            fill: "backwards",
          });
        });
      }
    };

    // The opening in reverse: the time drops out right to left, then the scale
    // slides out top to bottom while the level drains.
    const leave = async () => {
      if (reducedMotion()) return;
      const out = { easing: EASE_IN_OUT, fill: "forwards" as FillMode };
      const anims: Animation[] = [];

      times.forEach((box) => {
        const slots = [...box.children];
        slots.forEach((slot, i) => {
          slot.querySelectorAll(":scope > span").forEach((ch) => {
            anims.push(
              ch.animate(
                [
                  { transform: "translateY(0)" },
                  { transform: "translateY(105%)" },
                ],
                { ...out, duration: 380, delay: (slots.length - 1 - i) * 40 },
              ),
            );
          });
        });
      });
      scaleMarks.forEach((el) => {
        anims.push(
          el.animate([{ transform: "none" }, { transform: scaleOffset(el) }], {
            ...out,
            duration: 300,
            delay: 180 + (60 - Number(el.dataset.i)) * 4,
          }),
        );
      });
      anims.push(
        ink.animate(
          [
            { clipPath: getComputedStyle(ink).clipPath },
            { clipPath: "inset(100% 0 0 0)" },
          ],
          { ...out, duration: 480, delay: 180 },
        ),
      );

      await Promise.all(anims.map((a) => a.finished));
    };

    const resetFace = () => {
      face.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      times.forEach((box) => box.replaceChildren());
      ink.style.clipPath = "";
      lastSecond = -1;
    };

    // Re-render on each second boundary.
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          show(new Date(), false);
          schedule();
        },
        1000 - (Date.now() % 1000),
      );
    };

    // ── Open / close ─────────────────────────────────────────────────────────

    const open = async () => {
      if (state !== "closed") return;
      state = "opening";
      const from = logoInk();
      root.hidden = false;
      root.dataset.state = "opening";
      setO(from.rect, from.axes);
      logoO.style.visibility = "hidden";
      trigger.setAttribute("aria-expanded", "true");

      await zoom(from, () => ({ rect: viewport(), axes: CLOCK_AXES }), OPEN_MS);

      state = "open";
      root.dataset.state = "open";
      face.hidden = false;
      show(new Date(), true);
      schedule();
      closeBtn.focus({ preventScroll: true });
    };

    const close = async () => {
      if (state !== "open") return;
      state = "closing";
      window.clearTimeout(timer);
      root.dataset.state = "closing";

      await leave();
      // Hide before resetting, so the scale doesn't snap back in while the O
      // shrinks.
      face.hidden = true;
      resetFace();
      await zoom({ rect, axes }, logoInk, CLOSE_MS);

      logoO.style.visibility = "";
      root.hidden = true;
      root.dataset.state = "closed";
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus({ preventScroll: true });
      state = "closed";
    };

    // The header date becomes a button; the O opens the clock too.
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", open, { signal });
    trigger.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      },
      { signal },
    );
    logoO.addEventListener("click", open, { signal });

    root.addEventListener("click", close, { signal });
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") close();
      },
      { signal },
    );
    // Keep the page (and the logo the O returns to) from scrolling underneath.
    const block = (e: Event) => e.preventDefault();
    root.addEventListener("wheel", block, { passive: false, signal });
    root.addEventListener("touchmove", block, { passive: false, signal });

    window.addEventListener(
      "resize",
      () => {
        if (state === "open") setO(viewport(), CLOCK_AXES);
      },
      { signal },
    );
  }

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
  };
}
