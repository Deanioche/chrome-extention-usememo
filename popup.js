document.addEventListener('DOMContentLoaded', async () => {
  const siteDomain = document.getElementById('site-domain');
  const saveStatus = document.getElementById('save-status');
  const memoContent = document.getElementById('memo-content');

  let db;
  const [domain, path] = await getCurrentUrl();
  siteDomain.textContent = `${domain}`;

  const request = indexedDB.open('memoDB', 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('memos')) {
      db.createObjectStore('memos', { keyPath: 'id' });
    }
  };

  request.onsuccess = async (event) => {
    if (!domain) {
      return;
    }

    const memo = await getMemoFromDB(domain);
    memoContent.value = memo?.value || '';
    saveStatus.textContent = `${memoContent.value.length} letters Saved`;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      if (!tabId) alert("tabId");
      let lt;
      clearTimeout(lt);
      lt = setTimeout(() => {
        if (memoContent.value.length === 0)
          chrome.action.setIcon({ tabId, path: "img/note_empty.png" });
        else
          chrome.action.setIcon({ tabId, path: "img/note_filled.png" });
      }, 200);
    });
  };

  memoContent.addEventListener('input', () => saveMemoToDB(domain, memoContent.value).then(() => {
    saveStatus.textContent = `${memoContent.value.length} letters Saved`;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

      const tabId = tabs[0].id;
      if (!tabId) alert("tabId");

      let lt;
      clearTimeout(lt);
      lt = setTimeout(() => {
        if (memoContent.value.length === 0)
          chrome.action.setIcon({ tabId, path: "img/note_empty.png" });
        else
          chrome.action.setIcon({ tabId, path: "img/note_filled.png" });
      }, 200);
    });
  }));
});

const saveMemoToDB = async (domain, value) => {
  const request = indexedDB.open('memoDB', 1);
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('memos', 'readwrite');
      const store = tx.objectStore('memos');
      store.put({ id: domain, value });
      resolve();
    };
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

async function getCurrentUrl() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        if (!tabs[0].url) {
          const memoContent = document.getElementById('memo-content');
          memoContent.textContent = "Unable to retrieve the URL. Please click the icon to activate the extension.";
          memoContent.disabled = true;
          reject("Unable to retrieve the URL. Please click the icon to activate the extension.");
        } else {
          resolve(extractDomainAndPath(tabs[0].url));
        }
      } else {
        reject("URL을 가져올 수 없습니다.");
      }
    });
  });
}