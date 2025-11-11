// --- API base ---------------------------------------------------------------
const API = 'http://localhost:4000/api';
const API_HOST = API.replace(/\/api$/, '');

// --- Admin auth (modal-based) ---
const AUTH_KEY = 'lf_auth';
const isAdmin = () => !!sessionStorage.getItem(AUTH_KEY);
const getAuthHeader = () => isAdmin() ? { Authorization: `Basic ${sessionStorage.getItem(AUTH_KEY)}` } : {};

function updateModeBar(){
  if (claimedSection) claimedSection.style.display = isAdmin() ? 'block' : 'none';
  const chip = document.getElementById('modeChip');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  chip.textContent = isAdmin() ? 'Admin mode' : 'Student mode';
  chip.className = isAdmin() ? 'chip chip-admin' : 'chip chip-student';
  loginBtn.style.display  = isAdmin() ? 'none' : 'inline-flex';
  logoutBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
}

// modal wiring
const adminModal = document.getElementById('adminModal');
document.getElementById('loginBtn').onclick = () => { adminModal.classList.remove('hidden'); document.getElementById('adminUser').focus(); };
document.getElementById('cancelLogin').onclick = () => adminModal.classList.add('hidden');
document.getElementById('logoutBtn').onclick = () => { sessionStorage.removeItem(AUTH_KEY); updateModeBar(); loadItems(); };

document.getElementById('adminLoginForm').onsubmit = async (e) => {
  e.preventDefault();
  const u = document.getElementById('adminUser').value;
  const p = document.getElementById('adminPass').value;
  const token = btoa(`${u}:${p}`);

  // probe a protected endpoint with auth header
  const ok = await fetch(`${API}/items?includeReturned=1`, {
    headers: { Authorization: `Basic ${token}` }
  }).then(r => r.ok).catch(() => false);
  if (!ok) return alert('Invalid username or password');

  sessionStorage.setItem(AUTH_KEY, token);
  adminModal.classList.add('hidden');
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  updateModeBar();
  loadItems(); // will include returned when admin
};



// --- DOM refs (keep existing IDs & classes) --------------------------------
const reportForm     = document.getElementById('reportForm');
const lostItemsGrid  = document.getElementById('lostItemsGrid');
const foundItemsGrid = document.getElementById('foundItemsGrid');
const searchLost     = document.getElementById('searchLost');
const searchFound    = document.getElementById('searchFound');
const imageInput     = document.getElementById('image');

// --- Claim modal DOM refs ---
const claimModal      = document.getElementById('claimModal');
const claimForm       = document.getElementById('claimForm');
const claimantNameInp = document.getElementById('claimantName');
const claimNoteInp    = document.getElementById('claimNote');
const claimConfirmChk = document.getElementById('claimConfirm');
const cancelClaimBtn  = document.getElementById('cancelClaim');
const confirmClaimBtn = document.getElementById('confirmClaimBtn');
const claimedSection  = document.getElementById('claimedSection');
const claimedItemsGrid= document.getElementById('claimedItemsGrid');
const searchClaimed   = document.getElementById('searchClaimed');
const itemsColumn     = document.querySelector('.items-display');

// Move claimed section into items column if not already there
if (claimedSection && itemsColumn && claimedSection.parentElement !== itemsColumn) {
  itemsColumn.appendChild(claimedSection);
}


let CLAIM_TARGET_ID = null; // which item we're claiming

function openClaimModal(itemId) {
  CLAIM_TARGET_ID = itemId;
  claimantNameInp.value = '';
  claimNoteInp.value = '';
  claimConfirmChk.checked = false;
  confirmClaimBtn.disabled = true;
  claimModal.classList.remove('hidden');
  setTimeout(() => claimantNameInp.focus(), 50);
}
function closeClaimModal() {
  claimModal.classList.add('hidden');
  CLAIM_TARGET_ID = null;
}

claimConfirmChk.addEventListener('change', () => {
  confirmClaimBtn.disabled = !claimConfirmChk.checked || !claimantNameInp.value.trim();
});
claimantNameInp.addEventListener('input', () => {
  confirmClaimBtn.disabled = !claimConfirmChk.checked || !claimantNameInp.value.trim();
});
cancelClaimBtn.addEventListener('click', closeClaimModal);

claimForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!CLAIM_TARGET_ID) return;
  if (!isAdmin()) { alert('Admin login required'); return; }

  const claimed_by  = claimantNameInp.value.trim();
  const claimed_note = claimNoteInp.value.trim();

  try {
    const res = await fetch(`${API}/items/${CLAIM_TARGET_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status: 'returned', claimed_by, claimed_note })
    });
    if (res.status === 401) { alert('Admin login required'); return; }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'Claim failed');
    }
    closeClaimModal();
    await loadItems();
  } catch (err) {
    alert(err.message || 'Claim failed');
  }
});

// --- Small helpers ----------------------------------------------------------
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '';
function createBtn(text, id, status) {
  const b = document.createElement('button');
  b.textContent = text;
  b.className = 'btn-status';
  b.dataset.id = id;
  b.dataset.status = status;
  return b;
}

// === Date limits (today max, ~1 year back min) ==============================
function yyyyMmDd(d) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10); // YYYY-MM-DD
}
function setDateLimits() {
  const dateInput = document.getElementById('date_found');
  if (!dateInput) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const lastYear = new Date(today); lastYear.setDate(today.getDate() - 365);
  dateInput.max = yyyyMmDd(today);
  dateInput.min = yyyyMmDd(lastYear);
}

// Build one item card without breaking your CSS classes
function createItemCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card';

  const h3 = document.createElement('h3');
  h3.textContent = item.name;
  card.appendChild(h3);

  const imgBox = document.createElement('div');
  imgBox.className = 'item-image';
  if (item.image_url) {
    imgBox.textContent = '';
    const img = new Image();

    // --- normalize path and prefix host when needed ---
    let imgUrl = String(item.image_url || "").replace(/\\/g, "/");
    if (imgUrl.startsWith("uploads/")) imgUrl = "/" + imgUrl;
    const src = imgUrl.startsWith("/uploads/") ? `${API_HOST}${imgUrl}` : imgUrl;
    img.src = src;
    
    img.style.width = '100%';
    img.style.height = '180px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    imgBox.classList.add('has-image');
    imgBox.appendChild(img);
  }
  card.appendChild(imgBox);

  const desc = document.createElement('p');
  desc.className = 'item-details';
  desc.innerHTML = `<strong>Description:</strong> ${item.description ?? ''}`;
  card.appendChild(desc);

  const loc = document.createElement('p');
  loc.className = 'item-details';
  loc.innerHTML = `<strong>Last seen:</strong> ${item.location_found ?? ''}`;
  card.appendChild(loc);

  const dt = document.createElement('p');
  dt.className = 'item-details';
  dt.innerHTML = `<strong>Date:</strong> ${fmtDate(item.date_found)}`;
  card.appendChild(dt);

  const badge = document.createElement('span');
  let badgeClass = 'status-lost', badgeText = 'LOST';
  if (item.status === 'found') { badgeClass = 'status-found'; badgeText = 'FOUND'; }
  if (item.status === 'returned') { badgeClass = 'status-claimed'; badgeText = 'CLAIMED'; }
  badge.className = `status-badge ${badgeClass}`;
  badge.textContent = badgeText;
  card.appendChild(badge);

  // action buttons (Sprint 1: only allow -> returned)
  const actions = document.createElement('div');
  actions.style.marginTop = '10px';
  actions.style.display = 'flex';
  actions.style.gap = '8px';

  if (isAdmin() && item.status !== 'returned') {
    actions.appendChild(createBtn('Mark returned', item.item_id, 'returned'));
  }

  if (actions.children.length) card.appendChild(actions);
  return card;
}

// --- Render & load ----------------------------------------------------------
function renderItems(items) {
  lostItemsGrid.innerHTML = '';
  foundItemsGrid.innerHTML = '';
  if (claimedItemsGrid) claimedItemsGrid.innerHTML = '';

  items.forEach(item => {
    const card = createItemCard(item);

    if (item.status === 'lost') {
      lostItemsGrid.appendChild(card);
      return;
    }
    if (item.status === 'found') {
      foundItemsGrid.appendChild(card);
      return;
    }
    // Returned → show only in the Claimed panel (admin only)
    if (item.status === 'returned' && isAdmin() && claimedItemsGrid) {
      // Add claim metadata line if present
      if (item.claimed_by || item.claimed_at || item.claimed_by_admin) {
        const meta = document.createElement('p');
        meta.className = 'item-details';
        const when = item.claimed_at ? fmtDate(item.claimed_at) : '';
        meta.innerHTML =
          `<strong>Claimed by:</strong> ${item.claimed_by || '-'} ` +
          (when ? ` • <strong>Date:</strong> ${when}` : '') +
          (item.claimed_by_admin ? ` • <strong>Processed by:</strong> ${item.claimed_by_admin}` : '');
        card.appendChild(meta);
      }
      claimedItemsGrid.appendChild(card);
    }
  });
}

async function loadItems({ status = '', search = '' } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (search) qs.set('search', search);
  if (isAdmin()) qs.set('includeReturned', '1');
  const res = await fetch(`${API}/items?${qs.toString()}`, { headers: getAuthHeader() });

  if (!res.ok) throw new Error('Failed to load items');
  const data = await res.json();
  renderItems(data);
}

// --- Submit: create item (POST /api/items) ----------------------------------
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = reportForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  try {
    // --- date guard (UI) ----------------------------------------------------
    const dateInput = document.getElementById('date_found');
    const dateStr = dateInput.value;
    const picked = new Date(dateStr); picked.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if (!dateStr || Number.isNaN(+picked)) {
      throw new Error('Please choose a valid date.');
    }
    if (picked > today) {
      alert('Date cannot be in the future.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }
    // -----------------------------------------------------------------------

    // Build multipart payload from the form (includes the file name="image")
    const fd = new FormData(reportForm);

    // Normalize status in case the <select> text isn't literally "lost"/"found"
    const rawStatus = (fd.get('status') || 'lost').toLowerCase();
    fd.set('status', rawStatus.includes('found') ? 'found' : 'lost');

    const res = await fetch(`${API}/items`, {
      method: 'POST',
      body: fd // IMPORTANT: don't set Content-Type manually
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Submit failed (${res.status}). ${text}`);
    }

    // Success UI (unchanged)
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    reportForm.reset();

    const existingPreview = imageInput.parentElement.querySelector('img');
    if (existingPreview) existingPreview.remove();

    const successMsg = document.createElement('div');
    successMsg.textContent = '✓ Item reported successfully!';
    successMsg.style.cssText = 'background:#4caf50;color:white;padding:15px;border-radius:8px;margin-top:15px;text-align:center;animation:fadeIn .3s;';
    reportForm.appendChild(successMsg);
    setTimeout(() => {
      successMsg.style.animation = 'fadeOut .3s';
      setTimeout(() => successMsg.remove(), 300);
    }, 3000);

    await loadItems();
  } catch (err) {
    alert(err.message || 'Something went wrong');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// --- Status change (intercept 'returned' to open claim modal) ---------------
document.addEventListener('click', (e) => {
  if (!e.target.matches('.btn-status')) return;
  const id = e.target.dataset.id;
  const next = e.target.dataset.status;

  // For claiming, open the modal to collect claimant + confirmation
  if (next === 'returned') {
    if (!isAdmin()) { alert('Admin login required'); return; }
    openClaimModal(id);
    return;
  }

});

// --- Keep your existing search + preview features ---------------------------
searchLost.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const itemCards = lostItemsGrid.querySelectorAll('.item-card');
  itemCards.forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    const description = card.querySelector('.item-details').textContent.toLowerCase();
    card.style.display = (name.includes(searchTerm) || description.includes(searchTerm)) ? 'block' : 'none';
    if (card.style.display === 'block') card.style.animation = 'fadeIn 0.3s';
  });
});

