import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { sharpTransformer } from "@payloadcms/transformer-sharp";
import { s3Storage } from "@payloadcms/storage-s3";
import { de } from "payload/i18n/de";
import { en } from "payload/i18n/en";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";

import { Media, mediaVariants } from "./payload/collections/Media/Media";
import { Users } from "./payload/collections/Users";
import { Impressionen } from "./payload/collections/Impressionen";
import { SiteSettings } from "./payload/globals/SiteSettings";
import { Information } from "./payload/globals/Information";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const publicEndpoint = process.env.NEXT_PUBLIC_S3_PUBLIC_ENDPOINT?.replace(
  /\/+$/,
  "",
);
const isProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : process.env.NODE_ENV === "production";
const mediaPrefix = isProduction
  ? "media"
  : `media-${process.env.NEXT_PUBLIC_MEDIA_POSTFIX || "local"}`;

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
  db: mongooseAdapter({ url: process.env.DATABASE_URI || "" }),
  upload: {
    transformers: [
      sharpTransformer({ collections: { media: { variants: mediaVariants } } }),
    ],
  },
  storage: [
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      acl: "public-read",
      bucket: process.env.S3_BUCKET || "",
      collections: {
        media: {
          prefix: mediaPrefix,
          ...(publicEndpoint
            ? {
                disablePayloadAccessControl: true,
                generateFileURL: ({ filename, prefix }) =>
                  `${publicEndpoint}/${[prefix, filename]
                    .filter(Boolean)
                    .map((part) =>
                      part!.split("/").map(encodeURIComponent).join("/"),
                    )
                    .join("/")}`,
              }
            : {}),
        },
      },
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        forcePathStyle: true,
      },
    }),
  ],
});
