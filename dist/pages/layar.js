import { isSpeechSupported, speakTicket, stopSpeech } from "../core/audio.js";
import { loadQueueTypes } from "../core/storage.js";
import { getCalled, getWaiting } from "../core/tickets.js";
const POLL_MS = 2500;
function byId(id, type) {
    const element = document.getElementById(id);
    if (!(element instanceof type))
        throw new Error(`Elemen #${id} tidak ditemukan`);
    return element;
}
function el(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text)
        node.textContent = text;
    return node;
}
function buildViews() {
    return loadQueueTypes()
        .filter((queue) => queue.active)
        .map((queue) => ({
        queue,
        called: getCalled(queue.id),
        waitingCount: getWaiting(queue.id).length,
    }));
}
function renderCard(view) {
    const card = el("article", "card screen-card");
    const heading = el("header", "screen-card-header");
    heading.append(el("h2", "screen-queue-name", view.queue.name));
    heading.append(el("span", "badge screen-code", view.queue.code));
    const current = el("div", "screen-current");
    if (view.called) {
        current.append(el("span", "badge screen-called-badge", "Dipanggil"));
        current.append(el("p", "screen-number", view.called.number));
    }
    else {
        current.append(el("span", "badge screen-idle-badge", "Menunggu"));
        current.append(el("p", "screen-no-call", "Belum ada nomor dipanggil"));
    }
    const footer = el("footer", "screen-card-footer");
    footer.append(el("span", "screen-wait-label", "Jumlah menunggu"));
    footer.append(el("strong", "screen-wait-count", String(view.waitingCount)));
    card.append(heading, current, footer);
    return card;
}
const grid = byId("screen-grid", HTMLElement);
const emptyMessage = byId("screen-empty", HTMLParagraphElement);
const updatedAt = byId("updated-at", HTMLParagraphElement);
const feedback = byId("screen-feedback", HTMLParagraphElement);
const fullscreenButton = byId("fullscreen-toggle", HTMLButtonElement);
const soundButton = byId("sound-toggle", HTMLButtonElement);
const previousCalls = new Map();
let initializedCalls = false;
let soundEnabled = false;
let lastSnapshot = "";
function updateCalls(views) {
    for (const view of views) {
        const currentNumber = view.called?.number ?? null;
        const previousNumber = previousCalls.get(view.queue.id);
        if (initializedCalls && soundEnabled && currentNumber && currentNumber !== previousNumber && view.called) {
            speakTicket(view.called, view.queue.name);
        }
        previousCalls.set(view.queue.id, currentNumber);
    }
    initializedCalls = true;
}
function render(force = false) {
    const views = buildViews();
    updateCalls(views);
    const snapshot = JSON.stringify(views);
    if (force || snapshot !== lastSnapshot) {
        grid.replaceChildren(...views.map(renderCard));
        emptyMessage.hidden = views.length > 0;
        lastSnapshot = snapshot;
    }
    updatedAt.textContent = `Diperbarui ${new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).format(new Date())}`;
}
function updateFullscreenLabel() {
    fullscreenButton.textContent = document.fullscreenElement ? "Keluar Layar Penuh" : "Layar Penuh";
}
fullscreenButton.addEventListener("click", async () => {
    try {
        if (document.fullscreenElement)
            await document.exitFullscreen();
        else
            await document.documentElement.requestFullscreen();
        feedback.hidden = true;
    }
    catch {
        feedback.textContent = "Mode layar penuh tidak tersedia di browser ini.";
        feedback.hidden = false;
    }
});
document.addEventListener("fullscreenchange", updateFullscreenLabel);
soundButton.disabled = !isSpeechSupported();
if (!isSpeechSupported())
    soundButton.textContent = "Suara tidak tersedia";
soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute("aria-pressed", String(soundEnabled));
    soundButton.textContent = soundEnabled ? "Matikan suara" : "Aktifkan suara";
    if (!soundEnabled)
        stopSpeech();
    feedback.hidden = true;
});
render(true);
window.setInterval(render, POLL_MS);
window.addEventListener("storage", () => render());
