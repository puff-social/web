import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn:
    SENTRY_DSN ||
    "https://c1c7ef7c7625418f992607458fc34c28@o1220194.ingest.sentry.io/4504790555361280",
  tracesSampleRate: 1.0,
});
