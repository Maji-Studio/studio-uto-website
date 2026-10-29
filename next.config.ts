import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaEndpoint = process.env.NEXT_PUBLIC_S3_PUBLIC_ENDPOINT
  ? new URL(process.env.NEXT_PUBLIC_S3_PUBLIC_ENDPOINT)
  : undefined;

const nextConfig: NextConfig = {
  // The site keeps its trailing-slash URLs from the Astro build (/kontakt/).
  trailingSlash: true,
  images: {
    localPatterns: [{ pathname: "/api/media/file/**" }],
    remotePatterns: mediaEndpoint
      ? [
          {
            protocol: mediaEndpoint.protocol === "http:" ? "http" : "https",
            hostname: mediaEndpoint.hostname,
            port: mediaEndpoint.port,
            pathname: `${mediaEndpoint.pathname.replace(/\/+$/, "")}/**`,
          },
        ]
      : [],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return webpackConfig;
  },
  turbopack: {
    root: path.resolve(dirname),
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
