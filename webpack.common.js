const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: path.resolve(__dirname, "src/index.ts"),
    iframe: path.resolve(__dirname, "src/index-internal.ts"),
  },

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  module: {
    rules: [
      { test: /\.(ts|js)x?$/, loader: "babel-loader", exclude: /node_modules/ },
    ],
  },

  // todo: add minifier for css in html file
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new HtmlWebPackPlugin({
      template: "assets/index.html",
      chunks: ["main"],
      inject: "head",
    }),
    new HtmlWebPackPlugin({
      filename: "iframe.html",
      template: "assets/iframe.html",
      chunks: ["iframe"],
      inject: "head",
    }),
  ],
};
