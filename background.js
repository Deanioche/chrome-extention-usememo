chrome.runtime.onInstalled.addListener(() => {
  // 우클릭 메뉴 추가
  chrome.contextMenus.create({
    id: "openManager",
    title: "Manage Data",
    contexts: ["action"], // 아이콘 우클릭 시만 표시
  });
});

// 메뉴 클릭 이벤트 핸들러
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openManager") {
    // 전체 보기 페이지 열기
    chrome.tabs.create({
      url: chrome.runtime.getURL("manage.html"), // 확장 내부 페이지
    });
  }
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message == 'checkMemoAndUpdateIcon') {
//     const { tabId, url } = message;
//     checkMemoAndUpdateIcon(tabId, url);
//   }
// });

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkMemoAndUpdateIcon(activeInfo.tabId, tab.url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    checkMemoAndUpdateIcon(tabId, changeInfo.url);
  }
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

