const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");

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

module.exports = () => {
  return merge(common, {
    mode: "production",

    entry: {
      index: [
        "core-js/stable",
        path.resolve(__dirname, "src/index-internal.ts"),
      ],
    },

    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist/iframeBuild"),
    },

    optimization: {
      runtimeChunk: false,
      // minimizer: [new UglifyJsPlugin()],
    },
    module: {
      rules: [],
    },

    // todo: add minifier for css in html file
    plugins: [
      new HtmlWebPackPlugin({
        filename: "index.html",
        template: "assets/iframe.html",
        chunks: ["index"],
        inject: "head",
        minify,
      }),
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