# Antrian Rumah Sakit

Aplikasi antrian rumah sakit berbasis HTML, CSS, dan TypeScript native. Data jenis antrian, tiket, dan counter disimpan di `localStorage` agar halaman ambil nomor, operator, dan layar berbagi status pada browser yang sama.

## Menjalankan aplikasi

1. Pasang Node.js dan npm.
2. Pasang dependency yang tercatat di lockfile: `npm install`.
3. Buka folder proyek lewat ekstensi Live Server di editor, lalu buka `login.html` atau `ambil-antrian.html`.
4. Untuk kompilasi berulang saat mengedit TypeScript, jalankan `npm run watch`. Untuk pemeriksaan tipe gunakan `npm run typecheck`, dan untuk membuat JavaScript di `dist/` gunakan `npm run build`.

Jangan membuka HTML dengan skema `file://`: modul JavaScript memakai ESM dan browser perlu melayani halaman lewat HTTP lokal.

## Akun uji

DummyJSON mencantumkan akun contoh `emilys` dengan password `emilyspass` pada [dokumentasi autentikasi](https://dummyjson.com/docs/auth). Login memerlukan koneksi internet. Role diputuskan oleh respons API; jika API tidak mengirim role, implementasi auth saat ini memberi role terbatas `user`.

## Halaman

- `login.html`: login staf/pengguna.
- `index.html`: dashboard pengelolaan jenis antrian (bagian Role B).
- `operator.html`: panggil, lewati, dan selesaikan tiket.
- `layar.html`: layar panggilan publik, polling otomatis, fullscreen, dan pengumuman suara.
- `ambil-antrian.html`: terbitkan tiket berdasarkan jenis layanan dan prioritas.

## Struktur kode

- `src/core/`: kontrak data, autentikasi, validasi penyimpanan, tiket, dan audio.
- `src/pages/`: kode halaman TypeScript.
- `style.css`: token desain dan komponen bersama.
- `dist/`: hasil kompilasi TypeScript yang dipakai langsung oleh halaman.

## Tim

- Role A: kontrak data, penyimpanan, autentikasi, dan tiket.
- Role B: jenis antrian dan dashboard admin.
- Role C: desain bersama, layar publik, ambil nomor, audio, dan dokumentasi.

Jenis antrian awal: UMUM-1 (A), UMUM-2 (B), UMUM-3 (C), GIGI (G), FARMASI (F), dan PSIKOLOG (P). Gunakan browser yang sama untuk melihat perubahan antar halaman; tab lain memperbarui data melalui event storage dan polling berkala.
