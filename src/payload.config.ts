import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { sharpTransformer } from "@payloadcms/transformer-sharp";
import { mkdirSync } from "fs";
import { de } from "payload/i18n/de";
import { en } from "payload/i18n/en";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath, pathToFileURL } from "url";

import { Media, mediaVariants } from "./payload/collections/Media/Media";
import { Users } from "./payload/collections/Users";
import { Impressionen } from "./payload/collections/Impressionen";
import { SiteSettings } from "./payload/globals/SiteSettings";
import { Information } from "./payload/globals/Information";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseUri = process.env.DATABASE_URI || "file:./data/payload.db";
// libSQL does not create the folder for a local database file.
if (databaseUri.startsWith("file:")) {
  const databaseFile = fileURLToPath(
    new URL(databaseUri, pathToFileURL(`${process.cwd()}/`)),
  );
  mkdirSync(path.dirname(databaseFile), { recursive: true });
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: { supportedLanguages: { de, en }, fallbackLanguage: "de" },
  collections: [Users, Media, Impressionen],
  globals: [SiteSettings, Information],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: sqliteAdapter({
    client: { url: databaseUri },
    wal: true,
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  upload: {
    transformers: [
      sharpTransformer({
        dynamic: false,
        collections: {
          media: {
            resizeOptions: {
              width: 2560,
              fit: "inside",
              withoutEnlargement: true,
            },
            formatOptions: { format: "webp", options: { quality: 82 } },
            variants: mediaVariants,
          },
        },
      }),
    ],
  },
});
