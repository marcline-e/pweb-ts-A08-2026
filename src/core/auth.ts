// Autentikasi via dummyjson.
// GATE 0: stub. Signature final, isi menyusul di langkah 3.

import type { Result, Role, Session } from "./types.js";

export async function login(username: string, password: string): Promise<Result<Session>> {
  void username;
  void password;
  return { ok: false, error: "login belum diimplementasikan" };
}

export function getSession(): Session | null {
  return null;
}

// STUB: sementara selalu mengembalikan sesi admin palsu supaya halaman lain
// bisa dikembangkan. Versi final akan redirect ke login.html bila tidak sah.
export function requireAuth(allowed?: Role[]): Session {
  void allowed;
  return { token: "", role: "admin", firstName: "Dev" };
}

export function logout(): void {
  // diisi di langkah 3
}

// Admin dan moderator sama-sama staf.
export function isStaff(role: Role): boolean {
  return role === "admin" || role === "moderator";
}