searchFound.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const itemCards = foundItemsGrid.querySelectorAll('.item-card');
  itemCards.forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    const description = card.querySelector('.item-details').textContent.toLowerCase();
    card.style.display = (name.includes(searchTerm) || description.includes(searchTerm)) ? 'block' : 'none';
    if (card.style.display === 'block') card.style.animation = 'fadeIn 0.3s';
  });
});

if (searchClaimed) {
  searchClaimed.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const cards = claimedItemsGrid.querySelectorAll('.item-card');
    cards.forEach(card => {
      const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const details = Array.from(card.querySelectorAll('.item-details'))
                           .map(p => p.textContent.toLowerCase()).join(' ');
      const show = name.includes(q) || details.includes(q);
      card.style.display = show ? 'block' : 'none';
      if (show) card.style.animation = 'fadeIn 0.3s';
    });
  });
}


imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.createElement('img');
      preview.src = event.target.result;
      preview.style.cssText = 'width:100%;max-width:200px;height:150px;object-fit:cover;border-radius:8px;margin-top:10px;border:2px solid #667eea;';
      const existingPreview = imageInput.parentElement.querySelector('img');
      if (existingPreview) existingPreview.remove();
      imageInput.parentElement.appendChild(preview);
    };
    reader.readAsDataURL(file);
  }
});

// === Date limits (today max, ~1 year back min) ==============================
function yyyyMmDd(d) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10); // YYYY-MM-DD
}

function setDateLimits() {
  const dateInput = document.getElementById('date_found');
  if (!dateInput) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const lastYear = new Date(today); lastYear.setDate(today.getDate() - 365);
  dateInput.max = yyyyMmDd(today);
  dateInput.min = yyyyMmDd(lastYear);
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  updateModeBar();
  setDateLimits();
  loadItems().catch(console.error);
});
