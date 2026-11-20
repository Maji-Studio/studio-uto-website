// Mounts the stage into a host element and lends the page its haze colour.
"use client";

import { useEffect, useRef, useState } from "react";
import { type Pose, type ScenarioId, scenarioById } from "./scenarios";
import type { Stage } from "./stage";

export function useStage(
  initial: { scenario: ScenarioId; view: Pose },
  onReady?: (stage: Stage, host: HTMLElement) => void,
  /** False holds the download (about 4 MB) back until the stage is wanted. */
  wanted = true,
  /** False keeps the page's own colours while the stage is out of sight. */
  shown = true,
) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [scenario, setScenarioState] = useState<ScenarioId>(initial.scenario);
  const first = useRef(initial);
  const ready = useRef(onReady);

  useEffect(() => {
    const element = host.current;
    if (!element || !wanted) return;
    const controller = new AbortController();
    const root = document.documentElement;
    void import("./stage")
      .then(({ createStage }) =>
        createStage(element, {
          signal: controller.signal,
          scenario: first.current.scenario,
          view: first.current.view,
          onHaze: (css) => root.style.setProperty("--haze", css),
        }),
      )
      .then((made) => {
        if (controller.signal.aborted) return made.dispose();
        stage.current = made;
        ready.current?.(made, element);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => {
      controller.abort();
      stage.current?.dispose();
      stage.current = null;
      root.style.removeProperty("--haze");
    };
  }, [wanted]);

  // The page follows the haze: dark scenarios flip ink and chips. Without a
  // stage (still loading, failed, or out of sight) the page stays as it is.
  // The haze takes 1400 ms to change and starts slowly, so the ink waits for
  // it: flipped at once, light ink would stand on a haze that is still light.
  const dark = scenarioById(scenario).dark;
  useEffect(() => {
    if (status !== "ready" || !shown) return;
    const root = document.documentElement;
    const flip = () => (root.dataset.haze = dark ? "dark" : "light");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!root.dataset.haze || still) {
      flip();
      return;
    }
    const timer = setTimeout(flip, 450);
    return () => clearTimeout(timer);
  }, [status, shown, dark]);
  useEffect(() => {
    if (status !== "ready" || !shown) return;
    const root = document.documentElement;
    return () => {
      delete root.dataset.haze;
    };
  }, [status, shown]);

  function setScenario(id: ScenarioId, ms?: number) {
    setScenarioState(id);
    stage.current?.setScenario(id, ms);
  }

  return { host, stage, status, scenario, setScenario };
}
