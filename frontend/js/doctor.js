function renderDoctorDashboard() {
    const total = prescriptions.length;
    const waiting = prescriptions.filter(p => p.status === 'menunggu').length;
    const processing = prescriptions.filter(p => p.status === 'diproses').length;
    const done = prescriptions.filter(p => p.status === 'selesai').length;

    let html = `
        <div class="dashboard-header">
            <div>
                <h2>Dashboard Dokter</h2>
                <p class="text-muted">Kelola resep dan pantau antrean pasien.</p>
            </div>
            <button class="btn btn-primary" onclick="openDoctorForm()">+ Buat Resep Baru</button>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="text-muted">Total Resep</div>
                <div class="stat-value">${total}</div>
            </div>
            <div class="stat-card">
                <div class="text-muted">Menunggu</div>
                <div class="stat-value">${waiting}</div>
            </div>
            <div class="stat-card">
                <div class="text-muted">Diproses</div>
                <div class="stat-value">${processing}</div>
            </div>
            <div class="stat-card">
                <div class="text-muted">Selesai</div>
                <div class="stat-value">${done}</div>
            </div>
        </div>

        <div class="card">
            <h3>Riwayat Resep</h3>
            <div class="table-container mt-4">
                <table>
                    <thead>
                        <tr>
                            <th>Antrean</th>
                            <th>Pasien</th>
                            <th>Diagnosis</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prescriptions.map(p => `
                            <tr>
                                <td><span class="queue-number">${p.queue}</span></td>
                                <td>${p.patient_name}</td>
                                <td>${p.diagnosis}</td>
                                <td>${getStatusBadge(p.status)}</td>
                                <td>
                                    <button class="btn btn-outline" onclick="editPrescription(${p.id})">Edit</button>
                                    <button class="btn btn-danger" onclick="deletePrescription(${p.id})">Hapus</button>
                                </td>
                            </tr>
                        `).join('')}
                        ${prescriptions.length === 0 ? '<tr><td colspan="5" style="text-align:center">Belum ada resep.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if (prescriptions.length === 0 && !window.hasFetchedDoctor) {
        window.hasFetchedDoctor = true;
        refreshData();
    }

    return html;
}

let editId = null;

function openDoctorForm(id = null) {
    editId = id;
    let data = { patient_name: '', diagnosis: '', allergy: '', doctor_note: '', prescription_items: [] };

    if (id) {
        data = prescriptions.find(p => p.id === id) || data;
    }

    const formHtml = `
        <form onsubmit="savePrescription(event)">
            <div class="grid-2">
                <div class="form-group">
                    <label>Nama Pasien</label>
                    <input type="text" id="docPatient" value="${data.patient_name}" required>
                </div>
                <div class="form-group">
                    <label>Riwayat Alergi</label>
                    <input type="text" id="docAllergy" value="${data.allergy}">
                </div>
                <div class="form-group col-span-2">
                    <label>Keluhan / Diagnosis</label>
                    <textarea id="docDiagnosis" required>${data.diagnosis}</textarea>
                </div>
                
                <div class="form-group col-span-2">
                    <label>Daftar Obat (Pisahkan dengan koma)</label>
                    <input type="text" id="docMeds" value="${data.prescription_items.join(', ')}" placeholder="Contoh: Paracetamol 500mg, Amoxicillin">
                </div>

                <div class="form-group col-span-2">
                    <label>Catatan Khusus untuk Apoteker (Rahasia dari Pasien)</label>
                    <textarea id="docNote">${data.doctor_note || ''}</textarea>
                </div>
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Resep</button>
            </div>
        </form>
    `;

    showModal(id ? 'Edit Resep' : 'Buat Resep Baru', formHtml);
}

function editPrescription(id) {
    openDoctorForm(id);
}

async function deletePrescription(id) {
    if (!confirm('Yakin ingin menghapus resep ini? Jika semua resep dihapus, antrean akan mengulang ke A001.')) return;

    try {
        const res = await fetch(`${API_URL}/prescriptions/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Resep berhasil dihapus', 'success');
        }
    } catch (e) {
        showToast('Gagal menghapus resep', 'danger');
    }
}

async function savePrescription(e) {
    e.preventDefault();

    const payload = {
        patient_name: document.getElementById('docPatient').value.trim(),
        doctor_name: currentUser,
        diagnosis: document.getElementById('docDiagnosis').value.trim(),
        allergy: document.getElementById('docAllergy').value.trim(),
        doctor_note: document.getElementById('docNote').value.trim(),
        prescription_items: document.getElementById('docMeds').value.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
        const url = editId ? `${API_URL}/prescriptions/${editId}` : `${API_URL}/prescriptions`;
        const method = editId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast(editId ? 'Resep berhasil diubah' : 'Resep berhasil dibuat', 'success');
            closeModal();
        } else {
            showToast('Gagal menyimpan resep', 'danger');
        }
    } catch (e) {
        showToast('Terjadi kesalahan jaringan', 'danger');
    }
}
