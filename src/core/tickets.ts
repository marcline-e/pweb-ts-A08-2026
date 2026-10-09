// Logika tiket antrian.
// GATE 0: stub. Signature final, isi menyusul di langkah 3.

import type { Priority, Result, Ticket } from "./types.js";

export function issueTicket(queueTypeId: string, priority: Priority): Result<Ticket> {
  void queueTypeId;
  void priority;
  return { ok: false, error: "issueTicket belum diimplementasikan" };
}

export function getTickets(): Ticket[] {
  return [];
}

export function getCalled(queueTypeId: string): Ticket | null {
  void queueTypeId;
  return null;
}

// Hasil sudah terurut sesuai aturan bisnis (lihat AGENTS.md).
export function getWaiting(queueTypeId: string): Ticket[] {
  void queueTypeId;
  return [];
}

export function callNext(queueTypeId: string): Ticket | null {
  void queueTypeId;
  return null;
}

export function finishCurrent(queueTypeId: string): void {
  void queueTypeId;
}

export function skipCurrent(queueTypeId: string): void {
  void queueTypeId;
}

export function resetQueue(): void {
  // diisi di langkah 3
}
