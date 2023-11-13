const { withSentryConfig } = require("@sentry/nextjs");
const { withPlausibleProxy } = require("next-plausible");

const moduleExports = {
  async redirects() {
    return [
      {
        source: "/pals",
        destination: "http://rwrd.io/6ao52xb?s",
        permanent: false,
      },
      {
        source: "/puffco",
        destination: "http://rwrd.io/6ao52xb?s",
        permanent: false,
      },
      {
        source: "/fix-path",
        destination: "path-web-fullscreen://https://puffco.app",
        permanent: false,
      },
      {
        source: "/discord",
        destination: "https://discord.gg/puffsocial",
        permanent: false,
      },
      {
        source: "/instagram",
        destination: "https://instagram.com/puffdotsocial",
        permanent: false,
      },
      {
        source: "/ig",
        destination: "https://instagram.com/puffdotsocial",
        permanent: false,
      },
      {
        source: "/support",
        destination: "https://patreon.com/puffsocial",
        permanent: false,
      },
      {
        source: "/patreon",
        destination: "https://patreon.com/puffsocial",
        permanent: false,
      },
    ];
  },
  sentry: {
    hideSourceMaps: true,
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
};

module.exports = withPlausibleProxy({
  scriptName: "app",
  customDomain: "https://trck.dstn.to",
})(withSentryConfig(moduleExports, sentryWebpackPluginOptions));
