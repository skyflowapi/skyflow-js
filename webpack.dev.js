const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BundleAnalyser = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

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
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
      port: 3040,
      historyApiFallback: true,
      overlay: true,
      open: true,
      stats: "errors-only",
      //todo: add routes for iframe and index ex: / for index.html and iframe for iframe.html
    },
    plugins: [
      new BundleAnalyser({ analyzerPort: 8881 }),
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(process.env),
      }),
      new HtmlWebpackPlugin({
        template: "assets/index.html",
        chunks: ["skyflow"],
        inject: "head",
        minify,
      }),
    ],
  });
};
