chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message == 'checkMemoAndUpdateIcon') {
    const { tabId, url } = message;
    checkMemoAndUpdateIcon(tabId, url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkMemoAndUpdateIcon(activeInfo.tabId, tab.url);
    }
  });
});

function checkMemoAndUpdateIcon(tabId, url) {
  const [domain] = extractDomainAndPath(url);
  getMemoFromDB(domain).then((memo) => {
    if (memo && memo?.value.length > 0) {
      chrome.action.setIcon({ tabId, path: "img/note_filled.png" });
    } else {
      chrome.action.setIcon({ tabId, path: "img/note_empty.png" });
    }
  });
}

const getMemoFromDB = async (domain) => {
  const request = indexedDB.open('memoDB', 1);
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('memos', 'readonly');
      const store = tx.objectStore('memos');
      const getReq = store.get(domain);

      getReq.onsuccess = () => {
        resolve(getReq.result);
      };
    };
  });
}

function extractDomainAndPath(url) {
  let domain, path;
  if (url.indexOf("://") > -1) {
    [domain, ...path] = url.split('/').slice(2);
  } else {
    [domain, ...path] = url.split('/');
  }
  domain = domain.split(':')[0];
  path = '/' + path.join('/').split('?')[0];
  return [domain, path];
}

