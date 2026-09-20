// Creates thedal.db (SQLite) and seeds it from db/lessons-data.js.
// Run with: npm run seed  (also runs automatically before "npm start")
// Safe to re-run — it upserts by slug.

const Database = require('better-sqlite3');
const path = require('path');
const lessons = require('./lessons-data');

const db = new Database(path.join(__dirname, 'thedal.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT,
  difficulty TEXT,
  keywords TEXT,
  syntax TEXT,
  facts TEXT,             -- JSON array of strings
  explanation TEXT,
  code TEXT,
  filename TEXT,
  output TEXT,
  steps TEXT,              -- JSON array of strings
  related_languages TEXT   -- JSON array of strings
);
`);

const upsert = db.prepare(`
INSERT INTO lessons
  (slug, title, language, category, difficulty, keywords, syntax, facts, explanation, code, filename, output, steps, related_languages)
VALUES
  (@slug, @title, @language, @category, @difficulty, @keywords, @syntax, @facts, @explanation, @code, @filename, @output, @steps, @related_languages)
ON CONFLICT(slug) DO UPDATE SET
  title=excluded.title, language=excluded.language, category=excluded.category,
  difficulty=excluded.difficulty, keywords=excluded.keywords, syntax=excluded.syntax,
  facts=excluded.facts, explanation=excluded.explanation, code=excluded.code,
  filename=excluded.filename, output=excluded.output, steps=excluded.steps,
  related_languages=excluded.related_languages;
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    upsert.run({
      ...row,
      facts: JSON.stringify(row.facts),
      steps: JSON.stringify(row.steps),
      related_languages: JSON.stringify(row.related_languages)
    });
  }
});

insertMany(lessons);

console.log(`Seeded ${lessons.length} lesson(s) into ${path.join(__dirname, 'thedal.db')}`);
db.close();
