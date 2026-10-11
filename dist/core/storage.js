// Akses localStorage dengan validasi runtime.
// Semua data yang dibaca dianggap `unknown` lalu dicek bentuknya oleh validator
// di bawah, karena isi localStorage bisa saja rusak atau diubah manual lewat devtools.
export const KEYS = {
    session: "pweb.session",
    queueTypes: "pweb.queueTypes",
    tickets: "pweb.tickets",
    counters: "pweb.counters",
};
// Baca key, parse sebagai unknown, lalu validasi. Tidak ada / JSON rusak / bentuk salah -> fallback.
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
// ---------- Validator (type guard) ----------
// Objek biasa (bukan null, bukan array) sehingga field-nya bisa dibaca.
export function isRecord(v) {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}
// Pakai .some(x => x === v) karena .includes() tidak menerima argumen bertipe unknown.
const ROLES = ["admin", "moderator", "user"];
const PRIORITIES = ["normal", "lansia", "disabilitas", "vip"];
const STATUSES = ["waiting", "called", "done", "expired"];
export function isRole(v) {
    return ROLES.some((r) => r === v);
}
export function isPriority(v) {
    return PRIORITIES.some((p) => p === v);
}
export function isTicketStatus(v) {
    return STATUSES.some((s) => s === v);
}
// Field opsional: boleh tidak ada, tapi kalau ada harus number.
function isOptionalNumber(v) {
    return v === undefined || typeof v === "number";
}
export function isSession(v) {
    return (isRecord(v) &&
        typeof v.token === "string" &&
        isRole(v.role) &&
        typeof v.firstName === "string");
}
export function isQueueType(v) {
    return (isRecord(v) &&
        typeof v.id === "string" &&
        typeof v.code === "string" &&
        typeof v.name === "string" &&
        typeof v.active === "boolean");
}
export function isTicket(v) {
    return (isRecord(v) &&
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
        typeof v.skipCount === "number");
}
export function isQueueTypeArray(v) {
    return Array.isArray(v) && v.every(isQueueType);
}
export function isTicketArray(v) {
    return Array.isArray(v) && v.every(isTicket);
}
// pweb.counters: Record<queueTypeId, number>
export function isCounters(v) {
    return isRecord(v) && Object.values(v).every((n) => typeof n === "number");
}
// ---------- Seed & helper baca/tulis ----------
// Id tetap (bukan acak) supaya semua tab/halaman merujuk jenis antrian yang sama.
export const SEED_QUEUE_TYPES = [
    { id: "umum-1", code: "A", name: "UMUM-1", active: true },
    { id: "umum-2", code: "B", name: "UMUM-2", active: true },
    { id: "umum-3", code: "C", name: "UMUM-3", active: true },
    { id: "gigi", code: "G", name: "GIGI", active: true },
    { id: "farmasi", code: "F", name: "FARMASI", active: true },
    { id: "psikolog", code: "P", name: "PSIKOLOG", active: true },
];
// Salinan baru tiap dipanggil supaya konstanta seed tidak ikut termutasi.
function seedCopy() {
    return SEED_QUEUE_TYPES.map((q) => ({ ...q }));
}
// Seed hanya jika key BELUM ADA. Array kosong dianggap sah (admin memang menghapus
// semua jenis), jadi tidak di-seed ulang. Data rusak -> diganti seed.
export function loadQueueTypes() {
    if (localStorage.getItem(KEYS.queueTypes) === null) {
        const seed = seedCopy();
        save(KEYS.queueTypes, seed);
        return seed;
    }
    return load(KEYS.queueTypes, isQueueTypeArray, seedCopy());
}
export function loadTickets() {
    return load(KEYS.tickets, isTicketArray, []);
}
export function loadCounters() {
    return load(KEYS.counters, isCounters, {});
}
