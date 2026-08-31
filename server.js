const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const dbHost = process.env.DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com';
const pool = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER || '3Tzv3f22f9k6ymW.root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'tO1bLyzwJ2h3lHqS',
  database: process.env.DB_NAME || 'mada_hearing',
  port: parseInt(process.env.DB_PORT || '4000', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: (dbHost !== 'localhost' && dbHost !== '127.0.0.1') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false
});

// 1. Audio Settings
const handleAudioSettings = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { freq_high, noise_reduction, voice_enhance } = req.body;
      const [existing] = await pool.query('SELECT id FROM audio_settings LIMIT 1');
      if (existing.length > 0) {
        await pool.query(
          'UPDATE audio_settings SET freq_high = ?, noise_reduction = ?, voice_enhance = ?, updated_at = NOW() WHERE id = ?',
          [freq_high, noise_reduction, voice_enhance, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO audio_settings (freq_high, noise_reduction, voice_enhance) VALUES (?, ?, ?)',
          [freq_high, noise_reduction, voice_enhance]
        );
      }
      return res.json({ status: 'success', message: 'Settings saved successfully' });
    } else {
      const [rows] = await pool.query('SELECT * FROM audio_settings ORDER BY id DESC LIMIT 1');
      return res.json(rows[0] || { freq_high: 65, noise_reduction: 80, voice_enhance: 70 });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
app.all(['/api/audio_settings.php', '/api/audio_settings', '/audio_settings.php'], handleAudioSettings);

// 2. Audiograms
const handleAudiograms = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { loss_left, loss_right, data } = req.body;
      const dataStr = typeof data === 'object' ? JSON.stringify(data) : (data || '');
      const [result] = await pool.query(
        'INSERT INTO audiograms (loss_left, loss_right, data) VALUES (?, ?, ?)',
        [loss_left || 0, loss_right || 0, dataStr]
      );
      return res.json({ status: 'success', message: 'Audiogram saved successfully', id: result.insertId });
    } else {
      const [rows] = await pool.query('SELECT * FROM audiograms ORDER BY test_date DESC');
      const parsed = rows.map(r => ({
        ...r,
        data: typeof r.data === 'string' ? JSON.parse(r.data || '{}') : r.data
      }));
      return res.json(parsed);
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
app.all(['/api/audiograms.php', '/api/audiograms', '/audiograms.php'], handleAudiograms);

// 3. Lecture Notes
const handleLectureNotes = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { lecture_title, notes } = req.body;
      const [result] = await pool.query(
        'INSERT INTO lecture_notes (lecture_title, notes) VALUES (?, ?)',
        [lecture_title || 'ملاحظات بدون عنوان', notes || '']
      );
      return res.json({ status: 'success', message: 'Notes saved successfully', id: result.insertId });
    } else {
      const [rows] = await pool.query('SELECT * FROM lecture_notes ORDER BY saved_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
app.all(['/api/lecture_notes.php', '/api/lecture_notes', '/lecture_notes.php'], handleLectureNotes);

// 4. Browser History
const handleBrowserHistory = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { url, title } = req.body;
      const [result] = await pool.query(
        'INSERT INTO browser_history (url, title) VALUES (?, ?)',
        [url || '', title || '']
      );
      return res.json({ status: 'success', message: 'History saved successfully', id: result.insertId });
    } else {
      const [rows] = await pool.query('SELECT * FROM browser_history ORDER BY visited_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
app.all(['/api/browser_history.php', '/api/browser_history', '/browser_history.php'], handleBrowserHistory);

app.get('/api/ping', (req, res) => res.json({ status: 'ok', message: 'Mada Al-Sam-a API is live' }));

app.use(express.static(path.join(__dirname, 'dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Mada Al-Sam-a Server is LIVE on port: ' + PORT);
});
