let currentUser = null;
let currentRole = null;
let socket = null;
let prescriptions = [];

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const savedPatient = localStorage.getItem('pharmaCheck_patientName');
    if (savedPatient) {
    }
});

function setupSocket() {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Connected to real-time server');
    });

    socket.on('data_updated', () => {
        console.log('Data updated event received');
        refreshData();
    });
}

function showLoginForm(role) {
    document.getElementById('dynamicLoginForm').classList.remove('hidden');

    let title = '';
    let inputs = '';

    if (role === 'doctor') {
        title = 'Login Dokter';
        inputs = `
            <div class="form-group">
                <label>Nama Dokter</label>
                <input type="text" id="loginName" placeholder="Contoh: dr. Budi" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="loginPassword" placeholder="Masukkan password" required>
            </div>
        `;
    } else if (role === 'pharmacist') {
        title = 'Login Apoteker';
        inputs = `
            <div class="form-group">
                <label>Nama Apoteker</label>
                <input type="text" id="loginName" placeholder="Contoh: Apt. Rina" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="loginPassword" placeholder="Masukkan password" required>
            </div>
        `;
    } else if (role === 'patient') {
        title = 'Masuk sebagai Pasien';
        const savedPatient = localStorage.getItem('pharmaCheck_patientName') || '';
        inputs = `
            <div class="form-group">
                <label>Nama Pasien</label>
                <input type="text" id="loginName" value="${savedPatient}" placeholder="Masukkan nama Anda" required>
                <p class="text-muted mt-4">Sistem akan memantau antrean khusus untuk nama ini pada perangkat ini.</p>
            </div>
        `;
    }

    document.getElementById('formTitle').innerText = title;
    document.getElementById('formInputs').innerHTML = inputs;
    document.getElementById('loginForm').onsubmit = (e) => handleLogin(e, role);
}

function hideLoginForm() {
    document.getElementById('dynamicLoginForm').classList.add('hidden');
}

function handleLogin(e, role) {
    e.preventDefault();

    const name = document.getElementById('loginName').value.trim();
    const passwordInput = document.getElementById('loginPassword');
    const password = passwordInput ? passwordInput.value : null;

    if (role === 'doctor') {
        if (password !== 'hallodokter') {
            return showToast('Password dokter salah!', 'danger');
        }
    } else if (role === 'pharmacist') {
        if (password !== 'halloapoteker') {
            return showToast('Password apoteker salah!', 'danger');
        }
    } else if (role === 'patient') {
        localStorage.setItem('pharmaCheck_patientName', name);
    }

    currentRole = role;
    currentUser = name;

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    document.getElementById('userNameDisplay').innerText = currentUser;

    const roleBadge = document.getElementById('roleBadge');
    roleBadge.innerText = role === 'doctor' ? 'Dokter' : role === 'pharmacist' ? 'Apoteker' : 'Pasien';

    setupSocket();
    renderDashboard();
}

function logout() {
    currentRole = null;
    currentUser = null;
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    hideLoginForm();
}

async function refreshData() {
    if (!currentRole) return;

    try {
        let url = `${API_URL}/prescriptions`;
        if (currentRole === 'patient') {
            url = `${API_URL}/prescriptions/patient/${encodeURIComponent(currentUser)}`;
        }

        const res = await fetch(url);
        prescriptions = await res.json();
        renderDashboard();
    } catch (err) {
        console.error('Error fetching data:', err);
        showToast('Gagal memuat data.', 'danger');
    }
}

function renderDashboard() {
    const content = document.getElementById('contentArea');

    if (currentRole === 'doctor') {
        content.innerHTML = renderDoctorDashboard();
    } else if (currentRole === 'pharmacist') {
        content.innerHTML = renderPharmacistDashboard();
    } else if (currentRole === 'patient') {
        content.innerHTML = renderPatientDashboard();
    }
}

function showToast(message, type = 'default') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'danger') toast.style.backgroundColor = 'var(--danger)';
    if (type === 'success') toast.style.backgroundColor = 'var(--success)';

    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showModal(title, content) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalContainer').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalContainer').classList.add('hidden');
}

function getStatusBadge(status) {
    return `<span class="badge status-${status.toLowerCase()}">${status}</span>`;
}

function initializeDashboard() {
    refreshData();
}
