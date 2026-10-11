// Autentikasi via dummyjson.
// Respons asli POST /auth/login (dicek 2026-10-09): accessToken, refreshToken, id, username,
// email, firstName, lastName, gender, image -> TIDAK ada `role`.
// Karena itu role diambil dari GET /auth/me memakai token tadi.

import type { Result, Role, Session } from "./types.js";
import { KEYS, isRecord, isRole, isSession, load, save } from "./storage.js";

const API = "https://dummyjson.com";

// Ambil pesan error dari body dummyjson ({ message: "Invalid credentials" }).
function messageFrom(body: unknown, fallback: string): string {
  return isRecord(body) && typeof body.message === "string" ? body.message : fallback;
}

// GET /auth/me -> field role. Role tak dikenal/tidak ada dianggap "user" (paling terbatas).
async function fetchRole(token: string): Promise<Role> {
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body: unknown = await res.json();
  if (!res.ok) throw new Error(messageFrom(body, "Gagal mengambil data pengguna."));
  return isRecord(body) && isRole(body.role) ? body.role : "user";
}

export async function login(username: string, password: string): Promise<Result<Session>> {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body: unknown = await res.json();

    // Kredensial salah -> status 400 dengan { message }.
    if (!res.ok) return { ok: false, error: messageFrom(body, `Login gagal (${res.status}).`) };
    if (!isRecord(body) || typeof body.accessToken !== "string") {
      return { ok: false, error: "Respons server tidak dikenali." };
    }

    const token = body.accessToken;
    // Pakai role dari respons login bila suatu saat tersedia; jika tidak, ambil dari /auth/me.
    const role: Role = isRole(body.role) ? body.role : await fetchRole(token);
    const firstName = typeof body.firstName === "string" ? body.firstName : username;

    const session: Session = { token, role, firstName };
    save(KEYS.session, session);
    return { ok: true, value: session };
  } catch (err) {
    // fetch melempar TypeError bila jaringan putus / server tak terjangkau.
    if (err instanceof TypeError) {
      return { ok: false, error: "Tidak dapat terhubung ke server. Periksa koneksi internet." };
    }
    // SyntaxError (body bukan JSON) atau error dari fetchRole.
    return { ok: false, error: err instanceof Error ? err.message : "Terjadi kesalahan saat login." };
  }
}

function isSessionOrNull(v: unknown): v is Session | null {
  return v === null || isSession(v);
}

export function getSession(): Session | null {
  return load(KEYS.session, isSessionOrNull, null);
}

// Guard halaman. Tanpa `allowed`: cukup sudah login. Dengan `allowed`: role harus termasuk.
// Bila tidak sah: redirect ke login.html lalu throw supaya sisa script halaman berhenti.
export function requireAuth(allowed?: Role[]): Session {
  const session = getSession();
  if (session && (!allowed || allowed.includes(session.role))) return session;
  location.replace("login.html");
  throw new Error("Tidak berhak mengakses halaman ini, dialihkan ke login.html");
}

// Hapus sesi lalu kembali ke halaman login.
export function logout(): void {
  localStorage.removeItem(KEYS.session);
  location.href = "login.html";
}

// Admin dan moderator sama-sama staf.
export function isStaff(role: Role): boolean {
  return role === "admin" || role === "moderator";
}
