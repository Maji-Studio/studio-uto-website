/*
 * The lightbox's prev/next arrow, which runs round a cylinder into the page.
 *
 * At rest the arrow sits flat and square (as long as it is tall) at the inner
 * end of its button, so prev and next meet in the middle as a split ←→; the
 * rest of the button is hover area.
 *
 * An unseen upright cylinder stands at the arrow's tip. Hovering pushes the
 * arrow part-way onto it while the tail holds: the shaft draws out and the
 * head bends round the curve, its tip still in plain view, until the pointer
 * leaves and it eases back flat. Presses don't animate it.
 *
 * A stretched SVG can't do this, because the shape bends. So it is laid out
 * flat along its line of travel, cut at the cylinder's silhouette, then
 * wrapped onto the cylinder and projected point by point. Lit from the viewer, it darkens as
 * the cylinder turns away and is black by the silhouette, so it fades out of
 * sight rather than stopping at a cut. Drawn pointing right; the CSS
 * mirrors prev.
 */

// Proportions, in arrow heights.
const STROKE = 0.13;
const LENGTH = 1;
const RADIUS = 0.9;
const EYE = 2; // viewer's distance in front of the page
const SPLIT = 0.14; // space between the prev and next tails

// The cylinder turns away from the viewer until its silhouette; past that
// angle the arrow is behind it.
const LIMIT = Math.acos(RADIUS / (EYE + RADIUS));

// Rest positions along the line of travel, in heights from the button's inner
// edge (the middle of the nav). The cylinder stands at the tip.
const REST = { tail: SPLIT / 2, head: SPLIT / 2 + LENGTH };
const SILHOUETTE = REST.head + RADIUS * LIMIT;

// How far the head travels on hover: its tip under half-way round to the
// silhouette, where it is still bright.
const BEND = 0.45 * RADIUS * LIMIT;
const BEND_MS = 420;

type Pt = [number, number];

const outQuint = (t: number) => 1 - (1 - t) ** 5;
const inOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

// An open 90° head whose miter tip sits at `tip`, in px. Clockwise.
const chevron = (tip: number, h: number): Pt[] => {
  const w = (STROKE * h) / 2;
  const n = w / Math.SQRT2;
  const corner = tip - w * Math.SQRT2; // centreline corner
  const arm = h / 2 - n; // centreline reach of each arm, in x and in y
  const back = corner - arm;
  return [
    [back + n, -arm - n],
    [tip, 0],
    [back + n, arm + n],
    [back - n, arm - n],
    [corner - w * Math.SQRT2, 0],
    [back - n, -arm + n],
  ];
};

// Flat outline, in px: the shaft into the head. Both clockwise, so they fill
// as one shape.
const outline = (tail: number, head: number, h: number): Pt[][] => {
  const w = (STROKE * h) / 2;
  const corner = head - w * Math.SQRT2;
  return [
    [
      [tail, -w],
      [corner, -w],
      [corner, w],
      [tail, w],
    ],
    chevron(head, h),
  ];
};

// Keep the part of `poly` on one side of the vertical line x = `edge`
// (side 1: right of it, -1: left of it).
const clipX = (poly: Pt[], edge: number, side: 1 | -1): Pt[] => {
  const out: Pt[] = [];
  const inside = (p: Pt) => (p[0] - edge) * side >= 0;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    if (inside(p)) out.push(p);
    if (inside(p) !== inside(q)) {
      const k = (edge - p[0]) / (q[0] - p[0]);
      out.push([edge, p[1] + k * (q[1] - p[1])]);
    }
  });
  return out;
};

let uid = 0;

