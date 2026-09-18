const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { db, getNextQueue } = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

const broadcastUpdate = () => {
  io.emit('data_updated');
};

app.get('/api/prescriptions', (req, res) => {
  db.all('SELECT * FROM prescriptions ORDER BY id DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    rows.forEach(r => {
      try {
        r.prescription_items = JSON.parse(r.prescription_items);
      } catch (e) {
        r.prescription_items = [];
      }
    });
    res.json(rows);
  });
});

app.get('/api/prescriptions/patient/:name', (req, res) => {
  const patientName = (req.params.name || '').trim();
  db.all('SELECT * FROM prescriptions WHERE LOWER(TRIM(patient_name)) = LOWER(TRIM(?)) ORDER BY id DESC', [patientName], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    rows.forEach(r => {
      try {
        r.prescription_items = JSON.parse(r.prescription_items);
      } catch (e) {
        r.prescription_items = [];
      }
      delete r.doctor_note;
    });
    res.json(rows);
  });
});

app.post('/api/prescriptions', (req, res) => {
  const { patient_name, doctor_name, diagnosis, prescription_items, allergy, doctor_note } = req.body;

  getNextQueue((queue) => {
    const itemsStr = JSON.stringify(prescription_items || []);
    db.run(
      `INSERT INTO prescriptions (patient_name, doctor_name, diagnosis, prescription_items, allergy, doctor_note, queue) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_name, doctor_name, diagnosis, itemsStr, allergy, doctor_note, queue],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        broadcastUpdate();
        res.json({ id: this.lastID, queue });
      }
    );
  });
});

app.put('/api/prescriptions/:id/status', (req, res) => {
  const { status, pharmacist_name } = req.body;
  const id = req.params.id;

  db.run(
    'UPDATE prescriptions SET status = ?, pharmacist_name = ? WHERE id = ?',
    [status, pharmacist_name, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      broadcastUpdate();
      res.json({ success: true });
    }
  );
});

app.put('/api/prescriptions/:id', (req, res) => {
  const { patient_name, diagnosis, prescription_items, allergy, doctor_note } = req.body;
  const id = req.params.id;
  const itemsStr = JSON.stringify(prescription_items || []);

  db.run(
    `UPDATE prescriptions SET 
      patient_name = ?, diagnosis = ?, prescription_items = ?, allergy = ?, doctor_note = ? 
     WHERE id = ?`,
    [patient_name, diagnosis, itemsStr, allergy, doctor_note, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      broadcastUpdate();
      res.json({ success: true });
    }
  );
});


app.delete('/api/prescriptions/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM prescriptions WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    broadcastUpdate();
    res.json({ success: true });
  });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
