import type { CwPlugin } from "../types";
import { injectGroupPicker, removeGroupPicker } from "./group-picker";

let observer: MutationObserver | null = null;

export const mentionGroupPlugin: CwPlugin = {
  config: {
    id: "mention-group",
    name: "Mention Group",
    description: "グループメンションをワンクリックで挿入",
  },
  init() {
    // TOボタンまたは絵文字ボタンが現れたらその横にボタンを注入
    const tryInject = () => {
      injectGroupPicker();
    };

    observer = new MutationObserver(() => {
      if (!document.getElementById("scw-mention-group-btn")) {
        tryInject();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    tryInject();
    setTimeout(tryInject, 1000);
    setTimeout(tryInject, 3000);
  },
  destroy() {
    observer?.disconnect();
    observer = null;
    removeGroupPicker();
  },
};
