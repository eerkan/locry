import type { LandingContent } from '../landing-content';

export const tr: LandingContent = {
  lang: 'tr',
  meta: {
    title: 'Locry — Uçtan uca şifreli notlar ve görevler, passkey ile',
    description:
      'Locry, tarayıcıda çalışan, açık kaynak ve sunucusuz bir not ve görev uygulamasıdır. Markdown notlar, görevler, passkey ile giriş, AES-256 şifreleme, cihazlar arası şifreli eşitleme ve tarayıcı içi yapay zekâ araması.',
    ogImageAlt: 'Locry not düzenleyicisi: Markdown not ve önizlemesi, kenar çubuğunda notlar ve görevler',
  },
  nav: {
    features: 'Özellikler',
    security: 'Güvenlik',
    sync: 'Eşitleme',
    selfHost: 'Kendi sunucunda',
    faq: 'SSS',
    support: 'Destek ol',
    open: 'Locry’yi aç',
    skip: 'İçeriğe geç',
  },
  sections: {
    overview: 'Genel bakış',
    features: 'Özellikler',
    tasks: 'Görevler',
    security: 'Güvenlik',
    vaults: 'Kasalar',
    sync: 'Eşitleme',
    search: 'Akıllı arama',
    compare: 'Karşılaştırma',
    selfHost: 'Kendi sunucunda',
    faq: 'SSS',
  },
  ui: {
    theme: 'Tema',
    light: 'Aydınlık',
    dark: 'Karanlık',
    system: 'Sistem',
    language: 'Dil',
    flow: 'Kilit açma akışı',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Açık kaynak · Sunucusuz · Çevrimdışı çalışır',
    title: 'Notların ve görevlerin,',
    accent: 'yalnızca senin anahtarınla.',
    lead:
      'Locry, tarayıcında çalışan uçtan uca şifreli bir not ve görev uygulamasıdır. Hesap yok, parola yok, sunucu yok: kasan parmak izin, yüzün ya da cihaz PIN’inle — bir geçiş anahtarıyla (passkey) açılır.',
    start: 'Ücretsiz başla',
    resume: 'Kasanı aç',
    github: 'GitHub’da incele',
    badges: ['AES-256-GCM', 'Passkey (WebAuthn PRF)', 'Markdown', 'PWA', '11 dil'],
    screenshotAlt: 'Locry’de Markdown not düzenleyicisi: solda not listesi, sağda düzenleme ve canlı önizleme',
    phoneAlt: 'Telefonda Locry: notlar listesi',
  },
  summary: {
    title: 'Kısaca Locry',
    text:
      'Locry, notlarını ve görevlerini cihazında, yalnızca senin açabileceğin bir anahtarla şifreleyerek saklayan ücretsiz ve açık kaynak bir web uygulamasıdır. Veriler bir sunucuya gönderilmez; istersen Google Drive üzerinden şifreli olarak yedeklenir ve diğer cihazlarınla eşitlenir.',
    facts: [
      { term: 'Ne işe yarar', detail: 'Markdown notlar ve görev listeleri, tek uygulamada' },
      { term: 'Fiyat', detail: 'Ücretsiz ve açık kaynak' },
      { term: 'Hesap', detail: 'Gerekmez; giriş passkey ile' },
      { term: 'Şifreleme', detail: 'Her kayıt ayrı AES-256-GCM; anahtar passkey’den türetilir' },
      { term: 'Veriler nerede', detail: 'Cihazında, tarayıcının şifreli deposunda' },
      { term: 'Eşitleme', detail: 'İsteğe bağlı, Google Drive üzerinden uçtan uca şifreli' },
      { term: 'Platformlar', detail: 'Modern tarayıcılar; macOS, Windows, Linux, iOS ve Android’de kurulabilir (PWA)' },
      { term: 'Diller', detail: 'Türkçe, İngilizce, Çince, İspanyolca, Arapça, Portekizce, Endonezce, Fransızca, Japonca, Rusça ve Almanca' },
    ],
  },
  features: {
    title: 'Not almak için gereken her şey, gizliliğinden vazgeçmeden',
    lead: 'Locry sade görünür ama günlük kullanım için eksiksizdir. Her özellik şifreli kasanın içinde çalışır.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Markdown notlar',
        text: 'Düzenleme, bölünmüş görünüm ve önizleme; araç çubuğu ve kısayollar, etiketler, sabitleme, arşiv ve işaretlenebilir görev listeleri.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Görevler',
        text: 'Gelen kutusu, Bugün, Yaklaşan ve Tamamlananlar görünümleri; renkli listeler, alt görevler, öncelik, bitiş tarihi ve sürükle-bırak.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Passkey ile giriş',
        text: 'Parola yok. Kasa, parmak izi, yüz tanıma ya da cihaz PIN’iyle açılan bir geçiş anahtarıyla çözülür; kurtarma anahtarı yedekte durur.',
      },
      {
        icon: 'lucideLayers',
        title: 'Birden fazla kasa',
        text: 'Kişisel ve İş gibi tamamen ayrı kasalar: her birinin kendi passkey’i, kurtarma anahtarı, yedekleri ve ayarları.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Telefon ve bilgisayar',
        text: 'Google Drive üzerinden uçtan uca şifreli eşitleme. Silmeler taşınır, çakışan düzenlemeler kaybolmaz.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Akıllı arama',
        text: 'Kelimeyle değil anlamla ara. Yapay zekâ modeli tarayıcında çalışır; notların hiçbir yapay zekâ servisine gönderilmez.',
      },
      {
        icon: 'lucideArchive',
        title: 'Şifreli yedekler',
        text: 'Tek dosyalık, sıkıştırılmış ve şifreli .locry yedekleri; dosyaya ya da Google Drive’a, istersen otomatik.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Çevrimdışı ve kurulabilir',
        text: 'İnternet yokken de açılır. Masaüstüne ya da ana ekrana uygulama olarak eklenir.',
      },
      {
        icon: 'lucideCommand',
        title: 'Klavyeyle hızlı',
        text: '⌘K komut paleti, “/” ile arama, N ile yeni not, T ile yeni görev ve G ile gezinme kısayolları.',
      },
    ],
  },
  security: {
    title: 'Şifreleme nasıl çalışır?',
    lead:
      'Locry’de güven bir sunucuya değil, matematiğe dayanır. Anahtar yalnızca senin cihazında, yalnızca kasa açıkken bellekte bulunur.',
    steps: [
      {
        title: '1. Passkey',
        text: 'Kasayı açarken cihazın WebAuthn PRF uzantısıyla passkey’ine özel gizli bir değer üretir. Bu değer cihazdan dışarı çıkmaz.',
      },
      {
        title: '2. Anahtar',
        text: 'Bu değerden HKDF-SHA-256 ile bir anahtar türetilir ve rastgele 256 bitlik kasa anahtarının kilidini açar.',
      },
      {
        title: '3. Kayıtlar',
        text: 'Her not ve görev ayrı ayrı AES-256-GCM ile şifrelenir; kayıt türü ve kimliği şifreli metne bağlanır.',
      },
    ],
    tableTitle: 'Güvenlik modeli',
    rows: [
      ['Kasa anahtarı', 'Rastgele 256 bit; yalnızca bellekte, dışa aktarılamaz'],
      ['Giriş', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Kurtarma', '256 bitlik kurtarma anahtarı, ayrı bir anahtar yuvasında'],
      ['Veri', 'Kayıt başına AES-256-GCM, bağlam doğrulamalı (AAD)'],
      ['Yedek ve eşitleme', 'gzip + AES-256-GCM; başlık doğrulamalı'],
      ['Önizleme', 'DOMPurify ile temizleme, dış görseller engelli, İçerik Güvenliği Politikası'],
      ['Otomatik kilit', 'Belirlediğin süre hareketsizlikten sonra anahtar bellekten silinir'],
    ],
    note: 'Passkey’ini ve kurtarma anahtarını kaybedersen verilerine kimse — Locry de — erişemez. Bu bir kusur değil, tasarımın kendisi.',
  },
  vaults: {
    title: 'Kişisel ve iş, ayrı kasalarda',
    text:
      'Her kasa bağımsızdır: kendi şifreleme anahtarı, passkey’leri, kurtarma anahtarı, yedekleri ve ayarları vardır. Kasa değiştirmek açık kasayı kilitler; bir kasanın verisi diğerinden görünmez.',
    bullets: [
      'Kilit ekranında kasa seç, son kullanılan hatırlanır',
      'Kasaya ad ve renk ver; kenar çubuğundan tek tıkla geç',
      'Yedekten geri yüklerken kasa varsa birleşir, yoksa yeni kasa olarak eklenir',
    ],
    alt: 'Locry kilit ekranı: kasa seçimi ve passkey ile açma',
  },
  sync: {
    title: 'Telefonunda ve bilgisayarında aynı kasa',
    lead:
      'Eşitleme için bir Locry sunucusu yok. Her cihaz kasanın kendi şifreli kopyasını Google Drive’daki gizli uygulama klasörüne yazar ve diğer cihazlarınkini okuyup birleştirir.',
    bullets: [
      'Google yalnızca şifreli dosyaları görür; içerik, başlık ya da etiket göremez',
      'Silinen not ve görevler diğer cihazlardan da silinir',
      'Aynı not iki cihazda değiştiyse eski sürüm “(çakışma)” notu olarak saklanır',
      'Eklenen passkey’ler, kasa adı ve rengi de eşitlenir',
      'Uygulama açıkken çalışır: kilidi açınca, sekmeye dönünce ve değişikliklerden sonra',
    ],
    stepsTitle: 'Nasıl kurulur?',
    steps: [
      'Bilgisayarda Ayarlar → Cihazlar arası eşitleme → Eşitlemeyi aç.',
      'Telefonda Locry’yi aynı adreste aç ve ana ekrana ekle.',
      'Yedekten geri yükle → Google Drive → Eşitlenen kasalar’dan kasanı seç.',
      'Eşitlenen passkey’inle ya da kurtarma anahtarınla aç; eşitleme kendiliğinden başlar.',
    ],
    alt: 'Locry ayarlarında cihazlar arası eşitleme kartı ve eşitleyen cihazlar',
  },
  search: {
    title: 'Anlamla arayan, gizliliği koruyan yapay zekâ',
    text:
      '“Tatil planı” diye aradığında “Antalya otel rezervasyonu” notunu da bulur. Varsayılan model Google’ın EmbeddingGemma’sı; Ayarlar’dan beş çok dilli model arasından seçebilirsin. Model bir kez indirilir ve tamamen tarayıcında çalışır.',
    bullets: [
      'Kelime ve anlam araması birlikte, uygulamanın tüm dillerinde',
      'Vektörler de şifreli saklanır, yedeklere ve eşitlemeye girmez',
      'Notta “benzer notlar” önerileri; ⌘K ile her yerden arama',
      'İsteğe bağlı: açmazsan hiçbir şey indirilmez',
    ],
    alt: 'Locry arama sayfası: notlar ve görevlerde anlamsal sonuçlar',
  },
  tasks: {
    title: 'Görevler, notlarının yanında',
    text: 'Gün içinde ne yapacağını Bugün görünümünde gör, geciken işleri kaçırma, görevleri ilgili nota bağla.',
    bullets: [
      'Akıllı görünümler: Gelen kutusu, Bugün, Yaklaşan, Tamamlananlar',
      'Renkli listeler, alt görevler, öncelik ve bitiş tarihi',
      'Sürükle-bırak sıralama, T ile hızlı ekleme',
    ],
    alt: 'Locry görevler: Bugün görünümü, öncelikler ve bitiş tarihleri',
  },
  selfHost: {
    title: 'Kendi sunucunda çalıştır',
    lead:
      'Locry açık kaynaktır ve yalnızca statik dosyalardan oluşur. Tek komutla Docker’da çalışır; istersen otomatik HTTPS ile kendi alan adında yayınlarsın.',
    code: 'git clone https://github.com/eerkan/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'Konteynerde veri yoktur: notlar tarayıcıda şifreli durur, konteyneri silmek veriyi etkilemez.',
      'Root olmayan kullanıcı, salt okunur dosya sistemi, düşürülmüş yetkiler.',
      'COMPOSE_PROFILES=https ve LOCRY_DOMAIN ile Caddy sertifikayı otomatik alır.',
    ],
    github: 'Kaynak kodu ve kurulum belgeleri',
  },
  compare: {
    title: 'Locry ve klasik bulut not uygulamaları',
    lead: 'Çoğu not uygulaması verini kendi sunucusunda tutar ve okuyabilir. Locry bunu baştan imkânsız kılar.',
    headers: ['', 'Klasik bulut not uygulaması', 'Locry'],
    rows: [
      ['Verilerin nerede', 'Şirketin sunucusunda', 'Cihazında, şifreli'],
      ['Kim okuyabilir', 'Hizmet sağlayıcı', 'Yalnızca sen'],
      ['Giriş', 'E-posta ve parola', 'Passkey, parola yok'],
      ['Hesap', 'Gerekli', 'Gerekmez'],
      ['Çevrimdışı', 'Kısıtlı', 'Tam'],
      ['Yapay zekâ araması', 'Notların sunucuya gönderilir', 'Tarayıcında çalışır'],
      ['Kaynak kodu', 'Kapalı', 'Açık'],
    ],
  },
  faq: {
    title: 'Sık sorulan sorular',
    items: [
      {
        q: 'Locry nedir?',
        a: 'Locry, Markdown notları ve görevleri uçtan uca şifreli olarak saklayan, tarayıcıda çalışan ücretsiz ve açık kaynak bir uygulamadır. Hesap ya da parola gerektirmez; kasa bir passkey ile açılır.',
      },
      {
        q: 'Verilerim nerede saklanıyor?',
        a: 'Cihazında, tarayıcının IndexedDB deposunda ve şifreli olarak. Locry’nin verilerini tutan bir sunucusu yoktur. Google Drive yedeği ya da eşitlemesi açarsan Drive’a da yalnızca şifreli dosyalar gider.',
      },
      {
        q: 'Locry ücretsiz mi?',
        a: 'Evet. Locry ücretsiz ve açık kaynaktır; kaynak kodu GitHub’dadır. İstersen kendi sunucunda Docker ile çalıştırabilirsin.',
      },
      {
        q: 'Passkey nedir, neden parola yok?',
        a: 'Passkey (geçiş anahtarı), parmak izi, yüz tanıma ya da cihaz PIN’iyle kullanılan, oltalamaya dayanıklı bir giriş yöntemidir. Locry, passkey’in WebAuthn PRF uzantısıyla şifreleme anahtarı türetir; bu yüzden tahmin edilebilecek ya da sızdırılabilecek bir parola yoktur.',
      },
      {
        q: 'Passkey’imi kaybedersem ne olur?',
        a: 'Kurulumda verilen 256 bitlik kurtarma anahtarıyla kasayı açarsın ve yeni bir passkey eklersin. Hem passkey’ini hem kurtarma anahtarını kaybedersen verilere kimse erişemez.',
      },
      {
        q: 'Telefon ve bilgisayar arasında nasıl eşitlerim?',
        a: 'Ayarlar’da Cihazlar arası eşitleme’yi aç; telefonda Locry’yi aynı adreste açıp Yedekten geri yükle → Google Drive → Eşitlenen kasalar’dan kasanı seç. Her cihaz kendi şifreli kopyasını Drive’a yazar ve diğerlerininkiyle birleştirir.',
      },
      {
        q: 'Google notlarımı okuyabilir mi?',
        a: 'Hayır. Drive’a giden yedek ve eşitleme dosyaları cihazında AES-256-GCM ile şifrelenir. Locry yalnızca kendi gizli uygulama klasörüne (drive.appdata) erişir; Drive’daki diğer dosyalarını göremez.',
      },
      {
        q: 'Yapay zekâ araması notlarımı bir yere gönderiyor mu?',
        a: 'Hayır. Çok dilli dil modeli bir kez indirilir ve bir Web Worker içinde tarayıcında çalışır. Notların hiçbir yapay zekâ servisine gönderilmez.',
      },
      {
        q: 'İnternetsiz çalışır mı?',
        a: 'Evet. Locry kurulabilir bir web uygulamasıdır (PWA); bir kez açıldıktan sonra çevrimdışı çalışır. Yalnızca Drive eşitlemesi ve ilk model indirmesi internet ister.',
      },
      {
        q: 'Hangi tarayıcı ve cihazlarda çalışır?',
        a: 'PRF uzantılı passkey destekleyen tarayıcılarda: Chrome ve Edge 118+, Safari 18+. iCloud Anahtar Zinciri, Google Parola Yöneticisi, 1Password ya da bir donanım güvenlik anahtarı kullanılabilir.',
      },
      {
        q: 'Verilerimi dışa aktarabilir miyim?',
        a: 'Evet. Ayarlar’dan tek dosyalık şifreli .locry yedeği indirirsin; bu yedek başka bir cihazda ya da adreste, passkey veya kurtarma anahtarıyla açılır.',
      },
    ],
  },
  cta: {
    title: 'Notların sende kalsın.',
    text: 'Kurulum bir dakika sürer: bir kasa adı seç, passkey oluştur, kurtarma anahtarını sakla.',
    start: 'Locry’yi ücretsiz kullan',
    github: 'Kaynak kodunu gör',
  },
  footer: {
    tagline: 'Uçtan uca şifreli notlar ve görevler.',
    openSource: 'Açık kaynak',
    madeWith: 'Angular, Web Crypto ve WebAuthn ile, sunucusuz.',
    links: 'Bağlantılar',
  },
  support: {
    title: 'Locry’yi destekle',
    text: 'Locry ücretsiz, açık kaynak; reklam ve takip yok. İşine yarıyorsa geliştirilmesine destek olabilirsin.',
    crypto: 'Kripto',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
  },
  howTo: {
    name: 'Locry ile şifreli bir kasa oluşturma',
    description: 'Locry’de passkey ile açılan, uçtan uca şifreli bir not ve görev kasası oluşturma adımları.',
    steps: [
      { name: 'Locry’yi aç', text: 'Tarayıcında Locry’yi aç ve “Ücretsiz başla”ya tıkla.' },
      { name: 'Kasaya ad ver', text: 'Kasa için bir ad ve renk seç; örneğin “Kişisel”.' },
      { name: 'Passkey oluştur', text: 'Parmak izi, yüz tanıma ya da cihaz PIN’iyle bir passkey oluştur.' },
      { name: 'Kurtarma anahtarını sakla', text: 'Gösterilen kurtarma anahtarını parola yöneticine kaydet ve bir grubunu yazarak doğrula.' },
    ],
  },
};
