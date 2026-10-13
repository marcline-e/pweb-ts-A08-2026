import type { Ticket } from "./types.js";

export function isSpeechSupported(): boolean {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function spokenNumber(number: string): string {
  return Array.from(number)
    .filter((character) => character !== "-")
    .join(" ");
}

export function speakTicket(ticket: Ticket, queueName: string): void {
  if (!isSpeechSupported()) return;
  const utterance = new SpeechSynthesisUtterance(
    `Nomor ${spokenNumber(ticket.number)}, silakan menuju ${queueName}`,
  );
  utterance.lang = "id-ID";
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
