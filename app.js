// app.js — Adoresa Container Builder

const BACKEND_URL = 'https://claorusea.onrender.com';

// ─── STATE ──────────────────────────────────────────────
let messages = [
  {
    id: Date.now(),
    open: true,
    containers: [
      {
        id: Date.now() + 1,
        color: null,
        open: true,
        components: [],
      },
    ],
  },
];

// ─── RENDER ─────────────────────────────────────────────
function render() {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';

  messages.forEach((msg, msgIdx) => {
    const msgEl = document.createElement('div');
    msgEl.className = 'message';

    const header = document.createElement('div');
    header.className = 'message-header';
    header.innerHTML = `
      <div class="message-title">
        <span class="arrow ${msg.open ? 'open' : ''}">▶</span>
        Message ${msgIdx + 1}
      </div>
      <div class="message-actions">
        <button class="btn-secondary" onclick="event.stopPropagation(); duplicateMessage(${msgIdx})">📋</button>
        <button class="btn-danger" onclick="event.stopPropagation(); deleteMessage(${msgIdx})">🗑</button>
      </div>
    `;
    header.onclick = () => { msg.open = !msg.open; render(); };
    msgEl.appendChild(header);

    const body = document.createElement('div');
    body.className = 'message-body' + (msg.open ? ' open' : '');

    msg.containers.forEach((cont, contIdx) => {
      body.appendChild(buildContainerEl(msgIdx, cont, contIdx));
    });

    const addContainerBtn = document.createElement('button');
    addContainerBtn.className = 'btn-add';
    addContainerBtn.textContent = '+ Add Container';
    addContainerBtn.onclick = () => addContainer(msgIdx);
    body.appendChild(addContainerBtn);

    msgEl.appendChild(body);
    container.appendChild(msgEl);
  });

  updateJson();
}

function buildContainerEl(msgIdx, cont, contIdx) {
  const el = document.createElement('div');
  el.className = 'container-item';

  const header = document.createElement('div');
  header.className = 'container-header';
  header.innerHTML = `
    <div class="container-title">
      <span class="arrow ${cont.open ? 'open' : ''}">▶</span>
      Container ${contIdx + 1}
    </div>
    <div class="component-actions">
      <button class="btn-secondary" onclick="event.stopPropagation(); duplicateContainer(${msgIdx}, ${contIdx})">📋</button>
      <button class="btn-danger" onclick="event.stopPropagation(); deleteContainer(${msgIdx}, ${contIdx})">🗑</button>
    </div>
  `;
  header.onclick = () => { cont.open = !cont.open; render(); };
  el.appendChild(header);

  const body = document.createElement('div');
  body.className = 'container-body' + (cont.open ? ' open' : '');

  // Color
  const colorDiv = document.createElement('div');
  colorDiv.innerHTML = `
    <label>Sidebar Color</label>
    <div class="color-row">
      <input type="color" value="${cont.color || '#5865F2'}" onchange="setContainerColor(${msgIdx}, ${contIdx}, this.value)">
      <span class="color-hint">${cont.color ? cont.color : 'Default'}</span>
      ${cont.color ? `<button class="btn-danger" onclick="setContainerColor(${msgIdx}, ${contIdx}, null)">Clear</button>` : ''}
    </div>
  `;
  body.appendChild(colorDiv);

  // Components
  cont.components.forEach((comp, compIdx) => {
    body.appendChild(buildComponentEl(msgIdx, contIdx, comp, compIdx));
  });

  const addCompBtn = document.createElement('button');
  addCompBtn.className = 'btn-add';
  addCompBtn.textContent = '+ Add Component';
  addCompBtn.onclick = () => showAddComponentMenu(msgIdx, contIdx);
  body.appendChild(addCompBtn);

  el.appendChild(body);
  return el;
}

