// Logika tiket antrian. Semua state ada di localStorage (pweb.tickets & pweb.counters),
// jadi tiap fungsi: baca dari storage -> ubah -> simpan lagi. Dengan begitu semua tab
// (ambil-antrian, operator, layar) melihat data yang sama.

import type { Priority, Result, Ticket } from "./types.js";
import { KEYS, loadCounters, loadQueueTypes, loadTickets, save } from "./storage.js";

// Angka kecil = didahulukan.
const PRIORITY_RANK: Record<Priority, number> = {
  vip: 0,
  disabilitas: 1,
  lansia: 2,
  normal: 3,
};

// Batas lewati: tiket yang sudah 2x dilewati, bila dilewati lagi menjadi expired.
const MAX_SKIP = 2;

// crypto.randomUUID hanya tersedia di secure context (https/localhost); sediakan cadangan.
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// "A" + 7 -> "A-007"
function formatNumber(code: string, seq: number): string {
  return `${code}-${String(seq).padStart(3, "0")}`;
}

// Urutan antrian: 1) skipCount kecil dulu, 2) prioritas, 3) waktu masuk antrian paling awal.
// requeuedAt dipakai bila tiket pernah dilewati, sehingga ia pindah ke belakang.
function compareWaiting(a: Ticket, b: Ticket): number {
  if (a.skipCount !== b.skipCount) return a.skipCount - b.skipCount;
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;
  return (a.requeuedAt ?? a.createdAt) - (b.requeuedAt ?? b.createdAt);
}

function waitingOf(tickets: Ticket[], queueTypeId: string): Ticket[] {
  return tickets
    .filter((t) => t.queueTypeId === queueTypeId && t.status === "waiting")
    .sort(compareWaiting);
}

export function issueTicket(queueTypeId: string, priority: Priority): Result<Ticket> {
  const queueType = loadQueueTypes().find((q) => q.id === queueTypeId);
  if (!queueType) return { ok: false, error: "Jenis antrian tidak ditemukan." };
  if (!queueType.active) return { ok: false, error: "Jenis antrian sedang tidak aktif." };

  // Nomor urut per jenis antrian, disimpan di pweb.counters.
  const counters = loadCounters();
  const seq = (counters[queueTypeId] ?? 0) + 1;
  counters[queueTypeId] = seq;
  save(KEYS.counters, counters);

  const ticket: Ticket = {
    id: newId(),
    queueTypeId,
    code: queueType.code,
    seq,
    number: formatNumber(queueType.code, seq),
    priority,
    status: "waiting",
    createdAt: Date.now(),
    skipCount: 0,
  };
  const tickets = loadTickets();
  tickets.push(ticket);
  save(KEYS.tickets, tickets);
  return { ok: true, value: ticket };
}

export function getTickets(): Ticket[] {
  return loadTickets();
}

export function getCalled(queueTypeId: string): Ticket | null {
  return loadTickets().find((t) => t.queueTypeId === queueTypeId && t.status === "called") ?? null;
}

// Hasil sudah terurut sesuai aturan bisnis (lihat compareWaiting).
export function getWaiting(queueTypeId: string): Ticket[] {
  return waitingOf(loadTickets(), queueTypeId);
}

// Tiket "called" saat ini -> "done", lalu panggil tiket teratas. Antrian kosong -> null.
export function callNext(queueTypeId: string): Ticket | null {
  const tickets = loadTickets();
  for (const t of tickets) {
    if (t.queueTypeId === queueTypeId && t.status === "called") t.status = "done";
  }
  // Objek di `next` adalah objek yang sama di dalam `tickets`, jadi mengubahnya ikut tersimpan.
  const next = waitingOf(tickets, queueTypeId)[0] ?? null;
  if (next) {
    next.status = "called";
    next.calledAt = Date.now();
  }
  save(KEYS.tickets, tickets);
  return next;
}

// "called" -> "done" tanpa memanggil tiket berikutnya.
export function finishCurrent(queueTypeId: string): void {
  const tickets = loadTickets();
  for (const t of tickets) {
    if (t.queueTypeId === queueTypeId && t.status === "called") t.status = "done";
  }
  save(KEYS.tickets, tickets);
}

// Tiket "called" kembali ke antrian (ke belakang). Sudah 2x dilewati -> expired.
export function skipCurrent(queueTypeId: string): void {
  const tickets = loadTickets();
  const now = Date.now();
  for (const t of tickets) {
    if (t.queueTypeId !== queueTypeId || t.status !== "called") continue;
    if (t.skipCount >= MAX_SKIP) {
      t.status = "expired";
    } else {
      t.status = "waiting";
      t.skipCount += 1;
      t.requeuedAt = now;
      delete t.calledAt; // sedang tidak dipanggil lagi
    }
  }
  save(KEYS.tickets, tickets);
}

// Kosongkan semua tiket dan set counter setiap jenis antrian ke 0 (nomor mulai dari 001 lagi).
export function resetQueue(): void {
  const counters: Record<string, number> = {};
  for (const q of loadQueueTypes()) counters[q.id] = 0;
  save(KEYS.tickets, []);
  save(KEYS.counters, counters);
}
