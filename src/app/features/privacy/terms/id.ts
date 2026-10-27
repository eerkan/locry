import type { LegalContent } from '../privacy-content';

export const id: LegalContent = {
  lang: 'id',
  meta: {
    title: 'Ketentuan Layanan — Locry',
    description:
      'Ketentuan penggunaan Locry, aplikasi catatan dan tugas terenkripsi yang gratis dan sumber terbuka: data dan kunci Anda, penggunaan yang wajar, layanan pihak ketiga, jawaban AI, dan tanpa jaminan.',
  },
  title: 'Ketentuan Layanan',
  updated: 'Terakhir diperbarui',
  intro:
    'Ketentuan ini berlaku saat Anda memakai Locry di alamat ini. Locry adalah aplikasi catatan dan tugas gratis dan sumber terbuka yang berjalan sepenuhnya di browser Anda; tidak ada akun dan tidak ada yang perlu dibeli.',
  sections: [
    {
      heading: 'Menggunakan Locry',
      body: ['Dengan menggunakan Locry, Anda menyetujui ketentuan ini. Jika tidak setuju, mohon jangan menggunakannya.'],
    },
    {
      heading: 'Sumber terbuka',
      body: [
        'Kode sumber Locry tersedia di bawah [Lisensi MIT](https://github.com/eerkan/locry/blob/main/LICENSE). Anda boleh menggunakan, menyalin, mengubah, dan mendistribusikannya sesuai lisensi tersebut; ketentuan ini mencakup situs di alamat ini.',
      ],
    },
    {
      heading: 'Data dan kunci Anda',
      body: [
        'Catatan dan tugas Anda dienkripsi di perangkat Anda, dan hanya passkey serta kunci pemulihan Anda yang bisa membukanya. Menjaganya tetap aman adalah tanggung jawab Anda: jika keduanya hilang, tidak ada seorang pun, termasuk pengembang, yang dapat memulihkan data Anda.',
        'Buat cadangan secara rutin. Browser bisa menghapus data situs, misalnya saat penyimpanan hampir penuh atau saat Anda menghapus data penjelajahan.',
      ],
    },
    {
      heading: 'Penggunaan yang wajar',
      body: [
        'Gunakan Locry hanya dengan cara yang sah. Jangan mencoba mengganggu situs ini dan jangan memakainya untuk menyalahgunakan layanan pihak ketiga yang terhubung dengannya.',
      ],
    },
    {
      heading: 'Layanan pihak ketiga',
      body: [
        'Fitur opsional bergantung pada Google Drive, Hugging Face, dan GitHub Pages, yang ketentuannya sendiri berlaku saat Anda memakainya, seperti [Persyaratan Layanan Google](https://policies.google.com/terms) dan [Ketentuan Layanan GitHub](https://docs.github.com/site-policy/github-terms/github-terms-of-service).',
      ],
    },
    {
      heading: 'Jawaban AI',
      body: [
        'Hasil pencarian cerdas dan jawaban “Tanya catatan Anda” berasal dari model AI kecil yang berjalan di perangkat Anda. Hasilnya bisa tidak lengkap atau keliru; periksa sumbernya sebelum mengandalkannya.',
      ],
    },
    {
      heading: 'Tanpa jaminan',
      body: [
        'Locry disediakan “sebagaimana adanya”, tanpa jaminan apa pun, tersurat maupun tersirat, termasuk kesesuaian untuk tujuan tertentu dan ketersediaan tanpa gangguan.',
        'Sejauh diizinkan oleh hukum, pengembang tidak bertanggung jawab atas kehilangan data atau kerugian lain yang timbul dari penggunaan Locry.',
      ],
    },
    {
      heading: 'Perubahan',
      body: [
        'Ketentuan ini dapat berubah. Versi barunya akan diterbitkan di halaman ini dengan tanggal baru; tetap memakai Locry setelahnya berarti Anda menerimanya.',
      ],
    },
    {
      heading: 'Kontak',
      body: ['Pertanyaan tentang ketentuan ini: buka issue di [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Kembali ke Locry',
};
