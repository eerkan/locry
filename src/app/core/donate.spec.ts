import { donations } from './donate';

describe('donations', () => {
  it('builds links to the known platforms from account names', () => {
    expect(donations({ github: 'emre', kofi: 'locry', opencollective: 'locry-app', buymeacoffee: 'emre.e' })!.links).toEqual([
      { platform: 'github', name: 'GitHub Sponsors', url: 'https://github.com/sponsors/emre' },
      { platform: 'buymeacoffee', name: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/emre.e' },
      { platform: 'kofi', name: 'Ko-fi', url: 'https://ko-fi.com/locry' },
      { platform: 'opencollective', name: 'Open Collective', url: 'https://opencollective.com/locry-app' },
    ]);
  });

  it('never links anywhere else: URLs and odd names are dropped', () => {
    expect(donations({ github: 'https://evil.example', kofi: '../x', opencollective: 'a b' })).toBeNull();
  });

  it('keeps well-formed crypto addresses only', () => {
    const result = donations({
      crypto: [
        { label: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
        { label: 'ETH', address: '0x<script>' },
        { label: 'bad label!', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
      ],
    });
    expect(result).toEqual({ links: [], crypto: [{ label: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' }] });
  });

  it('is null when nothing is configured', () => {
    expect(donations(undefined)).toBeNull();
    expect(donations({})).toBeNull();
  });
});
