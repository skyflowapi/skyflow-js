/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Shared dev-server build factory (webpack serve). Per-package knobs — the dev
// server port, the bundle-analyzer port, and an optional local `/vault` proxy —
// are passed in so two SDK dev servers can run side by side. A package's
// webpack.dev.js is a thin wrapper:
//   module.exports = require('../../webpack/dev.js')(__dirname, {
//     port: 3040, analyzerPort: 8881,
//     // proxy: { '/vault': { target: 'https://<your-dev-vault>', ... } }, // local only
//   });
const path = require('path');
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyser = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const common = require('./common.js');

const minify = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
};

module.exports = (packageDir, { port, analyzerPort, proxy } = {}) => () => merge(common(packageDir), {
  entry: {
    skyflow: [path.resolve(packageDir, 'src/index.ts')],
    iframe: [
      path.resolve(packageDir, 'src/index-internal.ts'),
    ],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(packageDir, 'dist'),
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port,
    // Optional per-developer proxy (e.g. `/vault` -> a dev vault). Kept out of
    // the shared factory so proxy targets never get committed.
    ...(proxy ? { proxy } : {}),
    historyApiFallback: true,
    open: true,
    // todo: add routes for iframe and index ex: / for index.html and iframe for iframe.html
    // contentBase: commonPaths.outputPath,
    compress: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
          'X-Requested-With, content-type, Authorization',
    },
  },
  plugins: [
    new BundleAnalyser({ analyzerPort }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../assets/index.html'),
      chunks: ['skyflow'],
      inject: 'head',
      minify,
    }),
    new HtmlWebpackPlugin({
      filename: 'iframe.html',
      template: path.resolve(__dirname, '../assets/iframe.html'),
      chunks: ['iframe'],
      inject: 'head',
      minify,
    }),
  ],
});
