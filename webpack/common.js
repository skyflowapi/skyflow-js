/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Shared webpack "common" factory for every SDK package (skyflow-js,
// skyflow-flowvault-js, ...). Each package's build wrappers call this with their
// own package directory so the loaders, the `@core` alias and the DefinePlugin
// wiring are defined exactly once, while telemetry identity stays per-package.
const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = (packageDir) => {
  // SDK telemetry identity — injected per package at build time from the CALLING
  // package's own package.json (each package injects its own name/version, so
  // telemetry + the JS/React language-label resolve to that package's identity).
  const pkg = require(path.join(packageDir, 'package.json'));

  return {
    target: 'web',
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      // `@core` — mirror of the tsconfig.base.json path alias (single source of
      // truth). Keep this in sync with tsconfig.base.json `paths` and
      // jest.config.json `moduleNameMapper`. core/ lives at the monorepo root,
      // one level up from this webpack/ folder.
      alias: {
        '@core': path.resolve(__dirname, '../core'),
      },
    },
    module: {
      rules: [
        // rootMode:'upward' so files under core/ (outside each package) resolve
        // the single shared babel.config.js at the monorepo root.
        {
          test: /\.(ts|js)x?$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: { rootMode: 'upward' },
        },
        {
          test: /\.svg$/,
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new NodePolyfillPlugin(),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          IFRAME_SECURE_SITE: process.env.IFRAME_SECURE_SITE,
          IFRAME_SECURE_ORIGIN: process.env.IFRAME_SECURE_ORIGIN,
        }),
        SDK_NAME: JSON.stringify(pkg.name),
        SDK_VERSION: JSON.stringify(pkg.version),
      }),
    ],
  };
};
