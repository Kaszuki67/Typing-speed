import { init, updateSpeed } from './three.js';

// State
let currentSnippet = null;
let currentIndex = 0;
let startTime = null;
let timerInterval = null;
let timeLeft = 60;
let isRunning = false;
let isFinished = false;
let correctChars = 0;
let wrongChars = 0;
let totalTyped = 0;

// DOM Elements
const codeDisplay = document.getElementById('code-display');
const hiddenInput = document.getElementById('hidden-input');
const languageSelect = document.getElementById('language');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const timeEl = document.getElementById('time');
const cpmEl = document.getElementById('cpm');
const resultsModal = document.getElementById('results-modal');
const resultWpm = document.getElementById('result-wpm');
const resultAccuracy = document.getElementById('result-accuracy');
const resultCpm = document.getElementById('result-cpm');
const resultChars = document.getElementById('result-chars');
const playerNameInput = document.getElementById('player-name');
const submitResultBtn = document.getElementById('submit-result');
const restartBtn = document.getElementById('restart-btn');
const leaderboardBody = document.getElementById('leaderboard-body');

// Initialize Three.js
init();

// API Base URL
const API_BASE = 'http://localhost:8080/api';

// Language mapping
const langMap = {
    'js': 'javascript',
    'python': 'python',
    'go': 'go',
    'rust': 'rust'
};

// Fetch snippet
async function fetchSnippet(lang) {
    try {
        const response = await fetch(`${API_BASE}/snippet?lang=${lang}`);
        if (!response.ok) throw new Error('Failed to fetch snippet');
        return await response.json();
    } catch (error) {
        console.error('Error fetching snippet:', error);
        return null;
    }
}

// Render code with character spans
function renderCode(code) {
    codeDisplay.innerHTML = '';
    
    // Convert tabs to 4 spaces
    const normalizedCode = code.replace(/\t/g, '    ');
    
    for (let char of normalizedCode) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === '\n' ? '↵\n' : char;
        if (char === ' ') {
            span.textContent = ' ';
        }
        codeDisplay.appendChild(span);
    }
    
    // Set first character as current
    const chars = codeDisplay.querySelectorAll('.char');
    if (chars.length > 0) {
        chars[0].classList.add('current');
    }
}

