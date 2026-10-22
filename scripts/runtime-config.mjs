// Runtime configuration exposed to the browser as /config.json. Only public values belong
// here: an OAuth Client ID identifies the app and is not a secret.
const CLIENT_ID_PATTERN = /^[\w-]+\.apps\.googleusercontent\.com$/;

/** Builds the browser config from environment variables, dropping invalid values. */
export function runtimeConfig(env = process.env) {
  const googleClientId = (env.LOCRY_GOOGLE_CLIENT_ID ?? '').trim();
  if (googleClientId && !CLIENT_ID_PATTERN.test(googleClientId)) {
    console.warn('LOCRY_GOOGLE_CLIENT_ID is not a Google OAuth Client ID (…apps.googleusercontent.com); ignoring it.');
    return {};
  }
  return googleClientId ? { googleClientId } : {};
}
