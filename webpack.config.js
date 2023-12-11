const path = require("path");
const nodeExternals = require("webpack-node-externals");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "node",
  entry: "./server.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  externals: [nodeExternals()],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "views",
          to: path.resolve(__dirname, "dist/views/"),
        },
        {
          from: "uploads",
          to: path.resolve(__dirname, "dist/uploads/"),
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ejs$/,
        loader: "ejs-webpack-loader",
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset/resource",
        generator: {
          filename: "images/[hash][ext][query]",
        },
      },
    ],
  },
};
