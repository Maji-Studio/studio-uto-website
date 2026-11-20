// The film's camera: one shot per scene, and how a shot is framed for the
// stage's shape.
import type { Pose, ScenarioId } from "./scenarios";

/** Where the subject lands on screen. The camera backs off until `fit` metres show from left to right and `rise` metres from top to bottom; `at` is the screen fraction (left, top) the pose's target moves to. */
export interface Frame {
  fit: number;
  rise?: number;
  at: [number, number];
}
export interface Shot {
  pose: Pose;
  /** Landscape screens: the subject right of centre, the line to its left. */
  wide: Frame;
  /** Portrait screens: the subject between the header and the line. */
  tall: Frame;
  /** The camera stands in the room. It cannot back off through a wall, so the lens widens to fit the frame and the camera steps sideways to place the subject, and a drag looks around instead of circling the model. */
  inside?: boolean;
}

// The widest lens an inside shot may take before the room starts to bend.
const WIDEST = 84;

// The stage fills the whole screen behind the page, so every `at` leaves room
// for the header above the subject and for the line below or beside it.
export const shots: Record<ScenarioId, Shot> = {
  tag: {
    // Square on to the open side, long lens: the set on its slab.
    pose: { position: [3, 11, 80], target: [0, 2.3, 0], fov: 12 },
    wide: { fit: 30, rise: 14, at: [0.7, 0.47] },
    tall: { fit: 17, at: [0.5, 0.45] },
  },
  abend: {
    // From above the kitchen corner.
    pose: { position: [36, 30, 50], target: [0, 1.6, 0], fov: 12 },
    wide: { fit: 36, rise: 22, at: [0.68, 0.55] },
    tall: { fit: 21, at: [0.5, 0.47] },
  },
  dunkel: {
    // From the east, over the kitchen: the whole shooting wall with the
    // set at its foot.
    pose: { position: [61, 34.7, 34.3], target: [-3.5, 2.2, 0], fov: 12 },
    wide: { fit: 34, rise: 20, at: [0.66, 0.52] },
    tall: { fit: 19, at: [0.5, 0.47] },
  },
  event: {
    // High three-quarter view down onto the shooting floor and the table.
    pose: { position: [7, 50, 36], target: [-3.5, 0.6, 0.2], fov: 12 },
    wide: { fit: 30, rise: 21, at: [0.63, 0.58] },
    tall: { fit: 15, rise: 36, at: [0.5, 0.52] },
  },
};

export type Vec = [number, number, number];
export const add = (a: Vec, b: Vec): Vec => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export const sub = (a: Vec, b: Vec): Vec => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
export const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const length = (a: Vec) => Math.hypot(a[0], a[1], a[2]);

/** The camera's own axes for a pose: forward, right and up, with the world's up as the reference. */
export function axes(pose: Pose) {
  const back = sub(pose.position, pose.target);
  const distance = length(back);
  const forward = scale(back, -1 / distance);
  const flat = Math.hypot(forward[0], forward[2]) || 1;
  const level: Vec = [-forward[2] / flat, 0, forward[0] / flat];
  const plumb: Vec = [
    level[1] * forward[2] - level[2] * forward[1],
    level[2] * forward[0] - level[0] * forward[2],
    level[0] * forward[1] - level[1] * forward[0],
  ];
  const roll = ((pose.roll ?? 0) * Math.PI) / 180;
  const right = add(scale(level, Math.cos(roll)), scale(plumb, Math.sin(roll)));
  const up = sub(scale(plumb, Math.cos(roll)), scale(level, Math.sin(roll)));
  return { forward, right, up, distance };
}

/** The pose moved sideways in its own picture plane, so that what it looks at lands at the screen fraction `at` (left, top) instead of the centre. `amount` scales the move, for doing it gradually. */
export function shifted(
  pose: Pose,
  aspect: number,
  at: [number, number],
  amount = 1,
): Pose {
  const { right, up, distance } = axes(pose);
  const height = 2 * distance * Math.tan((pose.fov * Math.PI) / 360);
  const move = add(
    scale(right, -(at[0] - 0.5) * height * aspect * amount),
    scale(up, (at[1] - 0.5) * height * amount),
  );
  return {
    ...pose,
    position: add(pose.position, move),
    target: add(pose.target, move),
  };
}

/** The shot's pose for a host of this aspect: backed off until the frame's metres show, then shifted in the picture plane so the subject lands at `at`. */
export function framed(shot: Shot, aspect: number): Pose {
  const { pose } = shot;
  const frame = aspect >= 1 ? shot.wide : shot.tall;
  const back = sub(pose.position, pose.target);
  if (shot.inside) {
    const tan =
      Math.max((frame.rise ?? 0) / 2, frame.fit / 2 / aspect) / length(back);
    const fov = Math.min(WIDEST, (Math.atan(tan) * 360) / Math.PI);
    return shifted({ ...pose, fov }, aspect, frame.at);
  }
  const natural =
    2 * length(back) * Math.tan((pose.fov * Math.PI) / 360) * aspect;
  const width = Math.max(natural, frame.fit, (frame.rise ?? 0) * aspect);
  const backed: Pose = {
    ...pose,
    position: add(pose.target, scale(back, width / natural)),
  };
  return shifted(backed, aspect, frame.at);
}

/** The pose swung around its target: `azimuth` degrees sideways, `elevation` degrees up, never below the floor's horizon. */
export function turned(pose: Pose, azimuth: number, elevation: number): Pose {
  const back = sub(pose.position, pose.target);
  const radius = length(back);
  const around = Math.atan2(back[0], back[2]) + (azimuth * Math.PI) / 180;
  const fromTop = Math.min(
    Math.PI / 2 - 0.03,
    Math.max(0.2, Math.acos(back[1] / radius) - (elevation * Math.PI) / 180),
  );
  return {
    ...pose,
    position: add(pose.target, [
      radius * Math.sin(fromTop) * Math.sin(around),
      radius * Math.cos(fromTop),
      radius * Math.sin(fromTop) * Math.cos(around),
    ]),
  };
}

/** The pose looking around from where it stands: `azimuth` degrees sideways, `elevation` degrees up. */
export function panned(pose: Pose, azimuth: number, elevation: number): Pose {
  const to = sub(pose.target, pose.position);
  const radius = length(to);
  const around = Math.atan2(to[0], to[2]) + (azimuth * Math.PI) / 180;
  const fromTop = Math.min(
    Math.PI - 0.2,
    Math.max(0.2, Math.acos(to[1] / radius) - (elevation * Math.PI) / 180),
  );
  return {
    ...pose,
    target: add(pose.position, [
      radius * Math.sin(fromTop) * Math.sin(around),
      radius * Math.cos(fromTop),
      radius * Math.sin(fromTop) * Math.cos(around),
    ]),
  };
}
