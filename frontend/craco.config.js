// craco.config.js
const path = require("path");
const webpack = require("webpack");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
const isDevServer = process.env.NODE_ENV !== "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
  enableVisualEdits: isDevServer,
};

// Conditionally load plugins
let setupDevServer, babelMetadataPlugin, WebpackHealthPlugin, setupHealthEndpoints, healthPluginInstance;
if (config.enableVisualEdits) {
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
}
if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

module.exports = {
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
      if (process.env.CI) {
        eslintLoaderOptions.failOnWarning = false;
      }
      return eslintLoaderOptions;
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // 1. Suppress all source map warnings (fixes local ENOENT red screen)
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
        /source-map-loader/,
      ];

      // 2. Robustly exclude node_modules from source-map-loader
      webpackConfig.module.rules.forEach(rule => {
        if (rule.oneOf) {
          rule.oneOf.forEach(subRule => {
            if (subRule.loader && subRule.loader.includes('source-map-loader')) {
              subRule.exclude = /node_modules/;
            }
          });
        }
        if (rule.loader && rule.loader.includes('source-map-loader')) {
          rule.exclude = /node_modules/;
        }
      });

      // 3. Clean Polyfills for Webpack 5
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

      // Apply node:* prefixing logic
      Object.keys(nodeFallbacks).forEach(key => {
        nodeFallbacks[`node:${key}`] = nodeFallbacks[key];
      });

      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        ...nodeFallbacks
      };

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        ...nodeFallbacks
      };

      // 4. Plugins logic
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: require.resolve("process/browser"),
          Buffer: ["buffer", "Buffer"],
        }),
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            const mod = resource.request.replace(/^node:/, "");
            if (nodeFallbacks[mod] === false) {
              resource.request = path.resolve(__dirname, 'src/utils/empty.js');
            }
          }
        ),
        new webpack.IgnorePlugin({
          resourceRegExp: /^node:/,
        }),
      ];

      // 5. Build context & Stability
      webpackConfig.externals = {
        ...webpackConfig.externals,
        'node:fs': 'null',
        'node:path': 'null',
        'node:os': 'null',
        'node:crypto': 'null',
      };

      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }

      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    if (config.enableVisualEdits && setupDevServer) {
      devServerConfig = setupDevServer(devServerConfig);
    }
    if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
      const originalSetupMiddlewares = devServerConfig.setupMiddlewares;
      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        if (originalSetupMiddlewares) middlewares = originalSetupMiddlewares(middlewares, devServer);
        setupHealthEndpoints(devServer, healthPluginInstance);
        return middlewares;
      };
    }
    return devServerConfig;
  },
};
