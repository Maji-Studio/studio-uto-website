import Image from "next/image";

import nb03 from "@/assets/impressionen/nicolas-burri/nb-03.jpg";
import nb05 from "@/assets/impressionen/nicolas-burri/nb-05.jpg";
import yvy02 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-02.jpg";
import yvy06 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-06.jpg";
import type { SiteSettings, StudioSection } from "@/lib/content/types";

import "./Tarife.css";

// Studio fact sheet, part 3 of 4: the prices. A black label chip, then every
// tariff as a huge tight Helvetica line with a small grayscale square photo to
// its left and a muted detail underneath.
interface Props {
  sections: StudioSection[];
  settings: SiteSettings;
}

// Portfolio photographs: nb-03 nb-05 (Manor), yvy-02 yvy-06 (b/w). Decorative.
const photos = [nb03, yvy02, nb05, yvy06];

export default function Tarife({ sections, settings }: Props) {
  const section = sections.find((s) => s.id === "preise");
  const priceBlock = section?.blocks.find((b) => b.pairs);
  const rows = (priceBlock?.pairs ?? []).map(({ term, detail: amount }) => {
    const bracket = term.match(/\((.*?)\)/)?.[1];
    return {
      name: term.replace(/\s*\(.*\)/, ""),
      amount: amount.replace(/^CHF\s*/, ""),
      detail: [bracket, amount].filter(Boolean).join(" — "),
    };
  });
  const mail = `mailto:${settings.contact.email}`;

  return (
    <section className="tarife" id="preise" aria-labelledby="tarife-h">
      <h2 className="tarife-lab" id="tarife-h">
        <b aria-hidden="true">◼</b> Tarife
      </h2>

      <ul className="tarife-list">
        {rows.map((r, i) => (
          <li key={r.name}>
            <Image src={photos[i % photos.length]} alt="" sizes="120px" />
            <div>
              <span className="tarife-big">
                {r.name} {r.amount}
              </span>
              <span className="tarife-sm">{r.detail}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="tarife-foot">
        {priceBlock?.note && <p className="tarife-note">{priceBlock.note}</p>}
        <a className="chip" href={mail} data-label="Jetzt anfragen">
          Jetzt anfragen
        </a>
      </div>
    </section>
  );
}
