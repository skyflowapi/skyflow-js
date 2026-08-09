/*
Copyright (c) 2022 Skyflow, Inc.
*/
const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
// SDK telemetry identity — injected per package at build time from this
// package's own package.json (each package injects its own name/version).
const pkg = require('./package.json');

module.exports = {
  target: 'web',
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    // `@core` — mirror of the tsconfig.base.json path alias (single source of
    // truth). Keep this in sync with tsconfig.base.json `paths` and
    // jest.config.json `moduleNameMapper`. core/ lives at the monorepo root,
    // two levels up from this package.
    alias: {
      '@core': path.resolve(__dirname, '../../core'),
    },
  },
  module: {
    rules: [
      // rootMode:'upward' so files under core/ (above this package) resolve the
      // single shared babel.config.js at the monorepo root.
      {
        test: /\.(ts|js)x?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: { rootMode: 'upward' },
      },
      {
        test:/\.svg$/,
        type:'asset/resource'
      }
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
