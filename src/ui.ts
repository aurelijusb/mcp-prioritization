/**
 * The MCP Apps view for the human_prioritization tool: a drag-and-drop
 * (and keyboard-driven) ordered list rendered by the host inside a
 * sandboxed iframe. Communicates with the host over postMessage JSON-RPC
 * per the MCP Apps spec (2026-01-26): ui/initialize handshake, then
 * ui/notifications/tool-input | tool-result to receive items, and a
 * ui/message request to post the prioritized list back into the chat.
 * Note: ui/message params.content is an ARRAY of content blocks
 * (ContentBlock[] in the ext-apps SDK) — a bare object is rejected.
 */
export const PRIORITIZATION_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Prioritize items</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff;
    --fg: #1a1a1a;
    --item-bg: #f4f4f5;
    --item-border: #d4d4d8;
    --accent: #6366f1;
    --muted: #71717a;
  }
  [data-theme="dark"] {
    --bg: #1e1e20;
    --fg: #ececef;
    --item-bg: #2a2a2e;
    --item-border: #3f3f46;
    --accent: #818cf8;
    --muted: #a1a1aa;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #1e1e20;
      --fg: #ececef;
      --item-bg: #2a2a2e;
      --item-border: #3f3f46;
      --accent: #818cf8;
      --muted: #a1a1aa;
    }
  }
  body {
    margin: 0;
    padding: 12px;
    background: var(--bg);
    color: var(--fg);
    font: 14px/1.4 system-ui, sans-serif;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0 0 10px;
  }
  .hint { color: var(--muted); font-size: 12px; margin: 0; }
  ol#list {
    list-style: none;
    counter-reset: prio;
    margin: 0 0 12px;
    padding: 0;
  }
  ol#list li {
    counter-increment: prio;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0;
    padding: 8px 10px;
    background: var(--item-bg);
    border: 1px solid var(--item-border);
    border-radius: 8px;
    cursor: grab;
    user-select: none;
  }
  ol#list li::before {
    content: counter(prio) ".";
    min-width: 1.5em;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  ol#list li:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  ol#list li.dragging { opacity: 0.4; }
  ol#list li .grip { color: var(--muted); }
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font: inherit;
    cursor: pointer;
  }
  button#send {
    background: var(--accent);
    color: #fff;
  }
  button#send:disabled { opacity: 0.5; cursor: default; }
  button#fullscreen {
    background: var(--item-bg);
    color: var(--fg);
    border: 1px solid var(--item-border);
    padding: 6px 10px;
    font-size: 12px;
    flex-shrink: 0;
  }
  #status { margin-left: 8px; color: var(--muted); font-size: 12px; }
</style>
</head>
<body>
<div class="toolbar">
  <p class="hint">Drag items to reorder, or focus an item (Tab) and press Alt+&#8593;/Alt+&#8595; to move it. &#8593;/&#8595; moves focus.</p>
  <button id="fullscreen" title="Toggle full screen">&#x26F6; Full screen</button>
