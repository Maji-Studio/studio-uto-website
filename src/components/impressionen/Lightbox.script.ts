import { mountStepLabel } from "@/lib/step-label";

export function initLightbox(): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const cleanups: Array<() => void> = [];

  const dialog = document.querySelector<HTMLDialogElement>("[data-lightbox]");
  const q = <T extends HTMLElement>(sel: string) =>
    dialog?.querySelector<T>(sel) ?? null;
  const image = q<HTMLImageElement>("[data-lightbox-image]");
  const stage = q("[data-lightbox-stage]");
  const nav = q("[data-lightbox-nav]");
  const labelEl = q("[data-lightbox-label]");
  const totalEl = q("[data-step-label-total]");
  const nameEl = q("[data-lightbox-name]");
  const clientEl = q("[data-lightbox-client]");
  const countEl = q("[data-lightbox-count]");

  interface Slide {
    btn: HTMLElement;
    thumb: HTMLImageElement;
    src: string;
    srcset: string;
    width: number;
    height: number;
    alt: string;
  }

  if (
    dialog &&
    image &&
    stage &&
    nav &&
    labelEl &&
    totalEl &&
    nameEl &&
    clientEl &&
    countEl
  ) {
    let gallery: HTMLElement | null = null;
    let slides: Slide[] = [];
    let index = 0;
    // Slide the viewer is heading for; runs ahead of `index` while a step waits
    // for its file.
    let target = 0;
    let phase: "closed" | "opening" | "open" | "closing" = "closed";
    let session = 0;
    let steppingSession: number | null = null;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    // The viewer's image and title carry fixed view-transition-names
    // (lb-image / lb-title, see the CSS). Their partners on the page — the
    // current thumbnail and the row's title — borrow the same
    // names for the snapshot on the page side, so each pair morphs into the
    // other. Exactly one element carries a name in each snapshot.
    type Pairs = [HTMLElement | null, string][];
    const pagePartners = (): Pairs => [
      [slides[index].thumb, "lb-image"],
      [gallery!.querySelector("[data-lightbox-title]"), "lb-title"],
    ];
    const setNames = (pairs: Pairs, on: boolean) => {
      for (const [el, name] of pairs)
        if (el) el.style.viewTransitionName = on ? name : "";
    };

    const readSlides = (gallery: HTMLElement): Slide[] =>
      Array.from(
        gallery.querySelectorAll<HTMLButtonElement>("[data-lightbox-open]"),
      ).map((btn) => ({
        btn,
        thumb: btn.querySelector("img")!,
        src: btn.dataset.src ?? "",
        srcset: btn.dataset.srcset ?? "",
        width: Number(btn.dataset.width) || 3,
        height: Number(btn.dataset.height) || 2,
        alt: btn.dataset.alt ?? "",
      }));

    const pad = (n: number) => String(n).padStart(2, "0");

    // Paint slide `index` into the viewer. The thumbnail's already-decoded file
    // sits behind the full image as a background, so the viewer is never blank
    // while the large file is still on its way. A new --ar eases the frame into
    // the new format while the viewer is up; on open the dialog is still
    // closed, so there is nothing to ease from.
    const fill = () => {
      const s = slides[index];
      stage.style.setProperty("--ar", String(s.width / s.height));
      image.style.backgroundImage = `url("${s.thumb.currentSrc || s.thumb.src}")`;
      image.width = s.width;
      image.height = s.height;
      image.alt = s.alt;
      image.sizes = "100vw";
      image.srcset = s.srcset;
      image.src = s.src;
      countEl.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
    };

    // Give the full image a moment to decode before the new-state snapshot is
    // taken — but never hold the transition hostage to the network.
    const settle = () =>
      Promise.race([
        image.decode().catch(() => {}),
        new Promise((r) => setTimeout(r, 250)),
      ]);

    // Only one morph runs at a time. Closing can skip it; consume the ready
    // rejection that browsers use to report a skipped snapshot animation.
    let activeTransition: ViewTransition | null = null;
    const transition = async (
      kind: "open" | "close",
      update: () => void | Promise<void>,
    ) => {
      if (!document.startViewTransition || reducedMotion.matches) {
        await update();
        return;
      }
      const root = document.documentElement;
      root.dataset.lbVt = kind;
      const vt = document.startViewTransition(update);
      activeTransition = vt;
      void vt.ready.catch(() => {});
      try {
        await vt.finished;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          throw error;
      } finally {
        if (activeTransition === vt) {
          activeTransition = null;
          delete root.dataset.lbVt;
        }
      }
    };

    reducedMotion.addEventListener(
      "change",
      () => {
        if (reducedMotion.matches) activeTransition?.skipTransition();
      },
      { signal },
    );

    // Load and decode a slide's large file (once per button). Resolves on error
    // too, so a broken file never blocks stepping.
    const loaded = new WeakMap<HTMLElement, Promise<void>>();
    const preload = (btn: HTMLElement) => {
      let ready = loaded.get(btn);
      if (!ready) {
        const img = new Image();
        img.sizes = "100vw";
        img.srcset = btn.dataset.srcset ?? "";
        img.src = btn.dataset.src ?? "";
        ready = img.decode().catch(() => {});
        loaded.set(btn, ready);
      }
      return ready;
    };

    // Once a slide is up, fetch its neighbours so the next step rarely waits.
    const warmNeighbours = () => {
      if (!dialog.open) return;
      for (const d of [1, -1])
        void preload(slides[(index + d + slides.length) % slides.length].btn);
    };

    const open = (from: HTMLElement, at: number) => {
      if (phase !== "closed") return;
      phase = "opening";
      const currentSession = ++session;
      gallery = from;
      slides = readSlides(from);
      index = target = at;
      nav.hidden = slides.length < 2;
      totalEl.textContent = `/${pad(slides.length)})`;
      nameEl.textContent = from.dataset.name ?? "";
      clientEl.textContent = from.dataset.client
        ? `for ${from.dataset.client}`
        : "";
      const pairs = pagePartners();
      setNames(pairs, true);
      void transition("open", async () => {
        setNames(pairs, false);
        // The lifted-out pieces leave holes in the page (see the global CSS).
        from.dataset.lightboxActive = "";
        slides[index].thumb.dataset.away = "";
        fill();
        dialog.showModal();
        await settle();
      }).then(() => {
        if (session !== currentSession) return;
        phase = "open";
        warmNeighbours();
        void drainSteps();
        // The pointer is usually still where the thumbnail was clicked, which
        // is now over the band: raise the label there without waiting for a move.
        if (pointer) aim(pointer.x, pointer.y);
      });
    };

    const close = () => {
      if (phase === "closed" || phase === "closing" || !gallery) return;
      phase = "closing";
      ++session; // invalidate outstanding decodes and queued steps
      target = index;
      // Gone before the close snapshot is taken.
      side = 0;
      label.hide(true);
      const from = gallery;
      const interrupted = activeTransition;
      interrupted?.skipTransition();
      void (async () => {
        // A skipped transition still runs its DOM update. Finish that update
        // before selecting the image that will return to the page.
        await interrupted?.updateCallbackDone;
        const thumb = slides[index].thumb;
        const pairs = pagePartners();
        try {
          await transition("close", () => {
            dialog.close();
            delete from.dataset.lightboxActive;
            for (const s of slides) delete s.thumb.dataset.away;
            thumb.scrollIntoView({ block: "nearest", behavior: "instant" });
            thumb.closest("button")?.focus({ preventScroll: true });
            setNames(pairs, true);
          });
        } finally {
          setNames(pairs, false);
          phase = "closed";
        }
      })();
    };

    // Every press counts; once a file is in, go to the latest requested image.
    const drainSteps = async () => {
      const currentSession = session;
      if (phase !== "open" || steppingSession === currentSession) return;
      steppingSession = currentSession;
      try {
        while (
          session === currentSession &&
          phase === "open" &&
          target !== index
        ) {
          const to = target;
          await preload(slides[to].btn);
          if (session !== currentSession || phase !== "open") return;
          if (to !== target) continue;
          delete slides[index].thumb.dataset.away;
          index = to;
          slides[index].thumb.dataset.away = "";
          fill();
          warmNeighbours();
        }
      } finally {
        if (steppingSession === currentSession) steppingSession = null;
      }
    };

    const step = (dir: number) => {
      if ((phase !== "open" && phase !== "opening") || slides.length < 2)
        return;
      target = (target + dir + slides.length) % slides.length;
      if (side) label.set(labelText(side), dir);
      void preload(slides[target].btn);
      void drainSteps();
    };

    document.addEventListener(
      "click",
      (e) => {
        const btn = (e.target as Element).closest<HTMLButtonElement>(
          "[data-lightbox-open]",
        );
        const from = btn?.closest<HTMLElement>("[data-lightbox-gallery]");
        if (!btn || !from) return;
        const buttons = from.querySelectorAll("[data-lightbox-open]");
        open(from, Array.prototype.indexOf.call(buttons, btn));
      },
      { signal },
    );
    document.addEventListener(
      "pointerover",
      (e) => {
        const btn = (e.target as Element).closest<HTMLElement>(
          "[data-lightbox-open]",
        );
        // Warm the large file as soon as the pointer shows intent.
        if (btn) void preload(btn);
      },
      { signal },
    );

    q("[data-lightbox-close]")?.addEventListener("click", close, { signal });

    const under = (el: Element, e: Pick<MouseEvent, "clientX" | "clientY">) => {
      const rect = el.getBoundingClientRect();
      return (
        e.clientX >= rect.left &&
        e.clientX < rect.right &&
        e.clientY >= rect.top &&
        e.clientY < rect.bottom
      );
    };

    // A click anywhere but the image or a control closes the viewer. The press
    // has to start off the image too, so a drag off the image doesn't count.
    let pressedBackground = false;
    document.addEventListener(
      "pointerdown",
      (e) => {
        pressedBackground =
          dialog.open &&
          e.button === 0 &&
          !under(image, e) &&
          !Array.from(dialog.querySelectorAll("button")).some((b) =>
            under(b, e),
          );
      },
      { capture: true, signal },
    );
    dialog.addEventListener(
      "click",
      (e) => {
        const t = e.target as Element;
        const pressed = pressedBackground;
        pressedBackground = false;
        if (pressed && t !== image && !t.closest("button")) close();
      },
      { signal },
    );

    // Some engines retarget pointer input to the document while the modal is
    // captured, even with pointer-events disabled on the snapshot layer. Route
    // that input to the real control, keeping focus and the current morph intact.
    const routeSnapshotInput = (e: MouseEvent) => {
      if (
        !dialog.open ||
        (e.type === "pointerdown" && !activeTransition) ||
        e.button !== 0 ||
        dialog.contains(e.target as Node)
      )
        return;
      e.preventDefault();
      const button = Array.from(dialog.querySelectorAll("button")).find((b) =>
        under(b, e),
      );
      button?.focus({ preventScroll: true });
      if (e.type !== "click") return;
      if (button) button.click();
      else if (pressedBackground) close();
      pressedBackground = false;
    };
    document.addEventListener("pointerdown", routeSnapshotInput, {
      capture: true,
      signal,
    });
    document.addEventListener("click", routeSnapshotInput, {
      capture: true,
      signal,
    });

    // Pointer label. `side` is the half it currently reads for (-1 prev,
    // 1 next), 0 while it is down. It reads for `target`, so presses still
    // waiting for their file already count.
    const label = mountStepLabel(labelEl);
    const steps = Array.from(
      dialog.querySelectorAll<HTMLButtonElement>("[data-lightbox-step]"),
    );
    let side = 0;
    // Parked on a keyboard-focused half rather than following the pointer.
    let parked = false;
    let pointer: { x: number; y: number } | null = null;

    const labelText = (dir: number) => [
      dir > 0 ? "Next" : "Previous",
      pad(((target + dir + slides.length) % slides.length) + 1),
    ];

    const point = (btn: HTMLElement, x: number, y: number) => {
      const dir = Number(btn.dataset.lightboxStep);
      if (dir !== side) label.set(labelText(dir), dir);
      side = dir;
      label.show(x, y);
    };

    const drop = () => {
      if (!side) return;
      side = 0;
      parked = false;
      label.hide();
    };

    const aim = (x: number, y: number) => {
      const btn =
        phase === "open"
          ? steps.find((b) => under(b, { clientX: x, clientY: y }))
          : undefined;
      if (btn) {
        parked = false;
        point(btn, x, y);
      } else drop();
    };

    document.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        pointer = { x: e.clientX, y: e.clientY };
        if (dialog.open) aim(e.clientX, e.clientY);
      },
      { signal },
    );
    // Off the window.
    document.addEventListener(
      "pointerout",
      (e) => {
        if (e.pointerType !== "mouse" || e.relatedTarget) return;
        pointer = null;
        drop();
      },
      { signal },
    );

    for (const btn of steps) {
      btn.addEventListener(
        "click",
        () => step(Number(btn.dataset.lightboxStep)),
        { signal },
      );
      // Keyboard focus parks the label in the middle of its half.
      btn.addEventListener(
        "focus",
        () => {
          if (phase !== "open" || !btn.matches(":focus-visible")) return;
          const r = btn.getBoundingClientRect();
          parked = true;
          point(btn, r.left + r.width / 2, r.top + r.height / 2);
        },
        { signal },
      );
      btn.addEventListener(
        "blur",
        () => {
          if (parked) drop();
        },
        { signal },
      );
    }

    // Esc: run our close transition instead of the dialog's instant one.
    dialog.addEventListener(
      "cancel",
      (e) => {
        e.preventDefault();
        close();
      },
      { signal },
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (!dialog.open || phase === "closing") return;
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        e.stopPropagation();
        step(e.key === "ArrowRight" ? 1 : -1);
      },
      { signal },
    );

    // Touch: a horizontal swipe anywhere in the viewer steps — left for next,
    // right for previous. Touch events rather than pointer events, on the
    // document: while a step runs, the transition overlay is under the finger
    // and the browser would claim the drag as a pan and cancel the pointer.
    // Cancelling a sideways touchmove keeps the drag ours.
    let swipe: { x: number; y: number; at: number } | null = null;
    const horizontal = (dx: number, dy: number) =>
      Math.abs(dx) > Math.abs(dy) * 1.5;
    document.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        swipe =
          dialog.open && e.touches.length === 1
            ? { x: t.clientX, y: t.clientY, at: e.timeStamp }
            : null; // a second finger is a pinch
      },
      { signal },
    );
    document.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        if (
          swipe &&
          e.cancelable &&
          horizontal(t.clientX - swipe.x, t.clientY - swipe.y)
        )
          e.preventDefault();
      },
      { passive: false, signal },
    );
    document.addEventListener(
      "touchend",
      (e) => {
        if (!swipe || e.touches.length) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - swipe.x;
        const dy = t.clientY - swipe.y;
        const quick = e.timeStamp - swipe.at < 800;
        swipe = null;
        if (quick && Math.abs(dx) > 40 && horizontal(dx, dy))
          step(dx < 0 ? 1 : -1);
      },
      { signal },
    );
    document.addEventListener("touchcancel", () => (swipe = null), { signal });
  }

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
  };
}
