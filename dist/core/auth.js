// Autentikasi via dummyjson.
// GATE 0: stub. Signature final, isi menyusul di langkah 3.
export async function login(username, password) {
    void username;
    void password;
    return { ok: false, error: "login belum diimplementasikan" };
}
export function getSession() {
    return null;
}
// STUB: sementara selalu mengembalikan sesi admin palsu supaya halaman lain
// bisa dikembangkan. Versi final akan redirect ke login.html bila tidak sah.
export function requireAuth(allowed) {
    void allowed;
    return { token: "", role: "admin", firstName: "Dev" };
}
export function logout() {
    // diisi di langkah 3
}
// Admin dan moderator sama-sama staf.
export function isStaff(role) {
    return role === "admin" || role === "moderator";
}
