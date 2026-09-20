import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS;
const dbName = process.env.DB_NAME || 'mada_hearing';
const dbPort = parseInt(process.env.DB_PORT || '4000', 10);

let pool = null;
if (dbHost && dbUser && dbPassword) {
  pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    ssl: (dbHost !== 'localhost' && dbHost !== '127.0.0.1') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false
  });
} else {
  console.warn('⚠️ Warning: Database credentials not fully specified in .env. Running with memory/fallback mode.');
}

// In-memory fallback stores
const memoryStore = {
  audioSettings: { freq_high: 65, noise_reduction: 80, voice_enhance: 70 },
  audiograms: [],
  lectureNotes: [],
  browserHistory: []
};

// 1. Audio Settings
const handleAudioSettings = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { freq_high, noise_reduction, voice_enhance } = req.body;
      memoryStore.audioSettings = { freq_high, noise_reduction, voice_enhance };

      if (pool) {
        try {
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
        } catch (dbErr) {
          console.warn('⚠️ DB write failed, stored in memory:', dbErr.message);
        }
      }
      return res.json({ status: 'success', message: 'Settings saved successfully' });
    } else {
      if (pool) {
        try {
          const [rows] = await pool.query('SELECT * FROM audio_settings ORDER BY id DESC LIMIT 1');
          if (rows && rows.length > 0) return res.json(rows[0]);
        } catch (dbErr) {
          console.warn('⚠️ DB read failed, returning memory store:', dbErr.message);
        }
      }
      return res.json(memoryStore.audioSettings);
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
      const newEntry = {
        id: Date.now(),
        test_date: new Date().toISOString(),
        loss_left: loss_left || 0,
        loss_right: loss_right || 0,
        data: typeof data === 'object' ? data : JSON.parse(data || '{}')
      };
      memoryStore.audiograms.unshift(newEntry);

      let insertId = newEntry.id;
      if (pool) {
        try {
          const [result] = await pool.query(
            'INSERT INTO audiograms (loss_left, loss_right, data) VALUES (?, ?, ?)',
            [loss_left || 0, loss_right || 0, dataStr]
          );
          insertId = result.insertId;
        } catch (dbErr) {
          console.warn('⚠️ DB write failed, stored in memory:', dbErr.message);
        }
      }
      return res.json({ status: 'success', message: 'Audiogram saved successfully', id: insertId });
    } else {
      if (pool) {
        try {
          const [rows] = await pool.query('SELECT * FROM audiograms ORDER BY test_date DESC');
          const parsed = rows.map(r => ({
            ...r,
            data: typeof r.data === 'string' ? JSON.parse(r.data || '{}') : r.data
          }));
          return res.json(parsed);
        } catch (dbErr) {
          console.warn('⚠️ DB read failed, returning memory store:', dbErr.message);
        }
      }
      return res.json(memoryStore.audiograms);
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
      const newNote = {
        id: Date.now(),
        saved_at: new Date().toISOString(),
        lecture_title: lecture_title || 'ملاحظات بدون عنوان',
        notes: notes || ''
      };
      memoryStore.lectureNotes.unshift(newNote);

      let insertId = newNote.id;
      if (pool) {
        try {
          const [result] = await pool.query(
            'INSERT INTO lecture_notes (lecture_title, notes) VALUES (?, ?)',
            [lecture_title || 'ملاحظات بدون عنوان', notes || '']
          );
          insertId = result.insertId;
        } catch (dbErr) {
          console.warn('⚠️ DB write failed, stored in memory:', dbErr.message);
        }
      }
      return res.json({ status: 'success', message: 'Notes saved successfully', id: insertId });
    } else {
      if (pool) {
        try {
          const [rows] = await pool.query('SELECT * FROM lecture_notes ORDER BY saved_at DESC');
          return res.json(rows);
        } catch (dbErr) {
          console.warn('⚠️ DB read failed, returning memory store:', dbErr.message);
        }
      }
      return res.json(memoryStore.lectureNotes);
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
      const item = {
        id: Date.now(),
        visited_at: new Date().toISOString(),
        url: url || '',
        title: title || ''
      };
      memoryStore.browserHistory.unshift(item);

      let insertId = item.id;
      if (pool) {
        try {
          const [result] = await pool.query(
            'INSERT INTO browser_history (url, title) VALUES (?, ?)',
            [url || '', title || '']
          );
          insertId = result.insertId;
        } catch (dbErr) {
          console.warn('⚠️ DB write failed, stored in memory:', dbErr.message);
        }
      }
      return res.json({ status: 'success', message: 'History saved successfully', id: insertId });
    } else {
      if (pool) {
        try {
          const [rows] = await pool.query('SELECT * FROM browser_history ORDER BY visited_at DESC');
          return res.json(rows);
        } catch (dbErr) {
          console.warn('⚠️ DB read failed, returning memory store:', dbErr.message);
        }
      }
      return res.json(memoryStore.browserHistory);
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
app.all(['/api/browser_history.php', '/api/browser_history', '/browser_history.php'], handleBrowserHistory);

app.get('/api/ping', (req, res) => res.json({ 
  status: 'ok', 
  message: 'Mada Al-Sam-a API is live',
  database: pool ? 'connected' : 'memory_fallback'
}));

app.use(express.static(path.join(__dirname, 'dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Mada Al-Sam-a Server is LIVE on port: ' + PORT);
});
