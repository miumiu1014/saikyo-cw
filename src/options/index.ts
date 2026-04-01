import { PLUGIN_CONFIGS } from "../shared/plugin-configs";
import {
  ALL_BUTTON_METAS,
  getDefaultEnabledIds,
} from "../shared/input-tools-buttons";
import {
  getPluginSettings,
  getPluginConfig,
  setPluginEnabled,
  setPluginApiKey,
  setPluginConfig,
  type PluginSettings,
} from "../shared/storage";

let statusTimeout: ReturnType<typeof setTimeout> | null = null;

function showStatus(message: string): void {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = message;
  el.style.opacity = "1";
  if (statusTimeout) clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    el.style.opacity = "0";
  }, 2000);
}

function createPluginCard(
  config: (typeof PLUGIN_CONFIGS)[number],
  settings: PluginSettings | undefined,
): HTMLElement {
  const card = document.createElement("div");
  card.className = "plugin-card";

  const enabled = settings?.enabled ?? true;

  card.innerHTML = `
    <div class="plugin-info">
      <div class="plugin-name">${config.name}</div>
      <div class="plugin-description">${config.description}</div>
      ${
        config.requiresApiKey
          ? `
        <div class="plugin-config">
          <label class="api-key-label">${config.apiKeyLabel ?? "API Key"}</label>
          <input type="password" class="api-key-input"
                 placeholder="APIキーを入力"
                 value="${settings?.apiKey ?? ""}"
                 data-plugin-id="${config.id}">
        </div>
      `
          : ""
      }
    </div>
    <label class="toggle">
      <input type="checkbox" ${enabled ? "checked" : ""} data-plugin-id="${config.id}">
      <span class="toggle-slider"></span>
    </label>
  `;

  const checkbox = card.querySelector<HTMLInputElement>(
    '.toggle input[type="checkbox"]',
  )!;
  checkbox.addEventListener("change", async () => {
    await setPluginEnabled(config.id, checkbox.checked);
    showStatus(`${config.name} を${checkbox.checked ? "有効" : "無効"}にしました`);
  });

  if (config.requiresApiKey) {
    const apiKeyInput = card.querySelector<HTMLInputElement>(".api-key-input")!;
    let debounce: ReturnType<typeof setTimeout>;
    apiKeyInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        await setPluginApiKey(config.id, apiKeyInput.value);
        showStatus("APIキーを保存しました");
      }, 500);
    });
  }

  return card;
}

async function createInputToolsConfig(): Promise<HTMLElement> {
  const section = document.createElement("div");
  section.className = "plugin-card";

  const config = await getPluginConfig<{ enabledButtons?: string[] }>(
    "input-tools",
  );
  const enabledIds = new Set(
    config?.enabledButtons ?? getDefaultEnabledIds(),
  );

  section.innerHTML = `
    <div class="plugin-info">
      <div class="plugin-name">Input Tools - ボタン設定</div>
      <div class="plugin-description">表示するボタンを選択</div>
      <div class="button-config" style="margin-top: 12px;"></div>
    </div>
  `;

  const container = section.querySelector(".button-config")!;

  for (const meta of ALL_BUTTON_METAS) {
    const label = document.createElement("label");
    label.className = "button-config-item";

    const typeLabel =
      meta.type === "tag" ? "タグ" : meta.type === "emo" ? "絵文字" : "アクション";

    label.innerHTML = `
      <input type="checkbox" ${enabledIds.has(meta.id) ? "checked" : ""} data-button-id="${meta.id}">
      <span class="button-config-label">${meta.label}</span>
      <span class="button-config-desc">${meta.description}</span>
      <span class="button-config-type">${typeLabel}</span>
    `;

    const cb = label.querySelector<HTMLInputElement>("input")!;
    cb.addEventListener("change", async () => {
      if (cb.checked) {
        enabledIds.add(meta.id);
      } else {
        enabledIds.delete(meta.id);
      }
      await setPluginConfig("input-tools", {
        enabledButtons: Array.from(enabledIds),
      });
      showStatus("ボタン設定を保存しました");
    });

    container.appendChild(label);
  }

  return section;
}

async function createQuickTaskConfig(): Promise<HTMLElement> {
  const section = document.createElement("div");
  section.className = "plugin-card";

  const config = await getPluginConfig<{ mode?: string; myChatId?: string }>(
    "quick-task",
  );
  const currentMode = config?.mode ?? "mychat-url";
  const currentChatId = config?.myChatId ?? "";

  const modes = [
    { value: "mychat-url", label: "マイチャットにURLのみ" },
    { value: "mychat-message", label: "マイチャットにURL+メッセージ" },
    { value: "here-url", label: "現チャットにURLのみ (担当者=自分)" },
    { value: "here-message", label: "現チャットにURL+メッセージ (担当者=自分)" },
  ];

  section.innerHTML = `
    <div class="plugin-info">
      <div class="plugin-name">Quick Task - 設定</div>
      <div class="plugin-description">タスク追加の動作モードとマイチャットID</div>
      <div style="margin-top: 12px;">
        <label class="api-key-label">動作モード</label>
        <select id="scw-task-mode" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; margin-top: 4px;">
          ${modes.map((m) => `<option value="${m.value}" ${m.value === currentMode ? "selected" : ""}>${m.label}</option>`).join("")}
        </select>
      </div>
      <div style="margin-top: 12px;">
        <label class="api-key-label">マイチャットのルームID</label>
        <input type="text" id="scw-task-chatid" class="api-key-input"
               placeholder="例: 12345678"
               value="${currentChatId}">
      </div>
    </div>
  `;

  section.querySelector("#scw-task-mode")!.addEventListener("change", async (e) => {
    const mode = (e.target as HTMLSelectElement).value;
    const existing = (await getPluginConfig<Record<string, unknown>>("quick-task")) ?? {};
    await setPluginConfig("quick-task", { ...existing, mode });
    showStatus("Quick Taskモードを保存しました");
  });

  const chatIdInput = section.querySelector<HTMLInputElement>("#scw-task-chatid")!;
  let debounce: ReturnType<typeof setTimeout>;
  chatIdInput.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const existing = (await getPluginConfig<Record<string, unknown>>("quick-task")) ?? {};
      await setPluginConfig("quick-task", { ...existing, myChatId: chatIdInput.value });
      showStatus("マイチャットIDを保存しました");
    }, 500);
  });

  return section;
}

async function render(): Promise<void> {
  const container = document.getElementById("plugin-list");
  if (!container) return;

  const settings = await getPluginSettings();

  for (const config of PLUGIN_CONFIGS) {
    const card = createPluginCard(config, settings[config.id]);
    container.appendChild(card);

    if (config.id === "input-tools") {
      const btnConfig = await createInputToolsConfig();
      container.appendChild(btnConfig);
    }

    if (config.id === "quick-task") {
      const taskConfig = await createQuickTaskConfig();
      container.appendChild(taskConfig);
    }
  }
}

render();
