import { countUrl } from './analytics';

describe('countUrl', () => {
  it('sends the visit to the site code’s GoatCounter address, encoded', () => {
    const url = new URL(countUrl('locry', { path: '/locry/tr', title: 'Locry — notlar & görevler', referrer: '', screen: '1440,900,2' }));
    expect(url.origin).toBe('https://locry.goatcounter.com');
    expect(url.pathname).toBe('/count');
    expect(url.searchParams.get('p')).toBe('/locry/tr');
    expect(url.searchParams.get('t')).toBe('Locry — notlar & görevler');
    expect(url.searchParams.get('s')).toBe('1440,900,2');
    expect(url.searchParams.get('rnd')).toBeTruthy();
  });
});
