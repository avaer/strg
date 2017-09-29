module.exports = src => new Promise((accept, reject) => {
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.style.cssText = 'display: none;';
  document.body.appendChild(iframe);
  iframe.addEventListener('load', e => {
    const win = iframe.contentWindow;
     
    let ids = 0;
    const queues = {};
    let numRemovedQueues = 0;
    const _cleanupQueues = () => {
      if (++numRemovedQueues >= 16) {
        const newQueues = {};
        for (const id in queues) {
          const entry = queues[id];
          if (entry !== null) {
            newQueues[id] = entry;
          }
        }
        queues = newQueues;
        numRemovedQueues = 0;
      }
    };

    accept({
      get: key => new Promise((accept, reject) => {
        const id = ids++;
        win.postMessage({
          id,
          method: 'get',
          args: {
            key,
          },
        }, '*');
        queues[id] = (err, result) => {
          if (!err) {
            accept(result);
          } else {
            reject(err);
          }
        };
      }),
      set: (key, value) => new Promise((accept, reject) => {
        const id = ids++;
        win.postMessage({
          id,
          method: 'set',
          args: {
            key,
            value,
          },
        }, '*');
        queues[id] = (err, result) => {
          if (!err) {
            accept(result);
          } else {
            reject(err);
          }
        };
      }),
      remove: key => new Promise((accept, reject) => {
        const id = ids++;
        win.postMessage({
          id,
          method: 'remove',
          args: {
            key,
          },
        }, '*');
        queues[id] = (err, result) => {
          if (!err) {
            accept(result);
          } else {
            reject(err);
          }
        };
      }),
    });

    window.onmessage = e => {
      const {data} = e;
      const {id, error = null, result = null} = data;
      queues[id](error, result);
      queues[id] = null;
      _cleanupQueues();
    };

    /* const win = iframe.contentWindow;
    let ids = 0;
    win.postMessage({
      id: ids++,
      method: 'set',
      args: {
        key: 'lol',
        value: 'zol',
      },
    }, '*'); */
  });
  iframe.addEventListener('error', err => {
    reject(err);
  });
});
