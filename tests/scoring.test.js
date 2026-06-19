const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTypingScore, levenshteinDistance } = require('../src/server/services/scoring');

test('levenshteinDistance returns zero for identical text', () => {
  assert.equal(levenshteinDistance('hello world', 'hello world'), 0);
});

test('calculateTypingScore returns perfect accuracy for matching prompt', () => {
  const result = calculateTypingScore({
    promptText: 'hello world',
    typedText: 'hello world',
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: '2026-01-01T00:01:00.000Z'
  });

  assert.equal(result.accuracy, 100);
  assert.equal(result.errors, 0);
  assert.equal(result.rawWpm, 2);
});

test('calculateTypingScore reduces accuracy when text has mistakes', () => {
  const result = calculateTypingScore({
    promptText: 'typing speed matters',
    typedText: 'typing speed matter',
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: '2026-01-01T00:01:00.000Z'
  });

  assert.ok(result.accuracy < 100);
  assert.ok(result.errors > 0);
});
