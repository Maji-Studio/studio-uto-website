import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/",
      "output/",
      "src/payload-types.ts",
      "src/app/(payload)/admin/importMap.js",
    ],
  },
];
