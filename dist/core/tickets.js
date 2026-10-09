// Logika tiket antrian.
// GATE 0: stub. Signature final, isi menyusul di langkah 3.
export function issueTicket(queueTypeId, priority) {
    void queueTypeId;
    void priority;
    return { ok: false, error: "issueTicket belum diimplementasikan" };
}
export function getTickets() {
    return [];
}
export function getCalled(queueTypeId) {
    void queueTypeId;
    return null;
}
// Hasil sudah terurut sesuai aturan bisnis (lihat AGENTS.md).
export function getWaiting(queueTypeId) {
    void queueTypeId;
    return [];
}
export function callNext(queueTypeId) {
    void queueTypeId;
    return null;
}
export function finishCurrent(queueTypeId) {
    void queueTypeId;
}
export function skipCurrent(queueTypeId) {
    void queueTypeId;
}
export function resetQueue() {
    // diisi di langkah 3
}
