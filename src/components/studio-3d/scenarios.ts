// The four light scenarios the page offers, and the camera pose type the
// shots use. Channels are what a scenario sets; every value fades, none snaps.
export interface Channels {
  /** Daylight through the window front, 0–1. */
  sun: number;
  /** Shadowless fill from the haze, 0–1. */
  sky: number;
  /** The four ceiling luminaires over table and kitchen, 0–1. */
  tubes: number;
  /** One spot from the truss onto the shooting wall, 0–1. */
  spot: number;
  /** Glow behind the window front, for silhouettes, 0–1. */
  back: number;
  /** Black molton drawn across the shooting bay's windows, 0 open – 1 closed. */
  molton: number;
  /** How far the daylight has turned to evening orange, 0–1. */
  warm: number;
  /** The film set in front of the shooting wall, with its own two lamps, 0–1. */
  set: number;
  /** The long table set for an event on the shooting floor instead of the stool, 0–1. */
  event: number;
  /** Colour of the haze and the ground. */
  fog: string;
  exposure: number;
}

export type ScenarioId = "tag" | "abend" | "dunkel" | "event";

export interface Scenario {
  id: ScenarioId;
  label: string;
  /** One line for the page, in the site's voice. */
  line: string;
  /** True when the haze is dark, so the page sets light text. */
  dark: boolean;
  channels: Channels;
}

export const scenarios: Scenario[] = [
  {
    id: "tag",
    label: "Tag",
    line: "Tageslicht über die ganze Fensterfront.",
    dark: false,
    channels: {
      sun: 1,
      sky: 1,
      tubes: 0,
      spot: 0,
      set: 0,
      back: 0.35,
      molton: 0,
      warm: 0,
      event: 0,
      fog: "#a9a9a6",
      exposure: 1,
    },
  },
  {
    id: "abend",
    label: "Abendsonne",
    line: "Abendsonne flach durch den ganzen Raum.",
    dark: false,
    channels: {
      sun: 1,
      sky: 0.3,
      tubes: 0,
      spot: 0,
      set: 0,
      back: 0.55,
      molton: 0,
      warm: 1,
      event: 0,
      fog: "#c98f66",
      exposure: 1,
    },
  },
  {
    id: "dunkel",
    label: "Shooting",
    line: "Alle Vorhänge zu, alle Lichter an.",
    dark: true,
    channels: {
      sun: 0,
      sky: 0.06,
      tubes: 0.3,
      spot: 1,
      set: 1,
      back: 0,
      molton: 1,
      warm: 0,
      event: 0,
      fog: "#2b4c8c",
      exposure: 0.85,
    },
  },
  {
    id: "event",
    label: "Event",
    line: "Eine lange Tafel, zwölf Plätze.",
    dark: true,
    channels: {
      sun: 0,
      sky: 0.22,
      tubes: 0.07,
      spot: 0,
      set: 0,
      back: 0.1,
      molton: 0,
      warm: 0,
      event: 1,
      fog: "#6a6134",
      exposure: 1,
    },
  },
];

export const scenarioById = (id: ScenarioId) =>
  scenarios.find((s) => s.id === id)!;

// ── Camera ───────────────────────────────────────────────────────────────
export interface Pose {
  position: [number, number, number];
  target: [number, number, number];
  /** Vertical field of view in degrees. Small values give the long-lens look. */
  fov: number;
  /** Degrees the picture is tilted around the view axis. Only the hero photo's own pose has any. */
  roll?: number;
}
