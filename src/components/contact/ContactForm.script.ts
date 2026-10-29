export function initContactForm(): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const cleanups: Array<() => void> = [];

  const form = document.querySelector<HTMLFormElement>(".cform");
  if (form) {
    const email = form.dataset.email ?? "";
    const status = form.querySelector<HTMLElement>(".cform__status");

    // German labels for the composed mail body, in reading order.
    const labels: Record<string, string> = {
      name: "Name",
      firma: "Firma",
      adresse: "Adresse",
      email: "Email",
      telefon: "Telefon",
      nachricht: "Nachricht",
    };

    form.addEventListener(
      "submit",
      (event) => {
        // Bot caught the honeypot → pretend success, send nothing.
        const honey = form.elements.namedItem("website");
        if (honey instanceof HTMLInputElement && honey.value.trim() !== "") {
          event.preventDefault();
          if (status)
            status.textContent = "Danke, deine Nachricht ist unterwegs.";
          form.reset();
          return;
        }

        // Let the browser surface native validation bubbles for missing fields.
        if (!form.checkValidity()) {
          event.preventDefault();
          form.reportValidity();
          return;
        }

        event.preventDefault();
        const data = new FormData(form);
        const lines: string[] = [];
        for (const [key, label] of Object.entries(labels)) {
          const value = (data.get(key) ?? "").toString().trim();
          if (value) lines.push(`${label}: ${value}`);
        }

        const who = (data.get("name") ?? "").toString().trim() || "Studio Uto";
        const subject = `Anfrage — ${who}`;
        const href = `mailto:${email}?subject=${encodeURIComponent(
          subject,
        )}&body=${encodeURIComponent(lines.join("\n"))}`;

        window.location.href = href;
        if (status) {
          status.textContent =
            "Dein Mailprogramm öffnet sich mit der Nachricht — zum Senden nur noch abschicken.";
        }
      },
      { signal },
    );
  }

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
  };
}
