import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { isServer }: { isServer: boolean }) {
    if (!isServer) {
      // satellite.js v7 includes an optional WASM pthreads runtime that
      // conditionally imports node:module / node:worker_threads (only at
      // runtime in a Node.js environment, behind an env-detection guard).
      // Webpack cannot parse "node:" URI schemes, so we redirect them to
      // empty modules in the browser bundle.
      const { NormalModuleReplacementPlugin } = require("webpack");

      config.plugins = [
        ...(config.plugins ?? []),
        // Redirect node: protocol imports to empty modules on the client
        new NormalModuleReplacementPlugin(
          /^node:module$/,
          require.resolve("./node-module-stub.js")
        ),
        new NormalModuleReplacementPlugin(
          /^node:worker_threads$/,
          require.resolve("./node-module-stub.js")
        ),
      ];
    }

    return config;
  },
};

export default nextConfig;
