const express = require('express');
const lessons = require('../db/lessons-data');

const router = express.Router();

// Turns "C" into "c", "C++" into "cpp", "C#" into "csharp" — without this,
// stripping punctuation from all three collapses them to the same token
// and makes them indistinguishable.
function canonicalLang(raw) {
  const s = raw.trim().toLowerCase();
  if (s === 'c++') return 'cpp';
  if (s === 'c#') return 'csharp';
  return s.replace(/[^a-z0-9]/g, '');
}

// Detects "c++" and "c#" as whole units before generic word-splitting would
// otherwise destroy them, then splits everything else into plain words.
function extractTokens(q) {
  let text = ' ' + q.toLowerCase() + ' ';
  const langTokens = new Set();
  if (text.includes('c++')) {
    langTokens.add('cpp');
    text = text.split('c++').join(' ');
  }
  if (text.includes('c#')) {
    langTokens.add('csharp');
    text = text.split('c#').join(' ');
  }
  const wordTokens = text.match(/[a-z0-9]+/g) || [];
  return { wordTokens, langTokens };
}

// A language-field match is worth far more than a stray word appearing in
// prose (e.g. an explanation that says "...identical to C's syntax..." on
// a completely different language's page). Keyword-tag matches count next,
// then title words, with category and explanation matches contributing
// only a little — enough to help, not enough to create false positives.
function scoreLesson(lesson, wordTokens, langTokens) {
  const lang = canonicalLang(lesson.language);
  const titleWords = lesson.title.toLowerCase().split(/[^a-z0-9]+/);
  const keywordTags = lesson.keywords.toLowerCase().split(',').map((s) => s.trim());
  const categoryLower = lesson.category.toLowerCase();
  const explanationLower = lesson.explanation.toLowerCase();

  let score = 0;
  if (langTokens.has(lang)) score += 1000;

  for (const t of wordTokens) {
    if (t === lang) score += 1000;
    if (titleWords.includes(t)) score += 50;
    if (keywordTags.some((k) => k === t || k.includes(t))) score += 20;
    if (categoryLower.includes(t)) score += 1;
    if (explanationLower.includes(t)) score += 2;
  }
  return score;
}

// GET /api/search?q=for+loop
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 100);
  if (!q) return res.json({ query: '', results: [] });

  const { wordTokens, langTokens } = extractTokens(q);
  if (wordTokens.length === 0 && langTokens.size === 0) {
    return res.json({ query: q, results: [] });
  }

  const results = lessons
    .map((lesson) => ({ lesson, score: scoreLesson(lesson, wordTokens, langTokens) }))
    // A minimum score threshold keeps out lessons that only picked up a
    // single, weak category-word or prose coincidence.
    .filter((x) => x.score >= 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ lesson }) => ({
      slug: lesson.slug,
      title: lesson.title,
      language: lesson.language,
      category: lesson.category,
      difficulty: lesson.difficulty,
      snippet:
        lesson.explanation.length > 140
          ? lesson.explanation.slice(0, 140) + '…'
          : lesson.explanation
    }));

  res.json({ query: q, results });
});

module.exports = router;
