/** Donation platforms a Locry installation can link to (see LOCRY_DONATE_* in .env.example). */
export const DONATE_PLATFORMS = ['github', 'buymeacoffee', 'kofi', 'opencollective'] as const;
export type DonatePlatform = (typeof DONATE_PLATFORMS)[number];

export interface DonateConfig {
  github?: string;
  buymeacoffee?: string;
  kofi?: string;
  opencollective?: string;
  crypto?: { label: string; address: string }[];
}

export interface DonateLink {
  platform: DonatePlatform;
  name: string;
  url: string;
}

export interface Donations {
  links: DonateLink[];
  crypto: { label: string; address: string }[];
}

const PLATFORMS: Record<DonatePlatform, { name: string; url: (account: string) => string }> = {
  github: { name: 'GitHub Sponsors', url: (a) => `https://github.com/sponsors/${a}` },
  buymeacoffee: { name: 'Buy Me a Coffee', url: (a) => `https://buymeacoffee.com/${a}` },
  kofi: { name: 'Ko-fi', url: (a) => `https://ko-fi.com/${a}` },
  opencollective: { name: 'Open Collective', url: (a) => `https://opencollective.com/${a}` },
};

const ACCOUNT = /^[A-Za-z0-9][\w.-]{0,63}$/;
const CRYPTO_LABEL = /^[A-Za-z0-9][\w-]{0,19}$/;
const CRYPTO_ADDRESS = /^[A-Za-z0-9:]{20,128}$/;

/**
 * Turns the served config into links. Only account names are configured, and they are
 * checked again here: a link can only ever point at one of the known platforms.
 */
export function donations(config: DonateConfig | undefined): Donations | null {
  if (!config) return null;
  const links = DONATE_PLATFORMS.flatMap((platform) => {
    const account = config[platform];
    return typeof account === 'string' && ACCOUNT.test(account)
      ? [{ platform, name: PLATFORMS[platform].name, url: PLATFORMS[platform].url(account) }]
      : [];
  });
  const crypto = (Array.isArray(config.crypto) ? config.crypto : []).filter(
    (c) => typeof c?.label === 'string' && typeof c?.address === 'string' && CRYPTO_LABEL.test(c.label) && CRYPTO_ADDRESS.test(c.address),
  );
  return links.length || crypto.length ? { links, crypto } : null;
}
