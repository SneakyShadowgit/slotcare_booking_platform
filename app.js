/* ===================================================================
   SlotCare — Application Logic
   Lightweight slot-status control panel for clinics
   =================================================================== */

// ==================== DATA MODEL ====================

const DEFAULT_SLOT_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
];

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899',
  '#10b981', '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

// State
let state = {
  doctors: [],
  slotTemplate: [...DEFAULT_SLOT_TIMES],
  selectedDoctor: 'all',
  statusModalDoctorId: null
};

// ==================== PERSISTENCE ====================

function saveState() {
  localStorage.setItem('slotcare_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('slotcare_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      // Ensure slotTemplate exists
      if (!state.slotTemplate || state.slotTemplate.length === 0) {
        state.slotTemplate = [...DEFAULT_SLOT_TIMES];
      }
    } catch (e) {
      console.warn('Failed to load saved state, using defaults.');
    }
  }

  // Seed with demo doctors if first time
  if (state.doctors.length === 0) {
    state.doctors = [
      createDoctor('Dr. Sharma', 'General Physician'),
      createDoctor('Dr. Patel', 'Pediatrics'),
      createDoctor('Dr. Gupta', 'Dermatology'),
    ];
    saveState();
  }
}

// ==================== DOCTOR MODEL ====================

let nextDoctorId = 1;

function createDoctor(name, specialty) {
  const id = 'doc_' + nextDoctorId++;
  const colorIndex = (nextDoctorId - 1) % AVATAR_COLORS.length;
  return {
    id,
    name,
    specialty: specialty || 'General',
    status: 'available', // available, busy, delayed, on-leave
    color: AVATAR_COLORS[colorIndex],
    slots: state.slotTemplate.map(time => ({
      time,
      status: 'available' // available, filled
    }))
  };
}

