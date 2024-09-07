// ダウンロードされたファイル名を保持するセット
let downloadedFiles = new Set();

// TTML2データを抽出する関数
function extractTtml2Data(ttml2Content) {
  const pattern = /<p\s+begin="(.*?)"[^>]*>(.*?)<\/p>/g;
  const matches = [];
  let match;
  while ((match = pattern.exec(ttml2Content)) !== null) {
    const begin = match[1];
    const text = match[2].replace(/<.*?>/g, '').trim();
    matches.push([begin, text]);
  }
  return matches;
}

// 抽出したデータをCSV形式に変換する関数
function convertToCsv(extractedData) {
  const header = '\uFEFFBegin,Text\n';
  const rows = extractedData.map(([begin, text]) => `"${begin}","${text}"`).join('\n');
  return header + rows;
}

// CSVデータをダウンロードフォルダに保存する関数
function saveCsvToDownloads(csvData, filename) {
  // データURLを作成
  const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
  
  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false
  }, function(downloadId) {
    if (chrome.runtime.lastError) {
      console.error('CSV download failed:', chrome.runtime.lastError);
    } else {
      console.log('CSV download started. ID:', downloadId);
    }
  });
}

// TTML2ファイルを処理する関数
function processTtml2File(ttml2Content, url) {
  const extractedData = extractTtml2Data(ttml2Content);
  const csvData = convertToCsv(extractedData);
  const filename = url.split('/').pop().replace('.ttml2', '.csv');
  saveCsvToDownloads(csvData, filename);
  console.log(`CSV saved as ${filename} in Downloads folder.`);
}

// ファイル名をキャッシュし、ダウンロードする関数
function handleDownload(filename, url) {
  if (!downloadedFiles.has(filename)) {
    // TTML2ファイルのダウンロードと処理
    fetch(url)
      .then(response => response.text())
      .then(ttml2Content => {
        processTtml2File(ttml2Content, url);
        downloadedFiles.add(filename);
        console.log(`Processed and cached the filename: ${filename}`);
      })
      .catch(error => console.error('Error processing TTML2 file:', error));
  } else {
    console.log(`File ${filename} has already been processed.`);
  }
}

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
      console.log('TTML2 file detected. Processing...');
      
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