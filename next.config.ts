import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Pas de token d'authentification Sentry configuré pour ce pilote (upload de
// source maps désactivé, voir sourcemaps.disable) : évite de bloquer le
// build en son absence, quitte à avoir des stack traces minifiées dans
// Sentry pour l'instant.
export default withSentryConfig(nextConfig, {
  org: "atlaslab",
  project: "scolaris",
  silent: !process.env.CI,
  sourcemaps: { disable: true },
});
