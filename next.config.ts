import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Raise the default 1 MB limit so multiple ID/VISA photos can be
      // uploaded in a single submission (phone photos are often 2-5 MB each;
      // a family of 4 can total 30+ MB).
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
