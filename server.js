const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// SQL SCHEMA: Create Tables for Users & Preferences
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

  // User Soundscape Preferences Table
  db.run(`
    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      rain_vol REAL DEFAULT 0,
      birds_vol REAL DEFAULT 0,
      ocean_vol REAL DEFAULT 0,
      favorite_category TEXT DEFAULT 'home',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

// API: Register User
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
  db.run(sql, [email, password], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Account already exists for this email.' });
      }
      return res.status(500).json({ error: err.message });
    }

    const userId = this.lastID;

    // Initialize default preferences for new user
    db.run(`INSERT INTO preferences (user_id) VALUES (?)`, [userId], (prefErr) => {
      if (prefErr) {
        console.error('Error creating default preferences:', prefErr.message);
      }
    });

    res.json({ message: 'Account created successfully!', userId });
  });
});

// API: Login User
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

    const username = row.email.split('@')[0];
    res.json({ 
      message: 'Login successful!', 
      userId: row.id,
      username, 
      email: row.email 
    });
  });
});

// API: Get User Soundscape Preferences
app.get('/api/preferences/:userId', (req, res) => {
  const { userId } = req.params;

  const sql = `SELECT * FROM preferences WHERE user_id = ?`;
  db.get(sql, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Preferences not found.' });
    }
    res.json({ preferences: row });
  });
});

// API: Save or Update User Soundscape Preferences
app.post('/api/preferences/save', (req, res) => {
  const { userId, rain_vol, birds_vol, ocean_vol, favorite_category } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const sql = `
    INSERT INTO preferences (user_id, rain_vol, birds_vol, ocean_vol, favorite_category)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      rain_vol = excluded.rain_vol,
      birds_vol = excluded.birds_vol,
      ocean_vol = excluded.ocean_vol,
      favorite_category = excluded.favorite_category
  `;

  db.run(sql, [userId, rain_vol, birds_vol, ocean_vol, favorite_category], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Settings saved successfully!' });
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`EcoChrono server running at http://localhost:${PORT}`);
});