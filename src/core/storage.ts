// Akses localStorage dengan validasi runtime.
// GATE 0: load/save sudah bisa dipakai; validator & seed menyusul di langkah 3.

export const KEYS = {
  session: "pweb.session",
  queueTypes: "pweb.queueTypes",
  tickets: "pweb.tickets",
  counters: "pweb.counters",
} as const;

// Baca key, parse sebagai unknown, lalu validasi. Gagal/invalid -> fallback.
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
