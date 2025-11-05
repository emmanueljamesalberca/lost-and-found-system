// --- API base ---------------------------------------------------------------
const API = 'http://localhost:4000/api';
const API_HOST = API.replace(/\/api$/, '');

// --- DOM refs (keep existing IDs & classes) --------------------------------
const reportForm     = document.getElementById('reportForm');
const lostItemsGrid  = document.getElementById('lostItemsGrid');
const foundItemsGrid = document.getElementById('foundItemsGrid');
const searchLost     = document.getElementById('searchLost');
const searchFound    = document.getElementById('searchFound');
const imageInput     = document.getElementById('image');

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
  badge.className = `status-badge ${item.status === 'found' ? 'status-found' : 'status-lost'}`;
  badge.textContent = item.status.toUpperCase();
  card.appendChild(badge);

  // action buttons (keep simple; only show when change makes sense)
  const actions = document.createElement('div');
  actions.style.marginTop = '10px';
  actions.style.display = 'flex';
  actions.style.gap = '8px';

  if (item.status !== 'found')     actions.appendChild(createBtn('Mark found',    item.item_id, 'found'));
  if (item.status !== 'returned')  actions.appendChild(createBtn('Mark returned', item.item_id, 'returned'));

  if (actions.children.length) card.appendChild(actions);
  return card;
}

// --- Render & load ----------------------------------------------------------
function renderItems(items) {
  // clear grids (this also removes the static sample cards in index.html)
  lostItemsGrid.innerHTML = '';
  foundItemsGrid.innerHTML = '';

  items.forEach(it => {
    const card = createItemCard(it);
    (it.status === 'found' ? foundItemsGrid : lostItemsGrid).appendChild(card);
  });
}

async function loadItems({ status = '', search = '' } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (search) qs.set('search', search);
  const res = await fetch(`${API}/items?${qs.toString()}`);
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

// --- Status change (PATCH /api/items/:id/status) ----------------------------
document.addEventListener('click', async (e) => {
  if (!e.target.matches('.btn-status')) return;
  const btn = e.target;
  btn.disabled = true;
  try {
    const id = btn.dataset.id;
    const status = btn.dataset.status;
    const res = await fetch(`${API}/items/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Status update failed');
    await loadItems();
  } catch (err) {
    alert(err.message || 'Update failed');
  } finally {
    btn.disabled = false;
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

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadItems().catch(err => console.error(err));
});