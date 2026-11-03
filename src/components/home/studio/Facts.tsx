import ContentImg from "@/components/site/ContentImg";
import type { StudioSection } from "@/lib/content/types";

import FactsNavScript from "./Facts.client";
import "./Facts.css";

// The fact sheet on /information/ (sections from getInformationSections()).
//
// Each section opens with its number and title at display size, hung on the
// same two columns as the facts: the grey number in the label column, the
// title in the text column, both cap-aligned. Below, the facts:
// manifesto-size Helvetica lines with every number in a chip, the block labels
// in black chips.

// Split a line into text and chips: every number (with its unit), time span,
// day span and price becomes a chip. A unit in brackets loses the brackets.
const NUM = new RegExp(
  [
    String.raw`(?:Mo|Di|Mi|Do|Fr|Sa|So)\s*–\s*(?:Mo|Di|Mi|Do|Fr|Sa|So)`,
    String.raw`\d{1,2}:\d{2}\s*–\s*\d{1,2}:\d{2}(?:\s*Uhr)?`,
    String.raw`CHF\s*\d+(?:[.,]\d+)?`,
    String.raw`\d+(?:\.\d+)?\s?m?\s?×\s?\d+(?:\.\d+)?\s?m\b`,
    String.raw`\(\d+\s?h\)`,
    String.raw`\d+\s?Gb\/s`,
    String.raw`\d+\.\s?Stock`,
    // A measurement keeps its unit inside the chip ("5.7 m", not "5.7" + "m").
    String.raw`\b\d+(?:\.\d+)?\s?(?:m²|m|h)\b`,
    // A bare number counts something only when a word follows it; four digits
    // or more is a postcode or a year, not a count.
    String.raw`\b\d{1,3}(?:\.\d+)?(?=\s+\p{L})`,
  ].join("|"),
  "gu",
);
type Tok = { t: string; chip: boolean };
function tokens(line: string): Tok[] {
  const out: Tok[] = [];
  let at = 0;
  for (const m of line.matchAll(NUM)) {
    const i = m.index ?? 0;
    if (i > at) out.push({ t: line.slice(at, i), chip: false });
    out.push({ t: m[0].replace(/^\((.*)\)$/, "$1"), chip: true });
    at = i + m[0].length;
  }
  if (at < line.length) out.push({ t: line.slice(at), chip: false });
  return out;
}

// A term/detail pair reads as one line: the term, then each detail part as a
// chip ("L 14 m · B 7 m · H 2.7 m" → three chips).
const pairLine = (term: string, detail: string): Tok[] => [
  ...tokens(term),
  { t: " ", chip: false },
  ...detail
    .split(" · ")
    .flatMap((d, i) => [
      ...(i ? [{ t: " ", chip: false }] : []),
      { t: d.trim(), chip: true },
    ]),
];

export default function Facts({
  sections: source,
}: {
  sections: StudioSection[];
}) {
  const nav = source.map((s) => ({
    label: s.navLabel ?? s.title,
    href: `#${s.id}`,
  }));

  const sections = source.map((s, i) => ({
    id: s.id,
    title: s.title,
    number: String(i + 1).padStart(2, "0"),
    blocks: s.blocks
      .map((b) => ({
        label: b.label,
        lines: [
          ...(b.pairs ?? []).map((p) => pairLine(p.term, p.detail)),
          ...(b.lines ?? []).map(tokens),
          ...(b.text ?? []).map(tokens),
        ],
        links: b.links ?? [],
        figure: b.figure,
        note: b.note,
      }))
      // No photo gallery on this page; the homepage hero carries the tour.
      .filter((b) => b.lines.length || b.figure || b.links.length || b.note),
  }));

  return (
    <section className="facts" data-facts>
      <nav className="facts-nav" aria-label="Abschnitte">
        {nav.map((item) => (
          <a
            key={item.href}
            className="chip"
            href={item.href}
            data-label={item.label}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {sections.map((sec) => (
        <section
          key={sec.id}
          className="facts-sec"
          id={sec.id}
          aria-labelledby={`facts-${sec.id}`}
        >
          <header className="facts-head">
            <span className="facts-head__number" aria-hidden="true">
              {sec.number}
            </span>
            <h2 className="facts-head__title" id={`facts-${sec.id}`}>
              {sec.title}
            </h2>
          </header>

          <div className="facts-body">
            {sec.blocks.map((b, bi) => (
              <div className="facts-block" key={bi}>
                {b.label && <span className="chip facts-label">{b.label}</span>}
                <div className="facts-block__main">
                  {b.lines.length > 0 && (
                    <ul className="facts-lines">
                      {b.lines.map((line, li) => (
                        <li key={li}>
                          {line.map((tok, ti) =>
                            tok.chip ? (
                              <span className="facts-num" key={ti}>
                                {tok.t}
                              </span>
                            ) : (
                              tok.t
                            ),
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {b.figure && (
                    <ContentImg
                      image={b.figure}
                      sizes="(max-width: 700px) 100vw, 560px"
                      className="facts-plan"
                    />
                  )}
                  {b.links.length > 0 && (
                    <div className="facts-links">
                      {b.links.map((l) => (
                        <a
                          key={l.href}
                          className="chip"
                          href={l.href}
                          data-label={l.detail}
                          target={l.external ? "_blank" : undefined}
                          rel={l.external ? "noopener noreferrer" : undefined}
                        >
                          {l.detail}
                        </a>
                      ))}
                    </div>
                  )}
                  {b.note && <p className="facts-note">{b.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <FactsNavScript />
    </section>
  );
}
