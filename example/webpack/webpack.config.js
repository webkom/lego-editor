const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = () => {
  return {
    output: {
      path: path.resolve(__dirname, '../build'),
      filename: '[name]-[hash].js',
      sourceMapFilename: '[file].map'
    },
    entry: path.resolve(__dirname, '../src/index.js'),
    module: {
      rules: [
        {
          test: /\.js?$/,
          use: 'source-map-loader',
          enforce: 'pre'
        },
        {
          test: /\.js?$/,
          use: {
            loader: 'babel-loader'
          },
          exclude: /node_modules/
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader'
            }
          ]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js', '.css']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../src/index.html'),
        filname: './index.html'
      }),
      new webpack.HotModuleReplacementPlugin()
    ],
    devServer: {
      contentBase: path.resolve(__dirname, '../dist'),
      hot: true
    },
    devtool: 'source-map'
  };
};
