import { describe, expect, it } from "vitest";
import type {
  Impressionen,
  Information,
  Media,
  SiteSetting,
} from "@/payload-types";
import {
  toContentImage,
  toImpressions,
  toSiteSettings,
  toStudioSections,
} from "./payload";

const media: Media = {
  id: "photo",
  alt: "Studio",
  url: "/original.jpg",
  width: 2560,
  height: 1707,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("toContentImage", () => {
  it("drops the trailing slash Payload adds to file URLs", () => {
    expect(
      toContentImage({ ...media, url: "/api/media/file/a.jpg/" })?.src,
    ).toBe("/api/media/file/a.jpg");
  });

  it("prefers the main file when a size is missing and preserves the crop", () => {
    expect(
      toContentImage(
        {
          ...media,
          variants: { sm: { url: "/sm.jpg", width: 480, height: 320 } },
        },
        {
          objectPosition: "50% 15%",
        },
      ),
    ).toEqual({
      src: "/original.jpg",
      width: 2560,
      height: 1707,
      alt: "Studio",
      objectPosition: "50% 15%",
    });
  });

  it("falls back to the largest usable variant only when the main URL is absent", () => {
    expect(
      toContentImage({
        ...media,
        url: null,
        variants: {
          sm: { url: "/sm.jpg", width: 480, height: 320 },
          xl: { url: "/xl.jpg", width: 1920, height: 1280 },
          "2xl": { url: "/broken.jpg" },
        },
      }),
    ).toEqual({ src: "/xl.jpg", width: 1920, height: 1280, alt: "Studio" });
  });

  it("omits unpopulated, missing and dimensionless images", () => {
    expect(toContentImage("photo")).toBeUndefined();
    expect(toContentImage(null)).toBeUndefined();
    expect(toContentImage({ ...media, width: null })).toBeUndefined();
    expect(toContentImage({ ...media, url: null })).toBeUndefined();
  });
});

describe("toStudioSections", () => {
  it("splits paragraphs and lines, trims whitespace and drops empty entries", () => {
    const global: Information = {
      id: "info",
      sections: [
        {
          anchor: "studio",
          title: "Studio",
          navLabel: " ",
          blocks: [
            {
              label: " Details ",
              text: "  Eins\r\nweiter.\r\n \r\n Zwei.\n\n\n ",
              lines: " A\r\n\n B \n ",
              note: " Hinweis ",
            },
          ],
        },
      ],
    };
    expect(toStudioSections(global)).toEqual([
      {
        id: "studio",
        title: "Studio",
        blocks: [
          {
            label: "Details",
            text: ["Eins\r\nweiter.", "Zwei."],
            lines: ["A", "B"],
            note: "Hinweis",
          },
        ],
      },
    ]);
  });

  it("omits empty blocks and optional keys, including unpopulated galleries", () => {
    expect(
      toStudioSections({
        id: "info",
        sections: [
          {
            anchor: "daten",
            title: "Daten",
            blocks: [
              {
                label: " ",
                text: "\n\n",
                lines: "\n",
                note: " ",
                pairs: [],
                links: [],
              },
              {
                label: "Empty heading",
                galleryName: "Gallery",
                galleryImages: ["missing"],
              },
              { text: "Content", figure: "missing", note: "" },
            ],
          },
        ],
      }),
    ).toEqual([
      { id: "daten", title: "Daten", blocks: [{ text: ["Content"] }] },
    ]);
    expect(toStudioSections({ id: "info" })).toEqual([]);
  });

  it("maps galleries, figures, pairs and links without CMS metadata", () => {
    const global: Information = {
      id: "info",
      sections: [
        {
          anchor: "bilder",
          title: "Bilder",
          blocks: [
            {
              figure: media,
              galleryName: " Studio ",
              galleryImages: ["missing", media],
              pairs: [{ term: "Tag", detail: "850", id: "pair" }],
              links: [
                {
                  label: "Buchen",
                  detail: "Anfragen",
                  href: "/kontakt/",
                  external: null,
                  id: "link",
                },
              ],
            },
          ],
        },
      ],
    };
    expect(toStudioSections(global)[0].blocks).toEqual([
      {
        figure: toContentImage(media),
        gallery: { name: "Studio", images: [toContentImage(media)] },
        pairs: [{ term: "Tag", detail: "850" }],
        links: [{ label: "Buchen", detail: "Anfragen", href: "/kontakt/" }],
      },
    ]);
  });
});

it("maps impression order, client names and focal positions", () => {
  const docs: Impressionen[] = [
    {
      id: "one",
      name: "Nicolas",
      client: " Manor ",
      images: [
        { image: "missing" },
        { image: media, objectPosition: "50% 15%" },
      ],
      createdAt: "",
      updatedAt: "",
    },
    { id: "two", name: "Matthias", client: " ", createdAt: "", updatedAt: "" },
  ];
  expect(toImpressions(docs)).toEqual([
    {
      name: "Nicolas",
      client: "Manor",
      images: [{ ...toContentImage(media), objectPosition: "50% 15%" }],
    },
    { name: "Matthias", images: [] },
  ]);
});

it("maps settings without leaking document and nested row IDs", () => {
  const global: SiteSetting = {
    id: "site",
    name: "Studio Uto",
    description: "Studio",
    contact: {
      email: "info@example.test",
      instagram: "https://example.test",
      instagramHandle: "@studio",
    },
    address: { name: "Atelier", street: "Flüelastrasse 16", city: "Zürich" },
    primaryNav: [{ label: "Studio", href: "/", external: false, id: "row" }],
    socials: [
      { label: "Instagram", href: "https://example.test", external: true },
    ],
    beteiligte: [{ name: "Person", url: "https://example.test", id: "person" }],
  };
  expect(toSiteSettings(global)).toEqual({
    name: global.name,
    description: global.description,
    contact: global.contact,
    address: global.address,
    primaryNav: [{ label: "Studio", href: "/" }],
    socials: [
      { label: "Instagram", href: "https://example.test", external: true },
    ],
    beteiligte: [{ name: "Person", url: "https://example.test" }],
  });
});
