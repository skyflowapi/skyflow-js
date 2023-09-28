/*
Copyright (c) 2022 Skyflow, Inc.
*/
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyser = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
  entry: {
    skyflow: [ path.resolve(__dirname, 'src/index.ts')],
    iframe: [
      path.resolve(__dirname, 'src/index-internal.ts'),
    ],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port: 3040,
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
    new BundleAnalyser({ analyzerPort: 8881 }),
    new HtmlWebpackPlugin({
      template: 'assets/index.html',
      chunks: ['skyflow'],
      inject: 'head',
      minify,
    }),
    new HtmlWebpackPlugin({
      filename: 'iframe.html',
      template: 'assets/iframe.html',
      chunks: ['iframe'],
      inject: 'head',
      minify,
    }),
  ],
});
