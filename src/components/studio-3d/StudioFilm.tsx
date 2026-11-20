// The film: one stage, four scenes to click through. Each scene is a new
// shot, with its own light and its own camera.
//
// On the homepage the film starts as the hero photo (`hero`). A click opens
// the photo's frame to the whole screen; the model stands behind it, seen
// from where the photo was taken, and the camera backs out of the room to the
// film's first shot while the photo fades. The page is the 3D page from then
// on (the address changes, Back runs the way in reverse).
"use client";

import { useEffect, useRef, useState } from "react";

import ContentImg from "@/components/site/ContentImg";
import type { ContentImage } from "@/lib/content/types";

import {
  covered,
  hung,
  easeInOut,
  matched,
  mixRect,
  pinned,
  type Rect,
  smooth,
  span,
  way,
} from "./flight";
import { type Pose, type ScenarioId, scenarios } from "./scenarios";
import { framed, panned, type Shot, shots, turned, type Vec } from "./shots";
import { useStage } from "./useStage";
import "./StudioFilm.css";

const HOME = "/";
const FILM = "/studio-3d/";
const FILM_TITLE = "Studio Tour";

// Without script the first scene stays: drop the controls, which would do nothing.
const noscript = ".film__dock,.film__next{display:none}";

// How far a drag may turn the model, in degrees either side of the shot.
const SWING = 40;
const LIFT = 22;
const DIP = 3;

// The way in, in milliseconds. The frame opens first; the camera is already
// leaving by then, slowly, so the two read as one move.
const WAY = 3800;
const OPEN = 950;
const LEAVE_FROM = 500;
// The model matches the photo from where it was taken, so the photo simply
// dissolves into it while the camera has hardly moved.
const FADE: [number, number] = [OPEN - 350, OPEN + 550];
// The model starts in the photo's colours and turns to card on the way out.
const LOOK: [number, number] = [OPEN + 250, 2900];
const ARRIVE = WAY - 900;
// Back is the same way, a little faster.
const RETURN_RATE = 1.3;

const HERO_SIZES = "(max-width: 720px) 190vw, 100vw";

/** The files the stage loads, fetched ahead on an idle moment. */
const stageFiles = [
  "studio-baked.glb",
  "bake.json",
  ...["sky", "fill", "sun", "evening", "tubes", "spot", "set"].flatMap(
    (layer) => [`${layer}.webp`, `ground-${layer}.webp`],
  ),
].map((file) => `/studio-3d/baked/${file}`);

type Phase =
  /** The hero photo, in the homepage. */
  | "photo"
  /** On the way between photo and film, either direction. */
  | "moving"
  /** The film. */
  | "film"
  /** The film's controls fade before the way back. */
  | "leaving";

const aspectOf = (element: HTMLElement) =>
  element.clientWidth / element.clientHeight;
const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
const nextFrame = () =>
  new Promise<number>((resolve) => requestAnimationFrame(resolve));

/** What one run of the way works with, measured when it starts. */
interface Way {
  /** The hero's frame on screen. */
  frame: Rect;
  /** Where the photo is drawn in that frame, and on the whole screen. */
  small: Rect;
  large: Rect;
  width: number;
  height: number;
  /** How far the page was scrolled; it returns to its top as the frame opens. */
  scroll: number;
  start: Pose;
  corners: Vec[];
  /** The shot the camera ends on. */
  shot: Shot;
}

