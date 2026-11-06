let equipmentState = [];
let usersState = [];
let transactionsState = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchAllData();
});

async function fetchAllData() {
  await Promise.all([loadEquipment(), loadUsers(), loadTransactions()]);
  updateDashboard();
}

async function loadEquipment() {
  try {
    const res = await fetch('/api/equipment');
    const data = await res.json();
    // ఒకవేళ డేటా నేరుగా అరే కాకపోతే, ప్రాపర్టీ నుండి అరే వెలికితీసేలా సేఫ్టీ చెక్
    equipmentState = Array.isArray(data) ? data : (data.equipment || data.data || []);
    renderEquipment();
  } catch (err) {
    console.error('Error loading equipment:', err);
    equipmentState = [];
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    usersState = Array.isArray(data) ? data : (data.users || data.data || []);
    renderUsers();
  } catch (err) {
    console.error('Error loading users:', err);
    usersState = [];
  }
}

async function loadTransactions() {
  try {
    const res = await fetch('/api/issues');
    const data = await res.json();
    transactionsState = Array.isArray(data) ? data : (data.issues || data.data || []);
    renderTransactions();
  } catch (err) {
    console.error('Error loading transactions:', err);
    transactionsState = [];
  }
}

function updateDashboard() {
  const items = Array.isArray(equipmentState) ? equipmentState : [];
  const users = Array.isArray(usersState) ? usersState : [];

  const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const availableUnits = items.reduce((sum, item) => sum + (Number(item.available_quantity) || 0), 0);
  const issuedUnits = totalItems - availableUnits;

  const totalItemsEl = document.getElementById('stat-total-items');
  const availableUnitsEl = document.getElementById('stat-available-units');
  const issuedUnitsEl = document.getElementById('stat-issued-units');
  const totalUsersEl = document.getElementById('stat-total-users');

  if (totalItemsEl) totalItemsEl.textContent = totalItems;
  if (availableUnitsEl) availableUnitsEl.textContent = availableUnits;
  if (issuedUnitsEl) issuedUnitsEl.textContent = issuedUnits;
  if (totalUsersEl) totalUsersEl.textContent = users.length;
}

