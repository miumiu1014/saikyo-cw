import { wrapSelection, insertAtCursor } from "../../../shared/react-input";

const STYLE_ID = "scw-input-tools-style";
const ICONS_ID = "scw-input-tools-icons";
const ICON_CLASS = "scw-input-tools__icon";
const TAG_CLASS = "scw-input-tools__icon--tag";
const EMO_CLASS = "scw-input-tools__icon--emo";
const PRIMARY_CLASS = "scw-input-tools__icon--primary";

interface ToolButton {
  label: string;
  title: string;
  type: "tag" | "emo" | "primary";
  action: (textarea: HTMLTextAreaElement) => void;
}

const BUTTONS: ToolButton[] = [
  { label: "code", title: "コードブロック", type: "tag", action: (ta) => wrapSelection(ta, "[code]", "[/code]") },
  { label: "info", title: "情報ボックス", type: "tag", action: (ta) => wrapSelection(ta, "[info]", "[/info]") },
  { label: "title", title: "タイトル", type: "tag", action: (ta) => wrapSelection(ta, "[info][title]", "[/title][/info]") },
  { label: "hr", title: "水平線", type: "tag", action: (ta) => insertAtCursor(ta, "[hr]") },
  { label: "bow", title: "おじぎ", type: "emo", action: (ta) => insertAtCursor(ta, "(bow)") },
  { label: "clap", title: "拍手", type: "emo", action: (ta) => insertAtCursor(ta, "(clap)") },
  { label: "roger", title: "了解", type: "emo", action: (ta) => insertAtCursor(ta, "(roger)") },
  { label: "congrats", title: "おめでとう", type: "emo", action: (ta) => insertAtCursor(ta, "(congrats)") },
  { label: "love", title: "ハート", type: "emo", action: (ta) => insertAtCursor(ta, "(love)") },
  { label: "TO ALL", title: "全員にTO", type: "primary", action: () => selectAllTo() },
];

// 既存のChatwork Input Toolsと同じトンマナ
const STYLES = `
  #${ICONS_ID} {
    display: flex;
    align-items: center;
  }

  .${ICON_CLASS} {
    align-items: center;
    cursor: pointer;
    display: flex;
    height: 24px;
    opacity: 0.8;
    margin: 0 4px;
    -webkit-user-select: none;
    user-select: none;
    border-radius: 2px;
    color: #ffffff;
    font-size: 12px;
    line-height: 12px;
    padding: 2px 4px;
    border: none;
    font-family: -apple-system, BlinkMacSystemFont, ".SFNSDisplay-Regular",
                 "Helvetica Neue", "Hiragino Sans", sans-serif;
  }

  .${ICON_CLASS}:hover {
    opacity: 1;
  }

  .${TAG_CLASS} {
    background-color: #444444;
  }

  .${EMO_CLASS} {
    background-color: #ffa000;
  }

  .${PRIMARY_CLASS} {
    background-color: #4a9eff;
  }
`;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function getChatTextarea(): HTMLTextAreaElement | null {
  return document.querySelector("#_chatText") as HTMLTextAreaElement | null;
}

export function injectToolbar(): void {
  // 既にあればスキップ
  if (document.getElementById(ICONS_ID)) return;

  // #_emoticon の横に挿入する（既存拡張と同じ場所）
  const emoticon = document.querySelector("#_emoticon");
  if (!emoticon) return;

  injectStyles();

  const ul = document.createElement("ul");
  ul.id = ICONS_ID;

  for (const btn of BUTTONS) {
    const li = document.createElement("li");
    li.className = ICON_CLASS;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", btn.title);
    li.title = btn.title;

    const span = document.createElement("span");
    span.className = btn.type === "tag" ? TAG_CLASS
      : btn.type === "emo" ? EMO_CLASS
      : PRIMARY_CLASS;
    // spanにもICON_CLASSの見た目を適用するため、直接テキストだけ入れる
    span.textContent = btn.label;
    span.style.cssText = `
      border-radius: 2px;
      color: #ffffff;
      font-size: 12px;
      line-height: 12px;
      padding: 2px 4px;
      background-color: inherit;
    `;

    li.classList.add(
      btn.type === "tag" ? TAG_CLASS
        : btn.type === "emo" ? EMO_CLASS
        : PRIMARY_CLASS,
    );

    li.textContent = btn.label;

    li.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ta = getChatTextarea();
      if (ta) {
        ta.focus();
        btn.action(ta);
      }
    });

    ul.appendChild(li);
  }

  // #_emoticon の後ろに挿入
  emoticon.insertAdjacentElement("afterend", ul);
}

function selectAllTo(): void {
  const toBtn = document.querySelector("#_to") as HTMLElement | null;
  if (toBtn) {
    toBtn.click();
    setTimeout(() => {
      const checkboxes = document.querySelectorAll<HTMLInputElement>(
        '#_toList input[type="checkbox"]:not(:checked)',
      );
      checkboxes.forEach((cb) => cb.click());
    }, 200);
  }
}

export function removeToolbar(): void {
  document.getElementById(ICONS_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
}
