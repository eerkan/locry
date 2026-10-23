export type LandingLang = 'tr' | 'en';

export interface Fact {
  term: string;
  detail: string;
}

export interface Feature {
  icon: string;
  title: string;
  text: string;
}

export interface Faq {
  q: string;
  a: string;
}

/** Everything the landing page says, per language. Kept as data so the page and the structured data agree. */
export interface LandingContent {
  lang: LandingLang;
  path: '/' | '/tr';
  locale: string;
  meta: { title: string; description: string; ogImageAlt: string };
  nav: {
    features: string;
    security: string;
    sync: string;
    selfHost: string;
    faq: string;
    open: string;
    otherLang: string;
    otherLangLabel: string;
    skip: string;
  };
  /** Short section labels for the numbered headings. */
  sections: {
    overview: string;
    features: string;
    tasks: string;
    security: string;
    vaults: string;
    sync: string;
    search: string;
    compare: string;
    selfHost: string;
    faq: string;
  };
  ui: { theme: string; light: string; dark: string; system: string; language: string; flow: string; terminal: string };
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    lead: string;
    start: string;
    resume: string;
    github: string;
    badges: string[];
    screenshotAlt: string;
    phoneAlt: string;
  };
  summary: { title: string; text: string; facts: Fact[] };
  features: { title: string; lead: string; items: Feature[] };
  security: {
    title: string;
    lead: string;
    steps: { title: string; text: string }[];
    tableTitle: string;
    rows: [string, string][];
    note: string;
  };
  vaults: { title: string; text: string; bullets: string[]; alt: string };
  sync: { title: string; lead: string; bullets: string[]; stepsTitle: string; steps: string[]; alt: string };
  search: { title: string; text: string; bullets: string[]; alt: string };
  tasks: { title: string; text: string; bullets: string[]; alt: string };
  selfHost: { title: string; lead: string; code: string; notes: string[]; github: string };
  compare: { title: string; lead: string; headers: [string, string, string]; rows: [string, string, string][] };
  faq: { title: string; items: Faq[] };
  cta: { title: string; text: string; start: string; github: string };
  footer: { tagline: string; openSource: string; madeWith: string; links: string };
  howTo: { name: string; description: string; steps: { name: string; text: string }[] };
}

