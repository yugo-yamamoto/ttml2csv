class DownloadedFiles {
  constructor() {
    this.files = new Map();
  }

  add(url, filename) {
    this.files.set(url, filename);
    this.updateBadge();
  }

  updateBadge() {
    chrome.action.setBadgeText({text: this.files.size.toString()});
  }
}

let downloadedFiles = new DownloadedFiles();

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

function convertToCsv(extractedData) {
  const header = '\uFEFFBegin,Text\n';
  const rows = extractedData.map(([begin, text]) => `"${begin}","${text}"`).join('\n');
  return header + rows;
}

function saveCsvToDownloads(csvData, filename) {
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

chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (details.url.toLowerCase().endsWith('.ttml2')) {
      console.log('TTML2 file detected:', details.url);
      let filename = details.url.split('/').pop();
      downloadedFiles.add(details.url, filename);
    }
  },
  {urls: ["<all_urls>"]},
  ["responseHeaders"]
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFiles") {
    sendResponse({files: Array.from(downloadedFiles.files.entries())});
  } else if (request.action === "fetchAndConvert") {
    fetch(request.url)
      .then(response => response.text())
      .then(ttml2Content => {
        const extractedData = extractTtml2Data(ttml2Content);
        const csvData = convertToCsv(extractedData);
        const filename = request.url.split('/').pop().replace('.ttml2', '.csv');
        saveCsvToDownloads(csvData, filename);
      })
      .catch(error => console.error('Error fetching TTML2 file:', error));
  }
  return true;
});