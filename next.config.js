const { withSentryConfig } = require("@sentry/nextjs");
const { withPlausibleProxy } = require("next-plausible");

const moduleExports = {
  async redirects() {
    return [
      {
        source: "/discord",
        destination: "https://discord.gg/M4uYMyU7bC",
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
        destination:
          "https://discord.com/servers/puff-social-479769841763483658",
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
