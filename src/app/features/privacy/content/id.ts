import type { PrivacyContent } from '../privacy-content';

export const id: PrivacyContent = {
  lang: 'id',
  meta: {
    title: 'Kebijakan Privasi — Locry',
    description:
      'Locry menyimpan catatan dan tugas Anda secara terenkripsi di perangkat Anda. Tanpa server, tanpa akun, tanpa pelacakan. Apa yang disimpan Locry, apa kaitan Google Drive dan model AI, serta cara Anda tetap memegang kendali.',
  },
  title: 'Kebijakan Privasi',
  updated: 'Terakhir diperbarui',
  intro:
    'Locry adalah aplikasi catatan dan tugas gratis dan sumber terbuka yang berjalan sepenuhnya di browser Anda. Kebijakan ini menjelaskan data apa yang ditanganinya. Singkatnya: catatan Anda tidak pernah sampai ke pengembang, tidak ada server yang menyimpannya, tidak ada akun dan tidak ada pelacakan.',
  sections: [
    {
      heading: 'Apa yang disimpan Locry, dan di mana',
      body: [
        'Catatan, tugas, daftar, dan pengaturan Anda hanya disimpan di perangkat Anda, di penyimpanan browser (IndexedDB), dienkripsi dengan AES-256-GCM. Kuncinya diturunkan dari passkey (atau kunci pemulihan) Anda dan hanya ada di memori perangkat selama brankas terbuka. Pengembang tidak memiliki akses ke data Anda dan tidak menyimpan salinannya.',
        'Agar layar kunci bisa ditampilkan sebelum dibuka, beberapa hal disimpan tanpa enkripsi di perangkat: nama dan warna brankas, serta preferensi aplikasi seperti bahasa dan tema.',
      ],
    },
    {
      heading: 'Tanpa akun, analitik, atau iklan',
      body: [
        'Locry tidak memiliki pendaftaran dan akun pengguna. Locry tidak memakai analitik, iklan, cookie pelacak, maupun pelacak pihak ketiga.',
      ],
    },
    {
      heading: 'Google Drive (opsional)',
      body: [
        'Jika Anda menghubungkan Google Drive untuk cadangan atau sinkronisasi, Locry hanya meminta izin drive.appdata: folder tersembunyi di Drive Anda yang hanya dapat diakses Locry. Locry tidak dapat melihat, membaca, atau mengubah file Drive Anda yang lain.',
        'Semuanya dienkripsi di perangkat Anda sebelum diunggah, sehingga Google hanya menyimpan data terenkripsi beserta nama, ukuran, waktu file, dan label perangkat (misalnya “iPhone · Safari”). Token akses dari Google hanya disimpan di memori dan dihapus saat brankas dikunci. Anda dapat memutuskan sambungan kapan saja di Pengaturan atau di [izin Akun Google Anda](https://myaccount.google.com/permissions).',
        'Penggunaan dan pemindahan informasi yang diterima Locry dari Google API mematuhi [Kebijakan Data Pengguna Layanan Google API](https://developers.google.com/terms/api-services-user-data-policy), termasuk persyaratan Penggunaan Terbatas (Limited Use). Informasi itu hanya dipakai untuk menyimpan dan membaca cadangan serta salinan sinkronisasi terenkripsi milik Anda sendiri; tidak dibagikan kepada siapa pun, tidak dipakai untuk iklan, dan tidak dibaca oleh manusia.',
      ],
    },
    {
      heading: 'Fitur AI (opsional)',
      body: [
        'Jika Anda mengaktifkan pencarian cerdas atau “Tanya catatan Anda”, file model AI diunduh sekali dari Hugging Face (huggingface.co). Seperti unduhan lainnya, Hugging Face dapat melihat alamat IP Anda dan file mana yang diminta. Catatan dan pertanyaan Anda hanya diproses di perangkat Anda dan tidak pernah dikirim ke layanan AI mana pun.',
      ],
    },
    {
      heading: 'Hosting',
      body: [
        'Situs ini disajikan melalui GitHub Pages. Seperti penyedia hosting lainnya, GitHub dapat mencatat data teknis seperti alamat IP untuk keperluan keamanan; lihat [Pernyataan Privasi GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). Jika Anda memakai Locry di server orang lain, kebijakan pengelolanya berlaku untuk server tersebut.',
      ],
    },
    {
      heading: 'Donasi',
      body: [
        'Tautan donasi mengarah ke platform eksternal (seperti GitHub Sponsors atau Ko-fi) dengan kebijakan privasi masing-masing. Locry tidak menerima data apa pun dari mereka.',
      ],
    },
    {
      heading: 'Kendali ada di tangan Anda',
      body: [
        'Anda dapat menghapus data kapan saja: hapus brankas di Pengaturan, atau bersihkan data situs ini di browser Anda. Cadangan di Google Drive dapat dihapus di Pengaturan, dan akses Locry dapat dicabut di Akun Google Anda. Karena pengembang tidak menyimpan data tentang Anda, tidak ada yang perlu diminta atau dihapus dari pihak kami.',
      ],
    },
    {
      heading: 'Perubahan',
      body: ['Jika kebijakan ini berubah, versi barunya akan diterbitkan di halaman ini dengan tanggal baru.'],
    },
    {
      heading: 'Kontak',
      body: ['Pertanyaan tentang kebijakan ini: buka issue di [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Kembali ke Locry',
};
