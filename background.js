// リクエスト開始時のログ
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.info(`Request started: ${details.url}`);
  },
  {urls: ["<all_urls>"]}
);

// リクエスト完了時のログとダウンロード処理
chrome.webRequest.onCompleted.addListener(
  function(details) {
    let size = details.responseHeaders ? 
      details.responseHeaders.find(h => h.name.toLowerCase() === "content-length") :
      null;
    let sizeStr = size ? `${size.value} bytes` : "unknown size";
    
    console.info(`Request completed: ${details.url}`);
    console.info(`Response size: ${sizeStr}`);
    
    // URLの拡張子が.ttml2かどうかをチェック
    if (details.url.toLowerCase().endsWith('.ttml2')) {
      console.log('TTML2 file detected. Attempting to download...');
      
      // URLからファイル名を抽出
      let filename = details.url.split('/').pop();
      
      // ダウンロード処理
      chrome.downloads.download({
        url: details.url,
        filename: filename,
        saveAs: false
      }, function(downloadId) {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError);
        } else {
          console.log('Download started. ID:', downloadId);
        }
      });
    }
    
    console.log("---");  // リクエスト間の区切り
  },
  {urls: ["<all_urls>"]},
  ["responseHeaders"]
);