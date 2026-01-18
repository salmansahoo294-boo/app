const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Disable TypeScript type checking in production builds
      const typeCheckPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
      );
      
      if (typeCheckPlugin) {
        const pluginIndex = webpackConfig.plugins.indexOf(typeCheckPlugin);
        webpackConfig.plugins.splice(pluginIndex, 1);
      }

      return webpackConfig;
    },
  },
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
};
