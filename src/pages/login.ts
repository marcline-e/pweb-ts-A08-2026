// Halaman login: kirim kredensial ke dummyjson lewat auth.login(), tampilkan loading
// & error, lalu arahkan sesuai role.

import type { Role } from "../core/types.js";
import { getSession, isStaff, login } from "../core/auth.js";

// Ambil elemen berdasarkan id sekaligus cek tipenya (pengganti `as HTMLInputElement`).
function byId<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`Elemen #${id} tidak ditemukan`);
  return el;
}

// admin/moderator -> dashboard admin, user biasa -> ambil antrian.
function homeFor(role: Role): string {
  return isStaff(role) ? "index.html" : "ambil-antrian.html";
}

// Pesan server (bahasa Inggris) diterjemahkan agar ramah pengguna.
function friendlyError(message: string): string {
  return message === "Invalid credentials" ? "Username atau password salah." : message;
}

// Sudah login? Langsung lempar ke halaman tujuan, tidak perlu login lagi.
const existing = getSession();
if (existing) location.replace(homeFor(existing.role));

const form = byId("login-form", HTMLFormElement);
const usernameInput = byId("username", HTMLInputElement);
const passwordInput = byId("password", HTMLInputElement);
const errorBox = byId("login-error", HTMLParagraphElement);
const submitBtn = byId("login-submit", HTMLButtonElement);
const submitLabel = submitBtn.querySelector(".btn-label");

function showError(message: string): void {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError(): void {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

// Loading state: tombol & input dikunci supaya tidak terjadi submit ganda.
function setLoading(loading: boolean): void {
  submitBtn.disabled = loading;
  usernameInput.disabled = loading;
  passwordInput.disabled = loading;
  submitBtn.setAttribute("aria-busy", String(loading));
  if (submitLabel) submitLabel.textContent = loading ? "Memproses…" : "Masuk";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // cegah reload halaman bawaan form
  clearError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) {
    showError("Username dan password wajib diisi.");
    return;
  }

  setLoading(true);
  // login() tidak pernah throw: semua kegagalan (kredensial/jaringan) dikembalikan sebagai Result.
  const result = await login(username, password);
  if (!result.ok) {
    setLoading(false);
    showError(friendlyError(result.error));
    passwordInput.select();
    return;
  }
  location.replace(homeFor(result.value.role));
});

// Pesan error hilang begitu pengguna mulai mengetik ulang.
usernameInput.addEventListener("input", clearError);
passwordInput.addEventListener("input", clearError);
