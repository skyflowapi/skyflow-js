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
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
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
    index: [
      path.resolve(__dirname, 'src/index-internal.ts'),
    ],
  },

  output: {
    filename: '[name].js',
    crossOriginLoading: 'anonymous',
    path: path.resolve(__dirname, 'dist/v1/elements'),
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
      template: 'assets/iframe.html',
      chunks: ['index'],
      inject: 'head',
      minify,
    }),
    new SubresourceIntegrityPlugin({ 
      hashFuncNames: ['sha256'],
      enabled: true,
    }),
    new CleanWebpackPlugin({
      verbose: true,
      dry: false,
    }),
    new WebpackManifestPlugin(),
    new CompressionPlugin(),
  ],
});
