(() => {
  const request = indexedDB.open('memoDB', 1);
  request.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction('memos', 'readonly');
    const store = tx.objectStore('memos');
    const getReq = store.getAll();

    getReq.onsuccess = () => {
      getReq.result.forEach((memo) => {
        if (memo.value.length < 1) return;
        const memoItem = document.createElement('div');
        memoItem.className = 'memo-item';
        const hItem = document.createElement('h3');
        hItem.textContent = memo.id;
        hItem.addEventListener('click', () => {
          chrome.tabs.create({ url: `https://${memo.id}` });
        });

        const pItem = document.createElement('textarea');
        pItem.textContent = memo.value;
        pItem.disabled = true;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => {
          if (confirm('Warning! This action cannot be undone!')) {
            const deleteTx = db.transaction('memos', 'readwrite');
            const deleteStore = deleteTx.objectStore('memos');
            deleteStore.delete(memo.id);
            memoItem.remove();
          }
        };

        memoItem.appendChild(hItem);
        memoItem.appendChild(pItem);
        memoItem.appendChild(deleteButton);
        document.getElementById('memo-list').appendChild(memoItem);
      });

      // export to csv
      const exportButton = document.getElementById('export');
      exportButton.onclick = () => {
        let csvContent = 'ID,Value\n';
        getReq.result.forEach((memo) => {
          const escapedValue = memo.value.replace(/"/g, '""');
          csvContent += `${memo.id},"${escapedValue}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'memos.csv';
        a.click();
        URL.revokeObjectURL(url);
      };
    }
  };

})();