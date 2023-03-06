const { withSentryConfig } = require("@sentry/nextjs");
const { withPlausibleProxy } = require("next-plausible");

const moduleExports = {
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
