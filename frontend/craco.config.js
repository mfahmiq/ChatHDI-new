// craco.config.js
const path = require("path");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
  enableVisualEdits: isDevServer, // Only enable during dev server
};

// Conditionally load visual edits modules only in dev mode
let setupDevServer;
let babelMetadataPlugin;

if (config.enableVisualEdits) {
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  eslint: {
    enable: true,
    mode: "extends",
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
    loaderOptions: (eslintLoaderOptions) => {
      // Don't fail build on warnings during CI
      if (process.env.CI) {
        eslintLoaderOptions.failOnWarning = false;
      }
      return eslintLoaderOptions;
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      "process/browser": "process/browser.js",
      "node:fs": false,
      "node:path": false,
      "node:os": false,
      "node:crypto": false,
      "node:stream": false,
      "node:http": false,
      "node:https": false,
      "node:zlib": false,
      "node:url": false,
      "node:buffer": false,
      "node:util": false,
      "node:process": false,
    },
    configure: (webpackConfig) => {

      // Add ignored patterns to reduce watched directories
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };

      // Polyfill Node.js core modules for Webpack 5
      const nodeFallbacks = {
        "fs": false,
        "path": false,
        "os": false,
        "crypto": false,
        "stream": false,
        "http": false,
        "https": false,
        "zlib": false,
        "url": false,
        "util": false,
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser"),
      };

      // Add node: prefixed versions
      Object.keys(nodeFallbacks).forEach(key => {
        if (key !== "buffer" && key !== "process") {
          nodeFallbacks[`node:${key}`] = false;
        } else {
          nodeFallbacks[`node:${key}`] = nodeFallbacks[key];
        }
      });

      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        ...nodeFallbacks
      };

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        ...nodeFallbacks
      };

      const webpack = require("webpack");
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: "process/browser.js",
          Buffer: ["buffer", "Buffer"],
        }),
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            const mod = resource.request.replace(/^node:/, "");
            if (nodeFallbacks[`node:${mod}`] === false || nodeFallbacks[mod] === false) {
              resource.request = path.resolve(__dirname, 'src/utils/empty.js');
            }
          }
        ),
      ];

      // Aggressively handle node: scheme via externals for browser
      webpackConfig.externals = {
        ...webpackConfig.externals,
        'node:fs': 'null',
        'node:path': 'null',
        'node:os': 'null',
        'node:crypto': 'null',
        'node:stream': 'null',
        'node:http': 'null',
        'node:https': 'null',
        'node:zlib': 'null',
        'node:url': 'null',
        'node:util': 'null',
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

// Only add babel metadata plugin during dev server
if (config.enableVisualEdits && babelMetadataPlugin) {
  webpackConfig.babel = {
    plugins: [babelMetadataPlugin],
  };
}

webpackConfig.devServer = (devServerConfig) => {
  // Apply visual edits dev server setup only if enabled
  if (config.enableVisualEdits && setupDevServer) {
    devServerConfig = setupDevServer(devServerConfig);
  }

  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

module.exports = webpackConfig;
