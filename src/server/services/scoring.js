function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a, b) {
  const source = normalizeText(a);
  const target = normalizeText(b);

  const rows = source.length + 1;
  const cols = target.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[source.length][target.length];
}

function calculateTypingScore({ promptText, typedText, startedAt, endedAt }) {
  const prompt = normalizeText(promptText);
  const typed = normalizeText(typedText);

  const startMs = Number(new Date(startedAt).getTime());
  const endMs = Number(new Date(endedAt).getTime());
  const elapsedMs = Number.isFinite(startMs) && Number.isFinite(endMs)
    ? Math.max(endMs - startMs, 1000)
    : 60000;

  const minutes = elapsedMs / 60000;
  const typedWords = typed ? typed.split(' ').length : 0;
  const rawWpm = Math.round(typedWords / minutes);

  const distance = levenshteinDistance(prompt, typed);
  const maxLength = Math.max(prompt.length, 1);
  const accuracy = Math.max(0, Math.round((1 - distance / maxLength) * 100));

  const correctChars = Math.max(0, prompt.length - distance);
  const netWpm = Math.max(0, Math.round((correctChars / 5) / minutes));

  return {
    rawWpm,
    netWpm,
    accuracy,
    errors: distance,
    elapsedSeconds: Math.round(elapsedMs / 1000),
    typedCharacters: typed.length,
    targetCharacters: prompt.length
  };
}

module.exports = {
  calculateTypingScore,
  levenshteinDistance,
  normalizeText
};
