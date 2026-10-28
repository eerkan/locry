import type { LandingContent } from '../landing-content';

export const id: LandingContent = {
  lang: 'id',
  meta: {
    title: 'Locry — Catatan dan tugas terenkripsi end-to-end, dengan passkey',
    description:
      'Locry adalah aplikasi catatan dan tugas sumber terbuka tanpa server yang berjalan di browser: Markdown, tugas, masuk dengan passkey, AES-256, sinkronisasi terenkripsi, dan pencarian AI pribadi.',
    ogImageAlt: 'Editor catatan Locry: catatan Markdown dengan pratinjau langsung, catatan dan tugas di bilah samping',
  },
  nav: {
    features: 'Fitur',
    security: 'Keamanan',
    sync: 'Sinkronisasi',
    selfHost: 'Host sendiri',
    faq: 'FAQ',
    support: 'Dukung',
    open: 'Buka Locry',
    skip: 'Langsung ke konten',
  },
  sections: {
    overview: 'Ikhtisar',
    features: 'Fitur',
    tasks: 'Tugas',
    security: 'Keamanan',
    vaults: 'Brankas',
    sync: 'Sinkronisasi',
    search: 'Pencarian cerdas',
    compare: 'Perbandingan',
    selfHost: 'Host sendiri',
    faq: 'FAQ',
  },
  ui: {
    theme: 'Tema',
    light: 'Terang',
    dark: 'Gelap',
    system: 'Sistem',
    language: 'Bahasa',
    flow: 'Alur membuka kunci',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Sumber terbuka · Tanpa server · Bisa offline',
    title: 'Catatan dan tugas Anda,',
    accent: 'terkunci hanya dengan kunci Anda.',
    lead:
      'Locry adalah aplikasi catatan dan tugas terenkripsi end-to-end yang berjalan di browser Anda. Tanpa akun, tanpa kata sandi, tanpa server: brankas Anda terbuka dengan sidik jari, wajah, atau PIN perangkat — dengan passkey.',
    start: 'Mulai gratis',
    resume: 'Buka brankas Anda',
    github: 'Lihat di GitHub',
    badges: ['AES-256-GCM', 'Passkey (WebAuthn PRF)', 'Markdown', 'PWA', '11 bahasa'],
    screenshotAlt: 'Editor Markdown di Locry: daftar catatan di kiri, editor dan pratinjau langsung di kanan',
    phoneAlt: 'Locry di ponsel: daftar catatan',
  },
  summary: {
    title: 'Sekilas tentang Locry',
    text:
      'Locry adalah aplikasi web gratis dan sumber terbuka yang menyimpan catatan dan tugas Anda di perangkat Anda, terenkripsi dengan kunci yang hanya bisa Anda buka. Tidak ada yang dikirim ke server; jika Anda mau, Locry mencadangkan dan menyinkronkan dengan perangkat lain melalui Google Drive, tetap terenkripsi.',
    facts: [
      { term: 'Apa itu', detail: 'Catatan Markdown dan daftar tugas dalam satu aplikasi' },
      { term: 'Harga', detail: 'Gratis dan sumber terbuka' },
      { term: 'Akun', detail: 'Tidak perlu; Anda masuk dengan passkey' },
      { term: 'Enkripsi', detail: 'AES-256-GCM per data; kuncinya diturunkan dari passkey Anda' },
      { term: 'Lokasi data', detail: 'Di perangkat Anda, di penyimpanan browser yang terenkripsi' },
      { term: 'Sinkronisasi', detail: 'Opsional, terenkripsi end-to-end melalui Google Drive' },
      { term: 'Platform', detail: 'Browser modern; dapat dipasang di macOS, Windows, Linux, iOS, dan Android (PWA)' },
      { term: 'AI di perangkat', detail: 'Pencarian pintar, Tanya catatan Anda, dan dikte berjalan di browser Anda' },
      { term: 'Bahasa', detail: 'Inggris, Turki, Tionghoa, Spanyol, Arab, Portugis, Indonesia, Prancis, Jepang, Rusia, dan Jerman' },
    ],
  },
  features: {
    title: 'Semua yang Anda butuhkan untuk mencatat, tanpa mengorbankan privasi',
    lead: 'Locry tampak sederhana, tetapi lengkap untuk sehari-hari. Setiap fitur bekerja di dalam brankas terenkripsi Anda.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Catatan Markdown',
        text: 'Mode edit, terbagi, dan pratinjau; bilah alat dan pintasan, tag, sematan, arsip, dan daftar tugas yang bisa dicentang.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Tugas',
        text: 'Tampilan Kotak masuk, Hari ini, Mendatang, dan Selesai; daftar berwarna, subtugas, prioritas, tenggat, dan seret-lepas.',
      },
      {
        icon: 'lucideBell',
        title: 'Pengingat',
        text: 'Notifikasi saat waktu tugas tiba, selama Locry terbuka, bahkan di tab latar belakang. Tanpa server.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Masuk dengan passkey',
        text: 'Tanpa kata sandi. Brankas didekripsi dengan passkey yang Anda buka lewat sidik jari, wajah, atau PIN perangkat; kunci pemulihan menjadi cadangan Anda.',
      },
      {
        icon: 'lucideLayers',
        title: 'Beberapa brankas',
        text: 'Brankas yang benar-benar terpisah seperti Pribadi dan Kerja, masing-masing dengan passkey, kunci pemulihan, cadangan, dan pengaturannya sendiri.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Ponsel dan komputer',
        text: 'Sinkronisasi terenkripsi end-to-end melalui Google Drive. Penghapusan ikut terbawa dan suntingan yang bentrok tidak pernah hilang.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Pencarian cerdas',
        text: 'Cari berdasarkan makna, bukan hanya kata. Model AI berjalan di browser Anda; catatan Anda tidak pernah dikirim ke layanan AI.',
      },
      {
        icon: 'lucideMessageCircleQuestion',
        title: 'Tanya catatan Anda',
        text: 'Ajukan pertanyaan dan dapatkan jawaban yang ditulis dari catatan dan tugas Anda sendiri, lengkap dengan sumbernya. Model bahasa kecil berjalan di browser Anda.',
      },
      {
        icon: 'lucideMic',
        title: 'Suara',
        text: 'Diktekan catatan dan tugas dengan Whisper yang berjalan di perangkat Anda, dan dengarkan catatan dengan suara perangkat Anda. Tidak ada yang direkam atau dikirim.',
      },
      {
        icon: 'lucideArchive',
        title: 'Cadangan terenkripsi',
        text: 'Cadangan .locry dalam satu file, terkompresi dan terenkripsi, ke file atau Google Drive, otomatis jika Anda mau.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Offline dan bisa dipasang',
        text: 'Tetap terbuka tanpa internet. Pasang di desktop atau layar utama seperti aplikasi.',
      },
      {
        icon: 'lucideCommand',
        title: 'Keyboard dan aksesibilitas',
        text: 'Palet perintah ⌘K, “/” untuk mencari, N untuk catatan baru, T untuk tugas baru; bisa dipakai hanya dengan keyboard dan dengan pembaca layar.',
      },
    ],
  },
  security: {
    title: 'Bagaimana enkripsinya bekerja?',
    lead:
      'Di Locry, kepercayaan bertumpu pada matematika, bukan server. Kuncinya hanya ada di perangkat Anda, dan hanya di memori selama brankas terbuka.',
    steps: [
      {
        title: '1. Passkey',
        text: 'Saat membuka kunci, perangkat Anda memakai ekstensi WebAuthn PRF untuk menghasilkan rahasia yang unik bagi passkey Anda. Rahasia itu tidak pernah meninggalkan perangkat.',
      },
      {
        title: '2. Kunci',
        text: 'HKDF-SHA-256 menurunkan kunci dari rahasia itu, yang membuka kunci acak 256 bit milik brankas Anda.',
      },
      {
        title: '3. Data',
        text: 'Setiap catatan dan tugas dienkripsi terpisah dengan AES-256-GCM, terikat pada jenis dan id-nya.',
      },
    ],
    tableTitle: 'Model keamanan',
    rows: [
      ['Kunci brankas', '256 bit acak; hanya di memori, tidak dapat diekspor'],
      ['Masuk', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Pemulihan', 'Kunci pemulihan 256 bit di slot kunci terpisah'],
      ['Data', 'AES-256-GCM per data, dengan konteks terautentikasi (AAD)'],
      ['Cadangan dan sinkronisasi', 'gzip + AES-256-GCM; header terautentikasi'],
      ['Pratinjau', 'Dibersihkan dengan DOMPurify, gambar luar diblokir, Content Security Policy'],
      ['Kunci otomatis', 'Kunci dihapus dari memori setelah waktu diam yang Anda pilih'],
    ],
    note: 'Jika Anda kehilangan passkey dan kunci pemulihan sekaligus, tidak ada yang — termasuk Locry — bisa mengakses data Anda. Itu bukan cacat; memang begitu rancangannya.',
  },
  vaults: {
    title: 'Pribadi dan kerja, di brankas terpisah',
    text:
      'Setiap brankas berdiri sendiri: kunci enkripsi, passkey, kunci pemulihan, cadangan, dan pengaturannya sendiri. Berganti brankas akan mengunci yang sedang terbuka; data satu brankas tidak pernah terlihat dari brankas lain.',
    bullets: [
      'Pilih brankas di layar kunci; yang terakhir dipakai akan diingat',
      'Beri brankas nama dan warna; berpindah dari bilah samping dengan sekali klik',
      'Memulihkan cadangan akan menggabungkannya ke brankas yang sama, atau menambahkannya sebagai brankas baru',
    ],
    alt: 'Layar kunci Locry: memilih brankas dan membukanya dengan passkey',
  },
  sync: {
    title: 'Brankas yang sama di ponsel dan komputer',
    lead:
      'Tidak ada server Locry untuk sinkronisasi. Setiap perangkat menulis salinan terenkripsinya sendiri ke folder aplikasi tersembunyi di Google Drive Anda dan menggabungkan salinan dari perangkat Anda yang lain.',
    bullets: [
      'Google hanya melihat file terenkripsi; tidak pernah isi, judul, atau tag',
      'Catatan dan tugas yang Anda hapus juga terhapus di perangkat lain',
      'Jika sebuah catatan berubah di dua perangkat, versi lama disimpan sebagai catatan “(konflik)”',
      'Passkey yang ditambahkan serta nama dan warna brankas juga ikut tersinkron',
      'Berjalan saat aplikasi terbuka: saat membuka kunci, saat kembali ke tab, dan setelah ada perubahan',
    ],
    stepsTitle: 'Cara menyiapkannya',
    steps: [
      'Di komputer: Pengaturan → Sinkronisasi antarperangkat → Aktifkan sinkronisasi.',
      'Di ponsel, buka Locry di alamat yang sama dan tambahkan ke layar utama.',
      'Pulihkan dari cadangan → Google Drive → pilih brankas Anda di Brankas tersinkron.',
      'Buka dengan passkey tersinkron atau kunci pemulihan; sinkronisasi berjalan dengan sendirinya.',
    ],
    alt: 'Sinkronisasi antarperangkat di pengaturan Locry, beserta perangkat yang menyinkronkan brankas',
  },
  search: {
    title: 'AI yang mencari berdasarkan makna dan menjaga privasi Anda',
    text:
      'Cari “rencana liburan” dan temukan juga catatan “Pemesanan hotel di Bali”. Model bawaannya adalah EmbeddingGemma dari Google, dan Pengaturan menawarkan lima model multibahasa. Model diunduh sekali dan berjalan sepenuhnya di browser Anda.',
    bullets: [
      'Pencarian kata kunci dan semantik sekaligus, dalam bahasa apa pun di aplikasi',
      'Vektor disimpan terenkripsi dan tidak ikut dalam cadangan maupun sinkronisasi',
      'Saran “catatan serupa”; ⌘K untuk mencari dari mana saja',
      'Opsional: tidak ada yang diunduh sebelum Anda mengaktifkannya',
    ],
    alt: 'Halaman pencarian Locry: hasil semantik di catatan dan tugas',
  },
  tasks: {
    title: 'Tugas, tepat di samping catatan Anda',
    text: 'Lihat yang harus dikerjakan di tampilan Hari ini, jangan lewatkan tugas yang terlambat, dan tautkan tugas ke catatannya.',
    bullets: [
      'Tampilan pintar: Kotak masuk, Hari ini, Mendatang, Selesai',
      'Daftar berwarna, subtugas, prioritas, tanggal dan jam jatuh tempo',
      'Pengingat lewat notifikasi selama Locry terbuka',
      'Urutkan dengan menyeret atau keyboard; tambah dengan T atau dikte',
    ],
    alt: 'Tugas di Locry: tampilan Hari ini dengan prioritas dan tenggat',
  },
  selfHost: {
    title: 'Jalankan di server Anda sendiri',
    lead:
      'Locry bersumber terbuka dan hanya terdiri dari file statis. Berjalan di Docker dengan satu perintah dan bisa melayani domain Anda sendiri dengan HTTPS otomatis.',
    code: 'git clone https://github.com/eerkan/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'Kontainer tidak menyimpan data: catatan tetap terenkripsi di browser, jadi menghapus kontainer tidak mengubah apa pun.',
      'Pengguna non-root, sistem file baca-saja, hak istimewa dicabut.',
      'Dengan COMPOSE_PROFILES=https dan LOCRY_DOMAIN, Caddy mengambil sertifikat secara otomatis.',
    ],
    github: 'Kode sumber dan panduan pemasangan',
  },
  compare: {
    title: 'Locry dibandingkan aplikasi catatan cloud pada umumnya',
    lead: 'Kebanyakan aplikasi catatan menyimpan data Anda di server mereka dan bisa membacanya. Locry membuatnya mustahil sejak awal.',
    headers: ['', 'Aplikasi catatan cloud umumnya', 'Locry'],
    rows: [
      ['Lokasi data Anda', 'Di server perusahaan', 'Di perangkat Anda, terenkripsi'],
      ['Siapa yang bisa membaca', 'Penyedia layanan', 'Hanya Anda'],
      ['Masuk', 'Email dan kata sandi', 'Passkey, tanpa kata sandi'],
      ['Akun', 'Wajib', 'Tidak perlu'],
      ['Offline', 'Terbatas', 'Penuh'],
      ['Pencarian AI', 'Catatan dikirim ke server', 'Berjalan di browser Anda'],
      ['Kode sumber', 'Tertutup', 'Terbuka'],
    ],
  },
  faq: {
    title: 'Pertanyaan yang sering diajukan',
    items: [
      {
        q: 'Apa itu Locry?',
        a: 'Locry adalah aplikasi gratis dan sumber terbuka yang berjalan di browser Anda dan menyimpan catatan Markdown serta tugas dengan enkripsi end-to-end. Tidak perlu akun atau kata sandi; brankas dibuka dengan passkey.',
      },
      {
        q: 'Di mana data saya disimpan?',
        a: 'Di perangkat Anda, terenkripsi, di penyimpanan IndexedDB browser. Locry tidak punya server yang menyimpan data Anda. Jika Anda mengaktifkan cadangan Google Drive atau sinkronisasi, hanya file terenkripsi yang dikirim ke Drive.',
      },
      {
        q: 'Apakah Locry gratis?',
        a: 'Ya. Locry gratis dan sumber terbuka; kode sumbernya ada di GitHub. Anda juga bisa menjalankannya di server sendiri dengan Docker.',
      },
      {
        q: 'Apa itu passkey, dan mengapa tidak ada kata sandi?',
        a: 'Passkey adalah cara masuk yang tahan phishing dengan sidik jari, wajah, atau PIN perangkat. Locry menurunkan kunci enkripsinya dari passkey melalui ekstensi WebAuthn PRF, sehingga tidak ada kata sandi yang bisa ditebak atau bocor.',
      },
      {
        q: 'Bagaimana jika passkey saya hilang?',
        a: 'Anda membuka brankas dengan kunci pemulihan 256 bit yang disimpan saat penyiapan, lalu menambahkan passkey baru. Jika passkey dan kunci pemulihan sama-sama hilang, tidak ada yang bisa mengakses data.',
      },
      {
        q: 'Bagaimana cara menyinkronkan ponsel dan komputer?',
        a: 'Aktifkan Sinkronisasi antarperangkat di Pengaturan; di ponsel, buka Locry di alamat yang sama lalu pilih Pulihkan dari cadangan → Google Drive → brankas Anda di Brankas tersinkron. Setiap perangkat menulis salinan terenkripsinya sendiri ke Drive dan menggabungkan yang lain.',
      },
      {
        q: 'Bisakah Google membaca catatan saya?',
        a: 'Tidak. File cadangan dan sinkronisasi dienkripsi dengan AES-256-GCM di perangkat Anda sebelum sampai ke Drive. Locry hanya mengakses folder aplikasi tersembunyinya sendiri (drive.appdata) dan tidak bisa melihat file Drive Anda yang lain.',
      },
      {
        q: 'Apakah pencarian AI mengirim catatan saya ke suatu tempat?',
        a: 'Tidak. Model bahasa multibahasa diunduh sekali dan berjalan di Web Worker di browser Anda. Catatan Anda tidak pernah dikirim ke layanan AI.',
      },
      {
        q: 'Bisakah saya bertanya pada catatan saya?',
        a: 'Bisa, dengan “Tanya catatan Anda”: model bahasa kecil (Qwen3 0.6B secara bawaan) berjalan di browser Anda dengan WebGPU dan menjawab dari catatan dan tugas Anda sendiri, dengan sumber bernomor. Fitur ini opsional dan diunduh sekali; catatan Anda tidak pernah meninggalkan perangkat.',
      },
      {
        q: 'Bisakah saya mendikte, dan apakah suara saya dikirim ke mana pun?',
        a: 'Anda bisa mendikte catatan dan tugas. Ucapan Anda diubah menjadi teks oleh Whisper dari OpenAI yang berjalan di browser Anda; rekaman langsung dibuang dan tidak pernah disimpan atau dikirim. Membacakan catatan hanya memakai suara yang terpasang di perangkat Anda.',
      },
      {
        q: 'Apakah Locry mengingatkan tugas saya?',
        a: 'Ya, selama Locry terbuka (juga di tab latar belakang atau sebagai aplikasi terpasang): Anda mendapat notifikasi saat waktu tugas tiba. Locry tidak punya server, jadi pengingat tidak bisa datang saat Locry ditutup.',
      },
      {
        q: 'Apakah bisa dipakai offline?',
        a: 'Ya. Locry adalah aplikasi web yang bisa dipasang (PWA) dan bekerja offline setelah kunjungan pertama. Hanya sinkronisasi Drive dan unduhan model pertama yang butuh internet.',
      },
      {
        q: 'Browser dan perangkat apa yang didukung?',
        a: 'Browser yang mendukung passkey dengan ekstensi PRF: Chrome dan Edge 118+, Safari 18+. iCloud Keychain, Pengelola Sandi Google, 1Password, atau kunci keamanan fisik bisa digunakan.',
      },
      {
        q: 'Bisakah saya mengekspor data?',
        a: 'Ya. Unduh cadangan .locry terenkripsi dalam satu file dari Pengaturan; cadangan itu bisa dibuka di perangkat atau alamat lain dengan passkey atau kunci pemulihan.',
      },
    ],
  },
  cta: {
    title: 'Catatan Anda tetap milik Anda.',
    text: 'Penyiapan hanya semenit: beri nama brankas, buat passkey, simpan kunci pemulihan.',
    start: 'Pakai Locry gratis',
    github: 'Lihat kode sumber',
  },
  footer: {
    tagline: 'Catatan dan tugas terenkripsi end-to-end.',
    openSource: 'Sumber terbuka',
    madeWith: 'Dibuat dengan Angular, Web Crypto, dan WebAuthn, tanpa server.',
    links: 'Tautan',
    privacy: 'Privasi',
    terms: 'Ketentuan',
  },
  support: {
    title: 'Dukung Locry',
    text: 'Locry gratis, sumber terbuka, tanpa iklan atau pelacakan. Jika bermanfaat bagi Anda, Anda bisa mendukung pengembangannya.',
    crypto: 'Kripto',
    copy: 'Salin',
    copied: 'Disalin',
  },
  howTo: {
    name: 'Membuat brankas terenkripsi di Locry',
    description: 'Langkah-langkah membuat brankas catatan dan tugas terenkripsi end-to-end di Locry yang dibuka dengan passkey.',
    steps: [
      { name: 'Buka Locry', text: 'Buka Locry di browser dan klik “Mulai gratis”.' },
      { name: 'Beri nama brankas', text: 'Pilih nama dan warna untuk brankas, misalnya “Pribadi”.' },
      { name: 'Buat passkey', text: 'Buat passkey dengan sidik jari, wajah, atau PIN perangkat.' },
      { name: 'Simpan kunci pemulihan', text: 'Simpan kunci pemulihan di pengelola kata sandi dan konfirmasi salah satu grupnya.' },
    ],
  },
};
