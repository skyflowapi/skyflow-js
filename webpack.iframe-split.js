/*
Copyright (c) 2022 Skyflow, Inc.
*/
const { merge } = require('webpack-merge');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const terserWebpackPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const DynamicBundleLoaderPlugin = require('./webpack-plugins/dynamic-bundle-loader');
const common = require('./webpack.common.js');

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

module.exports = () => merge(common, {
  mode: 'production',

  entry: {
    'collect': [
      path.resolve(__dirname, 'src/index-internal-collect.ts'),
    ],
    'reveal': [
      path.resolve(__dirname, 'src/index-internal-reveal.ts'),
    ],
    'composable-reveal': [
      path.resolve(__dirname, 'src/index-internal-composable-reveal.ts'),
    ],
    'controller': [
      path.resolve(__dirname, 'src/index-internal-controller.ts'),
    ],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/v1/elements'),
  },

  optimization: {
    runtimeChunk: false,
    minimizer: [new terserWebpackPlugin()],
    // splitChunks disabled - all dependencies bundled into each file
  },
  
  module: {
    rules: [],
  },

  plugins: [
    // Single HTML file that dynamically loads the correct JS bundle
    // based on container type from window.name
    new HtmlWebPackPlugin({
      filename: 'iframe.html',
      template: 'assets/iframe.html',
      chunks: [], // No chunks - we'll load JS dynamically via plugin
      inject: false, // Don't auto-inject scripts
      minify,
    }),
    // Inject dynamic bundle loader script at build time
    new DynamicBundleLoaderPlugin({
      bundleMap: {
        'element': 'collect.js',
        'reveal': 'reveal.js',
        'reveal-composable': 'composable-reveal.js',
        'skyflow_controller': 'controller.js'
      }
    }),
    new CleanWebpackPlugin({
      verbose: true,
      dry: false,
    }),
    new WebpackManifestPlugin(),
    new CompressionPlugin(),
  ],
});
