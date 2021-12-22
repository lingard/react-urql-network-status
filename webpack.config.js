const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack')
const DotEnv = require('dotenv-webpack')

module.exports = {
  entry: './example/index.tsx',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        include: /node_modules/,
        test: /\.mjs$/,
        type: 'javascript/auto'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', 'mjs']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devServer: {
    open: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'example/index.html'
    }),
    new DotEnv({
      path: './example/.env'
    })
  ]
}
