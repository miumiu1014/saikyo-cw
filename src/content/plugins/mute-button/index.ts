import type { CwPlugin } from "../types";

const STYLE_ID = "scw-mute-button-style";
const BTN_CLASS = "scw-mute-button";
const BTN_ACTIVE_CLASS = "scw-mute-button--active";

let muteBtn: HTMLButtonElement | null = null;
let isMuted = false;

const STYLES = `
  .${BTN_CLASS} {
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 10000;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: #4c566a;
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background 0.2s;
  }

  .${BTN_CLASS}:hover {
    background: #5c6678;
  }

  .${BTN_CLASS}.${BTN_ACTIVE_CLASS} {
    background: #bf616a;
  }

  .${BTN_CLASS}.${BTN_ACTIVE_CLASS}:hover {
    background: #cf717a;
  }

  /* ダークモード */
  body.mainContentArea--dark .${BTN_CLASS},
  body[data-theme="dark"] .${BTN_CLASS},
  .darkMode .${BTN_CLASS} {
    background: #5c6678;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  body.mainContentArea--dark .${BTN_CLASS}:hover,
  body[data-theme="dark"] .${BTN_CLASS}:hover,
  .darkMode .${BTN_CLASS}:hover {
    background: #6c768a;
  }

  body.mainContentArea--dark .${BTN_CLASS}.${BTN_ACTIVE_CLASS},
  body[data-theme="dark"] .${BTN_CLASS}.${BTN_ACTIVE_CLASS},
  .darkMode .${BTN_CLASS}.${BTN_ACTIVE_CLASS} {
    background: #bf616a;
  }
`;

function toggleMute(): void {
  isMuted = !isMuted;
  if (muteBtn) {
    muteBtn.textContent = isMuted ? "🔇" : "🔔";
    muteBtn.classList.toggle(BTN_ACTIVE_CLASS, isMuted);
    muteBtn.title = isMuted ? "Unmute notifications" : "Mute notifications";
  }

  const audioElements = document.querySelectorAll("audio");
  audioElements.forEach((audio) => {
    audio.muted = isMuted;
  });

  if (isMuted) {
    (window as unknown as Record<string, unknown>).__scw_origNotification =
      window.Notification;
    (window.Notification as unknown) = class {
      constructor() {
        // 何もしない
      }
    };
  } else {
    const orig = (window as unknown as Record<string, unknown>)
      .__scw_origNotification as typeof Notification | undefined;
    if (orig) {
      (window.Notification as unknown) = orig;
    }
  }
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export const muteButtonPlugin: CwPlugin = {
  config: {
    id: "mute-button",
    name: "Mute Button",
    description: "ワンクリックで通知をミュート",
  },
  init() {
    injectStyles();
    muteBtn = document.createElement("button");
    muteBtn.className = BTN_CLASS;
    muteBtn.title = "Mute notifications";
    muteBtn.textContent = "🔔";
    muteBtn.addEventListener("click", toggleMute);
    document.body.appendChild(muteBtn);
  },
  destroy() {
    if (isMuted) toggleMute();
    muteBtn?.remove();
    muteBtn = null;
    document.getElementById(STYLE_ID)?.remove();
  },
};