function buildComponentEl(msgIdx, contIdx, comp, compIdx) {
  const el = document.createElement('div');
  el.className = 'component';

  const typeNames = {
    10: 'Content',
    14: 'Separator',
    12: 'Media Gallery',
    1: 'Row',
  };

  const header = document.createElement('div');
  header.className = 'component-header';
  header.innerHTML = `
    <span class="component-type">${typeNames[comp.type] || 'Unknown'}</span>
    <div class="component-actions">
      <button class="btn-secondary" onclick="moveComponent(${msgIdx}, ${contIdx}, ${compIdx}, -1)">↑</button>
      <button class="btn-secondary" onclick="moveComponent(${msgIdx}, ${contIdx}, ${compIdx}, 1)">↓</button>
      <button class="btn-danger" onclick="deleteComponent(${msgIdx}, ${contIdx}, ${compIdx})">🗑</button>
    </div>
  `;
  el.appendChild(header);

  if (comp.type === 10) {
    const ta = document.createElement('textarea');
    ta.value = comp.content || '';
    ta.placeholder = 'Escribe el texto...';
    ta.oninput = () => { comp.content = ta.value; updateJson(); };
    el.appendChild(ta);
  }

  if (comp.type === 14) {
    const select = document.createElement('select');
    select.innerHTML = `
      <option value="1" ${comp.spacing !== 2 ? 'selected' : ''}>Small spacing</option>
      <option value="2" ${comp.spacing === 2 ? 'selected' : ''}>Large spacing</option>
    `;
    select.onchange = () => { comp.spacing = parseInt(select.value); updateJson(); };
    el.appendChild(select);
  }

  if (comp.type === 12) {
    if (!comp.items) comp.items = [{ media: { url: '' } }];
    comp.items.forEach((item, i) => {
      const input = document.createElement('input');
      input.type = 'url';
      input.value = item.media?.url || '';
      input.placeholder = 'https://ejemplo.com/imagen.png';
      input.oninput = () => {
        item.media = item.media || {};
        item.media.url = input.value;
        updateJson();
      };
      el.appendChild(input);
    });
    const addImgBtn = document.createElement('button');
    addImgBtn.className = 'btn-add';
    addImgBtn.textContent = '+ Add Image';
    addImgBtn.onclick = () => { comp.items.push({ media: { url: '' } }); render(); };
    el.appendChild(addImgBtn);
  }

  if (comp.type === 1) {
    if (!comp.components) comp.components = [];
    comp.components.forEach((btn, i) => {
      const wrapper = document.createElement('div');
      wrapper.style.marginTop = '6px';
      wrapper.innerHTML = `<label>Button ${i + 1}</label>`;

      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = btn.label || '';
      labelInput.placeholder = 'Button label';
      labelInput.oninput = () => { btn.label = labelInput.value; updateJson(); };
      wrapper.appendChild(labelInput);

      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.value = btn.url || '';
      urlInput.placeholder = 'https://...';
      urlInput.oninput = () => { btn.url = urlInput.value; updateJson(); };
      wrapper.appendChild(urlInput);

      const del = document.createElement('button');
      del.className = 'btn-danger';
      del.textContent = 'Remove';
      del.style.marginTop = '4px';
      del.onclick = () => { comp.components.splice(i, 1); render(); };
      wrapper.appendChild(del);

      el.appendChild(wrapper);
    });

    const addBtnBtn = document.createElement('button');
    addBtnBtn.className = 'btn-add';
    addBtnBtn.textContent = '+ Add Button';
    addBtnBtn.onclick = () => { comp.components.push({ type: 2, style: 5, label: '', url: '' }); render(); };
    el.appendChild(addBtnBtn);
  }

  return el;
}

// ─── ADD COMPONENT ──────────────────────────────────────
function showAddComponentMenu(msgIdx, contIdx) {
  const choice = prompt(
    'Choose component:\n1 = Content (text)\n2 = Separator\n3 = Media Gallery\n4 = Row (buttons)\n\nEnter number:'
  );
  const cont = messages[msgIdx].containers[contIdx];
  if (choice === '1') cont.components.push({ type: 10, content: '' });
  else if (choice === '2') cont.components.push({ type: 14, spacing: 2 });
  else if (choice === '3') cont.components.push({ type: 12, items: [{ media: { url: '' } }] });
  else if (choice === '4') cont.components.push({ type: 1, components: [] });
  else return;
  render();
}

// ─── ACTIONS ────────────────────────────────────────────
function addMessage() {
  messages.push({
    id: Date.now(),
    open: true,
    containers: [{ id: Date.now() + 1, color: null, open: true, components: [] }],
  });
  render();
}
function deleteMessage(idx) {
  if (!confirm('Delete this message?')) return;
  messages.splice(idx, 1);
  if (messages.length === 0) addMessage();
  else render();
}
function duplicateMessage(idx) {
  const copy = JSON.parse(JSON.stringify(messages[idx]));
  messages.splice(idx + 1, 0, copy);
  render();
}
function addContainer(msgIdx) {
  messages[msgIdx].containers.push({ id: Date.now(), color: null, open: true, components: [] });
  render();
}
function deleteContainer(msgIdx, contIdx) {
  if (!confirm('Delete this container?')) return;
  messages[msgIdx].containers.splice(contIdx, 1);
  if (messages[msgIdx].containers.length === 0) {
    messages[msgIdx].containers.push({ id: Date.now(), color: null, open: true, components: [] });
  }
  render();
}
function duplicateContainer(msgIdx, contIdx) {
  const copy = JSON.parse(JSON.stringify(messages[msgIdx].containers[contIdx]));
  messages[msgIdx].containers.splice(contIdx + 1, 0, copy);
  render();
}
function setContainerColor(msgIdx, contIdx, color) {
  messages[msgIdx].containers[contIdx].color = color;
  render();
}
function deleteComponent(msgIdx, contIdx, compIdx) {
  messages[msgIdx].containers[contIdx].components.splice(compIdx, 1);
  render();
}
function moveComponent(msgIdx, contIdx, compIdx, dir) {
  const comps = messages[msgIdx].containers[contIdx].components;
  const newIdx = compIdx + dir;
  if (newIdx < 0 || newIdx >= comps.length) return;
  [comps[compIdx], comps[newIdx]] = [comps[newIdx], comps[compIdx]];
  render();
}

