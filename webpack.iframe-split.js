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
    splitChunks: {
      cacheGroups: {
        // Common vendor code shared across all bundles
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 10,
        },
        // Common internal code
        common: {
          minChunks: 2,
          name: 'common',
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
  },
  
  module: {
    rules: [],
  },

  plugins: [
    // HTML file for collect elements
    new HtmlWebPackPlugin({
      filename: 'collect.html',
      template: 'assets/iframe.html',
      chunks: ['vendor', 'common', 'collect'],
      inject: 'head',
      minify,
    }),
    // HTML file for reveal elements
    new HtmlWebPackPlugin({
      filename: 'reveal.html',
      template: 'assets/iframe.html',
      chunks: ['vendor', 'common', 'reveal'],
      inject: 'head',
      minify,
    }),
    // HTML file for composable reveal elements
    new HtmlWebPackPlugin({
      filename: 'composable-reveal.html',
      template: 'assets/iframe.html',
      chunks: ['vendor', 'common', 'composable-reveal'],
      inject: 'head',
      minify,
    }),
    // HTML file for controller frame
    new HtmlWebPackPlugin({
      filename: 'controller.html',
      template: 'assets/iframe.html',
      chunks: ['vendor', 'common', 'controller'],
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
