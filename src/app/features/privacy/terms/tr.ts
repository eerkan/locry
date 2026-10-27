import type { LegalContent } from '../privacy-content';

export const tr: LegalContent = {
  lang: 'tr',
  meta: {
    title: 'Kullanım Koşulları — Locry',
    description:
      'Ücretsiz ve açık kaynak şifreli not ve görev uygulaması Locry’nin kullanım koşulları: verilerin ve anahtarların, kabul edilebilir kullanım, üçüncü taraf hizmetler, yapay zekâ cevapları ve garanti olmaması.',
  },
  title: 'Kullanım Koşulları',
  updated: 'Son güncelleme',
  intro:
    'Bu koşullar Locry’yi bu adreste kullandığında geçerlidir. Locry, tamamen tarayıcında çalışan, ücretsiz ve açık kaynak bir not ve görev uygulamasıdır; hesap yoktur, satın alınacak bir şey yoktur.',
  sections: [
    {
      heading: 'Locry’nin kullanımı',
      body: ['Locry’yi kullanarak bu koşulları kabul etmiş olursun. Kabul etmiyorsan lütfen kullanma.'],
    },
    {
      heading: 'Açık kaynak',
      body: [
        'Locry’nin kaynak kodu [MIT Lisansı](https://github.com/eerkan/locry/blob/main/LICENSE) ile sunulur. Bu lisans kapsamında kodu kullanabilir, kopyalayabilir, değiştirebilir ve dağıtabilirsin; bu koşullar bu adresteki siteyi kapsar.',
      ],
    },
    {
      heading: 'Verilerin ve anahtarların',
      body: [
        'Notların ve görevlerin cihazında şifrelenir ve yalnızca geçiş anahtarların (passkey) ile kurtarma anahtarın onları açabilir. Bunları güvende tutmak senin sorumluluğundadır: ikisini de kaybedersen geliştirici dahil hiç kimse verilerini kurtaramaz.',
        'Düzenli olarak yedek al. Tarayıcılar site verilerini silebilir; örneğin depolama alanı azaldığında ya da tarama verilerini temizlediğinde.',
      ],
    },
    {
      heading: 'Kabul edilebilir kullanım',
      body: [
        'Locry’yi yalnızca yasalara uygun şekilde kullan. Siteyi aksatmaya çalışma ve onu bağlandığı üçüncü taraf hizmetleri kötüye kullanmak için kullanma.',
      ],
    },
    {
      heading: 'Üçüncü taraf hizmetler',
      body: [
        'İsteğe bağlı özellikler Google Drive, Hugging Face ve GitHub Pages’e dayanır; onları kullandığında [Google Hizmet Şartları](https://policies.google.com/terms) ve [GitHub Hizmet Şartları](https://docs.github.com/site-policy/github-terms/github-terms-of-service) gibi kendi koşulları geçerlidir.',
      ],
    },
    {
      heading: 'Yapay zekâ cevapları',
      body: [
        'Akıllı arama sonuçları ve “Notlarına sor” cevapları cihazında çalışan küçük yapay zekâ modellerinden gelir. Eksik ya da yanlış olabilirler; onlara güvenmeden önce kaynakları kontrol et.',
      ],
    },
    {
      heading: 'Garanti yoktur',
      body: [
        'Locry, belirli bir amaca uygunluk ve kesintisiz erişim dahil, açık ya da örtük hiçbir garanti verilmeden “olduğu gibi” sunulur.',
        'Yasaların izin verdiği ölçüde geliştirici, Locry’nin kullanımından doğan veri kaybından ya da başka herhangi bir zarardan sorumlu değildir.',
      ],
    },
    {
      heading: 'Değişiklikler',
      body: [
        'Bu koşullar değişebilir. Yeni hâli bu sayfada, yeni tarihiyle yayınlanır; sonrasında Locry’yi kullanmaya devam etmen yeni koşulları kabul ettiğin anlamına gelir.',
      ],
    },
    {
      heading: 'İletişim',
      body: ['Bu koşullarla ilgili soruların için [github.com/eerkan/locry](https://github.com/eerkan/locry/issues) üzerinden bir konu (issue) aç.'],
    },
  ],
  back: 'Locry’ye dön',
};
