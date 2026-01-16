const path = require('path');

module.exports = {
  entry: {
    checkout: './src/sdk/index.js',  // The SDK
    app: './src/iframe-content/index.js' // The Checkout Page App
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      name: 'PaymentGateway',
      type: 'umd',
      export: 'default', // Export default from entry as the global
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
