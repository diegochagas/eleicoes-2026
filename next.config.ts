import type { NextConfig } from "next";

// The site is fully static. BASE_PATH is set only when building for a host that
// serves it under a sub-path (GitHub Pages project sites: "/<repo>").
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.BASE_PATH || undefined,
};

export default nextConfig;
