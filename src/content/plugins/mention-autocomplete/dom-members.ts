import { CW } from "../../../shared/chatwork-selectors";

export interface DomMember {
  account_id: string;
  name: string;
  avatar_image_url: string;
}

/**
 * #_memberList の DOM からメンバーを取得する。
 * メンバーパネルが開いているときのみ有効。
 */
function getMembersFromMemberList(): DomMember[] {
  const memberList = document.querySelector<HTMLElement>(CW.ROOM_MEMBER_LIST);
  if (!memberList || !memberList.children.length) return [];

  const members: DomMember[] = [];
  const seen = new Set<string>();

  // Chatwork の React UI では data-aid にアカウントIDが入る
  for (const el of memberList.querySelectorAll<HTMLElement>("[data-aid]")) {
    const accountId = el.getAttribute("data-aid");
    if (!accountId || seen.has(accountId)) continue;

    // group-picker.ts と同様のパターンで名前を取得
    const nameEl =
      el.querySelector<HTMLElement>("span[class*='_nameAid']") ??
      el.querySelector<HTMLElement>("span[class*='name']") ??
      el.querySelector<HTMLElement>("span[class*='Name']") ??
      el.querySelector<HTMLElement>("span");

    const name = nameEl?.textContent?.trim() ?? el.textContent?.trim() ?? "";
    if (!name) continue;

    const avatar = el.querySelector<HTMLImageElement>("img");

    members.push({
      account_id: accountId,
      name,
      avatar_image_url: avatar?.src ?? "",
    });
    seen.add(accountId);
  }

  return members;
}

/**
 * タイムラインのメッセージ送信者情報から既出メンバーを収集する。
 * メンバーパネルが閉じていてもメッセージが読み込まれていれば機能する。
 */
function getMembersFromTimeline(): DomMember[] {
  const members: DomMember[] = [];
  const seen = new Set<string>();

  // 各メッセージの送信者要素には data-aid が付く
  const senderEls = document.querySelectorAll<HTMLElement>(
    `${CW.TIMELINE} [data-aid]`,
  );

  for (const el of senderEls) {
    const accountId = el.getAttribute("data-aid");
    if (!accountId || seen.has(accountId)) continue;

    const nameEl =
      el.querySelector<HTMLElement>("span[class*='_nameAid']") ??
      el.querySelector<HTMLElement>("span[class*='name']") ??
      el.querySelector<HTMLElement>("span[class*='Name']") ??
      el.querySelector<HTMLElement>("span");

    const name = nameEl?.textContent?.trim() ?? el.textContent?.trim() ?? "";
    if (!name) continue;

    const avatar = el.querySelector<HTMLImageElement>("img");

    members.push({
      account_id: accountId,
      name,
      avatar_image_url: avatar?.src ?? "",
    });
    seen.add(accountId);
  }

  return members;
}

/**
 * DOM からメンバー一覧を取得する（APIトークン不要）。
 *
 * 優先順:
 * 1. #_memberList（メンバーパネルが開いている場合）
 * 2. タイムラインの送信者（メッセージが読み込まれている場合）
 */
export function fetchMembersFromDOM(): DomMember[] {
  const fromList = getMembersFromMemberList();
  if (fromList.length > 0) return fromList;

  return getMembersFromTimeline();
}
