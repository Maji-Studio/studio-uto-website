/*
 * The lightbox's pointer label. Over the image band the pointer turns into a
 * small paper chip that reads "Previous (03/08)" on the left half and
 * "Next (05/08)" on the right, trailing the pointer a touch behind.
 *
 * It rises in from its bottom edge where the pointer enters the band and
 * lifts off upwards where it leaves (the chip hover's motion). When its text
 * changes, each part that differs rolls to the new value (up towards next,
 * down towards previous) while its width eases to fit. Crossing the middle
 * morphs one label into the other instead of swapping it.
 *
 * Expects a root holding a `[data-step-label-chip]`, inside which each
 * `[data-step-label-slot]` holds one span with the current value.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ROLL_MS = 420;
const CLIP_MS = 260;
// The label closes ~63% of its gap to the pointer every TRAIL_MS.
const TRAIL_MS = 40;

const SHOWN = "inset(0 0 0 0)";
const BELOW = "inset(100% 0 0 0)";
const ABOVE = "inset(0 0 100% 0)";

export function mountStepLabel(root: HTMLElement) {
  const chip = root.querySelector<HTMLElement>("[data-step-label-chip]")!;
  const slots = Array.from(
    root.querySelectorAll<HTMLElement>("[data-step-label-slot]"),
  );
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  // `visible`: meant to be up. `painted`: on screen at all, lifting off included.
  let visible = false;
  const painted = () => root.hasAttribute("data-shown");

  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let frame = 0;
  let last = 0;

  const place = () => {
    root.style.translate = `${x}px ${y}px`;
  };

  const tick = (now: number) => {
    const k = 1 - Math.exp(-Math.max(0, now - last) / TRAIL_MS);
    last = now;
    x += (tx - x) * k;
    y += (ty - y) * k;
    if (Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1) {
      x = tx;
      y = ty;
      frame = 0;
    } else frame = requestAnimationFrame(tick);
    place();
  };

  const follow = () => {
    if (reduced.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      x = tx;
      y = ty;
      place();
    } else if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  // One clip animation at a time, each starting where the last one stood.
  let clip: Animation | null = null;
  const animateClip = (from: string, to: string) => {
    clip?.cancel();
    clip = chip.animate([{ clipPath: from }, { clipPath: to }], {
      duration: CLIP_MS,
      easing: EASE,
      fill: "forwards",
    });
    return clip;
  };

  const show = (px: number, py: number) => {
    tx = px;
    ty = py;
    if (!visible) {
      visible = true;
      const from = painted() ? getComputedStyle(chip).clipPath : BELOW;
      if (!painted()) {
        // Appear at the pointer rather than trail in from the last exit.
        x = tx;
        y = ty;
        place();
      }
      root.setAttribute("data-shown", "");
      if (reduced.matches) clip?.cancel();
      else animateClip(from, SHOWN);
    }
    follow();
  };

  const hide = (instant = false) => {
    if (instant || reduced.matches) {
      visible = false;
      clip?.cancel();
      clip = null;
      root.removeAttribute("data-shown");
      return;
    }
    if (!visible) return;
    visible = false;
    const anim = animateClip(getComputedStyle(chip).clipPath, ABOVE);
    anim.finished.then(
      () => {
        if (clip !== anim) return;
        anim.cancel();
        clip = null;
        root.removeAttribute("data-shown");
      },
      () => {},
    );
  };

  const span = (text: string) => {
    const s = document.createElement("span");
    s.textContent = text;
    return s;
  };

  // Roll one slot to `text`; dir 1 rolls up, -1 down.
  const roll = (slot: HTMLElement, text: string, dir: number) => {
    const current = slot.lastElementChild as HTMLElement;
    if (current.textContent === text) return;
    if (!painted() || reduced.matches) {
      for (const a of slot.getAnimations({ subtree: true })) a.cancel();
      slot.replaceChildren(span(text));
      return;
    }
    const from = slot.getBoundingClientRect().width;
    const leaving = getComputedStyle(current).translate;
    for (const a of slot.getAnimations()) a.cancel();
    current.dataset.leaving = "";
    const next = span(text);
    slot.append(next);
    const to = next.getBoundingClientRect().width;

    const timing = { duration: ROLL_MS, easing: EASE };
    slot.animate({ width: [`${from}px`, `${to}px`] }, timing);
    next.animate({ translate: [`0 ${dir * 100}%`, "0 0"] }, timing);
    current
      .animate(
        {
          translate: [leaving === "none" ? "0 0" : leaving, `0 ${-dir * 100}%`],
        },
        { ...timing, fill: "forwards" },
      )
      .finished.then(
        () => current.remove(),
        () => {},
      );
  };

  return {
    /** Point the label at (x, y), rising in if it isn't up yet. */
    show,
    /** Lift the label off, or drop it at once (before a snapshot is taken). */
    hide,
    /** Set each slot's text in order, rolling the ones that change. */
    set(texts: string[], dir: number) {
      slots.forEach((slot, i) => roll(slot, texts[i], dir));
    },
  };
}