function getInitials(name) {
  return name.replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ==================== CLOCK ====================

function updateClock() {
  const now = new Date();
  const options = {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  };
  document.getElementById('live-clock').textContent = now.toLocaleDateString('en-IN', options);
}

// ==================== RENDERING ====================

function renderAll() {
  renderDoctorTabs();
  renderMainContent();
}

function renderDoctorTabs() {
  const container = document.querySelector('.tabs-scroll');
  // Keep the "All Doctors" tab
  const allTab = document.getElementById('tab-all');

  // Remove old doctor tabs
  container.querySelectorAll('.tab:not(#tab-all)').forEach(t => t.remove());

  state.doctors.forEach(doc => {
    const tab = document.createElement('button');
    tab.className = 'tab' + (state.selectedDoctor === doc.id ? ' active' : '');
    tab.dataset.doctor = doc.id;
    tab.onclick = () => selectDoctor(doc.id);
    tab.innerHTML = `
      <span class="tab-status-dot ${doc.status}"></span>
      ${escapeHtml(doc.name)}
    `;
    container.appendChild(tab);
  });

  // Update all tab active state
  allTab.className = 'tab' + (state.selectedDoctor === 'all' ? ' active' : '');
}

function renderMainContent() {
  const main = document.getElementById('main-content');
  const doctors = state.selectedDoctor === 'all'
    ? state.doctors
    : state.doctors.filter(d => d.id === state.selectedDoctor);

  if (state.doctors.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏥</div>
        <h3>No doctors added yet</h3>
        <p>Click the settings icon in the top bar to add doctors and configure time slots.</p>
        <button class="btn btn-primary" onclick="openSettings()">⚙ Manage Doctors</button>
      </div>
    `;
    return;
  }

  // Summary
  const totalSlots = state.doctors.reduce((sum, d) => sum + d.slots.length, 0);
  const availableSlots = state.doctors.reduce((sum, d) =>
    sum + d.slots.filter(s => s.status === 'available').length, 0);
  const filledSlots = totalSlots - availableSlots;

  let html = `
    <div class="summary-bar">
      <div class="summary-chip total">
        <span>Total Slots</span>
        <span class="count">${totalSlots}</span>
      </div>
      <div class="summary-chip available">
        <span>Available</span>
        <span class="count">${availableSlots}</span>
      </div>
      <div class="summary-chip filled">
        <span>Filled</span>
        <span class="count">${filledSlots}</span>
      </div>
    </div>
  `;

  doctors.forEach(doc => {
    const docAvailable = doc.slots.filter(s => s.status === 'available').length;
    const docFilled = doc.slots.length - docAvailable;
    const isOnLeave = doc.status === 'on-leave';

    html += `
      <div class="doctor-section" id="section-${doc.id}">
        <div class="doctor-header">
          <div class="doctor-info">
            <div class="doctor-avatar" style="background: ${doc.color}">
              ${getInitials(doc.name)}
            </div>
            <div>
              <div class="doctor-name">${escapeHtml(doc.name)}</div>
              <div class="doctor-specialty">${escapeHtml(doc.specialty)} · ${docAvailable} available · ${docFilled} filled</div>
            </div>
          </div>
          <div class="doctor-actions">
            <div class="doctor-status-badge ${doc.status}" onclick="openStatusModal('${doc.id}')" title="Click to change status">
              <span class="status-dot ${doc.status}"></span>
              ${formatStatus(doc.status)}
            </div>
            <button class="btn-edit-slots" onclick="openSlotEditModal('${doc.id}')">✏ Edit Slots</button>
          </div>
        </div>
        <div class="mark-all-bar">
          <button class="btn-mark-all available" onclick="markAllSlots('${doc.id}', 'available')" ${isOnLeave ? 'disabled' : ''}>
            ✓ Mark All Available
          </button>
          <button class="btn-mark-all filled" onclick="markAllSlots('${doc.id}', 'filled')" ${isOnLeave ? 'disabled' : ''}>
            ✗ Mark All Filled
          </button>
        </div>
        <div class="slot-grid">
          ${doc.slots.map((slot, i) => renderSlotCard(doc, slot, i)).join('')}
        </div>
      </div>
    `;
  });

  main.innerHTML = html;
}

function renderSlotCard(doc, slot, index) {
  const isOnLeave = doc.status === 'on-leave';
  const isFilled = slot.status === 'filled';
  const statusClass = isFilled ? 'filled' : 'available';
  const statusIcon = isFilled ? '✗' : '✓';
  const statusText = isFilled ? 'Filled' : 'Available';

  return `
    <div class="slot-card ${statusClass} ${isOnLeave ? 'doctor-on-leave' : ''}"
         onclick="toggleSlot('${doc.id}', ${index})"
         title="Click to toggle — ${doc.name} at ${formatTime(slot.time)}">
      <div class="slot-time">${formatTime(slot.time)}</div>
      <div class="slot-doctor-name">${escapeHtml(doc.name)}</div>
      <div class="slot-status-label">
        <span class="slot-status-icon">${statusIcon}</span>
        ${statusText}
      </div>
    </div>
  `;
}

// ==================== ACTIONS ====================

function selectDoctor(doctorId) {
  state.selectedDoctor = doctorId;
  saveState();
  renderAll();
}

function toggleSlot(doctorId, slotIndex) {
  const doc = state.doctors.find(d => d.id === doctorId);
  if (!doc || doc.status === 'on-leave') return;

  const slot = doc.slots[slotIndex];
  slot.status = slot.status === 'available' ? 'filled' : 'available';
  saveState();
  renderMainContent();

  const statusText = slot.status === 'filled' ? 'Filled' : 'Available';
  showToast(`${formatTime(slot.time)} — ${doc.name} → ${statusText}`);
}

function markAllSlots(doctorId, status) {
  const doc = state.doctors.find(d => d.id === doctorId);
  if (!doc || doc.status === 'on-leave') return;

  doc.slots.forEach(s => s.status = status);
  saveState();
  renderMainContent();
  showToast(`All slots for ${doc.name} marked as ${status === 'filled' ? 'Filled' : 'Available'}`);
}

// ==================== DOCTOR STATUS ====================

let statusModalDoctorId = null;

function openStatusModal(doctorId) {
  statusModalDoctorId = doctorId;
  const doc = state.doctors.find(d => d.id === doctorId);
  document.getElementById('status-modal-title').textContent = doc.name + ' — Status';
  document.getElementById('status-modal-overlay').classList.remove('hidden');
}

function closeStatusModal() {
  document.getElementById('status-modal-overlay').classList.add('hidden');
  statusModalDoctorId = null;
}

function setDoctorStatus(status) {
  if (!statusModalDoctorId) return;
  const doc = state.doctors.find(d => d.id === statusModalDoctorId);
  if (!doc) return;

  doc.status = status;
  saveState();
  closeStatusModal();
  renderAll();
  showToast(`${doc.name} is now ${formatStatus(status)}`);
}

// ==================== SETTINGS MODAL ====================

function openSettings() {
  renderSlotTemplateList();
  renderDoctorManageList();
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('input-doctor-name').focus();
}

function closeSettings() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function addDoctor() {
  const nameInput = document.getElementById('input-doctor-name');
  const specInput = document.getElementById('input-doctor-specialty');
  const name = nameInput.value.trim();
  const specialty = specInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  const doc = createDoctor(name, specialty || 'General');
  state.doctors.push(doc);
  saveState();
  renderAll();
  renderDoctorManageList();

  nameInput.value = '';
  specInput.value = '';
  nameInput.focus();
  showToast(`${name} added successfully`);
}

function removeDoctor(doctorId) {
  const doc = state.doctors.find(d => d.id === doctorId);
  if (!doc) return;
  if (!confirm(`Remove ${doc.name}? This will delete all their slots.`)) return;

  state.doctors = state.doctors.filter(d => d.id !== doctorId);
  if (state.selectedDoctor === doctorId) {
    state.selectedDoctor = 'all';
  }
  saveState();
  renderAll();
  renderDoctorManageList();
  showToast(`${doc.name} removed`);
}

// ==================== SLOT TEMPLATE ====================

function renderSlotTemplateList() {
  const container = document.getElementById('slot-template-list');
  container.innerHTML = state.slotTemplate.map((time, i) => `
    <div class="slot-template-chip">
      ${formatTime(time)}
      <button class="remove-chip" onclick="removeSlotTemplate(${i})" title="Remove">×</button>
    </div>
  `).join('');
}

function addSlotTemplate() {
  const input = document.getElementById('input-slot-time');
  const time = input.value;
  if (!time) return;

  if (state.slotTemplate.includes(time)) {
    showToast('This time slot already exists');
    return;
  }

  state.slotTemplate.push(time);
  state.slotTemplate.sort();
  saveState();
  renderSlotTemplateList();
  input.value = '';
}

function removeSlotTemplate(index) {
  state.slotTemplate.splice(index, 1);
  saveState();
  renderSlotTemplateList();
}

// ==================== SLOT EDIT MODAL ====================

let slotEditDoctorId = null;

function openSlotEditModal(doctorId) {
  slotEditDoctorId = doctorId;
  const doc = state.doctors.find(d => d.id === doctorId);
  document.getElementById('slot-edit-doctor-name').textContent = doc.name;
  renderSlotEditList();
  document.getElementById('slot-edit-modal-overlay').classList.remove('hidden');
}

function closeSlotEditModal() {
  document.getElementById('slot-edit-modal-overlay').classList.add('hidden');
  slotEditDoctorId = null;
  renderMainContent();
}

function renderSlotEditList() {
  const doc = state.doctors.find(d => d.id === slotEditDoctorId);
  if (!doc) return;

  const container = document.getElementById('slot-edit-list');
  container.innerHTML = doc.slots.map((slot, i) => `
    <div class="slot-edit-item">
      <span>${formatTime(slot.time)}</span>
      <button class="btn btn-danger" onclick="removeSlotFromDoctor(${i})">Remove</button>
    </div>
  `).join('');
}

function addSlotToDoctor() {
  const input = document.getElementById('input-new-slot-time');
  const time = input.value;
  if (!time) return;

  const doc = state.doctors.find(d => d.id === slotEditDoctorId);
  if (!doc) return;

  if (doc.slots.find(s => s.time === time)) {
    showToast('This time slot already exists for this doctor');
    return;
  }

  doc.slots.push({ time, status: 'available' });
  doc.slots.sort((a, b) => a.time.localeCompare(b.time));
  saveState();
  renderSlotEditList();
  input.value = '';
}

function removeSlotFromDoctor(index) {
  const doc = state.doctors.find(d => d.id === slotEditDoctorId);
  if (!doc) return;

  doc.slots.splice(index, 1);
  saveState();
  renderSlotEditList();
}

// ==================== DOCTOR MANAGE LIST ====================

function renderDoctorManageList() {
  const container = document.getElementById('doctor-manage-list');
  if (state.doctors.length === 0) {
    container.innerHTML = '<p class="help-text">No doctors added yet.</p>';
    return;
  }

  container.innerHTML = state.doctors.map(doc => `
    <div class="doctor-manage-item">
      <div>
        <div class="doctor-manage-name">${escapeHtml(doc.name)}</div>
        <div class="doctor-manage-specialty">${escapeHtml(doc.specialty)} · ${doc.slots.length} slots</div>
      </div>
      <button class="btn btn-danger" onclick="removeDoctor('${doc.id}')">Remove</button>
    </div>
  `).join('');
}

// ==================== UTILITIES ====================

function formatTime(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatStatus(status) {
  const labels = {
    'available': 'Available',
    'busy': 'Busy',
    'delayed': 'Delayed',
    'on-leave': 'On Leave'
  };
  return labels[status] || status;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', (e) => {
  // Escape closes modals
  if (e.key === 'Escape') {
    closeSettings();
    closeStatusModal();
    closeSlotEditModal();
  }
});

// ==================== INIT ====================

function init() {
  // Restore next ID from existing doctors
  if (state.doctors.length > 0) {
    const maxId = state.doctors.reduce((max, d) => {
      const num = parseInt(d.id.replace('doc_', ''));
      return num > max ? num : max;
    }, 0);
    nextDoctorId = maxId + 1;
  }

  updateClock();
  setInterval(updateClock, 1000);
  renderAll();
}

loadState();
init();
