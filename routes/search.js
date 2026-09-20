const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const router = express.Router();
const db = new Database(path.join(__dirname, '..', 'db', 'thedal.db'));

// GET /api/search?q=for+loop
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase().slice(0, 100);
  if (!q) return res.json({ query: '', results: [] });

  const like = `%${q}%`;
  const rows = db.prepare(`
    SELECT slug, title, language, category, difficulty, explanation
    FROM lessons
    WHERE lower(title) LIKE ? OR lower(keywords) LIKE ?
    ORDER BY
      CASE WHEN lower(title) LIKE ? THEN 0 ELSE 1 END,
      title ASC
    LIMIT 10
  `).all(like, like, like);

  const results = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    language: r.language,
    category: r.category,
    difficulty: r.difficulty,
    snippet: r.explanation.length > 140 ? r.explanation.slice(0, 140) + '…' : r.explanation
  }));

  res.json({ query: q, results });
});

module.exports = router;
