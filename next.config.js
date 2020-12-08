/* eslint no-undef: error */
const withPlugins = require("next-compose-plugins");

module.exports = withPlugins(
  [
    () => ({
      webpack(cfg) {
        cfg.module.rules.push({
          test: /\.tsx$/,
          use: [
            {
              loader: "astroturf/loader",
              options: { extension: ".module.css" },
            },
          ],
        });

        return cfg;
      },
    }),
  ],
  {
    poweredByHeader: false,
    reactStrictMode: true,
  }
);
