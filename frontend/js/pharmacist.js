function renderPharmacistDashboard() {
    const total = prescriptions.length;
    const waiting = prescriptions.filter(p => p.status === 'menunggu').length;
    const processing = prescriptions.filter(p => p.status === 'diproses').length;
    const done = prescriptions.filter(p => p.status === 'selesai').length;

    let html = `
        <div class="dashboard-header">
            <div>
                <h2>Dashboard Apoteker</h2>
                <p class="text-muted">Kelola resep dan proses obat pasien.</p>
            </div>
            <button class="btn btn-outline" onclick="refreshData()">Refresh Manual</button>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="text-muted">Antrean Baru</div>
                <div class="stat-value">${waiting}</div>
            </div>
            <div class="stat-card">
                <div class="text-muted">Sedang Diproses</div>
                <div class="stat-value">${processing}</div>
            </div>
            <div class="stat-card">
                <div class="text-muted">Siap Diambil</div>
                <div class="stat-value">${done}</div>
            </div>
        </div>

        <div class="card">
            <h3>Daftar Antrean Resep</h3>
            <div class="table-container mt-4">
                <table>
                    <thead>
                        <tr>
                            <th>Antrean</th>
                            <th>Pasien</th>
                            <th>Dokter & Catatan</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prescriptions.map(p => `
                            <tr>
                                <td><span class="queue-number">${p.queue}</span></td>
                                <td>
                                    <strong>${p.patient_name}</strong><br>
                                    <span class="text-muted">${p.prescription_items.length} jenis obat</span>
                                </td>
                                <td>
                                    <strong>${p.doctor_name}</strong><br>
                                    <span class="text-muted">${p.doctor_note || '-'}</span>
                                </td>
                                <td>${getStatusBadge(p.status)}</td>
                                <td>
                                    <button class="btn btn-primary" onclick="openPharmacistAction(${p.id})">Ubah Status</button>
                                </td>
                            </tr>
                        `).join('')}
                        ${prescriptions.length === 0 ? '<tr><td colspan="5" style="text-align:center">Belum ada resep masuk.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if (prescriptions.length === 0 && !window.hasFetchedPharmacist) {
        window.hasFetchedPharmacist = true;
        refreshData();
    }

    return html;
}

function openPharmacistAction(id) {
    const data = prescriptions.find(p => p.id === id);
    if (!data) return;

    const formHtml = `
        <div style="margin-bottom: 20px;">
            <p><strong>Pasien:</strong> ${data.patient_name}</p>
            <p><strong>Antrean:</strong> ${data.queue}</p>
            <p><strong>Diagnosis:</strong> ${data.diagnosis}</p>
            <p><strong>Alergi:</strong> ${data.allergy}</p>
            <p><strong>Obat:</strong> ${data.prescription_items.join(', ')}</p>
            <hr style="margin:10px 0; border:none; border-top:1px solid var(--border)">
            <p><strong>Catatan Dokter:</strong> ${data.doctor_note || '-'}</p>
        </div>

        <form onsubmit="updatePharmacistStatus(event, ${id})">
            <div class="form-group">
                <label>Nama Apoteker (Ditampilkan ke pasien)</label>
                <input type="text" id="pharmName" value="${data.pharmacist_name || currentUser}" required>
            </div>
            <div class="form-group">
                <label>Ubah Status Obat</label>
                <select id="pharmStatus">
                    <option value="menunggu" ${data.status === 'menunggu' ? 'selected' : ''}>Menunggu</option>
                    <option value="diproses" ${data.status === 'diproses' ? 'selected' : ''}>Sedang Diproses</option>
                    <option value="selesai" ${data.status === 'selesai' ? 'selected' : ''}>Siap Diambil / Selesai</option>
                    <option value="diterima" ${data.status === 'diterima' ? 'selected' : ''}>Sudah Diterima Pasien</option>
                </select>
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Status</button>
            </div>
        </form>
    `;

    showModal('Proses Resep', formHtml);
}

async function updatePharmacistStatus(e, id) {
    e.preventDefault();

    const payload = {
        pharmacist_name: document.getElementById('pharmName').value.trim(),
        status: document.getElementById('pharmStatus').value
    };

    try {
        const res = await fetch(`${API_URL}/prescriptions/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('Status berhasil diperbarui', 'success');
            closeModal();
        } else {
            showToast('Gagal mengubah status', 'danger');
        }
    } catch (e) {
        showToast('Terjadi kesalahan jaringan', 'danger');
    }
}
