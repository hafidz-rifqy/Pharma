const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      prescription_items TEXT NOT NULL,
      allergy TEXT DEFAULT 'Tidak ada',
      status TEXT DEFAULT 'menunggu',
      queue TEXT,
      doctor_note TEXT,
      pharmacist_note TEXT,
      pharmacist_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function getNextQueue(callback) {
  db.get('SELECT queue FROM prescriptions ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error(err);
      return callback('A001');
    }

    if (!row || !row.queue) {
      return callback('A001');
    }

    const lastQueue = row.queue;
    if (lastQueue.length !== 4) {
      return callback('A001');
    }

    let letter = lastQueue.charAt(0);
    let number = parseInt(lastQueue.substring(1), 10);

    number += 1;

    if (number > 99) {
      number = 1;
      let charCode = letter.charCodeAt(0);
      if (charCode >= 90) {
        charCode = 65;
      } else {
        charCode += 1;
      }
      letter = String.fromCharCode(charCode);
    }

    const newQueue = letter + number.toString().padStart(3, '0');
    callback(newQueue);
  });
}

module.exports = {
  db,
  getNextQueue
};
