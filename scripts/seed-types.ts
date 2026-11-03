import type { Information } from "../src/payload-types";

type Section = NonNullable<Information["sections"]>[number];
type Block = NonNullable<Section["blocks"]>[number];
export interface SeedImage {
  path: string;
  alt: string;
}
export type SeedSection = Omit<Section, "blocks"> & {
  blocks: (Omit<Block, "figure" | "galleryImages"> & {
    figure?: SeedImage;
    galleryImages?: SeedImage[];
  })[];
};
