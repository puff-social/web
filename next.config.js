const { withSentryConfig } = require("@sentry/nextjs");
const { withPlausibleProxy } = require("next-plausible");

const cspHeader = `
    default-src wss://rosin.puff.social https://rosin.puff.social https://cdn.puff.social https://hash.puff.social 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src https://fonts.gstatic.com https://fonts.googleapis.com 'self' 'unsafe-inline';
    img-src https://cdn.puff.social 'self' blob: data:;
    font-src https://fonts.gstatic.com https://fonts.googleapis.com 'self';
    connect-src https://o1220194.ingest.sentry.io 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

const moduleExports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/puffco",
        destination: "https://puff.social/pals",
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
