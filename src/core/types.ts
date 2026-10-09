// Kontrak data bersama (AGENTS.md). Jangan diubah tanpa kesepakatan semua orang.

export type Role = "admin" | "moderator" | "user";
export type Priority = "normal" | "lansia" | "disabilitas" | "vip";
export type TicketStatus = "waiting" | "called" | "done" | "expired";

export interface Session {
  token: string;
  role: Role;
  firstName: string;
}

export interface QueueType {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Ticket {
  id: string;
  queueTypeId: string;
  code: string;
  seq: number;
  number: string; // "A-001"
  priority: Priority;
  status: TicketStatus;
  createdAt: number;
  requeuedAt?: number;
  calledAt?: number;
  skipCount: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
