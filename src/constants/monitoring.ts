export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || "";
export const MONITORING_ENABLED = Boolean(SENTRY_DSN);