function renderEquipment() {
  const searchInput = document.getElementById('eq-search');
  const catSelect = document.getElementById('eq-filter-category');
  const statusSelect = document.getElementById('eq-filter-status');

  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const cat = catSelect ? catSelect.value : '';
  const status = statusSelect ? statusSelect.value : '';

  const tbody = document.getElementById('equipment-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const items = Array.isArray(equipmentState) ? equipmentState : [];
  const filtered = items.filter(item => {
    const nameMatch = item.name ? item.name.toLowerCase().includes(search) : false;
    const catMatch = !cat || item.category === cat;
    const statusMatch = !status || item.status === status;
    return nameMatch && catMatch && statusMatch;
  });

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.equipment_id}</td>
      <td><strong>${item.name || ''}</strong></td>
      <td>${item.category || ''}</td>
      <td>${item.quantity || 0}</td>
      <td>${item.available_quantity || 0}</td>
      <td><span class="badge badge-${(item.status || '').toLowerCase()}">${item.status || ''}</span></td>
      <td>
        <button class="btn btn-edit" onclick="editEquipment(${item.equipment_id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteEquipment(${item.equipment_id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderUsers() {
  const searchInput = document.getElementById('user-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const users = Array.isArray(usersState) ? usersState : [];
  const filtered = users.filter(u => {
    const nameMatch = u.name ? u.name.toLowerCase().includes(search) : false;
    const emailMatch = u.email ? u.email.toLowerCase().includes(search) : false;
    return nameMatch || emailMatch;
  });

  filtered.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.user_id}</td>
      <td>${u.name || ''}</td>
      <td>${u.email || ''}</td>
      <td><span class="badge">${u.role || ''}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTransactions() {
  const tbody = document.getElementById('transactions-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const transactions = Array.isArray(transactionsState) ? transactionsState : [];
  transactions.forEach(tx => {
    const tr = document.createElement('tr');
    const isReturned = tx.status === 'Returned';
    tr.innerHTML = `
      <td>${tx.issue_id}</td>
      <td>${tx.equipment_name || ''}</td>
      <td>${tx.user_name || ''}</td>
      <td>${tx.quantity || 0}</td>
      <td>${tx.issue_date ? tx.issue_date.slice(0, 10) : ''}</td>
      <td>${tx.return_date ? tx.return_date.slice(0, 10) : '-'}</td>
      <td><span class="badge badge-${isReturned ? 'available' : 'unavailable'}">${tx.status || ''}</span></td>
      <td>
        ${!isReturned ? `<button class="btn btn-secondary" onclick="returnEquipment(${tx.issue_id})">Return</button>` : '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabName}`);
  if (targetView) targetView.classList.add('active');
  
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
}

function openEquipmentModal() {
  document.getElementById('form-equipment').reset();
  document.getElementById('eq-id').value = '';
  document.getElementById('modal-eq-title').textContent = 'Add New Equipment';
  document.getElementById('modal-equipment').classList.remove('hidden');
}

function editEquipment(id) {
  const items = Array.isArray(equipmentState) ? equipmentState : [];
  const item = items.find(e => e.equipment_id === id);
  if (!item) return;
  document.getElementById('eq-id').value = item.equipment_id;
  document.getElementById('eq-name').value = item.name;
  document.getElementById('eq-category').value = item.category;
  document.getElementById('eq-quantity').value = item.quantity;
  document.getElementById('eq-status').value = item.status;
  document.getElementById('modal-eq-title').textContent = 'Edit Equipment';
  document.getElementById('modal-equipment').classList.remove('hidden');
}

async function handleEquipmentSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('eq-id').value;
  const payload = {
    name: document.getElementById('eq-name').value,
    category: document.getElementById('eq-category').value,
    quantity: document.getElementById('eq-quantity').value,
    status: document.getElementById('eq-status').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/equipment/${id}` : '/api/equipment';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal('modal-equipment');
    showToast(id ? 'Equipment updated successfully!' : 'Equipment added successfully!');
    await fetchAllData();
  }
}

async function deleteEquipment(id) {
  if (!confirm('Are you sure you want to delete this equipment item?')) return;
  const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('Equipment deleted successfully!');
    await fetchAllData();
  }
}

function openUserModal() {
  document.getElementById('form-user').reset();
  document.getElementById('modal-user').classList.remove('hidden');
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('usr-name').value,
    email: document.getElementById('usr-email').value,
    role: document.getElementById('usr-role').value
  };

  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal('modal-user');
    showToast('User registered successfully!');
    await fetchAllData();
  }
}

function openIssueModal() {
  const eqSelect = document.getElementById('issue-eq-select');
  const usrSelect = document.getElementById('issue-user-select');

  const items = Array.isArray(equipmentState) ? equipmentState : [];
  const users = Array.isArray(usersState) ? usersState : [];

  eqSelect.innerHTML = items
    .filter(e => e.available_quantity > 0)
    .map(e => `<option value="${e.equipment_id}">${e.name} (Avail: ${e.available_quantity})</option>`).join('');

  usrSelect.innerHTML = users
    .map(u => `<option value="${u.user_id}">${u.name} (${u.role})</option>`).join('');

  document.getElementById('modal-issue').classList.remove('hidden');
}

async function handleIssueSubmit(e) {
  e.preventDefault();
  const payload = {
    equipment_id: document.getElementById('issue-eq-select').value,
    user_id: document.getElementById('issue-user-select').value,
    quantity: document.getElementById('issue-qty').value
  };

  const res = await fetch('/api/issues/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal('modal-issue');
    showToast('Equipment issued successfully!');
    await fetchAllData();
  } else {
    const err = await res.json();
    alert(err.error || 'Failed to issue equipment');
  }
}

async function returnEquipment(issueId) {
  const res = await fetch(`/api/issues/return/${issueId}`, { method: 'POST' });
  if (res.ok) {
    showToast('Equipment returned successfully!');
    await fetchAllData();
  }
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}