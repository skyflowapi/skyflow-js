/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Shared production node-SDK (UMD) build factory. The UMD global differs per
// package, so it is passed in. A package's webpack.skyflow-node.js is:
//   module.exports = require('../../webpack/node.js')(__dirname, { library: 'Skyflow' });
const { merge } = require('webpack-merge');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const terserWebpackPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const common = require('./common.js');

module.exports = (packageDir, { library }) => () => merge(common(packageDir), {
  mode: 'production',
  entry: {
    index: [path.resolve(packageDir, 'src/index-node.ts')],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(packageDir, 'dist/sdkNodeBuild'),
    library,
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
    publicPath: '',
  },
  optimization: {
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
