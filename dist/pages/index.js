import { requireAuth, logout } from "../core/auth.js";
import { getQueueTypes, addQueueType, toggleQueueType, deleteQueueType, } from "../core/queueTypes.js";
import { getTickets, getWaiting, issueTicket, resetQueue, } from "../core/tickets.js";
const session = requireAuth(["admin", "moderator"]);
function byId(id, type) {
    const element = document.getElementById(id);
    if (!(element instanceof type)) {
        throw new Error(`Elemen HTML tidak ditemukan: ${id}`);
    }
    return element;
}
const staffInfo = byId("staffInfo", HTMLSpanElement);
const globalMessage = byId("globalMessage", HTMLParagraphElement);
const queueTypeForm = byId("queueTypeForm", HTMLFormElement);
const queueCode = byId("queueCode", HTMLInputElement);
const queueName = byId("queueName", HTMLInputElement);
const queueTypeMessage = byId("queueTypeMessage", HTMLDivElement);
const queueTypesList = byId("queueTypesList", HTMLDivElement);
const ticketForm = byId("ticketForm", HTMLFormElement);
const ticketQueueType = byId("ticketQueueType", HTMLSelectElement);
const ticketPriority = byId("ticketPriority", HTMLSelectElement);
const ticketMessage = byId("ticketMessage", HTMLDivElement);
const ticketsList = byId("ticketsList", HTMLDivElement);
const issueButton = byId("issueButton", HTMLButtonElement);
const resetButton = byId("resetButton", HTMLButtonElement);
const logoutButton = byId("logoutButton", HTMLButtonElement);
staffInfo.textContent = `${session.firstName} (${session.role})`;
function showMessage(element, message, success = false) {
    element.textContent = message;
    element.className = success ? "message success" : "message error";
}
function makeButton(label, className, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn ${className}`;
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
}
function addText(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.append(element);
    return element;
}
function renderQueueTypes() {
    const queueTypes = getQueueTypes();
    queueTypesList.replaceChildren();
    ticketQueueType.replaceChildren();
    const activeTypes = queueTypes.filter((item) => item.active);
    if (activeTypes.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Tidak ada jenis antrian aktif";
        ticketQueueType.append(option);
        ticketQueueType.disabled = true;
    }
    else {
        ticketQueueType.disabled = false;
        for (const item of activeTypes) {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = `${item.code} — ${item.name}`;
            ticketQueueType.append(option);
        }
    }
    if (queueTypes.length === 0) {
        addText(queueTypesList, "p", "Belum ada jenis antrian.");
    }
    for (const item of queueTypes) {
        const card = document.createElement("article");
        card.className = "queue-item";
        const details = document.createElement("div");
        addText(details, "strong", `${item.code} — ${item.name}`);
        addText(details, "p", `${getWaiting(item.id).length} tiket menunggu`);
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = item.active ? "AKTIF" : "NONAKTIF";
        details.append(badge);
        card.append(details);
        card.append(makeButton(item.active ? "Nonaktifkan" : "Aktifkan", "btn-outline", () => {
            toggleQueueType(item.id);
            showMessage(globalMessage, "Status jenis antrian diperbarui.", true);
            renderAll();
        }));
        card.append(makeButton("Hapus", "btn-danger", () => {
            if (!window.confirm(`Hapus ${item.name} dan semua tiket terkait?`))
                return;
            deleteQueueType(item.id);
            showMessage(globalMessage, "Jenis antrian dan tiket terkait dihapus.", true);
            renderAll();
        }));
        queueTypesList.append(card);
    }
}
function priorityLabel(priority) {
    if (priority === "vip")
        return "VIP";
    if (priority === "disabilitas")
        return "Disabilitas";
    if (priority === "lansia")
        return "Lansia";
    return "Normal";
}
function renderTickets() {
    ticketsList.replaceChildren();
    const queueTypes = getQueueTypes();
    const tickets = getTickets();
    for (const queueType of queueTypes) {
        const section = document.createElement("section");
        section.className = "ticket-list";
        addText(section, "h3", `${queueType.code} — ${queueType.name}`);
        const relevant = tickets
            .filter((ticket) => ticket.queueTypeId === queueType.id)
            .sort((a, b) => b.createdAt - a.createdAt);
        if (relevant.length === 0) {
            addText(section, "p", "Belum ada tiket.");
        }
        for (const ticket of relevant.slice(0, 10)) {
            const card = document.createElement("article");
            card.className = "ticket-item";
            addText(card, "strong", ticket.number);
            addText(card, "p", `Prioritas: ${priorityLabel(ticket.priority)}`);
            const status = document.createElement("span");
            status.className = "badge";
            status.textContent = ticket.status.toUpperCase();
            card.append(status);
            if (ticket.skipCount > 0) {
                const skipped = document.createElement("span");
                skipped.className = "badge";
                skipped.textContent = "DILEWATI";
                card.append(skipped);
            }
            section.append(card);
        }
        ticketsList.append(section);
    }
}
function renderAll() {
    renderQueueTypes();
    renderTickets();
}
queueTypeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = addQueueType(queueCode.value, queueName.value);
    if (!result.ok) {
        showMessage(queueTypeMessage, result.error);
        return;
    }
    queueTypeForm.reset();
    showMessage(queueTypeMessage, `Jenis antrian ${result.value.name} berhasil ditambahkan.`, true);
    renderAll();
});
ticketForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (ticketQueueType.disabled || ticketQueueType.value.length === 0) {
        showMessage(ticketMessage, "Tambahkan atau aktifkan jenis antrian terlebih dahulu.");
        return;
    }
    const priorities = [
        "normal",
        "lansia",
        "disabilitas",
        "vip",
    ];
    const selectedPriority = priorities.find((priority) => priority === ticketPriority.value);
    if (!selectedPriority) {
        showMessage(ticketMessage, "Prioritas tiket tidak valid.");
        return;
    }
    issueButton.disabled = true;
    const result = issueTicket(ticketQueueType.value, selectedPriority);
    issueButton.disabled = false;
    if (!result.ok) {
        showMessage(ticketMessage, result.error);
        return;
    }
    showMessage(ticketMessage, `Tiket ${result.value.number} berhasil diterbitkan.`, true);
    renderAll();
});
resetButton.addEventListener("click", () => {
    if (!window.confirm("Reset seluruh tiket? Semua tiket akan dihapus dan nomor kembali dari 001.")) {
        return;
    }
    resetQueue();
    showMessage(globalMessage, "Seluruh antrian berhasil direset.", true);
    renderAll();
});
logoutButton.addEventListener("click", () => {
    logout();
});
renderAll();
window.setInterval(renderAll, 2000);
