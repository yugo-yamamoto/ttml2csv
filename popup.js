document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.sendMessage({action: "getFiles"}, function(response) {
    const fileList = document.getElementById('fileList');
    if (response.files.length > 0) {
      response.files.forEach(([url, filename]) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = filename;
        link.addEventListener('click', function(e) {
          e.preventDefault();
          chrome.runtime.sendMessage({action: "fetchAndConvert", url: url});
        });
        fileList.appendChild(link);
        fileList.appendChild(document.createElement('br'));
      });
    } else {
      fileList.textContent = 'No TTML2 files detected yet.';
    }
  });
});