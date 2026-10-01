# Impressionen image sources

## Matthias Kappeler — YVY

Selected on 2026-09-27 to replace the generated outdoor North Face placeholders
with actual studio fashion work from Matthias's public portfolio.

- Project: **UNI by YVY**, listed as **YVY** in the portfolio's Misc section.
- Portfolio: https://matthiaskappeler.ch/#misc
- Original film: https://vimeo.com/367704820
- Portfolio credits: Matthias Kappeler — DoP, editor, colorist; production — Philipp Müller.
- Images: frames extracted from the publicly playable 1920 × 1080 film and resized
  to 1600 × 900 JPEGs, preserving the film's original monochrome treatment and split screens.
- The footage visibly uses a studio backdrop. The published credits do not establish
  that it was filmed at Studio Uto; the page therefore describes the creative network
  without claiming every project was made at this location.

| Asset | Approximate film time | Selection |
| --- | --- | --- |
| yvy-01.jpg | 00:47.5 | Group composition |
| yvy-02.jpg | 00:05.5 | White suit portrait |
| yvy-03.jpg | 00:34.5 | Raised-arm portrait |
| yvy-04.jpg | 00:17.5 | Harness / full-length diptych |
| yvy-05.jpg | 00:23.5 | Portrait / accessories diptych |
| yvy-06.jpg | 00:25.5 | Full-length / texture diptych |
| yvy-07.jpg | 00:31.5 | Cap portraits |
| yvy-08.jpg | 00:41.5 | Mesh texture |
| yvy-09.jpg | 00:45.5 | Portrait / belt and bag diptych |

The former generated North Face files remain in `src/assets/impressionen/matthias-kappeler/`
for reversibility but are no longer selected by the gallery.

## Nicolas Burri — Manor

Verified and replaced on 2026-10-01. All six former `nb-*.jpg` images were
generated placeholders, not photographs by Nicolas Burri. The previous AKRIS
credit did not describe those images.

- Portfolio: https://www.nicolasburristudio.com/ (Commercial, Manor series).
- Attribution evidence: the published images are labelled
  `NICOLASBURRISTUDIO – Manor <number>.jpg` and grouped with the Manor logo.
- Images: original JPEGs from the portfolio's Wix media CDN, copied without
  retouching or colour changes. Astro creates the display renditions.
- The existing asset paths are retained so the homepage's shared Nicolas Burri
  images also use real work. The gallery and lightbox now credit **Manor**.
- The portfolio establishes the photographer/client attribution, not the shoot
  location; no claim is made that these photographs were shot at Studio Uto.

| Local asset | Portfolio image | Original source |
| --- | --- | --- |
| nb-01.jpg | Manor 039 | https://static.wixstatic.com/media/498a86_56aee811628d41f88dec6d26779d4755~mv2.jpg |
| nb-02.jpg | Manor 024 | https://static.wixstatic.com/media/498a86_293ffff0ecf94e4badb93e822e721fa2~mv2.jpg |
| nb-03.jpg | Manor 031 | https://static.wixstatic.com/media/498a86_d4275aec7cf242b98f1169cd0280d150~mv2.jpg |
| nb-04.jpg | Manor 033 | https://static.wixstatic.com/media/498a86_a0fad5e19d9a4518aa663a8038a0e2be~mv2.jpg |
| nb-05.jpg | Manor 025 | https://static.wixstatic.com/media/498a86_859ad531650d422fa648fe0d9f20e747~mv2.jpg |
| nb-06.jpg | Manor 029 | https://static.wixstatic.com/media/498a86_ab384789bde244f6a61419f4092a245c~mv2.jpg |

# Studio imagery and Information copy

Pulled from the live site on 2026-09-29.

- `src/assets/studio/{sicht-von-der-kueche,shooting-flaeche,panorama,mittagslicht,boden,kaffeemaschine}.jpg`:
  the 2025 studio shoot on studio-uto.ch (full 2500 px originals from the Webflow CDN).
  `image-1.jpg` / `image-2.jpg` are older 1080 px crops of two of these, still used by the page transition reel.
- `src/assets/studio/grundriss.png`: floor plan from studio-uto.ch. It labels the room
  12.5 × 6.5 m, while the fact sheet says 14 × 7 m (whole studio with kitchen). Confirm with the studio.
- Beteiligte + websites: studio-uto.ch/kontakt (schema.org `member` list).
- Instagram: https://www.instagram.com/studio.uto/
- Information page (`src/lib/information.ts`): studio description from the live site's
  LocalBusiness metadata; Atelier Uto cooperative text and "Tram, Bus und Bahnhof sind ganz
  in der Nähe" from the Atelier Uto listing on raumboerse-zh.ch.
