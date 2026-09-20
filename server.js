require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const searchRoutes = require('./routes/search');
const lessonRoutes = require('./routes/lessons');
const runRoutes = require('./routes/run');

const app = express();
const PORT = process.env.PORT || 3000;

// Deploy platforms (Render, Railway, Fly.io, Heroku, etc.) put Thedal behind
// a reverse proxy. This makes req.ip and rate limiting see the real client IP
// instead of the proxy's.
app.set('trust proxy', 1);

app.use(helmet({
  // Allow the Google Fonts + inline <script>/<style> this frontend uses.
  // Tighten this further once you're not relying on inline scripts.
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '100kb' }));

// Basic abuse protection on the API. Adjust the numbers as real traffic
// tells you what's reasonable.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/search', searchRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/run', runRoutes);

// Most hosting platforms ping this to confirm the app is alive.
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

// 404 for unmatched API routes (static files fall through to Express's
// own 404 handling above this).
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Catch-all error handler — keeps stack traces out of responses.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Thedal is running: http://localhost:${PORT}`);
});