const tr: LandingContent = {
  lang: 'tr',
  path: '/tr',
  locale: 'tr_TR',
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
    open: 'Locry’yi aç',
    otherLang: '/',
    otherLangLabel: 'English',
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
    badges: ['AES-256-GCM', 'Passkey (WebAuthn PRF)', 'Markdown', 'PWA', 'Türkçe ve İngilizce'],
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
      { term: 'Diller', detail: 'Türkçe ve İngilizce' },
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
      'Kelime ve anlam araması birlikte; Türkçe ve İngilizce',
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
    code: 'git clone https://github.com/emreerkangames/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
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

const en: LandingContent = {
  lang: 'en',
  path: '/',
  locale: 'en_US',
  meta: {
    title: 'Locry — End-to-end encrypted notes and tasks, unlocked with a passkey',
    description:
      'Locry is an open-source, serverless notes and to-do app that runs in your browser. Markdown notes, tasks, passkey login, AES-256 encryption, encrypted sync across devices and private in-browser AI search.',
    ogImageAlt: 'The Locry note editor: a Markdown note with live preview, notes and tasks in the sidebar',
  },
  nav: {
    features: 'Features',
    security: 'Security',
    sync: 'Sync',
    selfHost: 'Self-host',
    faq: 'FAQ',
    open: 'Open Locry',
    otherLang: '/tr',
    otherLangLabel: 'Türkçe',
    skip: 'Skip to content',
  },
  sections: {
    overview: 'Overview',
    features: 'Features',
    tasks: 'Tasks',
    security: 'Security',
    vaults: 'Vaults',
    sync: 'Sync',
    search: 'Smart search',
    compare: 'Comparison',
    selfHost: 'Self-hosting',
    faq: 'FAQ',
  },
  ui: {
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    flow: 'Unlock flow',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Open source · Serverless · Works offline',
    title: 'Your notes and tasks,',
    accent: 'locked with your key only.',
    lead:
      'Locry is an end-to-end encrypted notes and to-do app that runs in your browser. No account, no password, no server: your vault opens with your fingerprint, face or device PIN — with a passkey.',
    start: 'Start for free',
    resume: 'Open your vault',
    github: 'View on GitHub',
    badges: ['AES-256-GCM', 'Passkeys (WebAuthn PRF)', 'Markdown', 'PWA', 'English and Turkish'],
    screenshotAlt: 'The Markdown editor in Locry: note list on the left, editor and live preview on the right',
    phoneAlt: 'Locry on a phone: the note list',
  },
  summary: {
    title: 'Locry at a glance',
    text:
      'Locry is a free, open-source web app that keeps your notes and tasks on your device, encrypted with a key only you can unlock. Nothing is sent to a server; if you want, it backs up and syncs with your other devices through Google Drive, still encrypted.',
    facts: [
      { term: 'What it is', detail: 'Markdown notes and to-do lists in one app' },
      { term: 'Price', detail: 'Free and open source' },
      { term: 'Account', detail: 'None; you sign in with a passkey' },
      { term: 'Encryption', detail: 'AES-256-GCM per record; the key is derived from your passkey' },
      { term: 'Where data lives', detail: 'On your device, in the browser’s encrypted storage' },
      { term: 'Sync', detail: 'Optional, end-to-end encrypted through Google Drive' },
      { term: 'Platforms', detail: 'Modern browsers; installable on macOS, Windows, Linux, iOS and Android (PWA)' },
      { term: 'Languages', detail: 'English and Turkish' },
    ],
  },
  features: {
    title: 'Everything you need to take notes, without giving up your privacy',
    lead: 'Locry looks simple but is complete for everyday use. Every feature works inside your encrypted vault.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Markdown notes',
        text: 'Edit, split and preview modes; toolbar and shortcuts, tags, pinning, archive and checkable task lists.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Tasks',
        text: 'Inbox, Today, Upcoming and Completed views; colored lists, subtasks, priorities, due dates and drag and drop.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Passkey sign-in',
        text: 'No password. The vault is decrypted with a passkey you unlock by fingerprint, face or device PIN; a recovery key is your backup.',
      },
      {
        icon: 'lucideLayers',
        title: 'Multiple vaults',
        text: 'Fully separate vaults such as Personal and Work, each with its own passkeys, recovery key, backups and settings.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Phone and computer',
        text: 'End-to-end encrypted sync through Google Drive. Deletions carry over and conflicting edits are never lost.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Smart search',
        text: 'Search by meaning, not just words. The AI model runs in your browser; your notes are never sent to an AI service.',
      },
      {
        icon: 'lucideArchive',
        title: 'Encrypted backups',
        text: 'Single-file, compressed and encrypted .locry backups, to a file or to Google Drive, automatically if you like.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Offline and installable',
        text: 'Opens without internet. Install it on your desktop or home screen like an app.',
      },
      {
        icon: 'lucideCommand',
        title: 'Keyboard friendly',
        text: '⌘K command palette, “/” to search, N for a new note, T for a new task and G shortcuts to navigate.',
      },
    ],
  },
  security: {
    title: 'How does the encryption work?',
    lead:
      'In Locry, trust rests on math, not on a server. The key exists only on your device, and only in memory while the vault is open.',
    steps: [
      {
        title: '1. Passkey',
        text: 'When you unlock, your device uses the WebAuthn PRF extension to produce a secret unique to your passkey. It never leaves the device.',
      },
      {
        title: '2. Key',
        text: 'HKDF-SHA-256 derives a key from that secret, which unwraps your vault’s random 256-bit key.',
      },
      {
        title: '3. Records',
        text: 'Every note and task is encrypted separately with AES-256-GCM, bound to its type and id.',
      },
    ],
    tableTitle: 'Security model',
    rows: [
      ['Vault key', 'Random 256 bits; in memory only, non-extractable'],
      ['Sign-in', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Recovery', '256-bit recovery key in a separate key slot'],
      ['Data', 'AES-256-GCM per record, with authenticated context (AAD)'],
      ['Backups and sync', 'gzip + AES-256-GCM; authenticated header'],
      ['Preview', 'Sanitized with DOMPurify, remote images blocked, Content Security Policy'],
      ['Auto-lock', 'The key is wiped from memory after the idle time you choose'],
    ],
    note: 'If you lose both your passkeys and your recovery key, nobody — not even Locry — can access your data. That is not a flaw; it is the design.',
  },
  vaults: {
    title: 'Personal and work, in separate vaults',
    text:
      'Each vault is independent: its own encryption key, passkeys, recovery key, backups and settings. Switching vaults locks the open one; one vault’s data is never visible from another.',
    bullets: [
      'Pick a vault on the lock screen; the last one is remembered',
      'Give vaults a name and color; switch from the sidebar in one click',
      'Restoring a backup merges into the same vault, or adds it as a new one',
    ],
    alt: 'The Locry lock screen: choosing a vault and unlocking with a passkey',
  },
  sync: {
    title: 'The same vault on your phone and your computer',
    lead:
      'There is no Locry server for sync. Each device writes its own encrypted copy of the vault to a hidden app folder in your Google Drive and merges the copies of your other devices.',
    bullets: [
      'Google only sees encrypted files; never content, titles or tags',
      'Notes and tasks you delete are deleted on your other devices too',
      'If a note changed on two devices, the older version is kept as a “(conflict)” note',
      'Added passkeys and the vault’s name and color sync as well',
      'Runs while the app is open: on unlock, when you return to the tab and after changes',
    ],
    stepsTitle: 'How to set it up',
    steps: [
      'On your computer: Settings → Sync across devices → Turn on sync.',
      'On your phone, open Locry at the same address and add it to the home screen.',
      'Restore from backup → Google Drive → pick your vault under Synced vaults.',
      'Unlock with your synced passkey or your recovery key; sync starts by itself.',
    ],
    alt: 'Sync across devices in Locry settings, with the devices syncing the vault',
  },
  search: {
    title: 'AI that searches by meaning and keeps your privacy',
    text:
      'Search for “vacation plans” and find your “Hotel booking in Lisbon” note too. The default model is Google’s EmbeddingGemma, and Settings offers five multilingual models to choose from. The model is downloaded once and runs entirely in your browser.',
    bullets: [
      'Keyword and semantic search together, in English and Turkish',
      'Vectors are stored encrypted and stay out of backups and sync',
      '“Similar notes” suggestions; ⌘K to search from anywhere',
      'Opt-in: nothing is downloaded unless you turn it on',
    ],
    alt: 'The Locry search page: semantic results across notes and tasks',
  },
  tasks: {
    title: 'Tasks, right next to your notes',
    text: 'See what to do in the Today view, never miss overdue work, and link tasks to the notes they belong to.',
    bullets: [
      'Smart views: Inbox, Today, Upcoming, Completed',
      'Colored lists, subtasks, priorities and due dates',
      'Drag-and-drop ordering, quick add with T',
    ],
    alt: 'Tasks in Locry: the Today view with priorities and due dates',
  },
  selfHost: {
    title: 'Run it on your own server',
    lead:
      'Locry is open source and consists of static files only. It runs in Docker with one command, and can serve your own domain with automatic HTTPS.',
    code: 'git clone https://github.com/emreerkangames/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'The container holds no data: notes stay encrypted in the browser, so removing the container changes nothing.',
      'Non-root user, read-only file system, dropped capabilities.',
      'With COMPOSE_PROFILES=https and LOCRY_DOMAIN, Caddy gets the certificate automatically.',
    ],
    github: 'Source code and setup docs',
  },
  compare: {
    title: 'Locry compared with typical cloud note apps',
    lead: 'Most note apps keep your data on their servers and can read it. Locry makes that impossible from the start.',
    headers: ['', 'Typical cloud note app', 'Locry'],
    rows: [
      ['Where your data lives', 'On the company’s servers', 'On your device, encrypted'],
      ['Who can read it', 'The service provider', 'Only you'],
      ['Sign-in', 'Email and password', 'Passkey, no password'],
      ['Account', 'Required', 'Not needed'],
      ['Offline', 'Limited', 'Full'],
      ['AI search', 'Notes are sent to a server', 'Runs in your browser'],
      ['Source code', 'Closed', 'Open'],
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What is Locry?',
        a: 'Locry is a free, open-source app that runs in your browser and stores Markdown notes and tasks end-to-end encrypted. It needs no account or password; the vault opens with a passkey.',
      },
      {
        q: 'Where is my data stored?',
        a: 'On your device, encrypted, in the browser’s IndexedDB storage. Locry has no server that keeps your data. If you turn on Google Drive backups or sync, only encrypted files go to Drive.',
      },
      {
        q: 'Is Locry free?',
        a: 'Yes. Locry is free and open source; the source code is on GitHub. You can also run it on your own server with Docker.',
      },
      {
        q: 'What is a passkey, and why is there no password?',
        a: 'A passkey is a phishing-resistant way to sign in with your fingerprint, face or device PIN. Locry derives its encryption key from the passkey through the WebAuthn PRF extension, so there is no password to guess or leak.',
      },
      {
        q: 'What happens if I lose my passkey?',
        a: 'You open the vault with the 256-bit recovery key you saved during setup and add a new passkey. If you lose both your passkeys and the recovery key, nobody can access the data.',
      },
      {
        q: 'How do I sync between my phone and my computer?',
        a: 'Turn on Sync across devices in Settings; on your phone, open Locry at the same address and choose Restore from backup → Google Drive → your vault under Synced vaults. Each device writes its own encrypted copy to Drive and merges the others.',
      },
      {
        q: 'Can Google read my notes?',
        a: 'No. Backup and sync files are encrypted with AES-256-GCM on your device before they reach Drive. Locry only accesses its own hidden app folder (drive.appdata) and cannot see your other Drive files.',
      },
      {
        q: 'Does the AI search send my notes anywhere?',
        a: 'No. The multilingual language model is downloaded once and runs in a Web Worker in your browser. Your notes are never sent to an AI service.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. Locry is an installable web app (PWA) and works offline after the first visit. Only Drive sync and the first model download need the internet.',
      },
      {
        q: 'Which browsers and devices are supported?',
        a: 'Browsers that support passkeys with the PRF extension: Chrome and Edge 118+, Safari 18+. iCloud Keychain, Google Password Manager, 1Password or a hardware security key work.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. Download a single-file encrypted .locry backup from Settings; it opens on another device or address with a passkey or the recovery key.',
      },
    ],
  },
  cta: {
    title: 'Keep your notes yours.',
    text: 'Setup takes a minute: name your vault, create a passkey, save your recovery key.',
    start: 'Use Locry for free',
    github: 'See the source code',
  },
  footer: {
    tagline: 'End-to-end encrypted notes and tasks.',
    openSource: 'Open source',
    madeWith: 'Built with Angular, Web Crypto and WebAuthn, without a server.',
    links: 'Links',
  },
  howTo: {
    name: 'Create an encrypted vault in Locry',
    description: 'Steps to create an end-to-end encrypted notes and tasks vault in Locry that opens with a passkey.',
    steps: [
      { name: 'Open Locry', text: 'Open Locry in your browser and click “Start for free”.' },
      { name: 'Name your vault', text: 'Pick a name and a color for the vault, for example “Personal”.' },
      { name: 'Create a passkey', text: 'Create a passkey with your fingerprint, face or device PIN.' },
      { name: 'Save the recovery key', text: 'Save the recovery key in your password manager and confirm one of its groups.' },
    ],
  },
};

export const LANDING_CONTENT: Record<LandingLang, LandingContent> = { tr, en };
