Baca AGENTS.md dulu sampai habis, terutama bagian Desain. Kamu adalah Role C (Design System & Layar Publik) di proyek antrian rumah sakit ini. Dua teman satu tim mengerjakan bagian lain secara paralel, jadi kontrak di AGENTS.md harus kamu ikuti PERSIS. Role A (Arra) menyediakan types.ts, storage.ts, auth.ts, tickets.ts; Role B (Tejan) menyediakan queueTypes.ts dan index.html.

FILE MILIKMU (hanya ini yang boleh kamu buat/edit):
style.css, layar.html, src/pages/layar.ts, ambil-antrian.html, src/pages/ambil-antrian.ts, src/core/audio.ts, README.md.
JANGAN sentuh: file milik A dan B. Selama file A belum selesai, pakai signature di AGENTS.md sebagai acuan.

URUTAN KERJA:
1. Mode rencana dulu: jangan edit apa pun, tulis rencana + risiko + edge case, tunggu aku setujui.
2. Gate 0b: style.css dulu. Token CSS variables dari AGENTS.md dan komponen: .btn .btn-primary (lime pill + lingkaran panah), .btn-outline, .btn-danger, .card (radius 24px), .badge, .input (pill abu muda), .navbar, .grid. Gaya referensi TranquilQ: bersih, banyak whitespace, heading regular dengan satu kata <em> italic. Responsif. Buat satu halaman demo kecil sementara untuk mengecek komponen, lalu hapus. Setelah ini berhenti dan kabari aku supaya di-push dulu.
3. layar.html + layar.ts (publik, tanpa login): kartu per jenis antrian AKTIF dengan nama, kode, nomor sedang dipanggil (besar, badge DIPANGGIL) atau pesan "Belum ada nomor dipanggil", dan jumlah tiket menunggu. Polling 2-3 detik tanpa reload, teks "Diperbarui HH.MM.SS". Tombol toggle Layar Penuh pakai Fullscreen API (requestFullscreen/exitFullscreen, label berubah). Tab navigasi: Layar Antrian / Ambil Nomor.
4. ambil-antrian.html + ambil-antrian.ts (publik): kartu per jenis antrian aktif, tombol Ambil Nomor (Normal) dan tombol prioritas Lansia/Disabilitas/VIP. Setelah ambil tampilkan tiket yang didapat (format A-001) beserta jumlah yang menunggu. Jenis baru dari admin muncul otomatis lewat polling, jenis nonaktif hilang atau disabled.
5. Bonus audio (src/core/audio.ts): pakai Web Speech API (speechSynthesis), bahasa id-ID, ucapkan "Nomor A 0 0 1, silakan menuju UMUM-1" saat nomor baru dipanggil di layar.ts (deteksi perubahan nomor antar polling, jangan ulang suara kalau nomor sama). Sediakan tombol aktifkan suara karena browser butuh interaksi pengguna dulu.
6. README.md: cara menjalankan (npm install, npm run watch, Live Server), struktur folder, akun uji dummyjson, pembagian tugas tim.
7. QA akhir: uji alur penuh lintas halaman dan catat bug untuk pemilik file terkait.

ATURAN: tanpa library/icon/font eksternal apa pun, tanpa any/as/@ts-ignore, import berekstensi .js, jalankan npm run typecheck dan npm run build setelah tiap langkah, commit kecil per langkah di branch feat/public. Tampilkan ringkasan perubahan dan cara tes manual setiap selesai langkah. Aku harus bisa menjelaskan semua kodenya saat demo, jadi jelaskan bagian rumit kalau aku minta.

CATATAN DARI ARRA
LOGIN (login.html)
- .page-login (body), .login-wrap, .login-card, .login-form, .login-links
- .muted (teks abu, pakai --muted)
- .form-error (pesan error, warna --danger). Elemen ini memakai atribut hidden,
  jadi jangan set display di .form-error tanpa :not([hidden]),
  atau tambahkan [hidden]{display:none !important}
- Tombol utama strukturnya:
    <button class="btn btn-primary">
      <span class="btn-label">Masuk</span>
      <span class="btn-arrow"><svg>panah</svg></span>   <- lingkaran panah di ujung
    </button>
- Saat loading tombol disabled dan punya aria-busy="true", mohon ada style
  :disabled (opacity / cursor not-allowed)

NAVBAR (operator.html, sebaiknya dipakai juga di index.html)
- .navbar, .navbar-brand (ada <em>RS</em>), .navbar-links (link aktif: aria-current="page"),
  .navbar-user, .navbar-name, badge role pakai .badge
- .container (pembungkus main)

OPERATOR (operator.html)
- .operator-grid (dipakai bersama .grid)
- .queue-card (bersama .card), .queue-card-header, .queue-name
- .queue-current, .queue-label, .queue-number (nomor dipanggil, besar)
- .queue-next, .queue-next-number, .queue-waiting
- .queue-actions (3 tombol: Panggil Berikutnya = btn-primary, Lewati & Selesai = btn-outline;
  sering disabled, jadi butuh style :disabled)

BADGE TAMBAHAN
- .badge-vip, .badge-disabilitas, .badge-lansia, .badge-normal (prioritas)
- .badge-skipped (badge "Dilewati")

Heading memakai <em> untuk kata kunci: "Selamat <em>Datang</em> Kembali",
"Panel <em>Operator</em>".
Semua ikon SVG inline pakai stroke="currentColor", jadi warnanya mengikuti color tombol.
