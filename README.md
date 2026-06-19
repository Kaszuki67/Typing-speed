# Typing Speed Arena

A polished full-stack typing speed website with:

- Frontend typing interface
- Backend scoring logic
- Saved recent results
- Clean file structure
- Mobile-friendly UI
- Basic tests for scoring accuracy

## Tech stack

- Node.js
- Express
- Vanilla HTML, CSS, and JavaScript
- JSON files for local prompt/result storage

## Project structure

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   └── server/
│       ├── app.js
│       ├── data/
│       │   ├── prompts.json
│       │   └── results.json
│       ├── routes/
│       │   └── typingRoutes.js
│       └── services/
│           ├── scoring.js
│           └── storage.js
├── tests/
│   └── scoring.test.js
├── package.json
└── server.js
```

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Development mode

```bash
npm run dev
```

## Run tests

```bash
npm test
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Checks that the backend is running |
| `GET` | `/api/prompts` | Loads typing prompts |
| `POST` | `/api/results` | Scores and saves a typing attempt |
| `GET` | `/api/results` | Returns recent saved attempts |

## How scoring works

The backend calculates:

- Raw WPM
- Net WPM
- Accuracy
- Error count
- Elapsed seconds
- Typed characters
- Target characters

Accuracy is based on Levenshtein distance, which compares the typed text against the target prompt and counts edits needed to match it.

## Next improvements

- Add user accounts
- Add difficulty filters
- Add charts for progress over time
- Add daily streaks
- Add leaderboard mode
- Add PostgreSQL or SQLite instead of JSON storage
