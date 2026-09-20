const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const router = express.Router();
const db = new Database(path.join(__dirname, '..', 'db', 'thedal.db'));

// GET /api/lessons  — browse everything, grouped for a curriculum-style list
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT slug, title, language, category, difficulty
    FROM lessons
    ORDER BY language ASC, category ASC, title ASC
  `).all();
  res.json({ lessons: rows });
});

// GET /api/lessons/c-for-loop
router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM lessons WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Lesson not found' });

  res.json({
    slug: row.slug,
    title: row.title,
    language: row.language,
    category: row.category,
    difficulty: row.difficulty,
    syntax: row.syntax,
    explanation: row.explanation,
    code: row.code,
    filename: row.filename,
    output: row.output,
    facts: JSON.parse(row.facts || '[]'),
    steps: JSON.parse(row.steps || '[]'),
    related_languages: JSON.parse(row.related_languages || '[]')
  });
});

module.exports = router;
