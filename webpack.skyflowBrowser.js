const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const terserWebpackPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = () => {
  return merge(common, {
    mode: "production",

    entry: {
      index: ["core-js/stable", path.resolve(__dirname, "src/index.ts")],
    },

    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist/v1"),
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
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(process.env),
      }),
      new CompressionPlugin(),
    ],
  });
};
