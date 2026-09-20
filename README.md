# Thedal — backend + database

Thedal is an AI-assisted platform for learning and editing code, from
low-level languages up through high-level ones. This is the backend,
database, and frontend for it, ready to run locally or deploy.

## What's here

```
thedal-app/
  public/
    index.html        homepage (search box + universe background)
    results.html       results page (syntax / explanation / editor)
    languages.html      browse-all-lessons page, grouped by language
  db/
    lessons-data.js     all lesson content — add languages/topics here
    init.js              seeds thedal.db from lessons-data.js
  routes/
    search.js            GET  /api/search?q=...
    lessons.js            GET  /api/lessons  and  GET /api/lessons/:slug
    run.js                POST /api/run   (placeholder — see note below)
  server.js               Express app: security headers, rate limiting,
                          health check, serves /public and mounts the API
  package.json
  Dockerfile / .dockerignore
  Procfile                for Heroku-style platforms
  .env.example
```

## Running it locally

You'll need Node.js 18+ installed. From inside this folder:

```
npm install
npm start
```

`npm start` seeds the database and starts the server in one step (seeding
is safe to re-run — it just upserts by slug). Open **http://localhost:3000**
— that matters: open it through this address, not by double-clicking
`index.html`, since the pages fetch data from `/api/...` and browsers block
that from a plain `file://` page.

## The lesson library

`db/lessons-data.js` currently covers four fundamentals — **Hello World**,
**variables**, **for loops**, and **if/else** — across all 10 languages
(40 lessons total): C, C++, Rust, Go, Java, C#, Python, JavaScript, Ruby,
and PHP. "All programming languages" is a moving target for any platform,
so the architecture is built to grow into it rather than claim to be there:
add a new object to the array in the same shape (slug, title, language,
syntax, explanation, code, facts, steps, related_languages) and run
`npm run seed`. No other code needs to change — `/api/search`,
`/api/lessons/:slug`, and the `languages.html` browse page all read
straight from this table.

Good next batches to add: functions and arrays/loops-over-collections for
the languages already there, then all four fundamentals for more languages
(Kotlin, Swift, TypeScript, SQL, Assembly).

## Deploying

The app is a single Node/Express process with a SQLite file — it'll run on
any platform that runs Node.

**Render / Railway / Fly.io (recommended for a first deploy)**
1. Push this folder to a Git repo.
2. Create a new Web Service pointing at it.
3. Build command: `npm install`. Start command: `npm start`.
4. These platforms set `PORT` automatically — the server already reads
   `process.env.PORT`.

**Docker (any host)**
```
docker build -t thedal .
docker run -p 3000:3000 thedal
```

**Heroku-style platforms**: the included `Procfile` (`web: npm start`) is
enough — push and it runs.

### Important: SQLite and persistence

SQLite is a single file on disk (`db/thedal.db`). That's fine as long as
your platform's disk is persistent. Some platforms (Heroku's free/eco
dynos, most serverless platforms) wipe local files on every restart or
deploy — on those, your lesson data would reset to whatever `npm start`
seeds fresh each boot, and anything else written to the DB at runtime
would be lost between restarts.

- If your platform offers a **persistent disk/volume** (Render, Railway,
  a VPS, a Docker host with a mounted volume), point it at the `db/`
  folder and you're fine long-term.
- If not, and you plan to let users save things (accounts, saved
  snippets, progress) rather than just read seeded lessons, plan to move
  to a hosted database (Postgres is the natural next step — the SQL in
  `routes/` is simple enough to port with small changes).

For now, since all content comes from `lessons-data.js` and reseeds on
every boot, this limitation mostly doesn't bite — you'd only feel it once
you add runtime writes (user accounts, saved work, analytics).

## Adding more languages

See "The lesson library" above — it's just entries in
`db/lessons-data.js`. This is also where your Common Crawl / website
indexing pipeline would eventually plug in: crawled pages become rows in
a separate `pages` table, and `search.js` can query across both tables.

## About the "Run" button

`routes/run.js` is a placeholder — it returns a canned response and does
**not** execute the code you type. Actually running arbitrary code needs
a sandboxed execution environment (a container per run, resource and time
limits, no network access from inside it) — running it directly on this
server would be a security hole, especially once this is deployed
publicly for students to use. When you're ready, look at:

- **Piston** (open source, self-hosted, runs 30+ languages in containers)
- **Judge0** (hosted API with a free tier, similar idea)

Either one plugs into `routes/run.js` in the same shape: take
`{ language, code }`, forward it, return `{ output }`.

## What's already hardened for public deployment

- `helmet` sets standard security headers
- `express-rate-limit` caps API requests per IP (60/minute by default —
  tune this once you see real traffic)
- `compression` gzips responses
- Request bodies are capped at 100kb (`/api/run` doesn't need more)
- Search queries are capped at 100 characters server-side
- A `/healthz` endpoint for platforms that check the app is alive
- A catch-all error handler that never leaks stack traces to the client

Still worth doing before a wide public launch: real input validation on
`/api/run` once it's wired to a real sandbox, and moving from SQLite to a
hosted database if you add user accounts or runtime writes (see above).