export default function StudioFilm({ hero }: { hero?: ContentImage }) {
  const entry = Boolean(hero);
  const [phase, setPhase] = useState<Phase>(entry ? "photo" : "film");
  // The stage is a download of about 4 MB: on the homepage it waits until
  // the visitor shows interest in the hero.
  const [wanted, setWanted] = useState(!entry);
  const [busy, setBusy] = useState(false);
  const shown = useRef<ScenarioId>("tag");
  const { host, stage, status, scenario, setScenario } = useStage(
    { scenario: "tag", view: shots.tag.pose },
    (made, element) => {
      // The visitor may have picked a scene while the stage was loading.
      made.setScenario(shown.current, 0);
      made.setView(entry ? matched(aspectOf(element)) : view(element), 0);
    },
    wanted,
    phase === "film" || phase === "leaving",
  );
  const statusNow = useRef(status);
  const phaseNow = useRef(phase);
  useEffect(() => {
    statusNow.current = status;
    phaseNow.current = phase;
  });

  // How far the visitor has turned the current shot by dragging.
  const turn = useRef({ azimuth: 0, elevation: 0 });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    azimuth: number;
    elevation: number;
    moved: boolean;
  } | null>(null);

  /** The current shot as the visitor has turned it. */
  function current(): Shot {
    const shot = shots[shown.current];
    const { azimuth, elevation } = turn.current;
    // Inside the room a drag looks around, half as far, and the picture
    // follows the hand.
    const pose = shot.inside
      ? panned(shot.pose, azimuth / 2, elevation / 2)
      : turned(shot.pose, azimuth, elevation);
    return { ...shot, pose };
  }
  /** That shot framed for the stage's shape. */
  function view(element: HTMLElement) {
    return framed(current(), aspectOf(element));
  }

  function show(id: ScenarioId) {
    if (id === shown.current || phaseNow.current !== "film") return;
    settle();
    shown.current = id;
    turn.current = { azimuth: 0, elevation: 0 };
    setScenario(id);
    const element = host.current;
    if (element) stage.current?.setView(view(element), 1200);
  }
  function step(by: number) {
    const index = scenarios.findIndex((s) => s.id === shown.current);
    show(scenarios[(index + by + scenarios.length) % scenarios.length].id);
  }

  // A drag turns the model; a press that does not move is a click and moves
  // on to the next scene. Touch only turns sideways, so a vertical swipe
  // still scrolls the page.
  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    // One finger turns the model; a second one is ignored.
    if (event.button !== 0 || drag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      ...turn.current,
      moved: false,
    };
  }
  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const from = drag.current;
    const element = host.current;
    if (!from || !element || from.id !== event.pointerId) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (!from.moved && Math.hypot(dx, dy) < 5) return;
    from.moved = true;
    settle();
    const perPixel = 110 / element.clientWidth;
    turn.current = {
      azimuth: Math.min(SWING, Math.max(-SWING, from.azimuth - dx * perPixel)),
      elevation:
        event.pointerType === "touch"
          ? from.elevation
          : Math.min(LIFT, Math.max(-DIP, from.elevation + dy * perPixel)),
    };
    stage.current?.setView(view(element), 0);
  }
  function onPointerEnd(event: React.PointerEvent<HTMLButtonElement>) {
    // The click that follows a drag reads `moved` before it is cleared.
    const from = drag.current;
    if (from && from.id === event.pointerId && !from.moved) drag.current = null;
  }
  function onClick() {
    const dragged = drag.current?.moved;
    drag.current = null;
    if (!dragged) step(1);
  }

  // ── The way between the hero photo and the film ────────────────────────
  const film = useRef<HTMLElement>(null);
  const frame = useRef<HTMLAnchorElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLImageElement>(null);
  /** Where on the way the picture is, 0 (photo) to WAY (film). */
  const clock = useRef(0);
  const run = useRef(0);
  const path = useRef<Way | null>(null);
  const homeTitle = useRef<string | null>(null);
  /** Which way a running way goes, so a second press does not start it twice. */
  const heading = useRef<"in" | "out" | null>(null);
  /** The scene the visitor was on when the way back began. */
  const departing = useRef<ScenarioId>("tag");
  const restoration = useRef<ScrollRestoration | null>(null);

  /** Ends a way in that is still settling, so the visitor's own move takes the camera from where it is. */
  function settle() {
    if (phaseNow.current === "film" && clock.current < WAY) {
      run.current++;
      clock.current = WAY;
    }
  }

  /** Measures the hero's frame and the stage for a run of the way. */
  function measure(shot: Shot): Way | null {
    const box = frame.current?.getBoundingClientRect();
    const image = frame.current?.querySelector("img");
    const element = host.current;
    if (!box || !image || !element || !hero) return null;
    const width = element.clientWidth;
    const height = element.clientHeight;
    const aspect = hero.width / hero.height;
    const [x = "50%", y = "50%"] = getComputedStyle(image)
      .objectPosition.split(" ")
      .map((part) => part.trim());
    const at: [number, number] = [parseFloat(x) / 100, parseFloat(y) / 100];
    const start = matched(width / height);
    const large = covered({ left: 0, top: 0, width, height }, aspect);
    return {
      frame: {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      },
      small: covered(box, aspect, at.every(Number.isFinite) ? at : undefined),
      large,
      width,
      height,
      scroll: window.scrollY,
      start,
      corners: hung(start, width, height, large),
      shot,
    };
  }

  /** Draws the way at time `t`: the frame, the photo, the camera. */
  function draw(t: number) {
    const w = path.current;
    const made = stage.current;
    if (!w || !made || !wrap.current || !plane.current || !copy.current) return;
    clock.current = t;
    const open = easeInOut(span(t, 0, OPEN));
    if (w.scroll)
      window.scrollTo({ top: w.scroll * (1 - open), behavior: "instant" });
    // The frame opens from the hero's box to the whole screen.
    const box = mixRect(
      w.frame,
      { left: 0, top: 0, width: w.width, height: w.height },
      open,
    );
    wrap.current.style.clipPath =
      open >= 1
        ? "none"
        : `inset(${box.top}px ${w.width - box.left - box.width}px ${
            w.height - box.top - box.height
          }px ${box.left}px)`;
    // The photo goes from its crop in the hero to its crop on the screen.
    const drawn = mixRect(w.small, w.large, open);
    const size = drawn.width / w.large.width;
    copy.current.style.transform = `translate(${drawn.left - w.large.left}px, ${
      drawn.top - w.large.top
    }px) scale(${size})`;
    // The camera leaves; the photo stays where it hangs in the room and
    // fades into the model behind it.
    const k = easeInOut(span(t, LEAVE_FROM, WAY));
    const pose = way(w.start, w.shot, w.width / w.height, k);
    made.setView(pose, 0);
    const alpha = 1 - smooth(span(t, FADE[0], FADE[1]));
    const pin =
      alpha > 0 ? pinned(w.corners, pose, w.width, w.height, w.large) : null;
    plane.current.style.visibility = pin ? "visible" : "hidden";
    if (pin) {
      plane.current.style.width = `${w.large.width}px`;
      plane.current.style.height = `${w.large.height}px`;
      plane.current.style.setProperty(
        "--feather",
        `${12 * smooth(span(t, FADE[0], FADE[1]))}%`,
      );
      plane.current.style.transform = pin;
      plane.current.style.opacity = String(alpha);
    }
    made.setLook(1 - smooth(span(t, LOOK[0], LOOK[1])));
    // The page behind is the homepage until the frame covers it.
    const root = document.documentElement;
    root.dataset.filmStage = open >= 1 ? "full" : "framed";
    root.dataset.filmRest = t < 300 ? "in" : "out";
  }

  /** Plays the way from where the clock stands to `to`. Resolves false when another run took over. */
  function play(to: number, rate = 1) {
    const id = ++run.current;
    const from = clock.current;
    const ms = Math.abs(to - from) / rate;
    return new Promise<boolean>((resolve) => {
      let start = 0;
      function tick(now: number) {
        if (run.current !== id) return resolve(false);
        start ||= now;
        const p = ms ? Math.min(1, (now - start) / ms) : 1;
        draw(from + (to - from) * p);
        if (p < 1) requestAnimationFrame(tick);
        else resolve(true);
      }
      requestAnimationFrame(tick);
    });
  }

  /** Waits for the stage and the photo's second copy. False when the stage failed. */
  async function ready(id: number) {
    setWanted(true);
    while (statusNow.current === "loading" || !copy.current) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      // Another run, a step back or the page going away ends the wait.
      if (run.current !== id) return false;
    }
    if (statusNow.current !== "ready") return false;
    await copy.current.decode().catch(() => {});
    return true;
  }

  /** Photo → film. */
  async function enter(push: boolean) {
    if (phaseNow.current === "leaving") {
      // Forward again before the way back began: the film stays, on the
      // scene it was on.
      run.current++;
      heading.current = null;
      shown.current = departing.current;
      setScenario(departing.current, 400);
      setPhase("film");
      return;
    }
    if (phaseNow.current === "moving") {
      // Already on the way in: a second press changes nothing.
      if (heading.current === "in") return;
      // Turned around on the way back: carry on forwards from here.
    } else if (phaseNow.current === "photo") {
      const id = ++run.current;
      setBusy(true);
      const ok = await ready(id);
      setBusy(false);
      if (run.current !== id) return;
      if (!ok) {
        // No WebGL, or the files did not come: the 3D page has a still.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full document load, like every navigation on this site
        window.location.href = FILM;
        return;
      }
      if (run.current !== id) return;
      path.current = measure(shots.tag);
      if (!path.current || !stage.current) return;
      shown.current = "tag";
      turn.current = { azimuth: 0, elevation: 0 };
      setScenario("tag", 0);
      clock.current = 0;
      draw(0);
      setPhase("moving");
    } else return;
    // The browser would put the page back where it was scrolled on Back,
    // under the picture; the way back ends at the page's top instead.
    restoration.current ??= history.scrollRestoration;
    history.scrollRestoration = "manual";
    heading.current = "in";
    if (push) history.pushState({ film: true }, "", FILM);
    homeTitle.current ??= document.title;
    document.title = `${FILM_TITLE} | ${homeTitle.current}`;
    if (!(await play(ARRIVE))) return;
    // The line and the scenes come in while the camera settles. The hero is
    // gone by then, so a keyboard's focus moves on to the current scene.
    const focused = frame.current?.contains(document.activeElement);
    setPhase("film");
    if (focused)
      void nextFrame().then(() =>
        film.current
          ?.querySelector<HTMLElement>('.film__dock [aria-pressed="true"]')
          ?.focus({ preventScroll: true }),
      );
    if (!(await play(WAY))) return;
    heading.current = null;
  }

  /** Film → photo. */
  async function leave() {
    // Read before the controls go: focus returns to the hero at the end.
    const focused = film.current?.contains(document.activeElement);
    if (phaseNow.current === "photo") {
      // Back while the stage was still loading: the click is taken back.
      run.current++;
      setBusy(false);
      return;
    }
    if (phaseNow.current === "film") {
      const id = ++run.current;
      const shot = current();
      heading.current = "out";
      departing.current = shown.current;
      shown.current = "tag";
      setScenario("tag", 1000);
      setPhase("leaving");
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (run.current !== id) return;
      // The homepage's layout comes back, unseen, so the hero's frame can be
      // measured where it will be.
      setPhase("moving");
      await nextFrame();
      await nextFrame();
      if (run.current !== id) return;
      path.current = measure(shot);
      clock.current = WAY;
    } else if (phaseNow.current !== "moving") return;
    heading.current = "out";
    if (homeTitle.current) document.title = homeTitle.current;
    if (!(await play(0, RETURN_RATE))) return;
    heading.current = null;
    if (restoration.current) history.scrollRestoration = restoration.current;
    restoration.current = null;
    turn.current = { azimuth: 0, elevation: 0 };
    const root = document.documentElement;
    delete root.dataset.filmStage;
    delete root.dataset.filmRest;
    setPhase("photo");
    if (focused)
      void nextFrame().then(() =>
        frame.current?.focus({ preventScroll: true }),
      );
  }

  function onHeroClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // A modified click opens the 3D page in its own tab; with reduced motion
    // the link is followed as it is, a plain change of page.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      reducedMotion()
    )
      return;
    event.preventDefault();
    // A second press while the way in plays must not add a history entry.
    if (phaseNow.current === "photo") void enter(true);
  }

  // For looking at one moment of the way while working on it.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const tools = window as Window & {
      __filmHold?: (t: number) => void;
      __filmMatch?: (photo: number, look?: number) => void;
    };
    tools.__filmHold = (t) => {
      run.current++;
      draw(t);
    };
    // The first frame on the whole screen: the model from the photo's
    // viewpoint with the photo over it at the given opacity.
    tools.__filmMatch = (photo, look = 1) => {
      const w = path.current;
      if (!w || !wrap.current || !plane.current || !copy.current) return;
      run.current++;
      draw(OPEN);
      stage.current?.setView(w.start, 0);
      stage.current?.setLook(look);
      plane.current.style.transform =
        pinned(w.corners, w.start, w.width, w.height, w.large) ?? "";
      plane.current.style.setProperty("--feather", "0%");
      plane.current.style.filter = "none";
      plane.current.style.opacity = String(photo);
    };
    return () => {
      delete tools.__filmHold;
      delete tools.__filmMatch;
    };
  });

  // Back and Forward walk the same way.
  const walk = useRef({ enter, leave });
  useEffect(() => {
    walk.current = { enter, leave };
  });
  useEffect(() => {
    if (!entry) return;
    const onPop = () => {
      if (window.location.pathname === FILM) void walk.current.enter(false);
      else if (window.location.pathname === HOME) void walk.current.leave();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [entry]);

  // The homepage steps aside for the film and comes back after it.
  useEffect(() => {
    if (!entry) return;
    const root = document.documentElement;
    root.dataset.filmPhase = phase;
    return () => {
      delete root.dataset.filmPhase;
    };
  }, [entry, phase]);
  useEffect(() => {
    const root = document.documentElement;
    const runs = run;
    return () => {
      // Stops a way that is still playing.
      runs.current++;
      delete root.dataset.filmStage;
      delete root.dataset.filmRest;
    };
  }, []);

  // On an idle moment the stage's files are fetched ahead, so a click finds
  // them in the cache. Not on a metered or slow connection.
  useEffect(() => {
    if (!entry) return;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (connection?.saveData || /2g|3g/.test(connection?.effectiveType ?? ""))
      return;
    const links: HTMLLinkElement[] = [];
    const fetchAhead = () => {
      for (const file of stageFiles) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = file;
        document.head.append(link);
        links.push(link);
      }
    };
    const idle =
      typeof requestIdleCallback === "function"
        ? requestIdleCallback(fetchAhead, { timeout: 4000 })
        : window.setTimeout(fetchAhead, 2500);
    return () => {
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(idle);
      else clearTimeout(idle);
      for (const link of links) link.remove();
    };
  }, [entry]);

  // The film ends at the bottom of the first screen whatever follows it, so
  // it has to know how much of the screen the header above it takes.
  useEffect(() => {
    const element = film.current;
    if (!element) return;
    const measureTop = () =>
      element.style.setProperty(
        "--film-top",
        `${element.getBoundingClientRect().top + window.scrollY}px`,
      );
    measureTop();
    const resizer = new ResizeObserver(measureTop);
    const header = document.querySelector(".site-header");
    if (header) resizer.observe(header);
    window.addEventListener("resize", measureTop);
    return () => {
      resizer.disconnect();
      window.removeEventListener("resize", measureTop);
    };
  }, [phase]);

  // The framing depends on the stage's shape, so a resize reframes at once.
  const reframe = useRef(view);
  // On the way the path was measured for the old shape: measure again and
  // draw where the clock stands.
  const remeasure = useRef(() => {});
  useEffect(() => {
    reframe.current = view;
    remeasure.current = () => {
      const old = path.current;
      const next = old && measure(old.shot);
      if (!next) return;
      path.current = { ...next, scroll: 0 };
      draw(clock.current);
    };
  });
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let last = "";
    const resizer = new ResizeObserver(() => {
      const size = `${element.clientWidth}x${element.clientHeight}`;
      if (size === last || !element.clientHeight) return;
      const first = last === "";
      last = size;
      if (first) return;
      if (phaseNow.current === "film") {
        // A way in that is still settling ends here, on the new frame.
        if (clock.current < WAY) {
          run.current++;
          clock.current = WAY;
        }
        stage.current?.setView(reframe.current(element), 0);
      } else if (phaseNow.current === "moving") remeasure.current();
      else if (phaseNow.current === "photo")
        stage.current?.setView(matched(aspectOf(element)), 0);
    });
    resizer.observe(element);
    return () => resizer.disconnect();
  }, [host, stage]);

  const inFilm = phase === "film";

  return (
    <section
      className={entry ? "film film--entry" : "film"}
      data-phase={phase}
      data-stage={status}
      aria-label={
        phase === "photo" ? "Das Studio" : "Das Studio in vier Lichtstimmungen"
      }
      ref={film}
    >
      <noscript>
        <style>{noscript}</style>
      </noscript>
      <div className="film__stage" ref={wrap}>
        {/* Decorative: the section's label names the picture. Seen without
            WebGL or script, and under the canvas until it has faded in. */}
        {!entry && (
          <picture>
            <source
              media="(max-aspect-ratio: 1/1)"
              srcSet="/studio-3d/film-poster-tall.webp"
            />
            <img
              className="film__poster"
              src="/studio-3d/film-poster-wide.webp"
              alt=""
              decoding="async"
            />
          </picture>
        )}
        <div
          className="film__canvas"
          data-ready={status === "ready"}
          ref={host}
        />
        {/* The hero photo a second time, on the stage: the copy that hangs
            in the room while the camera leaves. Same files as the hero. */}
        {hero && wanted && (
          <div className="film__plane" ref={plane}>
            {/* eslint-disable-next-line @next/next/no-img-element -- optimized ahead of time */}
            <img
              ref={copy}
              src={hero.src}
              srcSet={hero.srcSet || undefined}
              sizes={hero.srcSet ? HERO_SIZES : undefined}
              alt=""
            />
          </div>
        )}
      </div>

      {hero && (
        // Plain anchor on purpose: without script, with reduced motion or
        // without WebGL it is a link to the 3D page.
        <a
          className="film__hero"
          href={FILM}
          ref={frame}
          data-busy={busy}
          aria-label="Studio Tour starten"
          onClick={onHeroClick}
          onPointerEnter={() => setWanted(true)}
          onTouchStart={() => setWanted(true)}
          onFocus={() => setWanted(true)}
        >
          <ContentImg
            image={hero}
            alt={hero.alt}
            sizes={HERO_SIZES}
            loading="eager"
          />
          <span className="chip film__cue">
            <span className="film__cue-label">Studio Tour starten</span>
            <span className="film__cue-arrow" aria-hidden="true">
              →
            </span>
          </span>
        </a>
      )}

      {/* The picture itself: drag to turn the model, click for the next
          scene. The chips pick scenes for keyboard and screen reader, so this
          one stays out of their way. */}
      <button
        type="button"
        className="film__next"
        tabIndex={-1}
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={(event) => {
          if (drag.current?.id === event.pointerId) drag.current = null;
        }}
        onClick={onClick}
      />

      {entry ? (
        <button
          type="button"
          className="chip film__back"
          disabled={!inFilm}
          onClick={() => {
            // The button stays enabled until Back arrives: one press, one step.
            if (heading.current !== "out" && phaseNow.current === "film") {
              heading.current = "out";
              history.back();
            }
          }}
        >
          Studio Tour beenden
        </button>
      ) : (
        <a
          className="chip film__back"
          href={HOME}
          data-label="Studio Tour beenden"
        >
          Studio Tour beenden
        </a>
      )}

      <div className="film__ui" inert={!inFilm}>
        <div className="film__copy" aria-live="polite">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="film__line"
              data-current={scenario === s.id}
              aria-hidden={scenario !== s.id}
            >
              <h2>{s.line}</h2>
            </div>
          ))}
        </div>
        <div className="film__dock" role="group" aria-label="Lichtstimmung">
          <button
            type="button"
            className="chip film__arrow"
            aria-label="Vorherige Stimmung"
            onClick={() => step(-1)}
          >
            ←
          </button>
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip"
              aria-pressed={scenario === s.id}
              onClick={() => show(s.id)}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            className="chip film__arrow"
            aria-label="Nächste Stimmung"
            onClick={() => step(1)}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
