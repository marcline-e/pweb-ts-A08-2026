// Autentikasi via dummyjson.
// Respons asli POST /auth/login (dicek 2026-10-09): accessToken, refreshToken, id, username,
// email, firstName, lastName, gender, image -> TIDAK ada `role`.
// Karena itu role diambil dari GET /auth/me memakai token tadi.
import { KEYS, isRecord, isRole, isSession, load, save } from "./storage.js";
const API = "https://dummyjson.com";
// Ambil pesan error dari body dummyjson ({ message: "Invalid credentials" }).
function messageFrom(body, fallback) {
    return isRecord(body) && typeof body.message === "string" ? body.message : fallback;
}
// GET /auth/me -> field role. Role tak dikenal/tidak ada dianggap "user" (paling terbatas).
async function fetchRole(token) {
    const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok)
        throw new Error(messageFrom(body, "Gagal mengambil data pengguna."));
    return isRecord(body) && isRole(body.role) ? body.role : "user";
}
export async function login(username, password) {
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const body = await res.json();
        // Kredensial salah -> status 400 dengan { message }.
        if (!res.ok)
            return { ok: false, error: messageFrom(body, `Login gagal (${res.status}).`) };
        if (!isRecord(body) || typeof body.accessToken !== "string") {
            return { ok: false, error: "Respons server tidak dikenali." };
        }
        const token = body.accessToken;
        // Pakai role dari respons login bila suatu saat tersedia; jika tidak, ambil dari /auth/me.
        const role = isRole(body.role) ? body.role : await fetchRole(token);
        const firstName = typeof body.firstName === "string" ? body.firstName : username;
        const session = { token, role, firstName };
        save(KEYS.session, session);
        return { ok: true, value: session };
    }
    catch (err) {
        // fetch melempar TypeError bila jaringan putus / server tak terjangkau.
        if (err instanceof TypeError) {
            return { ok: false, error: "Tidak dapat terhubung ke server. Periksa koneksi internet." };
        }
        // SyntaxError (body bukan JSON) atau error dari fetchRole.
        return { ok: false, error: err instanceof Error ? err.message : "Terjadi kesalahan saat login." };
    }
}
function isSessionOrNull(v) {
    return v === null || isSession(v);
}
export function getSession() {
    return load(KEYS.session, isSessionOrNull, null);
}
// Guard halaman. Tanpa `allowed`: cukup sudah login. Dengan `allowed`: role harus termasuk.
// Bila tidak sah: redirect ke login.html lalu throw supaya sisa script halaman berhenti.
export function requireAuth(allowed) {
    const session = getSession();
    if (session && (!allowed || allowed.includes(session.role)))
        return session;
    location.replace("login.html");
    throw new Error("Tidak berhak mengakses halaman ini, dialihkan ke login.html");
}
// Hapus sesi lalu kembali ke halaman login.
export function logout() {
    localStorage.removeItem(KEYS.session);
    location.href = "login.html";
}
// Admin dan moderator sama-sama staf.
export function isStaff(role) {
    return role === "admin" || role === "moderator";
}
