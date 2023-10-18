const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: [
    path.resolve(__dirname, './examples/index.jsx'),
  ],
  output: {
    filename: 'bundle.js'
  },
  module : {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
    static: path.resolve(__dirname, './examples'),
    port: 8080,
    hot: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
