import { KEYS, loadQueueTypes, loadTickets, save, } from "./storage.js";
// Mengambil seluruh jenis antrean.
export function getQueueTypes() {
    return loadQueueTypes();
}
// Menambahkan jenis antrean baru setelah validasi.
export function addQueueType(code, name) {
    const normalizedCode = code.trim();
    const normalizedName = name.trim();
    // Kode harus tepat satu huruf kapital A-Z.
    if (!/^[A-Z]$/.test(normalizedCode)) {
        return {
            ok: false,
            error: "Kode harus berupa satu huruf kapital A-Z.",
        };
    }
    if (normalizedName.length === 0) {
        return {
            ok: false,
            error: "Nama jenis antrean tidak boleh kosong.",
        };
    }
    const queueTypes = loadQueueTypes();
    // Kode dan nama tidak boleh duplikat, tanpa membedakan kapital.
    const duplicate = queueTypes.some((queueType) => queueType.code.toUpperCase() === normalizedCode.toUpperCase() ||
        queueType.name.toLowerCase() === normalizedName.toLowerCase());
    if (duplicate) {
        return {
            ok: false,
            error: "Kode atau nama jenis antrean sudah digunakan.",
        };
    }
    const queueType = {
        id: crypto.randomUUID(),
        code: normalizedCode,
        name: normalizedName,
        active: true,
    };
    queueTypes.push(queueType);
    save(KEYS.queueTypes, queueTypes);
    return { ok: true, value: queueType };
}
// Membalik status aktif/nonaktif berdasarkan ID.
export function toggleQueueType(id) {
    const queueTypes = loadQueueTypes();
    const queueType = queueTypes.find((item) => item.id === id);
    if (!queueType)
        return;
    queueType.active = !queueType.active;
    save(KEYS.queueTypes, queueTypes);
}
// Menghapus jenis antrean sekaligus tiket-tiket yang terkait.
export function deleteQueueType(id) {
    const queueTypes = loadQueueTypes();
    const remainingQueueTypes = queueTypes.filter((queueType) => queueType.id !== id);
    if (remainingQueueTypes.length === queueTypes.length)
        return;
    const remainingTickets = loadTickets().filter((ticket) => ticket.queueTypeId !== id);
    save(KEYS.queueTypes, remainingQueueTypes);
    save(KEYS.tickets, remainingTickets);
}
