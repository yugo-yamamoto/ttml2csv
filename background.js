// リクエスト開始時のログ
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log(`Request started: ${details.url}`);
  },
  {urls: ["<all_urls>"]}
);

// リクエスト完了時のログ（レスポンスサイズを含む）
chrome.webRequest.onCompleted.addListener(
  function(details) {
    let size = details.responseHeaders.find(h => h.name.toLowerCase() === "content-length");
    let sizeStr = size ? `${size.value} bytes` : "unknown size";
    
    console.log(`Request completed: ${details.url}`);
    console.log(`Response size: ${sizeStr}`);
    console.log("---");  // リクエスト間の区切り
  },
  {urls: ["<all_urls>"]},
  ["responseHeaders"]
);