// ─── JSON ───────────────────────────────────────────────
function buildPayload() {
  const allComponents = [];
  for (const msg of messages) {
    for (const cont of msg.containers) {
      const comps = [];
      for (const comp of cont.components) {
        if (comp.type === 10 && !comp.content?.trim()) continue;
        if (comp.type === 12 && (!comp.items || !comp.items[0]?.media?.url)) continue;
        if (comp.type === 1 && (!comp.components || comp.components.length === 0)) continue;
        comps.push(comp);
      }
      if (comps.length === 0) continue;
      allComponents.push({
        type: 17,
        accent_color: cont.color,
        components: comps,
      });
    }
  }
  return { components: allComponents };
}

function updateJson() {
  const payload = buildPayload();
  document.getElementById('jsonOutput').value = JSON.stringify(payload, null, 2);
}

function copyJson() {
  const output = document.getElementById('jsonOutput');
  output.select();
  output.setSelectionRange(0, 99999);
  try { navigator.clipboard.writeText(output.value); }
  catch { document.execCommand('copy'); }
  const status = document.getElementById('copyStatus');
  status.textContent = '✅ Copied!';
  status.className = 'status ok';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

// ─── SEND ───────────────────────────────────────────────
async function sendToDiscord() {
  const password = document.getElementById('password').value.trim();
  const channelId = document.getElementById('channelSelect').value;
  const status = document.getElementById('sendStatus');

  if (!password) { status.textContent = '❌ Enter password'; status.className = 'status err'; return; }
  if (!channelId) { status.textContent = '❌ Select a channel'; status.className = 'status err'; return; }

  status.textContent = '⏳ Sending...';
  status.className = 'status';

  const payload = buildPayload();

  if (payload.components.length === 0) {
    status.textContent = '❌ Nothing to send';
    status.className = 'status err';
    return;
  }

  try {
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      status.textContent = '❌ ' + (loginData.error || 'Login failed');
      status.className = 'status err';
      return;
    }

    const token = loginData.token;
    let sentCount = 0;

    for (const cont of payload.components) {
      const sendRes = await fetch(`${BACKEND_URL}/api/send-container`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          channelId,
          payload: { accent_color: cont.accent_color, components: [cont] },
        }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        status.textContent = `❌ Error #${sentCount + 1}: ` + (sendData.error || 'Unknown');
        status.className = 'status err';
        return;
      }
      sentCount++;
      await new Promise(r => setTimeout(r, 300));
    }

    status.textContent = `✅ Sent ${sentCount} container(s)!`;
    status.className = 'status ok';
  } catch (err) {
    status.textContent = '❌ Network error: ' + err.message;
    status.className = 'status err';
  }
}

// ─── CHANNELS ───────────────────────────────────────────
async function loadChannels() {
  const password = document.getElementById('password').value.trim();
  const select = document.getElementById('channelSelect');

  if (!password) {
    select.innerHTML = '<option value="">Enter password first</option>';
    return;
  }

  select.innerHTML = '<option value="">Loading channels...</option>';

  try {
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      select.innerHTML = '<option value="">Wrong password</option>';
      return;
    }

    const channelsRes = await fetch(`${BACKEND_URL}/api/get-channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: loginData.token }),
    });
    const channelsData = await channelsRes.json();

    if (!channelsRes.ok) {
      select.innerHTML = '<option value="">Error loading channels</option>';
      return;
    }

    select.innerHTML = '<option value="">Select a channel...</option>';

    for (const [category, channels] of Object.entries(channelsData.categories)) {
      const group = document.createElement('optgroup');
      group.label = category;
      for (const ch of channels) {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = '# ' + ch.name;
        group.appendChild(opt);
      }
      select.appendChild(group);
    }
  } catch (err) {
    select.innerHTML = '<option value="">Network error</option>';
  }
}

// ─── INIT ───────────────────────────────────────────────
document.getElementById('password').addEventListener('blur', loadChannels);
render();