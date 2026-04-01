import type { CwPlugin } from "../types";
import { observeDOM } from "../../../shared/mutation-observer";
import { CW } from "../../../shared/chatwork-selectors";
import { injectGroupPicker, removeStyles } from "./group-picker";

let observer: MutationObserver | null = null;

export const mentionGroupPlugin: CwPlugin = {
  config: {
    id: "mention-group",
    name: "Mention Group",
    description: "グループメンションをワンクリックで挿入",
  },
  init() {
    observer = observeDOM(CW.TO_BUTTON, (el) => {
      injectGroupPicker(el);
    });
  },
  destroy() {
    observer?.disconnect();
    observer = null;
    removeStyles();
    document
      .querySelectorAll(".scw-mention-group__picker")
      .forEach((el) => el.remove());
  },
};
