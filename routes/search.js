const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const router = express.Router();
const db = new Database(path.join(__dirname, '..', 'db', 'thedal.db'));

// Turns "for loop in c" or "C LOOP" into a clean FTS5 match query like
// "for* loop* in* c*" — each word becomes its own prefix term, and FTS5
// ANDs space-separated terms by default, so word order stops mattering
// and partial words (like "prog" for "programming") still match.
function buildMatchQuery(q) {
  const tokens = q.toLowerCase().match(/[a-z0-9]+/g) || [];
  return tokens.map((t) => `${t}*`).join(' ');
}

// GET /api/search?q=for+loop
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 100);
  if (!q) return res.json({ query: '', results: [] });

  const matchQuery = buildMatchQuery(q);
  if (!matchQuery) return res.json({ query: q, results: [] });

  let rows;
  try {
    rows = db.prepare(`
      SELECT
        l.slug, l.title, l.language, l.category, l.difficulty, l.explanation,
        bm25(lessons_fts) AS rank
      FROM lessons_fts
      JOIN lessons l ON l.slug = lessons_fts.slug
      WHERE lessons_fts MATCH ?
      ORDER BY rank
      LIMIT 10
    `).all(matchQuery);
  } catch (err) {
    // A malformed FTS5 query (rare, given the sanitizing above) shouldn't
    // 500 the page — just treat it as no matches.
    console.error('Search query failed:', err.message);
    return res.json({ query: q, results: [] });
  }

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
