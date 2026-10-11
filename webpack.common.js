const path = require('path');
const { globSync } = require('glob');
const TerserPlugin = require('terser-webpack-plugin');

const tsSrc = './src/ts';
const entries = Object.fromEntries(
  globSync('**/*.ts', {
    ignore: '**/_*.ts',
    cwd: tsSrc,
    posix: true,
  }).map((file) => [file.replace(/\.ts$/, ''), path.resolve(tsSrc, file)]),
);

module.exports = {
  entry: entries,
  output: {
    path: path.join(__dirname, './dist/assets/js'),
    filename: '[name].js',
    sourceMapFilename: '../../../maps/js/[name].map',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  target: 'web',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
};
