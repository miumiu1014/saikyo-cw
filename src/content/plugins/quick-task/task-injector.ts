import { CW_BASE_URL } from "../../../shared/constants";
import { waitForElement, sleep } from "../../../shared/dom-helpers";
import { setReactInputValue } from "../../../shared/react-input";
import { getPluginConfig, setPluginConfig } from "../../../shared/storage";

const PLUGIN_ID = "quick-task";
const STYLE_ID = "scw-quick-task-style";
const BTN_CLASS = "scw-quick-task__btn";
const BTN_ICON_CLASS = "scw-quick-task__icon";

interface QuickTaskConfig {
  myChatId?: string;
}

const STYLES = `
  .${BTN_CLASS} {
    display: inline-block;
    cursor: pointer;
    margin-left: 4px;
  }

  .${BTN_ICON_CLASS} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    font-size: 14px;
    background: #e8f4fd;
    transition: background 0.15s;
  }

  .${BTN_CLASS}:hover .${BTN_ICON_CLASS} {
    background: #c8e4fd;
  }

  /* ダークモード */
  body.mainContentArea--dark .${BTN_ICON_CLASS},
  body[data-theme="dark"] .${BTN_ICON_CLASS},
  .darkMode .${BTN_ICON_CLASS} {
    background: #1a3a50;
  }

  body.mainContentArea--dark .${BTN_CLASS}:hover .${BTN_ICON_CLASS},
  body[data-theme="dark"] .${BTN_CLASS}:hover .${BTN_ICON_CLASS},
  .darkMode .${BTN_CLASS}:hover .${BTN_ICON_CLASS} {
    background: #224a62;
  }
`;

async function getMyChatId(): Promise<string> {
  const config = await getPluginConfig<QuickTaskConfig>(PLUGIN_ID);
  if (config?.myChatId) return config.myChatId;

  const id = prompt(
    "タスクを投稿するマイチャットのルームIDを入力してください\n" +
      "(URLの #!rid の後の数字)",
  );
  if (!id) throw new Error("Room ID is required");

  await setPluginConfig(PLUGIN_ID, { myChatId: id });
  return id;
}

function getMessageInfo(actionNav: Element): {
  messageId: string;
  roomId: string;
  messageText: string;
} | null {
  const messageEl = actionNav.closest("[id^=_messageId]");
  if (!messageEl) return null;

  const messageId = messageEl.id.replace("_messageId", "");
  const match = location.hash.match(/#!rid(\d+)/);
  const roomId = match?.[1] ?? "";
  const bodyEl = messageEl.querySelector(".chatTimeLineMessageArea__messageText");
  const messageText = bodyEl?.textContent?.trim().substring(0, 200) ?? "";

  return { messageId, roomId, messageText };
}

async function createMyTask(
  roomId: string,
  messageId: string,
  messageText: string,
): Promise<void> {
  const myChatId = await getMyChatId();
  const messageUrl = `${CW_BASE_URL}#!rid${roomId}-${messageId}`;
  const taskContent = messageText
    ? `${messageText}\n${messageUrl}`
    : messageUrl;

  location.href = `${CW_BASE_URL}#!rid${myChatId}`;
  await sleep(500);

  const taskAddBtn = await waitForElement(
    '[data-testid="room-sub-column_room-task_add-button"], #_taskAddButton',
  );
  (taskAddBtn as HTMLElement).click();
  await sleep(300);

  const taskInput = await waitForElement(
    '#_taskInputActive textarea, [data-testid="task-input"] textarea',
  );
  setReactInputValue(taskInput as HTMLTextAreaElement, taskContent);
  await sleep(200);

  const submitBtn = document.querySelector(
    '#_taskAddSubmit, [data-testid="task-add-submit"]',
  ) as HTMLElement | null;
  if (submitBtn) submitBtn.click();
}

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}

export function injectMyTaskButton(actionNav: Element): void {
  if (actionNav.querySelector(`.${BTN_CLASS}`)) return;

  injectStyles();

  const btn = document.createElement("li");
  btn.className = BTN_CLASS;
  btn.title = "My Taskに追加";
  btn.innerHTML = `<span class="${BTN_ICON_CLASS}">📋</span>`;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const info = getMessageInfo(actionNav);
    if (!info) return;

    try {
      await createMyTask(info.roomId, info.messageId, info.messageText);
    } catch (err) {
      console.error("[saikyo-cw] Quick Task error:", err);
    }
  });

  actionNav.appendChild(btn);
}