// Update character classes
function updateCharClasses() {
    const chars = codeDisplay.querySelectorAll('.char');
    const targetCode = currentSnippet.code.replace(/\t/g, '    ');
    
    chars.forEach((char, index) => {
        char.classList.remove('correct', 'wrong', 'current');
        
        if (index < currentIndex) {
            const typedChar = hiddenInput.value[index];
            if (typedChar === targetCode[index]) {
                char.classList.add('correct');
            } else {
                char.classList.add('wrong');
            }
        } else if (index === currentIndex) {
            char.classList.add('current');
            // Scroll into view if needed
            char.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// Start timer
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startTime = Date.now();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.textContent = `${timeLeft}s`;
        
        if (timeLeft <= 0) {
            finishTest();
        }
    }, 1000);
}

// Calculate stats
function calculateStats() {
    if (!startTime) return { wpm: 0, accuracy: 100, cpm: 0 };
    
    const elapsedMs = Date.now() - startTime;
    const elapsedMinutes = elapsedMs / 60000;
    
    const wpm = elapsedMinutes > 0 ? Math.round((correctChars / 5) / elapsedMinutes) : 0;
    const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;
    const cpm = elapsedMinutes > 0 ? Math.round(correctChars / elapsedMinutes) : 0;
    
    return { wpm, accuracy, cpm };
}

// Update stats display
function updateStats() {
    const stats = calculateStats();
    wpmEl.textContent = stats.wpm;
    accuracyEl.textContent = `${stats.accuracy}%`;
    cpmEl.textContent = stats.cpm;
    
    // Update Three.js speed
    updateSpeed(stats.wpm);
    
    return stats;
}

// Finish test
function finishTest() {
    if (isFinished) return;
    
    isFinished = true;
    isRunning = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const stats = updateStats();
    
    // Show results modal
    resultWpm.textContent = stats.wpm;
    resultAccuracy.textContent = `${stats.accuracy}%`;
    resultCpm.textContent = stats.cpm;
    resultChars.textContent = `${correctChars}/${totalTyped}`;
    
    resultsModal.classList.remove('hidden');
}

// Reset test
function resetTest() {
    currentIndex = 0;
    startTime = null;
    timeLeft = 60;
    isRunning = false;
    isFinished = false;
    correctChars = 0;
    wrongChars = 0;
    totalTyped = 0;
    
    hiddenInput.value = '';
    timeEl.textContent = '60s';
    wpmEl.textContent = '0';
    accuracyEl.textContent = '100%';
    cpmEl.textContent = '0';
    
    resultsModal.classList.add('hidden');
    
    if (currentSnippet) {
        renderCode(currentSnippet.code);
    }
}

// Handle input
function handleInput(e) {
    if (isFinished || !currentSnippet) return;
    
    const targetCode = currentSnippet.code.replace(/\t/g, '    ');
    const inputValue = hiddenInput.value;
    
    // Start timer on first keystroke
    if (!isRunning && inputValue.length > 0) {
        startTimer();
    }
    
    // Check if we've reached the end
    if (inputValue.length >= targetCode.length) {
        currentIndex = targetCode.length;
        correctChars = targetCode.length;
        totalTyped = inputValue.length;
        finishTest();
        return;
    }
    
    currentIndex = inputValue.length;
    
    // Count correct/wrong characters
    let newCorrect = 0;
    for (let i = 0; i < inputValue.length; i++) {
        if (inputValue[i] === targetCode[i]) {
            newCorrect++;
        }
    }
    correctChars = newCorrect;
    totalTyped = inputValue.length;
    
    updateCharClasses();
    updateStats();
}

// Load leaderboard
async function loadLeaderboard(lang) {
    try {
        const response = await fetch(`${API_BASE}/leaderboard?lang=${lang}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        const data = await response.json();
        
        leaderboardBody.innerHTML = '';
        
        data.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${index + 1}</td>
                <td>${escapeHtml(entry.name)}</td>
                <td>${entry.wpm}</td>
                <td>${entry.accuracy.toFixed(1)}%</td>
                <td>${entry.lang.toUpperCase()}</td>
                <td>${formatDate(entry.created_at)}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardBody.innerHTML = '<tr><td colspan="6">No leaderboard data available</td></tr>';
    }
}

// Submit result
async function submitResult() {
    const name = playerNameInput.value.trim() || 'Anonymous';
    const stats = calculateStats();
    
    try {
        const response = await fetch(`${API_BASE}/result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                wpm: stats.wpm,
                accuracy: stats.accuracy,
                lang: languageSelect.value
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit result');
        
        // Reload leaderboard
        await loadLeaderboard(languageSelect.value);
        
        // Reset and close modal
        resetTest();
    } catch (error) {
        console.error('Error submitting result:', error);
        alert('Failed to submit result. Please try again.');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Event listeners
languageSelect.addEventListener('change', async () => {
    resetTest();
    const lang = languageSelect.value;
    currentSnippet = await fetchSnippet(lang);
    if (currentSnippet) {
        renderCode(currentSnippet.code);
    }
    loadLeaderboard(lang);
});

hiddenInput.addEventListener('input', handleInput);

// Focus hidden input when clicking on code display
codeDisplay.addEventListener('click', () => {
    if (!isFinished) {
        hiddenInput.focus();
    }
});

// Keep focus on hidden input
document.addEventListener('keydown', (e) => {
    if (!isFinished && e.key !== 'Tab') {
        hiddenInput.focus();
    }
});

submitResultBtn.addEventListener('click', submitResult);
restartBtn.addEventListener('click', resetTest);

// Initialize
async function init() {
    const lang = languageSelect.value;
    currentSnippet = await fetchSnippet(lang);
    if (currentSnippet) {
        renderCode(currentSnippet.code);
    }
    loadLeaderboard(lang);
    
    // Focus input
    hiddenInput.focus();
}

init();
