/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Shared production iframe (secure elements) build factory. A package's
// webpack.iframe.js is a one-line wrapper:
//   module.exports = require('../../webpack/iframe.js')(__dirname);
const { merge } = require('webpack-merge');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const terserWebpackPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
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

module.exports = (packageDir) => () => merge(common(packageDir), {
  mode: 'production',

  entry: {
    index: [
      path.resolve(packageDir, 'src/index-internal.ts'),
    ],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(packageDir, 'dist/v1/elements'),
  },

  optimization: {
    runtimeChunk: false,
    minimizer: [new terserWebpackPlugin()],
  },
  module: {
    rules: [],
  },

  // todo: add minifier for css in html file
  plugins: [
    new HtmlWebPackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../assets/iframe.html'),
      chunks: ['index'],
      inject: 'head',
      minify,
    }),
    new CleanWebpackPlugin({
      verbose: true,
      dry: false,
    }),
    new WebpackManifestPlugin(),
    new CompressionPlugin(),
  ],
});
