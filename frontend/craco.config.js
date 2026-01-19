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

      // Optimize for Vercel
      if (process.env.VERCEL) {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          moduleIds: 'deterministic',
        };
      }

      return webpackConfig;
    },
  },
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
  // Increase max memory for build
  devServer: {
    client: {
      overlay: false,
    },
  },
};
