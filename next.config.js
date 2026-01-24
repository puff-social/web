const { withSentryConfig } = require("@sentry/nextjs");
const { withPlausibleProxy } = require("next-plausible");

const cspHeader = `
    default-src wss://puff-ws.dstn.to wss://rosin.puff.social https://puff-ws.dstn.to https://rosin.puff.social https://puffcdn.dstn.to https://cdn.puff.social https://puff-api.dstn.to https://hash.puff.social https://o1220194.ingest.sentry.io 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src https://fonts.gstatic.com https://fonts.googleapis.com 'self' 'unsafe-inline';
    img-src https://cdn.puff.social 'self' blob: data:;
    font-src https://fonts.gstatic.com https://fonts.googleapis.com 'self';
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
        source: "/try-path",
        destination: "path-web-fullscreen://https://puff.social",
        permanent: false,
      },
      {
        source: "/discord",
        destination: "https://discord.gg/9F8SP9MDJq",
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