</div>
<ol id="list" aria-label="Items to prioritize"></ol>
<button id="send" disabled>Send priorities to chat</button><span id="status"></span>
<script>
(function () {
  'use strict';
  var items = [];
  var nextId = 1;
  var pending = {}; // request id -> callback for the response
  var displayMode = 'inline';

  var list = document.getElementById('list');
  var sendButton = document.getElementById('send');
  var fullscreenButton = document.getElementById('fullscreen');
  var statusEl = document.getElementById('status');

  // --- JSON-RPC over postMessage ---------------------------------------
  function post(message) {
    window.parent.postMessage(message, '*');
  }
  function request(method, params, onResult) {
    var id = nextId++;
    pending[id] = onResult || function () {};
    post({ jsonrpc: '2.0', id: id, method: method, params: params });
  }
  function notify(method, params) {
    post({ jsonrpc: '2.0', method: method, params: params });
  }

  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (!msg || msg.jsonrpc !== '2.0') return;

    if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
      var cb = pending[msg.id];
      if (cb) { delete pending[msg.id]; cb(msg.result, msg.error); }
      return;
    }
    if (msg.method === 'ui/notifications/tool-input') {
      var args = (msg.params && msg.params.arguments) || {};
      if (Array.isArray(args.items)) setItems(args.items);
    } else if (msg.method === 'ui/notifications/tool-result') {
      var sc = msg.params && msg.params.structuredContent;
      if (sc && Array.isArray(sc.items) && items.length === 0) setItems(sc.items);
    }
  });

  // --- Size reporting ---------------------------------------------------
  // Report double the content height so the inline widget starts twice as
  // tall as the host's auto-fit default (host clamps to its maxHeight).
  function reportSize() {
    if (displayMode !== 'inline') return; // host owns size in fullscreen
    notify('ui/notifications/size-changed', {
      height: Math.ceil(document.documentElement.scrollHeight * 2)
    });
  }

  // --- Handshake --------------------------------------------------------
  request('ui/initialize', {
    protocolVersion: '2026-01-26',
    capabilities: {},
    clientInfo: { name: 'prioritization-view', version: '0.0.1' },
    appCapabilities: { availableDisplayModes: ['inline', 'fullscreen'] }
  }, function (result) {
    var ctx = (result && result.hostContext) || {};
    if (ctx.theme) document.documentElement.setAttribute('data-theme', ctx.theme);
    if (ctx.displayMode) setDisplayMode(ctx.displayMode);
    notify('ui/notifications/initialized', {});
    reportSize();
  });

  // --- Display mode -----------------------------------------------------
  function setDisplayMode(mode) {
    displayMode = mode;
    fullscreenButton.innerHTML = mode === 'fullscreen'
      ? '&#x2715; Exit full screen'
      : '&#x26F6; Full screen';
  }

  fullscreenButton.addEventListener('click', function () {
    var wanted = displayMode === 'fullscreen' ? 'inline' : 'fullscreen';
    request('ui/request-display-mode', { mode: wanted }, function (result) {
      // Host reports the mode actually set (may differ if unsupported).
      if (result && result.mode) setDisplayMode(result.mode);
      reportSize();
    });
  });

  // --- Rendering --------------------------------------------------------
  function setItems(newItems) {
    items = newItems.slice();
    render();
    sendButton.disabled = items.length === 0;
    reportSize();
  }

  function render(focusIndex) {
    list.textContent = '';
    items.forEach(function (text, index) {
      var li = document.createElement('li');
      li.draggable = true;
      li.tabIndex = 0;
      li.dataset.index = String(index);
      li.setAttribute('role', 'option');
      li.setAttribute('aria-label', 'Priority ' + (index + 1) + ': ' + text);

      var grip = document.createElement('span');
      grip.className = 'grip';
      grip.textContent = '\\u2261'; // ≡
      grip.setAttribute('aria-hidden', 'true');
      li.appendChild(grip);

      var label = document.createElement('span');
      label.textContent = text; // textContent — no HTML injection
      li.appendChild(label);

      list.appendChild(li);
      if (focusIndex === index) li.focus();
    });
  }

  function moveItem(from, to) {
    if (to < 0 || to >= items.length || from === to) return from;
    var moved = items.splice(from, 1)[0];
    items.splice(to, 0, moved);
    render(to);
    return to;
  }

  // --- Drag & drop ------------------------------------------------------
  var dragIndex = null;
  list.addEventListener('dragstart', function (e) {
    var li = e.target.closest('li');
    if (!li) return;
    dragIndex = Number(li.dataset.index);
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragIndex));
  });
  list.addEventListener('dragend', function (e) {
    var li = e.target.closest('li');
    if (li) li.classList.remove('dragging');
    dragIndex = null;
  });
  list.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });
  list.addEventListener('drop', function (e) {
    e.preventDefault();
    if (dragIndex === null) return;
    var li = e.target.closest('li');
    var to = li ? Number(li.dataset.index) : items.length - 1;
    moveItem(dragIndex, to);
    dragIndex = null;
  });

  // --- Keyboard ---------------------------------------------------------
  list.addEventListener('keydown', function (e) {
    var li = e.target.closest('li');
    if (!li) return;
    var index = Number(li.dataset.index);
    if ((e.altKey || e.ctrlKey) && e.key === 'ArrowUp') {
      e.preventDefault();
      moveItem(index, index - 1);
    } else if ((e.altKey || e.ctrlKey) && e.key === 'ArrowDown') {
      e.preventDefault();
      moveItem(index, index + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (li.previousElementSibling) li.previousElementSibling.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (li.nextElementSibling) li.nextElementSibling.focus();
    }
  });

  // --- Send back to chat ------------------------------------------------
  sendButton.addEventListener('click', function () {
    var markdown = items.map(function (text, i) {
      return (i + 1) + '. ' + text;
    }).join('\\n');
    sendButton.disabled = true;
    statusEl.textContent = 'Sending\\u2026';
    // content MUST be an array of content blocks (ContentBlock[]).
    request('ui/message', {
      role: 'user',
      content: [{ type: 'text', text: 'Prioritized:\\n' + markdown }]
    }, function (result, error) {
      sendButton.disabled = false;
      if (error) {
        statusEl.textContent = 'Failed: ' + (error.message || 'unknown error');
      } else if (result && result.isError) {
        statusEl.textContent = 'Host rejected the message';
      } else {
        statusEl.textContent = 'Sent \\u2713';
      }
    });
  });
})();
</script>
</body>
</html>
`;
