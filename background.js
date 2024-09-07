// ダウンロードされたファイル名を保持するセット
let downloadedFiles = new Set();

// ファイル名をキャッシュし、ダウンロードする関数
function handleDownload(filename, url) {
  if (!downloadedFiles.has(filename)) {
    // ダウンロード処理
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    }, function(downloadId) {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        console.log('Download started. ID:', downloadId);
        downloadedFiles.add(filename); // ファイル名をキャッシュに追加
        console.log(`Cached the filename: ${filename}`);
      }
    });
  } else {
    console.log(`File ${filename} has already been downloaded.`);
  }
}

// リクエスト開始時のログ
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log(`Request started: ${details.url}`);
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
    
    console.log(`Request completed: ${details.url}`);
    console.log(`Response size: ${sizeStr}`);
    
    // URLの拡張子が.ttml2かどうかをチェック
    if (details.url.toLowerCase().endsWith('.ttml2')) {
      console.log('TTML2 file detected. Checking if it needs to be downloaded...');
      
      // URLからファイル名を抽出
      let filename = details.url.split('/').pop();
      
      // ダウンロード処理（キャッシュチェック込み）
      handleDownload(filename, details.url);
    }
    
    console.log("---");  // リクエスト間の区切り
  },
  {urls: ["<all_urls>"]},
  ["responseHeaders"]
);