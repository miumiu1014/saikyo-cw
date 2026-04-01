import type { CwPlugin } from "../types";
import { observeDOM } from "../../../shared/mutation-observer";

const CONTAINER_CLASS = "scw-reaction-copy";
let observer: MutationObserver | null = null;

interface ReactionUser {
  name: string;
  accountId: string | null;
}

function getReactionUsers(reactionList: Element): ReactionUser[] {
  const userEls = reactionList.querySelectorAll(
    ".reactionUserListTooltip__userName",
  );
  return Array.from(userEls).map((el) => {
    const name = el.textContent?.trim() ?? "";
    // ユーザー要素またはその親からaccount IDを取得
    const userItem = el.closest("[data-aid]") ?? el.closest("[data-account-id]");
    const accountId =
      userItem?.getAttribute("data-aid") ??
      userItem?.getAttribute("data-account-id") ??
      el.getAttribute("data-aid") ??
      null;
    return { name, accountId };
  });
}

function copyWithFeedback(
  btn: HTMLButtonElement,
  text: string,
  label: string,
): void {
  navigator.clipboard.writeText(text);
  const original = btn.textContent;
  btn.textContent = `${label}済み`;
  setTimeout(() => {
    btn.textContent = original;
  }, 1000);
}

function createButton(
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.cssText = `
    padding: 4px 8px;
    font-size: 12px;
    background: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  `;
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#ddd";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "#eee";
  });
  btn.addEventListener("click", onClick);
  return btn;
}

function injectButtons(reactionList: Element): void {
  if (reactionList.querySelector(`.${CONTAINER_CLASS}`)) return;

  const container = document.createElement("div");
  container.className = CONTAINER_CLASS;
  container.style.cssText = `
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  `;

  // 名前コピーボタン
  const copyBtn = createButton("コピー", () => {
    const users = getReactionUsers(reactionList);
    const text = users
      .map((u) => u.name)
      .filter(Boolean)
      .join("\n");
    copyWithFeedback(copyBtn, text, "コピー");
  });

  // TO付きコピーボタン
  const toBtnEl = createButton("TO付きコピー", () => {
    const users = getReactionUsers(reactionList);
    const text = users
      .filter((u) => u.name)
      .map((u) =>
        u.accountId
          ? `[To:${u.accountId}]${u.name}さん`
          : u.name,
      )
      .join("\n");
    copyWithFeedback(toBtnEl, text, "コピー");
  });
  toBtnEl.style.background = "#e8f4fd";
  toBtnEl.style.borderColor = "#b3d9f2";
  toBtnEl.addEventListener("mouseenter", () => {
    toBtnEl.style.background = "#d0eafb";
  });
  toBtnEl.addEventListener("mouseleave", () => {
    toBtnEl.style.background = "#e8f4fd";
  });

  container.appendChild(copyBtn);
  container.appendChild(toBtnEl);
  reactionList.prepend(container);
}

export const reactionCopyPlugin: CwPlugin = {
  config: {
    id: "reaction-copy",
    name: "Reaction Copy",
    description: "リアクションしたユーザー一覧をコピー（TO付きも対応）",
  },
  init() {
    observer = observeDOM("#_reactionUserList", (el) => {
      injectButtons(el);
    });
  },
  destroy() {
    observer?.disconnect();
    observer = null;
    document.querySelectorAll(`.${CONTAINER_CLASS}`).forEach((el) => el.remove());
  },
};
