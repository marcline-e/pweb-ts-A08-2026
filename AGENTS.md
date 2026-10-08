# AGENTS.md: Antrian Rumah Sakit (pweb-ts-a08-2026)

## Tujuan
Aplikasi antrian rumah sakit native, 5 halaman: login, index (admin), operator, layar, ambil-antrian.
Tiga orang mengerjakan paralel. Ikuti kontrak di file ini PERSIS supaya kode saling cocok.

## Aturan keras
- Native only: TANPA framework/library JS/CSS apapun (React, Vue, jQuery, Bootstrap, Tailwind, dll), TANPA template, TANPA icon/font library. Icon pakai inline SVG/CSS.
- Semua kode di `src/**/*.ts`, hasil compile ke `dist/`. `dist/` WAJIB ikut di-commit.
- TypeScript strict. DILARANG: `any`, `@ts-ignore`, dan `as` kecuali benar-benar tak terhindarkan (beri komentar alasan). Data dari localStorage/API diparse sebagai `unknown` lalu divalidasi.
- HTML memuat script: `<script type="module" src="dist/pages/NAMA.js" defer></script>`.
- Import relatif WAJIB berekstensi `.js`: `import { load } from "../core/storage.js";`
- Setelah setiap perubahan jalankan `npm run typecheck` dan `npm run build`. Jangan klaim selesai sebelum keduanya lolos.
- Jangan edit file milik orang lain. Butuh perubahan di file orang lain: tulis di PR/komentar, jangan langsung ubah.
- Jangan tambah dependency apapun (kecuali typescript).
- Commit kecil dan sering, format: `feat(scope): ...`, `fix(scope): ...`.

## Struktur
/login.html /index.html /operator.html /layar.html /ambil-antrian.html
/style.css                 (milik C)
/src/core/types.ts         (A)
/src/core/storage.ts       (A)
/src/core/auth.ts          (A)
/src/core/tickets.ts       (A)
/src/core/queueTypes.ts    (B)
/src/pages/{login,index,operator,layar,ambil-antrian}.ts

## Kontrak data (types.ts, jangan diubah tanpa kesepakatan semua orang)
export type Role = "admin" | "moderator" | "user";
export type Priority = "normal" | "lansia" | "disabilitas" | "vip";
export type TicketStatus = "waiting" | "called" | "done" | "expired";
export interface Session { token: string; role: Role; firstName: string; }
export interface QueueType { id: string; code: string; name: string; active: boolean; }
export interface Ticket {
  id: string; queueTypeId: string; code: string; seq: number;
  number: string;            // "A-001"
  priority: Priority; status: TicketStatus;
  createdAt: number; requeuedAt?: number; calledAt?: number; skipCount: number;
}
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

## Kunci localStorage
pweb.session, pweb.queueTypes, pweb.tickets, pweb.counters (Record<queueTypeId, number>)
Seed jika kosong: UMUM-1(A), UMUM-2(B), UMUM-3(C), GIGI(G), FARMASI(F), PSIKOLOG(P), semua active.

## API core (nama dan signature tetap)
storage.ts : load<T>(key, validate, fallback): T ; save(key, value): void ; KEYS
auth.ts    : login(username, password): Promise<Result<Session>> ; getSession(): Session|null ;
             requireAuth(allowed?: Role[]): Session ; logout(): void ; isStaff(role): boolean
queueTypes.ts: getQueueTypes() ; addQueueType(code, name): Result<QueueType> ;
             toggleQueueType(id): void ; deleteQueueType(id): void   (hapus juga tiket-nya)
tickets.ts : issueTicket(queueTypeId, priority): Result<Ticket> ; getTickets() ;
             getCalled(queueTypeId): Ticket|null ; getWaiting(queueTypeId): Ticket[] (sudah terurut) ;
             callNext(queueTypeId): Ticket|null ; finishCurrent(queueTypeId): void ;
             skipCurrent(queueTypeId): void ; resetQueue(): void

## Aturan bisnis
- Nomor tiket: `${code}-${seq 3 digit}`, seq per jenis antrian dari pweb.counters. resetQueue(): kosongkan tiket + counters ke 0.
- Urutan getWaiting: skipCount asc, lalu prioritas (vip < disabilitas < lansia < normal), lalu waktu antri (requeuedAt ?? createdAt) asc.
- callNext: tiket "called" saat ini -> "done", lalu panggil tiket pertama dari getWaiting. Jika kosong, kembalikan null.
- finishCurrent: "called" -> "done", TANPA memanggil berikutnya.
- skipCurrent: tiket "called" kembali "waiting", skipCount+1, requeuedAt=now (jadi ke akhir antrian, tampil badge "Dilewati"). Jika skipCount sudah 2 sebelum dilewati -> status "expired".
- addQueueType: kode 1 huruf kapital A-Z; tolak duplikasi kode ATAU nama (case-insensitive). Jenis nonaktif tidak bisa dipilih saat ambil tiket (issueTicket menolak).
- Jenis antrian baru muncul di ambil-antrian dan layar otomatis lewat polling 2-3 detik (tanpa reload).

## Akses halaman
login, layar, ambil-antrian : publik.
index.html, operator.html   : wajib login DAN role admin/moderator. Selain itu redirect ke login.html.
Setelah login: admin/moderator -> index.html ; user biasa -> ambil-antrian.html.
Navbar admin/operator: nama (firstName), role, tombol Logout (hapus sesi, ke login.html), link antar halaman.

## Autentikasi
POST https://dummyjson.com/auth/login {username, password} -> accessToken.
Role TIDAK dijamin ada di respons login. Cek respons asli di devtools; jika tidak ada, ambil dari
GET https://dummyjson.com/auth/me (header Authorization: Bearer <token>) lalu baca field `role`.
Bungkus fetch dengan try/catch: kredensial salah dan jaringan gagal tampil sebagai pesan visual. Loading state di tombol.

## Desain (referensi TranquilQ, diterapkan ke layout dashboard dari soal)
Token di style.css (milik C), pakai CSS variables:
--bg:#FFFFFF; --surface:#F4F4F2; --ink:#111111; --muted:#8A8A86;
--lime:#E6F7B2; --lime-strong:#D2EC84; --danger:#D64545; --radius-card:24px; --radius-pill:999px;
Font: "Helvetica Neue", Helvetica, Arial, sans-serif. Heading weight 400, satu kata kunci memakai <em> (italic) seperti "Where *Coziness* Meets Luxury".
Komponen: kartu rounded besar di atas --surface, tombol pill hijau lime dengan lingkaran panah di ujung,
tombol outline pill (border 1px --ink), badge kecil rounded, input pill abu muda, banyak whitespace.
Layar: nomor panggilan sangat besar, kartu per jenis antrian, badge "DIPANGGIL", jumlah menunggu di bawah.
Class dasar: .btn .btn-primary .btn-outline .btn-danger .card .badge .input .navbar .grid