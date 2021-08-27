const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = () => {
  return merge(common, {
    mode: "production",
    entry: {
      index: [
        "core-js/stable",
        path.resolve(__dirname, "src/index-node.ts"),
      ],
    },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist/sdkNodeBuild"),
      library: "Skyflow",
      libraryTarget: "umd",
      globalObject: "this",
      umdNamedDefine: true,
    },
    optimization: {
      runtimeChunk: false,
      // minimizer: [new UglifyJsPlugin()],
    },
    module: {
      rules: [],
    },
    plugins: [
      new CleanWebpackPlugin({
        verbose: true,
        dry: false,
      }),
      // new UglifyJsPlugin(),
      new ManifestPlugin(),
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(process.env),
      }),
      new CompressionPlugin(),
    ],
  });
};
