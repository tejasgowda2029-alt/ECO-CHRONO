const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect or create SQLite database file
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database (database.db)');
  }
});

// Create tables for Users and Login History
db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Login History Table (Tracks logins in database)
  db.run(`
    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT NOT NULL,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

// API Endpoint: Register User
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
  db.run(sql, [email, password], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Account already exists with this email.' });
      }
      return res.status(500).json({ error: err.message });
    }

    const userId = this.lastID;

    // Log initial registration in history table
    db.run(`INSERT INTO login_history (user_id, email) VALUES (?, ?)`, [userId, email]);

    res.json({ message: 'Account created successfully!', userId });
  });
});

// API Endpoint: Login User
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
  db.get(sql, [email, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Record login timestamp in database
    db.run(`INSERT INTO login_history (user_id, email) VALUES (?, ?)`, [row.id, row.email], (histErr) => {
      if (histErr) {
        console.error('Error logging history:', histErr.message);
      } else {
        console.log(`📝 Recorded login history in database for: ${row.email}`);
      }
    });

    const username = row.email.split('@')[0];
    res.json({
      message: 'Login successful!',
      userId: row.id,
      username: username,
      email: row.email
    });
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 EcoChrono server running at http://localhost:${PORT}`);
});