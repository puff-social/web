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
  subdirectory: "",
  scriptName: "app",
  customDomain: "https://analytics.dstn.to",
})(withSentryConfig(moduleExports, sentryWebpackPluginOptions));
