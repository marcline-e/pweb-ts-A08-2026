import type { Priority, QueueType, Ticket } from "../core/types.js";
import { loadQueueTypes } from "../core/storage.js";
import { getWaiting, issueTicket } from "../core/tickets.js";

const POLL_MS = 2500;
const PRIORITIES: readonly Priority[] = ["normal", "lansia", "disabilitas", "vip"];
const PRIORITY_LABEL: Record<Priority, string> = {
  normal: "Normal",
  lansia: "Lansia",
  disabilitas: "Disabilitas",
  vip: "VIP",
};

function byId<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Elemen #${id} tidak ditemukan`);
  return element;
}

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

interface QueueView {
  queue: QueueType;
  waitingCount: number;
}

interface LatestTicket {
  ticket: Ticket;
  queueName: string;
  waitingCount: number;
}

function buildViews(): QueueView[] {
  return loadQueueTypes()
    .filter((queue) => queue.active)
    .map((queue) => ({ queue, waitingCount: getWaiting(queue.id).length }));
}

function makeActionButton(queue: QueueType, priority: Priority): HTMLButtonElement {
  const button = el(
    "button",
    `btn ${priority === "normal" ? "btn-primary" : "btn-outline"} take-action take-${priority}`,
  );
  button.type = "button";
  button.dataset.queue = queue.id;
  button.dataset.priority = priority;
  button.setAttribute("aria-label", `Ambil nomor ${PRIORITY_LABEL[priority]} untuk ${queue.name}`);
  if (priority === "normal") {
    button.append(el("span", "btn-label", "Ambil Nomor"));
    const arrow = el("span", "btn-arrow");
    arrow.setAttribute("aria-hidden", "true");
    arrow.append(el("span", "take-arrow-glyph", "→"));
    button.append(arrow);
  } else {
    button.textContent = PRIORITY_LABEL[priority];
  }
  return button;
}

function renderCard(view: QueueView): HTMLElement {
  const card = el("article", "card take-card");
  const header = el("header", "take-card-header");
  const titleBlock = el("div", "take-title-block");
  titleBlock.append(el("h2", "take-queue-name", view.queue.name));
  titleBlock.append(el("p", "muted take-code", `Loket ${view.queue.code}`));
  header.append(titleBlock, el("span", "badge", `${view.waitingCount} menunggu`));

  const actions = el("div", "take-actions");
  actions.append(...PRIORITIES.map((priority) => makeActionButton(view.queue, priority)));
  card.append(header, actions);
  return card;
}

const grid = byId("take-grid", HTMLElement);
const emptyMessage = byId("take-empty", HTMLParagraphElement);
const resultPanel = byId("ticket-result", HTMLElement);
const resultNumber = byId("ticket-number", HTMLHeadingElement);
const resultDetail = byId("ticket-detail", HTMLParagraphElement);
const feedback = byId("take-feedback", HTMLParagraphElement);
let latestTicket: LatestTicket | null = null;
let lastSnapshot = "";

function renderResult(): void {
  if (!latestTicket) {
    resultPanel.hidden = true;
    return;
  }
  resultNumber.textContent = latestTicket.ticket.number;
  resultDetail.textContent = `${latestTicket.queueName} · ${latestTicket.waitingCount} tiket menunggu`;
  resultPanel.hidden = false;
}

function render(force = false): void {
  const views = buildViews();
  const snapshot = JSON.stringify(views);
  if (force || snapshot !== lastSnapshot) {
    grid.replaceChildren(...views.map(renderCard));
    emptyMessage.hidden = views.length > 0;
    lastSnapshot = snapshot;
  }
  renderResult();
}

grid.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest("button[data-queue][data-priority]");
  if (!(button instanceof HTMLButtonElement) || button.disabled) return;

  const queueId = button.dataset.queue;
  const priorityValue = button.dataset.priority;
  if (!queueId || !PRIORITIES.some((priority) => priority === priorityValue)) return;
  const priority = PRIORITIES.find((candidate) => candidate === priorityValue);
  if (!priority) return;

  button.disabled = true;
  feedback.hidden = true;
  const result = issueTicket(queueId, priority);
  if (!result.ok) {
    feedback.textContent = result.error;
    feedback.hidden = false;
    render(true);
    return;
  }

  const queue = loadQueueTypes().find((item) => item.id === queueId);
  latestTicket = {
    ticket: result.value,
    queueName: queue?.name ?? "Antrian",
    waitingCount: getWaiting(queueId).length,
  };
  render(true);
  resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
});

render(true);
window.setInterval(render, POLL_MS);
window.addEventListener("storage", () => render());
