import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCoins } from '@ng-icons/lucide';
import {
  simpleBinance,
  simpleBitcoin,
  simpleBitcoincash,
  simpleBuymeacoffee,
  simpleCardano,
  simpleDash,
  simpleDogecoin,
  simpleEthereum,
  simpleGithubsponsors,
  simpleKofi,
  simpleLitecoin,
  simpleMonero,
  simpleOpencollective,
  simplePolkadot,
  simplePolygon,
  simpleSolana,
  simpleStellar,
  simpleTether,
  simpleTon,
  simpleXrp,
  simpleZcash,
} from '@ng-icons/simple-icons';
import type { DonatePlatform } from '../core/donate';

interface Logo {
  icon: string;
  /** Brand color, the tile's background. */
  color: string;
  /** Mark color on the tile; white unless the brand color is too light. */
  ink?: string;
}

const PLATFORM_LOGOS: Record<DonatePlatform, Logo> = {
  github: { icon: 'simpleGithubsponsors', color: '#EA4AAA' },
  buymeacoffee: { icon: 'simpleBuymeacoffee', color: '#FFDD00', ink: '#000000' },
  kofi: { icon: 'simpleKofi', color: '#FF6433' },
  opencollective: { icon: 'simpleOpencollective', color: '#7FADF2' },
};

/** Coins by ticker (or name), as written in LOCRY_DONATE_CRYPTO labels. */
const COIN_LOGOS: Record<string, Logo> = {
  BTC: { icon: 'simpleBitcoin', color: '#F7931A' },
  ETH: { icon: 'simpleEthereum', color: '#3C3C3D' },
  USDT: { icon: 'simpleTether', color: '#50AF95' },
  LTC: { icon: 'simpleLitecoin', color: '#345D9D' },
  SOL: { icon: 'simpleSolana', color: '#9945FF' },
  DOGE: { icon: 'simpleDogecoin', color: '#C2A633' },
  XMR: { icon: 'simpleMonero', color: '#FF6600' },
  BNB: { icon: 'simpleBinance', color: '#F0B90B', ink: '#000000' },
  ADA: { icon: 'simpleCardano', color: '#0133AD' },
  XRP: { icon: 'simpleXrp', color: '#23292F' },
  POL: { icon: 'simplePolygon', color: '#7B3FE4' },
  TON: { icon: 'simpleTon', color: '#0098EA' },
  XLM: { icon: 'simpleStellar', color: '#7D00FF' },
  DOT: { icon: 'simplePolkadot', color: '#E6007A' },
  ZEC: { icon: 'simpleZcash', color: '#F4B728', ink: '#000000' },
  DASH: { icon: 'simpleDash', color: '#008CE7' },
  BCH: { icon: 'simpleBitcoincash', color: '#0AC18E' },
};
const COIN_NAMES: Record<string, string> = {
  BITCOIN: 'BTC',
  ETHEREUM: 'ETH',
  TETHER: 'USDT',
  LITECOIN: 'LTC',
  SOLANA: 'SOL',
  DOGECOIN: 'DOGE',
  MONERO: 'XMR',
  MATIC: 'POL',
  POLYGON: 'POL',
  CARDANO: 'ADA',
  STELLAR: 'XLM',
  POLKADOT: 'DOT',
  ZCASH: 'ZEC',
};

/** The logo for a coin label such as "BTC", "Bitcoin" or "USDT-TRC20"; null when unknown. */
export function coinLogo(label: string): Logo | null {
  const ticker = label.toUpperCase().split(/[-_]/)[0];
  return COIN_LOGOS[COIN_NAMES[ticker] ?? ticker] ?? null;
}

/**
 * A donation platform's or coin's mark on a small tile in its brand color (Simple Icons,
 * CC0), so it reads the same in light and dark themes. Unknown coins get a generic coin.
 */
@Component({
  selector: 'app-donate-logo',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideCoins,
      simpleBinance,
      simpleBitcoin,
      simpleBitcoincash,
      simpleBuymeacoffee,
      simpleCardano,
      simpleDash,
      simpleDogecoin,
      simpleEthereum,
      simpleGithubsponsors,
      simpleKofi,
      simpleLitecoin,
      simpleMonero,
      simpleOpencollective,
      simplePolkadot,
      simplePolygon,
      simpleSolana,
      simpleStellar,
      simpleTether,
      simpleTon,
      simpleXrp,
      simpleZcash,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[12px]',
    'aria-hidden': 'true',
    '[style.background-color]': 'logo()?.color ?? null',
    '[style.color]': "logo() ? (logo()!.ink ?? '#ffffff') : null",
    '[class.border]': '!logo()',
  },
  template: `<ng-icon [name]="logo()?.icon ?? 'lucideCoins'" />`,
})
export class DonateLogo {
  readonly platform = input<DonatePlatform>();
  readonly coin = input<string>();
  protected readonly logo = computed(() => {
    const platform = this.platform();
    if (platform) return PLATFORM_LOGOS[platform];
    const coin = this.coin();
    return coin ? coinLogo(coin) : null;
  });
}
