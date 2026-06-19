const state = {
  prompts: [],
  currentPrompt: null,
  startedAt: null,
  timerId: null,
  latestScore: null
};

const elements = {
  promptSelect: document.querySelector('#promptSelect'),
  newPromptButton: document.querySelector('#newPromptButton'),
  promptText: document.querySelector('#promptText'),
  typingInput: document.querySelector('#typingInput'),
  submitButton: document.querySelector('#submitButton'),
  resetButton: document.querySelector('#resetButton'),
  refreshHistoryButton: document.querySelector('#refreshHistoryButton'),
  progressBar: document.querySelector('#progressBar'),
  statusLabel: document.querySelector('#statusLabel'),
  rawWpm: document.querySelector('#rawWpm'),
  netWpm: document.querySelector('#netWpm'),
  accuracy: document.querySelector('#accuracy'),
  timer: document.querySelector('#timer'),
  historyList: document.querySelector('#historyList')
};

function formatSeconds(totalSeconds) {
  return `${Math.max(0, Math.round(totalSeconds))}s`;
}

function setStatus(message) {
  elements.statusLabel.textContent = message;
}

function updateTimer() {
  if (!state.startedAt) {
    elements.timer.textContent = '0s';
    return;
  }

  const seconds = (Date.now() - state.startedAt.getTime()) / 1000;
  elements.timer.textContent = formatSeconds(seconds);
}

function updateProgress() {
  const target = state.currentPrompt?.text || '';
  const typed = elements.typingInput.value;
  const progress = target.length ? Math.min(100, Math.round((typed.length / target.length) * 100)) : 0;
  elements.progressBar.style.width = `${progress}%`;
}

function resetMetrics() {
  elements.rawWpm.textContent = '0';
  elements.netWpm.textContent = '0';
  elements.accuracy.textContent = '100%';
  elements.timer.textContent = '0s';
  elements.progressBar.style.width = '0%';
}

function renderPrompt(prompt) {
  state.currentPrompt = prompt;
  elements.promptText.textContent = prompt?.text || 'No prompts available yet.';
  elements.typingInput.value = '';
  state.startedAt = null;
  state.latestScore = null;
  clearInterval(state.timerId);
  resetMetrics();
  setStatus(prompt ? `${prompt.level} prompt loaded` : 'Add prompts in src/server/data/prompts.json');
}

function renderPromptOptions() {
  elements.promptSelect.innerHTML = '';

  state.prompts.forEach((prompt, index) => {
    const option = document.createElement('option');
    option.value = prompt.id;
    option.textContent = `${index + 1}. ${prompt.level}`;
    elements.promptSelect.append(option);
  });
}

async function loadPrompts() {
  const response = await fetch('/api/prompts');
  const data = await response.json();
  state.prompts = data.prompts || [];
  renderPromptOptions();
  renderPrompt(state.prompts[0]);
}

function choosePromptById(promptId) {
  const prompt = state.prompts.find((item) => item.id === promptId);
  renderPrompt(prompt || state.prompts[0]);
}

function shufflePrompt() {
  if (!state.prompts.length) return;
  const randomIndex = Math.floor(Math.random() * state.prompts.length);
  const prompt = state.prompts[randomIndex];
  elements.promptSelect.value = prompt.id;
  renderPrompt(prompt);
}

function startTestIfNeeded() {
  if (state.startedAt || !state.currentPrompt) return;

  state.startedAt = new Date();
  state.timerId = setInterval(updateTimer, 1000);
  setStatus('Typing in progress...');
}

async function submitResult() {
  if (!state.currentPrompt || !state.startedAt) {
    setStatus('Type something first');
    return;
  }

  elements.submitButton.disabled = true;
  clearInterval(state.timerId);

  const response = await fetch('/api/results', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      promptId: state.currentPrompt.id,
      promptText: state.currentPrompt.text,
      typedText: elements.typingInput.value,
      startedAt: state.startedAt.toISOString(),
      endedAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    elements.submitButton.disabled = false;
    setStatus('Could not save score');
    return;
  }

  const data = await response.json();
  const result = data.result;

  state.latestScore = result;
  elements.rawWpm.textContent = result.rawWpm;
  elements.netWpm.textContent = result.netWpm;
  elements.accuracy.textContent = `${result.accuracy}%`;
  elements.timer.textContent = formatSeconds(result.elapsedSeconds);
  setStatus(result.accuracy >= 90 ? 'Clean run! Great accuracy.' : 'Saved. Try again for better accuracy.');
  elements.submitButton.disabled = false;
  await loadHistory();
}

function resetTest() {
  renderPrompt(state.currentPrompt || state.prompts[0]);
}

function renderHistory(results) {
  elements.historyList.innerHTML = '';

  if (!results.length) {
    elements.historyList.innerHTML = '<p class="empty">No saved attempts yet. Finish a test to create your first result.</p>';
    return;
  }

  results.forEach((result) => {
    const item = document.createElement('article');
    item.className = 'history-item';
    item.innerHTML = `
      <div><span>Net WPM</span><strong>${result.netWpm}</strong></div>
      <div><span>Raw WPM</span><strong>${result.rawWpm}</strong></div>
      <div><span>Accuracy</span><strong>${result.accuracy}%</strong></div>
      <div><span>Errors</span><strong>${result.errors}</strong></div>
    `;
    elements.historyList.append(item);
  });
}

async function loadHistory() {
  const response = await fetch('/api/results');
  const data = await response.json();
  renderHistory(data.results || []);
}

elements.typingInput.addEventListener('input', () => {
  startTestIfNeeded();
  updateProgress();
});

elements.promptSelect.addEventListener('change', (event) => {
  choosePromptById(event.target.value);
});

elements.newPromptButton.addEventListener('click', shufflePrompt);
elements.submitButton.addEventListener('click', submitResult);
elements.resetButton.addEventListener('click', resetTest);
elements.refreshHistoryButton.addEventListener('click', loadHistory);

Promise.all([loadPrompts(), loadHistory()]).catch((error) => {
  console.error(error);
  setStatus('App failed to load. Check the backend.');
});
