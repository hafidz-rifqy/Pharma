function renderPatientDashboard() {
    let html = `
        <div class="dashboard-header">
            <div>
                <h2>Status Antrean Anda</h2>
                <p class="text-muted">Pantau status obat untuk pasien: <strong>${currentUser}</strong></p>
            </div>
            <button class="btn btn-outline" onclick="refreshData()">Refresh Manual</button>
        </div>
    `;

    const patientPrescriptions = prescriptions.filter(p => 
        p.patient_name && p.patient_name.trim().toLowerCase() === currentUser.trim().toLowerCase()
    );

    if (patientPrescriptions.length === 0) {
        if (!window.hasFetchedPatient) {
            window.hasFetchedPatient = true;
            refreshData();
        }
        
        html += `
            <div class="card" style="text-align: center; padding: 3rem;">
                <h3 class="text-muted">Belum ada resep obat untuk nama "${currentUser}" saat ini.</h3>
                <p class="text-muted mt-4">Pastikan nama sesuai dengan yang didaftarkan dokter. Mohon tunggu dokter memasukkan resep Anda.</p>
            </div>
        `;
        return html;
    }

    html += patientPrescriptions.map(p => {
        let statusText = '';
        let statusHint = '';
        
        if (p.status === 'menunggu') {
            statusText = 'Antrean Menunggu';
            statusHint = 'Resep Anda telah diterima sistem dan menunggu giliran diproses apoteker.';
        } else if (p.status === 'diproses') {
            statusText = 'Sedang Diproses';
            statusHint = 'Obat Anda sedang diracik/disiapkan oleh apoteker.';
        } else if (p.status === 'selesai') {
            statusText = 'Siap Diambil';
            statusHint = 'Obat Anda sudah selesai dan siap diambil di loket farmasi.';
        } else if (p.status === 'diterima') {
            statusText = 'Sudah Diterima';
            statusHint = 'Obat ini telah diserahkan kepada Anda.';
        }

        return `
            <div class="tracking-hero">
                <div>
                    <div class="text-muted">Nomor Antrean Anda</div>
                    <div class="tracking-queue">${p.queue}</div>
                    <div class="text-muted">Resep dari: <strong>${p.doctor_name}</strong></div>
                </div>
                <div style="text-align: right;">
                    ${getStatusBadge(p.status)}
                    <h3 style="margin-top: 10px;">${statusText}</h3>
                    <p class="text-muted" style="max-width: 250px; font-size:0.875rem">${statusHint}</p>
                </div>
            </div>

            <div class="card">
                <h3>Detail Resep</h3>
                <div class="grid-2 mt-4">
                    <div>
                        <p class="text-muted">Diagnosis / Keluhan</p>
                        <p><strong>${p.diagnosis}</strong></p>
                    </div>
                    <div>
                        <p class="text-muted">Riwayat Alergi</p>
                        <p><strong>${p.allergy}</strong></p>
                    </div>
                    <div>
                        <p class="text-muted">Daftar Obat</p>
                        <p><strong>${p.prescription_items.length > 0 ? p.prescription_items.join(', ') : 'Belum ada data obat'}</strong></p>
                    </div>
                    <div>
                        <p class="text-muted">Apoteker Penanggung Jawab</p>
                        <p><strong>${p.pharmacist_name || 'Menunggu Apoteker...'}</strong></p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return html;
}
