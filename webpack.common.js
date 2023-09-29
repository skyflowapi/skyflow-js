/*
Copyright (c) 2022 Skyflow, Inc.
*/
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
  target: 'web',
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      { test: /\.(ts|js)x?$/, loader: 'babel-loader', exclude: /node_modules/ },
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
        IFRAME_SECURE_ORGIN: process.env.IFRAME_SECURE_ORGIN,
      }),
    }),
   ],
};
