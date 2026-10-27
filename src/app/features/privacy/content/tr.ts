import type { PrivacyContent } from '../privacy-content';

export const tr: PrivacyContent = {
  lang: 'tr',
  meta: {
    title: 'Gizlilik Politikası — Locry',
    description:
      'Locry notlarını ve görevlerini cihazında şifreli tutar. Sunucu, hesap ve takip yok. Locry neyi saklar, Google Drive ve yapay zekâ modeli indirmeleri neyi kapsar, kontrol nasıl sende kalır.',
  },
  title: 'Gizlilik Politikası',
  updated: 'Son güncelleme',
  intro:
    'Locry, tamamen tarayıcında çalışan, ücretsiz ve açık kaynak bir not ve görev uygulamasıdır. Bu politika hangi verilerle ne yaptığını açıklar. Kısaca: notların geliştiriciye hiçbir zaman ulaşmaz, onları saklayan bir sunucu yoktur; hesap ve takip de yoktur.',
  sections: [
    {
      heading: 'Locry neyi, nerede saklar',
      body: [
        'Notların, görevlerin, listelerin ve ayarların yalnızca cihazında, tarayıcının deposunda (IndexedDB) AES-256-GCM ile şifrelenmiş olarak durur. Anahtar geçiş anahtarından (passkey) ya da kurtarma anahtarından türetilir ve yalnızca kasa açıkken cihazının belleğinde bulunur. Geliştiricinin verilerine erişimi yoktur ve elinde hiçbir kopyası bulunmaz.',
        'Kilit ekranı açılmadan önce gösterilebilsin diye bazı bilgiler cihazda şifresiz tutulur: kasa adları ve renkleri, dil ve tema gibi uygulama tercihleri.',
      ],
    },
    {
      heading: 'Hesap, analiz ve reklam yok',
      body: [
        'Locry’de kayıt olma ve kullanıcı hesabı yoktur. Analiz aracı, reklam, takip çerezi ve üçüncü taraf izleyici kullanılmaz.',
      ],
    },
    {
      heading: 'Google Drive (isteğe bağlı)',
      body: [
        'Yedekleme ya da eşitleme için Google Drive’ı bağlarsan Locry yalnızca drive.appdata iznini ister: Drive’ında yalnızca Locry’nin erişebildiği gizli bir klasör. Drive’ındaki diğer dosyaları göremez, okuyamaz ve değiştiremez.',
        'Her şey yüklenmeden önce cihazında şifrelenir; Google yalnızca şifreli veriyi, dosya adlarını, boyutlarını, zamanlarını ve bir cihaz etiketini (örneğin “iPhone · Safari”) saklar. Google’ın verdiği erişim anahtarı yalnızca bellekte tutulur ve kasa kilitlenince silinir. Bağlantıyı istediğin zaman Ayarlar’dan ya da [Google Hesabı izinlerinden](https://myaccount.google.com/permissions) kaldırabilirsin.',
        'Locry’nin Google API’lerinden aldığı bilgileri kullanması ve aktarması, Sınırlı Kullanım (Limited Use) koşulları dahil [Google API Hizmetleri Kullanıcı Verileri Politikası](https://developers.google.com/terms/api-services-user-data-policy)’na uyar. Bu bilgiler yalnızca kendi şifreli yedeklerini ve eşitleme kopyalarını saklamak ve okumak için kullanılır; kimseyle paylaşılmaz, reklam için kullanılmaz ve insanlar tarafından okunmaz.',
      ],
    },
    {
      heading: 'Yapay zekâ özellikleri (isteğe bağlı)',
      body: [
        'Akıllı aramayı ya da “Notlarına sor”u açarsan yapay zekâ modelinin dosyaları bir kez Hugging Face’ten (huggingface.co) indirilir. Her indirmede olduğu gibi Hugging Face IP adresini ve hangi dosyaların istendiğini görebilir. Notların ve soruların yalnızca cihazında işlenir; hiçbir yapay zekâ servisine gönderilmez.',
      ],
    },
    {
      heading: 'Barındırma',
      body: [
        'Bu site GitHub Pages ile sunulur. Her web barındırıcısı gibi GitHub da güvenlik amacıyla IP adresi gibi teknik verileri kaydedebilir; ayrıntılar için [GitHub Gizlilik Bildirimi](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). Locry’yi başka birinin sunucusunda kullanıyorsan o sunucu için işletenin politikaları geçerlidir.',
      ],
    },
    {
      heading: 'Bağışlar',
      body: [
        'Bağış bağlantıları harici platformlara (GitHub Sponsors, Ko-fi gibi) gider; onların kendi gizlilik politikaları geçerlidir. Locry onlardan hiçbir veri almaz.',
      ],
    },
    {
      heading: 'Kontrol sende',
      body: [
        'Verilerini istediğin zaman silebilirsin: Ayarlar’dan bir kasayı sil ya da tarayıcında bu sitenin verilerini temizle. Google Drive’daki yedekler Ayarlar’dan silinebilir, Locry’nin erişimi Google Hesabı’ndan kaldırılabilir. Geliştiricinin elinde seninle ilgili hiçbir veri olmadığı için bizden istenecek ya da silinecek bir şey yoktur.',
      ],
    },
    {
      heading: 'Değişiklikler',
      body: ['Bu politika değişirse yeni hâli bu sayfada, yeni tarihiyle yayınlanır.'],
    },
    {
      heading: 'İletişim',
      body: ['Bu politikayla ilgili soruların için [github.com/eerkan/locry](https://github.com/eerkan/locry/issues) üzerinden bir konu (issue) aç.'],
    },
  ],
  back: 'Locry’ye dön',
};
