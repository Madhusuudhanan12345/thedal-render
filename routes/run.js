const express = require('express');
const router = express.Router();

// POST /api/run  { language, code }
//
// IMPORTANT: this is a placeholder. Do not evolve this into something that
// runs req.body.code directly on this server (no eval, no child_process
// spawning a compiler on the host) — arbitrary code from the browser must
// run inside an isolated sandbox, not your own machine or server.
//
// When you're ready to make Run actually work, point this route at a
// sandboxed execution service instead, for example:
//   - a self-hosted "Piston" instance (open source, runs many languages
//     in isolated containers)
//   - a hosted API like Judge0
// Either way, this route stays the same shape — it just forwards
// { language, code } to that service and returns its { output } back.
router.post('/', (req, res) => {
  const { language, code } = req.body || {};

  res.json({
    language: language || 'unknown',
    output: '(sandboxed execution isn\'t wired up yet — this is a placeholder response)',
    receivedLength: (code || '').length
  });
});

module.exports = router;
