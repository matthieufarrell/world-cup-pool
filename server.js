const path = require('path');
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json({ limit: '1mb' }));

const isLocal = !process.env.DATABASE_URL || /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function init() {
  await pool.query(`create table if not exists kv (
    k text primary key,
    v text not null,
    updated_at timestamptz default now()
  )`);
}

/* list by prefix:  GET /api/kv?prefix=bracket: */
app.get('/api/kv', async (req, res) => {
  try {
    const prefix = String(req.query.prefix || '');
    const { rows } = await pool.query('select k from kv where k like $1', [prefix + '%']);
    res.json({ keys: rows.map(r => r.k) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* get one:  GET /api/kv/:key */
app.get('/api/kv/:key', async (req, res) => {
  try {
    const { rows } = await pool.query('select v from kv where k = $1', [req.params.key]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ value: rows[0].v });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* upsert:  PUT /api/kv/:key  body {value:"..."} */
app.put('/api/kv/:key', async (req, res) => {
  try {
    const value = req.body && req.body.value;
    if (typeof value !== 'string') return res.status(400).json({ error: 'value must be a string' });
    await pool.query(
      `insert into kv (k, v, updated_at) values ($1, $2, now())
       on conflict (k) do update set v = excluded.v, updated_at = now()`,
      [req.params.key, value]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* delete:  DELETE /api/kv/:key */
app.delete('/api/kv/:key', async (req, res) => {
  try {
    await pool.query('delete from kv where k = $1', [req.params.key]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* serve the app */
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'world-cup-bracket-poolhtml.html')));

const port = process.env.PORT || 3000;
init()
  .then(() => app.listen(port, () => console.log('World Cup pool listening on ' + port)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
