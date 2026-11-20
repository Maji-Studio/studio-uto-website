// The way in from the homepage: the hero photo and the model are one picture
// seen from one spot, and the camera backs out of the room to the film's
// first shot. This file holds the geometry: where the photo was taken from,
// the camera's path, and how the photo stays pinned in the room on the way.
import type { Pose } from "./scenarios";
import {
  add,
  axes,
  dot,
  framed,
  scale,
  shifted,
  type Shot,
  sub,
  type Vec,
} from "./shots";

/** Where the hero photo was taken from, for its full 3:2 frame. Solved from the photo's vanishing lines and the room's corners (studio-3d/photo_solve.py). */
export const PHOTO: Pose = {
  position: [2.0134, 1.2385, 2.7928],
  target: [-4.9073, 1.8173, -1.1783],
  fov: 51.5281,
  roll: 0.9135,
};
const PHOTO_ASPECT = 3 / 2;

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const geo = (a: number, b: number, k: number) => a * (b / a) ** k;

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** 0 before `from`, 1 after `to`, straight in between. */
export const span = (t: number, from: number, to: number) =>
  clamp01((t - from) / (to - from));
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** The photo's pose for a box of this aspect that shows the photo with object-fit: cover, centred: a wider box crops top and bottom, so the vertical angle narrows; a narrower one keeps it. */
export function matched(aspect: number): Pose {
  const tan = Math.tan(rad(PHOTO.fov) / 2) * Math.min(1, PHOTO_ASPECT / aspect);
  return { ...PHOTO, fov: deg(2 * Math.atan(tan)) };
}

function polar(pose: Pose) {
  const back = sub(pose.position, pose.target);
  const distance = Math.hypot(...back);
  return {
    distance,
    around: Math.atan2(back[0], back[2]),
    fromTop: Math.acos(back[1] / distance),
    tan: Math.tan(rad(pose.fov) / 2),
  };
}

/** The pose a fraction `k` of the way from `a` to `b`. The lens and the picture's size at the target both change evenly, so the subject never shrinks and grows again on the way: the wide room flattens into the long-lens maquette while the camera backs out. */
function between(a: Pose, b: Pose, k: number): Pose {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const from = polar(a);
  const to = polar(b);
  const tan = geo(from.tan, to.tan, k);
  const height = geo(from.distance * from.tan, to.distance * to.tan, k);
  const distance = height / tan;
  const around = mix(from.around, to.around, k);
  const fromTop = mix(from.fromTop, to.fromTop, k);
  const target: Vec = [
    mix(a.target[0], b.target[0], k),
    mix(a.target[1], b.target[1], k),
    mix(a.target[2], b.target[2], k),
  ];
  return {
    target,
    position: [
      target[0] + distance * Math.sin(fromTop) * Math.sin(around),
      target[1] + distance * Math.cos(fromTop),
      target[2] + distance * Math.sin(fromTop) * Math.cos(around),
    ],
    fov: deg(2 * Math.atan(tan)),
    // The photo's slight tilt is gone early, while the frame still opens.
    roll: mix(a.roll ?? 0, b.roll ?? 0, Math.min(1, k * 4)),
  };
}

/** The camera a fraction `k` of the way from the photo's viewpoint to a shot. The model stays in the middle of the picture on the way and slides to the shot's own place late, once it is small enough not to be cut off. */
export function way(start: Pose, shot: Shot, aspect: number, k: number): Pose {
  const frame = aspect >= 1 ? shot.wide : shot.tall;
  const centre = { ...frame, at: [0.5, 0.5] as [number, number] };
  const end = framed({ ...shot, wide: centre, tall: centre }, aspect);
  return shifted(between(start, end, k), aspect, frame.at, k ** 3);
}

// ── The photo as a plane in the room ─────────────────────────────────────

/** The room's four corners of a rectangle given in the pixels of a `width` by `height` picture taken from `pose`, at its target's distance: top left, top right, bottom right, bottom left. The photo hangs there while the camera leaves. */
export function hung(
  pose: Pose,
  width: number,
  height: number,
  rect: Rect,
): Vec[] {
  const { right, up, distance } = axes(pose);
  const high = distance * Math.tan(rad(pose.fov) / 2);
  const wide = high * (width / height);
  const corner = (x: number, y: number) =>
    add(
      pose.target,
      add(
        scale(right, ((x / width) * 2 - 1) * wide),
        scale(up, (1 - (y / height) * 2) * high),
      ),
    );
  const r = rect.left + rect.width;
  const b = rect.top + rect.height;
  return [
    corner(rect.left, rect.top),
    corner(r, rect.top),
    corner(r, b),
    corner(rect.left, b),
  ];
}

/** Where a point in the room lands in a `width` by `height` picture taken from `pose`. Null when it is behind the camera. */
function project(
  pose: Pose,
  width: number,
  height: number,
  point: Vec,
): [number, number] | null {
  const { forward, right, up } = axes(pose);
  const from = sub(point, pose.position);
  const depth = dot(from, forward);
  if (depth <= 0.01) return null;
  const tan = Math.tan(rad(pose.fov) / 2);
  const x = dot(from, right) / (depth * tan * (width / height));
  const y = dot(from, up) / (depth * tan);
  return [(x * 0.5 + 0.5) * width, (0.5 - y * 0.5) * height];
}

/** The CSS transform (origin top left) that lays an element of `size` onto the room's `corners` as `pose` sees them in a `width` by `height` picture. Null when a corner is behind the camera. */
export function pinned(
  corners: Vec[],
  pose: Pose,
  width: number,
  height: number,
  size: { width: number; height: number },
): string | null {
  const points = corners.map((c) => project(pose, width, height, c));
  if (points.some((p) => !p)) return null;
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points as [number, number][];
  // The projective map from the unit square to the four points (Heckbert).
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 1e-9) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const n = (v: number) => (Math.abs(v) < 1e-10 ? 0 : v);
  return `matrix3d(${[
    a / size.width,
    d / size.width,
    0,
    g / size.width,
    b / size.height,
    e / size.height,
    0,
    h / size.height,
    0,
    0,
    1,
    0,
    x0,
    y0,
    0,
    1,
  ]
    .map(n)
    .join(",")})`;
}

// ── The photo in its two frames ──────────────────────────────────────────

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where object-fit: cover draws an image of `aspect` in a box, with the object-position given as fractions. */
export function covered(
  box: Rect,
  aspect: number,
  at: [number, number] = [0.5, 0.5],
): Rect {
  const width = Math.max(box.width, box.height * aspect);
  const height = width / aspect;
  return {
    left: box.left + (box.width - width) * at[0],
    top: box.top + (box.height - height) * at[1],
    width,
    height,
  };
}

export const mixRect = (a: Rect, b: Rect, k: number): Rect => ({
  left: mix(a.left, b.left, k),
  top: mix(a.top, b.top, k),
  width: mix(a.width, b.width, k),
  height: mix(a.height, b.height, k),
});
