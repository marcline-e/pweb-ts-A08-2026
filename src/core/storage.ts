// Akses localStorage dengan validasi runtime.
// Semua data yang dibaca dianggap `unknown` lalu dicek bentuknya oleh validator
// di bawah, karena isi localStorage bisa saja rusak atau diubah manual lewat devtools.

import type { Priority, QueueType, Role, Session, Ticket, TicketStatus } from "./types.js";

export const KEYS = {
  session: "pweb.session",
  queueTypes: "pweb.queueTypes",
  tickets: "pweb.tickets",
  counters: "pweb.counters",
} as const;

// Baca key, parse sebagai unknown, lalu validasi. Tidak ada / JSON rusak / bentuk salah -> fallback.
export function load<T>(key: string, validate: (v: unknown) => v is T, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Validator (type guard) ----------

// Objek biasa (bukan null, bukan array) sehingga field-nya bisa dibaca.
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Pakai .some(x => x === v) karena .includes() tidak menerima argumen bertipe unknown.
const ROLES: readonly Role[] = ["admin", "moderator", "user"];
const PRIORITIES: readonly Priority[] = ["normal", "lansia", "disabilitas", "vip"];
const STATUSES: readonly TicketStatus[] = ["waiting", "called", "done", "expired"];

export function isRole(v: unknown): v is Role {
  return ROLES.some((r) => r === v);
}

export function isPriority(v: unknown): v is Priority {
  return PRIORITIES.some((p) => p === v);
}

export function isTicketStatus(v: unknown): v is TicketStatus {
  return STATUSES.some((s) => s === v);
}

// Field opsional: boleh tidak ada, tapi kalau ada harus number.
function isOptionalNumber(v: unknown): boolean {
  return v === undefined || typeof v === "number";
}

export function isSession(v: unknown): v is Session {
  return (
    isRecord(v) &&
    typeof v.token === "string" &&
    isRole(v.role) &&
    typeof v.firstName === "string"
  );
}

export function isQueueType(v: unknown): v is QueueType {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.code === "string" &&
    typeof v.name === "string" &&
    typeof v.active === "boolean"
  );
}

export function isTicket(v: unknown): v is Ticket {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.queueTypeId === "string" &&
    typeof v.code === "string" &&
    typeof v.seq === "number" &&
    typeof v.number === "string" &&
    isPriority(v.priority) &&
    isTicketStatus(v.status) &&
    typeof v.createdAt === "number" &&
    isOptionalNumber(v.requeuedAt) &&
    isOptionalNumber(v.calledAt) &&
    typeof v.skipCount === "number"
  );
}

export function isQueueTypeArray(v: unknown): v is QueueType[] {
  return Array.isArray(v) && v.every(isQueueType);
}

export function isTicketArray(v: unknown): v is Ticket[] {
  return Array.isArray(v) && v.every(isTicket);
}

// pweb.counters: Record<queueTypeId, number>
export function isCounters(v: unknown): v is Record<string, number> {
  return isRecord(v) && Object.values(v).every((n) => typeof n === "number");
}

// ---------- Seed & helper baca/tulis ----------

// Id tetap (bukan acak) supaya semua tab/halaman merujuk jenis antrian yang sama.
export const SEED_QUEUE_TYPES: readonly QueueType[] = [
  { id: "umum-1", code: "A", name: "UMUM-1", active: true },
  { id: "umum-2", code: "B", name: "UMUM-2", active: true },
  { id: "umum-3", code: "C", name: "UMUM-3", active: true },
  { id: "gigi", code: "G", name: "GIGI", active: true },
  { id: "farmasi", code: "F", name: "FARMASI", active: true },
  { id: "psikolog", code: "P", name: "PSIKOLOG", active: true },
];

// Salinan baru tiap dipanggil supaya konstanta seed tidak ikut termutasi.
function seedCopy(): QueueType[] {
  return SEED_QUEUE_TYPES.map((q) => ({ ...q }));
}

// Seed hanya jika key BELUM ADA. Array kosong dianggap sah (admin memang menghapus
// semua jenis), jadi tidak di-seed ulang. Data rusak -> diganti seed.
export function loadQueueTypes(): QueueType[] {
  if (localStorage.getItem(KEYS.queueTypes) === null) {
    const seed = seedCopy();
    save(KEYS.queueTypes, seed);
    return seed;
  }
  return load(KEYS.queueTypes, isQueueTypeArray, seedCopy());
}

export function loadTickets(): Ticket[] {
  return load(KEYS.tickets, isTicketArray, []);
}

export function loadCounters(): Record<string, number> {
  return load(KEYS.counters, isCounters, {});
}
