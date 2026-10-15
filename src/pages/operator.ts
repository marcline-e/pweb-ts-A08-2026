// Halaman operator: satu kartu per jenis antrian aktif, berisi nomor yang sedang dipanggil,
// tiket berikutnya, jumlah menunggu, dan tombol Panggil Berikutnya / Lewati / Selesai.
// Data dibaca ulang dari localStorage tiap 2 detik supaya tiket baru dari ambil-antrian ikut muncul.

import type { Priority, QueueType, Ticket } from "../core/types.js";
import { logout, requireAuth } from "../core/auth.js";
import { speakTicket } from "../core/audio.js";
import { loadQueueTypes } from "../core/storage.js";
import { callNext, finishCurrent, getCalled, getWaiting, skipCurrent } from "../core/tickets.js";

// Guard: hanya admin/moderator. Selain itu requireAuth redirect ke login.html dan
// melempar error, sehingga kode di bawah tidak dijalankan.
const session = requireAuth(["admin", "moderator"]);

const POLL_MS = 2000;
const MAX_SKIP = 2; // sama dengan aturan di tickets.ts: dilewati saat skipCount 2 -> expired

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: "Normal",
  lansia: "Lansia",
  disabilitas: "Disabilitas",
  vip: "VIP",
};

type Action = "next" | "skip" | "finish";

function isAction(v: unknown): v is Action {
  return v === "next" || v === "skip" || v === "finish";
}

function byId<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`Elemen #${id} tidak ditemukan`);
  return el;
}

// Buat elemen dengan class & teks. Teks selalu lewat textContent (bukan innerHTML)
// supaya nama jenis antrian buatan admin tidak bisa menyisipkan HTML/script.
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// ---------- Navbar ----------

byId("user-name", HTMLSpanElement).textContent = session.firstName;
byId("user-role", HTMLSpanElement).textContent = session.role;
byId("logout-btn", HTMLButtonElement).addEventListener("click", logout);

// ---------- Kartu antrian ----------

const grid = byId("operator-grid", HTMLElement);
const emptyMsg = byId("operator-empty", HTMLParagraphElement);

// Ringkasan state satu jenis antrian, dipakai untuk render & untuk deteksi perubahan.
interface QueueView {
  queue: QueueType;
  called: Ticket | null;
  next: Ticket | null;
  waitingCount: number;
}

function buildViews(): QueueView[] {
  return loadQueueTypes()
    .filter((q) => q.active)
    .map((queue) => {
      const waiting = getWaiting(queue.id);
      return {
        queue,
        called: getCalled(queue.id),
        next: waiting[0] ?? null,
        waitingCount: waiting.length,
      };
    });
}

// Badge prioritas (kecuali normal) + badge "Dilewati" bila tiket pernah dilewati.
function ticketBadges(ticket: Ticket): HTMLElement[] {
  const badges: HTMLElement[] = [];
  if (ticket.priority !== "normal") {
    badges.push(el("span", `badge badge-${ticket.priority}`, PRIORITY_LABEL[ticket.priority]));
  }
  if (ticket.skipCount > 0) {
    badges.push(el("span", "badge badge-skipped", `Dilewati ${ticket.skipCount}x`));
  }
  return badges;
}

function actionButton(label: string, className: string, action: Action, queueId: string, disabled: boolean): HTMLButtonElement {
  const btn = el("button", `btn ${className}`, label);
  btn.type = "button";
  btn.dataset.action = action;
  btn.dataset.queue = queueId;
  btn.disabled = disabled;
  return btn;
}

function renderCard(view: QueueView): HTMLElement {
  const { queue, called, next, waitingCount } = view;
  const card = el("article", "card queue-card");

  const header = el("header", "queue-card-header");
  header.append(el("h2", "queue-name", queue.name), el("span", "badge", queue.code));

  // Nomor yang sedang dipanggil (besar).
  const current = el("div", "queue-current");
  current.append(el("p", "queue-label muted", "Sedang dipanggil"));
  current.append(el("p", "queue-number", called ? called.number : "—"));
  if (called) current.append(...ticketBadges(called));

  // Tiket berikutnya + prioritas.
  const upcoming = el("div", "queue-next");
  upcoming.append(el("p", "queue-label muted", "Berikutnya"));
  if (next) {
    upcoming.append(el("p", "queue-next-number", next.number));
    upcoming.append(el("span", `badge badge-${next.priority}`, PRIORITY_LABEL[next.priority]));
    if (next.skipCount > 0) upcoming.append(el("span", "badge badge-skipped", "Dilewati"));
  } else {
    upcoming.append(el("p", "queue-next-number muted", "Tidak ada"));
  }

  const count = el("p", "queue-waiting", `${waitingCount} menunggu`);

  // Aturan disabled:
  // - Panggil Berikutnya: hanya bila ada yang menunggu.
  // - Lewati & Selesai : hanya bila ada tiket yang sedang dipanggil.
  const actions = el("div", "queue-actions");
  const willExpire = called !== null && called.skipCount >= MAX_SKIP;
  const skipBtn = actionButton(willExpire ? "Lewati (hangus)" : "Lewati", "btn-outline", "skip", queue.id, !called);
  if (willExpire) skipBtn.title = "Tiket sudah 2x dilewati; dilewati lagi akan hangus (expired).";
  actions.append(
    actionButton("Panggil Berikutnya", "btn-primary", "next", queue.id, waitingCount === 0),
    skipBtn,
    actionButton("Selesai", "btn-outline", "finish", queue.id, !called),
  );

  card.append(header, current, upcoming, count, actions);
  return card;
}

// Render hanya bila data berubah: polling tiap 2 detik tidak merusak fokus/hover tombol.
let lastSnapshot = "";

function render(force = false): void {
  const views = buildViews();
  const snapshot = JSON.stringify(views);
  if (!force && snapshot === lastSnapshot) return;
  lastSnapshot = snapshot;

  grid.replaceChildren(...views.map(renderCard));
  emptyMsg.hidden = views.length > 0;
}

// Event delegation: satu listener di grid untuk semua tombol, karena kartu dibuat ulang saat render.
grid.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const btn = target.closest("button[data-action]");
  if (!(btn instanceof HTMLButtonElement) || btn.disabled) return;

  const action = btn.dataset.action;
  const queueId = btn.dataset.queue;
  if (!isAction(action) || !queueId) return;

  btn.disabled = true; // cegah klik ganda sebelum render ulang
  if (action === "next") {
    const called = callNext(queueId);
    if (called) {
      const queue = loadQueueTypes().find((item) => item.id === queueId);
      speakTicket(called, queue?.name ?? "loket");
    }
  }
  else if (action === "skip") skipCurrent(queueId);
  else finishCurrent(queueId);
  render(true);
});

render(true);
setInterval(render, POLL_MS);
// Perubahan dari tab lain (mis. ambil-antrian) langsung terlihat tanpa menunggu polling.
window.addEventListener("storage", () => render());
