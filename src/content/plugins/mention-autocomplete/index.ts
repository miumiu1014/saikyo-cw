import type { CwPlugin } from "../types";
import { initAutocomplete, destroyAutocomplete } from "./autocomplete";

export const mentionAutocompletePlugin: CwPlugin = {
  config: {
    id: "mention-autocomplete",
    name: "Mention Autocomplete",
    description: "@を入力するとメンバー候補を表示してメンション挿入",
    requiresApiKey: true,
    apiKeyLabel: "Chatwork APIトークン",
  },
  init() {
    initAutocomplete();
  },
  destroy() {
    destroyAutocomplete();
  },
};