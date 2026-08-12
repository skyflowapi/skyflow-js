/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Shared production browser-SDK build factory. A package's
// webpack.skyflow-browser.js is a one-line wrapper:
//   module.exports = require('../../webpack/browser.js')(__dirname);
const { merge } = require('webpack-merge');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const terserWebpackPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const common = require('./common.js');

module.exports = (packageDir) => () => merge(common(packageDir), {
  mode: 'production',

  entry: {
    index: [path.resolve(packageDir, 'src/index.ts')],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(packageDir, 'dist/v1'),
  },
  optimization: {
    // splitChunks: {
    //   chunks: "all",
    // },
    runtimeChunk: false,
    minimizer: [new terserWebpackPlugin()],
  },
  module: {
    rules: [],
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: true,
      dry: false,
    }),
    new WebpackManifestPlugin(),
    new CompressionPlugin(),
  ],
});