export function mountCylinderArrow(button: HTMLElement) {
  const svg = button.querySelector<SVGSVGElement>("svg");
  const path = svg?.querySelector("path");
  const grad = svg?.querySelector("linearGradient");
  if (!svg || !path || !grad) return { reset: () => {} };

  const id = `cylinder-arrow-${++uid}`;
  grad.id = id;
  path.setAttribute("fill", `url(#${id})`);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let h = 0;
  let travel = 0; // the head's, from rest, in heights
  let hovered = false;

  const draw = () => {
    if (!h) return;
    const px = (v: number) => v * h;
    const x0 = px(REST.head); // where the page meets the cylinder
    const r = RADIUS * h;
    const eye = EYE * h;

    const project = ([x, y]: Pt): Pt => {
      if (x <= x0) return [x, h / 2 + y];
      const a = (x - x0) / r;
      const k = eye / (eye + r * (1 - Math.cos(a)));
      return [x0 + r * Math.sin(a) * k, h / 2 + y * k];
    };

    const hi = px(SILHOUETTE);
    let d = "";
    for (const poly of outline(px(REST.tail), px(REST.head + travel), h)) {
      const cut = clipX(poly, hi, -1);
      if (cut.length < 3) continue;
      cut.forEach((p, i) => {
        const q = cut[(i + 1) % cut.length];
        // Edges on the cylinder are bent, so walk them in small steps.
        const bent = Math.max(p[0], q[0]) > x0;
        const steps = bent ? Math.ceil(Math.abs(q[0] - p[0]) / 2) || 1 : 1;
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          const [x, y] = project([
            p[0] + (q[0] - p[0]) * t,
            p[1] + (q[1] - p[1]) * t,
          ]);
          d += `${i || s ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
        }
      });
      d += "Z";
    }
    path.setAttribute("d", d);

    // Shading is the cylinder's facing ratio to the viewer: 1 where it meets
    // the page, 0 at the silhouette. Spread across the width it occupies on
    // screen.
    const end = project([px(SILHOUETTE), 0])[0];
    grad.setAttribute("x1", String(x0));
    grad.setAttribute("x2", String(end));
    grad.replaceChildren(
      ...Array.from({ length: 7 }, (_, i) => {
        const a = (LIMIT * i) / 6;
        const stop = document.createElementNS(svg.namespaceURI, "stop");
        const at = (project([x0 + a * r, 0])[0] - x0) / (end - x0 || 1);
        stop.setAttribute("offset", String(at));
        stop.setAttribute("stop-color", "currentColor");
        const facing =
          (Math.cos(a) * (EYE + RADIUS) - RADIUS) /
          Math.hypot(RADIUS * Math.sin(a), EYE + RADIUS * (1 - Math.cos(a)));
        stop.setAttribute("stop-opacity", String(Math.max(0, facing)));
        return stop;
      }),
    );
  };

  // Ease part-way on (hovered) or back flat, from wherever it is; a new call
  // takes over from one still running.
  let frame = 0;
  const bend = (on: boolean) => {
    cancelAnimationFrame(frame);
    if (reduced.matches) return;
    const from = travel;
    const to = on ? BEND : 0;
    const ease = on ? outQuint : inOutCubic;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / BEND_MS);
      travel = from + (to - from) * ease(t);
      draw();
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  // Hover is tracked from the pointer's position rather than enter/leave
  // events: while a view transition runs (every step), hit-testing goes to the
  // transition overlay and the button would see a spurious leave and re-enter.
  const hover = (on: boolean) => {
    if (on === hovered) return;
    hovered = on;
    bend(on);
  };
  const over = (e: PointerEvent) => {
    const r = button.getBoundingClientRect();
    return (
      e.clientX >= r.left &&
      e.clientX < r.right &&
      e.clientY >= r.top &&
      e.clientY < r.bottom
    );
  };
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") hover(over(e));
  });
  document.documentElement.addEventListener("mouseleave", () => hover(false));

  new ResizeObserver(([entry]) => {
    h = entry.contentRect.height;
    draw();
  }).observe(svg);

  // Back to rest at once, e.g. when the viewer closes.
  const reset = () => {
    cancelAnimationFrame(frame);
    hovered = false;
    travel = 0;
    draw();
  };
  reduced.addEventListener("change", () => {
    if (reduced.matches) reset();
  });
  return { reset };
}
