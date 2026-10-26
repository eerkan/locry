// Runtime configuration exposed to the browser as /config.json. Only public values belong
// here: an OAuth Client ID identifies the app and is not a secret, nor are donation pages.
const CLIENT_ID_PATTERN = /^[\w-]+\.apps\.googleusercontent\.com$/;
/** Account names on the donation platforms; links are built from them, never taken as URLs. */
const ACCOUNT_PATTERN = /^[A-Za-z0-9][\w.-]{0,63}$/;
const CRYPTO_LABEL_PATTERN = /^[A-Za-z0-9][\w-]{0,19}$/;
const CRYPTO_ADDRESS_PATTERN = /^[A-Za-z0-9:]{20,128}$/;

/** Donation platforms: environment variable per account. */
const DONATE_ACCOUNTS = {
  github: 'LOCRY_DONATE_GITHUB',
  buymeacoffee: 'LOCRY_DONATE_BUYMEACOFFEE',
  kofi: 'LOCRY_DONATE_KOFI',
  opencollective: 'LOCRY_DONATE_OPENCOLLECTIVE',
};

/** Builds the browser config from environment variables, dropping invalid values one by one. */
export function runtimeConfig(env = process.env) {
  const config = {};
  const googleClientId = (env.LOCRY_GOOGLE_CLIENT_ID ?? '').trim();
  if (googleClientId && !CLIENT_ID_PATTERN.test(googleClientId)) {
    console.warn('LOCRY_GOOGLE_CLIENT_ID is not a Google OAuth Client ID (…apps.googleusercontent.com); ignoring it.');
  } else if (googleClientId) {
    config.googleClientId = googleClientId;
  }
  const donate = donateConfig(env);
  if (Object.keys(donate).length) config.donate = donate;
  return config;
}

function donateConfig(env) {
  const donate = {};
  for (const [platform, name] of Object.entries(DONATE_ACCOUNTS)) {
    const account = (env[name] ?? '').trim();
    if (!account) continue;
    if (ACCOUNT_PATTERN.test(account)) donate[platform] = account;
    else console.warn(`${name} is not an account name (letters, digits, - _ .); ignoring it.`);
  }
  // LOCRY_DONATE_CRYPTO="BTC:bc1q…, ETH:0x…": label and address pairs.
  const crypto = [];
  for (const entry of (env.LOCRY_DONATE_CRYPTO ?? '').split(',').map((e) => e.trim()).filter(Boolean)) {
    const at = entry.indexOf(':');
    const label = entry.slice(0, at).trim();
    const address = entry.slice(at + 1).trim();
    if (at > 0 && CRYPTO_LABEL_PATTERN.test(label) && CRYPTO_ADDRESS_PATTERN.test(address)) crypto.push({ label, address });
    else console.warn(`LOCRY_DONATE_CRYPTO: "${entry}" is not LABEL:address; ignoring it.`);
  }
  if (crypto.length) donate.crypto = crypto;
  return donate;
}
