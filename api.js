const iframe = document.createElement('iframe');
iframe.src = 'iframe.html';
iframe.style.cssText = 'display: none;';
document.body.appendChild(iframe);

let win = null;
const queue = [];
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
iframe.addEventListener('load', e => {
  win = iframe.contentWindow;

  for (let i = 0; i < queue.length; i++) {
    win.postMessage(queue[i], '*');
  }
  queue.length = 0;

  window.onmessage = e => {
    const {data} = e;
    const {id, error = null, result = null} = data;
    queues[id](error, result);
    queues[id] = null;
    _cleanupQueues();
  };
});
iframe.addEventListener('error', err => {
  console.warn(err);
});

const _request = (method, args) => new Promise((accept, reject) => {
  const id = ids++;
  const e = {
    id,
    method,
    args,
  };
  if (win) {
   win.postMessage(e, '*');
  } else {
    queue.push(e);
  }
  queues[id] = (err, result) => {
    if (!err) {
      accept(result);
    } else {
      reject(err);
    }
  };
});

module.exports = {
  get: key => _request('get', {key}),
  set: (key, value) => _request('set', {key, value}),
  remove: key => _request('remove', {key}),
};
