chrome.runtime.onInstalled.addListener(() => {
  console.log("saikyo-cw installed");
});

// メンションオートコンプリート: ルームメンバー取得
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "fetchMembers") {
    fetch(
      `https://api.chatwork.com/v2/rooms/${message.roomId}/members`,
      {
        headers: { "X-ChatWorkToken": message.token },
      },
    )
      .then((res) => res.json())
      .then((members) => sendResponse({ ok: true, members }))
      .catch(() => sendResponse({ ok: false }));
    return true; // 非同期レスポンスのためtrueを返す
  }
});
