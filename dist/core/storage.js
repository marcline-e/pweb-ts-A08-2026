// Akses localStorage dengan validasi runtime.
// GATE 0: load/save sudah bisa dipakai; validator & seed menyusul di langkah 3.
export const KEYS = {
    session: "pweb.session",
    queueTypes: "pweb.queueTypes",
    tickets: "pweb.tickets",
    counters: "pweb.counters",
};
// Baca key, parse sebagai unknown, lalu validasi. Gagal/invalid -> fallback.
export function load(key, validate, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null)
        return fallback;
    try {
        const parsed = JSON.parse(raw);
        return validate(parsed) ? parsed : fallback;
    }
    catch {
        return fallback;
    }
}
export function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
