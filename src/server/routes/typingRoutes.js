const express = require('express');
const { randomUUID } = require('crypto');
const { calculateTypingScore } = require('../services/scoring');
const { readJsonFile, writeJsonFile } = require('../services/storage');

const router = express.Router();

const PROMPTS_PATH = 'src/server/data/prompts.json';
const RESULTS_PATH = 'src/server/data/results.json';

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'typing-speed' });
});

router.get('/prompts', async (_req, res, next) => {
  try {
    const prompts = await readJsonFile(PROMPTS_PATH, []);
    res.json({ prompts });
  } catch (error) {
    next(error);
  }
});

router.post('/results', async (req, res, next) => {
  try {
    const { promptId, promptText, typedText, startedAt, endedAt } = req.body || {};

    if (!promptText || typeof promptText !== 'string') {
      return res.status(400).json({ error: 'promptText is required.' });
    }

    if (typeof typedText !== 'string') {
      return res.status(400).json({ error: 'typedText must be a string.' });
    }

    const score = calculateTypingScore({
      promptText,
      typedText,
      startedAt,
      endedAt
    });

    const result = {
      id: randomUUID(),
      promptId: promptId || null,
      createdAt: new Date().toISOString(),
      ...score
    };

    const previousResults = await readJsonFile(RESULTS_PATH, []);
    const nextResults = [result, ...previousResults].slice(0, 100);
    await writeJsonFile(RESULTS_PATH, nextResults);

    res.status(201).json({ result });
  } catch (error) {
    next(error);
  }
});

router.get('/results', async (_req, res, next) => {
  try {
    const results = await readJsonFile(RESULTS_PATH, []);
    res.json({ results: results.slice(0, 20) });
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: 'Something went wrong while processing the typing test.'
  });
});

module.exports = router;
